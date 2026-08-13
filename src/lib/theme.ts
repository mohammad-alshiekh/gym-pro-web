/**
 * GymBro - Kinetic Dark Theme
 * Edit this file to customize the entire design system.
 * Colors, typography, spacing, and border radii are all defined here.
 *
 * AI INSTRUCTION: To change the theme, modify the values in this file.
 * The CSS variables are injected via globals.css referencing this structure.
 */

export const theme = {
  name: "Kinetic Dark",

  colors: {
    // Backgrounds & Surfaces
    surface: "#0f1013",
    "surface-dim": "#0f1013",
    "surface-bright": "#333942",
    "surface-container-lowest": "#0a0b0c",
    "surface-container-low": "#171a1e",
    "surface-container": "#1c2025",
    "surface-container-high": "#23272e",
    "surface-container-highest": "#2d323a",
    "on-surface": "#e9ecf1",
    "on-surface-variant": "#c3cad6",
    "inverse-surface": "#e9ecf1",
    "inverse-on-surface": "#1c2025",
    outline: "#8b93a1",
    "outline-variant": "#2f3742",
    "surface-tint": "#aed500",

    // Primary (Electric Lime)
    primary: "#ffffff",
    "on-primary": "#293500",
    "primary-container": "#c8f323",
    "on-primary-container": "#576c00",
    "inverse-primary": "#526600",

    // Secondary (Green)
    secondary: "#4ae176",
    "on-secondary": "#003915",
    "secondary-container": "#00b954",
    "on-secondary-container": "#004119",

    // Tertiary (Blue)
    tertiary: "#ffffff",
    "on-tertiary": "#002e6a",
    "tertiary-container": "#d8e2ff",
    "on-tertiary-container": "#0060ce",

    // Error
    error: "#ffb4ab",
    "on-error": "#690005",
    "error-container": "#93000a",
    "on-error-container": "#ffdad6",

    // Fixed Colors
    "primary-fixed": "#c8f323",
    "primary-fixed-dim": "#aed500",
    "on-primary-fixed": "#171e00",
    "on-primary-fixed-variant": "#3d4d00",

    "secondary-fixed": "#6bff8f",
    "secondary-fixed-dim": "#4ae176",
    "on-secondary-fixed": "#002109",
    "on-secondary-fixed-variant": "#005321",

    "tertiary-fixed": "#d8e2ff",
    "tertiary-fixed-dim": "#adc6ff",
    "on-tertiary-fixed": "#001a42",
    "on-tertiary-fixed-variant": "#004395",

    // Background
    background: "#0f1013",
    "on-background": "#e9ecf1",
    "surface-variant": "#2d323a",

    // Brand accent (Electric Lime - primary CTA)
    accent: "#c8f323",
    "accent-dim": "#aed500",
  },

  typography: {
    "display-lg": {
      fontFamily: "Lexend",
      fontSize: "48px",
      fontWeight: "700",
      lineHeight: "56px",
      letterSpacing: "-0.02em",
    },
    "headline-lg": {
      fontFamily: "Lexend",
      fontSize: "32px",
      fontWeight: "600",
      lineHeight: "40px",
    },
    "headline-md": {
      fontFamily: "Lexend",
      fontSize: "24px",
      fontWeight: "600",
      lineHeight: "32px",
    },
    "headline-sm": {
      fontFamily: "Lexend",
      fontSize: "20px",
      fontWeight: "600",
      lineHeight: "28px",
    },
    "body-lg": {
      fontFamily: "Inter",
      fontSize: "18px",
      fontWeight: "400",
      lineHeight: "28px",
    },
    "body-md": {
      fontFamily: "Inter",
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "24px",
    },
    "label-md": {
      fontFamily: "JetBrains Mono",
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "20px",
      letterSpacing: "0.05em",
    },
    "headline-lg-mobile": {
      fontFamily: "Lexend",
      fontSize: "28px",
      fontWeight: "600",
      lineHeight: "36px",
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
