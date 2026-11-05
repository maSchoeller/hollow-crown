# Story 15.11: Leistung großer Karten

Status: review

## Story

Als Spieler
möchte ich auch auf großen Karten flüssig spielen,
damit die Schlachten auf dem Handy funktionieren.

## Acceptance Criteria

Grundlage ist `concept/26-epics/epics/epic-15.md` Story 15.11. Die Story läuft vorgezogen (eigentlich nach 15.5): die großen Karten 1-6 und 1-8 (30 × 40) liegen als Entwürfe in `concept/27-ueberarbeitung/levels/` und laden mit `__hc.devMap(<id>)`; Draft-PR #104 bringt sie ins Spiel. Der Produktinhaber war bei der Erstellung nicht erreichbar; alles mit **[C]** ist eine vorläufige Entscheidung des Entwicklers, im Decision-Log als solche markiert und vom Produktinhaber zu bestätigen.

1. **Übersicht auf 30 × 40:** Die Zoomstufe „ganze Karte“ (Story 13.9) zeigt eine 30 × 40-Karte bei 375 × 812 vollständig im freien Bereich zwischen den HUD-Teilen. Sie ist auf dem Handy ohne Pinch erreichbar: ein runder **Übersicht-Stein** (Icon `map`, Stil wie der Menü-Stein, `aria-pressed`) links neben dem Menü-Stein in der Kopfzeile (Spielerphase) schaltet sie ein und aus **[C]**. Taste `M` bleibt. (Erstfassung: „unter dem Menü-Stein“; in der Kopfzeile ändert der Stein die Höhe des HUD nicht.)
2. **Springen aus der Übersicht:** Ein Tipp auf das Brett in der Übersicht (Spielerphase) holt die Kamera in die weiteste normale Zoomstufe, zentriert auf das getippte Feld **[C]**; ein leeres Feld wird dabei nicht gewählt, ein Tipp auf eine Figur wählt sie zusätzlich wie gewohnt (Maus und Finger). Doppeltipp, „Nächste Figur“ und die Gegner-Leiste springen wie bisher; in der Übersicht bewegt sich die Kamera beim Springen zu einem schon sichtbaren Feld nicht.
3. **Gegnerphase beschleunigt:** Neue Einstellung **„Gegnerzüge: Gemeinsam / Einzeln“** in den Optionen (Block bei „Gegnerphase“), Standard „Gemeinsam“ **[C]**. „Gemeinsam“: aufeinanderfolgende Gegner- und Drittpartei-Züge, die **nur** aus einem Weg bestehen (kein Schlag, kein anderes Ereignis dazwischen), laufen gleichzeitig, ohne Pulsieren des Handelnden; die Kamera gleitet zur Mitte von Start- und Zielfeldern, wenn eines nicht sichtbar ist, und hält dabei die Zoomstufe (Erstfassung `frameTiles` zoomte heraus und halbierte die Bildrate, siehe Messung; Ziele weiter auseinander als eine Bildschirmbreite bleiben teils außerhalb, die Übersicht zeigt alle). Ab wie vielen Läufern gebündelt wird, steht in `render.yaml aiPace.marchMin` (2). Schläge, Zauber, Status, Spawns, Flucht usw. laufen wie bisher einzeln. Tempo 1×/2×/Überspringen bleibt unverändert und wirkt zusätzlich. Texte in `de.yaml` und `en.yaml`.
4. **Replays unverändert:** Die Bündelung ist reine Darstellung; Command-Log, Events, Zufall (Seed-RNG) und Endzustand sind gleich. Ein Test belegt, welche Ereignisfolgen gebündelt werden und welche nicht.
5. **Messung (Ersatz fürs Handy):** Das Perf-Werkzeug (`pnpm perf`) misst zusätzlich die Entwürfe 1-6 (`s1_1_6_paktwacht`) und 1-8 (`s1_1_8_heimat`) mit voller Aufstellung (12 eigene Figuren) und die 3D-Burg (alle Räume auf höchster Stufe), jeweils bei CPU-Drosselung 2× und 4×: Ø FPS, p95, max, Draw Calls, Dauer der Gegnerphase (einzeln und gemeinsam). Messwerte in dieser Story (Dev Agent Record).
6. **NFR1 auf dem neuen Maßstab:** Vorschlag für NFR1 in `concept/24-architecture/architecture.md` (§2.2, §10) und `concept/26-epics/epics/requirements.md`, Eintrag im Architektur-Decision-Log: Karten bis 1 200 Felder (30 × 40) mit 50+ Figuren und die Burg; FPS-Ziel wie bisher (60 FPS bei 2×, 30 FPS bei 4× Drosselung als Desktop-Ersatz), dazu ein Zeitziel für die Gegnerphase.
7. **Lade-Tests robust:** Tests, die unter Last das 5-s-Limit von Vitest reißen, weil sie den Content von der Platte laden (z. B. `tests/unit/worker-replay.test.ts`, `core.test.ts`, `lieutenants.test.ts`, `migrations.test.ts`), laufen auch unter Last durch, ohne dass eine Prüfung wegfällt oder abgeschwächt wird (Ursache beheben: das wiederholte Parsen der YAML-Dateien). Zusätzlich gilt ein Vitest-Zeitlimit von 20 s statt 5 s, weil Tests mit ganzen Schlachten auf den neuen 30 × 40-Karten (PR #104) allein 2–4 s brauchen (CI-Lauf 42120776560); das Limit fängt nur Hänger und prüft selbst nichts.
8. **Offen bleibt das Gerät:** Die Messung auf dem Referenzgerät (Pixel 6a / iPhone 12) ist nicht Teil dieser Umsetzung; sie bleibt Release-Check (Story 9.14) und ist hier und im PR ausdrücklich als offen benannt.
9. **Prüfungen:** `pnpm check` grün (Lint mit Typecheck, Tests, `content:check`, Build mit Bundle-Budget). Keine Karten-YAMLs geändert (PR #104); im Brett-Code nur Kamera und Wiedergabe.

## Tasks / Subtasks

- [x] T1 Lade-Tests (AC 7): geparste YAML-Dokumente je Prozess zwischenspeichern (`src/content/node.ts`, Schlüssel Pfad + Größe + Zeitstempel, Rückgabe als Kopie); Suite unter Last laufen lassen.
- [x] T2 Gegnerzüge bündeln (AC 3, 4): reine Funktion `marchRuns(events, teamOf)` in `src/render/board/march.ts` (Test), Wiedergabe in `BoardView.play`; Einstellung `enemyMarch` in `src/app/state/settings.ts`, Optionen in `Menus.tsx`, Texte DE/EN; `battleCommands.ts` setzt `board.march`.
- [x] T3 Übersicht (AC 1, 2): `BoardCamera.isWholeMap()`, `zoomInAt(p)`; Übersicht-Stein in `BattleHud.tsx`/`Battle.tsx` (Spielerphase), Tipp in der Übersicht springt (`useBattleInput.ts`); EXPERIENCE.md/DESIGN.md nachziehen.
- [x] T4 Messung (AC 5): Bench `PERF_MAP`, `PERF_MARCH`, Burg-Lauf (`PERF_CASTLE=1`); Läufe 2×/4× auf 1-6, 1-8, Burg, Referenzschlacht; Tabelle hier.
- [x] T5 NFR1 (AC 6): Architektur §2.2/§10, requirements.md, Decision-Log.
- [x] T6 Belege: Screenshots 375 × 812 stumm (Übersicht, Sprung, Gegnerphase gemeinsam, Optionen).
- [x] T7 `pnpm check`, Code-Review (`bmad-code-review`), PR.

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

- `PERF_GPU=1 PERF_LARGE=1 PERF_STAGES=2,4 PERF_RUNS=2 pnpm exec playwright test -c playwright.perf.config.ts --project=pixel6a` (Lauf 1, alle Zeilen, 25 min) und mit `PERF_LARGE_MARCH=1 PERF_LARGE_MAPS=reference,s1_1_6_paktwacht,s1_1_8_heimat,whole` (Lauf 2, nach der Kamera-Korrektur, 8 min). Rechner: Intel UHD 630 (ANGLE/D3D11), parallel liefen drei andere Sitzungen (Baseline 7.8: Referenz 2× = 59,3 FPS, 6,7 ms Thread je Frame; heute einzeln 49,9 FPS, 7,6 ms → Wanduhr-Werte etwa 15 % zu schlecht).
- Szenario: Truppe des Akts am Knoten `m1_6` voll aufgestellt (1-6: 41 Figuren, 1-8: 28, weil der Entwurf weniger Gegner trägt), **alle Gegner auf `aggressive`** (schlimmster Fall: jeder rückt vor). Gegnerphase = reine Wiedergabe bei Tempo 1×, KI-Rechenzeit getrennt.

### Messwerte (Desktop mit CPU-Drosselung als Handy-Ersatz, Profil pixel6a, Median aus 2 Läufen, max über alle)

| Szenario | Drossel | Ø FPS | p95 ms | max ms | Draw Calls | Gegnerphase |
|---|---|---|---|---|---|---|
| Referenz 24×32, einzeln | 2× | 49,9 | 33,4 | 150 | 48 | 62,4 s |
| Referenz 24×32, gemeinsam | 2× | **59,3** | 16,8 | 50 | 58 | **2,2 s** |
| 1-6 Paktwacht 30×40, einzeln | 2× | 36,8 | 50,0 | 133 | 83 | 77,7 s |
| 1-6 Paktwacht 30×40, gemeinsam | 2× | 45,9 | 33,4 | 100 | 96 | **9,4 s** |
| 1-6 in der Übersicht, gemeinsam | 2× | 38,8 | 41,7 | 83 | 124 | 9,2 s |
| 1-8 Heimat 30×40, einzeln | 2× | 41,2 | 33,4 | 167 | 60 | 43,8 s |
| 1-8 Heimat 30×40, gemeinsam | 2× | 49,2 | 33,3 | 67 | 67 | **2,5 s** |
| Burg, alle Räume Stufe 3 | 2× | **59,9** | 16,8 | 33 | 71 | – |
| Referenz 24×32, einzeln | 4× | 26,9 | 58,4 | 217 | 48 | 65,4 s |
| Referenz 24×32, gemeinsam | 4× | **29,7** | 50,1 | 67 | 58 | 2,3 s |
| 1-6 Paktwacht 30×40, einzeln | 4× | 22,1 | 75,0 | 267 | 82 | 81,6 s |
| 1-6 Paktwacht 30×40, gemeinsam | 4× | 13,8 | 100 | 117 | 95 | 11,0 s |
| 1-6 in der Übersicht, gemeinsam | 4× | 19,3 | 83,3 | 183 | 124 | 10,1 s |
| 1-8 Heimat 30×40, einzeln | 4× | 27,5 | 75,0 | 233 | 60 | 45,4 s |
| 1-8 Heimat 30×40, gemeinsam | 4× | 20,6 | 83,3 | 117 | 66 | 2,7 s |
| Burg, alle Räume Stufe 3 | 4× | **59,8** | 16,8 | 33 | 71 | – |

Zeilen „gemeinsam“ aus Lauf 2 (Kamera hält die Zoomstufe). Figuren: 1-6 = 36 Gegner + 5 eigene, 1-8 = Gegner der Startaufstellung + 5 eigene – die Truppe am Knoten `m1_6` hat 5 Mitglieder, die volle Aufstellung (12/14) und „50+ Figuren“ sind mit dem heutigen Kader nicht erreichbar; 50+ bleibt ungemessen. Lauf 1 mit Herauszoomen auf die Ziele (`frameTiles`) hatte bei „gemeinsam“ 89–103 Draw Calls und z. B. Referenz 2× nur 30,7 FPS – deshalb gleitet die Kamera jetzt nur.

**Bewertung:** Die Gegnerphase ist mit „Gemeinsam“ auf allen Karten unter dem Zeitziel (≤ 15 s; vorher 44–82 s). Referenzschlacht und Burg halten das FPS-Ziel (60/30). **Die 30 × 40-Entwürfe halten es nicht**: schon „einzeln“ kostet 1-6 rund 60 % mehr Thread-Zeit je Frame als die Referenz (83 statt 48 Draw Calls: mehr Gelände, Mauern, Requisiten im Bild), bei 4× und vielen gleichzeitig laufenden Figuren fällt 1-6 auf 14 FPS. Das ist Folgearbeit an den Zeichenkosten großer Karten (Requisiten/Mauern bündeln, Figuren außerhalb der Sicht, Schattenkarte), nicht Teil dieser Story. **Offen: Messung auf dem Referenzgerät** (Pixel 6a / iPhone 12) – Release-Check Story 9.14.

### Belege (375 × 812, stumm, echte 1-6 aus `main`)

- `15-11-belege/1-6-start.jpg` – Eröffnung mit Übersicht-Stein in der Kopfzeile
- `15-11-belege/1-6-uebersicht.jpg` – ganze Karte 30 × 40 (11,7 px je Feld), Stein gedrückt
- `15-11-belege/1-6-sprung-aus-uebersicht.jpg` – nach einem Tipp in die Kartenmitte: Stufe „Übersicht“ (15 Spalten), zentriert, nichts gewählt
- `15-11-belege/1-6-nach-gegnerphase.jpg` – Runde 2 nach der Gegnerphase mit „Gemeinsam“
- `15-11-belege/optionen-gegnerzuege.jpg` – Optionen mit „Gegnerzüge: Gemeinsam / Einzeln“

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created (2026-11-05).
- AC 1/2: Übersicht-Stein (`OverviewStone`, `BoardCamera.isWholeMap/zoomInAt`, Hook `onWholeMap`); Tipp in der Übersicht springt (`useBoardLifecycle`). Geprüft per Playwright bei 375 × 812 auf 1-6 (11,7 px je Feld, ganze Karte im freien Bereich; Tipp → Stufe 2, zentriert).
- AC 3/4: `render/board/march.ts` (`marchRun`, Test `tests/unit/march.test.ts`), `BoardView.playMarch`; Einstellung `enemyMarch` (Standard `together`), Optionen, DE/EN. Kern unverändert, Replays unberührt.
- AC 5/6: Bench `map`, `march`, `whole`, `castle()`; Test „large maps and the castle (story 15.11)“ nur mit `PERF_LARGE=1`; NFR1-Vorschlag in requirements.md, Architektur §2.2/§10, Decision-Log.
- AC 7: `readContentFiles` hält geparste YAML je Prozess (0,9 s → 0,02 s je weiterem Laden); Vitest `testTimeout` 20 s, weil ganze Schlachten auf den neuen 30 × 40-Karten (PR #104) unter Last 5 s überschreiten (CI-Lauf 42120776560: `lieutenants-review` R1). Keine Prüfung entfernt.
- Code-Review (`bmad-code-review`, vier Ebenen) 2026-11-06: behoben – Tipp in der Übersicht nur in der Spielerphase und auf Figuren weiter als Auswahl (`largeMap.ts`, Test), Start- und Zielfelder im Kamerablick, Läufer werden beim Ankommen abgehakt, `marchMin` in `render.yaml`, `zoomInAt` im Überspringen-Modus ohne Gleiten, unbekannter Einstellungswert fällt auf den Standard, Bench prüft Knoten und Figurenzahl, fehlende Messwerte als „–“, Cache-Stempel mit ctime. Bewusst offen: kein Test der Brett-Wiedergabe selbst (es gibt kein Babylon-Testgerüst; `marchRun` und die Schalter sind getestet), keine E2E-Prüfung des Übersicht-Steins, globales Vitest-Limit statt je Datei.
- AC 8: Gerät offen. Status `review`, weil das FPS-Ziel auf den 30 × 40-Entwürfen im Desktop-Ersatz nicht erreicht ist.

### File List

- `src/render/board/march.ts` (neu), `src/render/board/board.ts`, `boardCamera.ts`, `boardTypes.ts`
- `src/app/screens/Battle.tsx`, `BattleHud.tsx`, `Menus.tsx`, `battleCommands.ts`, `useBattleScreen.ts`, `useBoardLifecycle.ts`; `src/app/state/settings.ts`; `src/ui/hud.css`
- `src/content/node.ts`; `vite.config.ts`
- `content/core/locales/de.yaml`, `en.yaml`
- `tests/unit/march.test.ts` (neu), `tests/unit/settings.test.ts`; `tests/perf/bench.ts`, `perf.spec.ts`, `report-summary.ts`
- `concept/24-architecture/architecture.md`, `decision-log.md`; `concept/25-ux/DESIGN.md`, `EXPERIENCE.md`, `.decision-log.md`; `concept/26-epics/epics/requirements.md`
