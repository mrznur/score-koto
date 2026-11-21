import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import LiveScreen from '../screens/LiveScreen';
import ExploreScreen from '../screens/ExploreScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Icon from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { useAppColors } from '../hooks/useAppColors';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home', icon: 'home', label: 'Home' },
  { name: 'Live', icon: 'live', label: 'Live' },
  { name: 'Explore', icon: 'explore', label: 'Explore' },
  { name: 'Favorites', icon: 'star', label: 'Favorites' },
  { name: 'Profile', icon: 'profile', label: 'Profile' },
] as const;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useAppColors();

  return (
    <View
      style={[
        styles.tabBar,
        { borderTopColor: colors.line, backgroundColor: colors.bg },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TAB_CONFIG[index];
        const color = isFocused ? colors.text : colors.muted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            {isFocused && (
              <View style={styles.activeIndicator} />
            )}

            <View>
              <Icon
                name={tab.icon as any}
                size={20}
                color={color}
              />
              {tab.name === 'Live' && (
                <View style={styles.liveDot} />
              )}
            </View>

            <Text style={[styles.tabLabel, { color }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeIndicator: {
    position: 'absolute',
    top: -35,
    width: 27,
    height: 2,
    backgroundColor: Colors.primary,
  },
  liveDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontFamily: Fonts.jetbrainsMonoMedium,
    fontSize: 6,
  },
});

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
