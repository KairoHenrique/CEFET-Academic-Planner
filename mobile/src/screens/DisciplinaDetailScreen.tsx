import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SubjectDetailResponse } from "@acme/api-contracts";
import { ApiClientError, requestJson } from "../auth/api";
import { patchAppearance } from "../api/mutations";
import { SubjectFaltasTab } from "../features/disciplinas/detail/SubjectFaltasTab";
import {
  SubjectDetailEditModal,
  type SubjectDetailEditPayload,
} from "../features/disciplinas/detail/SubjectDetailEditModal";
import { SubjectNotasTab } from "../features/disciplinas/detail/SubjectNotasTab";
import { SubjectTarefasTab } from "../features/disciplinas/detail/SubjectTarefasTab";
import { useSubjectPriorities } from "../lib/useSubjectPriorities";
import type { RootStackParamList } from "../navigation/types";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import { Card } from "../ui/cards";
import { ColorDotPicker } from "../ui/ColorDotPicker";
import { ErrorBox } from "../ui/ErrorBox";
import { Icon } from "../ui/Icon";
import { LoadingBlock } from "../ui/LoadingBlock";
import { PrioritySelect } from "../ui/PrioritySelect";
import { Screen } from "../ui/Screen";

type Route = RouteProp<RootStackParamList, "DisciplinaDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Detalhe F28 — ordem do mobile browser:
 * voltar → header → aviso catálogo → ementa → notas → frequência → tarefas
 */
export function DisciplinaDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { getPriority, setSubjectPriority } = useSubjectPriorities();
  const [data, setData] = useState<SubjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useOnSyncComplete(() => {
    void load();
  });

  const subject = data?.subject;
  const grupo = data?.grupo;
  const members = grupo?.membros ?? [];
  const hasGrupo = members.length > 0;
  const reload = useCallback(() => {
    void load();
  }, [load]);

  const scheduleLabel = subject?.schedule?.trim() || "—";
  const hoursLabel = subject?.ch != null ? `${subject.ch}h/sem` : "—";
  const professorLabel = subject?.professor?.trim() || "—";

  const roomDiffers =
    subject?.syncedRoom &&
    subject.room &&
    subject.syncedRoom.localeCompare(subject.room, "pt-BR", {
      sensitivity: "accent",
    }) !== 0;

  const scheduleDiffers =
    subject?.syncedSchedule &&
    subject.schedule &&
    subject.syncedSchedule.localeCompare(subject.schedule, "pt-BR", {
      sensitivity: "accent",
    }) !== 0;

  const professorDiffers =
    subject?.syncedProfessor &&
    subject.professor &&
    subject.syncedProfessor.localeCompare(subject.professor, "pt-BR", {
      sensitivity: "accent",
    }) !== 0;

  async function saveAppearance(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await patchAppearance(params.code, body);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível salvar a aparência."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(payload: SubjectDetailEditPayload) {
    setEditOpen(false);
    await saveAppearance(payload);
  }

  return (
    <Screen
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
      <Pressable
        style={styles.backLink}
        onPress={() => navigation.navigate("Disciplinas")}
        hitSlop={8}
      >
        <Icon name="chevron-left" size={16} color={brand.gold} />
        <Text style={styles.backText}>Voltar para disciplinas</Text>
      </Pressable>

      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {data && subject ? (
        <>
          <Card tight style={styles.headerCard}>
            <View style={styles.headerTop}>
              <View style={styles.headerHead}>
                <Text style={styles.eyebrow}>
                  {subject.shortLabel || subject.code}
                </Text>
                <Text style={styles.title}>{subject.name}</Text>
              </View>
              {hasGrupo ? (
                <Pressable
                  style={styles.groupBtn}
                  onPress={() => setGroupOpen(true)}
                >
                  <Icon name="users" size={16} color={brand.gold200} />
                  <Text style={styles.groupBtnText}>Ver grupo</Text>
                  <View style={styles.groupCount}>
                    <Text style={styles.groupCountText}>{members.length}</Text>
                  </View>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => setEditOpen(true)}
                disabled={saving}
                accessibilityLabel="Editar disciplina"
              >
                <Icon name="edit" size={16} color={brand.gold200} />
              </Pressable>
              <ColorDotPicker
                value={subject.color || brand.gold}
                disabled={saving}
                onChange={(color) => {
                  void saveAppearance({ color });
                }}
              />
              <PrioritySelect
                level={getPriority(subject.code)}
                onChange={(level) => setSubjectPriority(subject.code, level)}
              />
            </View>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Icon name="building" size={14} color={brand.textSecondary} />
                <Text style={styles.metaText}>
                  Sala {subject.room || "—"}
                </Text>
              </View>
              {roomDiffers ? (
                <View style={styles.metaPortal}>
                  <Icon name="sync" size={14} color={brand.gold} />
                  <Text style={styles.metaPortalText}>
                    Portal: {subject.syncedRoom}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Icon name="calendar" size={14} color={brand.textSecondary} />
                <Text style={styles.metaText}>{scheduleLabel}</Text>
              </View>
              {scheduleDiffers ? (
                <View style={styles.metaPortal}>
                  <Icon name="sync" size={14} color={brand.gold} />
                  <Text style={styles.metaPortalText}>
                    Horário portal: {subject.syncedSchedule}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Icon name="books" size={14} color={brand.textSecondary} />
                <Text style={styles.metaText}>
                  {hoursLabel}
                  {professorLabel !== "—" ? ` · ${professorLabel}` : ""}
                </Text>
              </View>
              {professorDiffers ? (
                <View style={styles.metaPortal}>
                  <Icon name="sync" size={14} color={brand.gold} />
                  <Text style={styles.metaPortalText}>
                    Professor portal: {subject.syncedProfessor}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          {data.catalogOnly ? (
            <Text style={styles.notice} role="status">
              Perfil do PPC — disciplina ainda não matriculada neste semestre.
              Notas, faltas e tarefas ficam disponíveis ao cursar.
            </Text>
          ) : null}

          <Card tight style={styles.ementaCard}>
            <View style={styles.ementaHeader}>
              <Icon name="books" size={16} color={brand.gold} />
              <Text style={styles.ementaTitle}>Ementa</Text>
            </View>
            <ScrollView style={styles.ementaScroll} nestedScrollEnabled>
              <Text style={styles.ementa}>
                {subject.ementa?.trim() || "Sem ementa cadastrada."}
              </Text>
            </ScrollView>
          </Card>

          <SubjectNotasTab
            code={params.code}
            subject={subject}
            onChanged={reload}
          />
          <SubjectFaltasTab
            code={params.code}
            subject={subject}
            attendance={data.attendance}
            onChanged={reload}
          />
          <SubjectTarefasTab
            code={params.code}
            tasks={data.tasks}
            onChanged={reload}
          />

          <SubjectDetailEditModal
            open={editOpen}
            subject={subject}
            busy={saving}
            onClose={() => setEditOpen(false)}
            onSave={(payload) => {
              void onSaveEdit(payload);
            }}
          />

          <Modal
            visible={groupOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setGroupOpen(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setGroupOpen(false)}
            >
              <Pressable
                style={styles.modalSheet}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.modalTitle}>
                  {grupo?.nome ? grupo.nome : "Grupo"}
                </Text>
                <ScrollView style={{ maxHeight: 360 }}>
                  {members.map((m, i) => (
                    <View key={`${m.nome}-${i}`} style={styles.memberRow}>
                      <Text style={styles.memberName}>{m.nome}</Text>
                      {m.matricula ? (
                        <Text style={styles.memberMeta}>{m.matricula}</Text>
                      ) : null}
                      {m.email ? (
                        <Text style={styles.memberEmail}>{m.email}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
                <Pressable
                  style={styles.closeBtn}
                  onPress={() => setGroupOpen(false)}
                >
                  <Text style={styles.closeBtnText}>Fechar</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: brand.space3,
    minHeight: 40,
  },
  backText: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold,
  },
  headerCard: {
    marginBottom: brand.space3,
    padding: brand.space3,
  },
  headerTop: {
    marginBottom: 12,
    gap: 10,
  },
  headerHead: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
    lineHeight: 24,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  groupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.45)",
    backgroundColor: "rgba(212,168,67,0.06)",
  },
  groupBtnText: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  groupCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(212,168,67,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  groupCountText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  meta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  metaPortal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  metaPortalText: {
    flex: 1,
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.gold200,
  },
  notice: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 19,
    marginBottom: brand.space3,
    paddingHorizontal: 4,
  },
  ementaCard: {
    marginBottom: brand.space3,
  },
  ementaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  ementaTitle: {
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  ementaScroll: {
    maxHeight: 200,
  },
  ementa: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 12,
  },
  memberRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  memberName: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
  memberMeta: {
    marginTop: 2,
    fontSize: 12,
    color: brand.textSecondary,
  },
  memberEmail: {
    marginTop: 2,
    fontSize: 12,
    color: brand.gold200,
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeBtnText: {
    color: brand.textMuted,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
});
