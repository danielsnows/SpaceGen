import fs from "node:fs";
import path from "node:path";
import { FEEDS, MOBILE_FEEDS, CACHE_TTL_MS, type FeedConfig } from "../config/feeds.js";
import { get, set } from "./cache.js";
import { createPostFromCsvRow } from "../lib/normalize.js";
import type { Post } from "../lib/normalize.js";

const CACHE_KEY = "design-feed-posts";
const MOBILE_CACHE_KEY = "design-feed-mobile-posts";

function resolveAssetsDir(): string {
  // Tenta primeiro dentro de /backend/assets/feeds-csv
  const candidates = [
    path.resolve(process.cwd(), "assets/feeds-csv"),
    // Fallback para monorepo: /../assets/feeds-csv a partir de /backend
    path.resolve(process.cwd(), "../assets/feeds-csv"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  // Último recurso: assume diretório atual
  return candidates[0];
}

const ASSETS_DIR = resolveAssetsDir();

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      field += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      current.push(field);
      field = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (field.length > 0 || current.length > 0) {
        current.push(field);
        rows.push(current);
        current = [];
        field = "";
      }
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows.filter((r) => r.length > 0 && r.some((c) => c.trim().length > 0));
}

function pickTitleAndImageIndices(header: string[]): { titleIdx: number; imageIdx: number } {
  const lower = header.map((h) => h.trim().toLowerCase());

  if (header.length <= 2) {
    return { titleIdx: 0, imageIdx: 1 };
  }

  let titleIdx = lower.indexOf("title");
  if (titleIdx === -1) {
    titleIdx = lower.indexOf("data");
  }
  if (titleIdx === -1) {
    titleIdx = 2;
  }

  let imageIdx = lower.indexOf("image2");
  if (imageIdx === -1) {
    imageIdx = lower.indexOf("image");
  }
  if (imageIdx === -1) {
    imageIdx = 3 < header.length ? 3 : 1;
  }

  return { titleIdx, imageIdx };
}

async function loadCsvForConfig(config: FeedConfig): Promise<Post[]> {
  const posts: Post[] = [];

  let files: string[] = [];
  try {
    files = fs.readdirSync(ASSETS_DIR).filter((name) => {
      return name.toLowerCase().endsWith(".csv") && name.includes(config.pattern);
    });
  } catch (err) {
    console.error("Failed to read assets directory", ASSETS_DIR, err);
    return posts;
  }

  files.sort();

  for (const file of files) {
    const fullPath = path.join(ASSETS_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf8");
      const rows = parseCsv(raw);
      if (rows.length <= 1) continue;

      const header = rows[0];
      const { titleIdx, imageIdx } = pickTitleAndImageIndices(header);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const title = row[titleIdx] ?? "";
        const image = row[imageIdx] ?? "";
        if (!image || image.trim().length === 0) continue;
        const post = createPostFromCsvRow(
          { platform: config.platform, defaultCategory: config.defaultCategory },
          title,
          image,
          i
        );
        posts.push(post);
      }
    } catch (err) {
      console.error(`Failed to load CSV for ${config.platform} from ${fullPath}:`, err);
    }
  }

  return posts;
}

export async function getAllPosts(): Promise<Post[]> {
  const cached = get<Post[]>(CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.allSettled(FEEDS.map((config) => loadCsvForConfig(config)));
  const fulfilled = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  set(CACHE_KEY, fulfilled, CACHE_TTL_MS);
  return fulfilled;
}

export async function getMobilePosts(): Promise<Post[]> {
  const cached = get<Post[]>(MOBILE_CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.allSettled(
    MOBILE_FEEDS.map((config) => loadCsvForConfig(config))
  );
  const fulfilled = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  set(MOBILE_CACHE_KEY, fulfilled, CACHE_TTL_MS);
  return fulfilled;
}
