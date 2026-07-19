import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand } from "../../theme/brand";

type Props = {
  children: ReactNode;
  foot?: ReactNode;
  subtitle: string;
};

/** Auth card com atmosfera desktop (gradientes + borda ouro + halo). */
export function LoginCard({ children, foot, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enter, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.7,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.3,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [enter, glow]);

  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
      <LinearGradient
        colors={["#001a36", brand.bg, "#00060f"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(0,88,168,0.4)", "transparent"]}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.goldOrb, { opacity: glow }]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.cardShell,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(232,198,106,0.22)",
              "rgba(0,56,100,0.55)",
              "rgba(0,20,40,0.92)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBorder}
          >
            <View style={styles.card}>
              <View style={styles.accent} />
              <LinearGradient
                colors={[
                  "rgba(0,40,80,0.55)",
                  "rgba(0,0,0,0.18)",
                  "transparent",
                ]}
                style={styles.head}
              >
                <View style={styles.brandRow}>
                  <View style={styles.logoHalo}>
                    <Image
                      source={require("../../../assets/logo_v2.png")}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.brandText}>
                    <Text style={styles.institution}>CEFET-MG</Text>
                    <Text style={styles.title}>ACME HUB</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </LinearGradient>
              <View style={styles.body}>{children}</View>
              {foot ? <View style={styles.foot}>{foot}</View> : null}
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  goldOrb: {
    position: "absolute",
    top: 72,
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(232,198,106,0.12)",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cardShell: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  cardBorder: {
    borderRadius: brand.radiusXl,
    padding: 1,
  },
  card: {
    borderRadius: brand.radiusXl - 1,
    backgroundColor: "rgba(0,32,64,0.96)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.28)",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: brand.gold,
    zIndex: 2,
  },
  head: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.borderMuted,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoHalo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,198,106,0.1)",
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.35)",
  },
  logo: { width: 40, height: 40 },
  brandText: { flex: 1, gap: 2 },
  institution: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: brand.gold200,
  },
  title: {
    fontSize: 26,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 20,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  foot: {
    borderTopWidth: 1,
    borderTopColor: brand.borderMuted,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(0,16,32,0.45)",
  },
});
