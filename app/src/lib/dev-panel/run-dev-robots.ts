import { validationError } from "@/lib/api/errors";
import { listDevTargetCpfs } from "@/lib/dev-panel/list-dev-accounts";
import {
  runDevRobotForCpf,
  runDevRobotGlobal,
} from "@/lib/dev-panel/robots/dispatch-dev-robot";
import type {
  DevRobotRunRequest,
  DevRobotRunResult,
  DevRobotTargetResult,
} from "@/lib/dev-panel/types";

async function runR1Global(
  cpfs: string[],
  mode: DevRobotRunRequest["mode"]
): Promise<DevRobotTargetResult[]> {
  const results: DevRobotTargetResult[] = [];
  for (const cpf of cpfs) {
    results.push(await runDevRobotForCpf("r1", cpf, mode));
  }
  return results;
}

export async function runDevRobots(
  input: DevRobotRunRequest
): Promise<DevRobotRunResult> {
  const cpfs = await listDevTargetCpfs({
    scope: input.scope,
    accountRef: input.accountRef,
  });

  if (cpfs.length === 0) {
    throw validationError("Nenhuma conta elegível com credencial SIGAA.");
  }

  const results: DevRobotTargetResult[] = [];
  const mode = input.mode ?? "deep";

  if (input.scope === "global") {
    if (input.robots.r2) {
      results.push(await runDevRobotGlobal("r2"));
    }
    if (input.robots.r3) {
      results.push(await runDevRobotGlobal("r3"));
    }
    if (input.robots.r1) {
      results.push(...(await runR1Global(cpfs, mode)));
    }
    return { scope: input.scope, results };
  }

  const cpf = cpfs[0];
  if (input.robots.r1) {
    results.push(await runDevRobotForCpf("r1", cpf, mode));
  }
  if (input.robots.r2) {
    results.push(await runDevRobotForCpf("r2", cpf, mode));
  }
  if (input.robots.r3) {
    results.push(await runDevRobotForCpf("r3", cpf, mode));
  }

  return { scope: input.scope, results };
}
