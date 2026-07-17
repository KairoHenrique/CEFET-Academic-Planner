import type { Metadata } from "next";
import { MapaView } from "@/components/mapa/MapaView";

export const metadata: Metadata = {
  title: "Mapa de pré-requisitos",
};

export default function MapaPage() {
  return <MapaView />;
}
