# Story 10.12: Söldner-Traits

Status: review

## Story

Als Spieler
möchte ich, dass Söldner aus der Taverne Eigenheiten haben und eine ausgebaute Taverne bessere bringt,
damit die Wahl zwischen Angeboten mehr ist als der Preis.

## Acceptance Criteria

1. `content/core/traits.yaml` mit Schema `traitSchema` (`{ id, kind: good | bad, effect?, hireCostPct? }`, `effect` sind die Bausteine passiver Skills) und genau sieben Traits: `tough` (`stats: { hp: 4 }`), `nimble` (`stats: { spd: 2 }`), `veteran` (`stats: { skl: 2, lck: 2 }`), `elemental_child` (`stats: { mag: 2, res: 2 }`), `greedy` (`hireCostPct: 25`), `coward` (`stats: { str: -2, mov: 1 }`), `clumsy` (`stats: { skl: -2 }`, `hitBonus: -5`). Namen und Wirkungstexte als `trait.<id>.name|desc` in DE und EN; `pnpm content:check` prüft Ids, Art und Texte.
2. `balance.economy.tavern.traitCount: [1, 2]` und `goodTraitChanceByLevel: [50, 75, 75]`: `refreshTavern` gibt jedem Angebot 1–2 **verschiedene** Traits, jeder Platz mit der Wahrscheinlichkeit der Taverne-Stufe aus den guten, sonst aus den schlechten. Alles aus `c.rng` in fester Reihenfolge (Stufe, Name, Trait-Zahl, dann je Platz Art und Trait), Replays bleiben gleich.
3. `UnitRecord.traits` (Default `[]`) hält die Traits; sie wirken als passive Bausteine in `skillTotals`/`computeStats` und damit gleich in Kampf, Vorschau, Truppe und Simulation. Story-Gefährten bekommen keine Traits.
4. `hireCost(data, offer)` rechnet `hireCostPct` aller Traits auf (Gierig: 25 % teurer, aufgerundet); Angebotszeile, Taste und das Command `hire` nennen und buchen denselben Betrag.
5. Das Taverne-Panel zeigt je Angebot die Traits als Marken (gute grün, schlechte rot) mit Namen; ein Tippen auf eine Marke öffnet die Wirkung als Info. Die Truppe zeigt die Traits einer Figur in derselben Form.
6. Alte Spielstände ohne das Feld laden: `normalizeCampaign` setzt `traits: []` für Truppe und Taverne, `toRecord` trägt die Traits über eine Mission hinweg weiter.
7. `tests/unit/traits.test.ts` deckt ab: Zahl der Traits je Angebot, Verteilung gut/schlecht je Taverne-Stufe über einen festen Seed, keine doppelten Traits je Angebot, Wirkung jedes Traits über `computeStats`, Gierig im Preis und im Command, Laden eines Spielstands ohne Feld, gleiches Ergebnis im Replay.
8. Der Handbuch-Eintrag `tavern` nennt die Traits mit Wirkung und die Stufen-Wahrscheinlichkeit; `rooms_upgrade` verweist darauf.

## Tasks / Subtasks

- [x] Inhalt: `content/core/traits.yaml`, `traitSchema`, Laden in `GameData.traits`, Querprüfung, `balance.economy.tavern.traitCount|goodTraitChanceByLevel`, Locales DE/EN, Handbuch `tavern` (AC 1, 2, 8)
- [x] Kern: `UnitRecord.traits`, Ziehung in `makeOffer`, Trait-Wirkung in `skillTotals`, `hireCost(data, offer)`, Default in `normalizeCampaign` und `toRecord` (AC 2–4, 6)
- [x] UI: Trait-Marken im Taverne-Panel und in der Truppe, Preis mit Aufschlag (AC 4, 5)
- [x] Tests, Architektur §5.11, Decision-Logs (Architektur, GDD, UX), `pnpm check` (AC 7)

## Dev Notes

- Kein Speicherformat-Wechsel: `traits` bekommt `[]` in `normalizeCampaign` (Muster `gearTemplate`, `heritage`). Keine gesperrte ID berührt (`content/released-ids.json` gibt es nicht).
- Die Wirkung läuft über denselben Weg wie Skills: der Baustein-Block von `skillTotals` wird zu einem Helfer, den Skills und Traits füttern. Damit rechnen Kampf, Vorschau (`forecast`) und `pnpm sim` ohne weitere Stelle mit.
- Traits landen nicht in `SkillTotals.used` (das ist die Liste der Skill-Ids für die Vorschau-Zeile).
- `coward` gibt absichtlich `mov: 1` – der Feigling läuft schneller weg; `mov` ist ein Mod in `StatMods`, den `computeStats` über `mods.mov` liest.
- Zufall nur in `makeOffer` über `c.rng`, direkt nach dem Namen; `refreshTavern` zieht den Ersatz der Wunschrolle (Story 10.11) damit ebenfalls mit Traits.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.12]
- [Source: concept/24-architecture/architecture.md §5.10, §5.11, §8.1]
- [Source: _bmad-output/implementation-artifacts/10-11-taverne-heiler-und-schmied-der-stufen-2-und-3.md]
- [Source: _bmad-output/implementation-artifacts/10-10-konvoi-der-stufen-2-und-3.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Werte und Wahrscheinlichkeiten wie im Epic vorgeschlagen (`traitCount: [1, 2]`, `goodTraitChanceByLevel: [50, 75, 75]`); Stufe 3 bringt statt noch besserer Traits die Wunschrolle aus Story 10.11.
- [ASSUMPTION] Der Preisaufschlag wird aufgerundet (`Math.ceil`) und addiert sich, falls je mehrere Traits `hireCostPct` tragen; `hireCost` nimmt dafür die Einheit statt der Stufe.
- [ASSUMPTION] Traits laufen ohne Bedingung und Auslöser durch `addEffect` und landen nicht in `SkillTotals.used` – die Liste bleibt die Skill-Liste der Kampfvorschau.
- [ASSUMPTION] Hat ein Angebot zwei Plätze und ist die passende Art erschöpft (nur drei schlechte Traits), bleibt der zweite Platz leer, statt aus der anderen Art nachzuziehen.
- [ASSUMPTION] Form: Marken unter der Ausrüstungszeile eines Angebots (gut grün, schlecht rot, Wirkung als Info am Chip), für das gewählte Angebot zusätzlich je eine Hinweiszeile „Name: Wirkung“ unter der Liste; dieselben Marken in der Truppe-Zeile und in der Figur-Ansicht unter den Skills.
- Nebenbefund behoben: `toRecord` trug `gearTemplate` (Story 10.10) nicht über eine Mission – die gespeicherte Vorlage ging nach jedem Kampf verloren; sie wird jetzt mitgenommen wie `traits`.
- Der Effekt-Block von `skillSchema` ist als `skillEffect` herausgezogen, damit Traits dieselben Bausteine nutzen; die Wirkung läuft über den neuen Helfer `addEffect` in `skillTotals`, also über denselben Weg wie Skills (Kampf, Vorschau, Truppe, `pnpm sim`).
- Sichtprüfung im Dev-Build (`__hc.devRooms(2, 'tavern')`): Angebote tragen eine oder zwei Marken, „Osric“ mit `Greedy`/`Nimble` kostet ● 2.813 statt ● 2.250, die Hinweiszeilen nennen „Greedy: Hiring costs 25 % more“ und „Nimble: +2 SPD“, nach dem Anheuern steht Gold 12.000 → 9.187 und die Figur-Ansicht zeigt beide Marken. Lautstärkeregler gibt es im Optionen-Menü noch nicht (Audio ist noch nicht gebaut), es war nichts stummzustellen.

### File List

- content/core/traits.yaml (neu), balance.yaml, handbook.yaml, locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml
- src/content/schemaUnits.ts (`skillEffect`, `traitSchema`), schemaBalance.ts, load.ts, validateUnits.ts (`validateTraits`), validateLocales.ts
- src/core/defs.ts (`TraitDef`), gameData.ts, state.ts (`UnitRecord.traits`), storyDefs.ts, rules/skills.ts (`addEffect`), campaign/camp.ts (`hireCost`, `goodTraitChance`, `traitsOfKind`), campaign/campaign.ts (`rollTraits`, `normalizeCampaign`, `toRecord`), campaign/apply.ts, battle/create.ts
- src/app/screens/Rooms.tsx, Troop.tsx, src/ui/components.tsx (`TraitChips`), src/ui/pieces.css
- tools/simCampaign.ts
- tests/unit/traits.test.ts (neu), tests/unit/camp.test.ts, tests/unit/sim-campaign.test.ts
- concept/24-architecture/architecture.md, decision-log.md, concept/21-gdd/decision-log.md, concept/25-ux/.decision-log.md

### Change Log

- 2026-11-14: Story umgesetzt (sieben Traits in `traits.yaml`, Ziehung je Angebot nach Taverne-Stufe, Wirkung über `computeStats`, Preisaufschlag, Marken in Taverne und Truppe, Handbuch-Eintrag `tavern`, Tests).
