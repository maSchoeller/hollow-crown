# Story 15.8: Galerie-Modelle für Akt 1

Status: done

## Story

Als Spieler
möchte ich auf den neuen Karten die Kulisse sehen, die beim Leveldesign abgenommen wurde,
damit Brett und Abnahme-Ansicht übereinstimmen.

## Acceptance Criteria

1. **Angenommen** die 113 Galerie-Modelle und `map-assets/matrix.md`, **wenn** nur die Modelle in den Build kommen, die eine abgenommene Karte von Akt 1 braucht (Art-Log), im Paket `act1`,
2. **dann** besteht jedes verwendete Modell die vier Lesbarkeitsregeln (art-direction §3.2), und Dreiecks- und Paket-Budget halten,
3. **und** `content:check` meldet kein fehlendes Modell; Akt 2 und 3 bekommen je eine eigene Story in ihrem Epic.

## Bedarfsanalyse (Ergebnis der Story-Vorbereitung)

Grundlage: die 12 Karten aus PR #104 (`content/acts/act1/maps/*.yaml`, Branch `claude/map-height-levels`, Umsetzung der Entwürfe `concept/27-ueberarbeitung/levels/s1_*.yaml`), die Matrix (Etappe 1 und 2) und die Galerie-Gruppen `concept/23-art-direction/map-assets/groups/*.yaml`.

Die Gruppen-Dateien zählen 124 Einträge: die 11 der Gruppe `fortify` (Probeset, schon im Spiel) und die 113 Galerie-Modelle des Nachtlaufs (AC 1). Von den 113 waren 23 schon mit `ships: true` im Build (Etappe 1/2 am 2026-11-05: Wald, Moor, Gewölbe, Hebel, Balliste, Fackel, Besuchshaus, Kornfeld …). `roof_tile_idle` bringt PR #104 mit. Ohne `ships` bleiben die Modelle laut `tools/art/build.py unshipped_props()` aus dem Build.

Das Brett zeichnet nur, was eine Karte als Gelände (terrain.yaml `prop`) oder Objekt nennt; Deko ohne Gelände (Banner, Trümmer, Säulen, Stümpfe, Gestelle) kann keine Karte von Akt 1 platzieren. Was die 12 Karten tatsächlich brauchen und noch fehlt:

| Karte | Gelände / Feld | Heute | Galerie-Modell | Matrix |
|---|---|---|---|---|
| 1-1 Steckbriefe | `stall` (6 Marktstände) | Zelt `tent_idle` | `market_a`, `market_b` | Marktstand, verbessern, Etappe 2 |
| 1-5 Hungerlager | `stall` (5 Lagerzelte) | Zelt `tent_idle` | `camp_tent_a` (für das Hungerlager gebaut) | Zelt, Lager |
| N3 Das Erbe | `building` (Mühle, Feld 8,3 am Brückenkopf) | Kulissenhaus | `mill_idle` | Mühle mit Rad, fehlt, Etappe 2 |

Bewusst nicht übernommen (Art-Log): `house_town_a/b` (Varnhold hat heute vier gute Kulissenhäuser, Matrix „vorhanden“; ein Stadtviertel-Satz bräuchte eine Auswahl je Karte), `chest_b_*` (Truhe ist Etappe 3 und beträfe den Prolog im Paket `core`), `field_burnt`, `vine_a`, `hay_a`, `barn_a`, `fence_wicker_a`, `sign_a`, `lantern_post_a`, `pillar_*`, `rubble_a`, `banner_a`, `grove_autumn_a`, `fir_a`, `deadtree_b`, `stump_a`, `bush_low_a`, `boulder_a`, `camp_rack_a`, `wolf_cave_a` (kein Gelände der Karten zeichnet sie; Deko ohne Gelände gehört in eine spätere Etappe).

## Tasks / Subtasks

- [x] T1 Variantenauswahl „nur von Hand“ (AC 1)
  - [x] `render.yaml board.variants`: Gewicht 0 = das Modell kommt nur über `propVariants` einer Karte, nie über den Feld-Hash. Schema `propVariantList` auf `weight >= 0`, mindestens ein Eintrag mit Gewicht > 0.
  - [x] `pickVariant` (`src/render/shared/scenery.ts`) würfelt nur über Einträge mit Gewicht > 0; Override bleibt wie gehabt.
  - [x] Neue Klasse `stall` in `src/content/propVariants.ts`; `terrain.yaml` `stall` trägt `prop: stall`; Board-Case in `boardProps.ts` (eine Zeile neben `field`/`relief`).
  - [x] Listen: `stall: [market_a 1, market_b 1, camp_tent_a 0]`, `house: … + mill_idle 0`.
- [x] T2 Paket und Galerie (AC 1, 3)
  - [x] `ships: true` an `market_a`, `market_b`, `camp_tent_a`, `mill_idle` (village.yaml, nature.yaml).
  - [x] `content/packs.yaml` `act1.props` um die vier Modelle ergänzen (nicht im ersten Download).
  - [x] `pnpm art:build` (Python 3.12, `git lfs pull` vorher): Manifest kennt die Modelle.
- [x] T3 Karten (nach Merge von PR #104 in `main`)
  - [x] `m1_5_hungerlager.yaml`: `propVariants` für die 5 `stall`-Felder → `camp_tent_a`.
  - [x] `n3_erbe.yaml`: `propVariants` für das Mühlenfeld → `mill_idle`.
- [x] T4 Prüfung (AC 2, 3)
  - [x] Lesbarkeit je Modell (sperrt = füllt Feld, höher als Figur; Deko flach; gleiche Wirkung gleiche Form) im Spielblick prüfen.
  - [x] Dreiecke/Größe messen (Referenz: Besuchshaus `lodge_b_intact` 2 518 Dreiecke, Figurenbudget 7 000) und Paket `act1` gegen 40 MB.
  - [x] Tests: `scenery.test.ts` (Gewicht 0, Klasse `stall`), `look.test.ts`/validateLook (Override auf Gewicht-0-Modell erlaubt).
  - [x] Screenshots 375 × 812 auf 1-2, 1-5, 1-7 (Entwürfe per `__hc.devMap`), zusätzlich 1-1/1-5/N3 mit den Spielkarten (als Fixture lokal laden), Spiel stumm.
  - [x] Art-Decision-Log: Auswahl und Ausschlüsse eintragen; Matrix-Befund (Marktstand, Mühle) über `build.py` aktualisieren, falls dort gepflegt.
  - [x] `pnpm check`, `bmad-code-review`.

## Dev Notes

- **Konflikte vermeiden:** 15.11 arbeitet in `src/render/board/`, PR #104 an Karten, `terrain.yaml`, `packs.yaml` (`roof_tile_idle`, `stairs_idle` raus aus act1) und `village.yaml` (`roof_tile_idle ships`). Änderungen im Brett-Code nur in `boardProps.ts` (ein `case`), Rest in Content/Schema. Vor dem Merge `main` einholen.
- **Paket-Zuordnung:** `content/packs.yaml` `act1.props`; `tools/art/model_packs.py prop_packs`; Manifest `models.propPacks`. Nicht gelistete Requisiten gehören zu `core` und landen im Vorab-Cache der ersten Mission.
- **Varianten:** `variantList` (`src/content/propVariants.ts`), Auswahl `pickVariant` mit Hash und Nachbarvermeidung, Override per `propVariants`; `validateLook.ts` prüft, dass ein Override in der Liste der Klasse steht. Zustände hängt `withState` nur an `_intact`-Modelle, `mill_idle` bleibt unverändert.
- **Modellnamen:** `<prop>_<state>`; `market_a` → Prop `market`, Zustand `a`. Fehlt ein Modell im Manifest, fällt die Auswahl auf das erste der Liste zurück.
- **Messung (art/models/props, gzip):** `market_a` 1 624 Dreiecke / 120 KB, `market_b` 1 582 / 122 KB, `camp_tent_a` 404 / 73 KB, `mill_idle` 3 026 / 172 KB; zusammen rund 0,5 MB fürs Paket `act1`.

### Project Context Rules

- Spielwerte und Zuordnungen in YAML, kein sichtbarer Text im Code, Code/Commits Englisch, Konzept Deutsch.
- Entscheidungen in `concept/23-art-direction/decision-log.md`, nie in `01-decisions.md`.
- Fertig erst mit `pnpm check` grün; nie auf `main` committen.

### References

- `concept/26-epics/epics/epic-15.md#Story 15.8`
- `concept/23-art-direction/art-direction.md` §3.2 (vier Lesbarkeitsregeln)
- `concept/23-art-direction/map-assets/matrix.md` (Etappe 1/2)
- `concept/23-art-direction/decision-log.md` 2026-11-04, 2026-11-05
- `tools/art/build.py` `unshipped_props`, `build_models`

## Dev Agent Record

### Agent Model Used

claude-opus-5-5

### Completion Notes List

- Story-Datei per `gds-create-story` angelegt; Bedarf an den 12 Karten aus PR #104 ermittelt (Tabelle oben).
- Gewicht 0 in `board.variants` = nur über `propVariants`; Schema verlangt mindestens ein Modell mit Gewicht > 0, `pickVariant` würfelt nur darüber, die Landschaft um die Karte nimmt nie ein Gewicht-0-Modell.
- Neue Variantenklasse `stall` (`market_a`, `market_b`, `camp_tent_a` mit Gewicht 0); `house` um `mill_idle` (Gewicht 0). Brett-Code: eine `case`-Zeile in `boardProps.ts`.
- `ships: true` und Paket `act1` für die vier Modelle, `tent_idle` (zeichnet kein Gelände mehr) aus dem ersten Download nach `act1`.
- Karten: 1-5 setzt seine 5 Stände auf `camp_tent_a`, N3 die Mühle auf Feld (8,3); das Rad liegt am Westrand der Brücke, deren Mitte frei bleibt. 1-1 würfelt Marktstände. Test pinnt das.
- `content:check` prüft jetzt jedes Brett-Modell aus `render.yaml` (Varianten samt Besuchs-Zuständen, Deko, Ersatzmodelle), aus `terrain.yaml` (`<prop>_idle`) und aus `propVariants`: Datei vorhanden und kein Galerie-Modell ohne `ships`. Fehlen Modellordner oder Galerie, meldet es das statt still zu überspringen.
- Messung: 404–3 026 Dreiecke je Modell, zusammen rund 0,5 MB gzip im Paket `act1` (Budget 40 MB, Build-Ausgabe im PR). Lesbarkeit: alle vier sperren, 1,07–1,26 Felder hoch (Figur rund 0,9), füllen das Feld.
- Belege (375 × 812): `concept/23-art-direction/map-assets/abnahme/15-8/` (Entwürfe 1-2, 1-5, 1-7 per `__hc.devMap`; Spielkarten 1-1 Markt, 1-5 Lager, N3 Mühle; Modellübersicht).
- Folge-Stories für Akt 2 und 3: 11.23 und 12.14 (Epics und Sprint-Status).
- Code-Review (`bmad-code-review`, vier Schichten): Befunde behoben (Landschaft ohne Gewicht-0-Modelle, Prüfung deckt Gelände-Requisiten und Zustände ab, Schema- und Galerie-Tests, Story-Buchführung, Folge-Stories, Karten-Overrides mit Test).

### File List

- `content/core/render.yaml`, `content/core/terrain.yaml`, `content/packs.yaml`
- `content/acts/act1/maps/m1_5_hungerlager.yaml`, `content/acts/act1/maps/n3_erbe.yaml`
- `src/content/schemas.ts`, `src/content/propVariants.ts`, `src/content/validateLook.ts`, `src/core/renderDefs.ts`
- `src/render/shared/scenery.ts`, `src/render/board/boardProps.ts`
- `tools/content-check.ts`
- `tests/unit/scenery.test.ts`, `tests/unit/look.test.ts`
- `concept/23-art-direction/map-assets/groups/village.yaml`, `nature.yaml`, `build.py`, `matrix.md`, `site/index.html`, `abnahme/15-8/*.jpg`
- `concept/23-art-direction/decision-log.md`
- `concept/26-epics/epics/epic-11.md`, `epic-12.md`, `index.md`, `concept/26-epics/html/epics.html`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
