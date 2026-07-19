import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  ScrollView,
  State,
  type PinchGestureHandlerGestureEvent,
  type PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import * as ScreenOrientation from "expo-screen-orientation";
import { brand } from "../theme/brand";
import { Card } from "./cards";
import { Icon } from "./Icon";
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
  expandable?: boolean;
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

/** Tamanhos fixos — zoom só escala o canvas, não muda tipografia/layout. */
const NODE_W = 168;
const NODE_H = 88;
const PAD = 40;
const LABEL_H = 34;
const COL_STEP = 210;
const ROW_STEP = 100;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.4;
const DEFAULT_ZOOM = 0.85;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

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

async function unlockOrientation(): Promise<void> {
  try {
    await ScreenOrientation.unlockAsync();
  } catch {
    /* ignore */
  }
}

async function lockPortrait(): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
  } catch {
    /* ignore */
  }
}

/** Grafo mobile — pinça para zoom (layout/tipografia fixos) + tela cheia. */
export function CourseMapGrafo({
  nodes,
  edges,
  statusLabels,
  layout,
  expandable = true,
}: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [fullscreen, setFullscreen] = useState(false);
  const baseZoomRef = useRef(DEFAULT_ZOOM);
  const pinchRef = useRef(null);

  const landscape = winW > winH;

  useEffect(() => {
    if (!fullscreen) return;
    void unlockOrientation();
    return () => {
      void lockPortrait();
    };
  }, [fullscreen]);

  /** Posições calculadas uma vez — independentes do zoom. */
  const positioned = useMemo(() => {
    const colGap = layout?.columnGap ?? 280;
    const rowGap = layout?.rowGap ?? 110;
    const xScale = COL_STEP / colGap;
    const yScale = ROW_STEP / rowGap;

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
        x = ((n.data.period || 1) - 1) * COL_STEP;
        y = Math.max(0, index) * ROW_STEP;
      }
      return { ...n, x: PAD + x, y: PAD + LABEL_H + y };
    });
  }, [nodes, layout]);

  const periods = useMemo(() => {
    const map = new Map<number, number>();
    for (const n of nodes) {
      const p = n.data.period || 1;
      map.set(p, (map.get(p) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [nodes]);

  const canvasW = useMemo(() => {
    const maxX = positioned.reduce((m, n) => Math.max(m, n.x + NODE_W), 360);
    return maxX + PAD;
  }, [positioned]);

  const canvasH = useMemo(() => {
    const maxY = positioned.reduce((m, n) => Math.max(m, n.y + NODE_H), 280);
    return maxY + PAD;
  }, [positioned]);

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

  const embeddedHeight = Math.min(520, Math.max(340, winH * 0.52));
  const fullHeight = Math.max(
    240,
    winH -
      (landscape
        ? insets.top + insets.bottom + 48
        : insets.top + insets.bottom + 56)
  );

  function closeFullscreen() {
    setFullscreen(false);
    void lockPortrait();
  }

  function openFullscreen() {
    setFullscreen(true);
  }

  function onPinchEvent(event: PinchGestureHandlerGestureEvent) {
    const next = clampZoom(baseZoomRef.current * event.nativeEvent.scale);
    setZoom(next);
  }

  function onPinchStateChange(event: PinchGestureHandlerStateChangeEvent) {
    if (event.nativeEvent.state === State.BEGAN) {
      baseZoomRef.current = zoom;
      return;
    }
    if (
      event.nativeEvent.oldState === State.ACTIVE ||
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      const next = clampZoom(
        baseZoomRef.current * event.nativeEvent.scale
      );
      baseZoomRef.current = next;
      setZoom(next);
    }
  }

  /** Escala visual a partir do canto superior esquerdo. */
  const scaledW = canvasW * zoom;
  const scaledH = canvasH * zoom;
  const scaleTransform = [
    { translateX: (scaledW - canvasW) / 2 },
    { translateY: (scaledH - canvasH) / 2 },
    { scale: zoom },
  ];

  function renderCanvas(height: number, opts: { expandBtn: boolean }) {
    return (
      <GestureHandlerRootView
        style={[
          styles.canvasShell,
          fullscreen && styles.canvasShellFs,
          { height },
        ]}
      >
        {opts.expandBtn ? (
          <Pressable
            style={styles.expandFab}
            onPress={openFullscreen}
            accessibilityLabel="Abrir grafo em tela cheia"
            hitSlop={8}
          >
            <Icon name="expand" size={16} color={brand.gold} />
          </Pressable>
        ) : null}

        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <View style={styles.flex} collapsable={false}>
            <ScrollView
              horizontal
              nestedScrollEnabled
              simultaneousHandlers={pinchRef}
              showsHorizontalScrollIndicator={false}
              style={styles.flex}
              contentContainerStyle={{ minHeight: height - 8 }}
            >
              <ScrollView
                nestedScrollEnabled
                simultaneousHandlers={pinchRef}
                showsVerticalScrollIndicator={false}
                style={styles.flex}
              >
                <View style={{ width: scaledW, height: scaledH }}>
                  <View
                    style={{
                      width: canvasW,
                      height: canvasH,
                      transform: scaleTransform,
                    }}
                  >
                    <Svg
                      width={canvasW}
                      height={canvasH}
                      style={StyleSheet.absoluteFill}
                    >
                      <Rect
                        x={0}
                        y={0}
                        width={canvasW}
                        height={canvasH}
                        fill="#021024"
                      />
                      {edges.map((e) => {
                        const src = posById.get(e.source);
                        const tgt = posById.get(e.target);
                        if (!src || !tgt) return null;

                        const x1 = src.x + NODE_W;
                        const y1 = src.y + NODE_H / 2;
                        const x2 = tgt.x;
                        const y2 = tgt.y + NODE_H / 2;
                        const d = edgePath(x1, y1, x2, y2);

                        let stroke = COLOR_REST;
                        let width = 1.5;
                        let opacity = 1;
                        if (selectedId) {
                          if (e.target === selectedId) {
                            // Entrada: o que esta disciplina exige
                            stroke = e.kind === "co" ? COLOR_CO : COLOR_PRE;
                            width = 2.5;
                          } else if (e.source === selectedId) {
                            // Saída: o que ela libera — co NUNCA verde
                            stroke =
                              e.kind === "co" ? COLOR_CO : COLOR_UNLOCK;
                            width = 2.5;
                          } else {
                            stroke = COLOR_DIM;
                            opacity = 0.35;
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
                                ? "5 5"
                                : undefined
                            }
                          />
                        );
                      })}
                    </Svg>

                    {periods.map(([period, count]) => {
                      const sample = positioned.find(
                        (n) => n.data.period === period
                      );
                      if (!sample) return null;
                      return (
                        <View
                          key={`pl-${period}`}
                          style={[
                            styles.periodPill,
                            {
                              left: sample.x,
                              top: sample.y - LABEL_H - 2,
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
                      const dimmed =
                        selectedId != null && !related.has(node.id);
                      const focused = selectedId === node.id;
                      const relatedNode =
                        selectedId != null &&
                        related.has(node.id) &&
                        !focused;

                      return (
                        <Pressable
                          key={node.id}
                          onPress={() =>
                            setSelectedId((cur) =>
                              cur === node.id ? null : node.id
                            )
                          }
                          style={[
                            styles.node,
                            {
                              left: node.x,
                              top: node.y,
                              width: NODE_W,
                              height: NODE_H,
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
                          <View
                            style={[styles.accent, { backgroundColor: color }]}
                          />
                          <View style={styles.nodeInner}>
                            <View
                              style={[
                                styles.nodeIcon,
                                {
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
                                  style={[
                                    styles.nodeDot,
                                    { backgroundColor: color },
                                  ]}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.nodeName,
                                  status === "locked" && styles.nodeNameLocked,
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
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        </PinchGestureHandler>
      </GestureHandlerRootView>
    );
  }

  return (
    <>
      <Card tight>
        <SectionHeader title="Grafo de Pré-requisitos" icon="map" />

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
          Toque numa disciplina para ver ligações. Em tela cheia, deite o
          celular para ver mais largo.
        </Text>
      </Card>

      {!fullscreen
        ? renderCanvas(embeddedHeight, { expandBtn: expandable })
        : null}

      <Modal
        visible={fullscreen}
        animationType="fade"
        presentationStyle="fullScreen"
        hardwareAccelerated
        onRequestClose={closeFullscreen}
        supportedOrientations={[
          "portrait",
          "landscape",
          "landscape-left",
          "landscape-right",
        ]}
      >
        <View
          style={[
            styles.fullscreenRoot,
            {
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: Math.max(insets.bottom, 8),
              paddingLeft: landscape ? Math.max(insets.left, 8) : 12,
              paddingRight: landscape ? Math.max(insets.right, 8) : 12,
            },
          ]}
        >
          <StatusBar hidden={landscape} />
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              Grafo{landscape ? " · horizontal" : " · tela cheia"}
            </Text>
            <Pressable
              style={styles.closeFsBtn}
              onPress={closeFullscreen}
              accessibilityLabel="Fechar tela cheia"
              hitSlop={8}
            >
              <Icon name="compress" size={16} color={brand.gold} />
            </Pressable>
          </View>
          {fullscreen ? renderCanvas(fullHeight, { expandBtn: false }) : null}
        </View>
      </Modal>
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
    backgroundColor: "#021024",
    marginBottom: brand.space4,
    overflow: "hidden",
    position: "relative",
  },
  canvasShellFs: {
    marginBottom: 0,
    flex: 1,
  },
  flex: { flex: 1 },
  expandFab: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 40,
    width: 36,
    height: 36,
    borderRadius: brand.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,28,56,0.92)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
    minHeight: 40,
  },
  fullscreenTitle: {
    flex: 1,
    color: brand.text,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    fontSize: 15,
  },
  closeFsBtn: {
    width: 36,
    height: 36,
    borderRadius: brand.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,28,56,0.92)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
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
    backgroundColor: "rgba(0,36,72,0.98)",
  },
  nodeCurrent: {
    borderColor: "rgba(58,160,232,0.55)",
  },
  nodeFocus: {
    borderColor: brand.gold,
    zIndex: 15,
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
    width: 26,
    height: 26,
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
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    lineHeight: 15,
  },
  nodeNameLocked: {
    color: brand.textSecondary,
  },
  nodeMeta: {
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
});
