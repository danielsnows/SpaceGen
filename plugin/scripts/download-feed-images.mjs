#!/usr/bin/env node
/**
 * Baixa imagens dos feeds a partir dos JSONs em assets/feed-json,
 * salva em plugin/public/feed-images/ e gera JSONs em plugin/src/ui/feed-json-built/
 * com image = "/feed-images/<platform>-<index>.<ext>".
 *
 * Uso: a partir da pasta plugin/, rodar: node scripts/download-feed-images.mjs
 */

import fs from "fs";
import path from "path";

const FETCH_TIMEOUT_MS = 15000;
const MAX_ITEMS_PER_FEED = 30;

const FEEDS = [
  { jsonFile: "dribbble.json", platform: "dribbble", category: "UI Design" },
  { jsonFile: "behance-net-2026-02-27.json", platform: "behance", category: "Design" },
  { jsonFile: "awwwards-com-2026-02-27 (1).json", platform: "awwwards", category: "Website Awards" },
  { jsonFile: "cssdesignawards-com-2026-02-27.json", platform: "cssdesignawards", category: "Website Awards" },
  { jsonFile: "csswinner-com-2026-02-27.json", platform: "csswinner", category: "Website Awards" },
  { jsonFile: "landbook.json", platform: "landbook", category: "Website Inspiration" },
  { jsonFile: "framer.json", platform: "framer", category: "Website Inspiration" },
  { jsonFile: "onepagelove.json", platform: "onepagelove", category: "One Page" },
  { jsonFile: "mobile.json", platform: "mobileapp", category: "Mobile App" },
];

const pluginDir = process.cwd();
const assetsFeedJsonDir = path.join(pluginDir, "..", "assets", "feed-json");
const publicFeedImagesDir = path.join(pluginDir, "public", "feed-images");
const feedJsonBuiltDir = path.join(pluginDir, "src", "ui", "feed-json-built");

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; DesignFeed/1.0)",
      Accept: "image/*",
    },
  }).finally(() => clearTimeout(timeout));
}

function getExtFromContentType(contentType) {
  if (!contentType) return "png";
  const m = contentType.toLowerCase().match(/image\/(png|jpeg|jpg|gif|webp)/);
  if (m) {
    if (m[1] === "jpeg") return "jpg";
    return m[1];
  }
  return "png";
}

function getExtFromUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    if (p.endsWith(".webp")) return "webp";
    if (p.endsWith(".png")) return "png";
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "jpg";
    if (p.endsWith(".gif")) return "gif";
  } catch (_) {}
  return "png";
}

async function downloadImage(url, outDir, baseName) {
  const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type");
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = getExtFromContentType(contentType) || getExtFromUrl(url);
  const fileName = `${baseName}.${ext}`;
  const finalPath = path.join(outDir, fileName);
  fs.writeFileSync(finalPath, buffer);
  return fileName;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function processFeed({ jsonFile, platform }) {
  const srcPath = path.join(assetsFeedJsonDir, jsonFile);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Skip (file not found): ${jsonFile}`);
    return { platform, items: [] };
  }
  const raw = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  const items = Array.isArray(raw) ? raw : [];
  const out = [];
  const limit = Math.min(items.length, MAX_ITEMS_PER_FEED);
  for (let i = 0; i < limit; i++) {
    const item = items[i];
    const title = (item?.title ?? "").trim();
    const imageUrl = (item?.image ?? "").trim();
    if (!imageUrl || !imageUrl.toLowerCase().startsWith("http")) continue;
    const baseName = `${platform}-${i}`;
    try {
      const fileName = await downloadImage(imageUrl, publicFeedImagesDir, baseName);
      if (fileName) {
        out.push({ title: title || platform, image: `/feed-images/${fileName}` });
      }
    } catch (e) {
      console.warn(`  Skip ${platform}-${i}: ${e.message}`);
    }
  }
  return { platform, items: out };
}

async function main() {
  ensureDir(publicFeedImagesDir);
  ensureDir(feedJsonBuiltDir);

  const outNames = {
    dribbble: "dribbble.json",
    behance: "behance.json",
    awwwards: "awwwards.json",
    cssdesignawards: "cssdesignawards.json",
    csswinner: "csswinner.json",
    landbook: "landbook.json",
    framer: "framer.json",
    onepagelove: "onepagelove.json",
    mobileapp: "mobile.json",
  };

  for (const feed of FEEDS) {
    console.log(`Processing ${feed.jsonFile} (${feed.platform})...`);
    const { platform, items } = await processFeed(feed);
    const outFile = outNames[platform];
    if (!outFile) continue;
    const outPath = path.join(feedJsonBuiltDir, outFile);
    fs.writeFileSync(outPath, JSON.stringify(items, null, 2), "utf8");
    console.log(`  ${items.length} items -> ${outFile}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
