# Story 8.11: Abwechslungsreiche Karten und Besuchshäuser

Status: done

## Story

Als Spieler
möchte ich Karten mit unterschiedlichen Häusern, Bäumen und Felsen sehen und sofort erkennen, welche Häuser ich besuchen soll,
damit die Brettwelt lebendig wirkt und ich keine Ziele suchen muss.

## Acceptance Criteria

1. **Varianten:** Je Requisiten-Klasse mehrere Modelle: Häuser (`house_intact`, `house_b/c/d_intact`), Bäume je Jahreszeit (Sommer `tree_a..e`, Herbst `autumn_a..c`, Winter `snowfir_a/b`), Felsen (`rock_idle`, `rock_b`, `rock_c`), dazu Brunnen `well_idle` und Zauntor `fence_gate`.
2. **Deterministisch:** Die Wahl je Feld folgt aus Feld-Hash und Seed (`board.variants` in `content/core/render.yaml`); gleiche Nachbarn werden vermieden; optional überschreibt `propVariants: [{at, model}]` im Karten-YAML ein Feld; `content:check` prüft das. Replays und Screenshots bleiben stabil.
3. **Besuchshaus:** Terrain `village` zeigt die Requisite `lodge` (`lodge_intact`, `lodge_visited`, `lodge_razed`), klar anders als Kulissenhäuser (`building`).
4. **Benennung:** „Häuser besuchen“ in Zieltext, Kontext-Band, Toast, KI-Text und Geländename, DE und EN. Interne IDs `visit_villages` und `village` bleiben (Speicherformat, gesperrte IDs).
5. **Ziele markieren:** Tipp auf ein Nebenziel mit Ort markiert dessen offene Orte auf dem Brett (heller Ring, ungelit); zweiter Tipp oder `board.markMs` löscht sie. Gilt für Besuchen, Truhen, Anwerben, Schützen, Boss.
6. **Pakete:** Die 14 neuen Modelle stehen in `content/packs.yaml` unter `act1.props`, nicht im ersten Download; fehlt ein Paket, weicht die Wahl auf ein core-Modell aus.
7. **Leistung:** Bildrate nicht unter den Zielen aus Story 7.8 (`pnpm perf`).

## Tasks / Subtasks

- [x] T1 Referenzblätter per ChatGPT (`art/props/refs/{houses,trees,rocks_well}_variants.png`, `art/prompts/props_variants.md`)
- [x] T2 Blender-Modelle (`tools/art/props/houses_variants.py`, `nature_variants.py`)
- [x] T3 Variantenwahl, Besuchshaus, Benennung, Zielmarkierung (`scenery.ts`, `propVariants.ts`, `goalMarks.ts`, `overlays.ts`)
- [x] T4 Paketzuordnung (`packs.yaml props`, `model_packs.prop_packs`, `first-mission.mjs`)
- [x] T5 Alle Prüfungen, Screenshots (1-1, 1-2), PR #72
- [x] T6 Leistung: Rückgang bei 4× (Vorlagen-Materialien) behoben durch eingefrorene statische Materialien, abgeschaltete leere Vorlagen, Spaltenindex im Verdeckungsfilter (4× ca. 32–34 FPS, 2× 59,9, Draw Calls 50 bei Baseline 52)

## Dev Notes

- Die Manifest-IDs teilen am ersten Unterstrich (`house_b_intact` = pid `house`, Zustand `b_intact`).
- Entscheidungen: `concept/25-ux/.decision-log.md` (Haus/Zielmarkierung); Begriff „Häuser besuchen“ vom Produktinhaber am 2026-10-27 gewählt.
- `fence_gate` ist gebaut, aber noch von keinem Terrain genutzt.

## Offene Punkte (Stand 2026-10-28)

1. **`fence_gate`** ist gebaut und im Paket `act1`, aber kein Terrain nutzt es (Zäune werden als einzelne `fence_idle` gesetzt, `planFence` in `scenery.ts` ist nicht angeschlossen). Entscheidung offen: Terrain `fence_gate` oder Modell streichen.
2. **Moos auf `rock_b`** wirkt hell (nur in der Vorschau, nicht auf dem Brett beurteilt); nach Playtest ggf. nachfärben.
3. **Paket nachgeladen:** Ein bereits aufgebautes Brett aktualisiert sich nicht, wenn `act1` mitten im Spiel fertig wird; die Varianten erscheinen erst beim nächsten Aufbau (Prolog offline vor dem Download zeigt die core-Modelle).
4. **Baumverteilung** auf bestehenden Karten hat sich geändert (gewichtete Liste statt `r % 3`); Vergleichs-Screenshots früherer Stände weichen ab.
5. **Landschaft um die Karte** zeigt nur die ersten `board.sceneryVariants` (2) Modelle je Klasse (Draw Calls); erhöhen, wenn sie zu gleichförmig wirkt, und neu messen.
6. **Eingefrorene Materialien** (`thawStatic`/`freezeStatic` in `board.ts`): wer Licht, Nebel, Schatten, Qualität oder Terrain/Props zur Laufzeit ändert, muss `thawStatic()` aufrufen. Figuren-Materialien sind bewusst nicht eingefroren (ca. 0,7 ms Potenzial, braucht Prüfung von Tint- und Fade-Pfad).
7. **Weitere Brettansichten** nicht einzeln geprüft: Morgen, Nacht, 1-3 bis 1-8, N1–N3, Herbst/Winter-Sets (Akt 2/3). Verdeckung (Schleier) und Wetter nach dem Einfrieren nur durch die Testsuite abgedeckt; Sichtprüfung im Playtest.
8. **Dreiecksbudget Herberge:** `lodge_intact` 1598 und `lodge_visited` 1686 Dreiecke liegen knapp über dem im Brief genannten Richtwert 1500 (`house_razed` 1432); ein verbindliches Requisiten-Budget steht nicht in `packs.yaml`.
9. **Stil der Häuser:** Die Referenzblätter sind detailreicher als `houses.png`; die Blender-Modelle sind Low-Poly nachgebaut. Abnahme-Kästchen in `art/prompts/props_variants.md` zeichnet der Produktinhaber ab.
10. **Zielmarkierung:** Tipp auf Nebenziele mit Ort markiert jetzt, statt die Zielliste zu öffnen (die Liste öffnet die Runden-Pille). Pfeilhöhe `look.marker.chevronHeight` ist geschätzt; bei sehr hohen Dächern kann der Pfeil verdeckt werden.
11. **Benennung:** Interne IDs `visit_villages`/`village` bleiben (Speicherformat); wer den Begriff später auch intern angleicht, braucht Migration und `renames.yaml`.
12. **E2E-Stabilität:** `goalmarks` und `worker` laufen unter hoher Rechnerlast ins Zeitlimit; einzeln und in CI grün.

## Abnahme (2026-10-31)

Abgenommen im Spiel (Mission 1-1 und 1-2: Besuchshäuser als eigene Requisite, Hausvarianten, Zielmarkierung per Tipp) und gegen den Code geprüft. Offen als Nacharbeit (Produktinhaber 2026-10-31): `fence_gate` gebaut, aber von keinem Gelände genutzt; Abnahme-Kästchen der Referenzblätter in `art/prompts/props_variants.md`. Hinweis: Das lokale Asset-Manifest (`public/assets/manifest.json`) muss nach dem Pull mit `pnpm art:build` neu erzeugt werden, sonst fehlen die Varianten im Dev-Server. Status: done.
