import type { PerfilResponse } from "@/lib/types/perfil-api";
import { ProfileAccountSection } from "@/components/profile/ProfileAccountSection";
import { ProfileNotificationSection } from "@/components/profile/ProfileNotificationSection";
import { ProfileSubscriptionSection } from "@/components/profile/ProfileSubscriptionSection";
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
}

export function ProfileModalBody({
  data,
  isSaving,
  saveError,
  onSaveContact,
  onToggleNotification,
}: ProfileModalBodyProps) {
  const { profile, account, subscription, sync, notifications } = data;

  return (
    <div className="profile-modal-body">
      <header className="profile-modal-hero">
        <div className="profile-modal-avatar" aria-hidden="true">
          {profile?.initials ?? "??"}
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

      <ProfileSubscriptionSection subscription={subscription} />

      <ProfileNotificationSection
        preferences={notifications}
        isSaving={isSaving}
        onToggle={onToggleNotification}
      />

      <ProfileSyncFooter sync={sync} />
    </div>
  );
}
