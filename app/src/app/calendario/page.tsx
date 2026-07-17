import type { Metadata } from "next";
import { CalendarioView } from "@/components/calendario/CalendarioView";

export const metadata: Metadata = {
  title: "Calendário",
};

export default function CalendarioPage() {
  return <CalendarioView />;
}
