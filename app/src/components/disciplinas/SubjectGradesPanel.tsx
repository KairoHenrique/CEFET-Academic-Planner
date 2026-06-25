"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { Subject } from "@/lib/types/subject";
import { RgImpactLabel } from "@/components/disciplinas/RgImpactLabel";
import { useSubjectGrades } from "@/hooks/useSubjectGrades";

interface SubjectGradesPanelProps {
  subject: Pick<
    Subject,
    "code" | "grade" | "gradeMax" | "passingGrade" | "evaluations"
  >;
}

export function SubjectGradesPanel({ subject }: SubjectGradesPanelProps) {
  const grades = useSubjectGrades(subject);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("10");

  const {
    evaluations,
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
    currentRg,
    simulatedRg,
    currentTotal,
    addEvaluation,
    isSaving,
    saveError,
  } = grades;

  const handleAddEvaluation = async () => {
    const max = parseFloat(newMax);
    if (!newName.trim() || Number.isNaN(max) || max <= 0) return;
    try {
      await addEvaluation({
        name: newName.trim().toUpperCase(),
        max,
        score: null,
        manual: true,
      });
      setAddOpen(false);
      setNewName("");
      setNewMax("10");
    } catch {
      // saveError surfaced via hook when mutation fails
    }
  };

  const passingStatus =
    currentTotal >= subject.passingGrade ? "success" : "warning";

  return (
    <>
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
              ) : subject.grade !== null ? (
                <span className="badge gold">{subject.grade} pts</span>
              ) : undefined
            }
          />
          <div className="grades-panel-actions">
            <button type="button" className="btn-outline" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={14} />
              Avaliação
            </button>
            <button
              type="button"
              className={`btn-outline grades-simulate-toggle ${simulateMode ? "active" : ""}`}
              onClick={() => (simulateMode ? exitSimulation() : setSimulateMode(true))}
            >
              <Icon name="calculator" size={14} />
              {simulateMode ? "Notas reais" : "Simular"}
            </button>
          </div>
        </div>

        <div className={`passing-grade-banner ${passingStatus}`}>
          <span>Aprovação: ≥ {subject.passingGrade} pontos</span>
          {!simulateMode && (
            <span>
              Atual: <strong>{currentTotal.toFixed(1)}</strong>
            </span>
          )}
        </div>

        {simulateMode && (
          <>
            <div className="simulator-total">
              <span>Nota simulada</span>
              <strong className={`card-stat ${approved ? "success" : "danger"}`}>
                {simulatedTotal.toFixed(1)} / {subject.gradeMax}
              </strong>
            </div>
            <RgImpactLabel current={currentRg} simulated={simulatedRg} />
          </>
        )}

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Avaliação</th>
                <th>Máx.</th>
                <th>{simulateMode ? "Simular" : "Nota"}</th>
                <th>Necessário</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((row, index) => {
                const minNeeded = getMinimumForEvaluation(index);
                const isNext =
                  !simulateMode &&
                  row.score === null &&
                  evaluations.slice(0, index).every((e) => e.score !== null);

                return (
                  <tr key={`${row.name}-${index}`} className={isNext ? "grade-row-highlight" : ""}>
                    <td>
                      {row.name}
                      {row.manual && <span className="badge info grade-manual-badge">Manual</span>}
                    </td>
                    <td>{row.max}</td>
                    <td>
                      {simulateMode ? (
                        <input
                          type="number"
                          className="grades-sim-input"
                          min={0}
                          max={row.max}
                          step={0.1}
                          placeholder={row.score?.toString() ?? "0"}
                          value={simulated[row.name] ?? ""}
                          onChange={(e) => handleChange(row.name, e.target.value)}
                        />
                      ) : (
                        (row.score ?? "—")
                      )}
                    </td>
                    <td className="grades-min-cell">
                      {pointsNeeded === 0 && simulateMode ? (
                        <span className="grades-min-ok">OK</span>
                      ) : (
                        <span>≥ {minNeeded.toFixed(1)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="panel-footer-note">
          {simulateMode && pointsNeeded > 0 ? (
            <>
              Faltam <strong>{pointsNeeded.toFixed(1)}</strong> pts para{" "}
              <strong>{subject.passingGrade}</strong>
            </>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nova avaliação">
        <Input label="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: TRABALHO" />
        <Input label="Nota máxima" type="number" min={1} value={newMax} onChange={(e) => setNewMax(e.target.value)} />
        <div className="detail-actions">
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            className="btn-gold"
            onClick={() => void handleAddEvaluation()}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Adicionar"}
          </button>
          <button type="button" className="btn-outline" onClick={() => setAddOpen(false)}>Cancelar</button>
        </div>
      </Modal>
    </>
  );
}
