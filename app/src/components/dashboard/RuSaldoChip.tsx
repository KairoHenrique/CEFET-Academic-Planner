"use client";

type Props = {
  refeicoesDisponiveis: number | null | undefined;
  compact?: boolean;
};

export function RuSaldoChip({ refeicoesDisponiveis, compact = false }: Props) {
  const value =
    refeicoesDisponiveis != null && Number.isFinite(refeicoesDisponiveis)
      ? String(refeicoesDisponiveis)
      : "—";

  return (
    <div
      className={`ru-saldo-chip${compact ? " ru-saldo-chip--compact" : ""}`}
      title="Refeições disponíveis no cartão do RU (SIGAA)"
    >
      <span className="ru-saldo-chip-label">Saldo do RU</span>
      <span className="ru-saldo-chip-value">{value}</span>
      <span className="ru-saldo-chip-hint">refeições</span>
    </div>
  );
}
