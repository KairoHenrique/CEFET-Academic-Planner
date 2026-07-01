"use client";

import { Modal } from "@/components/ui/Modal";
import { ProfileModalBody } from "@/components/profile/ProfileModalBody";
import type { PerfilResponse } from "@/lib/types/perfil-api";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  data: PerfilResponse | undefined;
  loading: boolean;
  onStartTutorial: () => void;
}

export function ProfileModal({
  open,
  onClose,
  data,
  loading,
  onStartTutorial,
}: ProfileModalProps) {
  const handleStartTutorial = () => {
    onClose();
    onStartTutorial();
  };

  return (
    <Modal open={open} onClose={onClose} title="Meu perfil">
      {loading && <p className="profile-modal-loading">Carregando perfil…</p>}
      {!loading && data && (
        <ProfileModalBody data={data} onStartTutorial={handleStartTutorial} />
      )}
      {!loading && !data && (
        <p className="profile-modal-loading">Não foi possível carregar o perfil.</p>
      )}
    </Modal>
  );
}
