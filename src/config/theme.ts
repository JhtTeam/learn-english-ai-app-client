import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const palette = {
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  secondary: '#FF9800',
  secondaryLight: '#FFB74D',
  secondaryDark: '#F57C00',
  accent: '#2196F3',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  white: '#FFFFFF',
  black: '#000000',
};

const themeBase = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: {fontSize: 32, fontWeight: '700' as const, lineHeight: 40},
    h2: {fontSize: 24, fontWeight: '700' as const, lineHeight: 32},
    h3: {fontSize: 20, fontWeight: '600' as const, lineHeight: 28},
    body: {fontSize: 16, fontWeight: '400' as const, lineHeight: 24},
    bodyLarge: {fontSize: 18, fontWeight: '400' as const, lineHeight: 28},
    caption: {fontSize: 14, fontWeight: '400' as const, lineHeight: 20},
    button: {fontSize: 18, fontWeight: '600' as const, lineHeight: 24},
  },
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
} as const;

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  black: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  card: string;
  shadow: string;
  overlay: string;
  inactive: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: typeof themeBase.spacing;
  borderRadius: typeof themeBase.borderRadius;
  typography: typeof themeBase.typography;
  screen: typeof themeBase.screen;
}

export const lightTheme: Theme = {
  ...themeBase,
  colors: {
    ...palette,
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    card: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    inactive: '#9CA3AF',
  },
};

export const darkTheme: Theme = {
  ...themeBase,
  colors: {
    ...palette,
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textInverse: '#0F172A',
    border: '#334155',
    card: '#1E293B',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    inactive: '#64748B',
  },
};
