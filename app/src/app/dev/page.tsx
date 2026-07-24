import type { Metadata } from "next";
import { DevPanelPage } from "@/components/dev/DevPanelPage";

export const metadata: Metadata = {
  title: "Painel dev",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function DevPage() {
  return <DevPanelPage />;
}
