# Architecture

## System overview

```
Android App (React Native / Expo)
    │
    │  REST (JSON) + WebSocket (Socket.IO)
    ▼
NestJS Backend  ──►  PostgreSQL (match data, sync logs, API usage)
    │           ──►  Redis (in docker-compose, not yet actively used)
    │
    │  HTTP (server-side, rate-limited)
    ▼
External Sports APIs
  Goal API         (api.goal-api.com)
  API-Football     (v3.football.api-sports.io) — 100 req/day
  football-data.org (api.football-data.org/v4) — 10 req/min
  TheSportsDB      (thesportsdb.com)           — unlimited free
  CricketData      (api.cricapi.com/v1)        — 100 req/day × keys
```

The Android app never contacts external sports APIs directly. All provider requests run server-side, deduplicated, and persisted in PostgreSQL.

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
  ├── QuotaModule
  │     └── QuotaService — tracks API-Football usage in ApiUsage table
  ├── FootballModule
  │     ├── FootballController
  │     ├── FootballService
  │     └── → ProvidersModule, QuotaModule
  ├── CricketModule
  │     ├── CricketController
  │     ├── CricketService
  │     └── → ProvidersModule
  ├── HealthModule
  │     └── HealthController
  ├── LiveModule
  │     └── LiveGateway (Socket.IO)
  └── SyncModule
        └── SyncService (Cron jobs)
              └── → FootballService, CricketService, LiveGateway

ProvidersModule (imported by FootballModule + CricketModule)
  ├── GoalApiProvider
  ├── ApiFootballProvider
  ├── FootballDataProvider
  ├── TheSportsDbProvider
  ├── FootballProviderManager   ← merges + deduplicates football
  └── CricketProviderManager    ← wraps CricketData with multi-key rotation
```

### Database schema summary
| Model | Key fields |
|-------|-----------|
| `FootballMatch` | `providerId` (unique), `goalApiId`, teams, scores, status, kickoff, competition |
| `CricketMatch` | `providerId` (unique), teams, score (JSON), matchStarted/matchEnded |
| `CricketScorecard` | per-innings batting/bowling JSON, FK → CricketMatch |
| `SyncLog` | provider, job, status, records, error, createdAt |
| `ApiUsage` | provider + date (unique), requests, limit |

### Provider deduplication

`FootballProviderManager` merges results from all providers. A match is considered a duplicate if the home and away team names and the kickoff date all match (using substring matching to handle minor name differences). When a Goal API match and an API-Football match refer to the same fixture, the `goalApiId` from Goal API is copied onto the existing record.

### Sync schedule
| Job | Cron | Min gap | Notes |
|-----|------|---------|-------|
| Live football | `*/2 * * * *` | 2 min | Always runs; pushes to WebSocket |
| Today fixtures | `0 7,15 * * *` | — | Twice daily |
| Goal API results | `0 * * * *` | 55 min | Carries goalApiId |
| Upcoming 7 days | `0 6 * * *` | — | football-data.org |
| Cricket | `*/5 * * * *` | 5 min active / 30 min idle | Throttles automatically |

### WebSocket events
| Event | Direction | Payload |
|-------|-----------|---------|
| `football:live` | server → client | `FootballMatch[]` |
| `cricket:live` | server → client | `CricketMatch[]` |

---

## Network / security

- API keys stored in `backend/.env` only; never sent to the Android app
- Android app connects to the backend via LAN IP (hardcoded in `api.ts` and `useLiveUpdates.ts`)
- Backend CORS is open (`origin: '*'`) — development configuration
- Cleartext HTTP is used (no TLS in local dev)
