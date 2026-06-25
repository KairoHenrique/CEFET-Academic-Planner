import Link from "next/link";
import { Icon, type IconName } from "./Icon";

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  badge?: React.ReactNode;
  href?: string;
  linkLabel?: string;
}

export function SectionHeader({
  title,
  icon,
  badge,
  href,
  linkLabel = "Ver tudo",
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header-left">
        {icon && (
          <span className="section-header-icon" aria-hidden="true">
            <Icon name={icon} size={16} />
          </span>
        )}
        <h3 className="section-header-title">{title}</h3>
        {badge}
      </div>
      {href && (
        <Link href={href} className="section-header-link">
          {linkLabel}
          <Icon name="arrow-right" size={14} />
        </Link>
      )}
    </div>
  );
}
