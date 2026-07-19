import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resetSyncError } from "../sync/manual-lite-sync";
import { useMobileSync } from "../sync/useMobileSync";
import { brand } from "../theme/brand";

const ERROR_DISMISS_MS = 4500;

/**
 * Barra fina de Sync SIGAA — logo abaixo da navbar.
 * Não bloqueia navegação; some ao terminar / erro some sozinho.
 */
export function SyncProgressOverlay() {
  const sync = useMobileSync();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (sync.error && !sync.syncing) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        resetSyncError();
      }, ERROR_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    if (sync.syncing) setShowError(false);
  }, [sync.error, sync.syncing]);

  if (!sync.syncing && !showError) return null;

  const isError = showError && !sync.syncing;

  return (
    <View
      style={[styles.bar, isError && styles.barError]}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: sync.syncing }}
      accessibilityLiveRegion="polite"
    >
      {sync.syncing ? (
        <View style={styles.row}>
          <ActivityIndicator color={brand.gold} size="small" />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              Sincronizando…{" "}
              <Text style={styles.step}>{sync.stepLabel || "SIGAA"}</Text>
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(6, Math.min(100, sync.progress))}%`,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.pct}>{Math.round(sync.progress)}%</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.errorTitle} numberOfLines={1}>
              Falha no sync
            </Text>
            <Text style={styles.errorBody} numberOfLines={1}>
              {sync.error}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    backgroundColor: "rgba(8, 18, 36, 0.98)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  barError: {
    borderBottomColor: "rgba(248,81,73,0.35)",
    backgroundColor: "rgba(40,12,16,0.96)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  step: {
    fontFamily: brand.fontBody,
    fontWeight: "400",
    color: brand.textMuted,
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: brand.gold,
    borderRadius: 2,
  },
  pct: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
    minWidth: 32,
    textAlign: "right",
  },
  errorTitle: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.danger,
  },
  errorBody: {
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
});
