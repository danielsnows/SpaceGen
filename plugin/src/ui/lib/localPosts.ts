import type { Post } from "../types";

// Dados vindos dos JSONs gerados por scripts/download-feed-images.mjs
// (feed-json-built: imagens locais em public/feed-images).

import dribbbleRaw from "../feed-json-built/dribbble.json";
import behanceRaw from "../feed-json-built/behance.json";
import awwwardsRaw from "../feed-json-built/awwwards.json";
import cssDesignAwardsRaw from "../feed-json-built/cssdesignawards.json";
import cssWinnerRaw from "../feed-json-built/csswinner.json";
import landbookRaw from "../feed-json-built/landbook.json";
import framerRaw from "../feed-json-built/framer.json";
import onePageLoveRaw from "../feed-json-built/onepagelove.json";
import mobileRaw from "../feed-json-built/mobile.json";

type RawItem = {
  title: string | null;
  image: string | null;
};

function mapJsonToPosts(
  raw: RawItem[],
  platform: string,
  category: string
): Post[] {
  const posts: Post[] = [];
  raw.forEach((item, index) => {
    const title = (item.title ?? "").trim();
    const image = (item.image ?? "").trim();

    // Ignora itens sem imagem. Aceita URL (http) ou path local (/feed-images/...).
    if (!image) return;

    const id = `${platform}-${index}`;

    posts.push({
      id,
      title: title || platform,
      image,
      platform,
      category,
    });
  });
  return posts;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function filterByQuery(posts: Post[], q?: string): Post[] {
  const needle = q?.toLowerCase().trim();
  if (!needle) return posts;
  return posts.filter((p) => {
    const title = p.title.toLowerCase();
    const platform = p.platform.toLowerCase();
    const category = p.category.toLowerCase();
    return (
      title.includes(needle) ||
      platform.includes(needle) ||
      category.includes(needle)
    );
  });
}

const dribbblePosts = mapJsonToPosts(
  dribbbleRaw as RawItem[],
  "dribbble",
  "UI Design"
);

const behancePosts = mapJsonToPosts(
  behanceRaw as RawItem[],
  "behance",
  "Design"
);

const awwwardsPosts = mapJsonToPosts(
  awwwardsRaw as RawItem[],
  "awwwards",
  "Website Awards"
);

const cssDesignAwardsPosts = mapJsonToPosts(
  cssDesignAwardsRaw as RawItem[],
  "cssdesignawards",
  "Website Awards"
);

const cssWinnerPosts = mapJsonToPosts(
  cssWinnerRaw as RawItem[],
  "csswinner",
  "Website Awards"
);

const landbookPosts = mapJsonToPosts(
  landbookRaw as RawItem[],
  "landbook",
  "Website Inspiration"
);

const framerPosts = mapJsonToPosts(
  framerRaw as RawItem[],
  "framer",
  "Website Inspiration"
);

const onePageLovePosts = mapJsonToPosts(
  onePageLoveRaw as RawItem[],
  "onepagelove",
  "One Page"
);

const mobilePosts = mapJsonToPosts(
  mobileRaw as RawItem[],
  "mobileapp",
  "Mobile App"
);

const webPosts: Post[] = [
  dribbblePosts,
  behancePosts,
  awwwardsPosts,
  cssDesignAwardsPosts,
  cssWinnerPosts,
  landbookPosts,
  framerPosts,
  onePageLovePosts,
].flat();

export function getAllPostsFromJson(limit: number, q?: string): Post[] {
  const all = [...webPosts, ...mobilePosts];
  const filtered = filterByQuery(all, q);
  return shuffle(filtered).slice(0, limit);
}

export function getWebPostsFromJson(
  platform?: string,
  q?: string
): Post[] {
  let data = webPosts;
  if (platform) {
    data = data.filter((p) => p.platform === platform);
  }
  return filterByQuery(data, q);
}

export function getMobilePostsFromJson(q?: string): Post[] {
  return filterByQuery(mobilePosts, q);
}

/** Todos os posts (web + mobile) por id, para resolver seleção ao adicionar ao Figma independente do feed atual. */
export function getAllPostsById(): Map<string, Post> {
  const all = [...webPosts, ...mobilePosts];
  return new Map(all.map((p) => [p.id, p]));
}

