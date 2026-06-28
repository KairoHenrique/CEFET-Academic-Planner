export const SIGAA_BASE_URL = "https://sig.cefetmg.br/sigaa/";

export const SIGAA_LOGIN_URL = `${SIGAA_BASE_URL}verTelaLogin.do`;

export const SIGAA_PORTAL_DISCENTE_URL =
  `${SIGAA_BASE_URL}portais/discente/discente.jsf`;

export const SIGAA_LOGIN_TIMEOUT_MS = Number(
  process.env.SIGAA_LOGIN_TIMEOUT_MS ?? 30_000
);

export const SIGAA_NAVIGATION_TIMEOUT_MS = Number(
  process.env.SIGAA_NAVIGATION_TIMEOUT_MS ?? 20_000
);

export const SIGAA_SCRAPER_MOCK =
  process.env.SIGAA_SCRAPER_MOCK === "true" ||
  process.env.SIGAA_SCRAPER_MOCK === "1";

export const SIGAA_HEADLESS =
  process.env.SIGAA_HEADLESS !== "false" &&
  process.env.SIGAA_HEADLESS !== "0";
