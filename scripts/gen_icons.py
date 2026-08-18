from PIL import Image, ImageDraw
import math

BG = (63, 107, 50, 255)      # leaf-deep green
LEAF = (227, 168, 43, 255)   # turmeric
LEAF_DARK = (169, 120, 20, 255)

def make_icon(size, filename, padding_ratio=0.0, bg=BG):
    canvas = Image.new("RGBA", (size, size), bg)

    safe = size * (1 - padding_ratio)

    leaf_w = int(safe * 0.58)
    leaf_h = int(safe * 0.86)
    layer_size = int(math.hypot(leaf_w, leaf_h)) + 10
    leaf_layer = Image.new("RGBA", (layer_size, layer_size), (0, 0, 0, 0))
    ld = ImageDraw.Draw(leaf_layer)
    lx0 = (layer_size - leaf_w) / 2
    ly0 = (layer_size - leaf_h) / 2
    ld.ellipse([lx0, ly0, lx0 + leaf_w, ly0 + leaf_h], fill=LEAF)

    cx = layer_size / 2
    top_y = ly0 + leaf_h * 0.14
    bot_y = ly0 + leaf_h * 0.86
    ld.line([(cx, top_y), (cx, bot_y)], fill=LEAF_DARK, width=max(2, int(size * 0.014)))

    for t in (0.32, 0.5, 0.68):
        y = ly0 + leaf_h * t
        spread = leaf_w * 0.30 * math.sin(math.pi * (t - 0.14) / 0.72)
        ld.line([(cx, y), (cx - spread, y - leaf_h * 0.09)], fill=LEAF_DARK, width=max(1, int(size * 0.008)))
        ld.line([(cx, y), (cx + spread, y - leaf_h * 0.09)], fill=LEAF_DARK, width=max(1, int(size * 0.008)))

    rotated = leaf_layer.rotate(-38, resample=Image.BICUBIC, expand=True)
    rx = (size - rotated.width) / 2
    ry = (size - rotated.height) / 2
    canvas.alpha_composite(rotated, (int(rx), int(ry)))

    canvas.save(filename)

out = "/home/claude/krishi-swasthya-sahayak/web_app/icons"
make_icon(192, f"{out}/icon-192.png", padding_ratio=0.14)
make_icon(512, f"{out}/icon-512.png", padding_ratio=0.14)
make_icon(512, f"{out}/icon-maskable-512.png", padding_ratio=0.34)
make_icon(180, f"{out}/apple-touch-icon.png", padding_ratio=0.16)
make_icon(32, f"{out}/favicon-32.png", padding_ratio=0.10)
print("icons rewritten")
