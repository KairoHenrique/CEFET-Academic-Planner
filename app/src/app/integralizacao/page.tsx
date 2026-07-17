import type { Metadata } from "next";
import { IntegralizacaoView } from "@/components/integralizacao/IntegralizacaoView";

export const metadata: Metadata = {
  title: "Integralização",
};

export default function IntegralizacaoPage() {
  return <IntegralizacaoView />;
}
