# AgriClaw

AI advisor dla polskich rolników. Agent OpenClaw + dane satelitarne (Sentinel-2 NDVI, NASA SMAP, Open-Meteo) → konkretna, głosowa / WhatsApp rada po polsku.

Architektura zgodna z clawlabspro: każdy rolnik dostaje dedykowanego agenta na Hetzner VM (Docker + OpenClaw Gateway), AgriClaw udostępnia agentowi skille rolnicze przez HTTP tools (`agri-fields`, `agri-satellite`, `agri-weather`, `agri-notify`).

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 14 App Router + TypeScript |
| DB | PostgreSQL + PostGIS (Neon via Vercel Marketplace) + Prisma |
| Auth | NextAuth (Google OAuth + Credentials, JWT) |
| Agent | OpenClaw Gateway (Docker na Hetzner VM, per-user) |
| Satelity | Copernicus Data Space, NASA SMAP, Open-Meteo |
| UI | Tailwind CSS + shadcn/ui + MapLibre GL |
| Raster | geotiff (npm) + turf.js — bez Pythona |

## Quick start

```bash
cp .env.example .env
# uzupełnij sekrety: DATABASE_URL, CDSE_*, HETZNER_*, NEXTAUTH_*

npm install
npx prisma migrate dev
npm run dev
```

## Status

**Faza 1 (MVP):** w budowie — patrz `C:/Users/Cezary/.claude/plans/to-jest-openclaw-joyful-pixel.md`
