import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';
import SectionHeader from '../components/layout/SectionHeader';
import Icon from '../components/ui/Icon';
import EmptyCard from '../components/home/EmptyCard';
import FeaturedCarousel from '../components/home/FeaturedCarousel';
import CricketCard from '../components/home/CricketCard';
import MoreLiveSection from '../components/home/MoreLiveSection';
import NextUpSection from '../components/home/NextUpSection';
import SportsGrid from '../components/home/SportsGrid';
import { footballApi, cricketApi, FootballMatch, CricketMatch } from '../services/api';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import { useFollowing } from '../hooks/useFollowing';
import YourTeamsSection from '../components/home/YourTeamSection';
import { buildFollowedTeams, pickYourTeamsMatches } from '../utils/followed';
import { isTop5League, isTop5OrUcl, sortedLive } from '../utils/footballRanking';
import {
  buildFeatured, cleanLive, dedupeMatches, fixEarlyLive, isLiveStatus, isUpcomingStatus, sameMatch,
} from '../utils/featured';
import { errorMessage, isTopCricketMatch, latestSync, settle } from '../utils/homeHelpers';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, scheme } = useAppColors();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32; // matches the ScrollView's 16px horizontal padding

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState({ football: false, cricket: false, fixtures: false });
  const [liveFootball, setLiveFootball] = useState<FootballMatch[]>([]);
  const [liveCricket, setLiveCricket] = useState<CricketMatch[]>([]);
  const [upcomingFootball, setUpcomingFootball] = useState<FootballMatch[]>([]);
  const [nearbyFootball, setNearbyFootball] = useState<FootballMatch[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { items: followingItems, reload: reloadFollowing } = useFollowing();

  // Home stays mounted behind the tabs, so re-read follows whenever it regains focus
  useFocusEffect(useCallback(() => { reloadFollowing(); }, [reloadFollowing]));

  const loadData = useCallback(async (mode: 'initial' | 'pull') => {
    if (mode === 'initial') {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    const today = new Date().toISOString().split('T')[0];
    const [fb, cr, fx, nb] = await Promise.all([
      settle(footballApi.getLive()),
      settle(cricketApi.getLive()),
      settle(footballApi.getFixtures()),
      // Single getByDate(today) — the same call Fixtures uses. Three concurrent getByDate
      // calls hit football-data's ~6s rate limit and time out the 10s client request,
      // so only one provider's slice arrived and most of today's matches were dropped.
      settle(footballApi.getByDate(today)),
    ]);

    if (!fb.ok && !cr.ok && !fx.ok) {
      // Everything failed. On first load show the error screen; on refresh keep the old data.
      if (mode === 'initial') setError(errorMessage(fb.e));
      setFailed({ football: true, cricket: true, fixtures: true });
    } else {
      if (fb.ok) setLiveFootball(sortedLive(cleanLive(fb.v)));
      if (cr.ok) setLiveCricket(cr.v);
      if (fx.ok) setUpcomingFootball(fixEarlyLive(fx.v));
      if (nb.ok) setNearbyFootball(fixEarlyLive(nb.v));
      setFailed({ football: !fb.ok, cricket: !cr.ok, fixtures: !fx.ok });
      const synced = latestSync([
        ...(fb.ok ? fb.v : []),
        ...(cr.ok ? cr.v : []),
        ...(fx.ok ? fx.v : []),
      ]);
      setLastUpdated(synced ?? new Date());
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData('initial');
    // Poll every 30s as backup in case WebSocket drops
    const interval = setInterval(() => loadData('pull'), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useLiveUpdates({
    onFootballUpdate: (matches) => {
      setLiveFootball(sortedLive(cleanLive(matches)));
      setFailed((f) => ({ ...f, football: false }));
      setLastUpdated(latestSync(matches) ?? new Date());
    },
    onCricketUpdate: (matches) => {
      setLiveCricket(matches);
      setFailed((f) => ({ ...f, cricket: false }));
      setLastUpdated(latestSync(matches) ?? new Date());
    },
  });

  // Featured carousel: live big matches, else big results/fixtures within +-24h
  const now = Date.now();
  const todayStr = new Date(now).toISOString().split('T')[0];
  const followed = buildFollowedTeams(followingItems);
  const featured = buildFeatured(liveFootball, nearbyFootball, now, followed);
  const yourTeams = pickYourTeamsMatches(followingItems, [...liveFootball, ...nearbyFootball], now);
  const featuredLive = featured.filter(f => f.mode === 'live').map(f => f.match);
  // Not following any team: "More live" and "Next up" only show top-5-league matches
  const hasFollows = followed.ids.size > 0;
  const moreLive = dedupeMatches(liveFootball)
    .filter(m => !featuredLive.some(f => sameMatch(f, m)))
    .filter(m => hasFollows || (isLiveStatus(m.status) && isTop5League(m)))
    .slice(0, 6);
  // Next up: today's not-yet-started matches from the top 5 leagues + UCL.
  // No team filtering, no count cap. by-date data (yesterday/today/tomorrow) has real
  // statuses and today's full schedule, so it is merged with the fixtures list.
  const upcomingList = dedupeMatches([...nearbyFootball, ...upcomingFootball])
    .filter(m =>
      isUpcomingStatus(m.status) &&
      new Date(m.kickoff).toISOString().split('T')[0] === todayStr &&
      isTop5OrUcl(m))
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

  const heroCricket = liveCricket.find(m => m.matchType === 'test' || m.matchType === 'odi' ||
    isTopCricketMatch(m)) ?? null;
  const anyFailed = failed.football || failed.cricket || failed.fixtures;

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).toUpperCase();

  // Section numbers follow what is actually shown
  let n = 0;
  const nextNo = () => String(++n).padStart(2, '0');
  const yourTeamsNo = yourTeams.length > 0 ? nextNo() : '';
  const featuredNo = nextNo();
  const moreLiveNo = moreLive.length > 0 ? nextNo() : '';
  const nextUpNo = nextNo();
  const sportsNo = nextNo();

  const openMatch = (matchId: string) => navigation.navigate('MatchDetail', { matchId });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData('pull')}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={[styles.homeHead, { marginTop: insets.top, borderBottomColor: colors.line }]}>
        <Image
          source={scheme === 'dark'
            ? require('../../assets/images/logo-wordmark-dark.png')
            : require('../../assets/images/logo-wordmark.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.bellButton}>
          <Icon name="bell" size={20} color={colors.text} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Editorial */}
      <View style={styles.editorial}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>{dateLabel}</Text>
        <Text style={[styles.h1, { color: colors.text }]}>Score  Koto ?</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {loading
            ? 'Loading...'
            : error
              ? 'Connection error — tap to retry'
              : `${failed.football ? '?' : liveFootball.length} live football · ${failed.cricket ? '?' : liveCricket.length} live cricket`}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
      ) : error ? (
        <TouchableOpacity
          style={[styles.errorCard, { borderColor: Colors.primary }]}
          onPress={() => loadData('initial')}
        >
          <Text style={[styles.errorTitle, { color: Colors.primary }]}>CONNECTION ERROR</Text>
          <Text style={[styles.errorMsg, { color: colors.muted }]}>{error}</Text>
          <Text style={[styles.errorRetry, { color: Colors.primary }]}>TAP TO RETRY</Text>
        </TouchableOpacity>
      ) : (
        <>
          <YourTeamsSection
            number={yourTeamsNo}
            matches={yourTeams}
            onSeeAll={() => navigation.navigate('Favorites')}
            onOpenMatch={openMatch}
          />

          {/* Featured */}
          <SectionHeader
            number={featuredNo}
            title="Featured Matches"
            action={`${liveFootball.length + liveCricket.length} LIVE`}
            onAction={() => navigation.navigate('Live')}
          />

          {featured.length > 0 ? (
            <FeaturedCarousel featured={featured} cardWidth={cardWidth} onOpenMatch={openMatch} />
          ) : (
            <EmptyCard
              message={failed.football ? 'Could not load live football' : 'No big football matches right now'}
            />
          )}

          {heroCricket ? (
            <CricketCard match={heroCricket} onPress={() => openMatch(heroCricket.id)} />
          ) : (
            <EmptyCard message={failed.cricket ? 'Could not load live cricket' : 'No live cricket right now'} />
          )}

          {/* 02 More live */}
          <MoreLiveSection
            number={moreLiveNo}
            matches={moreLive}
            onAllLive={() => navigation.navigate('Live')}
            onOpenMatch={openMatch}
          />

          {/* Next up */}
          <NextUpSection
            number={nextUpNo}
            matches={upcomingList}
            failed={failed.fixtures}
            onOpenFixtures={() => navigation.navigate('Fixtures')}
            onOpenMatch={openMatch}
          />

          {/* Your sports */}
          <SportsGrid number={sportsNo} />

          {/* Last updated */}
          {lastUpdated && (
            <Text style={[styles.updated, { color: anyFailed ? Colors.primary : colors.muted }]}>
              {anyFailed ? 'SOME DATA FAILED TO LOAD · PULL TO REFRESH · ' : ''}
              UPDATED {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  homeHead: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  logo: { width: 64, height: 32 },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  notifDot: {
    position: 'absolute', top: 0, right: 0,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  editorial: { paddingVertical: 27 },
  eyebrow: { fontFamily: Fonts.jetbrainsMono, fontSize: 11, marginBottom: 6 },
  h1: { fontFamily: Fonts.ndot55, fontSize: 48, letterSpacing: -1.9, marginBottom: 10, lineHeight: 52 },
  subtitle: { fontFamily: Fonts.jetbrainsMono, fontSize: 13 },
  errorCard: { borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  errorTitle: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 11 },
  errorMsg: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, textAlign: 'center' },
  errorRetry: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, marginTop: 4 },
  updated: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, textAlign: 'right', paddingVertical: 12 },
});