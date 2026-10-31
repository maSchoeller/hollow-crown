## Epic 11: Akt 2 „Glut“

Spieler ziehen nach dem Finale von Akt 1 in die herbstliche Eisenmark, dienen nacheinander den drei Thronanwärtern (Prinzessin, Dravn, Herzogin), decken je Strang eine Lüge auf und werden in Kronfeld verraten. Das Epic liefert den Akt-Übergang mit dem Paket `act2`, die sieben Gefährten und vier Leutnants von Akt 2, Flieger und Balliste als Regel-Schwerpunkt des Akts, eine Story je Mission (2-1 bis 2-8), die Nebenquests N4 bis N6, Supports, Barks und die Chronik-Szene sowie die Abstimmung. Grundlagen: `concept/22-narrative/narrative.md` (Missionsfolge Akt 2, E5–E8, N4–N6, Supports, Key Conversations 6–8), `concept/21-gdd/gdd.md`, `concept/21-gdd/items.md` §5/§6 und die Entscheidungen des Produktinhabers vom 2026-10-31 (Verfeinerung Epic 10/11). Alle Spielwerte in den Stories sind Vorschläge für `balance.yaml` bzw. die Content- und Karten-YAMLs, als `[ASSUMPTION]` markiert und per Simulation zu prüfen; Szenen gibt es auf Deutsch und Englisch, jede Box ≤ 110 Zeichen; Musik, Klang und Vertonung von Akt 2 kommen später.

**Reihenfolge und Abhängigkeiten zu Epic 10:** Story 11.1 kommt zuerst, weil Epic 10 `c.act`, `levelCap` 20 und die festen Gefährten-IDs (`jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable`) braucht; Epic 10 liest `c.act` nur. Weil der Akt-Übergang ab dem Merge von 11.1 live ist (Entscheidung Produktinhaber, siehe 11.1), folgt 11.3 (Paket, Titeltafel) zeitnah nach 11.1. Danach laufen 11.2 (Positionsstufe), 11.3 (Paket, Weltkarte, Titeltafel), 11.4 (Simulation über Akte), 11.5 (Gefährten, Leutnants, Stahl, Flags), 11.6 (Balliste) und 11.7 (Flieger, Gegner, Herbst) parallel zu 10.2–10.4; 11.8 (Ziel-Phasen) und 11.9 (Relikt-Stufen) sind Kern-Stories ohne eigene Karte und gehen jederzeit nach 11.1. Die Missionen beginnen mit 11.10 (2-1, braucht 11.2–11.7); danach laufen die drei Stränge in beliebiger Reihenfolge, innerhalb eines Strangs nacheinander: Prinzessin 11.11 → 11.12, Dravn 11.13 → 11.14, Herzogin 11.15 → 11.16. Nebenquests: N4 (11.18) nach 11.13, N5 (11.19) nach 11.14 und 11.9, N6 (11.20) nach 11.10 und 10.4 (Anfeuern auf zwei Ziele); N4 und N5 zeigen den Funken-Moment aus 10.2. 11.17 (2-8 Kronfeld) kommt nach den übrigen Missionen 11.10–11.16 sowie 11.8 und 11.9; 11.21 (Supports, Barks, Chronik-Szene) sobald 11.5 die Gefährten ihrer Paare anlegt. 11.22 (Abstimmung und Release) kommt zuletzt: nach allen Stories von Epic 11 und nach 10.1–10.12, weil diese Gold, EP, Glutfunken und Rabatte von Akt 2 verändern; bis dahin stimmen alle Missions-Stories vorläufig ohne Aufstieg ab. Alle Flags von Akt 2 deklariert 11.5 in `content/acts/act2/flags.yaml`, damit `content:check` sie in jeder Bau-Reihenfolge kennt; jede Story nennt ihre Vorgänger in der Zeile „Abhängigkeiten“. Datei-Zuständigkeit: Epic 11 besitzt `content/acts/act2/**`, den Akt-Übergang, Gegner, Leutnants und Stahl-Items; Epic 10 besitzt `content/core/rooms.yaml` (einzige Ausnahme: 11.1 ergänzt bei den vier Akt-1-Räumen `{ act: 2 }`, damit sie beim Übergang nicht schließen), die Profi-Klassen und den Glutfunken. In gemeinsamen Dateien ändert Epic 11 nur eigene Blöcke: Abschnitt „Gegnertypen“ in `classes.yaml`, ein Block „Akt 2: Stahl-Tier“ in `items.yaml`, in `balance.yaml` nur Akt-Schlüssel und die hier genannten neuen Schlüssel. Nicht Teil von Epic 11: die drei fehlenden Chronik-Seiten von Akt 1 (eigene Nacharbeit).

**Gemeinsame Regeln aller Missions-Stories (11.10–11.20):**

- **Positionsstufe P** (Story 11.2): P = 11 + Zahl der erledigten Story-Missionen von Akt 2 (+ `levelBonus` des Knotens, nur 2-8). Generische Kartengegner stehen relativ dazu mit `levelOffset` +0 bis +2; Leutnants skalieren wie in Akt 1 mit der Armee. Die Spalte „Position“ nennt, an welcher Stelle eine Mission frühestens und spätestens gespielt werden kann.
- **Ausrüstung:** Generische Gegner tragen Stahl (Akt-Tier), Leutnants auf der Karte Eisen, damit „+1 Tier je Groll“ greift.
- **Niederlage:** Tod von Avatar oder Kael (`unit_dies`), bei 2-3 zusätzlich Odile niedergestreckt oder tot.
- **Herbst:** Karten liegen unter `content/acts/act2/maps/` (`map.act = 2`), Jahreszeit und Herbst-Boden aus Story 11.7.
- **Szenen:** IDs nach Akt-1-Schema (`scn.<knoten>.intro|outro`, `scn.<knoten>.<lt>_battle`, `scn.<knoten>.<einheit>_talk`, Besuche `scn.<knoten>.house_*`, Lektionen `scn.<knoten>.tutorial_*`). Deutsch steht in der Szenen-YAML, Englisch in `content/locales/en/act2.dialogue.yaml`; Schreib-Pipeline der Narrative (Humanizer-Durchgang, dann Englisch). Gefährtenzeilen stehen unter `requires: alive` mit Ersatzsprecher-Kette. Tafeln sind `panel: <bild>`; fehlt das Bild, steht bis zum Grafik-Task eine Platzhalter-Tafel (Text auf Glutgrund wie die Titeltafel aus 11.3).
- **Entscheidungen:** Jede Antwort trägt eine Haltung (warm, nüchtern, trotzig) wie in Akt 1 und zeigt ihre Folgen-Karte (Mockup 05). Flags sind in `content/acts/act2/flags.yaml` deklariert (Story 11.5).
- **Zielfolge:** Die Regel „kein Ziel zweimal hintereinander“ (GDD „Missionsfolge“, Narrative-Prüfregel) gilt nur für die Story-Missionen; Nebenquests zählen nicht mit (Entscheidung Produktinhaber 2026-10-31, Readiness P-N1, Narrative-Log; sonst entstünden Paare wie 2-5 `defend` → N4 `defend`).
- **Ortsbilder:** Vorhanden sind `grauwacht`, `salzpass`, `brandhang`, `kronfeld`. Fehlende Ortsbilder (2-1, 2-4, 2-6, 2-7, N4–N6) sind je ein eigener Grafik-Task (`art/prompts/<id>.md`, Lizenzauflagen `licensing.md` §6). Er blockiert nichts; bis dahin zeigt der Knoten ein vorhandenes Ortsbild als Platzhalter, das in der Karten-YAML als Kommentar steht.
- **Sim-Korridor:** NFR12 aus `balance.yaml › simulation.corridors` (Leicht ≥ 95 % Sieg und ≤ 0,5 Niedergestreckte; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %). Geprüft mit `pnpm sim <map> --runs 50 --start expected --position <k>` (Optionen aus Story 11.4) an der frühesten und der spätesten Position der Mission, vorläufig ohne Aufstieg. Abweichungen begründet der Dev Agent Record; die endgültigen Korridore folgen in 11.22.
- **Fertig:** `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` sind grün. Screenshots (Hochformat 375 × 812) zeigen Karte, Intro, Leutnant-Zeile und Nachszene. Neue Entscheidungen stehen im zuständigen Decision-Log unter `concept/`.

### Story 11.1: Akt-Übergang und Spielstand

Als Spieler
möchte ich nach dem Finale von Akt 1 mit meinem Spielstand nahtlos in Akt 2 weiterziehen,
damit die Kampagne über die Akte hinweg eine Geschichte bleibt.

**Abhängigkeiten:** nach Story 9.14 (Akt 1 veröffentlicht, Fixture-Spielstände aus dem Release); kommt vor allen Stories von Epic 10 und den übrigen von Epic 11.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act2/` mit `campaign.yaml`, `units.yaml` und `flags.yaml`
**Wenn** der Loader (`src/content/load.ts` `buildContent`) den Content baut
**Dann** lädt er `campaign.yaml`, `units.yaml` und `flags.yaml` aller vorhandenen Akt-Ordner statt fest `acts/act1/…`; `GameData` hält die Kampagnen je Akt (`acts: Record<number, CampaignDef>`), Gefährten und Flags aller Akte stehen gemeinsam in `data.chars` bzw. `data.flags`
**Und** eine Hilfsfunktion `actCampaign(data, c)` liefert die Kampagne des laufenden Akts, `findNode(data, id)` findet einen Knoten über alle Akte (anderer Name als `nodeDef` in `src/app/state/flow.ts`); alle 88 Lesestellen von `data.campaign` (in `src/core`, `src/app`, `src/content`, `tools/`, Liste per `grep -rn "data\.campaign" src tools`) lesen danach den Akt der Kampagne
**Und** `content:check` meldet doppelte Gefährten-, Flag- und Knoten-IDs über Akte hinweg als Fehler
**Und** Leutnant-Heimsuchungen nutzen den Pool aus `data.hauntPools[lt.act]`.

**Angenommen** die Truppe gewinnt das Finale eines Akts (`fixed: finale`) und die Kampagne des nächsten Akts liegt in den Daten vor
**Wenn** `finishMission` den Sieg verbucht
**Dann** setzt es `c.act = act + 1` und meldet das Event `actReached { act }`; fehlt der nächste Akt, bleibt alles wie in Story 7.3 („Akt n „Name“ erscheint bald“)
**Und** der Übergang ist ab dem Merge dieser Story live (Entscheidung Produktinhaber, Übergabe epic11-act2, Antwort 1: act2 sofort veröffentlichen): Bedingung ist allein, dass die Kampagne des nächsten Akts in den Daten liegt (die Kopfdateien von Akt 2 stehen im Paket `core`), der Kern fragt kein Paket ab; wer Akt 1 beendet, landet in Akt 2, die Weltkarte zeigt „Weitere Missionen folgen“ (vorhandenes `moreMissionsFollow`, solange Akt 2 keine Knoten hat), Heimsuchungen laufen weiter; die Titeltafel aus Story 11.3 erscheint dank `c.actTitleSeen` beim ersten Öffnen der Weltkarte nach 11.3 nachträglich; die Build-Regel für `acts/actN/` bleibt in Story 11.3
**Und** Replays (Startzustand + Command-Log) und die Simulation (`simCampaign.ts`, `applyNodeRewards`) führen den Übergang genauso aus
**Und** die Änderungen an `apply.ts` und `commands.ts` bleiben klein (Übergang am Ende des `finishMission`-Zweigs, `markBackupReminded` gegen `c.act`, ein neues Event), weil Epic 10 dieselben Dateien ändert.

**Angenommen** ein gespeicherter Akt-1-Stand im Format 2 mit erledigtem `m1_8`, auch einer, der wegen „erscheint bald“ in Akt 1 stand
**Wenn** er nach dem Update geladen wird
**Dann** füllt `normalizeCampaign` das fehlende `c.act` (Standard 1) und holt den Übergang nach, solange das Finale des Akts erledigt ist und der nächste Akt vorliegt; 11.1 braucht keine Migration (kein persistiertes Feld ändert seine Bedeutung, `c.act` füllt `normalizeCampaign`); ab Story 10.2 gilt Format 3 mit der generischen Umbenennungs-Migration
**Und** die Fixture `tests/fixtures/saves/format2-act1-finale-done.json` ist ein echter Spielstand aus dem Akt-1-Release (Story 9.14), keine selbst gebaute Datei, und lädt mit `act: 2`, Truppe, Gold, Tross, Flags, Groll und Gedenksteine bleiben unverändert; ein Stand ohne erledigtes Finale bleibt in Akt 1
**Und** `metaFromCampaign` (`src/persistence/save.ts`) liefert `c.act` statt fest 1, die Kampagnen-Liste zeigt „Akt 2“.

**Angenommen** `c.act = 2`
**Wenn** Regeln nachschlagen, was im Akt gilt
**Dann** gelten `levelCap` 20, `mechanics: {}` (alle Regeln an), Händlerstufen und `storyCount` aus der Kampagne von Akt 2, die Bedingung `act`, `priceMods`, `villageAid` und `decisions[].act` für Akt 2
**Und** `availableNodes` liefert die Story-Knoten des laufenden Akts und die Nebenquest-Knoten aller Akte bis `c.act` (offene Akt-1-Nebenquests bleiben spielbar); Heimat (`c.home`) und gebaute Räume bleiben beim Übergang, wie sie sind
**Und** damit die Akt-1-Räume (Schmied, Heiler, Taverne, Lagerfeuer) trotz `storyCount` je Akt offen bleiben, ergänzt 11.1 in `content/core/rooms.yaml` nur deren Raum-Bedingung zu `any: [{ act: 2 }, { storyCount: { min: n } }]` (kleiner Eingriff in eine Epic-10-Datei, abgestimmt; Kosten und Gefährten der Stufen ergänzt 10.1); ein Test belegt, dass nach dem Übergang kein Raum schließt.

**Angenommen** `acts/act2/campaign.yaml`
**Wenn** sie angelegt ist
**Dann** enthält sie `act: 2`, `levelCap: 20`, `mechanics: {}`, `home: castle`, `defaultPlace: grauwacht`, `startGold`/`startConvoy` nur fürs Schema, `scars` wie Akt 1 und `nodes: []` (`positionLevel` ergänzt Story 11.2); jede Missions-Story ergänzt ihren Knoten und setzt `node:` am vorhandenen Ort in `content/world/valmora.yaml`
**Und** `merchant` hat zunächst nur Stufe 0 mit vorhandenen Teilen (`vulnerary`, `remedy_salve`, `door_key`, `steel_sword`, `steel_lance`, `steel_axe`, `steel_bow`, `javelin`, `hand_axe`, `travel_lute`, `mend_staff`, `chainmail`, `iron_helm`, `iron_shield`, `ember`, `gust`, `surge`, `rockfall`, `shine`, `fire_bomb`); Story 11.5 ergänzt die Stufen 1 und 2
**Und** `acts/act2/units.yaml` legt die sieben festen IDs mit Klasse und `joins` an (Werte ergänzt Story 11.5): `jory` minstrel (`m2_1`), `nell` scout (`m2_2`), `odile` skirmisher (`m2_3`), `ilka` marksman (`m2_4`), `brann` elementalist (`m2_5`), `amos` healer (`m2_6`), `sable` skirmisher (`lieutenant`); Namen `unit.<id>.name` in DE und EN
**Und** `acts/act2/flags.yaml` ist angelegt und noch leer (die Flags deklariert Story 11.5); die drei Kopfdateien `acts/act2/campaign.yaml`, `units.yaml` und `flags.yaml` stehen als einzelne Globs im Paket `core` von `content/packs.yaml` (die Globs kennen keine `{a,b}`-Klammern), damit Übergang, Bedingungen und Räume sie vor dem Hintergrund-Download kennen; das Paket `act2` selbst legt Story 11.3 an
**Und** `content:check` erlaubt einen Akt ohne Knoten nur, solange seine IDs nicht in `content/released-ids.json` stehen.

**Angenommen** die Story ist fertig
**Wenn** geprüft wird
**Dann** gibt es `tests/unit/act-transition.test.ts` (Übergang, kein Übergang ohne Akt 2, Replay identisch, Nebenquests von Akt 1 offen, `storyCount`/`levelCap`/Händler je Akt, kein Raum schließt, doppelte IDs über Akte) und einen Ladetest der Fixture aus dem Akt-1-Release
**Und** die Abdeckung von `src/core` sinkt nicht (`pnpm test:coverage`); Architektur §5.4/§5.5/§5.14 bekommt einen Absatz „Stand (Story 11.1)“, die Entscheidungen stehen im Architektur-Log.

### Story 11.2: Positionsstufe der Akt-2-Missionen

Als Spieler
möchte ich, dass Gegner und neue Gefährten in Akt 2 zu meinem Fortschritt passen, egal in welcher Reihenfolge ich die Stränge spiele,
damit jede Mission fordert, ohne zu überfordern.

**Abhängigkeiten:** nach 11.1 (Loader, `findNode`, `acts/act2/campaign.yaml`); Story 11.4 nutzt `nodeLevel` für `--position`, alle Missions-Stories ab 11.10 für ihre Gegner.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/campaign.yaml` mit `positionLevel: { base: 11 }` `[ASSUMPTION]`
**Wenn** ein Knoten seine erwartete Stufe braucht
**Dann** liefert die reine Funktion `nodeLevel(data, c, node)` in `src/core/campaign/` für Akte ohne `positionLevel` das Knotenfeld `expectedLevel` (Akt 1 unverändert) und für Akte mit `positionLevel` die Positionsstufe P = `base` + Zahl der erledigten Story-Knoten des Akts + `levelBonus` des Knotens (Standard 0); das gilt für Story- und Nebenquest-Knoten des Akts, ist eine reine Funktion des Kampagnenstands (replay-sicher) und getestet
**Und** `expectedLevel` ist im Schema (`src/content/schemas.ts`) für Knoten von Akten mit `positionLevel` optional, für alle anderen weiter Pflicht; die Monotonie-Prüfung in `src/content/validate.ts` gilt nur für Akte ohne `positionLevel`
**Und** alle Leser von `expectedLevel` lesen danach `nodeLevel`: `refreshTavern` (Söldner-Stufe, `campaign.ts`), `hauntLevel` (`haunts.ts`), `WorldMap.tsx` und `Prep.tsx` (Anzeige `ui.map.level`), der Dev-Start in `flow.ts`, `simCampaign.ts` und `tools/simulate.ts`; `grep -rn expectedLevel src tools` zeigt danach keine Lesestelle von `expectedLevel` außer Schema, Typ (`CampaignNode.expectedLevel` in `defs.ts`), Prüfung und `nodeLevel` (ein Berichtsfeld gleichen Namens in `simCampaign.ts`, das aus `nodeLevel` gefüllt wird, ist keine Lesestelle)
**Und** die Weltkarte zeigt auf jedem offenen Knoten von Akt 2 und im Knoten-Blatt vor dem Start die Stufe über den vorhandenen Schlüssel `ui.map.level`, bei Positionsstufen mit „≈“ („Stufe ≈ 12“, Text in DE und EN angepasst, kein neuer Schlüssel).

**Angenommen** Karteneinheiten von Akt 2
**Wenn** eine Karte geladen wird
**Dann** dürfen sie statt `level` ein `levelOffset` (ganze Zahl 0 bis 2) tragen, auch in Verstärkungen und `spawn`-Triggern; `createBattle` rechnet `nodeLevel + levelOffset`, die errechnete Stufe steht im Startzustand des Kampfes; `content:check` verlangt auf Story-Karten von Akt 2 `levelOffset` für alle generischen Gegner und meldet Werte außerhalb 0–2
**Und** der Stufendeckel `levelCap` gilt nur für die Truppe; Gegner dürfen darüber liegen (z. B. Garde-Ritter in 2-8 auf Stufe 21)
**Und** die Stufen-Abweichung der Simulation (`levelTolerance`) misst gegen `nodeLevel`.

**Angenommen** ein Gefährte von Akt 2 tritt bei (Knotenwirkung `recruit`, Ansprechen im Kampf oder Eskorte)
**Wenn** sein Datensatz entsteht
**Dann** ist seine Stufe max(`level` der Definition, P der Mission − 1); die Werte steigen wie bei `joinLieutenant` (`src/core/campaign/lieutenants.ts`) um den Erwartungswert des Wachstums, kaufmännisch gerundet und durch die Klassengrenzen gedeckelt, ohne Zufall
**Und** ein Test belegt Beitritt an früher und später Position (zum Beispiel Nell als 2. Mission auf Stufe 11, als 6. Mission auf Stufe 15).

**Angenommen** Heimsuchungen in Akt 2
**Wenn** der laufende Akt noch keinen Story-Knoten mit Karte hat
**Dann** fallen `hauntGold` und `hauntLevel` nicht auf 0 bzw. Stufe 1 zurück, sondern nehmen die Werte des letzten Akts mit Story-Karten; ein Test belegt das.

**Angenommen** die Fixture-Karte `tests/fixtures/maps/dev_eisenmark.yaml` (kein Knoten, kein Paket)
**Wenn** sie mit `__hc.devMap('dev_eisenmark', 2)` gestartet wird (`devMap` in `flow.ts` übernimmt einen Akt-Parameter)
**Dann** stehen ihre Gegner mit `levelOffset` auf der Positionsstufe; die Stories 11.6 und 11.7 erweitern die Karte um Ballisten, Flieger und Herbst
**Und** `tests/unit/position-level.test.ts` deckt `nodeLevel` für Akt 1 und Akt 2, die Monotonie-Prüfung, `levelOffset`, die Beitrittsstufe und den Heimsuchungs-Rückfall ab; Architektur §5.4 bekommt einen Absatz „Stand (Story 11.2)“ mit dem Vertrag von `nodeLevel`.

### Story 11.3: Paket `act2`, Weltkarte und Titeltafel

Als Spieler
möchte ich beim Übergang eine Titeltafel sehen und die Eisenmark aus dem Nebel treten sehen,
damit der neue Akt als Ereignis beginnt.

**Abhängigkeiten:** nach 11.1 (Übergang, `c.act`, Kopfdateien im Paket `core`); Ladezustand aus Story 7.2.

**Akzeptanzkriterien:**

**Angenommen** das Paket `act2` in `content/packs.yaml`
**Wenn** gebaut wird
**Dann** hat es `released: true`, `load: background`, `act: 2`, `budgetMb: 40` und `content: [acts/act2/**, locales/*/act2.*]`; seine Bilder und Modelle (Akt-2-Porträts, -Figuren, -Ortsbilder, -Tafeln, Herbstbäume `autumn_a/b/c`) stehen als Globs je Datei oder Ordner vor dem Paket `act1`, damit sie nicht über `act1`-Globs (`models/**`, `locations/**`, `busts/**`, `halves/**`) dort landen; die Globs kennen keine `{a,b}`-Klammern
**Und** die Kopfdateien von Akt 2 bleiben im Paket `core` (Story 11.1)
**Und** Dateien unter `acts/actN/` kommen nur in den Build, wenn das Paket `actN` `released: true` hat, auch wenn ein `core`-Glob sie trifft (`tools/build/packs-plugin.ts`); ein Test in `tests/unit/packs*.test.ts` deckt das ab
**Und** `pnpm build` ist grün: `act2` ≤ 40 MB, `core` wächst höchstens um die Kopfdateien, `act1` wird nicht größer; `pnpm content:lock` läuft nicht, `content/released-ids.json` entsteht erst beim echten Release
**Und** `duePacks` lädt `act2`, sobald `c.act ≥ 2` ist (`reachedAct` in `src/app/state/packs.ts` liest `c.act`); ist das Paket noch nicht geladen, zeigt die Weltkarte den Ladezustand (Story 7.2).

**Angenommen** das Outro von 1-8 ist vorbei und `c.act` ist gerade 2 geworden
**Wenn** der Spieler zur Weltkarte zurückkehrt
**Dann** erscheint einmal eine kurze Titeltafel „Akt 2 · Glut“ (Schlüssel `act.2.title` in DE und EN); bis das Bild aus dem Grafik-Task `art/prompts/act2_title.md` da ist, ist sie Text auf Glutgrund
**Und** danach lichtet sich der Nebel über der Eisenmark (`fogTop(world, 2)` deckt nur noch Aurenhall ab, das Regions-Schild „Eisenmark“ verschwindet), das Akt-Band zeigt „Akt 2 · Herbst – Glut“ (neuer Schlüssel `act.2.season`)
**Und** ob die Tafel gezeigt wurde, hält das neue Feld `c.actTitleSeen` (höchster gezeigter Akt, Standard aus `normalizeCampaign` = 1), gesetzt über ein Command; ein aus Akt 1 hochgeholter Spielstand sieht die Tafel also beim ersten Öffnen der Weltkarte
**Und** solange Akt 2 keine Knoten hat, zeigt die Weltkarte „Weitere Missionen folgen“ (`moreMissionsFollow`); `WorldMap.tsx`, `Camp.tsx` und `BackupSheet.tsx` lesen den Akt aus `c.act`.

**Angenommen** die Story ist fertig
**Wenn** geprüft wird
**Dann** decken Tests `actTitleSeen` (Tafel genau einmal, auch nach einem hochgeholten Stand), `duePacks`/`reachedAct` mit `c.act` und die Build-Regel für `acts/actN/` ab
**Und** Screenshots bei 375 × 812 zeigen Titeltafel, gelichtete Weltkarte und Kampagnen-Liste mit „Akt 2“.

### Story 11.4: Simulation über Akte

Als Produktinhaber
möchte ich Akt 2 in der Simulation verkettet nach Akt 1 und an jeder möglichen Position einer Mission spielen lassen,
damit jede Missions-Story ihren Korridor an der frühesten und spätesten Position prüfen kann.

**Abhängigkeiten:** nach 11.1 (Übergang) und 11.2 (`nodeLevel`, Fixture-Karte); alle Missions-Stories ab 11.10 und die Abstimmung 11.22 nutzen die Optionen.

**Akzeptanzkriterien:**

**Angenommen** die Simulation über Akte
**Wenn** `pnpm sim --campaign act2` läuft
**Dann** spielt jeder Lauf Akt 1 bis zum Finale, wechselt per `finishMission`-Regel in Akt 2 und spielt dessen Story-Knoten; der Bericht nennt Armee-Stufe und Gold beim Eintritt in Akt 2, die Goldkurve prüft `perAct['2']`
**Und** neue Optionen: `--start expected` (Startarmee ohne Akt-1-Lauf auf der Positionsstufe), `--position <k>` (Mission so spielen, als wären k Akt-2-Missionen erledigt; setzt P), `--order m2_4,m2_5,…` (Reihenfolge der Akt-Mitte), `--map-file <pfad>` (Fixture-Karte mit der verketteten Armee); `pnpm sim <mapId>` findet Knoten aller Akte; die Optionen stehen im Kopf von `tools/simulate.ts`
**Und** `tests/unit/sim-acts.test.ts` belegt denselben Bericht bei gleichem Seed, `--position k` setzt P, `--order` erzwingt die Reihenfolge und `--map-file` spielt `dev_eisenmark` mit der verketteten Armee.

### Story 11.5: Gefährten und Leutnants von Akt 2

Als Spieler
möchte ich in Akt 2 sieben neue Gefährten und vier neue Leutnants mit eigenem Charakter treffen,
damit der Akt neue Gesichter, Rivalen und Beute bringt.

**Abhängigkeiten:** nach 11.1 (`acts/act2/units.yaml`, Loader) und 11.2 (Beitrittsstufe); Item-Bilder nach Story 8.5; die Händler-Liste `roomLevel: 2` wirkt erst mit Story 10.9 (siehe unten). Wird die Story zu groß, bei Bedarf die Stahl-Items samt Händler-Stufen abtrennen.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/units.yaml` aus 11.1
**Wenn** die Werte ergänzt sind
**Dann** hat jeder Gefährte Basiswerte auf Stufe 10, persönliches Wachstum (Summe 320–340 % wie Akt 1), Affinität, persönliche Fähigkeit, Startausrüstung und Support-Partner laut Narrative; Vorschlag `[ASSUMPTION]`:

| ID | Klasse | Affinität | Basis Stufe 10 (TP/STR/MAG/GES/SCH/GLK/VER/RES) | Wachstum % (gleiche Reihenfolge) | persönliche Fähigkeit (nur vorhandene Effekt-Formen) | Ausrüstung | Supports |
|---|---|---|---|---|---|---|---|
| `jory` | minstrel | Wind | 23/6/6/10/11/10/4/7 | 60/30/35/45/50/55/20/40 | `stage_presence`: passiv, `adjacentAllies: 1` → Ausweichen +15 | `steel_dagger`, `travel_lute`, `vulnerary` | nell |
| `odile` | skirmisher | Wasser | 26/9/1/12/12/5/7/3 | 70/45/5/50/50/40/35/35 | `sworn_guard`: passiv, `adjacentAllies: 1` → VER +2, RES +2 | `steel_sword`, `iron_helm`, `vulnerary` | varek, sable |
| `nell` | scout | Wasser | 24/8/0/12/12/7/5/3 | 70/40/5/55/55/50/25/30 | `smugglers_stash`: passiv, `bagChargeSaveChance: 30` | `steel_dagger`, `door_key`, `vulnerary` | jory, varek |
| `brann` | elementalist | Erde (fest) | 22/2/10/7/7/4/6/7 | 70/15/55/35/35/35/45/40 | `buried_glow`: passiv, `hpBelowPercent: 50` → MAG +3 | `stone_fist`, `rockfall`, `vulnerary` | ilka |
| `amos` | healer | Erde | 22/2/9/6/6/9/5/10 | 70/20/45/35/30/45/30/55 | `field_surgeon`: passiv, `healBonus: 5` | `mend_staff`, `heal_staff`, `vulnerary` | liora, grosk |
| `ilka` | marksman | Wind | 24/9/0/13/10/5/5/3 | 65/45/5/60/50/45/25/35 | `still_hunter`: passiv, `notMovedThisTurn` → Treffer +10, Krit +5 | `steel_bow`, `vulnerary` | sable, brann |
| `sable` | skirmisher | Feuer | 30/12/1/13/12/6/9/4 | 75/50/5/50/45/35/40/30 | `old_orders`: beim Angriff, `hpBelowPercent: 50` → Schaden +2 | `steel_sword`, `dravns_oath`, `vulnerary` | odile, ilka |

**Und** `level` aller sieben ist 10, die Beitrittsstufe rechnet 11.2 (P − 1); die persönlichen Fähigkeiten stehen in `skills.yaml` (Quelle `personal`), Namen in DE und EN.

**Angenommen** `acts/act2/lieutenants.yaml`
**Wenn** `content:check` (`validateLieutenants`) läuft
**Dann** sind Rowena, Sable (`joins: true`), Grell und Brakka mit `class`, `faction`, `signatureItem`, drei `grudgeSkills`, `titleKey`, `scene: scn.lt.<id>`, `portrait`/`model` = vorhandene Dateien angelegt; Vorschlag `[ASSUMPTION]`:

| ID | Klasse | Fraktion | Signatur | Groll 1 / 2 / 3 (Quelle `grudge`, nur vorhandene Effekt-Formen) | Erkennungsformel | Titel (DE) |
|---|---|---|---|---|---|---|
| `rowena` | `pegasus_knight` | `silver_lance` | `wing_lance` | `dive` (Angreifer: Schaden +3) / `silver_resolve` (passiv: Treffer +15) / `wing_retreat` (nach der Aktion +2 Bewegung) | „Für Aldric und die Silberne Lanze!“ | Ritterin der Silbernen Lanze |
| `sable` | `skirmisher` | `iron_march` | `dravns_oath` | `oath_guard` (nicht bewegt: VER/RES +3) / `last_order` (verteidigt unter 50 % TP: schlägt zuerst) / `iron_discipline` (Aura Radius 1: Verbündete VER +2, Form wie `warden_ward`) | „Befehl ist Befehl.“ | Hauptfrau des Grenzheers |
| `grell` | `skirmisher` | `silver_sea` | `gold_hook` | `boarding_party` (2 Verbündete am Ziel: Treffer +10, Schaden +2) / `dirty_hook` (Angriff: Krit +10) / `sea_legs` (Rundenbeginn: 10 % Heilung) | „Alles hat seinen Preis.“ | Kaperkapitän des Hauses Silbermeer |
| `brakka` | `brakka_wyvern` | `free_blades` | `wyvern_cleaver` | `wyvern_dive` (Angreifer: Schaden +4) / `scale_hide` (unter 50 % TP: VER +3) / `over_the_lines` (zieht durch Gegner) | „Wer mehr zahlt, hat recht.“ | Wyvernreiterin der Meistbietenden |

**Und** Brakka hat eine eigene Unikat-Klasse `brakka_wyvern` im Abschnitt „Gegnertypen“ von `classes.yaml`: `tier: unique`, `playable: false`, `moveType: flier`, `tags: [flier]`, `weaponGroups: [axe]`, `mov: 6`, Werte zäher und stärker, aber langsamer als der Pegasusritter (`base { hp: 22, str: 7, mag: 0, skl: 4, spd: 4, lck: 1, def: 7, res: 0 }`, `growth { hp: 85, str: 50, mag: 0, skl: 30, spd: 30, lck: 15, def: 35, res: 5 }`, `caps { hp: 60, str: 27, mag: 8, skl: 22, spd: 20, lck: 20, def: 26, res: 12 }`) `[ASSUMPTION]`; `content:check` meldet jede andere Einheit dieser Klasse als Fehler (keine generischen Wyvernreiter)
**Und** auf Karten tragen die Leutnants Eisen (`iron_lance`, `iron_sword`, `iron_sword`, `iron_axe`), damit die Groll-Stufe über `tierUp` greift.

**Angenommen** die Szenen `content/acts/act2/scenes/scn.lt.{rowena,sable,grell,brakka}.yaml`
**Wenn** sie geschrieben sind
**Dann** hat jede die Zeilen `first`, `grudge_1..3` (mit `{target}`), `flee_1..3` und `mock` (Gedenk-Spott mit `{target}`), Sable zusätzlich `join` (Seitenwechsel nach E7, Bezug auf das gewarnte Dorf); die Erkennungsformel steht in `first` und in mindestens einer weiteren Zeile; Englisch in `content/locales/en/act2.dialogue.yaml`, Titel `lt.<id>.title` in DE und EN
**Und** die erste Begegnung spielt `first`, egal in welcher Mission sie liegt (Grell in 2-2 oder 2-5, Rowena in 2-4 oder 2-6, Sable in 2-3, 2-5 oder 2-6).

**Angenommen** der Block `# Akt 2: Stahl-Tier (Story 11.5)` in `content/core/items.yaml`
**Wenn** die fehlenden Teile aus `items.md` §6.1/§6.6 angelegt sind
**Dann** gibt es `steel_dagger`, `armorpiercer`, `stiletto`, `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `shade` (Dunkel-Zauber; nicht `shadow`, das ist die Klassen-Id aus Story 10.3), `physic_staff`, `round_shield`, `crystal_focus`, `steel_helm`, `scale_mail` mit Werten nach der Ableitungsregel `[ASSUMPTION]`: Waffen gegenüber dem Eisen-Pendant Mt +3, Treffer −10 bis −15, Gewicht ×1,5–2, Preis 900–1 200 (Beispiele `steel_dagger` Mt 7/Tr 75/Krit 10/Gew 6/900; `armorpiercer` Mt 6/Tr 75/`effectiveVs: [armored]`/1 100; `stiletto` Mt 5/Tr 80/Krit 25/1 200); Zauber nach ihrem Eisen-Pendant mit Element und Zustand wie dort; `physic_staff` Reichweite 1–3, Heilung wie `heal_staff`; Rüstung VER +1–2 über Eisen (`round_shield` VER +2 und Ausweichen +10, `steel_helm` VER 3, `scale_mail` mittel VER 6, `crystal_focus` Nebenhand RES +3)
**Und** die vier Signaturen haben `rarity: legendary`, Preis 1 500 `[ASSUMPTION]` und die Werte der Stahlwaffe ihrer Gruppe plus einen Effekt: `wing_lance` = `steel_lance` + `grantsSkill wing_retreat` (40 SP); `dravns_oath` = `steel_sword` + `grantsSkill last_order` (45 SP); `gold_hook` = `steel_sword` mit Krit +20; `wyvern_cleaver` = `steel_axe` + `effectiveVs: [armored]`
**Und** `ember_spark` (Epic 10) bleibt unberührt; Item-Bilder sind Platzhalter, bis Story 8.5 sie nachzieht; Namen und Beschreibungen in DE und EN.

**Angenommen** die Akt-Schlüssel in `balance.yaml`
**Wenn** sie ergänzt sind
**Dann** gilt `lieutenant.bounty.materialByAct: { 1: iron_ore, 2: moonsteel }` und `lieutenant.scaling.tierUp` kennt zusätzlich `iron_dagger: steel_dagger`
**Und** der Händler von Akt 2 bekommt Stufe 1 (über `merchantTier` der Knoten: `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `armorpiercer`, `steel_dagger`, `hammer`, `longbow`, `round_shield`, `steel_helm`, `scale_mail`, `physic_staff`, `crystal_focus`) und Stufe 2 (`storyCount: 4`: `stiletto`, `shade`, `tower_shield`) `[ASSUMPTION]`; Händler-Stufe 3 (Glutfunke) gehört Epic 10
**Und** eine Händler-Liste mit `roomLevel: 2` (Mechanik Story 10.9) bietet `stiletto`, `shade` und `tower_shield` schon ab Händler-Stufe 1 des Akts an, wenn der Händler der Burg Stufe 2 hat `[ASSUMPTION]` (Ableitung aus `items.md` §6: Teile der Akt-Stufe 2 früher); ist Story 10.9 noch nicht gemergt, trägt 10.9 die Liste nach, weil das nicht strikte Händler-Schema das Feld sonst still verwirft.

**Angenommen** `content/acts/act2/flags.yaml`
**Wenn** `content:check` läuft
**Dann** sind alle Flags von Akt 2 deklariert, bevor eine Missions-Story sie setzt oder abfragt: die Entscheidungen `e05`, `e06`, `e07`, `e08` und `joined_sable`, `brandhang_burned`, `maelis_ledgers` (story, `season2: true`), `chronicle_read` (story, `season2: true`); so lassen sich Missions- und Nebenquest-Stories in jeder Reihenfolge der Stränge bauen.

**Angenommen** die Testkarte `dev_eisenmark`
**Wenn** dort alle vier Leutnants stehen
**Dann** zeigen Steckbrief, Groll-Zeilen, Flucht und Kopfgeld (Mondstahl) die neuen Daten; Tests decken Beitrittsstufe, Groll-Fähigkeiten und die Unikat-Regel ab
**Und** Musik, Klang und Vertonung der Leutnant-Zeilen: später.

### Story 11.6: Balliste

Als Spieler
möchte ich Ballisten bedienen, erobern und gegen mich gerichtet sehen,
damit Geschütze den Akt taktisch prägen.

**Abhängigkeiten:** nach 11.2 (Fixture-Karte `dev_eisenmark`); `--map-file` aus Story 11.4; Gefahrenzone aus Story 13.5; Story 11.10 löst die Lektion in 2-1 aus.

**Akzeptanzkriterien:**

**Angenommen** ein Kartenobjekt `type: ballista`
**Wenn** eine Figur zu Fuß oder in Rüstung auf einem Nachbarfeld steht (Abstand 1, jedes Team, nie ein Flieger)
**Dann** kann sie mit der Aktion `{ kind: 'ballista'; object; target }` im Command `act` schießen: Reichweite 3–10 ab dem Ballistenfeld, Ziel sichtbar (Nebel), Schaden nach der physischen Formel mit Mt 12 + STR des Bedieners, Treffer 70 als Waffenwert in der normalen Trefferformel, Krit 0, kein Gegenangriff, Waffendreieck und Waffengruppe des Bedieners zählen nicht, keine Effektivität gegen Flieger, unbegrenzte Munition, ein Schuss je Bediener und Zug (er ersetzt dessen Aktion)
**Und** die Werte stehen im Item `ballista_bolt` (`kind: weapon`, Gruppe `siege` außerhalb des Dreiecks, `mt: 12`, `hit: 70`, `crit: 0`, `rng: [3, 10]`, Tag `fixed`: nie im Tross, nie beim Händler), nicht im Code
**Und** Vorschau (`forecast`) und Auflösung (`resolveAttack`) laufen über denselben Formelcode mit einer synthetischen Waffen-Instanz (Uid `ballista:<objectId>`) und dem Ballistenfeld als Schussposition; fehlende Parameter (Waffengruppe ignorieren, kein Gegenangriff) kommen als Option in `AttackMods`, nicht als zweiter Rechenweg; Leutnants zeigen „flieht“
**Und** das Ballistenfeld ist für Einheiten nicht betretbar; das Kontext-Band bietet „Balliste“ an, sobald eine berechtigte Figur daneben steht (Schlüssel in DE und EN).

**Angenommen** die Gegner-KI (auch Autoplay der Simulation)
**Wenn** eine Balliste auf der Karte steht
**Dann** nutzt eine Gegnereinheit sie nur, wenn sie das Profil `hold` hat oder schon daneben steht (Produktinhaber 2026-10-31; kein `guard`, kein Hinlaufen „in Reichweite“); dann bewertet sie den Schuss wie einen Angriff; andere Gegner laufen nicht zur Balliste
**Und** das Autoplay des Spielers nutzt eine Balliste, wenn eine eigene Figur daneben steht und der Schuss besser bewertet ist als ihr bester Angriff
**Und** die Gefahrenzone (Story 13.5) zählt einen Bediener mit seiner Ballisten-Reichweite.

**Angenommen** die Lektion zur Balliste
**Wenn** Story 11.10 sie in 2-1 auslöst
**Dann** steht die Lektionsszene `scn.m2_1.tutorial_ballista` (Bedienen, Reichweite, kein Gegenangriff) im Handbuch unter Lektionen (`lesson_ballista`), dazu der Regel-Eintrag „Balliste“ mit Kontext-Anker.

**Angenommen** die Testkarte `dev_eisenmark` aus Story 11.2
**Wenn** sie um zwei Ballisten erweitert ist
**Dann** sind die Werte der Balliste dort geprüft (`__hc.devMap`, mit Story 11.4 auch `pnpm sim --map-file tests/fixtures/maps/dev_eisenmark.yaml --start expected`; Dev Agent Record)
**Und** `tests/unit/ballista.test.ts` deckt Nachbarschaft, Flieger als Bediener verboten, Reichweite 2/3/10/11, Nebel, kein Gegenangriff, keine Flieger-Effektivität, Vorschau = Auflösung, Leutnant-Flucht, die KI-Regel (`hold` oder schon daneben; ein `guard`-Gegner in Reichweite nutzt sie nicht) und Replay ab.

**Angenommen** fehlende Grafik
**Wenn** die Story abgeschlossen ist
**Dann** ist die Balliste ein Requisitenmodell (`tools/art/blender_*.py`) oder eine Platzhalter-Requisite mit `propFallback`
**Und** Klang der Balliste: später.

### Story 11.7: Flieger, Gegner, Herbst und Heimsuchungen von Akt 2

Als Spieler
möchte ich in Akt 2 auf Ritter, Pegasusritter und neue Gegnergruppen im herbstlichen Hochland treffen,
damit Flieger und neue Gegner den Akt prägen.

**Abhängigkeiten:** nach 11.2 (Positionsstufe, Fixture-Karte) und 11.5 (Rowena, Unikat-Klasse `brakka_wyvern`, Stahl-Items für die Pools); Story 11.10 löst die Flieger-Lektion in 2-1 aus.

**Akzeptanzkriterien:**

**Angenommen** die generischen Gegner von Akt 2 aus vorhandenen Klassen
**Wenn** sie auf Karten und in Heimsuchungen stehen
**Dann** gibt es diese Gruppen mit eigenen Namen in DE und EN: Eisenmark-Soldaten (`vanguard`/Lanze, `skirmisher`/Schwert, `marksman`/Bogen; `unit.iron_soldier.name`), Eisenmark-Ritter (`knight`; `unit.iron_knight.name`), Lanzenritter und Pegasusritter der Silbernen Lanze (`knight`, `pegasus_knight`; `unit.lance_knight.name`, `unit.lance_pegasus.name`), Kaperfahrer der Herzogin (`brigand`/`skirmisher`/`marksman`; `unit.privateer.name`), Söldner (`brigand`/`skirmisher`/`marksman`/`vanguard`; `unit.sellsword.name`) und Kontorwachen (`vanguard`/`marksman`; `unit.counting_guard.name`)
**Und** `knight` und `pegasus_knight` sind auf Stufe 11–20 geprüft: Ritter verwundbar gegen Axt, Magie und Panzerstecher, Pegasusritter gegen Bögen (×3); Korrekturen nur im Block „Gegnertypen“ von `classes.yaml`; beide bekommen `art:` mit vorhandenen Porträts als Platzhalter
**Und** es gibt keine generischen Wyvernreiter.

**Angenommen** eine Einheit mit Bewegungsart Flieger (Pegasusritter, Rowena, Brakka)
**Wenn** sie auf dem Brett steht
**Dann** spielt sie nach den Flieger-Regeln (Gelände, Bewegung, Sicht +1, Bogen-Effektivität), wird aber mit ihrer Figur zu Fuß dargestellt
**Und** eine Flieger-Kennung macht sie erkennbar, nicht nur über Farbe (NFR10): ein Flügel-Symbol neben der Lebensleiste, in der Gegner-Leiste und im Steckbrief, dazu ein leichter Schwebe-Versatz mit Schatten am Boden `[ASSUMPTION]` (Werte in `render.yaml`)
**Und** die Kampfvorschau zeigt die Bogen-Effektivität gegen Flieger.

**Angenommen** die Lektion zu Fliegern
**Wenn** Story 11.10 sie in 2-1 auslöst
**Dann** steht die Lektionsszene `scn.m2_1.tutorial_flier` (Bögen ×3 gegen Flieger, Flieger ignorieren Gelände) im Handbuch unter Lektionen (`lesson_flier`), dazu der Regel-Eintrag „Flieger“ mit Kontext-Anker und Klassen-Steckbriefe für `knight`, `pegasus_knight` und `brakka_wyvern`, falls `validateHandbook` sie verlangt.

**Angenommen** Herbst auf dem Brett (`map.act = 2`)
**Wenn** eine Akt-2-Karte oder eine Heimsuchung in Akt 2 läuft
**Dann** zeigt der Boden Herbstfarben (braunes Gras, Heide) aus `tools/art/ground.py` als Akt-Variante, Berge tragen eine Haube ohne Grün; Tönung `look.season.2` und Herbstbäume `variants.tree.2` sind vorhanden
**Und** Wetter in Akt 2: `clear`, `fog`, `rain`; `ash` und `snow` bleiben gesperrt (Ausnahme N4, Story 11.18)
**Und** ein Screenshot vergleicht dieselbe Testkarte in Akt 1 und Akt 2.

**Angenommen** Heimsuchungen in Akt 2
**Wenn** sie gespielt werden
**Dann** wählt das Brett die Jahreszeit nach `c.act`, nicht nach dem Ordner der Karte (Heimsuchungen auf Akt-1-Karten sehen in Akt 2 herbstlich aus).

**Angenommen** `content/acts/act2/haunts.yaml`
**Wenn** Heimsuchungen in Akt 2 entstehen
**Dann** gibt es Pools je Fraktion mit Stahl-Waffen (`share` in %) `[ASSUMPTION]`: `iron_march` (Sable) vanguard 30, knight 20, marksman 25, skirmisher 25; `silver_lance` (Rowena) knight 30, pegasus_knight 30, skirmisher 20, marksman 20; `silver_sea` (Grell) brigand 35, skirmisher 35, marksman 30; `free_blades` (Brakka) skirmisher 35, brigand 35, marksman 30; dazu `civilian` und `chestLoot` (Gold 300–500, Mondstahl)
**Und** Heimsuchungs-Gegner stehen auf `hauntLevel` (Positionsstufe), Leutnants skalieren wie gewohnt.

**Angenommen** die Testkarte `dev_eisenmark` aus Story 11.2
**Wenn** sie erweitert ist
**Dann** zeigt sie alle generischen Gegner von Akt 2, Rowena und Brakka als Flieger und Herbstgelände; die Werte der Gegner sind dort geprüft (Dev Agent Record).

**Angenommen** fehlende Grafik
**Wenn** die Story abgeschlossen ist
**Dann** gibt es Prompt-Dateien (`art/prompts/<id>_board_turnaround.md`, Tripo-Pipeline §4.6) für die Brettfiguren Eisenmark-Soldat, Eisenmark-Ritter, Pegasusritter (zu Fuß) und Kaperfahrer; bis dahin dienen vorhandene Modelle über `art`/`sprite` als Platzhalter (vermerkt in `art/README.md`)
**Und** Pegasus- und Wyvern-Reittiere (Rowena, Brakka, Pegasusritter) sind ein eigener Grafik-Task (`art/prompts/mounts_pegasus_wyvern.md`, großer Rahmen `figureBudget.large`), Ziel vor 2-4; er blockiert keine Story, bis dahin gilt die Darstellung zu Fuß mit Flieger-Kennung

### Story 11.8: Ziel-Phasen (Kern)

Als Spieler
möchte ich, dass ein Missionsziel mitten im Kampf wechseln kann,
damit eine große Schlacht wie Kronfeld erst Halten und dann Flucht verlangt.

**Abhängigkeiten:** nach 11.1; braucht keine Akt-2-Karte (Fixture-Karte); Story 11.17 (Kronfeld) nutzt die Phasen als Erste.

**Akzeptanzkriterien:**

**Angenommen** die Kern-Erweiterung „Ziel-Phasen“
**Wenn** eine Karte `victory: { type: survive, turns: 8, then: { type: escape, area, minShare: 50, must: [avatar, kael] } }` hat
**Dann** gilt bis zum Ende von Runde 8 das Ziel `survive`; zu Beginn von Runde 9 wechselt das Ziel auf `escape` (Event `objectiveChanged`, Rundenpille und Zieltext wechseln, die Fluchtzone erscheint markiert), ein Trigger `objective_changed` kann eine Szene starten
**Und** in der Fluchtphase dürfen Figuren in der Fluchtzone die Aktion `escape` nutzen; Kael flieht wie bisher als Letzter (`mustStayForRest`); der Sieg fällt, sobald Avatar und Kael geflohen sind und mindestens `ceil(minShare % × n)` Figuren geflohen sind
**Und** `n` ist die Zahl der Eingesetzten, die zu Beginn der Fluchtphase noch leben (Produktinhaber 2026-10-31, Readiness-Runde R3); was mit Niedergestreckten geschieht, die bei Sieg auf dem Brett liegen, regelt die vorhandene `escape`-Regel des Prologs
**Und** Schema (`schemas.ts`), Typen (`defs.ts`), `objectives.ts`, KI-Ziele (`ai.ts`), Autoplay und `content:check` kennen die Phase; Vorschau, Gefahrenzone und Zielanzeige lesen das aktive Ziel; Tests decken Wechsel, Sieg, Niederlage (Avatar oder Kael fällt) und Replay ab
**Und** eine Fixture-Karte `tests/fixtures/maps/dev_phases.yaml` (`survive` 2 Runden, dann `escape`) zeigt den Wechsel über `__hc.devMap`; Architektur §5.7 bekommt einen Absatz „Stand (Story 11.8)“.

### Story 11.9: Relikt-Stufen

Als Spieler
möchte ich, dass Relikte mit der Geschichte erwachen,
damit besondere Fundstücke mit dem Akt mitwachsen.

**Abhängigkeiten:** nach 11.1; Stufen mit der Bedingung `completed m2_8` trägt Story 11.17 ein, sobald der Knoten existiert (`content:check` lehnt unbekannte Knoten ab); `dragon_ember` legt diese Story an, Story 11.19 legt es in N5 in eine Truhe; Stufen-Bilder als Grafik-Task (Story 8.5).

**Akzeptanzkriterien:**

**Angenommen** Relikte erwachen mit der Story (`items.md` §5)
**Wenn** ein Relikt eine Stufe erreicht
**Dann** beschreibt das Item `stages` mit Bedingung (`requires`), Bild und Wirkung je Stufe; die Stufe ergibt sich als reine Funktion aus dem Kampagnenstand (ist der Story-Punkt beim Erhalt schon erreicht, gilt die Stufe sofort), Vorschau und Werte lesen sie
**Und** `dragon_ember` (Accessoire, unverkäuflich) hat Stufe 1 schlafend MAG +2 (Stufe 2 erwachend MAG +3 und Feuer-Affinität ab `completed m2_8` trägt Story 11.17 ein, Stufe 3 erwacht ab 3-6 mit Schutz vor Brennen Epic 12) `[ASSUMPTION]`; `pact_warden_shield` bekommt Stufe 2 ab `completed m1_6` (Stufe 3 ab `completed m2_8` trägt Story 11.17 ein) mit Wirkungen nach `items.md` §5 `[ASSUMPTION]`
**Und** ein Spielstand aus dem Akt-1-Release mit `pact_warden_shield` und erledigtem `m1_6` zeigt beim Laden sofort Stufe 2
**Und** Tests decken Stufenwechsel und Vorschau = Auflösung ab; die Stufen-Bilder sind ein Grafik-Task (Story 8.5), bis dahin gilt das Bild der Stufe 1.

### Story 11.10: Mission 2-1 „Wind über der Eisenmark“ und die drei Angebote

Als Spieler
möchte ich im Hochland der Eisenmark gegen Brakka standhalten und danach die drei Angebote der Thronanwärter hören,
damit Akt 2 mit Fliegern, Balliste und einer politischen Wahl beginnt.

**Abhängigkeiten:** nach 11.2 (Positionsstufe), 11.3 (Paket, Titeltafel), 11.4 (`--position`), 11.5 (Jory, Brakka), 11.6 (Balliste, Lektion) und 11.7 (Flieger, Söldner, Herbst, Lektion).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_1_passwacht`, 14×16 (kompakt): Hochlandpass am Rand der Eisenmark, verlassene Grenzwacht mit einer Balliste auf dem Wall, Gauklerwagen am Wegrand, Felsgrate nur für Flieger frei; Mittag, `clear` `[ASSUMPTION]` |
| Ziel | `survive`, 7 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 13 = 8 Start + 5 in Wellen (Runde 2, 4, 5): Brakka + 12 Söldner (4 skirmisher, 4 brigand, 3 marksman, 1 vanguard); Leicht 11 (−2 Wellen-Söldner), Schwer 15 (+2 Söldner in Runde 5) `[ASSUMPTION]` |
| Position und Stufe | Position 0 (fest), P = 11; Start +0, Wellen +1 |
| Leutnant | Brakka, erste Begegnung in Akt 2; von einem ungenannten Auftraggeber bezahlt `[ASSUMPTION]` |
| Szenen | `scn.m2_1.intro`, `scn.m2_1.brakka_battle`, `scn.m2_1.tutorial_flier`, `scn.m2_1.tutorial_ballista`, `scn.m2_1.house_wagon`, `scn.m2_1.house_watch`, `scn.m2_1.outro` mit Jorys Beitritt und Tafel 5 „Drei Angebote“ (Key Conversation 6: Seraphine, Dravn, Maelis, Kael) |
| Beitritte | Jory per Knotenwirkung `recruit: jory` nach dem Sieg |
| Entscheidungen und Flags | keine Entscheidung; die drei Angebote sind Gespräch, keine Wahl |
| Freischaltung | `fixed: first`; danach öffnen `m2_2`, `m2_4`, `m2_6` und N6 |
| Heimsuchungs-Anker | 3: `defend` (Gauklerwagen), `boss` (Passhöhe), `rout` (Grenzwacht) |
| Einsatzplätze | 7 (Pflicht: Avatar, Kael) |
| Gold | 2 000 `[ASSUMPTION]`; `merchantTier: 0` |
| Nebenziele | `kill_with` Bogen (300 Gold), `visit_villages` Wagen + Wachstube (`remedy_salve`), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 0 (`--position 0`), vorläufig ohne Aufstieg |

**Akzeptanzkriterien:**

**Angenommen** die Karte `m2_1_passwacht`, der Knoten `m2_1` (`fixed: first`, `place` = Platzhalter `grauwacht` bis zum Ortsbild-Task) und die Szenen der Tabelle
**Wenn** die Mission startet
**Dann** führt das Intro in die Eisenmark (Herbst, Wind, Drachenschatten am Himmel als Bild in der Szene), Brakka erscheint mit `first` und ihrer Erkennungsformel
**Und** in Runde 1 der Spielerphase läuft `scn.m2_1.tutorial_flier` (Lektion Flieger); betritt zum ersten Mal eine eigene Figur ein Nachbarfeld der Balliste (Trigger `unit_enters`), läuft `scn.m2_1.tutorial_ballista`; beide höchstens einmal je Kampf und im Handbuch nachlesbar.

**Angenommen** die Truppe hält 7 Runden
**Wenn** die Mission gewonnen ist
**Dann** tritt Jory bei (Stufe nach 11.2), die Truppe erhält 2 000 Gold und die Nebenziel-Belohnungen
**Und** die Nachszene zeigt Tafel 5 „Drei Angebote“ (Bild per Grafik-Task `art/prompts/tafel_drei_angebote.md`, bis dahin Platzhalter); Seraphine bietet Freispruch gegen das Siegel im Salzpass, Dravn gegen den Wyvernhorst, Maelis gegen ihr verschwundenes Gold; Kael schließt das Gespräch mit einer eigenen Zeile (Abnahme per Screenshot)
**Und** auf der Weltkarte öffnen 2-2, 2-4, 2-6 und N6, jeder Knoten zeigt „Stufe ≈ 12“.

**Angenommen** die Söldner und die Balliste
**Wenn** die Simulation läuft
**Dann** nutzt kein Söldner die Balliste, es sei denn, er steht schon daneben (Profil `hold` am Wall, ein Bogenschütze) `[ASSUMPTION]`
**Und** `pnpm sim m2_1 --runs 50 --start expected --position 0` liegt auf allen Schwierigkeiten im Korridor; Brakka flieht im Normal-Schnitt mindestens in 30 % der Läufe `[ASSUMPTION]`.

### Story 11.11: Mission 2-2 „Das Siegel im Salzpass“

Als Spieler
möchte ich für Prinzessin Seraphine im Nebel des Salzpasses das Siegel bergen, bevor Grells Kaperfahrer es finden,
damit der Prinzessin-Strang beginnt und Nell zur Truppe stößt.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`, Freischaltung) und 11.5 (Nell, Grell); Chronik-Wirkung aus Akt 1.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_2_salzpass`, 16×22: langer Pass zwischen Klippen, Karawanenwagen als Deckung, Kriegsnebel (`fog: true`), Wetter `fog`, Morgen; Klippen nur für Flieger; Nell gefesselt in einem Käfigwagen der Kaperfahrer `[ASSUMPTION]` |
| Ziel | `treasure`: 4 Truhen (Siegel, Schmuggelgold, Karawanenkasse, Vorrat), 12 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 15 = 10 Start + 5 in 2 Wellen von beiden Passenden (Runde 3, 6): Grell + 5 brigand, 5 skirmisher, 4 marksman (Kaperfahrer); Leicht 13, Schwer 17 `[ASSUMPTION]` |
| Position und Stufe | Position 1–5, P = 12–16; Start +0, Wellen +1, Grells Leibwache +2 |
| Leutnant | Grell (Herzogin), erste oder zweite Begegnung |
| Szenen | `scn.m2_2.intro` (Seraphines Gesandter: das Siegel ist für den Freispruch-Erlass), `scn.m2_2.grell_battle`, `scn.m2_2.nell_talk`, `scn.m2_2.page` (Chronik-Truhe), `scn.m2_2.outro` (Nell erkennt die Geldwege der Herzogin, erster Zweifel am Erlass) |
| Beitritte | Nell: Ansprechen am Käfigwagen (`recruit: { by: any }`); spricht sie niemand an, tritt sie nach dem Sieg per Knotenwirkung bei (wirkt nur, wenn sie noch nicht dabei ist) `[ASSUMPTION]` |
| Entscheidungen und Flags | keine; Chronik-Seite `a2_saltpass` |
| Freischaltung | `requires: completed m2_1`; öffnet `m2_3` |
| Heimsuchungs-Anker | 3: `treasure`, `escort`, `boss` |
| Einsatzplätze | 8 |
| Gold | 2 300 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `recruit nell` (300 Gold), `open_chests` (Chronik-Truhe, Seite `a2_saltpass`), `turn_limit` 9 (`steel_helm`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 1 und 5 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_2` (`place: salzpass`) und die Szenen der Tabelle
**Wenn** die Mission läuft
**Dann** verbergen Kriegsnebel und Wetter `fog` die Truhen, bis eine Figur sie sieht; Späher öffnen ohne Schlüssel, die Karte bringt einen Öffner mit (`validateTreasure`)
**Und** die Chronik-Truhe gehört nicht zu den Ziel-Truhen; wer sie öffnet, erhält die Seite `a2_saltpass` (Wirkung `chronicle`, Thema „dass sie beim Paktfest etwas gaben“, ≤ 400 Zeichen, DE in `acts/act2/chronicle.yaml`, EN in `locales/en/act2.chronicle.yaml`).

**Angenommen** alle 4 Ziel-Truhen sind in 12 Runden geborgen
**Wenn** die Mission gewonnen ist
**Dann** ist Nell dabei, die Truppe erhält 2 300 Gold und die Nebenziel-Belohnungen; nach Runde 12 ohne alle Truhen ist die Mission verloren (`defeatReason = 'turns'`)
**Und** die Nachszene sät Zweifel, ohne eine Lüge aufzudecken: das Siegel ist für den Freispruch-Erlass gedacht, und Nell wundert sich, wer den Pass für die Kaperfahrer bezahlt.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_2 --runs 50 --start expected --position 1` und `--position 5` laufen
**Dann** liegen beide im Korridor; das Autoplay öffnet die Ziel-Truhen mit Spähern oder Schlüsseln.

### Story 11.12: Mission 2-3 „Die verstoßene Leibwache“ und Entscheidung E5

Als Spieler
möchte ich Odile, die entlassene Leibwächterin der Prinzessin, durch Dravns Linien geleiten,
damit der Prinzessin-Strang eine Brückenfigur und eine persönliche Wahl bekommt.

**Abhängigkeiten:** nach 11.11 (Knoten `m2_2`); Flag `joined_sable` aus 11.5 (gesetzt erst in 11.14, die Mission prüft beide Fälle); Profil `follow_ally` und `silverwing` legt diese Story an.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_3_muehlweg`, 16×20: Waldweg unter der Grauwacht, Odile versteckt in einer Mühle in der Kartenmitte, Start der Truppe im Süden, Ausgang am Nordrand hinter Dravns Postenlinie; Abend, `rain`; im Lager der Posten das erbeutete Banner der Silbernen Lanze `[ASSUMPTION]` |
| Ziel | `escort` Odile zum Ausgang, `join: true`; Odile mit neuem Profil `follow_ally` |
| Gegner Normal (Leicht/Schwer) | 16 = 12 Start + 4 Welle (Runde 4, aus der Grauwacht): Sable + 4 vanguard, 3 knight, 4 marksman, 4 skirmisher (Eisenmark); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 2–6, P = 13–17; Posten +1, Welle +2 |
| Leutnant | Sable (Dravn); hat sie per E7 gewechselt, fehlt sie ohne Ersatz-Leutnant |
| Szenen | `scn.m2_3.intro` (Seraphines Bitte), `scn.m2_3.sable_battle`, `scn.m2_3.odile_talk` (erstes Treffen an der Mühle), `scn.m2_3.house_banner`, `scn.m2_3.outro` mit E5 |
| Beitritte | Odile über die Eskorte (`join: true`) |
| Entscheidungen und Flags | E5 `e05: [return, stay]`: `return` → Wirkung `leave: odile` (Ausrüstung bleibt im Konvoi), `stay` → bleibt; Odile berichtet von Halvards Briefen an die Prinzessin (Zweifel, keine aufgedeckte Lüge) |
| Freischaltung | `requires: completed m2_2` |
| Heimsuchungs-Anker | 3: `escort`, `rout`, `defend` |
| Einsatzplätze | 9 |
| Gold | 2 600 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | Banner der Silbernen Lanze erobern (Besuch des Zelts → `silverwing`), `no_downs` (`vulnerary` ×2), `turn_limit` 10 (500 Gold) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 2 und 6 |

**Akzeptanzkriterien:**

**Angenommen** das neue KI-Profil `follow_ally` (Eskorte, Lehre aus 1-3: das vorhandene `follow` zieht selbst zum Ausgang)
**Wenn** Odile in der Phase `other` zieht
**Dann** wartet sie, bis eine Spielerfigur höchstens `balance.ai.followRadius` entfernt ist, und zieht dann auf ein Feld möglichst nah bei der nächsten Spielerfigur (Abstand 1 bevorzugt), mit Wegkosten `followDanger` je bedrohendem Gegner wie beim vorhandenen `follow`
**Und** sie greift nie selbst an, verteidigt sich aber mit normalem Gegenangriff `[ASSUMPTION]`
**Und** steht eine Spielerfigur im Ausgang oder auf einem Nachbarfeld davon und erreicht Odile ein Ausgangsfeld, zieht sie hinein und entkommt (`gone = 'escaped'`, Event `escaped`); das Ziel `escort` gilt dann als erfüllt
**Und** das Profil steht in `schemas.ts` und `defs.ts`, `validateEscort` akzeptiert `follow` oder `follow_ally`, Gegner gewichten Odile wie ein Schutzziel (`objectiveBonus`); Tests decken Folgen, Warten, Gefahr meiden, Entkommen und Replay ab
**Und** das Autoplay bewegt die Truppe als Block zum Ausgang, damit Odile folgt.

**Angenommen** die Karte, der Knoten `m2_3` (`place: grauwacht`) und die Szenen
**Wenn** die Truppe die Mühle erreicht
**Dann** läuft `scn.m2_3.odile_talk`, Odile wird sichtbar (Team `other`, Klasse `skirmisher`, Figur `odile`) und folgt ab jetzt
**Und** ist `joined_sable` gesetzt, entfällt Sable per `requires` an der Einheit (Muster `grosk` in `m1_8`), ihre Kampfzeile entfällt
**Und** wird Odile niedergestreckt oder fällt sie, ist die Mission verloren (Niederlagegrund Odile).

**Angenommen** Odile entkommt
**Wenn** die Mission gewonnen ist
**Dann** tritt Odile bei (Stufe nach 11.2), wer das Banner-Zelt besucht hat, besitzt `silverwing` (Werte nach `items.md` §6.4 `[ASSUMPTION]`: `steel_lance` Mt +2, Krit +10, `rarity: legendary`, Preis 0, `unsellable`)
**Und** in der Nachszene bietet Seraphine Odile die Rückkehr in die Garde an (E5) mit Folgen-Karte; bei `return` verlässt Odile die Truppe mit einer Abschiedszeile, ihre Ausrüstung geht in den Konvoi, das Flag `e05: return` bestimmt ihre Zeile in Kronfeld (11.17)
**Und** die Akademie (Raum-Gefährten Varek|Odile, Epic 10) bleibt auf ihrer gebauten Stufe, auch wenn Odile geht (Entscheidung E10-2); Stufe 2 kostet ohnehin nur Gold, nur Stufe 3 braucht Varek oder Odile (Readiness-Runde R2); gehen beide (E5 `return`, E6 `pardon`), nennt die Folgen-Karte der zweiten dieser Entscheidungen, dass die Akademie Stufe 3 nicht mehr erreicht `[ASSUMPTION]`; fällt E6 als zweite, baut Story 11.13 den Hinweis; hat die Akademie schon Stufe 3, entfällt er.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_3 --runs 50 --start expected --position 2` und `--position 6` laufen, je mit und ohne `joined_sable`
**Dann** liegen alle im Korridor.

### Story 11.13: Mission 2-4 „Der Wyvernhorst“ und Entscheidung E6

Als Spieler
möchte ich für General Dravn die Silberne Lanze vom Wyvernhorst vertreiben und Dame Rowena stellen,
damit der Dravn-Strang beginnt und Ilka zur Truppe stößt.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`), 11.5 (Ilka, Rowena), 11.6 (Balliste) und 11.7 (Flieger-Darstellung); die Groll-Wirkung mit Puffer (unten) legt diese Story an.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_4_wyvernhorst`, 16×22: Felshorst über einer Schlucht, Dravns Wyvern-Zucht (leere Nester als Gelände), Berge und Klippen (Flieger frei, Fußtruppen gebunden), zwei Ballisten der Zucht; Morgen, `clear`; Ilka spürt am Schluchtrand der Lanze nach `[ASSUMPTION]` |
| Ziel | `boss` Rowena (Flucht bei 0 TP zählt als besiegt) |
| Gegner Normal (Leicht/Schwer) | 16 = 13 Start + 3 Welle (Runde 3, Pegasusritter aus der Schlucht): Rowena + 5 pegasus_knight, 4 knight, 3 marksman, 3 skirmisher (Silberne Lanze); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 1–5, P = 12–16; Start +0, Welle +1, Ritter am Horst +2 |
| Leutnant | Rowena (Prinzessin) als Boss |
| Szenen | `scn.m2_4.intro` (Dravns Auftrag), `scn.m2_4.rowena_battle`, `scn.m2_4.ilka_talk`, `scn.m2_4.page`, `scn.m2_4.outro` mit E6 |
| Beitritte | Ilka: Ansprechen (`recruit: { by: any }`, Team `other`, Profil `hold`); sonst Knotenwirkung nach dem Sieg (nur wenn noch nicht dabei) `[ASSUMPTION]` |
| Entscheidungen und Flags | E6 `e06: [pardon, stay]`: `pardon` → `leave: varek` (Ausrüstung in den Konvoi), `stay` → `grudge { lt: sable, delta: -1, buffer: true }` (Puffer, siehe unten); Chronik-Seite `a2_eyrie` |
| Freischaltung | `requires: completed m2_1`; öffnet `m2_5` und N4 |
| Heimsuchungs-Anker | 3: `boss`, `rout`, `treasure` |
| Einsatzplätze | 8 |
| Gold | 2 400 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `recruit ilka` (300 Gold), `open_chests` (Chronik-Truhe in der alten Wächterkammer, Seite `a2_eyrie`), `kill_with` Bogen (`steel_bow`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 1 und 5 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_4` (Ortsbild per Grafik-Task, bis dahin `grauwacht`) und die Szenen
**Wenn** die Mission läuft
**Dann** stehen Ritter am Horst mit Profil `hold` direkt neben den Ballisten und schießen von dort (Regel 11.6: nur `hold` oder schon daneben); die Truppe kann die Ballisten erobern und gegen Rowena nutzen (ohne Flieger-Effektivität)
**Und** Rowena erscheint als Flieger zu Fuß mit Flieger-Kennung (Reittier-Task aus 11.7 nicht nötig).

**Angenommen** Rowena flieht bei 0 TP
**Wenn** die Mission damit gewonnen ist
**Dann** steigt ihr Groll, Kopfgeld (Mondstahl) wird gezahlt, Ilka ist dabei, die Truppe erhält 2 400 Gold
**Und** in der Nachszene bietet Dravn Varek Begnadigung im Heer an (E6) mit Folgen-Karte; ist Varek tot oder gegangen, entfällt E6 ohne Szene der Wahl (Muster E1)
**Und** bei `pardon` verlässt Varek die Truppe mit Abschiedszeile, seine Ausrüstung geht in den Konvoi; seine Kronfeld-Zeile wechselt auf die Gegenseite (11.17); bei `stay` sinkt Sables Groll um 1; hat sie Groll 0 (auch vor dem ersten Treffen), entfällt stattdessen ihre nächste Groll-Steigerung (Produktinhaber 2026-10-31, Readiness-Runde R3): `grudge` mit `buffer: true` legt dafür `c.grudgeBuffer[lt]` an (Default `{}` aus `normalizeCampaign`), die nächste Steigerung verbraucht ihn `[ASSUMPTION]` (Feldname und Umsetzung); Tests für Groll 0 und Groll ≥ 1
**Und** Taverne und Akademie (Raum-Gefährte Varek) bleiben auf ihrer gebauten Stufe (E10-2), Stufe 2 bleibt ohne Varek baubar (Readiness-Runde R2)
**Und** ist Odile schon gegangen (E5 `return`, Story 11.12) und wählt der Spieler hier `pardon`, nennt die Folgen-Karte von E6, dass die Akademie Stufe 3 nicht mehr erreicht (dasselbe Kriterium wie in 11.12, je nachdem, welche der beiden Entscheidungen als zweite fällt); hat die Akademie schon Stufe 3, entfällt der Hinweis.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_4 --runs 50 --start expected --position 1` und `--position 5` laufen
**Dann** liegen beide im Korridor; Rowena fällt im Normal-Schnitt nicht vor Runde 4 `[ASSUMPTION]`.

### Story 11.14: Mission 2-5 „Die Brandschneise“ und Entscheidung E7

Als Spieler
möchte ich Sables Heimatdorf gegen Grells Plünderer verteidigen und dabei Dravns Lüge aufdecken,
damit die Gewissensfrage des Akts fällt und Sable die Seite wechseln kann.

**Abhängigkeiten:** nach 11.13 (Knoten `m2_4`) und 11.5 (Brann, Sable, Flags `e07`, `joined_sable`, `brandhang_burned`); Summe und Deckel der Rabatte baut Story 10.9 (der Test dieser Story prüft E7 allein).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_5_brandhang`, 16×20: Herbstdorf am Hang, Heufelder (brennbar), 5 besuchbare Häuser mit Flüchtlingen, Branns Hütte am oberen Rand; Sable mit einem Brandtrupp am Ortsrand (Team `other`, Profil `hold`, nicht angreifbar); Abend, `clear` |
| Ziel | `defend` Dorfvorsteher (Zivilist, Team `other`), 10 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 17 = 11 Start + 6 in Wellen (Runde 2, 5, 7): Grell + 6 brigand (4 mit Profil `raider` auf Häuser), 6 skirmisher, 4 marksman (Kaperfahrer); Leicht 15, Schwer 19 `[ASSUMPTION]` |
| Position und Stufe | Position 2–6, P = 13–17; Start +0, Wellen +1, Grells Maate +2 |
| Leutnant | Grell (Herzogin); Sable anwesend, nicht feindlich, gilt als getroffen |
| Szenen | `scn.m2_5.intro` (Dravns Auftrag: das Dorf schützen), `scn.m2_5.grell_battle`, `scn.m2_5.brann_talk`, `scn.m2_5.sable_order` (Trigger Runde 5: Sable trägt den Befehl, das Dorf nach dem Kampf als Brandschneise zu opfern), `scn.m2_5.house_*`, `scn.m2_5.outro` mit E7 |
| Beitritte | Brann: Ansprechen an seiner Hütte (`recruit: { by: any }`), sonst Knotenwirkung nach dem Sieg; Sable bei E7 `warn` |
| Entscheidungen und Flags | E7 `e07: [warn, obey]`: `warn` → `recruit { lt: sable }` (Flag `joined_sable`), `obey` → `priceMod { pct: -10, act: 2 }` + `setFlag brandhang_burned`; Lüge Dravns aufgedeckt |
| Freischaltung | `requires: completed m2_4`; öffnet N5 |
| Heimsuchungs-Anker | 3: `defend`, `rout`, `escort` |
| Einsatzplätze | 9 |
| Gold | 2 700 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `visit_villages` alle 5 Häuser vor den Plünderern („alle Flüchtlinge gerettet“) → `dawnbreaker`; `recruit brann` (300 Gold); `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 2 und 6 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_5` (`place: brandhang`) und die Szenen
**Wenn** die Mission läuft
**Dann** steht Sable sichtbar als Dravns Offizierin auf dem Brett (Team `other`, `untargetable`, Profil `hold`), ihre erste Begegnung zählt (Wirkung `meet`, Zeile `first` aus `scn.lt.sable`); die Gegner-KI greift sie nicht an
**Und** in Runde 5 deckt `scn.m2_5.sable_order` Dravns Lüge auf (Grenzdörfer als Brandschneise gegen die Drachen); Drachenschatten ziehen in der Szene über den Hang
**Und** Plünderer mit Profil `raider` zerstören Häuser; ein Besuch vorher rettet die Flüchtlinge des Hauses.

**Angenommen** der Vorsteher übersteht 10 Runden
**Wenn** die Mission gewonnen ist
**Dann** ist Brann dabei, wer alle 5 Häuser gerettet hat, erhält `dawnbreaker` (Werte des vorhandenen Eintrags auf Akt-2-Niveau geprüft, Kommentar „Kap. 4“ korrigiert)
**Und** in der Nachszene fällt E7 mit Folgen-Karte: bei `warn` warnt die Truppe das Dorf, Sable bindet sich das glutorange Tuch um und tritt bei (Zeile `join`; Stufe nach `joinLieutenant`; Groll gegen sie und von ihr erlischt); bei `obey` brennt Brandhang (Weltkarten-Variante von Brandhang, Szenenzeile), Dravns Gunst gibt Händler −10 % in Akt 2, Sable bleibt Leutnant
**Und** N5 öffnet.

**Angenommen** die Weltkarten-Variante „Brandhang brennt“
**Wenn** `brandhang_burned` gesetzt ist
**Dann** zeigt der Ort `brandhang` auf der Weltkarte seine Variante: `worldSchema.places[]` (`src/content/schemas.ts`) kennt `variants: [{ requires, image?, label? }]`, die erste erfüllte Variante gilt, `content:check` prüft Bedingungen und Bilder; `content/world/valmora.yaml` trägt die Variante mit der Flag-Bedingung `brandhang_burned` `[ASSUMPTION]` (höchstens 2 Varianten je Ort, Narrative „Weltkarte“)
**Und** das Bild `brandhang_burned` ist ein Grafik-Task (`art/prompts/brandhang_burned.md`, `licensing.md` §6); bis dahin zeigt die Variante das vorhandene Ortsbild entsättigt als Platzhalter `[ASSUMPTION]`.

**Angenommen** E7 `obey` und der Händler von Akt 2
**Wenn** der Händler Preise rechnet
**Dann** gilt der `priceMod` von E7 (−10 % in Akt 2) über das vorhandene `shopPrice`, getestet mit −10 % allein; Summe und Deckel bis −30 % baut nur Story 10.9 (`economy.maxDiscountPct`), diese Story legt keinen eigenen Schlüssel an.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_5 --runs 50 --start expected --position 2` und `--position 6` laufen
**Dann** liegen beide im Korridor; der Bericht nennt den Anteil der Läufe mit allen Häusern gerettet.

### Story 11.15: Mission 2-6 „Gold für Banditen“

Als Spieler
möchte ich für Herzogin Maelis ihr verschwundenes Gold aus einem Banditenlager holen und dort Rowena und Sable vertreiben,
damit der Verdacht wächst, dass Maelis die Banden aus Akt 1 bezahlt hat.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`) und 11.5 (Amos, Rowena, Sable, Flags `joined_sable`, `e07`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_6_canyon`, 16×22: Banditenlager im Canyon des Tafellands, Kisten mit Silbermeer-Münzen, ein Feldlazarett, in dem Amos verwundete Banditen behandelt; Truppen der Silbernen Lanze und des Grenzheers haben das Lager zuerst gestürmt `[ASSUMPTION]`; Nachmittag, `clear` |
| Ziel | `rout` |
| Gegner Normal (Leicht/Schwer) | 16 = 13 Start + 3 Welle (Runde 4, Pegasusritter vom Canyonrand): Rowena + 3 pegasus_knight, 2 knight, 2 skirmisher (Lanze); Sable + 2 vanguard, 3 marksman, 2 skirmisher (Grenzheer); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 1–5, P = 12–16; Start +0, Welle +1, Ersatz-Hauptmann +2 |
| Leutnants | Rowena (Prinzessin), Sable (Dravn); ist `joined_sable` gesetzt, ersetzt sie ein Eisenmark-Hauptmann (`unit.iron_captain.name`, `skirmisher`, kein Leutnant) |
| Szenen | `scn.m2_6.intro` (Maelis' Auftrag), `scn.m2_6.rowena_battle`, `scn.m2_6.sable_battle`, `scn.m2_6.amos_talk`, `scn.m2_6.coins` (Fund: Silbermeer-Münzen als Sold der Banden), `scn.m2_6.burnt_village`, `scn.m2_6.outro` (Verdacht gegen Maelis) |
| Beitritte | Amos: Ansprechen im Lazarett (Team `other`, Profil `hold`), sonst Knotenwirkung nach dem Sieg |
| Entscheidungen und Flags | keine Entscheidung |
| Freischaltung | `requires: completed m2_1`; öffnet `m2_7` |
| Heimsuchungs-Anker | 3: `rout`, `boss`, `defend` |
| Einsatzplätze | 8 |
| Gold | 2 200 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `recruit amos` (300 Gold), `protect_npc` Amos (`physic_staff`), `turn_limit` 10 (400 Gold) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 1 und 5, je mit und ohne `joined_sable` |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_6` (Ortsbild per Grafik-Task, bis dahin Platzhalter) und die Szenen
**Wenn** die Mission läuft
**Dann** kämpft die Truppe nur gegen Leute der beiden anderen Anwärter; Amos steht als Team `other` im Lazarett, Gegner greifen ihn an, wenn er in Reichweite ist (Nebenziel `protect_npc`)
**Und** ist `joined_sable` gesetzt, entfallen Sable und `scn.m2_6.sable_battle` per `requires`, der Ersatz-Hauptmann steht an ihrem Platz.

**Angenommen** alle Gegner sind besiegt oder vertrieben
**Wenn** die Mission gewonnen ist
**Dann** ist Amos dabei, die Truppe erhält 2 200 Gold, in der Nachszene findet sie Silbermeer-Münzen als Sold der Banden; Nell (falls dabei, Ersatzsprecher-Kette) erkennt die Prägung; der Verdacht öffnet 2-7
**Und** Beat 9 „ein Dorf brennt“: Nur bei `e07: warn` zeigt `scn.m2_6.burnt_village` auf dem Rückweg ein von Drachenschatten verbranntes Dorf (nur Szene, kein Kampf); ist E7 noch offen (2-6 vor 2-5) oder `obey`, entfällt die Szene, damit nie zwei Dörfer brennen (Produktinhaber 2026-10-31, Readiness-Runde R3); Tests für `warn`, `obey` und offen.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_6 --runs 50 --start expected --position 1` und `--position 5` laufen
**Dann** liegen alle Varianten im Korridor.

### Story 11.16: Mission 2-7 „Das Kontor am Silbermeer“ und Entscheidung E8

Als Spieler
möchte ich im Kontor der Herzogin die Geschäftsbücher sichern, obwohl sie Brakka zum Vertuschen angeheuert hat,
damit der Beweis gegen Maelis in meiner Hand liegt.

**Abhängigkeiten:** nach 11.15 (Knoten `m2_6`) und 11.5 (Brakka, Flags `e08`, `maelis_ledgers`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_7_kontor`, 16×20: Hafen bei Nacht, Lagerhäuser mit Türen (Schlüssel oder Späher), Laternen als Lichter, Archiv im Nordosten, Kriegsnebel (`fog: true`), Wetter `rain` |
| Ziel | `reach`: eine beliebige eigene Figur erreicht das Archiv |
| Gegner Normal (Leicht/Schwer) | 16 = 12 Start + 4 Welle (Runde 4, Söldner vom Kai): Brakka + 4 skirmisher, 3 brigand, 2 marksman (Söldner) + 3 vanguard, 2 marksman, 1 knight (Kontorwachen); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 2–6, P = 13–17; Wachen +0, Söldner +1, Archivwache +2 |
| Leutnant | Brakka (von Maelis angeheuert) |
| Szenen | `scn.m2_7.intro`, `scn.m2_7.brakka_battle`, `scn.m2_7.ledgers` (Bücher gefunden), `scn.m2_7.page`, `scn.m2_7.outro` mit E8 |
| Beitritte | keine |
| Entscheidungen und Flags | E8 `e08: [seraphine, sell]`: `seraphine` → `grudge { lt: grell, delta: -1 }`, `sell` → +1 000 Gold `[ASSUMPTION]`; Flag `maelis_ledgers` (story, `season2: true`) bei Sieg; Chronik-Seite `a2_ledger` |
| Freischaltung | `requires: completed m2_6` |
| Heimsuchungs-Anker | 3: `treasure`, `rout`, `boss` |
| Einsatzplätze | 9 |
| Gold | 2 800 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `open_chests` (Chronik-Truhe im Schreibzimmer, Seite `a2_ledger`), `turn_limit` 8 (Mondstahl ×2), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 2 und 6 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_7` (Ortsbild per Grafik-Task, bis dahin Platzhalter) und die Szenen
**Wenn** die Mission läuft
**Dann** kämpft die Truppe gegen Brakkas Söldner und Kontorwachen der eigenen Auftraggeberin: 2-7 ist der bewusste Bruch mit Maelis; die Ausnahme von der Regel „immer gegen die Leute der anderen Anwärter“ steht im Narrative-Log (Entscheidung A2-1)
**Und** das Intro macht den Bruch klar (Maelis ließ Brakka anheuern, um die Bücher verschwinden zu lassen).

**Angenommen** eine Figur erreicht das Archiv
**Wenn** die Mission gewonnen ist
**Dann** läuft `scn.m2_7.ledgers`, das Flag `maelis_ledgers` ist gesetzt, die Truppe erhält 2 800 Gold
**Und** in der Nachszene fällt E8 mit Folgen-Karte: `seraphine` gibt die Beweise an die Prinzessin (Grell-Groll −1, Kronfeld-Zeile in 11.17), `sell` verkauft sie an Maelis zurück (+1 000 Gold).

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_7 --runs 50 --start expected --position 2` und `--position 6` laufen
**Dann** liegen beide im Korridor; das Autoplay öffnet Türen mit Spähern oder Schlüsseln.

### Story 11.17: Mission 2-8 „Kronfeld“ (Finale, große Schlacht)

Als Spieler
möchte ich in Kronfeld den Freispruch empfangen, verraten werden und mit der Truppe entkommen,
damit Akt 2 mit „Die Krone war hohl“ endet.

**Abhängigkeiten:** nach 11.8 (Ziel-Phasen), 11.9 (Relikt-Stufen), 11.6 (Balliste) und allen übrigen Missionen 11.10–11.16 (`fixed: finale`, Varianten aus `e05`, `e06`, `e08`, `joined_sable`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_8_kronfeld`, 24×28: weites Feld mit Bannern, Verhandlungszelt in der Mitte, Start der Truppe am Zelt, Fluchtzone am Nordrand (Waldsaum), zwei Ballisten am Feldrand; Abend, `clear` |
| Ziel | Phasen (Story 11.8): `survive` 8 Runden, dann `escape`: Sieg, wenn Avatar, Kael und mindestens die Hälfte der zu Beginn der Fluchtphase (Runde 9) noch lebenden Eingesetzten geflohen sind |
| Gegner Normal (Leicht/Schwer) | ~30 = 15 Start + je 5 in Runde 2, 4, 6; in der Fluchtphase je 3 alle 2 Runden `[ASSUMPTION]`. Garde der Prinzessin als Hauptmacht (6 knight, 5 pegasus_knight, 3 skirmisher, 3 marksman), Grenzheer (3 vanguard, 2 marksman), Kaperfahrer (2 brigand, 2 skirmisher), dazu die Leutnants; Leicht 26, Schwer 34 |
| Position und Stufe | Position 7 (fest), P = 11 + 7 + `levelBonus: 1` = 19 `[ASSUMPTION]`; Start +0, Wellen +1, Garde-Ritter +2 (Stufe 21 über `levelCap` 20 ist erlaubt, der Deckel gilt nur für die Truppe) |
| Leutnants | Rowena (führt), Grell, Brakka, Sable (falls nicht gewechselt) |
| Szenen | `scn.m2_8.intro` (Freispruch-Treffen, Erlass mit dem Siegel aus 2-2), `scn.m2_8.betrayal` mit Tafel 6 „Kronfeld: der Verrat“, Leutnant-Zeilen `scn.m2_8.<lt>_battle`, `scn.m2_8.escape_open` (Beginn Runde 9), `scn.m2_8.outro` mit Tafel 7 „Die Krone war hohl“ (Key Conversation 8: Seraphine, Kael; Beats 11 und 12); Seraphine und Halvard nur in Szenen |
| Beitritte | keine |
| Entscheidungen und Flags | keine Entscheidung; Varianten: `e05: return` (Odile spricht eine Zeile auf der Gegenseite), `e06: pardon` (Varek ebenso), `e08: seraphine` (Seraphine hält die Beweise gegen Maelis) |
| Freischaltung | `fixed: finale` (nach allen anderen Story-Knoten von Akt 2) |
| Heimsuchungs-Anker | 0 |
| Einsatzplätze | bis 15; Söldner der Taverne dürfen auffüllen |
| Gold | 3 000 `[ASSUMPTION]`; `merchantTier: 2`; keine Glutfunken |
| Nebenziele | `no_downs` (Mondstahl ×3) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 am oberen Rand (Normal 75–85 % Sieg, 0,9–1,3 Niedergestreckte) bei Position 7 `[ASSUMPTION]` |

**Akzeptanzkriterien:**

**Angenommen** die Ziel-Phasen aus Story 11.8
**Wenn** die Karte `victory: { type: survive, turns: 8, then: { type: escape, area, minShare: 50, must: [avatar, kael] } }` trägt
**Dann** wechselt das Ziel zu Beginn von Runde 9, `scn.m2_8.escape_open` läuft über den Trigger `objective_changed`, und der Sieg zählt die Hälfte der dann noch lebenden Eingesetzten.

**Angenommen** die Karte, der Knoten `m2_8` (`place: kronfeld`, `levelBonus: 1`) und die Szenen
**Wenn** die Schlacht beginnt
**Dann** läuft im Intro das Freispruch-Treffen, in Runde 1 der Verrat (Tafel 6, Bild per Grafik-Task `art/prompts/tafel_kronfeld_verrat.md`, bis dahin Platzhalter); Seraphine liefert die Truppe aus, weil Halvard ihr einflüstert, das Aschenbanner sei schuldig
**Und** die Leutnants sprechen ihre Kampfzeilen; ist `joined_sable` gesetzt, fehlen Sable und ihre Zeile (Muster `grosk` in `m1_8`); Odile und Varek stehen nach `return` bzw. `pardon` nicht auf dem Brett, sie sprechen nur ihre Szenenzeile auf der Gegenseite
**Und** die Einsatzwahl erlaubt bis zu 15 Figuren, Söldner der Taverne füllen auf.

**Angenommen** die Truppe entkommt
**Wenn** die Mission gewonnen ist
**Dann** folgt Tafel 7 „Die Krone war hohl“ (Bild per Grafik-Task, bis dahin Platzhalter): der Pakt hält durch ein Opfer, Seraphine glaubt, sie werde Königin; Ersatzsprecher-Kette für Gefährtenzeilen
**Und** Akt 2 ist beendet (`actFinished`); ohne Paket `act3` zeigt die Weltkarte „Akt 3 „Krone“ erscheint bald“ (Story 7.3); 2-8 gibt keinen Glutfunken
**Und** die Relikt-Stufen, die laut `items.md` §5 an 2-8 hängen, erwachen: Schild der Paktwächter Stufe 3, Drachenglut Stufe 2 (Mechanik aus Story 11.9); diese Story trägt die Stufen mit `completed m2_8` in `items.yaml` ein.

**Angenommen** das Referenzgerät (Pixel 6a / iPhone 12) und Story 7.7
**Wenn** eine komplette Gegnerphase mit ~30 Gegnern und 15 eigenen Figuren läuft
**Dann** hält sie 60 FPS (NFR1) und jede Gegnereinheit braucht unter 300 ms KI-Rechenzeit im Web Worker (NFR3); die Messung steht im Dev Agent Record
**Und** `pnpm sim m2_8 --runs 50 --start expected --position 7` liegt auf allen Schwierigkeiten im Korridor, Normal am oberen Rand; Spielzeit 30–45 Minuten laut GDD.

### Story 11.18: Nebenquest N4 „Der Clan im Schnee“

Als Spieler
möchte ich Ilkas Jägerclan gegen Dravns Vorposten im frühen Schnee beistehen,
damit Ilka ihre Geschichte und ihren Signaturbogen bekommt.

**Abhängigkeiten:** nach 11.13 (Knoten `m2_4`) und 11.5 (Ilka); Funken-Moment aus Story 10.2.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `n4_clan`, 14×16: Clanlager im Hochland bei frühem Schnee (Wetter `snow`, nur auf dieser Karte in Akt 2), Kriegsnebel, Zelte und Felsen; Morgen |
| Ziel | `defend` Clanälteste (Zivilistin), 8 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 12 = 8 Start + 4 Welle (Runde 3): Dravns Vorposten (3 vanguard, 2 knight, 3 marksman, 3 skirmisher) + ein Vorposten-Hauptmann (`skirmisher`, kein Leutnant); Leicht 10, Schwer 14 `[ASSUMPTION]` |
| Position und Stufe | P beim Spielen (frühestens 13, wenn 2-4 als 2. Mission), Offsets +0 bis +2 |
| Leutnant | keiner |
| Szenen | `scn.n4.intro`, `scn.n4.outro`, `scn.n4.memorial_intro`, `scn.n4.memorial_outro` |
| Auslöser | `completed m2_4` + `any: [alive ilka, dead ilka]` (gegangen = keine Quest), `memorialIf: { dead: ilka }`; bleibt über Akte offen |
| Einsatzplätze | 7; Ilka Pflicht, wenn sie lebt |
| Belohnung | Glutfunke (Knotenwirkung) + Signaturbogen `white_wolf`, auch in der Gedenk-Variante |
| Gold | 1 400 `[ASSUMPTION]` (≈ 55 % einer Story-Mission) |
| Nebenziele | `no_downs` (`vulnerary`), `visit_villages` 2 Zelte (Mondstahl) `[ASSUMPTION]` |
| Heimsuchungs-Anker | 0 |

**Akzeptanzkriterien:**

**Angenommen** N4 und Wetter `snow`
**Wenn** `content:check` läuft
**Dann** erlaubt `render.yaml` Schnee in Akt 2 nur für die Karte `n4_clan` (Eintrag `weather.snow.maps: [n4_clan]` neben `acts: [3]`); jede andere Akt-2-Karte mit `snow` ist ein Fehler.

**Angenommen** Ilka ist in der Truppe oder gefallen und 2-4 ist gespielt
**Wenn** der Spieler N4 gewinnt
**Dann** erhält er einen Glutfunken und `white_wolf` (Bogen, Werte `steel_bow`, `rarity: legendary`, Effekt „Nebel und Schnee kosten keine Sicht“: Sicht des Trägers im Kriegsnebel +3 zusätzlich zum Rollen-Bonus `[ASSUMPTION]`); ist Ilka gefallen, laufen die Gedenk-Szenen und die Belohnung kommt trotzdem
**Und** ist Ilka gegangen, erscheint N4 nicht
**Und** beim Erhalt des Glutfunkens spielt der Funken-Moment (`src/ui/Sparks.tsx`, Story 10.2) über dem Missionsergebnis (FR44 „Erhalt als Moment“).

**Angenommen** das Nebenquest-Gold
**Wenn** die Story abgeschlossen ist
**Dann** liegt das Gold von N4 bei ≈ 55 % einer Story-Mission (1 300–1 600; GDD „Wirtschaft“ ist seit 2026-10-31 nachgezogen, nur prüfen)
**Und** `pnpm sim n4 --start expected --position 2` (frühester Zeitpunkt) und `--position 7` liegen im Korridor.

### Story 11.19: Nebenquest N5 „Glut unter dem Berg“

Als Spieler
möchte ich in Branns alter Mine die Drachenglut finden,
damit Akt 2 neben dem Hauptstrang eine Lore-Geschichte hat.

**Abhängigkeiten:** nach 11.14 (Knoten `m2_5`, Flag `brandhang_burned`) und 11.9 (`dragon_ember` mit Stufen); Funken-Moment aus Story 10.2; `earth_rune_3` existiert.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `n5_mine`, 14×18: Branns alte Mine bei Brandhang, Glutadern im Fels als Lichtquellen (kein Drache), Kriegsnebel, enge Stollen |
| Ziel | `treasure`: 4 Truhen (Relikt `dragon_ember`, `earth_rune_3`, Chronik-Seite `a2_mine`, Mondstahl ×3), 12 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 12 = 9 Start + 3 Welle (Runde 4): Plünderer der Herzogin (4 brigand, 4 skirmisher, 3 marksman) + ein Vorarbeiter (`brigand`, kein Leutnant); Leicht 10, Schwer 14 `[ASSUMPTION]` |
| Position und Stufe | P beim Spielen (frühestens 14), Offsets +0 bis +2 |
| Leutnant | keiner |
| Szenen | `scn.n5.intro` (Zeile je `brandhang_burned`), `scn.n5.relic`, `scn.n5.page`, `scn.n5.outro` |
| Auslöser | `completed m2_5`; keine Gedenk-Variante (Lore); bleibt über Akte offen |
| Einsatzplätze | 7, keine Pflichtfigur außer Avatar und Kael |
| Belohnung | Glutfunke (Knotenwirkung); Relikt, Rune und Seite aus den Ziel-Truhen |
| Gold | 1 500 `[ASSUMPTION]` |
| Nebenziele | `turn_limit` 9 (`remedy_salve`), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Heimsuchungs-Anker | 0 |

**Akzeptanzkriterien:**

**Angenommen** 2-5 ist gespielt
**Wenn** der Spieler N5 gewinnt
**Dann** erhält er einen Glutfunken (Knotenwirkung) und aus den Truhen `dragon_ember`, `earth_rune_3` und die Seite `a2_mine` (Akt-2-Thema, ≤ 400 Zeichen, DE und EN); die Chronik zeigt die Seite
**Und** das Intro nennt Brandhang verbrannt oder gerettet je nach `brandhang_burned`; Brann spricht unter `requires: alive`, sonst Ersatzsprecher
**Und** beim Erhalt des Glutfunkens spielt der Funken-Moment (`src/ui/Sparks.tsx`, Story 10.2) über dem Missionsergebnis (FR44 „Erhalt als Moment“).

**Angenommen** das Nebenquest-Gold
**Wenn** die Story abgeschlossen ist
**Dann** liegt das Gold von N5 bei ≈ 55 % einer Story-Mission (1 300–1 600; GDD „Wirtschaft“ ist seit 2026-10-31 nachgezogen, nur prüfen)
**Und** `pnpm sim n5 --start expected --position 3` (frühester Zeitpunkt) und `--position 7` liegen im Korridor.

### Story 11.20: Nebenquest N6 „Die Gauklertruppe“

Als Spieler
möchte ich mit Jory seiner alten Gauklertruppe gegen ihre Schuldeneintreiber beistehen,
damit der Spielmann seine Geschichte und seine Signaturlaute bekommt.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`, Jory) und 10.4 (Anfeuern auf zwei Ziele über `cheerTargets`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `n6_jahrmarkt`, 16×16: Jahrmarkt in einem Herbstdorf, Bühne, Wagen und Buden als Deckung, die Gauklermeisterin auf der Bühne; Nachmittag, `clear` |
| Ziel | `rout` (Eintreiber vertreiben) `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 12 = 9 Start + 3 Welle (Runde 3): Schuldeneintreiber (4 brigand, 4 skirmisher, 3 marksman; `unit.debt_collector.name`) + Anführer (`brigand`, kein Leutnant); Leicht 10, Schwer 14 `[ASSUMPTION]` |
| Position und Stufe | P beim Spielen (frühestens 12), Offsets +0 bis +2 |
| Leutnant | keiner |
| Szenen | `scn.n6.intro`, `scn.n6.outro`, `scn.n6.memorial_intro`, `scn.n6.memorial_outro` |
| Auslöser | `completed m2_1` + `any: [alive jory, dead jory]`, `memorialIf: { dead: jory }`; bleibt über Akte offen |
| Einsatzplätze | 7; Jory Pflicht, wenn er lebt |
| Belohnung | Signaturlaute `final_curtain` (auch in der Gedenk-Variante), kein Glutfunke |
| Gold | 1 300 `[ASSUMPTION]` |
| Nebenziele | `protect_npc` Gauklermeisterin (`remedy_salve` ×2), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Heimsuchungs-Anker | 0 |

**Akzeptanzkriterien:**

**Angenommen** die Laute `final_curtain`
**Wenn** ein Spielmann sie in der Nebenhand trägt und Anfeuern nutzt
**Dann** gibt sie per `grantsSkill` den Skill `curtain_call` mit `cheerTargets: 2` (Abstand 1) aus Story 10.4: Anfeuern wirkt auf bis zu zwei benachbarte Verbündete, die noch nicht gehandelt haben (je +1 MOV und +10 Treffer aus `balance.yaml › classActions.cheer`, derselbe Empfänger nicht doppelt); es gibt kein eigenes Item-Feld und keinen zweiten Rechenweg
**Und** es gilt die Stapelregel aus Story 10.4: höchstens 2 Ziele, die größte Reichweite gilt; ein Barde mit der Laute behält Reichweite 2 und 2 Ziele, die Laute wirkt für ihn nur über ihre Werte `[ASSUMPTION]`; ohne die Laute bleibt Anfeuern beim Spielmann bei einem Ziel; die Auswahl im Kontext-Band erlaubt das zweite Ziel nacheinander; KI und Autoplay sind nicht betroffen
**Und** `final_curtain`: Laute, Nebenhand, Werte `travel_lute`, `grantsSkill: curtain_call`, `rarity: legendary`, Preis 0, `unsellable` `[ASSUMPTION]`; Tests decken ein und zwei Ziele, Barde mit Laute und Replay ab; der Handbuch-Eintrag zu Anfeuern nennt die Laute.

**Angenommen** Jory ist in der Truppe oder gefallen und 2-1 ist gespielt
**Wenn** der Spieler N6 gewinnt
**Dann** erhält er `final_curtain` und 1 300 Gold, keinen Glutfunken; ist Jory gefallen, laufen die Gedenk-Szenen, die Laute kommt trotzdem in den Konvoi
**Und** `pnpm sim n6 --start expected --position 1` und `--position 7` (späteste Position vor 2-8) liegen im Korridor.

### Story 11.21: Supports, Barks und Chronik-Szene von Akt 2

Als Spieler
möchte ich am Lagerfeuer die neuen Paare kennenlernen, die neuen Gefährten im Kampf hören und in der Burg die Chronik entziffern lassen,
damit Akt 2 Beziehungen und das Pakt-Geheimnis vertieft.

**Abhängigkeiten:** nach 11.5 (Gefährten von Akt 2); Rang A/S am Lagerfeuer hängt an dessen Stufe (vorhandener Code `campfireMaxRank`, Ausbau in 10.1, Panel in 10.8); Chronik-Szene nach 11.1 (`storyCount` je Akt).

**Akzeptanzkriterien:**

**Angenommen** die 8 Paare von Akt 2 laut Narrative (Jory × Nell, Nell × Varek, ★ Varek × Odile, Odile × Sable, Sable × Ilka, ★ Ilka × Brann, Liora × Amos, Amos × Grosk)
**Wenn** ihre Gespräche in `content/acts/act2/supports.yaml` und `scn.support.<a>_<b>.<Rang>` geschrieben sind (Schreib-Pipeline der Narrative, DE + EN, 8–16 Boxen, ≤ 110 Zeichen je Box)
**Dann** haben alle Paare C, B und A, die Kernpaare ★ zusätzlich S (26 Gespräche); sie stehen am Lagerfeuer bereit, sobald die Punkte reichen und die Lagerfeuer-Stufe den Rang erlaubt (`campfireMaxRank`, Epic 10)
**Und** der Wissensstand folgt dem Akt-1-Muster: C und B kennen nur Akt-2-Einstieg und Beitritte, A und S dürfen das Ende der Stränge, aber nicht Kronfeld kennen; Gespräche mit Figuren, die gegangen sind (Odile nach E5, Varek nach E6) oder vor Sables Wechsel nicht dabei sind, erscheinen nicht.

**Angenommen** die sieben Gefährten von Akt 2
**Wenn** ihre Barks geschrieben sind
**Dann** hat jeder etwa 6 Barks (`scn.bark.<id>`: Kampfbeginn, Krit, niedergestreckt, Dank fürs Bergen, Stufenaufstieg, Glutfunke), eine Todeszeile (`scn.farewell.<id>`) und eine Trauerzeile je Support-Partner, auch für die Akt-1-Partner (Varek, Liora, Grosk)
**Und** Sable hat eigene Zeilen als Seitenwechslerin, sobald sie beigetreten ist.

**Angenommen** Beat 10 „Die Chronik“ (Key Conversation 7)
**Wenn** die Truppe nach der 3. abgeschlossenen Story-Mission von Akt 2 (egal welche) in die Burg zurückkehrt
**Dann** läuft einmal die Burg-Szene `scn.castle.chronicle`: Liora entziffert die in 1-7 geborgene Chronik, sonst Ysolde, sonst Rhen (Ersatzsprecher-Kette); ist Liora tot, kommt eine Gedenkzeile; Kern: „Der Pakt verlangt etwas von den Königen“, was genau, bleibt offen
**Und** ein Flag `chronicle_read` (story, `season2: true`) hält fest, dass die Szene lief; der Chronik-Eintrag `wardens_chronicle` wechselt von „versiegelt“ auf „entziffert“ (Text in `locales/<lang>.yaml`)
**Und** Auslöser sind `storyCount` von Akt 2 ≥ 3 und die Heimat Burg, getestet für verschiedene Reihenfolgen.

**Angenommen** Vertonung und Musik
**Wenn** die Story abgeschlossen ist
**Dann** sind Texte vollständig in DE und EN; Vertonung (`voice.act2.<lang>`), Musik (Flöte, Fiedel) und Klang von Akt 2: später.

### Story 11.22: Akt 2 abstimmen und veröffentlichen

Als Produktinhaber
möchte ich Akt 2 über alle Reihenfolgen der Stränge abgestimmt sehen,
damit Spieler aus Akt 1 ohne Brüche und im Korridor weiterspielen.

**Abhängigkeiten:** nach allen Stories von Epic 11 und nach 10.1–10.12 (Raumkosten, Aufstieg, Profi-Wirkungen, Fallen und Schatten, Werkstatt, Lektionen, Reserve-EP, Händler-Glutfunken und Rabatt, Konvoi, Trank verstärken und Söldner-Traits verändern Gold, EP, Glutfunken und Siegquoten von Akt 2).

**Akzeptanzkriterien:**

**Angenommen** alle Stories von Epic 11 sowie 10.1–10.12 auf `main`
**Wenn** `pnpm sim --campaign act2 --runs 50` die verkettete Kampagne über Akt 1 und Akt 2 mit Aufstiegen spielt
**Dann** liegen alle Story-Missionen von Akt 2 auf allen Schwierigkeiten in den Korridoren (NFR12), 2-8 am oberen Rand; die Armee-Stufe weicht je Mission höchstens `levelTolerance` von der Positionsstufe ab; das Gold je Mission liegt in `perAct['2']`, Nebenziele bei 30–50 %
**Und** geprüft werden mindestens die 6 Reihenfolgen, in denen die Stränge nacheinander laufen, und 2 verschränkte (2-2, 2-4, 2-6, 2-3, 2-5, 2-7 und umgekehrt) `[ASSUMPTION]`, je mit E7 `warn` und `obey`; Ergebnisse im Dev Agent Record
**Und** die Nebenquests N4–N6 liegen an ihrer frühesten und spätesten Position im Korridor.

**Angenommen** die vorläufigen Werte aus 11.10–11.20
**Wenn** die Abstimmung Werte ändert
**Dann** ändern sich nur Content-YAML und `balance.yaml`; jede Änderung gegenüber den Vorschlägen steht im GDD-Log
**Und** die Rabatt-Summe (E4, E7, Händler-Stufe 3) erreicht nie mehr als −30 %, die Glutfunken von Akt 2 (N4, N5, Händler) passen zur Rechnung des GDD (12 je Staffel).

**Angenommen** die Spielzeit
**Wenn** der Simulator Züge und Szenen zählt und ein Probedurchlauf auf Normal gemessen ist
**Dann** passt Akt 2 zu 30–35 Stunden für die Staffel (NFR16, Akt 2 rund ein Drittel) `[ASSUMPTION]`.

**Angenommen** Spielstände aus Akt 1
**Wenn** der Migrationstest läuft
**Dann** laden die Fixtures aus dem Akt-1-Release (`tests/fixtures/saves/format2-*`) ohne Datenverlust; ein Stand mit erledigtem `m1_8` landet in Akt 2 mit Titeltafel; 11.1 braucht keine Migration, ab Story 10.2 gilt Format 3 (generische Migration 2 → 3 mit den Umbenennungen aus `renames.yaml`, `tests/unit/migrations.test.ts`); ändert sich das Format danach erneut, gibt es eine weitere Migration mit Fixture.

**Angenommen** der echte Release von Akt 2
**Wenn** der Produktinhaber ihn auslöst
**Dann** läuft erst dann `pnpm content:lock` und sperrt die IDs von `act2` in `content/released-ids.json` (bis dahin keine Sperre, Entscheidung 2026-10-31); `act2` ist schon seit 11.3 `released: true`
**Und** die Leistung von 2-8 ist mit Story 7.5 auf dem Referenzgerät gemessen (NFR1, NFR3), alle Prüfungen sind grün, der Pull Request gegen `main` nennt die Ergebnisse
**Und** ein Playtest-Plan für Akt 2 (Stränge, Verrat in Kronfeld, Flieger und Balliste) liegt vor (`gds-playtest-plan`).
