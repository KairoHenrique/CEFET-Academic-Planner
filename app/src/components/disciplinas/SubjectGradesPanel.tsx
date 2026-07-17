"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
} from "@/lib/disciplinas/grade-display";
import { computeRemainingDistributionBudget } from "@/lib/disciplinas/grade-risk";
import {
  clampEvaluationMaxDraft,
  clampEvaluationScoreDraft,
  formatGradePoints,
  parseScoreInput,
  sanitizeScoreInput,
} from "@/lib/disciplinas/grade-input";
import { GradeRiskIndicator } from "@/components/grades/GradeRiskIndicator";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ToggleOption } from "@/components/ui/ToggleOption";
import type { Subject, SubjectEvaluation } from "@/lib/types/subject";
import { useSubjectGrades } from "@/hooks/useSubjectGrades";
import { useSubjectRecovery } from "@/hooks/useSubjectRecovery";

interface SubjectGradesPanelProps {
  subject: Pick<
    Subject,
    "code" | "grade" | "gradeMax" | "passingGrade" | "gradeRisk" | "evaluations"
  >;
}

function renderNecessarioCell(
  row: SubjectEvaluation,
  minNeeded: number | null,
  pointsNeeded: number,
  resolvedScore: number | null
) {
  if (row.extra) {
    return <span className="grades-min-extra">—</span>;
  }

  const rowScoreMet =
    resolvedScore !== null &&
    minNeeded !== null &&
    resolvedScore + 0.001 >= minNeeded;

  if (pointsNeeded === 0 || rowScoreMet) {
    return <span className="grades-min-ok">OK</span>;
  }

  if (minNeeded !== null) {
    return <span>≥ {minNeeded.toFixed(1)}</span>;
  }

  return "—";
}

/** Nota mínima nesta avaliação para atingir a aprovação, dado o resto das notas. */
function evaluationMinimum(
  rows: SubjectEvaluation[],
  index: number,
  passingGrade: number
): number | null {
  if (rows[index].extra) return null;
  const othersTotal = rows.reduce<number>(
    (acc, ev, idx) => (idx === index || ev.extra ? acc : acc + (ev.score ?? 0)),
    0
  );
  return Math.min(rows[index].max, Math.max(0, passingGrade - othersTotal));
}

export function SubjectGradesPanel({ subject }: SubjectGradesPanelProps) {
  const grades = useSubjectGrades(subject);
  const { gradeRisk, recoveryScore, setRecoveryScore } = useSubjectRecovery(
    subject.code,
    subject.gradeRisk
  );
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("10");
  const [newExtra, setNewExtra] = useState(false);
  const [editRow, setEditRow] = useState<SubjectEvaluation | null>(null);
  const [editName, setEditName] = useState("");
  const [editMax, setEditMax] = useState("");
  const [editExtra, setEditExtra] = useState(false);
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, string>>({});

  const {
    evaluations,
    simulateMode,
    enterSimulation,
    exitSimulation,
    handleReset,
    simRows,
    simScores,
    setSimScore,
    addSimEvaluation,
    removeSimEvaluation,
    workingEvaluations,
    simGradeRisk,
    simDistributionBudget,
    pointsNeeded,
    pendingTeacherPoints,
    addEvaluation,
    updateEvaluationScore,
    updateManualEvaluation,
    deleteEvaluation,
    isSaving,
    saveError,
  } = grades;

  // Fora da simulação usa o risco real (com recuperação); dentro, o risco vivo
  // derivado do conjunto simulado.
  const displayRisk = simulateMode ? simGradeRisk : gradeRisk;

  const addDistributionBudget = useMemo(
    () =>
      computeRemainingDistributionBudget(
        evaluations,
        SUBJECT_DISPLAY_GRADE_MAX
      ),
    [evaluations]
  );

  // Orçamento de distribuição do "+ Avaliação": no simular considera as
  // avaliações efêmeras já adicionadas na sessão de simulação.
  const activeAddBudget = simulateMode
    ? simDistributionBudget
    : addDistributionBudget;

  const editDistributionBudget = useMemo(() => {
    if (!editRow?.id) return addDistributionBudget;
    return computeRemainingDistributionBudget(
      evaluations,
      SUBJECT_DISPLAY_GRADE_MAX,
      { excludeEvaluationId: editRow.id }
    );
  }, [addDistributionBudget, editRow?.id, evaluations]);

  useEffect(() => {
    setScoreDrafts({});
  }, [evaluations]);

  useEffect(() => {
    if (addOpen && !newExtra) {
      setNewMax((current) => clampEvaluationMaxDraft(current, activeAddBudget));
    }
  }, [addOpen, newExtra, activeAddBudget]);

  useEffect(() => {
    if (editRow && !editExtra) {
      setEditMax((current) =>
        clampEvaluationMaxDraft(current, editDistributionBudget)
      );
    }
  }, [editRow, editExtra, editDistributionBudget]);

  const getScoreValue = useCallback(
    (row: SubjectEvaluation) => {
      if (row.id !== undefined && scoreDrafts[row.id] !== undefined) {
        return scoreDrafts[row.id];
      }
      return row.score !== null ? String(row.score) : "";
    },
    [scoreDrafts]
  );

  const evaluationsForScoreClamp = useCallback(
    (row: SubjectEvaluation, draftValue?: string) =>
      evaluations.map((ev) =>
        ev.id === row.id
          ? { ...ev, score: draftValue !== undefined ? parseScoreInput(draftValue) : ev.score }
          : ev
      ),
    [evaluations]
  );

  const handleScoreBlur = async (row: SubjectEvaluation) => {
    if (!row.id || simulateMode) return;

    const raw = getScoreValue(row);
    const clamped = clampEvaluationScoreDraft(
      raw,
      row,
      evaluationsForScoreClamp(row, raw)
    );

    if (clamped !== raw) {
      setScoreDrafts((prev) => ({ ...prev, [row.id!]: clamped }));
    }

    const parsed = parseScoreInput(clamped);
    const current = row.score;

    if (parsed === current) {
      if (clamped !== raw) {
        setScoreDrafts((prev) => {
          const next = { ...prev };
          if (parsed === null) delete next[row.id!];
          return next;
        });
      }
      return;
    }

    try {
      await updateEvaluationScore(row.id, parsed);
      setScoreDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id!];
        return next;
      });
    } catch {
      // saveError surfaced via hook
    }
  };

  const handleNewMaxChange = (value: string) => {
    if (newExtra) {
      setNewMax(value);
      return;
    }
    setNewMax(clampEvaluationMaxDraft(value, activeAddBudget));
  };

  const handleEditMaxChange = (value: string) => {
    if (editExtra) {
      setEditMax(value);
      return;
    }
    setEditMax(clampEvaluationMaxDraft(value, editDistributionBudget));
  };

  const resetAddForm = () => {
    setAddOpen(false);
    setNewName("");
    setNewMax("10");
    setNewExtra(false);
  };

  const handleAddEvaluation = async () => {
    const max = parseFloat(newMax);
    if (!newName.trim() || Number.isNaN(max) || max <= 0) return;
    if (!newExtra && max > activeAddBudget) return;

    // No simular a avaliação é efêmera — não toca o servidor e some ao sair.
    if (simulateMode) {
      addSimEvaluation({ name: newName.trim().toUpperCase(), max, extra: newExtra });
      resetAddForm();
      return;
    }

    try {
      await addEvaluation({
        name: newName.trim().toUpperCase(),
        max,
        score: null,
        manual: true,
        extra: newExtra,
      });
      resetAddForm();
    } catch {
      // saveError surfaced via hook when mutation fails
    }
  };

  const openEdit = (row: SubjectEvaluation) => {
    if (simulateMode || row.id === undefined) return;
    setEditRow(row);
    setEditName(row.name);
    setEditMax(String(row.max));
    setEditExtra(row.extra ?? false);
  };

  const closeEdit = () => setEditRow(null);

  const handleSaveEdit = async () => {
    if (!editRow?.id) return;

    const max = parseFloat(editMax);

    if (!editName.trim() || Number.isNaN(max) || max <= 0) return;
    if (!editExtra && max > editDistributionBudget) return;

    try {
      await updateManualEvaluation({
        id: editRow.id,
        avaliacao_nome: editName.trim().toUpperCase(),
        nota_maxima: max,
        nota_extra: editExtra,
      });
      closeEdit();
    } catch {
      // saveError surfaced via hook
    }
  };

  const handleDeleteEdit = async () => {
    if (!editRow?.id) return;
    try {
      await deleteEvaluation(editRow.id);
      closeEdit();
    } catch {
      // saveError surfaced via hook
    }
  };

  const pendingLabel = formatGradePoints(pendingTeacherPoints);
  const addBudgetLabel = formatGradePoints(activeAddBudget);
  const editBudgetLabel = formatGradePoints(editDistributionBudget);

  const addModalAside =
    !newExtra && activeAddBudget > 0 ? (
      <>Faltam {addBudgetLabel} pts para distribuir</>
    ) : !newExtra ? (
      <>Distribuição completa</>
    ) : undefined;

  const editModalAside =
    editRow && !editExtra && editDistributionBudget > 0 ? (
      <>Faltam {editBudgetLabel} pts para distribuir</>
    ) : editRow && !editExtra ? (
      <>Distribuição completa</>
    ) : undefined;

  return (
    <>
      <div className="card grades-panel">
        <div className="grades-panel-header">
          <SectionHeader
            title="Notas"
            icon="chart"
            badge={
              displayRisk.zone !== "unknown" ? (
                <span
                  className={`badge ${displayRisk.zone === "safe" ? "success" : displayRisk.zone === "warning" ? "warning" : "danger"}`}
                >
                  {displayRisk.label}
                </span>
              ) : simulateMode ? (
                <span className="badge info">Simulando</span>
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
              data-tutorial-id="tutorial-simulate-btn"
              onClick={() => (simulateMode ? exitSimulation() : enterSimulation())}
            >
              <Icon name="calculator" size={14} />
              {simulateMode ? "Notas reais" : "Simular"}
            </button>
          </div>
        </div>

        {displayRisk.zone !== "unknown" && (
          <GradeRiskIndicator
            grade={simulateMode ? null : subject.grade}
            gradeRisk={displayRisk}
            variant="panel"
            recoveryInteractive={!simulateMode}
            recoveryScore={recoveryScore}
            onRecoveryScoreSave={setRecoveryScore}
            onRecoveryScoreClear={() => setRecoveryScore(null)}
          />
        )}

        <div className="data-table-wrap grades-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Avaliação</th>
                <th className="grades-col-max">Máx.</th>
                <th className="grades-col-nota">Nota</th>
                <th className="grades-col-necessario">Necessário</th>
              </tr>
            </thead>
            <tbody>
              {simulateMode
                ? simRows.map((row, index) => {
                    const minNeeded = evaluationMinimum(
                      workingEvaluations,
                      index,
                      SUBJECT_DISPLAY_PASSING_GRADE
                    );
                    const resolved = workingEvaluations[index]?.score ?? null;

                    return (
                      <tr key={row.simKey}>
                        <td>
                          {row.name}
                          {row.manual && !row.ephemeral && (
                            <span className="badge info grade-manual-badge">
                              Manual
                            </span>
                          )}
                          {row.extra && (
                            <span className="badge gold grade-manual-badge">
                              Extra
                            </span>
                          )}
                          {row.ephemeral && (
                            <button
                              type="button"
                              className="grade-sim-remove"
                              onClick={() => removeSimEvaluation(row.simKey)}
                              aria-label={`Remover ${row.name} da simulação`}
                              title="Remover da simulação"
                            >
                              <Icon name="close" size={12} />
                            </button>
                          )}
                        </td>
                        <td className="grades-col-max">{row.max}</td>
                        <td className="grades-score-cell">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="grades-score-input"
                            placeholder="—"
                            value={simScores[row.simKey] ?? ""}
                            onChange={(e) => {
                              const cleaned = sanitizeScoreInput(e.target.value);
                              const clamped = clampEvaluationScoreDraft(
                                cleaned,
                                row,
                                workingEvaluations
                              );
                              setSimScore(row.simKey, clamped);
                            }}
                            aria-label={`Nota simulada de ${row.name}`}
                          />
                        </td>
                        <td className="grades-min-cell grades-col-necessario">
                          {renderNecessarioCell(
                            row,
                            minNeeded,
                            pointsNeeded,
                            resolved
                          )}
                        </td>
                      </tr>
                    );
                  })
                : evaluations.map((row, index) => {
                    const minNeeded = evaluationMinimum(
                      evaluations,
                      index,
                      SUBJECT_DISPLAY_PASSING_GRADE
                    );
                    const isNext =
                      !row.extra &&
                      row.score === null &&
                      evaluations
                        .slice(0, index)
                        .every((e) => e.extra || e.score !== null);
                    const canEditMeta = row.id !== undefined;

                    return (
                      <tr
                        key={row.id ?? `${row.name}-${index}`}
                        className={isNext ? "grade-row-highlight" : ""}
                      >
                        <td
                          className={canEditMeta ? "grades-name-cell" : undefined}
                          onClick={canEditMeta ? () => openEdit(row) : undefined}
                          role={canEditMeta ? "button" : undefined}
                          tabIndex={canEditMeta ? 0 : undefined}
                          onKeyDown={
                            canEditMeta
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openEdit(row);
                                  }
                                }
                              : undefined
                          }
                        >
                          {row.name}
                          {row.manual && (
                            <span className="badge info grade-manual-badge">
                              Manual
                            </span>
                          )}
                          {row.extra && (
                            <span className="badge gold grade-manual-badge">
                              Extra
                            </span>
                          )}
                        </td>
                        <td className="grades-col-max">{row.max}</td>
                        <td className="grades-score-cell">
                          {row.id !== undefined ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              className="grades-score-input"
                              placeholder="—"
                              value={getScoreValue(row)}
                              disabled={isSaving}
                              onChange={(e) =>
                                setScoreDrafts((prev) => ({
                                  ...prev,
                                  [row.id!]: sanitizeScoreInput(e.target.value),
                                }))
                              }
                              onBlur={() => void handleScoreBlur(row)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                }
                              }}
                              aria-label={`Nota de ${row.name}`}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="grades-min-cell grades-col-necessario">
                          {renderNecessarioCell(
                            row,
                            minNeeded,
                            gradeRisk.pointsNeeded,
                            row.score
                          )}
                        </td>
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
                Simulação: faltam <strong>{pointsNeeded.toFixed(1)}</strong> pts
                para <strong>{SUBJECT_DISPLAY_PASSING_GRADE}</strong>
              </>
            ) : (
              <>Simulação: aprovado ✓ — nada disto é salvo</>
            )
          ) : (
            <>
              Faltam <strong>{pendingLabel}</strong> pontos para o professor
              distribuir
            </>
          )}
        </p>

        {saveError && !addOpen && !editRow && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}

        {simulateMode && (
          <button
            type="button"
            className="btn-outline grades-clear-sim"
            onClick={handleReset}
          >
            Limpar simulação
          </button>
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Nova avaliação"
        headerAside={addModalAside}
      >
        <div className="modal-form-stack">
          <Input
            label="Nome"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex.: TRABALHO"
          />
          <Input
            label="Nota máxima"
            type="number"
            min={1}
            max={newExtra ? undefined : activeAddBudget || undefined}
            value={newMax}
            onChange={(e) => handleNewMaxChange(e.target.value)}
            hint={
              newExtra
                ? "Notas extras não entram no limite de distribuição."
                : activeAddBudget > 0
                  ? `Até ${addBudgetLabel} pts disponíveis nesta matéria.`
                  : "Não há pontos disponíveis para distribuir."
            }
          />
          <ToggleOption
            label="Nota extra"
            description="Não conta nos pontos a distribuir"
            checked={newExtra}
            onChange={setNewExtra}
            disabled={isSaving}
          />
        </div>
        <div className="modal-form-actions">
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            className="btn-gold"
            onClick={() => void handleAddEvaluation()}
            disabled={
              (!simulateMode && isSaving) ||
              (!newExtra && activeAddBudget <= 0) ||
              !newName.trim()
            }
          >
            {!simulateMode && isSaving ? "Salvando..." : "Adicionar"}
          </button>
          <button type="button" className="btn-outline" onClick={() => setAddOpen(false)}>
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal
        open={editRow !== null}
        onClose={closeEdit}
        title="Editar avaliação"
        headerAside={editModalAside}
      >
        <div className="modal-form-stack">
          <Input
            label="Nome"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="Nota máxima"
            type="number"
            min={1}
            max={editExtra ? undefined : editDistributionBudget || undefined}
            value={editMax}
            onChange={(e) => handleEditMaxChange(e.target.value)}
            hint={
              editExtra
                ? "Notas extras não entram no limite de distribuição."
                : editDistributionBudget > 0
                  ? `Até ${editBudgetLabel} pts disponíveis nesta matéria.`
                  : "Não há pontos disponíveis para distribuir."
            }
          />
          <ToggleOption
            label="Nota extra"
            description="Não conta nos pontos a distribuir"
            checked={editExtra}
            onChange={setEditExtra}
            disabled={isSaving}
          />
          <p className="modal-hint">
            A nota obtida pode ser preenchida diretamente na tabela, na coluna Nota.
          </p>
        </div>
        <div className="modal-form-actions">
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            className="btn-outline btn-danger"
            onClick={() => void handleDeleteEdit()}
            disabled={isSaving}
          >
            Excluir
          </button>
          <button
            type="button"
            className="btn-gold"
            onClick={() => void handleSaveEdit()}
            disabled={
              isSaving ||
              (!editExtra && editDistributionBudget <= 0 && editMax !== String(editRow?.max)) ||
              !editName.trim()
            }
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" className="btn-outline" onClick={closeEdit}>
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
}
