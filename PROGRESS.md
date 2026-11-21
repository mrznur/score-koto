# Score Koto — Build Progress

## Current state

Football is served as a **Goal API pass-through proxy**: no football match data is stored in the database, and every football endpoint reads Goal API directly on each request. The secondary football providers (API-Football, football-data.org, TheSportsDB) and the `FootballProviderManager` merge layer have been removed. The sync cron is gutted to two jobs: a football live-push timer (Goal API → WebSocket) and cricket sync (DB-backed). Cricket remains synced and persisted. The dead `backend/src/common/app.module.ts` duplicate has been deleted so the backend builds.

---

## What is built and working

### Backend — NestJS + PostgreSQL

- **NestJS** API running at `http://localhost:3000/api/v1`
- **PostgreSQL** via Docker Compose (port 5433 → 5432 inside container)
- **Redis** via Docker Compose (port 6379) — in docker-compose.yml but not actively used by any module yet
- **Prisma ORM**; schema applied with `prisma db push` (historical migration folders retained)
- **Swagger** docs at `http://localhost:3000/api/docs`

#### Modules
- `AppModule` — root module, loads ConfigModule, ScheduleModule, and all feature modules
- `FootballModule` — Goal API pass-through proxy (no PrismaService, no DB)
- `CricketModule` — cricket CRUD + sync + scorecard (DB-backed)
- `SyncModule` — scheduled background sync via `@nestjs/schedule` (Cron)
- `LiveModule` — Socket.IO WebSocket gateway
- `HealthModule` — health check + provider status + sync log endpoints
- `ProvidersModule` — provider adapters (Goal API + CricketData only)
- `QuotaModule` / `QuotaService` — retained `@Global` module; provides PrismaService + QuotaService. No football provider writes to `ApiUsage` (Goal API has no quota); cricket quota is tracked in-memory in `CricketProviderManager`.

#### Database schema (Prisma)
- `CricketMatch` — stores normalised cricket match data from CricketData
- `CricketScorecard` — per-innings batting/bowling scorecard, related to `CricketMatch`
- `SyncLog` — records each sync job outcome (provider, job, status, record count, error). Written by the cricket sync job; the football live-push timer does not write here.
- `ApiUsage` — per-provider daily request tracking, retained from the multi-provider era (currently not actively written).

There is **no `FootballMatch` model** — football is never persisted.

#### Football providers (ProvidersModule)
- **GoalApiProvider** (`goal-api`) — sole football provider; no daily quota; pass-through for live, by-date, results, and match detail (events/stats/lineups/commentary), standings, and team data. Results are not cached or stored.

The API-Football, football-data.org, and TheSportsDB providers and the `FootballProviderManager` merge/dedup layer have been removed.

#### Cricket providers (ProvidersModule)
- **CricketProviderManager** — wraps CricketData API; supports two API keys (primary + optional secondary); auto-rotates when the first key quota is exhausted. Quota tracked in-memory (resets on restart).

#### Football REST endpoints (`/api/v1/football/...`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/live` | Live matches + today's results from Goal API (merged, deduped by id; live wins) |
| GET | `/fixtures` | Today's upcoming NS matches from Goal API (kickoff ≥ now, capped at 50) |
| GET | `/results` | Today's finished results from Goal API |
| GET | `/matches/:id` | Match + Goal API events/statistics/lineups/commentary; `:id` is the Goal API fixture id (`goalApiId`) |
| GET | `/by-date/:date` | All matches for a date from Goal API |
| GET | `/standings/:leagueId` | Standings from Goal API |
| GET | `/teams/:teamId` | Team profile from Goal API |
| GET | `/teams/:teamId/squad` | Squad from Goal API |
| GET | `/teams/:teamId/results` | Team results from Goal API |
| GET | `/teams/:teamId/fixtures` | Team upcoming fixtures from Goal API |
| GET | `/leagues/top` | Hardcoded list of top 10 leagues with Goal API IDs |

There are no football sync POST routes — football is a pass-through proxy, so every read is already live.

#### Cricket REST endpoints (`/api/v1/cricket/...`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/live` | Live cricket from DB |
| GET | `/fixtures` | Upcoming cricket from DB |
| GET | `/results` | Recent results from DB |
| GET | `/matches/:id` | Match + scorecard |
| GET | `/by-date/:date` | Matches for a date |
| POST | `/sync` | Trigger current matches sync |
| POST | `/matches/:id/sync-scorecard` | Sync scorecard for a match |

#### Health endpoints (`/api/v1/health/...`)
- `GET /` — DB connectivity check
- `GET /providers` — quota and availability for all providers
- `GET /sync` — last 20 sync log entries

#### Scheduled sync (SyncService)
| Job | Cron | Description |
|-----|------|-------------|
| `football-live` | every 2 min | Fetches live matches from Goal API and pushes via WebSocket. No DB writes. |
| `cricket` | every 5 min | Syncs current matches to DB; throttles to every 30 min when nothing active; pushes live matches via WebSocket. |

#### WebSocket (LiveGateway)
- Socket.IO server at root path
- Emits `football:live` after every football live-push tick (Goal API data)
- Emits `cricket:live` after every cricket sync (DB data)
- CORS open (`origin: '*'`)

---

### Android app — React Native (Expo)

**Stack:** React Native 0.88.1, Expo ~58, TypeScript, React Navigation 7, Axios, Socket.IO client

#### Navigation
```
RootNavigator (NativeStack)
  └── Tabs (TabNavigator — 5 bottom tabs)
        ├── Home
        ├── Live
        ├── Explore
        ├── Favorites
        └── Profile
  ├── MatchDetail  (pushed, no tab bar)
  ├── Fixtures     (pushed, no tab bar)
  ├── Standings    (pushed, no tab bar)
  └── Team         (pushed, no tab bar)
```

#### Screens
| Screen | Data source | Notes |
|--------|-------------|-------|
| HomeScreen | `/football/live`, `/cricket/live`, `/football/fixtures` | Hero match card, cricket card, live list, upcoming fixtures, sports grid. WebSocket push + 30s poll |
| LiveScreen | `/football/live`, `/cricket/live` | Live-only; collapsible competition groups. WebSocket push + 30s poll |
| FixturesScreen | `/football/by-date/:date`, `/cricket/by-date/:date` | Date strip, sport + status filters, region-grouped leagues |
| StandingsScreen | `/football/leagues/top`, `/football/standings/:leagueId` | Horizontal league selector, table with promotion colour bands |
| MatchDetailScreen | `/football/matches/:id` | 4 tabs: Overview, Stats, Lineup, Commentary. Auto-refresh every 60s when live |
| TeamScreen | `/football/teams/:teamId` + squad/results/fixtures | 4 tabs: Overview, Squad, Results, Fixtures. Follow/unfollow button |
| ExploreScreen | Static | Sports grid, tools menu (links to Fixtures + Standings), popular competitions list |
| FavoritesScreen | AsyncStorage | Follow/unfollow teams, players, competitions. Stored locally, no account required |
| ProfileScreen | Static | Hardcoded profile card, stats bar, favourites list, preferences (dark mode toggle wired) |

#### Components
- `FootballMatchRow` — match row with team logos + score + status
- `CricketMatchRow` — cricket match row
- `DateStrip` — horizontal scrollable date selector
- `FilterBar` — sport/status chip filters
- `StatBar` — horizontal stat bar for match statistics
- `SectionHeader` — numbered section header with optional action
- `TopBar` — screen header with eyebrow, title, optional back + action
- `Icon` — SVG icon set (home, live, explore, star, profile, bell, arrow, search, calendar, table, spark, chevron, settings)
- `LiveDot` — animated red dot with optional label
- `TeamBadge` — square badge with coloured left bar + Ndot-57 initial (fallback when no logo)
- `Toggle` — on/off toggle switch

#### Hooks
- `useAppColors` — theme context (light/dark); persisted to AsyncStorage; `ThemeProvider` wraps the app
- `useLiveUpdates` — Socket.IO connection to backend; calls `onFootballUpdate` / `onCricketUpdate` on push events
- `useFollowing` — AsyncStorage-backed follow list (teams, players, competitions)

#### Design system
- Background: light `#F4F4F2` / dark `#090909`
- Surface: light `#FFFFFF` / dark `#151515`
- Primary: `#D71920` (red)
- Fonts: Ndot-55, Ndot-57 (OTF local assets), Inter Tight 400/500/600, JetBrains Mono 400/500 (via `@expo-google-fonts`)
- Backend URL hardcoded: `http://192.168.0.109:3000/api/v1` (LAN IP — must match your machine)
- WebSocket URL hardcoded: `http://192.168.0.109:3000`

---

### Design prototype — `design/`

React + Vite + Tailwind CSS v4 app running in Figma Make. All screens present: Home, Live, Match centre, Fixtures, Standings, Explore, Friends, AI, Profile. This is a visual reference only and is not shipped.

---

## Known issues / decisions

| Issue | Decision |
|-------|----------|
| Backend URL is a hardcoded LAN IP in `android/src/services/api.ts` | Change `BASE_URL` and `SOCKET_URL` to match your machine's IP |
| Goal API events/lineups — data depends on provider coverage | Show "not provided" message when unavailable |
| Cricket ball-by-ball not on free CricketData plan | Scorecard only |
| Cricket quota tracked in-memory in `CricketProviderManager` | Resets on backend restart; no daily persistence (ApiUsage table retained but unused) |
| Redis in docker-compose.yml but no Redis-backed cache module | Not actively used; football has no cache by design (pass-through proxy) |
| ProfileScreen data is hardcoded | No user accounts implemented |
| ExploreScreen live counts are hardcoded | No live sport counts wired to real data |
