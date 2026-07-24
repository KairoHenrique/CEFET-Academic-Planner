import React, { useEffect, useState, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Icon } from "./Icon";
import { brand } from "../theme/brand";
import { hasApiBaseUrl } from "../config/env";
import { getApiBaseUrl } from "../config/env";

interface MaintenancePolicy {
  enabled: boolean;
  message: string;
}

export function MaintenanceOverlay() {
  const [policy, setPolicy] = useState<MaintenancePolicy | null>(null);
  const [percent, setPercent] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasApiBaseUrl()) return;

    let mounted = true;
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/maintenance`);
        const data = await res.json();
        if (mounted && data?.ok && data?.policy) {
          setPolicy(data.policy);
        }
      } catch {
        // ignora
      }
    };

    void checkMaintenance();

    // Re-check periodically every 60s
    const timer = setInterval(() => {
      void checkMaintenance();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (policy?.enabled) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      const interval = setInterval(() => {
        setPercent((p) => (p >= 99 ? 0 : p + 1));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [policy?.enabled, spinAnim]);

  if (!policy || !policy.enabled) {
    return null;
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Icon name="warning" size={18} color={brand.gold} />
            <Text style={styles.title}>Página em Manutenção</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.spinnerContainer}>
              <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
              <View style={styles.percentContainer}>
                <Icon name="sync" size={16} color={brand.gold} />
                <Text style={styles.percentText}>{percent}%</Text>
              </View>
            </View>

            <Text style={styles.message}>{policy.message}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 8, 20, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 9999,
  },
  panel: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(20, 25, 32, 0.98)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  title: {
    fontSize: 18,
    fontFamily: brand.fontBodyBold,
    fontWeight: "800",
    color: brand.gold,
  },
  body: {
    padding: 24,
    alignItems: "center",
    gap: 24,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: brand.gold,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  percentContainer: {
    alignItems: "center",
  },
  percentText: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold,
    marginTop: 2,
  },
  message: {
    fontSize: 15,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
