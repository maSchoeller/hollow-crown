# Story 1.9: Mission verlassen und zur Weltkarte

Status: done

## Story

Als Spieler
möchte ich eine laufende Mission verlassen und zur Weltkarte zurückkehren,
damit ich Truppe, Aufstellung und Ausrüstung ändern und die Mission neu beginnen kann, ohne den Kampf zu Ende zu spielen.

_Nachgetragen 2026-10-27, Wunsch des Produktinhabers._

## Acceptance Criteria

1. **Standard/Casual:** Im Kampfmenü steht „Mission verlassen“ jederzeit, auch mitten im Kampf. Nach der Rückfrage wird der Kampf verworfen, die Weltkarte erscheint, die Kampagne ist unverändert wie vor dem Missionsstart. Der Kampf-Auto-Save ist ersetzt, der abgebrochene Kampf ist nicht fortsetzbar.
2. **Klassik:** Der Eintrag erscheint nur, solange keine Aktion gegeben wurde (Befehls-Log des Kampfs leer). `validateCampaign` lehnt `abandonMission` danach mit `abandon_forbidden` ab.
3. **Rückfrage:** Ein Sheet sagt klar: Der Kampf wird abgebrochen, der Fortschritt dieses Kampfs geht verloren, die Kampagne bleibt unverändert. „Abbrechen“ lässt den Kampf weiterlaufen.

## Tasks / Subtasks

- [x] T1 Kern: Command `abandonMission`, Event `battleAbandoned`, Fehlercode `abandon_forbidden` in `commands.ts`; Validierung und Apply in `apply.ts`
- [x] T2 App: `canAbandon()` und `abandonBattle()` in `state/battle.ts`; Dev-/Test-Hooks in `state/flow.ts`
- [x] T3 UI: Eintrag und Rückfrage-Sheet in `BattleMenu` (`BattlePanels.tsx`), Anbindung in `Battle.tsx`; Texte `ui.battle.leaveMission`, `leaveConfirmTitle`, `leaveConfirmText`, `leaveConfirm` (de/en)
- [x] T4 Tests: `tests/unit/restart.test.ts` (abandonMission), E2E in `tests/e2e/prep.spec.ts`

## Dev Notes

- **Kampagne bleibt unverändert:** Beute, EP, Verbrauchsgüter und Verluste gelten erst mit `finishMission`; das Command klont nur die Kampagne und meldet `battleAbandoned`. Es steht wie die Neustart-Commands im Journal; das Speicherformat ändert sich nicht.
- **Klassik-Grenze:** Das Command trägt das Befehls-Log (`commands`); Klassik verlangt, dass es leer ist. Anders als bei `restartMission` gibt es nichts nachzuspielen, die Länge genügt.
- **Auto-Save:** Wie in `concludeBattle` speichert `campaignCommand` noch mit laufendem Kampf; danach `battle = null` und `autosave('worldmap')`.
- Der Niederlage-Bildschirm bleibt unverändert; der Weg über die Aufstellung hat schon einen Zurück-Button.
- Entscheidung in `concept/24-architecture/decision-log.md`, nicht in `01-decisions.md` (eingefroren).

### References

- `concept/26-epics/epics/epic-01.md` Story 1.9; Story 1.5 (Neustart je Tod-Modus); GDD Tod-Modi.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Completion Notes List

- Unit-Tests: Standard/Casual mit leerem und gefülltem Log, Klassik nur mit leerem Log, Kampagne gleich nach Apply, nicht startbarer Knoten abgelehnt.

### File List

- `src/core/campaign/{commands,apply}.ts`
- `src/app/state/{battle,flow}.ts`, `src/app/screens/{Battle,BattlePanels}.tsx`
- `content/core/locales/{de,en}.yaml`
- `tests/unit/restart.test.ts`, `tests/e2e/prep.spec.ts`

## Abnahme 2026-10-27

Abgenommen (Status done). AC 1 und 3 im Browser (Standard, 1-5): Rückfrage-Sheet, „Mission verlassen“ führt auf die Weltkarte, Kampagne unverändert, danach 1-4 neu gestartet. AC 2 (Klassik) über `tests/unit/restart.test.ts` (`abandon_forbidden`). Gesamtbefund: `acceptance-2026-10-27.md`.
