# loc_aschedorf – verbranntes Dorf auf der Möwenzunge (Akt 2, Rückweg aus 2-6)

- **Datei:** `art/mockups/locations-s1/aschedorf.png` (1672 × 941, RGB, 16:9); unveränderter Download aus ChatGPT, kein Skalieren, keine Retusche (A3).
- **Datum:** 2026-11-10
- **Dienst:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; Tarif **Plus**, Konto `maschoeller`; keine Modell-Versionsnummer sichtbar (A1, A2)
- **Chat:** https://chatgpt.com/c/6af36a09-2880-83eb-9410-1da66ab98142
- **Referenzen:** `art/mockups/locations-s1/brandhang.png`, `kraehenholm.png`, `silberquell.png` (eigene, abgenommene Ortsbilder von Akt 2)
- **Zweck:** Dialoghintergrund der Szene `scn.m2_6.burnt_village` (Rückweg aus 2-6, nur nach E7 „warnen“): ein Dorf, das ohne Kampf von oben verbrannt ist (Drachenschatten). Vorher lief `brandhang` als Platzhalter (T7-17F4). Die Id `aschedorf` ist ein Arbeitsname, das Dorf hat im Narrative keinen Namen.
- **Iterationen:** 2 (Folgekorrektur „düsterer“ auf Wunsch des Produktinhabers, siehe unten)
- **Menschlicher Anteil (A2):** Ortsbeschreibung nach Szene und Geografie (Möwenzunge), Wahl der Referenzen, Prompt, Prüfung durch den Assistenten; keine Retusche
- **A7:** keine Namen fremder Werke, Marken, Studios oder Künstler im Prompt
- **Einbindung:** `ACT2_LOCATIONS` in `tools/art/build.py`, Paket act2 in `content/packs.yaml` (`locations/aschedorf.webp`), `background: aschedorf` in der Szene.

## Prompt

> Create an image. The attached images are the APPROVED STYLE REFERENCES for my original fantasy tactics RPG 'Hollow Crown': approved location backgrounds of the same series (characters are round chibi cartoon, the map is a bright toy-like 3D diorama) - match their painting style, level of detail and warm colours exactly: bright, warm, friendly stylised cartoon painting with soft rounded shapes, clean soft outlines, simple cel-like shading, readable silhouettes, warmth even in serious scenes; NOT photorealistic, NOT gritty, NOT dark painterly. Visual-novel dialogue background: widescreen landscape 16:9, no characters, no people, no animals, no text, no logos; important content in the central third; lower third calm. The location plays in act 2, in AUTUMN, on the MOEWENZUNGE (Gull Tongue), a long grassy peninsula of the Ironmark coast that dips south-west into the sea. Location: a small fishing and farming VILLAGE ON A HILLSIDE that has just BURNT DOWN, LATE AFTERNOON, overcast with a few breaks of warm light: a dirt road from the foreground leads up the gentle slope between the ruins of about six stone-and-timber cottages; their roofs have collapsed INWARD FROM ABOVE as if crushed by a great heat from the sky, the stone walls still stand, blackened at the top, charred roof beams lie inside, thin grey smoke rises from the ashes in a few places. NO signs of a battle: no weapons, no arrows, no torches, the fences and a well in the middle are untouched, a few apple trees beside the houses are scorched only on their tops. The grass around the village is burnt in a large round patch, beyond it the heather and rust-red autumn grass is untouched. In the background the grey-blue sea and the long coastline of the peninsula, a few gulls as tiny dots far away. High in the clouds above the sea a faint, huge dark shadow shape like a wing, only half visible, easy to miss. Quiet, sad and eerie, but still warm and beautiful.

## Abnahme

- Fünf Ruinen mit von oben eingebrochenen Dächern und verkohlten Balken ✓, dünner Rauch ✓, Brunnen und Zäune unversehrt, keine Kampfspuren ✓, verbrannter runder Fleck im Gras, Heide ringsum unversehrt ✓, Apfelbäume oben versengt ✓, Meer und Küste der Halbinsel ✓; Weg in der Mitte, unteres Drittel ruhig ✓. Keine Menschen oder Tiere, kein Text ✓.
- Abweichung: Himmel eher warm-golden statt bedeckt; der Flügelschatten in den Wolken ist kaum zu erkennen (die Szene erzählt ihn ohnehin im Text, l05).
- Der Produktinhaber verlangte am 2026-11-10 eine düsterere Fassung (gleicher Aufbau, Asche, grauer Rauchhimmel, verkohlte Bäume, kaum Herbstfarben).

## Folgekorrektur 2026-11-10 (gilt)

Im selben Chat; `aschedorf.png` ist jetzt dieser unveränderte Download (1672 × 941, RGB):

> Good layout. Now make the same location much GLOOMIER, keeping the exact same composition (the same road, the same ruined cottages in the same places, the well, the fences, the sea and coastline on the right): the whole slope around the village is covered in grey ASH and black burnt ground, the burnt patch reaches much further; the apple trees and other trees are CHARRED black and leafless, only stumps and bare black branches; almost no autumn colours left - the heather and grass are grey-brown and dull, only a few small muted rust tones far away at the edges. Sky: a low GREY, SMOKY overcast with drifting smoke and ash in the air, no golden sunset, no warm sunlight, only a pale cold light; more grey smoke rising from the ruins. The sea is dull grey-blue. High in the smoky clouds a faint, huge dark shadow shape like a wing, only half visible. Same painting style as before (stylised cartoon, soft rounded shapes, clean soft outlines), 16:9, no people, no animals, no text. Quiet, sad and eerie.

- Aufbau deckungsgleich (Weg, Ruinen, Brunnen, Zäune, Küste) ✓; Hang in Asche, Bäume verkohlt und kahl, kaum Herbstfarben ✓; grauer Rauchhimmel, kaltes Licht, mehr Rauch ✓; Flügelschatten oben rechts angedeutet ✓. Keine Menschen, kein Text ✓.
- Abnahme durch den Produktinhaber: offen (Kontaktbogen `akt2-bilder-aschedorf-v2.jpg` an die orchestrierende Session, 2026-11-10).
