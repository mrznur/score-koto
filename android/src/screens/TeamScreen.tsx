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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';
import TopBar from '../components/layout/TopBar';
import SectionHeader from '../components/layout/SectionHeader';
import FootballMatchRow from '../components/match/FootballMatchRow';
import { footballApi } from '../services/api';
import { useFollowing } from '../hooks/useFollowing';

const TABS = ['OVERVIEW', 'SQUAD', 'RESULTS', 'FIXTURES'];

function isLive(s: string) { return ['1H','HT','2H','ET','P','BT'].includes(s); }
function isFinished(s: string) { return ['FT','AET','PEN'].includes(s); }

function matchStatus(m: any): string {
  if (isLive(m.matchStatus ?? m.status ?? '')) return m.matchMinute ? `${m.matchMinute}'` : 'LIVE';
  if (isFinished(m.matchStatus ?? m.status ?? '')) return 'FT';
  if (m.kickoffUtc) return new Date(m.kickoffUtc).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return '';
}

function matchScore(m: any): string {
  const hs = m.homeTeamFtScore ?? m.homeTeamScore;
  const as = m.awayTeamFtScore ?? m.awayTeamScore;
  if (hs != null && as != null) return `${hs} - ${as}`;
  return '-';
}

function positionColor(type: string): string {
  if (type === 'Goalkeeper') return '#f59e0b';
  if (type === 'Defender') return '#2563eb';
  if (type === 'Midfielder') return '#10b981';
  if (type === 'Attacker') return Colors.primary;
  return '#888';
}

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useAppColors();
  const { follow, unfollow, isFollowing } = useFollowing();

  const { teamId, teamName } = route.params ?? {};
  const [tab, setTab] = useState('OVERVIEW');
  const [team, setTeam] = useState<any>(null);
  const [squad, setSquad] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    Promise.all([
      footballApi.getTeam(teamId),
      footballApi.getTeamSquad(teamId),
      footballApi.getTeamResults(teamId),
      footballApi.getTeamFixtures(teamId),
    ]).then(([t, s, r, f]) => {
      setTeam(t);
      setSquad(Array.isArray(s) ? s : []);
      setResults(Array.isArray(r) ? r.slice(0, 10) : []);
      setFixtures(Array.isArray(f) ? f.slice(0, 10) : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [teamId]);

  const following = isFollowing(teamId, 'team');

  const toggleFollow = () => {
    if (following) {
      unfollow(teamId, 'team');
    } else {
      follow({
        id: teamId,
        type: 'team',
        name: team?.name ?? teamName ?? '',
        logoUrl: team?.badge ?? null,
        subtitle: team?.country ?? '',
      });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Group squad by position
  const grouped = squad.reduce((acc: Record<string, any[]>, p: any) => {
    const pos = p.type ?? 'Other';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});
  const posOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top }}>
        <TopBar
          eyebrow={team?.country?.toUpperCase() ?? ''}
          title={team?.name ?? teamName ?? 'Team'}
          onBack={() => navigation.goBack()}
          action={
            <TouchableOpacity
              style={[styles.followBtn, {
                backgroundColor: following ? Colors.primary : 'transparent',
                borderColor: following ? Colors.primary : colors.line,
              }]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followText, { color: following ? '#fff' : colors.text }]}>
                {following ? 'FOLLOWING' : '+ FOLLOW'}
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Team header */}
      <View style={[styles.teamHeader, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
        {team?.badge ? (
          <Image source={{ uri: team.badge }} style={styles.teamBadge} resizeMode="contain" />
        ) : null}
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, { color: colors.text }]}>{team?.name ?? teamName}</Text>
          {team?.venueName && (
            <Text style={[styles.teamMeta, { color: colors.muted }]}>{team.venueName}</Text>
          )}
          {team?.founded && (
            <Text style={[styles.teamMeta, { color: colors.muted }]}>Est. {team.founded}</Text>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.line }]}>
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
            <SectionHeader number="01" title="Club info" />
            <View style={[styles.infoCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              {[
                ['NAME', team?.name],
                ['COUNTRY', team?.country],
                ['STADIUM', team?.venueName],
                ['CITY', team?.venueCity],
                ['CAPACITY', team?.venueCapacity ? Number(team.venueCapacity).toLocaleString() : null],
                ['FOUNDED', team?.founded],
              ].filter(r => r[1]).map(([label, value], i, arr) => (
                <View key={label} style={[styles.infoRow, i < arr.length - 1 && { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
                </View>
              ))}
            </View>

            {results.length > 0 && (
              <>
                <SectionHeader number="02" title="Recent results" />
                <View style={[styles.matchList, { borderColor: colors.line }]}>
                  {results.slice(0, 5).map((m: any, i: number) => (
                    <FootballMatchRow
                      key={m.id ?? i}
                      home={m.homeTeamName}
                      away={m.awayTeamName}
                      homeLogo={m.teamHomeBadge ?? null}
                      awayLogo={m.teamAwayBadge ?? null}
                      score={matchScore(m)}
                      status="FT"
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* SQUAD */}
        {tab === 'SQUAD' && (
          <>
            {posOrder.map(pos => {
              const players = grouped[pos] ?? [];
              if (players.length === 0) return null;
              return (
                <View key={pos}>
                  <SectionHeader number="" title={pos.toUpperCase()} />
                  <View style={[styles.squadList, { borderColor: colors.line }]}>
                    {players.map((p: any, i: number) => (
                      <View key={p.id ?? i} style={[styles.playerRow, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
                        {p.image ? (
                          <Image source={{ uri: p.image }} style={styles.playerImg} resizeMode="cover" />
                        ) : (
                          <View style={[styles.playerImgPlaceholder, { backgroundColor: colors.soft }]}>
                            <Text style={[styles.playerInitial, { color: colors.muted }]}>
                              {p.name?.charAt(0) ?? '?'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.playerInfo}>
                          <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                          <Text style={[styles.playerMeta, { color: colors.muted }]}>
                            {[p.nationality, p.age && `Age ${p.age}`].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                        <View style={[styles.posBadge, { backgroundColor: positionColor(pos) + '22', borderColor: positionColor(pos) }]}>
                          <Text style={[styles.posText, { color: positionColor(pos) }]}>
                            {pos === 'Goalkeeper' ? 'GK' : pos === 'Defender' ? 'DEF' : pos === 'Midfielder' ? 'MID' : 'ATT'}
                          </Text>
                        </View>
                        {p.number && (
                          <Text style={[styles.playerNumber, { color: colors.muted }]}>#{p.number}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* RESULTS */}
        {tab === 'RESULTS' && (
          <>
            <SectionHeader number="01" title={`Last ${results.length} results`} />
            {results.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No results available</Text>
            ) : (
              <View style={[styles.matchList, { borderColor: colors.line }]}>
                {results.map((m: any, i: number) => (
                  <FootballMatchRow
                    key={m.id ?? i}
                    home={m.homeTeamName}
                    away={m.awayTeamName}
                    homeLogo={m.teamHomeBadge ?? null}
                    awayLogo={m.teamAwayBadge ?? null}
                    score={matchScore(m)}
                    status="FT"
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* FIXTURES */}
        {tab === 'FIXTURES' && (
          <>
            <SectionHeader number="01" title="Upcoming fixtures" />
            {fixtures.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No upcoming fixtures</Text>
            ) : (
              <View style={[styles.matchList, { borderColor: colors.line }]}>
                {fixtures.map((m: any, i: number) => (
                  <FootballMatchRow
                    key={m.id ?? i}
                    home={m.homeTeamName}
                    away={m.awayTeamName}
                    homeLogo={m.teamHomeBadge ?? null}
                    awayLogo={m.teamAwayBadge ?? null}
                    score="-"
                    status={matchStatus(m)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  followBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  followText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1 },
  teamBadge: { width: 64, height: 64 },
  teamInfo: { flex: 1 },
  teamName: { fontFamily: Fonts.interTightMedium, fontSize: 20, marginBottom: 4 },
  teamMeta: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16, height: 44 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabLabel: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  infoCard: { borderWidth: 1, marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  infoLabel: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  infoValue: { fontFamily: Fonts.interTightMedium, fontSize: 12, textAlign: 'right', flex: 1, marginLeft: 16 },
  matchList: { borderWidth: 1, marginBottom: 4 },
  squadList: { borderWidth: 1, marginBottom: 4 },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, borderBottomWidth: 1 },
  playerImg: { width: 36, height: 36, borderRadius: 18 },
  playerImgPlaceholder: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playerInitial: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14 },
  playerInfo: { flex: 1 },
  playerName: { fontFamily: Fonts.interTightMedium, fontSize: 13 },
  playerMeta: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, marginTop: 2 },
  posBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  posText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 8 },
  playerNumber: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, width: 28, textAlign: 'right' },
  empty: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, textAlign: 'center', paddingVertical: 24 },
});
