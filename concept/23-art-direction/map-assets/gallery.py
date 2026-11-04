"""Galerie der Karten-Assets: je Asset Referenz aus ChatGPT neben dem Blender-Modell.

`python concept/23-art-direction/map-assets/gallery.py` liest `groups/*.yaml`, schneidet die Referenzen aus den Blättern und
schreibt `gallery/index.html` mit `gallery/img/`. Fehlt ein Bild, zeigt die Kachel das offen an.
"""
import base64
import html
import re
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageChops

HERE = Path(__file__).parent
ROOT = HERE.parents[2]
OUT = HERE / 'gallery'
PREVIEW = ROOT / 'art' / 'props' / 'previews'
REFS = ROOT / 'art' / 'mockups' / 'map-assets' / 'refs'
SIZE = 300

GROUPS = ['fortify', 'nature', 'village', 'interior', 'coast', 'winter']


def tile_preview(mid):
    src = PREVIEW / f'{mid}.png'
    if not src.exists():
        return None
    im = Image.open(src).convert('RGB')
    bg = Image.new('RGB', im.size, im.getpixel((2, 2)))
    box = ImageChops.difference(im, bg).getbbox()
    if box:
        pad = 12
        im = im.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, im.width), min(box[3] + pad, im.height)))
    im.thumbnail((SIZE, SIZE), Image.LANCZOS)
    out = OUT / 'img' / f'{mid}.jpg'
    im.save(out, quality=78)
    return out.name


def tile_ref(mid, ref):
    if not ref or not ref.get('sheet'):
        return None
    src = REFS / ref['sheet']
    if not src.exists():
        src = REFS.parent / ref['sheet']
    if not src.exists():
        return None
    im = Image.open(src).convert('RGB')
    if ref.get('box'):
        im = im.crop(tuple(ref['box']))
    im.thumbnail((SIZE, SIZE), Image.LANCZOS)
    out = OUT / 'img' / f'{mid}_ref.jpg'
    im.save(out, quality=78)
    return out.name


def main():
    (OUT / 'img').mkdir(parents=True, exist_ok=True)
    sections, count, missing = [], 0, []
    extras = sorted(HERE.glob('gallery_extra/*.jpg'))
    for g in GROUPS:
        p = HERE / 'groups' / f'{g}.yaml'
        if not p.exists():
            continue
        d = yaml.safe_load(p.read_text(encoding='utf8'))
        cards = []
        for it in d.get('items', []):
            mid = it['id']
            prev, ref = tile_preview(mid), tile_ref(mid, it.get('ref'))
            count += 1
            if not prev:
                missing.append(mid)
            game = HERE / 'gallery_game' / f'{mid}.jpg'
            gamehtml = f'<figure class="game"><img src="img/{mid}_game.jpg" alt="Im Spielblick {html.escape(it.get("name", mid))}" loading="lazy"><figcaption>Spielkamera, Figur als Maßstab</figcaption></figure>' if game.exists() else ''
            if game.exists():
                g_im = Image.open(game).convert('RGB')
                g_im.thumbnail((420, 420), Image.LANCZOS)
                g_im.save(OUT / 'img' / f'{mid}_game.jpg', quality=76)
            refimg = f'<img src="img/{ref}" alt="Referenz {html.escape(it.get("name", mid))}" loading="lazy">' if ref else '<div class="none">ohne Referenz</div>'
            prevhtml = f'<img src="img/{prev}" alt="Modell {html.escape(it.get("name", mid))}" loading="lazy">' if prev else '<div class="none">Modell fehlt</div>'
            miss = ', '.join(str(m) for m in it.get('missions', []) or [])
            cards.append(
                f'<article><div class="pair"><figure>{refimg}<figcaption>Referenz</figcaption></figure><figure>{prevhtml}<figcaption>Blender</figcaption></figure>{gamehtml}</div>'
                f'<h3>{html.escape(it.get("name", mid))}</h3><p>{html.escape(it.get("use", ""))}</p><small><code>{mid}</code>{" · " + html.escape(miss) if miss else ""}</small></article>'
            )
        sections.append(f'<section id="{g}"><h2>{html.escape(d.get("title", g))} <small>{len(cards)}</small></h2><div class="cards">{"".join(cards)}</div></section>')
    t = (HERE / 'gallery.template.html').read_text(encoding='utf8')
    nav = ' '.join(f'<a href="#{g}">{g}</a>' for g in GROUPS if (HERE / 'groups' / f'{g}.yaml').exists())
    t = t.replace('{{SECTIONS}}', '\n'.join(sections)).replace('{{COUNT}}', str(count)).replace('{{NAV}}', nav)
    (OUT / 'index.html').write_text(t, encoding='utf8')
    # one file for the artifact: images inline, so the 256-file limit of a publish does not bite
    def inline(m):
        data = (OUT / 'img' / m.group(1)).read_bytes()
        return 'src="data:image/jpeg;base64,' + base64.b64encode(data).decode() + '"'
    (OUT / 'single.html').write_text(re.sub(r'src="img/([^"]+)"', inline, t), encoding='utf8')
    print('items', count, 'missing', missing)
    return 0


if __name__ == '__main__':
    sys.exit(main())
