import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { AuthField } from "./AuthField";
import { brand } from "../../theme/brand";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  hint?: string;
  autoComplete?: "password" | "off";
};

export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  hint,
  autoComplete = "password",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={!visible}
      editable={editable}
      autoComplete={autoComplete}
      hint={hint}
      rightSlot={
        <Pressable
          style={styles.toggle}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
        >
          <Text style={styles.toggleText}>{visible ? "Ocultar" : "Mostrar"}</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    position: "absolute",
    right: 10,
    height: 48,
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
});
