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
- [x] T4 Tests in `season.test.ts` (AC 1, 2)
- [x] T5 Messung (Dreiecke, Paket, Bildrate), Belege, `pnpm check` (AC 3, 4)

## Dev Agent Record

### Umsetzung

- Kein Code im Brett nötig: Die Deko läuft schon durch `resolve` in `boardProps.ts`, das `seasonModel` fragt; ein Eintrag `bush_a: bush_snow_a` unter `board.seasonModels.winter` reicht. Innenräume haben im Brett die Jahreszeit Sommer (`season()`), dort gibt es ohnehin keine Gras-Deko.
- `bush_snow_a`: drei dunkle Ballen (Palette `SNOWLEAF` wie die Schneewälder) unter je einer Schneehaube, ohne Beeren, mit Schneefleck am Fuß; 285 Dreiecke (Budget Büsche 600, `common.py`). Trägt eigenen Schnee, daher in `snow.skip`.
- Waldfelder b und c übernehmen die Baumstellungen von `grove_b` und `grove_c` (Nord- und Westrand, Mitte frei), damit ein Waldfeld in jeder Jahreszeit dieselbe Form hat. Herbst: Orange, Rost und neu Bernstein (`AMBER`), Fallaub als flache Blätter. Winter: gemeinsamer Helfer `snow_grove`, `grove_snow_a` ist unverändert und nicht neu gebaut.

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
| bush_snow_a | 285 | 55 |

MESSUNG_PAKETE

MESSUNG_FPS

### Annahmen

ANNAHMEN

### File List

- `tools/art/props/nature_map.py`
- `art/models/props/grove_autumn_b.glb`, `grove_autumn_c.glb`, `grove_snow_b.glb`, `grove_snow_c.glb`, `bush_snow_a.glb` (neu, LFS), Vorschauen `art/props/previews/` (neu, LFS)
- `content/core/render.yaml`, `content/packs.yaml`
- `concept/23-art-direction/map-assets/groups/nature.yaml`, `jahreszeiten-plan.md`, `decision-log.md`, `art-direction.md`
- `tests/unit/season.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, Belege `15-16-belege/`

### Change Log

- 2026-11-07: Story angelegt und umgesetzt (Status review, wartet auf die Sichtabnahme).
