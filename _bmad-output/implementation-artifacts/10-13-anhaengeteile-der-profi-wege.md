# Story 10.13: Anhängeteile der Profi-Wege

Status: review

## Story

Als Spieler
möchte ich einer aufgestiegenen Figur auf dem Brett ansehen, welchen Profi-Weg sie gewählt hat,
damit Aufstiege auch sichtbar etwas ändern.

## Acceptance Criteria

1. Je Profi-Weg genau ein Anhängeteil als GLB unter `art/models/parts/<id>.glb`, eigene Modellierung in Blender (kein KI-Asset), im Toon-Look der Waffenbibliothek (Vertex-Farben aus Hollow-64, Teamtuch als Schlüssel K2), im Budget: 16 Teile nach der Tabelle des Epics (`tower_shield`, `ram_axe`, `second_blade`, `feather_beret`, `feather_hat`, `leaf_cloak`, `pointed_hat`, `raven_collar`, `mitre`, `war_hammer`, `great_lute`, `back_banner`, `half_mask`, `trap_belt`, `general_cloak`, `standard`).
2. `content/core/render.yaml` ordnet unter `gear.proParts` jedem Teil Modell und Sockel (`back` oder `head`) zu; `classes.yaml` nennt je Profi-Klasse ihr `proPart`; Schema und `content:check` prüfen beides (nur auf `tier: pro`, Id muss in `gear.proParts` stehen, jede spielbare Profi-Klasse hat eines).
3. Der Rig der Bild-zu-3D-Figuren bekommt in `tools/art/prepare_tripo_unit.py` die Sockel `socket_back` (obere Brustwirbel, hinter dem Rücken) und `socket_head` (Scheitel); alle Figuren sind damit neu gebaut (`pnpm art:tripo`), die `.vat`-Dateien führen die neuen Sockel.
4. Startet der Kampf, hängt das Teil der Profi-Klasse einer Figur am passenden Sockel der vorhandenen Figur (kein neues Figurenmodell), gleich für alle Figuren dieser Klasse und auch für Gegner; Figuren ohne Sockel (Blender-Figuren) zeigen kein Teil.
5. Das Teil bewegt sich mit Idle, Lauf und Angriff (es hängt im Skelett- wie im `.vat`-Pfad unter dem Sockel), verdeckt weder Lebensleiste noch Groll-Wimpel, und die Bildrate bleibt über den Zielen aus Story 7.8.
6. Ein Test listet die Figurenmodelle ohne Sockel; weitere Tests belegen Zuordnung, Schema-Prüfungen, Ladeplan (`models/parts/<id>.glb` in den Missionsdateien) und Teile-Budget.
7. Je Teil ein Abnahme-Screenshot bei 375 × 812 mit der Brettkamera (`tools/art/part-shots.mjs` über `tools/art/part-one.html`), Übersicht in `art/models/parts/README.md`.

## Tasks / Subtasks

- [x] Art: `tools/art/blender_proparts.py` mit den 16 Teilen, Export nach `art/models/parts/` (AC 1)
- [x] Rig: `socket_back` und `socket_head` in `prepare_tripo_unit.py`, alle Figuren neu bauen (`pnpm art:tripo`), `pnpm art:build` (AC 3)
- [x] Inhalt: `gear.proParts` in `render.yaml`, `proPart` in `classes.yaml`, Schemas (`schemaRender.ts`, `schemaUnits.ts`), `validateUnits.ts`, Locales `part.<classId>.name` an die Tabelle des Epics angeglichen (AC 2)
- [x] Render: `PartPiece` in `core/defs.ts`/`renderDefs.ts`, Sockel- und Verzeichniswahl in `render/shared/models.ts`, `gearOf`/`gearKey` in `render/board/boardUnits.ts`, Ladeplan in `app/loading/plan.ts`, Manifest in `build.py` und `render/shared/assets.ts` (AC 4, 5)
- [x] Budget: `partBudget` in `content/packs.yaml`, `reportParts` in `tools/figure-budget.mjs`, Aufruf in `tools/check-bundle-size.mjs` (AC 1, 6)
- [x] Abnahme: `tools/art/part-one.html` + `part-shots.mjs`, 16 Screenshots, `art/models/parts/README.md` (AC 7)
- [x] Tests (`tests/unit/pro-parts.test.ts`), Art-Direction §4.2/§4.6 und `art/README.md` nachziehen, Decision-Logs, `pnpm check`

## Dev Notes

- **Namenskonflikt:** Das Epic nennt `tools/art/blender_parts.py`; diese Datei ist seit dem PoC die Teile-Bibliothek der Sprite-Pipeline (wird von `blender_chibi.py`/`blender_units.py` in denselben Namensraum geladen). Das neue Skript heißt darum `tools/art/blender_proparts.py`; Umbenennen der alten Datei würde die Sprite-Pipeline anfassen. [ASSUMPTION]
- **Namen der Teile:** `part.<classId>.name` steht seit Story 10.2/10.3 in den Locales, widerspricht aber für 11 der 16 Wege der Teile-Tabelle dieses Epics (z. B. `duelist` „Duellklinge“ gegen `feather_beret` Federbarett). Das sichtbare Teil und sein Name müssen übereinstimmen; die Tabelle des Epics ist die jüngere Quelle, also werden die Locale-Namen an sie angeglichen (DE und EN). [ASSUMPTION]
- `GearPiece` bleibt die Hand-Waffe (GA9); das Anhängeteil ist ein eigener Typ `PartPiece` mit `socket: 'back' | 'head'`. `attachGear` in `src/render/shared/models.ts` bekommt Sockelnamen und Modellordner aus dem Stück, statt `hand` fest auf `socket_r`/`socket_l` abzubilden — beide Pfade (Skelett und `.vat`) nutzen dieselbe Funktion.
- `weaponOf` bleibt die Quelle der Angriffsbewegung (`motion`); ein Anhängeteil hat keine.
- Der `.vat`-Pfad liest die Sockel über `entry.data.sockets` nach Namen; `bake_vat.py` nimmt jede Nicht-Gelenk-Node mit Präfix `socket_` auf, also braucht die Backerei keine Änderung — aber alle `.vat`-Dateien müssen neu gebacken werden, sonst fehlen die neuen Sockel.
- Kein Regelwert und kein Speicherformat betroffen: `src/core` liest `render.yaml` nie, `proPart` ist reine Darstellung. Keine gesperrte ID (`content/released-ids.json` gibt es nicht).
- **Nicht anfassen** (parallele Sessions): `content/core/rooms.yaml`, `content/core/balance.yaml`, `src/app/screens/Rooms.tsx`, `content/acts/act2/**`.
- `art/**/*.glb` und `*.vat` liegen in Git LFS; im frischen Worktree erst `git lfs pull`. `pnpm art:tripo` braucht Blender (`BLENDER=…`), `pnpm art:build` Python 3.12 mit `tools/art/requirements.txt`.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.13]
- [Source: concept/23-art-direction/art-direction.md §4.2, §4.5, §4.6]
- [Source: concept/16-asset-pipeline.md §7.1, §9]
- [Source: art/README.md]
- [Source: _bmad-output/implementation-artifacts/10-3-profi-klassen-und-werte.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5

### Completion Notes List

- 16 Teile in `art/models/parts/` (108–536 Dreiecke, 1,7–5,7 KB gzip), von Hand in Blender, kein KI-Asset – `licensing.md` §6 greift darum nicht.
- `socket_head` sitzt nicht am Ende des Kopfknochens (der steckt im großen Chibi-Kopf), sondern auf dem höchsten Punkt des Kopf-Meshes (`skin_top` in `prepare_tripo_unit.py`); sonst steckte ein Hut im Haar.
- `across()` in `blender_proparts.py` braucht `n × d` als dritte Spalte: mit `(0,0,1)` spiegelte der Rahmen und alle Normalen der Axt- und Hammerköpfe klappten um (sie rendern dann unbeleuchtet).
- Kopfteile bleiben niedrig und Banner kurz, damit sie Lebensleiste (`hpBar.lift` 1,0) und Groll-Wimpel nicht erreichen.
- `.vat` führt jetzt vier Sockel statt zwei; die Vorwärtskinematik rechnet je Zeile doppelt so viele Sockel, die Dateien wachsen um wenige KB. Keine Figur reißt das Figurenbudget.
- Offene Annahmen: Skriptname `blender_proparts.py` statt `blender_parts.py`; Locale-Namen an die Teile-Tabelle des Epics angeglichen (11 von 16 geändert); `partBudget` in `content/packs.yaml` neu erfunden (600 Dreiecke, 8 KB).

### File List

- Neu: `tools/art/blender_proparts.py`, `tools/art/part-one.html`, `tools/art/part-one.ts`, `tools/art/part-shots.mjs`, `tests/unit/pro-parts.test.ts`, `art/models/parts/*.glb` (16), `art/models/parts/README.md`, `art/models/parts/shots/*.png` (16)
- Geändert: `tools/art/prepare_tripo_unit.py`, `tools/art/build.py`, `tools/figure-budget.mjs`, `tools/check-bundle-size.mjs`, `content/core/render.yaml`, `content/core/classes.yaml`, `content/core/locales/{de,en}.yaml`, `content/packs.yaml`, `src/core/{defs,renderDefs,figure}.ts`, `src/content/{packs,schemaRender,schemaUnits,validateUnits,validateLocales}.ts`, `src/render/shared/{models,assets}.ts`, `src/render/board/boardUnits.ts`, `src/app/loading/plan.ts`, `src/app/state/flow.ts`, `tests/unit/vat.test.ts`, `art/README.md`, `concept/23-art-direction/{art-direction.md,decision-log.md}`, `concept/24-architecture/decision-log.md`, alle `art/models/units/*.glb` und `*.vat` (neu gebaut)
