"use client";

import { useMemo } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { SubjectSummary } from "@/lib/types/subject";
import { sortSubjectsByPriority } from "@/lib/priority/sort";
import { useSubjectPriorities } from "@/hooks/useStoredPriorities";
import { SubjectCard } from "./SubjectCard";

interface SubjectsGridProps {
  disciplinas: SubjectSummary[];
}

export function SubjectsGrid({ disciplinas }: SubjectsGridProps) {
  const { getPriority, map } = useSubjectPriorities();

  const sorted = useMemo(() => {
    return sortSubjectsByPriority(disciplinas, getPriority);
  }, [disciplinas, getPriority, map]);

  return (
    <section data-tutorial-id="tutorial-subjects-section">
      <SectionHeader
        title="Disciplinas do Semestre"
        icon="books"
        href="/disciplinas"
        linkLabel="Ver todas"
      />

      <div className="subjects-grid">
        {sorted.map((subject, index) => (
          <SubjectCard
            key={subject.code}
            subject={subject}
            tutorialAnchor={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
