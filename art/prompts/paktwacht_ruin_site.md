# paktwacht_ruin_site – Stadtbild der Paktwacht als Ruine

- **Zweck:** Stadtbild der Paktwacht auf der Weltkarte ab Spielbeginn (Produktinhaber 2026-11-06, Story 15.12). Die ausgebaute Burg `art/world/sites/paktwacht_v3.png` ist seitdem die Zustandsvariante `paktwacht_built` (ab Burgstufe 1, `content/world/valmora.yaml`).
- **Datum:** 2026-11-06
- **Dienst:** ChatGPT, Bildgenerierung (Modellversion in der Oberfläche nicht genannt), **Tarif Plus, Konto maschoeller** (Anzeige in der Seitenleiste am Erzeugungstag), gesteuert über Claude in Chrome.
- **Referenzen (eigene Bilder):** (1) Ausschnitt der Weltkarte um das leere Plateau der Paktwacht aus `art/world/map_v5.png` (700 × 580 px, für die Lage im Fels), (2) `art/world/sites/paktwacht_v3.png` (Form, Farbe und Grundriss der ausgebauten Burg).
- **Originaldatei, unverändert:** `art/world/v5/paktwacht_ruin_chatgpt.png` (1254 × 1254, RGBA, Download aus ChatGPT „Ruinen der Paktwacht.png“).
- **Abgeleitet:** `art/world/sites/paktwacht_ruin.png` – Alphawerte unter 16 per Skript auf 0 (wie bei allen Stadtbildern, siehe `world_map_v5.md`); Laufzeitbild `world/sites/paktwacht.webp` über `pnpm art:build`.
- **Menschlicher Anteil:** Motiv und Entscheidung (Ruine statt Burg, Zustand nach Art Direction §7 Burgstufe 0) vom Produktinhaber; Prompt, Auswahl und Einpassung auf das Plateau (Vorschau per Skript, Breite wie die Burg) im Agenten-Ablauf. Keine Retusche von Hand.

## Prompt

Anhänge: zuerst der Kartenausschnitt mit dem leeren Plateau, dann `paktwacht_v3.png`.

> Create a single isolated building icon for the empty round stone plateau inside the rock niche in the FIRST attached image. Subject: the Paktwacht as an abandoned RUIN, the same castle as in the SECOND attached image, but long fallen into ruin: the big round keep at the back is only a broken stump without its roof, the two front round towers are broken off at different heights with no roofs, the gatehouse has an empty arch with no gate, the walls between them have wide gaps with rubble heaps, a few green ivy patches and small bushes grow on the stones. Same warm light limestone colour and same footprint as the castle in the SECOND image: one oval that exactly fills the plateau, the back rises towards the rock behind it. No banners, no roofs, no lit windows, no people, no smoke. Exactly the drawing style, viewing angle and light of the attached images. It will be shown small on the map, so use FEW, LARGE, SIMPLE shapes and a THICK dark-brown outline; no tiny details, no brick patterns. Transparent background. No ground, no base, no rock or grass around it, no shadow outside the building, no text. Square 1:1.

Eine Iteration, erster Wurf übernommen.

## Abnahme

- 2026-11-06, Agent (Abnahme an Agenten delegiert): Stil, Umriss und Blickwinkel passen zu den übrigen Stadtbildern; Bergfried als Stumpf, Tor ohne Flügel, Lücken in der Mauer, Efeu und Gestrüpp wie in Art Direction §7 (Burgstufe 0). Auf dem Plateau in der Karte geprüft (Breite 72 von 1254, wie die Burg), Belege in `_bmad-output/implementation-artifacts/15-12-belege/`.
- Prüfung auf Ähnlichkeit zu bekannten Werken (licensing §6 A7): generisches Burgmotiv, keine Namen im Prompt.
- Der Produktinhaber sieht die Ruine im PR und auf dem Handy; Änderungswünsche gehen in eine neue Iteration.
