import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "playwright", "playwright-core", "pdf-parse"],
};

export default nextConfig;
