import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme/ThemeProvider';
import { TabBar } from '../../ui/TabBar';

export const unstable_settings = { anchor: '(home)' };

export default function TabsLayout() {
  const { palette, theme } = useTheme();

  return (
    <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <Tabs
        backBehavior="initialRoute"
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.bg } }}
      >
        <Tabs.Screen name="(home)" options={{ title: 'Home' }} />
        <Tabs.Screen name="(shifts)" options={{ title: 'Shifts' }} />
        <Tabs.Screen name="(log)" options={{ title: 'Log' }} />
        <Tabs.Screen name="(navigator)" options={{ title: 'Find camp' }} />
      </Tabs>
    </>
  );
}
