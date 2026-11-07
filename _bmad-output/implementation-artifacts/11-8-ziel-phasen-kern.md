---
baseline_commit: 295535b
---
# Story 11.8: Ziel-Phasen (Kern)

Status: review

## Story

Als Spieler
möchte ich, dass ein Missionsziel mitten im Kampf wechseln kann,
damit eine große Schlacht wie Kronfeld erst Halten und dann Flucht verlangt.

## Acceptance Criteria

1. **Schema:** `victory: { type: survive, turns: n, then: { type: escape, area, min?, must? } }` ist gültig (`then` nur an `survive`, nur `escape`); `escape` kennt das optionale Feld `must: [Einheiten-Ids]`. Ohne `then`/`must` bleibt jedes Ziel wie bisher.
2. **Wechsel:** Endet Runde n (Prüfung zu Beginn von Runde n + 1 wie bei `survive`) oder schließt `survive` vorzeitig (kein Gegner mehr, keiner kommt nach), gilt danach `escape` statt Sieg; ebenso, wenn ein Trigger die Aktion `{ action: advance_objective }` ausführt. Der Wechsel schreibt `BattleState.objectivePhase = 1` und das Event `{ t: 'objectiveChanged', phase: 1 }`; danach laufen die Trigger mit `when: { type: objective_changed }` (z. B. `dialogue`).
3. **Sieg:** In der Phase `escape` siegt die Truppe wie bisher, sobald keine handlungsfähige eigene Figur mehr auf dem Brett steht und mindestens `min` geflohen sind; zusätzlich muss jede Figur aus `must` die Karte verlassen haben. Lucan (Flag `lord`) flieht als Letzter wie bisher und außerdem erst, wenn keine andere `must`-Figur mehr auf dem Brett liegt (auch niedergestreckt).
4. **Niederlage:** Die Niederlagen der Karte (`unit_dies avatar|lucan`, Rundenlimit) gelten in beiden Phasen.
5. **Ein Zugang:** `activeVictory(map, s)` in `src/core/battle/objectives.ts` liefert das aktive Ziel; Kern (`checkObjectives`, `availableActions`, `cast.ts`), KI (`goalTiles`), Autoplay und UI (Rundenpille, Zielblatt, Fluchtzone im Brett-Overlay) lesen nur darüber. Ein schlafender Gegner wacht weiter nach den Runden des `survive`-Ziels.
6. **UI:** Rundenpille und Zieltext wechseln nach dem Wechsel auf die Flucht (Zieltext `ui.world.goal.escape`, Fortschritt „2/6 entkommen“), die Fluchtzone erscheint; Vorschau, Weltkarte und Zielblatt der ersten Phase zeigen „Überlebe n Runden, dann flieht.“ (Schlüssel in `de.yaml`/`en.yaml`).
7. **content:check:** prüft `then.area` (vom Aufstellungsbereich zu Fuß erreichbar wie jedes `escape`), `must` (Ids von Kartenfiguren oder Pflichtaufstellung), `min` ≥ 1, `advance_objective` und `objective_changed` nur auf Karten mit `then`.
8. **Zustand:** `objectivePhase` ist optional (fehlt = 0) und wird nur beim Wechsel gesetzt; Spielstände bleiben Format 2 (Default über `?? 0`, nichts gesperrt).
9. **Tests und Fixture:** `tests/fixtures/maps/dev_phases.yaml`, `tests/unit/objective-phases.test.ts` decken Schema, Prüfung, Wechsel nach Runden und per Trigger, Szene, Sieg, `must`, Niederlage, Autoplay und Replay ab.
10. **Akt 1 unverändert:** `pnpm sim --campaign act1 --runs 50 --seed 1` identisch zur Baseline; `pnpm check` grün; Coverage `src/core` sinkt nicht; Architektur §5.7 „Stand (Story 11.8)“; Bild 375 × 812.

## Tasks / Subtasks

- [x] Schema und Typen (AC 1): `must` an `escape`, `then` an `survive` in `schemas.ts`; `ObjectiveDef` in `mapDefs.ts`; Trigger `objective_changed`, Aktion `advance_objective`; `BattleState.objectivePhase?`; Event `objectiveChanged`.
- [x] Kern (AC 2–5): `activeVictory`, `advanceObjective` in `objectives.ts`; `checkObjectives` wechselt statt zu siegen; `must` in der Fluchtprüfung; `mustStayForRest` kennt `must`; `availableActions`, `cast.ts` lesen `activeVictory`.
- [x] KI/Autoplay (AC 5): `goalTiles` in `ai.ts`, `autoCommand` in `autoplay.ts` über `activeVictory`.
- [x] UI (AC 6): `Battle.tsx`, `BattlePanels.tsx`, `useBoardOverlays.ts`, `goalText.ts`, Locales.
- [x] content:check (AC 7) in einer eigenen Datei `src/content/validatePhases.ts`, ein Aufruf in `validate.ts`.
- [x] Fixture, Tests, Coverage, Sim-Diff, Bild (AC 9, 10).
- [x] Architektur §5.7, Decision-Log `concept/21-gdd/decision-log.md`.

### Review Follow-ups (AI)

- [x] [AI-Review][High] Sackgasse der Flucht: Eine `must`-Figur, die nicht mehr hinauskommt (`dead`/`retreated`/`fled`, oder niedergestreckt auf dem Brett ohne handlungsfähige eigene Figur), verliert die Mission (Grund = Figur); `validatePhases` verlangt Team `player`, kein `requires`/`difficulty`.
- [x] [AI-Review][Med] Eine Auflösung der `must`-IDs: `mustIds`/`mustUnits` (über `findUnit`) in `activeVictory.ts` für `checkObjectives`, `mustStayForRest`, Zieltexte; `validatePhases` löst wie `findUnit` (id, dann char) auf.
- [x] [AI-Review][Med] `min` zählt Gerettete wie `must` (`escapeProgress` für Sieg und Stand); `must` ohne `min` heißt `min = max(1, must)`; doppelte `must`-Einträge sind ein Fehler.
- [x] [AI-Review][Med] Felswall (`cast.ts`) nie auf der Fluchtzone der späteren Phase, auch während `survive` (`escapeOf`); die KI-Wandplanung hat in der `survive`-Phase keine Zielfelder und baut dort keine.
- [x] [AI-Review][Med] Früher Wechsel: Spawn-Trigger mit `when: objective_changed` halten `noFoesToCome` nicht auf.
- [x] [AI-Review][Low] Übrige Leser von `objectives.victory`: `scoreContext` und `sideObjectiveSpots` über `activeVictory`; `wakesByTime`, `exitTiles`, `campaign.ts`, `Prep.tsx`, Heimsuchungs-Karte mit Kommentar, warum das Kartenziel gilt.
- [x] [AI-Review][Med] Weltkarte: eigener Tag `ui.map.tag.survive_escape` (`goalKey`).
- [x] [AI-Review][Low] Texte: DE `ui.world.goal.survive_escape` in ihr-Form; Zielblatt nennt fehlende `must`-Figuren (`ui.obj.mustLeft`); die Pille zeigt bei zählender Flucht nur den Stand („0/3 entkommen“), in der `survive`-Phase nur „Überlebe 3 Runden“; Level-Blatt nennt `must`.
- [x] [AI-Review][Med] Rückmeldung beim Wechsel: Toast `ui.toast.objectiveChanged` („Neues Ziel: …“).
- [x] [AI-Review][Low] Kein Re-Export von `activeVictory` aus `objectives.ts`; alle importieren aus `./activeVictory` (Index exportiert das Modul).
- [x] [AI-Review][Med] Tests: niedergestreckte `must`-Figur allein ⇒ Niederlage, gerettet und Retter flieht ⇒ Sieg; zweiter Wechsel (direkt, Trigger ohne `once`) wirkungslos; `turn_limit` in beiden Phasen; `goalLine`/`goalStand`/`mustLine`; Felswall auf späterer Fluchtzone; früher Wechsel trotz `objective_changed`-Spawn; Prüfungen `must` doppelt/Team/`difficulty`.

## Dev Notes

- **Quellen:** Epic 11 Story 11.8 und Einleitung; GDD „Missionsziele“ (Z. 232: „Ein Ziel kann in eine zweite Phase wechseln“) und „Mission gewonnen/verloren“ (Z. 85 f.); Architektur §5.7 „Ziel-Phasen (Epic 11)“, §8.7 (neue Felder mit Default, Plain-JSON); Entwurf `concept/27-ueberarbeitung/levels/s2_2_8_kronfeld.yaml` (Ziel `escape` Nordufer `rect [0,0,29,1]`, `min: 6`, Tor per `set_terrain` in Runde 6).
- **Architektur-Abschnitt:** Die Story nennt §5.7; dort steht der Punkt „Ziel-Phasen (Epic 11)“ (obwohl §5.7 „Rollenklassen“ heißt), der Absatz „Stand (Story 11.8)“ kommt an diesen Punkt.
- **Vorhanden:** `escape` in `checkObjectives` (alle handlungsfähigen weg, `escaped ≥ min`), Aktion `escape` in `availableActions` (nur im Zielgebiet, Lord als Letzter über `mustStayForRest`), Autoplay geht mit dem Lord zuletzt ins Ziel. `survive` siegt bei `phaseStart && turn > turns` oder `noFoesToCome`. Alle diese Stellen lesen heute `map.objectives.victory` direkt.
- **Zu bewahren:** Karten ohne `then` verhalten sich bitgleich: `activeVictory` gibt dann `map.objectives.victory` zurück, `objectivePhase` wird nie geschrieben, kein neuer RNG-Zug, keine neue Event-Art. `wakesByTime` bleibt am Grundziel (`survive.turns`).
- **Parallel PR 142 (11.6):** ändert `objectives.ts`, `ai.ts`, `autoplay.ts`, `apply.ts`, `validate.ts`, `sprint-status.yaml`, `packs.yaml`. Dort nur Ein-Zeilen-Änderungen (Lesezugriff über `activeVictory`), Prüfungen in eigener Datei, kein Paket `act2`, `apply.ts` unberührt.
- **[ASSUMPTION] `then` nur an `survive` und nur `escape`:** Mehr verlangt das Epic nicht; eine allgemeine Phasenliste wäre Vorgriff.
- **[ASSUMPTION] Vorzeitiges Ende:** Schließt `survive` vorzeitig (kein Gegner mehr, keiner kommt), wechselt das Ziel ebenfalls auf `escape` statt zu siegen.
- **[ASSUMPTION] Wechsel per Trigger:** neue Aktion `advance_objective` (ohne Felder); ein zweiter Aufruf in Phase `escape` tut nichts. Kronfeld kann sie an `t_hesitate` (Runde 6) hängen.
- **[ASSUMPTION] Trigger `objective_changed`:** ohne Felder; feuert direkt nach dem Wechsel, z. B. mit `dialogue`.
- **[ASSUMPTION] `must`:** zählt als hinaus, wer `gone: escaped` oder `rescued` (vom Feld getragen) ist; seit dem Review zählt auch `min` beide (für jede Flucht, auch den Prolog; Akt-1-Simulation unverändert). Der Lord wartet, solange eine andere `must`-Figur auf dem Brett liegt, damit ein niedergestreckter Avatar nicht zurückbleibt. Eine `must`-Id ohne Figur im Kampf (Gefährte daheim) verlangt nichts.
- **[ASSUMPTION] Sackgasse (Review):** Kann eine `must`-Figur nicht mehr hinaus (tot, zurückgezogen, geflohen, oder niedergestreckt ohne handlungsfähige eigene Figur auf dem Brett), ist die Mission verloren; Grund ist die Id der Figur. Eine Flucht ohne `must` bleibt wie bisher.
- **[ASSUMPTION] `min` ohne Angabe (Review):** eine je `must`-Figur, mindestens 1.
- **[ASSUMPTION] Texte:** Zieltext der Flucht-Phase ist das vorhandene `ui.world.goal.escape`; neu sind der Stand `ui.obj.escapedOf`, `ui.obj.mustLeft`, der Satz der ersten Phase `ui.world.goal.survive_escape` (ihr-Form), der Weltkarten-Tag `ui.map.tag.survive_escape` und der Toast `ui.toast.objectiveChanged`. Die Pille zeigt bei zählender Flucht nur den Stand, weil der Satz bei 375 px abgeschnitten würde.
- **[ASSUMPTION] Speicherformat:** `objectivePhase` optional, Default `?? 0` beim Lesen; Format 2 bleibt, weil vor 9.14 nichts gesperrt ist und alte Kämpfe kein Phasenziel haben (AGENTS.md „Akt-Release“ 3 greift nicht).

### Project Structure Notes

- Neu: `src/content/validatePhases.ts`, `tests/unit/objective-phases.test.ts`, `tests/fixtures/maps/dev_phases.yaml`.
- Geändert: `src/core/{mapDefs.ts,state.ts,events.ts}`, `src/core/battle/{objectives.ts,actions.ts}`, `src/core/rules/cast.ts`, `src/core/ai/{ai.ts,autoplay.ts}`, `src/content/{schemas.ts,validate.ts}`, `src/app/screens/{Battle.tsx,BattlePanels.tsx,useBoardOverlays.ts}`, `src/ui/goalText.ts`, `content/core/locales/{de,en}.yaml`, `tests/fixtures/devObjectiveMaps.ts`.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Code englisch, Konzept deutsch.
- `src/core` ohne DOM/Babylon/`Math.random`/`Date.now`; Zufall nur aus `s.rng`; State Plain-JSON.
- Fertig erst mit `pnpm check`; Coverage `src/core` nicht senken; Akt-1-Simulation identisch.

### References

- [Source: concept/26-epics/epics/epic-11.md#Story 11.8: Ziel-Phasen (Kern)]
- [Source: concept/21-gdd/gdd.md#Missionsziele]
- [Source: concept/24-architecture/architecture.md#5.7 Rollenklassen (AR8)]
- [Source: concept/27-ueberarbeitung/levels/s2_2_8_kronfeld.yaml]
- [Source: src/core/battle/objectives.ts checkObjectives]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

- Sim Akt 1 (`pnpm sim --campaign act1 --runs 50 --seed 1`) zeilengleich zur Baseline (ohne Kopfzeile und Laufzeit).
- Coverage `src/core`: vorher 95,67 % Anweisungen / 90,41 % Zweige, nachher 95,68 % / 90,45 %.
- Bild: Probekarte `__hc.devMap('dev_phases')` bei 375 × 812, Rhen und Lucan vor das Tor gezogen (Trigger `t_gate` → `advance_objective` → Szene über `objective_changed`), danach Rundenpille „Entkommt über die Ausgänge · 0/3 entkommen“ und Fluchtzone am Nordrand. Brett ohne gebaute Assets im Worktree (Figuren als Platzhalter). Die Vorschau startete zuerst den Dev-Server des falschen Worktrees (Ordner der Sitzung); der Server lief deshalb von Hand aus diesem Worktree.

- Nach dem Review (Rebase auf main mit 11.6): Sim Akt 1 weiter zeilengleich; Coverage `src/core` 95,86 % / 90,81 %; `pnpm check` grün (1591 Tests). Bild neu: Pille „0/3 entkommen“ nach dem Wechsel, in der `survive`-Phase „Überlebe 3 Runden · Runde 1 von 3“. Der Toast beim Wechsel liegt unter der Szene von `objective_changed` und ist im Bild nicht zu sehen.
- Gefunden beim Bild: Ein mitten im Kampf gespeicherter Spielstand auf einer Probekarte lässt sich nach Neuladen nicht fortsetzen (Karte nur zur Laufzeit registriert); unverändert seit vor 11.8, nur Dev.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Kern: `core/battle/activeVictory.ts` (Blattmodul, aus `objectives.ts` re-exportiert), `advanceObjective` in `objectives.ts`; `checkObjectives` wechselt bei erfülltem `survive` mit `then` statt zu siegen; Fluchtsieg verlangt zusätzlich `must` (`escaped`/`rescued`); Trigger `objective_changed`, Aktion `advance_objective`; `mustStayForRest(s, u, v?)` hält den Lord, solange eine andere `must`-Figur auf dem Brett liegt. `availableActions`, `cast.ts`, `goalTiles` (KI) und Autoplay lesen `activeVictory`. `apply.ts` unverändert.
- Zustand: `BattleState.objectivePhase?` (nur beim Wechsel gesetzt), Event `objectiveChanged`; Format 2 bleibt.
- Inhalt: Schema `escapeObjective` mit `must`, `then` an `survive`; `validatePhases.ts` plus Erreichbarkeit der zweiten Fluchtzone in `validate.ts`; Level-Blatt (`tools/levels/sheet.ts`) kennt Phase, Trigger und Aktion.
- UI: Rundenpille, Zielblatt und Brett-Overlay über `activeVictory`; Fortschritt `ui.obj.escapedOf`, Satz der ersten Phase `ui.world.goal.survive_escape` (Vorschau, Weltkarte, Pille).
- Tests: `tests/unit/objective-phases.test.ts` (16 Fälle: Schema, Prüfung, Wechsel nach Runden, vorzeitig, per Trigger, Szene, Fluchtaktion, Karte ohne `then`, Lord zuletzt mit `must`, Sieg, kein Sieg unter `min`, Niederlage in beiden Phasen, Autoplay-Sieg und Replay mit drei Seeds). `pnpm check` grün (1547 Tests).

### File List

- _bmad-output/implementation-artifacts/11-8-ziel-phasen-kern.md (neu)
- _bmad-output/implementation-artifacts/sprint-status.yaml
- concept/21-gdd/decision-log.md
- concept/24-architecture/architecture.md
- content/core/locales/de.yaml, en.yaml
- src/content/schemas.ts, src/content/validate.ts, src/content/validatePhases.ts (neu)
- src/core/mapDefs.ts, state.ts, events.ts
- src/core/battle/activeVictory.ts (neu), objectives.ts, actions.ts
- src/core/rules/cast.ts
- src/core/ai/ai.ts, autoplay.ts
- src/app/screens/Battle.tsx, BattlePanels.tsx, useBoardOverlays.ts
- src/ui/goalText.ts
- tools/levels/sheet.ts
- tests/unit/objective-phases.test.ts (neu)
- tests/fixtures/maps/dev_phases.yaml (neu), tests/fixtures/devObjectiveMaps.ts

### Senior Developer Review (AI)

- **Datum:** 2026-11-07, Koordinator. **Ergebnis:** Changes Requested → alle 11 PATCH-Punkte erledigt (siehe „Review Follow-ups (AI)“), Tests ergänzt (23 Fälle in `objective-phases.test.ts`, einer in `cast.test.ts`).

### Change Log

- 2026-11-07: Review-Befunde behoben (11 Punkte) nach Rebase auf main mit 11.6; Status bleibt review.

- 2026-11-07: Story 11.8 umgesetzt (Schema, Kern, KI, Autoplay, UI, content:check, Tests, Probekarte, Architektur, Decision-Log); Status review.
