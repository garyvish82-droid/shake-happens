import { Tabs } from 'expo-router';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { useFonts, BricolageGrotesque_400Regular, BricolageGrotesque_600SemiBold, BricolageGrotesque_800Bold } from '@expo-google-fonts/bricolage-grotesque';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { spacing, touchTarget } from '../theme/tokens';

SplashScreen.preventAutoHideAsync();

function TabsContent() {
  const { palette } = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.accent, tabBarInactiveTintColor: palette.textMuted, tabBarStyle: { backgroundColor: palette.nav, borderTopColor: palette.border, borderTopWidth: 1, height: touchTarget.nav, paddingBottom: 8, paddingTop: 8 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 4 }, contentStyle: { backgroundColor: palette.bg } }}>
      <Tabs.Screen name="(home)" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="(shifts)" options={{ title: 'Shifts', tabBarLabel: 'Shifts' }} />
      <Tabs.Screen name="(log)" options={{ title: 'Log', tabBarLabel: 'Log' }} />
      <Tabs.Screen name="(navigator)" options={{ title: 'Find Camp', tabBarLabel: 'Find' }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <TabsContent />
    </ThemeProvider>
  );
}
