import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';
import { useFollowing, FollowType, FollowedItem } from '../hooks/useFollowing';
import Icon from '../components/ui/Icon';

type FilterTab = 'ALL' | 'TEAMS' | 'PLAYERS' | 'COMPETITIONS';
const FILTERS: FilterTab[] = ['ALL', 'TEAMS', 'PLAYERS', 'COMPETITIONS'];

function typeLabel(type: FollowType): string {
  if (type === 'team') return 'TEAM';
  if (type === 'player') return 'PLAYER';
  return 'COMPETITION';
}

function FollowedRow({
  item,
  onUnfollow,
  colors,
}: {
  item: FollowedItem;
  onUnfollow: () => void;
  colors: any;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
      {item.logoUrl ? (
        <Image source={{ uri: item.logoUrl }} style={styles.logo} resizeMode="contain" />
      ) : (
        <View style={[styles.logoBadge, { backgroundColor: colors.soft }]}>
          <Text style={[styles.logoInitial, { color: colors.text }]}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.rowSub, { color: colors.muted }]}>
          {item.subtitle ?? typeLabel(item.type)}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.unfollowBtn, { borderColor: colors.line }]}
        onPress={onUnfollow}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.unfollowText, { color: colors.muted }]}>UNFOLLOW</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppColors();
  const { items, unfollow } = useFollowing();
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const filtered = items.filter(i => {
    if (filter === 'ALL') return true;
    if (filter === 'TEAMS') return i.type === 'team';
    if (filter === 'PLAYERS') return i.type === 'player';
    if (filter === 'COMPETITIONS') return i.type === 'competition';
    return true;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.line, paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>SAVED LOCALLY</Text>
          <Text style={[styles.title, { color: colors.text }]}>Following</Text>
        </View>
        <View style={[styles.countBadge, { borderColor: colors.line }]}>
          <Text style={[styles.countText, { color: colors.muted }]}>{items.length}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.line }]}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={styles.filterTab} onPress={() => setFilter(f)}>
            <Text style={[styles.filterLabel, { color: filter === f ? colors.text : colors.muted }]}>{f}</Text>
            {filter === f && <View style={[styles.filterBar, { backgroundColor: Colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 ? (
        // Empty state
        <View style={styles.empty}>
          <Icon name="star" size={32} color={colors.line} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing followed yet</Text>
          <Text style={[styles.emptyNote, { color: colors.muted }]}>
            Follow teams, players and competitions from their pages.{'\n'}They'll appear here for quick access.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyNote, { color: colors.muted }]}>No {filter.toLowerCase()} followed</Text>
        </View>
      ) : (
        <>
          {/* Group by type */}
          {(['team', 'competition', 'player'] as FollowType[]).map(type => {
            const group = filtered.filter(i => i.type === type);
            if (group.length === 0) return null;
            return (
              <View key={type}>
                <View style={[styles.groupHeader, { borderBottomColor: colors.line }]}>
                  <Text style={[styles.groupLabel, { color: colors.muted }]}>
                    {type === 'team' ? 'TEAMS' : type === 'player' ? 'PLAYERS' : 'COMPETITIONS'}
                  </Text>
                  <Text style={[styles.groupCount, { color: colors.muted }]}>{group.length}</Text>
                </View>
                <View style={[styles.list, { borderColor: colors.line }]}>
                  {group.map(item => (
                    <FollowedRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onUnfollow={() => unfollow(item.id, item.type)}
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          {/* Info note */}
          <Text style={[styles.note, { color: colors.muted }]}>
            Saved on this device only. No account required.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  eyebrow: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, marginBottom: 4 },
  title: { fontFamily: Fonts.ndot55, fontSize: 36, letterSpacing: -1 },
  countBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  countText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, height: 44, alignItems: 'center' },
  filterTab: { paddingRight: 16, height: '100%', justifyContent: 'center', position: 'relative' },
  filterLabel: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
  filterBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  groupLabel: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
  groupCount: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  list: { borderBottomWidth: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  logo: { width: 36, height: 36 },
  logoBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: Fonts.interTightMedium, fontSize: 13, marginBottom: 2 },
  rowSub: { fontFamily: Fonts.jetbrainsMono, fontSize: 9 },
  unfollowBtn: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  unfollowText: { fontFamily: Fonts.jetbrainsMono, fontSize: 8 },
  empty: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: Fonts.interTightMedium, fontSize: 16, marginTop: 8 },
  emptyNote: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, textAlign: 'center', lineHeight: 16 },
  note: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, textAlign: 'center', paddingVertical: 20 },
});
