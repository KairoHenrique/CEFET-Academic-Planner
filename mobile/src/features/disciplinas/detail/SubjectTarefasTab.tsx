import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AcademicTask } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import {
  createTarefa,
  deleteTarefa,
  toggleTarefa,
} from "../../../api/mutations";
import type { RootStackParamList } from "../../../navigation/types";
import { brand } from "../../../theme/brand";
import { TaskDetailContent } from "../../../ui/ActivityDetail";
import { formatPtDate } from "../../../ui/cards";
import { DetailModal } from "../../../ui/DetailModal";
import { EmptyState } from "../../../ui/EmptyState";
import { Icon } from "../../../ui/Icon";

type Props = {
  code: string;
  tasks: AcademicTask[];
  onChanged: () => void;
};

type DueFilter =
  | "todas"
  | "semana"
  | "mes"
  | "atrasadas"
  | "concluidas";

const FILTERS: { id: DueFilter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mês" },
  { id: "atrasadas", label: "Atrasadas" },
  { id: "concluidas", label: "Concluídas" },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function matchesFilter(task: AcademicTask, filter: DueFilter): boolean {
  if (filter === "todas") return !task.done;
  if (filter === "concluidas") return Boolean(task.done);
  if (task.done) return false;

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(task.dueDateIso + "T12:00:00"));
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (filter === "atrasadas") return diffDays < 0;
  if (filter === "semana") return diffDays >= 0 && diffDays <= 7;
  if (filter === "mes") return diffDays >= 0 && diffDays <= 31;
  return true;
}

/** Painel Tarefas F28 — título, badge pendentes, filtros, lista. */
export function SubjectTarefasTab({ code, tasks, onChanged }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AcademicTask | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DueFilter>("todas");

  const pendingCount = useMemo(
    () => tasks.filter((t) => !t.done).length,
    [tasks]
  );
  const doneCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);

  const visible = useMemo(() => {
    return tasks
      .filter((t) => matchesFilter(t, filter))
      .sort((a, b) => a.dueDateIso.localeCompare(b.dueDateIso));
  }, [tasks, filter]);

  const doneVisible =
    filter === "todas"
      ? tasks.filter((t) => t.done).sort((a, b) => a.dueDateIso.localeCompare(b.dueDateIso))
      : [];

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

  const selectedLive =
    selected && tasks.find((task) => task.id === selected.id);

  function renderTask(task: AcademicTask, faded = false) {
    return (
      <Pressable key={`task-${task.id}`} onPress={() => setSelected(task)}>
        <View style={[styles.taskCard, faded && styles.taskDone]}>
        <View style={styles.taskRow}>
          <Text style={[styles.taskTitle, faded && styles.taskTitleDone]}>
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
        <Text style={styles.taskMeta}>
          {formatPtDate(task.dueDateIso)}
          {task.dueTime ? ` · ${task.dueTime}` : ""}
          {task.type === "grupo" ? " · Grupo" : " · Individual"}
        </Text>
        <Pressable onPress={() => onDelete(task)} style={styles.del}>
          <Text style={styles.delText}>Excluir</Text>
        </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <>
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleLeft}>
          <Icon name="clipboard" size={16} color={brand.gold} />
          <Text style={styles.panelTitle}>Tarefas e Atividades</Text>
        </View>
        {pendingCount > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.outlineBtn}
        onPress={() => setShowForm((v) => !v)}
      >
        <Text style={styles.outlineBtnText}>
          {showForm ? "Cancelar" : "+ Tarefa"}
        </Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <Pressable
              key={f.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showForm ? (
        <View style={styles.addBox}>
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
        <EmptyState title="Nenhuma tarefa cadastrada nesta disciplina." />
      ) : visible.length === 0 && doneVisible.length === 0 ? (
        <EmptyState title="Nenhuma tarefa neste filtro." />
      ) : (
        <>
          {visible.map((t) => renderTask(t))}
          {filter === "todas" && doneVisible.length > 0 ? (
            <>
              <Text style={styles.doneHeader}>
                Concluídas ({doneCount})
              </Text>
              {doneVisible.map((t) => renderTask(t, true))}
            </>
          ) : null}
        </>
      )}
    </View>

    <DetailModal
      visible={Boolean(selectedLive)}
      title={selectedLive?.title ?? "Tarefa"}
      onClose={() => setSelected(null)}
    >
      {selectedLive ? (
        <TaskDetailContent
          task={selectedLive}
          onClose={() => setSelected(null)}
          onOpenSubject={(subjectCode) =>
            navigation.navigate("DisciplinaDetail", { code: subjectCode })
          }
          onToggleDone={() => void onToggle(selectedLive)}
          onSubmitted={onChanged}
        />
      ) : null}
    </DetailModal>
    </>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  panelTitle: {
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  pendingBadge: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.4)",
    backgroundColor: "rgba(248,81,73,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#FF7B72",
  },
  outlineBtn: {
    minHeight: brand.touchMin,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,168,67,0.06)",
    marginBottom: 10,
  },
  outlineBtnText: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  filterChipActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(232,198,106,0.14)",
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
  filterChipTextActive: {
    color: brand.gold200,
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
  taskCard: {
    borderWidth: 1,
    borderColor: brand.borderMuted,
    borderRadius: brand.radiusMd,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  taskDone: { opacity: 0.55 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
  },
  taskMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  done: { color: brand.success, fontWeight: "700", fontSize: 12 },
  pending: { color: brand.gold, fontWeight: "700", fontSize: 12 },
  del: { marginTop: 8 },
  delText: { color: brand.danger, fontSize: 12, fontWeight: "700" },
  doneHeader: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
  },
  error: { color: brand.danger, marginBottom: 8, fontWeight: "600" },
});
