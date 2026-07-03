"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import type { PerfilAccount, PerfilAluno } from "@/lib/types/perfil-api";
import { formatCpf, formatPhone } from "@/lib/perfil/format-profile-value";

interface ProfileInfoRowProps {
  label: string;
  value: string;
  hint?: string;
}

function ProfileInfoRow({ label, value, hint }: ProfileInfoRowProps) {
  return (
    <div className="profile-info-row">
      <dt className="profile-info-label">{label}</dt>
      <dd className="profile-info-value">{value}</dd>
      {hint ? <dd className="profile-info-hint">{hint}</dd> : null}
    </div>
  );
}

interface ProfileAccountSectionProps {
  profile: PerfilAluno | null;
  account: PerfilAccount;
  isSaving: boolean;
  onSaveContact: (input: { email: string; phone: string }) => Promise<void>;
}

export function ProfileAccountSection({
  profile,
  account,
  isSaving,
  onSaveContact,
}: ProfileAccountSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftEmail, setDraftEmail] = useState(account.email ?? "");
  const [draftPhone, setDraftPhone] = useState(account.phone ?? "");

  useEffect(() => {
    if (!isEditing) {
      setDraftEmail(account.email ?? "");
      setDraftPhone(account.phone ?? "");
    }
  }, [account.email, account.phone, isEditing]);

  const handleSave = async () => {
    try {
      await onSaveContact({ email: draftEmail, phone: draftPhone });
      setIsEditing(false);
    } catch {
      // Erro exibido pelo modal pai.
    }
  };

  return (
    <section className="profile-modal-section" aria-labelledby="profile-dados-title">
      <div className="profile-section-heading">
        <h3 id="profile-dados-title" className="profile-modal-section-title">
          Dados da conta
        </h3>
        {!isEditing ? (
          <button
            type="button"
            className="profile-edit-link"
            onClick={() => setIsEditing(true)}
            disabled={isSaving}
          >
            <Icon name="edit" size={12} />
            Editar contato
          </button>
        ) : (
          <div className="profile-contact-actions">
            <button
              type="button"
              className="profile-edit-link"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              className="profile-cancel-link"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="profile-contact-edit">
          <Input
            label="E-mail da conta"
            type="email"
            value={draftEmail}
            onChange={(event) => setDraftEmail(event.target.value)}
            placeholder="seu@email.com"
            disabled={isSaving}
          />
          <Input
            label="Celular"
            type="tel"
            inputMode="tel"
            value={draftPhone}
            onChange={(event) => setDraftPhone(event.target.value)}
            placeholder="(31) 99999-9999"
            disabled={isSaving}
          />
        </div>
      ) : null}

      <dl className="profile-info-list">
        <ProfileInfoRow label="Matrícula" value={profile?.matricula ?? "—"} />
        <ProfileInfoRow label="CPF" value={formatCpf(account.cpf)} />
        <ProfileInfoRow
          label="E-mail da conta"
          value={account.email ?? "Não informado"}
        />
        <ProfileInfoRow label="Celular" value={formatPhone(account.phone)} />
        <ProfileInfoRow label="Curso" value={profile?.curso ?? "—"} />
      </dl>
    </section>
  );
}
