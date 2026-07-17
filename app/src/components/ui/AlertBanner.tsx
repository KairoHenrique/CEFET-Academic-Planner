import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

export type AlertBannerTone = "info" | "success" | "warning" | "danger";

export interface AlertBannerCta {
  href: string;
  label: string;
}

interface AlertBannerProps {
  tone: AlertBannerTone;
  icon: IconName;
  title: string;
  items: NotificationSnapshotItem[];
  cta?: AlertBannerCta;
  children?: ReactNode;
}

/** Banner de alerta reutilizável — segue os tons/tokens padrão do site. */
export function AlertBanner({
  tone,
  icon,
  title,
  items,
  cta,
  children,
}: AlertBannerProps) {
  return (
    <section
      className={`alert-banner alert-banner--${tone}`}
      role="status"
      aria-live="polite"
    >
      <span className="alert-banner-icon" aria-hidden>
        <Icon name={icon} size={16} />
      </span>

      <div className="alert-banner-body">
        <p className="alert-banner-title">{title}</p>

        <ul className="alert-banner-list">
          {items.map((item) => (
            <li key={item.fingerprint} className="alert-banner-item">
              <span className="alert-banner-item-title">{item.title}</span>
              <span className="alert-banner-item-sub">{item.subtitle}</span>
            </li>
          ))}
        </ul>

        {children}
      </div>

      {cta ? (
        <Link href={cta.href} className="btn-outline alert-banner-action">
          {cta.label}
          <Icon name="arrow-right" size={14} aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
