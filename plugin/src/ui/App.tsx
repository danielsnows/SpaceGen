import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { FeedGrid } from "./components/FeedGrid";
import { getPosts, getMobilePosts, getAllPostsMerged, getImageProxyUrl } from "./lib/api";
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

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "all" && platform == null) {
        const data = await getAllPostsMerged(INITIAL_FEED_LIMIT, searchDebounced || undefined);
        setPosts(data);
      } else if (activeTab === "all" && platform != null) {
        const data = await getPosts({
          platform,
          q: searchDebounced || undefined,
        });
        setPosts(data);
      } else if (activeTab === "website") {
        const data = await getPosts({
          platform: platform ?? undefined,
          q: searchDebounced || undefined,
        });
        setPosts(data);
      } else {
        const data = await getMobilePosts({
          q: searchDebounced || undefined,
        });
        setPosts(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, platform, searchDebounced]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
    const selected = posts.filter((p) => selectedIds.has(p.id)).slice(0, ADD_TO_CANVAS_MAX);
    if (selected.length === 0) return;
    setAdding(true);
    try {
      const payloads: InsertPostPayload[] = [];
      for (const post of selected) {
        const imageUrl = getImageProxyUrl(post.image);
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`Image failed: ${post.id}`);
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
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
  }, [posts, selectedIds]);

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
            Welcome to SpaceGen
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
                alignItems: "center",
                justifyContent: "center",
                color: "var(--figma-color-text-tertiary)",
                fontSize: 14,
              }}
            >
              Loading feed…
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
