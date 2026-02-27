import React, { useState } from "react";
import type { Post } from "../types";
import { getPlatformConfig } from "../lib/platforms";
import { getLocalImageUrl } from "../lib/api";
import { PlatformIcon } from "./PlatformIcons";

export interface PostCardProps {
  post: Post;
  selected: boolean;
  onToggle: () => void;
}

/** Cor de fundo clara para o chip a partir da cor de marca (legibilidade) */
function chipBackgroundColor(brandColor: string): string {
  const hex = brandColor.replace("#", "").trim();
  if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) return "var(--figma-color-bg-tertiary)";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

export function PostCard({ post, selected, onToggle }: PostCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getLocalImageUrl(post.image);
  const platformConfig = getPlatformConfig(post.platform);
  const label = platformConfig?.label ?? post.platform;
  const brandColor = platformConfig?.brandColor ?? "var(--figma-color-text-tertiary)";
  const chipBg = platformConfig ? chipBackgroundColor(platformConfig.brandColor) : "var(--figma-color-bg-tertiary)";

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${label}: ${post.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        minHeight: 220,
        borderRadius: 10,
        overflow: "hidden",
        border: selected ? "2px solid #000000" : "2px solid var(--figma-color-border)",
        background: "#FFFFFF",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          aspectRatio: "4/3",
          minHeight: 120,
          background: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {!imgError && imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : null}
        {(imgError || !imageUrl) && (
          <span
            style={{
              fontSize: 12,
              color: "var(--figma-color-text-tertiary)",
              padding: 8,
              textAlign: "center",
            }}
          >
            No image
          </span>
        )}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 20,
            height: 20,
            borderRadius: 4,
            border: "2px solid var(--figma-color-border-strong)",
            background: selected ? "#000000" : "var(--figma-color-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white" />
            </svg>
          )}
        </div>
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            padding: "4px 8px",
            borderRadius: 4,
            background: chipBg,
          }}
        >
          {platformConfig && (
            <PlatformIcon platformId={post.platform} size={14} color={brandColor} />
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: brandColor,
            }}
          >
            {label}
          </span>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#101828",
            lineHeight: 1.43,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </div>
      </div>
    </div>
  );
}
