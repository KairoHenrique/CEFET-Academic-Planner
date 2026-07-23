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
      className="fixed bottom-0 left-0 right-0 z-[40] flex flex-col items-center justify-center p-4"
      style={{
        top: "72px", // Fica abaixo da Navbar (que normalmente tem 72px)
        backgroundColor: "rgba(0, 16, 32, 0.98)", // Sem blur, apenas cor sólida escura para não lagar
      }}
    >
      <div 
        className="max-w-md w-full rounded-2xl p-8 border text-center shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: "rgba(10, 25, 47, 0.95)",
          borderColor: "rgba(0, 255, 170, 0.3)",
          boxShadow: "0 0 40px rgba(0, 255, 170, 0.15)"
        }}
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 opacity-10 rounded-full"
          style={{ backgroundColor: "var(--primary-color, #00ffa6)" }}
        />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Bolinha girando */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-slate-800 animate-spin"
              style={{ borderTopColor: "var(--primary-color, #00ffa6)", animationDuration: "1.5s" }}
            />
            {/* Texto de porcentagem (falso para dar feedback visual) */}
            <div className="flex flex-col items-center mt-1">
              <Icon name="sync" size={16} style={{ color: "var(--primary-color, #00ffa6)" }} className="mb-1" />
              <span className="text-sm font-bold text-[var(--primary-color)]">{percent}%</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
              Essa página está em manutenção
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
