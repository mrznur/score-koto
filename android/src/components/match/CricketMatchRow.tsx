import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import LiveDot from '../ui/LiveDot';
import TeamBadge from '../ui/TeamBadge';

interface CricketMatchRowProps {
  onClick?: () => void;
}

export default function CricketMatchRow({ onClick }: CricketMatchRowProps) {
  const { colors } = useAppColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.line }]}
      onPress={onClick}
      activeOpacity={onClick ? 0.7 : 1}
    >
      {/* Top meta row */}
      <View style={styles.metaRow}>
        <LiveDot label="2ND INN" />
        <Text style={[styles.ovText, { color: colors.muted }]}>12.4 OV</Text>
      </View>

      {/* India row */}
      <View style={styles.teamRow}>
        <TeamBadge team="India" small />
        <Text style={[styles.teamName, { color: colors.text }]}>INDIA</Text>
        <Text style={[styles.score, { color: colors.text }]}>164/4</Text>
      </View>

      {/* Australia row (dimmed) */}
      <View style={styles.teamRow}>
        <TeamBadge team="Australia" small />
        <Text style={[styles.teamName, { color: colors.muted }]}>AUSTRALIA</Text>
        <Text style={[styles.score, { color: colors.muted }]}>198/7</Text>
      </View>

      {/* Note */}
      <Text style={[styles.note, { color: colors.muted }]}>
        India need 35 from 44 balls · RR 7.84
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ovText: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    fontFamily: Fonts.jetbrainsMonoMedium,
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  score: {
    fontFamily: Fonts.jetbrainsMonoMedium,
    fontSize: 10,
    fontWeight: '500',
  },
  note: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 8,
    marginLeft: 31,
  },
});
