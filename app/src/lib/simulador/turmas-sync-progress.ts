export interface TurmasSyncProgressStep {
  label: string;
  progress: number;
}

const PENDING_TARGET_PROGRESS = 92;
const PENDING_ESTIMATED_MS = 75_000;
const PENDING_TICK_MS = 600;

export function turmasSyncLabelForProgress(progress: number): string {
  if (progress >= 82) return "Organizando turmas para o simulador…";
  if (progress >= 58) return "Lendo lista de turmas do próximo semestre…";
  if (progress >= 32) return "Abrindo portal do discente…";
  return "Autenticando no SIGAA…";
}

/** Barra de progresso enquanto o POST /api/sync/turmas não retorna. */
export function startTurmasSyncProgress(
  onStep: (step: TurmasSyncProgressStep) => void
): () => void {
  const startedAt = Date.now();
  let progress = 8;

  onStep({ label: turmasSyncLabelForProgress(progress), progress });

  const timer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const estimated = Math.min(
      PENDING_TARGET_PROGRESS,
      8 +
        Math.floor(
          (elapsed / PENDING_ESTIMATED_MS) *
            (PENDING_TARGET_PROGRESS - 8)
        )
    );
    progress = Math.max(progress, estimated);
    onStep({ label: turmasSyncLabelForProgress(progress), progress });
  }, PENDING_TICK_MS);

  return () => window.clearInterval(timer);
}
