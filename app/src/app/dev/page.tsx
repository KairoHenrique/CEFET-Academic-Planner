import type { Metadata } from "next";
import { DevPanelPage } from "@/components/dev/DevPanelPage";

export const metadata: Metadata = {
  title: "Painel dev | ACME HUB",
  robots: { index: false, follow: false },
};

export default function DevPage() {
  return <DevPanelPage />;
}
