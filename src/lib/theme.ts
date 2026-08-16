/**
 * GymBro - Kinetic Theme
 * Edit this file to customize the entire design system.
 * Colors, typography, spacing, and border radii are all defined here.
 *
 * Values are transcribed 1:1 from the mobile app's Flutter ThemeData (its
 * `_KineticColors` / `_LightColors` and dark/light `ThemeData`), so the web
 * portal and the app share one identity. Only the dark palette is wired up
 * today (this app has no light-mode toggle); the light values are kept here
 * ready for when one is added.
 *
 * AI INSTRUCTION: To change the theme, modify the values in this file.
 * The CSS variables are injected via globals.css referencing this structure.
 */

export const theme = {
  name: "Kinetic",

  colors: {
    // Backgrounds & Surfaces
    surface: "#0e0e0e",
    "surface-dim": "#0e0e0e",
    "surface-bright": "#302f2c",
    "surface-container-lowest": "#0a0a0a",
    "surface-container-low": "#131313",
    "surface-container": "#1a1a1a",
    "surface-container-high": "#20201f",
    "surface-container-highest": "#2a2a28",
    "on-surface": "#ffffff",
    "on-surface-variant": "#adaaaa",
    "inverse-surface": "#ffffff",
    "inverse-on-surface": "#1a1a1a",
    outline: "#8a8888",
    "outline-variant": "#2a2a2a",
    "surface-tint": "#b5de00",

    // Primary — Electric Lime
    primary: "#f3ffca",
    "on-primary": "#3a4a00",
    "primary-container": "#cafd00",
    "on-primary-container": "#3a4a00",
    "inverse-primary": "#4a5c00",

    // Secondary — Cyan
    secondary: "#00eefc",
    "on-secondary": "#003b40",
    "secondary-container": "#00b954",
    "on-secondary-container": "#003915",

    // Tertiary / info accent (derived from the cyan secondary)
    tertiary: "#7df6ff",
    "on-tertiary": "#00363b",
    "tertiary-container": "#c8fdff",
    "on-tertiary-container": "#00b8c9",

    // Error — Dart reuses its tertiary (soft coral) as the error colour
    error: "#ff6e81",
    "on-error": "#3a0009",
    "error-container": "#5c1620",
    "on-error-container": "#ffd9dc",

    // Fixed Colors
    "primary-fixed": "#cafd00",
    "primary-fixed-dim": "#b5de00",
    "on-primary-fixed": "#3a4a00",
    "on-primary-fixed-variant": "#4a5c00",

    "secondary-fixed": "#7df6ff",
    "secondary-fixed-dim": "#00eefc",
    "on-secondary-fixed": "#00363b",
    "on-secondary-fixed-variant": "#004a52",

    // Background
    background: "#0e0e0e",
    "on-background": "#ffffff",
    "surface-variant": "#2a2a28",

    // Brand accent (Electric Lime — primary CTA)
    accent: "#cafd00",
    "accent-dim": "#b5de00",
  },

  /** Light palette, per the mobile app's `_LightColors` — not yet wired up. */
  colorsLight: {
    surface: "#f5f5f5",
    "surface-container-low": "#eeeeee",
    "surface-container": "#e0e0e0",
    "surface-container-high": "#d5d5d5",
    "surface-container-lowest": "#ffffff",
    "on-surface": "#0e0e0e",
    "on-surface-variant": "#424242",
  },

  typography: {
    "display-lg": {
      fontFamily: "Space Grotesk",
      fontSize: "57px",
      fontWeight: "700",
      lineHeight: "64px",
      letterSpacing: "-0.02em",
    },
    "display-md": {
      fontFamily: "Space Grotesk",
      fontSize: "45px",
      fontWeight: "700",
      lineHeight: "52px",
      letterSpacing: "-0.02em",
    },
    "headline-lg": {
      fontFamily: "Space Grotesk",
      fontSize: "32px",
      fontWeight: "700",
      lineHeight: "40px",
    },
    "headline-md": {
      fontFamily: "Space Grotesk",
      fontSize: "28px",
      fontWeight: "700",
      lineHeight: "36px",
    },
    "title-lg": {
      fontFamily: "Manrope",
      fontSize: "22px",
      fontWeight: "700",
      lineHeight: "28px",
    },
    "title-md": {
      fontFamily: "Manrope",
      fontSize: "16px",
      fontWeight: "600",
      lineHeight: "24px",
    },
    "body-lg": {
      fontFamily: "Manrope",
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "24px",
    },
    "body-md": {
      fontFamily: "Manrope",
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "20px",
    },
    "label-lg": {
      fontFamily: "Lexend",
      fontSize: "14px",
      fontWeight: "600",
      lineHeight: "20px",
    },
    "label-md": {
      fontFamily: "JetBrains Mono",
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "20px",
      letterSpacing: "0.05em",
    },
    "label-sm": {
      fontFamily: "Lexend",
      fontSize: "11px",
      fontWeight: "500",
      lineHeight: "16px",
    },
  },

  rounded: {
    sm: "0.25rem",
    DEFAULT: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px",
  },

  spacing: {
    base: "4px",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    gutter: "16px",
    "margin-mobile": "20px",
    "margin-desktop": "64px",
  },
} as const;

export type Theme = typeof theme;
export default theme;
