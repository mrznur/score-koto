import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';

interface StatBarProps {
  label: string;
  left: string;
  right: string;
  percent: number;
}

export default function StatBar({ label, left, right, percent }: StatBarProps) {
  const { colors } = useAppColors();
  // Guard against NaN/undefined so the flex values are always valid
  const safePercent = Number.isFinite(percent) ? percent : 50;
  const clampedPercent = Math.min(100, Math.max(0, safePercent));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.value, { color: colors.text }]}>{left}</Text>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.value, styles.valueRight, { color: colors.text }]}>{right}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.segmentLeft, { flex: clampedPercent }]} />
        <View style={[styles.segmentRight, { flex: 100 - clampedPercent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 9,
    minWidth: 32,
  },
  valueRight: {
    textAlign: 'right',
  },
  label: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
    flex: 1,
    textAlign: 'center',
  },
  track: {
    height: 3,
    flexDirection: 'row',
  },
  segmentLeft: {
    backgroundColor: Colors.primary,
  },
  segmentRight: {
    backgroundColor: '#AAAAAA',
  },
});