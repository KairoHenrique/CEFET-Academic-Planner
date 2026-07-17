import type { Metadata } from "next";
import { MatriculaView } from "@/components/simulador/MatriculaView";

export const metadata: Metadata = {
  title: "Montar grade",
};

export default function SimuladorPage() {
  return <MatriculaView />;
}
