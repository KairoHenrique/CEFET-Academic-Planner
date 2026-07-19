import type { ReactNode } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
  autoComplete?: "email" | "password" | "username" | "tel" | "off";
  editable?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  hint?: string;
  rightSlot?: ReactNode;
};

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoComplete,
  editable = true,
  maxLength,
  autoCapitalize = "none",
  hint,
  rightSlot,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, rightSlot ? styles.inputWithRight : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={brand.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {rightSlot}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    minHeight: 48,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    color: brand.text,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: brand.fontBody,
  },
  inputWithRight: {
    paddingRight: 48,
  },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 16,
  },
});
