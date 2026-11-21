# Score Koto Android — Component & Screen Connections

## Boot chain

```
index.ts
  └── registerRootComponent(App)

App.tsx
  ├── loads fonts: Ndot-55, Ndot-57, InterTight (400/500/600), JetBrainsMono (400/500)
  ├── prevents SplashScreen auto-hide until fonts + theme are ready
  └── renders:
        SafeAreaProvider
          ThemeProvider          ← reads/writes colorScheme via AsyncStorage
            NavigationContainer
              RootNavigator
            StatusBar            ← style follows theme
```

---

## Navigation tree

```
RootNavigator  (NativeStack)
  │
  ├── "Tabs"        → TabNavigator  (5 bottom tabs, always present)
  │     ├── "Home"       → HomeScreen
  │     ├── "Live"       → LiveScreen
  │     ├── "Explore"    → ExploreScreen
  │     ├── "Favorites"  → FavoritesScreen
  │     └── "Profile"    → ProfileScreen
  │
  ├── "MatchDetail" → MatchDetailScreen  (pushed over tabs, no tab bar)
  ├── "Fixtures"    → FixturesScreen     (pushed over tabs, no tab bar)
  ├── "Standings"   → StandingsScreen    (pushed over tabs, no tab bar)
  └── "Team"        → TeamScreen         (pushed over tabs, no tab bar)
```

**Route parameter types (`RootStackParamList`):**
```ts
Tabs:        undefined
MatchDetail: { matchId: string }
Fixtures:    undefined
Standings:   undefined
Team:        { teamId: string; teamName?: string }
```

**Navigating between screens:**
```ts
const navigation = useNavigation<any>();

navigation.navigate('MatchDetail', { matchId: id })
navigation.navigate('Fixtures')
navigation.navigate('Standings')
navigation.navigate('Team', { teamId: id, teamName: 'Arsenal' })
navigation.goBack()
```

---

## Screen → component dependencies

```
HomeScreen
  ├── SectionHeader       src/components/layout/SectionHeader.tsx
  ├── DateStrip           src/components/match/DateStrip.tsx
  ├── FootballMatchRow    src/components/match/FootballMatchRow.tsx
  ├── LiveDot             src/components/ui/LiveDot.tsx
  ├── TeamBadge           src/components/ui/TeamBadge.tsx
  └── Icon                src/components/ui/Icon.tsx

LiveScreen
  ├── TopBar              src/components/layout/TopBar.tsx
  ├── FootballMatchRow
  └── LiveDot

ExploreScreen
  ├── TopBar
  ├── SectionHeader
  └── Icon

FixturesScreen
  ├── TopBar
  ├── DateStrip
  ├── FootballMatchRow
  └── LiveDot

StandingsScreen
  └── TopBar

MatchDetailScreen
  ├── TopBar
  ├── SectionHeader
  ├── StatBar             src/components/match/StatBar.tsx
  ├── LiveDot
  └── TeamBadge

TeamScreen
  ├── TopBar
  ├── SectionHeader
  ├── FootballMatchRow
  └── (useFollowing hook)

FavoritesScreen
  └── Icon

ProfileScreen
  ├── TopBar
  ├── SectionHeader
  ├── TeamBadge
  ├── Icon
  └── Toggle              src/components/ui/Toggle.tsx
```

---

## Component → constants dependencies

```
Every component that uses color:
  └── useAppColors()  →  src/hooks/useAppColors.ts
                              └── ThemeContext (provided by ThemeProvider in App.tsx)
                              └── reads/writes AsyncStorage key 'colorScheme'
                              └── returns Colors[scheme]  from src/constants/colors.ts

Every component that uses text:
  └── Fonts.*  from src/constants/typography.ts
        Fonts.ndot55                = 'Ndot-55'
        Fonts.ndot57                = 'Ndot-57'
        Fonts.interTight            = 'InterTight_400Regular'
        Fonts.interTightMedium      = 'InterTight_500Medium'
        Fonts.interTightSemiBold    = 'InterTight_600SemiBold'
        Fonts.jetbrainsMono         = 'JetBrainsMono_400Regular'
        Fonts.jetbrainsMonoMedium   = 'JetBrainsMono_500Medium'

TeamBadge and FootballMatchRow:
  └── teams  from src/constants/teams.ts
               teams['Arsenal'] = { short: 'ARS', color: '#D71920' }
               ...
```

---

## Color system

```
src/constants/colors.ts
  export const Colors = {
    primary: '#D71920',       // red — same across light and dark
    light: {
      bg:      '#F4F4F2',
      surface: '#FFFFFF',
      text:    '#050505',
      muted:   '#727272',
      line:    '#D8D9D7',
      soft:    '#E8E8E5',
    },
    dark: {
      bg:      '#090909',
      surface: '#151515',
      text:    '#F4F4F4',
      muted:   '#999999',
      line:    '#303030',
      soft:    '#202020',
    },
  }

Usage in a component:
  const { colors, scheme, toggle } = useAppColors();
  style={{ backgroundColor: colors.bg }}
```

---

## Data flow

```
Screen
  └── useState + useEffect
        └── src/services/api.ts  (Axios client)
              └── footballApi.getLive()
                    └── GET http://192.168.0.109:3000/api/v1/football/live
                          └── NestJS backend
                                └── PostgreSQL (synced from sports providers)

Real-time push (WebSocket):
  useLiveUpdates hook
    └── socket.io-client → ws://192.168.0.109:3000
          ├── 'football:live' → setFootball(matches)
          └── 'cricket:live'  → setCricket(matches)

Local persistence:
  useFollowing hook  → AsyncStorage key 'following_v1'
  useAppColors hook  → AsyncStorage key 'colorScheme'
```

The backend URL is hardcoded to `192.168.0.109:3000` (LAN IP). Change `BASE_URL` in
`src/services/api.ts` and `SOCKET_URL` in `src/hooks/useLiveUpdates.ts` to match your machine.

---

## Adding a new screen

1. Create `src/screens/MyScreen.tsx`
2. Add the route name + params to `RootStackParamList` in `src/navigation/RootNavigator.tsx`
3. Add `<Stack.Screen name="MyScreen" component={MyScreen} />` in RootNavigator
4. Navigate to it: `navigation.navigate('MyScreen', { ... })`

## Adding a new component

1. Place the file in the right folder:
   - Reusable UI primitive → `src/components/ui/`
   - Layout piece → `src/components/layout/`
   - Match-specific → `src/components/match/`
2. Use `useAppColors()` for colors and `Fonts.*` for typography
