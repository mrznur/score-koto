import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import Icon from '../ui/Icon';

interface SectionHeaderProps {
  number: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionHeader({ number, title, action, onAction }: SectionHeaderProps) {
  const { colors } = useAppColors();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.number}>{number}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.text }]}>{action}</Text>
          <Icon name="arrow" size={12} color={colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  number: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 10,
    color: Colors.primary,
  },
  title: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 10,
  },
});