# Diagnóstico de 404 no backend na Vercel

Com **Root Directory = backend** já configurado, um 404 em `/api/health` costuma ser por um destes motivos.

## 1. Conferir logs do deploy

1. No dashboard do projeto (**spacegen-ten**), abra **Deployments**.
2. Clique no último deployment (Production).
3. Aba **Building** (Build Logs):
   - Confirme que `npm ci` e `npm run build` terminaram **sem erro**.
   - Se aparecer erro em "Building Serverless Functions" ou ao compilar `api/[[...path]].ts`, a função não sobe e qualquer chamada vira 404.
4. Aba **Functions** (ou **Runtime Logs**):
   - Acesse no navegador: `https://spacegen-ten.vercel.app/api/health`.
   - Veja se surge alguma invocação e se há erro (ex.: módulo não encontrado, timeout).

Se o build da função falhar por causa de `../dist/index.js` ou de dependências nativas (ex.: `sharp`), os logs vão mostrar o erro exato.

## 2. Output Directory

1. **Settings** → **Build & Development Settings**.
2. Em **Output Directory**, deixe **vazio** (ou o padrão).
   - Se estiver preenchido (ex.: `dist` ou `public`), a Vercel pode tratar o projeto como site estático e não expor as rotas em `/api/*` como função. Apague, salve e faça um **Redeploy**.

## 3. Testar com um endpoint mínimo

Foi adicionado em `backend/api/ping.ts` um endpoint que só retorna `{ ok: true }`, sem usar Express nem `dist/`.

- Teste **https://spacegen-ten.vercel.app/api/ping**. Se responder **200** com `{"ok":true}`, a Vercel está servindo funções; aí o problema está no catch-all (`api/[[...path]].ts`) ou no import de `../dist/index.js`.
- Se **/api/ping** também der **404**, nenhuma função está sendo exposta: confira Output Directory (vazio), build logs e se o deploy é mesmo deste repositório com Root = backend.

## 4. Redeploy após mudanças

Depois de alterar **Root Directory**, **Output Directory** ou qualquer coisa em `vercel.json` / `api/`, faça um novo deploy:

- **Deployments** → ⋯ no último → **Redeploy** (sem cache se quiser garantir).

## 5. Conferir a URL do projeto

Confirme que a URL que você está testando é mesmo a do projeto que tem Root Directory = **backend** (e não outro projeto ou um deployment antigo).
