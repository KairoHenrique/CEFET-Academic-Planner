"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { DashboardStats } from "@/lib/types/dashboard";

interface StatsRowProps {
  stats: DashboardStats;
}

const statConfig: Array<{
  key: keyof DashboardStats;
  label: string;
  color: "gold" | "blue" | "danger";
  detail: string;
  icon: IconName;
  href: string;
  format: (value: number) => string;
}> = [
  {
    key: "rg",
    label: "Rendimento Global",
    color: "gold",
    detail: "RG acumulado",
    icon: "star",
    href: "/integralizacao",
    format: (value) => value.toFixed(2),
  },
  {
    key: "integralizacaoPercent",
    label: "Integralização",
    color: "blue",
    detail: "do curso concluído",
    icon: "chart",
    href: "/integralizacao",
    format: (value) => `${value}%`,
  },
  {
    key: "disciplinasCursando",
    label: "Disciplinas",
    color: "blue",
    detail: "cursando este semestre",
    icon: "books",
    href: "/disciplinas",
    format: (value) => String(value),
  },
  {
    key: "tarefasPendentes",
    label: "Tarefas Pendentes",
    color: "danger",
    detail: "entregas próximas",
    icon: "clipboard",
    href: "/calendario",
    format: (value) => String(value),
  },
];

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="stats-module-grid">
      {statConfig.map((stat) => (
        <Link
          key={stat.key}
          href={stat.href}
          className="card stat-card stat-card--link"
          aria-label={`${stat.label} — abrir área`}
        >
          <p className="card-header">
            <span className="section-header-title">{stat.label}</span>
          </p>
          <div className="card-stat-row">
            <div>
              <div className={`card-stat ${stat.color}`}>
                {stat.format(stats[stat.key])}
              </div>
              <p className="card-stat-detail">{stat.detail}</p>
            </div>
            <span className="card-stat-icon" aria-hidden="true">
              <Icon name={stat.icon} size={18} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
