"""Gera ícones: logo_v2 + navy, centralizado no triângulo azul (centro visual do A)."""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "app" / "public" / "logo_v2.png"
OUT = ROOT / "mobile" / "assets"
WEB_ICON = ROOT / "app" / "src" / "app" / "icon.png"

NAVY = (0, 8, 20, 255)
NAVY_RGB = (0, 8, 20)
ALPHA_MIN = 24


def crop_content(logo: Image.Image) -> tuple[Image.Image, int, int]:
    arr = np.array(logo)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > ALPHA_MIN)
    pad = 4
    left = max(0, int(xs.min()) - pad)
    top = max(0, int(ys.min()) - pad)
    right = min(logo.width, int(xs.max()) + 1 + pad)
    bottom = min(logo.height, int(ys.max()) + 1 + pad)
    return logo.crop((left, top, right, bottom)), left, top


def visual_anchor(logo: Image.Image) -> tuple[float, float]:
    """
    Centro visual preferido = triângulo azul no miolo do A.
    Fallback = corpo dourado denso; depois = bbox.
    """
    arr = np.asarray(logo).astype(np.float64)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    blue = (a > 80) & (b > 120) & (b > r + 30) & (b > g + 20)
    ys, xs = np.where(blue)
    if len(xs) > 500:
        return float(xs.mean()), float(ys.mean())

    gold = (a > 160) & (r > 140) & (g > 100) & ((r + g) > (b + 80))
    ys, xs = np.where(gold)
    if len(xs) > 500:
        return float(xs.mean()), float(ys.mean())

    return logo.width / 2.0, logo.height / 2.0


def place_optically(
    logo: Image.Image,
    size: int,
    pad_ratio: float,
    transparent: bool = False,
    # Nudge óptico tipográfico: sobe um pouco (letras “parecem” pesadas embaixo)
    nudge_y_ratio: float = -0.018,
) -> Image.Image:
    cropped, _, _ = crop_content(logo)
    ax, ay = visual_anchor(cropped)

    canvas = Image.new(
        "RGBA",
        (size, size),
        (0, 0, 0, 0) if transparent else NAVY,
    )

    max_side = int(size * (1 - 2 * pad_ratio))
    lw, lh = cropped.size
    scale = min(max_side / lw, max_side / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    ax_s = ax * scale
    ay_s = ay * scale
    nudge_y = size * nudge_y_ratio

    x = int(round(size / 2 - ax_s))
    y = int(round(size / 2 - ay_s + nudge_y))

    x = max(-(nw // 5), min(size - (4 * nw) // 5, x))
    y = max(-(nh // 5), min(size - (4 * nh) // 5, y))

    canvas.alpha_composite(resized, (x, y))
    return canvas


def main() -> None:
    logo = Image.open(LOGO).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)

    place_optically(logo, 1024, 0.11).save(OUT / "icon.png", "PNG", optimize=True)
    place_optically(logo, 1024, 0.15).save(
        OUT / "splash-icon.png", "PNG", optimize=True
    )
    place_optically(logo, 1024, 0.17, transparent=True).save(
        OUT / "android-icon-foreground.png", "PNG", optimize=True
    )
    Image.new("RGB", (1024, 1024), NAVY_RGB).save(
        OUT / "android-icon-background.png", "PNG", optimize=True
    )
    place_optically(logo, 512, 0.11).save(WEB_ICON, "PNG", optimize=True)

    # Preview com cruz guia (só arquivo temp, não versionado)
    prev = place_optically(logo, 512, 0.11).convert("RGBA")
    # draw center guides lightly
    for i in range(512):
        if abs(i - 256) < 1:
            for c in range(3):
                px = list(prev.getpixel((i, 256)))
                px[c] = min(255, px[c] + 40)
                prev.putpixel((i, 256), tuple(px))
                px = list(prev.getpixel((256, i)))
                px[c] = min(255, px[c] + 40)
                prev.putpixel((256, i), tuple(px))
    prev_path = OUT / "_preview-center.png"
    prev.save(prev_path, "PNG")
    print("ok — âncora = triângulo azul do A")
    print("preview:", prev_path)


if __name__ == "__main__":
    main()
