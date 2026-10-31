# Story 5.1: Szenen-Host und geteilter Asset-Cache

Status: done

## Story

Als Spieler
möchte ich zwischen Brett, Weltkarte und Heimat wechseln, ohne lange zu warten,
damit sich das Spiel wie ein Ganzes anfühlt.

## Acceptance Criteria

1. **Host:** `src/render/host.ts` hält Engine, Canvas, Qualitätsstufe und FPS-Deckel. Die App erzeugt die Engine einmal; Screens hängen den Canvas des Hosts in ihren Platz ein, statt eigene Canvas/Engines zu bauen.
2. **Eine Szene aktiv:** Wechselt die App zwischen Szenen (Brett ↔ Weltkarte ↔ später Heimat), ist immer nur eine Szene aktiv; die alte wird entsorgt (Meshes, Materialien, Texturen, Lichter, Kameras, Partikel, Eingabe-Listener).
3. **Geteilter Asset-Cache:** Modelle (glTF als `AssetContainer`) und Bodentexturen bleiben im geteilten Cache mit Referenzzählung und werden beim Szenenwechsel nicht neu geladen. Unbenutzte Einträge bleiben bis zu einer Obergrenze (`render.yaml`) erhalten, darüber fallen die am längsten unbenutzten weg.
4. **Aufteilung:** Das Brett liegt in `src/render/board/`, gemeinsame Teile (Gelände, Modelle, Figuren, Assets, Kamera, Jahreszeit/Licht) in `src/render/shared/`. Die Schnittstelle des Bretts bleibt (`load`, `play`, `setOverlays`, `centerOn`, `relayout`, `quality`, `dispose`).
5. **Dialog im Vordergrund:** Läuft eine Visual-Novel-Szene über dem Brett, rendert der Canvas höchstens mit `board.fpsIdle` (bzw. pausiert, wenn die Szene den Canvas ganz verdeckt).
6. **Leistung:** Die Zeichenaufrufe auf Kap. 1 (Mittel) steigen nicht gegenüber dem Stand vor der Story (gemessen 2026-10-24: 99 je Bild inkl. Schattenpass, Kamera beim Start, Hardware-WebGL; D17 nannte 49 vor den Tripo-Figuren).

## Tasks / Subtasks

- [x] T1 `src/render/shared/`: `terrain3d.ts`, `models.ts`, `figures.ts`, `assets.ts`, `camera.ts` verschieben; `season.ts` mit dem Kartenlicht (Umgebung + Sonne) aus dem Brett; Importe in App und Tests anpassen (AC 4)
- [x] T2 `src/render/shared/cache.ts`: generischer `RefCache<T>` (laden einmal, `use(key, holder)`, `release(holder)`, LRU für unbenutzte bis `keepUnused`) + Unit-Tests (AC 3)
- [x] T3 `src/render/host.ts`: `RenderHost` (Singleton, Canvas, Engine, gemeinsame Babylon-Szene, Qualität = Hardware-Skalierung, Renderschleife mit FPS-Deckel, `mount(slot)`, `activate(view)`, `release(view)`, `hold('run'|'idle'|'pause')`, Aufräumen der alten Szene) (AC 1, 2, 5)
- [x] T4 `models.ts` auf den Cache umstellen (Schlüssel = Pfad, Halter = aktive Szene), Bodentexturen ebenfalls im Cache (AC 3)
- [x] T5 `src/render/board/`: `board.ts` (BoardView nutzt den Host statt eigener Engine; Eingabe per `AbortController` abbaubar), `overlays.ts` (Farben und Mesh-Bau der Markierungen), `picking.ts` (Strahl vom Bildschirm auf das Gelände) (AC 4)
- [x] T6 `Battle.tsx`: Platz für den Host-Canvas statt eigenem `<canvas>`; Dialog über dem Brett → `hold('idle')` (AC 5)
- [x] T7 `render.yaml` + Schema: `assets.keepUnused`; Messung der Zeichenaufrufe vorher/nachher im Browser (AC 6)
- [x] T8 Checks: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, e2e-Smoke

## Dev Notes

### Ist-Zustand (gelesen 2026-10-24)

- `src/render/board.ts` (1421 Zeilen): `BoardView` baut im Konstruktor **eigene** `Engine` + `Scene` auf dem übergebenen Canvas, bindet Zeiger-/Rad-Listener anonym an den Canvas, `dispose()` ruft `releaseModels(scene)`, `scene.dispose()`, `engine.dispose()`. FPS-Deckel steckt in `frame()` (busy → `fpsActive`, sonst `fpsIdle`). Qualität: `applyQuality()` setzt Hardware-Skalierung und Schattenkarte. Software-WebGL erzwingt „low“ und halbe Auflösung (D17).
- `src/render/models.ts`: `containers`-Map mit Schlüssel `${scene.uid}:${path}`, `releaseModels(scene)` entsorgt alle Container einer Szene → jeder neue Kampf lädt alle Modelle neu.
- `terrain3d.ts`: `loadGroundTextures(scene)` lädt 15 Texturen je Szene neu; `buildTerrain(scene, data, state, …)` braucht von `BattleState` nur `width`, `height`, `terrain`, `timers` (für 5.2 wichtig).
- `Battle.tsx` erzeugt `BoardView` im `useEffect` und entsorgt es beim Unmount; Dialoge im Kampf laufen als Overlay (`dialogue`-State, `bubble` = Sprechblasen über dem Brett, sonst Visual-Novel-Overlay).
- Tests importieren `src/render/camera` und `src/render/terrain3d`; App importiert `render/assets` in `flow.ts` und `halves.ts`.

### Entwurf

- **Gemeinsame Babylon-Szene:** Ein `AssetContainer` gehört in Babylon zu genau einer `Scene`; Instanzen entstehen nur in dieser. Damit Modelle beim Wechsel Brett ↔ Weltkarte nicht neu geladen werden, hält der Host **eine** Babylon-`Scene` als Bühne. „Szene“ im Sinne der Architektur (§5.12) ist die aktive *Ansicht* (`HostedView`: Brett, Weltkarte, später Heimat) mit eigener Kamera, Licht, Meshes. Beim Wechsel räumt der Host alles ab, was in der Bühne liegt (Partikel, Animationsgruppen, Meshes, Knoten, Skelette, Lichter samt Schattengeneratoren, Kameras, Materialien, Texturen), außer den Einträgen des Caches. Container-Inhalte liegen nicht in den Listen der Szene (Babylon blockiert die Entity-Sammlung beim Laden in einen Container) und überleben damit.
- **Refcount:** `RefCache` zählt je Eintrag die Halter (aktive Ansichten), die ihn benutzt haben. `release(holder)` beim Entsorgen der Ansicht; Einträge mit 0 Haltern bleiben bis `render.yaml assets.keepUnused`, älteste zuerst weg.
- **Renderschleife:** Der Host fragt `view.busy(now)` und deckelt auf `fpsActive`/`fpsIdle`; `hold('idle')` erzwingt `fpsIdle`, `hold('pause')` zeichnet nicht. Bei Sprechblasen-Dialogen (`bubble`) läuft das Brett normal (Kamera folgt den Sprechern), beim Overlay-Dialog `idle`.
- **Canvas:** Host-Canvas mit Klasse `hc-stage` (füllt den Platz); Screens geben einen leeren Platz (`<div class="hc-stage-slot">`), in den Preact nie selbst rendert.

### Leitplanken

- Babylon 9.32 (`@babylonjs/core`, `loaders`, `materials`), Imports nur als Einzelmodule (Tree-Shaking, Bundle-Budget 15 MB).
- Keine Spielwerte im Code: `keepUnused` in `render.yaml`. Kein sichtbarer Text.
- `src/core` bleibt unberührt.
- Brett-Verhalten (Eingabe, Kamera, Wiedergabe, `window.__board` für E2E) unverändert.

### Project Structure Notes

- Ziel laut Architektur §5.12: `render/host.ts`, `render/shared/`, `render/board/`, `render/world/`, `render/home/`. `world/` kommt mit 5.2, `home/` später.

### Project Context Rules

- `pnpm lint` (inkl. Typecheck), `pnpm test`, `pnpm content:check`, `pnpm build` grün; Build bricht bei überschrittenem Bundle-Budget ab.
- Code und Bezeichner Englisch, Story-Datei Deutsch.

### References

- [Source: concept/26-epics/epics/epic-05.md#Story 5.1]
- [Source: concept/24-architecture/architecture.md#5.12 Rendering: eine Engine, drei Szenen]
- [Source: concept/24-architecture/architecture.md#10. Leistung]
- [Source: concept/01-decisions.md#D17]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint` grün, `pnpm test` grün (neu `tests/unit/render-cache.test.ts`, 5 Tests), `pnpm content:check` OK, `pnpm build` grün (erster Download 10,34 von 15,00 MB), `pnpm test:e2e` 12 von 12 grün.
- Browser (375 × 812, Hardware-WebGL, Kap. 1, Mittel): Zeichenaufrufe je Bild nach dem Laden **99 vorher, 99 nachher** (Kamera beim Start; 101 eine Zoomstufe weiter draußen).
- Wechsel Brett → Weltkarte → Brett dreimal: zwischen den Szenen liegen 0 Meshes, 0 Materialien, 0 Lichter, 0 Kameras auf der Bühne, nur die 15 Bodentexturen des Caches; beim zweiten Betreten 0 Anfragen nach `.glb` oder `ground/` (Resource Timing).

### Completion Notes List

- Gefundener Babylon-Fehler: Parallel ladende glTF-Container setzen sich gegenseitig das Flag `_blockEntityCollection` zurück, ein Teil ihrer Meshes und Skelette landet in den Listen der Szene. Mit einer Szene je Kampf fiel das nie auf (die Szene wurde ganz entsorgt); mit der Bühne hätte das Aufräumen Container-Inhalte zerstört. `loadContainer` ruft deshalb `removeAllFromScene()` und bereitet die Skelette vor, damit ihre Knochen-Textur zum Container gehört (sonst entsteht sie beim ersten Klonen auf der Bühne und wird beim Wechsel entsorgt → Absturz in `Skeleton.prepare`).
- `BoardView` behält seine Schnittstelle; neu sind `hold(mode)` (Dialog) sowie `busy`/`frame`/`resize` für den Host. Eingabe-Listener hängen an einem `AbortController`, weil der Canvas die Szene überlebt.
- Die Heimat (`render/home/`) gibt es noch nicht; das Lager ist weiterhin ein 2D-Screen.

### File List

- `src/render/host.ts` (neu), `src/render/shared/cache.ts` (neu), `src/render/shared/season.ts` (neu)
- `src/render/shared/{terrain3d,models,figures,assets,camera}.ts` (verschoben aus `src/render/`, angepasst)
- `src/render/board/board.ts` (verschoben aus `src/render/board.ts`, auf den Host umgestellt), `src/render/board/overlays.ts` (neu), `src/render/board/picking.ts` (neu)
- `src/app/screens/Battle.tsx`, `src/app/state/{flow,halves}.ts`
- `src/ui/base.css`, `src/ui/styles.css`
- `content/core/render.yaml`, `src/content/schemas.ts`, `src/core/defs.ts`
- `tests/unit/render-cache.test.ts` (neu), `tests/unit/{camera,terrain3d}.test.ts`, `tests/e2e/smoke.spec.ts`
- `concept/24-architecture/decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Abnahme 2026-10-27

Abgenommen (Status done). Brett, Weltkarte und Szenen im Durchlauf ohne Fehler; Tests grün. Gesamtbefund: `acceptance-2026-10-27.md`.
