import type { DevRobotId } from "@/lib/dev-panel/robots/definitions";
import { runR1Robot } from "@/lib/dev-panel/robots/run-r1-robot";
import { runR2GlobalRobot, runR2Robot } from "@/lib/dev-panel/robots/run-r2-robot";
import { runR3GlobalRobot, runR3Robot } from "@/lib/dev-panel/robots/run-r3-robot";
import type {
  DevRobotRunRequest,
  DevRobotTargetResult,
} from "@/lib/dev-panel/types";

export async function runDevRobotForCpf(
  robotId: DevRobotId,
  cpf: string,
  mode: DevRobotRunRequest["mode"]
): Promise<DevRobotTargetResult> {
  if (robotId === "r1") {
    return runR1Robot(cpf, mode);
  }
  if (robotId === "r2") {
    return runR2Robot(cpf);
  }
  return runR3Robot(cpf);
}

export async function runDevRobotGlobal(
  robotId: DevRobotId
): Promise<DevRobotTargetResult> {
  if (robotId === "r2") {
    return runR2GlobalRobot();
  }
  if (robotId === "r3") {
    return runR3GlobalRobot();
  }

  return {
    cpfMasked: "global",
    robot: "r1",
    status: "skipped",
    message: "R1 global itera contas — use “Rodar todas contas”.",
  };
}
