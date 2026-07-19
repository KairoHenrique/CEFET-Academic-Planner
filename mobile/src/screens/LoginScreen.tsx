import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AuthCursoOption } from "@acme/api-contracts";
import { getAuthConfig } from "../auth/api";
import { AuthModeTabs, type AuthPanelMode } from "../features/auth/AuthModeTabs";
import { CloudLoginForm } from "../features/auth/CloudLoginForm";
import { DEFAULT_AUTH_CURSOS } from "../features/auth/auth-fields";
import { LegalFooterLinks } from "../features/auth/LegalConsentField";
import { LoginCard } from "../features/auth/LoginCard";
import { RegisterForm } from "../features/auth/RegisterForm";
import { brand } from "../theme/brand";

type Props = {
  apiConfigured: boolean;
  initialMode?: AuthPanelMode;
};

/**
 * Auth F28 — mesmo `/login` do site: card + tabs Entrar | Criar conta.
 */
export function LoginScreen({
  apiConfigured,
  initialMode = "login",
}: Props) {
  const [panel, setPanel] = useState<AuthPanelMode>(initialMode);
  const [cursos, setCursos] =
    useState<readonly AuthCursoOption[]>(DEFAULT_AUTH_CURSOS);

  useEffect(() => {
    if (!apiConfigured) return;
    void getAuthConfig()
      .then((config) => {
        if (config.cursos?.length) setCursos(config.cursos);
      })
      .catch(() => {
        // Mantém fallback local.
      });
  }, [apiConfigured]);

  const subtitle =
    panel === "register"
      ? "Cadastre-se com CPF e senha do SIGAA."
      : "Entre com CPF e senha do SIGAA.";

  return (
    <LoginCard subtitle={subtitle} foot={<LegalFooterLinks />}>
      {!apiConfigured ? (
        <View style={styles.warnBox}>
          <Text style={styles.warn}>
            Falta EXPO_PUBLIC_API_BASE_URL no mobile/.env
          </Text>
        </View>
      ) : null}

      <AuthModeTabs mode={panel} onChange={setPanel} />

      {panel === "login" ? (
        <CloudLoginForm apiConfigured={apiConfigured} />
      ) : (
        <RegisterForm
          cursos={cursos}
          apiConfigured={apiConfigured}
          onGoToLogin={() => setPanel("login")}
        />
      )}
    </LoginCard>
  );
}

const styles = StyleSheet.create({
  warnBox: {
    marginBottom: 4,
  },
  warn: {
    color: brand.danger,
    textAlign: "center",
    fontSize: 13,
    fontFamily: brand.fontBody,
  },
});
