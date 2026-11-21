import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
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
import FootballMatchRow from '../components/match/FootballMatchRow';
import LiveDot from '../components/ui/LiveDot';
import { footballApi, cricketApi, FootballMatch, CricketMatch } from '../services/api';
import { useLiveUpdates } from '../hooks/useLiveUpdates';

type SportFilter = 'ALL' | 'FOOTBALL' | 'CRICKET';

// ─────────────────────────────────────────────────────────────────────────────
// Shared "top league" gating logic — identical to FixturesScreen.
// ─────────────────────────────────────────────────────────────────────────────
const TOP_LEAGUES: Array<{ name: string; slot: number }> = [
  { name: 'uefa champions league', slot: 1 },
  { name: 'champions league', slot: 1 },
  { name: 'premier league', slot: 2 },
  { name: 'primera division', slot: 3 },
  { name: 'la liga', slot: 3 },
  { name: 'bundesliga', slot: 4 },
  { name: 'serie a', slot: 5 },
  { name: 'ligue 1', slot: 6 },
  { name: 'uefa europa league', slot: 7 },
  { name: 'europa league', slot: 7 },
  { name: 'uefa conference league', slot: 8 },
  { name: 'conference league', slot: 8 },
];

const TOP_COUNTRIES: Record<number, string> = {
  2: 'england',
  3: 'spain',
  4: 'germany',
  5: 'italy',
  6: 'france',
};

function getSlot(competition: string, country: string | null): number {
  const low = competition.toLowerCase().trim();
  const countryLow = (country ?? '').toLowerCase();

  for (const rule of TOP_LEAGUES) {
    if (low !== rule.name) continue;
    const expectedCountry = TOP_COUNTRIES[rule.slot];
    if (expectedCountry && !countryLow.includes(expectedCountry)) continue;
    return rule.slot;
  }
  return 99;
}

function isDefaultOpen(competition: string, country: string | null): boolean {
  return getSlot(competition, country) <= 6;
}

// ─────────────────────────────────────────────────────────────────────────────

function groupByCompetition(matches: FootballMatch[]) {
  const map = new Map<string, { competition: string; country: string | null; matches: FootballMatch[] }>();
  for (const m of matches) {
    const key = `${m.competition}__${m.country ?? ''}`;
    if (!map.has(key)) {
      map.set(key, { competition: m.competition, country: m.country, matches: [] });
    }
    map.get(key)!.matches.push(m);
  }
  return Array.from(map.values());
}

function matchStatus(m: FootballMatch): string {
  if (m.elapsed) return `${m.elapsed}'`;
  return m.status;
}

function CricketCard({ match, onPress, colors }: { match: CricketMatch; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.cricketCard, { borderColor: colors.line, backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cricketMeta}>
        <LiveDot label={match.matchType.toUpperCase()} />
        <Text style={[styles.small, { color: colors.muted }]} numberOfLines={1}>{match.name}</Text>
      </View>
      {(match.teams as string[]).slice(0, 2).map((team: string, i: number) => {
        const info = (match.teamInfo as any[])?.find((t: any) => t.name === team);
        const score = match.score?.[i];
        return (
          <View key={team} style={[styles.cricketTeamRow, i > 0 && { opacity: 0.55 }]}>
            {info?.img
              ? <Image source={{ uri: info.img }} style={styles.cricketLogo} resizeMode="contain" />
              : <View style={[styles.cricketBadge, { backgroundColor: colors.soft }]}>
                <Text style={[styles.small, { color: colors.text }]}>{team.charAt(0)}</Text>
              </View>}
            <Text style={[styles.cricketTeam, { color: colors.text }]} numberOfLines={1}>
              {info?.shortname ?? team}
            </Text>
            <Text style={[styles.cricketScore, { color: colors.text }]}>
              {score ? `${score.r}/${score.w}` : '-'}
            </Text>
          </View>
        );
      })}
      <Text style={[styles.small, { color: colors.muted, marginTop: 6 }]} numberOfLines={1}>
        {match.status}
      </Text>
    </TouchableOpacity>
  );
}

// Collapsible competition group — chevron matches FixturesScreen (\u2227 / \u2228)
function CompetitionGroup({
  competition,
  country,
  matches,
  colors,
  onMatchPress,
}: {
  competition: string;
  country: string | null;
  matches: FootballMatch[];
  colors: any;
  onMatchPress: (id: string) => void;
}) {
  const [open, setOpen] = useState(isDefaultOpen(competition, country));

  return (
    <View>
      <TouchableOpacity
        style={[styles.compHead, { borderBottomColor: colors.line }]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${competition}`}
      >
        <Text style={[styles.compName, { color: colors.text }]} numberOfLines={1}>
          {competition}
        </Text>
        <View style={styles.compRight}>
          <Text style={[styles.compCount, { color: Colors.primary }]}>
            {matches.length} LIVE
          </Text>
          {/* ✅ Same glyphs as FixturesScreen */}
          <Text style={[styles.chevron, { color: colors.muted }]}>{open ? '\u2227' : '\u2228'}</Text>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={[styles.matchList, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          {matches.map(m => (
            <FootballMatchRow
              key={m.id}
              home={m.homeTeam}
              away={m.awayTeam}
              homeLogo={m.homeTeamLogo}
              awayLogo={m.awayTeamLogo}
              score={`${m.homeScore ?? '-'} - ${m.awayScore ?? '-'}`}
              status={matchStatus(m)}
              onClick={() => onMatchPress(m.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useAppColors();

  const [sport, setSport] = useState<SportFilter>('ALL');
  const [football, setFootball] = useState<FootballMatch[]>([]);
  const [cricket, setCricket] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (mode: 'initial' | 'pull') => {
    if (mode === 'pull') setRefreshing(true);
    else setLoading(true);
    try {
      const [fb, cr] = await Promise.all([
        footballApi.getLive(),
        cricketApi.getLive(),
      ]);
      setFootball(fb);
      setCricket(cr);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('LiveScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
    const interval = setInterval(() => load('pull'), 30000);
    return () => clearInterval(interval);
  }, [load]);

  useLiveUpdates({
    onFootballUpdate: (matches) => { setFootball(matches); setLastUpdated(new Date()); },
    onCricketUpdate: (matches) => { setCricket(matches); setLastUpdated(new Date()); },
  });

  const showFootball = sport === 'ALL' || sport === 'FOOTBALL';
  const showCricket = sport === 'ALL' || sport === 'CRICKET';
  const totalLive = (showFootball ? football.length : 0) + (showCricket ? cricket.length : 0);
  const grouped = groupByCompetition(showFootball ? football : []);

  const secondsAgo = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load('pull')} tintColor={Colors.primary} />
      }
    >
      <View style={{ paddingHorizontal: 16 }}>
        <TopBar
          eyebrow="SPORTS CENTRE"
          title="Live now"
          action={
            <View style={[styles.badge, { borderColor: Colors.primary }]}>
              <LiveDot />
              <Text style={styles.badgeText}>{totalLive} LIVE</Text>
            </View>
          }
        />
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.line }]}>
        {(['ALL', 'FOOTBALL', 'CRICKET'] as SportFilter[]).map(f => (
          <TouchableOpacity key={f} style={styles.filterTab} onPress={() => setSport(f)}>
            <Text style={[styles.filterLabel, { color: sport === f ? colors.text : colors.muted }]}>{f}</Text>
            {sport === f && <View style={[styles.filterBar, { backgroundColor: Colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.ticker, { borderBottomColor: colors.line }]}>
        <Text style={[styles.small, { color: colors.muted }]}>DATA SYNC</Text>
        <View style={[styles.tickerLine, { backgroundColor: colors.line }]} />
        <Text style={[styles.small, { color: colors.muted }]}>
          {secondsAgo !== null ? `UPDATED ${secondsAgo}s AGO` : 'LOADING...'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : totalLive === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No live matches right now</Text>
        </View>
      ) : (
        <>
          {showFootball && grouped.map(({ competition, country, matches }) => (
            <CompetitionGroup
              key={`${competition}__${country ?? ''}`}
              competition={competition}
              country={country}
              matches={matches}
              colors={colors}
              onMatchPress={id => navigation.navigate('MatchDetail', { matchId: id })}
            />
          ))}

          {showCricket && cricket.length > 0 && (
            <>
              {sport === 'ALL' && (
                <View style={[styles.compHead, { borderBottomColor: colors.line, marginTop: 8 }]}>
                  <Text style={[styles.compName, { color: colors.text }]}>CRICKET</Text>
                  <Text style={[styles.compCount, { color: Colors.primary }]}>{cricket.length} LIVE</Text>
                </View>
              )}
              <View style={{ paddingHorizontal: 16 }}>
                {cricket.map(m => (
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
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 5 },
  badgeText: { fontFamily: Fonts.jetbrainsMono, fontSize: 8, color: Colors.primary },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, height: 44, alignItems: 'center' },
  filterTab: { paddingRight: 20, height: '100%', justifyContent: 'center', position: 'relative' },
  filterLabel: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10 },
  filterBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  ticker: { flexDirection: 'row', alignItems: 'center', height: 28, paddingHorizontal: 16, borderBottomWidth: 1, gap: 10 },
  tickerLine: { flex: 1, height: 1 },
  small: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  compHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  compRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compName: { fontFamily: Fonts.interTightMedium, fontSize: 12, flex: 1 },
  compCount: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 8 },
  chevron: { fontFamily: Fonts.interTight, fontSize: 16 }, // ✅ matches FixturesScreen (was 12)
  matchList: { borderTopWidth: 0, borderBottomWidth: 1, borderLeftWidth: 0, borderRightWidth: 0, borderColor: 'transparent', marginBottom: 2 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontFamily: Fonts.jetbrainsMono, fontSize: 11 },
  cricketCard: { borderWidth: 1, borderTopWidth: 0, padding: 12, marginBottom: 2 },
  cricketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cricketTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  cricketLogo: { width: 22, height: 22 },
  cricketBadge: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  cricketTeam: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 12, flex: 1 },
  cricketScore: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14 },
});