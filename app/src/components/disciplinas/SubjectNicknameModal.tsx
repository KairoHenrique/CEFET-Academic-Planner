"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  SUBJECT_DISPLAY_NAME_MAX_LENGTH,
  SUBJECT_NICKNAME_MAX_LENGTH,
  suggestSubjectNickname,
} from "@/lib/disciplinas/subject-display-name";

interface SubjectDisplaySavePayload {
  nome: string | null;
  apelido: string | null;
}

interface SubjectNicknameModalProps {
  open: boolean;
  onClose: () => void;
  officialName: string;
  displayName: string;
  code: string;
  nickname: string | null;
  isSaving?: boolean;
  onSave: (payload: SubjectDisplaySavePayload) => void;
}

export function SubjectNicknameModal({
  open,
  onClose,
  officialName,
  displayName,
  code,
  nickname,
  isSaving = false,
  onSave,
}: SubjectNicknameModalProps) {
  const suggestion = suggestSubjectNickname(officialName, code);
  const [nameValue, setNameValue] = useState(displayName);
  const [nicknameValue, setNicknameValue] = useState(nickname ?? suggestion);

  useEffect(() => {
    if (open) {
      setNameValue(displayName);
      setNicknameValue(nickname ?? suggestion);
    }
  }, [open, displayName, nickname, suggestion]);

  const handleSave = () => {
    const trimmedName = nameValue.trim();
    const trimmedNickname = nicknameValue.trim();

    onSave({
      nome:
        trimmedName.localeCompare(officialName, "pt-BR", {
          sensitivity: "accent",
        }) === 0
          ? null
          : trimmedName || null,
      apelido: trimmedNickname || null,
    });
    onClose();
  };

  const handleClearNickname = () => {
    setNicknameValue(suggestion);
  };

  const showOfficialHint =
    officialName.localeCompare(displayName, "pt-BR", {
      sensitivity: "accent",
    }) !== 0;

  return (
    <Modal open={open} onClose={onClose} title="Nome da matéria">
      <div className="modal-form-stack">
        <Input
          label="Nome da matéria"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          maxLength={SUBJECT_DISPLAY_NAME_MAX_LENGTH}
          disabled={isSaving}
          hint={
            showOfficialHint
              ? `Nome no SIGAA: ${officialName}`
              : "Como aparece no topo da página da disciplina."
          }
        />
        <Input
          label="Apelido"
          value={nicknameValue}
          onChange={(event) => setNicknameValue(event.target.value)}
          maxLength={SUBJECT_NICKNAME_MAX_LENGTH}
          disabled={isSaving}
          hint={`Até ${SUBJECT_NICKNAME_MAX_LENGTH} caracteres. Usado na grade e no calendário.`}
        />
      </div>
      <div className="modal-form-actions">
        <button
          type="button"
          className="btn-gold"
          onClick={handleSave}
          disabled={isSaving || !nameValue.trim()}
        >
          {isSaving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={handleClearNickname}
          disabled={isSaving}
        >
          Restaurar apelido
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </button>
      </div>
    </Modal>
  );
}
