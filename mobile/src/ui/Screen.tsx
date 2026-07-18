import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { brand } from "../theme/brand";
import { PageHeader } from "./cards";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Eyebrow F28 (ex.: SEMESTRE 2026.1) */
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  cacheHint?: string | null;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle">;
};

/**
 * Shell de página F28 — fundo Cruzeiro + PageHeader (eyebrow/título/subtitle).
 */
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
  contentContainerStyle,
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.atmosphere} pointerEvents="none" />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            paddingStyle,
            { paddingBottom: Math.max(insets.bottom, 16) + 72 },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {body}
        </ScrollView>
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
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // radial approx: leve vinheta superior navy
    borderTopWidth: 120,
    borderTopColor: "rgba(0,24,52,0.35)",
  },
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
