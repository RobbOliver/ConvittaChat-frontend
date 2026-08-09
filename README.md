# ConvittaChat-frontend

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
