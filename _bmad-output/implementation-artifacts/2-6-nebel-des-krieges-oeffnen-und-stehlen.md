# Story 2.6: Nebel des Krieges, Öffnen und Stehlen

Status: review

## Story

Als Spieler
möchte ich auf Nebelkarten nur sehen, was meine Truppe sieht, und mit Spähern Türen, Truhen und Taschen öffnen,
damit Späher eine eigene Aufgabe haben.

## Acceptance Criteria

1. **Sicht:** Auf einer Karte mit `fog: true` berechnet `visibleTiles(state, team)` im Kern die Sicht (Basis 3, Schütze/Späher +2, Flieger +1; Mauern und geschlossene Türen blockieren). Auf Karten ohne `fog` ist alles sichtbar.
2. **Anzeige:** Brett und UI zeigen nur Sichtbares. Events auf unsichtbaren Feldern werden vor dem Abspielen gefiltert; die Vorschau verrät nichts Verborgenes.
3. **Öffnen:** Ein Späher neben einer Tür oder auf bzw. neben einer Truhe wählt „Öffnen“ und öffnet ohne Schlüssel.
4. **Stehlen:** Ein Späher neben einem Gegner wählt „Stehlen“ und nimmt ein nicht ausgerüstetes Item in den Beutel (oder in den Konvoi, wenn der Beutel voll ist).
5. Auf Nebelkarten hat der Späher +2 Sicht. Alle Zahlen in `balance.yaml`; Kern-Tests in `src/core`, Replays bleiben deterministisch.

## Tasks / Subtasks

- [x] T1 Zahlen und Schema: `balance.yaml › fog` = `{ baseVision: 3, roleBonus: { marksman: 2, scout: 2 }, moveTypeBonus: { flier: 1 }, blockers: [wall, door, rockwall] }`; Typ in `defs.ts`, strenges Zod-Schema in `schemas.ts`, `content:check` prüft Rollen und Gelände-Ids. Stehlen braucht keine Zahlen (kein Wurf).
- [x] T2 Sicht im Kern: `src/core/rules/vision.ts` mit `visibleTiles(data, s, team)`, `isVisible`, `visionRadius`, `fogOn`, `visibleState` (Zustandskopie ohne unsichtbare Gegner und Beute) und `fogBands` (Nebel-/Randfelder fürs Brett). Reiner Kern, kein Zufall.
- [x] T3 Commands/Aktionen: `Action` um `open{object}` und `steal{target,item}`; `availableActions`/`actionValid`/`doAction`; neue Datei `src/core/rules/scout.ts` (Öffnen-Ziele, Stehlbares, `goesToConvoy`, Vorschau, Grund fürs gedimmte Feld). Keine neuen `CommandError`-Codes.
- [x] T4 Vorschau: `classPreview` um `steal` (Beutel des Ziels, je Item „→ Konvoi“, Beutel voll).
- [x] T5 Event-Filter: `filterEvents(data, s, events, team, before?)` im Kern; läuft in der UI vor `board.play`, nie auf Zustand, Log oder Replay.
- [x] T6 Brett und UI: Overlay-Listen `fog` und `fogEdge` in `overlays.ts`; `Battle.tsx` arbeitet auf `visibleState` (Brett, Vorschau, Aktionslisten, Gefahrenzone, Sprechblasen), blendet Verstärkungs-Ankündigungen und Gegnerzahl im Nebel aus; Stehlen-Blatt, Öffnen-Band, Klassen-Platz des Spähers.
- [x] T7 Testkarte: Entwicklerkarte `tests/fixtures/maps/dev_fog.yaml` (Nebel, Tür, Truhe, Späher, drei Gegner), geladen über `tests/fixtures/devFogMap.ts`; keine Spielkarte geändert, kein Paket, kein Kampagnen-Graph.
- [x] T8 Tests `tests/unit/fog.test.ts` (35) und `tests/unit/open-steal.test.ts` (20).
- [x] T9 Texte de/en, Rollen-Icon `steal` (Beutel) für den Klassen-Platz des Spähers.
- [x] T10 Sim je Karte (unverändert), Eintrag in `concept/21-gdd/decision-log.md`.

## Dev Notes

### Was es schon gibt (nicht neu bauen)

- Karten-Schema kennt `fog: boolean` (`schemas.ts:326`, `defs.ts:399`), nutzt es aber nirgends; alle Akt-1-Karten stehen auf `false`.
- Objekte: `MapObjectDef`/`ObjectState` mit `type: village|chest|door|lever|ballista`, `state: closed|open|visited|razed`. Eine Tür ist **beides**: Terrain `door` (Pfad gesperrt, `cost` null) plus Objekt `door`; beim Öffnen setzt `apply.ts` das Terrain auf `door_open` und sendet `opened` + `terrain`. Truhen sind nur Objekte (Inhalt `contents`, Statistik `chestsOpened`, Ziele `open_chests`/`treasure`).
- Öffnen heute: `hasKey` (Item mit `use.open`, z. B. `door_key`, 1 Ladung) in `battle/actions.ts`; Truhe nur vom Truhenfeld aus, Tür vom Nachbarfeld aus. Nur für `player`. Das UI hat bereits `chest`/`door` in `BattleHud.tsx` (`CONTEXT_ORDER`) und `Battle.tsx` (`doAction`). Es gibt dazu keine Tests.
- Späher: Klasse `scout` (Rolle `scout`, MOV 6, Dolch/leichter Bogen, `classAction: { id: open_steal }`, Skill `climber`); Pro-Pfade `shadow`, `trapper` kommen später (nicht Teil dieser Story).
- Beutel: `balance.bag.size = 3`; `giveItem` (`apply.ts`) legt in den Beutel oder, wenn voll, `convoyOnly` bzw. Rune, in den Konvoi `s.convoy` und sendet `loot{toConvoy}`. Das passt für das Ziel „Beutel, sonst Konvoi“ von Stehlen.
- Gegner haben `bag: ItemInstance[]` (Beutel = nicht ausgerüstete Items) und Ausrüstungs-Slots (`equip`).
- Item `torch` (`use.vision: 4, duration: 3`) und Wind-Zauber (`balance.elementEffects.windFogClearRadius: 2`, Story 2.5) sind vorbereitet, aber noch ohne Wirkung: die Sicht-Berechnung sollte dafür einen Erweiterungspunkt haben (zusätzliche Sichtquellen/gelichtete Felder), umgesetzt wird er erst mit 2.5 bzw. wenn F10 es verlangt.
- Der Kern kennt keine Sichtbarkeit: `ai.ts`, `autoplay.ts`, `dangerZone`/`threatTiles` und `availableActions` arbeiten auf dem vollen Zustand.

### Render und UI (nur gelesen)

- `BoardView` (`src/render/board.ts`, 1421 Zeilen): `syncUnits(state)` setzt je Einheit `v.visible = true`; `Overlays` kennt `move/attack/heal/danger/path/targets/goal/reinforce` (Farbflächen auf Feldern, `OVERLAY`-Tabelle); `play(events, finalState)` spielt Events nacheinander ab (`moved` zentriert die Kamera auf das Ziel, `aiTurn` auf die Einheit) und hängt HTML-Marken (TP, Verblutung, Sprechblasen) in `floatLayer`.
- `Battle.tsx`: `dangerTiles` aus `dangerZone(data, s, 'player', …)`, `reachOf`/`destinations`, `board.setOverlays(...)`, `board.play(ev, state)` an zwei Stellen (Zeile ~172 und ~283), Umschalter „Gefahr“ im Dock (Taste `D`).
- Nebel-Look laut `art-direction.md`: „nicht sichtbare Felder dunkel-entsättigt mit Blaustich, weicher Übergang über 1 Feld; Gelände bleibt erkennbar, Einheiten verschwinden“. Farbtoken `fog` (`#E0E5EF`) in DESIGN.md gilt nur für gesperrte Weltkarten-Regionen, nicht für das Brett. EXPERIENCE.md und DESIGN.md sagen **nichts** zu Nebel auf dem Brett, zum Gefahr-Umschalter im Nebel oder zu Öffnen/Stehlen außer dem Kontext-Band „Öffnen“ (Story 2.7).

### Abgrenzung

- **Kern zuerst:** `visibleTiles`, Filter, Aktionen und Tests sind unabhängig vom Renderer und können allein geliefert werden.
- **Konflikt mit `render/board` und `content/world/`:** Eine andere Session baut beides um. Diese Story darf dort nichts ändern. Die Nebel-Darstellung (Dunkeltönung der Felder, Ausblenden der Figuren und ihrer HTML-Marken, Filter beim Abspielen) braucht aber `board.ts` oder `terrain3d.ts`. Vorschlag: Der Kern liefert `visibleTiles` und `filterEvents`; im UI (`Battle.tsx`) wird aus dem Nebel eine **Overlay-Liste** (`fog: Pos[]`, kommt über das bestehende `setOverlays`-Muster) und eine gefilterte Event-Liste an `board.play` übergeben. Das Ausblenden der Figuren geht ohne Renderer-Änderung nur, indem das UI dem Brett einen gefilterten `BattleState` gibt (`syncUnits` zeigt, was in `state.units` steht). Das Overlay selbst und der weiche Übergang verlangen eine kleine Erweiterung von `Overlays`/`OVERLAY` in `board.ts`. **Bis die Umbau-Session fertig ist, wartet T6 (Darstellung) oder koordiniert sich mit ihr; T1–T5, T7–T9 sind frei.**
- **Story 2.7** (Kontext-Band „Öffnen“, noch nicht erstellt) setzt auf `open`/`steal` und die Reihenfolge Bergen < Ansprechen < Besuchen < Öffnen auf; 2.6 liefert Aktion und Dock-Platz, 2.7 das Band. `Stehlen` steht in 2.7 nicht (F14).
- **Story 2.8** (Gegnerphase im Web Worker) baut eine andere Session. Die neuen Funktionen bleiben rein und serialisierbar (`visibleTiles` nimmt `data` und `state`, gibt Daten zurück); `filterEvents` läuft in der UI, nicht im Worker.
- Fallensteller/Schatten (Pro-Pfade, FR15) und Lichtstrahlen/Fackel sind **nicht** Teil dieser Story.

### Entscheidungen des Produktinhabers (2026-10-24), alle Fragen F1–F16 entschieden

- **F1 Sicht je Rolle:** Schlüssel auf Rollen umgestellt (`marksman`, `scout` +2), Flieger über die Bewegungsart (+1); Boni stapeln nicht, der höchste zählt.
- **F2 Sichtart:** Radius (Manhattan) mit Sichtlinie auf dem Raster; das Blockerfeld selbst bleibt sichtbar. Umsetzung: Bresenham von beiden Enden, frei wenn eine Richtung frei ist (symmetrisch).
- **F3 Blocker:** Mauer, geschlossene Tür, Felswall.
- **F4 Öffnen und Schlüssel:** Der Späher öffnet per `open{object}` Türen und Truhen ohne Schlüssel, auch vom Nachbarfeld, ohne Ladung. Der Schlüsselweg (`chest`, `door`) bleibt für alle wie heute.
- **F5 Tür:** bleibt gekoppelt aus Terrain `door` und Objekt `door`; `content:check` verlangt das Terrain unter jedem Tür-Objekt.
- **F6 Stehlen:** Der Spieler wählt ein nicht ausgerüstetes Item aus dem Beutel eines benachbarten Gegners; kein Wurf, kein Gewichts-/Stärkevergleich; verbraucht die Aktion; `convoyOnly` ausgenommen; Bosse erlaubt. Voller Beutel → Konvoi.
- **F7 Vorschau:** zeigt den Beutel, nur bei sichtbarem Ziel.
- **F8 Bewegung aus dem Nebel:** Pfad auf den sichtbaren Teil kürzen; die Kamera folgt unsichtbaren Einheiten nicht.
- **F9 Testkarte:** Fixture-Tests und eine kleine Entwicklerkarte außerhalb von Paketen und Kampagnen-Graph; keine Spielkarte.
- **F10 KI:** sieht alles; Nebel nur für die Spielerseite.
- **F11 Gedächtnis:** keines.
- **F12 Gefahr-Modus:** nur sichtbare Gegner.
- **F13 Ziele und Anzeige:** Zielfelder und Zähler bleiben sichtbar; Verstärkungs-Ankündigungen und die Gegnerzahl nicht.
- **F14 Band:** Öffnen gehört später ins Kontext-Band (Story 2.7), Stehlen auf den Klassen-Platz des Spähers; 2.6 liefert beides, `open` steht schon in `CONTEXT_ORDER` (nach „Besuchen“).
- **F15 Beutel voll:** Hinweis über das bestehende `loot{toConvoy}` („→ Konvoi“); die Vorschau sagt es vorab.
- **F16 Truhe ohne Späher:** nur mit Schlüssel, wie bisher.

### Weitere Entscheidungen des Produktinhabers (2026-10-25) zu den Fragen N1–N7, umgesetzt

- **N1 Hinterhalt:** Führt der Weg der Spielerseite durch einen im Nebel verborgenen Gegner (oder in die Haltezone eines unsichtbaren Vorkämpfers, wenn der Weg weitergeht), hält die Einheit auf dem letzten freien Feld davor, der Gegner wird aufgedeckt (Event `ambush`) und der Zug der Einheit endet (`acted`). Gilt für `move`, `act` (die Aktion entfällt) und `pursue`. Umsetzung: die Befehle tragen optional den geplanten Weg (`path`), den die UI auf der sichtbaren Sicht plant; der Kern läuft ihn ab (`walkPath` in `movement.ts`) und entscheidet allein aus dem Zustand. Ohne `path` (KI, Tests, Karten ohne Nebel) verhält sich alles wie zuvor. Der Befehl samt Weg steht im Log, ein Replay läuft identisch; der Kern hängt nicht vom UI-Filter ab. Ein illegaler Weg (falscher Start, kein Nachbarschritt, zu teuer, endet nicht auf `to`) wird als `unreachable` abgelehnt.
- **N2 Kampf aus dem Nebel:** Ein Gegner im Nebel wird für die Dauer des Kampfes aufgedeckt (`spawned` mit `at` am Kampfanfang, `retreated` am Kampfende) und verschwindet danach wieder. Der Filter braucht dafür das Einheitenverzeichnis des vollen Zustands: `board.play(events, state, pool)` (ein optionaler dritter Parameter, eine Zeile in `board.ts`).
- **N3–N7** bestätigt wie umgesetzt (verbündete dritte Partei teilt die Sicht, `open` ersetzt `chest`/`door` beim Späher, Fackel ohne Wirkung, flache Nebelfläche, Props im Nebel sichtbar).
- **Dev-Start:** `await __hc.devMap(id?)` (Standard `dev_fog`) in `flow.ts` unter `import.meta.env.DEV`: lädt `tests/fixtures/maps/<id>.yaml` per `import.meta.glob` und dynamischem Import (nur im Dev-Build, `pnpm build` enthält die Karte nicht: `dev_fog` kommt in `dist` nicht vor), legt Karte und Knoten an, schaltet das Speichern ab (`devSaveFailure`) und startet den Kampf mit der Truppe der geladenen Kampagne. Weitere Fixture-Karten (z. B. Story 4.8) hängen sich ein, indem man die YAML nach `tests/fixtures/maps/` legt. Vorher einen Spielstand laden.

## Voraussichtlich berührte Dateien

- `content/core/balance.yaml` (fog, ggf. classActions.steal), `content/core/locales/{de,en}.yaml`, ggf. `content/core/classes.yaml` (nur Klassen-Aktions-Daten, falls F1 es verlangt)
- `src/content/schemas.ts`, `src/content/validate.ts` (Tür-Objekt ↔ Terrain, F5), `src/core/defs.ts`
- `src/core/rules/vision.ts` (neu), `src/core/battle/{commands,actions,apply}.ts`, `src/core/events.ts`, `src/core/index.ts` (Export)
- `src/app/screens/Battle.tsx`, `src/app/screens/BattleHud.tsx`, `src/ui/icons.tsx`
- `src/render/board.ts` (nur Nebel-Overlay, Konflikt mit Umbau), `src/render/terrain3d.ts` (Alternative)
- `tests/unit/fog.test.ts`, `tests/unit/open-steal.test.ts` (neu), `concept/21-gdd/decision-log.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Completion Notes List

- **Kern:** `vision.ts` (Sicht, `visibleState`, `fogBands`, `filterEvents`) und `scout.ts` (Öffnen-Ziele, Stehlen, `goesToConvoy`, Vorschau); `giveItem` benutzt `goesToConvoy`; `chest`/`door` teilen sich mit `open` den Helfer `openObject`. Neues Event `stolen`; `spawned` hat ein optionales `at` (nur der Filter setzt es). Kein neuer Zustand im `BattleState`, keine Map/Set, Events und Zustand `structuredClone`-fest, Speicherformat unverändert; `src/worker/` und die öffentlichen KI-Signaturen unberührt (die KI nutzt die Sicht nicht).
- **Event-Filter:** eigene und verbündete Einheiten immer; `moved` auf den sichtbaren Teil gekürzt (erscheint per `spawned{at}` auf dem ersten sichtbaren Feld, blendet per `retreated` am letzten aus, im Nebel bleibende Wege entfallen); Kämpfe nur, wenn beide Seiten sichtbar sind, ein Treffer aus dem Nebel wird zu `damage`; `quote` einer unsichtbaren Einheit wird zu `dialogue` (keine Sprechblase, die Kamera springt nicht); Ereignisse unsichtbarer Einheiten und Felder entfallen. Sichtbar heißt: vor oder nach dem Befehl gesehen.
- **UI:** `Battle.tsx` rechnet alles auf `visibleState` (Wahl, Pfade, Aktionen, Vorschau, Gefahr, Sprechblasen); das Brett bekommt den gefilterten Zustand beim Laden, Abspielen und Synchronisieren, daher verschwinden Figuren samt Ring und Verblutungs-Zähler. Dazu zwei Zeilen in `board.ts` (nötig, weil das Brett sonst die Zähler ausgeblendeter Figuren behielte und `spawned` kein Feld kennt): `removeUnit` löscht die Verblutungs-Marke, `spawned` nimmt `e.at`. Overlay-Listen `fog`/`fogEdge` in `overlays.ts`. Klassen-Platz des Spähers = Stehlen (Zielwahl, Blatt mit dem Beutel), Öffnen als Kontext-Band, gedimmter Platz mit Grund (`ui.steal.no.*`).
- **Nachtrag 2026-10-25:** Hinterhalt (`ambush`, `walkPath`, Befehls-Feld `path`), Kampf-Aufdeckung im Filter (`spawned`/`retreated`, `board.play(..., pool)`), `__hc.devMap()` statt Konsolen-Ausschnitt; Tests `tests/unit/ambush.test.ts` (8) und eine Filter-Erweiterung in `fog.test.ts`; die UI hängt den geplanten Weg an jeden Befehl auf Nebelkarten (`run` in `Battle.tsx`), der Hinweis `ui.fog.blocked` entfällt, dafür der Hinweis `ui.toast.ambush`. Im Browser mit `__hc.devMap()` geprüft: ein unsichtbarer Plünderer steht auf dem Weg des Vorkämpfers, der Vorkämpfer hält davor, der Plünderer erscheint, der Zug endet.
- **Im Browser geprüft** (Dev-Server, Entwicklerkarte, Speichern währenddessen abgeschaltet): Nebel dunkelt Halle und Randfelder, der Wächter hinter der Tür ist unsichtbar, „Tür öffnen“ im Band öffnet die Tür und enthüllt die Halle, der Platz „Stehlen“ öffnet das Beutel-Blatt, die Salbe wandert in den Beutel des Spähers.
- **Entwicklerkarte:** `tests/fixtures/maps/dev_fog.yaml` (14×9, Nebel, Hof links, Halle rechts nur durch die Tür, Truhe, Späher/Schütze/Vorkämpfer, Wächter, Plünderer, Bogenschütze). Kein Paket, kein Kampagnen-Graph, kein Build. Startweg im Browser: Spielstand laden, dann `await __hc.devMap()` in der Konsole des Dev-Servers (siehe Entscheidungen oben).

- **Prüfungen:** `pnpm lint`, `npx vitest run --maxWorkers=2` (47 Dateien, 550 Tests), `pnpm content:check`, `pnpm build` grün.
- **Sim (50 Läufe, Sieg % / Niedergestreckte), vorher = nachher:** Prolog normal 96 / 0,48, schwer 46 / 1,06; ch01 normal 81 / 0,21, schwer 48 / 0,91; ch02 normal 82 / 0,69, schwer 27 / 0,36. Keine Akt-1-Karte hat Nebel, Türen oder Truhen, die KI ist unverändert.

### File List

- content/core/balance.yaml, content/core/locales/de.yaml, content/core/locales/en.yaml
- src/content/schemas.ts, src/content/validate.ts, src/core/defs.ts, src/core/events.ts, src/core/index.ts
- src/core/rules/vision.ts (neu), src/core/rules/scout.ts (neu)
- src/core/battle/commands.ts, src/core/battle/actions.ts, src/core/battle/apply.ts, src/core/rules/movement.ts (`walkPath`), src/app/state/flow.ts (`__hc.devMap`)
- src/app/screens/Battle.tsx, src/app/screens/BattleHud.tsx, src/app/screens/BattlePanels.tsx, src/ui/icons.tsx
- src/render/board/overlays.ts, src/render/board/board.ts (drei kleine Stellen: Verblutungs-Marke, `spawned` mit `at`, `play(..., pool)`)
- tests/unit/fog.test.ts (neu), tests/unit/open-steal.test.ts (neu), tests/unit/ambush.test.ts (neu), tests/fixtures/devFogMap.ts (neu), tests/fixtures/maps/dev_fog.yaml (neu)
- concept/21-gdd/decision-log.md, _bmad-output/implementation-artifacts/2-6-nebel-des-krieges-oeffnen-und-stehlen.md
