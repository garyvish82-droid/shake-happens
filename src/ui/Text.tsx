import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fontSize, fontWeight } from '../theme/tokens';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'body' | 'label' | 'mono' | 'muted';
  weight?: 'regular' | 'semibold' | 'bold';
}

export function Text({ variant = 'body', weight = 'regular', style, ...props }: TextProps) {
  const { palette } = useTheme();
  const variantStyles: Record<string, any> = {
    h1: { fontSize: fontSize['4xl'], fontFamily: 'Poppins_700Bold', color: palette.text },
    h2: { fontSize: fontSize['2xl'], fontFamily: 'Poppins_600SemiBold', color: palette.text },
    body: { fontSize: fontSize.base, fontFamily: 'Inter_400Regular', color: palette.text },
    label: { fontSize: fontSize.sm, fontFamily: 'Inter_600SemiBold', color: palette.textMuted },
    mono: { fontSize: fontSize.sm, fontFamily: 'JetBrainsMono_500Medium', color: palette.ocean },
    muted: { fontSize: fontSize.sm, fontFamily: 'Inter_400Regular', color: palette.textMuted },
  };
  const weightOverride: Record<string, any> = {
    regular: { fontFamily: variant === 'h1' || variant === 'h2' ? 'Poppins_400Regular' : 'Inter_400Regular' },
    semibold: { fontFamily: variant === 'h1' || variant === 'h2' ? 'Poppins_600SemiBold' : 'Inter_600SemiBold' },
    bold: { fontFamily: 'Poppins_700Bold' },
  };
  return <RNText {...props} style={[variantStyles[variant], weight !== 'regular' && weightOverride[weight], style]} />;
}
