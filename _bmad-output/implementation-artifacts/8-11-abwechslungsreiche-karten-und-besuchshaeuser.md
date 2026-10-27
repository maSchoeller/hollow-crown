# Story 8.11: Abwechslungsreiche Karten und Besuchshäuser

Status: in-progress (nachgetragen 2026-10-27)

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
- [ ] T5 Alle Prüfungen, Screenshots (1-1 und eine weitere Karte), PR

## Dev Notes

- Die Manifest-IDs teilen am ersten Unterstrich (`house_b_intact` = pid `house`, Zustand `b_intact`).
- Entscheidungen: `concept/25-ux/.decision-log.md` (Haus/Zielmarkierung); Begriff „Häuser besuchen“ vom Produktinhaber am 2026-10-27 gewählt.
- `fence_gate` ist gebaut, aber noch von keinem Terrain genutzt.
