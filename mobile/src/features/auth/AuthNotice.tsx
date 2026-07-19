import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  open: boolean;
  kicker: string;
  message: string | null;
  onDismiss: () => void;
  dismissAfterMs?: number;
};

/** Toast compacto — espelho de `PlannerNotice` no login. Some sozinho. */
export function AuthNotice({
  open,
  kicker,
  message,
  onDismiss,
  dismissAfterMs = 4500,
}: Props) {
  useEffect(() => {
    if (!open || !message) return;
    const timer = setTimeout(onDismiss, dismissAfterMs);
    return () => clearTimeout(timer);
  }, [open, message, dismissAfterMs, onDismiss]);

  if (!open || !message) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
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
    marginTop: 10,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.4)",
    backgroundColor: "rgba(248,81,73,0.12)",
    padding: 12,
    gap: 4,
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
    color: "#FF7B72",
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
