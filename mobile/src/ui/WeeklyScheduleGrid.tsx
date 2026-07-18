import { ScrollView, StyleSheet, Text, View } from "react-native";
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
};

/**
 * Grade da Semana — barras por faixa horária (paridade com o site).
 */
export function WeeklyScheduleGrid({ schedule }: Props) {
  const { days, timeSlots, grid } = schedule;
  const hasAny = grid.some((row) => row.some((cell) => cell != null));

  if (!hasAny) {
    return (
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardMeta}>
          Sincronize com o SIGAA para ver seus horários oficiais.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.headerRow}>
          <View style={styles.timeCol}>
            <Text style={styles.headerCell}> </Text>
          </View>
          {days.map((day) => (
            <View key={day} style={styles.dayCol}>
              <Text style={styles.headerCell}>{DAY_SHORT[day] ?? day.slice(0, 3)}</Text>
            </View>
          ))}
        </View>
        {timeSlots.map((slot, rowIdx) => {
          const short = slot.split(" - ")[0] ?? slot;
          return (
            <View key={slot} style={styles.row}>
              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>{short}</Text>
              </View>
              {days.map((_, dayIdx) => {
                const cell = grid[rowIdx]?.[dayIdx] ?? null;
                if (!cell) {
                  return <View key={`${rowIdx}-${dayIdx}`} style={styles.dayCol} />;
                }
                return (
                  <View
                    key={`${rowIdx}-${dayIdx}`}
                    style={[
                      styles.dayCol,
                      styles.bar,
                      { backgroundColor: cell.color || brand.blue },
                    ]}
                  >
                    <Text style={styles.barCode} numberOfLines={1}>
                      {cell.code}
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
    </ScrollView>
  );
}

const COL_W = 64;
const TIME_W = 52;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
    minHeight: 44,
  },
  timeCol: {
    width: TIME_W,
    justifyContent: "center",
    paddingRight: 4,
  },
  dayCol: {
    width: COL_W,
    marginHorizontal: 2,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 40,
  },
  headerCell: {
    color: brand.gold,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  timeLabel: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  bar: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  barCode: {
    color: brand.white,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  barRoom: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    textAlign: "center",
    marginTop: 1,
  },
});
