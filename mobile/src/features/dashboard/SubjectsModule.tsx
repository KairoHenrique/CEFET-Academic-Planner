import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { GradeRisk, SubjectSummary } from "@acme/api-contracts";
import { computeAbsenceRisk } from "../../lib/absence-risk";
import { useSubjectPriorities } from "../../lib/useSubjectPriorities";
import { gradeRiskLabel } from "../../lib/safe-text";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import { ProgressBar, type ProgressTone } from "../../ui/ProgressBar";
import { PrioritySelect } from "../../ui/PrioritySelect";
import { SectionHeader } from "../../ui/SectionHeader";
import { EmptyState } from "../../ui/EmptyState";

type Props = {
  disciplinas: SubjectSummary[];
  onSeeAll?: () => void;
  onOpenSubject?: (code: string) => void;
};

const ZONE_TONE: Record<string, ProgressTone> = {
  safe: "safe",
  warning: "warning",
  danger: "danger",
};

const ZONE_TEXT = {
  safe: "#5FD068",
  warning: "#E8B84A",
  danger: "#FF7B72",
  unknown: brand.textMuted,
} as const;

const ZONE_BADGE_BG = {
  safe: "rgba(63,185,80,0.2)",
  warning: "rgba(210,153,34,0.22)",
  danger: "rgba(248,81,73,0.22)",
  unknown: "rgba(88,166,255,0.16)",
} as const;

const ZONE_BADGE_BORDER = {
  safe: "rgba(63,185,80,0.35)",
  warning: "rgba(210,153,34,0.35)",
  danger: "rgba(248,81,73,0.35)",
  unknown: "rgba(88,166,255,0.3)",
} as const;

function gradeZone(risk: GradeRisk | undefined): keyof typeof ZONE_TEXT {
  return risk?.zone ?? "unknown";
}

function gradeValueColor(label: string, zone: keyof typeof ZONE_TEXT): string {
  if (label === "Aprovado" || zone === "safe") return ZONE_TEXT.safe;
  if (label === "Risco" || label === "Recuperação" || zone === "warning") {
    return ZONE_TEXT.warning;
  }
  if (zone === "danger") return ZONE_TEXT.danger;
  return brand.text;
}

function formatScore(grade: number | null): string {
  if (grade == null) return "—";
  return Number.isInteger(grade) ? String(grade) : grade.toFixed(1);
}

function StatusBadge({
  label,
  zone,
}: {
  label: string;
  zone: keyof typeof ZONE_TEXT;
}) {
  return (
    <View
      style={[
        styles.statBadge,
        {
          backgroundColor: ZONE_BADGE_BG[zone],
          borderColor: ZONE_BADGE_BORDER[zone],
        },
      ]}
    >
      <Text style={[styles.statBadgeText, { color: ZONE_TEXT[zone] }]}>
        {label}
      </Text>
    </View>
  );
}

/** Clone SubjectCard do site + prioridade real + badges limpos. */
export function SubjectsModule({
  disciplinas,
  onSeeAll,
  onOpenSubject,
}: Props) {
  const { getPriority, setSubjectPriority, sortByPriority } =
    useSubjectPriorities();
  const sorted = sortByPriority(disciplinas);

  return (
    <View>
      <SectionHeader
        title="Disciplinas do Semestre"
        icon="books"
        linkLabel="Ver todas"
        onPressLink={onSeeAll}
      />

      {sorted.length === 0 ? (
        <EmptyState title="Nenhuma matéria cursando" />
      ) : (
        sorted.map((d, idx) => {
          const absence = computeAbsenceRisk(d.absences, d.maxAbsences);
          const gZone = gradeZone(d.gradeRisk);
          const gLabel = gradeRiskLabel(d.gradeRisk);
          const gradeColor = gradeValueColor(gLabel, gZone);
          const aTone = ZONE_TONE[absence.zone] ?? "warning";
          const gTone = ZONE_TONE[gZone] ?? "gold";
          const max = d.gradeMax || 100;
          const gradePct =
            d.gradeRisk && d.gradeRisk.zone !== "unknown"
              ? Math.min(100, (d.gradeRisk.currentTotal / max) * 100)
              : d.grade != null
                ? Math.min(100, (d.grade / max) * 100)
                : 0;
          const passMark =
            d.gradeRisk && d.gradeRisk.zone !== "unknown"
              ? Math.min(100, (d.gradeRisk.passingGrade / max) * 100)
              : null;

          return (
            <View key={`${d.code}-${idx}`} style={styles.cardWrap}>
              <LinearGradient
                colors={[
                  hexBorder(d.color),
                  "rgba(58,160,232,0.25)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGlow}
                pointerEvents="none"
              />
              <View
                style={[styles.subjectCard, { borderLeftColor: d.color }]}
              >
                <View style={styles.cardHeader}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => onOpenSubject?.(d.code)}
                  >
                    <Text style={styles.subjectName} numberOfLines={2}>
                      {d.name || d.displayName}
                    </Text>
                  </Pressable>
                  <PrioritySelect
                    level={getPriority(d.code)}
                    onChange={(level) => setSubjectPriority(d.code, level)}
                  />
                </View>

                <Pressable onPress={() => onOpenSubject?.(d.code)}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBlock}>
                      <Text style={styles.statLabel}>Nota</Text>
                      <Text style={styles.statValue}>
                        <Text style={{ color: gradeColor }}>
                          {formatScore(d.grade)}
                        </Text>
                        <Text style={styles.statMax}> / {max}</Text>
                      </Text>
                      <StatusBadge label={gLabel} zone={gZone} />
                    </View>

                    <View style={styles.statBlock}>
                      <Text style={styles.statLabel}>Faltas</Text>
                      <Text style={styles.statValue}>
                        {d.absences}
                        <Text style={styles.statMax}> / {d.maxAbsences}</Text>
                      </Text>
                      <StatusBadge label={absence.label} zone={absence.zone} />
                    </View>
                  </View>

                  <View style={styles.bars}>
                    {gZone !== "unknown" ? (
                      <ProgressBar
                        percent={gradePct}
                        tone={gTone}
                        height={10}
                        markAt={passMark}
                      />
                    ) : null}
                    <ProgressBar
                      percent={absence.ratio}
                      tone={aTone}
                      height={10}
                    />
                  </View>

                  <View style={styles.meta}>
                    {d.room ? (
                      <View style={styles.metaItemRow}>
                        <Icon
                          name="building"
                          size={13}
                          color={brand.textSecondary}
                        />
                        <Text style={styles.metaItem}>{d.room}</Text>
                      </View>
                    ) : null}
                    {d.tasks > 0 ? (
                      <View style={styles.metaItemRow}>
                        <Icon
                          name="clipboard"
                          size={13}
                          color={brand.warning}
                        />
                        <Text style={[styles.metaItem, styles.tasksWarn]}>
                          {d.tasks} tarefa{d.tasks > 1 ? "s" : ""}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function hexBorder(color: string): string {
  if (!color || !color.startsWith("#")) return "rgba(163,113,247,0.45)";
  return `${color}99`;
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: brand.space4,
    borderRadius: brand.radiusLg,
    overflow: "hidden",
    position: "relative",
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  subjectCard: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    borderLeftWidth: 2,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: brand.space3,
    zIndex: 2,
  },
  subjectName: {
    flex: 1,
    fontFamily: brand.fontDisplay,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    color: brand.text,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statBlock: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    letterSpacing: 0.66,
    textTransform: "uppercase",
    color: brand.textSecondary,
  },
  statValue: {
    fontSize: 17,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    color: brand.text,
  },
  statMax: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    fontWeight: "500",
    color: brand.textMuted,
  },
  /** Sem shadow — no Android shadow no View com Text causa “fantasma”. */
  statBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    marginTop: 2,
  },
  statBadgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  bars: {
    gap: 8,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  metaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItem: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  tasksWarn: {
    color: brand.warning,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
});
