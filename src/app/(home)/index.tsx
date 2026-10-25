import { View } from 'react-native';
import { Text } from '../../ui/Text';
import { useTheme } from '../../theme/ThemeProvider';

export default function HomeScreen() {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
      <Text variant="h2">Home</Text>
    </View>
  );
}
