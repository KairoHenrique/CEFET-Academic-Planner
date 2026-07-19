import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AttendanceSummary, SubjectDetail } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import { updateFaltaStatus } from "../../../api/mutations";
import { computeAbsenceRisk } from "../../../lib/absence-risk";
import { brand } from "../../../theme/brand";
import { EmptyState } from "../../../ui/EmptyState";
import { Icon } from "../../../ui/Icon";
import { ProgressBar } from "../../../ui/ProgressBar";

const STATUS_LABEL: Record<string, string> = {
  presente: "Presente",
  falta: "Falta",
  nao_registrada: "Não registrada",
};

const CYCLE: Array<"presente" | "falta" | "nao_registrada"> = [
  "presente",
  "falta",
  "nao_registrada",
];

const ZONE_TEXT = {
  safe: "#5FD068",
  warning: "#E8B84A",
  danger: "#FF7B72",
} as const;

const ZONE_BADGE_BG = {
  safe: "rgba(63,185,80,0.2)",
  warning: "rgba(210,153,34,0.22)",
  danger: "rgba(248,81,73,0.22)",
} as const;

const ZONE_BADGE_BORDER = {
  safe: "rgba(63,185,80,0.35)",
  warning: "rgba(210,153,34,0.35)",
  danger: "rgba(248,81,73,0.35)",
} as const;

const STATUS_STYLE = {
  presente: {
    bg: "rgba(63,185,80,0.2)",
    border: "rgba(63,185,80,0.35)",
    color: "#5FD068",
  },
  falta: {
    bg: "rgba(248,81,73,0.22)",
    border: "rgba(248,81,73,0.4)",
    color: "#FF7B72",
  },
  nao_registrada: {
    bg: "rgba(210,153,34,0.22)",
    border: "rgba(210,153,34,0.4)",
    color: "#E8B84A",
  },
} as const;

type Props = {
  code: string;
  subject: SubjectDetail;
  attendance: AttendanceSummary;
  onChanged: () => void;
};

/** Painel Frequência F28 — igual ao mobile browser. */
export function SubjectFaltasTab({
  code,
  subject,
  attendance,
  onChanged,
}: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const absences = subject.absences;
  const max = subject.maxAbsences;
  const absence = computeAbsenceRisk(absences, max);
  const failedByAbsence = max > 0 && absences > max;

  async function cycleStatus(
    id: number,
    current: "presente" | "falta" | "nao_registrada"
  ) {
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length]!;
    setBusyId(id);
    setError(null);
    try {
      await updateFaltaStatus(code, id, next);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Falha ao atualizar falta."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Icon name="clipboard" size={16} color={brand.gold} />
          <Text style={styles.panelTitle}>Frequência</Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: ZONE_BADGE_BG[absence.zone],
              borderColor: ZONE_BADGE_BORDER[absence.zone],
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: ZONE_TEXT[absence.zone] }]}>
            {absence.label}
          </Text>
        </View>
      </View>

      <Text style={styles.count}>
        {absences}
        <Text style={styles.countMax}> / {max}</Text>
      </Text>
      <Text style={styles.detail}>
        {failedByAbsence
          ? `limite de ${max} faltas excedido`
          : `faltas permitidas · ${attendance.daysRemaining} faltas restantes`}
      </Text>

      <View style={styles.barWrap}>
        {/* Site: `.progress-bar-lg` com fill padrão (ouro), sem zona. */}
        <ProgressBar
          percent={Math.min(100, absence.ratio)}
          tone="gold"
          height={14}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionLabel}>Registros</Text>
      {attendance.records.length === 0 ? (
        <EmptyState title="Sem registros de frequência" />
      ) : (
        attendance.records.map((rec, idx) => {
          const st = (rec.status in STATUS_STYLE
            ? rec.status
            : "nao_registrada") as keyof typeof STATUS_STYLE;
          const stStyle = STATUS_STYLE[st];
          return (
            <View key={`${rec.id}-${idx}`} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Data</Text>
                <Text style={styles.recordValue}>{rec.date}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Status</Text>
                {busyId === rec.id ? (
                  <ActivityIndicator color={brand.gold} />
                ) : (
                  <Pressable
                    onPress={() =>
                      void cycleStatus(
                        rec.id,
                        rec.status as "presente" | "falta" | "nao_registrada"
                      )
                    }
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: stStyle.bg,
                        borderColor: stStyle.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: stStyle.color }]}>
                      {STATUS_LABEL[rec.status] ?? rec.status}
                      {rec.quantidade && rec.quantidade > 1
                        ? ` ×${rec.quantidade}`
                        : ""}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusLg,
    padding: brand.space3,
    marginBottom: brand.space3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  badge: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  count: {
    fontSize: 28,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
    lineHeight: 34,
  },
  countMax: {
    fontSize: 16,
    fontFamily: brand.fontBody,
    fontWeight: "400",
    color: brand.textMuted,
  },
  detail: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  barWrap: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recordCard: {
    borderWidth: 1,
    borderColor: brand.borderMuted,
    borderRadius: brand.radiusMd,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.15)",
    gap: 8,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  recordLabel: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
  },
  recordValue: {
    fontSize: 14,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
  statusBadge: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  error: { color: brand.danger, marginVertical: 8, fontWeight: "600" },
});
