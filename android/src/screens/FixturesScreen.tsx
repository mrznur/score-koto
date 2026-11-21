import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';
import TopBar from '../components/layout/TopBar';
import DateStrip from '../components/match/DateStrip';
import FootballMatchRow from '../components/match/FootballMatchRow';
import Icon from '../components/ui/Icon';
import LiveDot from '../components/ui/LiveDot';
import { footballApi, cricketApi, FootballMatch, CricketMatch } from '../services/api';
import { getSlot, BIG_MATCH_MAX_SLOT, canonicalCompetition } from '../utils/footballRanking';
import { dedupeMatches, fixEarlyLive, isLiveStatus, isFinishedStatus, isUpcomingStatus } from '../utils/featured';
import { matchScore, matchStatus } from '../utils/matchDisplay';

type SportFilter = 'ALL' | 'FOOTBALL' | 'CRICKET';
type StatusFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED';

type GroupedLeague = {
  competition: string;
  country: string | null;
  countryFlag: string | null;
  competitionLogo: string | null;
  matches: FootballMatch[];
  isUefa: boolean;
  region: string;
  sortKey: string;
};

type RegionGroup = {
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

function buildRegionGroups(matches: FootballMatch[]): RegionGroup[] {
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

function LeagueRow({
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

function RegionHeader({ group, colors }: { group: RegionGroup; colors: any }) {
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

function CricketCard({ match, onPress, colors }: { match: CricketMatch; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.cricketCard, { borderColor: colors.line, backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cricketMeta}>
        {match.matchStarted && !match.matchEnded
          ? <LiveDot label={match.matchType.toUpperCase()} />
          : <Text style={[styles.metaText, { color: colors.muted }]}>{match.matchType.toUpperCase()}</Text>}
        <Text style={[styles.metaText, { color: colors.muted }]}>
          {new Date(match.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      {(match.teams as string[]).slice(0, 2).map((team: string, i: number) => {
        const info = (match.teamInfo as any[])?.find((t: any) => t.name === team);
        const score = match.score?.[i];
        return (
          <View key={team} style={[styles.cricketTeamRow, i > 0 && { opacity: 0.55 }]}>
            {info?.img
              ? <Image source={{ uri: info.img }} style={styles.cricketLogo} resizeMode="contain" />
              : <View style={[styles.cricketBadge, { backgroundColor: colors.soft }]}>
                <Text style={[styles.cricketBadgeText, { color: colors.text }]}>{team.charAt(0)}</Text>
              </View>}
            <Text style={[styles.cricketTeamName, { color: colors.text }]} numberOfLines={1}>
              {info?.shortname ?? team}
            </Text>
            <Text style={[styles.cricketScore, { color: colors.text }]}>
              {score ? `${score.r}/${score.w}` : '-'}
            </Text>
          </View>
        );
      })}
      <Text style={[styles.cricketStatus, { color: colors.muted }]} numberOfLines={2}>
        {match.status}
      </Text>
    </TouchableOpacity>
  );
}

const SPORT_FILTERS: SportFilter[] = ['ALL', 'FOOTBALL', 'CRICKET'];
const STATUS_FILTERS: StatusFilter[] = ['ALL', 'LIVE', 'UPCOMING', 'FINISHED'];

export default function FixturesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useAppColors();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [sportFilter, setSportFilter] = useState<SportFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [footballMatches, setFootballMatches] = useState<FootballMatch[]>([]);
  const [cricketMatches, setCricketMatches] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDate(today); }, []);

  const loadDate = async (date: string) => {
    try {
      setLoading(true);
      const [fb, cr] = await Promise.all([
        footballApi.getByDate(date),
        cricketApi.getByDate(date),
      ]);
      setFootballMatches(dedupeMatches(fixEarlyLive(fb)));
      setCricketMatches(cr);
    } catch (e) {
      console.error('Fixtures load error:', e);
      setFootballMatches([]);
      setCricketMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadDate(date);
  };

  const filteredFootball = footballMatches.filter(m => {
    if (statusFilter === 'LIVE') return isLiveStatus(m.status);
    if (statusFilter === 'UPCOMING') return isUpcomingStatus(m.status);
    if (statusFilter === 'FINISHED') return isFinishedStatus(m.status);
    return true;
  });

  const filteredCricket = cricketMatches.filter(m => {
    if (statusFilter === 'LIVE') return m.matchStarted && !m.matchEnded;
    if (statusFilter === 'UPCOMING') return !m.matchStarted;
    if (statusFilter === 'FINISHED') return m.matchEnded;
    return true;
  });

  const regionGroups = buildRegionGroups(filteredFootball);
  const totalCount = filteredFootball.length + filteredCricket.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top }}>
        <TopBar
          eyebrow="SCHEDULE"
          title="Fixtures"
          onBack={() => navigation.goBack()}
          action={
            <TouchableOpacity onPress={() => loadDate(selectedDate)}>
              <Icon name="calendar" size={20} color={colors.text} />
            </TouchableOpacity>
          }
        />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <DateStrip onDateChange={handleDateChange} />
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.line }]}>
        {SPORT_FILTERS.map(f => (
          <TouchableOpacity key={f} style={styles.filterTab} onPress={() => setSportFilter(f)}>
            <Text style={[styles.filterLabel, { color: sportFilter === f ? colors.text : colors.muted }]}>{f}</Text>
            {sportFilter === f && <View style={[styles.filterBar, { backgroundColor: Colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.chipRow, { borderBottomColor: colors.line }]}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, {
              backgroundColor: statusFilter === f ? Colors.primary : colors.surface,
              borderColor: statusFilter === f ? Colors.primary : colors.line,
            }]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.chipText, { color: statusFilter === f ? '#FFF' : colors.muted }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.summaryRow, { borderBottomColor: colors.line }]}>
        <Text style={[styles.summaryDate, { color: colors.muted }]}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long', day: 'numeric', month: 'long',
          }).toUpperCase()}
        </Text>
        <Text style={[styles.summaryCount, { color: Colors.primary }]}>{totalCount} MATCHES</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : totalCount === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No matches for this day</Text>
          <Text style={[styles.emptyNote, { color: colors.muted }]}>
            Past days fill in as we sync daily.{'\n'}Future fixtures from football-data.org (top European competitions).
          </Text>
        </View>
      ) : (
        <>
          {(sportFilter === 'ALL' || sportFilter === 'FOOTBALL') && regionGroups.length > 0 && (
            <>
              {sportFilter === 'ALL' && (
                <View style={[styles.sportLabel, { borderBottomColor: colors.line }]}>
                  <Text style={[styles.sportLabelText, { color: colors.text }]}>FOOTBALL</Text>
                  <Text style={[styles.sportLabelCount, { color: colors.muted }]}>{filteredFootball.length}</Text>
                </View>
              )}
              {regionGroups.map((group, gi) => (
                <View key={`${group.region}-${gi}`}>
                  <RegionHeader group={group} colors={colors} />
                  {group.leagues.map(league => (
                    <LeagueRow
                      key={`${league.competition}__${league.country}`}
                      league={league}
                      colors={colors}
                      onMatchPress={id => navigation.navigate('MatchDetail', { matchId: id })}
                    />
                  ))}
                </View>
              ))}
            </>
          )}

          {(sportFilter === 'ALL' || sportFilter === 'CRICKET') && filteredCricket.length > 0 && (
            <>
              <View style={[styles.sportLabel, { borderBottomColor: colors.line, marginTop: 8 }]}>
                <Text style={[styles.sportLabelText, { color: colors.text }]}>CRICKET</Text>
                <Text style={[styles.sportLabelCount, { color: colors.muted }]}>{filteredCricket.length}</Text>
              </View>
              <View style={{ paddingHorizontal: 16 }}>
                {filteredCricket.map(m => (
                  <CricketCard
                    key={m.id}
                    match={m}
                    onPress={() => navigation.navigate('MatchDetail', { matchId: m.id })}
                    colors={colors}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  summaryDate: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  summaryCount: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
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
  empty: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 11 },
  emptyNote: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, textAlign: 'center', lineHeight: 16 },
  metaText: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  cricketCard: { borderWidth: 1, borderTopWidth: 0, padding: 12, marginBottom: 2 },
  cricketMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cricketTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cricketLogo: { width: 22, height: 22 },
  cricketBadge: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  cricketBadgeText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 11 },
  cricketTeamName: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 12, flex: 1 },
  cricketScore: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14 },
  cricketStatus: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, marginTop: 4, lineHeight: 16 },
});