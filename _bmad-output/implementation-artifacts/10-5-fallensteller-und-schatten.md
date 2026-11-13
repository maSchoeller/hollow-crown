<!-- Erstellt nach der Vorlage von 10-1 (gds-create-story) am 2026-11-13 -->

# Story 10.5: Fallensteller und Schatten

Status: review

## Story

Als Spieler
möchte ich mit Späher-Profis Fallen legen oder für Gegner unsichtbar bleiben,
damit Späher im späten Spiel eine eigene Taktik haben.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-10.md`, Story 10.5 (vollständige Fassung dort). Kurz:

1. `shadow` und `trapper` sind `playable: true` mit `proSkills` `pro_shadow` (`hidden: true`) bzw. `pro_traps` (`grantAction: trap`), behalten Kletterer, Öffnen/Stehlen und +2 Sicht der Rolle; Steckbriefe `class_shadow`/`class_trapper`; `balance.classActions.trap` und `balance.shadow.revealDistance`.
2. Falle legen auf ein freies (keine Einheit, kein Objekt, keine Falle), zu Fuß begehbares Nachbarfeld: `BattleState.traps` (Default leer), Aktion verbraucht, Event `trapSet`; die dritte Klassen-Falle ersetzt die älteste (`trapRemoved`); Fallen bleiben bis Missionsende.
3. Ein Gegner, der eine Falle betritt: Bewegung endet dort, 8 Schaden ohne Zufall, Verlangsamt, Falle weg, Event `trapTriggered`; die KI entscheidet vom Fallenfeld aus neu (angreifen oder warten); eigene und verbündete Einheiten laufen darüber.
4. Zurücknehmen einer eigenen Falle daneben (`trapRemoved`), Aktion verbraucht.
5. Schatten: für die KI unsichtbar auf Nebelkarten, ohne Nebel solange kein Gegner näher als 3 Felder steht; nach eigenem Angriff sichtbar bis Ende der nächsten Gegnerphase (`revealedUntil`), Konter enthüllen nicht; kein Ziel, keine Gefahr; KI-Weg über sein Feld endet auf dem letzten freien Feld davor.
6. Die KI liest nur über `enemyView(data, s, enemyUid)` (`src/core/ai/`); Worker = synchron, Replay, „Runde neu“ und `pnpm sim` identisch.
7. Spielerseite: Fallen-Markierung auf Feldhöhe (`render.yaml`), Zahl „1/2“ am Aktions-Stein, Fallen-Modus mit Bereichskacheln, Zeichen „verborgen“ an der Lebensleiste, Gefahrenzone mit `enemyView`, Auslöse-Effekt ≤ 600 ms; Klang später (Audio).
8. Autoplay: Fallensteller ohne lohnenden Angriff legt eine Falle aufs freie Nachbarfeld mit kleinstem Abstand zum nächsten Gegner (Gleichstand kleinste Feld-Id); `pnpm sim` zählt ausgelöste Fallen; Tests `tests/unit/traps-shadow.test.ts`; Architektur §5.7 „Stand“.

## Tasks / Subtasks

- [x] Schema und Typen: `classActions.trap`, `shadow` (`schemaBalance.ts`, `balanceDefs.ts`), Skill-Wirkungen `hidden`, `grantAction` (`schemaUnits.ts`, `defs.ts`, `skillTotals`), `TrapState`, `BattleState.traps`, `BattleUnit.revealedUntil`, Events (AC 1, 2, 5)
- [x] Inhalt: `skills.yaml`, `classes.yaml`, `balance.yaml`, `render.yaml`, Handbuch mit Werten, Locales DE/EN (AC 1, 7)
- [x] Kern: `rules/traps.ts`, `rules/stealth.ts`, `ai/enemyView.ts`; Aktionen `trap`/`disarm` (`actions.ts`, `apply.ts`, `act.ts`), Auslösen in `doMove`, Enthüllen bei `attack`/`aim`/Ballisten (AC 2–6)
- [x] KI: `aiAct` entscheidet auf `enemyView`, handelt auf dem echten State (`enemyGo`, `strikeFromHere`), Flucht/Folgen/Wolfslauf über denselben Weg; Gefahrenzone und Autoplay-Gefahrenkarte je Gegner über `enemyView` (AC 3, 5, 6, 7)
- [x] UI: Modus `tile`, Dock-Zahl, Hinweis, Fallen-Overlay, Zeichen „verborgen“ (`badges.ts`), Effekt beim Auslösen (`board.ts`), Icons (AC 7)
- [x] Sim: `trapSpot` im Autoplay, `traps sprung/run` in `pnpm sim` (AC 8)
- [x] Tests, Architektur §5.7, Decision-Log, `pnpm check`

## Dev Notes

- Kampfstände laufen nicht über `normalizeCampaign`; die neuen Felder sind optional (fehlt = keine Fallen, nicht enthüllt). Kein Speicherformat-Wechsel, keine gesperrte ID berührt.
- Ohne Schatten und Fallen gibt `enemyView` den State selbst zurück und `enemyGo` ruft `doMove` wie zuvor: alte Replays und Sim-Ergebnisse bleiben gleich.
- Die Story nennt `{ type: 'trap', unit, at }`; umgesetzt als Kampf-Aktion `trap{at}`/`disarm{at}` im Command `act`, wie `cast{at}` und wie Architektur §5.7 es schon vorsah.
- Fallen-Logik ist für Story 10.6 (Fallen-Set, `source: 'item'`) offen: `layTrap(..., 'item')` ersetzt keine Klassen-Fallen.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.5]
- [Source: concept/24-architecture/architecture.md §5.7, §5.13, §8.5]
- [Source: concept/21-gdd/gdd.md „Rollenklassen“]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Commands als Kampf-Aktionen `trap{at}`/`disarm{at}` im Command `act` statt eigener Command-Typen (Muster `cast{at}`, Architektur §5.7).
- [ASSUMPTION] Nach dem Auslösen einer Falle entscheidet die KI vom Fallenfeld neu: bester Angriff vom Feld (Score > −500), sonst warten (Epic-Annahme übernommen).
- [ASSUMPTION] Gleiches Verhalten, wenn ein verborgener Schatten den Weg einer KI-Figur stoppt (kein Hinterhalt-Event, die Figur „erkennt“ ihn nicht).
- [ASSUMPTION] Zurücknehmen verbraucht die Aktion (Epic-Annahme übernommen); bei genau einer eigenen Falle daneben geht es ohne Feldwahl.
- [ASSUMPTION] Enthüllt wird der Schatten durch `attack`, `aim` und den Ballistenschuss, nicht durch Wirken, Items oder Konter.
- [ASSUMPTION] Fallen eines Besitzers, der das Brett verlassen hat, wirken weiter für die Spielerseite.
- [ASSUMPTION] Fallen-Look (Rostring mit Zähnen, `render.yaml legibility.trap`), Zeichen „verborgen“ (geschlossenes Auge auf dunklem Stein rechts der Lebensleiste) und Auslöse-Effekt `earth_spikes` vorläufig; Fallen-Klang später (Audio).
- [ASSUMPTION] Autoplay legt jede Runde ohne lohnenden Angriff eine Falle (ersetzt dann die älteste), damit `pnpm sim` die Klasse misst.
- Gefahrenzone (`threatMap`, `tileThreats`) und Gefahrenkarte des Autoplays rechnen je Gegner auf `enemyView`.

### File List

- content/core/balance.yaml, classes.yaml, skills.yaml, render.yaml, handbook.yaml
- content/core/locales/de.yaml, en.yaml, de.names.yaml, en.names.yaml, de.handbook.yaml, en.handbook.yaml
- src/content/schemaBalance.ts, schemaUnits.ts, schemaRender.ts
- src/core/balanceDefs.ts, defs.ts, renderDefs.ts, state.ts, events.ts, index.ts
- src/core/rules/traps.ts (neu), stealth.ts (neu), skills.ts, effects.ts, legibility.ts
- src/core/ai/enemyView.ts (neu), ai.ts, autoplay.ts
- src/core/battle/commands.ts, actions.ts, apply.ts, act.ts
- src/app/screens/Battle.tsx, battleMode.ts, useBattleInput.ts, useBoardOverlays.ts; src/ui/icons.tsx
- src/render/board/badges.ts, badges.css, boardUnits.ts, overlays.ts, board.ts
- tools/simMap.ts
- tests/fixtures/lab/fallen-schatten.yaml (neu)
- tests/unit/traps-shadow.test.ts (neu)
- concept/24-architecture/architecture.md, decision-log.md

### Change Log

- 2026-11-13: Story umgesetzt, Status `review`.
