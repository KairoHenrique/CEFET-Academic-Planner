import type { Cookie } from "playwright";

export interface SigaaCredentials {
  username: string;
  password: string;
}

export interface SigaaSession {
  username: string;
  cookies: Cookie[];
  loggedInAt: string;
}
