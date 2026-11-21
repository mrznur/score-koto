import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';

interface FilterBarProps {
  labels: string[];
}

export default function FilterBar({ labels }: FilterBarProps) {
  const [active, setActive] = useState(0);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {labels.map((label, index) => (
          <TouchableOpacity
            key={label}
            onPress={() => setActive(index)}
            style={styles.tab}
          >
            <Text
              style={[
                styles.label,
                active === index ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {label}
            </Text>
            {active === index && <View style={styles.activeBorder} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 47,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.line,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 18,
    height: 47,
  },
  tab: {
    height: 47,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 9,
  },
  labelActive: {
    color: Colors.light.text,
  },
  labelInactive: {
    color: Colors.light.muted,
  },
  activeBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
  },
});
