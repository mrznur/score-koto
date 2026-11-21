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
import TeamBadge from '../components/ui/TeamBadge';
import Toggle from '../components/ui/Toggle';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, toggle } = useAppColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
    >
      <TopBar
        eyebrow="MEMBER SINCE 2023"
        title="Profile"
        action={
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="settings" size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Profile card */}
      <View style={[styles.profileCard, { borderBottomColor: colors.line }]}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>AD</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>Alex D.</Text>
          <Text style={[styles.profileSub, { color: colors.muted }]}>London · GMT +1</Text>
        </View>
        <Text style={[styles.editLabel, { color: colors.muted }]}>EDIT</Text>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsBar, { borderBottomColor: colors.line }]}>
        {[['04', 'TEAMS'], ['07', 'LEAGUES'], ['08', 'FRIENDS']].map(([num, label], i) => (
          <View
            key={label}
            style={[
              styles.statCell,
              {
                borderRightWidth: i < 2 ? 1 : 0,
                borderRightColor: colors.line,
              },
            ]}
          >
            <Text style={[styles.statNum, { color: colors.text }]}>{num}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Section 01 Favourites */}
      <SectionHeader number="01" title="Favourites" />
      <View style={[styles.listSurface, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        {(['Arsenal', 'India', 'Barcelona'] as string[]).map((team, i) => (
          <TouchableOpacity
            key={team}
            style={[
              styles.teamRow,
              { borderBottomColor: colors.line, borderBottomWidth: 1 },
            ]}
            activeOpacity={0.7}
          >
            <TeamBadge team={team} />
            <View style={styles.teamInfo}>
              <Text style={[styles.teamName, { color: colors.text }]}>{team}</Text>
              <Text style={[styles.teamSport, { color: colors.muted }]}>
                {team === 'India' ? 'CRICKET' : 'FOOTBALL'}
              </Text>
            </View>
            <Icon name="chevron" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.addTeamRow, { borderColor: colors.line }]}
          activeOpacity={0.7}
        >
          <View style={[styles.addTeamPlus, { borderColor: colors.line }]}>
            <Text style={[styles.addTeamPlusText, { color: colors.muted }]}>+</Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={[styles.teamName, { color: colors.text }]}>Add team</Text>
            <Text style={[styles.teamSport, { color: colors.muted }]}>PERSONALISE SCORES</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Section 02 Preferences */}
      <SectionHeader number="02" title="Preferences" />
      <View style={[styles.listSurface, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        <View style={[styles.prefRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
          <View style={styles.prefInfo}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>Dark appearance</Text>
            <Text style={[styles.prefSub, { color: colors.muted }]}>Use black system surfaces</Text>
          </View>
          <Toggle defaultOn={false} />
        </View>
        <View style={[styles.prefRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
          <View style={styles.prefInfo}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>Goal alerts</Text>
            <Text style={[styles.prefSub, { color: colors.muted }]}>Favourite teams only</Text>
          </View>
          <Toggle defaultOn />
        </View>
        <View style={[styles.prefRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
          <View style={styles.prefInfo}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>Match reminders</Text>
            <Text style={[styles.prefSub, { color: colors.muted }]}>15 minutes before start</Text>
          </View>
          <Toggle defaultOn />
        </View>
        <TouchableOpacity style={styles.prefRowLast} activeOpacity={0.7}>
          <View style={styles.prefInfo}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>AI detail level</Text>
            <Text style={[styles.prefSub, { color: colors.muted }]}>Technical</Text>
          </View>
          <Icon name="chevron" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Wide action button */}
      <TouchableOpacity
        style={[styles.wideAction, { borderColor: colors.line, backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.wideActionText, { color: colors.text }]}>MANAGE FRIENDS</Text>
        <Icon name="arrow" size={16} color={colors.text} />
      </TouchableOpacity>

      {/* Version */}
      <Text style={[styles.version, { color: colors.muted }]}>
        SCORE KOTO · VERSION 1.0.4 · BUILD 204
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    gap: 14,
  },
  profileAvatar: {
    width: 55,
    height: 55,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 12,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 18,
    fontWeight: '500',
  },
  profileSub: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 8,
  },
  editLabel: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  statsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statNum: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 19,
  },
  statLabel: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 6,
  },
  listSurface: {
    borderWidth: 1,
    marginBottom: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  teamInfo: {
    flex: 1,
    gap: 3,
  },
  teamName: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 11,
    fontWeight: '500',
  },
  teamSport: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  addTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  addTeamPlus: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTeamPlusText: {
    fontSize: 20,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  prefRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  prefInfo: {
    flex: 1,
    gap: 3,
  },
  prefLabel: {
    fontFamily: Fonts.interTightMedium,
    fontSize: 11,
    fontWeight: '500',
  },
  prefSub: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 7,
  },
  wideAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 16,
  },
  wideActionText: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 9,
  },
  version: {
    fontFamily: Fonts.jetbrainsMono,
    fontSize: 6,
    textAlign: 'right',
    paddingBottom: 8,
  },
});
