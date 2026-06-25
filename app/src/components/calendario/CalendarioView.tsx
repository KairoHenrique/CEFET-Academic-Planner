"use client";

import { useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarMonth } from "@/components/calendario/CalendarMonth";
import { CalendarEventsList } from "@/components/calendario/CalendarMonth";
import { CalendarAcademicDates } from "@/components/calendario/CalendarAcademicDates";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { EventDetailContent } from "@/components/ui/ActivityDetail";
import type { CalendarEvent, EventTypeFilter } from "@/config/mock/calendar";
import {
  ModuleLayoutBar,
  ModuleShell,
} from "@/components/layout/ModuleLayout";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "calendar", label: "Calendário mensal", colClass: "col-8" },
  { id: "events", label: "Próximos eventos", colClass: "col-4" },
  { id: "academic", label: "Datas acadêmicas", colClass: "col-4" },
  { id: "schedule", label: "Grade semanal", colClass: "col-12" },
];

export function CalendarioView() {
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const layout = useModuleLayout("calendario", MODULES);

  const renderModule = (id: string) => {
    switch (id) {
      case "calendar":
        return (
          <div className="card">
            <CalendarMonth filter={filter} onEventSelect={setSelectedEvent} />
          </div>
        );
      case "events":
        return (
          <CalendarEventsList
            filter={filter}
            onFilterChange={setFilter}
            onEventSelect={setSelectedEvent}
          />
        );
      case "academic":
        return <CalendarAcademicDates />;
      case "schedule":
        return (
          <div className="card">
            <SectionHeader title="Grade Semanal Completa" icon="calendar" />
            <WeeklyScheduleTable />
          </div>
        );
      default:
        return null;
    }
  };

  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        subtitle="Clique em qualquer atividade para ver detalhes · personalize os módulos"
      />

      <ModuleLayoutBar
        editMode={layout.editMode}
        onToggleEdit={() => layout.setEditMode((v) => !v)}
        onReset={layout.resetLayout}
      />

      {layout.order.map((moduleId) => {
        const module = MODULES.find((m) => m.id === moduleId);
        if (!module) return null;
        const hidden = layout.hidden.includes(module.id);
        if (hidden && !layout.editMode) return null;

        return (
          <div key={module.id} className={module.colClass}>
            <ModuleShell
              label={module.label}
              editMode={layout.editMode}
              hidden={hidden}
              onMoveUp={() => layout.moveModule(module.id, -1)}
              onMoveDown={() => layout.moveModule(module.id, 1)}
              onToggle={() => layout.toggleModule(module.id)}
            >
              {renderModule(module.id)}
            </ModuleShell>
          </div>
        );
      })}

      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title ?? "Evento"}
      >
        {selectedEvent && (
          <EventDetailContent
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </Modal>
    </PageGrid>
  );
}
