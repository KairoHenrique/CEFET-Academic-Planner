import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { brand } from "../../theme/brand";

type Props = { qrCode: string };

/** Espelho F28 de `PixCopyCodeField`. */
export function PixCopyCodeField({ qrCode }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Código PIX (copia e cola)</Text>
      <Text style={styles.code} selectable numberOfLines={4}>
        {qrCode}
      </Text>
      <Pressable style={styles.btn} onPress={() => void copy()}>
        <Text style={styles.btnText}>
          {copied ? "Copiado!" : "Copiar código"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 14, width: "100%" },
  label: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 10,
  },
  btn: {
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
});
