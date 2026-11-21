import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { teams } from '../../constants/teams';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';

interface TeamBadgeProps {
  team: string;
  small?: boolean;
  logoUrl?: string | null;
}

export default function TeamBadge({ team, small = false, logoUrl }: TeamBadgeProps) {
  const { colors } = useAppColors();
  const teamData = teams[team];
  const color = teamData?.color ?? '#888888';
  const initial = team.charAt(0).toUpperCase();

  const size = small ? 21 : 34;
  const fontSize = small ? 8 : 12;
  const logoSize = small ? 14 : 24;

  if (logoUrl) {
    return (
      <View style={[styles.logoWrapper, { width: size, height: size }]}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { width: size, height: size, borderColor: color }]}>
      <View style={[styles.bar, { backgroundColor: color, width: 4, height: size - 2 }]} />
      <Text style={[styles.initial, { fontSize, color: colors.text }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  initial: {
    fontFamily: Fonts.ndot57,
    flex: 1,
    textAlign: 'center',
    marginLeft: 4,
  },
});