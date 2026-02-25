import { Router, Request, Response } from "express";
import { getAllPosts, getMobilePosts } from "../services/rss-aggregator.js";
import type { Post } from "../lib/normalize.js";

export const postsRouter = Router();

postsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform as string | undefined;
    const category = req.query.category as string | undefined;
    const q = (req.query.q as string)?.toLowerCase().trim();

    let posts: Post[] = await getAllPosts();

    if (platform) {
      posts = posts.filter((p) => p.platform === platform);
    }
    if (category) {
      posts = posts.filter((p) => p.category === category);
    }
    if (q) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.platform.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

postsRouter.get("/mobile", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string)?.toLowerCase().trim();

    let posts = await getMobilePosts();
    if (q) {
      posts = posts.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch mobile posts" });
  }
});
