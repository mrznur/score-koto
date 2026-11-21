import 'react-native-gesture-handler';
import { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useAppColors } from './src/hooks/useAppColors';

SplashScreen.preventAutoHideAsync();

// Lives inside ThemeProvider so the status bar follows theme changes immediately
function AppContent({ onReady }: { onReady: () => void }) {
  const { scheme } = useAppColors();
  return (
    <View style={{ flex: 1 }} onLayout={onReady}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Ndot-55': require('./assets/fonts/Ndot-55.otf'),
    'Ndot-57': require('./assets/fonts/Ndot-57.otf'),
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  // Runs only after fonts are loaded AND the theme provider has rendered its children
  const onReady = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent onReady={onReady} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}