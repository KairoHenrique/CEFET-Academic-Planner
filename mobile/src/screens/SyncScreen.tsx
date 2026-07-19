import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getSession } from "../auth/session";
import { useMobileSync } from "../sync/useMobileSync";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { Screen } from "../ui/Screen";

/**
 * Status do Sync SIGAA — paridade F28:
 * sem escolha de modo/senha; o botão da navbar dispara lite automático.
 * Esta tela só mostra progresso / resultado.
 */
export function SyncScreen() {
  const session = getSession();
  const sync = useMobileSync();

  useEffect(() => {
    // Se abriu a tela ociosa (ex.: deep link), dispara o mesmo lite automático.
    if (!sync.syncing && sync.progress === 0 && !sync.error) {
      void sync.startSync();
    }
  }, []);

  return (
    <Screen
      title="Sync SIGAA"
      subtitle="Mesma fila do botão Sync do site — R1-lite (notas + tarefas)"
    >
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardMeta}>
          Conta: {session?.cpf ? `***${session.cpf.slice(-4)}` : "—"}
        </Text>
        <Text style={[cardStyles.cardMeta, { marginTop: 8 }]}>
          Sem escolha de modo. O sync manual é sempre lite, com as mesmas
          travas do site (fila, cooldown/reuse, credencial no servidor).
        </Text>
      </View>

      <View style={styles.statusCard}>
        {sync.syncing ? (
          <>
            <ActivityIndicator color={brand.gold} size="large" />
            <Text style={styles.step}>{sync.stepLabel || "Sincronizando…"}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(4, Math.min(100, sync.progress))}%` },
                ]}
              />
            </View>
            <Text style={styles.pct}>{Math.round(sync.progress)}%</Text>
          </>
        ) : sync.error ? (
          <>
            <Text style={styles.errorTitle}>Não foi possível sincronizar</Text>
            <Text style={styles.errorBody}>{sync.error}</Text>
            <Text style={styles.hint}>
              Toque no ícone Sync na navbar para tentar de novo.
            </Text>
          </>
        ) : sync.progress >= 100 ? (
          <>
            <Text style={styles.okTitle}>Sincronização concluída</Text>
            <Text style={styles.okBody}>
              {sync.stepLabel || "Dados atualizados a partir do SIGAA."}
            </Text>
            <Text style={styles.hint}>
              Dados da conta (tarefas, notas, faltas, calendário, grade) já estão
              na nuvem — o site e o app usam a mesma base.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.idleTitle}>Pronto para sincronizar</Text>
            <Text style={styles.hint}>
              Toque em Sync SIGAA na barra superior — inicia automaticamente.
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    marginTop: 12,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  step: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textAlign: "center",
  },
  barTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: brand.gold,
    borderRadius: 4,
  },
  pct: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#FF7B72",
  },
  errorBody: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  okTitle: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#3FB950",
  },
  okBody: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    textAlign: "center",
  },
  idleTitle: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textAlign: "center",
    lineHeight: 17,
  },
});
