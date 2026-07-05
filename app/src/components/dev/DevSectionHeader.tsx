import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

interface DevSectionHeaderProps {
  icon: IconName;
  title: string;
  titleId?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DevSectionHeader({
  icon,
  title,
  titleId,
  subtitle,
  actions,
}: DevSectionHeaderProps) {
  return (
    <div className="table-toolbar dev-section-toolbar">
      <div className="section-header-left">
        <span className="section-header-icon" aria-hidden>
          <Icon name={icon} size={16} />
        </span>
        <div>
          <h2 className="section-header-title" id={titleId}>
            {title}
          </h2>
          {subtitle ? <p className="dev-section-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="dev-section-actions">{actions}</div> : null}
    </div>
  );
}
