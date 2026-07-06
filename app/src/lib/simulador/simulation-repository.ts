import { notFoundError, validationError } from "@/lib/api/errors";
import { isPostgresBackend } from "@/lib/db/backend/config";
import {
  deleteSimuladorSimulacao,
  getSimuladorSimulacaoById,
  insertSimuladorSimulacao,
  listSimuladorSimulacoes,
} from "@/lib/db/queries";
import {
  pgDeleteSimuladorSimulacao,
  pgGetSimuladorSimulacaoById,
  pgInsertSimuladorSimulacao,
  pgListSimuladorSimulacoes,
} from "@/lib/db/postgres/simulador-simulacoes";
import { buildSimulationExport } from "@/lib/simulador/build-simulation-export";
import { createSimulationId } from "@/lib/simulador/parse-simulador-requests";
import type {
  SimuladorSimulationDetail,
  SimuladorSimulationPayload,
  SimuladorSimulationSummary,
} from "@/lib/types/simulador-api";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

const MAX_SIMULATIONS = 20;

interface SimulationRow {
  id: string;
  titulo: string;
  semestre: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
}

function parsePayload(raw: string): SimuladorSimulationPayload {
  try {
    const parsed = JSON.parse(raw) as SimuladorSimulationPayload;
    if (
      !parsed ||
      typeof parsed.semestre !== "string" ||
      !Array.isArray(parsed.turmaSigaaIds)
    ) {
      throw new Error("invalid");
    }
    return {
      semestre: parsed.semestre,
      turmaSigaaIds: parsed.turmaSigaaIds.filter(
        (item): item is string => typeof item === "string"
      ),
    };
  } catch {
    throw validationError("Simulação salva está corrompida.");
  }
}

function toSummary(row: SimulationRow): SimuladorSimulationSummary {
  const payload = parsePayload(row.payload_json);
  return {
    id: row.id,
    titulo: row.titulo,
    semestre: row.semestre,
    turmaCount: payload.turmaSigaaIds.length,
    totalCh: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function enrichSummary(
  summary: SimuladorSimulationSummary,
  courses: TurmaOfertadaCourse[]
): SimuladorSimulationSummary {
  return {
    ...summary,
    totalCh: courses.reduce((sum, course) => sum + course.ch, 0),
  };
}

function toDetail(
  row: SimulationRow,
  courses: TurmaOfertadaCourse[]
): SimuladorSimulationDetail {
  const payload = parsePayload(row.payload_json);
  const exportData = buildSimulationExport({
    titulo: row.titulo,
    semestre: row.semestre,
    courses,
    generatedAt: row.updated_at,
  });

  return {
    ...enrichSummary(toSummary(row), courses),
    payload,
    export: exportData,
  };
}

async function listRows(): Promise<SimulationRow[]> {
  if (isPostgresBackend()) {
    return pgListSimuladorSimulacoes();
  }
  return listSimuladorSimulacoes();
}

async function getRow(id: string): Promise<SimulationRow | undefined> {
  if (isPostgresBackend()) {
    return pgGetSimuladorSimulacaoById(id);
  }
  return getSimuladorSimulacaoById(id);
}

export async function listSavedSimulations(
  resolveCourses: (
    payload: SimuladorSimulationPayload
  ) => Promise<TurmaOfertadaCourse[]>
): Promise<SimuladorSimulationSummary[]> {
  const rows = await listRows();
  const summaries: SimuladorSimulationSummary[] = [];

  for (const row of rows) {
    const payload = parsePayload(row.payload_json);
    const courses = await resolveCourses(payload);
    summaries.push(enrichSummary(toSummary(row), courses));
  }

  return summaries;
}

export async function getSavedSimulation(
  id: string,
  resolveCourses: (
    payload: SimuladorSimulationPayload
  ) => Promise<TurmaOfertadaCourse[]>
): Promise<SimuladorSimulationDetail> {
  const row = await getRow(id);
  if (!row) {
    throw notFoundError("Simulação não encontrada.");
  }

  const payload = parsePayload(row.payload_json);
  const courses = await resolveCourses(payload);
  return toDetail(row, courses);
}

export async function saveSimulation(input: {
  titulo: string;
  semestre: string;
  payload: SimuladorSimulationPayload;
  courses: TurmaOfertadaCourse[];
}): Promise<SimuladorSimulationDetail> {
  const rows = await listRows();
  if (rows.length >= MAX_SIMULATIONS) {
    throw validationError(
      `Limite de ${MAX_SIMULATIONS} simulações salvas. Exclua uma antes de salvar outra.`
    );
  }

  const now = new Date().toISOString();
  const row: SimulationRow = {
    id: createSimulationId(),
    titulo: input.titulo,
    semestre: input.semestre,
    payload_json: JSON.stringify(input.payload),
    created_at: now,
    updated_at: now,
  };

  if (isPostgresBackend()) {
    await pgInsertSimuladorSimulacao(row);
  } else {
    insertSimuladorSimulacao(row);
  }

  return toDetail(row, input.courses);
}

export async function removeSavedSimulation(id: string): Promise<void> {
  const removed = isPostgresBackend()
    ? await pgDeleteSimuladorSimulacao(id)
    : deleteSimuladorSimulacao(id);

  if (!removed) {
    throw notFoundError("Simulação não encontrada.");
  }
}
