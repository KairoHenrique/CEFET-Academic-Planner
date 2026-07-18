import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  title?: string;
  subtitle?: string;
  cacheHint?: string | null;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle">;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  title,
  subtitle,
  cacheHint,
  footer,
  contentContainerStyle,
  scrollProps,
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingStyle = padded ? styles.padded : undefined;

  const header =
    title || subtitle || cacheHint ? (
      <View style={styles.header}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {cacheHint ? <Text style={styles.cacheHint}>{cacheHint}</Text> : null}
      </View>
    ) : null;

  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            paddingStyle,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
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
    backgroundColor: brand.surface,
  },
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: brand.navy,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: brand.muted,
    lineHeight: 20,
  },
  cacheHint: {
    marginTop: 6,
    fontSize: 12,
    color: brand.gold,
    fontWeight: "600",
  },
});
