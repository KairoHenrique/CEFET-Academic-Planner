import { Text, View } from "react-native";
import type { DisciplinaGrupoDto, SubjectDetail } from "@acme/api-contracts";
import { gradeRiskLabel } from "../../../lib/safe-text";
import { cardStyles, formatGrade } from "../../../ui/cards";

type Props = {
  subject: SubjectDetail;
  grupo: DisciplinaGrupoDto;
  catalogOnly?: boolean;
};

export function SubjectInfoTab({ subject, grupo, catalogOnly }: Props) {
  return (
    <>
      {catalogOnly ? (
        <View style={cardStyles.card}>
          <Text style={cardStyles.cardMeta}>
            Perfil do PPC — disciplina ainda não matriculada neste semestre.
            Notas, faltas e tarefas ficam disponíveis ao cursar.
          </Text>
        </View>
      ) : null}

      <View
        style={[
          cardStyles.card,
          { borderLeftColor: subject.color, borderLeftWidth: 3 },
        ]}
      >
        <Text style={cardStyles.cardTitle}>{subject.displayName}</Text>
        <Text style={cardStyles.cardMeta}>
          {subject.shortLabel || subject.code}
          {subject.ch != null ? ` · ${subject.ch}h` : ""}
        </Text>
        <Text style={cardStyles.cardMeta}>
          Nota {formatGrade(subject.grade, subject.gradeMax)} (mín.{" "}
          {subject.passingGrade}) · {gradeRiskLabel(subject.gradeRisk)}
        </Text>
        {subject.professor ? (
          <Text style={cardStyles.cardMeta}>Prof. {subject.professor}</Text>
        ) : null}
        {subject.schedule ? (
          <Text style={cardStyles.cardMeta}>{subject.schedule}</Text>
        ) : null}
        {subject.room ? (
          <Text style={cardStyles.cardMeta}>Sala {subject.room}</Text>
        ) : null}
      </View>

      {subject.ementa ? (
        <>
          <Text style={cardStyles.sectionTitle}>Ementa</Text>
          <View style={cardStyles.card}>
            <Text style={cardStyles.cardMeta}>{subject.ementa}</Text>
          </View>
        </>
      ) : null}

      {grupo.membros.length > 0 ? (
        <>
          <Text style={cardStyles.sectionTitle}>
            Grupo{grupo.nome ? ` · ${grupo.nome}` : ""}
          </Text>
          <View style={cardStyles.card}>
            {grupo.membros.map((m, i) => (
              <Text
                key={`${m.matricula ?? m.nome}-${i}`}
                style={cardStyles.cardMeta}
              >
                {m.nome}
                {m.matricula ? ` · ${m.matricula}` : ""}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}
