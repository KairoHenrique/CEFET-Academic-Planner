import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { JerseyBackground } from "@/components/JerseyBackground";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceOverlay } from "@/components/layout/MaintenanceOverlay";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ACME HUB",
    template: "%s · ACME HUB",
  },
  description: "ACME HUB — planejador acadêmico com sincronização ao SIGAA do CEFET-MG",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#001020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <JerseyBackground />
        <MaintenanceOverlay />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
