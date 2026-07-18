import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { SubjectDetail } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import { addNota, updateNotaScore } from "../../../api/mutations";
import { gradeRiskLabel } from "../../../lib/safe-text";
import { brand } from "../../../theme/brand";
import { cardStyles, formatGrade } from "../../../ui/cards";
import { EmptyState } from "../../../ui/EmptyState";

type Props = {
  code: string;
  subject: SubjectDetail;
  onChanged: () => void;
};

export function SubjectNotasTab({ code, subject, onChanged }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState("");
  const [max, setMax] = useState("10");
  const [score, setScore] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        nota_obtida: notaObtida != null && !Number.isNaN(notaObtida) ? notaObtida : null,
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
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>
          Total {formatGrade(subject.grade, subject.gradeMax)}
        </Text>
        <Text style={cardStyles.cardMeta}>
          Mínimo {subject.passingGrade} · {gradeRiskLabel(subject.gradeRisk)}
        </Text>
      </View>

      <Pressable style={styles.addBtn} onPress={() => setShowAdd((v) => !v)}>
        <Text style={styles.addBtnText}>
          {showAdd ? "Cancelar" : "+ Avaliação"}
        </Text>
      </Pressable>

      {showAdd ? (
        <View style={cardStyles.card}>
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
            {ev.id != null ? (
              <Text style={styles.hint}>Toque na nota para editar</Text>
            ) : null}
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.gold,
    alignItems: "center",
  },
  addBtnText: { color: brand.gold, fontWeight: "700" },
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
  score: { fontSize: 18, fontWeight: "800", color: brand.gold },
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
  hint: { marginTop: 6, fontSize: 11, color: brand.textMuted },
  error: { color: brand.danger, marginBottom: 8, fontWeight: "600" },
});
