# Story 5.6: Heimsuchungen spielen und belohnen

Status: done

## Story

Als Spieler
möchte ich für Heimsuchungen angemessen belohnt werden, ohne davonzulaufen,
damit sie eine Ergänzung zur Story bleiben.

## Acceptance Criteria

1. **Weltkarte:** Jede offene Heimsuchung (`c.haunts`, Story 5.5) erscheint als roter Stein (`map-node`, Farbe `haunt` = `team-enemy`, DESIGN.md) mit dem Porträt ihres Leutnants und der Marke „NEU“ (solange `new`) am Weltkarten-Ort des Story-Knotens ihrer Karte (`valmora.yaml places[].node`); liegt dort auch der erledigte Story-Stein, stehen beide nebeneinander. Die Knoten-Karte nennt Ort (Kartenname), Ziel der Variante (Text je Variante), Plätze, den Leutnant mit „flieht bei 0 TP“ (wie EXPERIENCE.md Szenario 1) und die erwartete Belohnung (Symbol + Zahl). Öffnen der Karte setzt `new` auf false (Command `seeHaunt`).
2. **Spielen:** „Aufbrechen“ startet die Heimsuchung über denselben Ablauf wie Story-Knoten (Paket laden, Aufstellung, Kampf, Ergebnis) ohne Szenen davor/danach; der Leutnant spricht seine Begegnungszeile wie auf Story-Karten. `createHauntBattle(data, c, hauntId, deployIds)` baut den Kampf aus Karte (Gelände, Objekte, Licht, Effekte) + Anker (Einsatzfelder, Ziel, Truhen, Zivilist, Rundenlimit) + den gespeicherten Gegnern; `BattleState.hauntId` kennzeichnet ihn, die Siegziele sind die der Variante (boss → Leutnant; rout; defend → Zivilist `turns`; escort → Zivilist zum `exit`; treasure → Truhen in `turns`). Niederlagen: Avatar/Kael wie auf Story-Karten, defend/escort zusätzlich Tod des Zivilisten. Seed aus Kampagnen-Seed und Heimsuchungs-ID (reproduzierbar).
3. **Belohnung** (`finishBattle`, Werte `balance.haunt`): Gold = `goldPct` % des Mittelwerts von `goldReward` der Story-Karten des aktuellen Akts (gerundet), Kopfgeld wie gewohnt, Material `material.min–max` des Akt-Materials, EP × `expPct` %, **keine Glutfunken**. Ab der `halveFromNth`-ten Heimsuchung seit der letzten Story-Mission (`c.hauntsSinceStory`) halbieren sich Gold und Kopfgeld. Einheiten über der erwarteten Armee-Stufe der nächsten Story-Mission erhalten zusätzlich nur `catchUpExpPct` % der Heimsuchungs-EP. Das Ergebnis zeigt Halbierung bzw. Deckel als kurze Zeile.
4. **Folgen:** Gewonnen → Heimsuchung verschwindet aus `c.haunts`, `c.hauntLast[map] = variant`, `c.hauntsSinceStory + 1`; nicht in `c.completed`. Story-Mission gewonnen → `hauntsSinceStory = 0`. Verloren oder abgebrochen → sie bleibt offen. Groll, Flucht, Signatur-Drop und Gefallene wie auf Story-Karten.
5. **Simulation:** `pnpm sim --haunt <mapId>:<variant> [--runs 50 …]` spielt den Anker mit einer Armee auf erwarteter Stufe; für jeden Anker der Akt-1-Karten liegt das Ergebnis im Normal-Korridor oder die Abweichung ist im Dev Agent Record begründet. `pnpm sim --campaign act1 --haunts` meldet nicht mehr „not in the game yet“, sondern spielt je Story-Mission die dann offenen Heimsuchungen mit (verkettete Kampagne, FR48), soweit das ohne Umbau des Kampagnen-Sims geht; sonst offener Punkt.
6. **Texte** DE + EN für Varianten-Ziele, Knoten-Karte, Ergebnis-Zeilen.
7. **Tests:** Belohnung (40 %, 60 %, Halbierung ab der 4., Deckel 50 %), keine Glutfunken, Zustand nach Sieg/Niederlage, Determinismus (gleicher Start + Commands = gleiches Ergebnis), jede Variante baut einen gültigen Kampf; E2E: Heimsuchung auf der Weltkarte öffnen und per autoWin gewinnen.

## Tasks / Subtasks

- [x] T1 Kern: `createHauntBattle`, `BattleState.hauntId`, Ziele je Variante, Command `seeHaunt` (AC 2)
- [x] T2 Kern: Belohnung und Folgen in `finishBattle`/`finishMission` (AC 3, 4)
- [x] T3 App: Weltkarten-Stein + Knoten-Karte, `playHaunt` in `flow.ts` (AC 1, 2)
- [x] T4 Ergebnis-Zeilen (AC 3)
- [x] T5 Sim `--haunt` und `--haunts` (AC 5)
- [x] T6 Texte, Tests, E2E (AC 6, 7)

## Dev Notes

- GDD „Welt und Erkundung“ (Belohnung, Deckel), Architektur §5.6, DESIGN.md `map-node`, EXPERIENCE.md Szenario 1 und „Vermeiden“ (kein Ablauf-Druck: keine „läuft ab“-Texte).
- Aufstellungs-Screen und Brett-Rendering gehören der Session „Brett-Look und Aufstellung“ (6.10/8.6): nur bestehende Einstiege benutzen, die Komponenten nicht umbauen; fehlt etwas, nachfragen.
- Heimsuchungen sind keine Kampagnen-Knoten; `isAvailable`/`node_unavailable` gelten für sie nicht.

### References

- [Source: concept/26-epics/epics.md#Story 5.6]
- [Source: concept/21-gdd/gdd.md#Welt und Erkundung]
- [Source: concept/24-architecture/architecture.md#5.6]
- [Source: concept/25-ux/DESIGN.md#map-node], [Source: concept/25-ux/EXPERIENCE.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm test` (71 Dateien, 882 Tests; Timeouts bei voller Parallelität wie schon in 5.5 durch Last, grün mit `--maxWorkers=4 --testTimeout=30000 --hookTimeout=30000`), `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün.
- Sim `pnpm sim --haunt <map>:<variante> --runs 50` (normal, Seed 1…50, Armee der verketteten Kampagne nach der Story-Karte), Korridor aus `balance.yaml simulation.corridors.normal` (Sieg 75–100 %, Niederlagen/Läufe 0,4–1,3):

| Anker | Läufe | Sieg | Korridor | ø Niedergestreckte | Korridor | Leutnant flieht |
|---|---|---|---|---|---|---|
| prologue_paktnacht:rout | 49 | 76 % | drin | 0,33 | darunter | 49 |
| prologue_paktnacht:boss | 49 | 86 % | drin | 0,22 | darunter | 42 |
| prologue_paktnacht:defend | 49 | 100 % | drin | 0,00 | darunter | 0 |
| m1_1_steckbriefe:defend | 44 | 89 % | drin | 0,41 | drin | 42 |
| m1_1_steckbriefe:boss | 44 | 77 % | drin | 0,34 | darunter | 34 |
| m1_1_steckbriefe:escort | 44 | 89 % | drin | 0,18 | darunter | 42 |

  Endstand nach Verschieben der Anker durch den Produktinhaber-Auftrag 2026-10-26 (nur `haunts:` der Karten Prolog und 1-1, kein Generator- oder Balance-Code): Prolog rout Einsatzfelder [3,12,8,12] (vorher [3,14,8,14]), Gegnerfeld [2,1,9,4]; 1-1 defend Zivilist [7,10], Einsatzfelder [4,12,9,12], Gegnerfeld [5,0,8,1], `turns` 6; 1-1 escort Zivilist [6,12], Einsatzfelder [4,14,9,14], Gegnerfeld [0,7,3,10] (vorher [0,3,2,5]; Stand 2026-10-27 mit Klasse civilian/villager_elder und dem Merge von Story 9.3/8.6: das alte Feld gab 70 %, daher nach Südwesten verschoben). Zwischenstände: vorher rout 59 %, 1-1 defend 0 %, escort 55 %.   (Weniger als 50 Läufe: die verkettete Kampagne scheitert vorher in einzelnen Läufen, wie bei `pnpm sim <map>`.) Alle sechs Anker liegen im Normal-Korridor für den Sieg (75–100 %); knapp sind 1-1 escort (77 %) und defend (80 %), bei 44 Läufen schwanken sie um einige Punkte. `pnpm sim --campaign act1 --haunts` spielt je Story-Mission einen Tag und alle dann offenen Heimsuchungen (10 Läufe: ø 3,1 Heimsuchungen je Lauf, 52 % gewonnen, ø 528 Gold je Lauf).

### Completion Notes List

- **Kern (T1, T2):** `buildHauntMap`/`hauntMap`/`ensureHauntMap` (`battle/hauntMap.ts`): die Heimsuchung läuft auf einer aus Story-Karte, Variante und Leutnant abgeleiteten Karte `haunt~<map>~<variante>~<leutnant>` in `data.maps` (Gelände, Licht, Effekte der Story-Karte; Einsatzfelder und Plätze des Ankers; Siegziel je Variante; Niederlage Avatar/Kael, bei defend/escort auch Zivilist; keine Nebenziele). `BattleState.mapId` trägt sie, deshalb bleiben Regeln, KI, Brett-Render und Ergebnisansicht unverändert; `applyCommand` baut sie bei Bedarf aus der Id (Worker, Spielstand). `createHauntBattle` (`battle/hauntBattle.ts`) nutzt das gemeinsame Gerüst aus `setup.ts` (`battleSkeleton`, `deployPlayers`, `placeMapUnits`, `finishSetup`), `createBattle` verhält sich wie zuvor; der Leutnant geht durch `planLieutenants` (Waffen und Drops aus seiner ersten Story-Karte als Vorlage, Stufe/Groll/Fähigkeiten/Begegnungszeile wie dort). `BattleState.hauntId/hauntLevel`, Commands `seeHaunt`, `restartTurn/restartMission.haunt`, `finishMission` prüft `start.hauntId`. Belohnung/Folgen in `finishBattle`, EP über `expPercent` in `grantExp` (neuer optionaler Parameter), `payBounties(..., goldPercent)`.
- **App (T3, T4):** roter Stein mit Leutnant-Porträt und „NEU“, Karte (`HauntCard` in `WorldMap.tsx`, Stile in `WorldMap.css`), `playHaunt`/`beginHaunt`/`defaultHauntDeploy` in `flow.ts`, Ergebniszeilen (`Result.tsx`, `MissionResultView.haunt`). **Einzige Änderung an fremden Komponenten:** `Prep` in `Camp.tsx` bekam die optionale Eigenschaft `haunt` (Karte und Start über `beginHaunt`), `screen.ts`/`App.tsx` reichen sie durch; `battle.ts` `startBattle(…, hauntId?)`. Brett und Aufstellungs-Layout unberührt.
- **Zivilist ohne Sprite:** wie der Dorfälteste in 1-2 Klasse `healer` ohne `sprite`; das Brett zeigt den vorhandenen Klassen-Pixelsprite des Heilers (hell gekleidete Figur) auf dem grünen Sockel der Neutralen, der Name kommt aus `unit.civilian.name` („Dörfler“ / „Villager“; auch der Zieltext „Bring … zum Ausgang“ liest diesen Schlüssel).
- **Sim (T5), Tests (T6):** `tools/simulate.ts` (`--haunt`), `tools/simCampaign.ts` (`--haunts`), `tests/unit/haunt-battle.test.ts`, E2E `tests/e2e/haunt.spec.ts` (nur Projekt desktop; öffnet die Karte, startet, gewinnt per `__hcTest.autoWin`, prüft das Ergebnis). Für den Produktions-Build bietet `flow.ts` bei `navigator.webdriver` `window.__hcTest = { devHaunt, autoWin }` an (wie `__board`); DEV hat `__hc.devHaunt(mapId, variante, leutnant)`.
- **Offene Fragen (mit Empfehlung):**
  Vom Produktinhaber 2026-10-26 bestätigt: Schlüssel bei Truhenjagd ohne Späher, Material zusätzlich zum Kopfgeld (nicht halbiert, Truhenfunde nicht halbiert), Truhen-Inhalt reihum und keine Haus-Belohnungen, Gegner-KI und `__hcTest`. Umgesetzt auf seine Anweisung: Zivilist auf der erwarteten Armee-Stufe der Heimsuchung (`h.level`), Gegner im Profil `trigger` (Radius in `balance.haunt.triggerRadius`, Leutnant behält seinen).
  Anker verschoben, bis alle sechs im Sieg-Korridor liegen (siehe Tabelle); der Wortlaut der Grund-Kommentare in den Karten ist angepasst.

### File List

- `src/core/battle/hauntMap.ts`, `hauntBattle.ts`, `terrain.ts` (neu), `setup.ts`, `apply.ts`
- `src/core/campaign/haunts.ts`, `campaign.ts`, `apply.ts`, `commands.ts`, `lieutenants.ts`, `resultView.ts`
- `src/core/rules/progression.ts`, `combat.ts`, `src/core/state.ts`, `src/core/index.ts`
- `src/content/validate.ts`
- `src/app/state/flow.ts`, `battle.ts`, `screen.ts`; `src/app/App.tsx`; `src/app/screens/WorldMap.tsx`, `WorldMap.css`, `Camp.tsx` (Prep), `Result.tsx`
- `content/core/locales/de.yaml`, `en.yaml`, `de.names.yaml`, `en.names.yaml`, `content/acts/act1/haunts.yaml`
- `tools/simulate.ts`, `tools/simCampaign.ts`
- `tests/unit/haunt-battle.test.ts`, `tests/e2e/haunt.spec.ts`
- `concept/24-architecture/architecture.md`, `concept/24-architecture/decision-log.md`

## Abnahme 2026-10-27

Abgenommen (Status done). Heimsuchung im Browser gespielt (Gold, Kopfgeld, Material, EP-Deckel). Alle 24 Anker von Akt 1 simuliert; sechs lagen unter 75 % und wurden über ihre Anker-Felder korrigiert (PR #72), alle ≥ 77 %. Gesamtbefund: `acceptance-2026-10-27.md`.
