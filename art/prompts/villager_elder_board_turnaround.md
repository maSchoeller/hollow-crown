# villager_elder_board_turnaround – Brett-Turnaround Dorfältester (v2.5)

- **Dateien:** `art/turnarounds/villager_elder_board/sheet.png` (1536 × 1024, unveränderter Download, A3); daraus `front.png`, `side.png`, `back.png` (`tools/art/split_turnaround.py`, je 1024 × 1024). Ersetzt die Fassung vom 2026-10-26 (Glatze, Vollbart, `art/prompts/villager_board_turnaround.md`); die alte liegt in der Git-Historie (Commit `08b771a`).
- **Datum:** 2026-11-06
- **Werkzeug:** ChatGPT (Bildgenerierung, Denkaufwand „Medium“), gesteuert über Claude in Chrome; Tarif **Plus**, Konto `maschoeller` (Seitenleiste, 2026-11-06); keine Modell-Versionsnummer sichtbar
- **Anhänge:** `art/mockups/characters-s1/villager_elder.png` (Porträt v2.5, Korrektur 2026-11-03) und `art/turnarounds/ysolde_board/sheet.png` (nur als Format- und Stilvorlage)
- **Zweck:** Eingabe für Tripo Smart-Mesh (Multi-View vorn / rechts / hinten), `concept/23-art-direction/art-direction.md` §4.6; Story 15.14
- **Menschlicher Anteil (A2):** Figurenbeschreibung, Wahl des Teamtuchs, Prompt, Prüfung und Abnahme durch den Assistenten im Auftrag des Produktinhabers; keine Retusche
- **A7:** keine Namen fremder Werke, Marken oder Künstler im Prompt
- **Chat:** https://chatgpt.com/c/6aee1672-bb3c-83eb-9179-8da9dc9ee7af („Create Elder Turnaround“)
- **Iterationen:** 1
- **Teamtuch:** das Halstuch (im Porträt salbeigrün), etwas größer, vorn geknotet, hinten als Dreieck. Strohhut, Kinnbärtchen und Weste behalten ihre Farbe.

## Prompt

> Create an image. The first attached image is the APPROVED PORTRAIT of the VILLAGE ELDER, an old farmer in my original fantasy tactics RPG 'Hollow Crown'. The second attached image is an approved BOARD-FIGURE TURNAROUND of another character: copy its FORMAT and STYLE exactly (landscape 3:2, three views side by side: FRONT, SIDE looking to the RIGHT, BACK; wide spacing between the views, same scale, feet on one baseline, neutral A-pose with arms angled down and away from the body and hands open, flat light-grey background #E6E6E6, no shadows, no text, no labels). Do NOT copy that character's clothes, colours or the magenta robe - only format and drawing style. Draw the VILLAGE ELDER as a STRONGLY SIMPLIFIED round chibi board figure for a small 3D mobile game piece about 120 pixels tall: about 2.5 heads tall, big round head, large clean shapes, big flat colour areas, one shadow tone, slightly thicker dark-brown outlines, no fabric texture, no small accessories. BUILD: average, normal healthy proportions, slightly sturdy, a gentle stoop with the head pushed a little forward - NOT thin, NOT fat, no big belly. Keep him instantly recognisable from the portrait: a frayed wide-brimmed STRAW HAT (#D9B26A) with a dark brown hat band, drawn as ONE thick solid round brim (no holes, no loose straws sticking out, a few simple zigzag notches on the edge only); thin grey hair tufts under the hat at the sides and back; big ears; small deep-set hazel eyes, thin grey brows raised in the middle; thin slightly crooked nose; a small wispy grey CHIN TUFT (no full beard, no moustache); sun-browned skin with a few clean forehead lines. Clothes: an undyed linen shirt (#E3D8C0) with rolled sleeves, a brown wool vest (#7A5A3C) with two round buttons, a brown belt with a simple brass buckle, dark brown trousers, simple worn brown shoes. TEAM CLOTH: his NECKERCHIEF, knotted at the front with two short hanging tips and a triangle on the back, a bit larger than in the portrait, in ONE flat pure MAGENTA (#FF00FF), no shading, no gradient, no highlights, like a chroma-key mask. Nothing else is magenta; the hat, vest and shirt keep their normal colours. NO walking stick, NO weapon, nothing in his hands: hands open and empty.

## Abnahme

- Strohhut mit braunem Band und gezackter, geschlossener Krempe ✓; graue Haarbüschel, große Ohren, haselbraune Augen, hochgezogene Brauen, Zahnlücke (aus dem Porträt übernommen), dünnes Kinnbärtchen ohne Schnurrbart ✓; normal gebaut, nicht dick, nicht dünn ✓; Leinenhemd mit aufgerollten Ärmeln, braune Weste mit Knöpfen, Gürtel mit Messingschnalle ✓; Halstuch flach Magenta vorn und hinten ✓; ohne Stab, Hände leer ✓; Seitenansicht blickt nach rechts, kein Text ✓.
- Kleinigkeiten: Die Beuge ist kaum zu sehen; die Krempe ist breit und reicht beim Teilen in die Nachbarspalte, die drei Ausschnitte bleiben aber sauber.

## Tripo

2026-11-06, Konto `maschoeller`, Tarif laut Preisdialog „Free“, Credits aus dem bezahlten Tarif (Freigabe des Produktinhabers im Chat 2026-11-06: „Trotzdem bauen“), Datenschutz **Privat**. Vorher in „Assets“ geprüft, dass es keinen Ältesten nach dem neuen Porträt gibt. Smart-Mesh P2.0 Multi-View (Front = `front.png`, Right = `side.png`, Back = `back.png`), Quad, 3 000 Polygone, 4 Varianten (100), Textur (20), Auto-Rig Humanoid/Mixamo (20) = 140 Credits; Aufgabe `76d457c4-8b98-431c-8383-1e87596872ce`. Credits 205 → 65. Gewählt: Variante 1 von 4 (geschlossene Krempe, Ohren, Kinnbärtchen, Halstuchknoten; Variante 4 mit hängender Krempe verworfen). Export GLB mit Skelett, Textur 2k → `art/models/source/villager_elder_board_tripo.glb` (unverändert, A3); `pnpm art:tripo villager_elder` → `art/models/units/villager_elder.glb`, 6 533 Dreiecke, 512 px, 0,28 MB gz (Budget 7 000 / 512 / 0,5 MB).

- **Silhouette:** `art/previews/silhouettes_act1.png`, Gruppe „Bosses and NPCs“; der breite Hut über dem schmalen Körper ist eindeutig.
- **Vergleich:** `art/previews/figuren_15_14_elder.png` (Porträt | Turnaround | Workbench-Render vorn und ¾ | Ausschnitt im Spiel).
- **Im Spiel:** `art/previews/story_15_14_elder_m1_2.png` (1-2, 375 × 812, Ton aus; Software-Rendering, daher grob).
