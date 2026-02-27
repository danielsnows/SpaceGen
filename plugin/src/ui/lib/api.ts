const BACKEND_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  typeof (import.meta.env as Record<string, unknown>).VITE_BACKEND_URL === "string"
    ? String((import.meta.env as Record<string, string>).VITE_BACKEND_URL).replace(/\/$/, "")
    : "https://spacegen-ten.vercel.app/api";

export function getImageProxyUrl(imageUrl: string): string {
  return `${BACKEND_URL}/image?url=${encodeURIComponent(imageUrl)}`;
}
