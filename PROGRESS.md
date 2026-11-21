# Score Koto — Build Progress

## Current state (as of last commit: 32dc6fd "broken version")

The repo is at its first commit. Everything listed below is what currently exists in the working tree.

---

## What is built and working

### Backend — NestJS + PostgreSQL

- **NestJS** API running at `http://localhost:3000/api/v1`
- **PostgreSQL** via Docker Compose (port 5433 → 5432 inside container)
- **Redis** via Docker Compose (port 6379) — in docker-compose.yml but not actively used by any module yet
- **Prisma ORM** with 5 migrations applied (`init`, `add_logos`, `add_cricket_team_info`, `add_country_flag`, `add_goal_api_id`)
- **Swagger** docs at `http://localhost:3000/api/docs`

#### Modules
- `AppModule` — root module, loads ConfigModule, ScheduleModule, and all feature modules
- `FootballModule` — football CRUD + sync + match detail
- `CricketModule` — cricket CRUD + sync + scorecard
- `SyncModule` — scheduled background sync via `@nestjs/schedule` (Cron)
- `LiveModule` — Socket.IO WebSocket gateway
- `HealthModule` — health check + provider status + sync log endpoints
- `ProvidersModule` — all provider adapters
- `QuotaModule` / `QuotaService` — tracks API-Football daily quota in the `ApiUsage` table

#### Database schema (Prisma)
- `FootballMatch` — stores normalised match data from all football providers; includes `goalApiId` field for linking to Goal API match detail
- `CricketMatch` — stores normalised cricket match data from CricketData
- `CricketScorecard` — per-innings batting/bowling scorecard, related to `CricketMatch`
- `SyncLog` — records each sync job outcome (provider, job name, status, record count, error)
- `ApiUsage` — tracks API-Football requests per UTC day

#### Football providers (ProvidersModule)
- **GoalApiProvider** (`goal-api`) — primary; no daily quota; covers live, by-date, results, match events/stats/lineups/commentary, standings, team data
- **ApiFootballProvider** (`api-football`) — secondary; 100 req/day tracked in DB via QuotaService; live + by-date
- **FootballDataProvider** (`football-data`) — always-on; 10 req/min rate-limited; by-date + date-range; covers top 12 European competitions + WC/Copa Libertadores
- **TheSportsDbProvider** (`thesportsdb`) — fallback; live scores + team badge lookup
- **FootballProviderManager** — merges results from all providers; deduplicates by team name + date

#### Cricket providers (ProvidersModule)
- **CricketProviderManager** — wraps CricketData API; supports two API keys (primary + optional secondary); auto-rotates when first key quota is exhausted

#### Football REST endpoints (`/api/v1/football/...`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/live` | Live matches from DB |
| GET | `/fixtures` | Upcoming NS matches |
| GET | `/results` | Recent FT matches |
| GET | `/matches/:id` | Match + Goal API events/stats/lineups/commentary |
| GET | `/by-date/:date` | All matches for a date |
| GET | `/standings/:leagueId` | Standings from Goal API |
| GET | `/teams/:teamId` | Team profile from Goal API |
| GET | `/teams/:teamId/squad` | Squad from Goal API |
| GET | `/teams/:teamId/results` | Team results from Goal API |
| GET | `/teams/:teamId/fixtures` | Team upcoming fixtures from Goal API |
| GET | `/leagues/top` | Hardcoded list of top 10 leagues with Goal API IDs |
| POST | `/sync/live` | Trigger live sync |
| POST | `/sync/today` | Trigger today sync |
| POST | `/sync/date/:date` | Trigger sync for a specific date |
| POST | `/sync/upcoming` | Sync next 7 days via football-data.org |

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
| `football-live` | every 2 min | Syncs live matches + pushes via WebSocket; cleans stale live matches |
| `football-today` | 07:00 + 15:00 UTC | Syncs today's fixtures |
| `goalapi-results` | every hour | Syncs Goal API results (carries goalApiId) |
| `football-upcoming` | 06:00 UTC daily | Syncs next 7 days from football-data.org |
| `cricket` | every 5 min | Syncs current matches; throttles to every 30 min when nothing active |

#### WebSocket (LiveGateway)
- Socket.IO server at root path
- Emits `football:live` after every live sync
- Emits `cricket:live` after every cricket sync
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
| LiveScreen | `/football/live`, `/cricket/live` | Collapsible competition groups. WebSocket push + 30s poll |
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
| API-Football events/lineups on free plan | Not available; handled gracefully |
| Cricket ball-by-ball not on free CricketData plan | Scorecard only |
| Redis in docker-compose.yml but no Redis-backed cache module | In-memory quota tracking + DB persistence only |
| ProfileScreen data is hardcoded | No user accounts implemented |
| ExploreScreen live counts are hardcoded | No live sport counts wired to real data |
| `backend/src/common/app.module.ts` — duplicate of `backend/src/app.module.ts` | Dead file; `src/main.ts` imports from `src/app.module.ts` |
