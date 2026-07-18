import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { SubjectDetailResponse } from "@acme/api-contracts";
import { ApiClientError, requestJson } from "../auth/api";
import { SubjectFaltasTab } from "../features/disciplinas/detail/SubjectFaltasTab";
import { SubjectInfoTab } from "../features/disciplinas/detail/SubjectInfoTab";
import { SubjectNotasTab } from "../features/disciplinas/detail/SubjectNotasTab";
import { SubjectTarefasTab } from "../features/disciplinas/detail/SubjectTarefasTab";
import type { DisciplinasStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { SegmentTabs } from "../ui/SegmentTabs";

type Route = RouteProp<DisciplinasStackParamList, "DisciplinaDetail">;
type Tab = "info" | "notas" | "faltas" | "tarefas";

const TABS = [
  { id: "info" as const, label: "Info" },
  { id: "notas" as const, label: "Notas" },
  { id: "faltas" as const, label: "Faltas" },
  { id: "tarefas" as const, label: "Tarefas" },
];

export function DisciplinaDetailScreen() {
  const { params } = useRoute<Route>();
  const [tab, setTab] = useState<Tab>("notas");
  const [data, setData] = useState<SubjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await requestJson<SubjectDetailResponse>(
        `/api/disciplinas/${encodeURIComponent(params.code)}`
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar a matéria."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.code]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const subject = data?.subject;
  const reload = useCallback(() => {
    void load();
  }, [load]);

  return (
    <Screen
      title={subject?.displayName ?? params.name ?? params.code}
      subtitle={
        subject
          ? `${subject.code}${subject.shortLabel ? ` · ${subject.shortLabel}` : ""}`
          : params.code
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
      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {data && subject ? (
        <>
          <SegmentTabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === "info" ? (
            <SubjectInfoTab
              code={params.code}
              subject={subject}
              grupo={data.grupo}
              catalogOnly={data.catalogOnly}
              onChanged={reload}
            />
          ) : null}
          {tab === "notas" ? (
            <SubjectNotasTab
              code={params.code}
              subject={subject}
              onChanged={reload}
            />
          ) : null}
          {tab === "faltas" ? (
            <SubjectFaltasTab
              code={params.code}
              subject={subject}
              attendance={data.attendance}
              onChanged={reload}
            />
          ) : null}
          {tab === "tarefas" ? (
            <SubjectTarefasTab
              code={params.code}
              tasks={data.tasks}
              onChanged={reload}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
