import React from "react";
import { PostCard } from "./PostCard";
import type { Post } from "../types";

export interface FeedGridProps {
  posts: Post[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function FeedGrid({
  posts,
  selectedIds,
  onToggleSelect,
}: FeedGridProps) {
  if (posts.length === 0) {
    return (
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
        No posts found. Try changing filters or search.
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 20,
        padding: "24px 24px 24px",
        alignContent: "start",
      }}
    >
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          selected={selectedIds.has(post.id)}
          onToggle={() => onToggleSelect(post.id)}
        />
      ))}
    </div>
  );
}
