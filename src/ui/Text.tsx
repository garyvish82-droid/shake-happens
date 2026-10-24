import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fontSize, fontWeight, fonts } from '../theme/tokens';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'body' | 'label' | 'mono' | 'muted';
  weight?: 'regular' | 'semibold' | 'bold';
}

export function Text({ variant = 'body', weight = 'regular', style, ...props }: TextProps) {
  const { palette } = useTheme();
  const variantStyles: Record<string, any> = {
    h1: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, fontFamily: fonts.display, color: palette.text },
    h2: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semibold, fontFamily: fonts.display, color: palette.text },
    body: { fontSize: fontSize.base, fontWeight: fontWeight.regular, fontFamily: fonts.display, color: palette.text },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, fontFamily: fonts.display, color: palette.textMuted },
    mono: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, fontFamily: fonts.mono, color: palette.ocean },
    muted: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, fontFamily: fonts.display, color: palette.textMuted },
  };
  const weightStyles = { regular: { fontWeight: fontWeight.regular }, semibold: { fontWeight: fontWeight.semibold }, bold: { fontWeight: fontWeight.bold } };
  return <RNText {...props} style={[variantStyles[variant], weightStyles[weight], style]} />;
}
