# Story 3.5: Kopfgeld und Signatur-Item

Status: done

## Story

Als Spieler
möchte ich für jede Vertreibung belohnt werden,
damit ein wiederkehrender Feind kein Frust ist.

## Acceptance Criteria

1. **Werte in `balance.yaml`:** Ein neuer Abschnitt (Name z. B. `lieutenant`) hält `bounty.goldPerLevel: 200`, `bounty.materials: { min: 1, max: 2 }`, das Material des Akts (Akt 1: `iron_ore`; sauber abgelegt, nicht im Code, z. B. `bounty.materialByAct`) und `signature: { chance: 0.1, guaranteedRout: 4 }`. Schema (`balanceSchema`) und Typ (`defs.ts`) kennen sie; `content:check` prüft, dass das Material existiert.
2. **Kopfgeld:** Für jeden Leutnant, der in einer gewonnenen Mission `gone === 'fled'` ist, gibt es `200 × (Groll vor der Erhöhung durch diese Vertreibung + 1)` Gold und 1–2 Material des Akts. Die Formel steht **einmal** im Kern (`bountyGold`), die Steckbriefe (Story 3.6) rufen dieselbe Funktion. Beispiel (EXPERIENCE): Groll 1 → Kopfgeld 400, danach Groll 2 (Mockup 08: „Groll 2 … +400“); Groll 2 gegen Mira → 600.
3. **Signatur-Item:** Fällt je Leutnant höchstens einmal (Zustand `signatureDropped`). Es fällt mit 10 % je Vertreibung und garantiert bei der 4. Vertreibung (`routs` nach der Erhöhung = 4), sofern es noch nicht gefallen ist. Das Item kommt in den Tross wie andere Beute-Items (neue Instanz über `newItem`), `signatureDropped` wird gesetzt.
4. **Zufall deterministisch:** Der Zufall kommt aus dem geklonten Kampf-RNG (`rng` in `finishBattle`), in fester Reihenfolge: Leutnants in der Reihenfolge von `s.units`; je Leutnant zuerst die Materialmenge, dann der Signatur-Wurf, beide Würfe immer, unabhängig vom Ausgang. Die Auswertung steht nach allen bisherigen Zufallsverbräuchen von `finishBattle` und vor `c.rng = rng`, damit Missionen ohne Leutnant und bestehende Replays bitgleich bleiben.
5. **Gutschrift und Ergebnis:** Gold, Material und Item werden `c` gutgeschrieben, aber **nicht** in `result.gold`/`result.materials`/`result.items` mitgezählt: das Ergebnis zeigt Beute und Kopfgeld getrennt. `BountyResult` trägt zusätzlich das Material (ID und Menge) und das Signatur-Item (falls gefallen); `grudge` bleibt der Groll nach der Mission.
6. **Ergebnisbildschirm:** Der Abschnitt „Kopfgeld“ zeigt je vertriebenem Leutnant Porträt, Name, neuen Groll (Kerben bzw. Symbol + Zahl), Kopfgeld als Münze + Zahl, Material als Symbol + Zahl und – wenn gefallen – das Signatur-Item mit Bild und Name (Mockup `08-ergebnis-abschied.html`: „Hask vertrieben, Groll 2 · Kopfgeld +400 · Erz +1“). Alle Texte aus den Locales.
7. **Prüfungen:** Tests für Formel, Material-Spanne, 10 %-Wurf (feste Seeds), Garantie bei der 4. Vertreibung, höchstens einmal je Leutnant, zwei Leutnants in einer Mission in fester Reihenfolge, Niederlage ohne Kopfgeld, Wiederholbarkeit (gleicher Zustand → gleiches Ergebnis), Ergebnisansicht; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Screenshot des Ergebnisbildschirms mit Kopfgeld und Signatur-Item.

## Tasks / Subtasks

- [x] T1 Balance (AC 1)
  - [x] Abschnitt in `content/core/balance.yaml`, `balanceSchema`, `defs.ts`; Prüfung des Materials in `validate.ts`
- [x] T2 Kern (AC 2, 3, 4)
  - [x] `src/core/campaign/lieutenants.ts`: `bountyGold(data, grudge)`, Auswertung je vertriebenem Leutnant (Gold, Material, Signatur), gibt eine Liste `BountyResult` zurück
  - [x] Aufruf aus `finishBattle` an der in AC 4 genannten Stelle; Gutschrift in `c.gold`, `c.materials`, `c.convoy`
  - [x] `BountyResult` erweitern
- [x] T3 Ergebnisansicht (AC 5, 6)
  - [x] `missionResultView` reicht Material und Item durch; `Result.tsx` `Bounty` erweitern (Material, Item-Bild, Groll)
  - [x] Texte `ui.result.*` in `de.yaml`/`en.yaml`; CSS in `Result.css`
- [x] T4 Tests und Belege (AC 7)
  - [x] `tests/unit/lieutenants-bounty.test.ts`; `tests/unit/result.test.ts` (bisher „has no bounty … passes fake bounty data through“) anpassen
  - [x] Screenshot (Dev-Helfer oder Test-Arena, siehe Story 3.6 für `__hc`)

## Dev Notes

### Quellen

- Epics 3.5; GDD „Leutnants“ (Kopfgeld `200 × (Groll + 1)` Gold + 1–2 Material des Akts, Signatur-Item 10 % je Vertreibung, garantiert bei der 4. `[ASSUMPTION]`); Architektur §5.5 („Nach der Mission“: Werte aus `balance.yaml` `lieutenant.bounty`/`lieutenant.signature`, Kampf-RNG), §6.4 (Zeit und Zufall); EXPERIENCE (Szene 1: „das Ergebnis zeigt Beute, Kopfgeld und EP je Figur mit Symbolen“; Szene 2: „Groll 2 gegen Mira, Kopfgeld ● 600“); DESIGN.md §Währung (Beträge immer Symbol + Zahl); Mockup `08-ergebnis-abschied.html` (Zeile `.lt` im Ergebnis); `concept/21-gdd/items.md` §6.3.
- Produktentscheidungen vom 2026-10-25: Das Signatur-Item fällt je Leutnant höchstens einmal; 10 % je Vertreibung, garantiert bei der 4., sofern noch nicht gefallen; das Kopfgeld rechnet mit dem Groll **vor** der Erhöhung durch diese Vertreibung (so ergibt „Groll 2 … 600“ = 200 × 3 mit Groll 2 vorher, und Mockup 08 „Groll 2, +400“ = 200 × 2 mit Groll 1 vorher).

### Vorhandener Code (Fundstellen, Stand HEAD 3d7cb9f)

- **`finishBattle`:** `src/core/campaign/campaign.ts:217-354`. Bei Niederlage kehrt sie in Zeile 236 zurück, danach `c = clone(c0)`, `rng = clone(s.rng)` (Zeile ~238/239, bisher nur für Narben: `pick(rng, free)`), `playerUnits` 243, Beute-Gutschrift 333–338 (`c.gold += gold`, Materialien, `result.items.push(...s.itemsGained)`), `c.rng = rng` Zeile 348. `newItem(c, def, data)` (`src/core/battle/create.ts:11`) vergibt die Instanz-UID aus `c.nextUid` (Zeile 241 setzt `c.nextUid = s.nextUid`); Muster für Item in den Tross: Nebenziel-Belohnung (`c.convoy.push(inst)`).
- **`BountyResult`/`BattleResult.bounty`:** `campaign.ts:147-156` (heute `id, nameKey, name?, portrait?, gold, grudge`) und `:168`, Initialwert `bounty: []` Zeile ~230. Die Ansicht: `src/core/campaign/resultView.ts:30` (`bounty: BountyResult[]`), `:75` reicht `result.bounty ?? []` durch.
- **Ergebnisbildschirm:** `src/app/screens/Result.tsx` `Bounty` (56–73): zeigt heute Porträt, `ui.result.bountyLine` („vertrieben, Groll {grudge}“) und nur Gold als `Amount`. Bausteine: `Amount` (`src/ui/pieces.tsx:118`, `resource="gold"` oder `material={itemDef(...)}`, `signed`), `ItemImage`, `itemName`, `rarityOf`; die Beute-Items in `Spoils` (Zeilen ~44–50) als Muster für die Item-Anzeige. CSS: `src/app/screens/Result.css` (`.res-lt`, `.res-lt__text`). Texte: `ui.result.bounty`/`ui.result.bountyLine` in `content/core/locales/de.yaml:380`/`en.yaml`.
- **Material:** `iron_ore` (`content/core/items.yaml:121`, `kind: material`, Name `item.iron_ore.name`); Materialstufen der Upgrades `balance.yaml:148-152` (`iron_ore`, `moonsteel`, `dragon_scale`). Akt 1 nutzt `iron_ore`.
- **Zustand/Logik aus 3.3:** `src/core/campaign/lieutenants.ts` und `LieutenantState { grudge, routs, signatureDropped }`; die Erhöhung von `grudge` und `routs` geschieht dort **vor** dem Kopfgeld oder die Funktion liefert den alten Groll mit: Die Reihenfolge muss in einem Test festgenagelt sein (Kopfgeld rechnet mit dem Groll vor der Erhöhung, die Garantie mit `routs` nach der Erhöhung).
- **Items:** Die Signaturen (`tinder`, `bounty`, `wolf_fang`, `little_hands`) legt Story 3.1 an; Zuordnung Leutnant → Item über `LieutenantDef.signatureItem`.
- **Tests als Muster:** `tests/unit/result.test.ts:71`, `tests/unit/sim-campaign.test.ts`, `tests/unit/core.test.ts` (Replays), `tests/unit/class-actions.test.ts:29` `arena()`.

### Was sich ändert / was bleibt

- **Ändert sich:** `finishBattle` (ein Aufruf, ein paar Zeilen), `BountyResult`, `missionResultView`, `Bounty` in `Result.tsx`, `balance.yaml`.
- **Bleibt:** `result.gold`, `result.materials`, `result.items` zählen nur die reguläre Beute; Missionen ohne vertriebenen Leutnant verbrauchen keinen Zufall (Replays unverändert); bestehende Ergebnis-Abschnitte (Beute, Nebenziele, Truppe, Gefallene) unverändert.
- **Gutschrift ohne Doppelzählung:** Das Kopfgeld landet auf `c`, aber nicht in `result.gold`; wer `result.gold` zur Anzeige „Gesamtgewinn“ summiert, muss Beute und Kopfgeld getrennt halten. Prüfen, ob `Result.tsx` oder ein anderer Ort (z. B. Journal/Chronik) `result.gold` mit `c.gold` abgleicht.
- **Aktgrenze:** „Material des Akts“ kommt aus `c`/`data.campaign.act` (heute nur Akt 1 im Build); `materialByAct` darf für spätere Akte Einträge tragen, ohne dass Akt 1 sie braucht.
- **Wer vertrieben hat:** In dieser Story spielt es keine Rolle (nur `gone === 'fled'`); `gone` wird erst in Story 3.2 gesetzt, bis dahin setzen Tests es direkt.

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** Flucht setzen, Vorschau „flieht“, Rauch/Wimpel (3.2); `routs`, `grudge`, `target`-Fortschreibung und KI (3.3, **Voraussetzung**); Skalierung (3.4); Steckbriefe samt Anzeige des Kopfgelds vor dem Kampf (3.6, ruft `bountyGold`); Seitenwechsel (3.7; ein beigetretener Leutnant gibt kein Kopfgeld mehr, das regelt 3.7); Heimsuchungen und ihre Belohnung (5.6); Item-Bilder der Signaturen (Grafik-Session).
- **Session „Kampf“** (Branch `claude/pensive-jepsen-b9ce35`) ändert u. a. `content/core/{balance,classes,items}.yaml` und Locales, `src/core/{state,events,defs,index}.ts`, `src/content/{schemas,validate}.ts`, `src/ui/hud.css`, `src/ui/icons.tsx`. Dort nur ergänzen (neuer Abschnitt am Ende von `balance.yaml`, Felder am Ende eines Blocks, keine Umformatierung). Neue Logik in `lieutenants.ts`; `Result.tsx`/`Result.css` gehören nicht zu den Kampf-Dateien.
- **Abhängigkeiten:** 3.1 (Items, Definitionen) und 3.3 (Zustand, `finishBattle`-Aufruf) vorher.

### Geklärte Fragen (Produktinhaber 2026-10-25, Fragetool)

1. **Ergebnis „Groll“:** Symbol (`wanted`) + Zahl und die Kerben-Punkte (AGENTS: Beträge als Symbol + Zahl; Entscheidung des Kontrolleurs nach dieser Regel).

### Project Structure Notes

- Neu: `tests/unit/lieutenants-bounty.test.ts`.
- Geändert: `content/core/balance.yaml`, `src/content/schemas.ts`, `src/core/defs.ts`, `src/content/validate.ts`, `src/core/campaign/{campaign,lieutenants,resultView}.ts`, `src/app/screens/Result.tsx`, `Result.css`, Locales `de.yaml`/`en.yaml`.

### Project Context Rules

- Spielwerte (200, 1–2, 10 %, 4) nur in `balance.yaml`, nie im Code; Zufall nur aus dem Seed-RNG im State (kein `Math.random`); Replays müssen identische Ergebnisse liefern.
- Beträge immer als Symbol + Zahl (`Amount`). Kein sichtbarer Text im Code, Texte in `de.yaml`/`en.yaml`.
- `src/core` rein, State Plain-JSON.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün sind; für diese sichtbare Story zusätzlich Screenshot. Balance mit `pnpm sim <mapId> --runs 50` gegenprüfen, dass das Kopfgeld die Wirtschaftskurve (Story 6.8) nicht sprengt (Karten der Level-Design-Session dafür nicht ändern).
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics.md#Story 3.5]
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: concept/25-ux/EXPERIENCE.md] (Szenen 1 und 2)
- [Source: concept/25-ux/mockups/08-ergebnis-abschied.html]
- [Source: concept/21-gdd/items.md#6.3 Leutnant-Signaturen]
- [Source: _bmad-output/implementation-artifacts/6-6-missionsergebnis.md]

## Review (2026-10-25)

Grundlage: Code-Review Epic 3 (Diff PR #48 + #52, Prüfschichten Blind Hunter, Edge Case Hunter, Acceptance Auditor, Querschnitt Replay/Vorschau/Migration/Worker, Simulation, Browser).

Kurzergebnis: Übrige ACs ohne Befund.

Querschnitt: Replays ok (Zufall nur aus Seed-RNG, Kopfgeld/Signatur-Reihenfolge fest).

| # | Schwere | Befund | Ort | Ergebnis |
|---|---|---|---|---|
| R5 | E→fix | Kopfgeld-Material aus Kampagnen-Akt statt Leutnant-Akt. Entscheidung: Akt des Leutnants. | lieutenants.ts payBounties, wanted.ts | behoben in PR #55 |
| R13 | S3 | Decision-Log-Einträge zu 3.5 und 3.6 fehlen. | concept/*/decision-log | behoben in PR #55 |
| R16 | E | Besitzer der Leutnant-Signatur (items.md §3) fehlt. | – | offen für spätere Story |
| R31 | S3 | Story-Texte veraltet (3.1 Ulvric vanguard, 3.2 `kills`, 3.5 Sim-Zeile „kein Leutnant auf den Karten“). | Story-Dateien | vermerkt, kein Handlungsbedarf |
| R32 | S3 | Sim-Zahlen nicht in der Story-Datei. | Story-Dateien | vermerkt, kein Handlungsbedarf |

Empfehlung: `done` nach Merge von PR #55. Entscheidung Produktinhaber 2026-10-25: `done`.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- Coverage unter `pnpm test:coverage` hat zwei Tests (chronicle, lieutenants) mit dem 5-s-Timeout abgebrochen (Last, nicht Logik); mit `--testTimeout=60000` alle grün.
- Der Dev-Server auf Port 5178 (Kontrolleur) lieferte dem Browser ein veraltetes, zwischengespeichertes `campaign.ts` (`lieutenantState is not defined`); die Quelle war korrekt. Geprüft mit eigenem Server auf Port 5199 (beendet).

### Completion Notes List

- Balance: Abschnitt `lieutenant` am Ende von `balance.yaml` (`bounty.goldPerLevel`, `bounty.materials {min,max}`, `bounty.materialByAct`, `signature {chance, guaranteedRout}`), `balanceSchema` (strikt), `defs.ts`; `validateLieutenants` prüft, dass das Material existiert, ein Material ist und jeder Akt mit Leutnants eines hat.
- Kern: `bountyGold(data, grudgeBefore)` (die eine Formel, für Story 3.6) und `payBounties` in `lieutenants.ts`. `LieutenantOutcome` trägt jetzt `grudgeBefore`. `finishBattle` ruft `payBounties` direkt vor `c.rng = rng`, nach allen bisherigen Zufallsverbräuchen. Je vertriebenem Leutnant in Reihenfolge von `s.units`: Materialmenge (`nextInt`), dann Signatur-Wurf (`nextFloat < chance`), beide immer. Garantie ab `routs >= guaranteedRout` (nach der Erhöhung), sofern `signatureDropped` noch nicht gesetzt; Item per `newItem` in den Tross.
- `signatureDropped` ist jetzt `boolean` (Default false; `lieutenantState`/`normalizeCampaign` nehmen 0/1 als false/true).
- Gold, Material, Item gehen auf `c`, nicht in `result.gold/materials/items`. `BountyResult` hat `material?` und `signature?`; `missionResultView` reicht sie unverändert durch.
- Ergebnisbildschirm: Zeile je Leutnant mit Porträt, Name, „vertrieben“, Groll als Symbol + Zahl + Kerben, Kopfgeld und Material als `Amount`, Signatur-Item mit Bild, Name und Etikett. Texte `ui.result.bountyLine` (ohne Groll), neu `ui.result.grudge`, `ui.result.signature`.
- Dev-Helfer `__hc.devBounty(spec, grudge = 1)` (nur DEV, `flow.ts`): öffnet den Testkampf von `devLieutenant`, lässt die Leutnants fliehen (`gone: 'fled'`, `fledBy` = erste Spielfigur, in Start- und aktuellem Zustand), markiert den ersten Story-Knoten als erledigt (sonst ist der Testknoten nicht abschließbar) und gewinnt per `autoWin`. Beispiele: `devBounty('hask', 1)` (Kopfgeld 400), `devBounty('hask', 3)` (4. Vertreibung: Signatur-Item sicher, Kopfgeld 800), `devBounty([['hask', 1], ['morra', 2]])`.
- Prüfungen: lint, test (493), content:check, build grün. Coverage `src/core` vorher/nachher: Statements 80.81 -> 80.97, Branches 72.5 -> 72.57, Functions 85.28 -> 85.35, Lines 84.51 -> 84.68. `pnpm sim` (50 Läufe) für prologue_caravan, ch01_varnhold, ch02_silverbrook: Siegquote, Runden und Verluste identisch (kein Leutnant auf den Karten).

### File List

- content/core/balance.yaml
- content/core/locales/de.yaml, en.yaml
- src/content/schemas.ts, validateLieutenants.ts
- src/core/defs.ts, state.ts
- src/core/campaign/campaign.ts, lieutenants.ts
- src/app/screens/Result.tsx, Result.css
- src/app/state/flow.ts
- tests/unit/lieutenants-bounty.test.ts (neu)
- tests/unit/result.test.ts, day.test.ts, story.test.ts, lieutenants-grudge.test.ts (`signatureDropped` boolean, Bounty-Felder)

### Change Log

- 2026-10-25: Story 3.5 umgesetzt (Kopfgeld, Material, Signatur-Item, Ergebnisansicht, Tests, Dev-Helfer `devBounty`).
- 2026-10-25 Kontrolleur: Checks grün (493 Tests), Sim unverändert, Screenshot Ergebnis mit Kopfgeld und Signatur-Item; Status review.
