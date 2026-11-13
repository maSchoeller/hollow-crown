# Story 10.6: Verzauberer und Werkstatt

Status: review

## Story

Als Spieler
möchte ich Runen verschmelzen und Verbrauchsgüter aus Material herstellen,
damit Material aus Kopfgeld und Heimsuchungen einen Zweck hat.

## Acceptance Criteria

1. Verschmelzen zur Rune N + 1 nur mit N + 1 ≤ `runeMergeLimit(data, c)` (`economy.enchanterMergeMaxTier: [1, 2, 3]` je Verzauberer-Stufe), sonst `room_locked`; die Taste ist gedimmt mit „ab Verzauberer Stufe n“ und nennt die Kosten aus `runeMerge()` (3 × Rune, ● 200 × N).
2. `insertRune`/`removeRune` gehen auf jeder Verzauberer-Stufe mit jeder Rune.
3. Akt 1: kein Ort zum Einsetzen (Verzauberer `fromAct: 2`); Handbuch `runes` nennt Beute in Akt 1, Einsetzen ab Akt 2, Verschmelzen je Stufe.
4. `content/core/recipes.yaml` mit `recipeSchema`, `RecipeDef`, `GameData.recipes`; `content:check` prüft eindeutige Ids, Item in `items.yaml`/`runes.yaml`, Material `kind: material` mit Bild.
5. Command `{ type: 'craft', recipe }` über `craftCost(data, c, recipeId)`; Events `materialChanged`, `goldChanged` (nur bei Gold > 0), `itemGained`; Fehler `unknown_item`, `room_locked`, `not_enough_materials`, `not_enough_gold`, `convoy_full`.
6. Werkstatt-Panel im Listen-Muster des Händlers; Rezepte höherer Stufen gedimmt; Haupttaste „Herstellen · …“; eigene CSS-Datei.
7. Items `strong_remedy` und `trap_kit` (`craftOnly`, nie beim Händler): Starkes Gegengift heilt alle Zustände und macht bis zum Ende der Gegnerphase immun (Kampf-Info „immun“); Fallen-Set legt eine Falle wie 10.5 mit `source: 'item'`, zählt nicht gegen die 2 des Fallenstellers.
8. Sim: Heimat-Heuristik stellt Feuerbomben her, solange mehr als 4 Eisenerz übrig sind; Kettensimulation zeigt die Materialkurve je Mission. Tests in `tests/unit/workshop.test.ts`; Handbuch `runes` und `workshop`.

## Tasks / Subtasks

- [x] Werte und Schema: `economy.enchanterMergeMaxTier`, `simulation.craftIronOreAbove`, `recipeSchema`/`RecipeDef`/`GameData.recipes`, `ItemUse.statusImmuneRounds`/`trap`, `Buff.statusImmune` (AC 1, 4, 7)
- [x] Inhalt: `recipes.yaml`, Items, Locales DE/EN, Handbuch `runes` (überarbeitet) und `workshop` (neu) (AC 3, 4, 7, 8)
- [x] Kern: `runeMergeLimit`, `mergeLevelFor`, `mergeError`, `openRoomLevel`, `craftCost` in `camp.ts`; Command `craft` (AC 1, 5)
- [x] Kampf: Immunität in `applyStatus`, Fallen-Set als Item-Aktion mit Feld (`item{at}`, `itemTiles`, `trapKitTiles`) (AC 7)
- [x] UI: Verschmelzen-Taste mit Kosten und Sperrgrund, `Workshop.tsx`/`Workshop.css`, Feldwahl für das Fallen-Set, Chip „immun“, Item-Info (AC 1, 6, 7)
- [x] `content:check`: Rezepte, `craftOnly` nicht in Händler-Listen (AC 4, 7)
- [x] Sim: `craftBombs`, Spalte `material`, `spent.craft` (AC 8)
- [x] Tests, Decision-Log, `pnpm check`

## Dev Notes

- Kein neues persistiertes Kampagnenfeld, kein Speicherformat-Wechsel, keine gesperrte ID berührt (`content/released-ids.json` gibt es noch nicht). `Buff.statusImmune` ist optional; Kampfstände laufen nicht über `normalizeCampaign`.
- Die Story nennt für das Fallen-Set eine Aktion „Benutzen“; umgesetzt als vorhandene Kampf-Aktion `item` mit neuem optionalen Feld `at` (wie `trap{at}`), geprüft über `itemTiles` = dieselben freien Felder wie Falle legen (`freeTrapTiles` in `rules/traps.ts`).
- `mergeRunes` prüft jetzt über `mergeError` (Id → höchste Stufe → Verzauberer-Stufe → Runen → Gold); UI und Command lesen dieselbe Funktion. Vorher ging Verschmelzen ohne Raum-Prüfung (auch im Akt-1-Lager per Command).
- Bild `strong_remedy`: vorläufig das Bild der Linderungssalbe (`image: remedy_salve`); `trap_kit.png` lag schon aus dem Item-Katalog vor (`art/prompts/items_all.md`).

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.6]
- [Source: concept/24-architecture/architecture.md §5.7, §8.1, §8.7]
- [Source: _bmad-output/implementation-artifacts/10-5-fallensteller-und-schatten.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Rezept-Mengen und -Preise sowie Ladungen und Preise der zwei Items wie im Epic-Vorschlag übernommen.
- [ASSUMPTION] Starkes Gegengift zielt wie die Hast-Schriftrolle auf die Figur selbst oder einen Nachbarn (`target: ally, rng: [0, 1]`) und ist auch ohne Zustand nutzbar (vorbeugend gegen neue Zustände).
- [ASSUMPTION] Die Immunität ist ein Buff bis zum Ende der Gegnerphase der laufenden Runde (`untilPhase: 'enemy'`); die Phase der Dritten danach zählt nicht mehr dazu.
- [ASSUMPTION] Fallen-Set als Kampf-Aktion `item{at}` statt eigener Aktion; Reichweite aus `use.rng` des Items, sonst alle Regeln der Klassen-Falle.
- [ASSUMPTION] Bild von `strong_remedy` vorläufig `remedy_salve.png`; ein eigenes Bild (ChatGPT, `art/prompts/strong_remedy.md`, licensing §6) steht aus.
- [ASSUMPTION] Sim: Schwelle „mehr als 4 Eisenerz“ als `balance.simulation.craftIronOreAbove`; Materialkurve = Summe aller Material-Einheiten vor der Mission (Spalte `material`).
- [ASSUMPTION] Handbuch `runes` bleibt in der Kategorie „Items“, `workshop` ist neu in „Heimat“; beide nennen Werte als Verweise (`balance.economy.*`, `recipes.*`).
- Rezepte brauchen mindestens ein Material (zusätzliche Prüfung in `validateRecipes`).

### File List

- content/core/balance.yaml, content/core/items.yaml, content/core/recipes.yaml (neu), content/core/handbook.yaml
- content/core/locales/de.yaml, en.yaml, de.items.yaml, en.items.yaml, de.names.yaml, en.names.yaml, de.handbook.yaml, en.handbook.yaml
- src/core/balanceDefs.ts, defs.ts, gameData.ts, state.ts
- src/core/campaign/camp.ts, apply.ts, commands.ts
- src/core/battle/actions.ts, apply.ts, act.ts, commands.ts
- src/core/rules/effects.ts, traps.ts
- src/content/load.ts, schemaBalance.ts, schemaUnits.ts, validateCampaign.ts, validateUnits.ts
- src/app/screens/Rooms.tsx, Workshop.tsx (neu), Workshop.css (neu), BattlePanels.tsx, battleMode.ts, useBattleInput.ts, useBoardOverlays.ts
- src/ui/itemInfo.ts, src/ui/camp.css
- tools/simCampaign.ts, tools/simulate.ts
- tests/unit/workshop.test.ts (neu), campaign-commands.test.ts, sim-acts.test.ts, sim-campaign.test.ts
- concept/24-architecture/decision-log.md

### Change Log

- 2026-11-13: Story umgesetzt (Verschmelzen je Verzauberer-Stufe, Werkstatt mit Rezepten und `craft`, Starkes Gegengift, Fallen-Set, Sim, Handbuch).
