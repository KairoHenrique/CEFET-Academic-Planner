import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

type Props = {
  syncedAtLabel: string | null;
  syncing?: boolean;
  message?: string | null;
  onRequestSync: () => void;
};

/** Espelho F28 de `EnrollmentSyncBar`. */
export function EnrollmentSyncBar({
  syncedAtLabel,
  syncing = false,
  message,
  onRequestSync,
}: Props) {
  return (
    <View style={styles.bar}>
      <Text style={styles.status}>
        {syncing
          ? "Sincronizando turmas…"
          : syncedAtLabel
            ? `Atualizado ${syncedAtLabel}`
            : "Sem sincronização recente"}
      </Text>
      <Pressable
        style={[styles.btn, syncing && styles.disabled]}
        onPress={onRequestSync}
        disabled={syncing}
      >
        <Icon name="sync" size={14} color="#1a1408" />
        <Text style={styles.btnText}>
          {syncing ? "Aguarde…" : "Atualizar SIGAA"}
        </Text>
      </Pressable>
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: 10,
    marginBottom: brand.space3,
    paddingBottom: brand.space3,
    borderBottomWidth: 1,
    borderBottomColor: brand.borderMuted,
  },
  status: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    paddingHorizontal: 14,
  },
  btnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  disabled: { opacity: 0.55 },
  msg: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.gold200,
  },
});
