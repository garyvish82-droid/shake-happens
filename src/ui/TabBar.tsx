import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

const TABS: { route: string; label: string; icon: IconName }[] = [
  { route: '(home)', label: 'Home', icon: 'home' },
  { route: '(shifts)', label: 'Shifts', icon: 'calendar' },
  { route: '(log)', label: 'Log', icon: 'log' },
  { route: '(navigator)', label: 'Find camp', icon: 'compass' },
];

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
};

export function TabBar({ state, navigateToTab }: TabBarProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = state.routes[state.index]?.name;

  // Insights is a full-screen page: no tab bar
  if (!TABS.some((t) => t.route === focused)) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.nav,
        borderTopWidth: 1.5,
        borderTopColor: palette.border,
        paddingBottom: Math.max(insets.bottom, 10),
        height: 62 + Math.max(insets.bottom, 10),
      }}
    >
      {TABS.map((t) => {
        const active = focused === t.route;
        const color = active ? palette.text : palette.textMuted;
        return (
          <Pressable
            key={t.route}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const route = state.routes.find((r) => r.name === t.route);
              if (route) navigateToTab(route.key);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            {active && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '22%',
                  right: '22%',
                  height: 4,
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                  backgroundColor: palette.accent,
                }}
              />
            )}
            <Icon name={t.icon} color={color} strokeWidth={active ? 2.4 : 2.2} />
            <Text size={12} weight={active ? 'heavy' : 'semibold'} color={color} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
