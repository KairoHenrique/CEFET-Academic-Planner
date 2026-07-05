"use client";

import { Icon } from "@/components/ui/Icon";

interface AuthModeTabsProps {
  mode: "login" | "register";
  onChange: (mode: "login" | "register") => void;
  disabled?: boolean;
}

export function AuthModeTabs({ mode, onChange, disabled }: AuthModeTabsProps) {
  return (
    <div
      className="auth-mode-tabs"
      role="tablist"
      aria-label="Modo de autenticação"
    >
      <button
        type="button"
        role="tab"
        id="auth-tab-login"
        aria-selected={mode === "login"}
        aria-controls="auth-panel-login"
        className={`auth-mode-tab ${mode === "login" ? "auth-mode-tab--active" : ""}`}
        onClick={() => onChange("login")}
        disabled={disabled}
      >
        <Icon name="unlock" size={15} aria-hidden />
        <span className="auth-mode-tab-label">Entrar</span>
      </button>
      <button
        type="button"
        role="tab"
        id="auth-tab-register"
        aria-selected={mode === "register"}
        aria-controls="auth-panel-register"
        className={`auth-mode-tab ${mode === "register" ? "auth-mode-tab--active" : ""}`}
        onClick={() => onChange("register")}
        disabled={disabled}
      >
        <Icon name="plus" size={15} aria-hidden />
        <span className="auth-mode-tab-label">Criar conta</span>
      </button>
    </div>
  );
}
