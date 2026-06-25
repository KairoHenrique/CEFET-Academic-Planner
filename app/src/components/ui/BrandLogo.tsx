import { brand } from "@/config/brand";

/** Logo placeholder — substituir por SVG/imagem quando disponível */
export function BrandLogo() {
  return (
    <span className="brand-logo" role="img" aria-label={brand.name}>
      {brand.logoEmoji}
    </span>
  );
}
