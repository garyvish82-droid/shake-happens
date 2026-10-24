/**
 * Design tokens for Shake Happens — Brand Kit v1
 * Brand colors: Blue #028BE6, Deep Blue #082A54, Orange #FF8A30, Yellow #FFC83D, Green #12C995, Pink #FF6B97
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
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  nav: '#FFFFFF',
  border: '#E5E7EB',
  text: '#082A54',
  textMuted: '#6B7280',
  placeholder: '#9CA3AF',
  accent: '#FF8A30',
  onAccent: '#FFFFFF',
  ocean: '#028BE6',
  oceanFill: '#DBEAFE',
  oceanTint: '#E0F2FE',
  chartMuted: '#CBD5E1',
  positive: '#12C995',
  warning: '#FFC83D',
  secondary: '#FF6B97',
  rushBg: '#FFF0DB',
  lcdBg: '#F3F4F6',
  lcdText: '#082A54',
  dial: '#E5E7EB',
} as const;

export const nightPalette = {
  bg: '#0A1628',
  surface: '#112240',
  nav: '#0A1628',
  border: '#1E3A5F',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  placeholder: '#64748B',
  accent: '#FF8A30',
  onAccent: '#0A1628',
  ocean: '#028BE6',
  oceanFill: '#0EA5E9',
  oceanTint: '#082A54',
  chartMuted: '#1E3A5F',
  positive: '#12C995',
  warning: '#FFC83D',
  secondary: '#FF6B97',
  rushBg: '#1A2744',
  lcdBg: '#112240',
  lcdText: '#F1F5F9',
  dial: '#1E3A5F',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 40, '3xl': 48, '4xl': 56, '5xl': 64,
} as const;

export const radius = { sm: 12, md: 20, lg: 32, pill: 999, chip: 11, control: 12, card: 16, button: 20 } as const;
export const touchTarget = { primary: 56, secondary: 44, nav: 84 } as const;
export const fontSize = { xs: 13, sm: 15, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 32, '4xl': 38 } as const;
export const fontWeight = { regular: '400', semibold: '600', bold: '700' } as const;
export const fonts = { heading: 'Poppins', body: 'Inter', mono: 'JetBrainsMono' } as const;

export type Theme = 'light' | 'dark';
export type Palette = typeof dayPalette;
export const getPalette = (theme: Theme): Palette => theme === 'light' ? dayPalette : nightPalette;
