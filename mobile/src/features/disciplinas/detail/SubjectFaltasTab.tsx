import { StyleSheet, Text, View } from "react-native";
import type { AttendanceSummary, SubjectDetail } from "@acme/api-contracts";
import { brand } from "../../../theme/brand";
import { cardStyles } from "../../../ui/cards";
import { EmptyState } from "../../../ui/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  presente: "Presente",
  falta: "Falta",
  nao_registrada: "Não registrada",
};

type Props = {
  subject: SubjectDetail;
  attendance: AttendanceSummary;
};

export function SubjectFaltasTab({ subject, attendance }: Props) {
  const absences = subject.absences;
  const max = subject.maxAbsences;
  const usedPct = max > 0 ? Math.round((absences / max) * 100) : 0;

  return (
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>
          {absences}/{max} faltas
        </Text>
        <Text style={cardStyles.cardMeta}>
          {usedPct}% usadas · {attendance.daysRemaining} faltas restantes
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${Math.min(100, usedPct)}%` }]}
          />
        </View>
      </View>

      <Text style={cardStyles.sectionTitle}>Registros</Text>
      {attendance.records.length === 0 ? (
        <EmptyState title="Sem registros de frequência" />
      ) : (
        attendance.records.map((rec, idx) => (
          <View key={`${rec.id}-${idx}`} style={cardStyles.card}>
            <View style={cardStyles.row}>
              <Text style={cardStyles.cardTitle}>{rec.date}</Text>
              <Text
                style={[
                  styles.status,
                  rec.status === "falta" ? styles.falta : styles.ok,
                ]}
              >
                {STATUS_LABEL[rec.status] ?? rec.status}
                {rec.quantidade && rec.quantidade > 1
                  ? ` ×${rec.quantidade}`
                  : ""}
              </Text>
            </View>
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  barTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: brand.danger,
    borderRadius: 4,
  },
  status: { fontWeight: "700", fontSize: 13 },
  falta: { color: brand.danger },
  ok: { color: brand.success },
});
