import { resolveDefaultCursoId } from "../src/lib/db/backend/config";
import {
  countGlobalDisciplinas,
  seedPpcGlobalToPostgres,
} from "../src/lib/db/postgres/seed-ppc-global";

async function main(): Promise<void> {
  process.env.PLANNER_DATABASE = process.env.PLANNER_DATABASE ?? "postgres";
  const cursoId = resolveDefaultCursoId();
  const before = await countGlobalDisciplinas(cursoId);
  const result = await seedPpcGlobalToPostgres(cursoId);
  const after = await countGlobalDisciplinas(cursoId);

  console.log(
    `seed-ppc: curso=${result.cursoId} disciplinas=${result.disciplinas} requisitos=${result.requisitos} total=${after} (before=${before})`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
