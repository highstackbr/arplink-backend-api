# ARPLINK Backend API (NestJS)

Backend API separado para hospedar no Render. **Toda regra de negócio deve ficar aqui** (services), mantendo o frontend como consumidor via HTTP.

## Stack

- Node.js + NestJS
- Postgres (Supabase) via `DATABASE_URL`

## Estrutura (alto nível)

- `src/modules/*`: módulos REST (controllers + services + DTOs)
- `src/database/*`: conexão e providers de Postgres (sem regra de negócio)
- `src/common/*`: cross-cutting (middlewares, filtros, interceptors)
- `src/auth/*`: base para validação futura de JWT do Supabase

## Endpoints iniciais

- `GET /api/health`
- `GET /api/users`
- `POST /api/users`

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

- `PORT`
- `DATABASE_URL`

(futuro)

- `SUPABASE_PROJECT_URL`
- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWT_AUDIENCE`

## Rodar local

```bash
cd arplink-backend-api
npm install
npm run start:dev
```

A API sobe em `http://localhost:3000/api`.

## Deploy no Render

Crie um **Web Service** no Render:

- Root Directory: `arplink-backend-api`
- Build Command: `npm ci && npm run build`
- Start Command: `node dist/main.js`
- Env Vars:
  - `DATABASE_URL` (do Supabase Postgres)
  - `PORT` (o Render injeta automaticamente)

Se preferir Docker, use o `Dockerfile` deste diretório.

