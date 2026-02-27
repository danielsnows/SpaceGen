import { embeddedImageData } from "./embeddedImages";

const BACKEND_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  typeof (import.meta.env as Record<string, unknown>).VITE_BACKEND_URL === "string"
    ? String((import.meta.env as Record<string, string>).VITE_BACKEND_URL).replace(/\/$/, "")
    : "https://spacegen-ten.vercel.app/api";

export function getImageProxyUrl(imageUrl: string): string {
  return `${BACKEND_URL}/image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Retorna URL utilizável para img src e fetch.
 * Prioridade: 1) imagens embutidas (data URL), 2) URL absoluta resolvida a partir da base do documento.
 */
export function getLocalImageUrl(path: string): string {
  if (!path || !path.startsWith("/")) return path;
  const embedded = embeddedImageData[path];
  if (embedded) return embedded;
  const rel = path.slice(1);
  const bases: string[] = [];
  if (typeof document !== "undefined" && document.baseURI) bases.push(document.baseURI);
  if (typeof import.meta !== "undefined" && (import.meta as { url?: string }).url)
    bases.push((import.meta as { url: string }).url);
  if (typeof document !== "undefined") {
    const script = document.querySelector('script[src]');
    if (script && (script as HTMLScriptElement).src) bases.push((script as HTMLScriptElement).src);
  }
  if (typeof window !== "undefined" && window.location?.href) bases.push(window.location.href);
  for (const base of bases) {
    try {
      const dir = new URL(".", base).href;
      const full = new URL(rel, dir).href;
      if (full && (full.startsWith("http:") || full.startsWith("https:") || full.startsWith("file:")))
        return full;
    } catch {
      continue;
    }
  }
  return "";
}

/** Verifica se a URL é absoluta e válida para fetch (inclui data: para imagens embutidas). */
export function isAbsoluteImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:";
  } catch {
    return false;
  }
}
