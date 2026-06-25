import { SectionHeader } from "@/components/ui/SectionHeader";
import { semesterSubjects } from "@/config/mock/subjects";
import { SubjectCard } from "./SubjectCard";

export function SubjectsGrid() {
  return (
    <section>
      <SectionHeader
        title="Disciplinas do Semestre"
        icon="books"
        href="/disciplinas"
        linkLabel="Ver todas"
      />

      <div className="subjects-grid">
        {semesterSubjects.map((subject) => (
          <SubjectCard key={subject.code} subject={subject} />
        ))}
      </div>
    </section>
  );
}
