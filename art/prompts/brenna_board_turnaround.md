# brenna_board_turnaround – Brett-Turnaround mit Teamtuch-Maske

- **Dateien:** `art/turnarounds/brenna_board/sheet.png` (1536 × 1024, Original); daraus `front.png`, `side.png`, `back.png` (je 1024 × 1024, `tools/art/split_turnaround.py`)
- **Datum:** 2026-10-23
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; Chat „Create Brenna Turnaround Sheet“
- **Referenzen:** `art/turnarounds/kael_board/sheet.png` (Stil und Format der Brettfigur), `art/mockups/characters-s1/brenna.png` (Figur)
- **Zweck:** Eingabe für Tripo Smart-Mesh (Multi-View vorn / rechts / hinten), `concept/23-art-direction/art-direction.md` §4.6
- **Iterationen:** 1

Abweichend von §4.6 Schritt 1 ohne eigenes Porträt-Turnaround: Kaels Brett-Turnaround legt Stil und Vereinfachung fest, das Moodboard-Bild die Figur. Beide Stufen der Vorlage (`kael_board_turnaround.md`) in einem Prompt.

## Prompt

> Create an image. The FIRST attached image is the APPROVED board-figure turnaround of KAEL from my original fantasy tactics RPG 'Hollow Crown': a strongly simplified low-detail round-chibi figure for a small in-game 3D mobile figure (only about 120 pixels tall on a phone). The SECOND attached image shows BRENNA (her approved character art). Draw a NEW turnaround sheet of BRENNA in EXACTLY the same format and style as the Kael sheet: FRONT view, SIDE view, BACK view side by side, same scale, feet on one baseline, same neutral A-pose (arms slightly away from the body, hands open), orthographic-like flat view, flat light-grey background #E6E6E6, no shadows, no floor, no text, no labels. STYLE exactly like the Kael sheet: round chibi about 2.5 heads tall with a big round head, large clean shapes and big flat colour areas, only one shadow tone, slightly thick dark-brown outlines, no fabric texture, no stitching, no small accessories, no dirt; like a polished low-poly hand-painted mobile game figure. CHARACTER BRENNA (41, fighter, broad and sturdy, clearly a woman): copper-red curly hair with ONE THICK BRAID hanging over her back (signature, must be clearly visible in side and back view), freckles, cheerful confident face, big cream-and-brown FUR COLLAR over the shoulders, simple grey chainmail shirt shown as a flat grey area, brown leather vest with at most two belts, bare strong forearms with brown leather bracers, ember-orange (#E8743B) arm band on her left upper arm, dark trousers, brown boots. TEAM CLOTH: paint a short simple cape on her back (hanging from under the fur collar to the hips) and the two hanging cloth panels of her waist skirt (front and back) in ONE flat pure MAGENTA colour (#FF00FF) with NO shading, NO gradient and NO highlights, like a chroma-key mask. NO WEAPON anywhere: no axe in her hands, none on her back, none at the belt, no scabbard.

## Nachbearbeitung

`python tools/art/split_turnaround.py art/turnarounds/brenna_board/sheet.png`: Schnitte an den Spalten 565 und 953. Die Seitenansicht blickt nach rechts, zeigt also die **rechte** Seite und geht ungespiegelt in Tripos Feld „Rechts“.

## Abnahme

- Vereinfacht wie Kael ✓, dicker Zopf in Seiten- und Rückansicht ✓, Fellkragen ✓, Glutorange-Armbinde ✓, Umhang und Rockbahnen flach Magenta ✓, keine Waffe ✓, kein Text ✓.
- Teamtuch (Umhang + Rockbahnen) vom Assistenten gewählt; Produktinhaber kann es noch ändern.
