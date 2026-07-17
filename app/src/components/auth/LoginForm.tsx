"use client";

import { Suspense } from "react";
import { CloudAuthScreen } from "@/components/auth/CloudAuthScreen";
import { LoginCard } from "@/components/auth/LoginCard";
import { SigaaLoginForm } from "@/components/auth/SigaaLoginForm";
import { useAuthConfig } from "@/hooks/useAuthConfig";

function AuthLoadingCard() {
  return (
    <LoginCard subtitle="Carregando…">
      <p className="auth-loading" role="status">
        Preparando autenticação…
      </p>
    </LoginCard>
  );
}

function LoginFormContent() {
  const authConfig = useAuthConfig();

  if (authConfig.loading) {
    return <AuthLoadingCard />;
  }

  if (authConfig.mode === "cloud") {
    return <CloudAuthScreen cursos={authConfig.cursos} />;
  }

  return <SigaaLoginForm />;
}

export function LoginForm() {
  return (
    <Suspense fallback={<AuthLoadingCard />}>
      <LoginFormContent />
    </Suspense>
  );
}
