import React, { useState, useCallback } from "react";
import { PLATFORMS } from "../lib/platforms";
import { SpaceGenLogo, PlatformIcon } from "./PlatformIcons";

/** Plataformas exibidas na sidebar (Mobile fica só nas tabs da topbar). */
const SIDEBAR_PLATFORMS = PLATFORMS.filter((p) => p.id !== "mobileapp");

export interface SidebarProps {
  selectedPlatform: string | null;
  onPlatformChange: (platform: string | null) => void;
  onClearAllFilters?: () => void;
}

/** Tooltip branca ao passar o mouse no ícone do serviço */
function ServiceTooltip({ label, visible, children }: { label: string; visible: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            left: "100%",
            marginLeft: 8,
            padding: "6px 10px",
            background: "#FFFFFF",
            color: "#101828",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            whiteSpace: "nowrap",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {label}
          <span
            style={{
              position: "absolute",
              left: -4,
              top: "50%",
              marginTop: -4,
              width: 0,
              height: 0,
              borderTop: "4px solid transparent",
              borderBottom: "4px solid transparent",
              borderRight: "4px solid #FFFFFF",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function Sidebar({ selectedPlatform, onPlatformChange, onClearAllFilters }: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMouseEnter = useCallback((id: string) => {
    setHoveredId(id);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  return (
    <aside
      style={{
        width: 60,
        flexShrink: 0,
        background: "var(--figma-color-bg-secondary)",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 12px",
        gap: 32,
      }}
    >
      <button
        type="button"
        onClick={onClearAllFilters}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--figma-color-bg-tertiary)",
          flexShrink: 0,
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        aria-label="Clear all filters"
      >
        <SpaceGenLogo size={26} />
      </button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, flex: 1 }}>
        {SIDEBAR_PLATFORMS.map((p) => {
          const isSelected = selectedPlatform === p.id;
          const isDimmed = selectedPlatform != null && !isSelected;
          return (
            <div
              key={p.id}
              onMouseEnter={() => handleMouseEnter(p.id)}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter(p.id)}
              onBlur={() => setHoveredId(null)}
              style={{ position: "relative" }}
            >
              <ServiceTooltip label={p.label} visible={hoveredId === p.id}>
                <button
                  type="button"
                  onClick={() => onPlatformChange(isSelected ? null : p.id)}
                  title={p.label}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "none",
                    background: p.brandColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                  aria-label={p.label}
                >
                  <PlatformIcon
                    platformId={p.id}
                    size={24}
                    color="#FFFFFF"
                  />
                </button>
              </ServiceTooltip>
            </div>
          );
        })}
      </div>

      {selectedPlatform && (
        <button
          type="button"
          onClick={() => onPlatformChange(null)}
          style={{
            marginTop: "auto",
            fontSize: 10,
            color: "var(--figma-color-text-tertiary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
          }}
        >
          Clear
        </button>
      )}
    </aside>
  );
}
