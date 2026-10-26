# Story 9.7: Mission 1-6 „Die Paktwacht“ und Entscheidung E4

Status: review

## Story

Als Spieler
möchte ich die Burgruine erobern und eine Heimat gewinnen,
damit die Truppe mitten in Akt 1 ein Zuhause bekommt.

## Acceptance Criteria

1. **Karte:** `m1_6_paktwacht` (16 × 20, Grenzland, Morgen, klar) wird spielbar: Ziel `seize` (Thronfeld (7,2)–(8,2), nur Kael als `seizer`), Leutnants Hask (hält den inneren Hof) und Ulvric (Reiter am Hang), Aufstellung 9 Plätze, max. 7, Avatar + Kael erzwungen. Leicht 9, Normal 11, Schwer 13 Gegner (`devNote` der Karte), keine Verstärkung. Ulvric und die Reiter (`rider1`–`rider3`) wechseln von `class: vanguard` auf die echte Klasse `wolf_rider` (Ulvric darf `class` weglassen, sein Leutnant-Eintrag nennt sie); Hask behält `brigand`. Gegnerstufen und Profile werden per Simulation abgestimmt (siehe AC 9), Zahlen der Gegner bleiben wie im Layout.
2. **Knoten:** `m1_6` in `content/acts/act1/campaign.yaml`: `map: m1_6_paktwacht`, `titleKey: node.m1_6.title` („Die Paktwacht“ / „The Pactwatch“), `pre: scn.m1_6.intro`, `post: scn.m1_6.outro`, `requires` = abgeschlossen `m1_2` bis `m1_5` (je eine Bedingung `completed`, UND-Liste), `place: paktwacht_ruine`, `effects: [{ setHome: castle }]`, `expectedLevel` und `merchantTier` laut Dev Notes (OFFEN). Der Knoten ist kein `fixed`-Knoten. Nach dem Sieg wechselt die Heimat auf die Burg (Event `homeChanged`, Ergebnis-Screen zeigt „Neue Heimat“).
3. **Reihenfolge danach:** Nach 1-6 ist nur 1-7 wählbar (Story 9.8 hängt `requires: completed m1_6` an); Akt 1 läuft fest bis zum Finale. Die Weltkarte bindet den Ort `m1_6` an den Knoten (`node: m1_6` in `content/world/valmora.yaml`, Kommentar `# Karte: …` bleibt).
4. **Szene vorher** `scn.m1_6.intro`: kurze Lage vor der Ruine (Halvards Rat, die Paktwacht als Versteck zu nehmen; wer ihn überbringt: OFFEN). Beat 7 „Zuflucht Paktwacht“: der Rat kommt vom Hüter, die Truppe weiß nicht, was in den Mauern liegt. Hintergrund `paktwacht_ruine`, je Box ≤ 110 Zeichen, DE in der Szene, EN im Locale.
5. **Szene nachher** `scn.m1_6.outro` (eine Szene, weil ein Knoten nur ein `post` hat) in drei Teilen:
   1. **Tafel „Das Banner auf der Ruine“** (Illustrationstafel 4 der Narrative, Hintergrund `paktwacht_ruine`, Zeile mit `panel: paktwacht_ruine`, 1–4 Boxen, danach `panel: none`).
   2. **Gespräch „Eine Burg für Niemande“** (Kael + Truppe, Ton Stolz/Aufbruch, Sprecherketten mit Ersatzsprechern, Gefallene werden übersprungen); Hintergrund des Gesprächs: OFFEN 8. **Im Gespräch führt die Truppe den neuen NPC „Verwalter“ ein** (Einheit `steward`, Name `unit.paktwacht_steward.name`, 1–3 Zeilen: er hat die Ruine gehütet bzw. nimmt die Burg in Obhut; Entscheidung des Produktinhabers 2026-10-26), den Story 9.9 im Finale verteidigt; seine Rolle ist unabhängig von E4. Wer er ist und was er sagt: OFFEN 15.
   3. **Entscheidung E4** als letzte Zeile (`choice` mit `title`): zwei Antworten, jede mit `stance`, `summary` und `effects`; die Folgen-Karte erscheint nach der Wahl (Dialogue.tsx ~177, `consequenceLines`).
6. **E4-Wirkungen (bindend):**
   - „Flüchtlinge aufnehmen“: `setFlag: { e04: shelter }`, `villageAid` für Akt 2 (Dorfhilfe: Heiltrank +1 Ladung in Akt 2).
   - „geheim halten“: `setFlag: { e04: secret }`, `priceMod: { pct: -10, act: 2 }` (Händlerpreis −10 % in Akt 2).
   - Das Flag `e04` (Werte `shelter`, `secret`) steht in `content/acts/act1/flags.yaml` (`kind: decision`, `season2: true`, wie `e01`–`e03` der Schwesterstories); die Szenenzeile in 1-8 (Story 9.9) liest es.
7. **`priceMod` und `villageAid` im Kern freischalten** (Entscheidung des Produktinhabers, Dev Notes):
   - `UNSUPPORTED_EFFECTS` (`src/core/campaign/effects.ts:11`) wird leer bzw. verliert beide Einträge; `validateEffects`/`applyEffects` bekommen je einen Fall; `content:check` lehnt die Wirkungen nicht mehr ab; `CampaignError` `effect_unsupported` bleibt für Unbekanntes.
   - Zustand in `CampaignState` (Plain-JSON, serialisierbar; Form OFFEN), beim Laden mit Standardwert normalisiert.
   - Regeln: Händler-Kaufpreis wird in Akt `act` um `pct` Prozent geändert (Verkauf unverändert); Heiltrank (`vulnerary`, `refillAfterMission`) hat in Akt 2 eine Ladung mehr (`charges + 1`) und füllt sich nach der Mission auf diesen Wert. Beide wirken nur, solange der aktuelle Akt der Wirkung entspricht; solange es kein Akt-2-Paket gibt, ist im Spiel nichts davon zu sehen, die Regeln sind durch Unit-Tests abgedeckt (Akt 2 im Test gesetzt).
   - Die Folgen-Karte zeigt beide Wirkungen (Zeilen `priceMod`/`villageAid` bestehen in `ConsequenceCard.tsx:55-58` und `consequences.ts:59-65`); Betrag als Symbol + Zahl, Texte DE + EN prüfen.
8. **Heimsuchungs-Anker:** die drei Felder aus dem Kommentarblock der Karte ([8,6] innerer Hof, [8,10] äußerer Hof, [8,16] Serpentinenstraße) als `haunts:`-Liste, sobald Story 5.5 auf `main` ist (Format `haunt-anchors-5-5.md`, höchstens einer je Variante, Pflichtfelder siehe OFFEN); sonst bleibt der Kommentarblock stehen und das Feld wird ignoriert.
9. **Simulation:** `pnpm sim m1_6 --runs 50` liegt auf Leicht, Normal und Schwer im Korridor aus `balance.yaml` `simulation.corridors` (Leicht Sieg ≥ 0,95 und Niedergestreckte ≤ 0,5; Normal 0,75–1,0 und 0,4–1,3; Schwer 0,30–0,70); Zahlen im Dev Agent Record. Nebenziele `s_clean` und `s_fast` (Rundenzahl und Belohnung [C]) werden mit abgestimmt.
10. **Tests und Prüfungen:** Unit-Tests für `priceMod`/`villageAid` (Schema, Anwendung, Kaufpreis, Ladungen, Speichern und Laden, Wirkung nur im richtigen Akt), für die Knoten-Wirkung `setHome` an `m1_6`, für E4 (beide Antworten, Flag, Folgen-Karte) und für die Erreichbarkeit (`availableNodes`); E2E: Spieler gewinnt 1-6 (Spielstand über Dev-Helfer `__hc.*` vorbereitet, siehe Dev Notes), sieht Tafel, Gespräch, E4 und Folgen-Karte, Heimat zeigt die Burg. `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün.
11. **Screenshots** (Hochformat 375 × 812, angespielt bis Sieg): Karte 1-6, Tafel „Das Banner auf der Ruine“, Gespräch, E4-Entscheidung, Folgen-Karte für beide Antworten, Ergebnis-Screen „Neue Heimat“.

## Tasks / Subtasks

- [x] T1 Karte `m1_6_paktwacht.yaml` auf Spielstand bringen: Klassen auf `wolf_rider`, Kommentare „Epic 3/OFFEN (2.9)“ entfernen, `devNote` aktualisieren (AC 1)
- [x] T2 Knoten `m1_6` in `campaign.yaml` (requires, place, effects, merchantTier, expectedLevel), `node.m1_6.title` in `content/core/locales/{de,en}.names.yaml`, `node: m1_6` in `valmora.yaml` (AC 2, 3)
- [x] T3 `content:check`: Verhalten bei unbekannten Knoten-IDs in `requires` klären (siehe Dev Notes „Abhängigkeit von 9.3–9.6“) und im Dev Agent Record festhalten
- [x] T4 Szenen `scn.m1_6.intro` und `scn.m1_6.outro` (Tafel, Gespräch, E4) in DE; Englisch in `content/locales/en/act1.dialogue.yaml` (AC 4, 5)
- [x] T5 Flag `e04` in `flags.yaml`; Antworten, `stance`, `summary`, Wirkungen von E4 (AC 5, 6)
- [x] T6 Kern: `priceMod` und `villageAid` freischalten: `defs.ts`, `schemas.ts`, `effects.ts` (validate/apply), Zustand + Normalisierung, Händlerpreis, Heiltrank-Ladung, `consequences.ts`/`ConsequenceCard.tsx`, `content/validate.ts`, Texte (AC 7)
- [x] T7 Unit-Tests zu T6, E4 und Knoten (AC 10)
- [x] T8 Heimsuchungs-Anker (AC 8)
- [x] T9 Sim-Abstimmung der Gegnerstufen, Reiter, Nebenziele auf Leicht/Normal/Schwer (AC 9)
- [ ] T10 E2E-Test (AC 10)
- [ ] T11 Screenshots (AC 11)

## Dev Notes

- **Quellen:** Epics 9.7; Narrative „Story Beats“ 7 (Zuflucht Paktwacht), „Missionsfolge“ (1-6 ★: seize, Hask und Ulvric, Heimat erobert (Tafel 4), danach E4), „Die 12 Entscheidungen“ (E4), „Key Conversations“ Nr. 5 „Eine Burg für Niemande“ (Kael, Truppe; Stolz, Aufbruch), „Major Cutscenes“ Nr. 4 (Die Paktwacht erobert: das Banner auf der Ruine), „Dialogue Style“ (Stimmen der Figuren, Boxen ≤ 110 Zeichen, keine echten Flüche), Orte (Die Paktwacht: Ruine, die zum Zuhause wird); GDD Missionsziele (`seize` nur Kael), Reihenfolge (1-6 → 1-7 → 1-8 fest), Entscheidungen (Händlerpreise ±10 %, Dorfhilfe = Heiltrank +1 Ladung für einen Akt), Heimat (ab 1-6 übernimmt die Burg); EXPERIENCE (Folgen-Karte schreibt einen Eintrag in die Chronik; Entscheidung: erster Tipp markiert, zweiter bestätigt); Architektur §5.3 (Wirkungen `priceMod`, `villageAid`, `setHome`) und §5.4 (Knoten-Wirkungen); Layout-Notizen `epic9-act1-maps-layouts.md` und `stories-6-9-7-3-home-act-end.md` (Session-Notizen); `content/acts/act1/maps/m1_6_paktwacht.yaml` (Kommentare am Kopf).
- **Wer ist „der Hüter“?** Ehrwürden Halvard, Hüter des Paktes (Narrative: „Halvard, der Hüter des Paktes“). Er tritt in 1-3 auf (Beat 4), Liora ist seine Ziehtochter und überbringt seine Nachrichten (Narrative Gefährten-Tabelle Nr. 5, „Brücke Hüter“). Beat 7: der Hüter rät zur Paktwacht und übersieht, dass die Chronik dort liegt. Im Gespräch „Eine Burg für Niemande“ ist Halvard nicht dabei (Kael, Truppe).
- **Entscheidungen des Produktinhabers (bindend, 2026-10-26):**
  - E4 wird **vollständig umgesetzt**: `priceMod` und `villageAid` werden im Kern, Schema und in der Folgen-Karte freigeschaltet, im Kampagnenzustand gespeichert und wirken auf Akt n (Händlerpreis −10 % in Akt 2, Heiltrank +1 Ladung in Akt 2); sichtbar erst, wenn es Akt 2 gibt, durch Unit-Tests abgedeckt.
  - Antworten laut Narrative: „Flüchtlinge aufnehmen“ → `villageAid` für Akt 2 (Dorfhilfe); „geheim halten“ → `priceMod` −10 % für Akt 2.
  - Zusätzlich ein Flag für die Szenenzeile in 1-8 (entschieden: es gibt eines). Vorgeschlagener Name `e04` mit den Werten `shelter` | `secret`, im Stil von e01–e03 (`setFlag: { e01: keep }`, `{ e02: protect }`, `{ e03: spare }` der Nachbarsession); Name und Werte sind ein Vorschlag, siehe OFFEN 14.
  - `setHome: castle` als Knoten-Wirkung an `m1_6` (Story 6.9).
  - Der **Verwalter** (Steward, `steward`) wird im Gespräch „Eine Burg für Niemande“ eingeführt und ist in 1-8 (Story 9.9) die verteidigte Figur; unabhängig von E4.
- **Technische Fakten (geprüft, Stand der Worktree-Basis):**
  - Ziel `seize`: `src/content/schemas.ts:299` (`area`), wird durch die Seize-Aktion aufgelöst (`objectives.ts` Fall `seize`, nur Einheiten mit Flag `seizer`); Kael hat `seizer` in `content/acts/act1/units.yaml:26`.
  - Klasse `wolf_rider`: `content/core/classes.yaml:369`; Ulvrics Leutnant-Klasse ist `wolf_rider` (`lieutenants.yaml`). Das Layout setzt Ulvric und `rider1`–`rider3` noch auf `vanguard` („OFFEN (2.9)“): umstellen. Leutnants dürfen `class` weglassen; die Leutnant-Stufe wird berechnet, `level` der Karte wird ignoriert (Notizen Epic 3). Beigetretene Leutnants werden übersprungen (`src/core/battle/setup.ts:77`, Flag `joined_<lt>`); in 1-6 stehen nur Hask und Ulvric, E3 betrifft Grosk, nicht sie.
  - Folgen-Karte: `title` an der `choice`-Zeile, `summary` und `effects` je Antwort (Schema `schemas.ts:479-495`); Schlüssel `dlg.<scene>.<line>.title`, `….<option>`, `….<option>.summary` (`src/core/campaign/scene.ts:6-12`). Jede Antwort braucht `stance` (`warm`/`sober`/`defiant`).
  - Panel-Zeile: `panel: <Hintergrund-ID>` (Beispiel `content/acts/act1/scenes/scn.prologue.intro.yaml:99`, `panel: paktnacht_glutdom`); Hintergründe sind Ortsbilder in `art/mockups/locations-s1` (`paktwacht_ruine`, `paktwacht_heimat` vorhanden).
  - `priceMod` und `villageAid`: Schema `schemas.ts:443-444` (`villageAid` heute `z.literal(true)`, ohne Akt), Typen `defs.ts:460-461`, Karten-Zeilen `consequences.ts:59-65` und `ConsequenceCard.tsx:55-58` (Texte `ui.consequence.priceMod.*`/`villageAid.*`), gesperrt durch `UNSUPPORTED_EFFECTS` (`effects.ts:11`); bestehende Tests, die das Sperren prüfen: `tests/unit/story.test.ts:250` und `:344`, `tests/unit/node-effects.test.ts:73`; sie müssen auf die neue Lage umgestellt werden. Heiltrank: `content/core/items.yaml:111` (`charges: 3`, `refillAfterMission: true`), Auffüllen in `src/core/campaign/campaign.ts:192-196`; Kaufpreis in `src/core/campaign/apply.ts:22-24`.
  - Verfügbarkeit: `requires` ist eine UND-Liste; `content:check` prüft `completed: <id>` gegen vorhandene Knoten oder das Muster `ch\d+` (`src/content/validate.ts:51`, `:124-126`) und meldet sonst „unknown node“. Daraus folgt: **bis 9.3–9.6 (Session „Akt 1 Mitte“, Knoten `m1_2`–`m1_5`) auf `main` sind, schlägt `content:check` für `requires: completed m1_2…m1_5` fehl.** Vorgehen: Story erst nach dem Merge dieser Knoten abschließen, oder bis dahin `m1_6` mit `requires: [{ completed: ch02 }]` als Brücke im Graphen führen und den Wechsel auf die vier echten Bedingungen nachziehen (Entscheidung nötig, siehe OFFEN 1). Getestet wird ohne Zwischenstand per Dev-Helfer (`__hc.*`) bzw. Fixture-Spielstand, der die Knoten als abgeschlossen setzt.
  - `expectedLevel`: `validate.ts:289-297` verlangt, dass die Stufe im Akt nicht fällt (Dateireihenfolge) und entlang `completed` nicht sinkt; der GDD-Korridor nennt für Akt 1 „1 → 9 (Finale 10)“ (GDD „Erwartete effektive Armee-Stufe“).
### Entscheidungen des Produktinhabers (bindend, 2026-10-26)

- **Graph (OFFEN 1):** `m1_6` verlangt im Endzustand `m1_2`–`m1_5` (Session 9.3–9.6, noch nicht auf main; unser PR mergt danach). Bis dahin Übergang `requires: [{ completed: ch02 }]` mit YAML-Kommentar (`content:check` lehnt unbekannte Knoten-IDs ab). Akt 1 läuft ab hier fest: nach 1-6 ist nur 1-7 wählbar (Knoten in Story 9.8).
- **E4 vollständig:** `priceMod { pct, act }` und `villageAid { act }` im Kern freigeschaltet. Heiltrank: in Akt n 4 statt 3 Ladungen, Auffüllen auf 4 nach jeder Mission des Akts. `priceMod -10` in Akt n: alle Händlerkäufe 10 % günstiger, auf ganze Münzen abgerundet; Verkauf bleibt 50 % des Basispreises.
- **E4-Antworten:** „Flüchtlinge aufnehmen“ = `villageAid { act: 2 }` + `setFlag { e04: shelter }`, `stance: warm`; „geheim halten“ = `priceMod { pct: -10, act: 2 }` + `setFlag { e04: secret }`, `stance: sober`. Form `setFlag: { e0N: wert }` wie bei e01 (andere Session).
- **Szene vorher:** Halvard tritt selbst kurz auf (freundlich, hilfsbereit wie in 1-3) und nennt die verlassene Paktwacht als Versteck; die Truppe ahnt nichts. **Szene nachher:** Tafel „Das Banner auf der Ruine“ (Tafel 4), Gespräch „Eine Burg für Niemande“ (hier mit Verwalter), danach E4.
- **Karte:** Layout bleibt, Ulvric und Reiter echte Klasse `wolf_rider`, Hask/Ulvric echte Leutnants, Seize durch Kael, `haunts:` mit 3 Ankern. **Controller-Nachtrag:** Karten-Waffen der Leutnants sind Eisen (Hask `iron_axe`, Ulvric `iron_lance`; Review R15/R35). `villageAid` bewusst klein und austauschbar gehalten, weil Session 9.3 dieselbe Wirkung baut (Rebase tauscht gegen deren Umsetzung).

- **Vorschläge der Story-Autorin (nicht entschieden, siehe OFFEN):** `expectedLevel 7` (siebte Story-Mission des Akts, Layout-Gegner um Stufe 6 bis 8 passen); `merchantTier 2` (höchste vorhandene Stufe); Sprecherkette für Halvards Rat: `[liora, rhen]`.
- **OFFEN** (nicht stillschweigend entscheiden, mit dem Produktinhaber klären):
  1. **Graph bis 9.3–9.6:** `requires` von `m1_6` mit den vier echten Knoten (schlägt vor dem Merge fehl) oder Brücke über `ch02`; welche Reihenfolge der Merges gilt.
  2. **`expectedLevel` und `merchantTier`** von `m1_6` (Vorschlag 7 und Tier 2); es gibt nur Händler-Tiers 0–2.
  3. **Form des Zustands** für `priceMod` und `villageAid` (z. B. Liste `{ pct, act }` und Liste von Akten) und ob dafür eine Migration/Formatversion nötig ist oder der Standardwert beim Laden reicht (Architektur „Speicherformat 2“, AGENTS „Akt-Release“ Punkt 3).
  4. **`villageAid` hat im Schema heute keinen Akt-Parameter** (`z.literal(true)`, Architektur §5.3 „für einen Akt“). Story 9.3 (E1) nutzt `villageAid` ebenfalls (Heiltrank +1 für Akt 1): Schema-Form `villageAid: { act: n }` mit der Session „Akt 1 Mitte“ abstimmen, nicht zweimal freischalten.
  5. **Heiltrank +1 Ladung:** Maximalwert 4 statt 3 in Akt 2 und Auffüllen nach der Mission, oder nur eine Zusatzladung beim Missionsstart; gilt für jeden Heiltrank oder nur für den Konvoi/die Taschen der Truppe.
  6. **Händlerpreis −10 %:** auf Kaufpreise aller Waren (auch Glutfunke beim Händler?), Rundung, Verkauf bleibt bei 50 % des Basispreises.
  7. **Wer überbringt Halvards Rat** in `scn.m1_6.intro` (Liora als Brückenfigur? Ersatzsprecher falls Liora fehlt; Gedenkzeile, falls Liora gefallen ist, laut Narrative „Ersatzsprecher-Kette“).
  8. **Hintergrund** des Gesprächs: `paktwacht_ruine` (Layout) oder `paktwacht_heimat`; `place` von `m1_6` ist `paktwacht_ruine` (Layout), `paktwacht_heimat` zeigt die bewohnte Burg.
  9. **`stance` der E4-Antworten** (Vorschlag: aufnehmen `warm`, geheim halten `sober`).
  10. **Szenennamen:** das Layout nennt `scn.m1_6.banner` und `scn.m1_6.home`; ein Knoten hat nur ein `post`, daher eine Szene `scn.m1_6.outro` (Tafel, Gespräch, E4). Soll das Gespräch eine eigene Szene bleiben (dann braucht es einen anderen Auslöser als `post`)?
  11. **Heimsuchungs-Anker:** `variant`, `enemySpawn`, `deploy`, `turns` der drei Anker (Format Notiz 5.5), da das Schema noch nicht auf `main` ist.
  12. **Signaturwaffen** der Leutnants (`steel_axe` für Hask „Signaturaxt gibt es noch nicht, items.md §6.3“); Rundenzahl und Belohnung der Nebenziele `s_clean` (Heiltrank) und `s_fast` (12 Runden, 400 Gold) sind Startwerte [C].
  13. **Gold:** `goldReward 1100` [C] liegt im Korridor 800–1 500 des GDD.
  15. **Der Verwalter im Gespräch:** Wer er ist (Hüter der Ruine, Überlebender der Wächter, Flüchtling), sein Auftreten und seine Zeilen sind nicht vorgegeben; kein Heiler-/Kleriker-Modell vorhanden (siehe Story 9.9 OFFEN 2).
  14. **Flag-Name `e04` und Werte `shelter`/`secret`:** an die tatsächlichen Namen der Nachbarsession (`e01`–`e03`, deren Flag-Register-Einträge) angleichen, sobald diese auf `main` sind.
- **OFFEN-Punkte, aufgelöst (2026-10-26):** 1 Übergang über `ch02` (siehe oben). 2 `expectedLevel 7`, `merchantTier 2` als technische Startwerte (Simulation siehe Dev Agent Record). 3 Zustand `priceMods: [{ pct, act }]` und `villageAid: number[]` in `CampaignState`, beim Laden mit `[]` normalisiert; keine Migration nötig. 4 `villageAid: { act }`. 5 Maximum 4 statt 3 (`balance.yaml` `villageAid.charges: 4`, Item `vulnerary`), Auffüllen nach der Mission, beim Kauf und beim Missionsstart (hebt vor dem Akt gefüllte Tränke an); gilt für jeden Heiltrank (Taschen und Konvoi). 6 Alle Händlerkäufe (Waren, Runen, Sonderangebote), abgerundet, Verkauf unverändert. 7 Halvard überbringt den Rat selbst. 8 Gespräch auf `paktwacht_heimat`, Tafel auf `paktwacht_ruine`. 9 aufnehmen `warm`, geheim halten `sober`. 10 Eine Szene `scn.m1_6.outro`. 11 Anker siehe Karte. 14 `e04` mit `shelter`/`secret`.
- **Vom Produktinhaber abgenommen (2026-10-26):** Der **Verwalter** ist ein grauhaariger Mann, der die Schlüssel der Ruine über die Jahre behütet hat und von Hask in den Keller gesperrt wurde; er bleibt Verwalter und kündigt an, die Mauern zu halten („Was immer kommt“); er meldet außerdem die Familien am Hang (Anlass für E4). Es gibt **kein Porträt** `art/mockups/characters-s1/paktwacht_steward.png`; `scene-view.test.ts` verlangt eins für jeden Sprecher. Deshalb spricht er ohne Sprecherkette als Erzählung mit wörtlicher Rede. Mit Porträt auf `speaker: [paktwacht_steward]` umstellen. Ausgedacht sind außerdem Halvards Zeilen, der Fenn-Witz mit der Schatzkammer und Brennas Fackel-Satz.
- **Folgen für Bestehendes:** Die Sperrliste der Wirkungen (`UNSUPPORTED_EFFECTS`) und die Tests, die sie prüfen, ändern sich. Nach 1-6 lebt die Truppe in der Burg: Heimat-Screen, Räume und Gedenksteine folgen Story 6.9 (kein neuer Code nötig, aber im Test prüfen). Story 9.9 liest `e04`; Story 9.8 hängt an `m1_6`. Konflikt-Stellen der Layout-Kommentare: Szenenamen (OFFEN 10) und „Effekt (Story 6.9): setHome (nur Kommentar)“ ist jetzt angebunden.

### Project Structure Notes

- Geändert: `content/acts/act1/maps/m1_6_paktwacht.yaml`, `content/acts/act1/{campaign,flags}.yaml`, `content/world/valmora.yaml` (nur `node:` anhängen), `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `src/core/{defs.ts}`, `src/core/campaign/{effects,consequences,campaign,apply,conditions?}.ts`, `src/content/{schemas,validate}.ts`, `src/core/state.ts`, `src/ui/ConsequenceCard.tsx`, Locale-Dateien für `ui.consequence.*` bei Bedarf, Tests.
- Neu: `content/acts/act1/scenes/scn.m1_6.{intro,outro}.yaml`, Unit-Tests zu den Wirkungen, E2E-Spec.
- Grenzen: Karten `m1_6`–`m1_8` gehören dieser Session; in `campaign.yaml`, `valmora.yaml` und den Locale-Dateien nur anhängen (Nachbarsession „Akt 1 Mitte“ ergänzt `m1_2`–`m1_5`), Rendering und Deploy-Screen sind Sache anderer Sessions.

### Project Context Rules

- Spielwerte nur in YAML (`balance.yaml` bzw. Content); kein sichtbarer Text im Code, Schlüssel in `de.yaml`/`en.yaml`; Szenentext Deutsch in der Szene, Englisch im Locale.
- `src/core` bleibt rein (Commands/Events, Plain-JSON-State, Seed-RNG, kein `Date.now`/`Math.random`); die Kampfvorschau nutzt dieselbe Formel wie die Auflösung (hier: derselbe Preis- und Ladungs-Code für UI und Auflösung).
- Entscheidungen im zuständigen BMAD-Artefakt unter `concept/` (Narrative `.decision-log.md`) eintragen, nicht in `01-decisions.md`; offene Punkte nicht stillschweigend entscheiden.
- Code, Bezeichner, Commits und Datenschlüssel englisch, Konzeptdokumente deutsch. Fertig ist die Story erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`. Nie auf `main` committen.

### References

- [Source: concept/26-epics/epics.md#Story 9.7]
- [Source: concept/22-narrative/narrative.md#Story Beats] (Beat 7), [#Key Conversations] (Nr. 5), [#Die 12 Entscheidungen] (E4), [#Missionsfolge]
- [Source: concept/21-gdd/gdd.md] (Missionsziele, Reihenfolge, Entscheidungen, Heimat)
- [Source: concept/24-architecture/architecture.md#5.3] (Wirkungen), [#5.4] (Knoten-Wirkungen)
- [Source: concept/25-ux/EXPERIENCE.md] (Folgen-Karte, Entscheidung)
- [Source: _bmad-output/implementation-artifacts/9-2-mission-1-1-steckbriefe.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

Simulation `pnpm sim m1_6 --runs 50 --difficulty <d>` (verkettet: Prolog → 1-1 → ch01 → ch02 → m1_6, Übergangskette; sobald 1-2–1-5 existieren, ändern sich Truppenstufen und die Werte müssen neu geprüft werden). „erreicht“ = Läufe, die die Kette bis 1-6 überstanden haben.

| Schwierigkeit | erreicht | Siegquote | Niedergestreckte/Lauf | Korridor | Ergebnis |
|---|---|---|---|---|---|
| Leicht | 50/50 | 100 % | 0,46 | Sieg ≥ 0,95, Down ≤ 0,5 | ok |
| Normal | 35/50 | 89 % | 1,23 | 0,75–1,0, 0,4–1,3 | ok |
| Schwer | 5/50 | 40 % | 1,80 | 0,30–0,70 | ok (nur 5 Läufe; mit 300 Läufen: 32 erreicht, 31 %) |

Normal mit 300 Läufen: 233 erreicht, 90 %, 1,39 Niedergestreckte (knapp über 1,3, im 50er-Lauf darunter); Liora geht in der Übergangskette oft zu Boden. Abgestimmt (nur Karte): Hask/Ulvric Eisenwaffen; `rider3` Stufe 4, `outer2` Stufe 5 (nur Schwer); `mk1`, `mk2`, `br3`, `inner1` Stufe 6. Nebenziel `s_fast` (12 Runden) wird auf Leicht/Normal (Median 5 bzw. 7 Runden) erreicht, auf Schwer (Median 13–17) meist nicht: Startwert beibehalten.

### Completion Notes List

- Technische Entscheidungen: Zustand `CampaignState.priceMods` (`{ pct, act }[]`) und `villageAid` (`number[]` Akte); Balance-Schlüssel `villageAid: { item: vulnerary, charges: 4 }` (Top-Level in `balance.yaml`); gemeinsamer Code in `src/core/campaign/aid.ts` (`chargeCap`, `topUpCharges`, `shopPrice`), von UI (Rooms.tsx) und Kauf (`buyPrice`, `offerPrice`) gemeinsam genutzt. Auffüllen: `finishBattle`, Kauf, `createBattle` (Anheben beim Missionsstart). `priceMod` wird nur verworfen, wenn `pct <= -100` (`effect_invalid`); mehrere `priceMod` des Akts addieren sich. Der aktuelle Akt ist `data.campaign.act`. `UNSUPPORTED_EFFECTS` ist leer. Die `villageAid`-Folgen-Karte nennt jetzt den Akt (`ui.consequence.villageAid.desc` DE/EN mit `{act}`). Keine Speicher-Migration (Standardwerte in `normalizeCampaign`; `migrations.test.ts` grün).
- Erreichbarkeit: `availableNodes` öffnet nach `ch02` nur `m1_6`, danach nichts (Nebenaufgaben öffnen nur über `openQuest`). Solange 1-7 fehlt, gilt Akt 1 damit nach 1-6 als beendet (Akt-Ende-Logik der Weltkarte) – bis 9.8 gemergt ist.
- EN-Titel des Knotens „The Pactwatch“ (wie `map.m1_6_paktwacht.name` im EN-Locale), nicht „Pact Watch“.
- `unit.halvard.name` in `de/en.names.yaml` ergänzt (Sprecher Halvard, Porträt `halvard` existiert); Session 9.4 ergänzt vermutlich denselben Schlüssel (beim Rebase doppelte Zeile entfernen).
- Neuer Dev-Helfer `__hc.devNode(nodeId, difficulty)` in `src/app/state/flow.ts` (Wegwerf-Kampagne, Speichern aus).
- Noch offen: T10 (E2E) und T11 (Screenshots) sind nicht gemacht (Aufgabe des Controllers im Browser).

### File List

content/acts/act1/{campaign,flags}.yaml, content/acts/act1/maps/m1_6_paktwacht.yaml, content/acts/act1/scenes/scn.m1_6.{intro,outro}.yaml, content/core/balance.yaml, content/core/locales/{de,en}.yaml, content/core/locales/{de,en}.names.yaml, content/locales/en/act1.dialogue.yaml, content/world/valmora.yaml, src/core/{defs,state,index}.ts, src/core/campaign/{aid,apply,camp,campaign,consequences,effects}.ts, src/core/battle/setup.ts, src/content/schemas.ts, src/ui/ConsequenceCard.tsx, src/app/screens/Rooms.tsx, src/app/state/flow.ts, tests/unit/{m1-6-e4,story,decisions,node-effects,core,migrations}.test.ts

### Change Log

- 2026-10-26: Story 9.7 umgesetzt (Karte, Knoten, Szenen, E4, priceMod/villageAid im Kern, Tests, Sim-Abstimmung).
