/** Stub de `playwright` para bundle OpenNext/Cloudflare (sync SIGAA não roda no Workers). */
export const chromium = {
  launch: async (): Promise<never> => {
    throw new Error("playwright indisponível no deploy cloud.");
  },
};

export type Browser = unknown;
export type BrowserContext = unknown;
export type Page = unknown;
export type Frame = unknown;
export type Cookie = unknown;
export type Download = unknown;
export type Response = unknown;
