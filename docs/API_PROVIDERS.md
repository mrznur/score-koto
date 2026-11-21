# API Providers

## Football

### Goal API (primary)
- **Base URL:** `https://api.goal-api.com/v1`
- **Auth header:** `Authorization: Bearer <GOAL_API_KEY>`
- **Quota:** None (unlimited on the plan in use)
- **Used by:** `GoalApiProvider`

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

Goal API is the only provider that supplies match events, lineups, statistics, and commentary. The `goalApiId` field on `FootballMatch` records stores the fixture ID needed to call these endpoints.

---

### API-Football (secondary)
- **Base URL:** `https://v3.football.api-sports.io`
- **Auth header:** `x-apisports-key`
- **Quota:** 100 requests/day (free plan)
- **Plan expiry:** 2027-11-19
- **Used by:** `ApiFootballProvider`; quota tracked in `ApiUsage` table via `QuotaService`

#### Endpoints used
| Endpoint | Description |
|----------|-------------|
| `GET /fixtures?live=all` | Live matches |
| `GET /fixtures?date=YYYY-MM-DD` | Fixtures for a date |

Events, lineups, and statistics endpoints exist but are not available on the free plan.

#### Key league IDs
| ID | Competition |
|----|-------------|
| 39 | Premier League |
| 140 | La Liga |
| 135 | Serie A |
| 78 | Bundesliga |
| 61 | Ligue 1 |
| 2 | Champions League |

---

### football-data.org (fixtures/schedules)
- **Base URL:** `https://api.football-data.org/v4`
- **Auth header:** `X-Auth-Token`
- **Quota:** No daily limit; 10 requests/minute rate limit (enforced with 6-second minimum interval)
- **Used by:** `FootballDataProvider`

#### Endpoints used
| Endpoint | Description |
|----------|-------------|
| `GET /matches?dateFrom=&dateTo=` | Fixtures/results for a date range |
| `GET /matches?status=IN_PLAY,PAUSED` | Currently live (not currently called; date range covers this) |

Covers the 12 free-tier competitions: Premier League (PL), La Liga (PD), Serie A (SA), Bundesliga (BL1), Ligue 1 (FL1), Champions League (CL), Europa League (ELC), Eredivisie (DED), Primeira Liga (PPL), Brasileirão (BSA), Copa Libertadores (CLI), World Cup (WC).

---

### TheSportsDB (live fallback + badge lookup)
- **Base URL:** `https://www.thesportsdb.com/api/v1/json/123`
- **Auth:** None (free tier uses a fixed path segment)
- **Quota:** Unlimited free tier
- **Used by:** `TheSportsDbProvider`

#### Endpoints used
| Endpoint | Description |
|----------|-------------|
| `GET /livescore.php?s=Soccer` | Currently live soccer matches |
| `GET /searchteams.php?t=NAME` | Team badge URL lookup by team name |

Only live matches with status `1H`, `HT`, `2H`, or `ET` are kept. Date-based fixture queries are not supported on the free tier.

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
| Goal API | None | Live (every 2 min), by-date, results, match detail |
| API-Football | 100 req/day | Live (every 2 min when available) + by-date |
| football-data.org | None (10/min) | Upcoming 7 days once/day + by-date |
| TheSportsDB | None | Live fallback |
| CricketData | 100/day × keys | Current matches every 5–30 min |

API-Football quota is tracked in the `ApiUsage` table and checked on every request. When the daily limit is reached, the provider marks itself unavailable and the `FootballProviderManager` skips it.
