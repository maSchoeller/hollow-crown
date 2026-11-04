# paktwacht_berg – Mischbild für die Paktwacht in der Bergflanke

Richtungsbild für das 3D-Modell der Heimat-Burg (Art Direction §7). Arbeitsreferenz, kein Spiel-Asset; nicht von `pnpm art:build` verarbeitet.

- **Datei:** `art/mockups/paktwacht-berg/paktwacht_berg_mix_v1.png` (1024 × 1536, unverändertes Original, Git LFS; A3), Übersicht in `art/mockups/paktwacht-berg/README.md`
- **Datum:** 2026-11-04
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; Download per `fetch` der Bildquelle im Chat (Original-PNG)
- **Tarif und Konto zum Erzeugungsdatum (A1):** ChatGPT **Plus**, Konto `maschoeller` (Seitenleiste der Oberfläche, 2026-11-04); keine Modell-Versionsnummer sichtbar (Denkaufwand „Medium“)
- **Chat:** https://chatgpt.com/c/6aeb6814-6ad0-83ed-8b3b-ae9809f7c5d0
- **Referenzen:** `art/mockups/paktwacht-berg/ref_weltkarte_probe_b_ausschnitt.png` (Ausschnitt aus `art/world/v4/probe_b_inhabited.png`, eigenes früheres ChatGPT-Bild, PR 99) und `art/mockups/castle3d-refs/paktwacht_diorama_l3.png` (eigenes früheres ChatGPT-Bild)
- **Menschlicher Anteil (A2):** Idee, Aufbau von oben nach unten, Auswahl und Abnahme. Keine Nachbearbeitung des Bilds. Der prägende Eigenanteil ist die eigene Modellierung in Blender (`tools/art/blender_paktwacht.py`).
- **A7:** Prompt ohne Namen geschützter Werke, Marken, Studios, Spiele oder Künstler

## Prompt (ein Lauf, beide Referenzen als Anhang)

> Create an image, portrait format 2:3. Concept art for the home castle of a mobile tactics RPG, seen from the game camera: a high three-quarter bird's-eye view from the south, looking slightly down at a mountainside. The first attached image shows WHERE the castle sits: built into the southern flank of a grey rocky mountain wall, a dirt road climbing to its gate, stepped terraced fields below it, a watermill on a small river in the green land in front. The second attached image shows HOW it is built and painted: chunky rounded diorama style, warm sandstone blocks, big round keep tower, slate blue and terracotta roofs, ember orange banners, a gate flanked by two square pillars with a dragon relief and a crown relief, warm evening light. Combine them. Composition from top to bottom: at the top grey rock cliffs that embrace the castle from behind and from both sides, with a mountain pass road disappearing up a gap beside it and a dark vaulted cave door in the rock face behind the courtyard. Then the upper castle on a rock ledge (keep, round tower, great hall). Below it a lower courtyard with several small separate buildings around a campfire (forge, tavern, market stall, wagon shed, herb garden, a small rune tower, training yard). Then a curtain wall with the gate in the front. Below the gate three or four curved terraces with golden fields and a few small farmhouses, then green meadows, a winding river with a mill and a small stone bridge along the bottom. The buildings must read as clearly separate, large enough to tap on a phone. Late summer, warm evening light. Hand-painted, rounded, toy-like forms, serious but cozy. No people, no text, no labels, no UI, no crosses, no blue or red banners.

## Abnahme

Ein Lauf. Produktinhaber 2026-11-04: **Richtung abgenommen** („genau so“). Beim Modellieren abweichend entschieden: flachere Kamera (30°), quadratische Felder statt langer Terrassenstreifen, mehr Land nach unten (siehe `concept/23-art-direction/decision-log.md`).
