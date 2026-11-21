import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  createElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Colors, ColorScheme } from '../constants/colors';

const STORAGE_KEY = 'colorScheme';

type ThemeValue = {
  colors: (typeof Colors)[ColorScheme];
  scheme: ColorScheme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Holds the one shared theme state for the whole app.
 * Renders nothing until the saved theme is read, so there is no light-mode flash.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<ColorScheme>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'dark' || value === 'light') setScheme(value);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = useCallback(() => {
    const next: ColorScheme = scheme === 'light' ? 'dark' : 'light';
    setScheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, [scheme]);

  const value = useMemo(() => ({ colors: Colors[scheme], scheme, toggle }), [scheme, toggle]);

  if (!loaded) return null;
  return createElement(ThemeContext.Provider, { value }, children);
}

/** Same return shape as before: { colors, scheme, toggle } */
export function useAppColors(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppColors must be used inside <ThemeProvider>');
  return ctx;
}
