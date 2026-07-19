import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "@react-navigation/native";
import { ApiClientError, requestJson } from "../auth/api";
import {
  checkChoques,
  deleteSimulacao,
  fetchMapaGrafo,
  getSimulacao,
  listSimulacoes,
  saveSimulacao,
} from "../api/mutations";
import { runTurmasOfertadasSync } from "../sync/turmas-ofertadas-sync";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import {
  EnrollmentCatalog,
  type EligibilityFilter,
} from "../features/simulador/EnrollmentCatalog";
import { EnrollmentConflictNotice } from "../features/simulador/EnrollmentConflictNotice";
import { EnrollmentCorequisitoRollbackDialog } from "../features/simulador/EnrollmentCorequisitoRollbackDialog";
import {
  EnrollmentScheduleGrid,
  EnrollmentSlotDetailModal,
} from "../features/simulador/EnrollmentScheduleGrid";
import { EnrollmentSelectionFloat } from "../features/simulador/EnrollmentSelectionFloat";
import { EnrollmentSyncBar } from "../features/simulador/EnrollmentSyncBar";
import type { TurmasOfertadasResponse } from "../features/simulador/types";
import { scheduleCellKey } from "../features/simulador/types";
import { formatTurmasSyncedAt } from "../features/simulador/lib/turma-course-utils";
import { useEnrollmentSimulator } from "../features/simulador/useEnrollmentSimulator";
import { brand } from "../theme/brand";
import { Card } from "../ui/cards";
import { CourseMapGrafo } from "../ui/CourseMapGrafo";
import { ErrorBox } from "../ui/ErrorBox";
import { Icon } from "../ui/Icon";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type SavedSim = {
  id: string | number;
  titulo: string;
  semestre: string;
  turmaCount?: number;
  totalCh?: number;
};

/**
 * Montar Grade F28 — orquestração 1:1 com o site
 * (selectability, coreq, multi-horário, rollback, conflict notice).
 */
export function SimuladorScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const cardYRef = useRef(0);
  const scheduleLocalYRef = useRef(0);
  const captureViewRef = useRef<View>(null);

  const [data, setData] = useState<TurmasOfertadasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [eligibility, setEligibility] =
    useState<EligibilityFilter>("todas");
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);
  const [conflictCellKeys, setConflictCellKeys] = useState<Set<string>>(
    new Set()
  );
  const [conflictTurmaIds, setConflictTurmaIds] = useState<Set<string>>(
    new Set()
  );
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [sims, setSims] = useState<SavedSim[]>([]);
  const [simsOpen, setSimsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [turmasSyncing, setTurmasSyncing] = useState(false);
  const [turmasSyncMsg, setTurmasSyncMsg] = useState<string | null>(null);
  const [grafo, setGrafo] = useState<Awaited<
    ReturnType<typeof fetchMapaGrafo>
  > | null>(null);

  const scrollToSchedule = useCallback(() => {
    const y = Math.max(0, cardYRef.current + scheduleLocalYRef.current - 12);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  }, []);

  const sim = useEnrollmentSimulator(data, {
    onScrollToSchedule: scrollToSchedule,
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [turmas, saved, grafoData] = await Promise.all([
        requestJson<TurmasOfertadasResponse>("/api/turmas-ofertadas"),
        listSimulacoes().catch(() => ({ ok: true as const, items: [] })),
        fetchMapaGrafo().catch(() => null),
      ]);
      setData(turmas);
      setSims(saved.items);
      if (grafoData) setGrafo(grafoData);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar as turmas."
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

  useOnSyncComplete(() => {
    void load();
  });

  const requestTurmasSync = useCallback(async () => {
    if (turmasSyncing) return;
    setTurmasSyncing(true);
    setTurmasSyncMsg(null);
    setError(null);
    try {
      const result = await runTurmasOfertadasSync({ force: true });
      if (!result.skipped) {
        setTurmasSyncMsg(
          result.message || "Turmas ofertadas atualizadas."
        );
      }
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível atualizar as turmas ofertadas."
      );
    } finally {
      setTurmasSyncing(false);
    }
  }, [turmasSyncing, load]);

  useEffect(() => {
    const ids = sim.scheduleStats.placedTurmaIds;
    if (ids.length < 2) {
      setConflictMsg(null);
      setConflictCellKeys(new Set());
      setConflictTurmaIds(new Set());
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setCheckingConflicts(true);
      void checkChoques(ids)
        .then((result) => {
          if (cancelled) return;
          const cells = new Set<string>();
          const turmas = new Set<string>();
          for (const c of result.conflicts) {
            turmas.add(c.turmaSigaaIdA);
            turmas.add(c.turmaSigaaIdB);
            for (const cell of c.cells ?? []) {
              cells.add(scheduleCellKey(cell.dayIdx, cell.slotIdx));
            }
          }
          setConflictCellKeys(cells);
          setConflictTurmaIds(turmas);
          setConflictMsg(
            result.hasConflicts
              ? `${result.conflicts.length} choque(s) de horário`
              : null
          );
        })
        .catch(() => {
          if (!cancelled) setConflictMsg(null);
        })
        .finally(() => {
          if (!cancelled) setCheckingConflicts(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sim.scheduleStats.placedTurmaIds]);

  async function onSave(titulo: string) {
    if (sim.scheduleStats.placedTurmaIds.length === 0) return;
    setBusy(true);
    try {
      await saveSimulacao({
        titulo,
        turmaSigaaIds: sim.scheduleStats.placedTurmaIds,
        semestre: data?.semestre,
      });
      const saved = await listSimulacoes();
      setSims(saved.items);
      setSaveOpen(false);
      setSaveTitle("");
    } catch (err) {
      setConflictMsg(
        err instanceof ApiClientError ? err.message : "Falha ao salvar."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onLoadSim(id: string | number) {
    setBusy(true);
    try {
      const detailRes = await getSimulacao(id);
      const ids = detailRes.simulation.payload.turmaSigaaIds;
      sim.loadFromTurmaIds(ids);
      setSimsOpen(false);
      scrollToSchedule();
    } catch (err) {
      setConflictMsg(
        err instanceof ApiClientError ? err.message : "Falha ao carregar."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (sim.scheduleStats.placedCount === 0 || exporting) return;
    setExporting(true);
    try {
      const uri = await captureRef(captureViewRef, {
        format: "jpg",
        quality: 0.92,
        result: "tmpfile",
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/jpeg",
          dialogTitle: "Baixar grade simulada",
        });
      } else {
        setConflictMsg("Compartilhamento indisponível neste aparelho.");
      }
    } catch (err) {
      setConflictMsg(
        err instanceof Error ? err.message : "Falha ao gerar imagem da grade."
      );
    } finally {
      setExporting(false);
    }
  }

  const syncedLabel = formatTurmasSyncedAt(data?.syncedAt ?? null);
  const showEmpty =
    data &&
    (data.empty || !sim.visible?.hasVisibleCourses) &&
    !loading &&
    !turmasSyncing;
  const stats = sim.scheduleStats;
  const showFloat =
    Boolean(sim.selectedCourse) &&
    Boolean(sim.selectedShortLabel) &&
    sim.canPlaceSelectedCourse;

  return (
    <Screen
      title="Montar Grade"
      eyebrow="Planejamento"
      highlight={data?.semestre}
      subtitle="Monte sua grade do próximo semestre com turmas do SIGAA"
      scrollRef={scrollRef}
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

      {data ? (
        <View
          onLayout={(e) => {
            cardYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <Card tight style={styles.mainCard}>
            <EnrollmentSyncBar
              syncedAtLabel={syncedLabel}
              syncing={turmasSyncing}
              message={turmasSyncMsg}
              onRequestSync={() => {
                void requestTurmasSync();
              }}
            />

            {showEmpty ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  {data.empty
                    ? `Nenhuma turma ofertada encontrada para ${data.semestre}.`
                    : "Não há turmas pendentes para você neste semestre — as ofertas restantes já foram concluídas."}
                </Text>
                <Pressable
                  style={[styles.goldBtn, turmasSyncing && { opacity: 0.55 }]}
                  onPress={() => {
                    void requestTurmasSync();
                  }}
                  disabled={turmasSyncing}
                >
                  <Text style={styles.goldBtnText}>
                    {turmasSyncing
                      ? "Buscando turmas…"
                      : "Buscar turmas no SIGAA"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View
                  onLayout={(e) => {
                    scheduleLocalYRef.current = e.nativeEvent.layout.y;
                  }}
                >
                  {showFloat && sim.selectedCourse ? (
                    <EnrollmentSelectionFloat
                      course={sim.selectedCourse}
                      shortLabel={sim.selectedShortLabel!}
                      horario={sim.selectedHorario}
                      onDismiss={sim.requestCancelSelectedCourse}
                    />
                  ) : null}

                  {sim.conflictNotice ? (
                    <EnrollmentConflictNotice
                      key={sim.conflictNoticeEpoch}
                      notice={sim.conflictNotice}
                      onDismiss={sim.dismissConflictNotice}
                    />
                  ) : null}

                  <View ref={captureViewRef} collapsable={false}>
                    <View style={styles.scheduleHead}>
                      <Text style={styles.subtitle}>Grade simulada</Text>
                      <View style={styles.pills}>
                        <View style={styles.pill}>
                          <Icon name="books" size={12} color={brand.gold} />
                          <Text style={styles.pillText}>
                            {stats.placedCount}{" "}
                            {stats.placedCount === 1
                              ? "disciplina"
                              : "disciplinas"}
                          </Text>
                        </View>
                        {stats.placedCount > 0 ? (
                          <View style={[styles.pill, styles.pillCh]}>
                            <Icon name="chart" size={12} color={brand.gold} />
                            <Text style={styles.pillText}>
                              Obr. {stats.obrigatoriasCh}h · Opt.{" "}
                              {stats.optativasCh}h · Total {stats.totalCh}h
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {checkingConflicts || conflictMsg ? (
                      <View
                        style={[
                          styles.conflictBanner,
                          !conflictMsg && styles.conflictChecking,
                        ]}
                      >
                        <Text style={styles.conflictText}>
                          {checkingConflicts && !conflictMsg
                            ? "Verificando choques…"
                            : conflictMsg}
                        </Text>
                      </View>
                    ) : null}

                    <EnrollmentScheduleGrid
                      schedule={sim.schedule}
                      highlightEmpty={sim.highlightEmpty}
                      allowedEmptyCells={sim.allowedEmptyCells}
                      conflictCellKeys={conflictCellKeys}
                      previewCellLayers={sim.previewCellLayers}
                      onEmptyPress={sim.handleEmptyClick}
                      onSlotPress={(payload) => sim.setDetail(payload)}
                    />
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => setSimsOpen(true)}
                  >
                    <Icon
                      name="clipboard"
                      size={14}
                      color={brand.textSecondary}
                    />
                    <Text style={styles.actionText}>Simulações</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      stats.placedCount === 0 && styles.disabled,
                    ]}
                    disabled={stats.placedCount === 0 || busy}
                    onPress={() => {
                      setSaveTitle(
                        data.semestre
                          ? `Simulação ${data.semestre}`
                          : "Minha simulação"
                      );
                      setSaveOpen(true);
                    }}
                  >
                    <Icon
                      name="clipboard"
                      size={14}
                      color={brand.textSecondary}
                    />
                    <Text style={styles.actionText}>Salvar</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      stats.placedCount === 0 && styles.disabled,
                    ]}
                    disabled={stats.placedCount === 0 || exporting}
                    onPress={() => void onDownload()}
                  >
                    <Icon
                      name="download"
                      size={14}
                      color={brand.textSecondary}
                    />
                    <Text style={styles.actionText}>
                      {exporting ? "Gerando…" : "Baixar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      stats.placedCount === 0 && styles.disabled,
                    ]}
                    disabled={stats.placedCount === 0}
                    onPress={sim.handleClearSchedule}
                  >
                    <Icon name="close" size={14} color={brand.textSecondary} />
                    <Text style={styles.actionText}>Limpar</Text>
                  </Pressable>
                </View>

                <EnrollmentCatalog
                  curso={sim.availableCurso}
                  optativas={sim.availableOptativas}
                  catalog={sim.visible?.courses ?? []}
                  schedule={sim.schedule}
                  placementContext={sim.placementContext}
                  corequisitoObligation={sim.corequisitoObligation}
                  selectedTurmaId={sim.selectedCourse?.turmaSigaaId ?? null}
                  selectedGroupId={sim.selectedGroupId}
                  conflictTurmaIds={conflictTurmaIds}
                  query={query}
                  eligibility={eligibility}
                  onQueryChange={setQuery}
                  onEligibilityChange={setEligibility}
                  onSelect={sim.handleCourseClick}
                  onSelectGroup={sim.handleGroupClick}
                />
              </>
            )}
          </Card>
        </View>
      ) : null}

      {grafo ? (
        <View style={styles.grafoWrap}>
          <CourseMapGrafo
            nodes={grafo.nodes}
            edges={grafo.edges}
            statusLabels={grafo.statusLabels}
            layout={grafo.layout}
          />
        </View>
      ) : null}

      <EnrollmentSlotDetailModal
        open={sim.detail != null}
        slot={sim.detail?.slot ?? null}
        day={sim.detail?.day ?? ""}
        time={sim.detail?.time ?? ""}
        onClose={() => sim.setDetail(null)}
        onRemove={() => {
          sim.requestRemoveTurma(sim.detail?.slot.turmaSigaaId);
        }}
      />

      {sim.corequisitoRollbackPrompt ? (
        <EnrollmentCorequisitoRollbackDialog
          open
          mode={sim.corequisitoRollbackPrompt.mode}
          primary={{
            shortLabel: sim.formatShortLabel(
              sim.corequisitoRollbackPrompt.primary
            ),
            name: sim.corequisitoRollbackPrompt.primary.name,
          }}
          partner={{
            shortLabel: sim.formatShortLabel(
              sim.corequisitoRollbackPrompt.partner
            ),
            name: sim.corequisitoRollbackPrompt.partner.name,
          }}
          onConfirm={sim.confirmCorequisitoRollback}
          onCancel={() => sim.setCorequisitoRollbackPrompt(null)}
        />
      ) : null}

      <Modal
        visible={saveOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSaveOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Salvar simulação</Text>
            <TextInput
              style={styles.input}
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder="Título"
              placeholderTextColor={brand.textMuted}
            />
            <Pressable
              style={[styles.goldBtn, busy && styles.disabled]}
              disabled={busy || saveTitle.trim().length < 2}
              onPress={() => void onSave(saveTitle.trim())}
            >
              {busy ? (
                <ActivityIndicator color="#1a1408" />
              ) : (
                <Text style={styles.goldBtnText}>Salvar</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setSaveOpen(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={simsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSimsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Simulações salvas</Text>
            {sims.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma simulação salva.</Text>
            ) : (
              sims.map((item) => (
                <View key={String(item.id)} style={styles.simRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simTitle}>{item.titulo}</Text>
                    <Text style={styles.simMeta}>
                      {item.semestre}
                      {item.turmaCount != null
                        ? ` · ${item.turmaCount} turmas`
                        : ""}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => void onLoadSim(item.id)}
                    style={styles.simLoad}
                  >
                    <Text style={styles.simLoadText}>Carregar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void (async () => {
                        await deleteSimulacao(item.id);
                        const saved = await listSimulacoes();
                        setSims(saved.items);
                      })();
                    }}
                  >
                    <Text style={styles.simDel}>Apagar</Text>
                  </Pressable>
                </View>
              ))
            )}
            <Pressable onPress={() => setSimsOpen(false)}>
              <Text style={styles.cancelText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginBottom: brand.space3,
    padding: brand.space3,
  },
  emptyBox: { gap: 12, paddingVertical: 8 },
  emptyText: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 19,
  },
  scheduleHead: { marginBottom: 10, gap: 8 },
  subtitle: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: brand.textSecondary,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillCh: { flexShrink: 1 },
  pillText: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  conflictBanner: {
    marginBottom: 10,
    padding: 10,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.4)",
    backgroundColor: "rgba(248,81,73,0.12)",
  },
  conflictChecking: {
    borderColor: brand.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  conflictText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: "#FF7B72",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  actionText: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  goldBtn: {
    minHeight: 44,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  goldBtnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  disabled: { opacity: 0.45 },
  grafoWrap: { marginBottom: brand.space3 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: brand.bgSecondary,
    borderTopLeftRadius: brand.radiusLg,
    borderTopRightRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    paddingBottom: 28,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  cancelText: {
    textAlign: "center",
    color: brand.textMuted,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    paddingVertical: 8,
  },
  simRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.borderMuted,
  },
  simTitle: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
  simMeta: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  simLoad: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(212,168,67,0.16)",
  },
  simLoadText: {
    color: brand.gold200,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    fontSize: 12,
  },
  simDel: {
    color: "#FF7B72",
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 12,
  },
});
