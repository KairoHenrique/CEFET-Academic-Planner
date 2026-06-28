import { validationError } from "@/lib/api/errors";
import { buildIntegralizacao } from "@/lib/integralizacao/build-integralizacao";
import { getChCatalog, isChType, isManualChType } from "@/lib/integralizacao/ch-catalog";
import { insertManualIntegralizacaoHoras } from "@/lib/db/queries";
import type {
  IntegralizacaoResponse,
  PostIntegralizacaoBody,
} from "@/lib/types/integralizacao-api";

const MAX_MANUAL_HOURS = 999;

function assertValidManualHours(horas: number): void {
  if (!Number.isInteger(horas) || horas <= 0) {
    throw validationError("Informe um número inteiro de horas maior que zero.");
  }

  if (horas > MAX_MANUAL_HOURS) {
    throw validationError(`O máximo por lançamento é ${MAX_MANUAL_HOURS} horas.`);
  }
}

function assertCategoryAllowsManual(tipoCh: PostIntegralizacaoBody["tipoCh"]): void {
  const catalog = getChCatalog();
  if (!catalog.some((entry) => entry.tipoCh === tipoCh)) {
    throw validationError("Categoria de carga horária inválida.");
  }
}

export function registerManualIntegralizacaoHours(
  body: PostIntegralizacaoBody
): IntegralizacaoResponse {
  if (!isChType(body.tipoCh)) {
    throw validationError("Categoria de carga horária inválida.");
  }

  assertCategoryAllowsManual(body.tipoCh);
  assertValidManualHours(body.horas);

  if (!isManualChType(body.tipoCh)) {
    throw validationError(
      "Horas manuais só podem ser lançadas em Complementar, Extensão ou Flexibilizada."
    );
  }

  insertManualIntegralizacaoHoras(body.tipoCh, body.horas);

  return buildIntegralizacao();
}
