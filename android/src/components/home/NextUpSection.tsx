import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppColors } from '../../hooks/useAppColors';
import SectionHeader from '../layout/SectionHeader';
import DateStrip from '../match/DateStrip';
import FootballMatchRow from '../match/FootballMatchRow';
import EmptyCard from './EmptyCard';
import { FootballMatch } from '../../services/api';
import { kickoffTime } from '../../utils/featured';

export default function NextUpSection({
  number, matches, failed, onOpenFixtures, onOpenMatch,
}: {
  number: string;
  matches: FootballMatch[];
  failed: boolean;
  onOpenFixtures: () => void;
  onOpenMatch: (matchId: string) => void;
}) {
  const { colors } = useAppColors();

  return (
    <>
      <SectionHeader number={number} title="Next up" action="FIXTURES" onAction={onOpenFixtures} />
      <DateStrip />
      {matches.length > 0 ? (
        <View style={[styles.listSurface, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          {matches.map((m) => (
            <FootballMatchRow
              key={m.id}
              home={m.homeTeam}
              away={m.awayTeam}
              homeLogo={m.homeTeamLogo}
              awayLogo={m.awayTeamLogo}
              score="-"
              status={kickoffTime(m)}
              onClick={() => onOpenMatch(m.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyCard message={failed ? 'Could not load fixtures' : 'No upcoming fixtures'} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  listSurface: { borderWidth: 1 },
});