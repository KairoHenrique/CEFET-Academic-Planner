import { CourseMapNodeCard } from "@/components/mapa/CourseMapNodeCard";
import type { CourseMapNode, CourseMapStatus } from "@/lib/types/mapa-api";

interface CourseMapElectivesStripProps {
  subjects: CourseMapNode[];
  statusLabels: Record<CourseMapStatus, string>;
}

export function CourseMapElectivesStrip({
  subjects,
  statusLabels,
}: CourseMapElectivesStripProps) {
  if (subjects.length === 0) {
    return null;
  }

  return (
    <section
      className="course-map-electives"
      aria-labelledby="course-map-electives-title"
    >
      <h4 id="course-map-electives-title" className="course-map-electives-title">
        Optativas / Eletivas
      </h4>
      <ul className="course-map-electives-list">
        {subjects.map((node) => (
          <li key={node.code}>
            <CourseMapNodeCard
              node={node}
              statusLabel={statusLabels[node.status]}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
