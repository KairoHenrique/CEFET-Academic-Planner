import { Text, View } from "react-native";
import type { SubjectSummary } from "@acme/api-contracts";
import { gradeRiskLabel } from "../../lib/safe-text";
import { brand } from "../../theme/brand";
import { Card, cardStyles, formatGrade } from "../../ui/cards";
import { EmptyState } from "../../ui/EmptyState";

type Props = { disciplinas: SubjectSummary[] };

/** Grid de cards de matéria — visual F28 subjects-grid / list cards. */
export function SubjectsModule({ disciplinas }: Props) {
  return (
    <>
      <Text style={cardStyles.sectionTitle}>Matérias em andamento</Text>
      {disciplinas.length === 0 ? (
        <EmptyState title="Nenhuma matéria cursando" />
      ) : (
        disciplinas.map((d, idx) => (
          <Card
            key={`${d.code}-${idx}`}
            compact
            style={{
              borderLeftColor: d.color,
              borderLeftWidth: 3,
            }}
          >
            <Text style={styles.name}>{d.displayName || d.name}</Text>
            <Text style={cardStyles.cardMeta}>
              {d.shortLabel || d.code}
            </Text>
            <View style={styles.foot}>
              <Text style={styles.grade}>
                {formatGrade(d.grade, d.gradeMax)}
              </Text>
              <Text style={cardStyles.cardMeta}>
                {gradeRiskLabel(d.gradeRisk)} · {d.absences}/{d.maxAbsences}{" "}
                faltas
                {d.tasks > 0 ? ` · ${d.tasks} tarefa(s)` : ""}
              </Text>
            </View>
            {d.room ? (
              <Text style={cardStyles.cardMeta}>Sala {d.room}</Text>
            ) : null}
          </Card>
        ))
      )}
    </>
  );
}

const styles = {
  name: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700" as const,
    color: brand.text,
  },
  foot: {
    marginTop: 8,
  },
  grade: {
    fontSize: 18,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800" as const,
    color: brand.gold,
  },
};
