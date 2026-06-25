import { SectionHeader } from "@/components/ui/SectionHeader";

interface SubjectSyllabusPanelProps {
  ementa: string;
}

export function SubjectSyllabusPanel({ ementa }: SubjectSyllabusPanelProps) {
  return (
    <div className="card">
      <SectionHeader title="Ementa" icon="books" />
      <div className="syllabus-content">
        <p>{ementa}</p>
      </div>
    </div>
  );
}
