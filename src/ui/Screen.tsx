import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  gap?: number;
  /** override the page background */
  background?: string;
  /** no top padding — caller draws its own header band */
  flushTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}

export function Screen({ children, gap = 14, background, flushTop, contentStyle, scroll = true }: ScreenProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = background ?? palette.bg;
  const content: StyleProp<ViewStyle> = [
    { flexGrow: 1, gap, paddingHorizontal: 20, paddingTop: flushTop ? 0 : insets.top + 8, paddingBottom: 14 },
    contentStyle,
  ];

  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: bg }, content]}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical={false}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
