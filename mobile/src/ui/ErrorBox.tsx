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
    backgroundColor: "#fde8e8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f5b5b5",
  },
  message: {
    color: "#8b1e1e",
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: brand.blue,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: {
    color: brand.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
