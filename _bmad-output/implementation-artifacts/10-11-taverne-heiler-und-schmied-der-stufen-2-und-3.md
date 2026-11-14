# Story 10.11: Taverne, Heiler und Schmied der Stufen 2 und 3

Status: review

## Story

Als Spieler
möchte ich, dass ausgebaute Taverne, Heiler und Schmied neue Möglichkeiten bekommen,
damit sich ein Ausbau nicht nur in Zahlen zeigt.

## Acceptance Criteria

1. Taverne ab Stufe 3 (`economy.tavern.wishRoleFromLevel: 3`): `{ type: 'setTavernWish', role }` setzt die Wunschrolle (Rollen der Klassen aus `economy.tavern.classes`), `role: null` hebt sie auf; `c.tavernWish` (Default `null`).
2. Die nächste Angebotsrunde (`refreshTavern` nach der nächsten Story-Mission) enthält sicher ein Angebot dieser Rolle: ist keins dieser Rolle gezogen, ersetzt ein Angebot der Rolle das erste gezogene; danach ist der Wunsch verbraucht. Ziehung und Ersatz laufen über `c.rng`.
3. Fehler ohne Änderung: `not_available` (Taverne < 3), `unknown_choice` (Rolle gibt es in der Taverne nicht).
4. Das Taverne-Panel zeigt die Rollen als Marken und die gewählte hervorgehoben; unter Stufe 3 gibt es die Wahl nicht.
5. Heiler ab Stufe 3 (`supports.griefMissionsByHealerLevel: [3, 3, 2]`, ersetzt `griefMissions`): neu entstehende Trauer dauert 2 statt 3 Missionen; laufende Trauer bleibt unverändert (`finishBattle` liest die Zahl über `griefMissions(data, c)` in `camp.ts`).
6. Schmied auf jeder Stufe, ab Akt 2 (`economy.potionUpgradeFromAct: 2`, kein `if` im Code): „Trank verstärken“ (`{ type: 'upgradePotion', item }`) kostet ● 400, dann ● 900 (`economy.potionUpgrade`), gibt je +5 Heilung und trägt die Stufe als `ItemInstance.upgrade` („+1“), höchstens 2.
7. Fehler ohne Änderung, in dieser Reihenfolge: `unknown_item`, `not_available` (Akt < 2, kein Heiltrank, schon +2), `not_enough_gold`; die Taste nennt den Betrag.
8. `tests/unit/room-functions.test.ts` deckt Wunschrolle, Trauer 2 statt 3, Trank verstärken (auch die Ablehnung in Akt 1), jeden Fehlercode und die Stufen-Schwellen ab; Replay gleich.
9. Der Handbuch-Eintrag `rooms_upgrade` nennt die Stufen von Taverne, Heiler und Schmied als Verweise.

## Tasks / Subtasks

- [x] Inhalt: `balance` (`economy.tavern.wishRoleFromLevel`, `economy.potionUpgradeFromAct`, `supports.griefMissionsByHealerLevel`), Schema, Locales DE/EN, Handbuch `rooms_upgrade` (AC 1, 5, 6, 9)
- [x] Kern: `tavernLevel`, `healerLevel`, `wishRolesOpen`, `tavernWishRoles`, `tavernWishError`, `griefMissions`, `potionUpgradable`, `potionUpgradeOpen`, `potionUpgradeCost`, `potionUpgradeError` in `core/campaign/camp.ts`; Commands `setTavernWish`, `upgradePotion`; `c.tavernWish` mit Default; Wunsch in `refreshTavern` (AC 1–3, 5–7)
- [x] UI: Rollen-Marken im Taverne-Panel, Heiltrank-Abschnitt mit „Trank verstärken“ im Schmied-Panel (AC 4, 7)
- [x] Tests, Architektur §5.11, Decision-Logs (Architektur, GDD, UX), `pnpm check`

## Dev Notes

- Kein Speicherformat-Wechsel: `c.tavernWish` bekommt `null` in `normalizeCampaign` (Muster `emberShop`, `reserveLast`). Keine gesperrte ID berührt (`content/released-ids.json` gibt es nicht).
- Die drei Räume tragen ihre `levels` und ihre Stufen-Texte (`room.<id>.level.2|3`) schon seit Story 10.1; `rooms.yaml` ändert sich nicht.
- Die Trank-Stufe nutzt `ItemInstance.upgrade` weiter, das die Heilung in `battle/act.ts` schon liest (`use.heal + upgrade × potionUpgrade[0].heal`); `upgradable` (Waffe/Rüstung/Schild) bleibt unberührt, der Schmied hat zwei getrennte Listen.
- Kein neues Event: das Taverne-Panel liest `c.tavernWish`, `upgradePotion` meldet `itemChanged`.
- Zufall nur in `refreshTavern` über `c.rng`: Der Ersatz zieht aus den passenden Klassen und wird an die erste Stelle gesetzt, nachdem das ersetzte Angebot heraus ist (so bleibt die Namensregel „kein Name doppelt“ gültig).

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.11]
- [Source: concept/24-architecture/architecture.md §5.10, §5.11, §8.1]
- [Source: _bmad-output/implementation-artifacts/10-10-konvoi-der-stufen-2-und-3.md]
- [Source: _bmad-output/implementation-artifacts/10-9-haendler-der-stufen-2-und-3.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Gewählt wird eine **Rolle** der Taverne-Klassen (`class.<role>.name` als Beschriftung, jede Rolle einmal), nicht eine Klasse; unter Stufe 3 ist auch das Aufheben (`role: null`) `not_available`.
- [ASSUMPTION] Der Wunsch gilt für genau eine Angebotsrunde und ist danach verbraucht – auch dann, wenn die Rolle gerade keine Klasse hat (Bedingungen) oder die Runde ohnehin eins dieser Rolle brachte. Er kostet nichts.
- [ASSUMPTION] Ersetzt wird das **erste** gezogene Angebot; es wird vor dem Nachziehen entfernt, damit die Regel „kein Name doppelt“ weiter gilt. Die Ziehung läuft über `c.rng`, Replays bleiben gleich.
- [ASSUMPTION] Laufende Trauer bleibt bei ihrer Zahl und zählt normal herunter (`Math.max`); nur neu entstehende Trauer ist beim Heiler der Stufe 3 kürzer.
- [ASSUMPTION] Heiltrank = Verbrauchsgut mit `use.heal` (Stäbe haben `heal` ohne `use` und sind nicht gemeint); die Stufe nutzt `ItemInstance.upgrade` weiter, das `battle/act.ts` schon in die Heilung rechnet.
- [ASSUMPTION] Form: Taverne mit Zwischentitel „Wunschrolle“, Chip-Reihe (Glutrand für die gewählte Rolle, erneutes Tippen hebt auf) und Hinweiszeile; Schmied mit Zwischentitel „Heiltränke“, rechts „Heilung +5“ bzw. „Höchste Stufe“, und einer Haupttaste, die bei gewähltem Trank „Trank verstärken · ● 400“ nennt. Vor Akt 2 fehlt der Abschnitt ganz.
- Neuer Helfer `roomLevelOf(data, c, fn)` in `camp.ts` (Stufe über die Raumfunktion); `scarCost` und `tavernOfferCount` lesen ihn jetzt mit, statt die Raum-Id fest zu nennen.
- Sichtprüfung im Dev-Build (`__hc.devRooms(3, 'tavern' | 'smith')`, alle Lautstärken auf 0): Taverne zeigt die drei Rollen-Marken, „Marksman“ bekommt beim Tippen den Glutrand und `c.tavernWish` steht; der Schmied listet fünf Heiltränke, die Haupttaste nennt „Strengthen potion · 400“, nach dem Tippen steht „Vulnerary +1“, Gold 12.000 → 11.600 und die Taste nennt 900.

### File List

- content/core/balance.yaml, handbook.yaml, locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml
- src/core/campaign/camp.ts, apply.ts, campaign.ts, commands.ts, src/core/state.ts, balanceDefs.ts, storyDefs.ts
- src/content/schemaBalance.ts
- src/app/screens/Rooms.tsx, src/ui/camp.css, src/app/toneTestPlan.ts, src/app/state/devHooks.ts (`__hc.devRooms(level, tab)`)
- tests/unit/room-functions.test.ts (neu), tests/unit/farewell.test.ts
- concept/24-architecture/architecture.md, decision-log.md, concept/21-gdd/decision-log.md, concept/25-ux/.decision-log.md

### Change Log

- 2026-11-14: Story umgesetzt (Wunschrolle der Taverne, Trauer je Heiler-Stufe, Trank verstärken, Handbuch, Tests).
