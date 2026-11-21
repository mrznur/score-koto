# Implementation Plan — Goal API Pass-Through Proxy Rearchitecture

Rearchitect the Score Koto backend from a sync-and-store system to a Goal API pass-through proxy. The DB keeps cricket data, sync logs, and api-usage tracking; it no longer stores football matches. Every football endpoint reads Goal API directly on every request. The frontend's match identifier becomes the Goal API fixture id (`goalApiId`).

## Key design decision (id resolution)

The frontend uses `m.id` everywhere (React keys, `dedupeMatches`, `sameMatch`, navigation). The Goal API `normalize()` currently returns `providerId` and `goalApiId` but **no `id`**. Rather than mass-rename `m.id` → `m.goalApiId` across the frontend (high risk), the backend `normalize()` will set **`id = f.id`** (the Goal API fixture id) and **`lastSyncedAt = new Date()`** on every normalized football match. Result: `m.id === m.goalApiId`, so the frontend's existing `m.id`-based code keeps working unchanged and navigation passes the goalApiId. The `goalApiId` field is also kept (explicitly required by the task). `lastSyncedAt` preserves the frontend's "UPDATED/SYNCED" timestamps and `dedupeMatches` freshness logic.

`/football/matches/:id` treats `:id` as the Goal API fixture id and fetches detail directly from Goal API (no DB lookup). There is no internal DB id after the rearchitecture, so "handle both internal id OR goalApiId" resolves to: param is the goalApiId; if Goal API has no such fixture, return 404.

## Goal API fields (from `goal-api.provider.ts` normalize())

`f.id`→goalApiId/id, `f.homeTeamName`, `f.awayTeamName`, `f.homeTeamId`, `f.awayTeamId`, `f.teamHomeBadge`/`f.teamAwayBadge`→logos, `f.homeTeamFtScore`||`f.homeTeamScore`→homeScore, `f.awayTeamFtScore`||`f.awayTeamScore`→awayScore, `f.matchStatus`→STATUS_MAP→status, `f.matchMinute`→elapsed, `f.leagueName`→competition, `f.leagueId`→competitionId, `f.leagueLogo`→competitionLogo, `f.countryName`→country, `f.countryLogo`→countryFlag, `f.leagueYear`→season, `f.matchRound`→round, `f.matchStadium`→venue, `f.kickoffUtc`||`f.matchDate`→kickoff.

## Goal API endpoints used

`/fixtures/live`, `/fixtures/date/:date`, `/results/today`, `/fixtures/:id`, `/fixtures/:id/events`, `/fixtures/:id/lineups`, `/fixtures/:id/statistics`, `/fixtures/:id/commentary`, `/standings/:leagueId`, `/teams/:id`, `/teams/:id/players`, `/teams/:id/results`, `/teams/:id/upcoming`.

---

## Backend (FEAT-001)

- [ ] 1. Delete the dead `src/common/app.module.ts` (duplicate with wrong import paths; the build is currently broken because of it — `src/main.ts` uses `src/app.module.ts`).
      Files: backend/src/common/app.module.ts (delete)
      Verify: `cd backend && npm run build` — the 6 "Cannot find module './common/...'" errors are gone (build may still fail later for other reasons until the rest of the FEAT lands; this step removes those specific errors).

- [ ] 2. Remove the `FootballMatch` model from the Prisma schema. Keep `CricketMatch`, `CricketScorecard`, `SyncLog` (cricket still logs syncs), and `ApiUsage` (retained — `QuotaService`/`QuotaModule` still compile; removing them is out of scope churn).
      Files: backend/prisma/schema.prisma
      Verify: `npx prisma format` (validates schema syntax); `npx prisma generate` (regenerates the client, removing `prisma.footballMatch`).

- [ ] 3. Add `id: string` and `lastSyncedAt: Date` to `NormalizedFootballMatch` so the proxy output matches the frontend `FootballMatch` contract.
      Files: backend/src/providers/provider.types.ts
      Verify: `npm run build` compiles.

- [ ] 4. Update `goal-api.provider.ts` `normalize()` to include `id: f.id` and `lastSyncedAt: new Date()` in the returned object. Add a public `getFixtureNormalized(fixtureId)` method that calls `getFixtureDetail` and returns the normalized match (or null) — used by match detail. Keep all existing methods/endpoints.
      Files: backend/src/providers/goal-api.provider.ts
      Verify: `npm run build` compiles.

- [ ] 5. Delete the secondary football providers and the football provider manager; slim `providers.module.ts` to only `GoalApiProvider` + `CricketProviderManager`.
      Files: delete backend/src/providers/football-provider.manager.ts, football-data.provider.ts, api-football.provider.ts, thesportsdb.provider.ts; edit backend/src/providers/providers.module.ts
      Verify: `npm run build` compiles (no dangling imports of the deleted classes).

- [ ] 6. Rewrite `football.service.ts` as a Goal API pass-through. Constructor injects only `GoalApiProvider` (drop `PrismaService`, `FootballProviderManager`, `OnApplicationBootstrap`, `match-identity`). Remove all sync/merge/cleanup/upsert/hasActivity/logSync/getMatch-simple methods. Implement:
  - `getLive()`: `Promise.all([goalApi.getLive(), goalApi.getResultsToday()])`, dedupe by `id` (live first), return.
  - `getFixtures()`: `goalApi.getByDate(today)` filtered to `status === 'NS'` and `kickoff >= now`, sorted asc, `take 50`.
  - `getResults()`: `goalApi.getResultsToday()`.
  - `getByDate(date)`: `goalApi.getByDate(date)`.
  - `getMatchDetail(id)`: `:id` is the goalApiId; `Promise.all([goalApi.getFixtureNormalized(id), goalApi.getEvents(id), goalApi.getStatistics(id), goalApi.getLineups(id), goalApi.getCommentary(id)])` (each `.catch(()=>...)`); throw `NotFoundException` if `match` is null; return `{ match, events, statistics, lineups, commentary, goalApiAvailable: true }`.
  - `getStandings/getTeam/getTeamSquad/getTeamResults/getTeamFixtures/getTopLeagues`: keep as-is (already proxy Goal API).
  - `getProviderStatuses()`: return `[this.goalApi.status]`.
      Files: backend/src/football/football.service.ts
      Verify: `npm run build` compiles.

- [ ] 7. Remove the four football sync POST routes from `football.controller.ts` (`sync/live`, `sync/today`, `sync/date/:date`, `sync/upcoming`) and the unused `Post` import. Keep all GET routes.
      Files: backend/src/football/football.controller.ts
      Verify: `npm run build` compiles.

- [ ] 8. Drop `PrismaService` from `football.module.ts` providers (FootballService no longer injects it). Keep `ProvidersModule` import + `FootballService` provider/export.
      Files: backend/src/football/football.module.ts
      Verify: `npm run build` compiles.

- [ ] 9. Gut `sync.service.ts` to keep only cricket sync + a football live-push timer. `syncFootballLive()` (cron `*/2 * * * *`): `const matches = await this.football.getLive(); this.liveGateway.pushFootballUpdate(matches);` — no DB writes, no results/cleanup sub-calls. Remove `syncFootballToday`, `syncGoalApiResults`, `syncUpcoming`. Keep `syncCricket` and `runJob` unchanged.
      Files: backend/src/sync/sync.service.ts
      Verify: `npm run build` compiles.

- [ ] 10. Apply the schema change to the DB and regenerate the client: `npx prisma generate` then `npx prisma db push` (db push needs the Postgres container up via `docker compose up -d`; if the DB is unavailable, `prisma generate` alone is enough for the build).
      Files: (no file edit — runs prisma)
      Verify: `npx prisma generate` succeeds; `npm run build` passes with 0 errors (the FEAT-001 completion gate).

## Frontend (FEAT-002)

- [ ] 11. `api.ts`: make `goalApiId` required in `FootballMatch` (`goalApiId: string` — always present from the proxy); keep `id: string` (= goalApiId). Rename `getMatch`'s param to `goalApiId` for clarity. Keep all other endpoints.
      Files: android/src/services/api.ts
      Verify: `cd android && npx tsc --noEmit` passes.

- [ ] 12. `FixturesScreen.tsx`: remove the 2-minute polling `useEffect` (the `setInterval(... 2 * 60_000)` block) and the now-unused `selectedDateRef`. Keep pull-to-refresh (`RefreshControl`) and load-on-mount. Keep `fixEarlyLive` (defensive).
      Files: android/src/screens/FixturesScreen.tsx
      Verify: `npx tsc --noEmit` passes.

- [ ] 13. `LiveScreen.tsx`: ensure the live page shows ONLY live matches (user requirement: "live page will only show live and ongoing matches"). Since `/football/live` now returns live + recently finished, filter to live-only in both the REST `load` and the `onFootballUpdate` WebSocket handler: replace `dedupeMatches(fixEarlyLive(...))` with `dedupeMatches(cleanLive(...))` and import `cleanLive` from `../utils/featured`.
      Files: android/src/screens/LiveScreen.tsx
      Verify: `npx tsc --noEmit` passes.

- [ ] 14. `HomeScreen.tsx`: remove the DEV-only competition-name debug `useEffect` (DB-debugging artifact). Keep the 30s poll, WebSocket (`cleanLive` already filters `liveFootball`), `buildFeatured`, `nearbyFootball` (by-date) for results/upcoming. The data flow now works with direct Goal API data.
      Files: android/src/screens/HomeScreen.tsx
      Verify: `npx tsc --noEmit` passes.

- [ ] 15. `MatchDetailScreen.tsx`: verify it works with goalApiId — navigation already passes `m.id` (now = goalApiId) and the screen calls `footballApi.getMatch(matchId)`, so no logic change is required. Update the stale comment that says "Keep [refresh] at 0 until the backend caches match details" — the backend now proxies directly with no quota limit, so the 60s live refresh is safe. Keep `LIVE_REFRESH_MS = 60_000`.
      Files: android/src/screens/MatchDetailScreen.tsx
      Verify: `npx tsc --noEmit` passes.

## Docs (FEAT-003)

- [ ] 16. Update `docs/ARCHITECTURE.md`: Goal API is the single source of truth for football; no football match storage; `FootballService` is a pass-through proxy; secondary providers removed; `SyncService` keeps cricket sync + a football live-push timer; WebSocket pushes Goal API live data; DB stores cricket + sync logs + api-usage. Rewrite the module graph, schema table, sync schedule table, and data-flow diagram.
      Files: docs/ARCHITECTURE.md
      Verify: docs readthrough — no sync-cron/DB-football references remain.

- [ ] 17. Update `docs/API_PROVIDERS.md`: remove the API-Football, football-data.org, and TheSportsDB sections (deleted). Keep Goal API (now the sole football provider) and Cricket. Update the quota budget table and note the pass-through proxy architecture.
      Files: docs/API_PROVIDERS.md
      Verify: docs readthrough — no deleted-provider sections remain.

- [ ] 18. Update `docs/DEVELOPMENT.md`: remove the manual football sync curl commands; update the env-var table (FOOTBALL_API_KEY / FOOTBALL_DATA_KEY no longer needed for football); update the project-state checklist and data-flow description.
      Files: docs/DEVELOPMENT.md
      Verify: docs readthrough — sync commands and env requirements match the new architecture.

- [ ] 19. Update `PROGRESS.md`: reflect football = Goal API proxy, no DB football storage, removed secondary providers, gutted sync cron (cricket + live-push), and the new endpoint table (no football sync POST routes).
      Files: PROGRESS.md
      Verify: docs readthrough — endpoint table and provider list match the code.

- [ ] 20. Confirm docs edits did not touch code: `cd backend && npm run build` and `cd android && npx tsc --noEmit` both still pass.

## Completion report

- [ ] 21. Write the completion report to `f:\Score Koto\.agents\tasks\proxy-rearchitecture.md` summarizing: what changed, files touched, the new football data flow (direct Goal API proxy), what was removed, and verification results (backend build + frontend typecheck pass).

---

## Digest

Files touched and the block to change (signatures + line anchors from the files as read):

- **backend/src/common/app.module.ts** — DELETE the whole file. Fixes the 6 `TS2307 Cannot find module './common/...'` errors that currently break `npm run build`.
- **backend/prisma/schema.prisma** — DELETE the `model FootballMatch { ... }` block (lines ~8–35). Keep CricketMatch, CricketScorecard, SyncLog, ApiUsage.
- **backend/src/providers/provider.types.ts** — `interface NormalizedFootballMatch { providerId; ...; kickoff: Date }` → add `id: string;` and `lastSyncedAt: Date;`.
- **backend/src/providers/goal-api.provider.ts** — `private normalize(f)` return object: add `id: f.id,` and `lastSyncedAt: new Date(),`. Add `async getFixtureNormalized(fixtureId: string) { const f = await this.getFixtureDetail(fixtureId); return f ? this.normalize(f) : null; }`.
- **DELETE** backend/src/providers/football-provider.manager.ts, football-data.provider.ts, api-football.provider.ts, thesportsdb.provider.ts.
- **backend/src/providers/providers.module.ts** — remove imports/providers/exports of `ApiFootballProvider`, `FootballDataProvider`, `TheSportsDbProvider`, `FootballProviderManager`. Keep `GoalApiProvider`, `CricketProviderManager`. Drop the now-unused `ApiFootballProvider` etc.
- **backend/src/football/football.service.ts** — full rewrite per step 6. New read methods proxy `this.goalApi`. Constructor `constructor(private goalApi: GoalApiProvider) {}`. Drop `implements OnApplicationBootstrap`, `PrismaService`, `FootballProviderManager`, `match-identity` import, all sync/merge/cleanup methods.
- **backend/src/football/football.controller.ts** — remove the 4 `@Post('sync/...')` handlers + `Post` import. Keep GET handlers.
- **backend/src/football/football.module.ts** — `providers: [FootballService]` (remove `PrismaService`); keep `imports: [ProvidersModule]`, `exports: [FootballService]`.
- **backend/src/sync/sync.service.ts** — `syncFootballLive()` body becomes `const matches = await this.football.getLive(); this.liveGateway.pushFootballUpdate(matches);`. Delete `syncFootballToday`, `syncGoalApiResults`, `syncUpcoming`. Keep `syncCricket`, `runJob`.
- **backend/src/health/health.controller.ts** — NO change. `getProviderStatuses()` still works (returns `[goalApi.status]`); `syncStatus()` reads SyncLog (cricket logs); `check()` DB ping still valid.
- **android/src/services/api.ts** — `FootballMatch.goalApiId?: string | null` → `goalApiId: string`; `getMatch: (id: string) => ...` → `getMatch: (goalApiId: string) => client.get<any>(`/football/matches/${goalApiId}`).then(r => r.data)`.
- **android/src/screens/FixturesScreen.tsx** — delete the `useEffect` with `setInterval(... 2 * 60_000)` and `selectedDateRef` (`useRef` + the `if (selectedDateRef.current === ...)` check). Keep `RefreshControl`.
- **android/src/screens/LiveScreen.tsx** — import `cleanLive`; replace both `dedupeMatches(fixEarlyLive(fb))` and `dedupeMatches(fixEarlyLive(matches))` with `dedupeMatches(cleanLive(...))`.
- **android/src/screens/HomeScreen.tsx** — delete the DEV-only `useEffect` logging `[HOME] competitions in by-date data`.
- **android/src/screens/MatchDetailScreen.tsx** — update the `LIVE_REFRESH_MS` comment (no backend caching/quota concern now); no logic change.
- **docs/ARCHITECTURE.md, docs/API_PROVIDERS.md, docs/DEVELOPMENT.md, PROGRESS.md** — rewrite per steps 16–19.

Tests covering the changes: there are no unit tests in the repo (no `.spec.ts`). Verification is by build/typecheck:
- Backend: `cd f:\Score Koto\backend && npm run build` — must reach 0 errors. **Today it FAILS** with 6 errors from `src/common/app.module.ts`; after step 1 + the rest of FEAT-001 it must pass.
- Frontend: `cd f:\Score Koto\android && npx tsc --noEmit` — **passes today (exit 0)**; must stay passing after FEAT-002.
- Schema: `cd f:\Score Koto\backend && npx prisma generate` (and `npx prisma db push` if the Postgres container is up).
