# Architecture

## System overview

```
Android App (React Native / Expo)
    │
    │  REST (JSON) + WebSocket (Socket.IO)
    ▼
NestJS Backend
    │
    ├── Football  ──► Goal API (api.goal-api.com)   ← pass-through proxy, no DB storage
    │                 sole football provider, no daily quota
    │
    ├── Cricket   ──► CricketData (api.cricapi.com/v1) ──► PostgreSQL (cricket data)
    │                 100 req/day × keys, persisted
    │
    └── PostgreSQL (cricket data, sync logs, API-usage tracking)
        Redis (in docker-compose, not yet actively used)
```

Football is served as a **Goal API pass-through proxy**: every football endpoint reads Goal API directly on each request and returns the normalized result. No football match data is stored in the database, results are not merged across providers, and there is no server-side cache. Cricket is still synced on a schedule and persisted in PostgreSQL. The Android app never contacts external sports APIs directly — every request goes through the backend.

The match `id` used throughout the system **is the Goal API fixture id** (`goalApiId`). It flows unchanged from Goal API → backend normalization (`id = goalApiId`) → frontend (React keys, `dedupeMatches`, `sameMatch`, navigation) → back to `/football/matches/:id` for detail. This single id keeps every screen referencing the same match in lock-step.

---

## Android app

**Language:** TypeScript
**Framework:** React Native 0.88.1 + Expo ~58
**Navigation:** React Navigation 7 (NativeStack + BottomTabs)
**HTTP client:** Axios
**WebSocket client:** socket.io-client

### File structure
```
android/
  App.tsx                   App root — fonts, theme, navigation
  index.ts                  Expo entry point
  src/
    navigation/
      RootNavigator.tsx     NativeStack: Tabs + MatchDetail + Fixtures + Standings + Team
      TabNavigator.tsx      5-tab bar: Home, Live, Explore, Favorites, Profile
    screens/                One file per screen
    components/
      layout/               TopBar, SectionHeader
      match/                FootballMatchRow, CricketMatchRow, DateStrip, FilterBar, StatBar
      ui/                   Icon, LiveDot, TeamBadge, Toggle
    hooks/
      useAppColors.ts       Theme context (light/dark, AsyncStorage-persisted)
      useLiveUpdates.ts     Socket.IO WebSocket connection
      useFollowing.ts       Follow list (AsyncStorage-persisted)
    services/
      api.ts                Axios client + typed API functions
    constants/
      colors.ts             Light + dark palettes + primary red
      typography.ts         Font family name constants
      teams.ts              Hardcoded team short names + badge colours
    types/
      index.ts              Shared TypeScript types
```

### Data flow
```
Screen
  └── useEffect + useState
        ├── services/api.ts (REST polls + initial load)
        └── useLiveUpdates  (WebSocket push: football:live, cricket:live)
```

---

## Backend

**Framework:** NestJS 10 (TypeScript)
**ORM:** Prisma 5
**Database:** PostgreSQL 16
**Scheduler:** `@nestjs/schedule` (Cron)
**WebSocket:** Socket.IO via `@nestjs/platform-socket.io`
**API docs:** Swagger (`@nestjs/swagger`) at `/api/docs`

### Module graph
```
AppModule
  ├── ConfigModule (global)
  ├── ScheduleModule
  ├── QuotaModule (@global; provides PrismaService + QuotaService)
  ├── FootballModule
  │     ├── FootballController
  │     ├── FootballService        ← Goal API pass-through proxy (no PrismaService)
  │     └── → ProvidersModule
  ├── CricketModule
  │     ├── CricketController
  │     ├── CricketService
  │     ├── PrismaService
  │     └── → ProvidersModule
  ├── HealthModule
  │     ├── HealthController
  │     ├── PrismaService
  │     └── → FootballModule, CricketModule
  ├── LiveModule
  │     └── LiveGateway (Socket.IO)
  └── SyncModule
        └── SyncService (Cron jobs)
              └── → FootballService, CricketService, LiveGateway

ProvidersModule (imported by FootballModule + CricketModule)
  ├── GoalApiProvider            ← sole football provider
  └── CricketProviderManager     ← wraps CricketData with multi-key rotation
```

The secondary football providers (API-Football, football-data.org, TheSportsDB) and the `FootballProviderManager` merge/dedup layer have been removed. `ProvidersModule` now exposes only `GoalApiProvider` and `CricketProviderManager`.

### Data model — football

Football has **no database model**. `FootballService` is a stateless pass-through: each method calls `GoalApiProvider` and returns normalized `NormalizedFootballMatch` objects directly to the controller, which serializes them to the client. Nothing is upserted or cached. Each normalized match carries `id`, which equals the Goal API fixture id (`goalApiId`), plus `lastSyncedAt` (when Goal API returned the row).

### Database schema summary
| Model | Key fields |
|-------|-----------|
| `CricketMatch` | `providerId` (unique), teams, score (JSON), matchStarted/matchEnded |
| `CricketScorecard` | per-innings batting/bowling JSON, FK → CricketMatch |
| `SyncLog` | provider, job, status, records, error, createdAt |
| `ApiUsage` | provider + date (unique), requests, limit |

There is **no `FootballMatch` model** — football is never persisted. `SyncLog` is written by the cricket sync job only; the football live-push timer does not write to the DB.

### Sync schedule
| Job | Cron | Min gap | Notes |
|-----|------|---------|-------|
| Football live-push | `*/2 * * * *` | 2 min | Fetches live matches from Goal API and pushes them to WebSocket. No DB writes. |
| Cricket | `*/5 * * * *` | 5 min active / 30 min idle | Syncs current matches to the DB and pushes live matches to WebSocket. Throttles automatically. |

The football today/goalapi-results/upcoming sync jobs are gone — there is no football data to sync. `SyncService` now runs only the two jobs above.

### WebSocket events
| Event | Direction | Payload |
|-------|-----------|---------|
| `football:live` | server → client | live football matches from Goal API (NormalizedFootballMatch[]) |
| `cricket:live` | server → client | `CricketMatch[]` from DB |

---

## Network / security

- API keys stored in `backend/.env` only; never sent to the Android app
- Android app connects to the backend via LAN IP (hardcoded in `api.ts` and `useLiveUpdates.ts`)
- Backend CORS is open (`origin: '*'`) — development configuration
- Cleartext HTTP is used (no TLS in local dev)
