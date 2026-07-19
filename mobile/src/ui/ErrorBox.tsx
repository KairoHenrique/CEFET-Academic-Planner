import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

type Props = {
  message: string;
  onRetry?: () => void;
  /** Default 5s — mensagens somem sozinhas em todo o app. */
  dismissAfterMs?: number | null;
  onDismiss?: () => void;
};

export function ErrorBox({
  message,
  onRetry,
  dismissAfterMs = 5000,
  onDismiss,
}: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (dismissAfterMs == null || dismissAfterMs <= 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, dismissAfterMs);
    return () => clearTimeout(timer);
  }, [message, dismissAfterMs, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.root} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          style={styles.button}
          onPress={() => {
            setVisible(false);
            onRetry();
          }}
        >
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "rgba(240,113,120,0.12)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(240,113,120,0.35)",
    marginBottom: 12,
  },
  message: {
    color: brand.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: brand.gold,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: {
    color: brand.bg,
    fontWeight: "700",
    fontSize: 13,
  },
});
