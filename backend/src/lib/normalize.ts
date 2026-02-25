import type { FeedConfig } from "../config/feeds.js";

export interface Post {
  id: string;
  title: string;
  image: string;
  url: string;
  platform: string;
  category: string;
  publishedAt: string;
}

export interface RssItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  enclosure?: { url?: string };
  /** RSS parser customFields: media:content → mediaContent (MRSS) */
  mediaContent?: { $?: { url?: string }; url?: string } | Array<{ $?: { url?: string }; url?: string }>;
  "media:content"?: { $?: { url?: string }; url?: string } | Array<{ $?: { url?: string }; url?: string }>;
}

export function normalizeDribbble(
  item: RssItem,
  config: FeedConfig
): Post | null {
  return normalizeGeneric(item, { ...config, platform: "dribbble" });
}

export function normalizeBehance(
  item: RssItem,
  config: FeedConfig
): Post | null {
  return normalizeGeneric(item, { ...config, platform: "behance" });
}

function normalizeGeneric(
  item: RssItem,
  config: FeedConfig
): Post | null {
  const title = item.title?.trim() ?? "";
  const url = item.link ?? "";
  if (!title || !url) return null;
  const slug =
    url.split("/").filter(Boolean).pop() ??
    Buffer.from(url).toString("base64url").slice(0, 12);
  const id = `${config.platform}-${slug}`;
  let image = "";
  if (item.enclosure?.url) {
    image = item.enclosure.url;
  } else if (item.content) {
    const imgMatch = item.content.match(/src="([^"]+\.(?:jpg|jpeg|png|webp|gif))"/i);
    if (imgMatch) image = imgMatch[1];
  }
  // Fallback: rss.app and others use <media:content medium="image" url="..."/> (MRSS)
  if (!image && (item.mediaContent ?? item["media:content"])) {
    const mc = item.mediaContent ?? item["media:content"];
    const first = Array.isArray(mc) ? mc[0] : mc;
    const url = first?.url ?? first?.$?.url;
    if (typeof url === "string") image = url;
  }
  if (!image) return null;
  return {
    id,
    title,
    image,
    url,
    platform: config.platform,
    category: config.defaultCategory,
    publishedAt: item.isoDate ?? new Date().toISOString(),
  };
}

export function normalize(
  platform: string,
  item: RssItem,
  config: FeedConfig
): Post | null {
  if (platform === "dribbble") return normalizeDribbble(item, config);
  if (platform === "behance") return normalizeBehance(item, config);
  // Demais plataformas usam normalização genérica baseada no RSS
  return normalizeGeneric(item, config);
}
