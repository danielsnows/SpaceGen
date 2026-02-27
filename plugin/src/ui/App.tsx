import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { FeedGrid } from "./components/FeedGrid";
import { getLocalImageUrl, isAbsoluteImageUrl } from "./lib/api";
import { ensurePngBytes } from "./lib/imageToPng";
import { getAllPostsFromJson, getWebPostsFromJson, getMobilePostsFromJson, getAllPostsById } from "./lib/localPosts";
import { getPlatformConfig } from "./lib/platforms";
import { sendToMain, onMainMessage } from "./lib/postMessage";
import type { Post } from "./types";
import type { InsertPostPayload } from "./types";

const ADD_TO_CANVAS_MAX = 20;
const INITIAL_FEED_LIMIT = 80;

export function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "website" | "mobile">("all");
  const [platform, setPlatform] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      let data: Post[];
      if (activeTab === "all" && platform == null) {
        data = getAllPostsFromJson(INITIAL_FEED_LIMIT, searchDebounced || undefined);
      } else if (activeTab === "all" && platform != null) {
        data = getWebPostsFromJson(platform, searchDebounced || undefined);
      } else if (activeTab === "website") {
        data = getWebPostsFromJson(platform ?? undefined, searchDebounced || undefined);
      } else {
        data = getMobilePostsFromJson(searchDebounced || undefined);
      }
      setPosts(data);
    } catch (e) {
      setError("Failed to load feed");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, platform, searchDebounced]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    document.getElementById("preload-overlay")?.remove();
  }, []);

  useEffect(() => {
    onMainMessage((msg) => {
      if (msg.type === "INSERT_DONE") {
        setAdding(false);
        setSelectedIds(new Set());
      }
      if (msg.type === "INSERT_ERROR") {
        setAdding(false);
      }
    });
  }, []);

  const onToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setPlatform(null);
    setActiveTab("all");
    setSearch("");
  }, []);

  const handleAddToCanvas = useCallback(async () => {
    const allById = getAllPostsById();
    const selected = Array.from(selectedIds)
      .slice(0, ADD_TO_CANVAS_MAX)
      .map((id) => allById.get(id))
      .filter((p): p is Post => p != null);
    if (selected.length === 0) return;
    const withUrl = selected.map((p) => ({ post: p, imageUrl: getLocalImageUrl(p.image) }));
    const valid = withUrl.filter(({ imageUrl }) => isAbsoluteImageUrl(imageUrl));
    if (valid.length === 0) {
      setError("Images unavailable in this context. Try opening the plugin from a file or hosted URL.");
      return;
    }
    if (valid.length < selected.length) {
      setError(`Only ${valid.length} of ${selected.length} image(s) available in this context.`);
      return;
    }
    setAdding(true);
    try {
      const payloads: InsertPostPayload[] = [];
      for (const { post, imageUrl } of valid) {
        const bytes = await ensurePngBytes(imageUrl);
        payloads.push({
          id: post.id,
          title: post.title,
          imageUrl: post.image,
          platform: post.platform,
          imageBytes: bytes,
        });
      }
      sendToMain({ type: "INSERT_POSTS", payload: { posts: payloads } });
    } catch (e) {
      setAdding(false);
      setError(e instanceof Error ? e.message : "Failed to prepare images");
    }
  }, [selectedIds]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        background: "var(--figma-color-bg)",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        button:focus-visible,
        input:focus-visible,
        [role="button"]:focus-visible {
          outline: 2px solid var(--figma-color-border-strong);
          outline-offset: 2px;
        }
      `}</style>

      <Sidebar
        selectedPlatform={platform}
        onPlatformChange={setPlatform}
        onClearAllFilters={handleClearAllFilters}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 40,
            padding: "8px 24px",
            borderBottom: "1px solid #E5E7EB",
            flexShrink: 0,
            background: "#FFFFFF",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search on SpaceGen"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(["website", "mobile"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedIds(new Set());
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  border: activeTab === tab ? "1px solid #E5E7EB" : "1px solid transparent",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: activeTab === tab ? "#FFFFFF" : "var(--figma-color-bg-tertiary)",
                  color: activeTab === tab ? "#101828" : "#6C788A",
                }}
              >
                {tab === "website" ? "Websites" : "Mobile Apps"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                style={{
                  fontSize: 12,
                  color: "var(--figma-color-text-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                }}
              >
                Clear selection
              </button>
            )}
            <span style={{ fontSize: 12, color: "var(--figma-color-text-tertiary)" }}>
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleAddToCanvas}
              disabled={selectedIds.size === 0 || adding}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: 500,
                background:
                  selectedIds.size && !adding ? "#000000" : "#CBCBCB",
                color: selectedIds.size && !adding ? "#FFFFFF" : "#FFFFFF",
                border: "none",
                borderRadius: 8,
                cursor: selectedIds.size && !adding ? "pointer" : "not-allowed",
              }}
            >
              {adding ? "Adding…" : "Add to Figma"}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            background: "#F9FAFB",
          }}
        >
          <h1
            style={{
              margin: 0,
              padding: "32px 24px 0",
              fontSize: 24,
              fontWeight: 400,
              color: "#1E2939",
              fontFamily: "Georgia, serif",
              position: "relative",
            }}
          >
            {platform
              ? (getPlatformConfig(platform)?.label ?? platform)
              : "Welcome to SpaceGen"}
          </h1>
          {error && (
            <div
              style={{
                margin: "12px 24px 0",
                padding: 12,
                background: "var(--figma-color-bg-danger)",
                color: "var(--figma-color-text-onbrand)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          {loading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                color: "var(--figma-color-text-tertiary)",
                fontSize: 14,
              }}
            >
              <span>Loading feed…</span>
              <div
                style={{
                  width: 280,
                  height: 6,
                  background: "#E5E7EB",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "40%",
                    background: "#000",
                    borderRadius: 3,
                    animation: "preload-shine 1.2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          ) : (
            <FeedGrid
              posts={posts}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
