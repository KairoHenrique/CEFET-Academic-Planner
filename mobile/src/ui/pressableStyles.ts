import type { StyleProp, ViewStyle } from "react-native";
import { Platform } from "react-native";
import { brand } from "../theme/brand";

/** Opacidade no pressed — leve, sem “piscar” forte. */
export const PRESS_OPACITY = 0.78;

export function pressableOpacityStyle(
  pressed: boolean,
  extra?: StyleProp<ViewStyle>
): StyleProp<ViewStyle> {
  return [extra, pressed ? { opacity: PRESS_OPACITY } : null];
}

/** Ripple Android dourado suave (navbar, chips, cards). */
export const goldRipple = Platform.select({
  android: {
    color: "rgba(232,198,106,0.22)",
    borderless: false,
    foreground: true,
  },
  default: undefined,
});

export const brandHitSlop = { top: 6, bottom: 6, left: 6, right: 6 } as const;

/** Duração padrão de micro-transições (~1 frame a mais que “instantâneo”). */
export const MOTION_FAST_MS = 180;
export const MOTION_MED_MS = 260;

export const brandColors = {
  goldMuted: brand.gold,
};
