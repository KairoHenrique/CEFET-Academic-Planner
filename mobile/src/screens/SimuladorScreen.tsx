import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiClientError, requestJson } from "../auth/api";
import {
  checkChoques,
  deleteSimulacao,
  listSimulacoes,
  saveSimulacao,
} from "../api/mutations";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { SegmentTabs } from "../ui/SegmentTabs";

type TurmaCourse = {
  code: string;
  name: string;
  shortLabel?: string;
  status?: string;
  professor?: string;
  room?: string;
  ch?: number;
  vagas?: number | null;
  color?: string;
  turmaSigaaId?: string;
};

type TurmasResponse = {
  semestre: string;
  syncedAt: string | null;
  courses?: TurmaCourse[];
  curso?: TurmaCourse[];
  optativas?: TurmaCourse[];
  empty?: boolean;
};

type Tab = "catalogo" | "selecao" | "salvas";

const STATUS_LABEL: Record<string, string> = {
  done: "Matriculada",
  unlocked: "Liberada",
  conditional: "Condicional",
  locked: "Bloqueada",
};

export function SimuladorScreen() {
  const [tab, setTab] = useState<Tab>("catalogo");
  const [data, setData] = useState<TurmasResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sims, setSims] = useState<
    Array<{ id: number; titulo: string; semestre: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [turmas, saved] = await Promise.all([
        requestJson<TurmasResponse>("/api/turmas-ofertadas"),
        listSimulacoes().catch(() => ({ ok: true as const, items: [] })),
      ]);
      setData(turmas);
      setSims(saved.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar turmas ofertadas."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const courses = useMemo(() => {
    if (!data) return [];
    return data.courses ?? [...(data.curso ?? []), ...(data.optativas ?? [])];
  }, [data]);

  function courseId(c: TurmaCourse): string | null {
    return c.turmaSigaaId?.trim() || null;
  }

  async function toggleSelect(c: TurmaCourse) {
    const id = courseId(c);
    if (!id) return;
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    if (next.length < 2) {
      setConflictMsg(null);
      return;
    }
    try {
      const result = await checkChoques(next);
      setConflictMsg(
        result.hasConflicts
          ? `${result.conflicts.length} choque(s) de horário detectado(s).`
          : "Sem choques de horário."
      );
    } catch (err) {
      setConflictMsg(
        err instanceof ApiClientError ? err.message : "Falha ao checar choques."
      );
    }
  }

  async function onSave() {
    if (selected.length === 0 || titulo.trim().length < 2) {
      setConflictMsg("Selecione turmas e informe um título (≥2 chars).");
      return;
    }
    setBusy(true);
    try {
      await saveSimulacao({
        titulo: titulo.trim(),
        turmaSigaaIds: selected,
        semestre: data?.semestre,
      });
      setTitulo("");
      const saved = await listSimulacoes();
      setSims(saved.items);
      setConflictMsg("Simulação salva.");
      setTab("salvas");
    } catch (err) {
      setConflictMsg(
        err instanceof ApiClientError ? err.message : "Falha ao salvar."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Simulador de matrícula"
      eyebrow="Montar grade"
      subtitle={
        data
          ? `Semestre ${data.semestre}${data.syncedAt ? " · sync recente" : ""}`
          : "Turmas ofertadas no SIGAA"
      }
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={brand.gold}
          />
        ),
      }}
    >
      <SegmentTabs
        tabs={[
          { id: "catalogo", label: "Catálogo" },
          { id: "selecao", label: `Seleção (${selected.length})` },
          { id: "salvas", label: "Salvas" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {conflictMsg ? (
        <View style={cardStyles.card}>
          <Text style={cardStyles.cardMeta}>{conflictMsg}</Text>
        </View>
      ) : null}

      {tab === "catalogo" ? (
        data?.empty || courses.length === 0 ? (
          !loading ? (
            <EmptyState
              title="Nenhuma turma ofertada"
              message="Sincronize turmas no Sync ou no site."
            />
          ) : null
        ) : (
          courses.map((course, idx) => {
            const id = courseId(course);
            const isOn = id ? selected.includes(id) : false;
            return (
              <Pressable
                key={`${course.code}-${idx}`}
                style={[
                  cardStyles.card,
                  isOn && styles.selected,
                  course.color
                    ? { borderLeftColor: course.color, borderLeftWidth: 4 }
                    : null,
                ]}
                onPress={() => void toggleSelect(course)}
                disabled={!id}
              >
                <Text style={cardStyles.cardTitle}>
                  {course.shortLabel ?? course.name}
                  {isOn ? " ✓" : ""}
                </Text>
                <Text style={cardStyles.cardMeta}>{course.code}</Text>
                {course.status ? (
                  <Text style={styles.status}>
                    {STATUS_LABEL[course.status] ?? course.status}
                  </Text>
                ) : null}
                {!id ? (
                  <Text style={cardStyles.cardMeta}>
                    Sem turmaSigaaId — só leitura
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        )
      ) : null}

      {tab === "selecao" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Título da simulação"
            placeholderTextColor={brand.textMuted}
            value={titulo}
            onChangeText={setTitulo}
          />
          <Pressable
            style={[styles.saveBtn, busy && styles.disabled]}
            onPress={() => void onSave()}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={brand.text} />
            ) : (
              <Text style={styles.saveText}>Salvar simulação</Text>
            )}
          </Pressable>
          {selected.length === 0 ? (
            <EmptyState title="Nenhuma turma selecionada" />
          ) : (
            selected.map((id) => {
              const course = courses.find((c) => courseId(c) === id);
              return (
                <View key={id} style={cardStyles.card}>
                  <Text style={cardStyles.cardTitle}>
                    {course?.shortLabel ?? course?.name ?? id}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setSelected((prev) => prev.filter((x) => x !== id))
                    }
                  >
                    <Text style={styles.remove}>Remover</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </>
      ) : null}

      {tab === "salvas" ? (
        sims.length === 0 ? (
          <EmptyState title="Nenhuma simulação salva" />
        ) : (
          sims.map((sim) => (
            <View key={sim.id} style={cardStyles.card}>
              <Text style={cardStyles.cardTitle}>{sim.titulo}</Text>
              <Text style={cardStyles.cardMeta}>{sim.semestre}</Text>
              <Pressable
                onPress={() => {
                  void (async () => {
                    await deleteSimulacao(sim.id);
                    const saved = await listSimulacoes();
                    setSims(saved.items);
                  })();
                }}
              >
                <Text style={styles.remove}>Apagar</Text>
              </Pressable>
            </View>
          ))
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  selected: { borderColor: brand.gold, borderWidth: 1 },
  status: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: brand.gold,
  },
  input: {
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: brand.text,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: brand.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveText: { color: brand.text, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  remove: {
    marginTop: 8,
    color: brand.danger,
    fontWeight: "700",
    fontSize: 12,
  },
});
