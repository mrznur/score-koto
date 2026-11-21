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
#   GOAL_API_KEY            — Goal API key
#   FOOTBALL_API_KEY        — API-Football key (100 req/day free)
#   FOOTBALL_DATA_KEY       — football-data.org key
#   CRICKET_API_KEY         — CricketData primary key (100 req/day)
#   CRICKET_API_KEY_2       — CricketData secondary key (optional)
#   DATABASE_URL            — set automatically if you use docker-compose defaults
```

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
npx prisma migrate dev        # applies all 5 migrations
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
| `GOAL_API_KEY` | Yes | Goal API bearer token |
| `FOOTBALL_API_KEY` | Yes | API-Football key |
| `FOOTBALL_DATA_KEY` | Yes | football-data.org token |
| `CRICKET_API_KEY` | Yes | CricketData primary key |
| `CRICKET_API_KEY_2` | No | CricketData secondary key (doubles cricket quota) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL (in docker-compose but not actively used) |
| `PORT` | No | Backend port (default: 3000) |

Never commit `backend/.env`.

---

## Common tasks

### Trigger a manual sync
```bash
# Live football
curl -X POST http://localhost:3000/api/v1/football/sync/live

# Today's fixtures
curl -X POST http://localhost:3000/api/v1/football/sync/today

# Specific date
curl -X POST http://localhost:3000/api/v1/football/sync/date/2025-01-25

# Upcoming 7 days
curl -X POST http://localhost:3000/api/v1/football/sync/upcoming

# Cricket
curl -X POST http://localhost:3000/api/v1/cricket/sync
```

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

### Reset and re-migrate the database
```bash
cd backend
npx prisma migrate reset        # drops and recreates all tables
```

---

## Project state

- [x] Backend: NestJS + Prisma + PostgreSQL running
- [x] Football: 4 providers integrated (Goal API, API-Football, football-data.org, TheSportsDB)
- [x] Cricket: CricketData integrated (dual-key support)
- [x] Scheduled sync (5 cron jobs)
- [x] WebSocket live push
- [x] Android app: React Native + Expo, all screens connected to real API
- [x] Match detail: events, stats, lineups, commentary from Goal API
- [x] Standings: via Goal API
- [x] Team profiles + squad: via Goal API
- [x] Follow/unfollow teams (AsyncStorage, local only)
- [x] Dark mode toggle (AsyncStorage-persisted)
