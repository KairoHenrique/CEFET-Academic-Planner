"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModeTabs } from "@/components/auth/AuthModeTabs";
import { CloudLoginForm } from "@/components/auth/CloudLoginForm";
import { LoginCard } from "@/components/auth/LoginCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GiftKeyRedeemForm } from "@/components/billing/GiftKeyRedeemForm";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import type { AuthCursoOption } from "@/lib/types/auth-api";

interface CloudAuthScreenProps {
  cursos: readonly AuthCursoOption[];
}

type AuthPanelMode = "login" | "register";

export function CloudAuthScreen({ cursos }: CloudAuthScreenProps) {
  const searchParams = useSearchParams();
  const [panel, setPanel] = useState<AuthPanelMode>("login");

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setPanel("register");
    }
  }, [searchParams]);

  const subtitle =
    panel === "register"
      ? "Cadastre-se com CPF e senha do SIGAA."
      : "Entre com CPF e senha do SIGAA.";

  return (
    <LoginCard subtitle={subtitle} foot={<LegalFooterLinks />}>
      <AuthModeTabs mode={panel} onChange={setPanel} />
      {panel === "login" ? (
        <CloudLoginForm />
      ) : (
        <>
          <RegisterForm cursos={cursos} />
          <GiftKeyRedeemForm variant="inline" deferUntilAuth />
        </>
      )}
    </LoginCard>
  );
}
