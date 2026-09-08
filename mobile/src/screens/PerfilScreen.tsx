import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { formatPhoneInput } from "../features/auth/auth-fields";
import {
  setAvatarFromNome,
  setAvatarInitials,
} from "../perfil/avatar-store";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { ErrorBox } from "../ui/ErrorBox";
import { FadeInContent } from "../ui/FadeInContent";
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
  personalEvents: "Eventos pessoais (criados por você)",
};

const MESSAGE_DISMISS_MS = 4500;

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

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await getPerfil();
      setPerfil(result);
      setEmail(result.account.email ?? "");
      setPhone(formatPhoneInput(result.account.phone ?? ""));
      if (result.profile?.initials) {
        void setAvatarInitials(result.profile.initials);
      } else if (result.profile?.nome) {
        void setAvatarFromNome(result.profile.nome);
      }
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
      void load(true);
    }, [load])
  );

  useOnSyncComplete(() => {
    void load(true);
  });

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
      setPhone(formatPhoneInput(updated.account.phone ?? ""));
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

  function confirmDeleteAccount() {
    Alert.alert(
      "Deletar Conta",
      "Ao deletar sua conta, você está abdicando permanentemente do seu plano ativo e perdendo todos os seus dados. Essa ação é irreversível. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Deletar", 
          style: "destructive",
          onPress: async () => {
            setLogoutBusy(true);
            try {
              await requestJson("/api/perfil/delete", { method: "DELETE" });
              await logoutLocal();
            } catch (err) {
              setLogoutBusy(false);
              Alert.alert("Erro", "Não foi possível deletar a conta.");
            }
          }
        }
      ]
    );
  }

  const profile = perfil?.profile;
  const sub = perfil?.subscription;
  const initials = profile?.initials?.trim() || "??";

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
        <FadeInContent ready>
          <>
          <View style={[cardStyles.card, styles.hero]}>
            <View
              style={styles.avatar}
              accessibilityLabel={`Iniciais ${initials}`}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={cardStyles.cardTitle}>
                {profile?.nome ?? "Aluno"}
              </Text>
              {profile?.status ? (
                <Text style={cardStyles.cardMeta}>{profile.status}</Text>
              ) : null}
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
              placeholder="(31) 99999-9999"
              placeholderTextColor={brand.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => setPhone(formatPhoneInput(text))}
              maxLength={15}
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
              <Text style={cardStyles.cardTitle}>Acesso</Text>
              <Text style={cardStyles.cardMeta}>
                ACME HUB gratuito — todas as funções liberadas.
              </Text>
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

          <Pressable
            style={[styles.deleteBtn, logoutBusy && styles.disabled]}
            onPress={confirmDeleteAccount}
            disabled={logoutBusy}
          >
            <Text style={styles.deleteText}>Deletar Minha Conta</Text>
          </Pressable>
        </>
        </FadeInContent>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,88,168,0.45)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  heroText: { flex: 1, gap: 2 },
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
  deleteBtn: {
    marginTop: 12,
    marginBottom: 40,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: brand.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  deleteText: {
    color: brand.danger,
    fontWeight: "700",
    fontSize: 15,
  },
});
