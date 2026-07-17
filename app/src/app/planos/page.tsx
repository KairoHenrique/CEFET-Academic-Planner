import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanosPageClient } from "@/components/planos/PlanosPageClient";
import { PlanosPageShell } from "@/components/planos/PlanosPageShell";

export const metadata: Metadata = {
  title: "Planos",
};

function PlanosPageFallback() {
  return (
    <PlanosPageShell>
      <p className="planos-loading" role="status">
        Carregando planos…
      </p>
    </PlanosPageShell>
  );
}

export default function PlanosPage() {
  return (
    <Suspense fallback={<PlanosPageFallback />}>
      <PlanosPageClient />
    </Suspense>
  );
}
