import { Suspense } from "react";
import { PlanosPixScreen } from "@/components/planos/pix/PlanosPixScreen";

export default function PlanosPixPage() {
  return (
    <Suspense fallback={null}>
      <PlanosPixScreen />
    </Suspense>
  );
}
