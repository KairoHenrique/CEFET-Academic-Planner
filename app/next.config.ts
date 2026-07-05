import path from "node:path";
import type { NextConfig } from "next";

const isCloudflareBuild = process.env.PLANNER_CLOUD === "true";

const CLOUD_STUB_ALIASES: Record<string, string> = {
  "better-sqlite3": "./src/lib/db/stubs/better-sqlite3-stub.ts",
  playwright: "./src/lib/db/stubs/playwright-stub.ts",
  "playwright-core": "./src/lib/db/stubs/playwright-core-stub.ts",
  "pdf-parse": "./src/lib/db/stubs/pdf-parse-stub.ts",
};

const serverExternalPackages = isCloudflareBuild
  ? ["pg", "pg-cloudflare"]
  : ["better-sqlite3", "playwright", "playwright-core", "pdf-parse", "pg"];

const cloudStubAliasAbs = Object.fromEntries(
  Object.entries(CLOUD_STUB_ALIASES).map(([key, rel]) => [
    key,
    path.join(__dirname, rel),
  ])
);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
    ...(isCloudflareBuild ? { resolveAlias: CLOUD_STUB_ALIASES } : {}),
  },
  ...(isCloudflareBuild
    ? {
        webpack: (config, { isServer }) => {
          if (isServer) {
            config.resolve ??= {};
            config.resolve.alias = {
              ...config.resolve.alias,
              ...cloudStubAliasAbs,
            };
          }
          return config;
        },
      }
    : {}),
  serverExternalPackages,
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
