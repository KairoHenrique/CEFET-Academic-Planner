import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { CourseMapGrid } from "@/components/mapa/CourseMapGrid";

export default function MapaPage() {
  return (
    <PageGrid>
      <PageHeader
        eyebrow="PPC · Eng. Computação"
        title="Mapa do"
        highlight="Curso"
        subtitle="Visualize períodos, status das disciplinas e pré-requisitos"
      />
      <div className="col-12">
        <CourseMapGrid />
      </div>
    </PageGrid>
  );
}
