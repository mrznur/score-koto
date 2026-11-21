import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';
import TopBar from '../components/layout/TopBar';
import SectionHeader from '../components/layout/SectionHeader';
import Icon from '../components/ui/Icon';

const SPORTS = [
  { index: '01', name: 'FOOT\nBALL', live: '42 LIVE' },
  { index: '02', name: 'CRIC\nKET', live: '12 LIVE' },
  { index: '03', name: 'BASKET\nBALL', live: '08 LIVE' },
  { index: '04', name: 'TENNIS', live: '21 LIVE' },
];

const COMPETITIONS = [
  ['PL', 'Premier League', 'ENG'],
  ['UCL', 'Champions League', 'EUR'],
  ['IPL', 'Indian Premier League', 'IND'],
  ['NBA', 'National Basketball', 'USA'],
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useAppColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
    >
      <TopBar
        eyebrow="DISCOVER"
        title="Explore"
        action={
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Search box */}
      <TouchableOpacity
        style={[styles.searchBox, { borderColor: colors.line, backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <Icon name="search" size={18} color={colors.muted} />
        <Text style={[styles.searchLabel, { color: colors.muted }]}>
          SEARCH TEAM, LEAGUE, SPORT
        </Text>
      </TouchableOpacity>

      {/* Section 01 Sports */}
      <SectionHeader number="01" title="Sports" />
      <View style={[styles.sportsGrid, { borderColor: colors.line }]}>
        {SPORTS.map((sport, i) => {
          const isRight = i % 2 === 0;
          const isTop = i < 2;
          return (
            <TouchableOpacity
              key={sport.index}
              style={[
                styles.sportCell,
                {
                  borderRightWidth: isRight ? 1 : 0,
                  borderBottomWidth: isTop ? 1 : 0,
                  borderColor: colors.line,
                  backgroundColor: colors.surface,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.sportIndex, { color: Colors.primary }]}>{sport.index}</Text>
              <Text style={[styles.sportName, { color: colors.text }]}>{sport.name}</Text>
              <Text style={[styles.sportLive, { color: colors.muted }]}>{sport.live}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section 02 Your tools */}
      <SectionHeader number="02" title="Your tools" />
      <View style={[styles.toolList, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.toolRow, { borderBottomColor: colors.line }]}
          onPress={() => navigation.navigate('Fixtures')}
          activeOpacity={0.7}
        >
          <View style={styles.toolIcon}>
            <Icon name="calendar" size={20} color={colors.text} />
          </View>
          <View style={styles.toolLabel}>
            <Text style={[styles.toolLabelMain, { color: colors.text }]}>Fixtures + results</Text>
            <Text style={[styles.toolLabelSub, { color: colors.muted }]}>Full match calendar</Text>
          </View>
          <Icon name="chevron" size={16} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolRow, { borderBottomColor: colors.line }]}
          onPress={() => navigation.navigate('Standings')}
          activeOpacity={0.7}
        >
          <View style={styles.toolIcon}>
            <Icon name="table" size={20} color={colors.text} />
          </View>
          <View style={styles.toolLabel}>
            <Text style={[styles.toolLabelMain, { color: colors.text }]}>League standings</Text>
            <Text style={[styles.toolLabelSub, { color: colors.muted }]}>
              Tables across competitions
            </Text>
          </View>
          <Icon name="chevron" size={16} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolRowLast} activeOpacity={0.7}>
          <View style={styles.toolIcon}>
            <Icon name="spark" size={20} color={colors.text} />
          </View>
          <View style={styles.toolLabel}>
            <Text style={[styles.toolLabelMain, { color: colors.text }]}>AI sports assistant</Text>
            <Text style={[styles.toolLabelSub, { color: colors.muted }]}>Ask about any match</Text>
          </View>
          <Icon name="chevron" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Section 03 Popular competitions */}
      <SectionHeader number="03" title="Popular competitions" />
      <View style={[styles.competitionList, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        {COMPETITIONS.map(([code, name, country], i) => (
          <TouchableOpacity
            key={code}
            style={[
              styles.competitionRow,
              {
                borderBottomWidth: i < COMPETITIONS.length - 1 ? 1 : 0,
                borderBottomColor: colors.line,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.compCode, { color: colors.text }]}>{code}</Text>
            <View style={styles.compInfo}>
              <Text style={[styles.compName, { color: colors.text }]}>{name}</Text>
              <Text style={[styles.compCountry, { color: colors.muted }]}>
                {country} · FOLLOWING
              </Text>
            </View>
            <Icon name="chevron" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 4,
  },
  searchBox: {
    height: 42,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 4,
  },
  searchLabel: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 8,
    flex: 1,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    marginBottom: 4,
  },
  sportCell: {
    width: '50%',
    height: 138,
    padding: 14,
    justifyContent: 'space-between',
  },
  sportIndex: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  sportName: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 32,
  },
  sportLive: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  toolList: {
    borderWidth: 1,
    marginBottom: 4,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  toolRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  toolIcon: {
    width: 29,
    alignItems: 'center',
  },
  toolLabel: {
    flex: 1,
    gap: 2,
  },
  toolLabelMain: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 11,
  },
  toolLabelSub: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  competitionList: {
    borderWidth: 1,
    marginBottom: 4,
  },
  competitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  compCode: {
    fontFamily: Fonts.jetbrainsMonoMedium,
    fontSize: 10,
    fontWeight: '600',
    minWidth: 36,
  },
  compInfo: {
    flex: 1,
    gap: 2,
  },
  compName: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 11,
  },
  compCountry: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
});
