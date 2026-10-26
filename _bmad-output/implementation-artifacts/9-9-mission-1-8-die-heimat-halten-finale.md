# Story 9.9: Mission 1-8 „Die Heimat halten“ (Finale)

Status: ready-for-dev

## Story

Als Spieler
möchte ich die neue Heimat gegen alle Banden verteidigen,
damit Akt 1 mit etwas endet, das der Truppe gehört.

## Acceptance Criteria

1. **Karte:** `m1_8_paktwacht_halten` (16 × 20, dieselbe Burg von innen, Abend dann Nacht, Regen) wird spielbar: Ziel `defend` der Einheit `steward` (Verwalter im Bergfried (8,3)) über `turns: 10`; Niederlage bei Tod von Kael, Avatar oder Verwalter. Aufstellung 9 Plätze im äußeren Hof, max. 7, Avatar + Kael erzwungen. Drei Wellen: Süden ab Runde 1 (Hask), West/Ost in Runde 4 (Ulvric, Grosk), alle Seiten in Runde 7 (Morra führt von Süden); Wellen angekündigt. Gegnerzahl: Leicht 13, Normal 15, Schwer 17. Ulvric und die Wolfsreiter wechseln von `class: vanguard` auf `wolf_rider`.
2. **Der Verwalter:** neue NPC-Einheit `steward` (Team `other`, Name `unit.paktwacht_steward.name` „Verwalter“/„Steward“), unabhängig von E4; eingeführt im Gespräch „Eine Burg für Niemande“ in `scn.m1_6.outro` (Story 9.7: eine kurze Zeile, in der die Truppe ihn trifft; die Zeile ergänzt 9.7 und wird dort geliefert, siehe Dev Notes). Wirkt als Schutzziel; Klasse, Modell/Sprite und Werte: OFFEN 2.
3. **Leutnants:** Hask, Ulvric, Morra (führt), Grosk **nur, wenn er nicht gewechselt ist**: ein beigetretener Grosk (Flag `joined_grosk`, E3 „verschonen“) steht nicht auf der Karte (`setup.ts:77`, wirkt für Welle-Einheiten über `createBattle`/`spawnUnits`; mit Test belegen). Alle vier tragen Leutnant-Verhalten (Flucht bei 0 TP, Groll, Kopfgeld, Zeilen aus `scn.lt.<id>`). Leutnant-Stufen werden berechnet; die Kartenwerte `level` sind Platzhalter.
4. **Morra flieht am Ende:** Mit dem Sieg (Runde 10 überstanden) endet die Schlacht, Morra flieht (Wimpel fällt, Zeile `flee`); die Szene `scn.m1_8.morra_flees` spielt vor dem Ausgang. Mechanik: OFFEN 3.
5. **Szene davor:** `scn.m1_8.intro` (Abend, die Burg ist Heimat; Morra findet das Versteck) mit **einer Zeile je E4-Ausgang**, über `requires: [{ flag: { e04: shelter } }]` bzw. `{ e04: secret }`: bei „aufnehmen“ verbreitet sich das **Gerücht** (die Aufnahme der Flüchtlinge ist ins Tal gedrungen), bei „geheim halten“ spüren **Ulvrics Wölfe** die Truppe auf. Genau eine der beiden Zeilen läuft; keine Kartenvariante. Hintergrund `paktwacht_ruine`, je Box ≤ 110 Zeichen, DE in der Szene, EN im Locale. Falls E4 nicht gefallen ist (Spielstand ohne Flag), läuft keine der beiden Zeilen und die Szene bleibt stimmig.
6. **Szene danach:** `scn.m1_8.outro`: der Sieg, die Burg steht, Morra ist fort; Zeilen mit Hintergrund `paktwacht_heimat`; eine **Tafel** mit `panel: paktwacht_heimat` (Hintergrund existiert in `art/mockups/locations-s1`) leitet in den Glutfunken-Moment über (1–4 Boxen, danach `panel: none`).
7. **Glutfunken (2):** Die Truppe erhält 2 Glutfunken. Der Moment ist inszeniert: nach der Tafel steigen zwei Funken aus der Glut auf (kurzer Funkenmoment mit Funkenknistern laut EXPERIENCE), danach eine Karte „2 × Glutfunke“ im Stil der Folgen-Karte (Symbol `ember_spark` + Zahl, Betrag nie als Wort). Die Gegenstände landen im Konvoi (Knoten-Wirkung `item` zweimal, `effects` an `m1_8`; Form des Auslösers des Moments: OFFEN 4). Neues Item `ember_spark` (Glutfunke / Ember spark) in `content/core/items.yaml`, Namen `item.ember_spark.name` in `{de,en}.names.yaml`, Bild `art/items/ember_spark.png` (existiert); **Abstimmung:** die Session der Nebenquests (N1/N2 vergeben ebenfalls Glutfunken) kann dieselbe ID anlegen, die ID `ember_spark` bleibt, Konflikt beim Merge zusammenführen. Der **Aufstieg selbst bleibt Story 10.2** (Item hier nur anlegen, kein `promote`).
8. **Knoten:** `m1_8` in `campaign.yaml`: `map: m1_8_paktwacht_halten`, `titleKey: node.m1_8.title` („Die Heimat halten“ / „Holding Home“), `pre: scn.m1_8.intro`, `post: scn.m1_8.outro`, `fixed: finale`, `requires: [{ completed: m1_7 }]`, `place` (OFFEN 6), `effects: [{ item: { def: ember_spark } }, { item: { def: ember_spark } }]`, `expectedLevel`, `merchantTier` (OFFEN 5). Die Weltkarte bindet `m1_8` an den Knoten (`node: m1_8` in `valmora.yaml`).
9. **Akt-Ende:** Nach dem Sieg ist der Akt beendet (`actFinished`: Knoten `fixed: finale` erledigt, Story 7.3). Ohne Paket von Akt 2 zeigt die Weltkarte „Akt 2 „Glut“ erscheint bald“ (`ui.map.actSoon`, `WorldMap.tsx:84-87`); mit Paket läuft die Fortsetzung wie bisher. Kein `act + 1` im Zustand (Produktinhaber, Story 7.3).
10. **Heimsuchungs-Anker:** das Finale darf ohne Anker bleiben (Kommentarblock der Karte, drei Felder [8,10], [8,3], [8,16], ohne Schema); werden sie ergänzt, dann nur nach Story 5.5 (OFFEN 7).
11. **Simulation:** `pnpm sim m1_8 --runs 50` liegt auf Leicht, Normal und Schwer im Korridor (`simulation.corridors`: Leicht Sieg ≥ 0,95, Niedergestreckte ≤ 0,5; Normal 0,75–1,0 und 0,4–1,3; Schwer 0,30–0,70), und zwar **mit und ohne Grosk** (E3 beide Ausgänge) sowie mit beiden E4-Werten (kein Einfluss auf die Karte); `pnpm sim --campaign act1 --runs 30` zeigt das Finale im Korridor. Zahlen im Dev Agent Record.
12. **Tests und Prüfungen:** Unit-Tests für den Knoten (`fixed: finale` öffnet sich erst nach allen Story-Knoten, `actFinished` wahr, Hinweis ohne Akt-2-Paket), für beide E4-Zeilen (genau eine läuft), für die Glutfunken (zwei Gegenstände im Konvoi nach dem Sieg, nicht nach der Niederlage, Speichern/Laden, `content:check` kennt `ember_spark`), für Grosk (beigetreten: nicht auf der Karte; nicht beigetreten: Welle 2) und für den Verwalter-Sieg/-Verlust. E2E: Finale bis zum Sieg (Spielstand per Dev-Helfer), Tafel, Funkenmoment, Hinweis „erscheint bald“ auf der Weltkarte. `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` (Bundle-Budget) grün.
13. **Screenshots** (375 × 812, angespielt): Karte mit den drei Wellen (Ankündigung), Szene davor in beiden E4-Varianten, Morra-Flucht, Tafel `paktwacht_heimat`, Funkenmoment, Karte „2 × Glutfunke“, Weltkarte mit „Akt 2 „Glut“ erscheint bald“.

## Tasks / Subtasks

- [ ] T1 Karte `m1_8_paktwacht_halten.yaml`: Klassen `wolf_rider`, Kommentare „OFFEN/Epic 3“ bereinigen, Verwalter prüfen, `devNote` (AC 1, 2, 3)
- [ ] T2 Knoten `m1_8` (`fixed: finale`, `requires`, `effects`), `node.m1_8.title` in `content/core/locales/{de,en}.names.yaml`, `node: m1_8` in `valmora.yaml` (AC 8)
- [ ] T3 Item `ember_spark` in `items.yaml` + Namen DE/EN, Abstimmung mit der Nebenquest-Session (AC 7)
- [ ] T4 Szenen `scn.m1_8.intro` (zwei E4-Zeilen), `scn.m1_8.morra_flees`, `scn.m1_8.outro` (Tafel); Englisch im Locale (AC 5, 6, 4)
- [ ] T5 Morras Flucht am Ende (Mechanik nach OFFEN 3) (AC 4)
- [ ] T6 Funkenmoment und Karte „2 × Glutfunke“ (UI, Texte `ui.*`, Ton: Funkenknistern per ElevenLabs bzw. vorhandener Klang) (AC 7)
- [ ] T7 Torregel und Gegner-Zugang zum Bergfried prüfen (AC 1, OFFEN 1)
- [ ] T8 Sim-Abstimmung auf Leicht/Normal/Schwer, mit und ohne Grosk, Kette (AC 11)
- [ ] T9 Unit-Tests und E2E (AC 12)
- [ ] T10 Screenshots (AC 13)
- [ ] T11 Verwalter-Zeile in `scn.m1_6.outro` mit Story 9.7 abstimmen (AC 2)

## Dev Notes

- **Quellen:** Epics 9.9; Narrative „Story Beats“ 7b (Die Heimat halten: Morra findet das Versteck und greift mit allen Banden an; „Die Truppe verteidigt zum ersten Mal etwas, das ihr gehört“), „Missionsfolge“ (1-8 ★: defend; Morra führt, Hask, Ulvric, Grosk falls nicht gewechselt; Weg je nach E4, 2 Glutfunken) und Absatz darunter (Gerücht bei „aufnehmen“, Ulvrics Wölfe bei „geheim halten“, eine Szenenzeile, keine Kartenvariante), „Die 12 Entscheidungen“ (E4), „Leutnants“ (Erkennungsformeln: Hask „Feuer frisst alles“, Morra mit dem Kopfgeld in Gold), „Dialogue Style“, Sound („Funkenknistern steht für den Glutfunken“); GDD Missionsziele (`defend`), Glutfunke (12 in Staffel 1, 2 aus dem Finale von Akt 1, „Erhalt wird als Moment inszeniert“), Verbrauchsgüter (Glutfunke wird verbraucht); EXPERIENCE (Glutfunke beim Aufstieg: kurzer Funkenmoment mit Funkenknistern; Weltkarte: „Akt beendet, nächster nicht veröffentlicht“); Architektur §5.3/§5.4 (Wirkungen, `fixed: finale`) und §5.11 (Glutfunke ist ein Item, `promote` verbraucht ihn); Session-Notizen `stories-6-9-7-3-home-act-end.md` (Akt-Ende), `epic3-lieutenants.md` (Leutnants), `haunt-anchors-5-5.md`; `content/acts/act1/maps/m1_8_paktwacht_halten.yaml` (Kommentare am Kopf).
- **Entscheidungen des Produktinhabers (bindend, 2026-10-26):**
  - **Der verteidigte Verwalter** in 1-8 ist eine neue NPC-Figur „Verwalter“ (Einheit `steward`, Namensschlüssel `unit.paktwacht_steward.name` besteht), eingeführt im Gespräch „Eine Burg für Niemande“ in 1-6; unabhängig von E4.
  - **Glutfunken-Moment:** eine Szene nach der Mission mit Tafel (Hintergrund `paktwacht_heimat`, vorhanden in `art/mockups/locations-s1`), dann ein kurzer Funkenmoment: zwei Glutfunken steigen aus der Glut auf, eine Karte „2 × Glutfunke“ im Stil der Folgen-Karte; die Gegenstände gehen in den Konvoi. Item `ember_spark` (Glutfunke / Ember spark) wird neu angelegt (mit der Nebenquest-Session abstimmen, die dieselbe ID anlegen kann). Der Aufstieg selbst bleibt Story 10.2.
  - E4 wirkt hier nur als Szenenzeile (Flag aus Story 9.7: Vorschlag `e04` mit `shelter`/`secret`).
- **Technische Fakten (geprüft):**
  - `defend`: Schema `src/content/schemas.ts:300` (`unit`, `turns`, **keine** Verteidigungsfläche); `objectives.ts` (Fall `defend`/`survive`): Sieg, sobald zu Beginn einer Runde `turn > turns`; Niederlage nur über die Liste `defeat` (`unit_dies` des Verwalters; ein NPC gilt bereits niedergestreckt als gefallen). Der GDD-Satz „bei `defend` erreicht ein Gegner das Verteidigungsfeld“ hat im Code keine Entsprechung (OFFEN 1).
  - Leutnants auf Karten: `lieutenant: <id>`, `class` darf fehlen; beigetretene Leutnants werden beim Aufbau übersprungen (`src/core/battle/setup.ts:77`, `isJoined`/Flag `joined_<lt>`); Welle-Einheiten mit `lieutenant` legt `createBattle` vorab an, `spawnUnits` lässt beigetretene weg (Layout-Kommentar). Leutnant-Stufe wird berechnet (`lieutenantLevel`, Karten-`level` ignoriert). Flucht bei 0 TP existiert (`gone: 'fled'`, Event `fled`); „flieht am Ende der Schlacht“ ist nur ein Kommentar (OFFEN 3).
  - Gewinn mit Rundenablauf: nach `turn > 10` endet der Kampf sofort mit Sieg, übrige Gegner (auch Morra aus Runde 7) leben dann noch; Szene/Mechanik für die Flucht muss danach oder davor greifen.
  - Knoten-Wirkung `item` legt den Gegenstand in den Konvoi (`src/core/campaign/effects.ts`, Fall `item`, Event `itemGained`), `BattleResult.effects` listet die angewendeten Wirkungen; Knoten-Wirkungen nur bei Sieg (Architektur §5.4 „Stand“).
  - Konsequenz-Zeile `item` hat keinen Betrag (`consequences.ts`, `ConsequenceLine`): für „2 × Glutfunke“ ist eine Zusammenfassung gleicher Gegenstände oder eine neue Zeile nötig (OFFEN 4). UI-Ressource `emberSpark` mit Bild `ember_spark` besteht (`src/ui/pieces.tsx:94-97`, `ui.resource.emberSpark` „Glutfunken“, `de.yaml:406`).
  - Item-Art: Architektur §5.11 nennt den Glutfunken ein Item `kind: promotion`; `defs.ts:70` kennt `seal` (PoC `promotion_seal`, `items.yaml:117`, Preis 3 000, `use: { promote: true, minLevel: 10 }`), `promotion` fehlt. OFFEN 8.
  - `fixed: finale`: öffnet sich nach allen übrigen Story-Knoten; `actFinished(data, c)` = Knoten `fixed: finale` erledigt, Hinweis auf der Weltkarte nur ohne Paket von Akt n+1 (`WorldMap.tsx:84-87`, `nextActInBuild()` in `src/app/state/packs.ts:149`).
- **Vorschläge der Story-Autorin (nicht entschieden):** `expectedLevel 10` (Finale der GDD-Kurve „1 → 9 (Finale 10)“); Sprecherkette für die E4-Zeilen: Gerücht `[fenn, brenna, rhen]`, Wölfe `[mira, fenn, rhen]` (mit Ersatzsprechern; nur Rhen und Kael sind garantiert am Leben); `place: paktwacht_ruine` wie im Layout.
- **OFFEN:**
  1. **Torregel:** Das Haupttor ist ein durchlässiges Torfeld (Platzhalter); ein geschlossenes Tor (`door`) wäre für Gegner unpassierbar und der Verwalter unangreifbar, Rammen/Zerstören gibt es nicht. Wie wird das Tor in der Schlacht behandelt (Torfeld bleibt durchlässig, Torfeld als Engstelle, späteres Zerstören)? Dazu fehlt der GDD-Satz zum „Verteidigungsfeld“ (siehe oben).
  2. **Verwalter:** Klasse `healer` im Layout (es gibt kein Kleriker-/Heiler-Modell unter `art/models/units`), keine `sprite`-Angabe, Stufe 3, `items: []`; welches Modell, ob er heilt oder nur Schutzziel ist, Werte/TP des NPCs (Überlebbarkeit), `ai: hold`.
  3. **Morras Flucht am Ende:** Wann und wie (Sieg-Auslöser `defend` endet zu Beginn von Runde 11; Morra tritt erst in Runde 7 auf): ein Trigger vor dem Siegestext, eine Szene nach dem Sieg ohne Karten-Event, oder Regel „Leutnants fliehen bei Sieg“ (Kern, `gone: 'fled'`).
  4. **Auslöser und Darstellung des Funkenmoments:** neuer Schritt im Ablauf nach `post`, neue Szenenzeile (z. B. `moment`) oder Karte aus `BattleResult.effects`; ob die Karte „2 × Glutfunke“ die Zeile `item` mit Betrag ergänzt (Zahl) oder eine eigene Zeile bekommt; Ton (Funkenknistern, Narrative/Audio) und Bildmaterial der Funken.
  5. **`expectedLevel`** (Vorschlag 10) und **`merchantTier`** (Vorschlag 2; es gibt nur Tiers 0–2).
  6. **`place`** von `m1_8`: das Layout nennt `paktwacht_ruine`; `paktwacht_heimat` existiert ebenfalls (Tafel).
  7. **Heimsuchungs-Anker** des Finales: ja oder nein (das Layout liefert drei Felder als Kommentar; Format der Notiz 5.5 verlangt `variant`, `enemySpawn`, `deploy`, `turns`).
  8. **`ember_spark`-Item:** `kind` (`seal` wie `promotion_seal`, oder neues `promotion`), Preis (Händler: 3 000 Gold ab Händler-Stufe 3 laut GDD), Seltenheit, Stapelbarkeit im Konvoi (Zähler) und Verhältnis zum PoC-Item `promotion_seal` (ersetzen oder neben dem Funken lassen; Story 10.2 verwendet den Funken). Namensgleichheit mit der Nebenquest-Session abstimmen.
  9. **Signaturwaffen** der Leutnants (Hask „Signaturaxt gibt es noch nicht, items.md §6.3“; Morra: `longbow`), Rundenzahl und Belohnung der Nebenziele: nur `s_clean` (Heiltrank) existiert, ein zweites ist offen („kill_with gilt nur für Bosse; Leutnant-Ansprechen ist Story 2.7“); `goldReward 1500` [C] liegt am oberen Rand des Korridors 800–1 500.
  10. **Grosk-Zeilen:** Welle 2 setzt Grosk nur, wenn er nicht beigetreten ist; die Leutnant-Zeile `first` für Grosk als Gegner (`scn.lt.grosk`); ob die Szene davor Grosk erwähnt.
  11. **Namen:** Kapitel- und Szenen-IDs aus dem Layout (`scn.m1_8.before`, `scn.m1_8.sparks`) weichen von der Namensgebung 9.2 (`intro`/`outro`) ab; hier `intro`, `morra_flees`, `outro` mit Funkenmoment am Ende der Szene.
- **Folgen für Bestehendes:** `valmora.yaml` bekommt das `node:` für `m1_8` (alle drei Orte dieser Session). `content/core/items.yaml` und die Namens-Locales bekommen `ember_spark`; die Nebenquest-Stories (9.10 ff.) vergeben ihn später, Story 10.2 (Akademie) braucht ihn. Das Finale macht den Akt beendet: nach dem Sieg ist ohne Akt-2-Paket keine Mission mehr wählbar außer Nebenquests (die Weltkarte zeigt den Hinweis). Konflikt zwischen Konzept und Layout: GDD „Verteidigungsfeld“ (OFFEN 1), Layout-Szenen-IDs (OFFEN 11).

### Project Structure Notes

- Geändert: `content/acts/act1/maps/m1_8_paktwacht_halten.yaml`, `content/acts/act1/campaign.yaml`, `content/core/items.yaml`, `content/world/valmora.yaml` (nur `node:` anhängen), `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `content/acts/act1/scenes/scn.m1_6.outro.yaml` (Verwalter-Zeile, mit Story 9.7), UI für den Funkenmoment, Texte `ui.*` in `de.yaml`/`en.yaml`, Tests.
- Neu: `content/acts/act1/scenes/scn.m1_8.{intro,morra_flees,outro}.yaml`, E2E-Spec.
- Grenzen: Karten `m1_6`–`m1_8` gehören dieser Session; in `campaign.yaml`, `valmora.yaml` und Locale-Dateien nur anhängen; Rendering und Deploy-Screen sind Sache anderer Sessions.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale; Betrag immer als Symbol + Zahl (UX).
- `src/core` rein; Zufall nur aus dem Seed-RNG; Replays (Startzustand + Command-Log) identisch; die Kampfvorschau nutzt dieselbe Formel wie die Auflösung.
- KI-Assets (Funkenmoment-Bild/Ton) nur nach `concept/23-art-direction/licensing.md` §6; Bilder per ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/<id>.md`; Audio per ElevenLabs (Audio-Aufnahmen erst später, Schluss-Story; bis dahin läuft die Zeile ohne Ton).
- Entscheidungen im zuständigen BMAD-Artefakt und `.decision-log.md`; offene Punkte nicht stillschweigend entscheiden. Fertig erst mit `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; nie auf `main` committen.

### References

- [Source: concept/26-epics/epics.md#Story 9.9]
- [Source: concept/22-narrative/narrative.md#Story Beats] (Beat 7b), [#Missionsfolge], [#Die 12 Entscheidungen] (E4)
- [Source: concept/21-gdd/gdd.md] (Glutfunke, Missionsziele)
- [Source: concept/24-architecture/architecture.md#5.3], [#5.4], [#5.11]
- [Source: concept/25-ux/EXPERIENCE.md] (Funkenmoment, Weltkarte „erscheint bald“)
- [Source: _bmad-output/implementation-artifacts/9-7-mission-1-6-die-paktwacht-und-entscheidung-e4.md]
- [Source: _bmad-output/implementation-artifacts/9-2-mission-1-1-steckbriefe.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
