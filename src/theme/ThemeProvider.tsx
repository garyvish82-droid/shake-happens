import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { dayPalette, nightPalette, type Theme, type Palette } from './tokens';

interface ThemeContextType {
  theme: Theme;
  palette: Palette;
  setTheme: (theme: Theme) => void;
  isAutoTheme: boolean;
  setAutoTheme: (auto: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function calculateTheme(autoTheme: boolean): Theme {
  if (!autoTheme) {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour < 17) return 'light';
    return 'dark';
  }
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 17 || hour < 6) return 'dark';
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(systemTheme === 'dark' ? 'dark' : 'light');
  const [isAutoTheme, setAutoTheme] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAutoTheme) setThemeState(calculateTheme(true));
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoTheme]);

  const palette = theme === 'light' ? dayPalette : nightPalette;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setAutoTheme(false);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, setTheme, isAutoTheme, setAutoTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Pins everything inside to one theme (used by onboarding, which is always daylight) */
export function ForceTheme({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const value: ThemeContextType = {
    theme,
    palette: theme === 'light' ? dayPalette : nightPalette,
    setTheme: () => {},
    isAutoTheme: false,
    setAutoTheme: () => {},
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
