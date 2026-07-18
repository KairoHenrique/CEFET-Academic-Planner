import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiClientError, requestJson } from "../auth/api";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

/** Resposta simplificada — paridade completa com web em iteração futura. */
type TurmaCourseLoose = {
  code: string;
  name: string;
  shortLabel?: string;
  status?: string;
  professor?: string;
  room?: string;
  ch?: number;
  vagas?: number | null;
  semestre?: string;
  color?: string;
};

type TurmasOfertadasLoose = {
  semestre: string;
  syncedAt: string | null;
  courses: TurmaCourseLoose[];
  curso?: TurmaCourseLoose[];
  optativas?: TurmaCourseLoose[];
  empty?: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  done: "Matriculada",
  unlocked: "Liberada",
  conditional: "Condicional",
  locked: "Bloqueada",
};

export function SimuladorScreen() {
  const [data, setData] = useState<TurmasOfertadasLoose | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await requestJson<TurmasOfertadasLoose>(
        "/api/turmas-ofertadas"
      );
      setData(result);
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

  const courses =
    data?.courses ??
    [...(data?.curso ?? []), ...(data?.optativas ?? [])];

  return (
    <Screen
      title="Simulador de matrícula"
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
      <View style={styles.note}>
        <Text style={styles.noteText}>
          Versão inicial — lista turmas ofertadas. Grade interativa e
          auto-posicionamento virão em polish futuro.
        </Text>
      </View>

      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {data?.empty || courses.length === 0 ? (
        !loading ? (
          <EmptyState
            title="Nenhuma turma ofertada"
            message="Aguarde sync ou verifique o período de matrícula."
          />
        ) : null
      ) : (
        courses.map((course, idx) => (
          <View
            key={`${course.code}-${idx}`}
            style={[
              cardStyles.card,
              course.color
                ? { borderLeftColor: course.color, borderLeftWidth: 4 }
                : null,
            ]}
          >
            <Text style={cardStyles.cardTitle}>
              {course.shortLabel ?? course.name}
            </Text>
            <Text style={cardStyles.cardMeta}>{course.code}</Text>
            {course.status ? (
              <Text style={styles.status}>
                {STATUS_LABEL[course.status] ?? course.status}
              </Text>
            ) : null}
            {course.professor ? (
              <Text style={cardStyles.cardMeta}>Prof. {course.professor}</Text>
            ) : null}
            {course.room ? (
              <Text style={cardStyles.cardMeta}>Sala {course.room}</Text>
            ) : null}
            <Text style={cardStyles.cardMeta}>
              {course.ch ? `${course.ch}h` : ""}
              {course.vagas != null ? ` · ${course.vagas} vagas` : ""}
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    backgroundColor: brand.glass,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brand.border,
  },
  noteText: {
    fontSize: 13,
    color: brand.textSecondary,
    lineHeight: 18,
  },
  status: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: brand.gold,
  },
});
