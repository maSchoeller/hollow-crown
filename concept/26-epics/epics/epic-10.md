## Epic 10: Die Burg ausbauen (ab Akt 2)

Spieler bauen die eroberte Paktwacht ab Akt 2 auf 11 Räume in drei Stufen aus, lassen ausgewählte Gefährten per Glutfunke auf einen von zwei Profi-Wegen aufsteigen und geben das Erbe der Gefallenen als Lektion weiter. Quellen: GDD „Rollenklassen“, „Heimat: Lager und Burg“, „Wirtschaft und Ressourcen“ und „Fortschritt“ (`concept/21-gdd/gdd.md`), `concept/25-ux/EXPERIENCE.md`, `DESIGN.md`, Mockups 04, 06 und 08, Architektur §5.3, §5.7, §5.10, §5.11, §8.1, §8.5, §8.7, die Entscheidungen des Produktinhabers vom 2026-10-31 (Verfeinerung Epic 10/11) und die Code-Bestandsaufnahme der Session epic10-castle (`_bmad-output/planning-artifacts/handoff-epic10.md`). Epic 10 hängt an Epic 11: Story 11.1 liefert den Akt-Übergang mit `c.act`, den Stufendeckel `levelCap: 20` für Akt 2 und die festen Ids der Akt-2-Gefährten, Story 11.5 die Akt-2-Quelle von `moonsteel` (`lieutenant.bounty.materialByAct`; das Item existiert schon) und den Inhalt der Händler-Liste mit `roomLevel: 2`, die Missions-Stories von Epic 11 die Akt-2-Gefährten `jory`, `odile`, `nell`, `brann`, `amos`, `ilka` (Raum-Gefährten für Stufe 3). Story 11.1 kommt vor allen Epic-10-Stories (Epic 10 hängt damit an einem Teil von Epic 11, benannt und entkoppelt); was spätere Epic-11-Stories liefern (Raum-Gefährten, Nebel-Karten, Händler-Liste), prüfen die Stories mit Fixture-Spielständen (`c.act = 2`, `c.home.kind = 'castle'`, gesetzte Raumstufen); die Burg oben bleibt bis Story 10.14 das gemalte Bild `paktwacht_ruine`.

**Reihenfolge:** nach Story 11.1: 10.2 → 10.3 → 10.4 (parallel zu 11.2–11.7) → 10.1 → 10.5 → 10.6 → 10.7 → 10.8 → 10.9 → 10.10 → 10.11 → 10.12. Akademie und Profi-Wege kommen zuerst, weil die Abstimmung von Akt 2 (Story 11.22) mit Aufstiegen simuliert; 10.2 bringt deshalb den Raum `academy` selbst mit, 10.1 ergänzt danach Kosten und Bedingungen aller Räume. 10.13 (Anhängeteile) geht jederzeit nach 10.3, 10.14 (Burg-Grafik) erst nach der 3D-Entscheidung des Produktinhabers. Story 11.22 (Abstimmung Akt 2) wartet auf 10.1–10.12, weil diese Stories Gold, EP, Glutfunken und Rabatte von Akt 2 verändern.

**Für alle Stories gilt:** Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build`. Jede Handlung ist ein Kampagnen- oder Kampf-Command im Journal, das beim Replay dasselbe Ergebnis liefert; UI und Command rufen dieselbe reine Vorschau-/Kostenfunktion (Architektur §8.1). Spielwerte stehen in YAML (Raumkosten und -bedingungen in `content/core/rooms.yaml`, Stufenwirkungen als Stufen-Arrays in `content/core/balance.yaml`), kein `if (act >= 2)` im Code, kein sichtbarer Text im Code, Beträge immer als Symbol + Zahl. Neue persistierte Felder bekommen einen Default in `normalizeCampaign` (Architektur §8.7). Akt 1 ist veröffentlicht (Story 9.14 mit `pnpm content:lock`): Entfernte oder umbenannte IDs brauchen einen Eintrag `alt: neu` in `content/renames.yaml`, eine geänderte gesperrte ID oder ein geändertes Speicherformat eine Migration in `src/persistence/save.ts` (`migrations`, `renamedId`) mit Fixture-Spielstand aus dem Akt-1-Release (`AGENTS.md`, „Akt-Release“ Schritt 3). Raum-Ausbau: Stufe 2 kostet nur Gold (ab Akt 2), erst Stufe 3 braucht zusätzlich einen der zwei Raum-Gefährten (Produktinhaber 2026-10-31, Readiness-Runde R2). Commands prüfen in der Reihenfolge, in der die Story ihre Fehlercodes aufzählt, und liefern den ersten zutreffenden (Architektur §8.1: Id → Verfügbarkeit → Ressourcen). Sichtbare Änderungen werden mit Screenshots bei 375 × 812 belegt. Neue Entscheidungen gehen in die Decision-Logs unter `concept/`. Werte mit `[ASSUMPTION]` sind abgeleitet und werden per `pnpm sim` geprüft. Audio-Kriterien sind als „später (Audio)“ markiert; bis dahin klingt der vorhandene Bestätigungs-Klang oder nichts.

### Story 10.1: Räume ausbauen

Als Spieler
möchte ich Räume der Paktwacht mit Gold auf Stufe 2 und zusätzlich mit einem ihrer Raum-Gefährten auf Stufe 3 bringen,
damit die Burg neben den Figuren eine zweite Fortschrittsachse ist.

**Abhängigkeiten:** nach 11.1 (`c.act`, Ids der Akt-2-Gefährten in `rooms.yaml`) und 10.2 (Raum `academy`); die Akt-2-Raum-Gefährten treten in den Missions-Stories von Epic 11 bei; Stufe 2/3 der Räume nutzen die Stories 10.2 und 10.6–10.11.

**Akzeptanzkriterien:**

**Angenommen** `roomSchema` in `src/content/schemas.ts` und `RoomDef` in `src/core/defs.ts`
**Wenn** die Story umgesetzt ist
**Dann** trägt jeder Eintrag in `levels` zusätzlich `cost: { gold }` (`z.strictObject({ gold: z.number().int().positive() })`), und das Enum `function` kennt neben `convoy`, `merchant`, `smith`, `healer`, `tavern`, `campfire`, `memorial`, `enchanter` auch `academy`, `workshop`, `training`
**Und** `pnpm content:check` verlangt für jeden Raum mit `homes` ∋ `castle` genau zwei `levels` mit `cost`, Stufe 3 nicht billiger als Stufe 2, und meldet eine `alive`-Id, die in keinem `content/acts/*/units.yaml` steht, als Fehler (Story 11.1 legt die Akt-2-Ids vorher an).

**Angenommen** `content/core/rooms.yaml`
**Wenn** die Story umgesetzt ist
**Dann** stehen dort alle 11 Räume in dieser Reihenfolge (= Anzeige), jeder mit Kosten 1 500 / 4 000 Gold; Stufe 2 verlangt nur Akt 2, Stufe 3 zusätzlich einen der zwei Raum-Gefährten als `any`-Bedingung (einer reicht); die Akt-1-Räume mit `storyCount`-Bedingung bleiben in Akt 2 offen, weil Story 11.1 ihre Bedingung schon um `{ act: 2 }` ergänzt hat:

```yaml
# Vorschlag für content/core/rooms.yaml (Kosten GDD-Annahme 9, Gefährten Produktinhaber 2026-10-31, Gefährte nur für Stufe 3: Readiness-Runde R2)
- { id: convoy,    function: convoy,    icon: convoy,    fromAct: 1, homes: [camp, castle], requires: [],
    levels: [{ cost: { gold: 1500 }, requires: [{ act: 2 }] },
             { cost: { gold: 4000 }, requires: [{ act: 2 }, { any: [{ alive: tobin }, { alive: nell }] }] }] }
# alle weiteren Räume: levels nach dem Muster von convoy, nur die zwei Gefährten wechseln („…“ = Muster)
- { id: merchant,  …, requires: [],                                                         Gefährten fenn | nell }
- { id: smith,     …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 3 } }] }],         Gefährten brenna | grosk }
- { id: healer,    …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 3 } }] }],         Gefährten liora | amos }
- { id: tavern,    …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 3 } }] }],         Gefährten varek | jory }
- { id: campfire,  …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 4 } }] }],         Gefährten jory | brenna }
- { id: memorial,  function: memorial,  icon: stone,     fromAct: 1, homes: [castle], …,    Gefährten liora | amos, unlocks: [{ id: lessons, requires: [{ act: 2 }] }] }
- { id: enchanter, function: enchanter, icon: enchanter, fromAct: 2, homes: [castle], …,    Gefährten ysolde | brann }
- { id: academy,   function: academy,   icon: academy,   fromAct: 2, homes: [castle], …,    Gefährten varek | odile }
- { id: workshop,  function: workshop,  icon: workshop,  fromAct: 2, homes: [castle], …,    Gefährten fenn | brann }
- { id: training,  function: training,  icon: training,  fromAct: 2, homes: [castle], …,    Gefährten mira | ilka }
```

**Und** die Icons `academy`, `workshop`, `training` stehen in `src/ui/icons.tsx`, Namen und Kurztexte als `room.<id>.name|desc` in `de.yaml`/`en.yaml`, Anker der drei neuen Räume in `content/home/home.yaml` (Position auf `paktwacht_ruine` setzt der Entwickler, Abnahme per Screenshot).

**Angenommen** die Heimat ist die Burg (`c.home.kind = 'castle'`), der Raum ist offen (`homeRooms`), hat eine nächste Stufe, alle `requires` dieser Stufe sind erfüllt und `c.gold ≥ cost.gold`
**Wenn** der Spieler `{ type: 'buildRoom', room }` schickt
**Dann** sinkt das Gold um `cost.gold`, `c.home.rooms[room]` wird `roomLevel(c, room) + 1`, und es entstehen die Events `goldChanged` und `roomBuilt { room, level }`
**Und** UI und `validateCampaign` rufen dieselbe reine Funktion `roomBuild(data, c, roomId)` in `src/core/campaign/camp.ts` (liefert nächste Stufe, Kosten, erste offene Bedingung oder Fehler; ersetzt `nextRoomLevel`).

**Angenommen** eine verletzte Vorbedingung
**Wenn** `buildRoom` geprüft wird
**Dann** liefert es genau einen Fehlercode ohne Änderung am Zustand, geprüft in dieser Reihenfolge: `unknown_room` (Id unbekannt oder Raum nicht in dieser Heimat bzw. noch nicht offen), `max_level` (Stufe 3 erreicht), `room_locked` (eine `requires` der Stufe offen, z. B. Akt < 2 oder beim Ausbau auf Stufe 3 kein Raum-Gefährte in der Truppe; im Lager immer), `not_enough_gold`.

**Angenommen** ein Raum auf Stufe 2, dessen Raum-Gefährten beide gefallen sind oder die Truppe verlassen haben (`dead`/`left`)
**Wenn** die Heimat geladen wird
**Dann** bleibt der Raum auf Stufe 2 mit allen Wirkungen dieser Stufe (`roomLevel` liest nur `c.home.rooms`, nie die Gefährten)
**Und** nur der Ausbau auf Stufe 3 ist `room_locked`; ein Raum auf Stufe 1 ohne lebenden Raum-Gefährten lässt sich trotzdem auf Stufe 2 ausbauen (z. B. die Akademie nach E5 `return` und E6 `pardon`); Tests decken Tod und Weggang beider Gefährten vor und nach Stufe 2 ab.

**Angenommen** das Raum-Panel eines Burg-Raums mit nächster Stufe
**Wenn** alle Bedingungen und das Gold reichen
**Dann** steht oben das Ausbau-Band in Grün (`colors.positive`) mit „Ausbauen auf Stufe n“, der Wirkung der nächsten Stufe in einem Satz (`room.<id>.level.<n>`), beim Ausbau auf Stufe 3 dem erfüllten Gefährten („Nell in der Truppe ✓“) und der Taste „Ausbauen · ● 1 500“ (`Amount`); ein Tipp baut aus (Panel öffnen + Tippen = 2 Taps)
**Und** fehlt etwas, bleibt das Band gestrichelt wie seit Story 6.9 und nennt die erste offene Bedingung (`lockReason` kennt jetzt `any` mit `alive`: „Tobin oder Nell in der Truppe“) bzw. zeigt den Betrag rot, wenn nur Gold fehlt; auf Stufe 3 steht statt des Bands „Höchste Stufe“
**Und** das Verhalten entspricht `concept/25-ux/EXPERIENCE.md` (Raumstein, nachgezogen 2026-10-31); Abweichungen gehen in `concept/25-ux/.decision-log.md`.

**Angenommen** die Heimat-Ansicht
**Wenn** ein Raum ausgebaut wurde oder ausgebaut werden kann
**Dann** zeigt sein Raumstein die Stufe als Punkte (`Pips`) und einen grünen Pfeil, solange ein Ausbau jetzt möglich ist (DESIGN `room-stone`), und die Kopfzeile lautet „Räume 11 · n ausbaubar“ (Mockup 04, Variante B)
**Und** auf dem gemalten Bild trägt der Anker des Raums dieselben Punkte und denselben Pfeil; Ausbauteile oben gibt es in dieser Story nicht (Story 10.14)
**Und** ein Toast meldet „Schmied auf Stufe 2 ausgebaut“; Ausbau-Klang später (Audio).

**Angenommen** die Stufenwirkungen, die nur Zahlen sind
**Wenn** ein Raum ausgebaut ist
**Dann** gelten diese Stufen-Arrays aus `balance.yaml` (Index = Stufe − 1), gelesen über je eine Funktion in `camp.ts`, die Panel und Command teilen:

```yaml
# Vorschlag für content/core/balance.yaml (Zahlen GDD „Heimat“)
economy:
  smithMaxUpgrade: [3, 4, 5]                 # existiert
  rerollFromSmithLevel: 3                    # existiert: Affix neu würfeln ab Schmied-Stufe 3
  scarRemoval: { goldByLevel: [2500, 1800, 1200], altItem: seers_herb }   # ersetzt gold: 2500; scarCost(data, c)
  tavern:
    offersByLevel: [3, 4, 4]                 # ersetzt tavernOffersPerChapter; tavernOfferCount(data, c)
supports:
  campfireMaxRank: [B, A, S]                 # existiert; Abnahme der Gespräche in Story 10.8
```

**Und** Tests über `buildRoom` belegen: Schmied Stufe 2 erlaubt +4, Stufe 3 +5 und Neu würfeln; Narbe kostet 2 500 → 1 800 → 1 200 (Seherkraut-Weg unverändert); die nächste Taverne-Runde nach Ausbau auf Stufe 2 bringt 4 Angebote; Lagerfeuer-Deckel B → A → S
**Und** der Hinweis bleibt im Story-Log: +5 kostet `dragon_scale` (Akt 3), Schmied Stufe 3 wirkt in Akt 2 also nur über Neu würfeln.

**Angenommen** die Architektur
**Wenn** die Story fertig ist
**Dann** stimmen §8.1 (Beispiel `buildRoom` mit `roomBuild`, `roomLevel(c, id) + 1`, Prüfreihenfolge) und §5.10 (Kosten und Bedingungen in `rooms.yaml`, Gefährte nur für Stufe 3, Wirkungen als Stufen-Arrays in `balance.yaml`) mit dem Code überein (nachgezogen 2026-10-31; prüfen, Abweichungen ins Architektur-Log)
**Und** der Handbuch-Eintrag `rooms_upgrade` (Kategorie Heimat) nennt Kosten und Gefährten als Verweise auf die Daten, nie abgetippt.

**Angenommen** `tools/simulate.ts` mit der Heimat-Heuristik aus Story 6.8
**Wenn** `pnpm sim --campaign act2` läuft (sobald Epic 11 Akt 2 liefert; vorher mit Fixture-Kampagne in `tests/unit/rooms-build.test.ts`)
**Dann** baut die Heuristik Räume aus, sobald nach dem Ausbau noch das Gold für Narbe und Aufwerten bleibt (Reihenfolge Schmied, Akademie, Heiler, Übungsplatz, Rest `[ASSUMPTION]`), und die Ausgabe zeigt je Mission die gebauten Stufen neben dem Gold
**Und** die Tests decken ab: Ausbau 1 → 2 → 3, jeden Fehlercode, beide Events, Determinismus (zweimal anwenden), Replay über das Journal.

### Story 10.2: Akademie und Aufstieg mit Glutfunke

Als Spieler
möchte ich ausgewählte Gefährten in der Akademie mit einem Glutfunken auf einen Profi-Weg aufsteigen lassen,
damit die knappe Wahl, wer wächst, ein Moment wird.

**Abhängigkeiten:** nach 11.1 (`levelCap: 20`, `c.act`); bringt Raum `academy` und Enum-Wert mit, solange 10.1 fehlt (10.1 ergänzt Kosten und Bedingungen); Stufe 2 und 3 der Akademie sind vor 10.1 mit Fixture `c.home.rooms.academy = 2|3` testbar; die übrigen 10 Profi-Wege liefern 10.3 (Klassen, darunter die von Avatar und Kael) und 10.4 (Wirkungen), bis dahin funktioniert der Aufstieg mit den sechs vorhandenen Profiklassen. Wird die Story zu groß, bei Bedarf Wegwechsel und Zweit-Effekt (Akademie Stufe 2/3) wie 10.9–10.11 abtrennen.

**Akzeptanzkriterien:**

**Angenommen** `content/core/items.yaml`
**Wenn** die Story umgesetzt ist
**Dann** ist der Glutfunke das einzige Aufstiegs-Item: `ember_spark` trägt `use: { promote: true, minLevel: 10 }` (weiter `kind: seal`, `tags: [convoyOnly]`, `price: 3000`), `promotion_seal` ist mit Locales, Bild, `itemInfo.ts`-Eintrag und Handbuch-Verweisen entfernt und steht als `promotion_seal: ember_spark` in `content/renames.yaml` (Akt 1 ist veröffentlicht, die Id ist gesperrt; im MVP ist das Siegel nirgends erhältlich)
**Und** `pnpm content:check` ist mit der gesperrten Id grün; Architektur §5.11 nennt `kind: seal` statt `kind: promotion`.

**Angenommen** ein Spielstand aus dem Akt-1-Release (Speicherformat 2)
**Wenn** er nach dieser Story geladen wird
**Dann** hebt `src/persistence/save.ts` das Speicherformat auf 3 mit einer generischen Migration 2 → 3, die jede Umbenennung aus `content/renames.yaml` über `renamedId` auf alle Item-, Skill- und Klassen-Ids im Spielstand anwendet (Konvoi, Ausrüstung, Taschen, `loadout`, `mastered`, Klassen der Einheiten); spätere Stories ergänzen nur Einträge in `renames.yaml`, keine eigene Migration
**Und** eine Fixture `tests/fixtures/saves/format2-*.json` aus dem Akt-1-Release liegt bei, und `tests/unit/migrations.test.ts` belegt Migration und Umbenennung (`promotion_seal` → `ember_spark`) mit ihr (`AGENTS.md`, „Akt-Release“ Schritt 3).

**Angenommen** `rooms.yaml` mit `{ id: academy, function: academy, icon: academy, fromAct: 2, homes: [castle] }`
**Wenn** Akt 2 erreicht ist und die Heimat die Burg ist
**Dann** steht die Akademie als Raumstein mit Stufe als Punkten unter den Räumen und öffnet ihr Panel; in Akt 1 gibt es sie nicht (nur über `fromAct`, kein `if` im Code).

**Angenommen** eine Figur der Truppe mit Stufe ≥ `balance.levels.promoteFrom` (10), deren Klasse nicht `tier: pro` ist und einen Profi-Weg hat (`promotionTargets` nicht leer; auch `tier: unique` von Avatar und Kael), mindestens ein `ember_spark` im Konvoi und eine offene Akademie (`academyOpen(data, c)` über `homeRooms`)
**Wenn** der Spieler `{ type: 'promote', unit, classId }` schickt
**Dann** wird die Figur Profi der gewählten Klasse (Stufe → 1, EP → 0, `promotionBonus` bis zu den Caps der neuen Klasse), der tatsächlich gutgeschriebene Wertgewinn steht als `promotionGain` am `UnitRecord` (Default `{}`), ein Glutfunke verschwindet aus dem Konvoi, der Loadout fasst 5 statt 4 Skills (`skills.loadoutAdvanced`), Events `itemLost` und `promoted { unit, from, to, gain }`
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_unit`, `unknown_class` (kein Profi-Weg dieser Klasse), `not_available` (Stufe < 10, schon Profi, Akademie nicht offen), `not_enough_materials` (kein Glutfunke)
**Und** Avatar (`tactician` → `grand_strategist`) und Kael (`captain` → `banner_lord`) steigen genauso auf, sobald Story 10.3 ihre Profiklassen anlegt (vorher Fixture-Klassen im Test): Stufe 10, ein Glutfunke, Akademie, eine Weg-Karte.

**Angenommen** das Panel der Akademie (UX-DR21, Mockup 08 „Akademie · Aufstieg“)
**Wenn** der Spieler es öffnet
**Dann** zeigt es oben den Vorrat an Glutfunken (Item-Bild + Zahl), darunter die Figuren ab Stufe 10 ohne Profi-Klasse, alle anderen gedimmt mit Grund („ab Stufe 10“, „schon aufgestiegen“)
**Und** nach Wahl einer Figur zwei Weg-Karten (Avatar und Kael: eine) mit Name, Wirkung in einem Satz (`class.<id>.effect`), Wertgewinn aus `promotionPreview(data, u, classId)` in `src/core/rules/progression.ts`, die `promote` selbst benutzt („TP +4 · DEF +3 …“; es gelten die Daten, nicht die Beispielzahlen in Mockup 08), und dem Namen des Signaturteils (`part.<classId>.name`, Grafik in Story 10.13)
**Und** die Haupttaste lautet „Aufsteigen · [Glutfunke] 1“; ohne Glutfunken ist sie gesperrt und nennt den Grund; Figur wählen und Weg wählen sind Auswahl, erst die Haupttaste führt aus.

**Angenommen** ein gelungener Aufstieg
**Wenn** `promoted` eintrifft
**Dann** spielt über dem Panel der Funken-Moment (≤ 1,5 s): die Darstellung `.vn-sparks` aus Story 9.9 ist als wiederverwendbare Komponente `src/ui/Sparks.tsx` aus `Dialogue.tsx` herausgelöst (nicht kopiert), mit `prefers-reduced-motion` ein stehendes Glühen
**Und** die Bark-Zeile `ember` der Figur erscheint, falls vorhanden (`hasBark`)
**Und** Funkenknistern später (Audio).

**Angenommen** Truppe und Figur (Story 6.1)
**Wenn** eine Figur aufsteigen kann
**Dann** trägt sie die Marke „Bereit für den Aufstieg“ nur, wenn auch eine Akademie offen ist; die Taste „Aufsteigen“ in der Figur öffnet das Akademie-Panel mit dieser Figur vorgewählt
**Und** die bisherige Aufstiegs-Auswahl in `src/app/screens/Troop.tsx` entfällt (keine zweite Aufstiegs-Oberfläche); in Akt 1 gibt es weder Marke noch Taste
**Und** der Skill-Loadout bleibt in der Figur (`setLoadout`); das Akademie-Panel verlinkt nur dorthin.

**Angenommen** die Akademie auf Stufe 2 und ein Profi mit zwei Wegen seiner Rolle
**Wenn** der Spieler `{ type: 'changeProPath', unit, classId }` mit dem anderen Weg derselben Rolle schickt
**Dann** werden `promotionGain` abgezogen und der `promotionBonus` des neuen Wegs bis zu dessen Caps gutgeschrieben (neuer `promotionGain`; Werte über den neuen Caps werden auf sie gesenkt), die Klasse wechselt, Stufe, EP, Loadout und Ausrüstung bleiben, das Gold sinkt um 1 500, Events `goldChanged` und `proPathChanged { unit, from, to }`
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_class` (kein anderer Weg derselben Rolle, also auch Avatar und Kael), `not_available` (Akademie < 2, kein Profi, schon den Zweit-Effekt gelernt: Produktinhaber 2026-10-31, Readiness-Runde R1), `not_enough_gold`
**Und** im Panel erscheint bei einem gewählten Profi die zweite Weg-Karte mit „Weg wechseln · ● 1 500“.

**Angenommen** die Akademie auf Stufe 3 und ein Profi, dessen Rolle zwei Wege hat
**Wenn** der Spieler `{ type: 'learnSecondPath', unit }` schickt
**Dann** lernt die Figur für einen weiteren Glutfunken zusätzlich die Wirkung des anderen Profi-Wegs: `secondPath` am `UnitRecord` (Default `null`) nennt die andere Klasse, deren `proSkills` (Stories 10.3 und 10.4) zählen ab sofort in `activeSkillIds`; Klasse, Werte und Wertgewinn bleiben; Events `itemLost`, `secondPathLearned { unit, path }`; der Funken-Moment spielt
**Und** Fehler ohne Änderung: `not_available` (Akademie < 3, kein Profi, schon gelernt, Rolle mit nur einem Weg), `not_enough_materials` (kein Glutfunke)
**Und** die Figur zeigt unter Skills „Auch: <Wirkung des anderen Wegs>“.

```yaml
# Vorschlag für content/core/balance.yaml
academy:
  changePathFromLevel: 2
  changePathGold: 1500          # Produktinhaber 2026-10-31
  secondPathFromLevel: 3
  secondPathSparks: 1           # Produktinhaber 2026-10-31: „für einen weiteren Glutfunken“
```

**Angenommen** `promote`, `changeProPath`, `learnSecondPath`
**Wenn** sie im Journal stehen
**Dann** ergibt das Replay denselben Zustand, und die effektive Stufe zählt sofort mit +15 (`experience.advancedLevelOffset`) für EP, Leutnant-Skalierung und Heimsuchungs-Deckel
**Und** `tests/unit/academy.test.ts` deckt gültigen Aufstieg (Stufe 1, Loadout 5, Glutfunke weg), jeden Fehlercode (auch Akt 1 ohne Akademie), Wechsel mit Rückrechnung bis zu den Caps, zweiten Effekt und Replay ab
**Und** die Heimat-Heuristik in `tools/simulate.ts` lässt bei vorhandenem Glutfunken die Figur mit der höchsten Stufe ≥ 10 auf den ersten Weg aufsteigen (für Story 11.22)
**Und** die Handbuch-Einträge `academy` (Kategorie Heimat, Werte als Verweise auf `balance.levels.promoteFrom`, `balance.skills.loadoutAdvanced`, `balance.academy`) und `ember_spark` verweisen aufeinander.

### Story 10.3: Profi-Klassen und Werte

Als Spieler
möchte ich zwischen zwei klar verschiedenen Profi-Wegen je Rolle wählen,
damit ein Aufstieg die Spielweise ändert.

**Abhängigkeiten:** nach 10.2 (Aufstieg); Steckbriefe nach Story 14.5; Wirkungen, die Vorschau, Reihenfolge oder KI ändern, in Story 10.4 (hier Klassen, Werte, Schema und die Wege, die nur Werte, Waffengruppen, Einsätze oder Radien ändern); Schatten- und Fallensteller-Wirkung in Story 10.5; Brett-Grafik in Story 10.13; Epic 12 braucht `battle_priest` vor Maels Beitritt.

**Akzeptanzkriterien:**

**Angenommen** `classSchema` und `skillSchema` in `src/content/schemas.ts`
**Wenn** die Story umgesetzt ist
**Dann** hat jede Klasse mit `tier: pro` ein Feld `proSkills` (0–2 Skill-Ids mit Präfix `pro_`; Pflicht mit 1–2 für jede spielbare Profiklasse ab Story 10.4) und ein optionales Feld `proPart` (Id des Anhängeteils, Story 10.13); `skill` einer neuen Profiklasse ist der Rollen-Skill ihrer Herkunftsrolle (der Spielmann hat keinen)
**Und** `activeSkillIds` (`src/core/rules/skills.ts`) zählt Rollen-Skill, `proSkills` der Klasse und `proSkills` von `secondPath` (Story 10.2); die PoC-Skills der sechs vorhandenen Profiklassen bleiben bis Story 10.4
**Und** `skillSchema.effect` kennt die neuen Bausteine `addWeaponGroups`, `usesBonus: { <Klassen-Aktion>: n }` (Schlüssel ist die Klassen-Aktion aus `classes.yaml`, z. B. `command`) und `radiusBonus: { <skillId>: n }`; die übrigen Bausteine folgen in Story 10.4; `content:check` prüft, dass jede Profiklasse eine Herkunftsrolle mit passendem `proPaths` und gültige `proSkills` hat.

**Angenommen** `content/core/classes.yaml`
**Wenn** die Story umgesetzt ist
**Dann** stehen dort 16 Profiklassen: die 10 neuen mit diesen Werten (Reihenfolge der Werte hp/str/mag/skl/spd/lck/def/res; Waffengruppen = Rolle, Zusatzgruppen nur über `addWeaponGroups` des Profi-Skills, damit Akademie Stufe 3 sie mitgibt; MOV = Rolle + 1, höchstens 6) und `bard`/`standard_bearer` bis Story 10.4 sowie `shadow`/`trapper` bis Story 10.5 mit `playable: false` (`promotionTargets` filtert nicht spielbare Klassen heraus):

| Klasse | Rolle | Bewegung | base | growth | growthMod | caps | promotionBonus |
|---|---|---|---|---|---|---|---|
| `blade_dancer` | skirmisher | foot 6 | 27/8/1/11/12/5/6/3 | 80/45/5/55/60/30/25/15 | 10/5/0/10/15/5/0/0 | 62/28/15/32/32/30/24/20 | hp3 str1 skl2 spd3 lck1 def1 |
| `ranger` | marksman | foot 6 | 26/8/1/10/9/4/6/3 | 75/45/5/55/50/25/25/15 | 10/5/0/15/10/0/0/0 | 60/28/15/32/30/30/24/20 | hp3 str2 skl2 spd2 def1 res1 |
| `hexer` | elementalist | foot 6 | 24/1/11/8/7/3/2/8 | 65/5/65/45/40/25/15/40 | 5/0/20/5/5/0/0/15 | 55/15/33/30/26/30/20/30 | hp3 mag4 skl1 res2 |
| `battle_priest` | healer | foot 6 | 26/4/8/6/7/6/5/8 | 70/30/45/35/40/45/30/45 | 5/10/5/0/5/5/5/10 | 58/24/28/26/26/30/24/27 | hp4 str3 mag1 def2 res1 |
| `bard` | minstrel | foot 6 | 25/4/5/8/10/7/3/6 | 75/23/35/45/50/40/20/35 | 5/3/5/5/10/10/0/10 | 58/20/22/28/30/33/22/26 | hp3 skl1 spd2 lck2 res2 |
| `standard_bearer` | minstrel | foot 6 | 27/6/3/8/8/6/6/5 | 80/33/30/40/45/35/30/30 | 10/5/0/5/5/5/5/5 | 60/22/20/26/26/30/24/22 | hp4 str2 spd1 def3 res1 |
| `shadow` | scout | foot 6 | 25/8/1/10/12/5/5/3 | 75/45/5/55/55/30/23/15 | 7/5/0/12/13/5/0/0 | 60/27/15/31/31/32/23/20 | hp3 str1 skl2 spd3 lck2 |
| `trapper` | scout | foot 6 | 26/7/1/11/9/4/6/3 | 80/40/5/60/40/25/30/15 | 10/5/0/15/8/0/5/0 | 62/26/15/32/28/30/24/20 | hp4 str1 skl3 spd1 def2 |
| `grand_strategist` | tactician | foot 6 | 27/7/7/8/8/6/6/6 | 80/45/45/50/45/40/35/35 | 5/5/5/5/5/5/5/5 | 62/28/28/30/29/30/26/26 | hp3 str1 mag2 skl2 spd1 def1 res1 |
| `banner_lord` | captain | foot 6 | 30/9/2/9/9/6/9/4 | 90/50/10/45/45/35/45/25 | 15/5/0/5/5/5/10/0 | 68/31/15/29/28/30/30/21 | hp4 str2 skl1 spd1 def3 res1 |

`[ASSUMPTION]` Werte nach dem Muster der sechs vorhandenen Profiklassen (Lückenanalyse §3.8), per Sim zu prüfen.
**Und** die sechs vorhandenen Profiklassen sind angeglichen: `bulwark` und `breaker` `moveType: armored`, `mov: 5` (Vorkämpfer gepanzert 4 + 1); Werte und `promotionBonus` bleiben, ihre Skills stellt Story 10.4 um
**Und** Namen, Kurztext und Wirkungssatz stehen als `class.<id>.name|desc|effect` in `de.yaml`/`en.yaml`; der Kopfkommentar von `classes.yaml` nennt Epic 10 statt Epic 6.

**Angenommen** die Profi-Skills der Wege, die nur Werte, Waffengruppen, Einsätze oder Radien ändern (`content/core/skills.yaml`, `source: class`)
**Wenn** eine aufgestiegene Figur handelt oder angegriffen wird
**Dann** gilt genau diese Wirkung im Kampf, in der Kampfvorschau, in der Gegner-KI (Worker) und in der Simulation:

| Klasse | `proSkills` | Wirkung |
|---|---|---|
| Klingentänzer | `pro_blade_dance` | `avoidBonus: 15`, `critBonus: 10` |
| Waldläufer | `pro_woodsman` | `terrainCost: { forest: 1 }`, `addWeaponGroups: [sword]` |
| Hexer | `pro_hex` | `statusChanceBonus: 20`, `addWeaponGroups: [dark]`; zusammen mit dem Rollen-Skill `elemental_focus` +40 (per Sim prüfen) |
| Kampfpriester | `pro_battle_faith` | `addWeaponGroups: [axe]`: führt Stab, Licht und Axt (der Hammer ist eine Axt) |
| Großstratege | `pro_grand_command` | `usesBonus: { command: 1 }`: Befehl 2×/Karte (die Einsätze hängen an der Klassen-Aktion `command`, nicht an der Skill-Id `tactician_command`) |
| Bannerherr | `pro_banner_lord` | `radiusBonus: { rally: 1 }`: Sammelruf Radius 3 |

**Und** jede Wirkung steht als Daten im Skill, kein `if (classId === …)`; Waffenwahl, Befehl-Einsätze und Sammelruf-Fläche zeigen Ausrüsten und Vorschau über dieselben Funktionen wie die Auflösung, Unit-Tests belegen das je Wirkung.

**Angenommen** das Akademie-Panel und das Handbuch
**Wenn** die Story fertig ist
**Dann** zeigt die Akademie je Rolle beide Wege mit Wirkungssatz und Wertgewinn (Barde und Bannerträger bis Story 10.4, Späher-Wege bis Story 10.5 gesperrt mit Grund „folgt“)
**Und** jede spielbare Profiklasse hat einen Steckbrief `class_<id>` nach Story 14.5 (Wirkung, Werte aus den Daten, Verweis auf die Rolle, `content:check` verlangt ihn); der Eintrag der Rolle verweist auf beide Wege.

**Angenommen** `tools/simulate.ts`
**Wenn** `pnpm sim <mapId> --runs 50 --promote a|b` läuft
**Dann** steigen vor der Mission alle Figuren ab Stufe 10 auf den ersten (`a`) bzw. zweiten (`b`) Weg auf, und die Ausgabe nennt Siegquote und Niedergestreckte je Option; die endgültigen Korridore prüft Story 11.22
**Und** `pnpm test:coverage` senkt die Coverage von `src/core` nicht.

### Story 10.4: Wirkungen der Profi-Wege

Als Spieler
möchte ich, dass Schutz, Rückstoß, Konter zuerst, Flächen und Anfeuern der Profi-Wege in Vorschau, Kampf und KI gleich wirken,
damit ich jede Profi-Wirkung vor dem Zug richtig einschätzen kann.

**Abhängigkeiten:** nach 10.3 (Schema, Klassen) und 10.2 (Migration auf Format 3 für die Umbenennungen); Reichweiten-Kacheln aus Epic 13; Story 11.20 nutzt das Anfeuern auf zwei Ziele (`cheerTargets`) für die Laute `final_curtain`.

**Akzeptanzkriterien:**

**Angenommen** `skillSchema` und die Profiklassen
**Wenn** die Story umgesetzt ist
**Dann** kennt `skillSchema.effect` die neuen Bausteine `guardNeighbors`, `statusOnHit: { status, chance }`, `rangeCap`, `castRadius`, `healRadius`, `cheerRange`, `cheerTargets`, `ignoreGrief`; `proSkills` ist für jede spielbare Profiklasse Pflicht (1–2), und `bard` und `standard_bearer` sind `playable: true`
**Und** die sechs vorhandenen Profiklassen tragen als `skill` den Rollen-Skill (`duelist` `counter_instinct`, `bulwark`/`breaker` `phalanx`, `sharpshooter` `eagle_eye`, `sage` `elemental_focus`, `bishop` `blessing`) und ihre `proSkills` aus der Tabelle; der PoC-Klassen-Skill `climber` entfällt nur am Sturmbrecher (Späher und Brigand behalten ihn)
**Und** die PoC-Skills `sol`, `impale`, `longshot` sind aus `skills.yaml` gelöscht und stehen in `content/renames.yaml` als `sol: pro_duel`, `impale: pro_guard`, `longshot: pro_far_shot` (Akt 1 ist veröffentlicht, die Ids sind gesperrt); `pnpm content:check` ist grün; Spielstände übernehmen die Umbenennung über die generische Migration aus Story 10.2 (Format 3), diese Story legt keine eigene Migration an, sondern nur die drei Einträge und einen Testfall in `tests/unit/migrations.test.ts` (Fixture-Stand mit `sol`, `impale`, `longshot` in `loadout`/`mastered` → `pro_duel`, `pro_guard`, `pro_far_shot`).

**Angenommen** die übrigen Profi-Skills in `content/core/skills.yaml` (`source: class`)
**Wenn** eine aufgestiegene Figur handelt oder angegriffen wird
**Dann** gilt genau diese Wirkung im Kampf, in der Kampfvorschau, in der Gegner-KI (Worker) und in der Simulation:

| Klasse | `proSkills` | Wirkung |
|---|---|---|
| Bollwerk | `pro_guard` | `guardNeighbors: 10`: jeder Nachbar des Bollwerks hat 10 % Schutz durch das Bollwerk, auch ohne Support; zusammen mit dem Support-Schutz (`supports.guardChance` A 20 / S 30) höchstens 30 % (`supports.guardMaxTotal: 30`, neu); ein Wurf aus dem Seed-RNG gegen die Summe, es schützt das Bollwerk, sonst der Support-Partner `[ASSUMPTION]` |
| Sturmbrecher | `pro_knockback` | `on_hit`, `statusOnHit: { status: knockback, chance: 100 }`: jeder Treffer (auch im Konter) stößt das Ziel 1 Feld weg (Regeln des Status `knockback`, blockiert = `status.knockbackBlockedDamage`) |
| Duellant | `pro_duel` | `on_defend`, `strikeFirst: true`: sein Konter schlägt vor dem Angriff zu |
| Scharfschütze | `pro_far_shot` | mit Bogen `rangeBonus: 1`, `rangeCap: 4`: Gesamtreichweite inklusive Zielen höchstens 4 |
| Weiser | `pro_wide_cast` | `castRadius: 1`: Wirken legt das Elementfeld auf das Zielfeld und alle Felder im Manhattan-Radius 1, auf denen es nach Story 2.5 entstehen darf |
| Bischof | `pro_wide_heal` | `healRadius: 1`: Stab-Heilen heilt auch alle Verbündeten neben dem Ziel um denselben Betrag; EP 12 + `experience.healExtraTarget` (3) je weiterem Ziel |
| Barde | `pro_song` | `cheerRange: 2`, `cheerTargets: 2`: Anfeuern (`classActions.cheer`) erreicht Verbündete im Abstand bis 2; nach dem ersten Ziel optional ein zweites, „Fertig“ beendet nach einem |
| Bannerträger | `pro_banner` | `aura: { radius: 1 }` mit `ignoreGrief: true` und `avoidBonus: 5`: Nachbarn ignorieren Trauer (`griefHitPenalty`) und erhalten +5 Ausweichen, der Träger selbst nicht (Produktinhaber 2026-10-31, Readiness-Runde R1) |
| Schatten | `pro_shadow` | Story 10.5 |
| Fallensteller | `pro_traps` | Story 10.5 |

**Und** jede Wirkung steht als Daten im Skill, kein `if (classId === …)`
**Und** `addAuras` (`src/core/rules/skills.ts`) überträgt neben `effect.stats` zusätzlich `avoidBonus`, `hitBonus` und `ignoreGrief` an die Figuren im Radius (Bannerträger, Lektion `heritage_cheer` aus Story 10.7); die Kampfvorschau zeigt sie über dieselbe Funktion wie die Auflösung, ein Unit-Test belegt Vorschau = Auflösung für alle drei
**Und** `cheerTargets` ist die einzige Mechanik für Anfeuern auf mehrere Ziele; auch die Laute `final_curtain` (Story 11.20) nutzt sie über `grantsSkill`. Treffen mehrere Quellen zusammen, gelten höchstens 2 Ziele und die größte Reichweite, nichts addiert sich `[ASSUMPTION]`.

**Angenommen** eine Wirkung, die eine Zahl, eine Reihenfolge oder eine Fläche ändert
**Wenn** der Spieler sie vorbereitet
**Dann** zeigt die Vorschau sie über dieselbe Funktion wie die Auflösung (`forecast`, `previewAction`, `castArea`): Schutzchance in der Kampfvorschau, Schlagreihenfolge des Duellanten, Rückstoß-Pfeil mit Zielfeld, Reichweiten-Kacheln (Epic 13), Wirken- und Heilfläche als Kacheln, mögliche Anfeuern-Ziele
**Und** Unit-Tests zeigen je Wirkung Vorschau = Auflösung auf einer Fixture-Karte.

**Angenommen** die Gegner-KI (`src/core/ai/*`)
**Wenn** sie Züge bewertet
**Dann** rechnet sie mit denselben Funktionen: Schutz und Konter zuerst erhöhen das Risiko eines Angriffs (`counterWeight`), Rückstoß und Reichweite gelten regelkonform, und Worker und synchroner Fallback liefern identische Ergebnisse (Architektur §8.5).

**Angenommen** die Story ist fertig
**Wenn** geprüft wird
**Dann** misst `pnpm sim <mapId> --runs 50 --promote a|b` (Story 10.3) auch die Wirkungen dieser Story; Barde und Bannerträger haben Steckbriefe `class_bard`/`class_standard_bearer` nach Story 14.5 und sind in der Akademie wählbar
**Und** `pnpm test:coverage` senkt die Coverage von `src/core` nicht.

### Story 10.5: Fallensteller und Schatten

Als Spieler
möchte ich mit Späher-Profis Fallen legen oder für Gegner unsichtbar bleiben,
damit Späher im späten Spiel eine eigene Taktik haben.

**Abhängigkeiten:** nach 10.3 (Klassen `shadow`/`trapper`) und 10.4 (`proSkills` Pflicht); Bereichskacheln aus Epic 13; Karten mit Nebel aus Epic 11 (bis dahin Fixture-Karten mit und ohne Nebel); Story 10.6 nutzt die Fallen-Logik für das Fallen-Set.

**Akzeptanzkriterien:**

**Angenommen** `classes.yaml` mit `shadow` und `trapper`
**Wenn** die Story umgesetzt ist
**Dann** sind beide `playable: true` mit `proSkills` `pro_shadow` (`hidden: true`) bzw. `pro_traps` (`grantAction: trap`), behalten Kletterer, Öffnen/Stehlen und +2 Sicht der Rolle, und ihre Steckbriefe `class_shadow`/`class_trapper` beschreiben die Regeln unten
**Und** die neuen Werte stehen in `balance.yaml`:

```yaml
# Vorschlag für content/core/balance.yaml (Werte GDD und Produktinhaber 2026-10-31)
classActions:
  trap: { range: 1, max: 2, damage: 8, status: slowed }   # Verlangsamt: status.slowMovPenalty, status.durationRounds
shadow:
  revealDistance: 3     # ohne Nebel sichtbar, sobald ein Gegner näher als 3 Felder steht (Manhattan-Abstand ≤ 2)
```

**Angenommen** ein Fallensteller mit Aktion
**Wenn** er `{ type: 'trap', unit, at }` auf ein Nachbarfeld wählt, das frei (keine Einheit, kein Objekt, keine Falle) und zu Fuß begehbar ist
**Dann** liegt dort eine Falle in `BattleState.traps: Array<{ id, at, owner, source: 'class' | 'item', seq }>` (Default `[]`), die Aktion des Zugs ist verbraucht (Klassen-Aktion), Event `trapSet`
**Und** liegen schon 2 Fallen mit `source: 'class'` dieses Fallenstellers, ersetzt die neue die älteste (kleinste `seq`, Event `trapRemoved`)
**Und** Fallen bleiben bis Missionsende.

**Angenommen** eine Einheit des Teams `enemy` bewegt sich
**Wenn** ihr Weg ein Feld mit Falle betritt
**Dann** endet die Bewegung auf diesem Feld, sie nimmt 8 Schaden (ohne Zufall; 0 TP nach den normalen Regeln, Leutnants fliehen) und erhält Verlangsamt, die Falle verschwindet, Event `trapTriggered { trap, unit, damage }`
**Und** die KI entscheidet vom Fallenfeld aus neu, ohne weitere Bewegung (angreifen, wenn ein Ziel in Reichweite ist, sonst warten) `[ASSUMPTION]`
**Und** eigene und verbündete Einheiten (`player`, `other`) lösen keine Falle aus und laufen über sie hinweg.

**Angenommen** ein Fallensteller neben einer eigenen Falle
**Wenn** er `{ type: 'disarm', unit, at }` wählt
**Dann** nimmt er diese Falle zurück (Event `trapRemoved`), die Aktion des Zugs ist verbraucht `[ASSUMPTION]`
**Und** Fallen anderer Figuren und Karten-Fallen gibt es in dieser Story nicht.

**Angenommen** ein Schatten auf dem Brett
**Wenn** ein Gegner (KI) eine Entscheidung trifft
**Dann** ist der Schatten für ihn unsichtbar, wenn die Karte Nebel hat (`maps.<id>.fog`), oder, auf Karten ohne Nebel, solange kein Gegner näher als 3 Felder steht; geprüft wird mit den aktuellen Positionen vor jeder einzelnen Gegner-Entscheidung
**Und** nach einem eigenen Angriff des Schattens ist er sichtbar bis zum Ende der nächsten Gegnerphase (`BattleUnit.revealedUntil`, Default `null`); Konter enthüllen ihn nicht (Produktinhaber 2026-10-31, Readiness-Runde R1)
**Und** ein unsichtbarer Schatten ist für die KI kein Ziel und keine Gefahr; ihre Wegsuche plant, als wäre sein Feld frei; führt der gewählte Weg über sein Feld, endet ihre Bewegung auf dem letzten freien Feld davor, ohne dass sie ihn erkennt (keine unsichtbare Sperre; Produktinhaber 2026-10-31, Readiness-Runde R1).

**Angenommen** die Gegner-KI (Gegnerphase, Gefahrenzone, Autoplay der Gegnerseite)
**Wenn** sie den Zustand liest
**Dann** liest sie nur über die reine Funktion `enemyView(data, s, enemyUid)` in `src/core/ai/`: ohne Fallen, ohne unsichtbare Schatten; der Nebel der Spielerseite bleibt unverändert (die KI sieht sonst weiter alles)
**Und** der Worker bekommt den vollen Zustand und wendet denselben Filter an; Worker und synchroner Fallback, Replay (Start + Command-Log), „Runde neu“ und `pnpm sim` liefern identische Ergebnisse; Fallen und Sichtbarkeit liegen vollständig im `BattleState` (Plain-JSON).

**Angenommen** die Spielerseite
**Wenn** Fallen liegen oder ein Schatten verborgen ist
**Dann** sieht der Spieler seine Fallen als Markierung auf Feldhöhe (Aussehen in `render.yaml`), am Aktions-Stein des Fallenstellers die Zahl gelegter Fallen („1/2“) und im Fallen-Modus die gültigen Felder als Bereichskacheln (Story 13.2)
**Und** ein verborgener Schatten trägt in der DOM-Ebene der Lebensleisten das Zeichen „verborgen“, das beim Enthüllen verschwindet; Einheiten-Infos der Gegner erwähnen keine Fallen; die Gefahrenzone rechnet mit `enemyView`
**Und** das Auslösen zeigt einen Effekt ≤ 600 ms nach Art Direction §8; Fallen-Klang später (Audio).

**Angenommen** `src/core/ai/autoplay.ts` für die Spielerseite der Simulation
**Wenn** ein Fallensteller am Zug ist und kein Angriff lohnt
**Dann** legt er eine Falle auf das freie Nachbarfeld mit dem kleinsten Abstand zum nächsten Gegner (Gleichstand: kleinste Feld-Id), damit `pnpm sim` die Klasse misst; die Ausgabe zählt ausgelöste Fallen
**Und** `tests/unit/traps-shadow.test.ts` deckt ab: Legen, dritte ersetzt die älteste, Auslösen (Bewegung endet, 8 Schaden, Verlangsamt), nur Gegner lösen aus, KI läuft hinein, Zurücknehmen, Schatten im Nebel trotz Nachbar unsichtbar, ohne Nebel ab Abstand ≤ 2 sichtbar, nach Angriff bis Ende der nächsten Gegnerphase sichtbar, Konter enthüllt nicht, KI-Weg über das Schattenfeld endet davor, Worker = synchron, Replay, „Runde neu“
**Und** Architektur §5.7 („Stand“) beschreibt Fallen, Gegner-Sicht und Schatten.

### Story 10.6: Verzauberer und Werkstatt

Als Spieler
möchte ich Runen verschmelzen und Verbrauchsgüter aus Material herstellen,
damit Material aus Kopfgeld und Heimsuchungen einen Zweck hat.

**Abhängigkeiten:** nach 10.1 (Raum `workshop`, `buildRoom`) und 10.5 (Fallen-Logik); `moonsteel` existiert schon als Item, seine Akt-2-Quelle (`materialByAct`, Heimsuchungs-Truhen) liefern Story 11.5 und 11.7; Item-Bilder nach `concept/23-art-direction/licensing.md` §6.

**Akzeptanzkriterien:**

**Angenommen** der Verzauberer der Burg auf Stufe n (`economy.enchanterMergeMaxTier: [1, 2, 3]`, gelesen über `runeMergeLimit(data, c)` in `camp.ts`)
**Wenn** der Spieler Runen verschmilzt
**Dann** ist Verschmelzen zur Stufe N + 1 nur erlaubt, wenn N + 1 ≤ Grenze (Stufe 1: kein Verschmelzen, Stufe 2: bis Rune II, Stufe 3: bis Rune III); sonst Fehler `room_locked` und die Taste ist gedimmt mit „ab Verzauberer Stufe n“
**Und** Einsetzen (`insertRune`) und Ausbauen (`removeRune`) jeder Rune gehen auf jeder Stufe (eine Erd-Rune III aus N5 ist sofort nutzbar)
**Und** die Verschmelzen-Taste nennt die Kosten aus `runeMerge()`: 3 × Rune der Stufe N und ● 200 × N (`economy.runeMerge`, existiert).

**Angenommen** Akt 1
**Wenn** der Spieler Runen findet
**Dann** gibt es keinen Ort zum Einsetzen (Verzauberer `fromAct: 2`, keine Code-Änderung), und der Handbuch-Eintrag `runes` sagt: in Akt 1 nur Beute, Einsetzen ab Akt 2 beim Verzauberer, Verschmelzen je Verzauberer-Stufe.

**Angenommen** `content/core/recipes.yaml` mit Schema `recipeSchema` (`{ id, item, roomLevel: 1–3, materials: Record<materialId, int ≥ 1>, gold: int ≥ 0 = 0 }`), Typ `RecipeDef`, geladen als `GameData.recipes` (`src/content/load.ts`)
**Wenn** `pnpm content:check` läuft
**Dann** prüft es: Ids eindeutig, `item` existiert in `items.yaml` oder `runes.yaml`, jedes Material hat `kind: material` und ein Bild
**Und** die Datei enthält diese Rezepte `[ASSUMPTION]` (Materialwert = Preis in `items.yaml`; der Wert aus Material und Gold liegt bei 60–100 % des Kaufpreises: Verbrauchsgüter des Händlers 60–80 %, reine Werkstatt-Items ≈ 80 %, Runen I ≈ 100 %; kein Arkanstaub, er hat keine Quelle; Story 11.22 prüft die Spanne in der Abstimmung):

```yaml
# Vorschlag für content/core/recipes.yaml
- { id: fire_bomb,      item: fire_bomb,     roomLevel: 1, materials: { iron_ore: 2 }, gold: 100 }
- { id: door_key,       item: door_key,      roomLevel: 1, materials: { iron_ore: 1 }, gold: 50 }
- { id: haste_scroll,   item: haste_scroll,  roomLevel: 2, materials: { moonsteel: 1 }, gold: 200 }
- { id: strong_remedy,  item: strong_remedy, roomLevel: 2, materials: { moonsteel: 1 } }
- { id: trap_kit,       item: trap_kit,      roomLevel: 3, materials: { moonsteel: 1, iron_ore: 1 }, gold: 0 }   # 500 von 600 = 83 %
- { id: fire_rune_1,    item: fire_rune_1,   roomLevel: 3, materials: { moonsteel: 1 } }
- { id: wind_rune_1,    item: wind_rune_1,   roomLevel: 3, materials: { moonsteel: 1 } }
- { id: earth_rune_1,   item: earth_rune_1,  roomLevel: 3, materials: { moonsteel: 1 } }
- { id: water_rune_1,   item: water_rune_1,  roomLevel: 3, materials: { moonsteel: 1 } }
- { id: light_rune_1,   item: light_rune_1,  roomLevel: 3, materials: { moonsteel: 1 }, gold: 200 }   # Kaufpreis 600; Dunkel bleibt Beute
```

**Angenommen** ein Rezept, dessen `roomLevel` die Werkstatt erreicht, genug Material und Gold und Platz im Konvoi (`economy.convoySize`)
**Wenn** der Spieler `{ type: 'craft', recipe }` schickt
**Dann** sinken Material und Gold, das Item liegt neu im Konvoi (`newItem`), Events `materialChanged`, `goldChanged` (nur bei Gold > 0), `itemGained`; UI und Command rufen `craftCost(data, c, recipeId)`
**Und** Fehler ohne Änderung: `unknown_item` (Rezept unbekannt), `room_locked` (Werkstatt nicht offen oder Stufe zu niedrig), `not_enough_materials`, `not_enough_gold`, `convoy_full`.

**Angenommen** das Panel der Werkstatt
**Wenn** der Spieler es öffnet
**Dann** listet es die Rezepte im Listen-Muster des Händlers (EXPERIENCE Z. 45): Item-Bild, Name, Info-Stein (`ItemInfoButton`), Kosten als Material-Bild + Zahl und ● + Zahl (fehlende Menge rot), Bestand im Konvoi; Rezepte höherer Stufen gedimmt mit „ab Werkstatt Stufe n“
**Und** Rezept wählen (1), Haupttaste „Herstellen · …“ mit den Kosten (2); Styles in einer eigenen CSS-Datei neben `WorkshopRoom`.

**Angenommen** `content/core/items.yaml`
**Wenn** die Story umgesetzt ist
**Dann** gibt es zwei neue Items, beide nur aus der Werkstatt (`tags: [craftOnly]`, `content:check` verbietet sie in Händler-Listen):

```yaml
# Vorschlag für content/core/items.yaml
- { id: strong_remedy, kind: consumable, slot: bag, use: { cureStatus: true, statusImmuneRounds: 1 }, charges: 2, refillAfterMission: true, wt: 0, rarity: rare, price: 500, tags: [craftOnly] }
- { id: trap_kit,      kind: consumable, slot: bag, use: { trap: true, rng: [1, 1] }, charges: 1, wt: 0, rarity: rare, price: 600, tags: [craftOnly] }
```

`[ASSUMPTION]` Ladungen und Preise; Starkes Gegengift „heilt alle Zustände, 1 Runde immun“ ist Entscheidung des Produktinhabers.
**Und** Starkes Gegengift entfernt alle Zustände der Zielfigur (eigene oder Nachbar wie `remedy_salve`) und macht sie bis zum Ende der laufenden Runde (einschließlich der folgenden Gegnerphase) immun gegen neue Zustände; die Kampf-Info zeigt „immun“
**Und** das Fallen-Set legt mit der Aktion „Benutzen“ eine Falle auf ein freies, begehbares Nachbarfeld mit denselben Regeln und Werten wie Story 10.5 (`classActions.trap`: 8 Schaden + Verlangsamt, nur Gegner lösen aus, für Gegner unsichtbar, bis Missionsende), `source: 'item'`; jede Figur kann es nutzen, und es zählt nicht gegen die 2 Fallen des Fallenstellers.

**Angenommen** die neuen Items
**Wenn** `pnpm content:check` läuft
**Dann** haben `strong_remedy` und `trap_kit` Namen und Beschreibung in `de/en.items.yaml` und ein gemaltes Bild unter `art/items/` (ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/strong_remedy.md` bzw. `trap_kit.md`, Auflagen `licensing.md` §6 A1–A14; vor `pnpm art:build` erst `git lfs pull`); ohne Bild scheitert die Prüfung.

**Angenommen** `tools/simulate.ts` und die Tests
**Wenn** die Story fertig ist
**Dann** stellt die Heimat-Heuristik Feuerbomben her, sobald mehr als 4 `iron_ore` übrig sind `[ASSUMPTION]`, und die Kettensimulation zeigt die Materialkurve je Mission
**Und** `tests/unit/workshop.test.ts` deckt ab: Verschmelzen je Verzauberer-Stufe, Einsetzen jeder Stufe auf Stufe 1, `craft` gültig und jeder Fehlercode, Starkes Gegengift (Zustände weg, Immunität endet nach der Gegnerphase), Fallen-Set (zusätzlich zu 2 Fallen des Fallenstellers), Replay, `content:check` mit fehlendem Item/Material
**Und** die Handbuch-Einträge `runes` und `workshop` (Kategorie Heimat) nennen Werte als Verweise.

### Story 10.7: Lektionen der Gedächtnishalle

Als Spieler
möchte ich einmal je Akt das Erbe eines Gefallenen als Lektion an einen Gefährten weitergeben,
damit Verlust Bedeutung behält.

**Abhängigkeiten:** Gedächtnishalle und Gedenksteine aus Story 6.9; Stufen über `buildRoom` (10.1, vorher Fixture); `c.act` aus Story 11.1; Begriffstrennung zu den Regel-Lektionen aus Story 14.7; `heritage_cheer` (Aura mit Trefferbonus) nach 10.4 (`addAuras` überträgt `hitBonus`).

**Akzeptanzkriterien:**

**Angenommen** die Begriffe
**Wenn** Code und Daten entstehen
**Dann** heißen alle Bezeichner `heritage` (Skill-`source: heritage`, Skill-Ids `heritage_*`, Datei `content/core/heritage.yaml`, Command `inheritHeritage`, Event `heritageInherited`, Felder `heritage`/`heritageGiven`), weil `legacy` im Code schon belegt ist (IndexedDB-Store `legacy` für PoC-Stände, `legacyIds` in `classes.yaml`); sichtbar heißt es „Lektion“; die Handbuch-Kategorie `lessons` (Regel-Lektionen, Story 14.7) bleibt unberührt.

**Angenommen** `content/core/skills.yaml` und `content/core/heritage.yaml` (`- { role, lessons: [erste, zweite] }`, die erste ist die feste Lektion)
**Wenn** `pnpm content:check` läuft
**Dann** hat jede der 7 Kernrollen genau zwei Lektionen, jede ist ein gültiger passiver Skill mit `source: heritage` und Namen/Text DE/EN; Gerrits Stein in `content/acts/act1/memorials.yaml` trägt `heritage: heritage_shield_wall`
**Und** die Lektionen sind `[ASSUMPTION]` (etwa halb so stark wie persönliche Skills, nur vorhandene Bausteine samt der Aura-Übertragung von `hitBonus` aus Story 10.4, Lückenanalyse §3.7):

| Rolle | Lektion 1 (fest) | Lektion 2 |
|---|---|---|
| Vorkämpfer | `heritage_shield_wall` „Schildwall“: +2 VER mit ≥ 1 Nachbarn | `heritage_tough` „Zäh“: +3 TP |
| Plänkler | `heritage_quick_blade` „Schnelle Klinge“: +5 Krit | `heritage_nimble` „Leichtfüßig“: +5 Ausweichen |
| Schütze | `heritage_steady_hand` „Ruhige Hand“: +5 Treffer | `heritage_far_aim` „Weiter Blick“: +1 Schaden ab Abstand 2 |
| Elementarist | `heritage_ember_sense` „Glutgespür“: +10 Statuschance | `heritage_focus` „Sammlung“: +1 MAG |
| Heiler | `heritage_gentle_hands` „Sanfte Hände“: +3 Heilung | `heritage_prayer` „Gebet“: +2 WID |
| Späher | `heritage_light_step` „Leichter Schritt“: Wald kostet 1 | `heritage_cover` „Deckung“: +10 Ausweichen im Wald |
| Spielmann | `heritage_luck` „Glück“: +3 GLK | `heritage_cheer` „Zuruf“: Nachbarn +5 Treffer (`aura: { radius: 1 }`) |

**Angenommen** Akt 2 ist erreicht (`unlocks: [{ id: lessons, requires: [{ act: 2 }] }]` im Raum `memorial`)
**Wenn** der Spieler `{ type: 'inheritHeritage', from, to, skill }` schickt
**Dann** gilt: `from` ist ein Gedenkstein (gefallener Gefährte oder Söldner aus `c.fallen` mit `classId`, oder ein fester Stein mit `heritage` wie Gerrit), der noch nie vererbt hat; `to` ist ein lebender Story-Gefährte der Truppe einschließlich Avatar und Kael, kein Söldner, ohne Lektion; in `c.heritageGiven` gibt es für `c.act` noch keinen Eintrag
**Und** erlaubt ist je Stufe der Gedächtnishalle: Stufe 1 die feste Lektion der Rolle des Gefallenen (Gerrit: seine), Stufe 2 eine der zwei Lektionen seiner Rolle (Gerrit: nur seine), Stufe 3 jede der 14 Lektionen (auch bei Gerrit `[ASSUMPTION]`)
**Und** danach trägt der Empfänger `heritage: { skill, from }` am `UnitRecord` (Default `null`), `c.heritageGiven` (Default `[]`) bekommt `{ act, from, to, skill }`, Event `heritageInherited`
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_unit` (Empfänger nicht in der Truppe oder Söldner), `not_available` (Akt < 2, in diesem Akt schon vererbt, Stein hat schon vererbt, Stein ohne Rolle, Empfänger hat schon eine Lektion), `unknown_choice` (Lektion auf dieser Stufe nicht erlaubt).

```yaml
# Vorschlag für content/core/balance.yaml (Produktinhaber 2026-10-31)
memorial:
  heritagePerAct: 1
  heritageChoiceByLevel: [fixed, role, all]
```

**Angenommen** eine Figur mit Lektion
**Wenn** sie kämpft
**Dann** wirkt die Lektion immer wie ein passiver Skill (`activeSkillIds`), ohne Loadout-Platz, in Kampf, Vorschau, KI und Simulation
**Und** die Figur zeigt sie unter Skills mit Herkunft („Lektion · von Fenn“); fällt die Figur, geht die Lektion mit ihr.

**Angenommen** das Panel der Gedächtnishalle (UX-DR11, Mockup 04 „Gedächtnishalle“)
**Wenn** in diesem Akt noch nicht vererbt wurde
**Dann** wählt der Spieler einen Stein (1), darunter steht „Lektion vererben: Fenns ‚Leichter Schritt‘ an …“ mit Lektionswahl (nur ab Stufe 2) und Empfängerliste (2), dann die ruhige Taste „Lektion vererben“ (3); oben „1× in Akt 2“
**Und** ist in diesem Akt schon vererbt, steht dort „In Akt 2 vergeben: Fenn → Tobin“, die Steine bleiben; ein Stein, der vererbt hat, trägt eine kleine Glutmarke
**Und** der Stil bleibt Gedenken: entsättigt bis auf Glutorange, keine Bewegung außer langsamem Ausblenden; Klang später (Audio).

**Angenommen** ein Akt-Wechsel oder ein alter Spielstand
**Wenn** die Kampagne geladen wird
**Dann** ist das Vererben eines Akts nicht nachholbar (es zählt nur `c.act`), Lektionen bleiben über Akte erhalten, Gefallene aller Akte zählen als Steine, und Spielstände ohne die neuen Felder laden mit Defaults
**Und** `tests/unit/heritage.test.ts` deckt ab: jede Stufe (fest, Rolle, alle), Gerrit, Söldner-Stein, Avatar als Empfänger, Söldner als Empfänger abgelehnt, zweite Lektion abgelehnt, zweites Vererben im Akt abgelehnt, Wirkung im Kampf (Vorschau = Auflösung), Replay
**Und** der Handbuch-Eintrag `heritage` (Kategorie Heimat, `fromAct: 2`) erklärt Lektionen; Architektur §5.10/§5.11 („Stand“) nennen `heritage.yaml`.

### Story 10.8: Übungsplatz und Lagerfeuer-Ränge

Als Spieler
möchte ich, dass die Reserve mitwächst und Freundschaften am Lagerfeuer tiefer werden,
damit nicht eingesetzte Gefährten nicht zurückfallen und Supports ihr Ende finden.

**Abhängigkeiten:** nach 10.1 (Raum `training`, `buildRoom` für Lagerfeuer und Übungsplatz); `c.act` aus Story 11.1; A/S-Gespräche der Akt-2-Paare liefert Story 11.21 (Akt-1-Paare haben sie schon).

**Akzeptanzkriterien:**

**Angenommen** der Übungsplatz auf Stufe n

```yaml
# Vorschlag für content/core/balance.yaml (GDD)
training:
  reservePctByLevel: [20, 35, 50]
```

**Wenn** eine Story-Mission oder Heimsuchung gewonnen wird (`finishBattle`)
**Dann** erhält jede Figur der Reserve `round(avg × pct / 100)` EP: Reserve = alle lebenden, nicht eingesetzten Mitglieder der Truppe einschließlich Söldnern (Produktinhaber 2026-10-31, Readiness-Runde R2); `avg` = Durchschnitt der tatsächlich vergebenen EP der eingesetzten, überlebenden Figuren dieser Mission (bei Heimsuchungen also auf ihrer 60-%-Basis) `[ASSUMPTION]`
**Und** die Vergabe läuft über denselben EP-Kern wie im Kampf (aus `grantExp` in `src/core/rules/progression.ts` herausgezogen, nicht kopiert): Stufendeckel des Akts, in Heimsuchungen der Aufhol-Deckel, Level-ups mit `c.rng` in der Reihenfolge der Truppe nach den eingesetzten Figuren `[ASSUMPTION]`
**Und** ohne offenen Übungsplatz (Akt 1, Lager), bei Niederlage, Verlassen oder Neustart und bei `avg = 0` gibt es keine Reserve-EP.

**Angenommen** das Missionsergebnis (Story 6.6)
**Wenn** Reserve-EP vergeben wurden
**Dann** zeigt es die Zeile „Übungsplatz: Reserve +n EP“ (Stern + Zahl) und darunter die Figuren mit Stufenaufstieg; die Daten kommen aus `BattleResult.reserve: Array<{ unit, exp, levelBefore, levelAfter }>` über `resultView.ts`.

**Angenommen** das Panel des Übungsplatzes
**Wenn** der Spieler es öffnet
**Dann** nennt es den Anteil der Stufe („Reserve erhält 20 % der Durchschnitts-EP“, Zahl aus den Daten) und die Reserve der letzten Mission mit ihren EP; das Ausbau-Band nennt den Anteil der nächsten Stufe.

**Angenommen** das Lagerfeuer auf Stufe 2 bzw. 3
**Wenn** ein Paar die Schwelle erreicht (`supports.thresholds` A 45, S 70)
**Dann** öffnen sich Rang A bzw. S (S nur für Kernpaare, `core: true` in `acts/*/supports.yaml`), die Gespräche erscheinen am Lagerfeuer und als Marke in der Truppe (vorhandener Code `campfireMaxRank`, `unlockableRank`)
**Und** das Panel zeigt Gespräche über dem Deckel gesperrt mit Grund („Rang A ab Lagerfeuer Stufe 2“, „Rang S ab Lagerfeuer Stufe 3“, „Rang S nur für Kernpaare“) über eine neue Funktion `campfireLock(data, c, pairKey)`
**Und** Lagerfeuer-Knistern später (Audio).

**Angenommen** die Kettensimulation
**Wenn** `pnpm sim --campaign act2` läuft (vorher Fixture)
**Dann** nennt die Ausgabe je Mission die Reserve-EP und die Durchschnittsstufe der Reserve neben der Armee-Stufe
**Und** `tests/unit/training.test.ts` deckt ab: Anteil je Stufe, Rundung, Söldner in der Reserve, Deckel des Akts, Heimsuchung auf 60-%-Basis, deterministische Level-ups, keine EP bei Niederlage, Lagerfeuer A nach Ausbau auf 2, S nur für Kernpaare nach Ausbau auf 3
**Und** der Handbuch-Eintrag `training` (Kategorie Heimat) nennt den Anteil als Verweis.

### Story 10.9: Händler der Stufen 2 und 3

Als Spieler
möchte ich, dass ein ausgebauter Händler mehr Ware, ein Angebot des Tages, Rabatt und Glutfunken bietet,
damit sich der Ausbau des Händlers lohnt.

**Abhängigkeiten:** nach 10.1 (Stufen) und 10.2 (`ember_spark` als Aufstiegs-Item, Funken-Moment); den Inhalt der Händler-Liste `roomLevel: 2` von Akt 2 nennt Story 11.5 (wer von 10.9 und 11.5 als Zweite gemergt wird, trägt die Liste ein, weil das nicht strikte Händler-Schema das Feld vorher still verwirft); den Rabatt aus E7 setzt Story 11.14 (der aus E4 existiert).

**Akzeptanzkriterien:**

**Angenommen** die Händler-Listen einer Akt-Kampagne (`merchant[]` in `campaign.yaml`, Schema `src/content/schemas.ts`)
**Wenn** eine Liste `roomLevel: 2` trägt (optional, Default 1)
**Dann** erscheint ihr Sortiment nur, wenn der Händler mindestens Stufe 2 hat („größeres Sortiment“); das Sortiment nach Akt-Fortschritt (`merchantTier`) bleibt unverändert
**Und** ein Test mit Fixture-Liste zeigt die Liste erst nach `buildRoom merchant`.

**Angenommen** der Händler auf Stufe 3 (`economy.dailyOfferFromMerchantLevel: 3`)
**Wenn** der Spieler ihn öffnet
**Dann** zeigt ein eigener Abschnitt „Angebot des Tages“ die schon erzeugten Angebote `c.offers` (1–2 Items mit Affix, erneuert wie heute nach jeder Story-Mission durch `refreshOffers`) mit Item-Bild, Affix, Preis; Kauf über das vorhandene Command `buyOffer`
**Und** unter Stufe 3 erscheint der Abschnitt nicht.

**Angenommen** Rabatte aus Entscheidungen (`priceMod` mit negativem `pct`, z. B. E4 „secret“ und E7 „obey“, je −10 %) und der Händler-Rabatt

```yaml
# Vorschlag für content/core/balance.yaml
economy:
  merchantDiscountByLevel: [0, 0, 10]
  maxDiscountPct: 30               # Produktinhaber 2026-10-31: Rabatte addieren sich bis −30 %
  dailyOfferFromMerchantLevel: 3
  emberShop: { fromMerchantLevel: 3, total: 3, maxOffered: 1 }   # Preis = items.ember_spark.price (3 000)
```

**Wenn** der Spieler kauft
**Dann** rechnet `shopPrice` den Gesamtrabatt als Summe aller aktiven `priceMod`-Prozente des Akts plus Händler-Rabatt der Stufe, höchstens 30 %; Verkaufen bleibt 50 % des Grundpreises
**Und** das Panel zeigt den Gesamtrabatt als Marke („−20 %“); Tests decken −10, −20, −30 und eine Summe über 30 (gedeckelt) ab
**Und** nur diese Story baut Summe und Deckel (Schlüssel `economy.maxDiscountPct`); Story 11.14 setzt nur den `priceMod` von E7 und legt keinen eigenen Schlüssel an.

**Angenommen** der Händler auf Stufe 3 und `c.emberShop = { sold, lastSoldAtStory }` (Default `{ sold: 0, lastSoldAtStory: null }`)
**Wenn** weniger als 3 Glutfunken verkauft sind und seit dem letzten Kauf mindestens eine weitere Story-Mission abgeschlossen ist (Zahl aller abgeschlossenen Story-Missionen über alle Akte > `lastSoldAtStory`)
**Dann** steht genau ein Glutfunke im Angebot für ● 3 000 (fester Preis ohne Rabatt, Produktinhaber 2026-10-31, Readiness-Runde R2); `{ type: 'buyEmberSpark' }` zieht das Gold ab, legt ihn in den Konvoi, setzt `sold + 1` und `lastSoldAtStory`, Events `goldChanged`, `itemGained`; der Funken-Moment aus Story 10.2 spielt
**Und** Fehler ohne Änderung: `not_available` (Stufe < 3, nicht im Angebot, alle 3 verkauft), `not_enough_gold`.

**Angenommen** die Funktionen dieser Story
**Wenn** die Tests laufen
**Dann** decken `tests/unit/merchant-levels.test.ts` jede Stufen-Schwelle, jeden Fehlercode, die Liste `roomLevel: 2`, das Angebot des Tages, den Rabatt-Deckel und die Glutfunke-Rotation (erster sofort ab Stufe 3, zweiter erst nach der nächsten Story-Mission, nach 3 Schluss, nie rabattiert) ab; Replay gleich
**Und** die Kettensimulation kauft Glutfunken, sobald ● 3 000 frei sind, und meldet sie; der Handbuch-Eintrag `rooms_upgrade` nennt die Händler-Stufen als Verweise.

### Story 10.10: Konvoi der Stufen 2 und 3

Als Spieler
möchte ich mit einem ausgebauten Konvoi Ausrüstungs-Vorlagen speichern und das Beste mit einem Tipp anlegen,
damit das Umrüsten der wachsenden Truppe schnell geht.

**Abhängigkeiten:** nach 10.1 (Stufen); Ausrüsten-Vergleich aus Story 6.2; `autoEquip` der Söldner aus Story 6.4.

**Akzeptanzkriterien:**

**Angenommen** der Konvoi auf Stufe 2 und eine Figur
**Wenn** der Spieler in der Figur „Als Vorlage speichern“ tippt (`{ type: 'saveGearTemplate', unit }`)
**Dann** speichert `UnitRecord.gearTemplate` (Default `null`) die Item-Uids ihrer 6 Ausrüstungs- und 3 Beutelplätze, eine Vorlage je Figur `[ASSUMPTION]`
**Und** „Vorlage anlegen“ (`{ type: 'applyGearTemplate', unit }`) legt diese Items aus dem Konvoi bzw. der eigenen Ausrüstung an, gibt die abgelösten Items in den Konvoi, überspringt verkaufte Items und Items anderer Figuren und nennt diese im Toast („Bei Brenna: Eisenlanze“) `[ASSUMPTION]`
**Und** Fehler ohne Änderung: `not_available` (Konvoi < 2, keine Vorlage), `convoy_full`.

**Angenommen** der Konvoi auf Stufe 3 und eine Figur
**Wenn** der Spieler „Bestes anlegen“ tippt (`{ type: 'equipBest', unit }`)
**Dann** legt der gemeinsame Kern von `autoEquip` (wie bei Söldnern, nicht kopiert) aus Konvoi und eigener Ausrüstung die führbare Waffe mit der höchsten Mt (Gleichstand: Treffer, dann Uid) und je Rüstungsplatz das Teil mit der höchsten Summe VER + WID (Gleichstand: VER) an; Items anderer Figuren, Zubehör und Beutel bleiben unberührt `[ASSUMPTION]`
**Und** die Ausrüsten-Ansicht zeigt das Ergebnis mit dem Vergleich grün/rot aus Story 6.2.

**Angenommen** die Funktionen dieser Story
**Wenn** die Tests laufen
**Dann** decken `tests/unit/convoy-levels.test.ts` Vorlage speichern und anlegen (auch übersprungene Items), „Bestes anlegen“ mit allen Gleichständen, jeden Fehlercode und die Stufen-Schwellen ab; Replay gleich
**Und** der Handbuch-Eintrag `rooms_upgrade` nennt die Konvoi-Stufen als Verweise.

### Story 10.11: Taverne, Heiler und Schmied der Stufen 2 und 3

Als Spieler
möchte ich, dass ausgebaute Taverne, Heiler und Schmied neue Möglichkeiten bekommen,
damit sich ein Ausbau nicht nur in Zahlen zeigt.

**Abhängigkeiten:** nach 10.1 (Stufen); Taverne aus Story 6.4, Trauer aus Epic 6; `economy.potionUpgrade` existiert; Söldner-Traits in Story 10.12.

**Akzeptanzkriterien:**

**Angenommen** die Taverne auf Stufe 3 (`economy.tavern.wishRoleFromLevel: 3`)
**Wenn** der Spieler eine Wunschrolle wählt (`{ type: 'setTavernWish', role }`, Rollen aus `economy.tavern.classes`, `role: null` hebt sie auf)
**Dann** enthält die nächste Angebotsrunde (`refreshTavern` nach der nächsten Story-Mission) sicher ein Angebot dieser Rolle (ersetzt das erste gezogene Angebot, falls keins dieser Rolle dabei ist), danach ist der Wunsch verbraucht; `c.tavernWish` (Default `null`) und die Ziehung laufen über `c.rng`
**Und** das Panel zeigt die gewählte Rolle als Marke; unter Stufe 3 gibt es die Wahl nicht.

**Angenommen** der Heiler auf Stufe 3

```yaml
# Vorschlag für content/core/balance.yaml (GDD; Stufe nach Lückenanalyse A8 [ASSUMPTION])
supports:
  griefMissionsByHealerLevel: [3, 3, 2]   # ersetzt griefMissions: 3
```

**Wenn** ein Support-Partner fällt
**Dann** dauert die neu entstehende Trauer 2 statt 3 Missionen (`finishBattle` liest die Zahl über eine Funktion in `camp.ts`); laufende Trauer bleibt unverändert `[ASSUMPTION]`.

**Angenommen** der Schmied auf jeder Stufe und ein Heiltrank (Verbrauchsgut mit `use.heal`, z. B. `vulnerary`)
**Wenn** der Spieler „Trank verstärken“ wählt (`{ type: 'upgradePotion', item }`)
**Dann** kostet die erste Verstärkung ● 400, die zweite ● 900, jede gibt +5 Heilung (`economy.potionUpgrade`, existiert); die Item-Instanz trägt die Stufe als Zahl („+1“), höchstens 2; erst ab Akt 2 (Produktinhaber 2026-10-31, Readiness-Runde R2; Schlüssel `economy.potionUpgradeFromAct: 2` `[ASSUMPTION]`, kein `if` im Code)
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_item` (keine Item-Instanz mit dieser Uid), `not_available` (Akt < 2, kein Heiltrank, schon +2), `not_enough_gold`; die Taste nennt den Betrag.

**Angenommen** die Funktionen dieser Story
**Wenn** die Tests laufen
**Dann** decken `tests/unit/room-functions.test.ts` Wunschrolle, Trauer 2 statt 3, Trank verstärken (auch die Ablehnung in Akt 1), jeden Fehlercode und die Stufen-Schwellen ab; Replay gleich
**Und** der Handbuch-Eintrag `rooms_upgrade` nennt die Stufen von Taverne, Heiler und Schmied als Verweise.

### Story 10.12: Söldner-Traits

Als Spieler
möchte ich, dass Söldner aus der Taverne Eigenheiten haben und eine ausgebaute Taverne bessere bringt,
damit die Wahl zwischen Angeboten mehr ist als der Preis.

**Abhängigkeiten:** nach 10.1 (Taverne-Stufen) und 10.11 (Wunschrolle); Taverne aus Story 6.4; Liste aus `concept/21-gdd/extract-01-decisions.md` Z. 50.

**Akzeptanzkriterien:**

**Angenommen** `content/core/traits.yaml` (Schema `traitSchema`: `{ id, kind: good | bad, effect?: <Bausteine passiver Skills>, hireCostPct?: number }`, Namen `trait.<id>.name|desc` DE/EN)
**Wenn** `pnpm content:check` läuft
**Dann** gibt es genau diese sieben Traits mit Werten `[ASSUMPTION]`:

| Id | Name | Art | Wirkung |
|---|---|---|---|
| `tough` | Zäh | gut | `stats: { hp: 4 }` |
| `nimble` | Flink | gut | `stats: { spd: 2 }` |
| `veteran` | Veteran | gut | `stats: { skl: 2, lck: 2 }` |
| `elemental_child` | Elementkind | gut | `stats: { mag: 2, res: 2 }` |
| `greedy` | Gierig | schlecht | `hireCostPct: 25` (Anheuern 25 % teurer) |
| `coward` | Feigling | schlecht | `stats: { str: -2, mov: 1 }` |
| `clumsy` | Unbeholfen | schlecht | `stats: { skl: -2 }`, `hitBonus: -5` |

**Angenommen** die Taverne auf Stufe n

```yaml
# Vorschlag für content/core/balance.yaml [ASSUMPTION]
economy:
  tavern:
    traitCount: [1, 2]                    # 1 oder 2 Traits je Angebot, gleich wahrscheinlich
    goodTraitChanceByLevel: [50, 75, 75]  # Stufe 2 = „bessere Traits“
```

**Wenn** `refreshTavern` Angebote zieht
**Dann** bekommt jedes Angebot 1–2 verschiedene Traits, jeder Platz mit der Wahrscheinlichkeit der Stufe aus den guten, sonst aus den schlechten, alles aus `c.rng` in fester Reihenfolge
**Und** die Traits stehen in `UnitRecord.traits` (Default `[]`), wirken als passive Bausteine über `activeSkillIds`/Werte in Kampf, Vorschau und Simulation, und `Gierig` erhöht `recruitCost` im Angebot und im Command `hire` gleich.

**Angenommen** das Taverne-Panel und die Figur
**Wenn** ein Söldner Traits hat
**Dann** zeigt er sie als Marken (gute in Grün, schlechte in Rot, Name + Info-Stein mit Wirkung), der Preis enthält den Aufschlag
**Und** Story-Gefährten haben keine Traits.

**Angenommen** die Tests
**Wenn** sie laufen
**Dann** deckt `tests/unit/traits.test.ts` ab: Zahl und Verteilung je Stufe über einen festen Seed, keine doppelten Traits, Wirkung jedes Traits, Gierig im Preis, alte Söldner ohne Feld laden; Replay gleich
**Und** der Handbuch-Eintrag `tavern` nennt die Traits mit Wirkung.

### Story 10.13: Anhängeteile der Profi-Wege

Als Spieler
möchte ich einer aufgestiegenen Figur auf dem Brett ansehen, welchen Profi-Weg sie gewählt hat,
damit Aufstiege auch sichtbar etwas ändern.

**Abhängigkeiten:** nach 10.3 (Feld `proPart`); Tripo-Pipeline aus Story 8.2; Art Direction §4.2 und §4.6; blockiert keine andere Story.

**Akzeptanzkriterien:**

**Angenommen** die 16 Profi-Wege
**Wenn** die Teile gebaut sind
**Dann** gibt es je Weg genau ein Anhängeteil als GLB unter `art/models/parts/<id>.glb`, gebaut mit `tools/art/blender_parts.py` (eigene Modellierung in Blender, bei Bedarf Bild-zu-3D mit Tripo nach §4.6), im Budget aus `concept/16-asset-pipeline.md`, im Toon-Look mit Kontur:

| Klasse | Teil (`proPart`) | Sockel |
|---|---|---|
| `bulwark` | `tower_shield` Turmschild | `back` |
| `breaker` | `ram_axe` Rammaxt | `back` |
| `blade_dancer` | `second_blade` Zweitklinge | `back` |
| `duelist` | `feather_beret` Federbarett | `head` |
| `sharpshooter` | `feather_hat` Federhut (der Langbogen kommt aus der Waffe) | `head` |
| `ranger` | `leaf_cloak` Blätterumhang | `back` |
| `sage` | `pointed_hat` Spitzhut | `head` |
| `hexer` | `raven_collar` Rabenkragen | `back` |
| `bishop` | `mitre` Mitra | `head` |
| `battle_priest` | `war_hammer` Kriegshammer am Rücken | `back` |
| `bard` | `great_lute` große Laute am Rücken | `back` |
| `standard_bearer` | `back_banner` Rückenbanner | `back` |
| `shadow` | `half_mask` Halbmaske | `head` |
| `trapper` | `trap_belt` Fallengurt | `back` |
| `grand_strategist` | `general_cloak` Feldherrnumhang | `back` |
| `banner_lord` | `standard` Standarte | `back` |

`[ASSUMPTION]` Liste nach Lückenanalyse A20; die Namen erscheinen schon in Akademie und Figur (`part.<classId>.name`).
**Und** `render.yaml` ordnet unter `gear.proParts` jedem Teil Modell und Sockel zu; der Rig der Tripo-Figuren bekommt die Sockel `socket_back` und `socket_head` (`tools/art/prepare_tripo_unit.py`).

**Angenommen** eine Figur mit Profi-Klasse auf dem Brett
**Wenn** der Kampf startet
**Dann** hängt das Teil ihrer Klasse am Sockel der vorhandenen Figur (kein neues Figurenmodell), für alle Figuren dieser Klasse gleich, auch für Gegner mit Profi-Klasse; Figuren ohne Sockel (Blender-Figuren) zeigen kein Teil, ein Test listet sie
**Und** das Teil bewegt sich mit Idle, Lauf und Angriff, verdeckt weder Lebensleiste noch Groll-Wimpel, und die Bildrate bleibt über den Zielen aus Story 7.8.

**Angenommen** die Auflagen für KI-Assets
**Wenn** ein Teil mit Tripo oder nach einer ChatGPT-Vorlage entsteht
**Dann** stehen Prompt, Werkzeug, Eigenanteil und Abnahme in `art/prompts/part_<id>.md` nach `licensing.md` §6
**Und** je Teil gibt es einen Screenshot bei 375 × 812 auf dem Brett zur Abnahme.

### Story 10.14: Burg-Grafik nach der 3D-Entscheidung

Als Spieler
möchte ich sehen, wie die Paktwacht mit jedem Ausbau und jedem Gefährten wächst und wo Gefallene fehlen,
damit die Heimat lebendig wirkt.

**Abhängigkeiten:** erst nach der Entscheidung des Produktinhabers „3D oder Bild“ auf Grundlage des 3D-Testaufbaus der Session epic10-castle (Branch `claude/epic10-castle-2a96a1`: `src/render/home/castle.ts`, `src/app/screens/Castle3d.tsx`, Screenshots in `_bmad-output/planning-artifacts/handoff-epic10/`, Messung auf echtem Gerät); nach 10.1 (Stufen); die Liste der Gegenstände nimmt der Produktinhaber als Narrative-Vorschlag ab.

**Akzeptanzkriterien:**

**Angenommen** die Entscheidung des Produktinhabers
**Wenn** die Story beginnt
**Dann** steht sie in `concept/23-art-direction/decision-log.md` und `concept/25-ux/.decision-log.md`; `EXPERIENCE.md` („Burg in 3D“) und Art Direction §7 sind nachgezogen; Raumsteine, Raum-Panels und ≤ 2 Taps bleiben unverändert
**Und** der Spike-Code wird bei „3D“ zu Produktionscode umgebaut, bei „Bild“ gelöscht.

**Angenommen** die Daten (für beide Ausgänge)
**Wenn** `pnpm content:check` läuft
**Dann** trägt jeder vorhandene Story-Gefährte (die 15 aus `content/acts/act1` und `act2`) in `charSchema` ein Feld `homeObject` (Id des Gegenstands; Pflicht für jeden Gefährten in `content/acts/*/units.yaml`), `content/home/home.yaml` hat unter `castle` je Gegenstand einen festen Platz (`objects: [{ id, char, at, asset }]`) und je Raum und Stufe ein Ausbauteil (`parts: [{ room, level, asset }]`), und jedes Asset existiert
**Und** die Gegenstände sind ein Narrative-Vorschlag `[ASSUMPTION]`, eingetragen in `concept/22-narrative/narrative.md` („Die Paktwacht wächst mit“) und dessen Decision-Log:

| Gefährte | Gegenstand | Gefährte | Gegenstand |
|---|---|---|---|
| Brenna | Axtständer | Nell | Seekarte mit Kompass |
| Tobin | Holzschild mit selbstgemaltem Wappen | Brann | aufgeschichtetes Steinmännchen |
| Mira | Trockengestell mit Fellen | Amos | Feldschertasche mit Kräuterbund |
| Fenn | Kiste voller Krimskrams mit Dietrichrolle | Ilka | Hirschgeweih an der Wand |
| Liora | kleiner Hausaltar mit Kerzen | Sable | Säbel des Grenzheers auf Ständer |
| Varek | Würfelbrett | Mael | Gardehelm der Paktgarde |
| Ysolde | Bücherstapel | Pell | Laterne der Stadtwache |
| Grosk | großer Kochkessel | Vesna | Drachenknochen auf Sockel |
| Jory | Laute | Kit | Schlüsselbund des Palasts |
| Odile | polierter Brustpanzer auf Ständer | Harlan | Notenständer mit Pergament |

**Und** die Gegenstände der Akt-3-Gefährten (Mael, Pell, Vesna, Kit, Harlan) sind hier nur ein Hinweis für Epic 12: Daten, Plätze und Assets dafür liefert Epic 12 mit den Gefährten; diese Story prüft sie nicht.

**Angenommen** die reine Funktion `castleScene(data, c)` (liest nur `c.roster`, `c.fallen`, `c.left`, `c.home`, kein neuer Zustand)
**Wenn** ein Gefährte beitritt, fällt oder geht
**Dann** liefert sie je Platz den Zustand: beigetreten → Gegenstand steht an seinem Platz; gefallen → der Gegenstand bleibt liegen, der Platz ist leer (entsättigt, Gedenken-Stil), und die Gedächtnishalle hat seinen Stein; gegangen → er nimmt den Gegenstand mit, der Platz ist leer, kein Stein; nie beigetreten → nichts; Söldner haben keinen Platz
**Und** je Raum das Ausbauteil seiner Stufe (Stufe 1 Gerüst und Planen, Stufe 2 Dach und Fenster, Stufe 3 Banner, Licht und Leben)
**Und** Unit-Tests decken alle Zustände ab.

**Angenommen** Ausgang „3D“
**Wenn** die Heimat die Burg ist
**Dann** zeichnet `src/render/home/` die Burg als Diorama auf dem Szenen-Host mit eigenen Burg-Modellen (Blender/Tripo, Prompts und Eigenanteil nach `licensing.md` §6), Ausbauteilen und Gegenständen als Modelle an den Plätzen aus `home.yaml`, abendlichem Licht aus `render.yaml`; Antippen eines Raums öffnet sein Panel
**Und** die Ansicht zeichnet nur bei Änderung neu (keine dauernd schwingende Kamera), zeigt beim Laden die Ladeanzeige aus Story 7.6, bleibt als eigener Chunk im Bundle-Budget und hält auf dem Referenzgerät die Ziele aus Story 7.8.

**Angenommen** Ausgang „Bild“
**Wenn** die Heimat die Burg ist
**Dann** liegen über `paktwacht_ruine` je Raum und Stufe gemalte, freigestellte Ausbauteile am Anker und an jedem Platz der gemalte Gegenstand (ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/<id>.md`, `licensing.md` §6, Bilder in Git LFS); Positionen in Prozent aus `home.yaml`
**Und** jedes Bild liegt in mindestens doppelter Anzeigegröße vor (keine sichtbare Vergrößerung bei 375 × 812 und am Desktop) `[ASSUMPTION]`, die Anker-Punkte und -Pfeile aus Story 10.1 bleiben lesbar.

**Angenommen** beide Ausgänge
**Wenn** die Story fertig ist
**Dann** belegen Screenshots bei 375 × 812 die Burg mit allen Räumen auf Stufe 1, 2 und 3 sowie einen gefallenen und einen gegangenen Gefährten
**Und** Burg-Atmosphäre und Raumklänge später (Audio).
