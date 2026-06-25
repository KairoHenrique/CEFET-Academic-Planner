import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { JerseyBackground } from "@/components/JerseyBackground";
import { AppShell } from "@/components/layout/AppShell";

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
  title: "CEFET Academic Planner",
  description:
    "Planejador acadêmico inteligente para alunos do CEFET-MG. Sincronize dados do SIGAA automaticamente.",
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
