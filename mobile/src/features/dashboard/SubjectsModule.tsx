import { Text, View } from "react-native";
import type { SubjectSummary } from "@acme/api-contracts";
import { gradeRiskLabel } from "../../lib/safe-text";
import { cardStyles, formatGrade } from "../../ui/cards";
import { EmptyState } from "../../ui/EmptyState";

type Props = { disciplinas: SubjectSummary[] };

export function SubjectsModule({ disciplinas }: Props) {
  return (
    <>
      <Text style={cardStyles.sectionTitle}>Matérias em andamento</Text>
      {disciplinas.length === 0 ? (
        <EmptyState title="Nenhuma matéria cursando" />
      ) : (
        disciplinas.map((d, idx) => (
          <View
            key={`${d.code}-${idx}`}
            style={[
              cardStyles.card,
              { borderLeftColor: d.color, borderLeftWidth: 3 },
            ]}
          >
            <Text style={cardStyles.cardTitle}>{d.displayName || d.name}</Text>
            <Text style={cardStyles.cardMeta}>
              {d.code}
              {d.shortLabel ? ` · ${d.shortLabel}` : ""}
            </Text>
            <Text style={cardStyles.cardMeta}>
              Nota {formatGrade(d.grade, d.gradeMax)} ·{" "}
              {gradeRiskLabel(d.gradeRisk)} · Faltas {d.absences}/
              {d.maxAbsences}
              {d.tasks > 0 ? ` · ${d.tasks} tarefa(s)` : ""}
            </Text>
            {d.room ? (
              <Text style={cardStyles.cardMeta}>Sala {d.room}</Text>
            ) : null}
          </View>
        ))
      )}
    </>
  );
}
