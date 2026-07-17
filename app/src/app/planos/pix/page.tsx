import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanosPixScreen } from "@/components/planos/pix/PlanosPixScreen";

export const metadata: Metadata = {
  title: "Pagamento PIX",
};

export default function PlanosPixPage() {
  return (
    <Suspense fallback={null}>
      <PlanosPixScreen />
    </Suspense>
  );
}
