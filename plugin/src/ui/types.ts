export interface Post {
  id: string;
  title: string;
  image: string;
  platform: string;
  category: string;
}

export interface InsertPostPayload {
  id: string;
  title: string;
  imageUrl: string;
  platform: string;
  imageBytes: Uint8Array;
}
