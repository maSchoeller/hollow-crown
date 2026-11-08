<!-- Erstellt mit gds-create-story am 2026-11-08 -->

# Story 10.2: Akademie und Aufstieg mit Glutfunke

Status: review

## Story

Als Spieler
möchte ich ausgewählte Gefährten in der Akademie mit einem Glutfunken auf einen Profi-Weg aufsteigen lassen,
damit die knappe Wahl, wer wächst, ein Moment wird.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-10.md`, Story 10.2 (vollständige Fassung dort). Kurz:

1. `ember_spark` trägt `use: { promote: true, minLevel: 10 }` und ist das einzige Aufstiegs-Item; Architektur §5.11 nennt `kind: seal`.
2. Spielstände des letzten Akt-1-Stands laden ohne Verlust; `promotionGain` (Default `{}`) und `secondPath` (Default `null`) bekommen Defaults in `normalizeCampaign`, keine Migration, Fixture-Test.
3. Raum `academy` (`function: academy`, `fromAct: 2`, `homes: [castle]`) in `rooms.yaml`; in Akt 1 gibt es ihn nicht.
4. `promote` verlangt Stufe ≥ `levels.promoteFrom`, Profi-Weg, offene Akademie und Glutfunke; Fehler `unknown_unit` → `unknown_class` → `not_available` → `not_enough_materials`; Ergebnis Stufe 1, EP 0, `promotionBonus` bis zu den Caps, `promotionGain`, Loadout 5, Events `itemLost` und `promoted { unit, from, to, gain }`.
5. Akademie-Panel (Mockup 08): Glutfunken-Vorrat, Figuren ab Stufe 10 (andere gedimmt mit Grund), Weg-Karten mit Wirkung, Wertgewinn aus `promotionPreview`, Signaturteil-Name; Haupttaste „Aufsteigen · [Glutfunke] 1“.
6. Funken-Moment: `src/ui/Sparks.tsx` aus `Dialogue.tsx` herausgelöst, Bark `ember`.
7. Truppe: Marke und Taste „Aufsteigen“ nur bei offener Akademie; die Taste öffnet das Akademie-Panel mit vorgewählter Figur; die alte Auswahl in `Troop.tsx` entfällt.
8. `changeProPath` (Akademie ≥ 2, 1 500 Gold, Rückrechnung von `promotionGain`, Caps) mit Fehlern `unknown_class` → `not_available` → `not_enough_gold`, Event `proPathChanged`.
9. `learnSecondPath` (Akademie ≥ 3, ein Glutfunke) setzt `secondPath`; dessen `proSkills` zählen in `activeSkillIds`; Fehler `not_available` → `not_enough_materials`; Event `secondPathLearned`; Figur zeigt „Auch: …“.
10. `balance.academy` mit `changePathFromLevel`, `changePathGold`, `secondPathFromLevel`, `secondPathSparks`.
11. Replay deterministisch; `tests/unit/academy.test.ts`; Sim-Heimat-Heuristik steigt mit Glutfunken auf; Handbuch `academy` ↔ `ember_spark`.

## Tasks / Subtasks

- [x] Daten: `items.yaml` (`use`), `rooms.yaml` (`academy`), Raum-Enum, `balance.academy` + `balanceDefs`, `classSchema.proSkills` (optional, Default `[]`; Pflicht erst in 10.3/10.4), Locales (AC 1, 3, 10)
- [x] Kern: `promotionPreview`, `promote` mit `promotionGain`, `otherProPath`, `changeProPath`, `learnSecondPath` in `progression.ts`; `academyLevel`, Fehlerfunktionen und `canPromote(data, c, u)` in `camp.ts`; Commands und Events; `activeSkillIds` (AC 2, 4, 8, 9)
- [x] `normalizeCampaign`: Defaults je Figur (AC 2)
- [x] UI: `Academy.tsx` + `Academy.css`, `Sparks.tsx`, Raum-Dispatch, `Troop.tsx` (Marke, Taste, „Auch:“), Camp-Screen mit Vorwahl, Icon `academy` (AC 5–7, 9)
- [x] Sim-Heuristik, Handbuch, Architektur §5.11 (AC 1, 11)
- [x] Tests: `academy.test.ts`, Migrations-/Fixture-Test, alter Promote-Test angepasst (AC 2, 4, 8, 9, 11)
- [x] `pnpm check`, Akt-1-Sim gegen main, Screenshot 375 × 812

## Dev Notes

- Vorhandener Stand: `promote` (Command, `validateCampaign`, `sealOf`, `promote()` in `progression.ts`) gibt es seit dem PoC; er prüft weder Akademie noch rechnet er `promotionGain`. Der Glutfunke hatte noch kein `use`, ein Aufstieg war im Spiel also nicht möglich; die Akt-1-Sim steigt nie auf.
- **Speicherformat:** Die Story nennt Format 2; auf `main` ist das Format seit der Konzept-Überarbeitung 3 (`SAVE_FORMAT = 3`), die jüngste Fixture ist `tests/fixtures/saves/format3-act1-finale-done.json`. Format bleibt 3, keine Migration, nur Defaults; der Fixture-Test lädt diese Datei.
- „Rolle“ eines Profi-Wegs = die Basis-/Unique-Klasse, deren `proPaths` ihn nennt (`otherProPath`). Avatar (`tactician`) und Lucan (`captain`) haben nur einen Weg, der erst mit 10.3 existiert; `promotionTargets` filtert nicht vorhandene Klassen.
- Die Akademie-Stufe liest `roomLevel(c, 'academy')` nur, wenn der Raum offen ist (`homeRooms`), sonst 0. Stufe 2/3 vor 10.1 nur per Fixture (`c.home.rooms.academy`).
- Kein `if (act >= 2)`: Die Sperre in Akt 1 kommt allein aus `fromAct: 2` und `homes: [castle]`.
- Signaturteil-Name `part.<classId>.name`: Schlüssel für die sechs vorhandenen Profiklassen anlegen; Grafik erst 10.13.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.2]
- [Source: concept/24-architecture/architecture.md §5.11, §8.1, §8.7]
- [Source: concept/25-ux/mockups/08 (Akademie · Aufstieg)]
- [Source: _bmad-output/implementation-artifacts/11-1-akt-uebergang-und-spielstand.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

### Completion Notes List

- Aufstieg nur noch in der offenen Akademie (`academyLevel` über `homeRooms`, `fromAct: 2`, `homes: [castle]`); Akt 1 hat weder Marke noch Taste.
- `promotionPreview` rechnet den Wertgewinn (Caps der neuen Klasse, nie negativ), `promote` und das Panel nutzen ihn; `proPathPreview`/`changeProPath` ziehen `promotionGain` ab, schreiben den neuen Bonus gut und senken Werte über den neuen Caps.
- Fehlerfunktionen `promoteError`, `changePathError`, `secondPathError` in `camp.ts`, geteilt von `validateCampaign` und Panel; `sealOf` zog dorthin.
- **Gefunden und behoben:** `toRecord` (Rückweg aus dem Kampf) und die Ersteller von Figuren übernahmen `promotionGain`/`secondPath` nicht; beide Felder gehen jetzt mit.
- `classSchema.proSkills` (optional, Default `[]`) gibt es schon jetzt, damit `activeSkillIds` eigene und zweite Pro-Skills zählt; Pflicht wird es in 10.3/10.4.
- Speicherformat bleibt 3 (auf `main` gilt 3, nicht 2 wie in der Story): keine Migration, Defaults in `normalizeCampaign`, Test lädt `format3-act1-finale-done.json`.
- Rollen, deren Profi-Wege noch fehlen (Avatar, Lucan, Späher, Spielmann), stehen gedimmt mit „Weg folgt“.
- Akt-1-Sim (`--campaign act1 --runs 50`) gegen `main`: kein Wert bewegt sich um mehr als 0,02.
- Sichtprüfung im Dev-Build bei 375 × 812: Auswahl, Weg-Karten, Funken-Moment, Weg wechseln, zweiter Weg, „Auch: …“ in der Figur, Truppe → Akademie mit Vorwahl.

### File List

- content/core/{balance,items,rooms,handbook}.yaml, content/core/locales/{de,en}{,.handbook}.yaml
- src/content/{schemaBalance,schemaCampaign,schemaUnits}.ts
- src/core/{balanceDefs,defs,state,storyDefs}.ts, src/core/rules/{progression,skills}.ts, src/core/campaign/{apply,camp,campaign,commands}.ts, src/core/battle/create.ts
- src/app/screens/{Academy.tsx,Academy.css,Rooms.tsx,Camp.tsx,Troop.tsx}, src/app/App.tsx, src/app/state/screen.ts
- src/ui/{Sparks.tsx,Sparks.css,Dialogue.tsx,Dialogue.css,icons.tsx}
- tools/simCampaign.ts
- tests/unit/{academy,camp,campaign-commands,m1-8,migrations}.test.ts
- concept/24-architecture/architecture.md (§5.11)

### Change Log

- 2026-11-08: Story umgesetzt, Status review.
