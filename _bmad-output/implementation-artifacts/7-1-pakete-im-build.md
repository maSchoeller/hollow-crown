# Story 7.1: Pakete im Build

Status: review

## Story

Als Spieler
möchte ich, dass das Spiel beim ersten Öffnen schnell startet,
damit ich nicht auf einen großen Download warte.

## Acceptance Criteria

1. `content/packs.yaml` beschreibt die Pakete `core` (Shell, Regeln, Prolog), `act1`, `voice.act1.de`, `voice.act1.en` mit Globs, `released`, Ladeart und Budget.
2. `pnpm build` erzeugt per Vite-Plugin je veröffentlichtem Paket ein virtuelles Modul `virtual:hc-pack/<id>` (alle YAML des Pakets als ein JSON-Chunk) und `dist/packs.json` mit Dateien, Hashes und Größen je Paket. Dateien unveröffentlichter Pakete fehlen im Build.
3. Assets sind einem Paket zugeordnet, mit Dateiliste je Paket (siehe Abweichung unten: Zuordnung per Glob, Liste in `packs.json`).
4. `tools/check-bundle-size.mjs` bricht ab, wenn `core` (erster Download) über 15 MB (gzip) liegt, und meldet die übrigen Pakete gegen ihre Budgets (Warnung).
5. `pnpm content:check` prüft `packs.yaml` (Schema, jede Content-Datei in einem Paket, erster Knoten ganz in `core`).

## Tasks / Subtasks

- [x] T1 `content/packs.yaml` und reine Regeln `src/content/packs.ts` (Schema, `globToRegExp`, `packOf`, `groupByPack`, `checkPacks`, Typen von `packs.json`) (AC 1, 5)
- [x] T2 Vite-Plugin `tools/build/packs-plugin.ts`: `virtual:hc-pack/<id>`, `virtual:hc-packs` (Paketliste, Karte/Szene → Paket, dynamischer Import je Nicht-core-Paket), nach dem Build `dist/packs.json`, Dateien unveröffentlichter Pakete aus `dist` entfernen (AC 2, 3)
- [x] T3 `vite.config.ts`: Plugin einhängen; der Precache nimmt nur noch `core` (Filter in `manifestTransforms` über `packs.nonCorePaths()` statt `globIgnores`) (AC 2)
- [x] T4 `src/content/browser.ts` liest die Paket-Module statt des Globs über alle YAML; Typen in `src/content/virtual-packs.d.ts` (AC 2)
- [x] T5 `check-bundle-size.mjs`: Budget von `core` aus `packs.json`, übrige Pakete gegen `budgetMb` (AC 4)
- [x] T6 `content:check`: `checkPacks`; `src/content/node.ts` liefert `contentFiles()` und lädt `packs.yaml` nicht als Content (AC 5)
- [x] T7 Tests `tests/unit/packs.test.ts`

## Dev Notes

- **Zuordnung:** Eine Datei gehört zum ersten Paket, dessen Globs passen; was kein Paket nennt, gehört zu `core`. `content`-Globs gelten relativ zu `content/`, `assets`-Globs relativ zu `public/assets/`. `content:check` verlangt trotzdem, dass jede Content-Datei explizit genannt ist, damit ein neuer Akt nicht still in `core` landet.
- **core:** `core/**`, `world/**`, `home/**`, aus `acts/act1/` Kampagne, Einheiten, Flags, Prolog-Karte und -Szenen sowie `locales/en/act1.dialogue.yaml` (enthält auch die englischen Prolog-Zeilen; architecture §5.14 nennt EN-Dialoge unter `act1`, ohne diese Zeilen zeigte der Prolog auf Englisch nur Schlüssel, bis `act1` geladen ist). Kampagne und Einheiten müssen in `core` stehen, weil Weltkarte und Truppe sie ohne `act1` brauchen.
- **act1:** übrige Akt-1-Content-Dateien und genau die Assets, die Story 7.6 schon bei Bedarf lädt (Orte, Halbfiguren, Weltkarte, Sprites, Item-Bilder, Modelle, Musik außer Titel und Effekten). Der Precache und damit der erste Download bleiben unverändert (10,36 MB, Budget 15 MB); `act1` misst 16,6 MB (Budget 40 MB).
- **Abweichung von der Story:** `pnpm art:build` schreibt die Assets weiter nach Art geordnet (`public/assets/<art>/…`) statt nach `public/assets/<pack>/`; die Dateiliste je Paket steht in `dist/packs.json`, die der Build aus den Globs erzeugt. Grund: alle Asset-URLs (Brett, UI, Audio, Ladeplan 7.6) bleiben gleich, ein Asset wechselt das Paket durch eine Zeile in `packs.yaml` statt durch Verschieben, und die Hashes in `packs.json` decken auch die JS-Chunks der Pakete ab. Eingetragen im Decision-Log der Architektur.
- **Reihenfolge der Hooks:** Das Plugin rechnet in `closeBundle` mit `order: 'pre'`, also bevor `vite-plugin-pwa` (ebenfalls `closeBundle`) den Service Worker baut; so steht `packs.json` selbst im Precache (Offline-Start kennt die Pakete) und der Filter kennt die Paketdateien.
- **Bis Story 7.2:** `browser.ts` importiert `core` und `act1` noch statisch, das Spiel verhält sich also wie vorher. 7.2 lädt `act1` per `loaders` aus `virtual:hc-packs` nach und speichert die Dateien in `hc-pack-<id>-<hash>`.

### References

- [Source: concept/26-epics/epics.md#Story 7.1]
- [Source: concept/24-architecture/architecture.md#5.14 Content- und Asset-Pakete]
- [Source: _bmad-output/implementation-artifacts/7-6-ladeanzeige-beim-ersten-start-und-vor-missionen.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm build`: core 295 Dateien (Precache 275), act1 312 Dateien, 16,61 MB; erster Download 10,36 MB.
- `pnpm lint`, `pnpm test` (274 Tests), `pnpm content:check` grün.

### Completion Notes List

- Unveröffentlichte Sprachpakete haben noch keine Dateien; ihr Ausschluss ist über den Test der Zuordnung und das Entfernen in `closeBundle` abgedeckt.
- `contentVersion` (Spielstand) bleibt der Hash der geladenen Daten; bis 7.2 sind das wie bisher alle Daten.

### File List

- content/packs.yaml (neu)
- src/content/packs.ts (neu), src/content/virtual-packs.d.ts (neu), src/content/browser.ts, src/content/node.ts
- tools/build/packs-plugin.ts (neu), tools/check-bundle-size.mjs, tools/content-check.ts
- vite.config.ts
- tests/unit/packs.test.ts (neu)
- concept/24-architecture/decision-log.md
