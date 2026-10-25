# mercenary_board_turnaround – Brett-Turnaround Söldner (generischer Gegner, Akt 1)

- **Dateien:** `art/turnarounds/mercenary_board/sheet.png` (1536 × 1024, unverändertes Original); daraus `front.png`, `side.png`, `back.png` (je 1024 × 1024, `tools/art/split_turnaround.py`)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif **Plus**, Konto `maschoeller`, Denkaufwand „Medium“), gesteuert über Claude in Chrome; Chat „Create Wolf Rider Turnaround“ (https://chatgpt.com/c/6add0aab-1ac0-83ed-ac20-80742b956d95, alle drei Gegnertypen nacheinander; Vorlage `brenna_board_turnaround.md`)
- **Referenzen:** `art/turnarounds/kael_board/sheet.png` (Stil und Format der Brettfigur), `art/mockups/characters-s1/class_mercenary.png` (Figur, `enemies_act1_2026-10-24.md`)
- **Zweck:** Eingabe für Tripo Smart-Mesh (Multi-View vorn / rechts / hinten), `concept/23-art-direction/art-direction.md` §4.6; Story 8.3
- **Iterationen:** 1
- **Menschlicher Anteil (A2):** Prompt, Wahl des Teamtuchs, Auswahl und Abnahme; Zerlegen per Skript

## Prompt

> Approved. Next turnaround sheet in EXACTLY the same format and style as the Kael sheet (the first image of this chat) and your wolf rider sheet: FRONT, SIDE, BACK side by side, same scale, feet on one baseline, neutral A-pose with open hands, flat light-grey background #E6E6E6, no shadows, no floor, no text; round chibi about 2.5 heads tall, big flat colour areas, one shadow tone, slightly thick dark-brown outlines, no small accessories. The attached image shows the generic enemy MERCENARY (a man, about 35, stocky): dented round steel cap (signature, clearly readable from all sides), short dark-brown hair, short scruffy beard, crooked nose, smirk; simple smooth steel breastplate over a dirty-olive quilted gambeson shown as flat colour (no quilting lines), brown leather gloves, one brown belt with a small coin pouch, brown trousers, brown boots. TEAM CLOTH: paint his scarf around the neck (make it a big chunky scarf with one end hanging down the back) and the two cloth panels of his gambeson skirt below the belt (front and back) in ONE flat pure MAGENTA colour (#FF00FF) with NO shading, NO gradient and NO highlights. NO WEAPON anywhere: no sword, no scabbard.

## Nachbearbeitung

`python tools/art/split_turnaround.py art/turnarounds/mercenary_board/sheet.png`. Die Seitenansicht blickt nach rechts, zeigt also die **rechte** Seite und geht ungespiegelt in Tripos Feld „Rechts“.

## Abnahme

- Vereinfacht ✓, Kesselhaube als Signatur von allen Seiten lesbar ✓, Schal und Rockbahnen flach Magenta ✓, keine Waffe ✓, kein Text ✓, Seitenansicht blickt nach rechts ✓. Teamtuch vom Assistenten gewählt. Die Tripo-Figur ersetzt die alte Blender-Figur `mercenary` (gleiche id).

## Tripo (Bild-zu-3D)

- **Tarif und Konto (A1):** Tripo **Pro** (Kauf laut Entscheidungslog 2026-10-23), Datenschutz **Privat**; Credits Stand nach dem Rig 785 (die drei Figuren liefen verschränkt; zusammen 420 von 1 165) (Smart-Mesh 100, Textur 20, Auto-Rig 20)
- **Smart-Mesh P2.0**, Multi-View (Vorne = `front.png`, Rechts = `side.png`, Zurück = `back.png`, Links leer), Topologie Quad, 3 000 Polygone, 4 Varianten; gewählt **Variante 2** (sauberstes Gesicht (Nase, Bart) und Helmkrempe)
- **Textur:** Standard; **Rig:** Auto-Rig Humanoid, Skelett Mixamo; Export GLB, Textur 2k, mit Skelett, ohne Animationen, Dateiname `hcx_mercenary.glb`
- **Original (A3):** `art/models/source/mercenary_board_tripo.glb` (unverändert, Git LFS)
- **Aufbereitung:** `pnpm art:tripo mercenary` → `art/models/units/mercenary.glb`: 6 341 Dreiecke, Textur 512 × 512, 246 KB gepackt, ≈ 0,18 MB übertragen, Teamtuch 590 Vertices
