import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { CalendarSyncCategory, CalendarSyncReminderMode } from "@acme/api-contracts";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { isDeviceCalendarSupported } from "./sync-device-calendar";
import { GOOGLE_CALENDAR_ADD_BY_URL, useCalendarSyncSettings } from "./useCalendarSyncSettings";

const CATEGORY_LABELS: Record<CalendarSyncCategory, string> = {
  aulas: "Aulas (horários da grade)",
  tarefas: "Tarefas e avaliações do SIGAA",
  eventos: "Eventos e provas que você criou",
  academico: "Calendário acadêmico (matrícula, feriados…)",
};

const REMINDER_OPTIONS: { value: CalendarSyncReminderMode; label: string; hint: string }[] = [
  { value: "padrao", label: "Padrão", hint: "Aula 15 min antes; prazos na véspera às 18h" },
  { value: "so_tarefas", label: "Só prazos", hint: "Avisa só tarefas, provas e eventos" },
  { value: "nenhum", label: "Nenhum", hint: "Sem alarmes na agenda" },
];

const SWITCH_COLORS = { false: "rgba(255,255,255,0.14)", true: brand.gold };

export function CalendarSyncSection() {
  const sync = useCalendarSyncSettings();
  const { settings, busy } = sync;
  if (!settings) return null;

  const confirmNewLink = () => {
    if (!settings.feed.active) return void sync.generateFeedLink();
    Alert.alert(
      "Gerar novo link?",
      "O link atual para de funcionar. Agendas que usam ele precisarão do novo link.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Gerar novo", style: "destructive", onPress: () => void sync.generateFeedLink() },
      ]
    );
  };

  return (
    <>
      <Text style={cardStyles.sectionTitle}>Agenda do celular e Google Agenda</Text>

      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>O que vai para a agenda</Text>
        {(Object.keys(CATEGORY_LABELS) as CalendarSyncCategory[]).map((category) => (
          <View key={category} style={styles.row}>
            <Text style={styles.rowLabel}>{CATEGORY_LABELS[category]}</Text>
            <Switch
              value={settings.categories[category]}
              onValueChange={(value) => void sync.toggleCategory(category, value)}
              trackColor={SWITCH_COLORS}
              thumbColor={brand.text}
              disabled={busy}
            />
          </View>
        ))}
      </View>

      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Lembretes na agenda</Text>
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map((option) => {
            const selected = settings.reminders === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => void sync.setReminderMode(option.value)}
                disabled={busy || selected}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={cardStyles.cardMeta}>
          {REMINDER_OPTIONS.find((option) => option.value === settings.reminders)?.hint}
        </Text>
      </View>

      {isDeviceCalendarSupported() ? (
        <View style={cardStyles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Salvar na agenda do celular (Samsung/Google)</Text>
            <Switch
              value={sync.deviceEnabled}
              onValueChange={(value) => void sync.toggleDevice(value)}
              trackColor={SWITCH_COLORS}
              thumbColor={brand.text}
              disabled={busy}
            />
          </View>
          <Text style={cardStyles.cardMeta}>
            Cria a agenda "ACME HUB" no aparelho e atualiza após cada sync.
            {sync.lastDeviceSyncAt
              ? ` Última atualização: ${new Date(sync.lastDeviceSyncAt).toLocaleString("pt-BR")}.`
              : ""}
          </Text>
          {sync.deviceEnabled ? (
            <Pressable style={styles.secondaryBtn} onPress={() => void sync.syncDeviceNow()} disabled={busy}>
              <Text style={styles.secondaryText}>Atualizar agenda agora</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Link para Google Agenda (qualquer dispositivo)</Text>
        <Text style={cardStyles.cardMeta}>
          No Google Agenda: Outras agendas → + → "Do URL" → cole o link. O Google atualiza
          sozinho a cada algumas horas. Não compartilhe o link: quem tiver ele vê sua agenda.
        </Text>
        {sync.feedLink ? (
          <>
            <Text selectable style={styles.link}>{sync.feedLink.feedUrl}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => void sync.copyFeedLink()}>
              <Text style={styles.primaryText}>Copiar link</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void Linking.openURL(GOOGLE_CALENDAR_ADD_BY_URL)}
            >
              <Text style={styles.secondaryText}>Abrir Google Agenda</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={confirmNewLink} disabled={busy}>
            <Text style={styles.primaryText}>
              {settings.feed.active ? "Gerar novo link" : "Gerar link"}
            </Text>
          </Pressable>
        )}
        {settings.feed.active ? (
          <Pressable style={styles.secondaryBtn} onPress={() => void sync.revokeFeedLink()} disabled={busy}>
            <Text style={styles.dangerText}>Revogar link</Text>
          </Pressable>
        ) : null}
      </View>

      {sync.message ? <Text style={styles.message}>{sync.message}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowLabel: { flex: 1, fontSize: 14, color: brand.text, fontWeight: "600", paddingRight: 12 },
  chips: { flexDirection: "row", gap: 8, marginVertical: 8 },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  chipSelected: { backgroundColor: brand.gold, borderColor: brand.gold },
  chipText: { color: brand.text, fontWeight: "700", fontSize: 13 },
  chipTextSelected: { color: "#1a1a1a" },
  link: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    color: brand.text,
    fontSize: 12,
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: brand.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: brand.text, fontWeight: "800" },
  secondaryBtn: { marginTop: 10, alignItems: "center", paddingVertical: 6 },
  secondaryText: { color: brand.gold, fontWeight: "700" },
  dangerText: { color: brand.danger, fontWeight: "700" },
  disabled: { opacity: 0.55 },
  message: { marginTop: 8, fontSize: 13, color: brand.gold, textAlign: "center" },
});
