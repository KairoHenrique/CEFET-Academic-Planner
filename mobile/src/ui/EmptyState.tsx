import { StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

type Props = {
  title: string;
  message?: string;
};

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: brand.glass,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: brand.text,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: brand.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
