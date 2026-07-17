import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | ACME HUB",
};

export default function LoginPage() {
  return (
    <>
      <Link
        href="/dev"
        className="dev-panel-entry"
        aria-label="Painel do operador"
        title="Painel do operador"
      >
        <Icon name="lock" size={16} aria-hidden />
      </Link>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
