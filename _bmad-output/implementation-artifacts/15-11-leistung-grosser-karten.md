# Story 15.11: Leistung großer Karten

Status: ready-for-dev

## Story

Als Spieler
möchte ich auch auf großen Karten flüssig spielen,
damit die Schlachten auf dem Handy funktionieren.

## Acceptance Criteria

Grundlage ist `concept/26-epics/epics/epic-15.md` Story 15.11. Die Story läuft vorgezogen (eigentlich nach 15.5): die großen Karten 1-6 und 1-8 (30 × 40) liegen als Entwürfe in `concept/27-ueberarbeitung/levels/` und laden mit `__hc.devMap(<id>)`; Draft-PR #104 bringt sie ins Spiel. Der Produktinhaber war bei der Erstellung nicht erreichbar; alles mit **[C]** ist eine vorläufige Entscheidung des Entwicklers, im Decision-Log als solche markiert und vom Produktinhaber zu bestätigen.

1. **Übersicht auf 30 × 40:** Die Zoomstufe „ganze Karte“ (Story 13.9) zeigt eine 30 × 40-Karte bei 375 × 812 vollständig im freien Bereich zwischen den HUD-Teilen. Sie ist auf dem Handy ohne Pinch erreichbar: ein runder **Übersicht-Stein** (Icon `map`, Stil wie der Menü-Stein, `aria-pressed`) unter dem Menü-Stein schaltet sie ein und aus **[C]**. Taste `M` bleibt.
2. **Springen aus der Übersicht:** Ein Tipp auf das Brett in der Übersicht wählt nichts aus, sondern holt die Kamera in die weiteste normale Zoomstufe, zentriert auf das getippte Feld **[C]**. Doppeltipp, „Nächste Figur“ und die Gegner-Leiste springen wie bisher; in der Übersicht bewegt sich die Kamera beim Springen zu einem schon sichtbaren Feld nicht.
3. **Gegnerphase beschleunigt:** Neue Einstellung **„Gegnerzüge: Gemeinsam / Einzeln“** in den Optionen (Block bei „Gegnerphase“), Standard „Gemeinsam“ **[C]**. „Gemeinsam“: aufeinanderfolgende Gegner- und Drittpartei-Züge, die **nur** aus einem Weg bestehen (kein Schlag, kein anderes Ereignis dazwischen), laufen gleichzeitig, ohne Pulsieren des Handelnden; die Kamera holt die Zielfelder ins Bild, wenn sie nicht sichtbar sind (`frameTiles`). Schläge, Zauber, Status, Spawns, Flucht usw. laufen wie bisher einzeln. Tempo 1×/2×/Überspringen bleibt unverändert und wirkt zusätzlich. Texte in `de.yaml` und `en.yaml`.
4. **Replays unverändert:** Die Bündelung ist reine Darstellung; Command-Log, Events, Zufall (Seed-RNG) und Endzustand sind gleich. Ein Test belegt, welche Ereignisfolgen gebündelt werden und welche nicht.
5. **Messung (Ersatz fürs Handy):** Das Perf-Werkzeug (`pnpm perf`) misst zusätzlich die Entwürfe 1-6 (`s1_1_6_paktwacht`) und 1-8 (`s1_1_8_heimat`) mit voller Aufstellung (12 eigene Figuren) und die 3D-Burg (alle Räume auf höchster Stufe), jeweils bei CPU-Drosselung 2× und 4×: Ø FPS, p95, max, Draw Calls, Dauer der Gegnerphase (einzeln und gemeinsam). Messwerte in dieser Story (Dev Agent Record).
6. **NFR1 auf dem neuen Maßstab:** Vorschlag für NFR1 in `concept/24-architecture/architecture.md` (§2.2, §10) und `concept/26-epics/epics/requirements.md`, Eintrag im Architektur-Decision-Log: Karten bis 1 200 Felder (30 × 40) mit 50+ Figuren und die Burg; FPS-Ziel wie bisher (60 FPS bei 2×, 30 FPS bei 4× Drosselung als Desktop-Ersatz), dazu ein Zeitziel für die Gegnerphase.
7. **Lade-Tests robust:** Tests, die unter Last das 5-s-Limit von Vitest reißen, weil sie den Content von der Platte laden (z. B. `tests/unit/worker-replay.test.ts`, `core.test.ts`, `lieutenants.test.ts`, `migrations.test.ts`), laufen auch unter Last durch, ohne dass eine Prüfung wegfällt oder abgeschwächt wird (Ursache beheben: das wiederholte Parsen der YAML-Dateien).
8. **Offen bleibt das Gerät:** Die Messung auf dem Referenzgerät (Pixel 6a / iPhone 12) ist nicht Teil dieser Umsetzung; sie bleibt Release-Check (Story 9.14) und ist hier und im PR ausdrücklich als offen benannt.
9. **Prüfungen:** `pnpm check` grün (Lint mit Typecheck, Tests, `content:check`, Build mit Bundle-Budget). Keine Karten-YAMLs geändert (PR #104); im Brett-Code nur Kamera und Wiedergabe.

## Tasks / Subtasks

- [ ] T1 Lade-Tests (AC 7): geparste YAML-Dokumente je Prozess zwischenspeichern (`src/content/node.ts`, Schlüssel Pfad + Größe + Zeitstempel, Rückgabe als Kopie); Suite unter Last laufen lassen.
- [ ] T2 Gegnerzüge bündeln (AC 3, 4): reine Funktion `marchRuns(events, teamOf)` in `src/render/board/march.ts` (Test), Wiedergabe in `BoardView.play`; Einstellung `enemyMarch` in `src/app/state/settings.ts`, Optionen in `Menus.tsx`, Texte DE/EN; `battleCommands.ts` setzt `board.march`.
- [ ] T3 Übersicht (AC 1, 2): `BoardCamera.isWholeMap()`, `zoomInAt(p)`; Übersicht-Stein in `BattleHud.tsx`/`Battle.tsx` (Spielerphase), Tipp in der Übersicht springt (`useBattleInput.ts`); EXPERIENCE.md/DESIGN.md nachziehen.
- [ ] T4 Messung (AC 5): Bench `PERF_MAP`, `PERF_MARCH`, Burg-Lauf (`PERF_CASTLE=1`); Läufe 2×/4× auf 1-6, 1-8, Burg, Referenzschlacht; Tabelle hier.
- [ ] T5 NFR1 (AC 6): Architektur §2.2/§10, requirements.md, Decision-Log.
- [ ] T6 Belege: Screenshots 375 × 812 stumm (Übersicht, Sprung, Gegnerphase gemeinsam, Optionen).
- [ ] T7 `pnpm check`, Code-Review (`bmad-code-review`), PR.

## Dev Notes

### Ist-Zustand (gelesen 2026-11-05)

- **Kamera** `src/render/board/boardCamera.ts`: Zoomstufen aus `render.yaml camera.zoomSteps` [7, 10, 15] Spalten; eine Stufe darüber ist „ganze Karte“ (`pptFor`, `wholeMap()`, Story 13.9), erreichbar per Pinch/Mausrad über die weiteste Stufe hinaus und Taste `M` (`useBattleInput.ts`). Auf 1-6 bei 375 × 812: 11,7 px je Feld, die ganze Karte passt. `centerOn` bewegt die Kamera nur, wenn das Feld nicht sichtbar ist (Aufrufer prüfen `isVisible`). `frameTiles` geht höchstens bis zur weitesten normalen Stufe heraus.
- **Gegnerphase** `src/render/board/board.ts` `play()`: je Gegner `aiTurn` (Kamera springt hin, Pulsieren `aiPace.focusMs` 450 ms, nur wenn ein Ereignis folgt), `moved` (260 ms je Feld, danach 350 ms Pause), `strike` … Das Tempo kommt aus `settings.enemySpeed` (1×, 2×, 3 = Überspringen), gesetzt in `battleCommands.ts` und über `SpeedControl` während der Phase. Auf 30 × 40 mit 36 Gegnern sind das bei 1× grob 36 × 2 s.
- **Messwerkzeug** `tests/perf/` (Stories 7.5, 7.7, 7.8): `bench.ts` baut die Referenzschlacht (`benchMap.ts`, 24 × 32, 40 Einheiten) und spielt eine Gegnerphase; `perf.spec.ts` drosselt per CDP (`Emulation.setCPUThrottlingRate`) und schreibt `test-results/perf/report.md`. Die KI-Rechenzeit wird vor dem Messfenster gezeitet.
- **Lade-Tests:** `loadContentFromDisk()` braucht ~1,2 s, davon ~0,9 s YAML-Parsen; viele Tests laden je Test neu. Unter Last (Dev-Server, andere Sitzungen) rissen 18 Tests das 5-s-Limit.

### Grenzen

- `src/core` nicht ändern (Regeln, KI, Events); Bündelung nur in der Wiedergabe.
- Keine Karten-YAMLs ändern; 15.8 (Asset-Zuordnung in `src/render/board/`) und 15.9 (Brettfiguren) laufen parallel: nur `board.ts` (`play`), `boardCamera.ts`, neue Datei `march.ts` anfassen; vor dem Merge mit `main` abgleichen.
- Spielwerte nicht im Code; neue Stellgrößen in `render.yaml`.

### Project Context Rules (AGENTS.md)

- Kein sichtbarer Text im Code (Schlüssel in `de.yaml`/`en.yaml`), Beträge als Symbol + Zahl, Styles je Screen in eigener CSS-Datei, App-Zustand je Modul in `src/app/state/`.
- Neue Entscheidungen ins zuständige BMAD-Artefakt und dessen Decision-Log, nie in `concept/01-decisions.md`.
- Fertig erst mit grünem `pnpm check`.

### References

- [Source: concept/26-epics/epics/epic-15.md#Story 15.11]
- [Source: concept/26-epics/epics/requirements.md NFR1]
- [Source: concept/24-architecture/architecture.md §2.2, §10]
- [Source: concept/25-ux/EXPERIENCE.md Gesten, Zustände Kampf; DESIGN.md Komponenten]
- [Source: _bmad-output/implementation-artifacts/7-8-grosse-schlachten-ohne-ruckler.md Messverfahren]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created (2026-11-05).

### File List
