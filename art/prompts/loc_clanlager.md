# loc_clanlager – Clanlager im Schnee (Akt 2, N4 „Der Clan im Schnee“)

- **Datei:** `art/mockups/locations-s1/clanlager.png` (1672 × 941, RGB, 16:9); unveränderter Download aus ChatGPT, kein Skalieren, keine Retusche, C2PA-Metadaten erhalten (A3).
- **Datum:** 2026-11-07
- **Dienst:** ChatGPT (Bildgenerierung, Einstellung „Mittel“), gesteuert über Claude in Chrome; Tarif **Plus**, Konto `maschoeller` (Profilmenü, 2026-11-07); keine Modell-Versionsnummer sichtbar (A1, A2)
- **Chat:** https://chatgpt.com/c/6aeef3ce-f978-83eb-a104-7f42c320ecb8 (ein Chat für alle sieben Ortsbilder von Akt 2, Nachricht 5 von 7)
- **Referenzen:** `art/mockups/locations-s1/erlbach.png`, `wachturm.png`, `brandhang.png` (eigene Ortsbilder derselben Reihe, erste Nachricht des Chats)
- **Zweck:** Dialoghintergrund und Ort (`place`) der Mission N4 „Der Clan im Schnee“, Entwurf `concept/27-ueberarbeitung/levels/s2_n4_clan.yaml`, Story 11.18; Licht: Morgen, erster Schnee (Karte `season: winter`, Story 15.15)
- **Iterationen:** 1 (keine Korrektur nötig)
- **Menschlicher Anteil (A2):** Ortsbeschreibung nach Entwurf, Geografie und Art Direction, Wahl der Referenzen, Prompt, Prüfung durch den Assistenten im Auftrag des Produktinhabers; keine Retusche
- **A7:** keine Namen fremder Werke, Marken, Studios oder Künstler im Prompt
- **Einbindung:** noch nicht im Spiel, weil es Akt 2 im Content noch nicht gibt. `pnpm art:build` baut das Bild erst, wenn die Id in `ACT2_LOCATIONS` (`tools/art/build.py`) steht; Weg in Epic 11, Abschnitt „Ortsbilder“.

## Prompt

> Very good. Next location - same style and format (16:9, no people, no animals, no text, no logos; important content in the central third; lower third calm). Location 5: the CLAN CAMP IN THE SNOW, the hidden winter camp of a small hunters' clan in the Ironmark mountains, on a MORNING with the FIRST EARLY SNOW of the year: a clearing in a mountain forest of dark firs and a few last orange-leaved larches and birches, everything lightly dusted with fresh white snow, soft snowflakes falling. In the clearing a ring of round hide-and-felt tents and a low log longhouse with a turf roof, smoke rising from a central fire pit with warm glow, racks with drying furs, bows and spears leaning against a wooden fence, sledges and stacked firewood. At the right edge a tall rock spur with a small wooden lookout platform (a hunter's high seat) on top, reached by a ladder, looking out over the trees. Low drifting mist between the tree trunks at the edges of the clearing, so the forest fades into white. Cool white and ice blue with warm amber firelight. Quiet, cold and watchful, but cosy, warm and beautiful.

## Abnahme

- Lichtung im Bergwald, früher Schnee mit letztem Herbstlaub ✓ (passt zu `season: winter` der Karte und zum Herbst von Akt 2), Zeltring und Langhaus ✓, Feuerstelle ✓, Hochsitz auf der Felsnase rechts ✓, Nebel am Waldrand ✓. Keine Menschen oder Tiere, kein Text ✓.
- Abnahme durch den Produktinhaber: offen (Übersicht `concept/23-art-direction/abnahme/akt2-ortsbilder.md`).
