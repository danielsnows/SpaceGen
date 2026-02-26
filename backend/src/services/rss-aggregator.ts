import Parser from "rss-parser";
import { FEEDS, MOBILE_FEEDS, CACHE_TTL_MS } from "../config/feeds.js";
import { get, set } from "./cache.js";
import { normalize } from "../lib/normalize.js";
import type { Post } from "../lib/normalize.js";
import type { FeedConfig } from "../config/feeds.js";

const CACHE_KEY = "design-feed-posts";
const MOBILE_CACHE_KEY = "design-feed-mobile-posts";
const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "DesignFeed/1.0 (Figma Plugin)",
  },
  customFields: {
    item: [["media:content", "mediaContent"]],
  },
});

async function fetchAndParseFeed(config: FeedConfig): Promise<Post[]> {
  const startedAt = Date.now();
  const posts: Post[] = [];
  try {
    const feed = await parser.parseURL(config.url);
    for (const item of feed.items ?? []) {
      const post = normalize(
        config.platform,
        item as Parameters<typeof normalize>[1],
        config
      );
      if (post) posts.push(post);
    }
  } catch (err) {
    console.error(`Feed ${config.platform} failed:`, err);
  } finally {
    const elapsed = Date.now() - startedAt;
    console.log(
      `Feed ${config.platform} finished in ${elapsed}ms with ${posts.length} posts`
    );
  }
  return posts;
}

export async function getAllPosts(): Promise<Post[]> {
  const cached = get<Post[]>(CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.allSettled(
    FEEDS.map((config) => fetchAndParseFeed(config))
  );
  const fulfilled = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  const all = fulfilled.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  set(CACHE_KEY, all, CACHE_TTL_MS);
  return all;
}

export async function getMobilePosts(): Promise<Post[]> {
  const cached = get<Post[]>(MOBILE_CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.allSettled(
    MOBILE_FEEDS.map((config) => fetchAndParseFeed(config))
  );
  const fulfilled = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  const all = fulfilled.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  set(MOBILE_CACHE_KEY, all, CACHE_TTL_MS);
  return all;
}
