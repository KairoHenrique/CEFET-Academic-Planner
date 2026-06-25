import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { SubjectsGrid } from "@/components/dashboard/SubjectsGrid";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySchedulePreview } from "@/components/dashboard/WeeklySchedulePreview";
import { IntegrationProgress } from "@/components/dashboard/IntegrationProgress";

export default function DashboardPage() {
  return (
    <PageGrid>
      <PageHeader
        eyebrow="Semestre 2026.1"
        title="Bom dia,"
        highlight="Kairo"
        subtitle="Engenharia de Computação · CEFET-MG Divinópolis"
      />

      <StatsRow />

      <div className="col-8">
        <UpcomingTasks />
      </div>

      <div className="col-4">
        <IntegrationProgress />
      </div>

      <div className="col-12">
        <WeeklySchedulePreview />
      </div>

      <div className="col-12">
        <SubjectsGrid />
      </div>
    </PageGrid>
  );
}
