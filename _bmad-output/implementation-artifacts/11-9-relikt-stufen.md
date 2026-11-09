---
baseline_commit: e9ed729
---
# Story 11.9: Relikt-Stufen

Status: review

## Story

Als Spieler
möchte ich, dass Relikte mit der Geschichte erwachen,
damit besondere Fundstücke mit dem Akt mitwachsen.

## Acceptance Criteria

1. **Schema:** Ein Item kann `stages: [ { when, image, statMods?, skills? } ]` tragen. Stufe 1 (schlafend) ist das Item selbst; `stages[0]` ist Stufe 2 (erwachend), `stages[1]` Stufe 3 (erwacht). `when` ist eine Bedingung oder Liste im vorhandenen Format (`conditionsSchema`, Architektur §5.3), `image` ist Pflicht, `statMods` ersetzt die `statMods` des Items, `skills` sind passive Skills, die zusätzlich zu `grantsSkill` wirken, solange das Relikt angelegt ist (kein Meistern nötig). `grantsSkill`, Slot, Gruppe, Gewicht, Preis und Tags ändern sich nicht. Ersetzen statt Addieren der `statMods` `[ASSUMPTION]`.
2. **Stufe als reine Funktion:** `relicStage(data, ctx, defId)` in `src/core/rules/relics.ts` liefert 1 + Zahl der aufeinanderfolgenden erfüllten `when` (ab `stages[0]`), ausgewertet mit `evalConditions` gegen `ConditionContext`. Nichts davon wird am Item, an der Einheit oder in der Kampagne gespeichert; ein Relikt, das nach dem Story-Punkt erhalten wird, zeigt sofort die erreichte Stufe (items.md §5).
3. **Kampf:** `battleSkeleton` (`src/core/battle/setup.ts`) schreibt `BattleState.relicStages?: Record<itemId, number>` (nur Relikte mit Stufe ≥ 2) aus `conditionContext(data, c)`, wie `lieutenantPlan`/`locked`/`positionLevel`; `applyCommand`, KI-Worker, Replay, `pnpm report` und Simulation brauchen keine Kampagne. Fehlt das Feld (alter laufender Kampf), gilt Stufe 1 bis zum nächsten Kampf `[ASSUMPTION]`; kein Formatwechsel, keine Migration (SAVE_FORMAT bleibt 3).
4. **Ein Zugang, Vorschau = Auflösung:** `stagedItemDef(data, inst, rc)` liefert die Item-Sicht mit eingerechneter Stufe; `itemStatMods`, `activeSkillIds` (damit Auren in `addAuras`, `computeStats`, `statsAt`, `forecast` und die Auflösung) lesen nur darüber. Der Stufen-Parameter `rc: RelicCtx | null` (`{ relicStages?: Record<string, number> }`, im Kampf der `BattleState`) ist **nicht optional**, damit TypeScript jede Aufrufstelle zur Entscheidung zwingt; Lager/Laden/Truppe übergeben die aus der Kampagne berechneten Stufen.
5. **Inhalte:** `pact_warden_shield` bekommt `stages: [ { when: { completed: m1_6 }, image: pact_warden_shield_2, … } ]` mit der Wirkung aus Frage 1 (PO 2026-11-09: `statMods { def: 5 }` und Skill `warden_ward_awake`, Aura Radius 1, RES +2). `dragon_ember` neu im Relikte-Block von `content/core/items.yaml`: `kind: accessory, slot: accessory, statMods: { mag: 2 }, wt: 0, rarity: legendary, price: 0, tags: [unsellable], image: dragon_ember_1`, ohne `grantsSkill` und ohne `stages` (Stufen ab `completed m2_8` trägt 11.19 ein; PO 2026-11-09: Stufe 1 nur MAG +2). Id `pact_warden_shield` bleibt unverändert (mit 9.14 gesperrt); neue IDs (`dragon_ember`, `warden_ward_awake`) werden vor dem Merge endgültig gewählt.
6. **Sichtbar:** Item-Bild (`ItemImage`, `ItemChip`, `itemImageSrc`), Item-Blatt (`itemInfo`: Werte, Skills, Beschreibung) und Skill-Listen (`Troop.tsx`, `BattlePanels.tsx`) zeigen die aktuelle Stufe: Bild der Stufe, Werte der Stufe, zusätzlicher Skill, Beschreibung `item.<id>.stage<n>.desc` (fehlt sie, gilt `item.<id>.desc`) und eine Stufenzeile „Schlafend / Erwachend / Erwacht“ (`ui.relic.stage.1|2|3`), DE und EN. Relikte (Items mit `stages` oder Tag `relic`) bekommen den Relikt-Rahmen mit Krone aus DESIGN.md (`rarity-relic`, in `pieces.tsx` schon vorbereitet; PO 2026-11-09: Gold mit Glutorange, hohle Krone statt Rauten, plus Stufenzeile). Ladeplan (`src/app/loading/plan.ts`) lädt das Bild der aktuellen Stufe bzw. alle Stufenbilder eines Relikts vor.
7. **content:check:** `stages` nur mit Bedingungen, die `validateConditions` kennt (Knoten, Flags …), `image` jeder Stufe existiert in `art/items/`, `skills` existieren und sind `trigger: passive`, höchstens 2 Stufen; Prüfung in eigener Datei `src/content/validateRelics.ts`, ein Aufruf in `validate.ts`.
8. **Akt-1-Spielstand:** Ein Spielstand aus dem Akt-1-Release (`tests/fixtures/saves/format3-act1-finale-done.json`, `m1_6` erledigt) mit Schild zeigt ohne Migration sofort Stufe 2 (Lager-Werte, Item-Blatt, Kampfstart).
9. **Tests:** `tests/unit/relic-stages.test.ts`: Stufe vor/nach `completed m1_6`; Erhalt nach dem Story-Punkt ⇒ sofort Stufe 2; `relicStages` im Startzustand, Replay identisch; fehlendes Feld ⇒ Stufe 1; Vorschau (`forecast`) = Auflösung für Träger und Nachbarn auf Stufe 2 (Werte, Aura); Fixture-Spielstand aus AC 8; `content:check`-Fehler für unbekannte Bedingung, fehlendes Bild, nicht-passiven Skill. `tests/unit/warden-shield.test.ts` bleibt grün (Stufe 1).
10. **Abschluss:** `pnpm check` grün; Coverage `src/core` sinkt nicht; Architektur §5.3 bekommt „Stand (Story 11.9)“ (Bedingungen an Item-Stufen, Snapshot im Kampf); Decision-Log `concept/21-gdd/decision-log.md` mit den PO-Antworten; Bild 375 × 812 vom Item-Blatt des Schilds auf Stufe 2; `pnpm sim --campaign act1 --runs 50 --seed 1` gegen Baseline verglichen und die Abweichung (Missionen nach 1-6) im Story-Bericht genannt.

## Tasks / Subtasks

- [x] Schema und Typen (AC 1): `stages` in `src/content/schemaUnits.ts` (Item-Schema, `conditionsSchema` aus `schemaConditions.ts`); `ItemStage`/`ItemDef.stages` in `src/core/defs.ts`; `BattleState.relicStages?` in `src/core/state.ts`.
- [x] Kern (AC 2–4): `src/core/rules/relics.ts` (`relicStage`, `relicStagesOf(data, ctx)`, `stagedItemDef`, Typ `RelicCtx`); `itemStatMods` (`src/core/rules/items.ts`) und `activeSkillIds` (`src/core/rules/skills.ts`) mit Pflichtparameter `rc`; alle ~25 Aufrufer anpassen (`stats.ts`, `skills.ts` inkl. `addAuras`, `effects.ts`, `scout.ts`, `battle/act.ts`, `actions.ts`, `apply.ts`, `campaign/apply.ts`, `camp.ts`); `battleSkeleton` schreibt `relicStages`; Export über `src/core/index.ts`.
- [x] Inhalte (AC 5): `pact_warden_shield.stages`, `dragon_ember`, ggf. Skill `warden_ward_awake` in `content/core/skills.yaml`; Namen/Beschreibungen in `content/core/locales/{de,en}.names.yaml` und `{de,en}.items.yaml`; Kommentar am Relikte-Block in `items.yaml` aktualisieren.
- [x] UI (AC 6): `src/ui/pieces.tsx` (`ItemImage`/`ItemChip`/`itemImageSrc` mit optionalem `stages`), `src/ui/itemInfo.ts`, `src/ui/components.tsx`, `src/app/screens/{Troop.tsx,BattlePanels.tsx}`, `src/app/loading/plan.ts`; Stufen außerhalb des Kampfes über ein `computed` in `src/app/state/session.ts` (aus `campaign.value`), im Kampf aus `BattleState.relicStages`; Locales `ui.relic.stage.*`.
- [x] content:check (AC 7): `src/content/validateRelics.ts`, Aufruf in `validate.ts`.
- [x] Tests, Fixture-Prüfung, Coverage, Sim-Vergleich, Bild (AC 8–10).
- [x] Architektur §5.3 „Stand (Story 11.9)“, Decision-Log.

## Dev Notes

- **Quellen:** Epic 11 Story 11.9 (Z. 246–259) und Kopf (Z. 1–49); `concept/21-gdd/items.md` §5 (drei Stufen schlafend → erwachend → erwacht, „Jede Stufe schaltet eine Fähigkeit frei und ändert das Icon. Ist der Story-Punkt beim Erhalt schon erreicht, erwacht die Stufe sofort.“; Schild erwachend bei 1-6, erwacht bei 2-8; Drachenglut erwachend bei 2-8, erwacht bei 3-6); Architektur §5.3 (Bedingungen, `conditionContext`, „der Kampf kennt die Kampagne zur Laufzeit nicht“), §8.2/§8.3/§8.7 (Vorschau = Auflösung, neue Felder mit Default).
- **Heute:** `itemDef(data, inst)` (`src/core/rules/items.ts:7`) ist ein reiner Lookup; `itemStatMods(data, inst)` (Z. 200) und `activeSkillIds(data, unit)` (`skills.ts:27`) kennen weder Kampf noch Kampagne. `warden_ward` ist ein Aura-Skill (`content/core/skills.yaml:102`), gesammelt in `addAuras` (`skills.ts:280 ff.`, braucht `ctx.state`). `computeStats(data, unit, ctx)` (`stats.ts:38`) ruft `itemStatMods` ohne Kontext; `ctx.state` ist im Kampf vorhanden. Vorbild für einen Kontext-Parameter: Runen (`RuleCtx = { locked? }`, `items.ts:85`, Story 9.6: im Kampf der Zustand, in Lager/Laden ohne).
- **Warum Snapshot im Kampf:** `completed` ändert sich nur in `finishMission`, also nie während eines Kampfes. Der Startzustand ist Teil des Spielstands (`save.ts:24`, `battle.start`), Replays laufen ohne Kampagne. Derselbe Weg wie `lieutenantPlan` und `requires` (Story 9.5, 11.10).
- **Warum Pflichtparameter:** 25 Aufrufstellen von `itemStatMods`/`activeSkillIds`; eine vergessene Stelle hieße Vorschau ≠ Auflösung oder KI ≠ Regel. Kein `?`-Parameter.
- **Zu bewahren:** Items ohne `stages` bitgleich (`stagedItemDef` gibt das Original zurück); kein neuer RNG-Zug, keine neue Event-Art; `grantSp`/Meistern von `warden_ward` unverändert; `warden-shield.test.ts` grün.
- **Bilder:** `art/items/pact_warden_shield_1|2|3.png` und `dragon_ember_1|2|3.png` existieren und sind abgenommen (`art/prompts/items_all.md`, Chat 7; `_3` des Schilds war die Formvorlage). Keine neuen Bilder nötig; `pnpm art:build` baut alle `art/items/*.png` (`tools/art/build.py: build_items`), `content/packs.yaml` liefert `items/**` im Kern-Paket. PNGs liegen in LFS: vor Sichtprüfung `git lfs pull`.
- **Akt-1-Balance:** Stufe 2 ab `completed m1_6` wirkt in Akt 1 (1-7, 1-8, N3 und spätere Nebenquests); die Akt-1-Simulation weicht deshalb ab, wenn der Schild in der Sim-Truppe getragen wird. Werte daher klein halten und Abweichung berichten (9.14 stimmt Akt 1 ab).
- **[ASSUMPTION] Stufenregel:** aufeinanderfolgend gezählt (Stufe 3 nur, wenn auch Stufe 2 gilt); `statMods` der Stufe ersetzt (nicht addiert), damit das Item-Blatt eindeutige Werte zeigt.
- **[ASSUMPTION] Alter laufender Kampf ohne `relicStages`:** Stufe 1 bis zum nächsten Kampf (statt beim Laden nachzurechnen), weil der Startzustand unverändert bleiben soll.
- **PO-Entscheidung 2026-11-09, Drachenglut:** Werte nach Epic (MAG +2), sonst wie der Schild (legendary, Preis 0, unverkäuflich, kein Skill auf Stufe 1, wt 0 wie die übrigen Accessoires). Die Truhe in N5 legt 11.21 an (`s2_n5_mine.yaml`: `c_ember`).
- **PO-Entscheidung 2026-11-09, Stufe 2 des Schilds:** Frage 1 A, wirkt schon in Akt 1 (Frage 3 A); hält „Schutz für Nachbarn“ (items.md) und lässt „Halten ohne Vorkämpfer-Rolle“ für Stufe 3 (11.19).

### Fragen an den Product Owner (beantwortet 2026-11-09, jeweils A; GDD-Decision-Log)

1. **Wirkung Stufe 2 des Schilds:** A) VER 4 → 5 und zweite Aura `warden_ward_awake` (Nachbarn +2 WID) – **gewählt (PO 2026-11-09)**; B) `warden_ward` stärker (+3 VER statt +2) ohne neuen Skill; C) Aura-Radius 2; D) schon jetzt „Halten“ (Vorkämpfer-Aktion) für jeden Träger.
2. **Drachenglut Stufe 1:** A) MAG +2, sonst wie oben (legendary, Preis 0, unverkäuflich, kein Skill) – **gewählt (PO 2026-11-09)**; B) zusätzlich Feuer-Resistenz klein (Brandschutz schon schlafend); C) MAG +2 und RES +1.
3. **Akt-1-Wirkung:** A) Stufe 2 gilt schon in Akt 1 ab 1-6 wie im Epic, Abweichung der Sim berichten – **gewählt (PO 2026-11-09)**; B) Stufe 2 erst mit `act: 2` (Schild erwacht beim Akt-Übergang), Akt 1 bleibt bitgleich.
4. **Darstellung:** A) Relikt-Rahmen mit Krone (DESIGN.md `rarity-relic`) plus Stufenzeile im Item-Blatt – **gewählt (PO 2026-11-09)**; B) Rahmen legendär wie bisher, nur Bild und Stufenzeile wechseln.
5. **Erwachen sichtbar machen:** A) kein eigener Hinweis, man sieht es am Bild/Blatt – **gewählt (PO 2026-11-09)**; B) Toast/Folgen-Karte „Schild der Paktwächter erwacht“ nach der Mission (neue Event-Art, später nachrüstbar).

### Project Structure Notes

- Neu: `src/core/rules/relics.ts`, `src/content/validateRelics.ts`, `tests/unit/relic-stages.test.ts`.
- Geändert: `src/core/{defs.ts,state.ts,index.ts}`, `src/core/rules/{items.ts,skills.ts,stats.ts,effects.ts,scout.ts}`, `src/core/battle/{setup.ts,act.ts,actions.ts,apply.ts}`, `src/core/campaign/{apply.ts,camp.ts}`, `src/content/{schemaUnits.ts,validate.ts}`, `src/ui/{pieces.tsx,itemInfo.ts,components.tsx}`, `src/app/screens/{Troop.tsx,BattlePanels.tsx}`, `src/app/loading/plan.ts`, `src/app/state/session.ts`, `content/core/{items.yaml,skills.yaml}`, `content/core/locales/{de,en}.{names,items,yaml}`, `concept/24-architecture/architecture.md` §5.3, `concept/21-gdd/decision-log.md`.
- Dateizuständigkeit (Epic-Kopf): Relikte-Block in `items.yaml` gehört zum Kern (Story 9.11), Änderung nur dort und im Akt-2-Block; `src/core/rules/skills.ts`/`items.ts` werden von Epic 10 (10.2–10.4) parallel berührt: nur Signaturen und Aufrufe ändern, keine Umbauten.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code (DE/EN-Schlüssel); Code englisch, Konzept deutsch.
- `src/core` ohne DOM/Babylon/`Math.random`/`Date.now`; State Plain-JSON, keine `undefined` mit Bedeutung (fehlendes `relicStages` = keine erwachten Relikte).
- Kampfvorschau ruft denselben Formelcode wie die Auflösung.
- Kein `content:lock` vor 9.14; Speicherformat unverändert (AGENTS.md „Akt-Release“ 3 greift nicht).
- Fertig erst mit `pnpm check`; Coverage `src/core` nicht senken; Bild bei 375 × 812; Spiel in der Vorschau stumm.

### References

- [Source: concept/26-epics/epics/epic-11.md#Story 11.9: Relikt-Stufen]
- [Source: concept/21-gdd/items.md#5. Relikte]
- [Source: concept/24-architecture/architecture.md#5.3 Bedingungen und Wirkungen (AR3)]
- [Source: concept/24-architecture/architecture.md#8.7 Konsistenzregeln]
- [Source: content/core/items.yaml Relikte-Block (pact_warden_shield)]
- [Source: content/acts/act1/maps/n2_wachturm.yaml c_relic]
- [Source: src/core/rules/items.ts itemDef/itemStatMods, src/core/rules/skills.ts activeSkillIds/addAuras, src/core/battle/setup.ts battleSkeleton]
- [Source: art/prompts/items_all.md Chat 7]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (zwei Sessions: Umsetzung, dann Abschluss nach den PO-Antworten)

### Debug Log References

- `pnpm check` grün (152 Testdateien, 1783 Tests), `pnpm test:coverage` grün (Sperrklinken unverändert).
- `pnpm sim --campaign act1 --runs 50 --seed 1 --json` gegen origin/main (e9ed729): `sim:diff` „no value moved by more than 0.02“ – bitgleich, weil die verkettete Sim-Kampagne die Nebenquest N2 nicht spielt und der Schild nie in die Truppe kommt. Einzelkarten m1_7/m1_8 (`--seed 1`) ebenso ohne Abweichung. Die Stufe 2 wirkt in Akt 1 also nur für Spieler, die N2 spielen; Abstimmung in 9.14.
- Mit Schildträger (Lucan trägt den Schild vorübergehend ab Start, nur für den Lauf; Stufe 1 = `stages` entfernt vs. Stufe 2), `--runs 50 --seed 1 --fresh`: m1_7 Siegquote 0 % / 0 % (frische Truppe), Ausfälle 3,92 → 3,88 je Lauf; m1_8 Siegquote 96 % / 96 %, Runden p50 13 / 13, Ausfälle 5,10 → 5,06 je Lauf (Varek 42 → 39). Verkettet (`--seed 1`, 9 bzw. 8 Ankünfte) keine Abweichung. Wirkung der Stufe 2 in Akt 1 also klein.
- `pnpm sim --campaign act2 --runs 50`: Akt 1 46/50 durch, Übergang mit Armee-Stufe 12,0 und 6 022 Gold; m2_1–m2_8 übersprungen (noch keine spielbaren Karten).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Kern: `src/core/rules/relics.ts` (`stagedItemDef`, `stageSkills`, `relicStageOf`, Typ `RelicCtx`), `src/core/campaign/relics.ts` (`relicStage`, `relicStages`, `relicCtx`); `itemStatMods`/`activeSkillIds` mit Pflichtparameter `rc`, alle Aufrufer angepasst; `battleSkeleton` schreibt `BattleState.relicStages` (nur Stufen ≥ 2).
- Inhalte nach den PO-Antworten: Schild Stufe 2 ab `completed m1_6` VER 5 + Aura `warden_ward_awake` (Nachbarn +2 RES), Bild `_2`; `dragon_ember` MAG +2; beide mit Tag `relic`.
- UI: Relikt-Rahmen mit hohler Krone (`isRelic`: `stages` oder Tag `relic`, auch Drachenglut), Seltenheitszeile „Relikt · erwachend“, Abschnitt „Erwachte Kraft“, Stufenbild und -werte in Lager, Truppe und Kampf über `shownRelics`; Ladeplan lädt die Stufenbilder.
- `content:check`: `src/content/validateRelics.ts` (Bedingungen, Bilder, passive Skills, höchstens 2 Stufen).
- Tests `tests/unit/relic-stages.test.ts`: Stufe vor/nach m1_6, Zählung in Folge, Startzustand und Replay, fehlendes Feld = Stufe 1, Vorschau = Auflösung mit Aura, Release-Spielstand `format3-act1-finale-done` sofort Stufe 2 ohne Migration, Relikt-Rahmen beider Relikte, content:check-Fehler. `warden-shield.test.ts` grün.
- Bild 375 × 812 (scale 0.5) des Item-Blatts, Schild auf Stufe 2 (Lucan, Dev-Kampagne bis n3): `side-session-notes/…/story-11-9-relikt.png`.
- Offen als kleine Annahmen: Stufen werden in Folge gezählt; ein alter laufender Kampf ohne `relicStages` zeigt Stufe 1 bis zum nächsten Kampf.

### File List

- concept/21-gdd/decision-log.md
- concept/24-architecture/architecture.md
- content/core/items.yaml
- content/core/skills.yaml
- content/core/locales/de.yaml, en.yaml, de.items.yaml, en.items.yaml, de.names.yaml, en.names.yaml
- src/app/loading/plan.ts
- src/app/screens/BattleHud.tsx, BattlePanels.tsx, Troop.tsx
- src/app/state/battle.ts, session.ts
- src/content/schemaBase.ts, schemaCampaign.ts, schemaConditions.ts, schemaMap.ts, schemaUnits.ts, validate.ts, validateRelics.ts (neu)
- src/core/ai/ai.ts
- src/core/battle/act.ts, actions.ts, apply.ts, setup.ts
- src/core/campaign/apply.ts, camp.ts, relics.ts (neu)
- src/core/defs.ts, index.ts, state.ts
- src/core/rules/effects.ts, items.ts, relics.ts (neu), scout.ts, skills.ts, stats.ts
- src/ui/ItemSheet.tsx, components.tsx, item-sheet.css, itemInfo.ts, pieces.tsx, relicView.ts (neu)
- tests/unit/relic-stages.test.ts (neu), academy.test.ts, after-action-move.test.ts, core.test.ts, elster-steal.test.ts, item-rules.test.ts, lieutenants-scaling.test.ts, open-steal.test.ts, pro-classes.test.ts, skill-conditions.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-11-09: Relikt-Stufen umgesetzt (Schema, Kern mit Pflicht-Kontext, Snapshot im Kampf, Inhalte, UI mit Relikt-Rahmen, content:check, Tests); PO-Antworten eingearbeitet, Status review.
