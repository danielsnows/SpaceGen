export interface FeedConfig {
  url: string;
  platform: string;
  defaultCategory: string;
}

export const FEEDS: FeedConfig[] = [
  {
    url: "https://rss.app/feeds/JR6zem5XI5CryhgJ.xml",
    platform: "dribbble",
    defaultCategory: "UI Design",
  },
  {
    url: "https://rss.app/feeds/RrhBPP1Ss1L9sRr7.xml",
    platform: "awwwards",
    defaultCategory: "Website Awards",
  },
  {
    url: "https://rss.app/feeds/hIphKSrF3YpyDbWK.xml",
    platform: "webflow",
    defaultCategory: "Website Inspiration",
  },
  {
    url: "https://rss.app/feeds/IZRk0aqGfFA7Ej9S.xml",
    platform: "framer",
    defaultCategory: "Website Inspiration",
  },
  {
    url: "https://rss.app/feeds/FzZAGPvuSjTIwtmp.xml",
    platform: "onepagelove",
    defaultCategory: "One Page",
  },
  // Opcional – Behance: criar feed no rss.app e descomentar:
  // { url: "https://rss.app/feeds/XXXXX.xml", platform: "behance", defaultCategory: "Design" },
];

// Feeds específicos para inspiração de Mobile App (aba dedicada no plugin)
export const MOBILE_FEEDS: FeedConfig[] = [
  {
    url: "https://rss.app/feeds/Fr3v3xc7Tsm7NJNU.xml",
    platform: "mobileapp",
    defaultCategory: "Mobile App",
  },
];

export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
