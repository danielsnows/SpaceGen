/**
 * Configuração centralizada das plataformas de feed.
 * Cores de marca baseadas em guidelines oficiais e design do Figma (SpaceGen).
 * Os valores podem ser ajustados conforme guias internos.
 */

export interface PlatformConfig {
  id: string;
  label: string;
  brandColor: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { id: "dribbble", label: "Dribbble", brandColor: "#E60076" },
  { id: "behance", label: "Behance", brandColor: "#1769FF" },
  { id: "awwwards", label: "Awwwards", brandColor: "#101828" },
  { id: "cssdesignawards", label: "CSS Design Awards", brandColor: "#E7000B" },
  { id: "csswinner", label: "CSS Winner", brandColor: "#CE4242" },
  { id: "landbook", label: "Land-Book", brandColor: "#3BAD56" },
  { id: "framer", label: "Framer", brandColor: "#0055FF" },
  { id: "onepagelove", label: "One Page Love", brandColor: "#E31837" },
  { id: "mobileapp", label: "Mobile", brandColor: "#6366F1" },
];

const configById = new Map(PLATFORMS.map((p) => [p.id, p]));

export function getPlatformConfig(platformId: string): PlatformConfig | undefined {
  return configById.get(platformId);
}
