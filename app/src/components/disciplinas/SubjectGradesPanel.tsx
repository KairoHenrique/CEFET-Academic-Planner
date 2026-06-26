"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ToggleOption } from "@/components/ui/ToggleOption";
import type { Subject, SubjectEvaluation } from "@/lib/types/subject";
import { useSubjectGrades } from "@/hooks/useSubjectGrades";

interface SubjectGradesPanelProps {
  subject: Pick<
    Subject,
    "code" | "grade" | "gradeMax" | "passingGrade" | "evaluations"
  >;
  onSimulateModeChange?: (active: boolean) => void;
  onLayoutHeight?: (height: number) => void;
}

function normalizeScoreForParse(value: string): string {
  return value.trim().replace(",", ".");
}

function parseScoreInput(value: string): number | null {
  const trimmed = normalizeScoreForParse(value);
  if (!trimmed || trimmed === ".") return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function sanitizeScoreInput(value: string): string {
  const withoutMinus = value.replace(/-/g, "");
  let result = "";
  let hasSeparator = false;

  for (const char of withoutMinus) {
    if (char >= "0" && char <= "9") {
      result += char;
    } else if ((char === "." || char === ",") && !hasSeparator) {
      hasSeparator = true;
      result += char;
    }
  }

  return result;
}

function clampScoreDraft(value: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "." || trimmed === ",") return "";

  const parsed = parseScoreInput(trimmed);
  if (parsed === null) return "";

  if (parsed > max) return String(max);
  if (parsed < 0) return "0";
  return trimmed;
}

export function SubjectGradesPanel({
  subject,
  onSimulateModeChange,
  onLayoutHeight,
}: SubjectGradesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const grades = useSubjectGrades(subject);
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
    setSimulateMode,
    simulated,
    simulatedTotal,
    approved,
    pointsNeeded,
    pendingTeacherPoints,
    getMinimumForEvaluation,
    handleChange,
    handleReset,
    exitSimulation,
    currentTotal,
    addEvaluation,
    updateEvaluationScore,
    updateManualEvaluation,
    deleteEvaluation,
    isSaving,
    saveError,
  } = grades;

  useEffect(() => {
    setScoreDrafts({});
  }, [evaluations]);

  const getScoreValue = useCallback(
    (row: SubjectEvaluation) => {
      if (row.id !== undefined && scoreDrafts[row.id] !== undefined) {
        return scoreDrafts[row.id];
      }
      return row.score !== null ? String(row.score) : "";
    },
    [scoreDrafts]
  );

  const handleScoreBlur = async (row: SubjectEvaluation) => {
    if (!row.id || simulateMode) return;

    const raw = getScoreValue(row);
    const clamped = clampScoreDraft(raw, row.max);

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

  const handleAddEvaluation = async () => {
    const max = parseFloat(newMax);
    if (!newName.trim() || Number.isNaN(max) || max <= 0) return;
    try {
      await addEvaluation({
        name: newName.trim().toUpperCase(),
        max,
        score: null,
        manual: true,
        extra: newExtra,
      });
      setAddOpen(false);
      setNewName("");
      setNewMax("10");
      setNewExtra(false);
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

  const passingStatus =
    currentTotal >= subject.passingGrade ? "success" : "warning";

  useEffect(() => {
    onSimulateModeChange?.(simulateMode);
  }, [simulateMode, onSimulateModeChange]);

  useEffect(() => {
    const node = panelRef.current;
    if (!node || !onLayoutHeight) return;

    const report = () => onLayoutHeight(node.getBoundingClientRect().height);
    report();

    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLayoutHeight, simulateMode, evaluations.length]);

  const pendingLabel =
    pendingTeacherPoints % 1 === 0
      ? String(pendingTeacherPoints)
      : pendingTeacherPoints.toFixed(1);

  return (
    <>
      <div ref={panelRef} className="card grades-panel">
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
          {simulateMode ? (
            <span className="passing-grade-banner-sim">
              Simulada:{" "}
              <strong className={approved ? "success" : "danger"}>
                {simulatedTotal.toFixed(1)}
              </strong>
            </span>
          ) : (
            <span>
              Atual: <strong>{currentTotal.toFixed(1)}</strong>
            </span>
          )}
        </div>

        <div className="data-table-wrap grades-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Avaliação</th>
                <th className="grades-col-max">Máx.</th>
                <th className="grades-col-nota">
                  {simulateMode ? "Simular" : "Nota"}
                </th>
                <th className="grades-col-necessario">Necessário</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((row, index) => {
                const minNeeded = getMinimumForEvaluation(index);
                const isNext =
                  !simulateMode &&
                  !row.extra &&
                  row.score === null &&
                  evaluations
                    .slice(0, index)
                    .every((e) => e.extra || e.score !== null);
                const canEditMeta = !simulateMode && row.id !== undefined;

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
                        <span className="badge info grade-manual-badge">Manual</span>
                      )}
                      {row.extra && (
                        <span className="badge gold grade-manual-badge">Extra</span>
                      )}
                    </td>
                    <td className="grades-col-max">{row.max}</td>
                    <td className="grades-score-cell">
                      {simulateMode ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          className="grades-sim-input"
                          placeholder={row.score?.toString() ?? "0"}
                          value={simulated[row.name] ?? ""}
                          onChange={(e) => {
                            const cleaned = sanitizeScoreInput(e.target.value);
                            const clamped = clampScoreDraft(cleaned, row.max);
                            handleChange(row.name, clamped);
                          }}
                        />
                      ) : row.id !== undefined ? (
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
                      {row.extra ? (
                        <span className="grades-min-extra">—</span>
                      ) : pointsNeeded === 0 && simulateMode ? (
                        <span className="grades-min-ok">OK</span>
                      ) : minNeeded !== null ? (
                        <span>≥ {minNeeded.toFixed(1)}</span>
                      ) : (
                        "—"
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nova avaliação">
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
            value={newMax}
            onChange={(e) => setNewMax(e.target.value)}
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
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Adicionar"}
          </button>
          <button type="button" className="btn-outline" onClick={() => setAddOpen(false)}>
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal open={editRow !== null} onClose={closeEdit} title="Editar avaliação">
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
            value={editMax}
            onChange={(e) => setEditMax(e.target.value)}
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
            disabled={isSaving}
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
