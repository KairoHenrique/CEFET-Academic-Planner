import { toBrazilIsoDate } from "@/lib/time/brazil";
import { enqueueCloudSyncJob } from "@/lib/sync-queue/cloud-sync-queue";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  getAppConfigJson,
  setAppConfigJson,
} from "@/lib/sync-policy/app-config-store";

export type RuCronSlot = "almoco" | "jantar";

export type RuSaldoCronResult = {
  slot: RuCronSlot | null;
  dayKey: string;
  scanned: number;
  enqueued: number;
  skipped: number;
  errors: number;
  reason?: string;
};

/** Janelas de disparo (BRT): ~1 h antes das aberturas 10:30 e 19:00. */
const SLOT_WINDOWS: Record<
  RuCronSlot,
  { startMinutes: number; endMinutes: number }
> = {
  // 09:00–09:45 cobre ticks */30 em 09:00 e 09:30 (1h antes de 10:30)
  almoco: { startMinutes: 9 * 60, endMinutes: 9 * 60 + 45 },
  // 17:45–18:20 cobre tick 18:00 (1h antes de 19:00)
  jantar: { startMinutes: 17 * 60 + 45, endMinutes: 18 * 60 + 20 },
};

const USERS_PER_TICK = 8;
const CURSOR_KEY_PREFIX = "cron.ru_saldo.cursor";

function brazilMinutesNow(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function resolveRuCronSlot(
  now = new Date(),
  forceSlot?: RuCronSlot | null
): RuCronSlot | null {
  if (forceSlot === "almoco" || forceSlot === "jantar") return forceSlot;
  const minutes = brazilMinutesNow(now);
  for (const [slot, window] of Object.entries(SLOT_WINDOWS) as Array<
    [RuCronSlot, { startMinutes: number; endMinutes: number }]
  >) {
    if (minutes >= window.startMinutes && minutes <= window.endMinutes) {
      return slot;
    }
  }
  return null;
}

/**
 * Enfileira robô leve `ru` para usuários com senha SIGAA salva.
 * Round-robin por slot/dia (idempotência no enqueue).
 */
export async function runRuSaldoCron(options?: {
  force?: boolean;
  slot?: RuCronSlot | null;
  now?: Date;
}): Promise<RuSaldoCronResult> {
  const now = options?.now ?? new Date();
  const dayKey = toBrazilIsoDate(now);
  const slot = resolveRuCronSlot(now, options?.slot ?? null);

  if (!slot && !options?.force) {
    return {
      slot: null,
      dayKey,
      scanned: 0,
      enqueued: 0,
      skipped: 0,
      errors: 0,
      reason: "Fora da janela 10:00 / 18:30 BRT.",
    };
  }

  const activeSlot: RuCronSlot = slot ?? options?.slot ?? "almoco";
  const cursorKey = `${CURSOR_KEY_PREFIX}.${dayKey}.${activeSlot}`;
  const cursorRaw = await getAppConfigJson(cursorKey);
  const afterCpf =
    cursorRaw &&
    typeof cursorRaw === "object" &&
    typeof (cursorRaw as { afterCpf?: unknown }).afterCpf === "string"
      ? String((cursorRaw as { afterCpf: string }).afterCpf)
      : null;

  const pool = getPostgresPool();
  const result = afterCpf
    ? await pool.query<{ cpf: string }>(
        `SELECT cpf
         FROM app_profiles
         WHERE sigaa_password_enc IS NOT NULL
           AND length(trim(sigaa_password_enc)) > 0
           AND cpf > $1
         ORDER BY cpf ASC
         LIMIT $2`,
        [afterCpf, USERS_PER_TICK]
      )
    : await pool.query<{ cpf: string }>(
        `SELECT cpf
         FROM app_profiles
         WHERE sigaa_password_enc IS NOT NULL
           AND length(trim(sigaa_password_enc)) > 0
         ORDER BY cpf ASC
         LIMIT $1`,
        [USERS_PER_TICK]
      );

  let rows = result.rows;
  if (rows.length === 0 && afterCpf) {
    // Fim do ciclo do slot — não reinicia no mesmo dia (evita spam).
    return {
      slot: activeSlot,
      dayKey,
      scanned: 0,
      enqueued: 0,
      skipped: 0,
      errors: 0,
      reason: "Fila do slot esgotada.",
    };
  }

  let enqueued = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const outcome = await enqueueCloudSyncJob({
        username: row.cpf,
        mode: "lite",
        lane: "normal",
        trigger: "auto",
        robot: "ru",
        idempotencyKey: `ru-cron:${dayKey}:${activeSlot}:${row.cpf}`,
      });
      if (!outcome.reused) {
        enqueued += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      console.error(
        `[cron:ru] Falha ao enfileirar cpf=${row.cpf.slice(0, 4)}…`,
        error instanceof Error ? error.message : error
      );
      errors += 1;
    }
  }

  const nextAfter = rows.length > 0 ? rows[rows.length - 1]!.cpf : null;
  await setAppConfigJson(cursorKey, { afterCpf: nextAfter });

  return {
    slot: activeSlot,
    dayKey,
    scanned: rows.length,
    enqueued,
    skipped,
    errors,
  };
}
