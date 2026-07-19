import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SubjectListItem } from "@acme/api-contracts";
import { computeAbsenceRisk } from "../../lib/absence-risk";
import type { PriorityLevel } from "../../lib/priority";
import { brand } from "../../theme/brand";
import { Card } from "../../ui/cards";
import { GradeRiskBlock, DISPLAY_GRADE_MAX } from "../../ui/GradeRiskBlock";
import { PrioritySelect } from "../../ui/PrioritySelect";
import { goldRipple, pressableOpacityStyle } from "../../ui/pressableStyles";

type Props = {
  item: SubjectListItem;
  priority: PriorityLevel;
  onChangePriority: (level: PriorityLevel) => void;
  onPress: () => void;
};

const ABSENCE_BADGE = {
  safe: {
    bg: "rgba(63,185,80,0.18)",
    border: "rgba(63,185,80,0.35)",
    color: "#5FD068",
  },
  warning: {
    bg: "rgba(210,153,34,0.2)",
    border: "rgba(210,153,34,0.4)",
    color: "#E8B84A",
  },
  danger: {
    bg: "rgba(248,81,73,0.2)",
    border: "rgba(248,81,73,0.4)",
    color: "#FF7B72",
  },
} as const;

/** Espelho de `.subject-list-card` (F28 ≤768). */
function DisciplinaCardInner({
  item,
  priority,
  onChangePriority,
  onPress,
}: Props) {
  const absence = computeAbsenceRisk(item.absences, item.maxAbsences);
  const badge = ABSENCE_BADGE[absence.zone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressableOpacityStyle(pressed)}
      android_ripple={goldRipple}
    >
      <Card compact style={styles.card}>
        <View style={styles.top}>
          <View style={styles.subjectRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: item.color || brand.gold },
              ]}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name || item.displayName}
              </Text>
              <Text style={styles.code}>{item.shortLabel || item.code}</Text>
            </View>
          </View>
          <PrioritySelect level={priority} onChange={onChangePriority} />
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Horário</Text>
            <Text style={styles.metaValue}>{item.schedule || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Sala</Text>
            <Text style={styles.metaValue}>{item.room || "—"}</Text>
          </View>
        </View>

        <View style={styles.foot}>
          <GradeRiskBlock
            grade={item.grade}
            gradeRisk={item.gradeRisk}
            gradeMax={item.gradeMax || DISPLAY_GRADE_MAX}
            compact
          />
          <View
            style={[
              styles.absenceBadge,
              { backgroundColor: badge.bg, borderColor: badge.border },
            ]}
          >
            <Text style={[styles.absenceBadgeText, { color: badge.color }]}>
              {item.absences}/{item.maxAbsences} faltas
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const DisciplinaCard = memo(DisciplinaCardInner);

const styles = StyleSheet.create({
  card: { marginBottom: brand.space2 },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: brand.space3,
  },
  subjectRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  name: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    lineHeight: 19,
  },
  code: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  metaGrid: {
    marginTop: brand.space3,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: brand.space2,
  },
  metaCell: { width: "47%" },
  metaLabel: {
    fontSize: 10,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    marginTop: 1,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  foot: {
    marginTop: brand.space3,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: brand.space2,
  },
  absenceBadge: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  absenceBadgeText: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
});
