"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useEffect, useState } from "react";

interface MaintenanceOverlayProps {
  enabled: boolean;
  pages: string;
  message: string;
}

export function MaintenanceOverlay({ enabled, pages, message }: MaintenanceOverlayProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setPercent(p => (p >= 99 ? 0 : p + 1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted || !enabled) {
    return null;
  }

  // Verificar se o pathname atual corresponde ao padrão em `pages`
  // Ex: "/*" ou "/simulador, /mapa"
  const paths = pages.split(",").map(p => p.trim()).filter(Boolean);
  
  // Se não estiver na rota de dev (para não trancar o painel dev!)
  if (pathname?.startsWith("/dev")) {
    return null;
  }

  let shouldShow = false;
  if (pages === "/*" || pages === "*") {
    shouldShow = true;
  } else {
    shouldShow = paths.some(p => {
      if (p.endsWith("/*")) {
        return pathname?.startsWith(p.slice(0, -2));
      }
      return pathname === p;
    });
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <div 
      style={{
        position: "fixed",
        top: "72px",
        bottom: "0",
        left: "0",
        right: "0",
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(0, 8, 20, 0.85)", 
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"
      }}
    >
      <div className="modal-panel" style={{ width: "100%", maxWidth: "450px", position: "relative", overflow: "hidden" }}>
        <header className="modal-header">
          <div className="modal-header-main" style={{ width: "100%", justifyContent: "center" }}>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold, #d4af37)' }}>
              <Icon name="warning" size={18} />
              Página em Manutenção
            </h2>
          </div>
        </header>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "24px", textAlign: "center" }}>
          
          <div style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg 
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "spin 2s linear infinite" }}
              viewBox="0 0 50 50"
            >
              <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(212, 175, 55, 0.2)" strokeWidth="4" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--gold, #d4af37)" strokeWidth="4" strokeDasharray="30 100" strokeLinecap="round" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4px" }}>
              <Icon name="sync" size={18} style={{ color: "var(--gold, #d4af37)", marginBottom: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--gold, #d4af37)" }}>{percent}%</span>
            </div>
          </div>
          
          <p style={{ color: "var(--text-secondary, #9fb0c3)", fontSize: "0.9375rem", lineHeight: "1.6", margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
