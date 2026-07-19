import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  ENROLLMENT_COREQUISITO_CANCEL_TITLE,
  ENROLLMENT_COREQUISITO_REMOVE_TITLE,
  ENROLLMENT_COREQUISITO_ROLLBACK_CANCEL_HINT,
  ENROLLMENT_COREQUISITO_ROLLBACK_KICKER,
  ENROLLMENT_COREQUISITO_ROLLBACK_REMOVE_HINT,
} from "./lib/enrollment-ui-messages";
import { brand } from "../../theme/brand";

type Subject = { shortLabel: string; name: string };

type Props = {
  open: boolean;
  mode: "cancel" | "remove";
  primary: Subject;
  partner: Subject;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Espelho mobile de `EnrollmentCorequisitoRollbackDialog`. */
export function EnrollmentCorequisitoRollbackDialog({
  open,
  mode,
  primary,
  partner,
  onConfirm,
  onCancel,
}: Props) {
  const title =
    mode === "cancel"
      ? ENROLLMENT_COREQUISITO_CANCEL_TITLE
      : ENROLLMENT_COREQUISITO_REMOVE_TITLE;
  const hint =
    mode === "cancel"
      ? ENROLLMENT_COREQUISITO_ROLLBACK_CANCEL_HINT
      : ENROLLMENT_COREQUISITO_ROLLBACK_REMOVE_HINT;
  const confirmLabel =
    mode === "cancel" ? "Cancelar mesmo assim" : "Remover ambas";

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.kicker}>
            {ENROLLMENT_COREQUISITO_ROLLBACK_KICKER}
          </Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>
          <View style={styles.pair}>
            <Text style={styles.pairLabel}>Par na grade</Text>
            <Text style={styles.subject}>
              <Text style={styles.apelido}>{primary.shortLabel}</Text>
              {" · "}
              {primary.name}
            </Text>
            <Text style={styles.subject}>
              <Text style={styles.apelido}>{partner.shortLabel}</Text>
              {" · "}
              {partner.name}
            </Text>
          </View>
          <Pressable style={styles.dangerBtn} onPress={onConfirm}>
            <Text style={styles.dangerText}>{confirmLabel}</Text>
          </Pressable>
          <Pressable onPress={onCancel}>
            <Text style={styles.cancelText}>Voltar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 17,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  hint: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 19,
  },
  pair: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusMd,
    padding: 12,
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  pairLabel: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subject: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  apelido: {
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  dangerBtn: {
    minHeight: 44,
    borderRadius: brand.radiusMd,
    backgroundColor: "rgba(248,81,73,0.2)",
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#FF7B72",
  },
  cancelText: {
    textAlign: "center",
    color: brand.textMuted,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    paddingVertical: 8,
  },
});
