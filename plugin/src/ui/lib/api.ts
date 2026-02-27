import type { Post } from "../types";

const BACKEND_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  typeof (import.meta.env as Record<string, unknown>).VITE_BACKEND_URL === "string"
    ? String((import.meta.env as Record<string, string>).VITE_BACKEND_URL).replace(/\/$/, "")
    : "https://spacegen-ten.vercel.app";

const FETCH_TIMEOUT_MS = 18000;

export interface GetPostsParams {
  platform?: string;
  category?: string;
  q?: string;
}

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export async function getPosts(params: GetPostsParams = {}): Promise<Post[]> {
  const search = new URLSearchParams();
  if (params.platform) search.set("platform", params.platform);
  if (params.q) search.set("q", params.q);
  const url = `${BACKEND_URL}/posts?${search.toString()}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Backend request timed out. If you're using the cloud backend, try again in a few seconds. For local development, run npm run dev in /backend."
      );
    }
    throw new Error(
      "Could not connect to backend. Check your configured backend URL (VITE_BACKEND_URL) or, in local development, run cd backend && npm run dev."
    );
  }
  if (!res.ok) throw new Error("Failed to load posts (backend returned " + res.status + ")");
  return res.json();
}

export async function getMobilePosts(params: Pick<GetPostsParams, "q"> = {}): Promise<Post[]> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  const url = `${BACKEND_URL}/posts/mobile?${search.toString()}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Backend request timed out. If you're using the cloud backend, try again in a few seconds. For local development, run npm run dev in /backend."
      );
    }
    throw new Error(
      "Could not connect to backend. Check your configured backend URL (VITE_BACKEND_URL) or, in local development, run cd backend && npm run dev."
    );
  }
  if (!res.ok) throw new Error("Failed to load mobile posts (backend returned " + res.status + ")");
  return res.json();
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Fetches web + mobile posts, sorts by date, shuffles, then applies limit. Only used for initial "all" view; when user applies tab/platform filter, getPosts/getMobilePosts are used and no shuffle is applied. */
export async function getAllPostsMerged(limit: number, q?: string): Promise<Post[]> {
  const [web, mobile] = await Promise.all([
    getPosts({ q }),
    getMobilePosts({ q }),
  ]);
  const merged = [...web, ...mobile];
  return shuffle(merged).slice(0, limit);
}

export function getImageProxyUrl(imageUrl: string): string {
  return `${BACKEND_URL}/image?url=${encodeURIComponent(imageUrl)}`;
}
