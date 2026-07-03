import { brand } from "@/config/brand";
import Image from "next/image";

/** Logo placeholder — substituir por SVG/imagem quando disponível */
export function BrandLogo() {
  if (brand.logoSrc) {
    return (
      <Image 
        src={brand.logoSrc} 
        alt={brand.name} 
        width={80} 
        height={80} 
        className="brand-logo-img"
        style={{ objectFit: "contain" }}
      />
    );
  }

  return (
    <span className="brand-logo" role="img" aria-label={brand.name}>
      {brand.logoEmoji}
    </span>
  );
}
