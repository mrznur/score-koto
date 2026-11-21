import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import Icon from '../ui/Icon';
import LiveDot from '../ui/LiveDot';
import TeamBadge from '../ui/TeamBadge';

interface FootballMatchRowProps {
  home: string;
  away: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  score: string;
  status: string;
  onClick?: () => void;
  favourite?: boolean;
}

export default function FootballMatchRow({
  home,
  away,
  homeLogo,
  awayLogo,
  score,
  status,
  onClick,
  favourite = false,
}: FootballMatchRowProps) {
  const { colors } = useAppColors();
  const [fav, setFav] = useState(favourite);
  const scoreParts = score.split('-').map((s) => s.trim());

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.line }]}
      onPress={onClick}
      activeOpacity={onClick ? 0.7 : 1}
    >
      {/* Status */}
      <View style={styles.timeCol}>
        {status.includes("'")
          ? <LiveDot label={status} />
          : <Text style={[styles.timeText, { color: colors.muted }]}>{status}</Text>
        }
      </View>

      {/* Teams */}
      <View style={styles.teamsCol}>
        <View style={styles.teamRow}>
          <TeamLogo uri={homeLogo} name={home} />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>{home}</Text>
        </View>
        <View style={styles.teamRow}>
          <TeamLogo uri={awayLogo} name={away} />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>{away}</Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreCol}>
        {scoreParts.map((s, i) => (
          <Text key={i} style={[styles.scoreValue, { color: colors.text }]}>{s}</Text>
        ))}
      </View>

      {/* Favourite */}
      <TouchableOpacity
        style={styles.favCol}
        onPress={(e) => { e.stopPropagation?.(); setFav(!fav); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="star" size={15} color={fav ? Colors.primary : colors.line} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function TeamLogo({ uri, name }: { uri?: string | null; name: string }) {
  const [error, setError] = useState(false);
  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={styles.logo}
        resizeMode="contain"
        onError={() => setError(true)}
      />
    );
  }
  return <TeamBadge team={name} small />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 75,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  timeCol: { width: 47, alignItems: 'flex-start', justifyContent: 'center' },
  timeText: { fontFamily: Fonts.jetbrainsMono, fontSize: 11 },
  teamsCol: { flex: 1, justifyContent: 'center', gap: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 22, height: 22 },
  teamName: { fontFamily: Fonts.interTightMedium, fontSize: 13, flex: 1 },
  scoreCol: { width: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
  scoreValue: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14, textAlign: 'center' },
  favCol: { width: 22, alignItems: 'center', justifyContent: 'center' },
});
