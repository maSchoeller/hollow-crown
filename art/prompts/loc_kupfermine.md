# loc_kupfermine – Bergwerk bei Kupferhall (Akt 2, N5 „Glut unter dem Berg“)

- **Datei:** `art/mockups/locations-s1/kupfermine.png` (1672 × 941, RGB, 16:9); unveränderter Download aus ChatGPT, kein Skalieren, keine Retusche, C2PA-Metadaten erhalten (A3).
- **Datum:** 2026-11-07
- **Dienst:** ChatGPT (Bildgenerierung, Einstellung „Mittel“), gesteuert über Claude in Chrome; Tarif **Plus**, Konto `maschoeller` (Profilmenü, 2026-11-07); keine Modell-Versionsnummer sichtbar (A1, A2)
- **Chat:** https://chatgpt.com/c/6aeef3ce-f978-83eb-a104-7f42c320ecb8 (ein Chat für alle sieben Ortsbilder von Akt 2, Nachricht 6 von 7)
- **Referenzen:** `art/mockups/locations-s1/erlbach.png`, `wachturm.png`, `brandhang.png` (eigene Ortsbilder derselben Reihe, erste Nachricht des Chats)
- **Zweck:** Dialoghintergrund und Ort (`place`) der Mission N5 „Glut unter dem Berg“, Entwurf `concept/27-ueberarbeitung/levels/s2_n5_mine.yaml`, Story 11.19; Licht: innen (`timeOfDay: indoor`)
- **Iterationen:** 1 (keine Korrektur nötig)
- **Menschlicher Anteil (A2):** Ortsbeschreibung nach Entwurf, Geografie und Art Direction, Wahl der Referenzen, Prompt, Prüfung durch den Assistenten im Auftrag des Produktinhabers; keine Retusche
- **A7:** keine Namen fremder Werke, Marken, Studios oder Künstler im Prompt
- **Einbindung:** noch nicht im Spiel, weil es Akt 2 im Content noch nicht gibt. `pnpm art:build` baut das Bild erst, wenn die Id in `ACT2_LOCATIONS` (`tools/art/build.py`) steht; Weg in Epic 11, Abschnitt „Ortsbilder“.

## Prompt

> Very good. Next location - same style and format (16:9, no people, no animals, no text, no logos; important content in the central third; lower third calm). Location 6: the OLD COPPER MINE near Kupferhall, an INTERIOR deep under the mountain: a wide hall where several narrow timber-propped mine tunnels meet, rough reddish-brown rock walls with green copper veins, wooden support beams, mine-cart rails on the floor with a small ore cart, hanging oil lanterns casting warm pools of light, darker corners fading into soft blue-black haze. On the left a heavy locked iron-bound wooden door set in the rock, on the right an iron portcullis gate with a big wooden wall lever beside it. In the centre back, half embedded in the rock wall, the HUGE fossil BONES of an ancient dragon: giant ribs and part of a horned skull of pale stone, with faint glowing ember-orange cracks in the rock around them, mysterious and awe-inspiring. A few old wooden chests in the corners. Warm amber lantern light against cool shadow blue, readable, not too dark. Mysterious and quiet, but warm and inviting.

## Abnahme

- Stollenhalle mit Kupferadern, Gleisen und Lore ✓, verschlossene Tür links ✓, Fallgatter mit Hebel rechts ✓, Drachenknochen in der Wand mit Glutrissen ✓ (Drachenort Erde laut Geografie), Truhen ✓; hell genug ✓. Keine Menschen oder Tiere, kein Text ✓.
- Abnahme durch den Produktinhaber: abgenommen am 2026-11-07 (Übersicht `concept/23-art-direction/abnahme/akt2-ortsbilder.md`).
