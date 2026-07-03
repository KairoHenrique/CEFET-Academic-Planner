"use client";

import { Modal } from "@/components/ui/Modal";
import { ProfileModalBody } from "@/components/profile/ProfileModalBody";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import type { NotificationPreferences, PerfilResponse } from "@/lib/types/perfil-api";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  data: PerfilResponse | undefined;
  loading: boolean;
}

export function ProfileModal({
  open,
  onClose,
  data,
  loading,
}: ProfileModalProps) {
  const { patchProfile, patchProfileAsync, isSaving, error } = useProfileSettings();

  const handleSaveContact = async (input: { email: string; phone: string }) => {
    await patchProfileAsync({
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
    });
  };

  const handleToggleNotification = (
    key: keyof NotificationPreferences,
    enabled: boolean
  ) => {
    patchProfile({ notifications: { [key]: enabled } });
  };

  return (
    <Modal open={open} onClose={onClose} title="Meu perfil">
      {loading && <p className="profile-modal-loading">Carregando perfil…</p>}
      {!loading && data && (
        <ProfileModalBody
          data={data}
          isSaving={isSaving}
          saveError={error}
          onSaveContact={handleSaveContact}
          onToggleNotification={handleToggleNotification}
        />
      )}
      {!loading && !data && (
        <p className="profile-modal-loading">Não foi possível carregar o perfil.</p>
      )}
    </Modal>
  );
}
