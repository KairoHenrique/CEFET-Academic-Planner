import type { Metadata } from "next";
import { DisciplinasView } from "@/components/disciplinas/DisciplinasView";

export const metadata: Metadata = {
  title: "Disciplinas",
};

export default function DisciplinasPage() {
  return <DisciplinasView />;
}
