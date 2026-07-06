export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { parseDevRobotRunRequest } from "@/lib/dev-panel/parse-dev-requests";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { runDevRobots } from "@/lib/dev-panel/run-dev-robots";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);
    const body = await request.json();
    const input = parseDevRobotRunRequest(body);
    const result = await runDevRobots(input);

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.robots.run",
      detail: {
        scope: input.scope,
        robots: input.robots,
        mode: input.mode,
        accountRef: input.accountRef,
        outcomes: result.results.map((item) => ({
          robot: item.robot,
          status: item.status,
          cpfMasked: item.cpfMasked,
        })),
      },
    });

    return apiSuccess({ ok: true as const, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
