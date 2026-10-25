import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { spacing } from '../../theme/tokens';

export default function ShiftsScreen() {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, padding: spacing['3xl'] }}>
      <Text variant="h1">Shifts</Text>
      <Text variant="body" style={{ marginTop: spacing.md, color: palette.textMuted }}>
        Shift schedule — coming soon
      </Text>
    </View>
  );
}
