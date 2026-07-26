import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

const SUCCESS_FEEDBACK_MS = 4500;

type Props = {
  syncedAtLabel: string | null;
  syncing?: boolean;
  message?: string | null;
  onRequestSync: () => void;
};

/** Progresso simulado: acelera no começo e desacelera perto de 90%. */
function useSyncProgress(syncing: boolean) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (syncing) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + 3;
          if (prev < 60) return prev + 1.5;
          if (prev < 85) return prev + 0.5;
          if (prev < 92) return prev + 0.15;
          return prev;
        });
      }, 100);
    } else {
      clearTick();
      setProgress((prev) => {
        if (prev > 0) return 100;
        return 0;
      });
      const t = setTimeout(() => setProgress(0), 600);
      return () => clearTimeout(t);
    }
    return clearTick;
  }, [syncing, clearTick]);

  return Math.round(progress);
}

/** Espelho F28 de `EnrollmentSyncBar`. */
export function EnrollmentSyncBar({
  syncedAtLabel,
  syncing = false,
  message,
  onRequestSync,
}: Props) {
  const [visibleMessage, setVisibleMessage] = useState(message ?? null);
  const progress = useSyncProgress(syncing);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setVisibleMessage(message ?? null);
    if (!message) return;

    const timer = setTimeout(() => {
      setVisibleMessage(null);
    }, SUCCESS_FEEDBACK_MS);

    return () => clearTimeout(timer);
  }, [message]);

  // Anima a largura da barra de progresso
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress / 100,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  const isActive = syncing || progress > 0;

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
        style={styles.btn}
        onPress={onRequestSync}
        disabled={syncing}
      >
        {/* Barra de progresso determinística */}
        {isActive && (
          <Animated.View
            style={[
              styles.fill,
              {
                width: fillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        )}
        <Icon
          name="sync"
          size={14}
          color="#1a1408"
          style={syncing ? styles.iconSpin : undefined}
        />
        <Text style={styles.btnText}>
          {syncing ? `Buscando… ${progress}%` : "Puxar Minhas Turmas"}
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
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  iconSpin: {
    // RN não tem animação CSS — a rotação é visual via ActivityIndicator upstream
  },
  btnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  msg: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.gold200,
  },
});
