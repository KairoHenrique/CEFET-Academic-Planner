import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

type Props<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
};

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
  wrap: { marginBottom: 14, flexGrow: 0 },
  row: { gap: 8, paddingRight: 8 },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    minWidth: 72,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(0,96,177,0.45)",
    borderColor: brand.gold,
  },
  text: {
    color: brand.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  textActive: { color: brand.gold },
});
