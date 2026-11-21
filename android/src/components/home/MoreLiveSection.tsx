import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import SectionHeader from '../layout/SectionHeader';
import FootballMatchRow from '../match/FootballMatchRow';
import { FootballMatch } from '../../services/api';
import { canonicalCompetition } from '../../utils/footballRanking';

export default function MoreLiveSection({
    number, matches, onAllLive, onOpenMatch,
}: {
    number: string;
    matches: FootballMatch[];
    onAllLive: () => void;
    onOpenMatch: (matchId: string) => void;
}) {
    const { colors } = useAppColors();
    if (matches.length === 0) return null;

    const grouped = matches.reduce((acc: Record<string, FootballMatch[]>, m) => {
        const key = canonicalCompetition(m.competition, m.country);
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    return (
        <>
            <SectionHeader number={number} title="More live" action="ALL LIVE" onAction={onAllLive} />
            {Object.entries(grouped).map(([competition, list]) => (
                <View key={competition}>
                    <View style={[styles.compLabel, { borderBottomColor: colors.line, borderTopColor: colors.line }]}>
                        <Text style={[styles.compLabelText, { color: colors.muted }]} numberOfLines={1}>
                            {competition.toUpperCase()}
                        </Text>
                        <Text style={[styles.compLabelCount, { color: Colors.primary }]}>
                            {list.length} LIVE
                        </Text>
                    </View>
                    <View style={[styles.listSurface, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                        {list.map((m) => (
                            <FootballMatchRow
                                key={m.id}
                                home={m.homeTeam}
                                away={m.awayTeam}
                                homeLogo={m.homeTeamLogo}
                                awayLogo={m.awayTeamLogo}
                                score={`${m.homeScore ?? '-'} - ${m.awayScore ?? '-'}`}
                                status={m.elapsed ? `${m.elapsed}'` : m.status}
                                onClick={() => onOpenMatch(m.id)}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    listSurface: { borderWidth: 1 },
    compLabel: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 7, borderTopWidth: 1, borderBottomWidth: 1, marginTop: 4,
    },
    compLabelText: { fontFamily: Fonts.jetbrainsMono, fontSize: 9, flex: 1 },
    compLabelCount: { fontFamily: Fonts.jetbrainsMonoMedium, fontSize: 9 },
});