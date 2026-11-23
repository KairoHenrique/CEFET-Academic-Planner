import type { Metadata } from "next";
import { PublicInicioClient } from "@/components/ads/PublicInicioClient";

export const metadata: Metadata = {
  title: "Início público",
  description:
    "ACME HUB — planejador acadêmico gratuito para alunos da UFCIMG (web e Android).",
};

export default function PublicInicioPage() {
  return <PublicInicioClient />;
}
