"""pnpm art:icons – builds favicon and PWA icons from art/icon/icon.png.

python tools/art/icons.py

- favicon.ico (16/32/48) and favicon-32.png: square crop tight around the crown, so it stays readable in a tab.
- apple-touch-icon.png (180), icon-192.png, icon-512.png: full-bleed artwork as generated.
- icon-512-maskable.png: whole artwork scaled into the 80 % safe zone, padded with its own edge colour.
Output goes to public/icons/ (checked in). Requires Pillow.
"""
import os

from PIL import Image, ImageChops, ImageEnhance, ImageStat

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'art', 'icon', 'icon.png')
OUT = os.path.join(ROOT, 'public', 'icons')
# width in px of the border strip that defines the background colour
BORDER = 8
# a pixel belongs to the crown when its brightness differs this much from the background colour
BG_THRESHOLD = 60
# share of the favicon the crown takes
FAVICON_FILL = 0.94
# share of the maskable canvas the whole artwork takes (keeps the crown inside the 80 % safe circle)
MASKABLE_FILL = 0.7
# small sizes lose the glow first: a little extra contrast keeps the silhouette crisp
FAVICON_CONTRAST = 1.15


def bg_colour(im):
    """Mean colour of the outer border, which the padding has to continue seamlessly."""
    w, h = im.size
    strips = [im.crop(b) for b in ((0, 0, w, BORDER), (0, h - BORDER, w, h), (0, 0, BORDER, h), (w - BORDER, 0, w, h))]
    means = [ImageStat.Stat(s).mean for s in strips]
    return tuple(round(sum(m[i] for m in means) / len(means)) for i in range(3))


def crown_square(im, bg):
    """Square crop centred on the crown, clamped to the artwork."""
    diff = ImageChops.difference(im, Image.new('RGB', im.size, bg)).convert('L')
    l, t, r, b = diff.point(lambda v: 255 if v > BG_THRESHOLD else 0).getbbox() or (0, 0) + im.size
    side = min(min(im.size), round(max(r - l, b - t) / FAVICON_FILL))
    x = min(max(0, (l + r - side) // 2), im.width - side)
    y = min(max(0, (t + b - side) // 2), im.height - side)
    return im.crop((x, y, x + side, y + side))


def main():
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(SRC).convert('RGB')
    bg = bg_colour(im)

    for name, size in (('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180)):
        im.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)

    inner = round(512 * MASKABLE_FILL)
    maskable = Image.new('RGB', (512, 512), bg)
    maskable.paste(im.resize((inner, inner), Image.LANCZOS), ((512 - inner) // 2, (512 - inner) // 2))
    maskable.save(os.path.join(OUT, 'icon-512-maskable.png'), optimize=True)

    tight = ImageEnhance.Contrast(crown_square(im, bg).resize((256, 256), Image.LANCZOS)).enhance(FAVICON_CONTRAST)
    tight.resize((32, 32), Image.LANCZOS).save(os.path.join(OUT, 'favicon-32.png'), optimize=True)
    tight.save(os.path.join(OUT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    print('icons written to', os.path.relpath(OUT, ROOT), 'bg', '#%02X%02X%02X' % bg)


if __name__ == '__main__':
    main()
