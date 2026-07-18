import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AttendanceSummary, SubjectDetail } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import { updateFaltaStatus } from "../../../api/mutations";
import { brand } from "../../../theme/brand";
import { cardStyles } from "../../../ui/cards";
import { EmptyState } from "../../../ui/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  presente: "Presente",
  falta: "Falta",
  nao_registrada: "Não registrada",
};

const CYCLE: Array<"presente" | "falta" | "nao_registrada"> = [
  "presente",
  "falta",
  "nao_registrada",
];

type Props = {
  code: string;
  subject: SubjectDetail;
  attendance: AttendanceSummary;
  onChanged: () => void;
};

export function SubjectFaltasTab({
  code,
  subject,
  attendance,
  onChanged,
}: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const absences = subject.absences;
  const max = subject.maxAbsences;
  const usedPct = max > 0 ? Math.round((absences / max) * 100) : 0;

  async function cycleStatus(
    id: number,
    current: "presente" | "falta" | "nao_registrada"
  ) {
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length]!;
    setBusyId(id);
    setError(null);
    try {
      await updateFaltaStatus(code, id, next);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Falha ao atualizar falta."
      );
    } finally {
      setBusyId(null);
    }
  }

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
        <Text style={[cardStyles.cardMeta, { marginTop: 8 }]}>
          Toque no status para ciclar: Presente → Falta → Não registrada
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={cardStyles.sectionTitle}>Registros</Text>
      {attendance.records.length === 0 ? (
        <EmptyState title="Sem registros de frequência" />
      ) : (
        attendance.records.map((rec, idx) => (
          <View key={`${rec.id}-${idx}`} style={cardStyles.card}>
            <View style={cardStyles.row}>
              <Text style={cardStyles.cardTitle}>{rec.date}</Text>
              {busyId === rec.id ? (
                <ActivityIndicator color={brand.gold} />
              ) : (
                <Pressable
                  onPress={() =>
                    void cycleStatus(
                      rec.id,
                      rec.status as "presente" | "falta" | "nao_registrada"
                    )
                  }
                >
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
                </Pressable>
              )}
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
  error: { color: brand.danger, marginBottom: 8, fontWeight: "600" },
});
