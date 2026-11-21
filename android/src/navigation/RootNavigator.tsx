import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import FixturesScreen from '../screens/FixturesScreen';
import StandingsScreen from '../screens/StandingsScreen';
import TeamScreen from '../screens/TeamScreen';

export type RootStackParamList = {
  Tabs: undefined;
  MatchDetail: { matchId: string };
  Fixtures: undefined;
  Standings: undefined;
  Team: { teamId: string; teamName?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
      <Stack.Screen name="Fixtures" component={FixturesScreen} />
      <Stack.Screen name="Standings" component={StandingsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
    </Stack.Navigator>
  );
}
