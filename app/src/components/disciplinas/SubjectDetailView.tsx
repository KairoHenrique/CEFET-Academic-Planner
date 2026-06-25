"use client";

import Link from "next/link";
import { PageGrid } from "@/components/layout/PageGrid";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { SubjectDetailHeader } from "@/components/disciplinas/SubjectDetailHeader";
import { SubjectGradesPanel } from "@/components/disciplinas/SubjectGradesPanel";
import { SubjectAbsencePanel } from "@/components/disciplinas/SubjectAbsencePanel";
import { SubjectTasksPanel } from "@/components/disciplinas/SubjectTasksPanel";
import { SubjectSyllabusPanel } from "@/components/disciplinas/SubjectSyllabusPanel";
import { SubjectDownloadsPanel } from "@/components/disciplinas/SubjectDownloadsPanel";
import { Icon } from "@/components/ui/Icon";
import { useDisciplina } from "@/hooks/useDisciplina";
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
  code: string;
}

export function SubjectDetailView({ code }: SubjectDetailViewProps) {
  const layout = useModuleLayout(`subject-${code}`, MODULES);
  const { data, isLoading, error, notFound, refetch } = useDisciplina(code);

  if (!layout.hydrated) return null;

  if (isLoading) {
    return (
      <PageGrid>
        <div className="col-12">
          <div className="skeleton subject-detail-skeleton" aria-busy="true" aria-label="Carregando disciplina" />
        </div>
      </PageGrid>
    );
  }

  if (notFound) {
    return (
      <PageGrid>
        <DashboardStateCard
          title="Disciplina não encontrada"
          message="Esta matéria não está no semestre atual ou o código é inválido."
          actionLabel="Voltar para disciplinas"
          actionHref="/disciplinas"
        />
      </PageGrid>
    );
  }

  if (error || !data) {
    return (
      <PageGrid>
        <DashboardStateCard
          variant="error"
          title="Erro ao carregar disciplina"
          message={error ?? "Não foi possível carregar os dados."}
          actionLabel="Tentar novamente"
          onRetry={() => void refetch()}
        />
      </PageGrid>
    );
  }

  const { subject, tasks, attendance } = data;

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
        return <SubjectTasksPanel subjectCode={subject.code} tasks={tasks} />;
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
