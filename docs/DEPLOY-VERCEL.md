# Deploy do backend na Vercel – passos

## 1. Conectar o repositório e criar o projeto

1. Acesse [vercel.com](https://vercel.com) e faça login (GitHub, GitLab ou Bitbucket).
2. Clique em **Add New…** → **Project**.
3. **Import** o repositório do Design Feed (se não aparecer, conecte a conta do Git em **Settings**).
4. Na tela de configuração do projeto:
   - **Project Name:** por exemplo `design-feed-backend` (ou o que preferir).
   - **Root Directory:** clique em **Edit**, marque **Include source files outside of the Root Directory in the Build** se aparecer, e defina **Root Directory** = `backend` (obrigatório).
   - **Framework Preset:** deixe **Other** (o `vercel.json` já define o build).
   - **Build Command / Output:** deixe o padrão (o `backend/vercel.json` já tem `buildCommand` e `installCommand`).
5. Clique em **Deploy**.

## 2. Anotar a URL

- Quando o deploy terminar, a URL de produção aparece no dashboard (ex.: `https://design-feed-backend-xxx.vercel.app`).
- Teste no navegador: `https://SUA-URL.vercel.app/api/health` deve retornar `{"ok":true}`.
- A **base URL da API** para o plugin é sempre essa URL **com** `/api` no final, ex.: `https://design-feed-backend-xxx.vercel.app/api`.

## 3. Build do plugin com a URL do backend

No seu computador, no repositório:

```bash
cd plugin
VITE_BACKEND_URL=https://SUA-URL.vercel.app/api npm run build
```

Substitua `SUA-URL.vercel.app` pela URL real do projeto (ex.: `design-feed-backend-xxx.vercel.app`).

## 4. Domínio no manifest (se a URL for diferente)

O `plugin/manifest.json` já inclui `https://design-feed-backend.vercel.app` em `allowedDomains`. Se a sua URL for outra (ex.: `design-feed-backend-abc123.vercel.app`):

1. Abra `plugin/manifest.json`.
2. Em `networkAccess.allowedDomains`, adicione a origem do seu deploy **sem** `/api` (ex.: `https://design-feed-backend-abc123.vercel.app`).
3. Rode de novo o build do plugin (passo 3).

Depois disso, importe o plugin no Figma (Development → Import plugin from manifest…) usando a pasta `plugin` e teste o feed.
