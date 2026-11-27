# Story 16.20: Brett unter Drosselung flüssig halten

Status: review

## Story

Als Spieler auf einem schwächeren Handy
möchte ich, dass das Brett mit Kampfhaltung bei Auswahl und im Leerlauf flüssig bleibt,
damit die Neuerungen aus Epic 16 nicht ruckeln.

## Acceptance Criteria

1. **Messung:** `PERF_GPU=1 PERF_VIEWS=1 PERF_STAGES=1,2,4 PERF_RUNS=3 pnpm perf --project=pixel6a`, Zeilen „Brett, nichts gewählt“ und „Brett, Wahl wechselt (Kampfhaltung)“.
2. **Kosten gesenkt:** Die Kosten von Kampfhaltung (Clip-Wechsel, Leuchten) und Leerlauf-Bild sind gesenkt; Werte in `content/core/render.yaml`, keine Regeländerung.
3. **Ziel (NFR1):** Das Brett erreicht mit Kampfhaltung 60 FPS bei 2× und 30 FPS bei 4×, und kein Frame liegt über 100 ms.
4. **Keine Verschlechterung:** Die übrigen Perf-Zeilen (Gegnerphase, große Karten, Burg, 3D-Ansichten) werden nicht schlechter.
5. **Nachweis:** Vorher-Nachher-Tabelle in dieser Datei; die Messung auf dem Referenzgerät macht der Produktinhaber.

## Tasks / Subtasks

- [x] T1 Ursache per Profil eingrenzen: Clip-Wechsel, Leuchten, Shader-Kompilierung beim ersten Wechsel, Idle-Takt (AK 2)
- [x] T2 Kosten eines Brett-Bilds senken, Werte in `render.yaml` (AK 2, 3)
- [x] T3 Messcode: Brett-Zeilen einzeln messbar (`PERF_VIEWS_ONLY`), Kampfhaltung so gemessen, wie das Brett sie zeigt (AK 1, 3)
- [x] T4 Vorher-Nachher-Tabelle, übrige Perf-Zeilen gegengemessen (AK 4, 5)
- [x] T5 `pnpm check` grün

## Dev Notes

### Quellen

- Epic: `concept/26-epics/epics/epic-16.md`, Story 16.20 (angelegt aus der Messung von 16.19, Decision-Log `concept/26-epics/decision-log.md` 2026-11-27); NFR1 in `concept/26-epics/epics/requirements.md` (~Z. 108).
- Ausgangswerte: `16-19-handbuch-leistung-und-abnahme.md`, „Messung 2026-11-27“ und „Wiederholung 2026-11-27“ (Intel UHD 630, Kampfhaltung 55 FPS bei 2×, 24–32 FPS bei 4× mit Bildern bis 151 ms; Leerlauf bei 4× Bilder 130–137 ms; Brett 28–33 ms je Bild bei 4×).
- Messcode: `tests/perf/bench.ts` (`stance()`, `sampleFrames()`), `tests/perf/perf.spec.ts` (Opt-in `PERF_VIEWS`, Urteil `avgFps >= Ziel × 0,95` und Seitenbild ≤ 100 ms).
- Renderschleife: `src/render/host.ts` `frame` (Takt `board.fpsActive`/`fpsIdle`, `busy()`), `src/render/board/boardFrame.ts` (`frame`, `placeUnit`, `wake` 600 ms), `boardUnits.ts` `applyGlow`/`setOverlays`.
- Kampfhaltung: `src/render/shared/stance.ts`, `src/render/shared/figures.ts` (`ModelFigure.setStance`, `show`, `tick`), VAT-Ladeweg `src/render/shared/models.ts` (`loadContainer`, `vatEntry`, `loadVatUnit`, `sharedFigureMaterial`).
- Werte: `content/core/render.yaml` `board.*` (Schema `src/content/schemaRender.ts`, Typen `src/core/renderDefs.ts`).

### Leitplanken

- Keine Regeländerung, keine sichtbare Änderung am Bild; Replays bleiben gleich (Render liegt außerhalb von `src/core`).
- Stellschrauben in `render.yaml`, nie als Zahl im Code.
- Arbeitsrechner ist Desktop-Ersatz (NFR1), nicht das Referenzgerät; die Werte streuen von Lauf zu Lauf, daher je Zeile Median aus 3 Läufen.
- Stolperfalle aus dieser Story: `public/assets` wird von `pnpm art:build` erzeugt und kann in einem Worktree veraltet sein (hier vom 2026-11-13: 39 statt 78 Draw Calls auf dem Brett). Vor jeder Messung `pnpm art:build`.

## Dev Agent Record

### Agent Model Used

Opus 5.5 (Steuerung, Profil, Review), Sonnet 5.5 (Umsetzung)

### Completion Notes List

- Story-Kontext angelegt (gds-create-story).
- **Ursachen (CPU-Profil bei 4×, Chrome-Trace, Szenenzählung):**
  1. Der glTF-Lader startete beim Laden in den Modell-Cache die erste Animation jeder Datei; die Szene interpolierte diese 313 Knochen-Animationen jedes Bild auf Knoten, die nie gezeichnet werden (~7 % eines Bilds).
  2. Die geteilten Figuren- und Runenmaterialien waren nicht eingefroren: Babylon prüfte und band sie für jedes Mesh neu (Material-Bindung ~27 % eines Bilds).
  3. Das Brett setzte die Position jeder Figur jedes Bild neu; das markiert den ganzen Teilbaum als geändert (Matrizen neu berechnen).
  4. Die Ausreißer über 100 ms im Leerlauf sind große V8-Speicherbereinigungen (MajorGC „ReduceMemory“, ~89 ms bei 4×), die mangels Leerlaufzeit zwischen den Bildern mitten in einem Bild laufen; Live-Heap nach dem Laden 121 MB.
  5. „Wahl wechselt“ verfehlte 60 FPS auch bei 1× (2 ms je Bild): Die Messung wechselt die Wahl alle 0,7 s, das Brett zeichnet nach einer Wahl 0,6 s im aktiven Takt und dann im Ruhetakt; die Zeile mischte beide Takte (Takt, keine Last). Clip-Wechsel, Leuchten und Shader-Kompilierung beim ersten Wechsel zeigten im Profil keine eigenen Kosten.
- **Umsetzung:** `animationStartMode: 0` in `loadContainer` (models.ts); geteilte Figurenmaterialien und nicht pulsierende Runenmaterialien frieren mit den Requisiten ein (`freezeStatic`, aufgetaut über `thawStatic` bei Licht-, Wetter-, Qualitäts- und Kartenwechsel); ein `onBind`-Haken bindet die VAT-Zeile je Mesh; später entstandene Materialien frieren nach (`scene.materials.length`); Positionen nur bei Änderung (`placeUnit`). Kein neuer Spielwert, keine Regeländerung; `render.yaml` unverändert, weil keine der Ursachen eine Stellschraube war.
- **Messung:** neue Option `PERF_VIEWS_ONLY=doll,weapon,armory,board`; die Kampfhaltung wird über die Bilder im aktiven Takt beurteilt (`ViewSample.active`), die Mischzeile nur berichtet [ASSUMPTION, Decision-Log 2026-11-27].
- **Review (Opus):** keine Fehler. Hinweise: Die Zeile „aktiver Takt“ zeigt Render-ms und Seitenbild über alle Bilder; neue Materialien frieren erst bei der nächsten Änderung der Materialzahl ein (nur Leistung); Modelle starten jetzt in der Ruhepose (geprüft: nur Figurenmodelle haben Animationen, und die spielen eigene Gruppen).
- Subagenten: Umsetzung Sonnet, Review Opus.

### Vorher-Nachher 2026-11-27

Desktop-Ersatz (Intel UHD 630, ANGLE/D3D11, `PERF_GPU=1`, Profil pixel6a, Qualität mid), `PERF_GPU=1 PERF_VIEWS=1 PERF_STAGES=… PERF_RUNS=3 pnpm perf --project=pixel6a`, Median aus 3 Läufen, max über alle. „Vorher“ = Code von `main` (f4aae962), gleicher Rechner und gleiche Assets, unmittelbar nacheinander gemessen. Vor der Messung `pnpm art:build` (veraltete `public/assets` gaben 39 statt 78 Draw Calls).

| Szenario | Drossel | Ø FPS vorher → nachher | Ziel | max Seitenbild ms vorher → nachher | Render ms/Bild vorher → nachher | Urteil nachher |
|---|---|---|---|---|---|---|
| Brett, nichts gewählt | 2× | 29,9 → 30 | 30 | 50 → 33 | 9,5 → 6,3 | ok |
| Brett, Kampfhaltung (aktiver Takt) | 2× | 55,1¹ → 59,6 | 60 | 67 → 67 | 10,1 → 6,2 | ok |
| Brett, nichts gewählt | 4× | 26,4 → 29,4 | 30 | **233 → 133** | 27,5 → 18,5 | Ø ok, **ein Bild über 100 ms** (Speicherbereinigung) |
| Brett, Kampfhaltung (aktiver Takt) | 4× | 29,6¹ → 48,6 | 30 | 133 → 67 | 26,5 → 17,1 | ok |
| Brett, Wahl wechselt (alle Bilder, nur berichtet) | 2× / 4× | 55,1 / 29,6 → 55,4 / 45,2 | – | – | – | – |
| Figurenblatt | 2× / 4× | 30 / 30 → 30 / 29,9 | 30 | 17 / 33 → 17 / 17 | 0,8 / 3,2 → 1,4 / 3,3 | ok |
| Waffenansicht | 2× / 4× | 60 / 59,4 → 59,8 / 59,4 | 60 / 30 | 17 / 17 → 17 / 17 | 0,5 / 2,6 → 0,8 / 1,9 | ok |
| Waffenkammer | 2× / 4× | 59,6 / 42 → 59,4 / 54,5 | 60 / 30 | 17 / 50 → 17 / 34 | 6,1 / 21 → 6,7 / 15,1 | ok |

¹ vorher die Mischzeile beider Takte; eine Zeile für den aktiven Takt gab es nicht.

Weitere Läufe nachher am selben Tag: nur Brett-Zeilen (`PERF_VIEWS_ONLY=board`) 4× Leerlauf 29,2 FPS mit Seitenbild max 83 ms, Kampfhaltung 48,6 FPS mit max 100 ms. Ein Lauf bei belastetem Rechner war bei allen Ansichten etwa um die Hälfte langsamer, auch bei der Waffenkammer, die die Änderung kaum berührt; er ist verworfen.

Gegnerphase und große Karten (`PERF_GPU=1 PERF_LARGE=1 PERF_LARGE_MAPS=reference,s1_1_6_paktwacht,s1_1_8_heimat,castle PERF_RUNS=1`, je Seite ein Lauf; Ø FPS, in Klammern max ms):

| Szenario | 2× vorher → nachher | 4× vorher → nachher |
|---|---|---|
| Referenz 24×32, einzeln | 59,1 (67) → 59,9 (50) | 39,5 (117) → 45,0 (83) |
| Referenz 24×32, gemeinsam | 56,3 (33) → 57,1 (33) | 24,5 (67) → 26,4 (117) |
| 1-6 Paktwacht 30×40, einzeln | 49,6 (83) → 56,3 (50) | 23,7 (133) → 29,1 (167) |
| 1-6 Paktwacht 30×40, gemeinsam | 31,3 (83) → 47,3 (67) | 20,9 (67) → 21,8 (100) |
| 1-8 Heimat 30×40, einzeln | 52,4 (50) → 59,7 (83) | 20,9 (133) → 30,4 (167) |
| 1-8 Heimat 30×40, gemeinsam | 51,3 (67) → 49,7 (50) | 20,1 (100) → 24,0 (83) |
| Burg, alle Räume Stufe 3 | 60 (17) → 60 (17) | 60 (17) → 59,5 (33) |

Standard-Gegnerphase (`PERF_GPU=1 PERF_RUNS=3`, Referenzschlacht mit 40 Figuren): 2× 59,9 FPS (max 66,7 ms), 4× 50,9 statt 29,1 FPS (p95 33,4 statt 50 ms, max 83,3 statt 216,6 ms).

Deutung: Die Bildzeit des Bretts sinkt bei 4× um rund ein Drittel (17–18,5 statt 26–28 ms). Die Kampfhaltung erreicht ihr Ziel bei 2× und 4×, Gegnerphase und große Karten werden im Mittel durchweg schneller. Die Einzelwerte „max“ der großen Karten stammen aus je einem Lauf und streuen mit den Speicherbereinigungen in beide Richtungen. **Rest:** Im Leerlauf bei 4× liegt in einem von drei Läufen ein Bild über 100 ms (133 statt 233 ms): eine große V8-Speicherbereinigung kurz nach dem Laden bei 121 MB Live-Heap. Sie lässt sich nur über einen kleineren Heap verkürzen, das gehört nicht in diese Story (Frage 2 unten).

### Fragen an den Produktinhaber

1. Kampfhaltung: Reicht es, dass der Wechsel in die Haltung mit 60 FPS läuft und die Figur danach in der Haltung im Ruhetakt (30) atmet wie alle ruhenden Figuren? Alternative: Das Brett bleibt im aktiven Takt, solange eine Figur gewählt ist (flüssiger, etwa doppelte Last während des Spielerzugs).
2. Das eine Bild über 100 ms im Leerlauf bei 4× (große Speicherbereinigung nach dem Laden): eigene Story „Heap des Kampfs verkleinern“ anlegen oder erst die Messung auf dem Referenzgerät abwarten?

### File List

- `src/render/shared/models.ts` (glTF-Animationen nicht automatisch starten)
- `src/render/board/boardFrame.ts` (Position nur bei Änderung, neue Materialien nachfrieren)
- `src/render/board/boardProps.ts` (`freezeStatic` friert Figuren- und Runenmaterialien ein, VAT-Bindung je Mesh)
- `src/render/board/boardBase.ts` (`frozenCount`, `vatBound`)
- `src/render/board/staticMaterial.ts` (`isFigureMaterial`)
- `src/render/shared/runeGlow.ts` (`staticRuneMaterials`)
- `tests/perf/bench.ts` (`ViewSample.active`)
- `tests/perf/perf.spec.ts` (`PERF_VIEWS_ONLY`, Zeile „Kampfhaltung (aktiver Takt)“)
- `concept/26-epics/decision-log.md` (Messung der Kampfhaltung)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
