import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppColors } from '../../hooks/useAppColors';
import SectionHeader from '../layout/SectionHeader';
import FootballMatchRow from '../match/FootballMatchRow';
import { FootballMatch } from '../../services/api';
import { rowScore, rowStatus } from '../../utils/followed';

export default function YourTeamsSection({
  number, matches, onSeeAll, onOpenMatch,
}: {
  number: string;
  matches: FootballMatch[];
  onSeeAll: () => void;
  onOpenMatch: (matchId: string) => void;
}) {
  const { colors } = useAppColors();
  if (matches.length === 0) return null;

  return (
    <>
      <SectionHeader number={number} title="Your teams" action="FOLLOWING" onAction={onSeeAll} />
      <View style={[styles.listSurface, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        {matches.map(m => (
          <FootballMatchRow
            key={m.id}
            home={m.homeTeam}
            away={m.awayTeam}
            homeLogo={m.homeTeamLogo}
            awayLogo={m.awayTeamLogo}
            score={rowScore(m)}
            status={rowStatus(m)}
            onClick={() => onOpenMatch(m.id)}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  listSurface: { borderWidth: 1 },
});