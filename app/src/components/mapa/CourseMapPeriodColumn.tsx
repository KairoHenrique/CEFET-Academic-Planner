import { CourseMapNodeCard } from "@/components/mapa/CourseMapNodeCard";
import { formatPeriodLabel } from "@/components/mapa/format-period-label";
import type {
  CourseMapPeriod,
  CourseMapStatus,
} from "@/lib/types/mapa-api";

interface CourseMapPeriodColumnProps {
  period: CourseMapPeriod;
  statusLabels: Record<CourseMapStatus, string>;
}

export function CourseMapPeriodColumn({
  period,
  statusLabels,
}: CourseMapPeriodColumnProps) {
  return (
    <div
      className={
        period.subjects.length === 0
          ? "course-period-column course-period-column--empty"
          : "course-period-column"
      }
    >
      <h4 className="course-period-label">{formatPeriodLabel(period.period)}</h4>
      <ul className="course-node-list">
        {period.subjects.map((node) => (
          <li key={node.code}>
            <CourseMapNodeCard
              node={node}
              statusLabel={statusLabels[node.status]}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
