import { Suspense } from "react";
import { PlanosPageClient } from "@/components/planos/PlanosPageClient";

export default function PlanosPage() {
  return (
    <Suspense fallback={null}>
      <PlanosPageClient />
    </Suspense>
  );
}
