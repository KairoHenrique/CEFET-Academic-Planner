"use client";

import { useEffect, useRef, useState } from "react";
import { getSyncCredentials } from "@/lib/auth/credentials";
import { buildInitials } from "@/lib/perfil/build-initials";
import { usePerfil } from "@/hooks/usePerfil";
import type { SyncAutoIntervalMinutes } from "@/lib/sync/sync-preferences";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function ProfileMenu() {
  const { data, isLoading, updatePreferences } = usePerfil();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const profile = data?.profile;
  const sync = data?.sync;
  const credentials = getSyncCredentials();
  const initials =
    profile?.initials ??
    (credentials?.username ? buildInitials(credentials.username) : "??");

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleToggleAuto = async () => {
    if (!sync || saving) return;
    setSaving(true);
    try {
      await updatePreferences({ syncAutoEnabled: !sync.autoEnabled });
    } finally {
      setSaving(false);
    }
  };

  const handleIntervalChange = async (value: SyncAutoIntervalMinutes) => {
    if (!sync || saving || sync.intervalMinutes === value) return;
    setSaving(true);
    try {
      await updatePreferences({ syncIntervalMinutes: value });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-menu-root" ref={rootRef}>
      <button
        type="button"
        className="navbar-avatar profile-menu-trigger"
        title="Perfil e configurações"
        aria-label="Abrir menu de perfil"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        {initials}
      </button>

      {open && (
        <div className="profile-menu-panel" role="dialog" aria-label="Perfil e configurações">
          <header className="profile-menu-header">
            <div className="profile-menu-avatar-lg">{initials}</div>
            <div>
              <p className="profile-menu-name">
                {profile?.nome ?? "Aguardando sync"}
              </p>
              <p className="profile-menu-meta">
                Matrícula:{" "}
                <strong>{profile?.matricula ?? "—"}</strong>
              </p>
              {!profile && credentials?.username && (
                <p className="profile-menu-meta profile-menu-meta-muted">
                  CPF: {formatCpf(credentials.username)}
                </p>
              )}
              {profile?.curso && (
                <p className="profile-menu-meta profile-menu-meta-muted">
                  {profile.curso}
                </p>
              )}
            </div>
          </header>

          <section className="profile-menu-section">
            <h3 className="profile-menu-section-title">Sincronização</h3>
            <label className="profile-menu-toggle">
              <span>Sync automático com SIGAA</span>
              <input
                type="checkbox"
                checked={sync?.autoEnabled ?? false}
                disabled={isLoading || saving}
                onChange={() => void handleToggleAuto()}
              />
            </label>
            <p className="profile-menu-hint">
              Intervalo mínimo de {sync?.minIntervalMinutes ?? 5} min entre syncs
              (proteção ao SIGAA).
            </p>
            {sync?.autoEnabled && (
              <div className="profile-menu-field">
                <label htmlFor="sync-interval">Repetir a cada</label>
                <select
                  id="sync-interval"
                  value={sync.intervalMinutes}
                  disabled={isLoading || saving}
                  onChange={(event) =>
                    void handleIntervalChange(
                      Number(event.target.value) as SyncAutoIntervalMinutes
                    )
                  }
                >
                  {sync.intervalOptions.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </div>
            )}
            {sync?.lastSyncAt && (
              <p className="profile-menu-hint">
                Último sync:{" "}
                {new Date(sync.lastSyncAt).toLocaleString("pt-BR")}
              </p>
            )}
          </section>

          <p className="profile-menu-footer">
            Notificações por e-mail — em breve (F36)
          </p>
        </div>
      )}
    </div>
  );
}
