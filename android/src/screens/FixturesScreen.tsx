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
import Icon from '../components/ui/Icon';
import LiveDot from '../components/ui/LiveDot';
import { footballApi, cricketApi, FootballMatch, CricketMatch } from '../services/api';
import { dedupeMatches, fixEarlyLive, isLiveStatus, isFinishedStatus, isUpcomingStatus } from '../utils/featured';
import {
  buildRegionGroups,
  LeagueRow,
  RegionHeader,
  SportFilterRow,
  StatusFilterRow,
  SportSectionLabel,
  SportFilter,
  StatusFilter,
} from '../utils/matchGrouping';

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

      <SportFilterRow value={sportFilter} onChange={setSportFilter} colors={colors} />

      <StatusFilterRow value={statusFilter} onChange={setStatusFilter} colors={colors} />

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
                <SportSectionLabel title="FOOTBALL" count={filteredFootball.length} colors={colors} />
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
              <SportSectionLabel title="CRICKET" count={filteredCricket.length} colors={colors} marginTop={8} />
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  summaryDate: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  summaryCount: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
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
