import { StyleSheet, Text, View } from "react-native";
import type { ScheduleApiResponse } from "@acme/api-contracts";
import { brand } from "../theme/brand";
import { cardStyles } from "./cards";

const DAY_SHORT: Record<string, string> = {
  Segunda: "Seg",
  Terça: "Ter",
  Quarta: "Qua",
  Quinta: "Qui",
  Sexta: "Sex",
};

type Props = {
  schedule: ScheduleApiResponse;
  /** Grade compacta estilo F28 (sem scroll horizontal). */
  compact?: boolean;
};

/**
 * Grade da Semana — paridade com o site (labels curtos no mobile).
 */
export function WeeklyScheduleGrid({ schedule, compact = true }: Props) {
  const { days, timeSlots, grid } = schedule;
  const hasAny = grid.some((row) => row.some((cell) => cell != null));

  if (!hasAny) {
    return (
      <Text style={cardStyles.cardMeta}>
        Sincronize com o SIGAA para ver seus horários oficiais.
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.timeCol}>
          <Text style={styles.headerCell}> </Text>
        </View>
        {days.map((day) => (
          <View key={day} style={[styles.dayCol, compact && styles.dayColFlex]}>
            <Text style={styles.headerCell}>
              {DAY_SHORT[day] ?? day.slice(0, 3)}
            </Text>
          </View>
        ))}
      </View>
      {timeSlots.map((slot, rowIdx) => {
        const short = slot.split(" - ")[0] ?? slot;
        return (
          <View key={`slot-${rowIdx}-${slot}`} style={styles.row}>
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>{short}</Text>
            </View>
            {days.map((day, dayIdx) => {
              const cell = grid[rowIdx]?.[dayIdx] ?? null;
              const cellKey = `${rowIdx}-${dayIdx}-${day}`;
              if (!cell) {
                return (
                  <View
                    key={cellKey}
                    style={[styles.dayCol, compact && styles.dayColFlex]}
                  />
                );
              }
              return (
                <View
                  key={cellKey}
                  style={[
                    styles.dayCol,
                    compact && styles.dayColFlex,
                    styles.bar,
                    { backgroundColor: cell.color || brand.blue },
                  ]}
                >
                  <Text style={styles.barCode} numberOfLines={1}>
                    {cell.displayName || cell.code}
                  </Text>
                  {cell.room ? (
                    <Text style={styles.barRoom} numberOfLines={1}>
                      {cell.room}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const TIME_W = 44;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
    minHeight: 40,
  },
  timeCol: {
    width: TIME_W,
    justifyContent: "center",
    paddingRight: 2,
  },
  dayCol: {
    width: 56,
    marginHorizontal: 1,
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 3,
    minHeight: 36,
  },
  dayColFlex: {
    flex: 1,
    width: undefined,
  },
  headerCell: {
    color: brand.gold,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  timeLabel: {
    color: brand.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },
  bar: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  barCode: {
    color: brand.white,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  barRoom: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 8,
    textAlign: "center",
    marginTop: 1,
  },
});
