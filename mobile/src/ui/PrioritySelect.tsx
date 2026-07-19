import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";
import { brand } from "../theme/brand";
import {
  PRIORITY_COLOR,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  type PriorityLevel,
} from "../lib/priority";
import { Icon, type IconName } from "./Icon";

type Props = {
  level: PriorityLevel;
  onChange: (level: PriorityLevel) => void;
};

const ICON_BY_LEVEL: Record<PriorityLevel, IconName> = {
  high: "priority-high",
  medium_high: "priority-medium-high",
  neutral: "priority-neutral",
  medium_low: "priority-medium-low",
  low: "priority-low",
};

/** Prioridade — mesmos ícones SVG do site (`Icon.tsx`). */
export function PrioritySelect({ level, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const color = PRIORITY_COLOR[level];

  return (
    <>
      <Pressable
        onPress={(e) => {
          e?.stopPropagation?.();
          setOpen(true);
        }}
        hitSlop={8}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`Prioridade: ${PRIORITY_LABELS[level]}`}
      >
        <Icon name={ICON_BY_LEVEL[level]} size={14} color={color} />
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
            <Text style={styles.sheetTitle}>Prioridade</Text>
            {PRIORITY_ORDER.map((option) => {
              const active = option === level;
              const optColor = PRIORITY_COLOR[option];
              return (
                <Pressable
                  key={option}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Icon
                    name={ICON_BY_LEVEL[option]}
                    size={16}
                    color={optColor}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      active && { color: optColor },
                    ]}
                  >
                    {PRIORITY_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 32,
    height: 32,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,32,72,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  sheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sheetTitle: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: brand.radiusSm,
  },
  optionActive: {
    backgroundColor: "rgba(232,198,106,0.1)",
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
});
