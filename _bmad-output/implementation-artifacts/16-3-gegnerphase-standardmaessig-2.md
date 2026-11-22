# Story 16.3: Gegnerphase standardmäßig 2×

Status: done

## Story

Als Spieler
möchte ich, dass die Gegnerphase von selbst schnell läuft,
damit ich weniger warte.

## Acceptance Criteria

1. Neue Einstellungen (erster Start) haben `enemySpeed: 2`.
2. Gespeicherte Einstellungen werden genau einmal auf 2× gesetzt: eine Einstellungs-Migration mit Marke (`enemyPaceRev` von 2 auf 3). Wer danach 1× (oder Überspringen) wählt, behält es nach dem Neuladen.
3. „Gegnerzüge: Gemeinsam“ (`enemyMarch: 'together'`) bleibt Standard; die Zeitgrenze bleibt 13 s (`content/core/render.yaml aiPace.phaseBudgetMs: 13000`, unverändert).
4. Ein Test belegt: alter Speicherstand (Marke < 3, beliebiges `enemySpeed`) → 2×; Speicherstand mit Marke 3 und `enemySpeed: 1` → bleibt 1× (Simulation von „nach der Umstellung 1× gewählt, neu geladen“, also `updateSettings`-Ergebnis serialisiert und erneut über `mergeSettings` gelesen).
5. Regeln und Replays unverändert: nichts in `src/core`, `content/` oder der KI ändert sich; `enemySpeed` wirkt nur auf die Wiedergabe (`board.speed`/`board.skip` in `src/app/screens/battleCommands.ts`).

## Tasks / Subtasks

- [x] `src/app/state/settings.ts` (AC 1, 2)
  - [x] `defaultSettings`: `enemySpeed: 2`
  - [x] `ENEMY_PACE_REV = 3`
  - [x] Kommentar an `enemyPaceRev` aktualisieren: Rev 2 setzte auf 1× zurück (2026-10-28), Rev 3 hebt einmal auf 2× (GDD-Log 2026-11-21, Story 16.3); danach bleibt die Wahl des Spielers
- [x] `tests/unit/settings.test.ts` (AC 2, 4)
  - [x] Bestehender Test „resets the enemy pace …“ anpassen: `{ enemySpeed: 1 }` ohne Marke und `{ enemySpeed: 1, enemyPaceRev: 2 }` → 2
  - [x] Neuer Test: `{ enemySpeed: 1, enemyPaceRev: 3 }` → 1; ebenso 3 (Überspringen) bleibt 3; Rundlauf über `JSON.stringify` der gemergten Einstellungen mit `enemySpeed: 1`
  - [x] Default-Test: `def.enemySpeed === 2`, `def.enemyMarch === 'together'`
  - [x] Fixtures mit `enemyPaceRev: 2` in den übrigen Tests auf `3` (oder `ENEMY_PACE_REV` nicht exportieren, Zahlen genügen), damit sie nichts Falsches nahelegen
- [x] Prüfen, dass kein anderer Test 1× als Default annimmt (`grep -rn enemySpeed tests src`)
- [x] `pnpm check` grün

## Dev Notes

### Aktueller Stand (gelesen)

- `src/app/state/settings.ts`: `Settings.enemySpeed: 1 | 2 | 3` (3 = Überspringen), Default 1. `mergeSettings(def, stored)` setzt `enemySpeed` auf den Default und `enemyPaceRev` auf `ENEMY_PACE_REV`, wenn `stored.enemyPaceRev ?? 0 < ENEMY_PACE_REV`. Das ist schon die benötigte Marken-Mechanik; nur Default und Revision ändern sich. `updateSettings` speichert das ganze Objekt inkl. Marke in `localStorage` (`hc.settings`), damit bleibt eine spätere Wahl erhalten.
- Verbraucher: `battleCommands.ts:46` (`board.speed`, `board.skip`), `Battle.tsx:324` (SpeedControl in der Gegnerphase), `Menus.tsx:148` (Optionen-Segment `ui.opt.enemySpeed`). Keine Änderung nötig, keine neuen Texte.
- Zeitgrenze: `content/core/render.yaml` `aiPace.phaseBudgetMs: 13000`, genutzt in `src/render/board/aiPacing.ts` `phaseBoost`. Nicht anfassen.
- Konzept bereits nachgezogen: GDD §Kampf (Zeile ~308), `concept/21-gdd/decision-log.md` 2026-11-21, `concept/25-ux/EXPERIENCE.md` (Optionen, Kampf-Zustände) nennen 2× als Standard. Kein Konzept-Edit nötig.

### Guardrails

- Settings-Defaults leben in `settings.ts` (App-Zustand, kein Spielwert); kein YAML nötig.
- Nichts in `src/core` ändern; Replays hängen nicht an `enemySpeed`.
- Keine neuen sichtbaren Texte; keine Emojis.
- Code, Kommentare, Bezeichner auf Englisch.

### Tests

Vitest, `tests/unit/settings.test.ts` (reine Funktion `mergeSettings`, kein DOM nötig).

### References

- `concept/26-epics/epics/epic-16.md` Story 16.3
- `concept/21-gdd/decision-log.md` Eintrag 2026-11-21 „Gegnerphase standardmäßig 2×“

## Dev Agent Record

### Agent Model Used

claude-sonnet-5-5

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Default `enemySpeed` 2, `ENEMY_PACE_REV` 3; settings tests extended (7 pass); lint clean (only pre-existing warnings). No other test/src assumed default 1.

### File List

- `src/app/state/settings.ts`
- `tests/unit/settings.test.ts`

### Review und Abnahme

- `pnpm check` grün (198 Testdateien, 2586 Tests, Content OK, Build im Budget).
- Code-Review (gds-code-review, Sonnet): keine Befunde.
- Dev-Build 375 × 812: alter Speicherstand `enemySpeed: 1, enemyPaceRev: 2` zeigt in den Optionen 2×; danach 1× gewählt, neu geladen, bleibt 1×.
