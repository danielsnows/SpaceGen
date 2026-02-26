import express from "express";
import cors from "cors";
import { postsRouter } from "./routes/posts.js";
import { imageProxyRouter } from "./routes/image-proxy.js";

const app = express();
const PORT = process.env.PORT ?? 3030;

// Para desenvolvimento, liberamos CORS amplo para que o iframe do Figma
// (que pode ter origin \"null\" ou outra variação) consiga chamar o backend.
// Em produção, você pode restringir isso para origens específicas.
app.use(
  cors({
    origin: true, // reflete a origin do request
    methods: ["GET"],
  })
);

app.use(express.json());

app.use("/posts", postsRouter);
app.use("/image", imageProxyRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Na Vercel, não inicia o servidor; o handler em api/ usa serverless-http.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Design Feed backend running at http://localhost:${PORT}`);
  });
}

export { app };
