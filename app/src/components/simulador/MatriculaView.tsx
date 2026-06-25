"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnrollmentSimulator } from "@/components/simulador/EnrollmentSimulator";

export function MatriculaView() {
  return (
    <PageGrid>
      <PageHeader
        eyebrow="Planejamento"
        title="Montar Grade"
        highlight="2026.2"
        subtitle="Simule sua matrícula do próximo semestre · arraste matérias para os horários"
      />

      <div className="col-12">
        <EnrollmentSimulator />
      </div>
    </PageGrid>
  );
}
