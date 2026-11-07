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

### Nachtrag 2026-11-07: Gegnerphase ≤ 15 s (Zeitgrenze)

Anlass: Messung aus Story 15.10 – 1-8 mit „Gemeinsam“, Tempo 1× im Schnitt 9 s, längste Phasen 34–55 s.

**Ursache (gemessen):**
- **Schläge, nicht Wege:** Die längste 1-8-Phase (Normal, Runde 9) hat 16 Schläge in 7 Kämpfen und 22 Wege; die reinen Läufer laufen schon gemeinsam. Je Kampf kosten Kameraschwenk (220 ms), Pulsieren (450 ms), Weg, und je Schlag ≈ 0,93 s. Allein die Schläge brauchen ≈ 15 s.
- **KI-Rechenzeit ist es nicht:** `endPhase` 1-8 Ø 0,19 s / max 0,33 s (Node, Desktop), im Browser bei 4× Drosselung ≈ 0,9 s.
- **Leerlauf:** Die Kamera glitt auch zu Gegnern, die nur warten (220 ms je Gegner außerhalb der Sicht).
- **Nicht vom Tempo erfasst:** Jeder Geländewechsel baut das ganze 30 × 40-Gelände neu (1,3 s, bei 4× ≈ 3,4 s), und `setState` baute es am Ende der Phase noch einmal, weil sich nur die Restrunden eines Feuers geändert hatten. In 1-6 Runde 9 waren das 2,7 s bzw. bei 4× ≈ 6 s.
- **Bildrate:** Jeder Tween endet erst im ersten Frame nach seiner Zeit; bei niedriger FPS wird die Phase länger als geplant. Mit Software-Rendering (SwiftShader, 6–9 FPS) dauerte 1-8 trotz Zeitgrenze 25–28 s, mit GPU (34–60 FPS) passt der Plan auf ±1 s.

**Änderung (reine Darstellung, Kern, Balance, Karten, KI unverändert; Replays gleich):**
- `src/render/board/aiPacing.ts` (neu): eine Tabelle der Brett-Zeiten (`PLAY_MS`, vorher verstreute Zahlen in `board.ts`/`boardCamera.ts`) und der Plan einer Gegnerphase aus den Ereignissen (`planMs`), dieselbe Rechnung für Brett und Simulation (`tools/enemyPhase.ts`, ersetzt die Kopie `STRIKE_MS`).
- **Zeitgrenze** [ASSUMPTION, UX-Decision-Log 2026-11-07]: Mit „Gemeinsam“ vergleicht das Brett bei jedem Ereignis den Plan des Rests mit der Zeit, die von `render.yaml aiPace.phaseBudgetMs` (13 s) übrig ist, und spielt die ganze Phase so viel schneller (`speed`-Getter in `boardBase.ts`), höchstens `maxBoost` (4×). Schläge bleiben einzeln und in ihrer Reihenfolge, nichts wird übersprungen. „Einzeln“ bleibt unverändert (die längste 1-8-Phase dort 55–73 s), Tempo 2× und Überspringen wirken wie bisher.
- Kamera gleitet nicht mehr zu Gegnern, die nur warten (in beiden Modi, also auch bei „Einzeln“); aufeinanderfolgende Geländewechsel bauen einmal neu; `setState` baut nur neu, wenn sich am Gelände etwas Sichtbares ändert (Feld, Art, Rückfall; `timerLook`), nicht die Restrunden.
- Warten auf den Spieler (Stufenaufstieg, Dialog, Fluchtzeile) zählt nicht gegen die Zeitgrenze (`pausedFor`). Figuren animieren erst ab Tempo 1,6 schneller (vorher ab > 1), damit ein leichter Aufschlag ihre Bildrate nicht umschaltet; bei 2× unverändert.
- Werte in `render.yaml aiPace`: `phaseBannerMs` (700, vorher im Code von `battlePresentation.ts`), `phaseBudgetMs` 13000, `maxBoost` 4 und `play` (die festen Brett-Zeiten, vorher Zahlen in `board.ts`/`boardCamera.ts`). In `src/core` nur der Typ `RenderDef.aiPace` erweitert (`renderDefs.ts`), keine Regel.
- `pnpm sim --campaign`: „battle min“ und die Akt-Stunden rechnen jetzt mit „shown“ (nach Zeitgrenze) statt „march“, die Akt-Spielzeit fällt dadurch gegenüber Story 15.10 etwas.

**Messung, reproduzierbar:**
- Kampagne: `pnpm sim --campaign act1 --runs 12 --difficulty <stufe>` – Spalten „single / march / shown“ (Plan bei Tempo 1×: einzeln / gemeinsam ohne Zeitgrenze / wie gezeigt).
- Browser: `pnpm tsx tools/phase-state.ts m1_8` (und `m1_6`) speichert den Kampf vor der längsten Phase nach `.phase/`, `PERF_GPU=1 PERF_PHASE=.phase/m1_8.json,.phase/m1_6.json PERF_STAGES=2,4 PERF_RUNS=2 pnpm perf --project pixel6a --grep "saved battle"` spielt sie ohne (= vorher) und mit Zeitgrenze, Ergebnis in `test-results/perf/phase-pixel6a.md`, Zeit je Ereignistyp im Log.

Kampagne (12 Läufe, Plan „Gemeinsam“, Tempo 1×, inkl. Phasen-Pille und Kameraschwenks), Ø / längste Phase in s:

| Karte | Leicht vorher | Leicht nachher | Normal vorher | Normal nachher | Schwer vorher | Schwer nachher |
|---|---|---|---|---|---|---|
| 1-6 | 2,7 / 10,7 | 2,7 / 10,7 | 3,5 / 11,9 | 3,5 / 11,9 | 6,3 / 23,8 | 5,5 / 13,0 |
| 1-8 | 9,6 / 25,8 | 8,4 / 13,0 | 11,6 / 34,4 | 9,0 / 13,0 | 13,5 / 40,0 | 9,4 / 13,0 |
| übrige Akt-1-Karten, längste | 17,4 (1-5) | 13,0 | 25,6 (1-5) | 13,0 | 43,6 (1-5) | 13,0 |

Browser (Pixel-6a-Profil, GPU Intel UHD 630, „Gemeinsam“, Tempo 1×, längste Phase Normal Runde 9, Median aus 2 Läufen, nur Brett ohne Phasen-Pille). „Vorher“ wurde mit dem Brett-Verhalten von `main` gemessen (Kamera zu Wartenden zurückgedreht, Lauf vor den Gelände-Änderungen, `maxBoost` 1). Die Zeile „ohne (vorher)“ des Skripts setzt nur `maxBoost` 1 und enthält die übrigen Änderungen; ein echtes Vorher braucht einen Checkout von `main`. Gemessen wird je Mission die längste Phase; Durchschnitte kommen aus der Kampagnen-Simulation (Plan), nicht aus dem Browser:

| Phase | Drossel | vorher s | nachher s | Ø FPS nachher |
|---|---|---|---|---|
| 1-8 Runde 9 | 2× | 32,7 | 12,5 | 60 |
| 1-8 Runde 9 | 4× | 34,7 | 13,0 | 34 |
| 1-6 Runde 9 | 2× | 16,0 | 12,5 | 53 |
| 1-6 Runde 9 | 4× | 21,6 | 14,6–15,2 | 35–40 |

Review (`bmad-code-review`, vier Ebenen, 2026-11-07): behoben – Warten auf den Spieler zählt nicht gegen die Zeitgrenze, Bildrate der Figuren springt nicht bei leichtem Aufschlag, Option wird zu Beginn der Phase gelesen, unbekannte Figuren nach Endzustand zugeordnet, `phase-state.ts` nur aus gewonnenen ersten Versuchen (wie die Simulation), Brett-Zeiten in YAML, Kommentar zum Puffer, Perf-Prüfung mit `PERF_STRICT=1` (≤ 15 s), Tests für Phasenuhr und `timerLook`. Zurückgestellt: Brett gegen Plan im CI messen (braucht einen Browser-Lauf mit gespeichertem Stand); Gelände-Neubau nur der geänderten Felder.

Grenzen der Zusage: 15 s gelten für „Gemeinsam“ (Standard). „Einzeln“ bleibt beim gewählten Tempo. Der Aufschlag endet bei `maxBoost` (Phasen über ≈ 52 s Plan blieben darüber; in Akt 1 ist die längste 43,6 s). Rechenstopps (Gelände-Neubau, Endabgleich) und kritische Treffer verkürzt kein Tempo; dafür sind 2 s Puffer vorgesehen.

Offen: Bei 4× Drosselung bleibt in 1-6 ein Gelände-Neubau von ≈ 3,4 s am Ende der Phase, den kein Tempo verkürzt; mit Phasen-Pille liegt die Phase dort bei ≈ 15 s. Abhilfe wäre ein Neubau nur der geänderten Felder (Folgearbeit an `buildTerrain`). Das Gerät (Pixel 6a / iPhone 12) bleibt Release-Check (9.14).

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

- Nachtrag 2026-11-07 (Zeitgrenze der Gegnerphase): siehe Abschnitt oben; Status bleibt `review`.

### File List

- Nachtrag 2026-11-07: `src/render/board/aiPacing.ts` (neu), `board.ts`, `boardBase.ts`, `boardCamera.ts`, `boardUnits.ts`, `lieutenant.ts`; `src/app/screens/battlePresentation.ts`; `src/content/schemas.ts`, `src/core/renderDefs.ts`, `content/core/render.yaml`; `tools/enemyPhase.ts`, `tools/phase-state.ts` (neu), `tools/simCampaign.ts`, `tools/simulate.ts`; `tests/unit/enemy-phase.test.ts`, `sim-campaign.test.ts`; `tests/perf/bench.ts`, `perf.spec.ts`; `concept/25-ux/EXPERIENCE.md`, `.decision-log.md`; `.gitignore`

- `src/render/board/march.ts` (neu), `src/render/board/board.ts`, `boardCamera.ts`, `boardTypes.ts`
- `src/app/screens/Battle.tsx`, `BattleHud.tsx`, `Menus.tsx`, `battleCommands.ts`, `useBattleScreen.ts`, `useBoardLifecycle.ts`; `src/app/state/settings.ts`; `src/ui/hud.css`
- `src/content/node.ts`; `vite.config.ts`
- `content/core/locales/de.yaml`, `en.yaml`
- `tests/unit/march.test.ts` (neu), `tests/unit/settings.test.ts`; `tests/perf/bench.ts`, `perf.spec.ts`, `report-summary.ts`
- `concept/24-architecture/architecture.md`, `decision-log.md`; `concept/25-ux/DESIGN.md`, `EXPERIENCE.md`, `.decision-log.md`; `concept/26-epics/epics/requirements.md`
