"use client";

import { GradeRiskIndicator } from "@/components/grades/GradeRiskIndicator";
import { useSubjectRecovery } from "@/hooks/useSubjectRecovery";
import type { SubjectListItem } from "@/lib/types/disciplinas-api";

interface SubjectGradeCellProps {
  subject: Pick<SubjectListItem, "code" | "grade" | "gradeRisk">;
}

export function SubjectGradeCell({ subject }: SubjectGradeCellProps) {
  const { gradeRisk, recoveryScore, setRecoveryScore } = useSubjectRecovery(
    subject.code,
    subject.gradeRisk
  );

  return (
    <GradeRiskIndicator
      grade={subject.grade}
      gradeRisk={gradeRisk}
      variant="inline"
      recoveryInteractive
      recoveryScore={recoveryScore}
      onRecoveryScoreSave={setRecoveryScore}
      onRecoveryScoreClear={() => setRecoveryScore(null)}
    />
  );
}
