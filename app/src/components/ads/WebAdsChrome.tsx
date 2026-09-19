"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isWebAdPathBlocked,
  resolveAdsenseSlotBottom,
  resolveAdsenseSlotSidebar,
} from "@/lib/ads/web-ad-config";
import { useAdsFreeClient } from "@/components/ads/useAdsFreeClient";
import { WebAdSlot } from "@/components/ads/WebAdSlot";

const DISMISS_KEY = "acme.hub.webAds.bottomDismissedUntil";
const DISMISS_MS = 6 * 60 * 60 * 1000;

function readDismissedUntil(): number {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Ads web:
 * - Desktop largo: rails fixos nas margens vazias (nao alteram layout do app)
 * - Mobile web: faixa inferior dismissivel
 * - Remover ads so via /planos (ads_free); rails nao tem "Fechar"
 */
export function WebAdsChrome() {
  const pathname = usePathname() ?? "/";
  const { adsFree, loading } = useAdsFreeClient();
  const [bottomVisible, setBottomVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBottomVisible(Date.now() >= readDismissedUntil());
  }, []);

  const dismissBottom = useCallback(() => {
    const until = Date.now() + DISMISS_MS;
    try {
      sessionStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      /* ignore */
    }
    setBottomVisible(false);
  }, []);

  if (!mounted || loading || adsFree) return null;
  if (isWebAdPathBlocked(pathname)) return null;

  const bottomSlot = resolveAdsenseSlotBottom();
  const sideSlot = resolveAdsenseSlotSidebar();

  return (
    <>
      <aside className="web-ad-rail web-ad-rail--left" aria-label="Publicidade">
        <div className="web-ad-rail-inner">
          <WebAdSlot slot={sideSlot} format="rectangle" />
          <Link href="/planos" className="web-ad-rail-upsell">
            Remover anúncios →
          </Link>
        </div>
      </aside>

      <aside className="web-ad-rail web-ad-rail--right" aria-label="Publicidade">
        <div className="web-ad-rail-inner">
          <WebAdSlot slot={sideSlot} format="rectangle" />
          <Link href="/planos" className="web-ad-rail-upsell">
            Remover anúncios →
          </Link>
        </div>
      </aside>

      {bottomVisible ? (
        <div className="web-ad-bottom" role="complementary" aria-label="Publicidade">
          <div className="web-ad-bottom-inner">
            <WebAdSlot slot={bottomSlot} format="horizontal" />
            <div className="web-ad-bottom-actions">
              <Link href="/planos" className="web-ad-bottom-upsell">
                Sem anúncios
              </Link>
              <button
                type="button"
                className="web-ad-bottom-dismiss"
                onClick={dismissBottom}
                aria-label="Fechar anúncio por algumas horas"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
