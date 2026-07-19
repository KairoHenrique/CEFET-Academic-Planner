import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RedeemGiftKeyResponse } from "@acme/api-contracts";
import { ApiClientError, requestJson, syncSubscriptionFromPerfil } from "../../auth/api";
import { normalizeGiftInput } from "./planos-utils";
import { brand } from "../../theme/brand";

type Props = {
  onSuccess?: (planLabel: string) => void;
};

/** Espelho compacto de `GiftKeyRedeemForm`. */
export function GiftKeyRedeemForm({ onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const valid = code.length === 8;

  async function redeem() {
    setError(null);
    setMessage(null);
    if (!valid) {
      setError("Informe uma chave válida com 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const result = await requestJson<RedeemGiftKeyResponse>(
        "/api/billing/redeem-key",
        { method: "POST", body: JSON.stringify({ code }) }
      );
      await syncSubscriptionFromPerfil();
      setCode("");
      setMessage(`Plano ${result.planLabel} ativado com sucesso.`);
      onSuccess?.(result.planLabel);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível resgatar a chave."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Chave promocional</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(v) => setCode(normalizeGiftInput(v))}
          placeholder="Ex.: AB12CD34"
          placeholderTextColor={brand.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          editable={!busy}
        />
        <Pressable
          style={[styles.btn, (!valid || busy) && styles.disabled]}
          disabled={!valid || busy}
          onPress={() => void redeem()}
        >
          {busy ? (
            <ActivityIndicator color="#1a1408" />
          ) : (
            <Text style={styles.btnText}>Resgatar</Text>
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 16 },
  label: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    color: brand.text,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    letterSpacing: 1,
  },
  btn: {
    minWidth: 96,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnText: {
    fontSize: 13,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  disabled: { opacity: 0.45 },
  error: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: "#FF7B72",
  },
  ok: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: "#3FB950",
  },
});
