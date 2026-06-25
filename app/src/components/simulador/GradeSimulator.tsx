"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

const evaluations = [
  { name: "PRO1", max: 30, real: 9.0 },
  { name: "SEM", max: 10, real: null },
  { name: "PRO2", max: 30, real: null },
  { name: "Nota", max: 30, real: null },
];

export function GradeSimulator() {
  const [simulated, setSimulated] = useState<Record<string, string>>({});

  const total = evaluations.reduce((acc, ev) => {
    const val = simulated[ev.name] ?? (ev.real?.toString() ?? "");
    const num = parseFloat(val);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const approved = total >= 60;

  const handleChange = (name: string, value: string) => {
    setSimulated((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setSimulated({});

  return (
    <div className="card card-full-height">
      <SectionHeader
        title="Simulador de Notas"
        icon="calculator"
        badge={
          <span className={`badge ${approved ? "success" : "danger"}`}>
            {approved ? "Aprovado" : "Reprovado"}
          </span>
        }
      />

      <div className="simulator-total">
        <span>Nota simulada</span>
        <strong className={`card-stat ${approved ? "success" : "danger"}`}>
          {total.toFixed(1)}
        </strong>
      </div>

      <div className="simulator-fields">
        {evaluations.map((ev) => (
          <label key={ev.name} className="simulator-field">
            <span>
              {ev.name} <small>(máx. {ev.max})</small>
            </span>
            <input
              type="number"
              min={0}
              max={ev.max}
              step={0.1}
              placeholder={ev.real?.toString() ?? "0"}
              value={simulated[ev.name] ?? ""}
              onChange={(e) => handleChange(ev.name, e.target.value)}
            />
          </label>
        ))}
      </div>

      <button type="button" className="btn-outline" onClick={handleReset}>
        Limpar simulação
      </button>
    </div>
  );
}
