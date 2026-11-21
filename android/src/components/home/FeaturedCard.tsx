import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import Icon from '../ui/Icon';
import LiveDot from '../ui/LiveDot';
import RemoteImage from './RemoteImage';
import { FeaturedItem, kickoffTime } from '../../utils/featured';
import { canonicalCompetition } from '../../utils/footballRanking';

export default function FeaturedCard({
    item, width, onPress,
}: { item: FeaturedItem; width: number; onPress: () => void }) {
    const { match: m, mode } = item;
    const label =
        mode === 'live' ? 'FEATURED MATCH' : mode === 'result' ? 'FULL TIME' : 'UP NEXT';

    return (
        <TouchableOpacity style={[styles.heroMatch, { width }]} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.heroLabel}>
                <Text style={styles.heroLabelText}>{label}</Text>
                {mode === 'live' && <LiveDot label={m.elapsed ? `${m.elapsed}'` : m.status} />}
                {mode === 'result' && <Text style={styles.heroStatusText}>FT</Text>}
                {mode === 'upcoming' && (
                    <Text style={styles.heroStatusText}>
                        {new Date(m.kickoff).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
                    </Text>
                )}
            </View>
            <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText} numberOfLines={1}>
                    {canonicalCompetition(m.competition, m.country).toUpperCase()}{m.round ? ` · ${m.round.toUpperCase()}` : ''}
                </Text>
            </View>
            <View style={styles.heroScoreRow}>
                <View style={styles.heroTeam}>
                    <RemoteImage uri={m.homeTeamLogo} size={42} fallbackTeam={m.homeTeam} />
                    <Text style={styles.heroTeamName} numberOfLines={2}>{m.homeTeam.toUpperCase()}</Text>
                </View>
                {mode === 'upcoming' ? (
                    <View style={styles.heroScoreBox}>
                        <Text style={styles.heroTime}>{kickoffTime(m)}</Text>
                    </View>
                ) : (
                    <View style={styles.heroScoreBox}>
                        <Text style={styles.heroScoreNum}>{m.homeScore ?? '-'}</Text>
                        <Text style={styles.heroColon}>:</Text>
                        <Text style={styles.heroScoreNum}>{m.awayScore ?? '-'}</Text>
                    </View>
                )}
                <View style={styles.heroTeam}>
                    <RemoteImage uri={m.awayTeamLogo} size={42} fallbackTeam={m.awayTeam} />
                    <Text style={styles.heroTeamName} numberOfLines={2}>{m.awayTeam.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.openMatch}>
                <Text style={styles.openMatchText}>OPEN MATCH CENTRE</Text>
                <Icon name="arrow" size={16} color="#FFFFFF" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    heroMatch: { backgroundColor: '#0B0B0B', padding: 13, marginBottom: 1 },
    heroLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    heroLabelText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9, color: Colors.primary, letterSpacing: 0.5 },
    heroStatusText: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9, color: '#AAAAAA' },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    heroMetaText: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, color: '#AAAAAA', flex: 1 },
    heroScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    heroTeam: { flex: 1, alignItems: 'center', gap: 8 },
    heroTeamName: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 10, color: '#FFFFFF', textAlign: 'center' },
    heroScoreBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
    heroScoreNum: { fontFamily: Fonts.interTightMedium, fontSize: 54, color: '#FFFFFF', lineHeight: 58 },
    heroColon: { fontFamily: Fonts.interTightMedium, fontSize: 54, color: Colors.primary, lineHeight: 58 },
    heroTime: { fontFamily: Fonts.interTightMedium, fontSize: 30, color: '#FFFFFF', lineHeight: 58 },
    openMatch: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderTopWidth: 1, borderTopColor: '#222222', paddingTop: 11,
    },
    openMatchText: { fontFamily: Fonts.jetbrainsMono, fontSize: 10, color: '#FFFFFF', flex: 1 },
});