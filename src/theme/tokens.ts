/**
 * Design tokens for Shake Happens
 * Brand colors: Blue #028BE6, Deep Blue #082A54, Orange #FF8A30, Yellow #FFC83D, Green #12C995, Pink #FF6B97
 */

export const dayPalette = {
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  nav: '#F8FAFB',
  border: '#D1D5DB',
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
  rushBg: '#FFF7ED',
  lcdBg: '#F3F4F6',
  lcdText: '#082A54',
  dial: '#E5E7EB',
} as const;

export const nightPalette = {
  bg: '#0F172A',
  surface: '#1E293B',
  nav: '#0F172A',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#CBD5E1',
  placeholder: '#94A3B8',
  accent: '#FF8A30',
  onAccent: '#0F172A',
  ocean: '#0EA5E9',
  oceanFill: '#0EA5E9',
  oceanTint: '#1E3A8A',
  chartMuted: '#475569',
  positive: '#10B981',
  warning: '#FBBF24',
  secondary: '#F472B6',
  rushBg: '#1F2937',
  lcdBg: '#1E293B',
  lcdText: '#F1F5F9',
  dial: '#1E293B',
} as const;

export const spacing = {
  xs: 4, sm: 6, md: 8, lg: 10, xl: 12, '2xl': 14, '3xl': 16, '4xl': 20, '5xl': 24,
} as const;

export const radius = { chip: 11, control: 12, card: 16, button: 20 } as const;
export const touchTarget = { primary: 56, secondary: 44, nav: 84 } as const;
export const fontSize = { xs: 13, sm: 15, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 32, '4xl': 38 } as const;
export const fontWeight = { regular: '400', semibold: '600', bold: '800' } as const;
export const fonts = { display: 'BricolageGrotesque', mono: 'JetBrainsMono' } as const;

export type Theme = 'light' | 'dark';
export type Palette = typeof dayPalette;
export const getPalette = (theme: Theme): Palette => theme === 'light' ? dayPalette : nightPalette;
