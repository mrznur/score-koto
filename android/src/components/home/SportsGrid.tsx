import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import SectionHeader from '../layout/SectionHeader';
import Icon from '../ui/Icon';

export default function SportsGrid({ number }: { number: string }) {
  const { colors } = useAppColors();

  return (
    <>
      <SectionHeader number={number} title="Your sports" />
      <View style={[styles.sportsGrid, { borderColor: colors.line }]}>
        {(['FOOTBALL', 'CRICKET', 'BASKETBALL'] as const).map((sport, i) => (
          <TouchableOpacity
            key={sport}
            style={[styles.sportCell, {
              borderRightWidth: i < 2 ? 1 : 0,
              borderRightColor: colors.line,
              backgroundColor: colors.surface,
            }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.sportIndex, { color: Colors.primary }]}>0{i + 1}</Text>
            <Text style={[styles.sportName, { color: colors.text }]}>{sport}</Text>
            <Icon name="arrow" size={16} color={colors.text} />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sportsGrid: { flexDirection: 'row', borderWidth: 1, marginTop: 2 },
  sportCell: { flex: 1, padding: 12, gap: 4, justifyContent: 'space-between', minHeight: 80 },
  sportIndex: { fontFamily: Fonts.jetbrainsMono, fontSize: 10 },
  sportName: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 11, flex: 1 },
});