import Link from "next/link";
import {
  courseMap,
  courseStatusLabels,
  type CourseStatus,
} from "@/config/mock/course-map";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";

const statusBadge: Record<CourseStatus, string> = {
  done: "success",
  current: "info",
  unlocked: "gold",
  locked: "danger",
};

export function CourseMapGrid() {
  return (
    <div className="card">
      <SectionHeader title="Grade Curricular" icon="map" />

      <div className="course-map-legend">
        {(Object.keys(courseStatusLabels) as CourseStatus[]).map((status) => (
          <span key={status} className="course-legend-item">
            <span className={`badge ${statusBadge[status]}`}>
              {courseStatusLabels[status]}
            </span>
          </span>
        ))}
      </div>

      <div className="course-map-grid">
        {courseMap.map((period) => (
          <div key={period.period} className="course-period-column">
            <h4 className="course-period-label">{period.period}º período</h4>
            <ul className="course-node-list">
              {period.subjects.map((node) => (
                <li key={node.code}>
                  {node.status === "locked" ? (
                    <div className={`course-node ${node.status}`}>
                      <Icon name="lock" size={14} />
                      <div>
                        <p className="course-node-code">{node.code}</p>
                        <p className="course-node-name">{node.name}</p>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/disciplinas/${node.code}`}
                      className={`course-node ${node.status}`}
                    >
                      <Icon
                        name={node.status === "unlocked" ? "unlock" : "check"}
                        size={14}
                      />
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
