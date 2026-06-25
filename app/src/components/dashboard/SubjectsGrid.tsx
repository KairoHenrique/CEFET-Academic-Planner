import { SectionHeader } from "@/components/ui/SectionHeader";
import type { SubjectSummary } from "@/lib/types/subject";
import { SubjectCard } from "./SubjectCard";

interface SubjectsGridProps {
  disciplinas: SubjectSummary[];
}

export function SubjectsGrid({ disciplinas }: SubjectsGridProps) {
  return (
    <section>
      <SectionHeader
        title="Disciplinas do Semestre"
        icon="books"
        href="/disciplinas"
        linkLabel="Ver todas"
      />

      <div className="subjects-grid">
        {disciplinas.map((subject) => (
          <SubjectCard key={subject.code} subject={subject} />
        ))}
      </div>
    </section>
  );
}
