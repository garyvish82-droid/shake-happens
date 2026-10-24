import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { useFonts, BricolageGrotesque_400Regular, BricolageGrotesque_600SemiBold, BricolageGrotesque_800Bold } from '@expo-google-fonts/bricolage-grotesque';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { palette } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
