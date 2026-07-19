import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

export type AuthPanelMode = "login" | "register";

type Props = {
  mode: AuthPanelMode;
  onChange: (mode: AuthPanelMode) => void;
  disabled?: boolean;
};

/** Espelho F28 de `AuthModeTabs`. */
export function AuthModeTabs({ mode, onChange, disabled }: Props) {
  return (
    <View style={styles.tabs}>
      <Pressable
        style={[styles.tab, mode === "login" && styles.tabActive]}
        onPress={() => onChange("login")}
        disabled={disabled}
      >
        <Icon
          name="unlock"
          size={15}
          color={mode === "login" ? brand.gold200 : brand.textMuted}
        />
        <Text style={[styles.label, mode === "login" && styles.labelActive]}>
          Entrar
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, mode === "register" && styles.tabActive]}
        onPress={() => onChange("register")}
        disabled={disabled}
      >
        <Icon
          name="plus"
          size={15}
          color={mode === "register" ? brand.gold200 : brand.textMuted}
        />
        <Text
          style={[styles.label, mode === "register" && styles.labelActive]}
        >
          Criar conta
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: brand.radiusSm,
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: "rgba(212,168,67,0.18)",
  },
  label: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
  labelActive: {
    color: brand.gold200,
  },
});
