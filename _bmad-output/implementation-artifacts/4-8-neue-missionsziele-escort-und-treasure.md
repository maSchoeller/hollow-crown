# Story 4.8: Neue Missionsziele escort und treasure

Status: review

## Story

Als Spieler
möchte ich Eskorten und Truhenjagden spielen,
damit Missionen und Heimsuchungen abwechslungsreich sind.

## Acceptance Criteria

1. **escort:** Auf einer Karte mit Ziel `escort` (NPC, Ausgang) ist die Mission gewonnen, sobald der NPC den Ausgang erreicht; fällt der NPC, ist sie verloren.
2. **treasure:** Auf einer Karte mit Ziel `treasure` (Truhen, Rundenlimit) ist die Mission gewonnen, wenn alle Truhen vor Ablauf des Limits geborgen sind; läuft das Limit ab, ist sie verloren.
3. **Anzeige:** Beide Ziele erscheinen in Rundenpille, Knoten-Karte und Vorschau der Mission (Aufstellung und Ziele-Blatt), mit Stand (Truhen x von n, Runde t von T).
4. **Absicherung:** Zod-Schema, `content:check` und Tests decken beide Ziele ab (Sieg, Niederlage, Grenzfälle, Replay-Determinismus).

Die Details hinter den Kriterien (Steuerung des NPC, „geborgen“, Zählung des Limits, Texte) sind am 2026-10-24 entschieden und stehen unter „Entscheidungen des Produktinhabers“.

## Tasks / Subtasks

Alle Aufgaben sind erledigt; die Fragen F1–F11 sind am 2026-10-24 vom Produktinhaber entschieden (siehe unten).

- [x] T1 Schema und Typen (AC 1, 2, 4)
  - [x] `ObjectiveDef` in `src/core/defs.ts` und `objective` in `src/content/schemas.ts` um `escort` und `treasure` erweitern (Felder je Antwort auf F1, F3, F7, F8)
  - [x] `content:check` (`validateMap`, `src/content/validate.ts`): Einheit bzw. Truhen-IDs existieren, `turns` > 0, Erreichbarkeit. Die vorhandene Prüfung läuft nur für `reach`/`seize`/`escape` und nur vom ersten Einsatzfeld; für `escort` vom Startfeld des NPC zum Ausgang (Bewegungsart des NPC), für `treasure` von jedem Einsatzfeld zu jeder Truhe (Architektur §5.6 verlangt „von jedem Einsatzfeld“)
- [x] T2 Kern (AC 1, 2)
  - [x] `checkObjectives` (`src/core/battle/objectives.ts`): `case 'escort'` und `case 'treasure'`, Niederlage mit `defeatReason` (NPC-Id bzw. `turns`), damit `defeatSentence` (`resultView.ts`) ohne Umbau greift oder erweitert wird
  - [x] Fortschritt als reine Funktion (Muster `sideObjectiveProgress`): Truhen `{ have, total }`, Runde `{ turn, turns }`
  - [x] Öffnen zählt über den Zustand `s.objects[].state === 'open'` bzw. `s.stats.chestsOpened`, nicht über die Art des Öffnens (2.6 ändert die Aktion)
  - [x] NPC-Verhalten je Antwort auf F1/F2 (KI-Profil in `src/core/ai/ai.ts` oder Steuerung durch den Spieler)
  - [x] Gegner-KI: `objectiveUnit` in `attackPlans` kennt heute nur `defend`; je Antwort auf F4 auch den Eskorte-NPC
- [x] T3 Anzeige (AC 3)
  - [x] Rundenpille: `goalText`/`goalProgress` in `Battle.tsx` (heute nur `rout`, `defend`, `survive` mit Fortschritt)
  - [x] Ziele-Blatt `ObjectivesPanel` (`BattlePanels.tsx`): Sieg-Text, Niederlage-Zeile für das Limit
  - [x] Knoten-Karte: `GOAL_ICON` und `ui.map.tag.<ziel>` in `WorldMap.tsx`
  - [x] Vorschau/Aufstellung `Prep` in `Camp.tsx` (`ui.world.goal.<ziel>`)
  - [x] Brett: Ausgang als Zielfeld-Markierung (`goal`-Overlay in `Battle.tsx`, heute `reach`/`seize`/`escape`); Truhen sind schon Brett-Objekte
  - [x] Texte nur als Schlüssel in `content/core/locales/{de,en}.yaml` (Wortlaut je Antwort auf F11)
- [x] T4 Tests (AC 4): siehe Dev Notes „Testkarten“
  - [x] Sieg/Niederlage je Ziel, Limit-Grenze (letzte Spielerphase, Beginn der Folgerunde), gleichzeitig Truhe geöffnet und Limit, NPC fällt in der Gegnerphase, Replay (Startzustand + Command-Log) identisch
  - [x] Schema-Fälle (fehlende Einheit, unbekannte Truhe, `turns` ≤ 0, unerreichbarer Ausgang oder unerreichbare Truhe)
  - [x] `pnpm sim` für Karten mit den neuen Zielen: siehe F9

## Dev Notes

### Bestand (geprüft im Code, Stand ff84659)

- **Siegprüfung:** `checkObjectives` in `src/core/battle/objectives.ts`: erst `defeat` (`unit_dies`, `turn_limit`), dann `switch (victory.type)` für `rout`, `boss`, `reach`, `defend`/`survive`, `escape`, `seize`. `turn_limit` verliert erst zu Beginn einer neuen Runde (`phaseStart && s.turn > turns`), `defeatReason = 'turns'`. `unit_dies` zählt bei Nicht-Spielern schon `downed` als gefallen. Die Prüfung läuft nach jeder Einheiten-Aktion (`applyAct`) und an den Phasengrenzen (`endPlayerPhase`).
- **Dritte Partei:** `Team` ist `player | enemy | other`. Die Spielerphase steuert nur `player` (`not_your_phase`); `other` zieht nach den Gegnern per `runAiPhase`. Beispiel: Liora in `ch02_silverbrook.yaml` (`team: other`, `ai: hold`, `defend` plus `unit_dies liora`). Ein niedergestreckter Nicht-Spieler stirbt sofort (`knockOut`).
- **KI-Profil `flee`** (`ai.ts`): läuft zu `ai.area`, setzt dort `gone = 'escaped'` und das Event `escaped`. `finishMission` (`campaign.ts`) lässt einen überlebenden `other`-NPC mit Figur nach der Mission beitreten, auch wenn er `escaped` ist.
- **`reach`** wertet nur Einheiten von `team: player`; die Aktion `escape` gibt es nur für Spielereinheiten im `escape`-Bereich (`actions.ts`).
- **Truhen heute:** nur Spielereinheiten, stehend auf dem Truhenfeld, mit Schlüssel (`hasKey`, verbraucht eine Ladung); setzt `obj.state = 'open'`, `stats.chestsOpened`, gibt `contents` (`grantReward`). Nebenziel `open_chests` zählt alle Truhen der Karte. **Story 2.6 (backlog)** ersetzt das durch „Öffnen“ des Spähers ohne Schlüssel, vom Nachbarfeld; Kontext-Band in 2.7.
- **Rundenpille:** `TurnPill` (`BattleHud.tsx`) bekommt Text `ui.world.goal.<typ>` und `progress` aus `Battle.tsx`. Die Zieltexte `ui.world.goal.*` nennen heute feste Namen („Beschütze Liora …“, „Kael muss …“).
- **Knoten-Karte** ist `WorldMap.tsx` (`wm-card`, `GOAL_ICON`, `ui.map.tag.*`); die Vorschau vor dem Start ist `Prep` in `Camp.tsx`. Die Umbauten an `render/board` und `content/world/` (andere Session) berühren diese Story nicht; `WorldMap.tsx` selbst nur in `GOAL_ICON`/Tag-Zeile (kleiner Merge-Konflikt möglich, vorher Stand der Weltkarten-Arbeit prüfen).
- **Autoplay/Sim:** `autoCommand` (`src/core/ai/autoplay.ts`) kennt `reach`, `seize`, `escape`, `defend` (Schützling) und Dörfer, aber weder Truhen noch Eskorte. `tools/simulate.ts` hat nur `--campaign … --haunts`; das in Architektur §5.6 genannte `pnpm sim --haunt <mapId>:<variant>` gehört zu Story 5.5/5.6.
- **Inhalte:** Keine Karte nutzt `escort` oder `treasure`. Erste Karten kommen in Epic 9 (1-3 Liora, 1-7 Gewölbe), Epic 11/12 (2-2, 2-3, 3-2) und als Heimsuchungs-Anker (5.5).

### Testkarten

Keine echte Karte nötig: `validateContent` und der Kern arbeiten auf `GameData` im Speicher, `tests/unit/class-actions.test.ts` baut seine Lage aus dem Prolog-Zustand. Fixtures im Test (Karte klonen, Ziel setzen, Truhen und NPC platzieren) decken Schema, Regeln und Replay. Eine ausgelieferte Testkarte würde in einem Paket landen (`content/packs.yaml`); siehe F9.

### Randbedingungen aus anderen Artefakten

- Heimsuchungs-Anker (Architektur §5.6): `treasure` mit `chests: [[x,y], …]` (Positionen), `turns`, Spawn- und Einsatzzone; ein `escort`-Anker ist noch nicht beschrieben. Die Ziel-Form muss mit generierten Truhen (IDs vom Generator) und einem Eskorte-NPC aus dem Anker vereinbar sein (Story 5.5).
- Narrative: 1-7 „vor dem Einsturz bergen“ (treasure, Plünderer, kein Leutnant), 1-3 escort Liora, 2-3 escort Odile, 3-2 escort Harlan; 2-2 treasure (Grell).
- GDD „Sieg und Niederlage“: Schutzziel fällt = verloren; `treasure` verliert beim Ablauf des Rundenlimits.
- Spielwerte nie im Code; Beträge als Symbol + Zahl; kein sichtbarer Text im Code; Styles in der Datei des Screens.

### Project Structure Notes

- Voraussichtlich berührt: `src/core/defs.ts`, `src/content/schemas.ts`, `src/content/validate.ts`, `src/core/battle/objectives.ts`, `src/core/ai/ai.ts` (NPC-Profil, Gegner-Gewichtung), `src/core/ai/autoplay.ts` (nur je F9), `src/core/campaign/resultView.ts` (Niederlage-Satz), `src/app/screens/{Battle,BattleHud,BattlePanels,WorldMap,Camp}.tsx`, `content/core/locales/{de,en}.yaml`, neu `tests/unit/objectives-escort-treasure.test.ts`, Doku in `concept/24-architecture/{architecture,decision-log}.md` und `concept/21-gdd/decision-log.md`.

### Project Context Rules

- Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; `src/core` bleibt rein (kein DOM, kein `Math.random`, kein `Date.now`); Zufall nur aus dem Seed-RNG.
- Entscheidungen in `.decision-log.md` des zuständigen Artefakts, nie in `01-decisions.md`.

### References

- [Source: concept/26-epics/epics.md#Story 4.8]
- [Source: concept/21-gdd/gdd.md#Sieg und Niederlage; #Missionsziele; #Heimsuchungen]
- [Source: concept/24-architecture/architecture.md#5.6 Tageswechsel und Heimsuchungen]
- [Source: concept/25-ux/DESIGN.md#Ziel-Pillen; #Knoten-Karte]
- [Source: concept/22-narrative/narrative.md (Missionstabellen Akt 1–3)]
- [Source: _bmad-output/implementation-artifacts/2-3-klassen-aktionen-zielen-fernbergen-und-anfeuern.md]
- Abhängigkeit: Story 2.6 (`2-6-nebel-des-krieges-oeffnen-und-stehlen.md`, ready-for-dev; Öffnen als `open{object}` ohne Schlüssel; dort offen: F4 Öffnen/Schlüssel, F13 Ziele im Nebel, F16 Schloss-Truhen), Story 2.7 (Kontext-Band „Öffnen“), Story 5.5 (Anker)

### Entscheidungen des Produktinhabers (2026-10-24, alle Fragen entschieden)

Die Fragen unten bleiben als Herleitung stehen; die Entscheidung je Frage:

| Frage | Entschieden |
|---|---|
| F1 Steuerung | A: Dritte Partei (`team: other`) mit KI |
| F2 Verhalten | B, neues Profil `follow`: wartet, bis ein Spieler in der Nähe ist, zieht mit dem Trupp zum Ausgang, meidet Gefahrenfelder, kämpft nicht; Werte in `balance.yaml` |
| F3 Ausgang | A mit Verhalten B: `area`; der NPC verschwindet dort (`gone = 'escaped'`) und tritt nach der Mission der Truppe bei (datengetrieben: Feld `join` im Ziel, Standard true) |
| F4 Gegner | A: gleiche Gewichtung wie das `defend`-Ziel (`objectiveBonus`) |
| F5 Niederlage | A: implizit durch den Zieltyp (NPC fällt oder ist niedergestreckt) |
| F6 Öffnen | B: Einheit mit Schlüssel oder Späher ohne Schlüssel; `content:check` prüft, dass die Karte einen Öffner mitbringt |
| F7 Geborgen | A mit expliziter Liste `chests`; geborgen = Objektzustand `open` |
| F8 Limit | A mit `turns` im Ziel (wie `turn_limit`) |
| F9 Tests | B: Autoplay lernt beide Ziele; Fixture-Karten `dev_escort`/`dev_treasure` (keine ausgelieferte Karte) |
| F10 Nebenziele | A: nur Hauptziele |
| F11 Wortlaut | „Bringt {name} zum Ausgang“ / „Bring {name} to the exit“, Chip „Eskorte“/„Escort“; „Bergt alle Truhen in {turns} Runden“ / „Recover every chest within {turns} turns“, Chip „Truhenjagd“/„Treasure hunt“; Pille „2/5 Truhen · Runde 3 von 8“; Icons aus dem Bestand (`escape`, `chest`) |

### Fragen (Herleitung)

**F1 Wer steuert den Eskorte-NPC?**
- A) Dritte Partei (`other`) mit KI. Passt zu Phase „Dritte“ und zum Bestand (Liora, `finishMission`).
- B) Der Spieler steuert den NPC (Team `player` mit Pflicht-Flag). Mehr Handlungsfreiheit, aber Niedergestreckte bluten und sind bergbar, der NPC läuft durch Aufstellung und Roster.
- Empfehlung: A.

**F2 Welches KI-Verhalten, wenn A?**
- A) Vorhandenes `flee`: läuft allein zum Ausgang.
- B) Neues Profil (z. B. „folgt“): wartet, bis ein Spieler neben ihm steht oder in Radius ist, und zieht dann mit dem Trupp zum Ausgang; hält Abstand zu Gegnern.
- C) `trigger`/`hold` wie Liora: bleibt stehen, bis ein Trigger es freigibt.
- Empfehlung: B, weil `flee` den NPC ungeschützt vorrennen lässt. Bleibt zu klären, ob er kämpft (Liora heilt/zaubert) oder nur zieht.

**F3 Ausgang: Bereich oder Feld, und was zählt als „erreicht“?**
- A) `area` wie bei `reach`/`escape` (Rechteck oder Feldliste, ein Feld ist ein Sonderfall); Sieg, sobald der NPC im Bereich steht.
- B) Wie A, der NPC verlässt dabei die Karte (`gone = 'escaped'`, wie `flee`).
- C) Genau ein Feld.
- Empfehlung: A mit Verhalten B (verschwindet, tritt danach bei). Zu klären, ob ein Spieler dabei sein muss.

**F4 Gegnerverhalten gegen den NPC?** Heute bevorzugt die KI nur das `defend`-Ziel (`objectiveBonus`).
- A) Gleiche Gewichtung für den Eskorte-NPC.
- B) Keine Sonderbehandlung.
- Empfehlung: A. Zu klären: ob „fällt“ schon bei 0 TP (Nicht-Spieler stirbt sofort) oder erst bei Tod gilt; heute ist beides dasselbe.

**F5 Wie wird die Niederlage „NPC fällt“ angegeben?**
- A) Implizit durch den Zieltyp `escort`.
- B) Zusätzlich `unit_dies` in `defeat`, wie bei `defend` auf `ch02` (zwei Quellen).
- Empfehlung: A (eine Quelle; bei B prüft `content:check`, dass beides zusammenpasst).

**F6 Wer darf eine Truhe bergen (öffnen)?**
- A) Nur der Späher (GDD: Öffnen ohne Schlüssel).
- B) Jede Spielereinheit mit Schlüssel (Bestand), plus Späher ohne Schlüssel nach 2.6.
- C) Jede Einheit auf dem Feld ohne Bedingung.
- Empfehlung: B (folgt 2.6, was Öffnen erlaubt). Folgefrage: Muss `content:check` oder die Vorschau warnen, wenn die Truppe keinen Späher/Schlüssel hat (Prolog-Truppe hat keinen)? Empfehlung: Schlüssel als Beute oder fester Späher im Einsatz je Karte sichern, Hinweis in der Vorschau.

**F7 Was heißt „geborgen“ und welche Truhen zählen?**
- A) Geöffnet (Zustand `open`); Inhalt geht wie bisher an den Öffner (`contents`).
- B) Geöffnet und der Inhalt aus der Karte getragen (Beute-Zustand).
- C) Alle Truhen der Karte zählen, oder nur eine explizite Liste `chests: [id, …]` (der Rest bleibt Nebenziel `open_chests`).
- Empfehlung: A mit expliziter Liste. Zu klären: Inhalt bei Heimsuchungs-Truhen (nur Positionen im Anker) aus Pool oder Balance; auf Nebelkarten, ob Truhenfelder aufgedeckt sind.

**F8 Zählung des Rundenlimits und Ort der Zahl.**
- A) Wie `turn_limit` heute: Sieg noch in der letzten Spielerphase von Runde N möglich, Niederlage zu Beginn von Runde N+1.
- B) Limit läuft nach der Gegnerphase von Runde N ab (Gegner können noch eingreifen; Niederlage vor Runde N+1, praktisch gleich).
- Ort: `turns` im Ziel selbst (wie `defend`/`survive`) oder als separater `turn_limit` in `defeat`.
- Empfehlung: A, `turns` im Ziel (eine Quelle für Pille, Blatt und Satz „Die N Runden sind verstrichen …“).

**F9 Testkarten, Autoplay und Sim.**
- A) Nur Fixtures in Unit-Tests; Autoplay/Sim kommen mit der ersten echten Karte (Epic 9 / Story 5.5).
- B) Autoplay jetzt erweitern (Truhen öffnen, NPC mitführen), damit `pnpm sim` die Ziele spielt.
- C) Eine ausgelieferte Testkarte (landet im Paket, nicht im Spiel verknüpfen).
- Empfehlung: A. Folge: Sim würde auf einer solchen Karte vor B/9.x 0 % Sieg melden, der Autoplay öffnet auch mit Schlüssel keine Truhe. Gehört `--haunt` (Architektur) schon hierher? Empfehlung: nein, Story 5.5/5.6.

**F10 Auch als Nebenziele?** GDD-Liste kennt `open_chests` und `protect_npc`; `escort`/`treasure` stehen nur bei Hauptzielen.
- A) Nur Hauptziel.
- B) Auch Nebenziel (neue `SideObjectiveDef`-Typen).
- Empfehlung: A (`protect_npc` und `open_chests` decken die Fälle).

**F11 Wortlaut und Symbole.** Zieltexte brauchen den Namen (Parameter `{name}` statt fest „Liora“), Knoten-Chip, Pille mit Stand, Niederlage-Zeile. Vorschlag zur Bestätigung: „Bringt {name} zum Ausgang“ (Chip „Eskorte“), „Bergt alle Truhen in {turns} Runden“ (Chip „Truhenjagd“, wie EXPERIENCE.md Zeile 204), Pille „2/5 Truhen · Runde 3 von 8“; Icons: `escape` bzw. `chest` aus dem Bestand oder neue Glyphen. Freigabe nötig, auch für Englisch.

## Dev Agent Record

### Umsetzung

- **Schema/Typen:** `ObjectiveDef` und `objective` (Zod) um `escort { unit, area, join? }` und `treasure { chests, turns }` erweitert; `AiDef.profile` um `follow`; `balance.ai.followRadius` (4) und `followDanger` (100).
- **Kern:** `checkObjectives` (`objectives.ts`): `escort` (Sieg bei `gone === 'escaped'` oder NPC im Ausgang, Niederlage bei Tod/niedergestreckt mit `defeatReason` = NPC-ID), `treasure` (Sieg, wenn alle Listen-Truhen `open`, Niederlage `turns` zu Beginn der Folgerunde); `chestProgress` als reine Funktion; `defeatSentence` liest das Limit auch aus dem Ziel; `finishBattle` beachtet `join: false`. Keine neuen Events (`escaped` und `opened` bestehen), `filterEvents` unverändert.
- **KI:** Profil `follow` (`followStep` in `ai.ts`); `attackPlans` gewichtet den Eskorte-NPC wie das `defend`-Ziel. Öffentliche Signaturen unverändert.
- **content:check:** `validateEscort` und `validateTreasure` (siehe Architektur-decision-log, Eintrag 2026-10-25): Öffner-Prüfung = Spielereinheit der Karte, erzwungene Figur oder Dorf-Belohnung, die Späher ist oder einen Truhen-Schlüssel trägt.
- **Autoplay:** abgegrenzter Block in `autoCommand`: Spieler marschieren zum Ausgang, bleiben aber im Radius des NPC (zu weit weg: zurück zum NPC); Späher und Schlüsselträger öffnen die Ziel-Truhen (`errand` mit `chests`) und laufen zur nächsten geschlossenen. Nur bei diesen Zielen aktiv.
- **Anzeige:** `src/ui/goalText.ts` (`goalLine`, `goalStand`); Rundenpille (Truhenjagd zeigt den Stand statt des Satzes), Ziele-Blatt (Stand, Niederlage-Zeilen aus dem Ziel), Brett-Zielmarkierung für den Ausgang, `GOAL_ICON` und Chips, Vorschau `Prep`. Texte de/en.
- **Tests/Fixtures:** `tests/unit/objectives-escort-treasure.test.ts` (34 Tests), `tests/fixtures/devObjectiveMaps.ts`, `tests/fixtures/maps/dev_escort.yaml`, `dev_treasure.yaml`.

### Prüfung

- `pnpm lint`, `pnpm test` (51 Dateien, 609 Tests, vor den letzten Fixture-/Pillen-Änderungen; danach Neulauf der Datei), `pnpm content:check`, `pnpm build` grün.
- `pnpm sim` (50 Läufe): prologue_caravan normal 96 %/0,48 hard 46 %, ch01_varnhold normal 81 %/0,21 hard 48 %, ch02_silverbrook normal 82 %/0,69 hard 27 % – unverändert.
- Autoplay gewinnt beide Fixture-Karten (Seeds 1–3 im Test, 1–8 geprüft).
- Browser (390×844, `__hc.devMap`): Pille und Ziele-Blatt beider Karten, Vorschau der Eskorte; Screenshots `4-8-*.jpg` im Scratchpad.

### Hinweise

- Die Knoten-Karte (`WorldMap.tsx`: Chip, Icon) und die Aufstellung sind nur über Typ und Texte geprüft, da keine ausgelieferte Karte die Ziele nutzt.
- Eine andere Session ändert `actions.ts`/`autoplay.ts` (Flucht-Regel, Kael zuletzt); die Änderungen hier in `autoplay.ts` sind auf den Block mit `openable`/`npc`, `errand(... chests)` und die Imports begrenzt.

### File List

- content/core/balance.yaml
- content/core/locales/de.yaml
- content/core/locales/en.yaml
- src/core/defs.ts
- src/content/schemas.ts
- src/content/validate.ts
- src/core/battle/objectives.ts
- src/core/campaign/campaign.ts
- src/core/campaign/resultView.ts
- src/core/ai/ai.ts
- src/core/ai/autoplay.ts
- src/ui/goalText.ts (neu)
- src/app/screens/Battle.tsx
- src/app/screens/BattlePanels.tsx
- src/app/screens/Camp.tsx
- src/app/screens/WorldMap.tsx
- tests/unit/objectives-escort-treasure.test.ts (neu)
- tests/fixtures/devObjectiveMaps.ts (neu)
- tests/fixtures/maps/dev_escort.yaml (neu)
- tests/fixtures/maps/dev_treasure.yaml (neu)
- concept/24-architecture/decision-log.md
- concept/21-gdd/decision-log.md
- _bmad-output/implementation-artifacts/4-8-neue-missionsziele-escort-und-treasure.md
