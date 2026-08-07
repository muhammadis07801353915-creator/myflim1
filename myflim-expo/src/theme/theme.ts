export const getColors = (theme: 'dark' | 'light') => {
  if (theme === 'light') {
    return {
      primary: '#CC222F',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceLight: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      border: '#E2E8F0',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      white: '#ffffff',
      black: '#000000',
      transparent: 'transparent',
    };
  }

  return {
    primary: '#CC222F',
    background: '#0F0F13',
    surface: '#161722',
    surfaceLight: '#1C1E28',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.4)',
    border: 'rgba(255,255,255,0.08)',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  };
};

export const COLORS = getColors('dark');

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  radius: 12,
  radiusLarge: 20,
  radiusFull: 999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};
