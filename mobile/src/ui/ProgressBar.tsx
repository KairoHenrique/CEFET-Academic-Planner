import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { brand } from "../theme/brand";

export type ProgressTone = "gold" | "safe" | "warning" | "danger";

const GRADIENTS: Record<ProgressTone, readonly [string, string, string]> = {
  gold: ["#9A7A24", "#D4A843", "#F3D692"],
  safe: ["#1a5c32", "#3FB950", "#7ee787"],
  warning: ["#7a5200", "#D29922", "#f0c14b"],
  danger: ["#7a1f1a", "#F85149", "#ff8a85"],
};

const GLOW: Record<ProgressTone, string> = {
  gold: "rgba(212,168,67,0.55)",
  safe: "rgba(63,185,80,0.55)",
  warning: "rgba(210,153,34,0.5)",
  danger: "rgba(248,81,73,0.7)",
};

type Props = {
  percent: number;
  tone?: ProgressTone;
  height?: number;
  /** Marca vertical (ex.: linha de aprovação). */
  markAt?: number | null;
};

/** Barra F28 — gradiente + glow (ouro / risco verde·âmbar·vermelho). */
export function ProgressBar({
  percent,
  tone = "gold",
  height = 8,
  markAt = null,
}: Props) {
  const width = Math.min(100, Math.max(0, percent));
  const colors = GRADIENTS[tone];

  return (
    <View style={[styles.track, { height }]}>
      {width > 0 ? (
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.fill,
            {
              width: `${width}%`,
              shadowColor: GLOW[tone],
            },
          ]}
        />
      ) : null}
      {markAt != null && markAt > 0 && markAt < 100 ? (
        <View style={[styles.mark, { left: `${markAt}%` }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  mark: {
    position: "absolute",
    top: -2,
    bottom: -2,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#fff",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
