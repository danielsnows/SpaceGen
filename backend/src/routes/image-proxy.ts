import { Router, Request, Response } from "express";

export const imageProxyRouter = Router();

// Origens permitidas para o proxy de imagens (Dribbble, Behance, sites de premiação via rss.app)
const ALLOWED_ORIGINS = new Set([
  "https://cdn.dribbble.com",
  "https://dribbble.com",
  "https://www.behance.net",
  "https://mir-s3-cdn-cf.behance.net",
  "https://cdn-images-1.medium.com",
  "http://cdn-images-1.medium.com",
  "https://files.smashing.media",
  "http://files.smashing.media",
  "https://archive.smashing.media",
  "http://archive.smashing.media",
  "https://www.smashingmagazine.com",
  "https://smashingmagazine.com",
  // Sites de premiação / inspiração
  "https://assets.awwwards.com",
  "https://www.awwwards.com",
  "https://www.cssdesignawards.com",
  "https://cdn.csswinner.com",
  "https://www.csswinner.com",
  "https://cdn.land-book.com",
  "https://land-book.com",
  "https://www.siteinspire.com",
  "https://assets.onepagelove.com",
  "https://onepagelove.com",
  // CDNs comuns em itens dos feeds (prismic, webflow, shopify, etc.)
  "https://images.prismic.io",
  "https://cdn.shopify.com",
  "https://cdn.prod.website-files.com",
  // Webflow screenshots / assets
  "https://screenshots.webflow.com",
  "https://d3e54v103j8qbb.cloudfront.net",
  // Framer assets
  "https://framerusercontent.com",
  // Pinterest (feed Mobile App via rss.app)
  "https://i.pinimg.com",
  "https://s.pinimg.com",
]);

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const origin = u.origin;
    if (ALLOWED_ORIGINS.has(origin)) return true;
    if (origin.endsWith(".behance.net") || origin.endsWith(".dribbble.com")) return true;
    if (origin.endsWith(".medium.com") || origin.endsWith("smashing.media")) return true;
    if (origin.endsWith(".awwwards.com") || origin.endsWith("awwwards.com")) return true;
    if (origin.endsWith("cssdesignawards.com") || origin.endsWith("csswinner.com")) return true;
    if (origin.endsWith("land-book.com")) return true;
    if (origin.endsWith("siteinspire.com") || origin.endsWith("onepagelove.com")) return true;
    if (origin.endsWith("webflow.com")) return true;
    if (origin.endsWith("framerusercontent.com")) return true;
    if (origin.endsWith("pinimg.com")) return true;
    return false;
  } catch {
    return false;
  }
}

const IMAGE_FETCH_TIMEOUT_MS = 12000;
const IMAGE_BODY_READ_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DesignFeed/1.0; +https://github.com/design-feed)",
        Accept: "image/*",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function arrayBufferWithTimeout(resp: Response, ms: number): Promise<ArrayBuffer> {
  return Promise.race([
    resp.arrayBuffer(),
    new Promise<ArrayBuffer>((_, reject) =>
      setTimeout(() => reject(new Error("Body read timed out")), ms)
    ),
  ]);
}

imageProxyRouter.get("/", async (req: Request, res: Response) => {
  const rawUrl = req.query.url;
  if (typeof rawUrl !== "string" || !rawUrl) {
    res.status(400).json({ error: "Missing url query" });
    return;
  }
  if (!isAllowedUrl(rawUrl)) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }
  try {
    console.log("image-proxy: fetching", rawUrl);
    const resp = await fetchWithTimeout(rawUrl, IMAGE_FETCH_TIMEOUT_MS);
    console.log("image-proxy: fetched", rawUrl, resp.status);
    if (!resp.ok) {
      res.status(resp.status).send(resp.statusText);
      return;
    }
    const contentType = resp.headers.get("content-type") ?? "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    const arrBuffer = await arrayBufferWithTimeout(resp, IMAGE_BODY_READ_TIMEOUT_MS);
    const input = Buffer.from(new Uint8Array(arrBuffer));

    // Redimensiona imagens muito grandes para evitar erro "Image is too large" no Figma (sharp carregado só aqui para reduzir cold start na Vercel)
    const MAX_DIMENSION = 2000;
    let output: Buffer = input;
    try {
      console.log("image-proxy: resizing", rawUrl);
      const { default: sharp } = await import("sharp");
      const img = sharp(input);
      const meta = await img.metadata();
      if (
        meta.width &&
        meta.height &&
        (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION)
      ) {
        const resized = img.resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        });
        output = await resized.toBuffer();
      }
      console.log("image-proxy: resized", rawUrl);
    } catch (e) {
      console.error("Image resize error:", e);
    }

    res.send(output);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("Image proxy timeout:", rawUrl);
      res.status(504).json({ error: "Image fetch timed out" });
      return;
    }
    if (err instanceof Error && err.message === "Body read timed out") {
      console.error("Image proxy body read timeout:", rawUrl);
      res.status(504).json({ error: "Image fetch timed out" });
      return;
    }
    console.error("Image proxy error:", err);
    res.status(502).json({ error: "Failed to fetch image" });
  }
});
