"""Gera ícones do app a partir de app/public/logo_v2.png + fundo navy #000814."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "app" / "public" / "logo_v2.png"
OUT = ROOT / "mobile" / "assets"
WEB_ICON = ROOT / "app" / "src" / "app" / "icon.png"

NAVY = (0, 8, 20, 255)
NAVY_RGB = (0, 8, 20)


def compose(logo: Image.Image, size: int, pad_ratio: float = 0.12) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), NAVY)
    max_side = int(size * (1 - 2 * pad_ratio))
    lw, lh = logo.size
    scale = min(max_side / lw, max_side / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def foreground(logo: Image.Image, size: int = 1024, pad_ratio: float = 0.18) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    max_side = int(size * (1 - 2 * pad_ratio))
    lw, lh = logo.size
    scale = min(max_side / lw, max_side / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def main() -> None:
    logo = Image.open(LOGO).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)

    compose(logo, 1024, 0.12).save(OUT / "icon.png", "PNG", optimize=True)
    compose(logo, 1024, 0.18).save(OUT / "splash-icon.png", "PNG", optimize=True)
    foreground(logo, 1024, 0.18).save(
        OUT / "android-icon-foreground.png", "PNG", optimize=True
    )
    Image.new("RGB", (1024, 1024), NAVY_RGB).save(
        OUT / "android-icon-background.png", "PNG", optimize=True
    )
    compose(logo, 512, 0.12).save(WEB_ICON, "PNG", optimize=True)
    print("ok — navy #000814 + logo_v2")


if __name__ == "__main__":
    main()
