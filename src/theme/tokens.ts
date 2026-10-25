/**
 * Design tokens for Shake Happens — from the Midburn camp app design.
 * Day: warm cream + amber. Night: deep indigo + violet.
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
  bg: '#F3EEDC',
  surface: '#FFFDF6',
  nav: '#FBF7EA',
  border: '#7A7452',
  text: '#161A0C',
  textMuted: '#45482F',
  accent: '#FFB23F',
  onAccent: '#241A00',
  ink: '#161A0C',
  onInk: '#FFFDF6',
  teal: '#08606F',
  tealTint: '#D3ECEF',
  track: '#E9E2C8',
  barMuted: '#8A8362',
  lcdBg: '#D6E4BE',
  lcdText: '#10180A',
  rushBg: '#FFC86B',
  rushText: '#261C02',
  avatar: '#7FD3E2',
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
  rushBg: '#141A3A',
  rushText: '#EEF0FF',
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
export const fonts = { heading: 'BricolageGrotesque', body: 'BricolageGrotesque', mono: 'JetBrainsMono' } as const;

export type Theme = 'light' | 'dark';
export type Palette = { [K in keyof typeof dayPalette]: string };
export const getPalette = (theme: Theme): Palette => theme === 'light' ? dayPalette : nightPalette;
