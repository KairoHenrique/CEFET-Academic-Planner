import Link from "next/link";
import { formatPeriodLabel } from "@/components/mapa/format-period-label";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type {
  CourseMapPeriod,
  CourseMapStatus,
} from "@/lib/types/mapa-api";

const STATUS_BADGE: Record<CourseMapStatus, string> = {
  done: "success",
  current: "info",
  unlocked: "gold",
  locked: "danger",
};

function nodeIcon(status: CourseMapStatus): "lock" | "unlock" | "check" {
  if (status === "locked") return "lock";
  if (status === "unlocked") return "unlock";
  return "check";
}

interface CourseMapGridProps {
  periods: CourseMapPeriod[];
  statusLabels: Record<CourseMapStatus, string>;
}

export function CourseMapGrid({ periods, statusLabels }: CourseMapGridProps) {
  const statusOrder = Object.keys(statusLabels) as CourseMapStatus[];

  return (
    <div className="card">
      <SectionHeader title="Grade Curricular" icon="map" />

      <div className="course-map-legend" role="list" aria-label="Legenda de status">
        {statusOrder.map((status) => (
          <span key={status} className="course-legend-item" role="listitem">
            <span className={`badge ${STATUS_BADGE[status]}`}>
              {statusLabels[status]}
            </span>
          </span>
        ))}
      </div>

      <div className="course-map-grid">
        {periods.map((period) => (
          <div key={period.period} className="course-period-column">
            <h4 className="course-period-label">
              {formatPeriodLabel(period.period)}
            </h4>
            <ul className="course-node-list">
              {period.subjects.map((node) => (
                <li key={node.code}>
                  {node.status === "locked" ? (
                    <div
                      className={`course-node ${node.status}`}
                      aria-label={`${node.name} — trancada`}
                    >
                      <Icon name="lock" size={14} aria-hidden />
                      <div>
                        <p className="course-node-code">{node.code}</p>
                        <p className="course-node-name">{node.name}</p>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/disciplinas/${encodeURIComponent(node.code)}`}
                      className={`course-node ${node.status}`}
                      aria-label={`${node.name} — ${statusLabels[node.status]}`}
                    >
                      <Icon name={nodeIcon(node.status)} size={14} aria-hidden />
                      <div>
                        <p className="course-node-code">{node.code}</p>
                        <p className="course-node-name">{node.name}</p>
                        <p className="course-node-ch">{node.ch}h</p>
                      </div>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="panel-footer-note">
        Grafo interativo com pré-requisitos será implementado na Fase 5.
      </p>
    </div>
  );
}
