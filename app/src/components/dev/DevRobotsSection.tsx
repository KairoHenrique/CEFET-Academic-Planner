"use client";

import { useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  DEV_ROBOT_DEFINITIONS,
  selectionForRobot,
  type DevRobotId,
} from "@/lib/dev-panel/robots/definitions";
import type { DevRobotTargetResult } from "@/lib/dev-panel/types";
import { DevAccountsList } from "@/components/dev/DevAccountsList";
import { DevRobotModule } from "@/components/dev/DevRobotModule";
import { useDevAccounts, useDevRunRobots } from "@/hooks/useDevPanel";

type RobotRunState = Record<
  DevRobotId,
  { results: DevRobotTargetResult[]; error: string | null }
>;

const EMPTY_RUN_STATE: RobotRunState = {
  r1: { results: [], error: null },
  r2: { results: [], error: null },
  r3: { results: [], error: null },
};

export function DevRobotsSection() {
  const [search, setSearch] = useState("");
  const [selectedAccountRef, setSelectedAccountRef] = useState<string | null>(null);
  const [activeRobot, setActiveRobot] = useState<DevRobotId | null>(null);
  const [runState, setRunState] = useState<RobotRunState>(EMPTY_RUN_STATE);

  const accountsQuery = useDevAccounts(search);
  const runMutation = useDevRunRobots();

  const accounts = accountsQuery.data?.accounts ?? [];
  const selectedAccount = useMemo(
    () =>
      accounts.find((account) => account.accountRef === selectedAccountRef) ??
      null,
    [accounts, selectedAccountRef]
  );

  async function runRobot(robotId: DevRobotId, scope: "individual" | "global") {
    setActiveRobot(robotId);
    setRunState((current) => ({
      ...current,
      [robotId]: { results: [], error: null },
    }));

    if (scope === "individual") {
      if (!selectedAccount) {
        setRunState((current) => ({
          ...current,
          [robotId]: {
            results: [],
            error: "Selecione uma conta na tabela acima.",
          },
        }));
        setActiveRobot(null);
        return;
      }
      if (!selectedAccount.credentialSaved) {
        setRunState((current) => ({
          ...current,
          [robotId]: {
            results: [],
            error: "Conta selecionada não possui credencial SIGAA salva.",
          },
        }));
        setActiveRobot(null);
        return;
      }
    }

    try {
      const response = await runMutation.mutateAsync({
        scope,
        accountRef:
          scope === "individual" ? selectedAccount?.accountRef : undefined,
        robots: selectionForRobot(robotId),
        mode: robotId === "r1" ? "deep" : undefined,
      });
      setRunState((current) => ({
        ...current,
        [robotId]: { results: response.results, error: null },
      }));
    } catch (caught) {
      setRunState((current) => ({
        ...current,
        [robotId]: {
          results: [],
          error:
            caught instanceof ApiClientError
              ? caught.message
              : "Falha ao executar robô.",
        },
      }));
    } finally {
      setActiveRobot(null);
    }
  }

  return (
    <div className="dev-robots-layout">
      <DevAccountsList
        accounts={accounts}
        selectedAccountRef={selectedAccountRef}
        onSelect={setSelectedAccountRef}
        search={search}
        onSearchChange={setSearch}
        loading={accountsQuery.isLoading}
        className="col-12"
      />

      <div className="dev-robot-modules col-12">
        {DEV_ROBOT_DEFINITIONS.map((definition) => (
          <DevRobotModule
            key={definition.id}
            definition={definition}
            pending={runMutation.isPending && activeRobot === definition.id}
            results={runState[definition.id].results}
            error={runState[definition.id].error}
            canRunIndividual={Boolean(selectedAccount?.credentialSaved)}
            onRunIndividual={() => void runRobot(definition.id, "individual")}
            onRunGlobal={() => void runRobot(definition.id, "global")}
          />
        ))}
      </div>
    </div>
  );
}
