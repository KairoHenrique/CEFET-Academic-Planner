"use client";

import type { GlobalRefreshPolicy } from "@/lib/sync-policy/types";
import { APP_CURSO_IDS } from "@/lib/auth/account/curso-catalog";
import { resolveCursoLabel } from "@/lib/auth/account/curso-catalog";
import type { AppCursoId } from "@/lib/auth/account/types";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

function NumberField({ label, value, onChange, min = 0, step = 1 }: NumberFieldProps) {
  return (
    <label className="form-field dev-policy-field">
      <span className="form-label">{label}</span>
      <input
        type="number"
        className="form-input"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

interface GlobalPolicyFieldsProps {
  title: string;
  policy: GlobalRefreshPolicy;
  onChange: (next: GlobalRefreshPolicy) => void;
}

export function GlobalPolicyFields({
  title,
  policy,
  onChange,
}: GlobalPolicyFieldsProps) {
  return (
    <fieldset className="dev-policy-group">
      <legend className="dev-policy-group-title">{title}</legend>
      <div className="dev-policy-row">
        <label className="form-field dev-policy-field">
          <span className="form-label">Modo</span>
          <select
            className="form-input"
            value={policy.mode}
            onChange={(event) =>
              onChange({
                ...policy,
                mode: event.target.value as GlobalRefreshPolicy["mode"],
              })
            }
          >
            <option value="interval">Intervalo (dias)</option>
            <option value="fixed_at">Data fixa</option>
          </select>
        </label>

        {policy.mode === "interval" ? (
          <NumberField
            label="Dias"
            value={policy.days ?? 1}
            onChange={(days) => onChange({ ...policy, days })}
            min={1}
          />
        ) : (
          <label className="form-field dev-policy-field dev-policy-field--wide">
            <span className="form-label">Data/hora (ISO ou local)</span>
            <input
              type="datetime-local"
              className="form-input"
              value={policy.at?.slice(0, 16) ?? ""}
              onChange={(event) =>
                onChange({ ...policy, at: event.target.value })
              }
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}

interface DevSyncPolicyCursoFieldsProps {
  values: Partial<Record<AppCursoId, GlobalRefreshPolicy>>;
  onChange: (cursoId: AppCursoId, policy: GlobalRefreshPolicy) => void;
}

export function DevSyncPolicyCursoFields({
  values,
  onChange,
}: DevSyncPolicyCursoFieldsProps) {
  return (
    <div className="dev-policy-cursos">
      {APP_CURSO_IDS.map((cursoId) => {
        const policy = values[cursoId] ?? { mode: "interval", days: 1 };
        return (
          <GlobalPolicyFields
            key={cursoId}
            title={`Turmas — ${resolveCursoLabel(cursoId)}`}
            policy={policy}
            onChange={(next) => onChange(cursoId, next)}
          />
        );
      })}
    </div>
  );
}

export { NumberField };
