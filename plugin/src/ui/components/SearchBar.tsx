import React from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
}: SearchBarProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        maxWidth: 320,
        padding: "8px 12px",
        fontSize: 14,
        border: "1px solid var(--figma-color-border)",
        borderRadius: 6,
        background: "var(--figma-color-bg)",
        color: "var(--figma-color-text)",
      }}
    />
  );
}
