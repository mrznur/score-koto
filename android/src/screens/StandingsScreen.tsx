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
import Icon from '../components/ui/Icon';
import { footballApi } from '../services/api';

type League = { id: string; name: string; country: string; flag: string };

function promotionColor(promotion: string | null): string | null {
  if (!promotion) return null;
  const p = promotion.toLowerCase();
  if (p.includes('champions league') || p.includes('promotion')) return '#2563eb';
  if (p.includes('europa league')) return '#f59e0b';
  if (p.includes('conference')) return '#10b981';
  if (p.includes('relegation')) return Colors.primary;
  return null;
}

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useAppColors();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  // Load top leagues on mount
  useEffect(() => {
    footballApi.getTopLeagues()
      .then(data => {
        setLeagues(data);
        if (data.length > 0) selectLeague(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingLeagues(false));
  }, []);

  const selectLeague = async (league: League) => {
    setSelectedLeague(league);
    setRows([]);
    setLoadingTable(true);
    try {
      const data = await footballApi.getStandings(league.id);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('standings error:', e);
    } finally {
      setLoadingTable(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top }}>
        <TopBar
          eyebrow="TABLES"
          title="Standings"
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* League selector */}
      {loadingLeagues ? (
        <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueScroll}
          style={[styles.leagueBar, { borderBottomColor: colors.line }]}
        >
          {leagues.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[
                styles.leagueChip,
                {
                  backgroundColor: selectedLeague?.id === l.id ? colors.text : colors.surface,
                  borderColor: selectedLeague?.id === l.id ? colors.text : colors.line,
                },
              ]}
              onPress={() => selectLeague(l)}
            >
              {l.flag ? (
                <Image source={{ uri: l.flag }} style={styles.chipFlag} resizeMode="contain" />
              ) : null}
              <Text style={[
                styles.chipText,
                { color: selectedLeague?.id === l.id ? colors.bg : colors.text },
              ]}>
                {l.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* League header */}
      {selectedLeague && (
        <View style={[styles.leagueHeader, { borderBottomColor: colors.line }]}>
          {selectedLeague.flag && (
            <Image source={{ uri: selectedLeague.flag }} style={styles.leagueFlag} resizeMode="contain" />
          )}
          <View>
            <Text style={[styles.leagueName, { color: colors.text }]}>{selectedLeague.name}</Text>
            <Text style={[styles.leagueCountry, { color: colors.muted }]}>{selectedLeague.country.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Table header */}
      {!loadingTable && rows.length > 0 && (
        <View style={[styles.tableHead, { borderBottomColor: colors.line, backgroundColor: colors.soft }]}>
          <Text style={[styles.thPos, { color: colors.muted }]}>#</Text>
          <Text style={[styles.thTeam, { color: colors.muted }]}>TEAM</Text>
          <Text style={[styles.thStat, { color: colors.muted }]}>P</Text>
          <Text style={[styles.thStat, { color: colors.muted }]}>W</Text>
          <Text style={[styles.thStat, { color: colors.muted }]}>D</Text>
          <Text style={[styles.thStat, { color: colors.muted }]}>L</Text>
          <Text style={[styles.thStat, { color: colors.muted }]}>GD</Text>
          <Text style={[styles.thPts, { color: colors.muted }]}>PTS</Text>
        </View>
      )}

      {/* Table rows */}
      {loadingTable ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No standings available</Text>
        </View>
      ) : (
        <View style={[styles.table, { borderColor: colors.line }]}>
          {rows.map((row: any, i: number) => {
            const pos = parseInt(row.overallLeaguePosition ?? '0');
            const played = row.overallLeaguePlayed ?? '-';
            const won = row.overallLeagueW ?? '-';
            const drawn = row.overallLeagueD ?? '-';
            const lost = row.overallLeagueL ?? '-';
            const gf = parseInt(row.overallLeagueGF ?? '0');
            const ga = parseInt(row.overallLeagueGA ?? '0');
            const gd = isNaN(gf - ga) ? '-' : (gf - ga > 0 ? `+${gf - ga}` : String(gf - ga));
            const pts = row.overallLeaguePTS ?? '-';
            const badge = row.team?.badge ?? null;
            const promoColor = promotionColor(row.overallPromotion);

            return (
              <View
                key={row.id ?? i}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.line, backgroundColor: colors.surface },
                  promoColor ? { borderLeftWidth: 3, borderLeftColor: promoColor } : {},
                ]}
              >
                <Text style={[styles.tdPos, { color: colors.muted }]}>{pos}</Text>
                <View style={styles.tdTeam}>
                  {badge ? (
                    <Image source={{ uri: badge }} style={styles.teamBadge} resizeMode="contain" />
                  ) : (
                    <View style={[styles.teamBadgePlaceholder, { backgroundColor: colors.soft }]} />
                  )}
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {row.teamName}
                  </Text>
                </View>
                <Text style={[styles.tdStat, { color: colors.muted }]}>{played}</Text>
                <Text style={[styles.tdStat, { color: colors.muted }]}>{won}</Text>
                <Text style={[styles.tdStat, { color: colors.muted }]}>{drawn}</Text>
                <Text style={[styles.tdStat, { color: colors.muted }]}>{lost}</Text>
                <Text style={[styles.tdStat, { color: colors.muted }]}>{gd}</Text>
                <Text style={[styles.tdPts, { color: colors.text }]}>{pts}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Promotion key */}
      {rows.length > 0 && (
        <View style={styles.key}>
          {[
            { color: '#2563eb', label: 'Champions League' },
            { color: '#f59e0b', label: 'Europa League' },
            { color: '#10b981', label: 'Conference League' },
            { color: Colors.primary, label: 'Relegation' },
          ].map(k => (
            <View key={k.label} style={styles.keyRow}>
              <View style={[styles.keyDot, { backgroundColor: k.color }]} />
              <Text style={[styles.keyLabel, { color: colors.muted }]}>{k.label}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  leagueBar: { borderBottomWidth: 1, maxHeight: 56 },
  leagueScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  leagueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1,
  },
  chipFlag: { width: 16, height: 11 },
  chipText: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  leagueHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  leagueFlag: { width: 28, height: 19 },
  leagueName: { fontFamily: Fonts.interTightMedium, fontSize: 16 },
  leagueCountry: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, marginTop: 2 },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  thPos: { fontFamily: Fonts.jetbrainsMono, fontSize: 7, width: 24, textAlign: 'center' },
  thTeam: { fontFamily: Fonts.jetbrainsMono, fontSize: 7, flex: 1 },
  thStat: { fontFamily: Fonts.jetbrainsMono, fontSize: 7, width: 26, textAlign: 'center' },
  thPts: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 7, width: 30, textAlign: 'center' },
  table: { borderTopWidth: 0 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1,
  },
  tdPos: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, width: 24, textAlign: 'center' },
  tdTeam: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamBadge: { width: 20, height: 20 },
  teamBadgePlaceholder: { width: 20, height: 20 },
  teamName: { fontFamily: Fonts.interTightMedium, fontSize: 12, flex: 1 },
  tdStat: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, width: 26, textAlign: 'center' },
  tdPts: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 12, width: 30, textAlign: 'center' },
  key: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyDot: { width: 8, height: 8, borderRadius: 4 },
  keyLabel: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontFamily: Fonts.jetbrainsMono, fontSize: 10 },
});
