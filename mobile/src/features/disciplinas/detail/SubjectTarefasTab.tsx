import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import {
  createTarefa,
  deleteTarefa,
  toggleTarefa,
} from "../../../api/mutations";
import { brand } from "../../../theme/brand";
import { cardStyles, formatPtDate } from "../../../ui/cards";
import { EmptyState } from "../../../ui/EmptyState";

type Props = {
  code: string;
  tasks: AcademicTask[];
  onChanged: () => void;
};

export function SubjectTarefasTab({ code, tasks, onChanged }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle(task: AcademicTask) {
    setBusyId(task.id);
    setError(null);
    try {
      await toggleTarefa(task.id, !task.done);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Falha ao atualizar."
      );
    } finally {
      setBusyId(null);
    }
  }

  function onDelete(task: AcademicTask) {
    Alert.alert("Excluir tarefa", `Remover “${task.title}”?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusyId(task.id);
            try {
              await deleteTarefa(task.id);
              onChanged();
            } catch (err) {
              setError(
                err instanceof ApiClientError
                  ? err.message
                  : "Falha ao excluir."
              );
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  }

  async function onCreate() {
    if (!titulo.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dataFim.trim())) {
      setError("Título e data AAAA-MM-DD são obrigatórios.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createTarefa(code, {
        titulo: titulo.trim(),
        data_fim: dataFim.trim(),
      });
      setTitulo("");
      setDataFim("");
      setShowForm(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Falha ao criar tarefa."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
        <Text style={styles.addBtnText}>
          {showForm ? "Cancelar" : "+ Nova tarefa"}
        </Text>
      </Pressable>

      {showForm ? (
        <View style={cardStyles.card}>
          <TextInput
            style={styles.input}
            placeholder="Título"
            placeholderTextColor={brand.textMuted}
            value={titulo}
            onChangeText={setTitulo}
          />
          <TextInput
            style={styles.input}
            placeholder="Data (AAAA-MM-DD)"
            placeholderTextColor={brand.textMuted}
            value={dataFim}
            onChangeText={setDataFim}
            autoCapitalize="none"
          />
          <Pressable
            style={[styles.saveBtn, creating && styles.disabled]}
            onPress={() => void onCreate()}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={brand.text} />
            ) : (
              <Text style={styles.saveText}>Salvar</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {tasks.length === 0 ? (
        <EmptyState title="Sem tarefas" />
      ) : (
        tasks.map((task, idx) => (
          <View key={`task-${task.id}-${idx}`} style={cardStyles.card}>
            <View style={cardStyles.row}>
              <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
                {task.title}
              </Text>
              {busyId === task.id ? (
                <ActivityIndicator color={brand.gold} />
              ) : (
                <Pressable onPress={() => void onToggle(task)}>
                  <Text style={task.done ? styles.done : styles.pending}>
                    {task.done ? "Feita ✓" : "Pendente"}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={cardStyles.cardMeta}>
              {formatPtDate(task.dueDateIso)}
              {task.dueTime ? ` · ${task.dueTime}` : ""}
              {task.type === "grupo" ? " · Grupo" : " · Individual"}
            </Text>
            {task.description ? (
              <Text style={cardStyles.cardMeta}>{task.description}</Text>
            ) : null}
            <Pressable onPress={() => onDelete(task)} style={styles.del}>
              <Text style={styles.delText}>Excluir</Text>
            </Pressable>
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
  done: { color: brand.success, fontWeight: "700", fontSize: 12 },
  pending: { color: brand.gold, fontWeight: "700", fontSize: 12 },
  del: { marginTop: 8 },
  delText: { color: brand.danger, fontSize: 12, fontWeight: "700" },
  error: { color: brand.danger, marginBottom: 8, fontWeight: "600" },
});
