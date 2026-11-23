import type { PerfilResponse } from "@/lib/types/perfil-api";
import { Icon } from "@/components/ui/Icon";
import { ProfileAccountSection } from "@/components/profile/ProfileAccountSection";
import { ProfileCalendarSyncSection } from "@/components/profile/ProfileCalendarSyncSection";
import { ProfileNotificationSection } from "@/components/profile/ProfileNotificationSection";
import { ProfileSyncFooter } from "@/components/profile/ProfileSyncFooter";

interface ProfileModalBodyProps {
  data: PerfilResponse;
  isSaving: boolean;
  saveError: string | null;
  onSaveContact: (input: { email: string; phone: string }) => Promise<void>;
  onToggleNotification: (
    key: keyof PerfilResponse["notifications"],
    enabled: boolean
  ) => void;
  onClose?: () => void;
}

export function ProfileModalBody({
  data,
  isSaving,
  saveError,
  onSaveContact,
  onToggleNotification,
}: ProfileModalBodyProps) {
  const { profile, account, sync, notifications } = data;
  const rawInitials = profile?.initials?.trim();
  const validInitials =
    rawInitials && rawInitials !== "?" && rawInitials !== "??" ? rawInitials : null;

  return (
    <div className="profile-modal-body">
      <header className="profile-modal-hero">
        <div className="profile-modal-avatar" aria-hidden="true">
          {validInitials ?? <Icon name="user" size={22} />}
        </div>
        <div>
          <p className="profile-modal-name">{profile?.nome ?? "Aguardando sync"}</p>
          {profile?.status && (
            <p className="profile-modal-status">{profile.status}</p>
          )}
        </div>
      </header>

      {saveError ? (
        <p className="profile-save-error" role="alert">
          {saveError}
        </p>
      ) : null}

      <ProfileAccountSection
        profile={profile}
        account={account}
        isSaving={isSaving}
        onSaveContact={onSaveContact}
      />

      <ProfileNotificationSection
        preferences={notifications}
        isSaving={isSaving}
        onToggle={onToggleNotification}
      />

      <ProfileCalendarSyncSection />

      <ProfileSyncFooter sync={sync} />
    </div>
  );
}
