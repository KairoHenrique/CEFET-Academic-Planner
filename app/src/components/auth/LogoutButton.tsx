"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clearSession } from "@/lib/auth/session";

interface LogoutButtonProps {
  className?: string;
  showLabel?: boolean;
  onLoggedOut?: () => void;
}

export function LogoutButton({
  className = "navbar-logout-btn",
  showLabel = true,
  onLoggedOut,
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    onLoggedOut?.();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
      aria-label="Sair da conta"
    >
      <Icon name="logout" size={15} />
      {showLabel && <span>Sair</span>}
    </button>
  );
}
