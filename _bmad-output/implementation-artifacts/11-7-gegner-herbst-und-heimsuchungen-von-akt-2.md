---
baseline_commit: e964cd9
---
# Story 11.7: Gegner, Herbst und Heimsuchungen von Akt 2

Status: review

## Story

Als Spieler
möchte ich in Akt 2 auf neue Gegnergruppen im herbstlichen Hochland und an der Küste treffen,
damit der Akt sich anders anfühlt als Akt 1.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.7 (Z. 208–231). Setzt auf 11.5 (PR #171: Leutnants, Stahl-Tier, vorläufige `content/acts/act2/haunts.yaml`).

1. **Generische Gegner aus vorhandenen Klassen** mit Namen DE/EN (`content/acts/act2/locales/*.names.yaml`): Eisenmark-Soldaten `unit.border_soldier` (`vanguard`, `skirmisher`, `marksman`), Ritter der Silbernen Lanze zu Fuß `unit.lance_knight` (`knight`) mit Knechten `unit.lance_squire`, Kaperfahrer `unit.privateer` (`brigand`, `skirmisher`, `marksman`), Söldner `unit.free_blade`, Kontorwachen `unit.counting_guard` (`vanguard`, bei Haus Silbermeer) `[ASSUMPTION]`.
2. **`knight` auf Stufe 8–20 geprüft:** verwundbar gegen Axt (Dreieck), Magie (RES) und Panzerstecher (effektiv gegen `armored`), ein Schwert gleicher Stufe kratzt ihn kaum (Test `tests/unit/knight-act2.test.ts`, Lab `tests/fixtures/lab/ritter-akt2.yaml`).
3. **Keine Flieger, keine Reiter, kein `cavalier`:** `pegasus_knight` bleibt im Code (`season2: true` in `classes.yaml`), `content:check` meldet ihn auf jeder Karte und in jedem Pool; ab Akt 2 meldet es jede Klasse mit `moveType` `flier`/`mounted` auf Karten, in Pools und bei Leutnants.
4. **Herbst nach `c.act`:** Boden, Bäume und Tönung einer Kampfkarte folgen dem Akt der Kampagne (`BattleState.act`, in Akt 1 nicht gesetzt), nicht dem Ordner der Karte; die eigene `season` einer Karte gewinnt weiter (N4 Schnee). Eine Heimsuchung in Akt 2 auf einer Karte von Akt 1 ist herbstlich. Akt 1 sieht unverändert aus.
5. **Vergleichsbild** derselben Testkarte (`dev_eisenmark`) in Akt 1 und Akt 2, Urteil zu den roten Gegnerringen auf Herbstlaub; `GRADE` in `tools/art/ground.py` nur bei Bedarf.
6. **Pools `content/acts/act2/haunts.yaml` endgültig:** `iron_march`, `silver_lance` (`knight` statt `pegasus_knight`), `silver_sea`, `free_blades`, Stahl-Waffen, `civilian`, `chestLoot` `[ASSUMPTION]`; Gegner stehen auf `hauntLevel`.
7. **Brettfiguren:** Grenzheer `soldier`; Ritter, Kontorwachen und Kaperfahrer vorhandene Modelle als Platzhalter (vermerkt in `art/README.md`), neu entschieden nach 11.27; Brann behält sein Modell.
8. Akt 2 bleibt unveröffentlicht (kein `released: true`, kein `content:lock`); Akt-1-Sim und Akt-1-Spielstände unverändert.

## Tasks / Subtasks

- [x] Jahreszeit nach dem Akt des Kampfs (`battleSeason`, `boardAct` in `src/content/season.ts`; Brett, Boden, Licht) (AC 4)
- [x] `__hc.devMap(id, act)` setzt den Akt des Kampfs statt die Jahreszeit der Karte (AC 4, 5)
- [x] Heimsuchungen: Zivilist und Truhen aus den Pools des Leutnant-Akts (`hauntPoolsFor`), Leutnant ohne Story-Karte trägt die Ausrüstung seiner Klasse aus seiner Bande (AC 6)
- [x] Pools und Namen DE/EN (AC 1, 6)
- [x] `season2` im Klassen-Schema, Prüfung in `validateHaunts.ts` (AC 3)
- [x] Ritter-Test und Lab-Szenario (AC 2)
- [x] `pnpm sim --haunt … --lt <Leutnant von Akt 2>` spielt in Akt 2 mit der Armee nach ganz Akt 1 (Anspielen)
- [x] Vergleichsbild, Urteil Gegnerringe (AC 5)
- [x] `art/README.md`, GDD-Decision-Log (AC 7)

## Dev Notes

- Jahreszeit: `seasonOf(render, map)` (Story 15.15) bleibt für `content:check` (Wetter, Requisiten je Karte); das Brett nutzt `battleSeason(render, map, state)` = eigene `season` der Karte, sonst `actSeason[state.act ?? 1]`. `BattleState.act` setzt `battleSkeleton` schon seit 11.1 (nur ab Akt 2), Story- und Heimsuchungskämpfe gleich. Das Testlabor baut nur Akt-1-Kämpfe.
- Akt 1 bleibt gleich: kein Akt-1-Kampf hat `act`, alle Akt-1-Karten sind Akt 1; `hauntPoolsFor` liefert für Akt-1-Leutnants die Akt-1-Pools; die Kit-Rückfallregel greift nur ohne Story-Karte des Leutnants (alle Akt-1-Leutnants haben eine). Regeln lesen die Jahreszeit nie.
- Spielstände: kein neues Feld im State, keine Migration.

### References

- `concept/26-epics/epics/epic-11.md` § 11.7; `concept/23-art-direction/map-assets/jahreszeiten-plan.md`; Story 15.15 (`15-15-jahreszeiten-boden.md`); `src/core/campaign/haunts.ts`, `src/core/battle/hauntBattle.ts`, `hauntMap.ts`.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

- `pnpm lab ritter-akt2 --forecast <a> lab_knight` (Stufe 12, Normal): Stahlaxt 7×2, Glut 18×2 (Ritter fällt in 51 %), Panzerstecher 9×2, Stahlschwert 0×2.
- `pnpm sim --haunt m1_4_wolfslager:boss --lt grell`, `m1_5_hungerlager:rout --lt brakka`, `m1_4_wolfslager:treasure --lt sable` (je 10 Läufe, Armee nach Akt 1 Ø Stufe 9,4, `hauntLevel` 9): Sieg 100 %, 67 %, 100 %. `m1_2_erlbach:defend --lt rowena` (30 Läufe, 9 bis Akt-Ende): Sieg 33 %, verloren immer am Zivilisten.

### Completion Notes List

- `[ASSUMPTION]` Kontorwachen als `vanguard` mit Stahllanze im Pool von Haus Silbermeer (20 %); Söldner heißen weiter „Freie Klinge“; Iron-March ohne `knight` (Ritter gehören der Lanze).
- `[ASSUMPTION]` Zivilist und Truhen einer Heimsuchung kommen aus den Pools des Akts ihres Leutnants (wie seine Bande), nicht aus dem Akt der Karte; Truhen Akt 2: 300 Gold, Mondstahl, Heiltrank, 500 Gold.
- `[ASSUMPTION]` Ein Leutnant ohne Story-Karte (Akt 2 vor seinen Missionen) trägt in Heimsuchungen die Ausrüstung seiner Klasse aus seinem Pool (Rowena Stahllanze), Stufe nach der Leutnant-Regel.
- Gegnerringe auf Herbstlaub: als rote Scheiben gut von den blauen zu unterscheiden, dazu rote Lebensbalken; `GRADE` bleibt.
- Befund: `defend` gegen Rowena verliert den Zivilisten oft (Ritter halten die Truppe auf); Balancing gehört zu den Missions-Stories von Akt 2.

### File List

- `src/content/season.ts`, `src/render/board/boardProps.ts`, `src/render/board/boardSetup.ts`, `src/render/shared/terrain3d.ts`, `src/app/state/devHooks.ts`
- `src/core/battle/hauntMap.ts`, `src/core/battle/hauntBattle.ts`, `src/core/defs.ts`, `src/content/schemaUnits.ts`, `src/content/validateHaunts.ts`
- `content/acts/act2/haunts.yaml`, `content/acts/act2/locales/de.names.yaml`, `en.names.yaml`, `content/core/classes.yaml`
- `tools/simulate.ts`, `art/README.md`, `concept/21-gdd/decision-log.md`
- `tests/unit/knight-act2.test.ts`, `tests/unit/foes-act2.test.ts`, `tests/fixtures/lab/ritter-akt2.yaml`

### Change Log

- 2026-11-09: Story angelegt und umgesetzt (Gegner, Herbst nach Kampagnen-Akt, Heimsuchungs-Pools von Akt 2).
