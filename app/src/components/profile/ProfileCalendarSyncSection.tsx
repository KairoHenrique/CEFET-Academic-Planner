"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfilePrefToggle } from "@/components/profile/ProfileNotificationSection";
import {
  ApiClientError,
  createCalendarFeedLink,
  getCalendarSyncSettings,
  patchCalendarSyncSettings,
  revokeCalendarFeedLink,
} from "@/lib/api/client";
import {
  CALENDAR_SYNC_CATEGORIES,
  type CalendarFeedLinkView,
  type CalendarSyncCategory,
  type CalendarSyncReminderMode,
  type CalendarSyncSettingsView,
  type PatchCalendarSyncSettingsBody,
} from "@/lib/calendar-sync/types";

const GOOGLE_CALENDAR_ADD_BY_URL = "https://calendar.google.com/calendar/u/0/r/settings/addbyurl";

const CATEGORY_COPY: Record<CalendarSyncCategory, { label: string; hint: string }> = {
  aulas: { label: "Aulas", hint: "Horários da grade" },
  tarefas: { label: "Tarefas", hint: "Prazos e avaliações do SIGAA" },
  eventos: { label: "Seus eventos", hint: "Provas e eventos criados por você" },
  academico: { label: "Calendário acadêmico", hint: "Matrícula, feriados…" },
};

const REMINDER_OPTIONS: Array<{ value: CalendarSyncReminderMode; label: string; hint: string }> = [
  { value: "padrao", label: "Padrão", hint: "Aula 15 min antes · prazos na véspera às 18h" },
  { value: "so_tarefas", label: "Só prazos", hint: "Tarefas, provas e seus eventos" },
  { value: "nenhum", label: "Nenhum", hint: "Sem alarmes na agenda" },
];

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function ProfileCalendarSyncSection() {
  const [settings, setSettings] = useState<CalendarSyncSettingsView | null>(null);
  const [feedLink, setFeedLink] = useState<CalendarFeedLinkView | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getCalendarSyncSettings()
      .then(setSettings)
      .catch((error) => setMessage(errorText(error, "Não foi possível carregar a agenda.")));
  }, []);

  const run = useCallback(async (task: () => Promise<string>, fallback: string) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await task());
    } catch (error) {
      setMessage(errorText(error, fallback));
    } finally {
      setBusy(false);
    }
  }, []);

  const savePatch = (patch: PatchCalendarSyncSettingsBody) =>
    run(async () => {
      setSettings(await patchCalendarSyncSettings(patch));
      return "Preferências da agenda salvas.";
    }, "Falha ao salvar preferências da agenda.");

  const generateLink = () => {
    if (
      settings?.feed.active &&
      !window.confirm("O link atual vai parar de funcionar. Gerar um novo?")
    ) {
      return;
    }
    void run(async () => {
      const link = await createCalendarFeedLink();
      setFeedLink(link);
      setSettings(link.settings);
      return "Link gerado. Copie e adicione no Google Agenda.";
    }, "Falha ao gerar o link.");
  };

  const revokeLink = () =>
    run(async () => {
      setSettings(await revokeCalendarFeedLink());
      setFeedLink(null);
      return "Link revogado.";
    }, "Falha ao revogar o link.");

  const copyLink = async () => {
    if (!feedLink) return;
    await navigator.clipboard.writeText(feedLink.feedUrl).catch(() => undefined);
    setMessage("Link copiado.");
  };

  if (!settings) return null;

  return (
    <section className="profile-modal-section" aria-labelledby="profile-calendar-sync-title">
      <h3 id="profile-calendar-sync-title" className="profile-modal-section-title">
        Google Agenda / agenda do celular
      </h3>
      <div className="profile-pref-panel">
        {CALENDAR_SYNC_CATEGORIES.map((category) => (
          <ProfilePrefToggle
            key={category}
            label={CATEGORY_COPY[category].label}
            hint={CATEGORY_COPY[category].hint}
            checked={settings.categories[category]}
            disabled={busy}
            onChange={(enabled) => void savePatch({ categories: { [category]: enabled } })}
          />
        ))}
      </div>

      <div className="profile-calendar-sync-field" role="radiogroup" aria-label="Lembretes">
        <span className="profile-pref-item-label">Lembretes</span>
        <div className="profile-calendar-sync-chips">
          {REMINDER_OPTIONS.map((option) => {
            const selected = settings.reminders === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`profile-calendar-sync-chip${selected ? " is-selected" : ""}`}
                disabled={busy}
                onClick={() => !selected && void savePatch({ reminders: option.value })}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <span className="profile-pref-item-hint">
          {REMINDER_OPTIONS.find((option) => option.value === settings.reminders)?.hint}
        </span>
      </div>

      <p className="profile-calendar-sync-hint">
        Gere o link e cole no Google Agenda em <strong>Outras agendas → Do URL</strong>.
      </p>

      {feedLink ? (
        <div className="profile-calendar-sync-link">
          <code>{feedLink.feedUrl}</code>
          <span className="profile-calendar-sync-hint">Link pessoal — não compartilhe.</span>
          <div className="profile-inline-actions">
            <button type="button" className="profile-edit-link" onClick={() => void copyLink()}>
              Copiar link
            </button>
            <a
              className="profile-edit-link"
              href={GOOGLE_CALENDAR_ADD_BY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Google Agenda
            </a>
          </div>
        </div>
      ) : null}

      <div className="profile-inline-actions">
        <button type="button" className="profile-edit-link" onClick={generateLink} disabled={busy}>
          {settings.feed.active ? "Gerar novo link" : "Gerar link"}
        </button>
        {settings.feed.active ? (
          <button
            type="button"
            className="profile-cancel-link"
            onClick={() => void revokeLink()}
            disabled={busy}
          >
            Revogar link
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="profile-calendar-sync-hint" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
