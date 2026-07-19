import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { brand } from "../theme/brand";
import { Card } from "./cards";
import { SectionHeader } from "./SectionHeader";

export type GrafoNode = {
  id: string;
  position?: { x: number; y: number };
  data: {
    code: string;
    name: string;
    shortLabel: string;
    status: string;
    period: number;
    ch: number;
    blockedBy?: string;
    chRemaining?: number;
  };
};

export type GrafoEdge = {
  id: string;
  source: string;
  target: string;
  kind: "pre" | "co";
  strokeStyle?: "solid" | "dashed";
};

export type GrafoLayout = {
  columnGap: number;
  rowGap: number;
  nodeWidth: number;
};

type Props = {
  nodes: GrafoNode[];
  edges: GrafoEdge[];
  statusLabels: Record<string, string>;
  layout?: GrafoLayout;
};

const COLOR_PRE = "#4a9fd4";
const COLOR_CO = "#e8c66a";
const COLOR_UNLOCK = "#3fb950";
const COLOR_REST = "rgba(150,178,214,0.28)";
const COLOR_DIM = "rgba(150,170,195,0.06)";

const STATUS_COLOR: Record<string, string> = {
  done: brand.success,
  current: brand.jerseyLight,
  unlocked: brand.gold,
  locked: brand.danger,
};

const STATUS_ICON: Record<string, string> = {
  done: "✓",
  current: "◎",
  unlocked: "○",
  locked: "✕",
};

const BASE_NODE_W = 168;
const BASE_NODE_H = 88;
const PAD = 40;
const LABEL_H = 34;

function metaLabel(data: GrafoNode["data"]): string {
  if (data.status === "locked" && data.blockedBy === "ch" && data.chRemaining) {
    return `Faltam ${data.chRemaining}h`;
  }
  return `${data.ch}h · P${data.period}`;
}

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.42);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** Grafo mobile F28 — canvas + glow + arestas SVG + zoom ±. */
export function CourseMapGrafo({
  nodes,
  edges,
  statusLabels,
  layout,
}: Props) {
  const { height: winH } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.82);

  const nodeW = BASE_NODE_W * zoom;
  const nodeH = BASE_NODE_H * zoom;

  const positioned = useMemo(() => {
    const colGap = layout?.columnGap ?? 280;
    const rowGap = layout?.rowGap ?? 110;
    const xScale = (210 * zoom) / colGap;
    const yScale = (100 * zoom) / rowGap;
    const pad = PAD * zoom;
    const labelH = LABEL_H * zoom;

    const byPeriod = new Map<number, GrafoNode[]>();
    for (const n of nodes) {
      const p = n.data.period || 1;
      const list = byPeriod.get(p) ?? [];
      list.push(n);
      byPeriod.set(p, list);
    }

    return nodes.map((n) => {
      let x: number;
      let y: number;
      if (n.position) {
        x = n.position.x * xScale;
        y = n.position.y * yScale;
      } else {
        const list = byPeriod.get(n.data.period) ?? [];
        const index = list.findIndex((item) => item.id === n.id);
        x = ((n.data.period || 1) - 1) * 210 * zoom;
        y = Math.max(0, index) * 100 * zoom;
      }
      return { ...n, x: pad + x, y: pad + labelH + y };
    });
  }, [nodes, layout, zoom]);

  const periods = useMemo(() => {
    const map = new Map<number, number>();
    for (const n of nodes) {
      const p = n.data.period || 1;
      map.set(p, (map.get(p) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [nodes]);

  const canvasW = useMemo(() => {
    const maxX = positioned.reduce((m, n) => Math.max(m, n.x + nodeW), 360);
    return maxX + PAD * zoom;
  }, [positioned, nodeW, zoom]);

  const canvasH = useMemo(() => {
    const maxY = positioned.reduce((m, n) => Math.max(m, n.y + nodeH), 280);
    return maxY + PAD * zoom;
  }, [positioned, nodeH, zoom]);

  const posById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of positioned) map.set(n.id, { x: n.x, y: n.y });
    return map;
  }, [positioned]);

  const related = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>([selectedId]);
    for (const e of edges) {
      if (e.source === selectedId || e.target === selectedId) {
        set.add(e.source);
        set.add(e.target);
      }
    }
    return set;
  }, [selectedId, edges]);

  const dots = useMemo(() => {
    const step = 28 * zoom;
    const items: { cx: number; cy: number; key: string }[] = [];
    const cols = Math.min(80, Math.ceil(canvasW / step));
    const rows = Math.min(60, Math.ceil(canvasH / step));
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        items.push({
          cx: step / 2 + i * step,
          cy: step / 2 + j * step,
          key: `${i}-${j}`,
        });
      }
    }
    return items;
  }, [canvasW, canvasH, zoom]);

  const canvasHeight = Math.min(560, Math.max(360, winH * 0.58));

  return (
    <>
      <Card tight>
        <SectionHeader
          title="Grafo de Pré-requisitos"
          icon="map"
        />

        <View style={styles.legend}>
          {(
            [
              ["done", "Concluída"],
              ["current", "Cursando"],
              ["unlocked", "Desbloqueada"],
              ["locked", "Trancada"],
            ] as const
          ).map(([k, fallback]) => (
            <View key={k} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: STATUS_COLOR[k] }]}
              />
              <Text style={styles.legendText}>
                {statusLabels[k] ?? fallback}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.lineLegend}>
          <View style={styles.linePre} />
          <Text style={styles.legendText}>Pré-requisito</Text>
          <View style={styles.sep} />
          <View style={styles.lineCo} />
          <Text style={styles.legendText}>Co-requisito</Text>
        </View>

        <Text style={styles.hint}>
          Toque numa disciplina para ver pré-requisitos e o que ela desbloqueia.
        </Text>
      </Card>

      <View style={[styles.canvasShell, { height: canvasHeight }]}>
        <LinearGradient
          colors={["rgba(0,88,168,0.32)", "transparent"]}
          style={styles.canvasGlow}
          pointerEvents="none"
        />

        <View style={styles.controls}>
          <Pressable
            style={styles.ctrlBtn}
            onPress={() =>
              setZoom((z) => Math.max(0.55, +(z - 0.1).toFixed(2)))
            }
          >
            <Text style={styles.ctrlText}>−</Text>
          </Pressable>
          <Pressable
            style={styles.ctrlBtn}
            onPress={() =>
              setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))
            }
          >
            <Text style={styles.ctrlText}>+</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.flex}
        >
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.flex}
          >
            <View style={{ width: canvasW, height: canvasH }}>
              <Svg
                width={canvasW}
                height={canvasH}
                style={StyleSheet.absoluteFill}
              >
                <Defs>
                  <RadialGradient id="bgGlow" cx="50%" cy="0%" r="70%">
                    <Stop
                      offset="0%"
                      stopColor="rgb(0,88,168)"
                      stopOpacity="0.38"
                    />
                    <Stop
                      offset="100%"
                      stopColor="rgb(2,16,36)"
                      stopOpacity="0"
                    />
                  </RadialGradient>
                </Defs>
                <Rect
                  x={0}
                  y={0}
                  width={canvasW}
                  height={canvasH}
                  fill="rgba(2,16,36,0.95)"
                />
                <Rect
                  x={0}
                  y={0}
                  width={canvasW}
                  height={canvasH}
                  fill="url(#bgGlow)"
                />
                {dots.map((d) => (
                  <Circle
                    key={d.key}
                    cx={d.cx}
                    cy={d.cy}
                    r={1.15 * zoom}
                    fill="rgba(232,198,106,0.11)"
                  />
                ))}

                {edges.map((e) => {
                  const src = posById.get(e.source);
                  const tgt = posById.get(e.target);
                  if (!src || !tgt) return null;

                  const x1 = src.x + nodeW;
                  const y1 = src.y + nodeH / 2;
                  const x2 = tgt.x;
                  const y2 = tgt.y + nodeH / 2;
                  const d = edgePath(x1, y1, x2, y2);

                  let stroke = COLOR_REST;
                  let width = 1.4 * zoom;
                  let opacity = 1;
                  if (selectedId) {
                    if (e.target === selectedId) {
                      stroke = e.kind === "co" ? COLOR_CO : COLOR_PRE;
                      width = 2.75 * zoom;
                    } else if (e.source === selectedId) {
                      stroke = COLOR_UNLOCK;
                      width = 2.75 * zoom;
                    } else {
                      stroke = COLOR_DIM;
                      opacity = 0.4;
                    }
                  } else if (e.kind === "co") {
                    stroke = "rgba(232,198,106,0.38)";
                  }

                  return (
                    <Path
                      key={e.id}
                      d={d}
                      stroke={stroke}
                      strokeWidth={width}
                      fill="none"
                      opacity={opacity}
                      strokeDasharray={
                        e.kind === "co" || e.strokeStyle === "dashed"
                          ? `${5 * zoom} ${5 * zoom}`
                          : undefined
                      }
                    />
                  );
                })}
              </Svg>

              {periods.map(([period, count]) => {
                const sample = positioned.find((n) => n.data.period === period);
                if (!sample) return null;
                return (
                  <View
                    key={`pl-${period}`}
                    style={[
                      styles.periodPill,
                      {
                        left: sample.x,
                        top: sample.y - LABEL_H * zoom - 2,
                        transform: [{ scale: Math.min(1, zoom + 0.05) }],
                      },
                    ]}
                  >
                    <Text style={styles.periodLabel}>P{period}</Text>
                    <View style={styles.periodCount}>
                      <Text style={styles.periodCountText}>{count}</Text>
                    </View>
                  </View>
                );
              })}

              {positioned.map((node) => {
                const status = node.data.status;
                const color = STATUS_COLOR[status] ?? brand.textMuted;
                const dimmed = selectedId != null && !related.has(node.id);
                const focused = selectedId === node.id;
                const relatedNode =
                  selectedId != null && related.has(node.id) && !focused;

                return (
                  <Pressable
                    key={node.id}
                    onPress={() =>
                      setSelectedId((cur) => (cur === node.id ? null : node.id))
                    }
                    style={[
                      styles.node,
                      {
                        left: node.x,
                        top: node.y,
                        width: nodeW,
                        height: nodeH,
                        opacity: dimmed
                          ? 0.28
                          : status === "locked"
                            ? 0.72
                            : 1,
                      },
                      status === "current" && styles.nodeCurrent,
                      focused && styles.nodeFocus,
                      relatedNode && styles.nodeRelated,
                    ]}
                  >
                    <LinearGradient
                      colors={["rgba(0,48,92,0.97)", "rgba(0,28,58,0.99)"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.accent, { backgroundColor: color }]} />
                    <View style={styles.nodeInner}>
                      <View
                        style={[
                          styles.nodeIcon,
                          {
                            width: 26 * Math.min(1, zoom + 0.1),
                            height: 26 * Math.min(1, zoom + 0.1),
                            backgroundColor:
                              status === "done"
                                ? brand.successBg
                                : status === "current"
                                  ? "rgba(58,160,232,0.16)"
                                  : status === "unlocked"
                                    ? "rgba(232,198,106,0.16)"
                                    : "rgba(255,255,255,0.06)",
                          },
                        ]}
                      >
                        <Text style={[styles.nodeIconText, { color }]}>
                          {STATUS_ICON[status] ?? "·"}
                        </Text>
                      </View>
                      <View style={styles.nodeBody}>
                        <View style={styles.nodeTop}>
                          <Text style={styles.nodeCode} numberOfLines={1}>
                            {node.data.shortLabel || node.data.code}
                          </Text>
                          <View
                            style={[styles.nodeDot, { backgroundColor: color }]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.nodeName,
                            status === "locked" && styles.nodeNameLocked,
                            { fontSize: 11.5 * Math.min(1, zoom + 0.12) },
                          ]}
                          numberOfLines={2}
                        >
                          {node.data.name}
                        </Text>
                        <Text style={styles.nodeMeta}>
                          {metaLabel(node.data)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  lineLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  linePre: {
    width: 22,
    borderTopWidth: 2,
    borderTopColor: brand.jerseyLight,
  },
  lineCo: {
    width: 22,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderTopColor: brand.gold,
  },
  sep: {
    width: 1,
    height: 16,
    backgroundColor: brand.border,
    marginHorizontal: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  canvasShell: {
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(2,16,36,0.95)",
    marginBottom: brand.space4,
    overflow: "hidden",
    position: "relative",
    elevation: 10,
    shadowColor: "#001428",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  canvasGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 0,
  },
  flex: { flex: 1 },
  controls: {
    position: "absolute",
    right: 10,
    bottom: 10,
    zIndex: 30,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: "hidden",
    backgroundColor: "rgba(0,32,72,0.94)",
    elevation: 6,
  },
  ctrlBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brand.border,
  },
  ctrlText: {
    color: "#dce7f5",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  periodPill: {
    position: "absolute",
    zIndex: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    backgroundColor: "rgba(0,32,72,0.92)",
  },
  periodLabel: {
    color: brand.gold200,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  periodCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: "rgba(232,198,106,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  periodCountText: {
    color: brand.gold100,
    fontSize: 10,
    fontWeight: "700",
  },
  node: {
    position: "absolute",
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: "hidden",
    zIndex: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  nodeCurrent: {
    borderColor: "rgba(58,160,232,0.55)",
    shadowColor: brand.jerseyLight,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  nodeFocus: {
    borderColor: brand.gold,
    shadowColor: brand.gold,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    zIndex: 15,
    elevation: 14,
  },
  nodeRelated: {
    borderColor: brand.borderEmphasis,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 2,
  },
  nodeInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 9,
    paddingBottom: 9,
    paddingRight: 10,
    paddingLeft: 12,
    zIndex: 2,
  },
  nodeIcon: {
    borderRadius: brand.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeIconText: {
    fontSize: 12,
    fontWeight: "800",
  },
  nodeBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nodeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  nodeCode: {
    flex: 1,
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: brand.gold,
  },
  nodeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  nodeName: {
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    lineHeight: 15,
  },
  nodeNameLocked: {
    color: brand.textSecondary,
  },
  nodeMeta: {
    fontSize: 10.5,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
});
