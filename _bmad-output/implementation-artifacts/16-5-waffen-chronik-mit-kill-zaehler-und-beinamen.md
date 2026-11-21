# Story 16.5: Waffen-Chronik mit Kill-Zähler und Beinamen

Status: review

Quelle: `concept/26-epics/epics/epic-16.md` (Story 16.5, nur auf Branch `claude/quirky-murdock-e609cc`), Regel im GDD „Waffen-Chronik (Produktinhaber 2026-11-21, Thema 7)“ (Inventar und Ausrüstung). Unabhängig von 16.1–16.4; 16.14 (Waffenansicht) baut darauf auf und zeigt Kills und Beinamen an. **Diese Story baut keine Oberfläche**, nur Regel, Daten, Locale-Texte und Simulation.

## Story

Als Spieler
möchte ich sehen, wie viele Gegner eine Waffe schon gefällt hat, und ihr einen Beinamen verdienen,
damit meine Waffen eine Geschichte haben.

## Acceptance Criteria

1. **Angenommen** die GDD-Regel und `ItemInstance` (`src/core/state.ts`) **wenn** eine Waffe den letzten Schlag führt (Angriff und Konter; ein vertriebener Leutnant, `fled`, zählt) **dann** steigt `kills` an genau dieser Waffen-Instanz, und die Auflösung meldet es im Kampf-Event.
2. Beim 10. Kill (Schwelle `balance.yaml`) bekommt die Waffe einen Beinamen aus dem Namen der führenden Figur und einem Wort ihrer Waffengruppe (Wortliste DE/EN in den Locales). Vertreibt oder fällt die Waffe einen Leutnant und hat noch keinen Beinamen, bekommt sie sofort einen nach ihm („Haskbrecher“).
3. Zähler und Beiname wandern mit der Waffe (Weitergeben, Konvoi, Tragen durch andere Figuren, Fall des Trägers → Konvoi), ein Beiname bleibt für immer. Es ändert sich kein Spielwert.
4. Alte Spielstände laden mit 0 Kills und ohne Beinamen; Replays liefern identische Zähler und Beinamen (kein `Math.random`, kein neuer RNG-Zug).
5. `pnpm sim` (Kampagnen-Simulation) meldet je Durchgang Kills und Beinamen; Richtwert Akt 1 rund 150 Kills und 6 Beinamen, bis Ende Akt 2 höchstens 8.
6. `pnpm check` grün; Unit-Tests wie unter „Tests“.

## Entscheidungen (alle [ASSUMPTION] bis der Produktinhaber widerspricht)

- **[ASSUMPTION] Kein `SAVE_FORMAT`-Sprung.** Neue Felder an `ItemInstance` sind optional (`kills?: number`, `killsBy?: Record<string, number>`, `epithet?: Epithet`); fehlt ein Feld, gilt 0 bzw. keiner. Alte Spielstände laden ohne Migration, genau wie `charges?` und `objectivePhase?` es vorgemacht haben. Das ist das kleinste Risiko: keine Migration, kein neues Fixture (das AGENTS.md nur bei Format-/ID-Änderung verlangt, und `content:lock` ist ohnehin noch nicht erfolgt). Der Epic-Text erlaubt beides („erhöht die Story `SAVE_FORMAT`, gibt es…“). Prüfen: `src/persistence/save.ts` und das Speicher-Schema dürfen unbekannte/optionale Felder an `ItemInstance` nicht abweisen (kein `.strict()`); ein Test lädt `tests/fixtures/saves/format3-act1-finale-done.json` und erwartet `kills ?? 0 === 0`. Sollte sich ein striktes Schema finden, trotzdem keine Migration, sondern das Feld im Schema als optional ergänzen.
- **[ASSUMPTION] Beiname wird als Daten gespeichert, nicht als Text:** `epithet = { kind: 'holder', by: <Figur-ID>, word: <Index> }` oder `{ kind: 'lieutenant', lt: <Leutnant-ID> }`. Der Text entsteht erst bei der Anzeige aus den Locales, damit DE/EN umschaltbar bleiben und der Spielstand sprachlos ist. Der Wortindex ist deterministisch: `hash32(uid) % wörter.length` (vorhandene Hash-Hilfe wie in `tools/simCampaign.ts` `hash32`, aus `src/core` ohne neue Abhängigkeit), nicht aus dem Seed-RNG im State, damit keine bestehende Zufallsfolge (Beute, Treffer) verschoben wird und alte Replays weiter stimmen.
- **[ASSUMPTION] „Führende Figur“** = Figur mit den meisten Kills an dieser Waffe (`killsBy`, bei Gleichstand die, die den 10. Kill führt). Eine Waffe, die mehrfach weitergegeben wird, trägt so den Namen dessen, der sie geprägt hat. `killsBy` ist deshalb der zweite optionale Zähler (Figur-ID → Kills).
- **[ASSUMPTION] Format je Sprache datengetrieben über Locale-Schlüssel**, kein Wortbau im Code:
  - `chronicle.epithet.holder` DE `"{name}s {word}"`, EN `"{name}'s {word}"`; für Namen auf s, ß, x, z `chronicle.epithet.holderS` DE `"{name}' {word}"`, EN `"{name}' {word}"`. Der Code wählt den Schlüssel über `chronicle.sibilants` (Zeichenliste je Sprache, DE `"sßxz"`, EN `"s"`), nicht über Sprachwissen im Code.
  - `chronicle.epithet.lieutenant` DE `"{lt}brecher"` (Haskbrecher), EN `"{lt}-Breaker"`; `{lt}` ist der Anzeigename des Leutnants (`unit.<id>.name`).
  - Wortliste je Waffengruppe: `chronicle.word.<group>.<n>` für `sword, axe, lance, bow, dagger, staff, anima, light, dark, focus, lute, shield` (Gruppen aus `content/core/items.yaml`; `siege`/`breath` zählen nicht, siehe Randfälle), je Gruppe 4–6 Einträge, Anzahl über einen Zähler-Schlüssel `chronicle.word.<group>.count` bzw. eine Liste im selben YAML (Form wie die bestehenden Listen in `content/core/locales/de.yaml`; vorher dort nachsehen und die vorhandene Konvention nehmen). Beispiel Schwert/Axt: „Kerbe“, „Schneide“, „Schwur“ (Brennas Kerbe).
  - Die Wortlisten stehen in `de.yaml` und `en.yaml` mit gleich vielen Einträgen (Test).
- Schwelle und Leutnant-Regel in `content/core/balance.yaml` unter neuem Block `chronicle:` ... **Achtung:** dort existiert bereits `chronicle:` (Zeile ~156, Spielchronik). Deshalb den neuen Block `weaponChronicle: { epithetKills: 10 }` nennen und in `src/core/balanceDefs.ts` plus Zod-Schema (`src/content/schema*.ts`) ergänzen.

## Tasks / Subtasks

- [x] **Daten** (AC 1–4)
  - [x] `src/core/state.ts`: `ItemInstance` um `kills?`, `killsBy?`, `epithet?` ergänzen; Typ `Epithet` (`holder` | `lieutenant`) exportieren. Kommentar „missing = 0 / none (older saves)“.
  - [x] `content/core/balance.yaml` + `src/core/balanceDefs.ts` + passendes Schema in `src/content/schema*.ts`: `weaponChronicle.epithetKills: 10`.
- [x] **Regel** (AC 1–3), `src/core/rules/combat.ts` und `src/core/events.ts`
  - [x] Nach der Auflösung eines Schlags (an der Stelle, an der `killed` für EXP bestimmt wird, ca. Zeile 553; dort ist `aInst` die benutzte Waffe, beim Konter `me.equip.mainHand`): nur wenn `me.team === 'player'`, der Gegner durch diesen Schlag auf `dead`/`fled` ging oder niedergestreckt wurde (`!wasDowned && foe.downed` zählt nicht als Kill: Kill erst bei `dead` oder `fled`; beim Niederstrecken zählt erst der spätere Tod) und die Waffe ein echtes Inventarstück ist (nicht `siege?.weapon`, nicht Tag `fixed`, nicht Naturwaffe/`breath`), `kills`/`killsBy` erhöhen.
  - [x] Neues Event `{ t: 'chronicle'; unit: string; uid: string; kills: number; epithet?: Epithet }` in `src/core/events.ts` (nach `combatEnd`/`exp` einreihen, damit die Anzeige es später zeigen kann); `epithet` nur im Event, in dem er entsteht.
  - [x] Beiname beim `kills === epithetKills` (nur wenn noch keiner) bzw. sofort bei `foe.lieutenant` mit `fled` oder `dead` (nur wenn noch keiner). Reine Funktion `earnEpithet(...)` in neuer Datei `src/core/rules/chronicle.ts` (Hash aus `uid`), aus `combat.ts` aufgerufen. Kill durch Brand, Falle, Gelände (`damage`-Ursachen) zählt nicht, weil dort keine Waffe schlägt.
  - [x] Ersatzwaffe/Waffenwechsel im Kampf: die Instanz am Slot zählt, nicht die UID im Kopf der Einheit; der Zähler liegt an `ItemInstance` im Slot, damit der Rückschrieb unten ihn mitnimmt.
- [x] **Rückschrieb in die Kampagne** (AC 3)
  - [x] Prüfen: `toRecord(u)` in `src/core/campaign/campaign.ts` (um Zeile 270, `equip: clone(u.equip)`) klont die Instanz samt neuer Felder, `c.roster = c.roster.map(...)` übernimmt sie (Zeile ~360–370). Test, dass nach einer Mission `kills` in `roster[..].equip.mainHand` steht, auch für Reserve und Gefallene (deren Waffe geht in den Konvoi: `src/core/campaign/gear.ts`, `equipInto`/Konvoi-Pfade dürfen `kills`/`epithet` nicht verwerfen, z. B. durch Neuaufbau der Instanz aus `def`; Verzauberer/Aufwerten in `gear.ts` und `src/core/campaign/camp.ts` bauen ggf. eine neue Instanz, dort `...inst` verwenden). Beute und Verkauf: gekaufte/gefundene Instanzen starten ohne Felder; Verkauf entfernt die Waffe samt Chronik.
  - [x] Zusammenlegen von Instanzen (falls es Stapeln/Tauschen mit neuer UID gibt) auf Verlust prüfen, per grep nach `uid:` in `src/core/campaign/*.ts`.
- [x] **Texte** (AC 2), `content/core/locales/de.yaml`, `en.yaml`
  - [x] Schlüssel wie unter Entscheidungen, Wortlisten je Waffengruppe, gleich viele Einträge DE/EN. Kein Text im Code; Namen kommen aus `unit.<id>.name` bzw. `{avatar}`. Prüfung über `pnpm content:check` (Locale-Parität) ergänzen, falls dort keine Schlüsselprüfung für diese Gruppe besteht.
  - [x] Hilfsfunktion `epithetText(t, inst)` in `src/app/` oder `src/core/rules/chronicle.ts` (ohne DOM): baut aus `Epithet` + Locale den Text; sie wird später von 16.14 benutzt, hier nur Unit-getestet.
- [x] **Simulation** (AC 5), `tools/simCampaign.ts` (Typen `MissionSim`/`CampaignSim`), `tools/simulate.ts`, `tools/simDiff.ts`
  - [x] Je Durchgang nach der Kampagne alle Waffen in Roster, Reserve und Konvoi durchgehen: `kills` summieren und `epithet` zählen; auch je Mission (`MissionSim.kills`, `MissionSim.epithets`, Kills der gewonnenen Versuche). Ausgabe in der Tabelle von `pnpm sim` und in `--json`; `pnpm sim:diff` vergleicht die Felder.
  - [x] Zeile „Waffen-Chronik: Kills Ø, Beinamen Ø, erster Beiname in Mission X“ ausgeben; Warnung, wenn Akt 1 weit vom Richtwert (150 Kills / 6 Beinamen) abweicht oder Akt 1+2 mehr als 8 Beinamen ergeben. Gemessen wird, `balance.yaml` bleibt unverändert (Schwelle 10 ist festgeschrieben).
- [x] **Tests**
  - [x] `tests/unit/weapon-chronicle.test.ts`: Kill durch Angriff und durch Konter zählt; Niederstrecken ohne Tod nicht; Brand/Falle nicht; Leutnant vertrieben zählt und gibt sofort „lieutenant“-Beinamen, nur wenn noch keiner; 10. Kill gibt `holder`-Beinamen mit der Figur mit den meisten Kills; ein zweiter Beiname entsteht nie; Weitergeben (`equip` auf andere Figur, Konvoi, Gefallener) behält alles; Spielwerte (Forecast und Auflösung) bleiben mit und ohne Kills gleich.
  - [x] Replay-Test: gleicher Startzustand + Command-Log → identische `kills`, `killsBy`, `epithet` (Muster aus `tests/unit/combat-resolution.test.ts`).
  - [x] Alter Spielstand: `format3-act1-finale-done.json` laden, kein Fehler, Waffen ohne Felder; `tests/unit/migrations.test.ts` und `migration-chain.test.ts` bleiben unverändert grün.
  - [x] Locale-Test: Wortlisten DE/EN gleich lang für jede Waffengruppe; `epithetText` für „Brenna“ (`Brennas Kerbe`), „Lucas“-artigen Namen auf s (Apostroph), Leutnant „Haskbrecher“ und EN-Formen.
  - [x] `tests/unit/sim-campaign.test.ts`: Simulation liefert `kills`/`epithets` (> 0 in Akt 1, deterministisch bei gleichem Seed).

## Dev Notes

- Lies vor der Arbeit nur: `src/core/rules/combat.ts` um Zeile 420–440 (Aufbau `aInst`) und 535–565 (EXP/`killed`), `src/core/rules/effects.ts` Zeile 150–180 (`knockOut`, `withdraw`, `fled` mit `by`/`fledBy`), `src/core/campaign/campaign.ts` Zeile 260–275 und 350–375 (Rückschrieb). `ai.ts`/`autoplay.ts` nicht lesen.
- Leutnant-Erkennung: `BattleUnit.lieutenant` und `gone === 'fled'` (`knockOut` für 0 HP, `withdraw` für Rückzug zu Fuß; im zweiten Fall zählt es nur, wenn `hitBy` gesetzt ist, also ein Schlag die Waffe benennt; reiner Rückzug ohne Treffer zählt nicht). Der „Vertreiber“ ist `by`/`fledBy`; für den Kill-Eintrag zählt der Schlag, der ihn auf 0 HP brachte, also die Waffe im laufenden Kampf. Fällt ein Leutnant (`dead`) zählt er ebenso.
- Konter: Der Konter läuft im selben `resolveCombat`-Pfad mit vertauschten Rollen (`[d, a]` in der Schleife bei Zeile 547); `used = me.equip.mainHand` ist dort bereits die richtige Waffe.
- Kein neuer Zufall: der Beinamen-Wortindex kommt aus `hash32(uid)`, nie aus `s.rng`. So bleiben alle bestehenden Replays und Testfixtures stabil.
- Kampfvorschau: Chronik hat keinen Einfluss auf Formeln, die Vorschau bleibt unberührt (AC 3, Test).
- Grenzfälle: Waffe wird im Kampf zerstört/getauscht (Instanz bleibt in `equip`/Bag, Zähler bleibt); Skill-Angriffe zählen wie Angriffe; Ballista (`siege`) und Drachenatem (`breath`) haben keine Chronik; Waffe ohne Träger-ID (Gegner-Ausrüstung) zählt nicht, nur `team === 'player'`; NPC-Verbündete (`team === 'other'`) zählen, ihre Waffe wandert beim Beitritt ins Roster mit (siehe `fresh.equip = rec.equip`).
- Oberfläche folgt in 16.14 (Waffenansicht, „Chronik“) und 16.18 (Waffenkammer); hier nur die Event- und Datenform, die sie braucht. Handbuch-Abschnitt kommt mit 16.19.

## Dateien (voraussichtlich)

- ändern: `src/core/state.ts`, `src/core/events.ts`, `src/core/rules/combat.ts`, `src/core/balanceDefs.ts`, `src/content/schema*.ts`, `content/core/balance.yaml`, `content/core/locales/de.yaml`, `content/core/locales/en.yaml`, `tools/simCampaign.ts`, `tools/simulate.ts`, `tools/simDiff.ts`, ggf. `src/core/campaign/gear.ts`
- neu: `src/core/rules/chronicle.ts`, `tests/unit/weapon-chronicle.test.ts`
- nicht ändern: `src/persistence/save.ts` (`SAVE_FORMAT` bleibt 4), `content/released-ids.json`, `concept/01-decisions.md`

## Projektregeln (aus AGENTS.md)

Kein Spielwert im Code (Schwelle in `balance.yaml`), kein sichtbarer Text im Code (Schlüssel in `de.yaml`/`en.yaml`), `src/core` ohne `Math.random`/`Date.now`/DOM, State bleibt Plain-JSON; Code und Bezeichner Englisch. Fertig, wenn `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` grün sind (`pnpm check`); Balancing mit `pnpm sim --runs 50` prüfen und die Zahlen in den Completion Notes festhalten. Nicht auf `main` committen.

## Dev Agent Record

### Completion Notes

- `SAVE_FORMAT` unchanged (4): `kills?`, `killsBy?`, `epithet?` are optional on `ItemInstance`; old saves load without them (test on `format3-act1-finale-done.json`).
- Rule in `src/core/rules/chronicle.ts` (`recordKill`, `epithetText`), called from the EXP loop in `combat.ts` (one small block). Count: team `player`/`other` against `enemy`, foe `dead` or `fled`; weapons with tag `fixed`/`monsterOnly` or a type without word list keep no chronicle. Word index = hash of the weapon uid, no RNG.
- Balance: `weaponChronicle: { epithetKills: 10, words: {type: n} }` (word list length per weapon type; types: sword, axe, lance, dagger, bow, anima, light, dark). Locales: `chronicle.epithet.*`, `chronicle.sibilants`, `chronicle.word.<type>.<n>` (5 each, DE+EN).
- Simulation (`tools/simCampaign.ts`, `tools/simulate.ts`): kills/epithets per mission and per run, summary line with warning; `sim:diff` picks the fields up through its generic flatten.
- Measured (normal/standard): act 1 (20 runs) 144 kills and 6.8 epithets per run, first epithet in m1_1; act 2 chained (10 runs) 291 kills and 8.6 epithets per run (above the 8 target; threshold not tuned, set by the PO).
- [ASSUMPTION] Staff/lute/focus/shield have no word list (they cannot fell foes); an NPC ally (`other`) counts like the company.

### File List

src/core/state.ts, events.ts, balanceDefs.ts, rules/chronicle.ts (new), rules/combat.ts; src/content/schemaBalance.ts; content/core/balance.yaml, locales/de.yaml, en.yaml; tools/simCampaign.ts, simulate.ts; tests/unit/weapon-chronicle.test.ts (new), sim-campaign.test.ts; this story file.
