import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

type Props = {
  variant: "login" | "register";
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const COPY = {
  login: { label: "Entrar", loading: "Entrando…", icon: "arrow-right" as const },
  register: {
    label: "Abrir minha conta",
    loading: "Criando conta…",
    icon: "plus" as const,
  },
};

export function AuthSubmitButton({
  variant,
  loading = false,
  disabled = false,
  onPress,
}: Props) {
  const copy = COPY[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[styles.btn, isDisabled && styles.disabled]}
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color="#1a1408" />
          <Text style={styles.label}>{copy.loading}</Text>
        </View>
      ) : (
        <View style={styles.row}>
          {variant === "register" ? (
            <Icon name={copy.icon} size={17} color="#1a1408" />
          ) : null}
          <Text style={styles.label}>{copy.label}</Text>
          {variant === "login" ? (
            <Icon name={copy.icon} size={17} color="#1a1408" />
          ) : (
            <Icon name="chevron-right" size={18} color="#1a1408" />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  disabled: { opacity: 0.55 },
});
