# Story 1.4: Kampagnen-Commands und Journal

Status: review

## Story

Als Spieler
möchte ich, dass alles zwischen den Missionen genauso zuverlässig gespeichert und nachvollziehbar ist wie der Kampf,
damit kein Kauf, keine Entscheidung und kein Fortschritt verloren geht.

## Acceptance Criteria

1. **Commands:** Die heutigen Funktionen in `src/core/campaign/camp.ts` (kaufen, Angebot kaufen, verkaufen, ausrüsten, ablegen, aufwerten, Affix neu würfeln, Runen einsetzen/entfernen/verschmelzen, Narben heilen, Support freischalten, Loadout, Beförderung) laufen als `CampaignCommand` über `validateCampaign` und `applyCampaign` mit strukturierten Fehlercodes und `CampaignEvent`s. [Architektur §5.2, §8.1]
2. **Vorschau = gleicher Code:** Kosten- und Vorschaufunktionen (`upgradeCost`, `rerollCost`, `offerPrice`, `sellPrice`, `merchantStock`, `availableSupportTalks` …) bleiben exportiert; UI und Handler nutzen dieselben Funktionen.
3. **Journal:** Jedes angewendete Kampagnen-Command wird mit laufender Nummer im Store `journal` (Schlüssel `[campaignId, seq]`) abgelegt; `finishMission` enthält das Kampf-Log.
4. **Replay:** Ein Test zeigt: Startzustand + Journal ergibt exakt denselben `CampaignState`.
5. **Checkpoint:** Lädt die App eine Kampagne mit neuer `contentVersion` (oder neuer App-Version), schreibt sie einen Checkpoint (voller `CampaignState`) ins Journal; Replays beginnen am letzten Checkpoint.
6. **Coverage:** Die Coverage von `src/core` sinkt nicht (Stand nach 1.2: 66,11 % Zeilen).

## Tasks / Subtasks

- [x] T1 Command-Typen und Kern (AC 1, 2)
  - [x] `src/core/campaign/commands.ts`: `CampaignCommand`, `CampaignError`, `CampaignEvent`, `CampaignResult`
  - [x] `validateCampaign(data, c, cmd)` (nur lesen, Fehlercode oder `null`) und `applyCampaign(data, c, cmd)` (Kopie + Events; wirft bei ungültigem Command wie `applyCommand`)
  - [x] Handler aus `camp.ts` übernehmen; Rechenhilfen exportiert lassen
  - [x] `finishMission{start, commands}`: Kampf aus Start + Log nachspielen, `finishBattle` anwenden
  - [x] `setFlag{flag}` für Dialog-Entscheidungen (bis Story 4.6 `choose` bringt)
- [x] T2 Journal in `persistence` (AC 3, 5)
  - [x] Typen `JournalEntry` (`command` | `checkpoint`), `appendJournal`, `readJournal`, `lastCheckpoint`
  - [x] `replayJournal(data, entries)` im Kern (reine Funktion) für Test und Fehlerbericht (Story 1.7)
- [x] T3 App-Verdrahtung (AC 1, 3, 5)
  - [x] `store.ts`: `campaignCommand(cmd)` validiert, wendet an, hängt ans Journal (geordnete Schreib-Kette), Auto-Save
  - [x] Checkpoint bei neuer Kampagne, bei jedem Laden (Grund `update`, wenn sich App- oder Content-Version geändert hat, sonst `load`) und beim Import
  - [x] `concludeBattle` → `finishMission`; `setFlag` → Command
  - [x] `Camp.tsx`: `apply` nimmt Commands statt fertiger Ergebnisse
- [x] T4 Tests (AC 4, 6)
  - [x] Je Command: gültig, Fehlercodes, Events, Determinismus
  - [x] Replay-Test: Kampagne mit Käufen, Ausrüsten, Mission (Autoplay) und Flags → Replay gleich
  - [x] Journal-Test mit `fake-indexeddb` (Reihenfolge, Checkpoint, Löschen mit Kampagne)

## Dev Notes

- **Muster:** Architektur §8.1 ist verbindlich (Typ in `commands.ts`, Prüfung in `validateCampaign`, Wirkung in `applyCampaign` auf einer Kopie, Events anhängen, Test für gültig/Fehler/Events/Determinismus).
- **Heutiger Stand:** `camp.ts` liefert `CampResult` (`{ok, campaign} | {ok:false, error}`), Prüfung und Wirkung sind vermischt. `Camp.tsx` ruft die Funktionen direkt und gibt das Ergebnis an `setCampaign`. `store.setFlag` ändert `campaign.value` direkt (auch mitten im Kampf). `concludeBattle` ruft `finishBattle` direkt.
- **Was erhalten bleiben muss:** Fehlermeldungen `ui.camp.err.<code>` (alle Codes behalten, neue Codes bekommen Schlüssel in DE und EN); Toaster und Sounds in `Camp.tsx`; Niederlage ändert die Kampagne nicht; Auto-Save nach jeder Aktion; `pnpm sim` (nutzt `finishBattle` direkt, das bleibt exportiert).
- **`finishMission` trägt den Kampf-Start:** Der Start lässt sich nicht verlässlich aus Knoten + Aufstellung neu bauen (Vorbereitung tauscht Positionen, Dialog-Flags können sich mitten im Kampf ändern). Daher `finishMission{ start: BattleState, commands: Command[] }`; der Handler prüft `start.nodeId` gegen `available` und spielt das Log mit `applyCommand` nach.
- **Checkpoint bei jedem Laden:** Ein geladener Spielstand (manueller Platz, Import, oder ein Auto-Save, der dem Journal hinterherhinkt) passt nicht zwingend zum Ende des Journals. Darum schreibt jedes Laden einen Checkpoint mit Grund (`new`, `load`, `update`, `import`). AC 5 ist damit der Fall `update`.
- **Kein Spielzustand außerhalb von `CampaignState`:** Journal-Nummer und Kampagnen-ID leben in `persistence`/`app`, nicht im Kern.
- **Schichten:** `core` kennt kein IndexedDB; `persistence ← core (Typen)`.
- **Nicht Teil der Story:** `restartTurn`/`restartMission` als Commands (Story 1.5), Fehlerbericht (1.7), `choose`/Szenen (4.x), neue UI-Bausteine (1.1).

### Project Structure Notes

- Neu: `src/core/campaign/commands.ts`, `src/persistence/journal.ts`, `tests/unit/campaign-commands.test.ts`, `tests/unit/journal.test.ts`.
- Ändern: `src/core/campaign/camp.ts`, `src/core/index.ts`, `src/app/store.ts`, `src/app/App.tsx`, `src/app/screens/Camp.tsx`, `src/app/screens/Battle.tsx`, `content/locales/{de,en}.yaml`.
- Nicht anfassen: `src/render/`, `src/ui/` (Story 1.1), `art/`, `tools/art/`.

### Project Context Rules

- `src/core` ohne DOM, `Math.random`, `Date.now`; Zufall nur aus `c.rng`.
- Kein sichtbarer Text im Code; Spielwerte nur aus `balance.yaml`.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün sind.

### References

- [Source: concept/24-architecture/architecture.md#5.2 Zwei Command-Ebenen]
- [Source: concept/24-architecture/architecture.md#5.15 Speichern, Format 2]
- [Source: concept/24-architecture/architecture.md#6.1 Fehlerbehandlung]
- [Source: concept/24-architecture/architecture.md#8.1 Neues Kampagnen-Command]
- [Source: concept/26-epics/epics/epic-01.md#Story 1.4]
- [Source: _bmad-output/implementation-artifacts/1-2-speicherformat-2-mit-kampagnen.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (57 Tests, davon 19 neu), `pnpm content:check`, `pnpm build` grün.
- Coverage `src/core` (Zeilen) 66,11 % → 76,14 %.
- Browser-Prüfung (Dev-Server, frische Datenbank): Neue Kampagne → Journal `0 checkpoint:new`; Prolog per Autoplay gewonnen → `1 finishMission` (28 Kampf-Commands); Schwert und Angebot gekauft → `2 buy`, `3 buyOffer`; Kauf ohne genug Gold abgelehnt und nicht im Journal; Replay ab Checkpoint ergibt exakt den Live-Zustand; nach Neuladen und „Fortsetzen“ → `4 checkpoint:load`; keine Konsolenfehler.

### Completion Notes List

- Neu: `src/core/campaign/commands.ts` (`CampaignCommand`, `CampaignError`, `CampaignEvent`) und `src/core/campaign/apply.ts` (`validateCampaign`, `applyCampaign`, `replayCampaign`). `applyCampaign` wirft bei ungültigem Command wie `applyCommand`.
- `camp.ts` hält nur noch Hilfen und Vorschau (`locateItem`, `takeItem`, `offerPrice`, `upgradeCost`, `rerollCost`, neu `runeMerge`, `availableSupportTalks`); die alten `CampResult`-Funktionen sind Handler in `apply.ts`.
- Gold- und Material-Events entstehen aus dem Vergleich vorher/nachher, damit kein Handler sie vergisst.
- `finishMission{start, commands}` trägt den Kampf-Start, weil er sich nicht verlässlich neu bauen lässt (Positionstausch in der Vorbereitung, Dialog-Flags mitten im Kampf). Größe je Mission einige zehn KB.
- `setFlag{flag}` ersetzt das direkte Setzen in `store.setFlag`, auch mitten im Kampf; Story 4.6 löst es durch `choose` ab.
- Checkpoint bei jeder neuen Kampagne, jedem Laden (Grund `update`, wenn App- oder Content-Version sich seit dem letzten Checkpoint geändert hat, sonst `load`) und jedem Import. Damit beginnt ein Replay immer bei einem Zustand, der zum geladenen Spielstand passt.
- Journal-Schreiber hält die Reihenfolge, ohne die Eingabe zu blockieren; ein fehlgeschlagener Eintrag stoppt spätere nicht (Auto-Save hält den Zustand weiter).
- Neue Fehlercodes `unknown_class` (`promotesTo` nennt Klassen, die es noch nicht gibt) und `node_unavailable` mit DE/EN-Texten.
- Nicht enthalten: `restartTurn`/`restartMission` als Commands (Story 1.5), Fehlerbericht (1.7). Unabhängiges Code-Review steht noch aus.

### File List

- `src/core/campaign/commands.ts` (neu)
- `src/core/campaign/apply.ts` (neu)
- `src/core/campaign/camp.ts`
- `src/core/index.ts`
- `src/persistence/journal.ts` (neu)
- `src/persistence/save.ts` (`saveDb` exportiert)
- `src/app/store.ts`
- `src/app/screens/Camp.tsx`
- `content/locales/de.yaml`, `content/locales/en.yaml` (2 neue Schlüssel)
- `tests/unit/campaign-commands.test.ts` (neu)
- `tests/unit/journal.test.ts` (neu)