/**
 * Handler Vercel: repassa todas as requisições /api/* para o app Express.
 * O prefixo /api é removido para que as rotas do Express (/posts, /image, /health) funcionem.
 */
import express from "express";
import serverless from "serverless-http";
import { app } from "../dist/index.js";

const proxy = express();
proxy.use((req, _res, next) => {
  if (typeof req.url === "string" && req.url.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  next();
});
proxy.use(app);

export default serverless(proxy);
