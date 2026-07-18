import { StyleSheet, Text, View } from "react-native";
import type { SubjectDetail } from "@acme/api-contracts";
import { gradeRiskLabel } from "../../../lib/safe-text";
import { brand } from "../../../theme/brand";
import { cardStyles, formatGrade } from "../../../ui/cards";
import { EmptyState } from "../../../ui/EmptyState";

type Props = { subject: SubjectDetail };

export function SubjectNotasTab({ subject }: Props) {
  return (
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>
          Total {formatGrade(subject.grade, subject.gradeMax)}
        </Text>
        <Text style={cardStyles.cardMeta}>
          Mínimo {subject.passingGrade} · {gradeRiskLabel(subject.gradeRisk)}
        </Text>
      </View>

      <Text style={cardStyles.sectionTitle}>Avaliações</Text>
      {subject.evaluations.length === 0 ? (
        <EmptyState title="Sem avaliações registradas" />
      ) : (
        subject.evaluations.map((ev, idx) => (
          <View key={`${ev.id ?? ev.name}-${idx}`} style={cardStyles.card}>
            <View style={cardStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={cardStyles.cardTitle}>
                  {ev.name}
                  {ev.extra ? " (extra)" : ""}
                </Text>
                <Text style={cardStyles.cardMeta}>Máx. {ev.max}</Text>
              </View>
              <Text style={styles.score}>
                {ev.score != null ? ev.score.toFixed(1) : "—"}
              </Text>
            </View>
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  score: {
    fontSize: 18,
    fontWeight: "800",
    color: brand.gold,
  },
});
