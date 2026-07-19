import type { Metadata } from "next";
import { DownloadPageClient } from "@/components/download/DownloadPageClient";

export const metadata: Metadata = {
  title: "Baixar app Android · ACME HUB",
  description: "Download do APK ACME HUB (sideload Android).",
};

export default function DownloadPage() {
  return <DownloadPageClient />;
}
