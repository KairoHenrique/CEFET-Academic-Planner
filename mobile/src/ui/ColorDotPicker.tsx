import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

/** Paleta do site (`CRUZEIRO_PALETTE`). */
export const SUBJECT_COLOR_PALETTE = [
  { label: "Azul Cruzeiro", value: "#0060B1" },
  { label: "Azul claro", value: "#1A8FE3" },
  { label: "Dourado", value: "#D4A843" },
  { label: "Verde", value: "#3FB950" },
  { label: "Laranja", value: "#D29922" },
  { label: "Vermelho", value: "#F85149" },
  { label: "Rosa", value: "#F47067" },
  { label: "Roxo", value: "#A371F7" },
  { label: "Ciano", value: "#39D0D8" },
] as const;

type Props = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

/** Espelho de `ColorDotPicker` do site — dot abre modal com swatches. */
export function ColorDotPicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const current = (value || brand.gold).toUpperCase();

  return (
    <>
      <Pressable
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        hitSlop={6}
        accessibilityLabel="Alterar cor da matéria"
      >
        <View style={[styles.dot, { backgroundColor: current }]} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.title}>Cor da matéria</Text>
            <Text style={styles.label}>Escolha uma cor</Text>
            <View style={styles.swatches}>
              {SUBJECT_COLOR_PALETTE.map((opt) => {
                const selected = current === opt.value.toUpperCase();
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityLabel={opt.label}
                    onPress={() => {
                      onChange(opt.value);
                    }}
                    style={[
                      styles.swatch,
                      { backgroundColor: opt.value },
                      selected && styles.swatchSelected,
                    ]}
                  />
                );
              })}
            </View>
            <Pressable style={styles.doneBtn} onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>Pronto</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  disabled: { opacity: 0.5 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
    marginBottom: 10,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: "#fff",
  },
  doneBtn: {
    marginTop: 16,
    backgroundColor: brand.gold,
    borderRadius: brand.radiusMd,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
});
