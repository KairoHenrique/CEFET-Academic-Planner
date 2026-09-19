"use client";

import Script from "next/script";
import { resolveAdsenseClientId } from "@/lib/ads/web-ad-config";

/** Carrega AdSense so com client ID publico configurado. */
export function AdSenseLoader() {
  const client = resolveAdsenseClientId();
  if (!client) return null;
  return (
    <Script
      id="adsense-loader"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      crossOrigin="anonymous"
    />
  );
}
