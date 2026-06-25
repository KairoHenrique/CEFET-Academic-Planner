import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubjectList } from "@/components/disciplinas/SubjectList";

export default function DisciplinasPage() {
  return (
    <PageGrid>
      <PageHeader
        eyebrow="Semestre 2026.1"
        title="Disciplinas"
        subtitle="7 matérias cursando · notas, faltas e atividades"
      />
      <SubjectList />
    </PageGrid>
  );
}
