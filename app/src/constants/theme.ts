import '@/global.css';
import { Platform } from 'react-native';

export const ThemeColors = {
  primary: '#6B46C1', // Slightly darker, highly professional purple
  secondary: '#5B30D9',
  tertiary: '#EDE9FE',
  neutral: '#14121F',
  mutedText: '#797587',
  screenBg: '#F6F4FF',
  cardBg: '#FFFFFF',
  inputBg: '#FAF8FF',
  border: '#EDE9FE',
  accentPulse: '#6B46C1',
} as const;

export const Colors = {
  light: {
    text: '#14121F',
    background: '#F6F4FF',
    backgroundElement: '#EDE9FE',
    backgroundSelected: '#6B46C1',
    textSecondary: '#797587',
  },
  dark: {
    text: '#ffffff',
    background: '#14121F',
    backgroundElement: '#212225',
    backgroundSelected: '#6B46C1',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    headline: 'DM Sans',
    body: 'DM Sans',
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    headline: 'DM Sans',
    body: 'DM Sans',
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    headline: 'DM Sans, sans-serif',
    body: 'DM Sans, sans-serif',
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
} as const;


export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
