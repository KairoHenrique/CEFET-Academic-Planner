"use client";

import { Suspense, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/client";
import { PageGrid } from "@/components/layout/PageGrid";
import { DevLoginForm } from "@/components/dev/DevLoginForm";
import { DevPanelShell } from "@/components/dev/DevPanelShell";
import { useDevLogin, useDevSession } from "@/hooks/useDevPanel";
import { queryKeys } from "@/lib/query/keys";

function DevPanelShellGate(props: {
  operatorEmail: string;
  onLogout: () => void;
}) {
  return (
    <Suspense
      fallback={
        <PageGrid>
          <div className="card col-12">
            <p className="dev-empty-state" role="status">
              Carregando painel…
            </p>
          </div>
        </PageGrid>
      }
    >
      <DevPanelShell {...props} />
    </Suspense>
  );
}

export function DevPanelPage() {
  const queryClient = useQueryClient();
  const [loggedOut, setLoggedOut] = useState(false);
  const sessionQuery = useDevSession();
  const loginMutation = useDevLogin();

  const unauthorized =
    sessionQuery.error instanceof ApiClientError &&
    sessionQuery.error.code === "UNAUTHORIZED";

  if (sessionQuery.isLoading) {
    return (
      <PageGrid>
        <div className="card col-12">
          <p className="dev-empty-state" role="status">
            Verificando sessão do operador…
          </p>
        </div>
      </PageGrid>
    );
  }

  if (!sessionQuery.isSuccess || unauthorized || loggedOut) {
    return (
      <DevLoginForm
        loading={loginMutation.isPending}
        onLogin={async (input) => {
          const result = await loginMutation.mutateAsync(input);
          setLoggedOut(false);
          queryClient.setQueryData(queryKeys.devSession(), {
            ok: true as const,
            email: result.email,
          });
        }}
      />
    );
  }

  return (
    <DevPanelShellGate
      operatorEmail={sessionQuery.data.email}
      onLogout={() => setLoggedOut(true)}
    />
  );
}
