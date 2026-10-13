"""Generates the PWA icons (any + maskable + apple-touch) with Pillow."""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
BLUE, WHITE = (10, 91, 214), (255, 255, 255)

def plane(size, scale):
    """Paper-plane glyph centred in a square canvas; scale < 1 leaves padding (maskable safe zone)."""
    img = Image.new("RGBA", (size, size), BLUE + (255,))
    d = ImageDraw.Draw(img)
    pts = [(0.22, 0.60), (0.80, 0.34), (0.60, 0.80), (0.48, 0.60), (0.40, 0.72), (0.38, 0.54)]
    c = 0.5
    poly = [(size * (c + (x - c) * scale), size * (c + (y - c) * scale)) for x, y in pts]
    d.polygon(poly, fill=WHITE)
    return img

def rounded(img, radius_frac):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, *img.size], radius=int(img.size[0] * radius_frac), fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out

rounded(plane(192, 1.0), 0.22).save(OUT / "icon-192.png")
rounded(plane(512, 1.0), 0.22).save(OUT / "icon-512.png")
plane(512, 0.62).convert("RGB").save(OUT / "icon-maskable-512.png")   # full-bleed, glyph inside safe zone
plane(180, 0.9).convert("RGB").save(OUT / "apple-touch-icon.png")
print("icons written:", sorted(p.name for p in OUT.iterdir()))
