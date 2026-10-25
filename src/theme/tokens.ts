/**
 * Design tokens for Shake Happens — from the Midburn camp app design.
 * Day: Shake Happens brand kit (sand + white, Deep Blue text, Blue buttons, Sun Yellow focus).
 * Night: deep indigo + violet (unchanged).
 */

export const brand = {
  blue: '#028BE6',
  deepBlue: '#082A54',
  orange: '#FF8A30',
  yellow: '#FFC83D',
  green: '#12C995',
  pink: '#FF6B97',
  sand: '#FFF0DB',
} as const;

export const dayPalette = {
  bg: '#FFF0DB', // sand page
  surface: '#FFFFFF', // cards
  nav: '#FFFFFF',
  border: 'rgba(8, 42, 84, 0.22)', // Deep Blue at ~22%, drawn 1.5 px
  text: '#082A54', // Deep Blue: 14:1 on white
  textMuted: '#4A5F7A', // 6.5:1 on white, 5.8:1 on sand
  accent: '#FFC83D', // Sun Yellow: the one focus colour (Deep Blue text 9:1)
  onAccent: '#082A54',
  ink: '#0369B8', // primary buttons and selected states (white text 5.7:1)
  onInk: '#FFFFFF',
  teal: '#0369B8', // numbers, icons, positive accents
  tealTint: '#E6F3FD',
  track: '#E6F3FD', // compass face, bar tracks
  barMuted: '#9DB7D1',
  lcdBg: '#E6F3FD',
  lcdText: '#082A54',
  avatar: '#BFE4FA',
  glow: 'transparent',
} as const;

export const nightPalette = {
  bg: '#141A3A',
  surface: '#1E2552',
  nav: '#111633',
  border: '#6670B8',
  text: '#EEF0FF',
  textMuted: '#B9BEE8',
  accent: '#C49BFF',
  onAccent: '#141A3A',
  ink: '#EEF0FF',
  onInk: '#1E2552',
  teal: '#7FD8FF',
  tealTint: '#1F3A7A',
  track: '#0D1230',
  barMuted: '#6B74BC',
  lcdBg: '#2B2266',
  lcdText: '#E2D4FF',
  avatar: '#7FD8FF',
  glow: 'rgba(196,155,255,0.8)',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 40, '3xl': 48, '4xl': 56, '5xl': 64,
} as const;

export const radius = { sm: 12, md: 20, lg: 32, pill: 999, chip: 11, control: 12, card: 16, button: 20 } as const;
export const touchTarget = { primary: 56, secondary: 44, nav: 84 } as const;
export const fontSize = { xs: 13, sm: 15, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 32, '4xl': 38 } as const;
export const fontWeight = { regular: '400', semibold: '600', bold: '700' } as const;
export const fonts = { heading: 'Poppins', body: 'Inter', night: 'BricolageGrotesque' } as const;

export type Theme = 'light' | 'dark';
export type Palette = { [K in keyof typeof dayPalette]: string };
export const getPalette = (theme: Theme): Palette => theme === 'light' ? dayPalette : nightPalette;
