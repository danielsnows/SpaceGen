export interface Post {
  id: string;
  title: string;
  image: string;
  url: string;
  platform: string;
  category: string;
  publishedAt: string;
}

export interface InsertPostPayload {
  id: string;
  title: string;
  imageUrl: string;
  url: string;
  platform: string;
  imageBytes: Uint8Array;
}
