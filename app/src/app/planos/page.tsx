import { Suspense } from "react";
import { PlanosPageClient } from "@/components/planos/PlanosPageClient";
import { PlanosPageShell } from "@/components/planos/PlanosPageShell";

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
