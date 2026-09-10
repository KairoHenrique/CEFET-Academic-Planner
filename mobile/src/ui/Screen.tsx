import type { ReactNode, RefObject } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from "react-native-safe-area-context";
import { brand } from "../theme/brand";
import { PageHeader } from "./cards";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  cacheHint?: string | null;
  footer?: ReactNode;
  /** Default sem top — navbar F28 já cobre safe area. Login/paywall passam top. */
  safeEdges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
  scrollProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle" | "ref">;
};

/** Shell F28 — atmosfera radial azul + header. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  eyebrow,
  title,
  highlight,
  subtitle,
  cacheHint,
  footer,
  safeEdges = ["left", "right"],
  contentContainerStyle,
  scrollRef,
  scrollProps,
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingStyle = padded ? styles.padded : undefined;

  const header =
    title || subtitle || cacheHint || eyebrow ? (
      <PageHeader
        eyebrow={eyebrow}
        title={title ?? ""}
        highlight={highlight}
        subtitle={subtitle}
        cacheHint={cacheHint}
      />
    ) : null;

  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      <LinearGradient
        colors={["#001a36", brand.bg, "#000814"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(0,88,168,0.28)", "transparent"]}
        style={styles.topGlow}
        pointerEvents="none"
      />
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            paddingStyle,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          {...scrollProps}
        >
          {body}
        </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View
          style={[
            styles.flex,
            paddingStyle,
            { paddingBottom: Math.max(insets.bottom, 16) },
            contentContainerStyle,
          ]}
        >
          {body}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
