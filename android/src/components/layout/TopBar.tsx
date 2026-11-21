import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';

interface TopBarProps {
  eyebrow?: string;
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export default function TopBar({ eyebrow, title, onBack, action }: TopBarProps) {
  const { colors } = useAppColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.line }]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleColumn}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: colors.muted }]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      </View>
      {action ? <View style={styles.right}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    marginRight: 4,
  },
  backText: {
    fontFamily: Fonts.interTight,
    fontSize: 24,
  },
  titleColumn: {
    flexDirection: 'column',
  },
  eyebrow: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 9,
  },
  title: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 30,
  },
  right: {
    alignItems: 'flex-end',
  },
});