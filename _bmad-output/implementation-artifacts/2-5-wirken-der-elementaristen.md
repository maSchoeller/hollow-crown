# Story 2.5: Wirken der Elementaristen

Status: review

## Story

Als Spieler
möchte ich mit Elementaristen das Gelände formen,
damit Magie mehr ist als Schaden.

## Acceptance Criteria

1. **Wirken:** Ein Elementarist mit Zauberwaffe eines Elements wählt „Wirken“ auf ein Feld in Reichweite. Es entsteht für 2 Runden: Feuer → Brand, Wasser → löscht und macht Nass, Erde → Felswall, Wind → lichtet Nebel im Radius 2.
2. **Vorschau:** Sie zeigt die betroffenen Felder; die Brandausbreitung bleibt reproduzierbar (Seed-RNG im State, Replay liefert identische Ergebnisse).
3. **KI:** Ein gegnerischer Elementarist nutzt Wirken statt anzugreifen, wenn mindestens 2 Spieler-Einheiten im Brand-Ausbreitungsbereich stehen oder ein Felswall einen Spieler-Pfad zum Ziel sperrt.
4. Wirken ersetzt die Aktion des Zugs, sitzt auf dem festen Klassen-Platz des Docks mit Rollen-Icon und ist in `src/core` getestet. Alle Zahlen in `balance.yaml`.

> Die Kriterien oben sind der Wortlaut aus `concept/26-epics/epics.md` und GDD (Rollenklassen, Gegner-KI, Gelände und Umwelteffekte). Wo sie schweigen, gelten die Entscheidungen des Produktinhabers vom 2026-10-24 unten (Q1–Q12 sind entschieden).

## Tasks / Subtasks

Alle Aufgaben, die von einer offenen Frage abhängen, nennen sie (Q…) und werden erst nach der Antwort umgesetzt.

- [x] T1 Zahlen und Typen (Q2, Q3, Q4, Q7, Q9)
  - [x] `content/core/balance.yaml › classActions.cast` anlegen (Reichweite, Radius Wasser/Nass, ggf. Nutzungslimit); bestehende `terrainEffects` (`burningDuration`, `burningEnterDamage`, `burningSpreadChance`, `rockwallDuration`, `windFogClearRadius`) wiederverwenden, nichts duplizieren
  - [x] `src/core/defs.ts › Balance.classActions` und Zod-Schema `src/content/schemas.ts` (Block `classActions`, ca. Zeile 621) erweitern
  - [x] `content/core/classes.yaml`: `classAction: { id: cast, kind: active }` am Elementaristen besteht schon; `perMap` nur setzen, wenn Q7 es verlangt (`perMap` wird bisher von keinem Code gelesen, nur das Schema kennt es)
- [x] T2 Command und Events (Q6, Q10)
  - [x] `src/core/battle/commands.ts`: `Action` um `{ kind: 'cast'; at: Pos; weapon?: string }` (Architektur §3 nennt `cast{at}`); `CommandError` bei Bedarf um einen Grund erweitern
  - [x] `src/core/events.ts`: `classAction` um `'cast'` erweitern (mit `at`), `terrain.cause` um `'wet'` o. Ä., falls Q4 ein Nass-Feld verlangt; Brand/Löschen/Felswall nutzen die bestehenden Ursachen `ignite`, `extinguish`, `rockwall`
- [x] T3 Regeln (Q1–Q6, Q8)
  - [x] `src/core/battle/actions.ts`: `castTargets(data, s, u, pos)` (Felder in Reichweite je Element der Zauberwaffe), `castArea(data, s, u, pos, at)` (betroffene Felder; gemeinsam für Vorschau und Auflösung), `classActionId === 'cast'`; Eintrag in `availableActions` (`kind: 'cast'`) und `ClassPreview` (`kind: 'cast'` mit Feldern und Ergebnis je Feld) wie bei `aim`/`cheer` aus 2.3
  - [x] Element der Zauberwaffe aus `weaponProfile(...).element` (berücksichtigt Runen) statt nur `ItemDef.element`; Reichweite aus `weaponRange` (`src/core/rules/movement.ts`)
  - [x] `src/core/rules/effects.ts`: vorhandene Bausteine `igniteTile`, `extinguishTile`, `raiseRockwall`, `applyStatus('wet')`, `tickTerrain` nutzen und anpassen (Stapeln/Überschreiben: Q5); neuer Baustein für Nass-Feld und Windradius (Q4, Q9). `raiseRockwall` merkt sich heute `revertTo` des aktuellen Felds; liegt der Wall auf `burning`, kehrt das Feld danach als `burning` ohne Timer zurück (Q5)
  - [x] Reproduzierbarkeit: Wirken selbst zieht keine Zufallszahl; die Ausbreitung bleibt in `tickTerrain` (sortierte Schlüssel, `roll1`/`nextInt` auf `s.rng`). Test mit Replay (Startzustand + Command-Log) auf identischen Zustand (Q10)
- [x] T4 Auflösung in `src/core/battle/apply.ts` (`applyAct`): `case 'cast'`, Event `classAction`, Feldereignisse, Brandschaden einer Einheit auf dem Feld nach Q3; `actionValid` um `cast` ergänzen (Ziel muss in `castTargets` liegen)
- [x] T5 KI in `src/core/ai/ai.ts` (Q11, Q12): Plan „Wirken“ vor `attackPlans` für Profile `aggressive`, `hold`, `guard`, `hunt`; Bedingung aus dem GDD (≥ 2 Spieler-Einheiten im Brand-Ausbreitungsbereich oder Felswall sperrt Spieler-Pfad zum Ziel); Werte (Mindestanzahl 2) in `balance.yaml › ai`. Die Pfadprüfung nutzt `reachable`/`distanceField` aus `src/core/rules/movement.ts`/`ai.ts`
- [x] T6 Tests `tests/unit/cast.test.ts` (Fixtures wie `tests/unit/class-actions.test.ts`; Elementaristen mit `ember`, `surge`, `rockfall`/`stone_wall`, `gust`): je Element Wirkung und Dauer, Reichweite, Vorschau = Auflösung, Wall auf besetztem Feld, Ausbreitung nur auf brennbare Nachbarn und Replay-Gleichheit, KI-Auslöser und Nicht-Auslöser, Nebel-Wirkung (je nach Q9), Command-Fehlerfälle
- [x] T7 UI (Q6, Q7): `src/app/screens/Battle.tsx`: `CLASS_KINDS` um `'cast'`; die Zielwahl arbeitet bisher mit Einheiten (`mode.targets` als Einheiten-Ids, `Overlays.targets` als Felder von Einheiten), Wirken braucht **Felder** als Ziel (neuer Mode, z. B. `castPick`, Antippen eines Felds in `Overlays.attack`) und eine Vorschau der betroffenen Felder (neues Overlay oder `Overlays.attack`/`heal`-Muster in `src/render/board.ts`); `BattleHud.tsx`: `ClassPreviewCard` um `cast` (Element, Wirkung, Dauer); Zähler „n×/Karte“ auf der Dock-Taste nur bei Limit (Q7); Rollen-Icon `cast` in `src/ui/icons.tsx`; Texte `ui.action.cast`, `ui.preview.cast.*` in `content/locales/de.yaml` und `en.yaml`; Brett: Nass-Feld und Wind-Effekt in `src/render/board.ts` (Brand und Felswall werden dort bereits gezeichnet)
- [x] T8 Sim und Balance: `pnpm sim ch02_silverbrook --runs 50` vorher/nachher (Gegner-Elementaristen `m6`, `m6e` in `content/acts/act1/maps/ch02_silverbrook.yaml` wirken künftig, siehe Q11); Entscheidungsprotokoll in `concept/21-gdd/decision-log.md`
- [x] T9 Fertig, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün sind

## Dev Notes

### Was es im Code schon gibt (aus dem PoC)

- **Brand:** `igniteTile` (nur Felder mit `flammable: true`; in `content/core/terrain.yaml` sind das nur `grass` und `forest`), `tickTerrain` (Ausbreitung mit `roll1(s.rng, burningSpreadChance)` und `nextInt`, Schlüssel sortiert; danach Ablauf, verbranntes Feld wird `ash`, nicht brennbar), `burningTileHit` (Status `burning` plus `burningEnterDamage` 5; Flieger ausgenommen), Brandschaden beim Betreten in `objectives.ts` und zu Phasenbeginn in `startOfPhase`. Quellen heute: `terrainOnHit: ignite` an Waffen (`ember`, `drake_breath`), Item `fire_bomb`, Karten-`initialEffects`.
- **Löschen:** `extinguishTile` entfernt nur ein Brandfeld (setzt `revertTo` zurück). Quellen: `terrainOnHit: extinguish` (`surge`).
- **Nass:** nur als Status (`wet`: −3 SPD, entfernt `burning`, macht gegen `burning` immun; `applyStatus`). Es gibt **kein Nass-Feld** und kein Gelände `wet`.
- **Felswall:** `raiseRockwall` (Gelände `rockwall`, nicht passierbar für alle Bewegungstypen, Timer `rockwall` mit `rockwallDuration` 2, lehnt besetzte Felder ab). Es gibt kein Command dafür: das Rare-Tome `stone_wall` (`utility: { createTerrain: rockwall, rng: [1,3] }`) ist nur im Schema/Typ (`defs.ts:95`) angelegt, kein Code liest `utility`. Das Brett zeichnet den Wall bereits (`board.ts`, `case 'rockwall'`).
- **Wind/Nebel:** `balance.terrainEffects.windFogClearRadius: 2` und `balance.fog` (Basis 3, Boni) existieren, aber **es gibt keinen Nebel-Zustand und keine `visibleTiles`**; Nebel kommt erst mit Story 2.6 (danach). `fog: boolean` an Karten ist in allen drei PoC-Karten `false`.
- **Klassen-Aktion:** `classes.yaml` führt für `elementalist` und `sage`/`hexer`-Pfade `classAction: { id: cast, kind: active }`; `classActionId()` in `actions.ts` liefert die Id, der Code kennt `cast` noch nicht.
- Muster aus 2.3: Vorschau und Auflösung teilen dieselbe Funktion (`classPreview` ↔ `applyAct`), Klassen-Aktion ersetzt die Aktion des Zugs, `CLASS_KINDS` in `Battle.tsx` bestimmt den Dock-Platz.
- Zufall: nur `s.rng` (`nextInt`, `roll1`); `Math.random`/`Date.now` sind in `src/core` gesperrt.

### Zeitpunkt der Dauer („2 Runden“)

`tickTerrain` läuft einmal je Runde nach der Gegnerphase (in `endPlayerPhase`, nach `s.turn += 1`) und zählt `turns` herunter. Ein im Spielerzug von Runde N gewirktes Feld hält damit bis zum Ende von Runde N+1 (Gegnerphase N, Spielerphase N+1, Gegnerphase N+1) – bei Wirken einer KI in Runde N entsprechend. Das ist zu bestätigen (Q8).

### Grenzen zu anderen Stories

- **Story 2.6 (Nebel, danach):** Ohne `visibleTiles` kann Wind nichts lichten. Bis 2.6 hat Wind-Wirken keinen sichtbaren Effekt (Q9). Der Nebel-Zustand selbst (welche Felder gelichtet sind, wie lange) ist Sache von 2.6; 2.5 liefert nur den Aufruf mit Radius und Dauer.
- **Story 2.8 (Gegnerphase im Web Worker, andere Session):** Die KI-Schnittstelle `runAiPhase(data, s, team, events)` ändert sich durch 2.5 **nicht**. Neu ist nur die Action `cast` im `Action`-Union (JSON-serialisierbar, geht unverändert durch das Worker-Protokoll `{ state, events }`) und mehr Rechenzeit je Elementarist (Pfadsperr-Prüfung: Q12). Falls die Pfadprüfung neue Helfer in `rules/movement.ts` braucht, bleiben sie reine Funktionen auf `GameData`/`BattleState`. Vermerk für 2.8: `pnpm bench:ai` nach 2.5 neu messen.
- **Story 2.4 (Halten):** Haltezonen wirken in der KI-Pfadsuche; ein Felswall-Check der KI sollte dieselbe `reachable`-Basis nutzen. Reihenfolge der Stories beachten, falls 2.4 vorher fertig wird.
- Autoplay/Sim (`src/core/ai/autoplay.ts`, `tools/simulate.ts`): Spieler-Autoplay setzt Wirken nicht ein (wie bei 2.3); die Gegner-KI schon, daher ändern sich die Sim-Werte von `ch02_silverbrook`.

### Entscheidungen des Produktinhabers (2026-10-24)

Alle Fragen Q1–Q12 sind **entschieden**; unten steht je Frage das Ergebnis (der ursprüngliche Optionstext ist ersetzt). Eingetragen in `concept/21-gdd/decision-log.md`.

- **Q1 Reichweite – entschieden:** Waffenreichweite der ausgerüsteten Zauberwaffe (Haupthand), mindestens 1 (nie das eigene Feld), unbegrenzt oft je Karte (kein Zähler, Q7 mit erledigt); Wirken ersetzt die Aktion des Zugs.
- **Q2 Element – entschieden:** das Element der Zauberwaffe (`weaponProfile().element`), ein Runen-Element zählt mit. Licht/Dunkel sind nicht wirkbar: Taste gedimmt mit Grund (Locale-Text). Das Rare-Tome `stone_wall` bleibt unberührt (siehe „Neue offene Fragen“).
- **Q3 Feuer – entschieden:** nur auf brennbare Felder (Gras, Wald; ein schon brennendes Feld erneuert die Dauer). Brandschaden zu Phasenbeginn wie bisher (kein Sofortschaden), trifft Freund und Feind.
- **Q4 Wasser – entschieden:** löscht Brand im Radius 1 (`classActions.cast.waterRadius`) um das Zielfeld und setzt den bestehenden Status `wet` auf alle Einheiten dort (Freund und Feind). Kein Nass-Feld.
- **Q5 Stapeln – entschieden:** Felswall auf Brand ersetzt den Brand (der Untergrund vor dem Brand kehrt zurück; behebt den Fehler „Feld bleibt nach Ablauf als `burning` ohne Timer“); Brand oder Wasser auf einen Wall ist nicht erlaubt; derselbe Effekt auf demselben Feld erneuert die Dauer.
- **Q6 Felswall – entschieden:** 1 Feld, nur unbesetzt (auch kein Niedergestreckter), nicht auf Objekten (Dorf, Truhe, Tür …) und nicht auf Beute.
- **Q7 Limit – entschieden:** unbegrenzt, kein Zähler, `perMap` bleibt ungenutzt.
- **Q8 Dauer – entschieden:** „2 Runden“ endet am Ende von Runde N+1, wie der bestehende Timer zählt.
- **Q9 Wind – entschieden:** auf Karten ohne Nebel gedimmt mit Grund; mit Nebel lichtet Wind Radius 2 (`terrainEffects.windFogClearRadius`) für das Team des Wirkenden, 2 Runden (`classActions.cast.fogDuration`). Nebel selbst kommt mit Story 2.6; 2.5 legt nur den Zustand `fogLifted` (Team, Mitte, Radius, Rest-Runden) und `liftedTiles(state, team)` an.
- **Q10 Zufall – entschieden:** Wirken zieht keinen Zufall; nur die Brandausbreitung in `tickTerrain` zieht aus `s.rng` (sortierte Schlüssel). Replay-Test.
- **Q11 Brand – entschieden:** trifft Freund und Feind, auch bei der KI.
- **Q12 KI – entschieden:** Brand-Ausbreitungsbereich = Zielfeld + brennbare Nachbarn; Spieler-Einheiten im Bereich minus eigene Einheiten ≥ `ai.castMinTargets` (2); Felswall nur, wenn der Spielerweg zum Missionsziel (Zielfeld von `reach`/`seize`/`escape`) mit Wall um mindestens `ai.castWallDetour` (3) länger oder gesperrt ist (Distanzfeld mit und ohne Wall), ohne Zielfeld greift die Regel nicht; Wirken nur, wenn der beste Angriff nicht tödlich ist (Kill-Chance unter `ai.castLethalChance`, 100 %); Profile alle außer `flee`, `raider`, `support`; die KI nutzt nur Feuer und Erde.

### Voraussichtlich berührte Dateien

- `content/core/balance.yaml` (`classActions.cast`, `ai`), `content/core/classes.yaml` (nur falls `perMap`), evtl. `content/core/terrain.yaml` (nur falls Nass-Feld, Q4)
- `src/core/defs.ts`, `src/content/schemas.ts`
- `src/core/battle/{commands,actions,apply}.ts`, `src/core/events.ts`, `src/core/rules/effects.ts`, evtl. `src/core/rules/movement.ts` (Pfadsperr-Helfer), `src/core/state.ts` (nur bei Q10 (b))
- `src/core/ai/ai.ts`
- `src/app/screens/Battle.tsx`, `src/app/screens/BattleHud.tsx`, `src/ui/icons.tsx`, `src/render/board.ts` (Feld-Overlay, Nass/Wind), `content/locales/{de,en}.yaml`
- `tests/unit/cast.test.ts` (neu), ggf. `tests/unit/class-actions.test.ts` (Muster, nicht ändern)
- `concept/21-gdd/decision-log.md` (Entscheidungen zu Q1–Q12), evtl. `concept/24-architecture/architecture.md` §3 (Actions)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Completion Notes List

- Neues Modul `src/core/rules/cast.ts` (Quelle/Element der Zauberwaffe, `castTargets`, `castArea` für Vorschau und Auflösung, `resolveCast`, `liftedTiles`); Command `act` mit Action `{ kind: 'cast'; at }`, Event `classAction` mit `action: 'cast'`, `at`, `element`. `igniteTile(.., renew)` und `raiseRockwall` erneuern die Dauer; Wall auf Brand merkt sich den Untergrund vor dem Brand (Fehler „Feld bleibt als `burning` ohne Timer“ behoben).
- Wind: Zustand `BattleState.fogLifted` (Team, Mitte, Radius, Rest-Runden; Plain JSON, optional), `tickTerrain` zählt ihn herunter, `liftedTiles(state, team)` ist die Schnittstelle für Story 2.6. Es gibt keine Nebel-Sicht in 2.5.
- Zahlen: `classActions.cast { waterRadius, fogDuration }`, `ai.castMinTargets/castWallDetour/castLethalChance`.
- KI (`ai.ts`, privat `castPlan`): vor dem Angriff, Profile aggressive/hold/guard/hunt/trigger; Feuer nach Netto-Zahl im Ausbreitungsbereich, Felswall nach Distanzfeld (`distanceField`) mit/ohne Wall je Bewegungstyp, mit Vorfilter über Manhattan-Abstand. Öffentliche KI-Signaturen unverändert.
- UI: neuer Modus `cast` in `Battle.tsx` (Feldwahl, Vorschau, Bestätigen; Antippen des Zielfelds bestätigt), neue Overlay-Liste `cast` in `overlays.ts`, `ClassPreviewCard` mit `cast`, gedimmter Platz mit Grund (`ui.cast.no.*`), Rollen-Icon `cast` (= Feuer-Glyph). Brand und Felswall zeichnet das Brett schon (`terrain`-Events, Feuer-Partikel, Prop `rockwall`). Wind hat noch keine Darstellung (kein Nebel). Nicht im Browser geprüft.
- Tests: `tests/unit/cast.test.ts` (31), `class-actions.test.ts` um `cast` ergänzt.
- Sim (50 Läufe, Sieg % / Niedergestreckte), vorher = nachher: Prolog normal 96 / 0,48, schwer 46 / 1,06; ch01 normal 81 / 0,21, schwer 48 / 0,91; ch02 normal 82 / 0,69, schwer 27 / 0,36. Die Gegner-Elementaristen von ch02 stehen als `hold` mit Ember und haben nie 2 Spieler-Einheiten netto im Bereich; kein Ergebnis fällt aus dem Korridor heraus, das nicht schon vorher draußen lag.
- `pnpm bench:ai`: vorher 38,22 ms (perf_bench_large) / 50,19 ms (ch02), nachher 22,36 / 5,41 ms je Einheit (Maschinenlast schwankt; Grenze 300 ms). Die Benchmark-Karten enthalten keine Elementaristen, die Wall-Prüfung ist dort also nicht gemessen.

### Nachträgliche Entscheidungen des Produktinhabers (2026-10-24) zu den offenen Fragen, umgesetzt

1. **Felswall und Untergrund:** nur auf Felder, die ein Fußtyp betreten kann; Missions-Zielfelder (Gelände mit `seizable`, also Thron und Tor, und die Felder, die ein `reach`/`seize`/`escape`-Ziel nennt) sind ausgenommen. Solche Felder sind nicht wählbar und kommen nicht in die Vorschau; ist sonst nichts wählbar, ist der Platz gedimmt mit Grund (`ui.cast.no.target`, de/en).
2. **`stone_wall`:** hat eine Zauberwaffe `utility.rng` (Typ und Schema bestehen schon), gilt dessen größte Reichweite für Wirken (stone_wall: 1–3), sonst die Waffenreichweite; nichts im Code hartkodiert.
3. **KI-Wall:** bleibt wie umgesetzt (mindestens eine Spieler-Einheit mit Weg zum Ziel).

Nachmessung: Sim unverändert (siehe oben), 495 Tests grün.

### File List

- content/core/balance.yaml, content/core/locales/de.yaml, content/core/locales/en.yaml
- src/core/defs.ts, src/core/state.ts, src/core/events.ts, src/core/index.ts, src/content/schemas.ts
- src/core/rules/cast.ts (neu), src/core/rules/effects.ts
- src/core/battle/commands.ts, src/core/battle/actions.ts, src/core/battle/apply.ts
- src/core/ai/ai.ts
- src/app/screens/Battle.tsx, src/app/screens/BattleHud.tsx, src/render/board/overlays.ts, src/ui/icons.tsx
- tests/unit/cast.test.ts (neu), tests/unit/class-actions.test.ts
- concept/21-gdd/decision-log.md, _bmad-output/implementation-artifacts/2-5-wirken-der-elementaristen.md
