# Completion Report — Goal API Pass-Through Proxy Rearchitecture

**Task:** `task-proxy-rearchitecture`
**Branch:** `rearchitect-goal-api-proxy`
**Base SHA:** `5050b2ebdcb4b73cb7e343e61f0153f1af370478`
**Head SHA:** `66ed69ada0f70a51a548c99a265178f32f912f24`
**Review verdict:** APPROVED (`review.json`)

This rearchitecture rebuilt the Score Koto football data path from a sync-and-store system into a stateless Goal API pass-through proxy. Every football read endpoint now calls Goal API directly on each request, with no database storage, no multi-provider merge layer, and no football sync crons. Cricket is untouched end to end. The build was previously broken (dead `src/common/app.module.ts`); this work restored it to a clean compile.

## The rearchitecture: sync-and-store → Goal API pass-through proxy

Before, football data was fetched on a schedule by `SyncService`, merged across multiple providers, and persisted into a `FootballMatch` Prisma table that every read endpoint queried. That indirection was the root cause of the original user complaint — the home carousel, fixtures page, and match detail were all reading from a periodically-stale DB instead of the live API, so a match stuck at `5'` in the DB would show `5'` across the app until the next sync.

Now `FootballService` is a thin pass-through. Each read method calls `GoalApiProvider` and returns normalized rows directly:

- `getLive()` — merges Goal API `/fixtures/live` with `/results/today`, dedupes by `id` (live first).
- `getFixtures()` — Goal API `getByDate(today)` filtered to `status === 'NS'` and `kickoff >= now`, sorted ascending, capped at 50.
- `getResults()` — Goal API `getResultsToday()`.
- `getByDate(date)` — Goal API `getByDate(date)`.
- `getMatchDetail(id)` — `:id` is the Goal API fixture id; fans out `getFixtureNormalized`, `getEvents`, `getStatistics`, `getLineups`, and `getCommentary` in parallel (each resiliently caught), throws `NotFoundException` if the fixture is absent, and returns `{ match, events, statistics, lineups, commentary, goalApiAvailable: true }`.
- `getStandings`, `getTeam`, `getTeamSquad`, `getTeamResults`, `getTeamFixtures`, `getTopLeagues` — unchanged (already proxied Goal API).
- `getProviderStatuses()` — returns `[this.goalApi.status]`.

`FootballService` no longer injects `PrismaService`, `FootballProviderManager`, or `match-identity`, and drops `OnApplicationBootstrap` plus all sync/merge/cleanup/upsert/logSync methods.

## Database: cricket + sync logs + api-usage only (FootballMatch removed)

The `FootballMatch` model was removed from `backend/prisma/schema.prisma`. The DB now stores only:

- `CricketMatch`, `CricketScorecard` — cricket's DB-backed flow, untouched.
- `SyncLog` — cricket still logs syncs; the football live-push timer writes nothing.
- `ApiUsage` — retained so `QuotaService` / `QuotaModule` still compile (removing them was out of scope).

The Prisma client was regenerated via `npx prisma generate`, which removed `prisma.footballMatch`. No remaining code references `prisma.footballMatch`.

## Every football endpoint reads Goal API directly

There is no football data store other than Goal API itself. Every `GET /football/*` route hits Goal API on demand, so every screen reading football pulls the same fresh data at the same moment. The remaining football cron is a **push-only** timer, not a persistence job: `SyncService.syncFootballLive()` (cron `*/2 * * * *`) calls `this.football.getLive()` and forwards the result to `liveGateway.pushFootballUpdate(matches)` over the WebSocket — no DB writes. This is what keeps the home carousel, live page, and match detail in step with live Goal API data in real time.

Goal API endpoints used: `/fixtures/live`, `/fixtures/date/:date`, `/results/today`, `/fixtures/:id`, `/fixtures/:id/events`, `/fixtures/:id/lineups`, `/fixtures/:id/statistics`, `/fixtures/:id/commentary`, `/standings/:leagueId`, `/teams/:id`, `/teams/:id/players`, `/teams/:id/results`, `/teams/:id/upcoming`. Goal API has no daily quota, so direct per-request reads are safe.

## Frontend match identifier is now the goalApiId

`GoalApiProvider.normalize()` sets both `id: f.id` and `goalApiId: f.id` on every normalized match, and all four read paths (`getLive`, `getByDate`, `getResultsToday`, `getFixtureNormalized`) flow through `normalize()`, so the invariant `m.id === m.goalApiId` holds on every list row and on the match-detail `match` object. This lets the frontend keep its existing `m.id`-based code (React keys, `dedupeMatches`, `sameMatch`, navigation) working unchanged while navigation passes the goalApiId to `/football/matches/:id`.

In `android/src/services/api.ts`, `FootballMatch.goalApiId` became required (`goalApiId: string`) and `getMatch` takes a `goalApiId` parameter. Frontend data-flow updates:

- `FixturesScreen.tsx` — removed the 2-minute `setInterval` polling and the `selectedDateRef`; kept load-on-mount plus pull-to-refresh (`RefreshControl`). The user's "no refresh toggle pulling from top on fixture page" gap is closed.
- `LiveScreen.tsx` — swapped `fixEarlyLive` for `cleanLive` in both the REST `load` and the WebSocket `onFootballUpdate`, so the live page shows only truly live matches even though `/football/live` also returns recently-finished matches.
- `HomeScreen.tsx` — removed a DEV-only competition-name debug `useEffect`; the live path already filtered through `cleanLive` and now receives fresh Goal API pushes every 2 min.
- `MatchDetailScreen.tsx` — no logic change; updated the stale `LIVE_REFRESH_MS` comment (the backend now proxies directly with no quota limit, so the 60s live refresh is safe). `LIVE_REFRESH_MS = 60_000` kept.

## What was removed

- **Secondary football providers** — `backend/src/providers/api-football.provider.ts`, `football-data.provider.ts`, `thesportsdb.provider.ts`, and the `football-provider.manager.ts` merge layer were deleted. `providers.module.ts` now registers/exports only `GoalApiProvider` and `CricketProviderManager`.
- **Football sync crons** — `syncFootballToday`, `syncGoalApiResults`, and `syncUpcoming` were removed from `sync.service.ts`. The football today/results/upcoming jobs are gone because there is nothing to persist. `syncFootballLive` was rewritten as a push-only timer (no DB writes).
- **Football sync POST routes** — the four `@Post('sync/...')` handlers (`sync/live`, `sync/today`, `sync/date/:date`, `sync/upcoming`) and the unused `Post` import were removed from `football.controller.ts`.
- **Dead `src/common/app.module.ts`** — a duplicate of the root module with wrong import paths that produced six `TS2307 Cannot find module` errors and broke `npm run build`. Deleted; the build now passes.
- **`FootballMatch` Prisma model** — removed from the schema; `PrismaService` dropped from `FootballModule` providers.

Net result: 464 insertions, 1149 deletions across 29 files.

## Files changed

Commits on the branch (`git log --oneline <base>...HEAD`):

```
66ed69a (HEAD -> rearchitect-goal-api-proxy) FEAT-003: docs reflect Goal API proxy architecture
2f58842 FEAT-002: frontend data-flow updates
d8aca32 FEAT-001: backend Goal API pass-through proxy
ec1b600 chore: record base sha for proxy rearchitecture
```

Diff stat (`git diff --stat <base>...HEAD`):

```
 .agents/tasks/proxy-rearchitecture/base.sha        |   1 +
 .agents/tasks/proxy-rearchitecture/context.json    |  38 ++
 .../proxy-rearchitecture/features/FEAT-001.json    |  36 ++
 .../proxy-rearchitecture/features/FEAT-002.json    |  27 ++
 .../proxy-rearchitecture/features/FEAT-003.json    |  26 ++
 .agents/tasks/proxy-rearchitecture/plan.md         | 143 +++++++
 .agents/tasks/proxy-rearchitecture/task.json       |   7 +
 PROGRESS.md                                        |  65 ++--
 android/src/screens/FixturesScreen.tsx             |  26 +-
 android/src/screens/HomeScreen.tsx                 |   7 -
 android/src/screens/LiveScreen.tsx                 |   6 +-
 android/src/screens/MatchDetailScreen.tsx          |   4 +-
 android/src/services/api.ts                        |   4 +-
 backend/prisma/schema.prisma                       |  34 --
 backend/src/common/app.module.ts                   |  23 --   (deleted)
 backend/src/football/football.controller.ts        |  18 +-
 backend/src/football/football.module.ts            |   3 +-
 backend/src/football/football.service.ts           | 398 +++------------------
 backend/src/providers/api-football.provider.ts     | 122 -------  (deleted)
 backend/src/providers/football-data.provider.ts    | 117 ------   (deleted)
 backend/src/providers/football-provider.manager.ts| 162 --------- (deleted)
 backend/src/providers/goal-api.provider.ts         |   9 +
 backend/src/providers/provider.types.ts            |   2 +
 backend/src/providers/providers.module.ts          |  19 +-
 backend/src/providers/thesportsdb.provider.ts      |  75 ----    (deleted)
 backend/src/sync/sync.service.ts                   |  34 +-
 docs/API_PROVIDERS.md                              |  74 +--
 docs/ARCHITECTURE.md                               |  89 ++---
 docs/DEVELOPMENT.md                                |  44 +--
 29 files changed, 464 insertions(+), 1149 deletions(-)
```

Code changes by area:

- **Backend providers** — deleted `api-football.provider.ts`, `football-data.provider.ts`, `football-provider.manager.ts`, `thesportsdb.provider.ts`; slimmed `providers.module.ts`; added `id` + `lastSyncedAt` to `NormalizedFootballMatch` in `provider.types.ts`; added `id: f.id`, `lastSyncedAt: new Date()`, and `getFixtureNormalized()` to `goal-api.provider.ts`.
- **Backend football** — rewrote `football.service.ts` as a stateless proxy; removed sync POST routes from `football.controller.ts`; dropped `PrismaService` from `football.module.ts`.
- **Backend sync** — gutted `sync.service.ts` to cricket sync + a football live-push timer.
- **Backend schema** — removed `FootballMatch` from `prisma/schema.prisma`.
- **Backend dead file** — deleted `src/common/app.module.ts`.
- **Frontend** — `api.ts` (goalApiId required, `getMatch` param), `FixturesScreen.tsx` (polling removed), `LiveScreen.tsx` (`cleanLive`), `HomeScreen.tsx` (debug log removed), `MatchDetailScreen.tsx` (comment).
- **Docs** — `ARCHITECTURE.md`, `API_PROVIDERS.md`, `DEVELOPMENT.md`, `PROGRESS.md` rewritten to describe the pass-through proxy architecture, the two-cron schedule, the single Goal API football provider, and the removed football sync POST routes.

## Verification results

- **Backend build:** `cd backend && npm run build` → `nest build` completed with **0 errors**. (Previously 6 `TS2307 Cannot find module './common/...'` errors from the dead `src/common/app.module.ts`; those are gone.)
- **Frontend typecheck:** `cd android && npx tsc --noEmit` → **exit 0**.
- **Prisma:** `npx prisma generate` succeeded, regenerating the client and removing `prisma.footballMatch`.

There are no automated tests in the repo (no `.spec.ts`); verification rests on compilation. Not covered by automated tests and worth end-to-end coverage in a follow-up: the live WebSocket push delivering fresh Goal API data to connected clients, and `/football/matches/:id` fanning out events/statistics/lineups/commentary for a real fixture id.

## Cricket untouched

No file under `backend/src/cricket/` was modified, and `cricket-provider.manager.ts` is unchanged. `CricketService`, `CricketController`, `CricketModule`, and the `*/5` cricket cron (throttled to 30 min when idle) are byte-for-byte the same. Cricket keeps its existing DB-backed flow.

## Non-blocking housekeeping note

`backend/src/football/match-identity.ts` is now an orphan — no importer after the sync/merge code was deleted. It compiles standalone (the build is clean) and was intentionally retained for a later cleanup. Safe to delete in a follow-up; not a correctness or runtime concern.
