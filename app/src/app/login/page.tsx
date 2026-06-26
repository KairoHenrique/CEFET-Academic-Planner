import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | CEFET Academic Planner",
};

export default function LoginPage() {
  return <LoginForm />;
}
