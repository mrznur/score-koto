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
import LiveDot from '../components/ui/LiveDot';
import { footballApi, cricketApi, FootballMatch, CricketMatch } from '../services/api';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import { dedupeMatches, fixEarlyLive } from '../utils/featured';
import {
  buildRegionGroups,
  LeagueRow,
  RegionHeader,
  SportFilterRow,
  SportSectionLabel,
  SportFilter,
} from '../utils/matchGrouping';

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
      setFootball(dedupeMatches(fixEarlyLive(fb)));
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
    onFootballUpdate: (matches) => { setFootball(dedupeMatches(fixEarlyLive(matches))); setLastUpdated(new Date()); },
    onCricketUpdate: (matches) => { setCricket(matches); setLastUpdated(new Date()); },
  });

  const showFootball = sport === 'ALL' || sport === 'FOOTBALL';
  const showCricket = sport === 'ALL' || sport === 'CRICKET';
  const footballInView = showFootball ? football : [];
  const cricketInView = showCricket ? cricket : [];
  const totalLive = footballInView.length + cricketInView.length;
  const regionGroups = buildRegionGroups(footballInView);

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

      <SportFilterRow value={sport} onChange={setSport} colors={colors} />

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
          {showFootball && regionGroups.length > 0 && (
            <>
              {sport === 'ALL' && (
                <SportSectionLabel title="FOOTBALL" count={footballInView.length} colors={colors} />
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
  ticker: { flexDirection: 'row', alignItems: 'center', height: 28, paddingHorizontal: 16, borderBottomWidth: 1, gap: 10 },
  tickerLine: { flex: 1, height: 1 },
  small: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  compHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  compName: { fontFamily: Fonts.interTightMedium, fontSize: 12, flex: 1 },
  compCount: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 8 },
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
