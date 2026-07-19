import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  open: boolean;
  kicker: string;
  message: string | null;
  onDismiss: () => void;
  dismissAfterMs?: number;
  tone?: "ok" | "info" | "warn";
};

/** Toast que some sozinho (estilo PlannerNotice / AuthNotice). */
export function SoftToast({
  open,
  kicker,
  message,
  onDismiss,
  dismissAfterMs = 3200,
  tone = "ok",
}: Props) {
  useEffect(() => {
    if (!open || !message) return;
    const timer = setTimeout(onDismiss, dismissAfterMs);
    return () => clearTimeout(timer);
  }, [open, message, dismissAfterMs, onDismiss]);

  if (!open || !message) return null;

  const toneStyle =
    tone === "warn"
      ? styles.warn
      : tone === "info"
        ? styles.info
        : styles.ok;

  return (
    <View style={[styles.wrap, toneStyle]} accessibilityRole="alert">
      <View style={styles.head}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={styles.close}>Fechar</Text>
        </Pressable>
      </View>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 28,
    zIndex: 50,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  ok: {
    borderColor: "rgba(63,185,80,0.4)",
    backgroundColor: "rgba(63,185,80,0.14)",
  },
  info: {
    borderColor: "rgba(88,166,255,0.4)",
    backgroundColor: "rgba(88,166,255,0.14)",
  },
  warn: {
    borderColor: "rgba(210,153,34,0.45)",
    backgroundColor: "rgba(210,153,34,0.14)",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kicker: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  close: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  body: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 18,
  },
});
