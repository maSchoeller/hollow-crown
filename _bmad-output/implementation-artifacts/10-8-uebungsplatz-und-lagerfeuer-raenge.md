# Story 10.8: Übungsplatz und Lagerfeuer-Ränge

Status: review

## Story

Als Spieler
möchte ich, dass die Reserve mitwächst und Freundschaften am Lagerfeuer tiefer werden,
damit nicht eingesetzte Gefährten nicht zurückfallen und Supports ihr Ende finden.

## Acceptance Criteria

1. `balance.training.reservePctByLevel: [20, 35, 50]`; nach einem Sieg (`finishBattle`, Story-Mission oder Heimsuchung) erhält jede Figur der Reserve (lebend, nicht eingesetzt, Söldner eingeschlossen) `round(avg × pct / 100)` EP; `avg` = Mittel der tatsächlich vergebenen EP der eingesetzten Überlebenden (Heimsuchung: auf ihrem Anteil) `[ASSUMPTION]`.
2. Vergabe über denselben EP-Kern wie im Kampf (aus `grantExp` herausgezogen): Stufendeckel des Akts, in Heimsuchungen der Aufhol-Deckel, Level-ups mit dem Kampf-RNG nach den eingesetzten Figuren in Truppen-Reihenfolge `[ASSUMPTION]`.
3. Keine Reserve-EP ohne offenen Übungsplatz (Akt 1, Lager), bei Niederlage, Verlassen, Neustart oder `avg = 0`.
4. Missionsergebnis: Zeile „Übungsplatz: Reserve ★ +n“ und darunter die Figuren mit Stufenaufstieg, aus `BattleResult.reserve: Array<{ unit, exp, levelBefore, levelAfter }>` über `resultView.ts`.
5. Panel des Übungsplatzes: Anteil der Stufe („Reserve erhält 20 % der Durchschnitts-EP“) und Reserve der letzten Mission mit EP; Ausbau-Band nennt den Anteil der nächsten Stufe.
6. Lagerfeuer Stufe 2/3 öffnet Rang A/S (S nur Kernpaare); das Panel zeigt Gespräche über dem Deckel gesperrt mit Grund über `campfireLock(data, c, pairKey)`. Knistern später (Audio).
7. `pnpm sim --campaign act2` nennt je Mission Reserve-EP und Durchschnittsstufe der Reserve neben der Armee-Stufe; `tests/unit/training.test.ts`; Handbuch `training` (Heimat) nennt die Anteile als Verweis.

## Tasks / Subtasks

- [x] Inhalt: `balance.training`, Schema, Locales DE/EN (Ergebnis, Panel, Lagerfeuer-Sperren, Band mit `{pct}`), Handbuch `training` (AC 1, 5, 7)
- [x] Kern: `addExp`/`expShare` in `rules/progression.ts` (aus `grantExp`), `hauntCatchUp` (aus `expPercent`), `core/campaign/training.ts` (`reservePct`, `reserveShare`, `trainReserve`), Aufruf in `finishBattle`, `BattleResult.reserve`, `CampaignState.reserveLast` mit Default (AC 1–4)
- [x] `campfireLock` in `camp.ts` (AC 6)
- [x] UI: `Training.tsx`/`Training.css`, Zeile im Ergebnis (`Result.tsx`), Sperren am Lagerfeuer, Band-Parameter (AC 4–6)
- [x] Simulation: Spalten `res lv` und `res EP` (AC 7)
- [x] Tests, Architektur §5.11, Decision-Logs (Architektur, GDD, UX), `pnpm check`

## Dev Notes

- Kein Speicherformat-Wechsel: `CampaignState.reserveLast` bekommt `[]` in `normalizeCampaign` (Architektur §8.7). `content/released-ids.json` gibt es nicht; keine gesperrte ID berührt.
- Der Rang-Teil des Lagerfeuers (A ab Stufe 2, S ab Stufe 3 für Kernpaare) stand schon über `campfireMaxRank`/`unlockableRank` (`campfireMaxRank: [B, A, S]`); neu sind nur die Sperr-Gründe.
- `grantExp` bleibt im Verhalten gleich (Events, `battleExp`, TP); es ruft jetzt `addExp`.
- Die Reserve ist „in der Truppe, aber nicht unter den Kampfeinheiten“; Gäste und NPC-Verbündete zählen damit nie zur Reserve.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.8]
- [Source: concept/24-architecture/architecture.md §5.10, §5.11, §8.1, §8.7]
- [Source: _bmad-output/implementation-artifacts/10-7-lektionen-der-gedaechtnishalle.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent)

### Completion Notes List

- [ASSUMPTION] `avg` zählt alle eingesetzten Überlebenden aus `result.units`, auch Figuren am Stufendeckel (0 EP).
- [ASSUMPTION] Eine Reserve-Figur über der erwarteten Stufe einer Heimsuchung erhält nur `catchUpExpPct` des Anteils (wie eine eingesetzte).
- [ASSUMPTION] Reserve-Level-ups ziehen aus dem Kampf-RNG direkt nach der Schleife der eingesetzten Figuren (vor Kopfgeld und Heimsuchungs-Material).
- [ASSUMPTION] Neues persistiertes Feld `CampaignState.reserveLast` für das Panel („Reserve der letzten Mission“); wird bei jedem Sieg überschrieben (leer ohne Übungsplatz).
- [ASSUMPTION] Die Ergebniszeile nennt als n den höchsten Wert der Reserve (Figuren am Deckel oder mit Aufhol-Anteil bekommen weniger).
- [ASSUMPTION] „Rang S nur für Kernpaare“ steht bei Nicht-Kernpaaren, die Rang A erreicht haben.
- [ASSUMPTION] Gestalt von Ergebniszeile, Panel und Lagerfeuer-Sperren im UX-Decision-Log.

### File List

- content/core/balance.yaml, handbook.yaml, locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml
- src/core/rules/progression.ts, campaign/training.ts (neu), campaign/campaign.ts, campaign/camp.ts, campaign/resultView.ts, state.ts, balanceDefs.ts, index.ts
- src/content/schemaBalance.ts
- src/app/screens/Training.tsx (neu), Training.css (neu), Result.tsx, Rooms.tsx, src/app/toneTestPlan.ts, src/ui/camp.css
- tools/simCampaign.ts, tools/simulate.ts
- tests/unit/training.test.ts (neu), result.test.ts, progression-cap.test.ts, sim-acts.test.ts, sim-campaign.test.ts
- concept/24-architecture/architecture.md, decision-log.md, concept/21-gdd/decision-log.md, concept/25-ux/.decision-log.md

### Change Log

- 2026-11-13: Story umgesetzt (Reserve-EP des Übungsplatzes, Ergebniszeile, Panel, Lagerfeuer-Sperren, Sim-Spalten, Handbuch).
