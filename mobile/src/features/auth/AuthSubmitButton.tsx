import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      style={[styles.press, isDisabled && styles.disabled]}
      disabled={isDisabled}
      onPress={onPress}
    >
      <LinearGradient
        colors={
          isDisabled
            ? ["#9A7A24", "#7A5F1C"]
            : ["#F3D692", brand.gold, "#D4A843"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
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
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    borderRadius: brand.radiusMd,
    overflow: "hidden",
    shadowColor: brand.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btn: {
    minHeight: 48,
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
  disabled: { opacity: 0.55, elevation: 0, shadowOpacity: 0 },
});
