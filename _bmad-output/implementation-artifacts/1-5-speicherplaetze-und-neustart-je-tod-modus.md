# Story 1.5: Speicherplätze und Neustart je Tod-Modus

Status: review

## Story

Als Spieler
möchte ich je nach Tod-Modus Runde oder Mission neu starten und in Standard/Casual eigene Speicherplätze nutzen,
damit Klassik streng bleibt und die anderen Modi Fehler verzeihen.

## Acceptance Criteria

1. **Speicherplätze:** In Standard/Casual stehen außerhalb des Kampfs im Menü 3 Plätze zur Wahl (Anzeige mit Stand in der Kampagnen-Zeile, einzeln ladbar). Klassik hat die Funktion nicht; die Zeile sagt „nur Auto-Save“.
2. **Neustart:** „Runde neu“ und „Mission neu“ laufen als Kampagnen-Commands `restartTurn` (Replay bis `turnStartIndex`) und `restartMission` (Replay ab Start) und setzen auch Tode zurück. `validateCampaign` lehnt in Klassik `restartTurn` immer und `restartMission` außer nach einer Niederlage ab.
3. **Export/Import:** Export jederzeit außerhalb des Kampfs, Import nur aus der Kampagnen-Ansicht (überschreibt die Kampagne gleicher ID). Import prüft Größe (≤ 5 MB), Prüfsumme und Schema und nennt Fehler in einem Satz.

## Tasks / Subtasks

- [x] T1 Kern: `restartTurn`/`restartMission` in `commands.ts`, `validateCampaign`/`applyCampaign`, Event `battleRestarted`, `restart.ts` (`turnStartIndex`, `restartKeep`, `replayBattle`)
- [x] T2 App: `restartBattle(scope)` und `canRestart(scope)` in `state/battle.ts` laufen über `campaignCommand`; Niederlage-Bildschirm und Kampfmenü zeigen nur erlaubte Neustarts
- [x] T3 Speicherplätze: `writeSave` verweigert manuelle Plätze in Klassik und im Kampf (`SlotNotAllowedError`); Speichern-Panel im Lager blendet Speichern in Klassik aus
- [x] T4 Import: Größenlimit, Zod-Schema `src/persistence/schema.ts`, Fehlertexte für Größe, Prüfsumme, Format
- [x] T5 Tests `tests/unit/restart.test.ts`

## Dev Notes

- **Command trägt den Kampf:** Der Kampf lebt in der App-Sitzung, nicht im `CampaignState`. Wie `finishMission` tragen die Neustart-Commands `start` und `commands`; Klassik prüft „nach Niederlage“, indem das Log nachgespielt wird (kein Vertrauen auf eine Behauptung des Aufrufers). Das Command ändert die Kampagne nicht, es meldet über `battleRestarted { scope, keep }`, wie viel des Logs bleibt; die App spielt es dann nach. Die Commands stehen im Journal.
- **Offene Frage O1** (Runde neu in Standard/Casual): vorläufig „ja in Casual/Standard, nein in Klassik“ umgesetzt, im Playtest beobachten.
- Der Import in Klassik überschreibt die Kampagne gleicher ID (Ehrensystem, AR18); Import nur in `Campaigns.tsx`.
- Das Schema prüft die Hülle und die Felder, die die App beim Laden liest; Inhalte (Items, Einheiten) prüfen die Regeln beim Spielen.

### References

- `concept/26-epics/epics.md` Story 1.5; `concept/24-architecture/architecture.md` §5.15; GDD Tod-Modi.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm test` (115 Tests), `pnpm content:check`, `pnpm build` (Bundle 14,92 MB von 15,00 MB): grün.
- Browser (Port 5177): Standard-Kampagne, Kampfmenü zeigt Runde neu/Mission neu, Journal enthält `restartTurn`, `restartMission`; keine Konsolenfehler.

### Completion Notes List

- Klassik-Ablehnung, Standard/Casual-Erlaubnis, Replay-Rücksetzen, Slot-Sperre und Import-Prüfungen sind getestet.
- Klassik-Kampfmenü: kein Neustart; Niederlage-Bildschirm bietet dort nur „Mission neu“.
- Die Optik des Niederlage-Bildschirms bleibt unverändert (Story 6.6).

### File List

- `src/core/campaign/{commands,apply,restart}.ts`, `src/core/index.ts`
- `src/app/state/{battle,session}.ts`, `src/app/App.tsx`, `src/app/screens/{Battle,Camp,Campaigns}.tsx`
- `src/persistence/{save,schema}.ts`
- `content/core/locales/{de,en}.yaml`
- `tests/unit/{restart,save}.test.ts`
