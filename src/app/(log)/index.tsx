import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { spacing } from '../../theme/tokens';

export default function LogScreen() {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, padding: spacing['3xl'] }}>
      <Text variant="h1">Log Shakes</Text>
      <Text variant="body" style={{ marginTop: spacing.md, color: palette.textMuted }}>
        One-tap shake logging — coming soon
      </Text>
    </View>
  );
}
