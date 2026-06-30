"use client";

import Link from "next/link";
import { PageGrid } from "@/components/layout/PageGrid";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { SubjectDetailHeader } from "@/components/disciplinas/SubjectDetailHeader";
import { SubjectGradesPanel } from "@/components/disciplinas/SubjectGradesPanel";
import { SubjectAbsencePanel } from "@/components/disciplinas/SubjectAbsencePanel";
import { SubjectTasksPanel } from "@/components/disciplinas/SubjectTasksPanel";
import { SubjectSyllabusPanel } from "@/components/disciplinas/SubjectSyllabusPanel";
import { SubjectDownloadsPanel } from "@/components/disciplinas/SubjectDownloadsPanel";
import { Icon } from "@/components/ui/Icon";
import { useDisciplina } from "@/hooks/useDisciplina";

interface SubjectDetailViewProps {
  code: string;
}

export function SubjectDetailView({ code }: SubjectDetailViewProps) {
  const { data, isLoading, error, notFound, refetch } = useDisciplina(code);

  if (isLoading) {
    return (
      <PageGrid>
        <div className="col-12">
          <div
            className="skeleton subject-detail-skeleton"
            aria-busy="true"
            aria-label="Carregando disciplina"
          />
        </div>
      </PageGrid>
    );
  }

  if (notFound) {
    return (
      <PageGrid>
        <DashboardStateCard
          title="Disciplina não encontrada"
          message="Código inválido ou disciplina ausente do PPC indexado."
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

  const { subject, tasks, attendance, grupo, catalogOnly } = data;

  return (
    <PageGrid>
      <div className="col-12">
        <Link href="/disciplinas" className="back-link">
          <Icon name="chevron-left" size={16} />
          Voltar para disciplinas
        </Link>
      </div>
      <div className="col-12">
        <SubjectDetailHeader subject={subject} grupo={grupo} />
      </div>
      {catalogOnly && (
        <div className="col-12">
          <p className="subject-catalog-notice" role="status">
            Perfil do PPC — disciplina ainda não matriculada neste semestre. Notas,
            faltas e tarefas ficam disponíveis ao cursar.
          </p>
        </div>
      )}
      <div className="col-12">
        <SubjectSyllabusPanel ementa={subject.ementa} />
      </div>
      <div className="col-6">
        <SubjectGradesPanel subject={subject} />
      </div>
      <div className="col-6">
        <SubjectAbsencePanel
          subjectCode={subject.code}
          absences={subject.absences}
          maxAbsences={subject.maxAbsences}
          daysRemaining={attendance.daysRemaining}
          records={attendance.records}
        />
      </div>
      <div className="col-8">
        <SubjectTasksPanel subjectCode={subject.code} tasks={tasks} />
      </div>
      <div className="col-4">
        <SubjectDownloadsPanel subjectName={subject.name} />
      </div>
    </PageGrid>
  );
}
