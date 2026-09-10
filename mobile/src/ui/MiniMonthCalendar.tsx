import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type Props = {
  value: string;
  onSelect: (isoDate: string) => void;
  min?: string;
  allowClear?: boolean;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

function monthFromIso(iso: string): { year: number; month: number } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month] = iso.split("-").map(Number);
    return { year, month: month - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function buildDayCells(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function MiniMonthCalendar({ value, onSelect, min, allowClear }: Props) {
  const initial = monthFromIso(value || todayIso());
  const [view, setView] = useState(initial);
  const cells = useMemo(
    () => buildDayCells(view.year, view.month),
    [view.month, view.year]
  );
  const today = todayIso();

  function shiftMonth(delta: number) {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable style={styles.nav} onPress={() => shiftMonth(-1)} accessibilityLabel="Mês anterior">
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>
          {MONTHS[view.month]} {view.year}
        </Text>
        <Pressable style={styles.nav} onPress={() => shiftMonth(1)} accessibilityLabel="Próximo mês">
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day == null) {
            return <View key={`e-${index}`} style={styles.day} />;
          }
          const iso = toIso(view.year, view.month, day);
          const blocked = Boolean(min && iso < min);
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <Pressable
              key={iso}
              style={[
                styles.day,
                selected && styles.daySelected,
                isToday && !selected && styles.dayToday,
                blocked && styles.dayBlocked,
              ]}
              disabled={blocked}
              onPress={() => onSelect(iso)}
            >
              <Text
                style={[
                  styles.dayText,
                  selected && styles.dayTextSelected,
                  blocked && styles.dayTextBlocked,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.foot}>
        <Pressable
          onPress={() => {
            if (min && today < min) return;
            onSelect(today);
          }}
        >
          <Text style={styles.footText}>Hoje</Text>
        </Pressable>
        {allowClear ? (
          <Pressable onPress={() => onSelect("")}>
            <Text style={styles.footText}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bg,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    color: brand.text,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    fontSize: 15,
  },
  nav: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    color: brand.text,
    fontSize: 22,
    lineHeight: 24,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    color: brand.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  day: {
    width: "14.285%",
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: brand.gold,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: brand.gold,
  },
  dayBlocked: {
    opacity: 0.35,
  },
  dayText: {
    color: brand.text,
    fontSize: 14,
    fontFamily: brand.fontBody,
  },
  dayTextSelected: {
    color: "#1a1408",
    fontWeight: "800",
  },
  dayTextBlocked: {
    color: brand.textMuted,
  },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footText: {
    color: brand.gold200,
    fontWeight: "700",
    fontSize: 13,
  },
});
