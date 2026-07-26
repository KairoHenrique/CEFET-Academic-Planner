import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

const SUCCESS_FEEDBACK_MS = 4500;

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
  const [visibleMessage, setVisibleMessage] = useState(message ?? null);

  useEffect(() => {
    setVisibleMessage(message ?? null);
    if (!message) return;

    const timer = setTimeout(() => {
      setVisibleMessage(null);
    }, SUCCESS_FEEDBACK_MS);

    return () => clearTimeout(timer);
  }, [message]);

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
        {syncing ? (
          <ActivityIndicator size="small" color="#1a1408" />
        ) : (
          <Icon name="sync" size={14} color="#1a1408" />
        )}
        <Text style={styles.btnText}>
          {syncing ? "Aguarde…" : "Puxar Minhas Turmas"}
        </Text>
      </Pressable>
      {visibleMessage ? <Text style={styles.msg}>{visibleMessage}</Text> : null}
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
