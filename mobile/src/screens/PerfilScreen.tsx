import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  NotificationPreferences,
  PerfilResponse,
} from "@acme/api-contracts";
import {
  ApiClientError,
  getPerfil,
  requestJson,
  resolveWebHref,
} from "../auth/api";
import { subscriptionStatusLabel } from "../auth/access";
import { maskCpf } from "../auth/cpf";
import { logoutLocal } from "../auth/logout";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type PrefKey = keyof NotificationPreferences;

const PREF_LABELS: Record<PrefKey, string> = {
  tasks: "Novas tarefas",
  grades: "Notas lançadas",
  taskReminders: "Lembretes de tarefas",
  calendarReminders: "Lembretes de calendário",
  classReminders: "Lembretes de aula",
  integralizacaoAlerts: "Alertas de integralização",
  academicDateAlerts: "Datas acadêmicas",
};

export function PerfilScreen() {
  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await getPerfil();
      setPerfil(result);
      setEmail(result.account.email ?? "");
      setPhone(result.account.phone ?? "");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar o perfil."
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

  async function togglePref(key: PrefKey, value: boolean) {
    if (!perfil) return;
    const next: NotificationPreferences = {
      ...perfil.notifications,
      [key]: value,
    };
    setPerfil({ ...perfil, notifications: next });
    setSaving(true);
    setMessage(null);
    try {
      const updated = await requestJson<PerfilResponse>("/api/perfil", {
        method: "PATCH",
        body: JSON.stringify({ notifications: { [key]: value } }),
      });
      setPerfil(updated);
      setMessage("Preferências salvas.");
    } catch (err) {
      setPerfil(perfil);
      setMessage(
        err instanceof ApiClientError
          ? err.message
          : "Falha ao salvar preferências."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveContact() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await requestJson<PerfilResponse>("/api/perfil", {
        method: "PATCH",
        body: JSON.stringify({
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      setPerfil(updated);
      setEmail(updated.account.email ?? "");
      setPhone(updated.account.phone ?? "");
      setMessage("Contato atualizado.");
    } catch (err) {
      setMessage(
        err instanceof ApiClientError
          ? err.message
          : "Falha ao salvar contato."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    setLogoutBusy(true);
    try {
      await logoutLocal();
    } finally {
      setLogoutBusy(false);
    }
  }

  const profile = perfil?.profile;
  const sub = perfil?.subscription;

  return (
    <Screen
      title="Perfil"
      subtitle={profile?.nome ?? "Sua conta"}
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
      {loading && !perfil ? <LoadingBlock /> : null}
      {error && !perfil ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {perfil ? (
        <>
          <View style={cardStyles.card}>
            <Text style={cardStyles.cardTitle}>
              {profile?.nome ?? "Aluno"}
            </Text>
            {profile?.curso ? (
              <Text style={cardStyles.cardMeta}>{profile.curso}</Text>
            ) : null}
            {profile?.matricula ? (
              <Text style={cardStyles.cardMeta}>
                Matrícula {profile.matricula}
              </Text>
            ) : null}
            {perfil.account.cpf ? (
              <Text style={cardStyles.cardMeta}>
                CPF {maskCpf(perfil.account.cpf)}
              </Text>
            ) : null}
          </View>

          <Text style={cardStyles.sectionTitle}>Contato</Text>
          <View style={cardStyles.card}>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={brand.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              placeholderTextColor={brand.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Pressable
              style={[styles.saveBtn, saving && styles.disabled]}
              onPress={() => void saveContact()}
              disabled={saving}
            >
              <Text style={styles.saveText}>Salvar contato</Text>
            </Pressable>
          </View>

          {sub ? (
            <View style={cardStyles.card}>
              <Text style={cardStyles.cardTitle}>Assinatura</Text>
              <Text style={cardStyles.cardMeta}>
                {sub.planLabel} · {subscriptionStatusLabel(sub.status)}
              </Text>
              {sub.daysRemaining > 0 ? (
                <Text style={cardStyles.cardMeta}>
                  {sub.daysRemaining} dias restantes
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={cardStyles.card}>
            <Text style={cardStyles.cardTitle}>Sync</Text>
            <Text style={cardStyles.cardMeta}>
              Intervalo automático: {perfil.sync.intervalMinutes} min
            </Text>
            <Text style={cardStyles.cardMeta}>
              Último sync:{" "}
              {perfil.sync.lastSyncAt
                ? new Date(perfil.sync.lastSyncAt).toLocaleString("pt-BR")
                : "nunca"}
            </Text>
          </View>

          <Text style={cardStyles.sectionTitle}>Notificações</Text>
          {(Object.keys(PREF_LABELS) as PrefKey[]).map((key) => (
            <View key={key} style={[cardStyles.card, styles.prefRow]}>
              <Text style={styles.prefLabel}>{PREF_LABELS[key]}</Text>
              <Switch
                value={perfil.notifications[key]}
                onValueChange={(v) => void togglePref(key, v)}
                trackColor={{ false: "rgba(255,255,255,0.14)", true: brand.gold }}
                thumbColor={brand.text}
                disabled={saving}
              />
            </View>
          ))}

          {saving ? (
            <ActivityIndicator color={brand.gold} style={styles.saving} />
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            style={styles.linkBtn}
            onPress={() => void Linking.openURL(resolveWebHref("/termos"))}
          >
            <Text style={styles.linkText}>Termos de uso</Text>
          </Pressable>
          <Pressable
            style={styles.linkBtn}
            onPress={() => void Linking.openURL(resolveWebHref("/privacidade"))}
          >
            <Text style={styles.linkText}>Privacidade</Text>
          </Pressable>

          <Pressable
            style={[styles.logout, logoutBusy && styles.disabled]}
            onPress={() => void onLogout()}
            disabled={logoutBusy}
          >
            {logoutBusy ? (
              <ActivityIndicator color={brand.text} />
            ) : (
              <Text style={styles.logoutText}>Sair da conta</Text>
            )}
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  prefLabel: {
    flex: 1,
    fontSize: 14,
    color: brand.text,
    fontWeight: "600",
    paddingRight: 12,
  },
  saving: { marginTop: 8 },
  message: {
    marginTop: 8,
    fontSize: 13,
    color: brand.gold,
    textAlign: "center",
  },
  linkBtn: { marginTop: 10, alignItems: "center" },
  linkText: { color: brand.gold, fontWeight: "700" },
  logout: {
    marginTop: 20,
    backgroundColor: brand.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.55 },
  logoutText: {
    color: brand.text,
    fontWeight: "700",
    fontSize: 15,
  },
});
