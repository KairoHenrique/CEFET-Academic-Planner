"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useEffect, useState } from "react";

interface MaintenancePolicy {
  enabled: boolean;
  pages: string;
  message: string;
}

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [percent, setPercent] = useState(0);
  const [policy, setPolicy] = useState<MaintenancePolicy | null>(null);

  useEffect(() => {
    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.policy) {
          setPolicy(data.policy);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setPercent(p => (p >= 99 ? 0 : p + 1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted || !policy || !policy.enabled) {
    return <>{children}</>;
  }

  // Verificar se o pathname atual corresponde ao padrão em `pages`
  const paths = policy.pages.split(",").map(p => p.trim()).filter(Boolean);
  
  // Se não estiver na rota de dev (para não trancar o painel dev!)
  if (pathname?.startsWith("/dev")) {
    return <>{children}</>;
  }

  let shouldShow = false;
  if (policy.pages === "/*" || policy.pages === "*") {
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
    return <>{children}</>;
  }

  return (
    <div style={{ padding: "24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div className="card" style={{ width: "100%", maxWidth: "450px", position: "relative", overflow: "hidden" }}>
        <header className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Icon name="warning" size={18} style={{ color: 'var(--gold, #d4af37)' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--gold, #d4af37)', margin: 0 }}>
            Página em Manutenção
          </h2>
        </header>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "24px", textAlign: "center" }}>
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
            {policy.message}
          </p>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
