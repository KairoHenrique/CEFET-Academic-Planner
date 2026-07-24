export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { countGlobalDisciplinas, seedAllPpcGlobalToPostgres } from "@/lib/db/postgres/seed-ppc-global";

export const runtime = "nodejs";

export const GET = async () => {
  try {
    ensureDbReady();
    const results = await seedAllPpcGlobalToPostgres();
    const output = [];
    
    for (const result of results) {
      const total = await countGlobalDisciplinas(result.cursoId);
      output.push({
        curso: result.cursoId,
        disciplinas: result.disciplinas,
        requisitos: result.requisitos,
        total,
      });
    }

    return apiSuccess({
      ok: true,
      message: "Grades curriculares (PPC) inseridas com sucesso no banco de dados!",
      results: output,
    });
  } catch (error) {
    return apiErrorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
