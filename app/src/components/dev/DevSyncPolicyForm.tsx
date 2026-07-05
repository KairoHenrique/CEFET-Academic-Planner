"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import type { EffectiveSyncPolicy, SyncPolicyOverrides } from "@/lib/sync-policy/types";
import type { AppCursoId } from "@/lib/auth/account/types";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import { ToggleOption } from "@/components/ui/ToggleOption";
import {
  DevSyncPolicyCursoFields,
  GlobalPolicyFields,
  NumberField,
} from "@/components/dev/DevSyncPolicyFields";
import {
  useDevPatchSyncPolicy,
  useDevResetSyncPolicy,
  useDevSyncPolicy,
} from "@/hooks/useDevPanel";

interface DevSyncPolicyFormProps {
  enabled: boolean;
}

function cloneEffectivePolicy(policy: EffectiveSyncPolicy): EffectiveSyncPolicy {
  return JSON.parse(JSON.stringify(policy)) as EffectiveSyncPolicy;
}

export function DevSyncPolicyForm({ enabled }: DevSyncPolicyFormProps) {
  const policyQuery = useDevSyncPolicy(enabled);
  const patchMutation = useDevPatchSyncPolicy();
  const resetMutation = useDevResetSyncPolicy();

  const [draft, setDraft] = useState<EffectiveSyncPolicy | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policyQuery.data?.effective) {
      setDraft(cloneEffectivePolicy(policyQuery.data.effective));
    }
  }, [policyQuery.data?.effective]);

  if (policyQuery.isLoading || !draft) {
    return (
      <section className="card">
        <p className="dev-empty-state">Carregando policy §6.6…</p>
      </section>
    );
  }

  async function handleSave() {
    if (!draft) return;
    setError(null);
    setMessage(null);

    const patch: SyncPolicyOverrides = {
      buttonScope: draft.buttonScope,
      autoIntervalHours: draft.autoIntervalHours,
      manualCooldownMinutes: draft.manualCooldownMinutes,
      workerMaxConcurrent: draft.workerMaxConcurrent,
      layers: { ...draft.layers },
      globalCalendario: { ...draft.globalCalendario },
      globalTurmasByCurso: { ...draft.globalTurmasByCurso },
      nightly: { ...draft.nightly },
    };

    try {
      await patchMutation.mutateAsync(patch);
      setMessage("Policy salva com sucesso.");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Não foi possível salvar a policy."
      );
    }
  }

  async function handleReset() {
    setError(null);
    setMessage(null);

    try {
      const response = await resetMutation.mutateAsync();
      setDraft(cloneEffectivePolicy(response.effective));
      setMessage("Padrões restaurados.");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Não foi possível restaurar os padrões."
      );
    }
  }

  const busy = patchMutation.isPending || resetMutation.isPending;

  const policyActions = (
    <div className="dev-run-actions">
      <button
        type="button"
        className="btn-outline dev-action-btn"
        disabled={busy}
        onClick={() => void handleReset()}
      >
        Restaurar padrões
      </button>
      <button
        type="button"
        className="btn-gold dev-action-btn"
        disabled={busy}
        onClick={() => void handleSave()}
      >
        Salvar policy
      </button>
    </div>
  );

  return (
    <section className="card" aria-labelledby="dev-policy-title">
      <DevSectionHeader
        icon="chart"
        title="Orquestração sync"
        titleId="dev-policy-title"
        subtitle="Policy §6.6 — consumida pelo cron B68e e fila worker."
        actions={policyActions}
      />

      <div className="dev-policy-grid">
        <fieldset className="dev-policy-group">
          <legend className="dev-policy-group-title">Botão aluno</legend>
          <div className="dev-policy-row">
            <label className="form-field dev-policy-field">
              <span className="form-label">Escopo do botão</span>
              <select
                className="form-input"
                value={draft.buttonScope}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    buttonScope: event.target.value as EffectiveSyncPolicy["buttonScope"],
                  })
                }
              >
                <option value="lite">Lite (notas + tarefas)</option>
                <option value="full">Full</option>
              </select>
            </label>
            <NumberField
              label="Auto-sync (horas)"
              value={draft.autoIntervalHours}
              onChange={(autoIntervalHours) =>
                setDraft({ ...draft, autoIntervalHours })
              }
              min={1}
            />
            <NumberField
              label="Cooldown manual (min)"
              value={draft.manualCooldownMinutes}
              onChange={(manualCooldownMinutes) =>
                setDraft({ ...draft, manualCooldownMinutes })
              }
              min={0}
            />
            <NumberField
              label="max_concurrent"
              value={draft.workerMaxConcurrent}
              onChange={(workerMaxConcurrent) =>
                setDraft({ ...draft, workerMaxConcurrent })
              }
              min={1}
              step={1}
            />
          </div>
        </fieldset>

        <fieldset className="dev-policy-group">
          <legend className="dev-policy-group-title">TTLs por camada (R1)</legend>
          <div className="dev-policy-row">
            <NumberField
              label="Notas/tarefas (h)"
              value={draft.layers.notasTarefasHours}
              onChange={(notasTarefasHours) =>
                setDraft({
                  ...draft,
                  layers: { ...draft.layers, notasTarefasHours },
                })
              }
              min={1}
            />
            <NumberField
              label="Faltas (h)"
              value={draft.layers.faltasHours}
              onChange={(faltasHours) =>
                setDraft({
                  ...draft,
                  layers: { ...draft.layers, faltasHours },
                })
              }
              min={1}
            />
            <NumberField
              label="Grupo (h)"
              value={draft.layers.grupoHours}
              onChange={(grupoHours) =>
                setDraft({
                  ...draft,
                  layers: { ...draft.layers, grupoHours },
                })
              }
              min={1}
            />
            <NumberField
              label="Histórico (dias)"
              value={draft.layers.historicoDays}
              onChange={(historicoDays) =>
                setDraft({
                  ...draft,
                  layers: { ...draft.layers, historicoDays },
                })
              }
              min={1}
            />
          </div>
        </fieldset>

        <GlobalPolicyFields
          title="Calendário global (R2)"
          policy={draft.globalCalendario}
          onChange={(globalCalendario) => setDraft({ ...draft, globalCalendario })}
        />

        <DevSyncPolicyCursoFields
          values={draft.globalTurmasByCurso}
          onChange={(cursoId: AppCursoId, policy) =>
            setDraft({
              ...draft,
              globalTurmasByCurso: {
                ...draft.globalTurmasByCurso,
                [cursoId]: policy,
              },
            })
          }
        />

        <fieldset className="dev-policy-group">
          <legend className="dev-policy-group-title">Batch noturno</legend>
          <div className="dev-policy-row">
            <ToggleOption
              label="Ativar janela noturna"
              checked={draft.nightly.enabled}
              onChange={(enabled) =>
                setDraft({
                  ...draft,
                  nightly: { ...draft.nightly, enabled },
                })
              }
              disabled={busy}
            />
            <label className="form-field dev-policy-field">
              <span className="form-label">Janela (HH:MM-HH:MM)</span>
              <input
                type="text"
                className="form-input"
                value={draft.nightly.window}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    nightly: { ...draft.nightly, window: event.target.value },
                  })
                }
                placeholder="03:00-06:00"
              />
            </label>
          </div>
        </fieldset>
      </div>

      {message ? (
        <p className="dev-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
