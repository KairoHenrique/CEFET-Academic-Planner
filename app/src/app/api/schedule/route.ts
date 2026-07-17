export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import {
  buildScheduleGrid,
  buildScheduleGridFromData,
} from "@/lib/schedule/build-schedule-grid";
import { pgGetAluno, pgGetSemestreAtual } from "@/lib/db/postgres/queries-read";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    const [aluno, semestre] = await Promise.all([
      pgGetAluno(),
      pgGetSemestreAtual(),
    ]);
    return apiSuccess(buildScheduleGridFromData(aluno, semestre));
  }

  return apiSuccess(buildScheduleGrid());
});
