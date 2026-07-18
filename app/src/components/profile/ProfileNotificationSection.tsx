"use client";

import { useEffect, useId, useState } from "react";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

const PREF_OPTIONS: Array<{
  key: keyof NotificationPreferences;
  label: string;
  hint: string;
}> = [
  { key: "tasks", label: "Novas tarefas", hint: "Portal" },
  { key: "grades", label: "Notas", hint: "SIGAA" },
  { key: "taskReminders", label: "Prazos", hint: "24h e 1h antes" },
  { key: "calendarReminders", label: "Eventos", hint: "Cadastro, 1 dia antes e no dia" },
  { key: "classReminders", label: "Aulas", hint: "30 min antes" },
  { key: "integralizacaoAlerts", label: "Integralização", hint: "Marcos de CH" },
  { key: "academicDateAlerts", label: "Datas acadêmicas", hint: "Nova data, 1 dia antes e no dia" },
];

interface ProfilePrefToggleProps {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}

function ProfilePrefToggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: ProfilePrefToggleProps) {
  const inputId = useId();

  return (
    <label className="profile-pref-item" htmlFor={inputId}>
      <span className="profile-pref-item-copy">
        <span className="profile-pref-item-label">{label}</span>
        <span className="profile-pref-item-hint">{hint}</span>
      </span>
      <span className="profile-pref-switch-wrap">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="profile-pref-switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="profile-pref-switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}

interface ProfileNotificationSectionProps {
  preferences: NotificationPreferences;
  isSaving: boolean;
  onToggle: (key: keyof NotificationPreferences, enabled: boolean) => void;
}

export function ProfileNotificationSection({
  preferences,
  isSaving,
  onToggle,
}: ProfileNotificationSectionProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferences, enabled: boolean) => {
    setLocalPrefs((current) => ({ ...current, [key]: enabled }));
    onToggle(key, enabled);
  };

  return (
    <section
      className="profile-modal-section profile-notifications-section"
      aria-labelledby="profile-notifications-title"
    >
      <h3 id="profile-notifications-title" className="profile-modal-section-title">
        Notificações
      </h3>
      <div className="profile-pref-panel">
        {PREF_OPTIONS.map((option) => (
          <ProfilePrefToggle
            key={option.key}
            label={option.label}
            hint={option.hint}
            checked={localPrefs[option.key]}
            disabled={isSaving}
            onChange={(enabled) => handleToggle(option.key, enabled)}
          />
        ))}
      </div>
    </section>
  );
}
