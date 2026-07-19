import { StyleSheet, Text, View } from "react-native";
import type { ScheduleApiResponse } from "@acme/api-contracts";
import { hexWithAlpha } from "../lib/color-mix";
import { brand } from "../theme/brand";
import { Card } from "./cards";
import { SectionHeader } from "./SectionHeader";

type Props = {
  schedule: ScheduleApiResponse;
  onOpenCalendar?: () => void;
};

/**
 * Grade F28 mobile — espelho do site ≤768:
 * header na mesma linha · colunas iguais · nome 1 linha com ellipsis · célula 40px.
 */
export function WeeklyScheduleGrid({ schedule, onOpenCalendar }: Props) {
  const { days, timeSlots, grid } = schedule;
  const hasAny = grid.some((row) => row.some((cell) => cell != null));

  return (
    <Card tight>
      <SectionHeader
        title="Grade da Semana"
        icon="calendar"
        linkLabel="Ver calendário completo"
        onPressLink={onOpenCalendar}
      />

      {!hasAny ? (
        <Text style={styles.emptyMsg}>
          Sincronize com o SIGAA para ver seus horários oficiais.
        </Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={styles.dayCol} />
            {timeSlots.map((slot) => (
              <View key={slot} style={styles.slotCol}>
                <Text style={styles.timeShort} numberOfLines={1}>
                  {slot.slice(0, 5)}
                </Text>
              </View>
            ))}
          </View>

          {days.map((day, dayIdx) => (
            <View key={`${day}-${dayIdx}`} style={styles.row}>
              <View style={styles.dayCol}>
                <Text style={styles.dayShort}>{day.slice(0, 3)}</Text>
              </View>
              {timeSlots.map((_, slotIdx) => {
                const cell = grid[dayIdx]?.[slotIdx] ?? null;
                const key = `${dayIdx}-${slotIdx}`;
                if (!cell) {
                  return (
                    <View key={key} style={[styles.slotCol, styles.emptyCell]} />
                  );
                }
                const color = cell.color || brand.jerseyLight;
                return (
                  <View
                    key={key}
                    style={[
                      styles.slotCol,
                      styles.filledCell,
                      {
                        backgroundColor: hexWithAlpha(color, 0.28),
                        borderColor: hexWithAlpha(color, 0.5),
                      },
                    ]}
                  >
                    <Text
                      style={[styles.slotName, { color }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {cell.name || cell.code}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyMsg: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 18,
  },
  table: {
    width: "100%",
  },
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
    paddingHorizontal: 1,
  },
  dayShort: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    letterSpacing: -0.2,
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
    paddingVertical: 2,
  },
  timeShort: {
    fontSize: 8,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyCell: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: brand.border,
  },
  filledCell: {
    borderWidth: 1,
    overflow: "hidden",
  },
  slotName: {
    fontSize: 8,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    lineHeight: 10,
  },
});
