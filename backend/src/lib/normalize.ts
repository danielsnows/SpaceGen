export interface Post {
  id: string;
  title: string;
  image: string;
  platform: string;
  category: string;
}

export interface CsvPostConfig {
  platform: string;
  defaultCategory: string;
}

export function createPostFromCsvRow(
  config: CsvPostConfig,
  titleRaw: string,
  imageRaw: string,
  index: number
): Post {
  const title = (titleRaw ?? "").trim();
  const image = (imageRaw ?? "").trim();

  const base = title || image || `item-${index}`;
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `item-${index}`;

  const id = `${config.platform}-${slug}-${index}`;

  return {
    id,
    title,
    image,
    platform: config.platform,
    category: config.defaultCategory,
  };
}
