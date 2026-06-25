import { SectionHeader } from "@/components/ui/SectionHeader";

const mockGrades = [
  { name: "PRO1", max: 30, score: 9.0 },
  { name: "SEM", max: 10, score: null },
  { name: "PRO2", max: 30, score: null },
  { name: "Nota", max: 30, score: null },
];

interface SubjectGradesPanelProps {
  grade: number | null;
  gradeMax: number;
}

export function SubjectGradesPanel({ grade, gradeMax }: SubjectGradesPanelProps) {
  const distributed = mockGrades.reduce(
    (acc, g) => acc + (g.score ?? 0),
    0
  );
  const remaining = gradeMax - distributed;

  return (
    <div className="card card-full-height">
      <SectionHeader
        title="Notas"
        icon="chart"
        badge={
          grade !== null ? (
            <span className="badge gold">{grade} pts</span>
          ) : undefined
        }
      />

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Avaliação</th>
              <th>Máx.</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {mockGrades.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.max}</td>
                <td>{row.score !== null ? row.score : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="panel-footer-note">
        Faltam <strong>{remaining}</strong> pontos para distribuir
      </p>
    </div>
  );
}
