"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import type { SubjectEvaluation } from "@/config/mock/subjects";
import { useGradeSimulation } from "@/hooks/useGradeSimulation";

interface SubjectGradesPanelProps {
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
  evaluations: SubjectEvaluation[];
}

export function SubjectGradesPanel({
  grade,
  gradeMax,
  passingGrade,
  evaluations,
}: SubjectGradesPanelProps) {
  const simulation = useGradeSimulation({ evaluations, passingGrade });

  const {
    simulateMode,
    setSimulateMode,
    simulated,
    simulatedTotal,
    approved,
    pointsNeeded,
    remaining,
    getMinimumForEvaluation,
    handleChange,
    handleReset,
    exitSimulation,
  } = simulation;

  return (
    <div className="card card-full-height">
      <div className="grades-panel-header">
        <SectionHeader
          title="Notas"
          icon="chart"
          badge={
            simulateMode ? (
              <span className={`badge ${approved ? "success" : "danger"}`}>
                {approved ? "Aprovado" : "Reprovado"}
              </span>
            ) : grade !== null ? (
              <span className="badge gold">{grade} pts</span>
            ) : undefined
          }
        />
        <button
          type="button"
          className={`btn-outline grades-simulate-toggle ${
            simulateMode ? "active" : ""
          }`}
          onClick={() =>
            simulateMode ? exitSimulation() : setSimulateMode(true)
          }
          aria-pressed={simulateMode}
        >
          <Icon name="calculator" size={14} />
          {simulateMode ? "Ver notas reais" : "Simular notas"}
        </button>
      </div>

      {simulateMode && (
        <div className="simulator-total">
          <span>Nota simulada</span>
          <strong className={`card-stat ${approved ? "success" : "danger"}`}>
            {simulatedTotal.toFixed(1)} / {gradeMax}
          </strong>
        </div>
      )}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Avaliação</th>
              <th>Máx.</th>
              <th>{simulateMode ? "Simular" : "Nota"}</th>
              {simulateMode && <th>Necessário</th>}
            </tr>
          </thead>
          <tbody>
            {evaluations.map((row, index) => {
              const minNeeded = getMinimumForEvaluation(index);
              const hasRealScore = row.score !== null;

              return (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.max}</td>
                  <td>
                    {simulateMode ? (
                      <input
                        type="number"
                        className="grades-sim-input"
                        min={0}
                        max={row.max}
                        step={0.1}
                        placeholder={
                          hasRealScore ? row.score!.toString() : "0"
                        }
                        value={simulated[row.name] ?? ""}
                        onChange={(e) =>
                          handleChange(row.name, e.target.value)
                        }
                        aria-label={`Simular nota ${row.name}`}
                      />
                    ) : (
                      row.score !== null ? row.score : "—"
                    )}
                  </td>
                  {simulateMode && (
                    <td className="grades-min-cell">
                      {pointsNeeded === 0 ? (
                        <span className="grades-min-ok">OK</span>
                      ) : (
                        <span>
                          ≥ {minNeeded.toFixed(1)}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="panel-footer-note">
        {simulateMode ? (
          pointsNeeded > 0 ? (
            <>
              Faltam <strong>{pointsNeeded.toFixed(1)}</strong> pontos para
              atingir <strong>{passingGrade}</strong> (aprovação)
            </>
          ) : (
            <>
              Meta de <strong>{passingGrade}</strong> pontos atingida na
              simulação
            </>
          )
        ) : (
          <>
            Faltam <strong>{remaining}</strong> pontos para distribuir
          </>
        )}
      </p>

      {simulateMode && (
        <button type="button" className="btn-outline" onClick={handleReset}>
          Limpar simulação
        </button>
      )}
    </div>
  );
}
