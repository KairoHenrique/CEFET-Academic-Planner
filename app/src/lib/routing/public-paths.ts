export function isPublicAppPath(pathname: string): boolean {
  if (pathname === "/login") {
    return true;
  }

  if (pathname === "/download") {
    return true;
  }

  if (pathname === "/inicio") {
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

export function isDownloadPath(pathname: string): boolean {
  return pathname === "/download";
}

export function isPublicLandingPath(pathname: string): boolean {
  return pathname === "/inicio";
}
