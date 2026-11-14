# Story 10.10: Konvoi der Stufen 2 und 3

Status: review

## Story

Als Spieler
möchte ich mit einem ausgebauten Konvoi Ausrüstungs-Vorlagen speichern und das Beste mit einem Tipp anlegen,
damit das Umrüsten der wachsenden Truppe schnell geht.

## Acceptance Criteria

1. Konvoi ab Stufe 2 (`economy.gearTemplateFromConvoyLevel: 2`): „Als Vorlage speichern“ (`{ type: 'saveGearTemplate', unit }`) legt die Item-Uids der 6 Ausrüstungs- und 3 Beutelplätze in `UnitRecord.gearTemplate` (Default `null`), eine Vorlage je Figur.
2. „Vorlage anlegen“ (`{ type: 'applyGearTemplate', unit }`) legt die Items der Vorlage aus Konvoi oder eigener Ausrüstung an, gibt die abgelösten Items in den Konvoi, überspringt verkaufte Items und Items anderer Figuren und nennt die übersprungenen im Toast („Bei Brenna: Eisenlanze“).
3. Fehler ohne Änderung: `unknown_unit`, `not_available` (Konvoi < 2, keine Vorlage), `convoy_full`.
4. Konvoi ab Stufe 3 (`economy.equipBestFromConvoyLevel: 3`): „Bestes anlegen“ (`{ type: 'equipBest', unit }`) legt über den gemeinsamen Kern von `autoEquip` die führbare Waffe mit der höchsten Mt (Gleichstand: Treffer, dann Uid) und je Rüstungsplatz das Teil mit der höchsten Summe VER + WID (Gleichstand: VER, dann Uid) an; Items anderer Figuren, Zubehör und Beutel bleiben unberührt.
5. Die Ausrüsten-Ansicht zeigt das Ergebnis mit dem Vergleich grün/rot aus Story 6.2 (dieselben Funktionen `equipCandidates`/`equipPreview`).
6. `tests/unit/convoy-levels.test.ts` deckt Vorlage speichern und anlegen (auch übersprungene Items), „Bestes anlegen“ mit allen Gleichständen, jeden Fehlercode und die Stufen-Schwellen ab; Replay gleich.
7. Der Handbuch-Eintrag `rooms_upgrade` nennt die Konvoi-Stufen als Verweise.

## Tasks / Subtasks

- [x] Inhalt: `balance.economy` (`gearTemplateFromConvoyLevel`, `equipBestFromConvoyLevel`), Schema, Locales DE/EN, Handbuch `rooms_upgrade` (AC 1, 4, 7)
- [x] Kern: `convoyLevel`, `gearTemplatesOpen`, `equipBestOpen`, `gearTemplateOf`, `runGearTemplate`, `runEquipBest`, `equipInto` in `core/campaign/gear.ts`; `slotsOf` und `pickBestGear` als gemeinsamer Kern neben `autoEquip` in `core/battle/create.ts`; Commands `saveGearTemplate`, `applyGearTemplate`, `equipBest`; `UnitRecord.gearTemplate` mit Default (AC 1–4)
- [x] UI: Figur-Ansicht mit den drei Tasten und dem Toast der übersprungenen Items, Konvoi-Panel mit den Stufen-Marken (AC 2, 5)
- [x] Tests, Architektur §5.11, Decision-Logs (Architektur, GDD, UX), `pnpm check`

## Dev Notes

- Kein Speicherformat-Wechsel: `UnitRecord.gearTemplate` bekommt `null` in `normalizeCampaign` (Muster `secondPath`, `heritage`). Keine gesperrte ID berührt (`content/released-ids.json` gibt es nicht).
- Der Konvoi-Raum trägt seine `levels` schon seit Story 10.1; `rooms.yaml` ändert sich nicht.
- `equipInto` ist der aus `case 'equip'` herausgezogene Kern (Tausch im Beutel, Zweihänder räumt die andere Hand); Vorlage und „Bestes anlegen“ legen damit an, statt die Regeln zu kopieren.
- Kein Zufall: beide Commands sind reine Reihenfolgen über Uids, Replays bleiben gleich.
- Das Lager (Akt 1) ist Stufe 1: dort gibt es weder Vorlage noch „Bestes anlegen“.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.10]
- [Source: concept/24-architecture/architecture.md §5.10, §5.11, §8.1]
- [Source: _bmad-output/implementation-artifacts/10-9-haendler-der-stufen-2-und-3.md]
- [Source: _bmad-output/implementation-artifacts/10-8-uebungsplatz-und-lagerfeuer-raenge.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Eine Vorlage je Figur, Schlüssel gehören nicht dazu (sie bleiben am Schlüsselring); die Vorlage bleibt nach dem Anlegen erhalten und kann erneut angelegt werden.
- [ASSUMPTION] Übersprungen werden Items anderer Figuren (mit Namen im Toast: „Bei Brenna: Eisenlanze“) **und** Items, die die Figur nicht mehr führen darf (nur der Item-Name); verkaufte Items zählen als „gone“ und erscheinen nicht im Toast.
- [ASSUMPTION] Rüstungsplätze für „Bestes anlegen“ sind Kopf, Körper und Nebenhand, dort nur Rüstung und Schilde (Zubehör in der Nebenhand bleibt liegen); gewinnt eine Zweihandwaffe, bleibt die Nebenhand leer.
- [ASSUMPTION] Der gemeinsame Kern ist `pickBestGear` neben `autoEquip` in `core/battle/create.ts` mit dem geteilten `slotsOf`: `autoEquip` füllt weiter nur freie Plätze, die Rangfolge steht einmal.
- [ASSUMPTION] `convoy_full` wird über einen Trockenlauf auf `clone(c)` geprüft (Validierung und Anwendung rechnen damit gleich); `unknown_unit` ist bei allen drei Commands der erste Fehler.
- [ASSUMPTION] Tasten-Form: Chip-Reihe unter den Ausrüstungsplätzen der Figur-Ansicht (Muster der Loadout-Chips), im Kampf und bei Figuren außerhalb der Truppe nicht sichtbar; das Konvoi-Panel nennt die Wirkungen der Stufen nur als Hinweiszeilen.
- Sichtprüfung im Dev-Build (`__hc.devConvoy(3)`): „Bestes anlegen“ legt Stahllanze und Eisenschild an (VER 7 → 11, Plattenpanzer bleibt liegen, weil der Hauptmann keine schwere Rüstung trägt), Toast „Bestes angelegt“; „Vorlage anlegen“ ist ohne Vorlage grau und wird nach „Als Vorlage speichern“ nutzbar.

### File List

- content/core/balance.yaml, handbook.yaml, locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml
- src/core/campaign/gear.ts (neu), apply.ts, campaign.ts, commands.ts, state.ts, balanceDefs.ts, index.ts, src/core/battle/create.ts
- src/content/schemaBalance.ts
- src/app/screens/Troop.tsx, src/app/screens/Rooms.tsx, src/ui/troop.css, src/app/state/devHooks.ts (`__hc.devConvoy(level)`)
- tests/unit/convoy-levels.test.ts (neu)
- concept/24-architecture/architecture.md, decision-log.md, concept/21-gdd/decision-log.md, concept/25-ux/.decision-log.md

### Change Log

- 2026-11-14: Story umgesetzt (Vorlage speichern und anlegen, „Bestes anlegen“, Stufen-Schwellen, Handbuch, Tests).
