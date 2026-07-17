import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Início",
};

export default function DashboardPage() {
  return <DashboardView />;
}
