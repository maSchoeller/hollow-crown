# Story 10.14: Burg-Grafik nach der 3D-Entscheidung

Status: review

## Story

Als Spieler
möchte ich sehen, wie die Paktwacht mit jedem Ausbau und jedem Gefährten wächst und wo Gefallene fehlen,
damit die Heimat lebendig wirkt.

**Stand vor dieser Story:** 3D ist entschieden (Art Direction §7, EXPERIENCE „Burg in 3D“); die Szene (`src/render/home/castle.ts`), die Raumteile je Stufe, die Burgstufe (`castleTier`, Schwellen in `balance.yaml` unter `castle.tierAt`) und drei Gegenstände ohne Datenbindung (Axt, Laute, Bücher) stehen seit PR 100 auf `main`. Offen sind `homeObject`, die übrigen zwölf Gegenstände, `castleScene` mit Gefallenen und Gegangenen, das Vorwerk am Passfuß (F4) und die Messung auf dem echten Gerät.

## Acceptance Criteria

1. Die Entscheidung „3D“ steht in den Logs von Art Direction und UX, `EXPERIENCE.md` („Burg in 3D“) und Art Direction §7 sind nachgezogen; Raumsteine, Raum-Panels und ≤ 2 Taps bleiben unverändert.
2. `castleTier` ist eine reine Funktion des Kampagnenstands, die Schwellen stehen in `content/core/balance.yaml` (`castle.tierAt`) und sind getestet.
3. Burgstufe 3 zeigt ein Vorwerk am Passfuß als Ausbauteil (`shell_3`), nur als Bild, ohne Regel und ohne Raum (F4); ein Bild belegt es.
4. `charSchema` kennt das Feld `homeObject`; jeder Gefährte in `content/acts/*/units.yaml` außer Avatar und Lucan trägt es, die Ids sind eindeutig, und `pnpm content:check` meldet jeden Gefährten ohne Gegenstand oder mit einem Gegenstand ohne Platz in der Burg.
5. Das Burg-Modell hat je Gegenstand einen festen Platz (Teil `<id>_a` in `tools/art/blender_paktwacht.py`) und je Raum und Stufe ein Ausbauteil; ein Modell-Test meldet jeden fehlenden Platz und jeden Raum ohne Teil je Stufe.
6. Die reine Funktion `castleScene(data, c)` (liest nur `c.roster`, `c.fallen`, `c.left`, `c.home`) liefert je Platz den Zustand: beigetreten → `present`; gefallen → `mourned` (Gegenstand bleibt liegen, entsättigt im Gedenken-Stil, Stein in der Gedächtnishalle); gegangen → `gone` (Gegenstand weg, kein Stein); nie beigetreten → `none`. Söldner haben keinen Platz. Je Raum gibt sie die Stufe (0 = noch nicht gebaut), dazu die Burgstufe.
7. `src/render/home/` zeichnet die Burg als Diorama mit Ausbauteilen und Gegenständen an ihren Plätzen im Modell, abendlichem Licht aus `render.yaml`; Antippen eines Raums öffnet sein Panel; die Ansicht zeigt beim Laden die Ladeanzeige bzw. das gemalte Bild, bleibt eigener Chunk im Bundle-Budget.
8. Unit-Tests decken alle Zustände von `castleScene` ab; Screenshots bei 375 × 812 belegen die Burg auf Stufe 1, 2 und 3 sowie einen gefallenen und einen gegangenen Gefährten.

## Tasks / Subtasks

- [x] Inhalt: `homeObject` in `charSchema`, bei den 15 Gefährten in `content/acts/act1|act2/units.yaml`, Prüfung in `validateUnits.ts` (AC 4)
- [x] Kern: `CASTLE_PLACES` und `castleScene` in `src/core/campaign/castleScene.ts`, Export über `src/core/index.ts` (AC 6)
- [x] Art: zwölf Gegenstände und das Vorwerk am Passfuß in `tools/art/blender_castle.py`/`blender_paktwacht.py`, Plätze in `LAYOUT`, Modell neu gebaut (AC 3, 5)
- [x] Render: Gegenstände als eigene Teile mit Zustand (`setKeepsake`), Gedenken-Material in `src/render/home/castle.ts` (AC 7)
- [x] Oberfläche: `Castle3d`/`Camp` lesen `castleScene`, Dev-Leiste mit Gedenken-Schalter für die Abnahme (AC 8)
- [x] Tests: `tests/unit/castle-scene.test.ts`, `tests/unit/castle-model.test.ts`, Ergänzung in `tests/unit/content.test.ts` (AC 2, 4, 5, 6)
- [x] Dokumente: Art Direction §7 und Decision-Log, UX-Log, `art/models/castle/README.md` mit den Abnahme-Bildern (AC 1, 3, 8)

## Dev Notes

- **Eine Quelle für die Plätze:** Die Plätze stehen im Modell (Entscheidung 2026-11-06, nicht in `home.yaml`). Damit `src/content` und `src/core` sie ohne Import aus `src/render` prüfen können, führt `src/core/campaign/castleScene.ts` die Liste `CASTLE_PLACES`; ein Modell-Test vergleicht sie mit `KEEPSAKES` in `tools/art/blender_castle.py` und `LAYOUT` in `tools/art/blender_paktwacht.py`. Weicht das Modell ab, schlägt der Test fehl. [ASSUMPTION]
- **Ids der Gegenstände** sind nur Kleinbuchstaben (`axe`, `shield`, …), weil das Teilnamen-Muster in `src/render/home/castle.ts` (`^([a-z]+)_(a|[0-9]+)$`) keine Ziffern und keinen Unterstrich in der Gruppe erlaubt. [ASSUMPTION]
- **Gedenken-Stil:** Entsättigt heißt hier: das Teil behält seine Form, bekommt aber ein eigenes Material in Steingrau und seine Vertex-Farben werden abgeschaltet (`mesh.useVertexColors = false`). Das ist ohne eigenen Shader möglich und passt zu den Gedenksteinen. [ASSUMPTION]
- **Avatar und Lucan** bekommen keinen Gegenstand (abgenommen 2026-11-07). Die Prüfung nimmt sie über ihre Flags `avatar` bzw. `lord` aus, nicht über ihre Ids.
- **Söldner** stehen nicht in `data.chars`, haben also nie einen Platz; ihre Gedenksteine bleiben von `memorialStones` unberührt.
- **Kein Speicherformat betroffen:** `castleScene` ist eine Ansicht auf `c.roster`, `c.fallen`, `c.left` und `c.home`; `homeObject` ist Inhalt, kein Spielstand. Keine gesperrte ID (`content/released-ids.json` gibt es noch nicht).
- **Nicht angefasst** (parallele Sessions): `content/acts/act2/**` außer `units.yaml` (dort nur die neue Zeile `homeObject` je Gefährte) und `content/core/balance.yaml`.
- `art/**/*.glb` und `art/**/*.png` liegen in Git LFS; im frischen Worktree erst `git lfs pull`. Das Modell wird mit Blender 5.2 neu gebaut (`blender -b --factory-startup -P tools/art/blender_paktwacht.py`), danach `pnpm art:build`.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.14]
- [Source: concept/22-narrative/burg-gegenstaende-vorschlag.md]
- [Source: concept/23-art-direction/art-direction.md §7]
- [Source: concept/25-ux/EXPERIENCE.md „Burg in 3D“]
- [Source: concept/27-ueberarbeitung/umsetzung-lueckenliste-akt2.md F4]

## Dev Agent Record

### Agent Model Used

Claude Opus 5

### Completion Notes List

- **Zwölf neue Gegenstände** in `tools/art/blender_castle.py`, Plätze in `LAYOUT` von `blender_paktwacht.py`; das Modell wächst von 1905 auf 1936 KB bei 124 804 Dreiecken. Von Hand modelliert, kein KI-Asset – `licensing.md` §6 greift nicht, es gibt also keinen Prompt.
- **Vorwerk am Passfuß** als `build_outwork()` in `shell_3` (940 Dreiecke): kurze Mauer mit Tordurchgang, Zinnen, Laternen, Banner. Nur Bild, kein Raum, keine Regel (F4).
- **Gegenstände 1,35× größer als ihr wahres Maß** `[ASSUMPTION]`: bei 1 : 1 waren sie auf dem Referenzgerät gut ein Dutzend Pixel groß, und der Unterschied zwischen einem stehenden und einem entsättigten Gegenstand lag bei vier Pixeln. Betrifft auch die drei schon gebauten.
- **Gedenken-Stil** `[ASSUMPTION]`: eigenes graues Material `castle:mourn`, `mesh.useVertexColors = false`, leuchtende Teile gehen mit aus; kein eigener Shader.
- **`CASTLE_PLACES` in `src/core`** `[ASSUMPTION]` als einzige Liste der Plätze, damit `src/content` sie prüfen kann, ohne aus `src/render` zu importieren; `tests/unit/castle-model.test.ts` hält sie gegen beide Blender-Skripte und gegen die exportierte `.glb` (die in einem frischen Checkout nur ein LFS-Zeiger ist, dann überspringt der Test diesen Teil – Muster aus `pro-parts.test.ts`).
- **Ids nur aus Kleinbuchstaben** `[ASSUMPTION]`, weil das Teilnamen-Muster der Szene keine Ziffern und keinen Unterstrich in der Gruppe erlaubt.
- Neue Dev-Hilfen für die Abnahme: `__hc.devCastle(stufe, verlust)` und die Schalter „da / gefallen / weg“ in der Dev-Leiste (`?castle3d=1`).
- **Offen für den Produktinhaber:** die Messung auf dem echten Gerät. In der Burg mit `?castle3d=1` zeigt die Leiste unten FPS und Draw Calls; zu prüfen sind die Ziele aus Story 7.8 auf Burgstufe 3 mit allen Räumen auf Stufe 3.
- `pnpm check` und `pnpm test:coverage` grün. Ein Lauf von `test:coverage` brach einmal mit einem Timeout in `tests/unit/placement-terrain.test.ts` ab (300 s, ohne Bezug zu dieser Story); der Wiederholungslauf war grün.

### File List

- `_bmad-output/implementation-artifacts/10-14-burg-grafik-nach-der-3d-entscheidung.md` (neu)
- `src/core/campaign/castleScene.ts` (neu), `src/core/index.ts`, `src/core/defs.ts`
- `src/content/schemaUnits.ts`, `src/content/validateUnits.ts`
- `src/render/home/castle.ts`
- `src/app/screens/Camp.tsx`, `src/app/screens/Castle3d.tsx`, `src/app/state/devHooks.ts`
- `content/acts/act1/units.yaml`, `content/acts/act2/units.yaml`, `content/core/locales/de.yaml`, `content/core/locales/en.yaml`
- `tools/art/blender_castle.py`, `tools/art/blender_paktwacht.py`, `tools/art/castle-shots.mjs` (neu)
- `art/models/castle/paktwacht.glb`, `art/models/castle/README.md` (neu), `art/models/castle/shots/*.png` (neu)
- `tests/unit/castle-scene.test.ts` (neu), `tests/unit/castle-model.test.ts` (neu)
- `concept/23-art-direction/art-direction.md`, `concept/23-art-direction/decision-log.md`, `concept/25-ux/.decision-log.md`
