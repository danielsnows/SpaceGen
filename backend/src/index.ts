import express from "express";
import cors from "cors";
import { imageProxyRouter } from "./routes/image-proxy.js";

const app = express();
const PORT = process.env.PORT ?? 3030;

// Para desenvolvimento e Figma (iframe com origin "null"), CORS amplo.
// Preflight OPTIONS precisa ser permitido para o browser enviar GET.
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed =
        origin == null ||
        origin === "null" ||
        origin === "" ||
        origin.startsWith("https://www.figma.com") ||
        origin.startsWith("http://localhost");
      cb(null, allowed ? origin || true : false);
    },
    methods: ["GET", "OPTIONS"],
  })
);

app.use(express.json());

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
