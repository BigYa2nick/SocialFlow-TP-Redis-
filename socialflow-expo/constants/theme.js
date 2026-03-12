// ─────────────────────────────────────────────────────────────
// SocialFlow — Design System
// Change une valeur ici → tout l'app change automatiquement
// ─────────────────────────────────────────────────────────────

export const COLORS = {
  // Couleurs principales
  primary:        '#1d4ed8',
  primaryLight:   '#3b82f6',
  primaryDark:    '#1e3a8a',
  primaryFade:    '#dbeafe',

  // Gradient header
  gradientStart:  '#1e3a8a',
  gradientEnd:    '#3b82f6',

  // Backgrounds
  background:     '#000000',
  surface:        '#ffffff',
  surfaceAlt:     '#f1f5f9',

  // Textes
  textPrimary:    '#1e293b',
  textSecondary:  '#64748b',
  textMuted:      '#94a3b8',
  textWhite:      '#ffffff',

  // Bordures
  border:         '#e2e8f0',
  borderLight:    '#f1f5f9',

  // États
  success:        '#16a34a',
  successFade:    '#f0fdf4',
  error:          '#dc2626',
  errorFade:      '#fee2e2',

  // Like
  liked:          '#ef4444',
  unliked:        '#94a3b8',
};

export const FONTS = {
  small:   12,
  body:    14,
  medium:  15,
  large:   16,
  title:   18,
  heading: 22,
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};
