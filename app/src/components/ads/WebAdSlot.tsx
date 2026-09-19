"use client";

import { useEffect, useRef } from "react";
import { resolveAdsenseClientId } from "@/lib/ads/web-ad-config";

type Props = {
  slot: string | null;
  format?: "horizontal" | "rectangle" | "auto";
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Slot AdSense. Sem client/slot mostra placeholder.
 * Formato default "auto" (igual ao snippet do painel AdSense).
 */
export function WebAdSlot({ slot, format = "auto", className }: Props) {
  const pushed = useRef(false);
  const client = resolveAdsenseClientId();

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* Adblock / ainda carregando */
    }
  }, [client, slot]);

  if (!client || !slot) {
    return (
      <div
        className={`web-ad-placeholder web-ad-placeholder--${format === "horizontal" ? "horizontal" : "rectangle"} ${className ?? ""}`}
        aria-hidden
      >
        <span>Espaco publicitario</span>
      </div>
    );
  }

  const adFormat =
    format === "horizontal"
      ? "horizontal"
      : format === "rectangle"
        ? "rectangle"
        : "auto";

  return (
    <ins
      className={`adsbygoogle web-ad-ins web-ad-ins--${format === "horizontal" ? "horizontal" : "rectangle"} ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}
