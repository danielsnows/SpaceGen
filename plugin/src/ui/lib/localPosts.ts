import type { Post } from "../types";

// Dados brutos vindos dos JSONs de cada serviço.
// Importamos diretamente os arquivos JSON existentes em assets/feed-json.

import dribbbleRaw from "../../../../assets/feed-json/dribbble.json";
import behanceRaw from "../../../../assets/feed-json/behance-net-2026-02-27.json";
import awwwardsRaw from "../../../../assets/feed-json/awwwards-com-2026-02-27 (1).json";
import cssDesignAwardsRaw from "../../../../assets/feed-json/cssdesignawards-com-2026-02-27.json";
import cssWinnerRaw from "../../../../assets/feed-json/csswinner-com-2026-02-27.json";
import landbookRaw from "../../../../assets/feed-json/landbook.json";
import framerRaw from "../../../../assets/feed-json/framer.json";
import onePageLoveRaw from "../../../../assets/feed-json/onepagelove.json";
import mobileRaw from "../../../../assets/feed-json/mobile.json";

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

    // Ignora itens sem imagem ou com imagem inline/base64 (data URL),
    // que não passam pelo proxy de imagens.
    if (!image || !image.toLowerCase().startsWith("http")) return;

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

