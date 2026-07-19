import { StyleSheet, Text, View } from "react-native";
import type { GradeRisk } from "@acme/api-contracts";
import { brand } from "../theme/brand";
import { ProgressBar, type ProgressTone } from "./ProgressBar";

/** Escala fixa do site (`SUBJECT_DISPLAY_GRADE_MAX`). */
export const DISPLAY_GRADE_MAX = 100;

const ZONE_TEXT = {
  safe: "#5FD068",
  warning: "#E8B84A",
  danger: "#FF7B72",
  unknown: brand.textMuted,
} as const;

const ZONE_BADGE_BG = {
  safe: "rgba(63,185,80,0.2)",
  warning: "rgba(210,153,34,0.22)",
  danger: "rgba(248,81,73,0.22)",
  unknown: "rgba(88,166,255,0.16)",
} as const;

const ZONE_BADGE_BORDER = {
  safe: "rgba(63,185,80,0.35)",
  warning: "rgba(210,153,34,0.35)",
  danger: "rgba(248,81,73,0.35)",
  unknown: "rgba(88,166,255,0.3)",
} as const;

const ZONE_TONE: Record<string, ProgressTone> = {
  safe: "safe",
  warning: "warning",
  danger: "danger",
};

/** Espelho de `gradeValueColorClass` do site. */
function valueColor(label: string): string {
  if (label === "Aprovado") return ZONE_TEXT.safe;
  if (label === "Risco" || label === "Recuperação") return ZONE_TEXT.warning;
  if (
    label === "Crítico" ||
    label === "Reprovado" ||
    label === "Reprovado por falta"
  ) {
    return ZONE_TEXT.danger;
  }
  return brand.text;
}

type Props = {
  grade: number | null;
  gradeRisk: GradeRisk;
  gradeMax?: number;
  showHint?: boolean;
  /** Variante inline do site (`compact` = sem label/barra/hint). */
  compact?: boolean;
};

/**
 * Espelho F28 de `GradeRiskIndicator` variant="panel":
 * Nota · valor colorido · badge · hint · barra com marca de aprovação.
 */
export function GradeRiskBlock({
  grade,
  gradeRisk,
  gradeMax = DISPLAY_GRADE_MAX,
  showHint = true,
  compact = false,
}: Props) {
  const zone = gradeRisk.zone;
  const max = gradeMax > 0 ? gradeMax : DISPLAY_GRADE_MAX;

  if (zone === "unknown") {
    return (
      <View style={[styles.stack, compact && styles.stackCompact]}>
        {compact ? null : <Text style={styles.label}>Nota</Text>}
        <Text style={[styles.valueMuted, compact && styles.valueCompact]}>
          — / {max}
        </Text>
        <View
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            {
              backgroundColor: ZONE_BADGE_BG.unknown,
              borderColor: ZONE_BADGE_BORDER.unknown,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              compact && styles.badgeTextCompact,
              { color: ZONE_TEXT.unknown },
            ]}
          >
            Sem notas
          </Text>
        </View>
      </View>
    );
  }

  const score =
    grade != null
      ? grade
      : gradeRisk.currentTotal > 0
        ? gradeRisk.currentTotal
        : null;
  const color = valueColor(gradeRisk.label);
  const tone = ZONE_TONE[zone] ?? "gold";
  const barPct = Math.min(100, (gradeRisk.currentTotal / max) * 100);
  const passMark = Math.min(100, (gradeRisk.passingGrade / max) * 100);

  const hintPts =
    !compact &&
    showHint &&
    gradeRisk.pointsNeeded > 0 &&
    !gradeRisk.fullyDistributed
      ? gradeRisk.pointsNeeded % 1 === 0
        ? String(gradeRisk.pointsNeeded)
        : gradeRisk.pointsNeeded.toFixed(1)
      : null;

  const recoveryHint =
    !compact && gradeRisk.recoveryAverage != null
      ? `Média final: ${gradeRisk.recoveryAverage}`
      : !compact && gradeRisk.recoveryScoreNeeded != null
        ? `Precisa ≥ ${gradeRisk.recoveryScoreNeeded} na recuperação`
        : null;

  return (
    <View style={[styles.stack, compact && styles.stackCompact]}>
      {compact ? null : <Text style={styles.label}>Nota</Text>}
      <Text style={[styles.value, compact && styles.valueCompact]}>
        <Text style={{ color }}>{score != null ? score : "—"}</Text>
        <Text style={[styles.valueMax, compact && styles.valueMaxCompact]}>
          {" "}
          / {max}
        </Text>
      </Text>
      <View
        style={[
          styles.badge,
          compact && styles.badgeCompact,
          {
            backgroundColor: ZONE_BADGE_BG[zone],
            borderColor: ZONE_BADGE_BORDER[zone],
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            compact && styles.badgeTextCompact,
            { color: ZONE_TEXT[zone] },
          ]}
        >
          {gradeRisk.label}
        </Text>
      </View>

      {hintPts ? (
        <Text style={[styles.hint, { color: ZONE_TEXT[zone] }]}>
          Faltam {hintPts} pts p/ {gradeRisk.passingGrade}
        </Text>
      ) : null}
      {recoveryHint && !hintPts ? (
        <Text style={[styles.hint, { color: ZONE_TEXT[zone] }]}>
          {recoveryHint}
        </Text>
      ) : null}

      {compact ? null : (
        <View style={styles.barWrap}>
          <View style={styles.passLabelRow} pointerEvents="none">
            <Text
              style={[
                styles.passLabel,
                { left: `${Math.min(92, Math.max(0, passMark - 3))}%` },
              ]}
            >
              {gradeRisk.passingGrade}
            </Text>
          </View>
          <ProgressBar
            percent={barPct}
            tone={tone}
            height={14}
            markAt={passMark}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 6,
    paddingTop: 4,
  },
  stackCompact: {
    gap: 2,
    paddingTop: 0,
  },
  label: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
    lineHeight: 24,
  },
  valueCompact: {
    fontSize: 15,
    lineHeight: 19,
  },
  valueMuted: {
    fontSize: 18,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    color: brand.textMuted,
  },
  valueMax: {
    fontSize: 14,
    fontFamily: brand.fontBody,
    fontWeight: "400",
    color: brand.textMuted,
  },
  valueMaxCompact: {
    fontSize: 12,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  badgeTextCompact: {
    fontSize: 9,
  },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
  barWrap: {
    marginTop: 8,
  },
  passLabelRow: {
    height: 14,
    position: "relative",
    marginBottom: 2,
  },
  passLabel: {
    position: "absolute",
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textMuted,
  },
});
