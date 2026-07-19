/**
 * Tokens F28 — espelho literal de `app/src/app/globals.css` (:root).
 * Visual + navegação do site mobile (navbar/drawer).
 */
export const brand = {
  /* Azul jersey */
  blue50: "#E6F0FA",
  blue500: "#0060B1",
  blue: "#0060B1",
  blueDeep: "#0058A8",
  jerseyNavy: "#001428",
  jerseyDeep: "#003060",
  jerseyRoyal: "#0058A8",
  jerseySky: "#2088D4",
  jerseyLight: "#3AA0E8",

  /* Dourado */
  gold50: "#FDF6E8",
  gold100: "#F8E6BD",
  gold200: "#F3D692",
  gold: "#E8C66A",
  gold300: "#E8C66A",
  gold400: "#D4A843",
  goldMuted: "#D4A843",
  gold600: "#9A7A24",

  /* Superfícies */
  bg: "#001020",
  bgPrimary: "#001020",
  bgSecondary: "rgba(0,32,64,0.94)",
  bgTertiary: "rgba(0,48,88,0.88)",
  bgElevated: "rgba(0,56,100,0.92)",
  bgHover: "rgba(255,255,255,0.09)",
  glass: "rgba(0,22,48,0.94)",
  glassBorder: "rgba(212,168,67,0.22)",

  /* Texto */
  text: "#F4F8FC",
  textSecondary: "#C2CDD8",
  textMuted: "#94A3B4",
  textInverse: "#001020",

  /* Status */
  success: "#3FB950",
  successBg: "rgba(63,185,80,0.12)",
  warning: "#D29922",
  warningBg: "rgba(210,153,34,0.12)",
  danger: "#F85149",
  dangerBg: "rgba(248,81,73,0.12)",
  info: "#58A6FF",

  /* Bordas */
  border: "rgba(212,168,67,0.2)",
  borderMuted: "rgba(255,255,255,0.1)",
  borderEmphasis: "rgba(212,168,67,0.38)",
  borderGold: "rgba(212,168,67,0.5)",

  white: "#FFFFFF",

  /* Raios / espaço / touch (F28) */
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
  radiusXl: 20,
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  touchMin: 44,

  /* Fontes (carregadas em App.tsx) */
  fontDisplay: "Outfit_700Bold",
  fontDisplayExtra: "Outfit_800ExtraBold",
  fontBody: "Inter_400Regular",
  fontBodyMed: "Inter_500Medium",
  fontBodySemi: "Inter_600SemiBold",
  fontBodyBold: "Inter_700Bold",

  /** @deprecated */
  navy: "#001020",
  surface: "#001020",
  muted: "#94A3B4",
} as const;

export type Brand = typeof brand;
