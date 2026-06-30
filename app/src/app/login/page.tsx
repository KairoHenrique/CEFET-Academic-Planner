import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | Acme Hub",
};

export default function LoginPage() {
  return <LoginForm />;
}
