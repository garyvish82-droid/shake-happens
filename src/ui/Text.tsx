import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Weight = 'regular' | 'semibold' | 'bold' | 'heavy';

interface TextProps extends RNTextProps {
  size?: number;
  weight?: Weight;
  mono?: boolean;
  muted?: boolean;
  color?: string;
  upper?: boolean;
  /** letter spacing in em (like CSS) */
  tracking?: number;
}

const SANS: Record<Weight, string> = {
  regular: 'BricolageGrotesque_400Regular',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  heavy: 'BricolageGrotesque_800ExtraBold',
};

const MONO: Record<Weight, string> = {
  regular: 'JetBrainsMono_500Medium',
  semibold: 'JetBrainsMono_500Medium',
  bold: 'JetBrainsMono_700Bold',
  heavy: 'JetBrainsMono_700Bold',
};

export function Text({
  size = 16,
  weight = 'regular',
  mono = false,
  muted = false,
  color,
  upper = false,
  tracking,
  style,
  ...props
}: TextProps) {
  const { palette } = useTheme();
  return (
    <RNText
      {...props}
      style={[
        {
          fontFamily: (mono ? MONO : SANS)[weight],
          fontSize: size,
          color: color ?? (muted ? palette.textMuted : palette.text),
          textTransform: upper ? 'uppercase' : undefined,
          letterSpacing: tracking != null ? tracking * size : undefined,
        },
        style,
      ]}
    />
  );
}
