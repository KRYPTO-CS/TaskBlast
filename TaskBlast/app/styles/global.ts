// Global styles and theme configuration for TaskBlast

export const colors = {
  primary: '#6ab37fff',
  primaryDark: '#3a7bc8',
  primaryLight: '#6ba3e8',
  secondary: '#666',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f39c12',
  text: {
    primary: '#333',
    secondary: '#666',
    placeholder: '#999',
    inverse: '#ffffff',
  },
  border: {
    light: '#e0e0e0',
    medium: '#ccc',
    dark: '#999',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontFamily = {
  madimi: 'MadimiOne_400Regular',
  orbitron: {
    regular: 'Orbitron_400Regular',
    medium: 'Orbitron_500Medium',
    semibold: 'Orbitron_600SemiBold',
    bold: 'Orbitron_700Bold',
    extrabold: 'Orbitron_800ExtraBold',
    black: 'Orbitron_900Black',
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#4a90e2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
};

export const typography = {
  h1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  h2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.text.primary,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
  },
  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
};

// Button Styles
export const buttons = {
  primary: {
    backgroundColor: '#9DE8B2',
    paddingVertical: spacing.md,     
    paddingHorizontal: spacing.xl,   
    borderRadius: 10, 
    border: '2px solid #437B00', 
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.small,
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  success: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.small,
  },
  error: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.small,
  },
  warning: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.small,
  },
  info: {
    backgroundColor: '#3b82f6',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.small,
  },
  // Size variants
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
};

// Button Text Styles
export const buttonText = {
  primary: {
    color: '#1f1f1f',
    fontSize: fontSize.md,
    fontFamily: fontFamily.orbitron.medium,
    fontWeight: fontWeight.semibold,
  },
  secondary: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.orbitron.medium,
    fontWeight: fontWeight.semibold,
  },
  outline: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  ghost: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  success: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.orbitron.medium,
    fontWeight: fontWeight.semibold,
  },
  error: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.orbitron.medium,
    fontWeight: fontWeight.semibold,
  },
  warning: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.orbitron.medium,
    fontWeight: fontWeight.semibold,
  },
  info: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.orbitron.medium,
    fontWeight: fontWeight.semibold,
  },
  small: {
    fontSize: fontSize.sm,
  },
  large: {
    fontSize: fontSize.lg,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
  typography,
  buttons,
  buttonText,
};

export default theme;
