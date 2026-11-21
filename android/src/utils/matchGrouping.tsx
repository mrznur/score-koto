import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import FootballMatchRow from '../components/match/FootballMatchRow';
import { FootballMatch } from '../services/api';
import { getSlot, BIG_MATCH_MAX_SLOT, canonicalCompetition } from './footballRanking';
import { isLiveStatus } from './featured';
import { matchScore, matchStatus } from './matchDisplay';

// ── Filter types & constants ────────────────────────────────────────────────
export type SportFilter = 'ALL' | 'FOOTBALL' | 'CRICKET';
export type StatusFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED';

export const SPORT_FILTERS: SportFilter[] = ['ALL', 'FOOTBALL', 'CRICKET'];
export const STATUS_FILTERS: StatusFilter[] = ['ALL', 'LIVE', 'UPCOMING', 'FINISHED'];

// ── Grouping types ────────────────────────────────────────────────────────────
export type GroupedLeague = {
  competition: string;
  country: string | null;
  countryFlag: string | null;
  competitionLogo: string | null;
  matches: FootballMatch[];
  isUefa: boolean;
  region: string;
  sortKey: string;
};

export type RegionGroup = {
  region: string;
  isUefa: boolean;
  countryFlag: string | null;
  leagues: GroupedLeague[];
};

function isDefaultOpen(competition: string, country: string | null): boolean {
  return getSlot(competition, country) <= 6;
}

function isUefaComp(name: string): boolean {
  const low = name.toLowerCase();
  return low.includes('champions league') ||
    low.includes('europa league') ||
    low.includes('conference league') ||
    low.includes('uefa') ||
    low.includes('nations league');
}

// Group football matches the way the Fixtures screen does:
//   - Top leagues (getSlot <= BIG_MATCH_MAX_SLOT: UCL + top 5 domestic + UEL + UECL)
//     each get pinned as their own region at the top, sorted by slot.
//   - All other competitions are grouped by country, sorted A-Z by country then
//     competition name.
export function buildRegionGroups(matches: FootballMatch[]): RegionGroup[] {
  // Group by competition+country
  const leagueMap = new Map<string, GroupedLeague>();
  for (const m of matches) {
    // Known leagues group by slot, so provider name variants ("Primera Division" / "La Liga")
    // land in one group. Everything else groups by its own name + country.
    const slot = getSlot(m.competition, m.country);
    const key = slot < 99 ? `slot-${slot}` : `${m.competition}__${m.country ?? ''}`;
    const compName = canonicalCompetition(m.competition, m.country);
    if (!leagueMap.has(key)) {
      const uefa = isUefaComp(compName);
      leagueMap.set(key, {
        competition: compName,
        country: m.country,
        countryFlag: m.countryFlag,
        competitionLogo: m.competitionLogo,
        matches: [],
        isUefa: uefa,
        region: m.country?.toUpperCase() ?? 'OTHER',
        sortKey: m.country ?? 'ZZZ',
      });
    }
    const group = leagueMap.get(key)!;
    // the first provider row may lack a logo/flag; take it from any other row
    if (!group.competitionLogo && m.competitionLogo) group.competitionLogo = m.competitionLogo;
    if (!group.countryFlag && m.countryFlag) group.countryFlag = m.countryFlag;
    group.matches.push(m);
  }

  const all = Array.from(leagueMap.values());

  // Top leagues: each gets its own pinned row at the top
  const top = all
    .filter(l => getSlot(l.competition, l.country) <= BIG_MATCH_MAX_SLOT)
    .sort((a, b) => getSlot(a.competition, a.country) - getSlot(b.competition, b.country));

  // Other leagues: grouped by country, sorted A-Z
  const others = all
    .filter(l => getSlot(l.competition, l.country) > BIG_MATCH_MAX_SLOT)
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey.localeCompare(b.sortKey);
      return a.competition.localeCompare(b.competition);
    });

  const result: RegionGroup[] = [];

  // Each top league is its own region (no mixing with 2. Bundesliga etc)
  for (const league of top) {
    const uefa = league.isUefa;
    result.push({
      region: uefa ? 'EUROPE' : (league.country?.toUpperCase() ?? ''),
      isUefa: uefa,
      countryFlag: uefa ? null : league.countryFlag,
      leagues: [league],
    });
  }

  // Country groups for the rest
  const countryMap = new Map<string, RegionGroup>();
  for (const league of others) {
    const key = league.country ?? 'OTHER';
    if (!countryMap.has(key)) {
      countryMap.set(key, {
        region: key.toUpperCase(),
        isUefa: false,
        countryFlag: league.countryFlag,
        leagues: [],
      });
    }
    countryMap.get(key)!.leagues.push(league);
  }

  result.push(...Array.from(countryMap.values()));
  return result;
}

// ── Presentational components ─────────────────────────────────────────────────

// A collapsible competition: tap to toggle. Default-open for the top leagues.
export function LeagueRow({
  league, colors, onMatchPress,
}: {
  league: GroupedLeague; colors: any; onMatchPress: (id: string) => void;
}) {
  const [open, setOpen] = useState(isDefaultOpen(league.competition, league.country));
  const liveCount = league.matches.filter(m => isLiveStatus(m.status)).length;

  return (
    <View>
      <TouchableOpacity
        style={[styles.leagueRow, { borderBottomColor: colors.line, backgroundColor: colors.bg }]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
      >
        {league.competitionLogo ? (
          <Image source={{ uri: league.competitionLogo }} style={styles.compLogo} resizeMode="contain" />
        ) : (
          <View style={[styles.compLogo, { backgroundColor: colors.soft }]} />
        )}
        <View style={styles.leagueInfo}>
          <Text style={[styles.leagueName, { color: colors.text }]} numberOfLines={1}>
            {league.competition}
          </Text>
          {liveCount > 0 && (
            <Text style={[styles.liveTag, { color: Colors.primary }]}>{liveCount} LIVE</Text>
          )}
        </View>
        <Text style={[styles.leagueCount, { color: colors.muted }]}>{league.matches.length}</Text>
        <Text style={[styles.chevron, { color: colors.muted }]}>{open ? '\u2227' : '\u2228'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.matchList, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
          {league.matches.map(m => (
            <FootballMatchRow
              key={m.id}
              home={m.homeTeam}
              away={m.awayTeam}
              homeLogo={m.homeTeamLogo}
              awayLogo={m.awayTeamLogo}
              score={matchScore(m)}
              status={matchStatus(m, false)}
              onClick={() => onMatchPress(m.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Country/region header: country flag, or EU flag for UEFA competitions.
export function RegionHeader({ group, colors }: { group: RegionGroup; colors: any }) {
  return (
    <View style={[styles.regionHeader]}>
      {group.isUefa ? (
        <Image source={require('../../assets/images/eu-flag.png')} style={styles.regionFlag} resizeMode="contain" />
      ) : group.countryFlag ? (
        <Image source={{ uri: group.countryFlag }} style={styles.regionFlag} resizeMode="contain" />
      ) : (
        <View style={styles.regionFlag} />
      )}
      <Text style={[styles.regionName, { color: colors.muted }]}>{group.region}</Text>
    </View>
  );
}

// ALL / FOOTBALL / CRICKET tab row.
export function SportFilterRow({
  value, onChange, colors,
}: {
  value: SportFilter; onChange: (f: SportFilter) => void; colors: any;
}) {
  return (
    <View style={[styles.filterRow, { borderBottomColor: colors.line }]}>
      {SPORT_FILTERS.map(f => (
        <TouchableOpacity key={f} style={styles.filterTab} onPress={() => onChange(f)}>
          <Text style={[styles.filterLabel, { color: value === f ? colors.text : colors.muted }]}>{f}</Text>
          {value === f && <View style={[styles.filterBar, { backgroundColor: Colors.primary }]} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ALL / LIVE / UPCOMING / FINISHED chip row.
export function StatusFilterRow({
  value, onChange, colors,
}: {
  value: StatusFilter; onChange: (f: StatusFilter) => void; colors: any;
}) {
  return (
    <View style={[styles.chipRow, { borderBottomColor: colors.line }]}>
      {STATUS_FILTERS.map(f => (
        <TouchableOpacity
          key={f}
          style={[styles.chip, {
            backgroundColor: value === f ? Colors.primary : colors.surface,
            borderColor: value === f ? Colors.primary : colors.line,
          }]}
          onPress={() => onChange(f)}
        >
          <Text style={[styles.chipText, { color: value === f ? '#FFF' : colors.muted }]}>{f}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// "FOOTBALL" / "CRICKET" section divider with a match count.
export function SportSectionLabel({
  title, count, colors, marginTop = 0,
}: {
  title: string; count: number; colors: any; marginTop?: number;
}) {
  return (
    <View style={[styles.sportLabel, marginTop > 0 ? { borderBottomColor: colors.line, marginTop } : { borderBottomColor: colors.line }]}>
      <Text style={[styles.sportLabelText, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sportLabelCount, { color: colors.muted }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, height: 44, alignItems: 'center' },
  filterTab: { paddingRight: 20, height: '100%', justifyContent: 'center', position: 'relative' },
  filterLabel: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10 },
  filterBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  chipRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  chipText: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  sportLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  sportLabelText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 11, flex: 1 },
  sportLabelCount: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  regionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 5 },
  regionFlag: { width: 24, height: 16 },
  regionName: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, letterSpacing: 0.5 },
  leagueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  compLogo: { width: 24, height: 24 },
  leagueInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  leagueName: { fontFamily: Fonts.interTightMedium, fontSize: 13, flex: 1 },
  liveTag: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
  leagueCount: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, marginRight: 4 },
  chevron: { fontFamily: Fonts.interTight, fontSize: 16 },
  matchList: { borderBottomWidth: 1 },
});
