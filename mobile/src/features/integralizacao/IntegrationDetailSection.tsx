import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IntegralizacaoCategoryDetail } from "@acme/api-contracts";
import { brand } from "../../theme/brand";
import { Card } from "../../ui/cards";
import { Icon } from "../../ui/Icon";
import { ProgressBar } from "../../ui/ProgressBar";

type Props = {
  categories: IntegralizacaoCategoryDetail[];
  onRegisterClick: () => void;
  onGlossaryClick: () => void;
};

const ACCENT: Record<
  IntegralizacaoCategoryDetail["color"],
  { bar: string; soft: string; text: string }
> = {
  blue: {
    bar: brand.jerseySky,
    soft: "rgba(32,136,212,0.14)",
    text: "#7EC8F8",
  },
  gold: {
    bar: brand.gold400,
    soft: "rgba(212,168,67,0.14)",
    text: brand.gold200,
  },
  success: {
    bar: brand.success,
    soft: "rgba(63,185,80,0.14)",
    text: "#5FD068",
  },
  warning: {
    bar: brand.warning,
    soft: "rgba(210,153,34,0.14)",
    text: "#E8B84A",
  },
};

/**
 * Detalhamento F28 mobile — cards mais legíveis:
 * cor · título · % · grade 3 cols · barra full · badge manual.
 */
export function IntegrationDetailSection({
  categories,
  onRegisterClick,
  onGlossaryClick,
}: Props) {
  return (
    <Card tight style={styles.card}>
      <View style={styles.toolbar}>
        <View style={styles.header}>
          <Icon name="clipboard" size={16} color={brand.gold} />
          <Text style={styles.title}>Detalhamento de Horas</Text>
          <Pressable
            style={styles.helpBtn}
            onPress={onGlossaryClick}
            accessibilityLabel="Entenda suas horas. Abrir glossário de carga horária."
            hitSlop={8}
          >
            <Icon name="help-circle" size={16} color={brand.gold200} />
          </Pressable>
        </View>
        <Pressable style={styles.goldBtn} onPress={onRegisterClick}>
          <Icon name="plus" size={14} color="#1a1408" />
          <Text style={styles.goldBtnText}>Cadastrar Horas</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {categories.map((cat) => {
          const pct =
            cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
          const manualCount = cat.manualEntries?.length ?? 0;
          const accent = ACCENT[cat.color] ?? ACCENT.gold;
          const complete = cat.total > 0 && cat.pending <= 0;

          return (
            <View
              key={cat.label}
              style={[
                styles.rowCard,
                { borderLeftColor: accent.bar },
                complete && styles.rowCardComplete,
              ]}
            >
              <View style={styles.catTop}>
                <View style={styles.catTitleWrap}>
                  <View
                    style={[styles.dot, { backgroundColor: accent.bar }]}
                  />
                  <Text style={styles.catName} numberOfLines={2}>
                    {cat.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pctPill,
                    {
                      backgroundColor: accent.soft,
                      borderColor: accent.bar + "55",
                    },
                  ]}
                >
                  <Text style={[styles.pctPillText, { color: accent.text }]}>
                    {pct}%
                  </Text>
                </View>
              </View>

              {manualCount > 0 ? (
                <View style={styles.manualPill}>
                  <Text style={styles.manualPillText}>
                    {manualCount}{" "}
                    {manualCount === 1
                      ? "lançamento manual"
                      : "lançamentos manuais"}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metrics}>
                <Metric
                  label="Concluído"
                  value={`${cat.done}h`}
                  emphasize
                />
                <Metric label="Necessário" value={`${cat.total}h`} />
                <Metric
                  label="Pendente"
                  value={`${cat.pending}h`}
                  warn={cat.pending > 0}
                  mute={complete}
                />
              </View>

              <View style={styles.barBlock}>
                <ProgressBar percent={pct} tone="gold" height={10} />
                <Text style={styles.barCaption}>
                  {complete
                    ? "Categoria concluída"
                    : cat.pending > 0
                      ? `Faltam ${cat.pending}h nesta categoria`
                      : `${cat.done}h de ${cat.total}h`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function Metric({
  label,
  value,
  emphasize,
  warn,
  mute,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  warn?: boolean;
  mute?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          emphasize && styles.metricValueEmph,
          warn && styles.metricValueWarn,
          mute && styles.metricValueMute,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: brand.space3,
    padding: brand.space3,
  },
  toolbar: {
    gap: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(210,153,34,0.45)",
    backgroundColor: "rgba(210,153,34,0.08)",
  },
  goldBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    paddingHorizontal: 14,
  },
  goldBtnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  list: { gap: 12 },
  rowCard: {
    borderWidth: 1,
    borderColor: brand.border,
    borderLeftWidth: 3,
    borderRadius: brand.radiusMd,
    backgroundColor: "rgba(0,28,56,0.72)",
    padding: 14,
    gap: 12,
  },
  rowCardComplete: {
    borderColor: "rgba(63,185,80,0.28)",
    backgroundColor: "rgba(63,185,80,0.06)",
  },
  catTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  catTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  catName: {
    flex: 1,
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    lineHeight: 20,
  },
  pctPill: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pctPillText: {
    fontSize: 13,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
  },
  manualPill: {
    alignSelf: "flex-start",
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.35)",
    backgroundColor: "rgba(212,168,67,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  manualPillText: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: brand.textMuted,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 15,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textAlign: "center",
  },
  metricValueEmph: {
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.gold300,
    fontSize: 16,
  },
  metricValueWarn: {
    color: "#E8B84A",
  },
  metricValueMute: {
    color: brand.success,
  },
  barBlock: {
    gap: 6,
  },
  barCaption: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
});
