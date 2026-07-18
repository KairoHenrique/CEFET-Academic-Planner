import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBox({ message, onRetry }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
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
