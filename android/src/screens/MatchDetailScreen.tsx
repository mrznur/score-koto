import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';
import TopBar from '../components/layout/TopBar';
import SectionHeader from '../components/layout/SectionHeader';
import StatBar from '../components/match/StatBar';
import LiveDot from '../components/ui/LiveDot';
import TeamBadge from '../components/ui/TeamBadge';
import { footballApi, FootballMatch } from '../services/api';

const TABS = ['OVERVIEW', 'STATS', 'LINEUP', 'COMMENTARY'];

// How often to silently refresh a LIVE match while this screen is open.
// Set to 0 to disable. Keep it at 0 until the backend caches match details,
// because every refresh currently makes 4 requests to the sports provider.
const LIVE_REFRESH_MS = 60_000;

type MatchDetail = {
  match: FootballMatch;
  events: any[];
  statistics: any;
  lineups: any;
  commentary: any[];
  goalApiAvailable: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function Logo({ uri, name, size = 42 }: { uri?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (uri && !err) {
    return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" onError={() => setErr(true)} />;
  }
  return <TeamBadge team={name} />;
}

const STATIC_STATUS: Record<string, string> = {
  HT: 'HALF TIME',
  BT: 'BREAK TIME',
  FT: 'FULL TIME',
  AET: 'AFTER EXTRA TIME',
  PEN: 'PENALTIES',
  P: 'PENALTY SHOOTOUT',
  NS: 'NOT STARTED',
  TBD: 'TIME TO BE CONFIRMED',
  PST: 'POSTPONED',
  CANC: 'CANCELLED',
  SUSP: 'SUSPENDED',
  INT: 'INTERRUPTED',
  ABD: 'ABANDONED',
  LIVE: 'LIVE',
};

function statusLabel(s: string, elapsed: number | null) {
  // Some providers do not send the minute, so never show a fake "0'"
  if (s === '1H') return elapsed != null ? `${elapsed}' — FIRST HALF` : 'IN PLAY';
  if (s === '2H') return elapsed != null ? `${elapsed}' — SECOND HALF` : 'IN PLAY';
  if (s === 'ET') return elapsed != null ? `${elapsed}' — EXTRA TIME` : 'EXTRA TIME';
  return STATIC_STATUS[s] ?? s;
}

function isLive(s?: string | null) {
  return !!s && ['1H', 'HT', '2H', 'ET', 'P', 'BT'].includes(s);
}

function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', opts);
}

const KICKOFF_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
};

function toNumber(v: unknown): number {
  const n = parseFloat(String(v ?? '').replace('%', ''));
  return Number.isFinite(n) ? n : 0;
}

// Share of the bar for the home team. Handles 0 values, nulls and "55%" strings.
function statPercent(home: unknown, away: unknown): number {
  const h = toNumber(home);
  const a = toNumber(away);
  if (h + a === 0) return 50;
  return Math.round((h / (h + a)) * 100);
}

function statValue(v: unknown): string {
  return v == null ? '-' : String(v);
}

function errorMessage(e: any): string {
  if (e?.response?.status === 404) return 'Match not found';
  if (e?.code === 'ECONNABORTED') return 'The server took too long to respond';
  if (!e?.response) return 'Cannot reach the server. Check your connection.';
  return `Server error (${e.response.status})`;
}

// Explains WHY a section is empty, so "not provided" is not confused with "not yet available"
function emptyMessage(what: string, goalApiAvailable: boolean, status: string, live: boolean): string {
  if (!goalApiAvailable) return `${what} are not provided for this match`;
  if (live) return `${what} will appear as the match progresses`;
  if (status === 'NS') return `${what} will appear closer to kickoff`;
  return `No ${what.toLowerCase()} available`;
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MatchDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { colors } = useAppColors();
  const [tab, setTab] = useState('OVERVIEW');
  const [data, setData] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchId = route.params?.matchId;

  // Ignore responses that arrive after a newer request started or the screen closed
  const requestId = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'silent' | 'pull') => {
      if (!matchId) return;
      const id = ++requestId.current;
      if (mode === 'initial') {
        setLoading(true);
        setError(null);
      }
      if (mode === 'pull') setRefreshing(true);
      try {
        const res = await footballApi.getMatch(matchId);
        if (id !== requestId.current) return;
        setData(res);
        setError(null);
        setRefreshFailed(false);
      } catch (e: any) {
        if (id !== requestId.current) return;
        if (mode === 'initial') setError(errorMessage(e));
        else setRefreshFailed(true); // keep showing the data we already have
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [matchId],
  );

  useEffect(() => {
    setData(null);
    load('initial');
    return () => {
      requestId.current++; // cancel any in-flight request on unmount / match change
    };
  }, [load]);

  const live = isLive(data?.match?.status);

  // Auto-refresh only while the match is live and this screen is visible
  useEffect(() => {
    if (!LIVE_REFRESH_MS || !live || !isFocused) return;
    const timer = setInterval(() => load('silent'), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, isFocused, load]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !data?.match) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ fontFamily: Fonts.jetbrainsMono, fontSize: 11, color: Colors.primary, marginBottom: 8 }}>ERROR</Text>
        <Text style={{ fontFamily: Fonts.jetbrainsMono, fontSize: 10, color: colors.muted, textAlign: 'center', marginBottom: 16 }}>
          {error ?? 'Match data is not available'}
        </Text>
        <View style={styles.errorActions}>
          <TouchableOpacity onPress={() => load('initial')}>
            <Text style={{ fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, color: Colors.primary }}>RETRY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, color: colors.text }}>BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { match, events = [], statistics, lineups, commentary = [], goalApiAvailable } = data;
  const competition = match.competition ?? '';
  const statRows = statistics?.match?.fullTime ?? [];
  const hasLineups = lineups?.hasLineups && (lineups?.home?.length > 0 || lineups?.away?.length > 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[1]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('pull')}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* TopBar */}
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top }}>
        <TopBar
          eyebrow={`${competition.toUpperCase()}${match.round ? ` · ${match.round.toUpperCase()}` : ''}`}
          title="Match centre"
          onBack={() => navigation.goBack()}
          action={live ? <LiveDot label={match.elapsed ? `${match.elapsed}'` : 'LIVE'} /> : undefined}
        />
      </View>

      {/* Scoreboard */}
      <View style={[styles.scoreboard, { backgroundColor: colors.surface }]}>
        <View style={styles.idRow}>
          <Text style={[styles.small, { color: colors.muted }]}>{competition.toUpperCase()}</Text>
          {match.venue && <Text style={[styles.small, { color: colors.muted }]} numberOfLines={1}>{match.venue.toUpperCase()}</Text>}
        </View>
        <View style={styles.scoreRow}>
          <TouchableOpacity style={styles.team} onPress={() => match.homeTeamId && navigation.navigate('Team', { teamId: match.homeTeamId, teamName: match.homeTeam })}>
            <Logo uri={match.homeTeamLogo} name={match.homeTeam} />
            <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{match.homeTeam.toUpperCase()}</Text>
            <Text style={[styles.small, { color: colors.muted }]}>HOME</Text>
          </TouchableOpacity>
          <View style={styles.scoreCenter}>
            <Text style={[styles.scoreNum, { color: colors.text }]}>{match.homeScore ?? '-'}</Text>
            <Text style={styles.scoreColon}>:</Text>
            <Text style={[styles.scoreNum, { color: colors.text }]}>{match.awayScore ?? '-'}</Text>
          </View>
          <TouchableOpacity style={styles.team} onPress={() => match.awayTeamId && navigation.navigate('Team', { teamId: match.awayTeamId, teamName: match.awayTeam })}>
            <Logo uri={match.awayTeamLogo} name={match.awayTeam} />
            <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{match.awayTeam.toUpperCase()}</Text>
            <Text style={[styles.small, { color: colors.muted }]}>AWAY</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statusRow}>
          {live && <LiveDot />}
          <Text style={[styles.statusText, { color: colors.text }]}>{statusLabel(match.status, match.elapsed)}</Text>
        </View>
        <Text style={[styles.small, { color: colors.muted, marginTop: 4 }]}>
          {fmtDate(match.kickoff, KICKOFF_FORMAT).toUpperCase()}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderColor: colors.line, backgroundColor: colors.bg }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(t)}>
            <Text style={[styles.tabLabel, { color: tab === t ? colors.text : colors.muted }]}>{t}</Text>
            {tab === t && <View style={[styles.tabBar, { backgroundColor: Colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16 }}>

        {/* OVERVIEW */}
        {tab === 'OVERVIEW' && (
          <>
            <SectionHeader number="01" title="Match info" />
            <View style={[styles.card, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              {[
                ['COMPETITION', competition],
                match.round && ['ROUND', match.round],
                match.venue && ['VENUE', match.venue],
                ['KICKOFF', fmtDate(match.kickoff, KICKOFF_FORMAT)],
                ['STATUS', statusLabel(match.status, match.elapsed)],
              ].filter(Boolean).map((row: any, i, arr) => (
                <View key={row[0]} style={[styles.infoRow, i < arr.length - 1 && { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>{row[0]}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{row[1]}</Text>
                </View>
              ))}
            </View>

            {events.length > 0 && (
              <>
                <SectionHeader number="02" title="Events" />
                <View style={[styles.timeline, { borderLeftColor: colors.line }]}>
                  {events.map((ev: any, i: number) => (
                    <View key={ev.id ?? i} style={styles.eventRow}>
                      <Text style={[styles.eventTime, { color: colors.muted }]}>{ev.time}'</Text>
                      <View style={[styles.eventDot, {
                        backgroundColor: ev.type === 'GOAL' ? Colors.primary
                          : ev.type?.includes('YELLOW') ? '#F5C518'
                          : ev.type?.includes('RED') ? Colors.primary
                          : colors.muted,
                        transform: ev.type === 'GOAL' ? [{ rotate: '45deg' }] : [],
                        borderRadius: ev.type === 'GOAL' ? 0 : 4,
                      }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.eventType, { color: Colors.primary }]}>{ev.type?.replace(/_/g, ' ')}</Text>
                        <Text style={[styles.eventDesc, { color: colors.text }]}>
                          {ev.homeScorer || ev.awayScorer || ''}{ev.score ? `  ${ev.score}` : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {!goalApiAvailable && (
              <View style={[styles.unavailable, { borderColor: colors.line }]}>
                <Text style={[styles.unavailableText, { color: colors.muted }]}>Detailed match data is not provided for this match</Text>
              </View>
            )}
          </>
        )}

        {/* STATS */}
        {tab === 'STATS' && (
          <>
            <SectionHeader number="01" title="Statistics" />
            {statRows.length > 0 ? (
              <View style={[styles.statsSurface, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                {statRows.map((s: any, i: number) => (
                  <StatBar
                    key={i}
                    label={s.type?.toUpperCase()}
                    left={statValue(s.home)}
                    right={statValue(s.away)}
                    percent={statPercent(s.home, s.away)}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.unavailable, { borderColor: colors.line }]}>
                <Text style={[styles.unavailableText, { color: colors.muted }]}>
                  {emptyMessage('Statistics', goalApiAvailable, match.status, live)}
                </Text>
              </View>
            )}
          </>
        )}

        {/* LINEUP */}
        {tab === 'LINEUP' && (
          <>
            <SectionHeader number="01" title="Lineups" />
            {hasLineups ? (
              <>
                <View style={[styles.lineupHeader, { borderColor: colors.line, backgroundColor: colors.soft }]}>
                  <Text style={[styles.lineupTeam, { color: colors.text }]}>{match.homeTeam}</Text>
                  {lineups.homeFormation && <Text style={[styles.formation, { color: Colors.primary }]}>{lineups.homeFormation}</Text>}
                  {lineups.awayFormation && <Text style={[styles.formation, { color: Colors.primary }]}>{lineups.awayFormation}</Text>}
                  <Text style={[styles.lineupTeam, { color: colors.text, textAlign: 'right' }]}>{match.awayTeam}</Text>
                </View>
                <View style={[styles.lineupGrid, { borderColor: colors.line }]}>
                  {Array.from({ length: Math.max((lineups.home ?? []).length, (lineups.away ?? []).length) }).map((_, i) => {
                    const h = lineups.home?.[i];
                    const a = lineups.away?.[i];
                    return (
                      <View key={i} style={[styles.lineupRow, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
                        <Text style={[styles.lineupNum, { color: Colors.primary }]}>{h?.number ?? ''}</Text>
                        <Text style={[styles.lineupName, { color: colors.text }]} numberOfLines={1}>{h?.name ?? ''}</Text>
                        <Text style={[styles.lineupName, { color: colors.text, textAlign: 'right' }]} numberOfLines={1}>{a?.name ?? ''}</Text>
                        <Text style={[styles.lineupNum, { color: Colors.primary, textAlign: 'right' }]}>{a?.number ?? ''}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={[styles.unavailable, { borderColor: colors.line }]}>
                <Text style={[styles.unavailableText, { color: colors.muted }]}>
                  {emptyMessage('Lineups', goalApiAvailable, match.status, live)}
                </Text>
              </View>
            )}
          </>
        )}

        {/* COMMENTARY */}
        {tab === 'COMMENTARY' && (
          <>
            <SectionHeader number="01" title="Commentary" />
            {commentary.length > 0 ? (
              <View style={[styles.commentaryList, { borderColor: colors.line }]}>
                {[...commentary].reverse().map((c: any, i: number) => (
                  <View key={c.id ?? i} style={[styles.commentaryRow, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
                    <Text style={[styles.commentaryTime, { color: Colors.primary }]}>{c.time ?? ''}'</Text>
                    <Text style={[styles.commentaryText, { color: colors.text }]}>{c.text ?? ''}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.unavailable, { borderColor: colors.line }]}>
                <Text style={[styles.unavailableText, { color: colors.muted }]}>
                  {emptyMessage('Commentary', goalApiAvailable, match.status, live)}
                </Text>
              </View>
            )}
          </>
        )}

        <Text style={[styles.updated, { color: refreshFailed ? Colors.primary : colors.muted }]}>
          {refreshFailed ? 'REFRESH FAILED · ' : ''}SYNCED {fmtDate(match.lastSyncedAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  errorActions: { flexDirection: 'row', gap: 24 },
  scoreboard: { paddingHorizontal: 16, paddingVertical: 16 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  small: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  team: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, textAlign: 'center' },
  scoreCenter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  scoreNum: { fontFamily: Fonts.interTightMedium, fontSize: 62, lineHeight: 68 },
  scoreColon: { fontFamily: Fonts.interTightMedium, fontSize: 62, color: Colors.primary, lineHeight: 68, marginHorizontal: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10 },
  tabs: { height: 46, flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingHorizontal: 16 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabLabel: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  card: { borderWidth: 1, marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  infoLabel: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  infoValue: { fontFamily: Fonts.interTightMedium, fontSize: 12, textAlign: 'right', flex: 1, marginLeft: 16 },
  timeline: { borderLeftWidth: 2, paddingLeft: 14, marginLeft: 8, gap: 16, marginBottom: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eventTime: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, minWidth: 28, paddingTop: 2 },
  eventDot: { width: 9, height: 9, marginTop: 2 },
  eventType: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 8, marginBottom: 2 },
  eventDesc: { fontFamily: Fonts.interTight, fontSize: 11, lineHeight: 15 },
  statsSurface: { borderWidth: 1, padding: 12, marginBottom: 4 },
  lineupHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderWidth: 1, borderBottomWidth: 0, gap: 8 },
  lineupTeam: { fontFamily: Fonts.interTightMedium, fontSize: 11, flex: 1 },
  formation: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10 },
  lineupGrid: { borderWidth: 1, marginBottom: 4 },
  lineupRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  lineupNum: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, width: 20 },
  lineupName: { fontFamily: Fonts.interTightMedium, fontSize: 11, flex: 1 },
  commentaryList: { borderWidth: 1, marginBottom: 4 },
  commentaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  commentaryTime: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, minWidth: 28 },
  commentaryText: { fontFamily: Fonts.interTight, fontSize: 12, flex: 1, lineHeight: 17 },
  unavailable: { borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 4 },
  unavailableText: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, textAlign: 'center' },
  updated: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, textAlign: 'right', paddingVertical: 12 },
});