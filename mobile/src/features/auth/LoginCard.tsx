import type { ReactNode } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand } from "../../theme/brand";

type Props = {
  children: ReactNode;
  foot?: ReactNode;
  subtitle: string;
};

/** Espelho F28 de `LoginCard` — logo + CEFET-MG + ACME HUB. */
export function LoginCard({ children, foot, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.accent} />
          <View style={styles.head}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../../assets/logo_v2.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.brandText}>
                <Text style={styles.institution}>CEFET-MG</Text>
                <Text style={styles.title}>ACME HUB</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.body}>{children}</View>
          {foot ? <View style={styles.foot}>{foot}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: brand.gold,
  },
  head: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { width: 44, height: 44 },
  brandText: { flex: 1, gap: 2 },
  institution: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.8,
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
    paddingBottom: 16,
    gap: 14,
  },
  foot: {
    borderTopWidth: 1,
    borderTopColor: brand.borderMuted,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
