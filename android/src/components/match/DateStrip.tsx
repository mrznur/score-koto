import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';

function generateDates() {
  const days = [];
  const today = new Date();
  for (let i = -4; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: d.getDate().toString(),
      fullDate: d.toISOString().split('T')[0],
      isToday: i === 0,
      isFuture: i > 0,
    });
  }
  return days;
}

interface DateStripProps {
  onDateChange?: (date: string) => void;
}

export default function DateStrip({ onDateChange }: DateStripProps) {
  const { colors } = useAppColors();
  const dates = generateDates();
  const todayIndex = 4;
  const [selected, setSelected] = useState(todayIndex);

  const handlePress = (index: number) => {
    setSelected(index);
    onDateChange?.(dates[index].fullDate);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, { borderColor: colors.line, backgroundColor: colors.surface }]}
      contentOffset={{ x: (todayIndex - 2) * 58, y: 0 }}
    >
      {dates.map((item, index) => {
        const isActive = selected === index;
        return (
          <TouchableOpacity
            key={item.fullDate}
            onPress={() => handlePress(index)}
            style={[
              styles.cell,
              isActive && { backgroundColor: colors.text, margin: 4, height: 46 },
            ]}
          >
            <Text style={[
              styles.day,
              { color: isActive ? colors.bg : colors.muted },
              item.isToday && !isActive && { color: Colors.primary },
            ]}>
              {item.isToday ? 'TODAY' : item.label}
            </Text>
            <Text style={[
              styles.date,
              { color: isActive ? colors.bg : item.isFuture ? colors.muted : colors.text },
            ]}>
              {item.date}
            </Text>
            {item.isFuture && !isActive && (
              <View style={[styles.futureDot, { backgroundColor: colors.line }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexGrow: 0,
  },
  cell: {
    width: 58,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  day: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  date: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 15,
  },
  futureDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginTop: 1,
  },
});
