import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import LiveDot from '../ui/LiveDot';
import RemoteImage from './RemoteImage';
import { CricketMatch } from '../../services/api';
import { cricketScore } from '../../utils/homeHelpers';

export default function CricketCard({
  match, onPress,
}: { match: CricketMatch; onPress: () => void }) {
  const { colors } = useAppColors();

  return (
    <TouchableOpacity
      style={[styles.cricketCard, { borderColor: colors.line, backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cricketMeta}>
        <LiveDot label={match.matchType.toUpperCase()} />
        <Text style={[styles.cricketMetaText, { color: colors.muted }]} numberOfLines={1}>
          {match.name}
        </Text>
      </View>
      {match.teams.slice(0, 2).map((team, i) => {
        const info = match.teamInfo?.find(t => t.name === team);
        const score = cricketScore(match, team, i);
        return (
          <View key={team} style={[styles.cricketTeamRow, i > 0 && { opacity: 0.55 }]}>
            <RemoteImage uri={info?.img} size={22} fallbackTeam={team} />
            <Text style={[styles.cricketTeamName, { color: colors.text }]} numberOfLines={1}>
              {info?.shortname ?? team.toUpperCase()}
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

const styles = StyleSheet.create({
  cricketCard: { borderWidth: 1, borderTopWidth: 0, padding: 12, marginBottom: 1 },
  cricketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cricketMetaText: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, flex: 1 },
  cricketTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cricketTeamName: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 12, flex: 1 },
  cricketScore: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14 },
  cricketStatus: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, marginTop: 4, lineHeight: 16 },
});