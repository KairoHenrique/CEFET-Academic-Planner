import Link from "next/link";
import { notFound } from "next/navigation";
import { PageGrid } from "@/components/layout/PageGrid";
import { getSubjectByCode } from "@/config/mock/subjects";
import { SubjectDetailHeader } from "@/components/disciplinas/SubjectDetailHeader";
import { SubjectGradesPanel } from "@/components/disciplinas/SubjectGradesPanel";
import { SubjectAbsencePanel } from "@/components/disciplinas/SubjectAbsencePanel";
import { SubjectTasksPanel } from "@/components/disciplinas/SubjectTasksPanel";
import { Icon } from "@/components/ui/Icon";

interface SubjectDetailPageProps {
  params: Promise<{ code: string }>;
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { code } = await params;
  const subject = getSubjectByCode(code);

  if (!subject) {
    notFound();
  }

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

      <div className="col-6">
        <SubjectGradesPanel
          grade={subject.grade}
          gradeMax={subject.gradeMax}
          passingGrade={subject.passingGrade}
          evaluations={subject.evaluations}
        />
      </div>

      <div className="col-6">
        <SubjectAbsencePanel
          absences={subject.absences}
          maxAbsences={subject.maxAbsences}
        />
      </div>

      <div className="col-12">
        <SubjectTasksPanel subjectCode={subject.code} />
      </div>
    </PageGrid>
  );
}
