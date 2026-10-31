# Story 5.2: Die Weltkarte als 3D-Szene

Status: done

> **Hinweis (2026-10-25):** Gültig sind die Akzeptanzkriterien im Abschnitt „Zweite Änderung (2026-10-24): flaches Bild statt 3D-Szene“ unten; die ursprünglichen Kriterien oben (3D-Szene, Kachelraster, Miniaturen) sind überholt. Der Dateiname bleibt wegen der Sprint-Status-Schlüssel.

## Story

Als Spieler
möchte ich Valmora als bespielte Miniaturlandschaft sehen,
damit ich spüre, wo meine Truppe gewesen ist.

## Acceptance Criteria

1. **Inhalt:** `content/world/valmora.yaml` mit Kachelraster (ASCII) und Legende (Zeichen → Gelände-ID aus `terrain.yaml`), Regionen (eigenes ASCII-Raster, je Region Akt, Jahreszeit, Namensschlüssel), Orten (Knoten-ID bzw. Heimat → Feld, Miniatur-Modell, Varianten mit `requires`) und Drachenzeichen je Akt; Zod-Schema und `content:check` (Rastermaße, Legende, Gelände-IDs, jeder Kampagnen-Knoten und die Heimat haben einen Ort, Bedingungen gültig, Miniaturen nennen vorhandene Requisiten).
2. **Szene:** `src/render/world/` baut die Weltkarte als Szene des Hosts aus 5.1 (Modelle und Texturen aus dem geteilten Cache) mit denselben Requisiten wie das Brett. **Geändert vom Produktinhaber (2026-10-24):** Das Gelände ist nicht aus `terrain3d`-Blöcken gebaut, sondern ein in Blender modelliertes Gelände mit echter Topografie und gemalter, realistischerer Bodentextur nach ChatGPT-Designbildern; Raster 56 × 40, damit 12–14 Orte je Akt Platz haben.
3. **Nebel:** Regionen späterer Akte als der aktuelle liegen unter Nebel (`{colors.fog}` `#E0E5EF`, weicher Rand über ein Feld); ihr Regionsname steht darüber.
4. **Kamera:** wie auf dem Brett (orthografisch, geneigt), 2 Zoomstufen (Pinch, Mausrad), verschiebbar per Ziehen mit Nachgleiten wie in 5.3.
5. **Varianten:** Ein Ort zeigt die erste Variante, deren Bedingungen erfüllt sind (z. B. Varnhold intakt → nach Kapitel 1 verbrannt), sonst sein Grundmodell; höchstens 2 Varianten je Ort (Art Direction §6).
6. **Drachenzeichen:** je erreichtem Akt eine zusätzliche Ebene, Akt 1 Asche: graue Aschefelder und fallende Ascheflocken (Partikel, auf „Niedrig“ aus).
7. **Hub unverändert (5.3):** Knoten, Heimat-Ort, Pfade, Knoten-Karte, Leiste, Menü, Ende-Karte bleiben in Aussehen und Bedienung gleich: Tipp auf einen Knoten zoomt leicht heran und bringt ihn über die Karte, Tipp daneben schließt, Ziehen verschiebt.
8. **Leistung:** Bundle-Budget hält (`pnpm build`); die Weltkarte braucht keine Einheiten-Modelle, nur Requisiten und Bodentexturen.

## Tasks / Subtasks

- [x] T1 Schema `worldSchema` + Typ `WorldDef`, Laden in `load.ts`, Prüfungen in `validate.ts` (Raster, Legende, Regionen, Orte für alle Knoten und die Heimat, Miniaturen gegen `art/models/props`, Varianten-Bedingungen, Zeichen-Flächen) (AC 1)
- [x] T2 `content/world/valmora.yaml` (56 × 40), Texte `world.region.*` (de, en) (AC 1)
- [x] T3 `render.yaml` Abschnitt `world` + Schema (AC 2–6)
- [x] T4 Designbilder per ChatGPT (`art/prompts/world_topography.md`), `tools/art/world_height.py` (Höhen, gemalte Textur, Höhen fürs Spiel), `tools/art/blender_world.py` (Mesh, Vorschau, glb), `pnpm art:world`, `build.py` kopiert nach `public/assets/world/` (AC 2)
- [x] T5 `src/render/shared/props.ts`, `src/render/world/world.ts` (`WorldView`), `world/layout.ts` (rein: Raster, Nebel, Varianten, Höhen) (AC 2–6)
- [x] T6 `WorldMap.tsx`/`.css`: Host-Canvas, HTML-Knoten/Pfade/Regionsnamen je Bild, Ziehen, Pinch, Mausrad (AC 4, 7)
- [x] T7 Tests `tests/unit/world-layout.test.ts`; Browser-Screenshots im Hochformat (AC 1, 5, 7)
- [x] T8 Checks grün

## Dev Notes

### Ist-Zustand

- `WorldMap.tsx` (Story 5.3): gemaltes Bild `world/valmora.webp` in einem Schwenkbereich (`overflow: auto`), Knoten als Buttons in Prozent (`campaign.yaml` `pos`, `homePos`), SVG-Pfade entlang `next`, Ziehen mit Schwelle 6 px, Nachgleiten, Klick nach Ziehen verschluckt; Tipp → `transform: scale(1.12)` um den Knoten und Schwenk auf 30 % der Höhe.
- 5.1 liefert `RenderHost` (`renderHost(data)`, `mount`, `activate`, `store`, `release`) und `shared/`-Module. `buildTerrain` braucht von einer Karte nur `width`, `height`, `terrain`, `timers`.
- Bedingungen: `conditionContext(data, c)` + `evalConditions` aus `src/core/campaign/conditions.ts`; Schema `conditionSchema`.
- Requisiten-Modelle: `tree_a|b|c`, `rock_idle`, `house_intact|visited|razed`, `fort_idle`, `ruins_idle`, `shrine_idle`, `wagon_idle`, `chest_closed|open`.

### Entwurf

- **Raster:** Zeilen als Block-String, ein Zeichen je Feld; Legende `{ "~": river, ".": grass, … }`. Regionen als zweites Raster gleicher Größe, `.` = keine Region (Meer). Feld (0, 0) oben links, y nach Süden wie auf dem Brett.
- **Rand:** Die Weltkarte ist eine Insel im Meer: `world.skirt` Felder `river` rundum, nicht abgedunkelt.
- **Miniaturen:** `miniatures: { <id>: [{ prop, at: [dx, dy], rot?, scale? }] }` in Feldern relativ zur Feldmitte; Maßstab zusätzlich `render.world.miniatureScale`. Ein Ort: `{ node | home, at, model, variants: [{ model, requires }] }`.
- **Drachenzeichen:** `signs: [{ act, kind: ash, areas: [[x, y, w, h]] }]`; aktiv ab `act ≤ aktueller Akt`; Aschefelder werden zu Gelände `ash`, Flocken fallen über den Flächen.
- **UI über der Szene:** `WorldView.onFrame` ruft nach jedem Bild die UI, die Knoten (`left/top` in px), Pfade (SVG in px) und Regionsnamen setzt, ohne Preact neu zu rendern.
- **Licht:** Jahreszeit der Region des aktuellen Akts (`render.world.seasons`).

### Leitplanken

- Keine Spielwerte und kein sichtbarer Text im Code; Babylon nur als Einzelmodule.
- `campaign.yaml` `pos`/`homePos` bleiben vorerst liegen (der Strang Akt-Struktur 4.x arbeitet parallel an `campaign.yaml`); die Weltkarte liest Orte nur noch aus `valmora.yaml`. Aufräumen als Folgeaufgabe.
- Heimsuchungen, Wimpel, Leutnant-Figuren gehören zu 5.5/5.6 und Epic 3.

### References

- [Source: concept/26-epics/epics/epic-05.md#Story 5.2]
- [Source: concept/24-architecture/architecture.md#5.12]
- [Source: concept/23-art-direction/art-direction.md#6. Weltkarte, #2.4 Jahreszeiten]
- [Source: concept/25-ux/DESIGN.md#map-node, Nebel `{colors.fog}`]
- [Source: concept/25-ux/EXPERIENCE.md#Navigation, Gesten (2 Zoomstufen)]
- [Source: concept/22-narrative/narrative.md#Setting, Orte]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint` grün, `pnpm test` 275 Tests grün (neu `world-layout.test.ts`), `pnpm content:check` OK, `pnpm build` grün, erster Download 10,35 von 15,00 MB; `world/` (glb 1,36 MB, Textur 0,30 MB, Höhen 0,07 MB) liegt nur im Laufzeit-Cache.
- Browser 375 × 812 (Hardware-WebGL, Mittel): Weltkarte lädt nach Prolog → Ergebnis → „Zur Weltkarte“; Knoten Kapitel 1 öffnet die Karte, zoomt heran und rückt den Knoten nach oben; Tipp daneben schließt; Nebel über Eisenmark und Aurenhall mit Namen; keine Konsolenfehler außer HMR-Resten.

### Completion Notes List

- Gelände: Blender exportiert Kachel (x, y) bei glTF (x, h, y); Babylon lädt das als (−x, h, y), `WorldView.buildLand` dreht es um 180°. Die gemalte Textur lädt ohne V-Umkehr (glTF-Ursprung oben).
- Asche ist in die gemalte Textur gebacken (Akt 1 ist immer erreicht); Zeichen späterer Akte (Risse, Schatten) brauchen eigene Ebenen.
- Felsen-Requisiten auf Bergfeldern entfallen (die Gipfel sind jetzt Gelände); Bäume und Häuser stehen auf den Höhen der Höhendatei, Felder unter Wasser bekommen keine Requisiten.
- Platzhalter: Lager ohne Zelt-Modell (Wagen + Kiste); Jahreszeiten späterer Akte nur als Licht, Herbst- und Schneefarben in der Textur.
- Offen: `campaign.yaml` `pos`/`homePos` ungenutzt (nach dem Merge der Akt-Struktur entfernen); Wasser nutzt die Brett-Wellen mit geringer Deckkraft.

### File List

- `content/world/valmora.yaml` (neu), `content/core/render.yaml`, `content/core/locales/{de,en}.names.yaml`
- `src/core/defs.ts`, `src/core/util.ts`, `src/content/{schemas,load,validate}.ts`, `tools/content-check.ts`
- `src/render/world/{world,layout}.ts` (neu), `src/render/shared/props.ts` (neu), `src/render/shared/terrain3d.ts`
- `src/app/screens/WorldMap.tsx`, `src/app/screens/WorldMap.css`, `src/render/board/board.ts`
- `tools/art/{world,world_height,blender_world}.py` (neu), `tools/art/build.py`, `package.json`
- `art/world/*` (neu), `art/prompts/world_topography.md` (neu)
- `tests/unit/world-layout.test.ts` (neu)
- `concept/23-art-direction/{art-direction,decision-log}.md`, `concept/24-architecture/decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Zweite Änderung (2026-10-24): flaches Bild statt 3D-Szene

**Gültig ist dieser Abschnitt; die Akzeptanzkriterien und Notizen oben beschreiben den abgelösten 3D-Stand.** Der Produktinhaber hat die Weltkarte auf ein flaches, gemaltes Bild zurückgestellt (Entscheidung in `concept/23-art-direction/decision-log.md`).

### Akzeptanzkriterien (neu)

1. **Inhalt:** `content/world/valmora.yaml` mit `image`, `size`, `regions` (Akt, Ort des Namens), `fog` (Nebelkanten je Akt) und `places` (35 Orte plus Heimat als Prozentpositionen, Beschriftung, Art; `node` bindet einen Knoten). `content:check` prüft Knoten und Heimat, 90 px Mindestabstand und Regionsnamen.
2. **Bild:** `art/world/map_flat_v1.png` (ChatGPT, `art/prompts/world_map.md`) → `public/assets/world/valmora.webp` über `tools/art/build.py`, auf Abruf geladen. Keine Gebäude, Wege oder Schrift im Bild.
3. **Karte:** `WorldMap.tsx` verschiebt das Bild per CSS-Transform (Ziehen mit Nachgleiten, Pinch und Mausrad für 2 Zoomstufen, Werte in `render.yaml worldMap`); Steine, Wege und Regionsnamen sind HTML darüber; die Sicht-Rechnung steht rein in `worldMapView.ts`.
4. **Nebel:** Regionen späterer Akte als der aktuelle liegen unter einem Nebelverlauf von oben, ihr Name steht darüber.
5. **Hub unverändert (5.3):** Tipp auf einen Knoten zoomt leicht heran und bringt ihn über die Karte, Tipp daneben schließt, Ziehen verschiebt; das Bild darf oben und unten über den Rand hinaus, damit Orte am Rand unter dem HUD hervorkommen.
6. **Später optional:** Varianten, Drachenzeichen, kleine 3D-Aufsätze (Burg, Lager) auf den Lichtungen.

### Umgesetzt

- Entfernt: `src/render/world/`, `src/render/shared/props.ts`, `tests/unit/world-layout.test.ts`, `tools/art/{world,world_height,blender_world}.py`, `pnpm art:world`, die 3D-Dateien in `art/world/`, `gridRows`, `render.world` (Wasser, Nebel, Asche, Jahreszeiten, Landschaft), `propModels` in `validateContent`.
- Neu: `src/app/screens/worldMapView.ts`, `tests/unit/world-map.test.ts`, `tools/art/world_guide.py` (Layout-Skizze und Abstandsprüfung für künftige Bildläufe), `art/world/{map_flat_v1.png,map_guide.png,map_layout.json,map_placed_v1.json}`.
- Verschoben: die Bäume je Akt von `render.world.scenery.trees` nach `render.board.trees` (nur das Brett nutzt sie).
- `valmora.yaml` bindet `prologue` → P, `m1_1` → 1-1, `ch01` → 1-2, `ch02` → 1-3 (Brücken-Knoten bis Story 9.3/9.4); die übrigen 32 Plätze warten auf ihre Knoten in den späteren Stories.
