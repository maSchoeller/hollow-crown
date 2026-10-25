# wolf_rider_board_turnaround – Brett-Turnaround Wolfsreiterin (generischer Gegner, Akt 1)

- **Dateien:** `art/turnarounds/wolf_rider_board/sheet.png` (1536 × 1024, unverändertes Original); daraus `front.png`, `side.png`, `back.png` (je 1024 × 1024, `tools/art/split_turnaround.py`)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif **Plus**, Konto `maschoeller`, Denkaufwand „Medium“), gesteuert über Claude in Chrome; Chat „Create Wolf Rider Turnaround“ (https://chatgpt.com/c/6add0aab-1ac0-83ed-ac20-80742b956d95, alle drei Gegnertypen nacheinander; Vorlage `brenna_board_turnaround.md`)
- **Referenzen:** `art/turnarounds/kael_board/sheet.png` (Stil und Format der Brettfigur), `art/mockups/characters-s1/class_wolf_rider.png` (Figur, `enemies_act1_2026-10-24.md`)
- **Zweck:** Eingabe für Tripo Smart-Mesh (Multi-View vorn / rechts / hinten), `concept/23-art-direction/art-direction.md` §4.6; Story 8.3
- **Iterationen:** 1
- **Menschlicher Anteil (A2):** Prompt, Wahl des Teamtuchs, Auswahl und Abnahme; Zerlegen per Skript

## Prompt

> Create an image. The FIRST attached image is the APPROVED board-figure turnaround of KAEL from my original fantasy tactics RPG 'Hollow Crown': a strongly simplified low-detail round-chibi figure for a small in-game 3D mobile figure (only about 120 pixels tall on a phone). The SECOND attached image shows a generic enemy, the WOLF RIDER (her approved character art). Draw a NEW turnaround sheet of the WOLF RIDER in EXACTLY the same format and style as the Kael sheet: FRONT view, SIDE view, BACK view side by side, same scale, feet on one baseline, same neutral A-pose (arms slightly away from the body, hands open), orthographic-like flat view, flat light-grey background #E6E6E6, no shadows, no floor, no text, no labels. STYLE exactly like the Kael sheet: round chibi about 2.5 heads tall with a big round head, large clean shapes and big flat colour areas, only one shadow tone, slightly thick dark-brown outlines, no fabric texture, no stitching, no small accessories, no dirt; like a polished low-poly hand-painted mobile game figure. CHARACTER WOLF RIDER (a woman, about 30, wiry): dark-blonde hair in TWO thick rough braids (clearly visible in side and back view), blue-grey war-paint stripe across the eyes, confident grin, a BIG SHAGGY GREY WOLF-FUR MANTLE over both shoulders and down the back to the waist as large simple fur shapes (signature, no wolf head, no hood), simple closed brown leather jerkin with a high neckline, brown leather bracers, dark-olive trousers, brown fur-trimmed boots. TEAM CLOTH: paint her wrapped waist cloth (a knee-long wrap skirt over the trousers, front and back) in ONE flat pure MAGENTA colour (#FF00FF) with NO shading, NO gradient and NO highlights, like a chroma-key mask. NO WEAPON anywhere: no spear, nothing on her back, nothing at the belt.

## Nachbearbeitung

`python tools/art/split_turnaround.py art/turnarounds/wolf_rider_board/sheet.png`. Die Seitenansicht blickt nach rechts, zeigt also die **rechte** Seite und geht ungespiegelt in Tripos Feld „Rechts“.

## Abnahme

- Vereinfacht wie die übrigen Brettfiguren ✓, zwei Zöpfe in Seiten- und Rückansicht ✓, großer Wolfsfellmantel ohne Kopf (Signatur) ✓, Wickelrock flach Magenta ✓, keine Waffe ✓, kein Text ✓, Seitenansicht blickt nach rechts ✓. Teamtuch (Wickelrock) vom Assistenten gewählt.

## Tripo (Bild-zu-3D)

- **Tarif und Konto (A1):** Tripo **Pro** (Kauf laut Entscheidungslog 2026-10-23), Datenschutz **Privat**; Credits vorher 1 165, nachher 925 (darin 100 für das parallel gestartete Söldner-Mesh) (Smart-Mesh 100, Textur 20, Auto-Rig 20)
- **Smart-Mesh P2.0**, Multi-View (Vorne = `front.png`, Rechts = `side.png`, Zurück = `back.png`, Links leer), Topologie Quad, 3 000 Polygone, 4 Varianten; gewählt **Variante 3** (Wickelrock mit Knoten wie im Turnaround, Zöpfe sichtbar, Fellmantel sauber; 3 672 Quads)
- **Textur:** Standard; **Rig:** Auto-Rig Humanoid, Skelett Mixamo; Export GLB, Textur 2k, mit Skelett, ohne Animationen, Dateiname `hcx_wolf_rider.glb`
- **Original (A3):** `art/models/source/wolf_rider_board_tripo.glb` (unverändert, Git LFS)
- **Aufbereitung:** `pnpm art:tripo wolf_rider` → `art/models/units/wolf_rider.glb`: 5 793 Dreiecke, Textur 512 × 512, 246 KB gepackt, ≈ 0,18 MB übertragen, Teamtuch 415 Vertices
