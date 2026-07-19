import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from "./auth-fields";
import { resolveWebHref } from "../../auth/api";
import { brand } from "../../theme/brand";

type Props = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function LegalConsentField({
  checked,
  disabled = false,
  onChange,
}: Props) {
  return (
    <Pressable
      style={styles.wrap}
      disabled={disabled}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <Text style={styles.copy}>
        Li e aceito os{" "}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL(resolveWebHref("/termos"))}
        >
          Termos de Uso
        </Text>{" "}
        e a{" "}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL(resolveWebHref("/privacidade"))}
        >
          Política de Privacidade
        </Text>{" "}
        (v. {LEGAL_TERMS_VERSION} / {LEGAL_PRIVACY_VERSION}).
      </Text>
    </Pressable>
  );
}

export function LegalFooterLinks() {
  return (
    <View style={styles.footer}>
      <Pressable onPress={() => void Linking.openURL(resolveWebHref("/termos"))}>
        <Text style={styles.footerLink}>Termos de Uso</Text>
      </Pressable>
      <Text style={styles.sep}>·</Text>
      <Pressable
        onPress={() => void Linking.openURL(resolveWebHref("/privacidade"))}
      >
        <Text style={styles.footerLink}>Política de Privacidade</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxChecked: {
    borderColor: brand.gold,
    backgroundColor: "rgba(212,168,67,0.25)",
  },
  check: {
    color: brand.gold200,
    fontSize: 13,
    fontWeight: "700",
  },
  copy: {
    flex: 1,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 17,
  },
  link: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  sep: { color: brand.textMuted },
});
