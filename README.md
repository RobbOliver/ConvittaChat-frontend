# ConvittaChat-frontend

> ⏸️ **PROJETO PAUSADO** — o desenvolvimento do Convitta Chat está pausado desde 16/10/2026. Este repositório fica congelado no estado atual, sem novas funcionalidades ou correções previstas até nova ordem.

Painel web do Convitta Chat — inbox unificado de conversas de WhatsApp para times de vendas.

## Stack

- **React** + **Vite** + TypeScript
- **Tailwind CSS**
- **React Router**
- **TanStack Query** — cache/estado de dados da API
- **Socket.IO client** — mensagens em tempo real

## Setup

Requer o [backend](https://github.com/RobbOliver/ConvittaChat-backend) rodando em `http://localhost:3000` (veja o README de lá para subir Postgres/Redis via Docker).

```bash
npm install
cp .env.example .env   # ajuste se necessário
npm run dev
```

App sobe em `http://localhost:5173`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — build de produção
- `npm run lint` — oxlint
