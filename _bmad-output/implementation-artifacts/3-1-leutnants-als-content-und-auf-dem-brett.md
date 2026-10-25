# Story 3.1: Leutnants als Content und auf dem Brett

Status: review

## Story

Als Spieler
möchte ich Leutnants sofort von normalen Gegnern unterscheiden,
damit ich weiß, wer wiederkommt.

## Acceptance Criteria

1. **Content-Datei und Laden:** `content/acts/act1/lieutenants.yaml` (Paket `act1` über `acts/act1/**`) enthält genau die vier Leutnants von Akt 1 mit `id`, `nameKey`, `portrait`, `model`, `class`, `faction`, `signatureItem`, `grudgeSkills` (genau 3 Skill-IDs in der Reihenfolge Groll 1/2/3) `titleKey` (Titel je Leutnant für den Steckbrief, DE/EN im Locale) und `scene` (Szenen-ID `scn.lt.<id>`). Der Loader (`parsePackFiles`/`mergePackContent`/`buildContent`) liest die Datei, `GameData.lieutenants` hält sie nach ID. Werte laut Tabelle unter „Entscheidungen des Produktinhabers“.
2. **Prüfungen:** `pnpm content:check` prüft Schema, eindeutige IDs, höchstens 4 Leutnants je Akt, alle Referenzen (Klasse, Signatur-Item, Groll-Skills, Szene samt der festen Zeilen-IDs, Porträt, Namen-Schlüssel), Zeilenlänge ≤ `balance.scene.bubbleMaxChars` in Deutsch und Englisch, und meldet eine fehlende Modelldatei nur als Warnung. Eine Karteneinheit mit `lieutenant: <id>` muss auf einen vorhandenen Leutnant zeigen. Leutnant-IDs gehören zu den stabilen IDs (`ID_KINDS`).
3. **Fähigkeiten und Signatur-Items:** 12 Groll-Fähigkeiten stehen in `content/core/skills.yaml` mit der neuen Quelle `grudge` (Schema-Enum und `SkillDef.source` erweitert), nur aus vorhandenen Skill-Bausteinen. Die vier Signatur-Items stehen in `content/core/items.yaml`. Namen und Beschreibungen in Deutsch und Englisch; `unit.ulvric.name` fehlt in den Locales (`de/en.names.yaml` kennen Hask, Morra, Grosk) und muss ergänzt werden.
4. **Zeilen:** Die vier Szenen `scn.lt.hask`, `scn.lt.morra`, `scn.lt.ulvric`, `scn.lt.grosk` sind final geschrieben, je Leutnant: `first`, `grudge_1`, `grudge_2`, `grudge_3` (mit Platzhalter `{target}` für den Namen des Ziels), `flee_1`, `flee_2`, `flee_3`, `mock`, bei Grosk zusätzlich `join`. Deutsch in der Szene, Englisch in `content/locales/en/act1.dialogue.yaml`, Stimmen und Erkennungsformeln nach der Narrative.
5. **Karteneinheit:** Eine Karteneinheit mit `lieutenant: <id>` übernimmt aus der Leutnant-Definition `nameKey`, `portrait`, `class` und Figur (`sprite`), wo die Karte selbst keine setzt (Karten-Werte gehen vor). `BattleUnit` bekommt die Felder `grudge?: number` und `grudgeTarget?: string`; in dieser Story bleiben sie unbelegt (0/leer), die Übernahme aus dem Kampagnenzustand folgt in Story 3.3.
6. **Brett:** Ein Leutnant hat den doppelten Bodenring mit Goldkante und über dem Kopf den Groll-Wimpel mit 0–3 Kerben (gegen `BattleUnit.grudge`). Beim Antippen eines Leutnants mit `grudge ≥ 1` zeigt eine dünne Linie zum Groll-Ziel, wenn das Ziel auf dem Brett steht.
7. **Prüfungen und Beleg:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Screenshot eines Leutnants mit Ring und Wimpel (0 und 2 Kerben) und der Linie zum Ziel.

## Tasks / Subtasks

- [x] T1 Typen, Schema, Loader (AC 1)
  - [x] `LieutenantDef` und `GameData.lieutenants` in `src/core/defs.ts` (am Ende des Blocks ergänzen)
  - [x] `lieutenantSchema` (`z.strictObject`; `grudgeSkills` als Tupel mit genau 3 Einträgen) in `src/content/schemas.ts`
  - [x] `parsePackFiles`: Zweig `^acts/act\d+/lieutenants\.yaml$` wie bei `supports.yaml`; `PackParts`, `mergePackContent` und `data` in `buildContent` erweitern
  - [x] `content/acts/act1/lieutenants.yaml` mit den vier Einträgen
  - [x] `titleKey` je Leutnant und Prüfung in beiden Sprachen (`content:check`); die Titeltexte `lt.<id>.title` DE/EN trägt der Kontrolleur ein (offen, siehe Completion Notes)
- [x] T2 Prüfungen (AC 2)
  - [x] `validate.ts`: Referenzen, höchstens 4 je Akt, Zeilen-IDs der Szene vollständig, Längen DE/EN, Modell-Warnung, Karteneinheit `lieutenant:`
  - [x] `ids.ts`: `lieutenants` in `ID_KINDS` und `collectIds`; `renames.yaml`-Schema folgt automatisch
- [x] T3 Skills und Items (AC 3)
  - [x] `skillSchema.source` und `SkillDef.source` um `grudge` erweitern
  - [x] 12 Skills in `skills.yaml`, 4 Items in `items.yaml`, Namen/Beschreibungen in `content/core/locales/{de,en}.yaml` bzw. `*.names.yaml`
  - [x] GDD: `concept/21-gdd/items.md` §6.3 (Werte der vier Signaturen) und `concept/21-gdd/decision-log.md` (Groll-Fähigkeiten) nachtragen
- [x] T4 Zeilen (AC 4)
  - [x] Platzhalter `{target}` einführen (analog `{avatar}` in `src/i18n/index.ts:44`), Hinweis zur Längenprüfung unten
  - [x] Vier Szenen schreiben (je Leutnant ein Sonnet-Subagent nach Schreib-Brief, Kontrolle gegen Narrative: Stimme, Erkennungsformel, Länge), Englisch ins Locale (parallel durch einen anderen Agenten, nicht Teil dieses Laufs)
- [x] T5 Karteneinheit (AC 5)
  - [x] `battleUnitFromMap` übernimmt die Werte; `BattleUnit.grudge`/`grudgeTarget`
- [x] T6 Brett (AC 6)
  - [x] Goldkante am Bodenring, Wimpel-Label, Linie zum Ziel; neues CSS in eigener Datei
- [x] T7 Tests und Belege (AC 1–7)
  - [x] Unit-Tests: Schema, Referenzfehler, 5. Leutnant im Akt, `lieutenant:` unbekannt, Zeilenlänge, `battleUnitFromMap`, Wimpel-Kerben-Funktion
  - [x] Screenshot per Dev-Server (Test-Arena mit Leutnant, nicht die Level-Design-Karten) – macht der Kontrolleur mit `__hc.devLieutenant`
  - [x] Entscheidungen ins Architektur-Decision-Log (Abweichung von AR5, siehe Dev Notes)

## Dev Notes

### Quellen

- Epics 3.1 (`concept/26-epics/epics.md`), Architektur §5.5 (AR5) und §8.3 (neues Content-Feld), GDD „Leutnants“ (4 je Akt, Erkennung: eigener Rahmen und Groll-Symbol), Narrative „Leutnants (12, je Akt ein Lager)“, „Dialogue Framework“ (Stimmen, Erkennungsformeln, ~10 Zeilen je Leutnant), `concept/21-gdd/items.md` §6.3 (Signaturen), DESIGN.md (Farben: Team Gegner `#B83A2E`, Gold `#D9A931`; Bausteine „Medaillon“, „Groll-Wimpel“: roter Wimpel, 0–3 weiße Kerben), EXPERIENCE (Zustand „geflohen“: Wimpel fällt; nichts nur über Farbe), Mockup `concept/25-ux/mockups/02-kampf.html` (Doppelring mit Goldkante).
- Vorbild fürs Laden und Prüfen: Story 4.9 (`supports.yaml`, Commit 616f5e7) und die Barks aus Story 9.13 (`scn.bark.<charId>`, `validate.ts`).

### Entscheidungen des Produktinhabers (2026-10-25, verbindlich)

| Leutnant | Klasse | Signatur-Item | Groll 1 | Groll 2 | Groll 3 |
|---|---|---|---|---|---|
| `hask` | `brigand` | `tinder` „Zunder“ (Axt) | Wucht (`on_attack`, `initiator`: +3 Schaden) | Brandmal (`on_hit`, Ziel `burning`: +4 Schaden) | Feuer frisst alles (`on_defend`, `hpBelowPercent: 50`: `strikeFirst`) |
| `morra` | `marksman` (Armbrust, Gruppe `bow`) | `bounty` „Kopfgeld“ | Kimme (passiv, +15 Treffer) | Fernschuss (passiv, `weaponType: bow`: +1 Reichweite) | Kopfgeldblick (`on_attack`, `distanceAtLeast: 2`: +10 Krit) |
| `ulvric` | `vanguard` (vorläufig; bekommt die Wolfsreiter-Klasse aus Story 2.9, sobald die Kampf-Session sie anlegt) | `wolf_fang` „Wolfszahn“ (Lanze) | Wolfslauf (`after_action`, `extraMove: 2`) | Rudel (`on_attack`, `alliesAdjacentToTarget: 2`: +10 Treffer, +2 Schaden) | Durchbruch (passiv, `moveThroughEnemies`) |
| `grosk` | `vanguard` (Schild) | `little_hands` „Kinderhand“ (Schild) | Schildwall (`notMovedThisTurn`: +3 Ver, +3 Res) | Zäh (`hpBelowPercent: 50`: +3 Ver) | Aushalten (`on_turn_start`: +10 % TP) |

- **Signatur-Items:** Werte der Akt-1-Eisenwaffe der Gruppe plus ein Effekt. `tinder`: `iron_axe`-Werte, `element: fire`, `statusOnHit: { status: burning, chance: 30 }`. `bounty`: `iron_bow`-Werte, `crit: 15`. `wolf_fang`: `iron_lance`-Werte, `grantsSkill` Wolfslauf (meisterbar). `little_hands`: `iron_shield`-Werte (Ver +4), `grantsSkill` Erneuerung (`renewal`, meisterbar). Seltenheit: das Schema kennt kein „signature“, die höchste vorhandene ist `legendary` (so verlangt es der Produktinhaber: „signature bzw. höchste vorhandene“); prüfen, dass `legendary` in Händlerangeboten und Beute-Würfen (`src/core/loot.ts`, `instanceRarity` behandelt `legendary` schon als Obergrenze) nicht ungewollt auftaucht. Preis wie die Stahlwaffe der Gruppe (Axt, Bogen, Lanze je 1 000). Item-Bilder kommen später mit der Grafik-Session (kein `image` setzen, Rückfall prüfen).
- **Ein Skill, zwei Quellen:** Wolfslauf (Groll 1 von Ulvric) und der Item-Skill des Wolfszahns sind derselbe Baustein (`after_action`, `extraMove: 2`, wie `canto`). Einmal definieren (Quelle `grudge`), vom Item per `grantsSkill` referenzieren; die Meister-Logik filtert nirgends nach `source` (`src/core/rules/skills.ts:32`, `progression.ts:111`). Aushalten (Groll 3 von Grosk) hat dieselbe Wirkung wie `renewal`, bekommt aber eine eigene Skill-ID; der Kinderhand-Skill ist das vorhandene `renewal`.
- **Faction:** Freies Feld ohne Register. Für Akt 1 `border_bands` (Narrative „Grenzlandbanden und Kopfgeldjäger“, Zeile „Gegner in Akt 1“); Anzeigename über den Schlüssel `faction.border_bands.name`. Begründung ins Decision-Log.
- **Zeilen:** Jetzt in Epic 3 final schreiben. Je Leutnant: erste Begegnung, Groll 1–3 mit dem Namen des Ziels, 3 Fluchtzeilen, Gedenk-Spott, Seitenwechsel nur bei Grosk. Stimmen nach der Narrative; Hask endet seine Sprüche auf „Feuer frisst alles“, Morra zählt das Kopfgeld in Gold (Erkennungsformeln). Keine Weltflüche-Wiederholung, keine echten Schimpfwörter, Leutnants sind Gegner (kein Du zur Truppe außer bei Grosks `join`, der gehört dann dazu).

### Vorhandener Code (Fundstellen, Stand HEAD 3d7cb9f)

- **Loader:** `src/content/load.ts` `parsePackFiles` 116–157 (Supports-Zweig als Vorbild), `mergePackContent` 159–170, `buildContent` ab 175 (`data` ~206). `GameData` in `src/core/defs.ts` (`supports` ~862 als Muster).
- **Schema:** `src/content/schemas.ts`: Karteneinheit `lieutenant: z.string().optional()` Zeile 272 (bisher ohne Prüfung), `skillSchema.source` Zeile 202, `rarity` Zeile 16. `SkillDef.source` in `defs.ts:261`.
- **Prüfung:** `src/content/validate.ts`: Bark-Prüfung als Muster (`bark`-Zweig, Sprecherkette `[charId]`, Zeilen-IDs, `bubbleMaxChars`), Namensliste `need` ab Zeile 344 (Skill: `skill.<id>.name` und `.desc`; Item: `item.<id>.name`; Figuren `unit.<id>.name`). Karten-Einheiten laufen durch die Kartenprüfung, dort die `lieutenant:`-Referenz ergänzen.
- **IDs:** `src/content/ids.ts:10` `ID_KINDS` (Kommentar „Lieutenants join when Epic 3 …“), `collectIds`. Zu `ID_KINDS` gehört `renames.yaml` (`renamesSchema` baut sich daraus). Beim Aufnehmen von `lieutenants` prüfen, dass `content/released-ids.json` noch nicht existiert (AGENTS: erst beim ersten echten Release), sonst `content:check` nicht brechen.
- **Laden aus Karte:** `src/core/battle/create.ts`: `battleUnitFromMap` ab 114, `u.lieutenant = def.lieutenant` Zeile 159, Namens-, Sprite- und Porträt-Übernahme 150–152 (`def.nameKey`, `def.sprite`, `def.portrait` setzen den Datensatz). `BattleUnit.lieutenant?: string` in `state.ts:94`. Aufrufer: `setup.ts:75`, `objectives.ts:107` (Verstärkung).
- **Brett:** `src/render/board/board.ts`: `makeRing` 698–708 (Scheibe r 0.36, Teamfarbe `RING_COLOR[team]`, `alpha 0.5`), Ringe je Einheit bei `syncUnits` (~742), `removeUnit` entsorgt Material und Mesh; Verblutungs-Zähler als Vorbild für das Wimpel-Label: `setBleedLabel` 773–795 (HTML-Element in `floatLayer`, bei `syncUnits` 769 gesetzt) und `placeBleedLabels` 797–804 (Kopfpunkt `tileTop + 1.05`, im Frame bei Zeile 1132 aufgerufen). CSS `.hc-bleed` in `src/ui/hud.css:768`.
- **Overlays:** `src/render/board/overlays.ts` (Session „Kampf“ ändert die Datei): nur eine neue Liste ergänzen, wenn die Linie dort statt in `board.ts` gebaut wird.
- **Tippen:** `Battle.tsx` `tapRef` und `longRef` (488–495); die Auswahl eines Leutnants läuft über den normalen Tipp auf eine Einheit. Die Linie hängt am gewählten/angetippten Leutnant und verschwindet mit der Auswahl.
- **Tests als Muster:** `tests/unit/class-actions.test.ts:29` `arena()` (Prolog-Zustand, alle Einheiten entfernt, Test platziert eigene), `tests/unit/supports-pairs.test.ts`, `tests/unit/barks.test.ts`.

### Was sich ändert / was bleibt

- **Ändert sich:** `defs.ts`, `schemas.ts`, `load.ts`, `validate.ts`, `ids.ts`, `create.ts`, `state.ts` (`BattleUnit`), `board.ts`, `skills.yaml`, `items.yaml`, Locales.
- **Bleibt:** Karten ohne `lieutenant:` laden und spielen wie vorher; alle bestehenden Skills und Items unverändert; `hud.css` höchstens minimal (neues CSS in eigener Datei neben dem Brett).
- **Wichtig:** Die vorhandenen Akt-1-Karten (`ch01_varnhold`, `ch02_silverbrook`, `prologue_caravan`) führen Hask, Morra und Grosk als normale Gegner mit `quote:`. Diese Karten gehören der Session Level-Design und werden hier **nicht** angefasst, also trägt dort noch keine Einheit `lieutenant:`. Tests und Screenshots laufen über eine selbst gebaute Arena bzw. synthetische Content-Daten.
- **Längenprüfung mit `{target}`:** Die Zeile mit eingesetztem Namen muss in die Sprechblase passen. Die Prüfung ersetzt `{target}` durch den längsten Gefährten-Namen aus den Locales (DE und EN) und prüft gegen `bubbleMaxChars` (56).

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** Flucht setzen und „flieht“ in der Vorschau (3.2), Skalierung von Stufe/Ausrüstung/Groll-Fähigkeiten beim Kampfaufbau (3.4: die Fähigkeiten sind hier nur Content, sie werden noch nicht freigeschaltet), Groll und Ziel im Kampagnenzustand sowie Anzeige der Zeilen im Kampf (3.3), Kopfgeld und Signatur-Drop (3.5), Steckbrief-Ansicht (3.6), Seitenwechsel und `join`-Wirkung (3.7), Heimsuchungen (5.5/5.6), Karten und Karten-Zuweisung der Leutnants (Level-Design).
- **Parallel arbeitende Session „Kampf“** (Branch `claude/pensive-jepsen-b9ce35`) ändert `src/core/battle/{apply,actions,commands,objectives}.ts`, `src/core/rules/{movement,effects,cast,roles,vision}.ts`, `src/core/ai/{ai,autoplay}.ts`, `src/core/{state,events,defs,index}.ts`, `src/content/{schemas,validate}.ts`, `content/core/{balance,classes,items}.yaml` samt Locales, `src/app/screens/{Battle,BattleHud,BattlePanels}.tsx`, `src/ui/hud.css`, `src/ui/icons.tsx`, `src/render/board/overlays.ts`. Diese Dateien nur **ergänzend und klein** ändern: neue Felder/Einträge am Ende eines Blocks, keine Umformatierung, keine Umbenennung. Neue Logik in eigene Module. `board.ts` fasst die Kampf-Session nicht an.
- **Abhängigkeit zur Kampf-Session:** Die Wolfsreiter-Klasse (Story 2.9) gibt es noch nicht; Ulvric bleibt `vanguard`, bis sie existiert (Eintrag im Decision-Log, Umstellen ist eine Zeile im YAML).

### Geklärte Fragen (Produktinhaber 2026-10-25, Fragetool)

1. **Preis und Meisterkosten:** Kinderhand kostet 1 200 (wie der Turmschild); Wolfslauf am Wolfszahn hat `masteryCost` 40 (wie `canto`).
2. **`quote` und `first`:** Beides unabhängig. Die Leutnant-Zeile kommt beim ersten Sichtkontakt (Story 3.3), ein gesetztes `quote:` weiter vor dem ersten Schlag; ob eine Karte ein `quote` setzt, entscheidet die Level-Design-Session.
3. **Titel je Leutnant (für den Steckbrief, Story 3.6):** Jeder Leutnant bekommt einen Titel als Content: Feld `titleKey` in `lieutenants.yaml` (z. B. `lt.hask.title`), Text DE/EN im Locale, geschrieben nach der Narrative (Mockup 02: „Brandstifter der Grenzlandbanden“ für Hask). `content:check` prüft den Schlüssel in beiden Sprachen.

### Project Structure Notes

- Neu: `content/acts/act1/lieutenants.yaml`, `content/acts/act1/scenes/scn.lt.{hask,morra,ulvric,grosk}.yaml`, Wimpel-/Ring-CSS und Test-Dateien (`tests/unit/lieutenants.test.ts`).
- Geändert: siehe „Was sich ändert“; Englisch in `content/locales/en/act1.dialogue.yaml`.

### Project Context Rules

- Kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale. Code, Bezeichner und Datenschlüssel englisch, Konzeptdokumente deutsch.
- Spielwerte nur in YAML. `src/core` bleibt rein (kein Babylon, Preact, DOM, `Math.random`, `Date.now`).
- Entscheidungen ins Decision-Log des zuständigen Artefakts (Architektur: Abweichung von AR5 „`lines` als Liste von Szenen-IDs“ hin zu **einer Szene mit festen Zeilen-IDs** wie bei den Barks `scn.bark.<charId>`; GDD: Groll-Fähigkeiten und Signaturen; Narrative: Zeilen), nie in `concept/01-decisions.md`.
- KI-Assets (Modelle, Porträts, Item-Bilder) nur nach `concept/23-art-direction/licensing.md` §6; hier entstehen keine. Fehlende Dateien (Modell nur `grosk.glb`, Porträt von Ulvric fehlt) sind Warnungen, kein Fehler.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün sind; für diese sichtbare Story zusätzlich Screenshot.
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics.md#Story 3.1]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/21-gdd/items.md#6.3 Leutnant-Signaturen]
- [Source: concept/22-narrative/narrative.md#Dialogue Framework]
- [Source: concept/25-ux/DESIGN.md] (Groll-Wimpel, Medaillon, Farben)
- [Source: _bmad-output/implementation-artifacts/4-9-feste-support-paare.md]
- [Source: _bmad-output/implementation-artifacts/9-13-supports-und-barks-von-akt-1.md]

## Review (2026-10-25)

Grundlage: Code-Review Epic 3 (Diff PR #48 + #52, Prüfschichten Blind Hunter, Edge Case Hunter, Acceptance Auditor, Querschnitt Replay/Vorschau/Migration/Worker, Simulation, Browser).

Kurzergebnis: Übrige ACs ohne Befund.

| # | Schwere | Befund | Ort | Ergebnis |
|---|---|---|---|---|
| R1 | S2 | Leutnants aus Verstärkung/Trigger-`spawn` ohne Skalierung, Groll, Groll-Skills, Ziel; beigetretener Grosk spawnt in m1_8 als Feind mit uid `grosk`. Entscheidung: gleich aufbauen (createBattle rechnet vorab, State trägt es). | objectives.ts:121 vs setup.ts:72 | behoben in PR #55 |
| R7 | S3 | EN „Border Bands“ vs „…of the Border Gangs“. Entscheidung: Border Bands. | en.names.yaml | behoben in PR #55 |
| R8 | S3 | Derselbe Leutnant zweimal auf einer Karte (je Schwierigkeit) wird doppelt gezählt/bezahlt; content:check soll das ablehnen. | validateLieutenants.ts | behoben in PR #55 |
| R14 | E | Karten-Klassen: Ulvric `vanguard` (m1_4/m1_6/m1_8) statt `wolf_rider`, Morra `skirmisher` (ch02) statt `marksman`. | Karten | an Level-Design (Epic 9) übergeben |
| R19 | S3 | Hask-Formel nur in `mock`, „Asche und Glut!“ in flee_1 erlaubt. | scn.lt.hask | bleibt so (Entscheidung Produktinhaber 2026-10-25) |
| R28 | S3 | Paket-Merge überschreibt gleiche Leutnant-ID still; Längenprüfung nimmt Avatar „Rhen“. | load.ts, validateLieutenants.ts | vermerkt, kein Handlungsbedarf |
| R29 | E | Umbenennen einer Leutnant-ID braucht ab Release Migration an 4 Stellen (`c.lieutenants`, `joined_<id>`, Roster-ID, `target`) → Story 7.4. | – | offen für spätere Story |
| R31 | S3 | Story-Texte veraltet (3.1 Ulvric vanguard, 3.2 `kills`, 3.5 Sim-Zeile „kein Leutnant auf den Karten“). | Story-Dateien | vermerkt, kein Handlungsbedarf |
| R34 | S3 | (QA) `brute_blow` heißt DE „Wucht“ wie `momentum` (Stahlaxt), gleiche Wirkung. Entscheidung: DE „Brecher“, Wirkung/Stapeln bleiben. | de.names.yaml:171 | behoben in PR #55 |

Empfehlung und Entscheidung über `done`: siehe unten (folgt nach dem Fix-PR).

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- `pnpm lint` grün; `pnpm test` grün (45 Dateien, 461 Tests; `chronicle.test.ts` läuft unter Last gelegentlich in das 5-s-Zeitlimit, allein grün); `pnpm build` grün (Bundle 11,58 MB von 15 MB).
- `pnpm content:check` ist **erwartet rot**, nur wegen der fehlenden Titeltexte `lt.{hask,morra,ulvric,grosk}.title` (DE und EN, 8 Meldungen). Mit vorläufigen Titeln (nur zum Prüfen, wieder entfernt) war alles grün: Schemas, Referenzen, die vier Szenen des anderen Agenten samt Zeilen-IDs und Länge mit `{target}`.
- Brett im Dev-Server geprüft (`__hc.devLieutenant`): Goldring, Wimpel (0 und 2 Kerben), Linie von Morra zu Kael nach Tipp.

### Completion Notes List

- Zeilen-Prüfung: `src/content/validateLieutenants.ts` (Referenzen, höchstens 4 je Akt, feste Zeilen-IDs aus `src/content/lieutenantLines.ts`, Sprecherkette `[id]`, keine Antworten, Länge ≤ `bubbleMaxChars` in DE und EN mit dem längsten Gefährten-Namen für `{target}`, `{target}` in beiden Sprachen oder in keiner, Karteneinheit `lieutenant:` muss existieren). `validateContent` bekam einen letzten optionalen Parameter `lieutenantFiles`; `tools/content-check.ts` übergibt Porträts (`art/mockups/characters-s1/*.png`) und Modelle (`art/models/units/*.glb`); fehlende Dateien sind nur Warnungen.
- `{target}`: `t(key, { target })` füllt es schon über die Parameter (kein Eingriff in `src/i18n` nötig); die Szenen-Anzeige im Kampf mit dem Namen des Ziels kommt mit Story 3.3.
- `class` darf bei einer Karteneinheit mit `lieutenant:` fehlen (Schema optional, der Loader setzt sie aus dem Leutnant, fehlt beides, meldet er den Fehler); `MapUnitDef.class` bleibt `string`.
- Brett: Logik in `src/render/board/lieutenant.ts` (+ `pennant.css`), `board.ts` ergänzt (Goldring je Leutnant, Wimpel-Element im Float-Layer wie der Verblutungs-Zähler, Linie zum Ziel als dünne Goldröhre, Tipp im Board setzt/löscht sie; `Battle.tsx` und `overlays.ts` unberührt).
- Dev-Helfer: `__hc.devLieutenant('hask', 2)` oder `__hc.devLieutenant([['hask', 0], ['morra', 2, 'kael']])` (Leutnant-ID, Groll 0–3, Ziel-Einheit, Standard kael) öffnet auf dem Prolog-Boden einen Testkampf (ohne Speicherstand, Karte `dev_lieutenant`); `__hc.devGrudge('hask', 3, 'brenna')` ändert den Groll im laufenden Testkampf. Antippen eines Leutnants mit Groll 1+ zeigt die Linie (das Info-Panel verdeckt das Brett: schließen). Code in `src/app/state/devLieutenant.ts` und `flow.ts`.
- Ulvric ist `vanguard` bis zur Wolfsreiter-Klasse (Story 2.9); Aushalten (Grosk) und Erneuerung haben dieselbe Wirkung, aber eigene IDs; Renewal am Kinderhand hat `masteryCost` 45 wie am Erdamulett.
- Offen für den Kontrolleur/Produktinhaber: (1) Titeltexte `lt.<id>.title` DE/EN eintragen; (2) die Längenprüfung nimmt für den Avatar den Standardnamen „Rhen“ (Eingabe erlaubt bis 14 Zeichen), ein langer Avatar-Name als Groll-Ziel würde über die Blase laufen (wird auf Seiten umgebrochen); (3) `join` ist für Grosk fest in `lieutenantLines.ts` (`JOINING_LIEUTENANTS`), nicht im YAML; (4) Item-Bilder der vier Signaturen liegen schon unter `art/items/`; (5) Narrative-Decision-Log für die Zeilen trägt der Autor der Szenen nach.

### File List

Neu:
- content/acts/act1/lieutenants.yaml
- src/content/lieutenantLines.ts
- src/content/validateLieutenants.ts
- src/render/board/lieutenant.ts
- src/render/board/pennant.css
- src/app/state/devLieutenant.ts
- tests/unit/lieutenants.test.ts

Geändert:
- src/core/defs.ts (`LieutenantDef`, `GameData.lieutenants`, `SkillDef.source` +`grudge`)
- src/core/state.ts (`BattleUnit.grudge`, `grudgeTarget`)
- src/core/battle/create.ts (`battleUnitFromMap` übernimmt Name, Figur, Porträt)
- src/content/schemas.ts (`lieutenantSchema`, Skill-Quelle `grudge`, `class` der Karteneinheit optional)
- src/content/load.ts (Zweig `lieutenants.yaml`, Klasse aus dem Leutnant, `mergePackContent`)
- src/content/ids.ts (`lieutenants` in `ID_KINDS` und `collectIds`)
- src/content/validate.ts (Aufruf der Leutnant-Prüfung, Parameter `lieutenantFiles`)
- tools/content-check.ts (Porträt-/Modell-Listen, Warnungen)
- src/render/board/board.ts (Goldring, Wimpel, Linie zum Ziel)
- src/app/state/flow.ts (`__hc.devLieutenant`, `__hc.devGrudge`)
- content/core/skills.yaml (12 Groll-Fähigkeiten), content/core/items.yaml (4 Signaturen)
- content/core/locales/de.names.yaml, content/core/locales/en.names.yaml (Namen, Beschreibungen, `faction.border_bands.name`, `unit.ulvric.name`)
- tests/unit/migrations.test.ts (`lieutenants` im Test-IdSets)
- concept/21-gdd/items.md (§6.3), concept/21-gdd/decision-log.md, concept/24-architecture/decision-log.md

### Change Log

- 2026-10-25: Story 3.1 umgesetzt (Content, Prüfungen, Karteneinheit, Brett-Darstellung, Dev-Helfer, Tests); Szenen und Titeltexte stehen noch aus (anderer Agent bzw. Kontrolleur), Screenshot macht der Kontrolleur.
- 2026-10-25 Kontrolleur: Szenen scn.lt.* (Sonnet-Agent) geprüft, Gedenk-Spottzeilen auf {target} umgestellt (keine Pronomen für das gefallene Ziel), Titel lt.<id>.title eingetragen, Seitenwechsel als Feld `joins` in lieutenants.yaml statt Liste im Code; Screenshots Ring/Wimpel (0 und 2 Kerben) und Linie zum Ziel; Status review.
