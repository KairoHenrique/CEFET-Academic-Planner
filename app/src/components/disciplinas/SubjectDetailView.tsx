"use client";

import Link from "next/link";
import { PageGrid } from "@/components/layout/PageGrid";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import type { Subject } from "@/config/mock/subjects";
import { getAttendanceByCode } from "@/config/mock/attendance";
import { SubjectDetailHeader } from "@/components/disciplinas/SubjectDetailHeader";
import { SubjectGradesPanel } from "@/components/disciplinas/SubjectGradesPanel";
import { SubjectAbsencePanel } from "@/components/disciplinas/SubjectAbsencePanel";
import { SubjectTasksPanel } from "@/components/disciplinas/SubjectTasksPanel";
import { SubjectSyllabusPanel } from "@/components/disciplinas/SubjectSyllabusPanel";
import { SubjectDownloadsPanel } from "@/components/disciplinas/SubjectDownloadsPanel";
import { Icon } from "@/components/ui/Icon";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "syllabus", label: "Ementa", colClass: "col-12" },
  { id: "grades", label: "Notas", colClass: "col-6" },
  { id: "attendance", label: "Frequência", colClass: "col-6" },
  { id: "tasks", label: "Tarefas", colClass: "col-8" },
  { id: "downloads", label: "Materiais", colClass: "col-4" },
];

interface SubjectDetailViewProps {
  subject: Subject;
}

export function SubjectDetailView({ subject }: SubjectDetailViewProps) {
  const layout = useModuleLayout(`subject-${subject.code}`, MODULES);
  const attendance = getAttendanceByCode(subject.code);

  const renderModule = (id: string) => {
    switch (id) {
      case "syllabus":
        return <SubjectSyllabusPanel ementa={subject.ementa} />;
      case "grades":
        return <SubjectGradesPanel subject={subject} />;
      case "attendance":
        return (
          <SubjectAbsencePanel
            absences={subject.absences}
            maxAbsences={subject.maxAbsences}
            daysRemaining={attendance.daysRemaining}
            records={attendance.records}
          />
        );
      case "tasks":
        return <SubjectTasksPanel subjectCode={subject.code} />;
      case "downloads":
        return (
          <SubjectDownloadsPanel
            subjectCode={subject.code}
            subjectName={subject.name}
            downloadedFiles={subject.downloadedFiles}
            initialAutoDownload={subject.pdfAutoDownload}
          />
        );
      default:
        return null;
    }
  };

  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <div className="col-12">
        <Link href="/disciplinas" className="back-link">
          <Icon name="chevron-left" size={16} />
          Voltar para disciplinas
        </Link>
      </div>
      <div className="col-12">
        <SubjectDetailHeader subject={subject} />
      </div>
      <ModuleGrid layout={layout} modules={MODULES} renderModule={renderModule} />
    </PageGrid>
  );
}
