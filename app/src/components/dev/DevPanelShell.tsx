"use client";

import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PageGrid } from "@/components/layout/PageGrid";
import { DevAuditSection } from "@/components/dev/DevAuditSection";
import { DevGiftKeysSection } from "@/components/dev/DevGiftKeysSection";
import { DevNavbar } from "@/components/dev/DevNavbar";
import { DevPromotionsSection } from "@/components/dev/DevPromotionsSection";
import { DevRobotsSection } from "@/components/dev/DevRobotsSection";
import { DevSyncQueueSection } from "@/components/dev/DevSyncQueueSection";
import { DevSyncPolicyForm } from "@/components/dev/DevSyncPolicyForm";
import { DevMaintenanceSection } from "@/components/dev/DevMaintenanceSection";
import {
  findDevPanelView,
  parseDevPanelView,
} from "@/components/dev/dev-panel-navigation";
import {
  useDevAuditLog,
  useDevLogout,
  useDevSyncStatus,
} from "@/hooks/useDevPanel";
import { queryKeys } from "@/lib/query/keys";

interface DevPanelShellProps {
  operatorEmail: string;
  onLogout: () => void;
}

export function DevPanelShell({ operatorEmail, onLogout }: DevPanelShellProps) {
  const searchParams = useSearchParams();
  const activeView = parseDevPanelView(searchParams.get("view"));
  const viewMeta = findDevPanelView(activeView);

  const queryClient = useQueryClient();
  const logoutMutation = useDevLogout();
  const auditQuery = useDevAuditLog(activeView === "audit");
  const syncStatusQuery = useDevSyncStatus(activeView === "fila");

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    queryClient.removeQueries({ queryKey: [...queryKeys.all, "dev"] });
    onLogout();
  }

  return (
    <>
      <DevNavbar
        operatorEmail={operatorEmail}
        onLogout={() => void handleLogout()}
        logoutPending={logoutMutation.isPending}
      />

      <PageGrid>
        <header className="dev-view-header col-12">
          <p className="page-header-eyebrow">Operações</p>
          <h1>{viewMeta.label}</h1>
          <p className="subtitle">{viewMeta.description}</p>
        </header>

        {activeView === "robots" ? (
          <div className="col-12">
            <DevRobotsSection />
          </div>
        ) : null}

        {activeView === "fila" ? (
          <DevSyncQueueSection
            data={syncStatusQuery.data}
            loading={syncStatusQuery.isLoading}
          />
        ) : null}

        {activeView === "chaves" ? (
          <DevGiftKeysSection />
        ) : null}

        {activeView === "promocoes" ? (
          <DevPromotionsSection />
        ) : null}

        {activeView === "policy" ? (
          <div className="col-12">
            <DevSyncPolicyForm enabled />
          </div>
        ) : null}

        {activeView === "manutencao" ? (
          <DevMaintenanceSection />
        ) : null}

        {activeView === "audit" ? (
          <DevAuditSection
            entries={auditQuery.data?.entries ?? []}
            loading={auditQuery.isLoading}
          />
        ) : null}
      </PageGrid>
    </>
  );
}
