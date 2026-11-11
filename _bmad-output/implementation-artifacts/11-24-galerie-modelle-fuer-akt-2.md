# Story 11.24: Galerie-Modelle für Akt 2

Status: review

## Story

Als Spieler
möchte ich auf den Karten von Akt 2 die Kulisse sehen, die beim Leveldesign abgenommen wurde,
damit Brett und Abnahme-Ansicht übereinstimmen.

## Acceptance Criteria

1. **Angenommen** die Galerie (`concept/23-art-direction/map-assets/groups/`), `map-assets/matrix.md` und die Karten von Akt 2, **wenn** nur die Modelle in den Build kommen, die eine Karte von Akt 2 zeichnet (Paket `act2`, Auswahl im Art-Log), und fehlende laut Matrix entstehen (u. a. Koppel, Stall, Gestüt, Getreideterrasse, Bergdorf, Hängebrücke, Wasserfall, Kai, Lagerhaus, Kran, Gaukelbühne, Stollen, Lore, Drachenknochen, Fackel; Deko-Pferd für 2-3 in Blender ohne Reittier-Pipeline),
2. **dann** besteht jedes Modell die vier Lesbarkeitsregeln (art-direction §3.2), Dreiecks- und Paket-Budget halten,
3. **und** `content:check` meldet kein fehlendes Modell; Modelle, die schon in `act1` liegen, stehen mit Paket-Entscheidung im Art-Log.

## Bedarfsanalyse (Ergebnis der Story-Vorbereitung)

Die Matrix ist älter als die Galerie-Nachtläufe: fast alle als „fehlt“ geführten Modelle liegen schon als Galerie-Modell unter `art/models/props/` (Skripte `tools/art/props/{village,coast,interior}.py`), aber ohne `ships: true`. Neu zu bauen ist nur das **Deko-Pferd** (`horse_a`). Das Brett zeichnet nur, was eine Karte als Gelände (`terrain.yaml prop`) oder per `propVariants` nennt (Story 15.8). Zuordnung:

| Karte | Feld / Gelände | Heute | Galerie-Modell | Weg |
|---|---|---|---|---|
| 2-3 Rabenweide | Koppel, Stall, Scheune, Heu | seit 11.14 im Spiel | `paddock_*`, `stable_a`, `barn_a`, `hay_a` | Paket-Entscheidung (liegen in `act1.props`) |
| 2-3 Rabenweide | Hof, `building` | Kulissenhaus | `horse_a` (neu, Pferd am Anbindebalken, sperrt) | `house` Gewicht 0, `propVariants` |
| 2-4 Brandschneise | `building` | Kulissenhaus | `house_slate_a`, `house_slate_b` (Bergdorf) | `house` Gewicht 0 |
| 2-4 Brandschneise | `field` | `field_open` | `terrace_a` (Getreideterrasse, begehbar) | `field` Gewicht 0 |
| 2-5 Silberquell | `footbridge` (2 Brücken) | Bohlensteg | `rope_bridge_straight`, `rope_bridge_end` | neues Gelände `rope_bridge` (Werte wie Steg), eigener Baukasten |
| 2-5 Silberquell | `mountain` an der Flussquelle | Felsmasse | `waterfall_a` | `rock` Gewicht 0, `propVariants` mit Drehung |
| 2-5 Silberquell | `building` im Kloster | Kulissenhaus | `monastery_a` | `house` Gewicht 0 |
| 2-6 Krähenholm | `building` (Inselspeicher) | Kulissenhaus | `warehouse_a`, `warehouse_b` (2 Felder), `crane_idle` | `house` Gewicht 0 |
| 2-7 Kontor | `building` | Kulissenhaus | `warehouse_a`, `warehouse_b`, `crane_idle` | `house` Gewicht 0 |
| 2-7 Kontor | Uferfelder `plain` (y 11, 15) | Boden | `quay_straight`, `quay_corner` | neues Gelände `quay` (Werte wie `plain`), eigener Baukasten |
| N5 Kupfermine | `sarcophagus` (Knochenhalle) | Sarkophag | `dragon_bones_a` (2 Felder) | `sarcophagus` Gewicht 0, `wide` für alle Klassen |
| N5 Kupfermine | `wagon` | Wagen | `mine_cart_idle` | neue Variantenklasse `wagon` |
| N5 Kupfermine | `rockwall` an Gangenden | Felsbrocken | `mine_entrance_a` (Stollen) | neue Variantenklasse `rockwall`, Drehung |
| N5 Kupfermine | `vault` mit Wand im Norden | Gewölbeboden | `torch_idle` (schon im Spiel) | Gelände `torch` (Werte wie `vault`) |
| N6 Auemarkt | `stall` | Marktstand | `stage_a` (Gaukelbühne), `tent_market_a` | `stall` Gewicht 0 |

Nicht übernommen (Art-Log): Klippe/Absturzkante, Steinschlag, Sandbank, Schiff, Boote, Kisten/Fässer/Poller, Schienen, Grubenstütze, Wachfeuer, Truhe B (kein Gelände der Karten zeichnet sie oder die Story nennt sie nicht; eigene Folgearbeit).

## Tasks / Subtasks

- [x] T1 Deko-Pferd `horse_a` in `tools/art/props/village.py` (headless Blender 5.2), Galerie-Eintrag, Prompt-/Abnahme-Notiz.
- [x] T2 Variantensystem: Klassen `wagon`, `rockwall`; `wide` für jede Klasse; optionale Drehung `rot` in `propVariants`.
- [x] T3 Gelände `rope_bridge`, `quay` (Regeln wie `footbridge` bzw. `plain`), Baukasten in `wallKit.ts`, Namen de/en, Handbuch.
- [x] T4 Galerie `ships: true`, `content/packs.yaml` `act2.props`; `prop_packs` gibt Requisiten eines unveröffentlichten Pakets dem letzten veröffentlichten (wie Figuren) statt `core`.
- [x] T5 Karten von Akt 2: `propVariants`, Legende (`rope_bridge`, `quay`, `torch`).
- [x] T6 Prüfung: Lesbarkeit, Dreiecke, Paketgröße; Tests; Spielbilder 375 × 812 (stumm); Art-Log, Matrix; `pnpm check`.

## Dev Notes

- Vorbild Story 15.8 (`15-8-galerie-modelle-fuer-akt-1.md`): Gewicht 0 = nur per `propVariants`; `validateBoardModels` prüft Datei und `ships`.
- Brett: `src/render/board/boardProps.ts` (Schalter je `prop`), Baukästen `wallKit.ts`; Varianten `src/content/propVariants.ts`; Prüfung `src/content/validateLook.ts` (`OWN_KIT`).
- `tools/art/model_packs.py prop_packs`: Requisiten, die nur ein unveröffentlichtes Paket nennt, fielen bisher an `core` (erster Download).
- Rowena und Figuren nicht anfassen (Story 11.25 parallel); Blender nur headless (`-b --factory-startup`).
- Spielwerte unverändert: neue Gelände kopieren die Werte; Simulationen der betroffenen Karten vor/nach vergleichen.

### Project Context Rules

- Spielwerte und Zuordnungen in YAML, kein sichtbarer Text im Code, Code/Commits Englisch, Konzept Deutsch.
- Entscheidungen in `concept/23-art-direction/decision-log.md`, nie in `01-decisions.md`.
- `act2` bleibt unveröffentlicht, kein `content:lock`.

### References

- `concept/26-epics/epics/epic-11.md` Story 11.24
- `concept/23-art-direction/art-direction.md` §3.2
- `concept/23-art-direction/map-assets/matrix.md`, `groups/*.yaml`
- `art/README.md` „3D-Modelle“

## Dev Agent Record

### Agent Model Used

claude-opus-5-5

### Completion Notes List

- Story-Datei per `gds-create-story` angelegt (Bedarf oben), umgesetzt mit `gds-dev-story`.
- Deko-Pferd `horse_a` neu in `tools/art/props/village.py` (headless Blender 5.2, 1 391 Dreiecke): Fuchs mit Blesse am Anbindebalken, Tränke am Kopf; Galerie-Eintrag ohne Referenzbild.
- Variantensystem: Klassen `wagon` und `rockwall`; `wide` für jede Klasse, neu `big` (2 × 2); `propVariants` mit `face` (Blickrichtung). Prüfung in `validatePropVariants` (Nachbarfelder bei `wide`/`big`).
- Gelände `rope_bridge` (Werte des Stegs, Deck wie der Bohlensteg) und `quay` (Werte von `plain`), Baukästen `ropeBridgePiece` (Anker am Ufer, auch nach dem Kappen in 2-5) und `quayPiece` (Steinkante zum offenen Wasser, Ecken); Namen de/en, Handbuch, Level-Blatt.
- Karten: 2-3 drei Pferde; 2-4 zehn Feldsteinhäuser, 48 Terrassen; 2-5 Hängebrücken, Kloster, vier Feldsteinhäuser, Wasserfall; 2-6 Speicher und Kran; 2-7 21 Speicher, zwei Kräne, 32 Kaifelder; N5 drei Drachenknochen, zwei Loren, zwei Stollen, sechs Fackeln; N6 Bühne und zwei Zelte. Spielwerte unverändert (Gelände-Werte kopiert, Test).
- Paket: 22 Modelle in `act2.props` (Koppel und Stall aus `act1` verschoben); `tools/art/model_packs.py prop_packs` legt Requisiten eines unveröffentlichten Pakets ins letzte veröffentlichte (act1) statt in den ersten Download; Manifest geprüft.
- Messung: 644–3 009 Dreiecke je Modell, zusammen 2,45 MB gzip; Paket act1 37,44 MB (Budget 40). Lesbarkeit im Spielblick: `concept/23-art-direction/map-assets/abnahme/11-24/modelle-spielkamera.jpg`, Karten 2-3, 2-4, 2-5, 2-7, N5 (375 × 812, stumm).
- Art-Log 2026-11-11 (Auswahl, Paket-Entscheidung für Modelle in act1, Ausschlüsse, offener Punkt Wasserfall), Matrix über `build.py` neu erzeugt, `art/README.md`.
- `pnpm check` grün (2 257 Tests).

### File List

- `tools/art/props/village.py`, `art/models/props/horse_a.glb`, `art/props/previews/horse_a.png`, `tools/art/model_packs.py`
- `content/core/render.yaml`, `content/core/terrain.yaml`, `content/core/handbook.yaml`, `content/core/locales/de.names.yaml`, `content/core/locales/en.names.yaml`, `content/packs.yaml`
- `content/acts/act2/maps/m2_3_rabenweide.yaml`, `m2_4_brandschneise.yaml`, `m2_5_silberquell.yaml`, `m2_6_kraehenholm.yaml`, `m2_7_kontor.yaml`, `n5_kupfermine.yaml`, `n6_auemarkt.yaml`
- `src/core/mapDefs.ts`, `src/core/renderDefs.ts`, `src/content/schemaMap.ts`, `src/content/schemaRender.ts`, `src/content/propVariants.ts`, `src/content/validateLook.ts`
- `src/render/board/boardProps.ts`, `src/render/board/wallKit.ts`, `src/render/shared/terrain3d.ts`, `tools/levels/sheet.ts`
- `tests/unit/act2-gallery.test.ts`, `tests/unit/scenery.test.ts`, `tests/unit/m2-3-rabenweide.test.ts`, `tests/unit/m2-5-silberquell.test.ts`
- `concept/23-art-direction/decision-log.md`, `concept/23-art-direction/map-assets/build.py`, `matrix.md`, `site/index.html`, `groups/{coast,interior,village}.yaml`, `abnahme/11-24/*.jpg`
- `art/README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
