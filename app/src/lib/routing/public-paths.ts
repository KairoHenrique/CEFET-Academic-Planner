export function isPublicAppPath(pathname: string): boolean {
  if (pathname === "/login") {
    return true;
  }

  if (pathname === "/termos" || pathname === "/privacidade") {
    return true;
  }

  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return true;
  }

  return false;
}

export function isLegalDocumentPath(pathname: string): boolean {
  return pathname === "/termos" || pathname === "/privacidade";
}
