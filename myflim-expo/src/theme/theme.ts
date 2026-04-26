export const getColors = (theme: 'dark' | 'light') => {
  if (theme === 'light') {
    return {
      primary: '#dc2626',
      background: '#f5f5f5',
      surface: '#ffffff',
      surfaceLight: '#e5e5e5',
      text: '#0a0a0a',
      textSecondary: '#525252',
      textMuted: '#737373',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      white: '#ffffff',
      black: '#000000',
      transparent: 'transparent',
    };
  }

  return {
    primary: '#dc2626',
    background: '#0a0a0a',
    surface: '#1a1d24',
    surfaceLight: '#262a33',
    text: '#ffffff',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  };
};

export const COLORS = getColors('dark'); // Default fallback

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
