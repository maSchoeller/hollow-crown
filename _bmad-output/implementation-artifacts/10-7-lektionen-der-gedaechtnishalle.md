# Story 10.7: Lektionen der Gedächtnishalle

Status: review

## Story

Als Spieler
möchte ich einmal je Akt das Erbe eines Gefallenen als Lektion an einen Gefährten weitergeben,
damit Verlust Bedeutung behält.

## Acceptance Criteria

1. Bezeichner `heritage` (Skill-`source: heritage`, Ids `heritage_*`, `content/core/heritage.yaml`, Command `inheritHeritage`, Event `heritageInherited`, Felder `heritage`/`heritageGiven`); sichtbar „Lektion“; Handbuch-Kategorie `lessons` unberührt.
2. `heritage.yaml` (`- { role, lessons: [fest, zweite] }`): jede der 7 Kernrollen genau zwei Lektionen, jede passiv mit `source: heritage` und Namen/Text DE/EN; Gerrits Stein trägt `heritage: heritage_shield_wall`. Werte der 14 Lektionen nach der Epic-Tabelle `[ASSUMPTION]`.
3. Ab Akt 2 (`unlocks: lessons` im Raum `memorial`) `inheritHeritage{from, to, skill}`: Stein (gefallen mit Klasse oder fest mit `heritage`), der noch nie vererbt hat; Empfänger lebender Story-Gefährte ohne Lektion (Avatar, Lucan ja, Söldner nein); je Akt `balance.memorial.heritagePerAct`.
4. Je Hallen-Stufe (`heritageChoiceByLevel: [fixed, role, all]`): feste Lektion, eine der zwei der Rolle (Gerrit: nur seine), jede der 14.
5. Danach `UnitRecord.heritage = { skill, from }` (Default `null`), `c.heritageGiven` (Default `[]`) bekommt `{ act, from, to, skill }`, Event `heritageInherited`; Fehler in Reihenfolge `unknown_unit`, `not_available`, `unknown_choice`.
6. Die Lektion wirkt immer wie ein passiver Skill (`activeSkillIds`) ohne Loadout-Platz in Kampf, Vorschau, KI und Simulation; die Truppe zeigt „Lektion · von Fenn: …“; fällt die Figur, geht die Lektion mit ihr.
7. Panel der Gedächtnishalle: Stein (1), Zeile „Lektion vererben: …“ mit Lektionswahl (ab Stufe 2) und Empfängern (2), ruhige Taste (3); oben „1× in Akt 2“; danach „In Akt 2 vergeben: Fenn → Tobin“, Glutmarke am Stein; Gedenk-Stil.
8. Vererben nicht nachholbar (nur `c.act`), Lektionen bleiben über Akte, alte Stände laden mit Defaults; `tests/unit/heritage.test.ts`; Handbuch `heritage` (Heimat, `fromAct: 2`); Architektur §5.10/§5.11 nennen `heritage.yaml`.

## Tasks / Subtasks

- [x] Inhalt: `heritage.yaml`, 14 Skills in `skills.yaml`, Gerrit `heritage`, `balance.memorial`, Locales DE/EN (Skills, Panel, Truppe, Fehler `unknown_choice`), Handbuch `heritage` (AC 1, 2, 8)
- [x] Schema und Prüfung: `heritageSchema`, `GameData.heritage`, `memorialSchema.heritage`, `source: heritage`, `validateHeritage` (AC 2)
- [x] Kern: `core/campaign/heritage.ts` (`heritageLevel`, `heritageChoices`, `stoneRole`, `heritageReceivers`, `heritageStone`, `heritageError`), Command und Event, Felder mit Defaults in `normalizeCampaign`/`newCampaign`/`toRecord`, `activeSkillIds` (AC 3–6, 8)
- [x] UI: `Memorial.tsx`/`Memorial.css` (Gedächtnishalle aus `Rooms.tsx` herausgelöst), Zeile in der Truppe (AC 6, 7)
- [x] Tests, Architektur §5.10/§5.11, Decision-Logs (Architektur, UX), `pnpm check`

## Dev Notes

- Kein Speicherformat-Wechsel: `UnitRecord.heritage` und `CampaignState.heritageGiven` bekommen ihre Defaults in `normalizeCampaign` (Architektur §8.7); `content/released-ids.json` gibt es noch nicht, keine gesperrte ID berührt.
- `from` ist der Schlüssel des Gedenksteins aus `memorialStones` (`fixed:gerrit`, `fallen:<unit id>`), damit feste Steine und Gefallene nicht kollidieren und die Herkunft („von Fenn“) aus dem Stein gelesen wird.
- Die Freischaltung kommt aus den Daten (`rooms.yaml`, `unlocks: lessons` mit `{ act: 2 }`), kein `if (act >= 2)` im Code. Die Hallen-Stufe liest `openRoomLevel`.
- Battle-Startzustände ändern sich nicht (Gegner-Records bleiben ohne `heritage`); Spielerfiguren tragen das Feld über `battleUnitFromRecord` (Kopie des Records).

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.7]
- [Source: concept/24-architecture/architecture.md §5.10, §5.11, §8.1, §8.7]
- [Source: _bmad-output/implementation-artifacts/10-6-verzauberer-und-werkstatt.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Werte und Namen der 14 Lektionen wie in der Epic-Tabelle; „+2 WID“ als `res` („+2 RES“), „Weiter Blick“ nur beim eigenen Angriff ab Abstand 2 (Trigger `on_attack` wie `paid_in_full`), „Zäh“ (EN „Hardy“) als +3 max. TP.
- [ASSUMPTION] `from` im Command ist der Stein-Schlüssel (`fixed:<id>` / `fallen:<id>`).
- [ASSUMPTION] Die Rolle eines festen Steins ist die Rolle seiner Lektion in `heritage.yaml`; Gefallene ohne Klasse oder mit Taktiker-/Hauptmann-Rolle haben keine Lektion (`not_available`).
- [ASSUMPTION] Ein unbekannter Stein gilt als `not_available` (die Story nennt keinen eigenen Code).
- [ASSUMPTION] Stufe 3 erlaubt auch bei Gerrit alle 14 (wie in der Story als Annahme vorgegeben).
- [ASSUMPTION] Panel-Gestalt (Chips mit Glutrand, Zeile ohne Genitiv „„Leichter Schritt“ von Fenn an …“, Glutpunkt am Stein, Truppe ohne Doppelnennung) im UX-Decision-Log.
- Simulation: Die Heimat-Heuristik vererbt keine Lektionen (die Story verlangt nur, dass eine Lektion dort wirkt; das tut sie über `activeSkillIds`). Für 11.27 offen.

### File List

- content/core/heritage.yaml (neu), skills.yaml, balance.yaml, handbook.yaml, content/acts/act1/memorials.yaml
- content/core/locales/de.yaml, en.yaml, de.names.yaml, en.names.yaml, de.handbook.yaml, en.handbook.yaml
- src/core/campaign/heritage.ts (neu), memorial.ts, apply.ts, commands.ts, campaign.ts
- src/core/balanceDefs.ts, defs.ts, gameData.ts, state.ts, storyDefs.ts, index.ts, rules/skills.ts
- src/content/load.ts, schemaBalance.ts, schemaCampaign.ts, schemaUnits.ts, validateUnits.ts
- src/app/screens/Memorial.tsx (neu), Memorial.css (neu), Rooms.tsx, Troop.tsx
- tests/unit/heritage.test.ts (neu)
- concept/24-architecture/architecture.md, decision-log.md, concept/25-ux/.decision-log.md

### Change Log

- 2026-11-13: Story umgesetzt (Lektionen in `heritage.yaml`, Command `inheritHeritage`, Panel der Gedächtnishalle, Truppen-Zeile, Handbuch).
