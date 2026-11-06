# Story 15.15: Jahreszeiten-Boden (Vorbereitung für Akt 2 und 3)

Status: review

## Story

Als Spieler
möchte ich in Akt 2 Herbstboden und in Akt 3 Schnee auf Boden, Felsen und Dächern sehen,
damit die Jahreszeit erzählt (Art Direction §2.4) und kein Herbstlaub oder keine Schneefichte mehr auf Sommerwiese steht.

## Acceptance Criteria

Grundlage: `concept/26-epics/epics/epic-15.md` Story 15.15, Plan `concept/23-art-direction/map-assets/jahreszeiten-plan.md`, Matrix `map-assets/matrix.md` (Boden Herbst, Boden Schnee, Schneehauben).

1. **Jahreszeit in YAML:** `season` (`summer`, `autumn`, `winter`) an der Karte, Zod-Schema; ohne Angabe die Jahreszeit des Akts (`render.yaml board.actSeason`). Akt-1-Karten bleiben Sommer.
2. **Boden:** `board.seasonGround` tauscht nur die Textur eines Splat-Layers (Herbst: Gras → Laub; Winter: Gras → Schnee, Erde → gefrorene Erde, Weg → Schneeweg); Innenräume tauschen nichts; nur die Texturen der gezeigten Jahreszeit werden geladen.
3. **Schneehauben:** Weg B (Material) auf Fels, Häusern, Kleinkram und Blockkappen; Weg A für Mauerkante und Turm (`board.seasonModels`); Wald je Jahreszeit als Waldfeld.
4. **Lesbarkeit:** Figuren, Teamfarben, Ringe und Raster bleiben unterscheidbar; Wirkung eines Felds an derselben Form erkennbar.
5. **content:check:** `season` gegen Akt und Innenraum, `seasonGround` gegen die Oberflächen der Terrains; Schneewetter, wo das Brett Winter hat.
6. **Budget:** Dreiecks- und Paket-Budget halten (`pnpm build`), Bildrate großer Karten bei gedrosselter CPU sinkt nicht.
7. **Belege:** Sommer, Herbst, Winter auf derselben Karte bei 375 × 812; `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 `Season` in `core/defs.ts`, `MapDef.season`, Schema; `src/content/season.ts` (`seasonOf`, `seasonGround`, `seasonTextures`, `seasonModel`, `takesSnow`) (AC 1, 2)
- [x] T2 `render.yaml`: `actSeason`, `seasonGround`, `seasonModels`, `snow`; Baum- und Lichtlisten nach Jahreszeit statt Akt (AC 1–3)
- [x] T3 Brett: Splat-Layer nach Jahreszeit, Texturen der Jahreszeit nachladen, Varianten und Ersatzmodelle nach Jahreszeit (AC 2, 3)
- [x] T4 Schnee-Plug-in `src/render/shared/snow.ts` auf Requisiten, ihren Durchsicht-Zwillingen und den Blockkappen (AC 3)
- [x] T5 Texturen: `sheet7` per ChatGPT, `tools/art/ground.py` (Herbstgras aus `sheet6`, Schneeweg aus dem Pflaster) (AC 2)
- [x] T6 Raster im Winter schiefergrau; Schneewetter nach Jahreszeit (AC 4, 5)
- [x] T7 Tests `season.test.ts`, `scenery.test.ts`, `look.test.ts` (AC 1–5)
- [x] T8 `__hc.devMap(id, { season })`, N4-Entwurf `season: winter`, Perf-Werkzeug `PERF_SEASON` (AC 6, 7)
- [x] T9 Belege, Messung, `pnpm check` (AC 6, 7)

## Dev Agent Record

### Umsetzung

- Jahreszeit statt Akt als Schlüssel: `board.variants.tree`, `sceneryTree` und `look.season` heißen jetzt `summer`, `autumn`, `winter`. `seasonOf(render, map)` = `map.season` → `board.actSeason[act]` → `summer`; Brett, Licht und `content:check` nutzen dieselbe Funktion.
- Boden: `buildTerrain` wählt für jeden Splat-Layer `seasonGround(render, season, surface, interior)`; die Layer und ihre Gewichte bleiben, eine Karte sieht für die Regeln gleich aus. `loadGroundTextures(store, extra)` lädt nur die Zusatztexturen der Jahreszeit.
- Schnee Weg B: `SnowPlugin` mischt nach `CUSTOM_FRAGMENT_UPDATE_DIFFUSE` Weiß nach Normalen-Höhe (`from` 0,72 → `to` 0,95), mit Rauschen im Weltraum zerfranst, höchstens `cover` 0,82. Templates mit eigenem Material bekommen das Plug-in, das gemeinsame Requisiten-Material einen Winter-Zwilling `prop:snow` (eingefroren wie die anderen). Modelle mit eigenem Schnee (`snowfir_`, `grove_snow_`, `snowcap_`) bleiben aus.
- Weg A: `wallrim_idle` → `snowcap_wall_idle` (gleiche Geometrie, `tools/art/props/winter.py`), `tower_idle` → `snowcap_tower_idle`; ist das Ersatzmodell nicht gebaut, bleibt das Original.
- Wald: im Herbst und Winter je ein Waldfeld-Modell (`grove_autumn_a`, `grove_snow_a`); die Landschaft um die Karte behält Einzelbäume. Die vier Jahreszeit-Modelle sind in der Galerie `ships: true` und kommen mit dem Paket `act1` (nicht im ersten Download), ebenso `autumn_a/b`, `snowfir_a`.
- Abweichung vom Plan: Schneeweg aus dem Pflaster statt aus dem gemalten Fahrspur-Feld (Spuren laufen nur in eine Richtung), Begründung im Decision-Log der Art Direction.

### Messung

`PERF_PORT=4185 PERF_GPU=1 PERF_LARGE=1 PERF_STAGES=4 PERF_RUNS=2 PERF_LARGE_MARCH=1 PERF_LARGE_MAPS=s1_1_8_heimat PERF_SEASON=<jahreszeit> pnpm exec playwright test -c playwright.perf.config.ts --project=pixel6a -g "large maps"` (Perf-Build, Profil pixel6a, 4× CPU-Drosselung, Median aus 2 Läufen; parallel liefen andere Sitzungen, Streuung entsprechend):

| 1-8 Heimat 30×40, Gegner gemeinsam | Ø FPS | p95 ms | max ms | Gegnerphase |
|---|---|---|---|---|
| Sommer | 17,9 | 83,4 | 100,1 | 2 698 ms |
| Herbst | 22,2 | 66,7 | 83,4 | 2 609 ms |
| Winter | 23,3 | 58,4 | 83,3 | 2 606 ms |

Winter und Herbst sind nicht langsamer als Sommer (der Sommer-Lauf lief als erster, kalt). Das Schnee-Plug-in kostet keinen Draw Call, nur eine Shader-Variante je Requisiten-Material.

Pakete (`pnpm build`): erster Download 13,25 MB wie vor der Story (Budget 30 MB; die Warnung über dem Ziel von 12 MB bestand schon). Die vier Jahreszeit-Texturen (zusammen rund 350 KB) und die Jahreszeit-Modelle liegen im Paket `act1` (37,0 von 40 MB), nicht im ersten Download. Figuren-Budget unverändert (45 geprüft, keine darüber).

### Offene Punkte für den Produktinhaber

1. **Probe Weg B (Plan, Schritt 3):** Schnee per Material auf Fels, Dächern, Kleinkram. Probe auf `asset_catalog` und N4 (`15-15-belege/asset_catalog_winter.jpg`). Empfehlung: annehmen; Stärke über `render.yaml board.snow.winter` (`cover`, `from`, `to`) nachstellbar ohne Code.
2. **Herbst-Lesbarkeit:** Rote Gegnerringe stehen auf Laub schwächer als auf Gras oder Schnee. Das Laub ist schon gedämpft (Sättigung 0,62). Empfehlung: so lassen und im Handy-Test von Akt 2 prüfen; sonst Sättigung weiter senken (`GRADE` in `tools/art/ground.py`).
3. **Büsche im Winter:** Die niedrige Deko (`decor.bushes`) bleibt grün auf Schnee. Empfehlung: Folge-Story mit einer Winter-Deko (verschneite Büsche oder nur Steine), Schlüssel wie `seasonModels`.
4. **Fehlende Waldvarianten:** je zwei weitere Waldfelder für Herbst und Winter (Plan, Schritt 4); bis dahin wiederholt sich ein Modell.
5. **Eis aus `sheet7`:** das vierte Feld (Seeeis) liegt als Reserve für „Eis mit Bruchstellen“ (3-3, 3-4, 3-7).

### File List

- `src/core/defs.ts`, `mapDefs.ts`, `renderDefs.ts`
- `src/content/season.ts` (neu), `schemas.ts`, `propVariants.ts`, `validateLook.ts`, `validate.ts`
- `src/render/shared/snow.ts` (neu), `terrain3d.ts`, `look.ts`
- `src/render/board/boardBase.ts`, `boardProps.ts`, `boardSetup.ts`, `boardUnits.ts`
- `src/app/state/devHooks.ts`
- `content/core/render.yaml`, `content/packs.yaml`
- `tools/art/ground.py`, `art/ground/refs/sheet7_snow_frozen_road_ice.png` (neu, LFS), `art/prompts/map_assets_winter_ground.md` (neu)
- `concept/27-ueberarbeitung/levels/s2_n4_clan.yaml`, `concept/23-art-direction/map-assets/groups/nature.yaml`, `winter.yaml`
- `concept/23-art-direction/art-direction.md`, `decision-log.md`, `map-assets/jahreszeiten-plan.md`, `map-assets/matrix.md`
- `concept/26-epics/epics/epic-15.md`, `index.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tests/unit/season.test.ts` (neu), `scenery.test.ts`, `look.test.ts`, `tests/perf/bench.ts`, `perf.spec.ts`
- Belege `_bmad-output/implementation-artifacts/15-15-belege/`

### Change Log

- 2026-11-06: Story angelegt und umgesetzt (Status review: Probe Weg B wartet auf den Produktinhaber).
