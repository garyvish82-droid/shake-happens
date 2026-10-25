import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Weight = 'regular' | 'semibold' | 'bold' | 'heavy';

interface TextProps extends RNTextProps {
  size?: number;
  weight?: Weight;
  /** numbers and readouts */
  mono?: boolean;
  muted?: boolean;
  color?: string;
  upper?: boolean;
  /** letter spacing in em (like CSS) */
  tracking?: number;
}

// Night mode keeps its original look: Bricolage Grotesque + JetBrains Mono
const NIGHT_SANS: Record<Weight, string> = {
  regular: 'BricolageGrotesque_400Regular',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  heavy: 'BricolageGrotesque_800ExtraBold',
};
const NIGHT_MONO: Record<Weight, string> = {
  regular: 'JetBrainsMono_500Medium',
  semibold: 'JetBrainsMono_500Medium',
  bold: 'JetBrainsMono_700Bold',
  heavy: 'JetBrainsMono_700Bold',
};

// Day mode follows the brand kit: Poppins for headings and numbers, Inter for body
const DAY_HEADING: Record<Weight, string> = {
  regular: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_600SemiBold',
  heavy: 'Poppins_700Bold',
};
const DAY_BODY: Record<Weight, string> = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
};

/** Text at 20 px and up reads as a heading (Poppins); smaller text is body (Inter) */
const HEADING_FROM = 20;

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
  const { palette, theme } = useTheme();

  let fontFamily: string;
  if (theme === 'dark') {
    fontFamily = (mono ? NIGHT_MONO : NIGHT_SANS)[weight];
  } else if (mono || size >= HEADING_FROM) {
    fontFamily = DAY_HEADING[weight];
  } else {
    fontFamily = DAY_BODY[weight];
  }

  return (
    <RNText
      maxFontSizeMultiplier={1.15}
      {...props}
      style={[
        {
          fontFamily,
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
