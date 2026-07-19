import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { IntegralizacaoResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { postIntegralizacaoHours } from "../api/mutations";
import { fetchIntegralizacao } from "../cache/fetchers";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { ChGlossaryModal } from "../features/integralizacao/ChGlossaryModal";
import { IntegrationDetailSection } from "../features/integralizacao/IntegrationDetailSection";
import {
  IntegrationSummaryCard,
  IntegrationTotalCard,
} from "../features/integralizacao/IntegrationSummaryCards";
import {
  RegisterHoursModal,
  type ManualChType,
} from "../features/integralizacao/RegisterHoursModal";
import { brand } from "../theme/brand";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

/**
 * Integralização F28 — ordem do mobile browser:
 * header → Total (donut) → Resumo por categoria → Detalhamento (+ modal cadastrar / glossário)
 */
export function IntegralizacaoScreen() {
  const [data, setData] = useState<IntegralizacaoResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchIntegralizacao();
      setData(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar a integralização."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load])
  );

  useOnSyncComplete(() => {
    void load(true);
  });

  async function onRegister(body: { tipoCh: ManualChType; horas: number }) {
    setBusy(true);
    try {
      const updated = await postIntegralizacaoHours(body);
      setData(updated);
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível cadastrar as horas."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Integralização"
      eyebrow="Currículo"
      subtitle="Acompanhe horas por categoria e cadastre atividades complementares"
      cacheHint={fromCache ? "Dados do cache offline" : null}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
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

      {data ? (
        <>
          <IntegrationTotalCard
            totalDone={data.totalDone}
            totalHours={data.totalHours}
            percent={data.percent}
          />
          <IntegrationSummaryCard categories={data.categories} />
          {data.categories.length === 0 ? (
            <EmptyState title="Sem categorias" />
          ) : (
            <IntegrationDetailSection
              categories={data.categories}
              onRegisterClick={() => setRegisterOpen(true)}
              onGlossaryClick={() => setGlossaryOpen(true)}
            />
          )}

          <RegisterHoursModal
            open={registerOpen}
            busy={busy}
            onClose={() => setRegisterOpen(false)}
            onSubmit={onRegister}
          />
          <ChGlossaryModal
            open={glossaryOpen}
            onClose={() => setGlossaryOpen(false)}
          />
        </>
      ) : null}
    </Screen>
  );
}
