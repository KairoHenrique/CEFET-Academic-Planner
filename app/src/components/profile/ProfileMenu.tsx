"use client";

import { useEffect, useState } from "react";
import { AVATAR_INITIALS_KEY, getSession } from "@/lib/auth/session";
import { usePerfil } from "@/hooks/usePerfil";
import { Icon } from "@/components/ui/Icon";
import { ProfileModal } from "@/components/profile/ProfileModal";

function normalizeInitials(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase() ?? "";
  if (!trimmed || trimmed === "?" || trimmed === "??") return null;
  return trimmed;
}

function readCachedInitials(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AVATAR_INITIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: string; initials?: string };
    const session = getSession();
    const userKey = session?.cpf?.trim() || session?.username?.trim() || "";
    if (!userKey || parsed.user !== userKey) return null;
    return normalizeInitials(parsed.initials);
  } catch {
    return null;
  }
}

export function ProfileMenu() {
  const { data, isLoading } = usePerfil();
  const [profileOpen, setProfileOpen] = useState(false);
  const [cachedInitials, setCachedInitials] = useState<string | null>(null);

  useEffect(() => {
    setCachedInitials(readCachedInitials());
  }, []);

  const liveInitials = normalizeInitials(data?.profile?.initials);

  useEffect(() => {
    if (!liveInitials) return;
    setCachedInitials(liveInitials);
    try {
      const session = getSession();
      const userKey = session?.cpf?.trim() || session?.username?.trim() || "";
      if (userKey) {
        localStorage.setItem(
          AVATAR_INITIALS_KEY,
          JSON.stringify({ user: userKey, initials: liveInitials })
        );
      }
    } catch {
      /* ignore */
    }
  }, [liveInitials]);

  const initials = liveInitials ?? cachedInitials;

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
        {initials ?? <Icon name="user" size={16} />}
      </button>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        data={data}
        loading={isLoading}
      />
    </>
  );
}
