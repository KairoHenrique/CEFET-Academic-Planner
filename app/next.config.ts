import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: [
    "better-sqlite3",
    "playwright",
    "playwright-core",
    "pdf-parse",
    "pg",
  ],
};

export default nextConfig;

try {
  // OpenNext só é necessário para preview/deploy Cloudflare (`npm run preview:cf`).
  // require opcional evita quebrar `npm run dev` se deps CF ainda não instaladas.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
} catch {
  // npm install em app/ — ou ignore se só desenvolve local com next dev
}
