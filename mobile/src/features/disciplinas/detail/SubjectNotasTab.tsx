import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { SubjectDetail, SubjectEvaluation } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import { addNota, updateNotaScore } from "../../../api/mutations";
import { brand } from "../../../theme/brand";
import { EmptyState } from "../../../ui/EmptyState";
import { GradeRiskBlock, DISPLAY_GRADE_MAX } from "../../../ui/GradeRiskBlock";
import { Icon } from "../../../ui/Icon";

type Props = {
  code: string;
  subject: SubjectDetail;
  onChanged: () => void;
};

const ZONE_BADGE = {
  safe: {
    bg: "rgba(63,185,80,0.2)",
    border: "rgba(63,185,80,0.35)",
    color: "#5FD068",
  },
  warning: {
    bg: "rgba(210,153,34,0.22)",
    border: "rgba(210,153,34,0.35)",
    color: "#E8B84A",
  },
  danger: {
    bg: "rgba(248,81,73,0.22)",
    border: "rgba(248,81,73,0.35)",
    color: "#FF7B72",
  },
} as const;

/** Nota mínima nesta avaliação para atingir a aprovação (igual ao site). */
function evaluationMinimum(
  rows: SubjectEvaluation[],
  index: number,
  passingGrade: number
): number | null {
  const row = rows[index];
  if (!row || row.extra) return null;
  const othersTotal = rows.reduce<number>(
    (acc, ev, idx) => (idx === index || ev.extra ? acc : acc + (ev.score ?? 0)),
    0
  );
  return Math.min(row.max, Math.max(0, passingGrade - othersTotal));
}

function renderNecessario(
  row: SubjectEvaluation,
  minNeeded: number | null,
  pointsNeeded: number
): string {
  if (row.extra) return "—";
  const rowScoreMet =
    row.score != null &&
    minNeeded != null &&
    row.score + 0.001 >= minNeeded;
  if (pointsNeeded === 0 || rowScoreMet) return "OK";
  if (minNeeded != null) return `≥ ${minNeeded.toFixed(1)}`;
  return "—";
}

/** Painel Notas F28 — header + GradeRisk + cards de avaliação (mobile browser). */
export function SubjectNotasTab({ code, subject, onChanged }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState("");
  const [max, setMax] = useState("10");
  const [score, setScore] = useState("");
  const [error, setError] = useState<string | null>(null);

  const risk = subject.gradeRisk;
  const scaleMax = subject.gradeMax || DISPLAY_GRADE_MAX;
  const passing = risk.passingGrade || 60;
  const rows = subject.evaluations;

  const remainingTeacher = useMemo(() => {
    const distributed = rows
      .filter((r) => !r.extra)
      .reduce((acc, r) => acc + r.max, 0);
    return Math.max(0, scaleMax - distributed);
  }, [rows, scaleMax]);

  const headerBadge =
    risk.zone !== "unknown"
      ? ZONE_BADGE[risk.zone as keyof typeof ZONE_BADGE]
      : null;

  async function saveScore(id: number) {
    const parsed =
      draft.trim() === "" ? null : Number(draft.replace(",", "."));
    if (parsed != null && Number.isNaN(parsed)) {
      setError("Nota inválida.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateNotaScore(code, id, parsed);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Falha ao salvar nota."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onAdd() {
    const notaMaxima = Number(max.replace(",", "."));
    const notaObtida =
      score.trim() === "" ? null : Number(score.replace(",", "."));
    if (!nome.trim() || Number.isNaN(notaMaxima)) {
      setError("Nome e nota máxima são obrigatórios.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addNota(code, {
        avaliacao_nome: nome.trim(),
        nota_maxima: notaMaxima,
        nota_obtida:
          notaObtida != null && !Number.isNaN(notaObtida) ? notaObtida : null,
      });
      setNome("");
      setMax("10");
      setScore("");
      setShowAdd(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Falha ao adicionar."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Icon name="chart" size={16} color={brand.gold} />
            <Text style={styles.panelTitle}>Notas</Text>
          </View>
          {headerBadge ? (
            <View
              style={[
                styles.riskBadge,
                {
                  backgroundColor: headerBadge.bg,
                  borderColor: headerBadge.border,
                },
              ]}
            >
              <Text style={[styles.riskBadgeText, { color: headerBadge.color }]}>
                {risk.label}
              </Text>
            </View>
          ) : subject.grade != null ? (
            <View style={styles.goldBadge}>
              <Text style={styles.goldBadgeText}>{subject.grade} pts</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          style={styles.outlineBtn}
          onPress={() => setShowAdd((v) => !v)}
        >
          <Text style={styles.outlineBtnText}>
            {showAdd ? "Cancelar" : "+ Avaliação"}
          </Text>
        </Pressable>
      </View>

      {risk.zone !== "unknown" ? (
        <View style={styles.riskBlock}>
          <GradeRiskBlock
            grade={subject.grade}
            gradeMax={scaleMax}
            gradeRisk={risk}
          />
        </View>
      ) : null}

      {showAdd ? (
        <View style={styles.addBox}>
          <TextInput
            style={styles.input}
            placeholder="Nome da avaliação"
            placeholderTextColor={brand.textMuted}
            value={nome}
            onChangeText={setNome}
          />
          <TextInput
            style={styles.input}
            placeholder="Nota máxima"
            placeholderTextColor={brand.textMuted}
            keyboardType="decimal-pad"
            value={max}
            onChangeText={setMax}
          />
          <TextInput
            style={styles.input}
            placeholder="Nota obtida (opcional)"
            placeholderTextColor={brand.textMuted}
            keyboardType="decimal-pad"
            value={score}
            onChangeText={setScore}
          />
          <Pressable
            style={[styles.saveBtn, busy && styles.disabled]}
            onPress={() => void onAdd()}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={brand.text} />
            ) : (
              <Text style={styles.saveText}>Adicionar</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {rows.length === 0 ? (
        <EmptyState title="Sem avaliações registradas" />
      ) : (
        rows.map((ev, idx) => {
          const minNeeded = evaluationMinimum(rows, idx, passing);
          const necessario = renderNecessario(
            ev,
            minNeeded,
            risk.pointsNeeded
          );
          return (
            <View key={`${ev.id ?? ev.name}-${idx}`} style={styles.evalCard}>
              <View style={styles.evalRow}>
                <Text style={styles.evalLabel}>Avaliação</Text>
                <Text style={styles.evalValue}>
                  {ev.name}
                  {ev.extra ? " (extra)" : ""}
                </Text>
              </View>
              <View style={styles.evalRow}>
                <Text style={styles.evalLabel}>Máx.</Text>
                <Text style={styles.evalValue}>{ev.max}</Text>
              </View>
              <View style={styles.evalRow}>
                <Text style={styles.evalLabel}>Nota</Text>
                {editingId === ev.id ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.scoreInput}
                      value={draft}
                      onChangeText={setDraft}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={brand.textMuted}
                    />
                    <Pressable
                      onPress={() => ev.id != null && void saveScore(ev.id)}
                      disabled={busy}
                    >
                      <Text style={styles.saveLink}>OK</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      if (ev.id == null) return;
                      setEditingId(ev.id);
                      setDraft(ev.score != null ? String(ev.score) : "");
                    }}
                  >
                    <Text style={styles.score}>
                      {ev.score != null ? ev.score.toFixed(1) : "—"}
                    </Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.evalRow}>
                <Text style={styles.evalLabel}>Necessário</Text>
                <Text
                  style={[
                    styles.evalValue,
                    necessario === "OK" && styles.necessarioOk,
                  ]}
                >
                  {necessario}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {remainingTeacher > 0 ? (
        <Text style={styles.footerNote}>
          Faltam {remainingTeacher % 1 === 0 ? remainingTeacher : remainingTeacher.toFixed(1)}{" "}
          pontos para o professor distribuir
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusLg,
    padding: brand.space3,
    marginBottom: brand.space3,
  },
  panelHeader: {
    gap: 10,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  riskBadge: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  riskBadgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  goldBadge: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    backgroundColor: "rgba(212,168,67,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  goldBadgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  outlineBtn: {
    minHeight: brand.touchMin,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,168,67,0.06)",
  },
  outlineBtnText: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 13,
  },
  riskBlock: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  addBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: brand.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: brand.text, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  evalCard: {
    borderWidth: 1,
    borderColor: brand.borderMuted,
    borderRadius: brand.radiusMd,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.15)",
    gap: 8,
  },
  evalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  evalLabel: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  evalValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
  necessarioOk: {
    color: "#5FD068",
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  score: {
    fontSize: 16,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.gold,
  },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreInput: {
    width: 64,
    borderWidth: 1,
    borderColor: brand.gold,
    borderRadius: 8,
    color: brand.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "center",
  },
  saveLink: { color: brand.gold, fontWeight: "800" },
  footerNote: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  error: { color: brand.danger, marginBottom: 8, fontWeight: "600" },
});
