import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { brand } from "../../theme/brand";

export const MANUAL_CH_TYPES = [
  "Complementar",
  "Extensão",
  "Flexibilizada",
] as const;

export type ManualChType = (typeof MANUAL_CH_TYPES)[number];

type Props = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (body: { tipoCh: ManualChType; horas: number }) => Promise<void>;
};

/** Espelho de `RegisterHoursModal` do site. */
export function RegisterHoursModal({
  open,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const [tipoCh, setTipoCh] = useState<ManualChType>("Complementar");
  const [horasValue, setHorasValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTipoCh("Complementar");
    setHorasValue("");
    setError(null);
  }, [open]);

  async function handleSubmit() {
    setError(null);
    const horas = Number.parseInt(horasValue, 10);
    if (!Number.isInteger(horas) || horas <= 0) {
      setError("Informe um número inteiro de horas maior que zero.");
      return;
    }
    try {
      await onSubmit({ tipoCh, horas });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar as horas."
      );
    }
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Cadastrar horas</Text>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.chips}>
            {MANUAL_CH_TYPES.map((t) => {
              const active = tipoCh === t;
              return (
                <Pressable
                  key={t}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTipoCh(t)}
                  disabled={busy}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Use Complementar para certificados, workshops ou disciplinas de outro
            curso reconhecidas.
          </Text>

          <Text style={styles.label}>Horas</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={horasValue}
            onChangeText={setHorasValue}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={brand.textMuted}
            editable={!busy}
            maxLength={3}
          />
          <Text style={styles.hint}>
            Quantidade de horas a somar nesta categoria.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.goldBtn, busy && styles.disabled]}
              onPress={() => void handleSubmit()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#1a1408" />
              ) : (
                <Text style={styles.goldBtnText}>Cadastrar</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.outlineText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: brand.bgSecondary,
    borderTopLeftRadius: brand.radiusLg,
    borderTopRightRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 17,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
  },
  chipActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(0,96,177,0.35)",
  },
  chipText: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
  chipTextActive: { color: brand.gold },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    marginBottom: 14,
    lineHeight: 17,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: brand.fontBody,
    marginBottom: 6,
  },
  inputError: { borderColor: brand.danger },
  error: {
    color: brand.danger,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    marginBottom: 10,
  },
  actions: { gap: 8, marginTop: 8 },
  goldBtn: {
    backgroundColor: brand.gold,
    borderRadius: brand.radiusMd,
    paddingVertical: 12,
    alignItems: "center",
  },
  goldBtnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusMd,
    paddingVertical: 10,
    alignItems: "center",
  },
  outlineText: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  disabled: { opacity: 0.55 },
});
