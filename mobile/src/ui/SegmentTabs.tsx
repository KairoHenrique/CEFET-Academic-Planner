import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

type Props<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
};

/** Chips / toggle F28 (filtros + mapa Grade|Grafo). */
export function SegmentTabs<T extends string>({
  tabs,
  value,
  onChange,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.id)}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: brand.space4, flexGrow: 0 },
  row: { gap: brand.space2, paddingRight: 8 },
  tab: {
    minHeight: brand.touchMin,
    paddingHorizontal: 14,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(0,32,72,0.45)",
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "rgba(232,198,106,0.12)",
    borderColor: brand.gold400,
  },
  text: {
    color: brand.textSecondary,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 13,
  },
  textActive: { color: brand.gold200 },
});
