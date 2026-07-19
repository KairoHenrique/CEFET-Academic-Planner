import { StyleSheet, Text, View } from "react-native";
import { AuthField } from "./AuthField";
import { normalizeFriendMatricula } from "./auth-fields";
import { brand } from "../../theme/brand";

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function FriendMatriculaField({
  value,
  disabled = false,
  onChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Matrícula do amigo</Text>
      <Text style={styles.copy}>
        Opcional. Vocês ganham 3 dias a mais quando o indicado pagar um plano
        (até 30 dias no total por indicação). O trial de 7 dias continua
        valendo.
      </Text>
      <AuthField
        label="Matrícula"
        value={value}
        onChangeText={(v) => onChange(normalizeFriendMatricula(v))}
        placeholder="Ex.: 2024001234"
        editable={!disabled}
        maxLength={20}
        autoComplete="off"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  title: {
    fontSize: 13,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  copy: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 17,
  },
});
