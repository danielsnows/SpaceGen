# Design Feed

Figma plugin that shows a feed of design posts (Dribbble, Behance) and lets you add selected posts to the canvas. No OAuth, no secrets in the plugin—only RSS aggregated by a small backend.

## Architecture

- **Backend** (`backend/`): Node + Express. Fetches RSS feeds, normalizes to a single `Post` format, caches in memory, exposes `GET /posts` and `GET /image?url=...` (image proxy for CORS). CORS is set for `https://www.figma.com` and `http://localhost:3030`.
- **Plugin** (`plugin/`): Figma UI (React) fetches only from the backend, selects posts, fetches images via proxy, sends image bytes to the main thread via `postMessage`. Main thread creates frames with `figma.createImageAsync` and auto layout.

## Quick start

### 1. Backend (required for the plugin to load posts)

```bash
cd backend
npm install
npm run dev
```

Runs at **http://localhost:3030**.  
Endpoints:

- `GET /posts?platform=&category=&q=` — list posts (optional filters).
- `GET /image?url=<encoded-image-url>` — proxy image (avoids CORS in plugin).
- `GET /health` — health check.

### 2. Plugin

```bash
cd plugin
npm install
npm run build
```

Then in Figma:

1. **Plugins** → **Development** → **Import plugin from manifest…**
2. Select the **plugin** folder (the one that contains `manifest.json` and `dist/`).
3. Run **Plugins** → **Development** → **Design Feed**.

The plugin UI will request **http://localhost:3030** by default. For a deployed backend, set the URL at build time and allow it in the manifest:

```bash
# Example: build plugin with production backend
VITE_BACKEND_URL=https://your-backend.example.com npm run build
```

Then add the backend origin (e.g. `https://design-feed-backend.vercel.app`) to `manifest.json` → `networkAccess` → `allowedDomains`, and rebuild.

### Deploy backend (Vercel)

The backend can run on [Vercel](https://vercel.com) (Hobby plan) as serverless functions. Passos detalhados: **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)**.

Resumo:

1. Em Vercel: **Add New → Project** → importar o repo → definir **Root Directory** = `backend` → Deploy.
2. Anotar a URL (ex.: `https://design-feed-backend-xxx.vercel.app`) e testar `https://SUA-URL.vercel.app/api/health`.
3. Build do plugin com a URL da API (incluindo `/api`):
   ```bash
   cd plugin
   VITE_BACKEND_URL=https://SEU-PROJETO.vercel.app/api npm run build
   ```
   Ou use `npm run build:prod` (é obrigatório definir `VITE_BACKEND_URL` antes).
4. Se a URL do deploy for diferente de `design-feed-backend.vercel.app`, adicione a origem em `manifest.json` → `networkAccess` → `allowedDomains`.

### 3. Using the plugin

1. Open the plugin (large modal ~1200×800).
2. Use the left sidebar to filter by platform (Dribbble / Behance).
3. Use search and category dropdown to filter posts.
4. Select posts with the checkboxes, then click **Add to Canvas**.
5. Up to 20 posts can be added at once; each becomes a frame with image, title, platform, and link.

## Project layout

```
backend/
  api/
    [[...path]].ts     # Vercel serverless handler (catch-all → Express)
  vercel.json          # Vercel build and function config
  src/
    config/feeds.ts    # RSS URLs and platform/category defaults
    lib/normalize.ts   # RSS item → Post (per platform)
    services/cache.ts  # In-memory TTL cache
    services/rss-aggregator.ts
    routes/posts.ts    # GET /posts
    routes/image-proxy.ts  # GET /image?url=
    index.ts
plugin/
  src/
    main.ts           # Figma API: showUI, onmessage, INSERT_POSTS, createImageAsync
    ui/
      index.html
      main.tsx, App.tsx
      components/     # Sidebar, SearchBar, CategoryFilter, PostCard, FeedGrid
      lib/api.ts      # getPosts(), getImageProxyUrl()
      lib/postMessage.ts
      types.ts
  manifest.json
  dist/               # After npm run build: code.js, src/ui/index.html, ui.js
```

## Configuration

- **Backend URL (plugin)**  
  Default: `http://localhost:3030`. Override with env at build:  
  `VITE_BACKEND_URL=https://... npm run build`

- **Backend port**  
  `PORT=3030` (default) or set `PORT` when running the backend.

- **Allowed domains (Figma)**  
  In `plugin/manifest.json`, `networkAccess.allowedDomains` must include the backend origin the UI will call (e.g. `http://localhost:3030` or your production URL). Add any new backend host and rebuild the plugin.

## Performance and limits

- Backend caches posts for 15 minutes.
- Plugin limits “Add to Canvas” to 20 posts per action.
- Images are loaded in the UI via the backend proxy, then sent as base64 to the main thread to avoid CORS and main-thread network.

## V2 ideas

- More platforms (new RSS feeds or official APIs with auth on the backend only).
- Backend: Redis/DB cache, deploy as Edge Function.
- Plugin: persist filters in `clientStorage`, accessibility improvements.
