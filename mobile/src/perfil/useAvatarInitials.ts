import { useEffect, useState } from "react";
import {
  getAvatarInitials,
  hydrateAvatarInitials,
  subscribeAvatarInitials,
} from "../perfil/avatar-store";

export function useAvatarInitials(): string {
  const [initials, setInitials] = useState(getAvatarInitials);

  useEffect(() => {
    void hydrateAvatarInitials();
    return subscribeAvatarInitials(setInitials);
  }, []);

  return initials;
}
