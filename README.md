# Score Koto

Private sports information app for Android. Displays real football and cricket data — live scores, fixtures, results, standings, and match details.

## Structure

```
Score Koto/
  android/        React Native (Expo) app
  backend/        NestJS + PostgreSQL API server
  design/         Web UI prototype in Figma Make (React + Vite — design reference only, not shipped)
  docs/           Architecture and development documentation
  docker-compose.yml  PostgreSQL + Redis for local development
```

## Quick start

### Prerequisites
- Node.js 22+
- Docker Desktop
- Expo Go app or Android emulator (for the mobile app)

### Backend (local)
```bash
docker compose up -d          # PostgreSQL on :5433, Redis on :6379
cd backend
npm install
npx prisma migrate dev
npm run dev
# API at http://localhost:3000/api/v1
# Swagger at http://localhost:3000/api/docs
```

### Android app
```bash
cd android
npm install
npm start                     # Expo dev server
# Scan QR with Expo Go, or press 'a' for Android emulator
```

### Design reference
```bash
cd design
pnpm install
pnpm dev                      # opens at http://localhost:8443
```

## API providers

**Football:**
- [Goal API](https://goal-api.com) — primary, 1,000 requests/day (free tier), hard stop at 90% (900)
- [API-Football](https://www.api-football.com) — secondary, 100 req/day free
- [football-data.org](https://www.football-data.org) — fixtures/schedules, 10 req/min
- [TheSportsDB](https://www.thesportsdb.com) — live fallback, unlimited free tier

**Cricket:**
- [CricketData (cricapi.com)](https://cricketdata.org) — 100 req/day free (supports two keys)

## Docs
- [Architecture](docs/ARCHITECTURE.md)
- [API Providers](docs/API_PROVIDERS.md)
- [Development](docs/DEVELOPMENT.md)
