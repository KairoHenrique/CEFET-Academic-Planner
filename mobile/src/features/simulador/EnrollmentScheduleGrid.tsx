import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { ScheduleSlot, ScheduleSlotData } from "./types";
import { scheduleCellKey, TIME_SLOTS, WEEK_DAYS } from "./types";
import { hexWithAlpha } from "../../lib/color-mix";
import { brand } from "../../theme/brand";

type Props = {
  schedule: ScheduleSlot[][];
  highlightEmpty: boolean;
  allowedEmptyCells: Set<string> | null;
  conflictCellKeys?: ReadonlySet<string>;
  /** Cores empilhadas no preview multi-horário (site). */
  previewCellLayers?: Map<string, string[]> | null;
  onSlotPress: (payload: {
    slot: ScheduleSlotData;
    dayIdx: number;
    slotIdx: number;
    day: string;
    time: string;
  }) => void;
  onEmptyPress: (dayIdx: number, slotIdx: number) => void;
};

/** Grade interativa F28 — compacta, tap-to-place. */
export function EnrollmentScheduleGrid({
  schedule,
  highlightEmpty,
  allowedEmptyCells,
  conflictCellKeys,
  previewCellLayers,
  onSlotPress,
  onEmptyPress,
}: Props) {
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <View style={styles.dayCol} />
        {TIME_SLOTS.map((slot) => (
          <View key={slot} style={styles.slotCol}>
            <Text style={styles.timeShort} numberOfLines={1}>
              {slot.slice(0, 5)}
            </Text>
          </View>
        ))}
      </View>
      {WEEK_DAYS.map((day, dayIdx) => (
        <View key={day} style={styles.row}>
          <View style={styles.dayCol}>
            <Text style={styles.dayShort}>{day.slice(0, 3)}</Text>
          </View>
          {TIME_SLOTS.map((time, slotIdx) => {
            const cell = schedule[dayIdx]?.[slotIdx] ?? null;
            const key = scheduleCellKey(dayIdx, slotIdx);
            const allowed = allowedEmptyCells?.has(key) ?? false;
            const conflict = conflictCellKeys?.has(key) ?? false;
            const previewColors = previewCellLayers?.get(key) ?? [];

            if (!cell) {
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.slotCol,
                    styles.emptyCell,
                    highlightEmpty && allowed && styles.allowedCell,
                    conflict && styles.conflictCell,
                    previewColors.length > 0 && styles.previewCell,
                  ]}
                  onPress={() => {
                    if (highlightEmpty && allowed) onEmptyPress(dayIdx, slotIdx);
                  }}
                  disabled={!highlightEmpty || !allowed}
                >
                  {previewColors.length > 0 ? (
                    <View style={styles.previewLayers}>
                      {previewColors.map((color, idx) => (
                        <View
                          key={`${key}-p-${idx}`}
                          style={[
                            styles.previewLayer,
                            {
                              backgroundColor: hexWithAlpha(color, 0.55),
                              flex: 1,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            }

            const color = cell.color || brand.jerseyLight;
            return (
              <Pressable
                key={key}
                style={[
                  styles.slotCol,
                  styles.filledCell,
                  {
                    backgroundColor: hexWithAlpha(color, 0.28),
                    borderColor: conflict
                      ? brand.danger
                      : hexWithAlpha(color, 0.5),
                  },
                  conflict && styles.conflictFilled,
                ]}
                onPress={() =>
                  onSlotPress({
                    slot: cell,
                    dayIdx,
                    slotIdx,
                    day,
                    time,
                  })
                }
              >
                <Text
                  style={[styles.slotName, { color }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cell.name || cell.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

type DetailProps = {
  open: boolean;
  slot: ScheduleSlotData | null;
  day: string;
  time: string;
  onClose: () => void;
  onRemove: () => void;
};

export function EnrollmentSlotDetailModal({
  open,
  slot,
  day,
  time,
  onClose,
  onRemove,
}: DetailProps) {
  if (!slot) return null;
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.detailTitle}>{slot.displayName ?? slot.name}</Text>
          <Text style={styles.detailMeta}>
            {slot.code} · {day} · {time.slice(0, 5)}
          </Text>
          {slot.room ? (
            <Text style={styles.detailMeta}>Sala {slot.room}</Text>
          ) : null}
          {slot.professor ? (
            <Text style={styles.detailMeta}>{slot.professor}</Text>
          ) : null}
          <Pressable style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeText}>Remover da grade</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  table: { width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 2,
  },
  dayCol: {
    width: 32,
    minWidth: 32,
    maxWidth: 32,
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayShort: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  slotCol: {
    flex: 1,
    minWidth: 0,
    height: 40,
    marginHorizontal: 1,
    borderRadius: brand.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  timeShort: {
    fontSize: 8,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
    textAlign: "center",
  },
  emptyCell: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: brand.border,
  },
  allowedCell: {
    borderStyle: "solid",
    borderColor: brand.gold,
    backgroundColor: "rgba(212,168,67,0.18)",
  },
  previewCell: {
    borderStyle: "solid",
    borderColor: brand.gold,
    padding: 0,
    overflow: "hidden",
  },
  previewLayers: {
    flex: 1,
    width: "100%",
    height: "100%",
    flexDirection: "row",
  },
  previewLayer: {
    height: "100%",
  },
  conflictCell: {
    borderColor: brand.danger,
  },
  filledCell: {
    borderWidth: 1,
    overflow: "hidden",
  },
  conflictFilled: {
    borderWidth: 2,
  },
  slotName: {
    fontSize: 8,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 6,
  },
  detailMeta: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    marginBottom: 4,
  },
  removeBtn: {
    marginTop: 14,
    backgroundColor: "rgba(248,81,73,0.18)",
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.4)",
    borderRadius: brand.radiusMd,
    paddingVertical: 12,
    alignItems: "center",
  },
  removeText: {
    color: "#FF7B72",
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeText: {
    color: brand.textMuted,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
});
