# Story 15.16: Winter-Deko und Waldvarianten (Folge zu 15.15)

Status: review

## Story

Als Spieler
möchte ich im Winter keine grünen Büsche auf Schnee und in Herbst und Winter abwechslungsreiche Waldfelder sehen,
damit die Jahreszeit stimmig bleibt und sich ein Waldfeld nicht über die ganze Karte wiederholt.

Entschieden vom Produktinhaber am 2026-11-07 (offene Punkte 3 und 4 aus Story 15.15).

## Acceptance Criteria

Grundlage: `concept/26-epics/epics/epic-15.md` Story 15.16, Plan `concept/23-art-direction/map-assets/jahreszeiten-plan.md` (Schritt 4).

1. **Winter-Deko:** Im Winter setzt die niedrige Deko auf freiem Boden (`render.yaml board.decor`) verschneite Büsche statt grüner, gewählt in YAML nach Jahreszeit wie `board.seasonModels`, kein Sonderfall im Code; Innenräume bleiben ohne Jahreszeit.
2. **Waldvarianten:** Ein Waldfeld würfelt im Herbst und Winter aus drei Modellen (`grove_autumn_a`–`c`, `grove_snow_a`–`c`), alle mit Bäumen am Nord- und Westrand und freier Feldmitte (§3.2), gebaut in Blender (`tools/art/props/nature_map.py`), in der Galerie mit `ships: true`.
3. **Budget:** Die Modelle halten das Dreiecks-Budget eines Waldfelds und kommen mit dem Paket des Akts, nicht im ersten Download.
4. **Belege:** Herbst und Winter auf derselben Testkarte bei 375 × 812; `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 `nature_map.py`: `grove_autumn_b`, `grove_autumn_c`, `grove_snow_b`, `grove_snow_c` (Aufbau von `grove_b` und `grove_c`), `bush_snow_a`; gebaut mit Blender 5.2 (AC 2)
- [x] T2 `render.yaml`: `variants.tree.autumn` und `.winter` mit drei Modellen (Gewichte 3/3/2 wie der Sommer); `seasonModels.winter.bush_a: bush_snow_a`; `snow.skip` um `bush_snow_` (AC 1, 2)
- [x] T3 `packs.yaml`: die fünf Modelle im Paket `act1` wie die übrigen Jahreszeit-Modelle aus 15.15; Galerie `groups/nature.yaml` mit `ships: true` (AC 2, 3)
- [x] T4 Tests in `season.test.ts`, `scenery.test.ts`, `packs.test.ts` (AC 1–3)
- [x] T5 Messung (Dreiecke, Paket, Bildrate), Belege, `pnpm check` (AC 3, 4)

## Dev Agent Record

### Umsetzung

- Kein Code im Brett nötig: Die Deko läuft schon durch `resolve` in `boardProps.ts`, das `seasonModel` fragt; ein Eintrag `bush_a: bush_snow_a` unter `board.seasonModels.winter` reicht. Innenräume haben im Brett die Jahreszeit Sommer (`season()`), dort gibt es ohnehin keine Gras-Deko.
- `bush_snow_a`: drei dunkle Ballen (Palette `SNOWLEAF` wie die Schneewälder) unter je einer Schneehaube, ohne Beeren, mit Schneefleck am Fuß; 456 Dreiecke (Budget Büsche 600, `common.py`). Behält auch die von der Kamera abgewandten Seiten (`cull_inside(..., facing=False)`), weil das Brett Deko zufällig dreht. Trägt eigenen Schnee, daher in `snow.skip`.
- Waldfelder b und c übernehmen die Baumstellungen von `grove_b` und `grove_c` (Nord- und Westrand, Mitte frei; `c` hat wie im Sommer einen dritten Baum am Ostrand), damit ein Waldfeld in jeder Jahreszeit dieselbe Form hat. In `grove_snow_c` haben die Seitenbäume Kronenradius 0,2 statt 0,21 (vier statt fünf Schneelappen), damit das Modell unter 2 029 Dreiecken bleibt. Herbst: Orange, Rost und neu Bernstein (`AMBER`), Fallaub als flache Blätter. Winter: gemeinsamer Helfer `snow_grove`, `grove_snow_a` ist unverändert und nicht neu gebaut.

### Messung

Dreiecke (Budget eines Waldfelds = das größte vorhandene, `grove_snow_a` mit 2 029 [ASSUMPTION], weil kein Zahlenwert festgelegt ist):

| Modell | Dreiecke | KB |
|---|---|---|
| grove_autumn_a (vorhanden) | 1 417 | 243 |
| grove_autumn_b | 964 | 189 |
| grove_autumn_c | 1 374 | 238 |
| grove_snow_a (vorhanden) | 2 029 | 315 |
| grove_snow_b | 1 411 | 240 |
| grove_snow_c | 1 969 | 309 |
| bush_snow_a | 456 | 76 |

Pakete (`pnpm art:build`, dann `pnpm build`): erster Download **13,25 MB wie vor der Story** (356 Dateien; Budget 30 MB, die Warnung über dem Ziel 12 MB bestand schon). Paket `act1` 37,00 → 37,61 MB (Budget 40 MB); die fünf Modelle stehen im Manifest unter `models.propPacks` mit `act1`. Neuer Test in `packs.test.ts`: jedes Modell, das nur Herbst oder Winter zeigt (Waldfelder, Landschaftsbäume, `seasonModels`), liegt in einem späteren Paket, nie im ersten Download.

Bildrate: `PERF_PORT=4186 PERF_GPU=1 PERF_LARGE=1 PERF_STAGES=4 PERF_RUNS=2 PERF_LARGE_MARCH=1 PERF_LARGE_MAPS=s1_1_8_heimat PERF_SEASON=<jahreszeit> pnpm exec playwright test -c playwright.perf.config.ts --project=pixel6a -g "large maps"` (Perf-Build, pixel6a, 4× CPU-Drosselung, Median aus 2 Läufen, Reihenfolge Winter, Sommer, Herbst; andere Sitzungen liefen parallel):

| 1-8 Heimat 30×40, Gegner gemeinsam | Ø FPS | p95 ms | max ms | Gegnerphase |
|---|---|---|---|---|
| Winter (3 Waldfelder) | 22,5 | 75,1 | 83,4 | 2 616 ms |
| Sommer (Bezug, unverändert) | 18,1 | 99,9 | 200,0 | 2 708 ms |
| Herbst (3 Waldfelder) | 24,7 | 66,7 | 83,4 | 2 633 ms |
| zum Vergleich 15.15 (je 1 Waldfeld) | Winter 19,3–23,3, Herbst 22,2 | | | |

Herbst und Winter bleiben im Bereich von 15.15 und über dem Sommer, obwohl sie jetzt wie der Sommer drei Waldfeld-Modelle (Templates) würfeln. Die Vermutung aus 15.15 (ein Modell spart Draw Calls) trägt den Abstand also nicht; die Streuung zwischen Läufen ist größer als der Unterschied.

### Annahmen

- [ASSUMPTION] **Dreiecks-Budget eines Waldfelds:** kein Zahlenwert festgelegt; angenommen höchstens das größte vorhandene Waldfeld (`grove_snow_a`, 2 029), unter dem „rund Vierfachen“ eines Baums (4 × 600) aus dem Decision-Log. Alle neuen Modelle liegen darunter.
- [ASSUMPTION] **Verschneiter Busch statt „nur Steine“:** die Story lässt beides zu; der Busch hält die Dichte der Deko gleich.
- [ASSUMPTION] **Herbst behält den grünen Busch** (`bush_a`): entschieden ist nur der Winter. Ein Herbstbusch ginge ohne Code über `seasonModels.autumn`.
- [ASSUMPTION] **Moor- und Bachdeko** (`decorOn`: Schilf, Seerosen, Moorhügel) bleibt im Winter und bekommt nur Schnee nach Weg B; die Story nennt nur `board.decor`.
- [ASSUMPTION] **Paket:** die Modelle kommen wie die Jahreszeit-Modelle aus 15.15 mit `act1`, weil es noch kein Paket für Akt 2 oder 3 gibt; sie sind nicht im ersten Download.
- Galerie: keine eigene ChatGPT-Referenz; `ref` zeigt auf die Blätter von `grove_autumn_a` bzw. `grove_snow_a`, die Modelle leiten sich davon ab (kein neues KI-Bild, kein Tripo).

### Review (bmad-code-review, 4 Ebenen)

Behoben: Busch-Rückseiten fehlten bei zufällig gedrehter Deko (`cull_inside` schnitt nach der Südkamera; jetzt `facing=False`, Modell neu gebaut); Test für AC 3 (Jahreszeit-Modelle nie im ersten Download, `packs.test.ts`); Sommer-Fall im Waldfeld-Test prüfte mit dem Präfix `grove_` nichts, jetzt exakte Muster und Gewichte 3/3/2; Budget im Decision-Log als Annahme markiert; Missionen der Galerie nach der Matrix; veraltete Zeile „Brett wählt sie noch nicht“ und „Vorher“ im Plan; File List; Platzhalter der Messung. Zurückgestellt: Test der Verdrahtung im Brett (`resolve` in `buildProps`, wie in 15.15; Beleg sind die Bilder); Deko von `decorOn` im Winter (siehe Annahmen). Verworfen: gemeinsame Layout-Konstanten für Waldfelder und `grove_snow_a` auf die neuen Helfer (würde das abgenommene Modell neu bauen, ohne Nutzen für Spieler); Ersatz ohne Paket `act1` (offline vor dem Download) fällt auf den grünen Busch zurück, bestehendes Verhalten aus 15.15 und Akt 3 liegt weit nach dem Hintergrund-Download; Landschaftsbüsche laufen über dieselbe Auflösung.

### File List

- `tools/art/props/nature_map.py`
- `art/models/props/grove_autumn_b.glb`, `grove_autumn_c.glb`, `grove_snow_b.glb`, `grove_snow_c.glb`, `bush_snow_a.glb` (neu, LFS), Vorschauen `art/props/previews/` (neu, LFS)
- `content/core/render.yaml`, `content/packs.yaml`
- `concept/23-art-direction/map-assets/groups/nature.yaml`, `map-assets/jahreszeiten-plan.md`, `map-assets/matrix.md`, `decision-log.md`, `art-direction.md`
- `tests/unit/season.test.ts`, `scenery.test.ts`, `packs.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, Belege `15-16-belege/` (`asset_catalog_summer|autumn|winter.jpg` je 375 × 812, `jahreszeiten_vergleich.jpg` nebeneinander, `wald_und_busch_ausschnitt.jpg` Waldfelder und Busch vergrößert)

### Change Log

- 2026-11-07: Story angelegt und umgesetzt (Status review, wartet auf die Sichtabnahme).
