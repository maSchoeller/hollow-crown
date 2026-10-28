# Story 9.8: Mission 1-7 „Unter der Paktwacht“

Status: done

## Story

Als Spieler
möchte ich nach einem Beben das Gewölbe unter der Paktwacht bergen,
damit ich die Gräber junger Könige und die versiegelte Chronik finde.

## Acceptance Criteria

1. **Karte:** `m1_7_gewoelbe` (14 × 16, Nebel an, innen/Nacht, Fackeln) wird spielbar: Ziel `treasure` mit den Truhen `c_west`, `c_east`, `c_crypt_w`, `c_crypt_e`, `c_chronicle` und `turns: 14` (Einsturz). Der Platzhalter `rout` mit Niederlage `turn_limit 14` und das Nebenziel `s_chests` (`open_chests`) entfallen; die Niederlage `turn_limit` entfällt ebenfalls, weil `treasure` sie selbst auslöst. Kein Leutnant; Plünderer: Leicht 6, Normal 8, Schwer 10 (inklusive Wellen in Runde 2, 4, 6 vom eingestürzten Gang (13,2)/(13,3), angekündigt). Aufstellung 9 Plätze, max. 7, Avatar + Kael erzwungen.
2. **Chronik-Truhe:** `c_chronicle` (6,14) enthält kein Gold mehr als Platzhalter; die versiegelte Chronik ist **kein Gegenstand**. Beim Sieg (alle Truhen geöffnet, damit auch `c_chronicle`) setzt die Knoten-Wirkung von `m1_7` das Flag `wardens_chronicle` (`effects: [{ setFlag: wardens_chronicle }]`). Das Flag steht in `content/acts/act1/flags.yaml` (`kind: story`, `season2: true`); Akt 2 (Beat 10) liest es (Story liegt nicht hier).
3. **Chronik-Eintrag:** Ein Eintrag „Versiegelte Chronik im Burgarchiv“ erscheint in der Chronik-Ansicht, sobald `wardens_chronicle` gesetzt ist; er **zählt nicht** zu den 12 Chronik-Seiten (`balance.yaml` `chronicle.seasonPages`, Bedingung `chronicle: { min: 12 }`, Anzeige „gefunden / gesamt“ bleibt unverändert). Wie der Eintrag technisch entsteht: OFFEN 3 (Vorschlag: aus dem Flag abgeleitet, kein Eintrag in `c.chronicle`).
4. **Knoten:** `m1_7` in `campaign.yaml`: `map: m1_7_gewoelbe`, `titleKey: node.m1_7.title` („Unter der Paktwacht“ / „Beneath the Pactwatch“), `pre: scn.m1_7.intro`, `post: scn.m1_7.outro`, `requires: [{ completed: m1_6 }]`, `place: paktwacht_gewoelbe`, `effects: [{ setFlag: wardens_chronicle }]`, `expectedLevel` und `merchantTier` laut Dev Notes (OFFEN 1, 2). Nach 1-7 öffnet sich das Finale (Story 9.9, `fixed: finale`). Die Weltkarte bindet `m1_7` an den Knoten (`node: m1_7` in `valmora.yaml`).
5. **Szenen** (DE in der Szene, EN im Locale, je Box ≤ 110 Zeichen, Hintergrund `paktwacht_gewoelbe`):
   - `scn.m1_7.intro`: das Beben, die Burg ist Heimat, ein Gang bricht auf, Plünderer dringen ein; die Truppe steigt hinab.
   - **Grabreliefs (Beat 6 „Junge Könige“):** einmalige Szenen beim Betreten der Relief-Kammern (Terrain `shrine`, Kartenfelder: OFFEN 5), gesprochen von der Ersatzkette, die Inschriften lesen kann (Vorschlag `[ysolde, liora, rhen]`, Narrative: „Ysolde und Liora entziffern“). Inhalt: Inschriften mit Königsnamen und Jahreszahlen, deren Abstände kurz sind; leere Nischen, aus denen Chronik-Seiten fehlen (Narrative „Environmental/lore“, Paktwacht). **Der Pakt als Opfervertrag wird nicht ausgesprochen**; die Enthüllung ist über die Akte 1 bis 3 gestaffelt, Beat 10 (Akt 2) entziffert die Chronik.
   - `scn.m1_7.chronicle` beim Öffnen von `c_chronicle`: die versiegelte Chronik wird gefunden und bleibt versiegelt (Siegel, kein Entziffern), die Truppe nimmt sie mit ins Burgarchiv.
   - `scn.m1_7.collapse` bei Runde 2 (Beben, Einsturzwarnung) und `scn.m1_7.outro` (Heimkehr in die Burg, Ausblick auf das Finale).
6. **Schlüsselregel:** Die Türen `door_east` (8,7) und `door_crypt` (7,10) und die Truhen brauchen einen Schlüssel (`door_key`, fällt bei `l2` und `l4`, `drops: [1]`) oder einen Späher (Fenn). Die Mission muss auch ohne Fenn lösbar sein: Wie, ist OFFEN 4; bis dahin prüft die Simulation beide Fälle (mit und ohne Fenn).
7. **Heimsuchungs-Anker:** [7,7] Mittelgang, [6,13] Gruftsaal, [12,3] eingestürzter Gang als `haunts:` (Format `haunt-anchors-5-5.md`), sobald Story 5.5 auf `main` ist; sonst bleibt der Kommentarblock. Höchstens ein Anker je Variante; die Variante `treasure` verlangt `chests` und `turns` (Werte: OFFEN 6).
8. **Simulation:** `pnpm sim m1_7 --runs 50` liegt auf Leicht, Normal und Schwer im Korridor (`balance.yaml` `simulation.corridors`: Leicht Sieg ≥ 0,95, Niedergestreckte ≤ 0,5; Normal 0,75–1,0 und 0,4–1,3; Schwer 0,30–0,70); Plünderer-Stufen (Layout: 8, Welle 6: 9) und Rundenfrist werden abgestimmt; Zahlen im Dev Agent Record.
9. **Tests und Prüfungen:** Unit-Tests für den Knoten (Erreichbarkeit nach `m1_6`, Flag `wardens_chronicle` nur beim Sieg, nicht bei Niederlage durch Einsturz), für den Chronik-Eintrag (erscheint mit dem Flag, `found`/`total` bleiben unverändert, Speichern und Laden); E2E: 1-7 spielen bis zum Sieg (Spielstand per Dev-Helfer vorbereitet), Chronik-Ansicht zeigt den Eintrag. `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün.
10. **Screenshots** (375 × 812, angespielt): Karte mit Nebel, Relief-Szene, Chronik-Szene, Einsturz-Hinweis (Runde 2 und Fristanzeige), Ergebnis-Screen, Chronik-Ansicht mit dem Eintrag.

## Tasks / Subtasks

- [ ] T1 Karte `m1_7_gewoelbe.yaml`: Ziel `treasure` (Truhen, `turns 14`), Platzhalter `rout`/`turn_limit`/`s_chests` entfernen, Chronik-Truhe ohne Gold, Kommentare „PLATZHALTER bis 4.8“ entfernen (AC 1, 2)
- [ ] T2 Flag `wardens_chronicle` in `flags.yaml`; Knoten `m1_7`, `node.m1_7.title` in `content/core/locales/{de,en}.names.yaml`, `node: m1_7` in `valmora.yaml` (AC 2, 4)
- [ ] T3 Chronik-Eintrag „Versiegelte Chronik im Burgarchiv“ (Kern: Chronik-Ansicht; UI: `Chronicle.tsx`; Texte DE + EN; zählt nicht zu den 12) (AC 3)
- [ ] T4 Szenen `intro`, `reliefs` (je Kammer oder eine Szene mit Varianten), `chronicle`, `collapse`, `outro` in DE; Englisch im Locale; Auslöser als Karten-Trigger (`unit_enters` auf den Relief-Feldern, Truhe, `turn_start`) (AC 5)
- [ ] T5 Schlüssel- und Späher-Regel prüfen, Lösbarkeit ohne Fenn (AC 6)
- [ ] T6 Heimsuchungs-Anker (AC 7)
- [ ] T7 Sim-Abstimmung auf Leicht/Normal/Schwer, mit und ohne Fenn (AC 8)
- [ ] T8 Unit-Tests und E2E (AC 9)
- [ ] T9 Screenshots (AC 10)

## Dev Notes

- **Quellen:** Epics 9.8; Narrative „Story Beats“ 6 (Junge Könige, fest im Gewölbe 1-7) und 10 (Chronik entziffert in Akt 2, Burg-Szene), „Missionsfolge“ (1-7 ★: treasure, Plünderer, keine Leutnants; Grabreliefs, Chronik versiegelt gefunden), „History“ (Paktwächter, Chronik der Wächter), „Locations“ (Die Paktwacht: Gewölbe mit Gräbern junger Könige), Environmental Storytelling (Paktwacht: Inschriften, leere Nischen), „Found Documents“ (Chronik-Seiten: 4 je Akt, 12 insgesamt), Ersatzsprecher-Kette („Die Chronik entziffern Liora, sonst Ysolde, sonst Vesna, sonst Rhen“); GDD Missionsziele (`treasure`, Truhen vor Rundenlimit bergen; Niederlage bei `treasure` durch Rundenlimit), Reihenfolge 1-6 → 1-7 → 1-8; `content/acts/act1/maps/m1_7_gewoelbe.yaml` (Kommentare am Kopf).
- **Entscheidungen des Produktinhabers (bindend, 2026-10-26):**
  - Die versiegelte Wächter-Chronik ist **ein Flag** (z. B. `wardens_chronicle`), gesetzt, wenn die Chronik-Truhe geöffnet bzw. die Mission gewonnen ist, plus ein Chronik-Eintrag „Versiegelte Chronik im Burgarchiv“, der **nicht** zu den 12 Chronik-Seiten zählt. **Kein Gegenstand.**
  - Das Ziel `treasure` ersetzt den Platzhalter `rout`: Truhen `c_west`, `c_east`, `c_crypt_w`, `c_crypt_e`, `c_chronicle`, `turns: 14` (Einsturz).
- **Technische Fakten (geprüft):**
  - `treasure`: Schema `src/content/schemas.ts:304` (`chests: string[]`, `turns`); Auflösung `src/core/battle/objectives.ts:67-71`: Sieg, sobald alle Truhen `open` sind (`chestProgress`, ebd. `:77-80`); Niederlage, wenn zu Beginn einer Runde `turn > turns` (Grund `turns`). Der Kampf endet also beim Öffnen der letzten Truhe, nicht beim Besiegen der Plünderer; der Fixture-Test `tests/fixtures/maps/dev_treasure.yaml` ist die einzige bisherige Karte mit `treasure`. Die Autoplay-KI öffnet Truhen der Schatzsuche (`src/core/ai/autoplay.ts:41-48`), ein Späher von daneben, eine Einheit mit Schlüssel auf der Truhe.
  - Türen und Truhen: Späher öffnen ohne Schlüssel (`src/core/rules/scout.ts`), sonst `door_key` (`content/core/items.yaml:113`, `use.open: [door, chest]`, eine Ladung); `door_key` im Händler-Tier 0.
  - Wände und Türen sperren den Nebel (`balance.yaml` `fog.blockers`), Sicht 3, Späher/Schütze +2.
  - Der Kampf endet beim Sieg sofort; ein Knoten-`effects`-Eintrag wirkt nur beim Sieg (Architektur §5.3 „Stand“, `finishMission` nach den Dialog-Wirkungen). Deshalb setzt der **Knoten** das Flag; eine Truhe (`contents` = Belohnung mit `gold`, `item`, `material`, `recruit`, `dialogue`, `schemas.ts:349`) kann keine Wirkung auslösen, nur eine Kampf-Szene (`dialogue`).
  - Chronik: Seiten stehen in `content/acts/act1/chronicle.yaml` (heute leer), `c.chronicle` hält gefundene Seiten, `chronicleView` zählt `found`/`total` (`src/core/campaign/chronicle.ts`); die Chronik-Ansicht listet Entscheidungen und Seiten je Akt. Wirkung `{ chronicle: id }` legt eine Seite in `c.chronicle` und würde mitzählen, ist daher für den Eintrag **nicht** zu verwenden.
  - Flags: Inhalte dürfen nur deklarierte Flags setzen (`content/acts/act1/flags.yaml`, `kind: story|decision|quest|battle`, `season2`).
  - `expectedLevel`: Prüfung `src/content/validate.ts:289-297`.
- **Vorschläge der Story-Autorin (nicht entschieden):** `expectedLevel 8` (achte Mission des Akts nach der GDD-Kurve 1 → 9, Finale 10; Plünderer um Stufe 8 passen); `merchantTier 2`; Flag `wardens_chronicle` als Name aus der Entscheidung des Produktinhabers („z. B.“).
- **OFFEN:**
  1. **`expectedLevel`** von `m1_7` (Vorschlag 8; muss mit dem Wert von `m1_6` (Vorschlag 7) und `m1_8` (Vorschlag 10) wachsen).
  2. **`merchantTier`** (Vorschlag 2; es gibt nur Tiers 0–2).
  3. **Wie der Chronik-Eintrag technisch entsteht:** aus dem Flag abgeleiteter Eintrag in `chronicleView` (neues Feld) und `Chronicle.tsx`, mit Texten in Szene/Locale; oder ein eigener Ablageplatz. Vorschlag: abgeleitet, kein neuer Speicherzustand. Titel „Versiegelte Chronik im Burgarchiv“ ist vorgegeben, den Text (zwei Sätze) liefert die Narrative-Zeile (Beat 6/10); Akt, in dem der Eintrag steht: Akt 1.
  4. **Lösbarkeit ohne Späher und ohne Schlüssel:** Fenn kann fallen oder in E2 gehen (Story 9.5); `door_key` fällt nur bei zwei Plünderern (Layout `drops`); bei Plünderer-Niederlage ohne Drop wäre die Mission unlösbar. Optionen (Zusatzschlüssel in der Aufstellung oder im Konvoi, weitere Drops, Tür auf `door_open`) sind Produktentscheidung; das Layout nennt nur Schlüssel oder Späher.
  5. **Relief-Felder:** Der Kopfkommentar nennt die Auslöser (12,3)/(2,3)/(2,12)/(11,12) (vier Kammern, „Betreten der Kammern“). Das Terrain hat aber **sechs** `shrine`-Felder: (2,3), (11,3), (2,6), (11,6), (2,12), (11,12); (12,3) ist ein einfaches Bodenfeld neben dem eingestürzten Gang (13,3). Welche Felder lösen Reliefs aus (vier Szenen oder sechs, eine Szene mit Zeilen je Relief). `shrine` **heilt** laut Legendenkommentar: sechs Heilfelder in einer Schatzmission sind ein Balancing-Faktor.
  6. **Heimsuchungs-Anker** `treasure`: `chests` (Felder), `turns`, `enemySpawn`, `deploy`.
  7. **Chronik-Truhe ohne Inhalt:** eine leere Truhe oder ein symbolischer Inhalt (z. B. Gold niedrig); `contents` ist optional (`reward.optional()`).
  8. **Nebenziele:** `s_chests` entfällt (jetzt Pflicht), `s_clean` (Belohnung `torch`) bleibt; ein zweites Nebenziel (z. B. `turn_limit`, Belohnung [C]) ist offen. `goldReward 1400` [C] (Korridor 800–1 500).
  9. **Sprecher** der Relief-Zeilen (Vorschlag `[ysolde, liora, rhen]`; Gedenkzeile, falls beide fehlen, laut Narrative).
  10. **Weitere Szenen-Auslöser:** Wie `collapse` bei Runde 2 ausgelöst wird (`turn_start`-Trigger in `triggers:`), und ob Trigger-Szenen im Nebel sichtbar sind.
- **Folgen für Bestehendes:** `balance.yaml` `simulation` und das Sim-Werkzeug müssen `treasure` bei beiden Zielvarianten (Truhe vor Schlüssel) kennen (Autoplay hat es). Die Simulation wendet Knoten-Wirkungen selbst an (Fenn-Beitritt in 9.2). Story 9.9 setzt `m1_7` als Voraussetzung. `content/acts/act1/chronicle.yaml` bleibt leer, der Eintrag liegt nicht dort.

### Project Structure Notes

- Geändert: `content/acts/act1/maps/m1_7_gewoelbe.yaml`, `content/acts/act1/{campaign,flags}.yaml`, `content/world/valmora.yaml` (nur `node:` anhängen), `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `src/core/campaign/chronicle.ts`, `src/app/screens/Chronicle.tsx`, Texte, Tests.
- Neu: `content/acts/act1/scenes/scn.m1_7.{intro,reliefs,chronicle,collapse,outro}.yaml`, E2E-Spec.
- Grenzen: Karten `m1_6`–`m1_8` gehören dieser Session; Anhängen in `campaign.yaml`, `valmora.yaml`, Locales.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale; Code und Schlüssel englisch.
- `src/core` rein, Zufall nur aus dem Seed-RNG; Replays bleiben deterministisch (Treasure-Frist und Einsturz sind Regeln, kein Zufall).
- Entscheidungen im Narrative-Artefakt `concept/22-narrative/` und dessen `.decision-log.md`; offene Punkte (O1–O5, „Offene Fragen“ im Game Brief) nicht stillschweigend entscheiden. Fertig erst mit `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; nie auf `main` committen.

### References

- [Source: concept/26-epics/epics.md#Story 9.8]
- [Source: concept/22-narrative/narrative.md#Story Beats] (Beat 6, 10), [#Missionsfolge], [#Found Documents]
- [Source: concept/21-gdd/gdd.md] (Missionsziele, Reihenfolge)
- [Source: content/acts/act1/maps/m1_7_gewoelbe.yaml]
- [Source: _bmad-output/implementation-artifacts/9-2-mission-1-1-steckbriefe.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Folgearbeit 2026-10-27 (Produktinhaber, bindend): Zieltext `defend` jetzt „{name} schützen · {turns} Runden“ / „Protect {name} · {turns} turns“ (`ui.world.goal.defend`); in der Kampf-HUD-Pille entfällt bei `defend` der zweite Zähler „· Runde x von y“ (Battle.tsx, `goalProgress`), weil die Runden schon im Zieltext stehen; bei 375 px gemessen: „Dorfältester schützen · 8 Runden“ passt genau (200/200 px), EN „Protect Village Elder · 8 turns“ 178 px, kein Abschneiden.
- Simulator-Spieler für `defend` (src/core/ai/wardLine.ts, autoplay.ts, `balance.ai.wardLineMax: 4`): die Truppe hält eine Linie statt sich um den Schutzbefohlenen zu drängen. Die Linie ist der kleinste Knotenschnitt (Max-Flow, Feldkapazität 1) zwischen den Gegnern auf dem Brett und dem Schutzbefohlenen, ohne dessen Nachbarfelder, der dem Schutzbefohlenen am nächsten liegt; keine Kartenkoordinaten, deterministisch. Die zähesten Nicht-Lords (maxHp+DEF+RES) besetzen je ein Feld, nächster zuerst; alle anderen stehen hinter der Linie so nah wie möglich und kämpfen nur von dort, Besuche und Gespräche ruhen. Ist der Schnitt breiter als `wardLineMax` (offenes Dorf) oder steht schon ein Gegner auf/hinter der Linie, gilt das alte Verhalten (`wardGuardRadius`). 1-2 und ch02 haben am Start keine Linie (Test `ward-line.test.ts`); Flieger werden bei der Linie nicht berücksichtigt. `tools/simulate.ts` nennt jetzt den Niederlagegrund (`outcome:defeat:<reason>`).
- Simulation 2026-10-27 (gleiche Kette): 1-7 Leicht 96 % / 0,26 Niedergestreckte, Normal 34 % / 0,16, Schwer 4 % bei nur 24 erreichten; Armeestufe 4,1/5,3/6,1 gegen expectedLevel 8. Die Niederlagen sind fast alle Rundenfrist (`outcome:defeat:turns`, Normal 19 von 32), keine Gegnerstärke: kleine Armeen (2–6 Einheiten), Schlüssel liegen als Beute ungenutzt. Fristverlängerung probiert (16: 50 %, 18: 63 % Normal) und wieder auf 14 zurückgesetzt (kein Weg in den Korridor ohne Überstimmung; Ursache sind Armeestufe/Kettenlücke und der Truhen-Simulator, nicht die Karte). Kein Eingriff in Gegner.
- Gold: der Simulator zählt Truhengold zum Missionsgold (`BattleResult.gold` = goldReward + goldGained). Vorher 3 475 (Leicht) / 3 409 (Normal) gegen Korridor 800–1 500; jetzt goldReward 850 (war 1 400) und Truhengold 100/150/300 (waren 400/600/800), Summe 1 400, Nebenziel s_fast 400 = 47 % von goldReward (Korridor 30–50 %). Messung danach: 1 675 inkl. 275 Nebenziel-Gold (Leicht), Basis 1 400, kein Flag mehr. Kommentar „Feld folgt mit Story 8.6“ bereinigt.

### File List

### Change Log

### Entscheidungen des Produktinhabers (2026-10-26), umgesetzt

OFFEN 1: `expectedLevel 8`; 2: `merchantTier 2`; 3: Eintrag aus dem Flag abgeleitet (`balance.yaml` `chronicle.sealed`, `chronicleView` Feld `sealed` je Akt, Texte `chronicle.sealed.<flag>.title|text`, zählt nicht); 4: siehe Schlüsselregel; 5: zwei Reliefs lösen Szenen aus ((2,6) Westkammer, (2,12) Gruftsaal); alle sechs Felder sind Terrain `relief` (Requisite shrine, heilt nicht); 6: Anker rout/defend/treasure; 7: `c_chronicle` ohne `contents`; 8: `s_clean` + `s_fast` (turn_limit 11, Gold 400 [C]); 9: Kette `[ysolde, liora, avatar]`; 10: `turn_start`-Trigger Runde 2.

## Dev Agent Record

### Technische Entscheidungen
- Schlüsselregel: 7 Schlösser, jeder Plünderer trägt Schlüssel und lässt sie fallen (l2, l4 je zwei): Leicht 8, Normal 10, Schwer 12; `c_west` gibt einen Schlüssel zurück. Ein „offene Truhe am Start“ ist im Motor nicht darstellbar (jede Truhe braucht Schlüssel). Hinweis: Tasche = 3 Plätze; fällt ein Schlüssel in eine volle Tasche, geht er in den Konvoi.
- `content:check` (treasure) verlangte Späher/Schlüssel von Spieler, erzwungener Figur oder Dorf: erweitert um einen Gegner, der einen Schlüssel fallen lässt (+ Test).
- Sim-KI (`src/core/ai/autoplay.ts`), nur Schatzsuche: öffnet Türen, läuft per Wegsuche (BFS) zu Schlössern, holt Schlüssel-Beute (nächste Einheit mit Platz in der Tasche). Vorher konnte sie keine Schatzkarte mit Türen gewinnen (0 % Siege, Belege oben). Ohne Rückfrage geändert: bitte prüfen.
- Chronik-Eintrag: Flag von der Knotenwirkung beim Sieg (Truhe kann keine Wirkung auslösen); Anzeige in „Chronik-Seiten“ des Akts.
- Neues Terrain `relief`; Namen `terrain.relief`. Szenen `relief_west`, `relief_crypt` (Tafel `grabreliefs`), `collapse`, `chronicle`, `intro`, `outro`; Verwalter spricht als `paktwacht_steward`. Königsnamen/Jahreszahlen (Hadric II. 88–96, Osmund III. 96–101) sind ausgedacht. Outro-Hintergrund `paktwacht_heimat`.
- Anker: Gruftsaal liegt hinter Tür, deshalb stattdessen Mittelgang (rout), eingestürzter Gang (defend), Westkammer (treasure).
- `__hc.devNode`: hebt alle auf `expectedLevel` des Knotens mit `levelUp` (die Sim `--fresh` levelt nicht, es gibt keine zweite Formel). Im Browser nicht durchgespielt.
- Tests anderer Dateien angepasst: core.test (Orte), migrations.test (Knoten), m1-6-e4.test (nach m1_6 öffnet sich m1_7), chronicle.test (`sealed`).

### Simulation (50 Läufe, verkettet; Gegnerstufe 6, Wellen 6/7)
| m1_7 | gespielt | Sieg | Niedergestreckte |
|---|---|---|---|
| Leicht | 50/50 | 98 % | 0,36 (ok) |
| Normal | 33/50 | 42 % (Korridor 75–100 %) | 0,36 |
| Schwer | 2/50 | 0 % (zu wenige) | 1,5 |
Normal liegt außerhalb: auch mit Stufe-3-Gegnern nur 61 %, weil die Rundenfrist (14) mit den kleinen Truppen der Kette (2–7 Einheiten) und der Schlüssel-Logistik der KI nicht reicht. `--fresh` Leicht: 100 % (8,5 Runden), aber ~16 s je Lauf (Normal/Schwer fresh nicht fertig gerechnet).
m1_6 (Stufe br1 und Wolfsreiter auf 5): Normal 200 Läufe 1,20 Niedergestreckte (vorher 1,34), Sieg 96 %; Leicht 100 %/0,34; Schwer 40 %.

### Offen
- Normal/Schwer-Korridor von m1_7 nicht erreicht; E2E und Screenshots nicht erstellt.

- **Kontrolleur (2026-10-26):** Normal (42 %) und Schwer liegen in der Zwischenkette (prologue → m1_1 → ch01 → ch02 → m1_6 → m1_7) außerhalb des Korridors; `--fresh` Normal 10 % (Rekruten auf Beitrittsstufe, nicht aussagekräftig). Abstimmung von m1_6–m1_8 erfolgt nach dem Merge von 9.3–9.6 auf der echten Kette, vor dem PR. Die Änderung an `src/core/ai/autoplay.ts` (Schatzsuche öffnet Türen, holt Schlüssel) ist geprüft und übernommen. Offen: Beute zeigt übrige Schlüssel einzeln (8×), Truhengold hebt die Beute auf 3 600.

## Abnahme 2026-10-27

Abgenommen (Status done). Verdacht geklärt: der Simulator (kein Bergen, volle Taschen, Leerlauf), nicht die Karte. Simulator und Schlüsselbund behoben (PR #71); verkettet Leicht 100 %, Normal 90 %. E2E `tests/e2e/m1-7.spec.ts`, Chronik-Eintrag gesehen. Offen beim Produktinhaber: Niedergestreckte Normal 0,14 (Korridor ab 0,4). Gesamtbefund: `acceptance-2026-10-27.md`.
