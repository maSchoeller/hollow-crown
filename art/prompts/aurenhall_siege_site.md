# aurenhall_siege_site – Stadtbild Aurenhall, belagert

- **Zweck:** Zustandsvariante `aurenhall_siege` des Stadtbilds Aurenhall auf der Weltkarte, ab Mission 3-5 (Produktinhaber 2026-11-06: belagert schon beim Anrücken vor der Stadtschlacht 3-6 und danach; `content/world/valmora.yaml`, solange Akt 3 keine Knoten hat `requires: [{ act: 3 }, { storyCount: { min: 4 } }]`).
- **Datum:** 2026-11-06
- **Dienst:** ChatGPT, Bildgenerierung (Modellversion in der Oberfläche nicht genannt), **Tarif Plus, Konto maschoeller** (Anzeige in der Seitenleiste am Erzeugungstag), gesteuert über Claude in Chrome.
- **Referenzen (eigene Bilder):** (1) Ausschnitt der Weltkarte um das Plateau von Aurenhall aus `art/world/map_v5.png` (800 × 620 px), (2) `art/world/sites/aurenhall_v2.png` (Grundbild).
- **Originaldatei, unverändert:** `art/world/v5/aurenhall_siege_chatgpt.png` (1254 × 1254, RGBA; Download „Aurenhall unter winterlicher Belagerung.png“).
- **Abgeleitet:** `art/world/sites/aurenhall_siege.png` – Alphawerte unter 16 auf 0; Laufzeitbild `world/sites/aurenhall_siege.webp` über `pnpm art:build`.
- **Menschlicher Anteil:** Motiv und Zeitpunkt vom Produktinhaber; Prompt, Auswahl und Einpassung (Vorschau per Skript, Breite 106 von 1254 wie das Grundbild) im Agenten-Ablauf. Keine Retusche von Hand.

## Prompt

Anhänge: zuerst der Kartenausschnitt mit dem Plateau, dann `aurenhall_v2.png`.

> Create a single isolated building icon for the empty plateau of the city in the FIRST attached image. Subject: the royal capital Aurenhall UNDER SIEGE in winter, the same city as in the SECOND attached image with the same golden dome palace, spires, ring of snowy houses and city wall with its big gate: now a ring of siege camp tents in dull grey and dark red stands in front of the wall, two large wooden siege towers and one catapult face the gate, a few dark banners fly over the tents, two thin columns of grey smoke rise from inside the city, the gate is shut. Same footprint and size as the city in the SECOND image, the siege camp stays inside that footprint. No people, no text, no fire flames. Exactly the drawing style, viewing angle and light of the attached images. It will be shown small on the map, so use FEW, LARGE, SIMPLE shapes and a THICK dark-brown outline; no tiny details. Transparent background. No ground, no base, no snow field around it, no shadow outside the buildings. Square 1:1.

Eine Iteration, erster Wurf übernommen.

## Abnahme

- 2026-11-06, Agent (Abnahme an Agenten delegiert): Palast, Kuppel und Mauer wie im Grundbild, davor Zelte, zwei Belagerungstürme und ein Katapult, Tor geschlossen, dünner Rauch. Ein schmaler Schneerand unter dem Lager bleibt sichtbar; er liegt auf dem verschneiten Plateau und stört nicht. Auf dem Plateau geprüft.
- Licensing §6 A7: generisches Motiv, keine Namen geschützter Werke im Prompt.
- Wer belagert, steht noch nicht fest (Narrative-Log 2026-11-06); das Bild zeigt neutrale grau-rote Zelte ohne Wappen. Der Produktinhaber sieht es im PR.
