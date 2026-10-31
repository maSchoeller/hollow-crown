# Story 11.1: Paket, Region und Gegner von Akt 2

Status: Entwurf, Planung pausiert 2026-10-31 (nicht ready-for-dev)

<!-- Erstellt mit gds-create-story am 2026-10-31. Größe: groß; Aufteilungsvorschlag 11-1a/11-1b siehe Dev Notes (nicht umnummeriert). -->

## Story

Als Spieler
möchte ich nach dem Finale von Akt 1 die Eisenmark im Herbst betreten und dort neuen Gegnern begegnen,
damit Akt 2 eine eigene Welt hat und mein Spielstand aus Akt 1 nahtlos weiterläuft.

## Acceptance Criteria

**A. Akt-Übergang und Content je Akt**

1. **Content je Akt:** `content/acts/act2/` enthält `campaign.yaml`, `units.yaml`, `flags.yaml`, `lieutenants.yaml`, `haunts.yaml` und `scenes/scn.lt.{brakka,grell,sable,rowena}.yaml`. Der Loader (`src/content/load.ts` `buildContent`) lädt `campaign.yaml`, `units.yaml` und `flags.yaml` **aller vorhandenen Akt-Ordner** statt hart `acts/act1/…`. Gefährten und Flags aller Akte stehen gemeinsam in `data.chars` bzw. `data.flags`; eine doppelte Id über Akte hinweg meldet `content:check` als Fehler.
2. **Kampagnen je Akt im Kern:** `GameData` hält die Kampagnen je Akt (`acts: Record<number, CampaignDef>`), `CampaignState` den aktuellen Akt (`c.act`). Eine reine Hilfsfunktion (z. B. `actCampaign(data, c)`) liefert die Kampagne des laufenden Akts. Alle Lesestellen von `data.campaign` (rund 60 in `src/core`, `src/app`, `src/content`, `tools/`) lesen danach den Akt der Kampagne. Knoten-Ids sind über alle Akte eindeutig (`content:check`). Ein Knoten lässt sich aktübergreifend per Id finden (`nodeDef(data, id)`).
3. **Übergang:** Gewinnt die Truppe das Finale eines Akts (`fixed: finale`, `actFinished`) und liegt die Kampagne des nächsten Akts in den Daten vor, setzt `finishMission` `c.act = act + 1` und meldet das Event `actReached { act }`. Fehlt der nächste Akt, bleibt alles wie in Story 7.3: kein `act + 1`, die Weltkarte zeigt „Akt n „Name“ erscheint bald“. Replays (Startzustand + Command-Log) liefern dasselbe Ergebnis.
4. **Bestehende Spielstände:** Format 2 bleibt, eine Migration ist nicht nötig. `normalizeCampaign` füllt ein fehlendes `c.act` (§8.7) und holt den Übergang nach: Solange das Finale des Akts erledigt ist und der nächste Akt vorliegt, wird `act` hochgezählt. So landet ein Spielstand aus Akt 1 mit erledigtem `m1_8` nach dem Update direkt in Akt 2, auch einer, der wegen „erscheint bald“ in Akt 1 stand. Nachgewiesen wird das mit einem Test und einer Fixture `tests/fixtures/saves/format2-act1-finale-done.json` (Akt-1-Stand mit `m1_8` erledigt): Er lädt mit `act: 2`, Truppe, Gold, Tross, Flags, Groll und Gedenksteine bleiben unverändert. Ein Stand ohne erledigtes Finale bleibt in Akt 1. `metaFromCampaign` (`src/persistence/save.ts`) gibt `c.act` statt fest `1` zurück, die Kampagnen-Liste zeigt „Akt 2“.
5. **Was pro Akt gilt:** Im laufenden Akt gelten:
   - `levelCap`, `mechanics`, Händlerstufen (`merchant`, `currentTier`) und `storyCount` des Graphen;
   - die Bedingung `act` aus `c.act`;
   - `priceMods`, `villageAid`, die Entscheidungen der Chronik (`decisions[].act`) und die Backup-Erinnerung.

   Nebenquests früherer Akte bleiben offen (Architektur §5.4): `availableNodes` liefert die Story-Knoten des laufenden Akts und die Nebenquest-Knoten aller Akte bis `c.act`. Heimat (`c.home`) und Räume bleiben beim Übergang, wie sie sind.
6. **Heimsuchungen ohne Akt-2-Karten:** Solange der laufende Akt keinen Story-Knoten mit Karte hat, fallen `hauntGold` und `hauntLevel` nicht auf 0 bzw. Stufe 1 zurück. Sie nehmen die Werte des letzten Akts mit Story-Karten; ein Test belegt das.

**B. Paket und Build**

7. **Paket `act2`** in `content/packs.yaml`:
   - `released: true`, `load: background`, `act: 2`, `budgetMb: 40`;
   - `content: [acts/act2/**, locales/*/act2.*]`;
   - `assets`: act2/** sowie die Akt-2-Bilder und -Modelle einzeln, damit sie nicht über die breiten Globs von `act1` (`models/**`, `locations/**`, `halves/**`, `busts/**`) im Paket `act1` landen. Die Globs kennen keine `{a,b}`-Klammern: ein Glob je Datei, oder das Paket `act2` steht vor `act1`.
   - `props`: `autumn_a`, `autumn_b`, `autumn_c` (heute liegen `autumn_a/b` mangels Eintrag in `core` und damit im Vorab-Cache, `autumn_c` in `act1`).

   Die kleinen Kopfdateien `acts/act2/{campaign,units,flags}.yaml` gehören wie bei Akt 1 zu `core`, damit Übergang, Bedingungen und Räume sie schon vor dem Hintergrund-Download kennen. Es wird **nicht** `pnpm content:lock` ausgeführt; `content/released-ids.json` entsteht erst beim echten Release (Entscheidung 1).
8. **Build-Regel für unveröffentlichte Akte:** Dateien unter `acts/actN/` kommen nur in den Build, wenn das Paket `actN` `released: true` hat, auch wenn ein `core`-Glob sie trifft (`tools/build/packs-plugin.ts`). Ein Test in `tests/unit/packs*.test.ts` deckt das ab. So bleibt „erscheint bald“ für Akt 3 korrekt.
9. **Budget:** `pnpm build` ist grün. `tools/check-bundle-size.mjs` meldet `act2` ≤ 40 MB. `core` bleibt unter 30 MB und nahe dem Richtwert `firstDownloadTargetMb: 12`: Er wächst höchstens um die drei Kopfdateien und wird durch die verschobenen Herbstbäume kleiner. `act1` wird nicht größer.
10. **Hintergrund-Download:** `duePacks` lädt `act2`, sobald `c.act ≥ 2` ist. `reachedAct` in `src/app/state/packs.ts` liest dafür den Akt der geladenen Kampagne statt `data.campaign.act`. Ist das Paket noch nicht geladen, zeigt die Weltkarte den Ladezustand (§5.14 „Sperre“).

**C. Weltkarte**

11. **Nebel:** Bei `c.act = 2` lichtet sich der Nebel über der Eisenmark: `fogTop(world, 2)` deckt nur noch Aurenhall ab, das Regions-Schild „Eisenmark“ verschwindet. Das Akt-Band zeigt „Akt 2 · Herbst – Glut“; dafür kommt der Schlüssel `act.2.season` in DE und EN dazu. `WorldMap.tsx` (Z. 92/95/97/324/407–410), `Camp.tsx:88` und `BackupSheet.tsx:13` lesen den Akt der Kampagne.
12. **Knoten von Akt 2:** Entscheidung dieser Story: **noch kein Story-Knoten von Akt 2 in 11-1** (Begründung in den Dev Notes).
    - `acts/act2/campaign.yaml` hat `nodes: []`.
    - Nach dem Übergang zeigt die Weltkarte die gelichtete Eisenmark mit dem vorhandenen Hinweis „Weitere Missionen folgen“ (`moreMissionsFollow`). Heimsuchungen, Nebenquests, Lager und Burg laufen weiter.
    - Story 11-2 fügt `m2_1` als `fixed: first` ein und setzt `node: m2_1` am Ort `m2_1` in `content/world/valmora.yaml`; jede weitere Missions-Story ergänzt ihren Knoten genauso.
    - `content:check` erlaubt einen Akt ohne Knoten nur, solange sein Paket nicht im Release-Lock steht.

**D. Kampagnen-Grunddaten Akt 2**

13. **`acts/act2/campaign.yaml`:**
    - `act: 2`, `levelCap: 20`, `mechanics: {}` (alle Regeln ab dem ersten Kampf an), `home: castle`;
    - `defaultPlace: grauwacht`, `startGold`/`startConvoy` nur für das Schema (eine Kampagne beginnt nie in Akt 2);
    - `merchant` mit drei Stufen, Stahl als Grundsortiment (Vorschlag in den Dev Notes), `scars` wie in Akt 1 (oder gemeinsam, siehe Dev Notes).

    In `balance.yaml` kommen nur die Akt-Schlüssel dazu: `lieutenant.bounty.materialByAct: { 1: iron_ore, 2: moonsteel }` (GDD: Mondstahl in Akt 2) und `lieutenant.scaling.tierUp` um die neuen Stahl-Waffen, deren Eisen-Variante existiert (`iron_dagger: steel_dagger`). Die Goldkurve `simulation.gold.perAct['2']` = [2000, 3000] steht schon und wird nicht geändert.
14. **Stahl-Tier:** Die in `concept/21-gdd/items.md` §6.1/§6.6 genannten, in `items.yaml` fehlenden Akt-2-Teile kommen als **eigener Block** in `content/core/items.yaml` dazu, mit Werten nach dem Muster der vorhandenen (Ableitungsregel in den Dev Notes):
    - `steel_dagger`, `armorpiercer`, `stiletto`, `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `shadow`, `physic_staff`;
    - `round_shield`, `crystal_focus`, `steel_helm`, `scale_mail`;
    - die vier Signaturen `wing_lance`, `dravns_oath`, `gold_hook`, `wyvern_cleaver`;
    - das Geschütz `ballista_bolt`.

    Namen und Beschreibungen gibt es in DE und EN, Item-Bilder sind Platzhalter, bis Story 8.5 sie nachzieht. `silverwing` (Nebenziel 2-3) und `dragon_ember` (N5) kommen mit ihren Missions-Stories.
15. **Gefährten von Akt 2:** `acts/act2/units.yaml` legt die festen Ids `jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable` an. Epic 10 bindet Räume an diese Ids.
    - Klassen nach Narrative: `jory` minstrel, `odile` skirmisher, `nell` scout, `brann` elementalist (Erde), `amos` healer, `ilka` marksman, `sable` skirmisher.
    - Beitrittsstufe 11–14, `base`/`growth`/`items` [C] im Muster von Akt 1 mit Stahl-Ausrüstung, `supports` laut Narrative.
    - `joins` nennt den künftigen Knoten (`m2_1` Jory, `m2_2` Nell, `m2_3` Odile, `m2_4` Ilka, `m2_5` Brann, `m2_6` Amos); Sable hat `joins: lieutenant`.
    - `personalSkill` bleibt leer, bis die Missions-Story ihn setzt. Namen `unit.<id>.name` gibt es in DE und EN.

**E. Gegnertypen von Akt 2**

16. **Eisenmark-Truppen:** keine neue Klasse. Dravns Soldaten sind die vorhandenen Rollen (`vanguard`/Lanze, `skirmisher`/Schwert, `marksman`/Bogen, `brigand`/Axt) mit Stahl-Waffen, eigenen Namen (`unit.iron_soldier.name` u. a.) und einem Platzhalter-Modell (`soldier`).
17. **Ritter und Pegasusritter:** `knight` (armored, Lanze, `heavy_armor`) und `pegasus_knight` (flier, Lanze) sind vorhanden. Ihre Werte werden auf Akt-2-Stufen (11–20) geprüft. Ritter sollen gegen Axt/Magie und Panzerstecher verwundbar sein, Pegasusritter gegen Bögen (`effectiveVs: [flier]`, ×3). Korrekturen gehen nur in den Block „Gegnertypen“ von `classes.yaml`. Beide bekommen `art:` mit vorhandenen Porträts als Platzhalter.
18. **Wyvernreiter (neu):** Die Klasse `wyvern_rider` steht als eigener Block im Abschnitt „Gegnertypen“ von `classes.yaml`:
    - `moveType: flier`, `tags: [flier]`, Axt, `playable: false`;
    - Werte [C]: zäher und stärker, aber langsamer als der Pegasusritter (Vorschlag in den Dev Notes);
    - Platzhalter-`art`, Name DE/EN.

    Brakka nutzt diese Klasse.
19. **Balliste als Kern-Regel:**
    - **Bedienen:** Eine Kartenfigur auf einem Nachbarfeld (Abstand 1) eines Objekts `type: ballista` kann sie mit der Aktion `{ kind: 'ballista'; object; target }` im Command `act` bedienen. Das gilt für jedes Team, Flieger ausgenommen.
    - **Schuss:** Reichweite 3–10 ab dem Ballistenfeld, Mt 12 (Item `ballista_bolt`), physischer Schaden. Das Ziel muss sichtbar sein (Nebel). Kein Gegenangriff, Waffendreieck und Waffengruppe des Bedieners zählen nicht.
    - **Feld:** Das Ballistenfeld ist für Fußtruppen nicht betretbar.
    - **Formel:** Vorschau (`forecast`) und Auflösung (`resolveAttack`) rechnen über denselben Formelcode mit der Waffe der Balliste. Leutnants zeigen „flieht“.
    - **Bedienung im Spiel:** Das Kontext-Band bietet „Balliste“ an, sobald eine Figur daneben steht. Die KI (`src/core/ai/ai.ts`, auch Autoplay der Simulation) bewertet einen Ballistenschuss wie einen Angriff und nutzt ihn.
    - **Tests:** replay-sicher, Tests für Reichweite, Sicht, Nachbarschaft, Vorschau = Auflösung, KI-Nutzung und Replay.
20. **Heimsuchungs-Pools:** `acts/act2/haunts.yaml` legt Pools für die vier Fraktionen der Akt-2-Leutnants an (Stahl-Tier, Vorschlag in den Dev Notes), dazu `civilian` und `chestLoot`.

**F. Leutnants von Akt 2**

21. **`acts/act2/lieutenants.yaml`:** Brakka, Grell, Sable (`joins: true`; den Seitenwechsel per E7 baut Story 11-6) und Rowena, mit:
    - `class`, `faction`, `signatureItem`, drei `grudgeSkills`, `titleKey`, `scene: scn.lt.<id>`;
    - `portrait`/`model` = vorhandene Dateien (`art/models/units/<id>.glb`, `art/mockups/characters-s1/<id>.png`).

    Die neuen Groll-Fähigkeiten (Quelle `grudge`) stehen in `skills.yaml` und nutzen nur vorhandene Effekt-Formen. `content:check` (`validateLieutenants`) ist grün.
22. **Leutnant-Szenen:** `scn.lt.<id>` hat je die Zeilen `first`, `grudge_1..3` (mit `{target}`), `flee_1..3` und `mock` (Gedenk-Spott mit `{target}`), bei Sable zusätzlich `join`.
    - **Sprache:** Deutsch in der Szene, Englisch in `content/locales/en/act2.dialogue.yaml`.
    - **Länge und Stil:** jede Box ≤ 110 Zeichen, Stil laut Narrative Dialogue Framework (keine Anglizismen, Ersatzflüche, Leutnants mit Erkennungsformel).
    - **Erkennungsformel:** Jeder Leutnant hat seine eigene, sie kommt in `first` und in mindestens einer weiteren Zeile vor (Vorschlag in den Dev Notes).
    - **Titel:** `lt.<id>.title` in DE und EN.

**G. Herbst auf dem Brett**

23. Eine Karte unter `acts/act2/maps/` zeigt Herbst: Jahreszeit-Tönung `render.yaml` `look.season.2` und Herbstbäume `variants.tree.2` sind vorhanden und gelten über `map.act`. Wetter `clear`/`mist`/`rain` gibt es auch in Akt 2. **Neu:**
    - Bodentextur Gras/Erde in Herbstfarben (braunes Gras, Heide) aus `tools/art/ground.py` als Akt-Variante, die das Brett bei `map.act = 2` wählt;
    - Berg-Haube ohne Grün.

    Ein Screenshot (Hochformat 375 × 812) vergleicht dieselbe Testkarte in Akt 1 und Akt 2.
24. **Testkarte:** `tests/fixtures/maps/dev_eisenmark.yaml` ist eine Fixture-Karte, kein Knoten. Sie zeigt alle Gegnertypen von Akt 2, zwei Ballisten, Rowena und Brakka als Flieger sowie Herbstgelände. `__hc.devMap('dev_eisenmark', 2)` spielt sie mit der Jahreszeit von Akt 2: `devMap` (`flow.ts:514`) übernimmt dafür einen Akt-Parameter statt fest `act: 1`.

**H. Simulation**

25. **Verkettete Simulation:** `pnpm sim --campaign act2` verkettet automatisch. Jeder Lauf spielt erst Akt 1 bis zum Finale (Endstand: Truppe, Stufen, Gold, Tross), wechselt per `finishMission`-Regel in Akt 2 und spielt dessen Story-Knoten (11-1: keine). Der Bericht nennt Armee-Stufe und Gold beim Eintritt in Akt 2. Die Goldkurve prüft `perAct['2']`.
    - Option `--start expected`: Die Startarmee entsteht ohne Akt-1-Lauf auf der erwarteten Stufe (Akt 2 Mission 1: Stufe 11, GDD), für schnelle Läufe der Missions-Stories.
    - `pnpm sim <mapId>` findet Knoten aller Akte.
    - `pnpm sim --map-file tests/fixtures/maps/dev_eisenmark.yaml` spielt die Testkarte mit der verketteten Akt-1-Armee, für Balliste und Gegnerwerte.

    Die Werte aus Kriterium 17–19 sind auf dieser Karte geprüft und im Dev Agent Record notiert. Sie sind vorläufig und ohne Aufstieg abgestimmt (Entscheidung 2).

**I. Assets und Abschluss**

26. **Fehlende Modelle:**
    - Ein eigener Task (Datei `art/prompts/<id>.md`, Tripo-Pipeline §4.6) legt die Brettfiguren der generischen Akt-2-Gegner an: Eisenmark-Soldat, Ritter, Pegasusritter, Wyvernreiter, Kaperfahrer der Herzogin.
    - Bis dahin dienen vorhandene Modelle als Platzhalter über `art` in `classes.yaml` bzw. `sprite` in Karten und Pools; das steht in `art/README.md` oder in der Prompt-Datei.
    - Eine Balliste kommt als Requisitenmodell (`tools/art/blender_*.py`) oder als Platzhalter-Requisite mit `propFallback`.
    - Musik, Klang und Vertonung von Akt 2: **später** (Entscheidung 5), nicht Teil dieser Story.
27. **Prüfungen:**
    - `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` sind grün.
    - `pnpm test:coverage`: Die Abdeckung von `src/core` sinkt nicht (Balliste, Übergang und Normalisierung haben eigene Tests).
    - Screenshots: Weltkarte nach dem Übergang, Testkarte mit Balliste und Vorschau, Herbst-Vergleich.

## Tasks / Subtasks

**Teil A (Vorschlag 11-1a): Übergang, Paket, Weltkarte, Grunddaten**

- [ ] T1 Kern: `GameData.acts`, `CampaignState.act`, Hilfen `actCampaign`/`nodeDef`, Lesestellen umstellen (AC 2, 5)
  - [ ] `src/core/defs.ts`, `src/core/state.ts`, `src/core/campaign/{graph,conditions,campaign,haunts,aid,chronicle,camp,apply}.ts`, `src/core/rules/progression.ts` (`levelCap(data, c)`), `src/core/battle/{setup,hauntBattle}.ts`
  - [ ] `availableNodes`: Story-Knoten des laufenden Akts + Nebenquests aller Akte ≤ `c.act`
- [ ] T2 Übergang in `finishMission` (`apply.ts`) + Event `actReached` (`commands.ts`), `normalizeCampaign` holt nach (AC 3, 4)
- [ ] T3 Loader: alle Akt-Ordner (`load.ts` Z. 239/247/248), Id-Eindeutigkeit über Akte (`validate.ts`), `ids.ts` Knoten aller Akte (AC 1)
- [ ] T4 Spielstand: `metaFromCampaign` act, Fixture `format2-act1-finale-done.json`, Tests (AC 4)
- [ ] T5 Heimsuchungen ohne Akt-2-Karten: Rückfall für `hauntGold`/`hauntLevel` (AC 6)
- [ ] T6 Paket `act2` in `packs.yaml`, Kopfdateien in `core`, Build-Regel für unveröffentlichte Akte im Packs-Plugin, Herbstbäume ins Paket `act2`, Budget (AC 7–10)
- [ ] T7 App: `reachedAct`, Weltkarte, Lager, Backup-Blatt lesen `c.act`; `act.2.season` DE/EN (AC 10, 11)
- [ ] T8 `acts/act2/campaign.yaml` (leere Knotenliste, Händler, levelCap), `flags.yaml` (leer), `units.yaml` (7 Gefährten), Namen DE/EN (AC 12, 13, 15)
- [ ] T9 Stahl-Block in `items.yaml`, `tierUp`/`materialByAct` in `balance.yaml`, Item-Texte DE/EN (AC 13, 14)
- [ ] T10 Simulation: `tools/simulate.ts` und `tools/simCampaign.ts` über Akte, `--start expected`, `--map-file` (AC 25)

**Teil B (Vorschlag 11-1b): Gegner, Balliste, Leutnants, Herbst**

- [ ] T11 `wyvern_rider` und Prüfung `knight`/`pegasus_knight` im Block „Gegnertypen“ von `classes.yaml`, Namen DE/EN (AC 16–18)
- [ ] T12 Balliste: Aktion, `availableActions`, Kontext-Band, Vorschau über `forecast`, Auflösung, KI, Tests (AC 19)
- [ ] T13 `acts/act2/haunts.yaml` (AC 20)
- [ ] T14 `acts/act2/lieutenants.yaml`, Groll-Skills in `skills.yaml`, Szenen `scn.lt.*` DE + `locales/en/act2.dialogue.yaml`, Titel (AC 21, 22)
- [ ] T15 Herbst-Boden in `tools/art/ground.py` + Brett-Auswahl je Akt, Berg-Haube (AC 23)
- [ ] T16 Testkarte `dev_eisenmark`, `devMap` mit Akt, Sim auf der Testkarte, Werte abstimmen (AC 24, 25)
- [ ] T17 Asset-Task generische Gegner (Prompt-Dateien, Platzhalter dokumentiert), Ballisten-Requisite (AC 26)
- [ ] T18 Doku: Architektur §5.4/§5.5/§5.14 „Stand (Story 11.1)“, Decision-Logs, Screenshots, Gate (AC 27)

## Dev Notes

### Entscheidungen des Produktinhabers (bindend, 2026-10-31)

1. **`act2` wird sofort veröffentlicht:** `released: true` in `packs.yaml` ab 11-1. IDs werden erst beim echten Release gesperrt: kein `pnpm content:lock`, `content/released-ids.json` entsteht wie geplant mit dem ersten echten Release. Eingetragen in `concept/24-architecture/decision-log.md`.
2. **Missionen werden jetzt gebaut und vorläufig ohne Aufstieg abgestimmt.** Die endgültigen Korridore kommen in 11-13, sobald Epic 10 (10-2 Akademie/Glutfunke, 10-3 Profi-Wege) auf `main` ist. Abweichungen vom Korridor begründet jede Story im eigenen Log (Dev Agent Record).
   - Epic 10 baut eine **andere Session**: Räume, Akademie und Aufstieg hier **nicht** bauen.
   - Eingetragen in `concept/21-gdd/decision-log.md`.
3. **Karten, Gegner und Werte entwirft der Assistent** aus Narrative und GDD und stimmt sie per Simulation ab; der Produktinhaber prüft über Screenshots nach jedem PR (`concept/21-gdd/decision-log.md`).
4. **Beat 10 „Die Chronik“** ist eine Burg-Szene bei der Rückkehr nach der **3. abgeschlossenen Story-Mission von Akt 2**, gleich in welcher Reihenfolge. Ersatzsprecher-Kette: Liora → Ysolde → Rhen. Umgesetzt wird sie mit Story 11-12, in 11-1 gibt es nichts dazu.
   - Der Auslöser braucht `storyCount` je Akt; das liefert diese Story (AC 5).
   - Eingetragen in `concept/22-narrative/decision-log.md`, weil das Narrative das zuständige Artefakt ist.
5. **Audio bleibt später:** Kriterien zu Musik, Klang und Vertonung (Akt-2-Musik Flöte/Fiedel, Groll-Zeilen vertont, `voice.act2.<lang>`) sind „später“ markiert (`concept/21-gdd/decision-log.md`).

### Abgrenzung zu Epic 10 (parallele Session) – Konfliktrisiko

Epic 10 ändert gleichzeitig:
- `content/core/rooms.yaml` und `content/core/classes.yaml` (10 Profi-Klassen);
- `content/core/items.yaml`, nur `ember_spark`/`promotion_seal`;
- `content/core/balance.yaml`, nur einen neuen Abschnitt für Räume/Akademie;
- `src/core/campaign/{camp,apply,commands}.ts` und `src/core/rules/progression.ts`.

Für 11-1 heißt das:
- Neue Gegnerklassen (`wyvern_rider`) als **eigener Block im Abschnitt „Gegnertypen“** von `classes.yaml` (ab Z. 347), keine Änderungen an den Profiklassen.
- Stahl-Items als **eigener Block** in `items.yaml` (Kommentar `# Akt 2: Stahl-Tier (Story 11.1)`), `ember_spark`/`promotion_seal` nicht anfassen.
- In `balance.yaml` **nur** die Akt-Schlüssel (`tierUp`, `materialByAct`).
- Änderungen an `apply.ts`, `commands.ts`, `camp.ts`, `progression.ts` **klein halten**:
  - `apply.ts`: Übergang am Ende des `finishMission`-Zweigs, `markBackupReminded` gegen `c.act`;
  - `commands.ts`: ein neues Event `actReached`;
  - `camp.ts`: Z. 248/250 `levelCap`/`act`;
  - `progression.ts`: `levelCap(data, c)`.

  Alle übrigen `data.campaign`-Umstellungen bündelt die Hilfsfunktion. Vor dem PR `main` einmischen; landet Epic 10 zuerst, die Lesestellen dort mit umstellen.
- Die Bedingung `act` (rooms.yaml: Stufe 2/3 `requires: [{ act: 2 }]`) wird erst mit dieser Story wahr. Epic 10 kann Räume ab Akt 2 also erst nach 11-1(a) wirklich testen; Abhängigkeit im PR nennen.
- Gefährten-Ids sind fest (`jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable`): Epic 10 bindet Räume daran. Deshalb legt 11-1 `acts/act2/units.yaml` mit allen sieben an, sonst meldet `content:check` „unknown companion“ (`validate.ts:72`).
- **Offener Konflikt:** `storyCount`-Bedingungen in `rooms.yaml` (Schmied, Heiler, Taverne `min: 3`, Lagerfeuer `min: 4`) zählen heute die Story-Missionen der Kampagne des Akts (`conditions.ts:53`). Mit `storyCount` je Akt wären diese Räume beim Eintritt in Akt 2 wieder zu. Siehe Offene Frage 1.

### Ist-Stand im Code (verifiziert 2026-10-31)

- **Kein Akt-Übergang im Code.** `CampaignState` hat **kein** Feld `act` (`src/core/state.ts` ~Z. 250–310). Der Akt kommt überall aus `data.campaign.act`, also aus der einzigen geladenen `campaign.yaml`.
- **`buildContent`** (`src/content/load.ts`) lädt hart:
  - `acts/act1/units.yaml` (Z. 239), `acts/act1/flags.yaml` (Z. 247) und `acts/act1/campaign.yaml` (Z. 248);
  - Karten, Szenen, Supports, Leutnants, Haunts, Chronik und Gedenksteine dagegen schon je Akt-Ordner per Regex (`parsePackFiles` Z. 152–205). `maps[].act` kommt aus dem Ordner und wählt die Jahreszeit des Bretts.
  - `mergePackContent` (Z. 212) fügt Pakete zur Laufzeit hinzu, aber nur diese Pack-Teile, nicht Kampagne, Gefährten oder Flags.
- **`data.campaign`** hat rund 60 Lesestellen:
  - Kern (`graph.ts`, `conditions.ts`, `campaign.ts`, `haunts.ts`, `aid.ts`, `chronicle.ts`, `camp.ts`, `apply.ts`, `progression.ts`, `battle/setup.ts`, `battle/hauntBattle.ts`);
  - App (`WorldMap.tsx`, `Camp.tsx`, `Prep.tsx`, `BackupSheet.tsx`, `campaignInfo.ts`, `state/flow.ts`, `state/packs.ts`);
  - Content (`validate.ts`, `ids.ts`);
  - Tools (`simulate.ts`, `simCampaign.ts`).

  Liste per `grep -rn "data\.campaign" src tools`.
- **Story 7.3:** `actFinished(data, c)` (`graph.ts:19`) und `hasPackForAct` (`src/packs/plan.ts:76`); `nextActInBuild()` (`state/packs.ts:149`) steuert den Stein „erscheint bald“. `markBackupReminded` prüft `cmd.act === data.campaign.act && actFinished` (`apply.ts:158`).
- **`normalizeCampaign`** (`campaign.ts:66–113`) ist der Ort für neue Felder mit Standardwert (§8.7, Beispiel `backupReminded`); Format 2 bleibt dabei.
- **`metaFromCampaign`** (`save.ts:170–181`) gibt fest `act: 1` zurück.
- **`migrations`** (`save.ts:83`) ist leer. `tests/unit/migrations.test.ts` verlangt eine Fixture je Migration; ohne Formatwechsel braucht es keine Migration, aber den Ladetest aus AC 4.
- **Heimsuchungen:**
  - `hauntGold(data)` (`haunts.ts:126`) bildet den Mittelwert der Story-Karten des Akts; ohne Knoten ergibt das 0.
  - `hauntLevel` (Z. 25) fällt ohne Knoten auf 1.
  - Leutnant-Heimsuchungen brauchen `data.hauntPools[lt.act].factions[lt.faction]` (Z. 102).
- **Graph:** `availableNodes`/`storyCount`/`lockedMechanics` (`graph.ts`) zählen nur Knoten aus `data.campaign.nodes`. `storyCount` ist damit heute schon „je Akt“, ein zweiter Akt fehlt nur.
- **Händler:** `currentTier` (`campaign.ts:485–497`) ist das Maximum aus dem `merchantTier` erledigter Knoten und den `merchant[].storyCount`-Stufen. Erledigte Knoten werden über `data.campaign.nodes` gesucht; Akt-1-Knoten zählen nach der Umstellung also nicht in Akt 2. Das ist gewollt: Akt 2 beginnt bei seiner eigenen Stufe 0, die über Akt 1 Stufe 2 liegt.
- **Weltkarte:**
  - `content/world/valmora.yaml` hat die Regionen `borderland`/`eisenmark`/`aurenhall` (act 1/2/3), den Nebel `fog` mit act 2 bei `y: 62.5` und act 3 bei `y: 31`, die Orte `m2_1…m2_8` und `n4…n6` ohne `node`.
  - `fogTop` steht in `src/app/screens/worldMapView.ts:60`. `WorldMap.tsx` zeigt nur Orte mit offenem oder erledigtem Knoten (`shown`), Orte ohne `node` gar nicht.
  - Den Hinweis „Weitere Missionen folgen“ gibt es schon (`moreMissionsFollow`, `ui.map.moreMissions`). `act.2.name` existiert, `act.2.season` fehlt.
- **Pakete:**
  - `packs.yaml`: Eine Datei gehört zum **ersten** Paket, dessen Glob passt; die Globs kennen nur `**`, `*` und `?` (`src/content/packs.ts:57`).
  - `act1` beansprucht `models/**`, `locations/**`, `busts/**`, `halves/**`, `items/**`, `world/**`. Ohne eigene, frühere Einträge landen Akt-2-Bilder deshalb in `act1`.
  - Requisiten ohne Paket gehören zu `core` (Vorab-Cache der ersten Mission). `autumn_a/b` stehen nirgends, liegen also im ersten Download.
  - `duePacks` (`plan.ts:66`) lädt Hintergrundpakete mit `act ≤ reachedAct`; `reachedAct` liest heute `data.campaign.act`.
- **`tools/build/first-mission.mjs:17`** (`ACT = 'acts/act1'`) ist richtig so: Die erste Mission des Spiels liegt immer in Akt 1. Nicht ändern.
- **Klassen** (`content/core/classes.yaml`):
  - Abschnitt „Gegnertypen“ ab Z. 347: `brigand`, `wolf_rider`, `knight` (Z. 387, armored, mov 4, Lanze, `heavy_armor`, tags `[armored]`), `pegasus_knight` (Z. 405, flier, mov 7, Lanze, tags `[flier]`, kein Skill), `drake_young`, `civilian`.
  - Es gibt keinen Wyvernreiter. `moveType: mounted` nutzt niemand.
  - `art:` nennt das Porträt `class_<art>.png` (Standard: Klassen-Id). Für `knight`/`pegasus_knight` gibt es keine Porträts, vorhanden sind `class_soldier`, `class_fighter`, `class_mercenary`, `class_wolf_rider` usw.
- **Balliste:** `type: 'ballista'` (und `lever`) steht nur im Kartenschema (`schemas.ts:382`) und in den Typen (`defs.ts:359`, `state.ts:126`). Es gibt keine Regel, keine Aktion (`battle/commands.ts:3–26`, `Action`) und keine KI-Unterstützung.
- **Items:** Es gibt kein `tier`-Feld; „Eisen/Stahl“ ist eine Namenskonvention plus `lieutenant.scaling.tierUp` (`balance.yaml` ~Z. 240, nur Eisen → Stahl für Schwert/Lanze/Axt/Bogen). `materialByAct: { 1: iron_ore }`. `moonsteel` existiert (`items.yaml:124`). Vorhandene Stahlteile: `steel_sword`, `steel_lance`, `steel_axe`, `steel_bow`, `mend_staff`, `tower_shield`, `hammer`, `longbow`.
- **Leutnant-Schema** (`schemas.ts:551`): `id`, `nameKey`, `portrait`, `model`, `class`, `faction`, `signatureItem`, `grudgeSkills[3]`, `titleKey`, `scene`, `joins?`. Die Szene hat die Zeilen-Ids `first`, `grudge_1..3`, `flee_1..3`, `mock`, bei Seitenwechslern `join` (Vorbild `content/acts/act1/scenes/scn.lt.grosk.yaml`). Titel und Namen stehen in `content/core/locales/{de,en}.names.yaml` (`lt.<id>.title`, `unit.<id>.name`).
- **Herbst:** schon vorhanden
  - `render.yaml` `look.season.2` (Tönung `#f0a870`);
  - `variants.tree.2` (`autumn_a/b/c`, Modelle in `art/models/props/`);
  - Wetter mit `acts: [1, 2]` für Nebel/Regen;
  - `map.act` aus dem Ordner.

  Es fehlt der Herbst-**Boden**: `tools/art/ground.py` erzeugt eine Gras-/Erde-Palette für alle Akte; Art Direction §2.4 nennt braunes Gras, Heide und Rotlaub. Berg-Hauben „je Akt“ stehen in der Art Direction Z. 133 (prüfen, ob `mountain` sie schon je Akt hat).
- **Simulation:** `tools/simulate.ts:22`: `--campaign` nimmt standardmäßig `act${data.campaign.act}` und spielt nur diese eine Kampagne. `simCampaign.ts` startet jeden Lauf mit `newCampaign` und läuft über `data.campaign.nodes`. `pnpm sim <map>` sucht den Knoten in `data.campaign.nodes` (Z. 28) und bricht ohne Knoten ab.
- **Vorhandene Assets für Akt 2:**
  - Brettfiguren `art/models/units/{brakka,grell,sable,rowena,jory,odile,nell,brann,amos,ilka}.glb/.vat` und `soldier`;
  - Porträts (nur neutral) in `art/mockups/characters-s1/`;
  - Ortsbilder `grauwacht`, `brandhang`, `salzpass`, `kronfeld` in `art/mockups/locations-s1/`.

  Rowena und Brakka sind **zu Fuß ohne Reittier** modelliert (`art/prompts/rowena_board_turnaround.md:17`, `brakka_…:17`: „Reittiere laut art-direction §4.6 Schritt 6 offen“). Für generische Akt-2-Gegner fehlen Modelle (Eisenmark-Soldat, Ritter, Pegasusritter, Wyvern). PNGs liegen in Git LFS: vor dem Ansehen `git lfs pull`.

### Technische Leitplanken

- **Übergang als Kern-Regel, nicht im App-Code.** `finishMission` entscheidet über `act + 1`, damit Replays und Simulation dasselbe tun. Die Prüfung „nächster Akt vorhanden“ ist `!!data.acts[c.act + 1]`.
  - Im Browser gilt das genau dann, wenn das Paket veröffentlicht ist (Build-Regel AC 8). Die App-Funktion `hasPackForAct` bleibt für die Anzeige.
  - Node-Loader (`content:check`, Sim, Tests) sehen alle Akte. Ein Test mit einem `data` ohne Akt 2 deckt den „erscheint bald“-Weg ab.
- **Warum `c.act` speichern statt ableiten?** Architektur §5.4 verlangt `act + 1` und `actReached`; Chronik, `priceMods` und `villageAid` sind schon nach Akt verschlüsselt. Die Ableitung lebt nur im Nachholen in `normalizeCampaign` (AC 4), dadurch kommen alte Stände ohne Migration mit.
- **Event `actReached { act }`:** Die Weltkarte kann es für einen kurzen Akt-Wechsel nutzen (z. B. das Akt-Band hervorheben). Ein eigener Akt-Titel-Moment gehört nicht zu dieser Story (Offene Frage 6).
- **Keine Akt-2-Story-Knoten in 11-1 (AC 12), Begründung:**
  1. `act2` wird sofort veröffentlicht (Entscheidung 1). Ein Platzhalter-Knoten `m2_1` wäre auf `main` spielbar. Story-Knoten sind nach dem Abschluss nicht wiederholbar (§5.4), ein Spieler hätte die echte 2-1 dann verbraucht.
  2. Eine Platzhalter-Karte wäre Wegwerfarbeit, die 11-2 sofort ersetzt.
  3. Der vorhandene Hinweis „Weitere Missionen folgen“ deckt genau diesen Zustand ab.

  Die Kriterien des Epics („die Weltkarte zeigt die Knoten von Akt 2“) erfüllen damit 11-1 (Nebel, Region) und 11-2 bis 11-9 (je ein Knoten) zusammen. Testkarte und Simulation laufen über die Fixture `dev_eisenmark` und `--map-file`.
- **Formelcode:** Die Balliste ruft `forecast`/`resolveAttack` (`src/core/rules/combat.ts:238/375`) mit einer synthetischen Waffen-Instanz (`def: ballista_bolt`, Uid z. B. `ballista:<objectId>`) und dem Ballistenfeld als Schussposition. Eine Kopie der Formel ist verboten (AGENTS.md). Fehlende Parameter (Waffengruppe ignorieren, kein Gegenangriff) kommen als Option (`AttackMods`) dazu, nicht als zweiter Rechenweg.
- **Zufall:** nur aus dem Seed-RNG im State. Die Balliste würfelt wie ein Angriff, sonst gibt es keine Zufallsquelle.
- **Content statt Code:** Alle Werte (Reichweite, Mt, Stufen, Händler, Pools) stehen in YAML. Reichweite und Mt der Balliste sind Felder des Items `ballista_bolt` (`rng: [3,10]`, `mt: 12`), nicht im Code.
- **Kein sichtbarer Text im Code:** Aktion „Balliste“, Klassen- und Einheitennamen, Titel, `act.2.season` stehen als Schlüssel in `de.yaml`/`en.yaml` bzw. `*.names.yaml`.
- **App-Zustand:** neue App-Logik in die passenden Module unter `src/app/state/` (`packs`, `flow`, `session`), keine Sammel-Datei, keine Import-Zyklen.

### Vorschläge für Werte und Inhalte [C] (Startwerte, per Sim zu prüfen)

**Händler Akt 2** (`acts/act2/campaign.yaml` `merchant`):
- Stufe 0: `vulnerary`, `remedy_salve`, `door_key`, `steel_sword`, `steel_lance`, `steel_axe`, `steel_bow`, `steel_dagger`, `javelin`, `hand_axe`, `travel_lute`, `mend_staff`, `chainmail`, `iron_helm`, `iron_shield`, `ember`, `gust`, `surge`, `rockfall`, `shine`, `fire_bomb`.
- Stufe 1 (über `merchantTier` der Knoten): `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `armorpiercer`, `hammer`, `longbow`, `round_shield`, `steel_helm`, `scale_mail`, `physic_staff`, `crystal_focus`.
- Stufe 2 (`storyCount: 4`): `stiletto`, `shadow`, `tower_shield`, seltene Stücke.

Händler-Stufe 3 (Angebot des Tages, Glutfunke rotierend, GDD §Händler) hängt am Glutfunken, den Epic 10 einführt: nicht hier.

**Ableitungsregel Stahl aus Eisen** (aus dem Paar `iron_sword` → `steel_sword`: Mt 5 → 8, Hit 90 → 75, Gew. 5 → 10, Preis 400 → 900):
- Waffen: Mt +3, Hit −10 bis −15, Gewicht ×1,5–2, Preis ≈ 900–1 000.
  - Beispiel `steel_dagger`: Mt 7, Hit 75, Krit 10, Gew. 6, 900.
  - `armorpiercer`: Werte des Stahldolchs −1 Mt, `effectiveVs: [armored]`, 1 100.
  - `stiletto`: Mt 5, Hit 80, Krit 25, 1 200.
- Zauber nach ihrem Eisen-Pendant (`ember` → `blaze`), Element und Zustandswirkung wie dort.
- `physic_staff`: Reichweite `[1,3]`, Heilung wie `heal_staff`.
- Rüstung: Verteidigung +1–2 gegenüber dem Eisen-Pendant.
  - `round_shield`: VER +2, `avoidBonus` +10, leicht.
  - `steel_helm`: VER 3.
  - `scale_mail`: mittel, VER 6.
  - `crystal_focus`: Nebenhand, RES +3.

**Signaturen** (items.md §6.3, Muster Akt 1: Werte der Gruppenwaffe + ein Effekt, `rarity: legendary`; Basis hier die Stahlwaffe, Preis 1 500):
- `wing_lance` (Rowena): `steel_lance` + `grantsSkill` ihres Groll-Skills 3 (`masteryCost: 40`).
- `dravns_oath` (Sable): `steel_sword` + `grantsSkill` „letzter Befehl“.
- `gold_hook` (Grell): `steel_sword` mit Krit 20.
- `wyvern_cleaver` (Brakka): `steel_axe` + `effectiveVs: [armored]`.

**`ballista_bolt`:** `kind: weapon`, `group: siege` (außerhalb des Dreiecks), `damageType: physical`, `mt: 12`, `hit: 70`, `crit: 0`, `rng: [3,10]`, `wt: 0`, `tags: [convoyOnly]` (nie im Tross, nie beim Händler; gegebenenfalls ein eigener Tag `fixed`). Schaden = Mt 12 + STR des Bedieners nach der normalen physischen Formel. Keine Effektivität gegen Flieger (Offene Frage 3).

**`wyvern_rider`:**
- `base { hp: 22, str: 7, mag: 0, skl: 4, spd: 4, lck: 1, def: 7, res: 0 }`
- `growth { hp: 85, str: 50, mag: 0, skl: 30, spd: 30, lck: 15, def: 35, res: 5 }`
- `growthMod { hp: 15, str: 10, mag: 0, skl: 0, spd: -5, lck: -5, def: 10, res: -5 }`
- `caps { hp: 60, str: 27, mag: 8, skl: 22, spd: 20, lck: 20, def: 26, res: 12 }`
- `mov: 6`, `weaponGroups: [axe]`, `tags: [flier]`, `role: wyvern_rider`, `tier: base`, `roleGroup: melee`, `art: fighter` (Platzhalter).

**Eisenmark-Truppen und Pools** (`acts/act2/haunts.yaml`, `share` in %):
- `iron_march` (Sable, Dravns Heer): `vanguard` mit `steel_lance` 30, `knight` mit `steel_lance` 20, `marksman` mit `steel_bow` 25, `skirmisher` mit `steel_sword` 25. Namen: `unit.iron_soldier.name`, `unit.iron_knight.name`.
- `silver_lance` (Rowena, Garde der Prinzessin): `knight` 30, `pegasus_knight` 30, `skirmisher` 20, `marksman` 20.
- `silver_sea` (Grell, Kaperfahrer der Herzogin): `brigand` mit `steel_axe` 35, `skirmisher` mit `steel_sword` 35, `marksman` 30. Name: `unit.privateer.name`.
- `free_blades` (Brakka, Söldner): `skirmisher` 30, `brigand` 30, `marksman` 20, `wyvern_rider` 20.

**Leutnants:**

| Id | Klasse | Fraktion | Signatur | Groll 1 / 2 / 3 (nur vorhandene Effekt-Formen) | Erkennungsformel |
|---|---|---|---|---|---|
| `rowena` | `pegasus_knight` | `silver_lance` | `wing_lance` | `dive` (Angreifer: +3 Schaden) / `silver_resolve` (passiv Treffer +15) / `wing_retreat` (nach der Aktion +2 Bewegung) | „Für Aldric und die Silberne Lanze!“ |
| `sable` | `skirmisher` (Rundschild) | `iron_march` | `dravns_oath` | `oath_guard` (nicht bewegt: VER/RES +3) / `last_order` (unter 50 % TP: zuerst zuschlagen) / `iron_discipline` (Aura Radius 1: Verbündete Treffer +10) | „Befehl ist Befehl.“ |
| `grell` | `skirmisher` | `silver_sea` | `gold_hook` | `boarding_party` (2 Verbündete am Ziel: Treffer +10, Schaden +2) / `dirty_hook` (Angriff: Krit +10) / `sea_legs` (Rundenbeginn: 10 % Heilung) | „Alles hat seinen Preis.“ |
| `brakka` | `wyvern_rider` | `free_blades` | `wyvern_cleaver` | `wyvern_dive` (Angreifer: +4 Schaden) / `scale_hide` (unter 50 % TP: VER +3) / `over_the_lines` (durch Gegner ziehen) | „Wer mehr zahlt, hat recht.“ |

- **Titel (DE):** Rowena „Ritterin der Silbernen Lanze“; Sable „Hauptfrau des Herzogs Dravn“ (Rang Dravns laut Narrative prüfen); Grell „Kaperkapitän des Hauses Silbermeer“; Brakka „Wyvernreiterin der Meistbietenden“.
- **Sable:** Die Szene hat eine Zeile `join` (Seitenwechsel), Text noch ohne Bezug auf das E7-Ergebnis. Den Bezug schreibt Story 11-6.
- **Zeilen:** werden beim Umsetzen geschrieben (Pipeline Narrative Z. 832–838: Deutsch, Humanizer-Durchgang, `content:check`, dann Englisch). Namen sind in beiden Sprachen gleich, deutsche Anführungszeichen bleiben.

### Tests (Mindestumfang)

- `tests/unit/act-transition.test.ts`:
  - Finale gewonnen und Akt 2 vorhanden → `c.act = 2` und Event `actReached`;
  - ohne Akt 2 → `act` bleibt, kein Event;
  - Replay identisch;
  - Nebenquests von Akt 1 bleiben in Akt 2 offen;
  - `storyCount`, `levelCap`, Händler und `lockedMechanics` gelten je Akt.
- `tests/unit/migrations.test.ts` bzw. ein eigener Ladetest: Fixture `format2-act1-finale-done.json` → `act: 2`, sonst unverändert; Stand ohne Finale → `act: 1`; `metaFromCampaign().act`.
- `tests/unit/ballista.test.ts`:
  - Nachbarschaft, Flieger dürfen nicht bedienen, Reichweite 2/3/10/11;
  - Nebel, kein Gegenangriff;
  - `forecast` = `resolveAttack` (gleiche Zahlen), Leutnant `flees`;
  - KI wählt den Schuss, Replay.
- `tests/unit/packs*.test.ts`: `acts/actN/**` fehlt im Build, wenn `actN` nicht veröffentlicht ist; Akt-2-Assets liegen im Paket `act2`.
- Content: `content:check` grün mit Akt 2 (Leutnants, Skills, Szenen ≤ 110 Zeichen, Schlüssel DE/EN, eindeutige Ids über Akte).
- Haunts: `hauntGold`/`hauntLevel` mit leerem Akt 2.
- Coverage: `pnpm test:coverage`, `src/core` nicht unter dem bisherigen Wert.

### Aufteilungsvorschlag (nicht umnummeriert)

Die Story ist groß: ein Kern-Refactor über rund 60 Lesestellen, dazu Content in sechs Dateien und eine neue Kampfregel. Vorschlag:

- **11-1a „Akt-Übergang und Paket von Akt 2“** (Teil A, T1–T10, AC 1–15, 25). Liefert früh, was Epic 10 braucht: die Bedingung `act`, die Gefährten-Ids und den Übergang. Ist risikoreich wegen der Konflikte mit Epic 10, deshalb klein und schnell mergen.
- **11-1b „Gegner, Balliste, Leutnants und Herbst von Akt 2“** (Teil B, T11–T18, AC 16–24, 26). Baut auf 11-1a auf und ist Voraussetzung für 11-2.

AC 27 (Prüfungen) gilt für beide.

### Project Structure Notes

- **Neu:**
  - `content/acts/act2/{campaign,units,flags,lieutenants,haunts}.yaml`, `content/acts/act2/scenes/scn.lt.{brakka,grell,sable,rowena}.yaml`;
  - `content/locales/en/act2.dialogue.yaml`;
  - `tests/fixtures/maps/dev_eisenmark.yaml`, `tests/fixtures/saves/format2-act1-finale-done.json`;
  - `tests/unit/{act-transition,ballista}.test.ts`;
  - `art/prompts/<gegner>_board_turnaround.md` je fehlender Figur.
- **Geändert (Content):**
  - `content/packs.yaml`;
  - `content/core/{items,classes,skills,balance}.yaml` (je eigener Block bzw. nur Akt-Schlüssel);
  - `content/core/render.yaml` (Herbst-Boden, falls dort konfiguriert);
  - `content/core/locales/{de,en}.yaml` und `{de,en}.names.yaml`.
- **Geändert (Code):** `src/content/{load,validate,validateLieutenants,ids,schemas}.ts`, `src/core/{defs,state}.ts`, `src/core/campaign/*`, `src/core/rules/{combat,progression}.ts`, `src/core/battle/{commands,actions,apply,contextBand,setup,hauntBattle}.ts`, `src/core/ai/ai.ts`, `src/persistence/save.ts`, `src/app/screens/{WorldMap,Camp,BackupSheet,Prep}.tsx`, `src/app/campaignInfo.ts`, `src/app/state/{flow,packs}.ts`, `tools/{simulate,simCampaign}.ts`, `tools/build/packs-plugin.ts`, `tools/art/ground.py`.
- **Nicht ändern:** `tools/build/first-mission.mjs` (bleibt Akt 1), `concept/01-decisions.md` (eingefroren), `content/released-ids.json` (nicht anlegen).

### Project Context Rules (AGENTS.md)

- **Prüfungen:** Fertig erst mit grünem `pnpm lint` (inkl. Typecheck), `pnpm test`, `pnpm content:check` und `pnpm build` (Bundle-Budget). Balancing mit `pnpm sim … --runs 50`.
- **`src/core`:**
  - Commands/Events, Plain-JSON-State; Babylon, Preact, DOM, `Math.random` und `Date.now` sind gesperrt.
  - Zufall nur aus dem Seed-RNG; Replays identisch.
  - Coverage Richtung 90 % heben, nie senken.
- **Content:**
  - Spielwerte nur in YAML (`balance.yaml`, Content-YAML mit Zod-Schema). Kein sichtbarer Text im Code.
  - Kampfvorschau = Formelcode der Auflösung.
  - Code, Bezeichner, Commits und Datenschlüssel auf Englisch, Konzeptdokumente auf Deutsch.
- **App:** Zustand in `src/app/state/` je Verantwortung, keine Barrel-Re-Exporte, keine Zyklen. Styles je Screen in eigener CSS-Datei; `styles.css` schrumpft nur.
- **Neue Entscheidungen:** ins zuständige `concept/<artefakt>/decision-log.md`, nie in `01-decisions.md`.
- **Offene Punkte O1–O5:** nicht stillschweigend entscheiden; diese Story berührt keinen davon.
- **Assets:** KI-Assets nach `concept/23-art-direction/licensing.md` §6; Brettfiguren per Tripo (§4.6), Prompt und Abnahme in `art/prompts/<id>.md`. PNGs in Git LFS (`git lfs pull`). In einem frischen Worktree bei „Cannot find package“ zuerst `pnpm install --frozen-lockfile`.
- **Akt-Release-Ablauf** (AGENTS.md): Hier gilt nur Schritt 1 (`released: true`). Schritt 2 (`content:lock`) und die ID-Sperre kommen bewusst erst mit dem echten Release (Entscheidung 1).

### Vorwissen aus Epic 9 und Story 7.3

- Korridore gelten für die **verkettete** Kampagne. `--fresh` liegt oft darunter, zum Beispiel wegen der Hütten-Heuristik des Autoplays (9-6). Abweichungen im Dev Agent Record begründen.
- Gefährtenzeilen in Szenen stehen unter `requires: alive`, weil `canSpeak` auch nie beigetretene Gefährten zulässt (9-6). Das gilt auch für die Leutnant-Szenen, falls Gefährten mitsprechen.
- Neue persistierte Felder bekommen ihren Standard in `normalizeCampaign` statt einer Migration (7.3 `backupReminded`, Format 2 bleibt).
- Die Simulationen rufen `finishBattle` direkt und wenden Knoten-Wirkungen selbst an (`applyNodeRewards`). Der Akt-Übergang muss dort genauso nachgezogen werden, sonst verkettet die Sim nicht (`simCampaign.ts:104`).
- Letzte Commits auf `main`: Handbuch (Epic 14, `948a164`) und schlankere Kampfhilfen (`f603bb3`). Das Handbuch nennt Klassen-Steckbriefe (`14-5`): Für `wyvern_rider` und die Balliste braucht es dort vielleicht einen Eintrag. Prüfen, ob `content:check` (`validateHandbook`) jede Gegnerklasse verlangt.

### Web-Recherche

Nicht nötig: keine neuen Bibliotheken. Babylon.js, Preact, Vite und Zod bleiben auf den Versionen aus `package.json`.

### References

- [Source: concept/26-epics/epics.md#Epic 11 (Z. 1815–1925), Story 11.1; Story 7.3 (Z. 1341); Story 2.9 (Z. 717)]
- [Source: concept/22-narrative/narrative.md Z. 81–85 (Beats 8–12), 223–246 (Gefährten, Leutnant-Lager), 362–364, 384–389 (Orte), 394–472 (Dialogue Framework, Erkennungsformel Z. 423, Zeilenpensum Z. 449), 675–705 (Missionsfolge Akt 2), 716–740 (E4–E8, N4–N6)]
- [Source: concept/21-gdd/gdd.md Z. 107 (Effektivität ×3), 115–131 (Leutnants), 151/179 (Gegnerklassen), 166–175 (Gelände Flieger), 207 (Balliste 3–10, Mt 12), 209 (Jahreszeit), 213–250 (Kampagnenstruktur, Stufendeckel 20, erwartete Stufe 11 → 20), 266 (Tier Stahl), 281 (Regionen im Nebel), 316 (Händler), 337–340 (Gold Akt 2 2 000–3 000, Mondstahl), 421 (keine Reiterklassen für Spieler)]
- [Source: concept/21-gdd/items.md §6.1 (Z. 84–99), §6.3 (Z. 124–140), §6.6 (Z. 160–161)]
- [Source: concept/24-architecture/architecture.md §5.3 (Z. 158–195), §5.4 (Z. 200–227), §5.5 (Z. 229–236), §5.14 (Z. 402–417), §5.15]
- [Source: concept/23-art-direction/art-direction.md Z. 36, 80 (Herbst-Palette), 133, 174, 226 (Reittiere offen), 300]
- [Source: content/packs.yaml; content/acts/act1/{campaign,lieutenants,haunts,units}.yaml; content/core/{classes,items,skills,balance,render}.yaml; content/world/valmora.yaml]
- [Source: _bmad-output/implementation-artifacts/9-6-mission-1-5-das-hungerlager-und-entscheidung-e3.md, 9-1-prolog-die-paktnacht.md, 7-3-ende-eines-veroeffentlichten-akts.md]

## Offene Fragen an den Produktinhaber

1. **`storyCount` der Räume beim Aktwechsel.** Schmied, Heiler und Taverne (`min: 3`) und das Lagerfeuer (`min: 4`) in `rooms.yaml` würden in Akt 2 bis zur 3. bzw. 4. Akt-2-Mission wieder schließen, denn `storyCount` zählt je Akt. Das ist nötig für den Graphen und für Beat 10.
   - **Empfehlung:** Die Bedingung `storyCount` bleibt je Akt. Die vier Räume bekommen in `rooms.yaml` `any: [{ act: 2 }, { storyCount: { min: 3 } }]`; das ist eine kleine Zeilenänderung, abgestimmt mit der Epic-10-Session.
   - Alternative: Feld `storyCount: { min, total: true }` für „über alle Akte“.
2. **Reittiere von Rowena und Brakka.** Regeln: Flieger (Bewegung, Bogen-Effektivität). Optik: zu Fuß, weil Reittiere in Art Direction §4.6 Schritt 6 offen sind. Gilt das für Akt 2?
   - **Empfehlung:** Akt 2 startet mit Fliegern zu Fuß plus Flieger-Kennung (leichter Schwebe-Versatz und Schatten, Wappen-Symbol in der Gegner-Leiste). Pegasus- und Wyvern-Modelle (großer Rahmen, `figureBudget.large`) sind ein eigener Art-Task vor 11-5 („Der Wyvernhorst“).
3. **Balliste gegen Flieger.** Bögen sind gegen Flieger ×3 effektiv. Eine Balliste mit Mt 12 und ×3 würde Pegasusritter (auch Rowena in 2-4) mit einem Schuss vom Himmel holen.
   - **Empfehlung:** keine Effektivität. Mt 12 + STR des Bedieners, Treffer 70, kein Gegenangriff, unbegrenzte Munition, ein Schuss je Bediener und Zug.
4. **Wer darf eine Balliste bedienen?** Die GDD sagt nur „interaktives Objekt“.
   - **Empfehlung:** jede Figur zu Fuß oder in Rüstung, unabhängig von der Waffengruppe; Flieger nicht. Die KI nutzt sie nur mit dem Profil `hold`/`guard` oder wenn eine Figur schon daneben steht, damit nicht alle Gegner zur Balliste laufen.
5. **Wyvernreiter als eigene Gegnerklasse.** GDD Z. 179 und Epic 11.1 nennen für Akt 2 nur „Eisenmark-Truppen, Ritter, Pegasusritter, Ballisten“; Brakka (Wyvernreiterin) und 2-4 „Der Wyvernhorst“ setzen Wyvern aber voraus.
   - **Empfehlung:** `wyvern_rider` als Gegnerklasse aufnehmen, für Brakka und in kleiner Zahl für ihre Söldner und den Wyvernhorst.
   - Die GDD-Zeile ergänzen: „rund 10 Gegnertypen“ bleibt. Eintrag ins GDD-Log beim Umsetzen.
6. **Akt-Wechsel-Moment.** Narrative und Epic sehen keine eigene Übergangsszene vor. Akt 2 beginnt mit 2-1, die Tafel „Drei Angebote“ kommt danach.
   - **Empfehlung:** In 11-1 nur der Nebel, das Akt-Band „Akt 2 · Herbst – Glut“ und das Event `actReached`. Ob nach dem Akt-1-Finale eine kurze Akt-Titeltafel kommt (Illustrationstafel Akt 2), entscheidet 11-2 zusammen mit dem Intro von 2-1.
7. **Jahreszeit von Heimsuchungen.** In Akt 2 laufen Heimsuchungen weiter auf Akt-1-Karten und sehen dann nach Spätsommer aus, weil `map.act` aus dem Ordner kommt.
   - **Empfehlung:** Für Heimsuchungen wählt das Brett die Jahreszeit des laufenden Akts (`c.act`) statt der Karte. Kleine Änderung in `hauntBattle`/Brett, in 11-1b mitnehmen.
8. **Werte, die nirgends stehen** (Entscheidung 3 deckt sie, zur Kenntnis):
   - Stats der Akt-2-Signaturen und der fehlenden Stahl-Teile (items.md: „Zahlen folgen beim Balancing“);
   - Groll-Fähigkeiten und Erkennungsformeln der vier Akt-2-Leutnants (Narrative Z. 246: „folgen“);
   - Beitrittsstufen und Werte der sieben Akt-2-Gefährten.

   **Empfehlung:** die Vorschläge oben als [C] übernehmen und per Sim und Screenshot abnehmen.
9. **Widerspruch Epics GDD vs. Epics-Datei.** `concept/21-gdd/epics.md:97–100` nennt für Akt 2 „7 Story-Missionen … 2 Nebenquests“, GDD Z. 213–223 und Narrative nennen 8 Story-Missionen und 3 Nebenquests (N4–N6), `concept/26-epics/epics.md` hat 2-1 bis 2-8 und N4–N6.
   - **Empfehlung:** GDD/Narrative gelten (8 + 3); `21-gdd/epics.md` beim nächsten GDD-Durchgang nachziehen.
10. **Gold von E8 und Händler −10 % (E4/E7) sind im Narrative als `[ASSUMPTION]` markiert.**
    - **Empfehlung:** unverändert übernehmen, endgültig in 11-13. Für 11-1 ohne Folgen; `priceMod` mit `act: 2` greift erst durch `c.act`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Mit gds-create-story erstellt: vollständige Kontextanalyse, Entwickler-Leitfaden angelegt (2026-10-31).

### File List
