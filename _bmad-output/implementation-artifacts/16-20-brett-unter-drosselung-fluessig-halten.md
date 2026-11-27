# Story 16.20: Brett unter Drosselung flüssig halten

Status: ready-for-dev

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

- [ ] T1 Ursache per Profil eingrenzen: Clip-Wechsel, Leuchten, Shader-Kompilierung beim ersten Wechsel, Idle-Takt (AK 2)
- [ ] T2 Kosten eines Brett-Bilds senken, Werte in `render.yaml` (AK 2, 3)
- [ ] T3 Messcode: Brett-Zeilen einzeln messbar (`PERF_VIEWS_ONLY`), Kampfhaltung so gemessen, wie das Brett sie zeigt (AK 1, 3)
- [ ] T4 Vorher-Nachher-Tabelle, übrige Perf-Zeilen gegengemessen (AK 4, 5)
- [ ] T5 `pnpm check` grün

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

- Story-Kontext angelegt (gds-create-story); Ursachenanalyse und Umsetzung folgen.

### File List
