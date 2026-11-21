# Development Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | Backend + Android tooling |
| npm | bundled with Node | Backend + Android packages |
| pnpm | 10+ | Design prototype only |
| Docker Desktop | Any recent | PostgreSQL + Redis |
| Expo Go | Latest | Run the Android app on a physical device |

An Android emulator or physical device is needed to run the app. Expo CLI handles the dev server.

---

## First-time setup

### 1. Configure environment
```bash
cd backend
cp ../.env.example .env
# Fill in API keys:
#   GOAL_API_KEY            — Goal API key (sole football provider)
#   CRICKET_API_KEY         — CricketData primary key (100 req/day)
#   CRICKET_API_KEY_2       — CricketData secondary key (optional)
#   DATABASE_URL            — set automatically if you use docker-compose defaults
```

`FOOTBALL_API_KEY` (API-Football) and `FOOTBALL_DATA_KEY` (football-data.org) are kept in `.env`/`.env.example` for reference but are **no longer used** — those secondary football providers were removed and football is now a Goal API pass-through proxy.

### 2. Start the database
```bash
docker compose up -d
# PostgreSQL: localhost:5433 (mapped from container :5432)
# Redis:      localhost:6379
```

### 3. Run backend
```bash
cd backend
npm install
npx prisma db push            # creates/syncs the schema from schema.prisma
npm run dev
# API:    http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs
```

### 4. Run the Android app
```bash
cd android
npm install
npm start                     # starts Expo dev server
# Options: press 'a' for Android emulator, scan QR with Expo Go
```

The app connects to the backend at the LAN IP hardcoded in two files:
- `android/src/services/api.ts` — `BASE_URL`
- `android/src/hooks/useLiveUpdates.ts` — `SOCKET_URL`

Change both to your machine's local IP if needed.

### 5. Design prototype (optional)
```bash
cd design
pnpm install
pnpm dev                      # http://localhost:8443
```

---

## Environment variables (backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOAL_API_KEY` | Yes | Goal API bearer token (sole football provider) |
| `CRICKET_API_KEY` | Yes | CricketData primary key (100 req/day) |
| `CRICKET_API_KEY_2` | No | CricketData secondary key (doubles cricket quota) |
| `FOOTBALL_API_KEY` | No | Retained in `.env` but unused (API-Football provider removed) |
| `FOOTBALL_DATA_KEY` | No | Retained in `.env` but unused (football-data.org provider removed) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL (in docker-compose but not actively used) |
| `PORT` | No | Backend port (default: 3000) |

Only `GOAL_API_KEY` and `CRICKET_API_KEY` are needed for football and cricket respectively. Never commit `backend/.env`.

---

## Common tasks

### Trigger a manual sync
```bash
# Cricket
curl -X POST http://localhost:3000/api/v1/cricket/sync
```

Football has **no manual sync endpoints**. Football is a Goal API pass-through proxy, so every `GET /football/...` reads Goal API directly and returns fresh data — there is nothing to "sync". The `POST /football/sync/*` routes have been removed.

### Check provider quota
```bash
curl http://localhost:3000/api/v1/health/providers
```

### View recent sync logs
```bash
curl http://localhost:3000/api/v1/health/sync
```

### Prisma Studio (DB browser)
```bash
cd backend
npx prisma studio               # opens at http://localhost:5555
```

### Reset and re-apply the schema
```bash
cd backend
npx prisma db push --accept-data-loss   # recreates tables from schema.prisma
```

---

## Project state

- [x] Backend: NestJS + Prisma + PostgreSQL running
- [x] Football: Goal API pass-through proxy (no football DB storage; every read hits Goal API directly)
- [x] Cricket: CricketData integrated (dual-key support), synced to DB
- [x] Scheduled sync (2 cron jobs: football live-push + cricket)
- [x] WebSocket live push (football:live, cricket:live)
- [x] Android app: React Native + Expo, all screens connected to real API
- [x] Match detail: events, stats, lineups, commentary from Goal API
- [x] Standings: via Goal API
- [x] Team profiles + squad: via Goal API
- [x] Follow/unfollow teams (AsyncStorage, local only)
- [x] Dark mode toggle (AsyncStorage-persisted)
