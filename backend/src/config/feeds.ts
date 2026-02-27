export interface FeedConfig {
  /** Substring usada para identificar arquivos CSV dessa plataforma pelo nome. */
  pattern: string;
  platform: string;
  defaultCategory: string;
}

export const FEEDS: FeedConfig[] = [
  {
    pattern: "dribbble-com",
    platform: "dribbble",
    defaultCategory: "UI Design",
  },
  {
    pattern: "awwwards-com",
    platform: "awwwards",
    defaultCategory: "Website Awards",
  },
  {
    pattern: "cssdesignawards-com",
    platform: "cssdesignawards",
    defaultCategory: "Website Awards",
  },
  {
    pattern: "csswinner-com",
    platform: "csswinner",
    defaultCategory: "Website Awards",
  },
  {
    pattern: "framer-com",
    platform: "framer",
    defaultCategory: "Website Inspiration",
  },
  {
    pattern: "land-book-com",
    platform: "landbook",
    defaultCategory: "Website Inspiration",
  },
  {
    pattern: "behance-net",
    platform: "behance",
    defaultCategory: "Design",
  },
];

// Feeds específicos para inspiração de Mobile App (aba dedicada no plugin)
export const MOBILE_FEEDS: FeedConfig[] = [
  {
    pattern: "Mobile-",
    platform: "mobileapp",
    defaultCategory: "Mobile App",
  },
];

export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
