import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';

export default function EmptyCard({ message }: { message: string }) {
  const { colors } = useAppColors();
  return (
    <View style={[styles.emptyCard, { borderColor: colors.line }]}>
      <Text style={[styles.emptyText, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: { borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 1 },
  emptyText: { fontFamily: Fonts.jetbrainsMono, fontSize: 10 },
});