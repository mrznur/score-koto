# API Providers

## Football

### Goal API (sole provider)
- **Base URL:** `https://api.goal-api.com/v1`
- **Auth header:** `Authorization: Bearer <GOAL_API_KEY>`
- **Quota:** None (unlimited on the plan in use)
- **Used by:** `GoalApiProvider`

Football endpoints are **pass-through Goal API proxies with no server-side caching**: every read hits Goal API directly and returns the normalized result. Nothing is persisted in the database, so data is always as fresh as the latest API call.

#### Endpoints used
| Endpoint | Description |
|----------|-------------|
| `GET /fixtures/live` | Live matches |
| `GET /fixtures/date/:date` | Fixtures for a date |
| `GET /results/today` | Today's finished results |
| `GET /fixtures/:id` | Single fixture detail |
| `GET /fixtures/:id/events` | Match events (goals, cards) |
| `GET /fixtures/:id/lineups` | Team lineups |
| `GET /fixtures/:id/statistics` | Full-time statistics |
| `GET /fixtures/:id/commentary` | Running commentary |
| `GET /standings/:leagueId` | League table |
| `GET /teams/:teamId` | Team profile |
| `GET /teams/:teamId/players` | Team squad |
| `GET /teams/:teamId/results` | Team recent results |
| `GET /teams/:teamId/upcoming` | Team upcoming fixtures |

The Goal API fixture id (`goalApiId`) is exposed on every normalized match as `id`, and is what the client passes back to `/football/matches/:id` for detail, events, statistics, lineups, and commentary. Goal API is the only football provider, so there is no merge/dedup layer.

> The secondary football providers — API-Football, football-data.org, and TheSportsDB — have been removed. The `FootballProviderManager` merge/dedup layer is also gone.

---

## Cricket

### CricketData — cricapi.com (primary + optional secondary)
- **Base URL:** `https://api.cricapi.com/v1`
- **Auth param:** `?apikey=KEY` (appended to every request)
- **Quota:** 100 requests/day per key
- **Keys:** `CRICKET_API_KEY` (required), `CRICKET_API_KEY_2` (optional second key — adds another 100/day)
- **Used by:** `CricketProviderManager` — rotates to the second key when the first is exhausted

#### Endpoints used
| Endpoint | Description |
|----------|-------------|
| `GET /currentMatches?offset=N` | Current and recent matches (up to ~83, paginated 25/page) |
| `GET /match_scorecard?id=UUID` | Full batting + bowling scorecard per innings |

#### Scorecard fields
- `batting` — batsman, runs, balls, fours, sixes, strike rate, dismissal
- `bowling` — bowler, overs, maidens, runs, wickets, economy
- `extras`, `totals`

Ball-by-ball data is not available on the free plan (`bbbEnabled: false`).

---

## Quota budget

| Provider | Daily limit | Jobs |
|----------|-------------|------|
| Goal API | None | Live push (every 2 min, pass-through), by-date, results, match detail — all pass-through, no DB |
| CricketData | 100/day × keys | Current matches every 5–30 min (synced to DB) |

Goal API has no quota. CricketData quota is tracked in-memory inside `CricketProviderManager` (a per-key `used` counter that resets on restart); when the primary key is exhausted the manager rotates to the secondary key. The `ApiUsage` table is retained in the schema from the multi-provider era but is not actively written by the proxy.
