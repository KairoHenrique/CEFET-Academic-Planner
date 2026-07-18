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
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    padding: brand.space5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: brand.space3,
  },
  title: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
});
