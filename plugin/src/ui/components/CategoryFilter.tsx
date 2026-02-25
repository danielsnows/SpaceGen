import React from "react";

const CATEGORIES = [
  "UI Design",
  "Design",
  "Website",
  "Mobile App",
  "Landing Page",
  "eCommerce",
];

export interface CategoryFilterProps {
  value: string | null;
  onChange: (category: string | null) => void;
  availableCategories?: string[];
}

export function CategoryFilter({
  value,
  onChange,
  availableCategories = CATEGORIES,
}: CategoryFilterProps) {
  const options = Array.from(new Set(availableCategories)).sort();
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        padding: "8px 12px",
        fontSize: 14,
        border: "1px solid var(--figma-color-border)",
        borderRadius: 6,
        background: "var(--figma-color-bg)",
        color: "var(--figma-color-text)",
        minWidth: 160,
      }}
    >
      <option value="">All categories</option>
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
