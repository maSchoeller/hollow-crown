# temple_guard_board_turnaround – Brett-Turnaround Tempelwache der Paktgarde (generischer Gegner, Akt 1)

- **Dateien:** `art/turnarounds/temple_guard_board/sheet.png` (1536 × 1024, unverändertes Original); daraus `front.png`, `side.png`, `back.png` (je 1024 × 1024, `tools/art/split_turnaround.py`)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif **Plus**, Konto `maschoeller`, Denkaufwand „Medium“), gesteuert über Claude in Chrome; Chat „Create Wolf Rider Turnaround“ (https://chatgpt.com/c/6add0aab-1ac0-83ed-ac20-80742b956d95, alle drei Gegnertypen nacheinander; Vorlage `brenna_board_turnaround.md`)
- **Referenzen:** `art/turnarounds/kael_board/sheet.png` (Stil und Format der Brettfigur), `art/mockups/characters-s1/class_temple_guard.png` (Figur, `enemies_act1_2026-10-24.md`)
- **Zweck:** Eingabe für Tripo Smart-Mesh (Multi-View vorn / rechts / hinten), `concept/23-art-direction/art-direction.md` §4.6; Story 8.3
- **Iterationen:** 1
- **Menschlicher Anteil (A2):** Prompt, Wahl des Teamtuchs, Auswahl und Abnahme; Zerlegen per Skript

## Prompt

> Approved. Next turnaround sheet in EXACTLY the same format and style as the Kael sheet and your two previous sheets: FRONT, SIDE, BACK side by side, same scale, feet on one baseline, neutral A-pose with open hands, flat light-grey background #E6E6E6, no shadows, no floor, no text; round chibi about 2.5 heads tall, big flat colour areas, one shadow tone, slightly thick dark-brown outlines, no small accessories. The attached image shows the generic enemy TEMPLE GUARD of the Pact Guard (a woman, about 25): open-faced rounded ivory-and-gold helmet with a small carmine plume (signature, readable from all sides), chin-length chestnut hair, serious face; smooth ivory plate armour with simple gold trim and big rounded pauldrons, white gloves, ivory greaves over brown boots. TEAM CLOTH: paint her tabard (front and back panel, from chest to knees; leave out the crown emblem, just plain cloth) and her short cape on the back in ONE flat pure MAGENTA colour (#FF00FF) with NO shading, NO gradient and NO highlights. NO WEAPON anywhere: no spear, no shield.

## Nachbearbeitung

`python tools/art/split_turnaround.py art/turnarounds/temple_guard_board/sheet.png`. Die Seitenansicht blickt nach rechts, zeigt also die **rechte** Seite und geht ungespiegelt in Tripos Feld „Rechts“.

## Abnahme

- Vereinfacht ✓, Helm mit Karmin-Busch als Signatur ✓, Wappenrock und kurzer Umhang flach Magenta (ohne Kronen-Emblem) ✓, keine Waffe ✓, kein Text ✓, Seitenansicht blickt nach rechts ✓. Teamtuch vom Assistenten gewählt.

## Tripo (Bild-zu-3D)

- **Tarif und Konto (A1):** Tripo **Pro** (Kauf laut Entscheidungslog 2026-10-23), Datenschutz **Privat**; Credits Stand nach dem Rig 745 (zusammen mit Wolfsreiterin und Söldner 420) (Smart-Mesh 100, Textur 20, Auto-Rig 20)
- **Smart-Mesh P2.0**, Multi-View (Vorne = `front.png`, Rechts = `side.png`, Zurück = `back.png`, Links leer), Topologie Quad, 3 000 Polygone, 4 Varianten; gewählt **Variante 1** (sauberer Helm, symmetrischer Wappenrock)
- **Textur:** Standard; **Rig:** Auto-Rig Humanoid, Skelett Mixamo; Export GLB, Textur 2k, mit Skelett, ohne Animationen, Dateiname `hcx_temple_guard.glb`
- **Original (A3):** `art/models/source/temple_guard_board_tripo.glb` (unverändert, Git LFS)
- **Aufbereitung:** `pnpm art:tripo temple_guard` → `art/models/units/temple_guard.glb`: 6 418 Dreiecke, Textur 512 × 512, 269 KB gepackt, ≈ 0,20 MB übertragen
