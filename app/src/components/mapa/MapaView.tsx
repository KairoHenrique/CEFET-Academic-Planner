"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { CourseMapGrid } from "@/components/mapa/CourseMapGrid";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "map", label: "Mapa do curso", colClass: "col-12" },
];

export function MapaView() {
  const layout = useModuleLayout("mapa", MODULES);
  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="PPC · Eng. Computação"
        title="Mapa do"
        highlight="Curso"
        subtitle="Visualize períodos, status das disciplinas e pré-requisitos"
      />
      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={(id) =>
          id === "map" ? (
            <div className="card">
              <CourseMapGrid />
            </div>
          ) : null
        }
      />
    </PageGrid>
  );
}
