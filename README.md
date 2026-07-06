# AgriClaw

Cyfrowy agronom dla polskich rolników. Obraz z góry + pogoda + Twój AgroAgent → konkretna rada przez WhatsApp: *„pole 3 — dobre okno na oprysk jutro 5:30"*. Zalecenia wspierają decyzję rolnika — ostateczny wybór i weryfikacja z etykietą ŚOR należą do niego.

## Szybki start (3 komendy)

Wymagania: **Node 22+**, **Docker Desktop**, **pnpm lub npm**.

```bash
# 1. Klonowanie + deps
git clone https://github.com/InfinityTeamPL/agriclaw.git
cd agriclaw
npm install

# 2. Kopia env
cp .env.example .env

# 3. Postgres + tabele + demo user
npm run setup:demo
```

Start dev serwera:

```bash
npm run dev
```

Otwórz `http://localhost:3000`. Zaloguj się na **`demo@agriclaw.pl` / `demo1234`**.

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 14 App Router (TypeScript) |
| DB | PostgreSQL + PostGIS (lokalnie Docker, prod Neon) |
| ORM | Prisma |
| Auth | NextAuth (Google + Credentials, JWT) |
| UI | Tailwind CSS + shadcn design tokens + Lucide |
| Mapa | MapLibre GL + react-map-gl |
| Obraz | geotiff (npm) + turf.js |
| Silnik agenta | OpenClaw Gateway (WebSocket + `/v1/responses` SSE) |
| Cache / RL | Upstash Redis (opcjonalne) |
| Hosting | Vercel Fluid Compute (Python + Node 22) |

## Komendy

| Komenda | Opis |
|---------|------|
| `npm run dev` | Dev server z HMR |
| `npm run build` | Build produkcyjny |
| `npm run lint` | Next.js + ESLint |
| `npm run test` | Vitest (jednorazowe) |
| `npm run test:watch` | Vitest watch + UI |
| `npm run db:up` | `docker compose up -d` (Postgres+PostGIS) |
| `npm run db:down` | Stop Postgres |
| `npm run db:push` | Sync schema do DB (bez migracji) |
| `npm run db:migrate` | Prisma migracja (dla prod) |
| `npm run db:studio` | Prisma Studio (GUI, port 5555) |
| `npm run db:seed` | Demo user + farma |
| `npm run setup:demo` | Wszystko w jednym: docker + push + seed |

## Struktura

```
src/
├── app/
│   ├── (auth)/               Login, signup (route group)
│   ├── api/
│   │   ├── auth/             NextAuth + signup
│   │   ├── farms/            Farm CRUD
│   │   ├── fields/           Field CRUD (z PostGIS)
│   │   ├── analysis/         NDVI pull + rekomendacja
│   │   ├── geocode/          Adres → lat/lon
│   │   ├── chat/stream/      SSE streaming do agenta
│   │   ├── agents/           Deploy + health per-agent
│   │   ├── skills/           HTTP tools dla agenta (agri-*)
│   │   │   ├── agri-fields/  list, get, history
│   │   │   ├── agri-satellite/  ndvi, soil-moisture
│   │   │   ├── agri-weather/  forecast
│   │   │   └── agri-notify/  whatsapp
│   │   ├── cron/             Codzienne analizy + health
│   │   └── health/           Public healthcheck
│   ├── dashboard/            Sidebar layout + strony
│   ├── onboarding/           Pierwsze uruchomienie
│   └── page.tsx              Landing
├── components/
│   ├── landing/              Hero, Features, HowItWorks, CTA, Footer
│   ├── chat/                 ChatInterface z SSE
│   ├── field-editor/         FieldMapEditor (MapLibre)
│   ├── auth/                 GoogleButton
│   └── ui/                   shadcn base
├── lib/
│   ├── prisma.ts             Singleton
│   ├── auth.ts               NextAuth config
│   ├── session.ts            requireAuth, requireFarm
│   ├── schemas.ts            Zod
│   ├── recommendations.ts    Rule-based engine
│   ├── openclaw.ts           OpenClaw Gateway client (kopia z clawlabspro)
│   ├── openclaw-prompt.ts    System prompt dla agenta rolniczego
│   ├── hetzner.ts            VM provisioning
│   ├── ssh-deploy.ts         Docker deploy na VM
│   ├── provision-script.ts   Init script dla nowego agenta
│   ├── agent-models.ts       Katalog AI modeli
│   ├── agent-templates.ts    Template agri-advisor
│   ├── ai/
│   │   └── openrouter.ts     OpenRouter fallback (Gemma 4)
│   └── satellite/
│       ├── copernicus.ts     CDSE OAuth + Process API
│       ├── ndvi.ts           computeStats/classify/color
│       ├── weather.ts        Open-Meteo wrapper
│       ├── smap.ts           NASA SMAP
│       └── geocode.ts        Nominatim
└── middleware.ts             NextAuth route guard
```

## Env vars

Patrz `.env.example`. Minimum dla MVP:

- `DATABASE_URL`, `DATABASE_URL_UNPOOLED` — Postgres
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET` — dla analizy satelitarnej
- `OPENCLAW_SKILL_TOKEN` — shared secret agent ↔ AgriClaw API

Opcjonalne:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth (jeśli brak, Google button się chowa)
- `HETZNER_*` — provisioning agentów (w dev bez — mock mode)
- `OPENROUTER_API_KEY` — fallback LLM
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` — Faza 5
- `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD` — NASA SMAP

## Deploy na Vercel

```bash
vercel link
vercel env add CDSE_CLIENT_ID
vercel env add CDSE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
# ... reszta
vercel integration add neon   # auto-provisioning DATABASE_URL
vercel deploy
```

Cron już skonfigurowany w `vercel.ts`:
- `/api/cron/daily` — 4:00 UTC codziennie
- `/api/cron/health` — co 15 min

## Licencja

Proprietary. © Infinity Team.
