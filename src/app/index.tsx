import { View, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../ui/Text';
import { spacing, fontSize } from '../theme/tokens';

export default function HomeScreen() {
  const { palette } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg, paddingTop: spacing['3xl'] }}>
      <View style={{ paddingHorizontal: spacing['3xl'] }}>
        <Text variant="h1">Shake Happens</Text>
        <Text variant="body" style={{ marginTop: spacing.md, color: palette.textMuted }}>
          v0 slice — Ready for evening 1-3 screens
        </Text>
      </View>
    </ScrollView>
  );
}
