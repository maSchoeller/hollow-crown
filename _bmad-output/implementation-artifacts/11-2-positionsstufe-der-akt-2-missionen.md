---
baseline_commit: fc4f05b
---
# Story 11.2: Positionsstufe der Akt-2-Missionen

Status: review

## Story

Als Spieler
möchte ich, dass Gegner und neue Gefährten in Akt 2 zu meinem Fortschritt passen, auch in den Paaren und Nebenquests,
damit jede Mission fordert, ohne zu überfordern.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.2 (BDD dort vollständig); Vertrag in `concept/24-architecture/architecture.md` §5.4 („Akt 2, Freischaltung und Positionsstufe“).

1. **Positionsstufe:** `acts/act2/campaign.yaml` hat `positionLevel: { base: 11 }` `[ASSUMPTION]` (11.4 setzt den Wert nach der Messung). Die reine Funktion `nodeLevel(data, c, node)` liefert für Akte ohne `positionLevel` `expectedLevel` (Akt 1 unverändert), sonst P = `base` + erledigte Story-Knoten des Akts + `levelBonus` des Knotens; gilt für Story- und Nebenquest-Knoten, replay-sicher. `expectedLevel` ist in Akten mit `positionLevel` optional, die Monotonie-Prüfung gilt nur ohne `positionLevel`.
2. **Leser:** Taverne (`refreshTavern`), Heimsuchung (`hauntLevel`), Weltkarte (`ui.map.level`, „Stufe ≈ P“), Vorbereitung, Dev-Start (`devNode`), Lab und Simulation lesen `nodeLevel`.
3. **Karteneinheiten:** Auf Karten von Akt 2 tragen Gegner `levelOffset` −3…+2 statt `level`, auch in Verstärkungen und `spawn`-Triggern; `createBattle` rechnet `nodeLevel + levelOffset`, P steht im Startzustand (`BattleState.positionLevel`, nur ab Akt 2). `content:check` verlangt auf Karten von Akt 2 `levelOffset` für alle Gegner, meldet Werte außerhalb −3…+2 und `levelOffset` auf Karten ohne Positionsstufe; `levelCap` gilt nur für die Truppe.
4. **Beitritt:** Ein Gefährte von Akt 2 tritt mit max(`level` der Definition, P − 1) bei, Werte steigen ohne Zufall um den Erwartungswert des Wachstums (wie `joinLieutenant`).
5. **Rückfall:** Heimsuchungen in Akt 2 fallen ohne Story-Karte nicht auf Stufe 1 zurück, sondern nehmen den letzten Akt mit Karten.
6. **Tests:** `tests/unit/position-level.test.ts` (nodeLevel Akt 1/2, beide Positionen eines Paars, Nebenquest früh/spät, `levelOffset`, Beitrittsstufe, Rückfall); Fixture `tests/fixtures/maps/dev_eisenmark.yaml`, startbar mit `__hc.devMap('dev_eisenmark', 2)`.

## Tasks / Subtasks

- [x] `src/core/campaign/position.ts`: `nodeLevel`, `positionNow`, `joinLevel`, `raiseToLevel` (geteilt mit `joinLieutenant`) (AC 1, 4)
- [x] Schema/Typen: `positionLevel` in `campaignSchema`/`CampaignDef`, `levelBonus` und optionales `expectedLevel` am Knoten, `levelOffset` an `mapUnitSchema`/`MapUnitDef` (`level` optional) (AC 1, 3)
- [x] Kampf: `BattleState.positionLevel`, `createBattle`/`spawnUnits`/Lab lösen `levelOffset` auf; Akt-2-Gefährten auf der Karte und beim Beitritt (`finishMission`, `addToRoster`) auf Beitrittsstufe (AC 3, 4)
- [x] Leser umstellen: `refreshTavern`, `hauntLevel` (+ Rückfall), WorldMap, `devNode`, Lab, `simCampaign`/`simulate`, e2e/perf (AC 2, 5)
- [x] `content:check`: Monotonie nur ohne `positionLevel`, `expectedLevel` Pflicht ohne `positionLevel`, `levelBonus` nur mit, `levelOffset` auf Akt-2-Karten (AC 1, 3)
- [x] `devMap(id, 2)` und Fixture `dev_eisenmark.yaml` (AC 6)
- [x] Tests `position-level.test.ts`; Architektur §5.4 „Stand (Story 11.2)“ (AC 6)

## Dev Notes

- **Heute (11.1):** `hauntLevel` (src/core/campaign/haunts.ts) nimmt `expectedLevel` des nächsten Story-Knotens, sonst des letzten erledigten über alle Akte (`nodesUpTo`); `refreshTavern` (campaign.ts) nimmt `expectedLevel` des nächsten Knotens; `joinLieutenant` (lieutenants.ts) hebt Werte ohne Zufall; Karten-Charaktere entstehen über `recordFromChar` auf der Stufe ihrer Definition (create.ts), Beitritt nach der Mission in `finishMission` (Team `player` übernimmt den Kampf-Datensatz, Team `other` baut neu), Wirkung `recruit` über `addToRoster`.
- **Akt 1 exakt wie vorher:** `BattleState.positionLevel` fehlt in Akt 1 (Startzustände, Prüfsummen), `nodeLevel` = `expectedLevel`, keine Akt-1-Karte trägt `levelOffset`.
- **Knotenakt:** `nodeLevel` nimmt den Akt der `campaign.yaml`, in der der Knoten steht (`nodeAct`), nicht `c.act`.
- **Leutnants:** behalten ihre Stufenregel (§5.5, Durchschnitt der stärksten + Groll); `levelOffset` steht an ihnen nur zur Pflicht der Prüfung.
- Werte in YAML (`positionLevel`, `levelBonus`, `levelOffset`), kein sichtbarer Text im Code (`ui.map.level` gibt es schon: „Stufe ≈ {n}“).

### References

- `concept/26-epics/epics/epic-11.md` (Story 11.2, Gilt für alle Stories)
- `concept/24-architecture/architecture.md` §5.4 (Vertrag `nodeLevel`), §5.5 (Leutnant-Stufe), §5.6 (Heimsuchungen)
- `_bmad-output/implementation-artifacts/11-1-akt-uebergang-und-spielstand.md` (acts.ts, `hauntLevel`-Vorgriff)

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm check` grün (1723 Tests); im Dev-Build `__hc.devNode('m1_1')`, dann `__hc.devMap('dev_eisenmark', 2)`: P 11, Einheiten 8/8/10/13 (Gegner), 11/10/10 (Truppe).

### Completion Notes List

- `nodeLevel`, `positionNow`, `atPosition`, `joinLevel`, `raiseToLevel`, `raiseOnJoin`, `raiseMapChar` in `src/core/campaign/position.ts`; `joinLieutenant` nutzt `raiseToLevel` (gleiche Rechnung wie vorher).
- `[ASSUMPTION]` `positionLevel.base: 11` (vom Epic vorgegeben, 11.4 misst).
- **PO bestätigt 2026-11-09:** Der Akt eines Knotens ist der seiner `campaign.yaml`: eine Akt-1-Nebenquest (N1–N3), die erst in Akt 2 gespielt wird, behält ihr `expectedLevel` und steigt nicht mit P mit.
- `[ASSUMPTION]` Ein erledigter Story-Knoten des Akts zählt für P, der Knoten selbst nicht; Nebenquests zählen nicht.
- `[ASSUMPTION]` Beitritt über die Wirkung `recruit` nach dem Sieg nimmt P des Akts im Moment des Beitritts (= P des gespielten Story-Knotens + 1, Beitrittsstufe also P des Knotens); Beitritt über die Karte (Charakter auf dem Brett, Team `other` oder Ansprechen) nimmt P − 1 des Kampfes. Gilt nur für Gefährten aus `acts/act2/units.yaml` (Akt mit `positionLevel`), Akt-1-Gefährten treten wie bisher bei.
- **PO bestätigt 2026-11-09:** Leutnants behalten ihre Stufenregel (§5.5, Durchschnitt der stärksten + Groll); ihr `levelOffset` ist auf Akt-2-Karten Pflicht, wird aber wie bisher `level` überschrieben. „Leutnants P+1“ aus dem GDD-Log ist damit nur angenähert.
- `[ASSUMPTION]` Die Spanne −3…+2 steht als Prüfregel in `validateLevels.ts` (GDD-Regel, kein Spielwert). Die Entwürfe tragen schon `level` und `levelOffset` nebeneinander; `level` gilt dann nur als Kommentar, beides zusammen ist erlaubt.
- `hauntLevel` nimmt nur Knoten mit gebauter Karte (`data.maps`), sonst den letzten erledigten Story-Knoten mit Karte (Akt 2 auf „Weitere Missionen folgen“: m1_8, Stufe 9).
- Die Vorbereitung zeigt keine erwartete Stufe; dort gab es nichts umzustellen. Simulation: `simCampaign` meldet `nodeLevel` beim ersten Erreichen; über Akte rechnet erst 11.4.
- Akt 1 unverändert: `BattleState.positionLevel` nur in Akten mit Positionsstufe, keine Akt-1-Karte trägt `levelOffset`, alle Replay- und Spielstand-Tests grün.

### File List

Neu: `src/core/campaign/position.ts`, `src/content/validateLevels.ts`, `tests/unit/position-level.test.ts`, `tests/fixtures/maps/dev_eisenmark.yaml`.
Geändert: `content/acts/act2/campaign.yaml`, `src/core/{storyDefs,mapDefs,state,index}.ts`, `src/core/battle/{create,setup,objectives}.ts`, `src/core/campaign/{campaign,haunts,lieutenants}.ts`, `src/content/{schemaCampaign,schemaMap,validateCampaign,validateMap,drafts}.ts`, `src/app/screens/WorldMap.tsx`, `src/app/state/devHooks.ts`, `src/lab/scenario.ts`, `tools/simCampaign.ts`, `tests/unit/{camp,lab,m1-8,story}.test.ts`, `tests/e2e/{finale.spec,lastMove}.ts`, `tests/perf/bench.ts`, `concept/24-architecture/architecture.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`.

### Change Log

- 2026-11-08: Story angelegt (gds-create-story).
- 2026-11-08: Umgesetzt (Positionsstufe, `levelOffset`, Beitrittsstufe, Rückfall der Heimsuchungen), Status review.
