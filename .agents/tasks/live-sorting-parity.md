# Live sorting/grouping parity with Fixtures

## Goal
Make the football match sorting/grouping on the Live screen behave exactly like the
Fixtures screen, by sharing the grouping code instead of duplicating it.

## New shared module: `android/src/utils/matchGrouping.tsx`
Extracted from `FixturesScreen.tsx` so both screens import the same code. Contains:

- **Types**: `SportFilter`, `StatusFilter`, `GroupedLeague`, `RegionGroup`.
- **Constants**: `SPORT_FILTERS`, `STATUS_FILTERS`.
- **Grouping logic**: `buildRegionGroups(matches)` — top leagues
  (`getSlot <= BIG_MATCH_MAX_SLOT`: UCL + top 5 domestic + UEL + UECL) are each pinned
  as their own region at the top, sorted by slot; all other competitions are grouped by
  country, sorted A-Z by country then competition name. Internal helpers `isDefaultOpen`
  and `isUefaComp` moved here too.
- **Components** (presentational, reused by both screens):
  - `LeagueRow` — collapsible competition row (default-open when slot <= 6), competition
    logo, name, `N LIVE` count, match count, chevron (`\u2227` / `\u2228`), and the match
    list rendered via `FootballMatchRow` using `matchScore` / `matchStatus(m, false)`.
  - `RegionHeader` — country flag (or EU flag for UEFA comps) + region name.
  - `SportFilterRow` — the ALL / FOOTBALL / CRICKET tab row.
  - `StatusFilterRow` — the ALL / LIVE / UPCOMING / FINISHED chip row.
  - `SportSectionLabel` — the "FOOTBALL" / "CRICKET" section divider with a match count.
- **Styles**: the style rules used by the above (`filterRow`, `filterTab`, `filterLabel`,
  `filterBar`, `chipRow`, `chip`, `chipText`, `sportLabel`, `sportLabelText`,
  `sportLabelCount`, `regionHeader`, `regionFlag`, `regionName`, `leagueRow`, `compLogo`,
  `leagueInfo`, `leagueName`, `liveTag`, `leagueCount`, `chevron`, `matchList`).

The EU flag asset is referenced via `require('../../assets/images/eu-flag.png')`, which
resolves to the same `android/assets/images/eu-flag.png` from `src/utils/` as it did from
`src/screens/`.

## `FixturesScreen.tsx` (refactored, behavior unchanged)
- Removed the inline definitions now living in the shared module (`buildRegionGroups`,
  `isUefaComp`, `isDefaultOpen`, `LeagueRow`, `RegionHeader`, the filter types/constants,
  the moved styles).
- Imports `buildRegionGroups`, `LeagueRow`, `RegionHeader`, `SportFilterRow`,
  `StatusFilterRow`, `SportSectionLabel` and the `SportFilter` / `StatusFilter` types from
  `matchGrouping`.
- Render now uses `<SportFilterRow>`, `<StatusFilterRow>`, `<SportSectionLabel>`,
  `<RegionHeader>`, `<LeagueRow>` instead of inline copies.
- Dropped imports no longer used directly: `FootballMatchRow`, `getSlot`,
  `BIG_MATCH_MAX_SLOT`, `canonicalCompetition`, `matchScore`, `matchStatus`.
- Kept its own `CricketCard` (which differs from Live's), the date loading via
  `getByDate` + `dedupeMatches(fixEarlyLive(...))`, the date strip, summary row and empty
  state. Rendered output is identical to before.

## `LiveScreen.tsx` (display/grouping changed to match Fixtures)
- Removed the duplicate local ranking code (`TOP_LEAGUES`, `TOP_COUNTRIES`, the local
  `getSlot`, `isDefaultOpen`), the simpler `groupByCompetition`, the local `matchStatus`,
  and the `CompetitionGroup` component. These are replaced by the shared `buildRegionGroups`
  + `LeagueRow` + `RegionHeader`.
- Football matches are now grouped with `buildRegionGroups`, so the visual grouping and
  ordering are identical to Fixtures: top leagues pinned as their own regions sorted by
  slot, others grouped by country A-Z, with `RegionHeader` + collapsible `LeagueRow` per
  competition, and rows using `matchScore` / `matchStatus(m, false)` like Fixtures.
- Reuses `<SportFilterRow>` for the ALL / FOOTBALL / CRICKET tabs (same component/style as
  Fixtures). A "FOOTBALL" `<SportSectionLabel>` is shown when the sport filter is ALL, as on
  Fixtures.
- Preserves all live-specific concerns: `useLiveUpdates` socket hook, the 30s polling
  interval, pull-to-refresh (`RefreshControl`), the "DATA SYNC / UPDATED Ns AGO" ticker, and
  the TopBar live badge.
- Cricket is left as-is: the existing `CricketCard` and its `compHead` header (shown when the
  sport filter is ALL) are unchanged, including the `N LIVE` count.
- Data prep for football now uses `dedupeMatches(fixEarlyLive(...))` (in both `load` and the
  socket `onFootballUpdate`), matching the preprocessing Fixtures applies so the shared
  grouping receives clean, de-duplicated data. The data-loading API calls and polling are
  unchanged.

## Verification
- `cd android && npx tsc --noEmit` — passes with no errors (exit 0).
- `package.json` has no lint script, so no lint run was applicable.
- Fixtures' rendered output is unchanged (same components/styles, just imported).
