import { StyleSheet, Text, View } from "react-native";
import type { AcademicDateSemesterGroup } from "@acme/api-contracts";
import { brand } from "../theme/brand";
import { Card } from "./cards";
import { SectionHeader } from "./SectionHeader";

type Props = {
  groups: AcademicDateSemesterGroup[];
};

const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Extrai o primeiro dia de strings tipo "22/01/26 – 25/01/26" ou "23/07/26". */
function parseLeadDate(raw: string): { day: string; month: string } | null {
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const monthIdx = Number(match[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return null;
  return { day, month: MONTHS_SHORT[monthIdx] };
}

function isRange(date: string): boolean {
  return /[–-]/.test(date) && (date.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) ?? []).length >= 2;
}

/**
 * Calendário acadêmico SIGAA — cards por semestre (melhor que linhas nome|data).
 */
export function AcademicCalendarModule({ groups }: Props) {
  return (
    <Card tight style={styles.card}>
      <SectionHeader title="Calendário Acadêmico" icon="clipboard" />
      <Text style={styles.subtitle}>
        Datas institucionais do SIGAA. Suas aulas aparecem no calendário acima
        (filtro Aula).
      </Text>

      {groups.length === 0 ? (
        <Text style={styles.empty}>Nenhuma informação</Text>
      ) : (
        groups.map((group, index) => (
          <View
            key={`${group.semestre}-${index}`}
            style={[styles.semester, index > 0 && styles.semesterSpaced]}
          >
            <View style={styles.semesterHeader}>
              <View style={styles.semesterBadge}>
                <Text style={styles.semesterBadgeText}>{group.semestre}</Text>
              </View>
              <Text style={styles.semesterLabel}>Semestre letivo</Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{group.items.length}</Text>
              </View>
            </View>

            {group.items.length === 0 ? (
              <Text style={styles.empty}>Nenhuma informação</Text>
            ) : (
              <View style={styles.list}>
                {group.items.map((item, iIdx) => {
                  const lead = parseLeadDate(item.date);
                  const range = isRange(item.date);
                  return (
                    <View
                      key={`${group.semestre}-${item.label}-${item.date}-${iIdx}`}
                      style={styles.item}
                    >
                      <View style={styles.dateCol}>
                        {lead ? (
                          <>
                            <Text style={styles.dateDay}>{lead.day}</Text>
                            <Text style={styles.dateMonth}>{lead.month}</Text>
                            {range ? (
                              <Text style={styles.dateRangeHint}>período</Text>
                            ) : null}
                          </>
                        ) : (
                          <Text style={styles.dateFallback}>·</Text>
                        )}
                      </View>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Text style={styles.itemDate}>{item.date}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: brand.space3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    marginBottom: brand.space2,
    marginTop: -4,
  },
  empty: {
    fontSize: 13,
    color: brand.textMuted,
    fontFamily: brand.fontBody,
    paddingVertical: 8,
  },
  semester: {
    marginTop: 4,
  },
  semesterSpaced: {
    marginTop: brand.space4,
    paddingTop: brand.space4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brand.borderMuted,
  },
  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: brand.space3,
  },
  semesterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(232,198,106,0.16)",
    borderWidth: 1,
    borderColor: brand.borderGold,
  },
  semesterBadgeText: {
    color: brand.gold,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  semesterLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  countPill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: brand.borderMuted,
  },
  countText: {
    color: brand.textMuted,
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderMuted,
    backgroundColor: "rgba(0,24,48,0.55)",
  },
  dateCol: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(232,198,106,0.1)",
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.22)",
  },
  dateDay: {
    color: brand.gold200,
    fontSize: 18,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    lineHeight: 22,
  },
  dateMonth: {
    color: brand.gold,
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  dateRangeHint: {
    marginTop: 2,
    color: brand.textMuted,
    fontSize: 9,
    fontFamily: brand.fontBody,
  },
  dateFallback: {
    color: brand.gold,
    fontSize: 18,
    fontWeight: "700",
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    lineHeight: 19,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
});
