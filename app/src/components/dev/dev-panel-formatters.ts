import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";

const STATUS_LABELS: Record<PerfilSubscriptionStatus, string> = {
  trial_active: "Trial ativo",
  trial_expired: "Trial expirado",
  pending_payment: "Aguardando pagamento",
  active: "Plano ativo",
  expired: "Plano expirado",
  cancelled: "Cancelado",
};

export function subscriptionStatusLabel(
  status: PerfilSubscriptionStatus
): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatDevDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEtaSeconds(seconds: number): string {
  if (seconds <= 0) return "—";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `~${hours}h ${rest}min` : `~${hours}h`;
}
