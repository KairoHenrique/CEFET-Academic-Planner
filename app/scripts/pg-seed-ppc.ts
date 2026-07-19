import { isAppCursoId } from "../src/lib/auth/account/curso-catalog";
import { resolveDefaultCursoId } from "../src/lib/db/backend/config";
import {
  countGlobalDisciplinas,
  listSeedableCursoIds,
  seedAllPpcGlobalToPostgres,
  seedPpcGlobalToPostgres,
} from "../src/lib/db/postgres/seed-ppc-global";

function parseCursoArg(argv: string[]): string | "all" {
  const flag = argv.find((a) => a.startsWith("--curso="));
  if (!flag) return resolveDefaultCursoId();
  const value = flag.slice("--curso=".length).trim();
  if (value === "all") return "all";
  if (!isAppCursoId(value)) {
    throw new Error(
      `curso inválido: ${value}. Use: ${listSeedableCursoIds().join(" | ")} | all`
    );
  }
  return value;
}

async function main(): Promise<void> {
  process.env.PLANNER_DATABASE = process.env.PLANNER_DATABASE ?? "postgres";
  const target = parseCursoArg(process.argv.slice(2));

  if (target === "all") {
    const results = await seedAllPpcGlobalToPostgres();
    for (const result of results) {
      const total = await countGlobalDisciplinas(result.cursoId);
      console.log(
        `seed-ppc: curso=${result.cursoId} disciplinas=${result.disciplinas} requisitos=${result.requisitos} total=${total}`
      );
    }
    return;
  }

  const before = await countGlobalDisciplinas(target);
  const result = await seedPpcGlobalToPostgres(target);
  const after = await countGlobalDisciplinas(target);

  console.log(
    `seed-ppc: curso=${result.cursoId} disciplinas=${result.disciplinas} requisitos=${result.requisitos} total=${after} (before=${before})`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
