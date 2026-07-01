"use client";

import { useState } from "react";
import { getSyncCredentials } from "@/lib/auth/credentials";
import { buildInitials } from "@/lib/perfil/build-initials";
import { usePerfil } from "@/hooks/usePerfil";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { SiteTutorial } from "@/components/tutorial/SiteTutorial";

export function ProfileMenu() {
  const { data, isLoading } = usePerfil();
  const [profileOpen, setProfileOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const profile = data?.profile;
  const credentials = getSyncCredentials();
  const initials =
    profile?.initials ??
    (credentials?.username ? buildInitials(credentials.username) : "??");

  return (
    <>
      <button
        type="button"
        className="navbar-avatar profile-menu-trigger"
        title="Meu perfil"
        aria-label="Abrir meu perfil"
        data-tutorial-id="profile-avatar"
        onClick={() => setProfileOpen(true)}
      >
        {initials}
      </button>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        data={data}
        loading={isLoading}
        onStartTutorial={() => setTutorialOpen(true)}
      />

      <SiteTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  );
}
