import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SubjectListItem } from "@acme/api-contracts";
import { gradeRiskLabel } from "../../lib/safe-text";
import { brand } from "../../theme/brand";
import { Card, formatGrade } from "../../ui/cards";

type Props = {
  item: SubjectListItem;
  onPress: () => void;
};

/** Espelho de `.subject-list-card` (F28 ≤768). */
export function DisciplinaCard({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card
        compact
        style={[
          styles.card,
          { borderLeftColor: item.color || brand.gold, borderLeftWidth: 3 },
        ]}
      >
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.displayName || item.name}</Text>
            <Text style={styles.code}>
              {item.shortLabel || item.code}
              {item.ch != null ? ` · ${item.ch}h` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Horário</Text>
            <Text style={styles.metaValue}>{item.schedule || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Sala</Text>
            <Text style={styles.metaValue}>
              {item.room ? item.room : "—"}
            </Text>
          </View>
          {item.professor ? (
            <View style={[styles.metaCell, styles.metaFull]}>
              <Text style={styles.metaLabel}>Professor</Text>
              <Text style={styles.metaValue}>{item.professor}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.foot}>
          <View>
            <Text style={styles.statValue}>
              {formatGrade(item.grade, item.gradeMax)}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {gradeRiskLabel(item.gradeRisk)}
              </Text>
            </View>
          </View>
          <Text style={styles.absences}>
            Faltas {item.absences}/{item.maxAbsences}
            {item.tasks > 0 ? `\n${item.tasks} tarefa(s)` : ""}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  card: { marginBottom: brand.space2 },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: brand.space3,
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
  metaFull: { width: "100%" },
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
  statValue: {
    fontSize: 15,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.gold,
  },
  badge: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: brand.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(212,168,67,0.16)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  absences: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textAlign: "right",
  },
});
