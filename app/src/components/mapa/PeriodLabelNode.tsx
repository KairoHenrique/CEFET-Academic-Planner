"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

export interface PeriodLabelData {
  label: string;
  count: number;
  [key: string]: unknown;
}

export type PeriodLabelNodeType = Node<PeriodLabelData, "periodLabel">;

function PeriodLabelNodeComponent({ data }: NodeProps<PeriodLabelNodeType>) {
  return (
    <div className="cmap-period" aria-hidden>
      <span className="cmap-period__index">{data.label}</span>
      <span className="cmap-period__count">{data.count}</span>
    </div>
  );
}

export const PeriodLabelNode = memo(PeriodLabelNodeComponent);
