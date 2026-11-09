---
baseline_commit: 02963da
---
# Story 11.4: Simulation über Akte

Status: review

## Story

Als Produktinhaber
möchte ich Akt 2 in der Simulation verkettet nach Akt 1 und an jeder möglichen Position einer Mission spielen lassen,
damit jede Missions-Story ihren Korridor prüfen kann.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.4; Vertrag `nodeLevel` in `concept/24-architecture/architecture.md` §5.4.

1. **Verkettet:** `pnpm sim --campaign act2` spielt je Lauf Akt 1 bis zum Finale (gleiche Seeds wie `--campaign act1`), wechselt per Übergang (`enterNextAct`, Story 11.1) in Akt 2 und spielt dessen Folge. Knoten ohne spielbare Karte (Platzhalter aus 11.3) überspringt die Simulation mit Meldung im Bericht; sie zählen als erledigt, damit die Folge weitergeht `[ASSUMPTION]`. Der Bericht nennt Armee-Stufe und Gold beim Eintritt (mit `--haunts` auch mit Heimsuchungen); die Goldkurve prüft Missionen von Akt 2 gegen `simulation.gold.perAct['2']`.
2. **Optionen** (im Kopf von `tools/simulate.ts`): `--start expected` (Startarmee auf P ohne Akt-1-Lauf), `--position <k>` (setzt P), `--order <knoten,…>` (Reihenfolge innerhalb der Paare), `--flags e7_warned[,name=wert]` (Ausgang einer Entscheidung), `--map-file <pfad>` (Karte aus Datei, mit `--node` an einem Knoten).
3. **Akt 1 unverändert:** `pnpm sim --campaign act1 --runs 50` liefert dieselben Werte wie vorher (`sim:diff` gegen main).
4. **Tests:** `tests/unit/sim-acts.test.ts` belegt gleichen Bericht bei gleichem Seed sowie die Wirkung von `--position`, `--order` und `--flags`.
5. **Messung:** Armee-Stufe beim Eintritt in Akt 2 (Normal, mit und ohne Heimsuchungen) gemessen; daraus der Vorschlag für `positionLevel.base`. Liegt er bei 11 ± 0,5, Wert und Messung ins GDD-Log; sonst bleibt 11 stehen und der Vorschlag geht an den Produktinhaber.
6. Akt 2 bleibt unveröffentlicht (kein `released: true`, kein `content:lock`); Spielwerte in YAML.

## Tasks / Subtasks

- [x] `tools/simCampaign.ts`: Akt-Daten vorbereiten (`prepareActData`: `releasedActs`, `--map-file`, `--position`), Knoten über alle Akte (`findNode`), Überspringen ohne Karte, Eintritt messen, `--order`, `--flags`, `--start expected` (AC 1, 2)
- [x] `missionFlags`: Goldkurve nach dem Akt des Knotens (AC 1)
- [x] `tools/simulate.ts`, `simPool.ts`, `simWorker.ts`: `--campaign act2`, neue Optionen, Bericht und JSON (AC 1, 2)
- [x] `balance.yaml`/`schemaBalance.ts`: `simulation.startExpected` (Gold der Startarmee je Akt) (AC 2, 6)
- [x] `tests/unit/sim-acts.test.ts` (AC 4)
- [x] Akt 1 vorher/nachher vergleichen, Messung Akt 2 mit/ohne Heimsuchungen (AC 3, 5)

## Dev Notes

- **Heute:** `simulateCampaign` liest nur `data.acts[1]` (Knoten, Goldkurve), die Position folgt allein aus `c.completed` (`nodeLevel`). `loadContentWithSets` setzt kein `releasedActs` → `actUnlocked` kennt nur Akt 1, `enterNextAct` wechselt nie; genau das hält `--campaign act1` unverändert. Für Akt 2 setzt die Simulation `releasedActs: [1, 2]` auf einer Kopie der Daten.
- **Seeds:** Lauf r hat Seed `seed + r` wie bisher; der Akt-1-Teil eines Akt-2-Laufs ist also identisch mit dem Akt-1-Lauf. Neue Wege (Flags, Reihenfolge, Überspringen) dürfen ohne Option nichts am Akt-1-Pfad ändern.
- **Parallel:** `runParallel` schickt die Job-Optionen an die Worker, jeder lädt den Content selbst; die Vorbereitung (`prepareActData`) läuft daher in `simWorker.ts` einmal und in `simulate.ts` für den seriellen Weg.
- **Karte aus Datei:** wie `devMap` (`mapSchema.parse`, `act: 2`); hat kein Knoten die Karten-Id, steht sie für `--node` (Standard: erster Story-Knoten von Akt 2 ohne Karte).
- **Startarmee:** wie `devNode`/`campaignAt`: Gefährten mit `joins` in Akt 1, alle Akt-1-Knoten erledigt samt Belohnungen (Burg, Funken), dann per `levelUp` auf P des ersten gespielten Knotens; Gold aus `simulation.startExpected['2'].gold` (gemessen).
- Werte in YAML, kein sichtbarer Text im Code (Werkzeug-Ausgabe auf Englisch wie bisher).

### References

- `concept/26-epics/epics/epic-11.md` (Story 11.4)
- `_bmad-output/implementation-artifacts/11-2-positionsstufe-der-akt-2-missionen.md`, `11-1-akt-uebergang-und-spielstand.md`, `11-3-paket-act2-weltkarte-und-titeltafel.md`
- `tools/simCampaign.ts`, `tools/simulate.ts`, `tools/simMap.ts` (`campaignAt`), `src/app/state/devHooks.ts` (`devNode`, `devMap`)

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm check` grün (1742 Tests, `sim-acts.test.ts` 6 Tests, je unter 1,5 s).
- Akt 1: `pnpm sim --campaign act1 --runs 50 --json` vor und nach der Änderung identisch (bis auf `timing`); auch die Akt-1-Zeilen von `--campaign act2` sind gleich (dieselben Seeds).
- Laufzeiten (50 Läufe, 11 Worker): act1 83 s, act2 92 s, act2 `--haunts` etwa 2 min; `--start expected` mit `dev_eisenmark` 4 Läufe 0,6 s.

### Messung beim Eintritt in Akt 2 (2026-11-09, Normal, 50 Läufe, Seed 1)

| Lauf | Läufe am Ziel | Armee-Stufe (effektiv) | Armee-Stufe ohne Beförderung¹ | Gold |
|---|---|---|---|---|
| ohne Heimsuchungen | 46/50 | **12,0** | 9,4 | 6 022 |
| mit Heimsuchungen | 42/50 | **15,0** | 11,0 | 15 555 |

¹ `--set levels.promoteFrom=20`. Gemessen, wenn der erste Knoten von Akt 2 ansteht (nach Lager und Heimsuchungen des Finales). Im Lager nach dem Finale befördert die Heim-Heuristik (Story 10.2) die Stufe-10-Figuren mit den zwei Glutfunken aus 1-8 (meist Rhen und Lucan); eine Profi-Figur auf Stufe 1 zählt mit `experience.advancedLevelOffset: 15` effektiv 16. Das hebt den Durchschnitt der 6 stärksten von 9,4 auf 12,0.

### Completion Notes List

- `--campaign act2`: `prepareActData` öffnet Akt 2 nur auf einer Kopie der Daten (`releasedActs: [1, 2]`), Akt 2 bleibt unveröffentlicht. Knoten über alle Akte (`findNode`), Goldkurve nach dem Akt des Knotens (`perAct['2']`), Bericht und JSON mit `entry` (Armee-Stufe, Gold) und `skipped`.
- Neue Optionen im Kopf von `tools/simulate.ts`: `--start expected`, `--position k`, `--order a,b`, `--flags name[=wert],…`, `--map-file <pfad>`, dazu `--node <id>` (Zielknoten für Karte und Position). Ohne Option läuft `--campaign act1` wie vorher (Optionen werden nur gesetzt, wenn angegeben).
- `simulation.startExpected['2'].gold: 6000` in `balance.yaml` (Schema `schemaBalance.ts`, Typ `balanceDefs.ts`).
- **Vorschlag `positionLevel.base`: 12** (Normal ohne Heimsuchungen, effektive Armee-Stufe 12,0). Weicht von 11 ab: `base` bleibt 11, nichts ins GDD-Log; Entscheidung beim Produktinhaber.
- `[ASSUMPTION]` Knoten ohne gebaute Karte zählen als erledigt (Belohnungen angewandt), damit die Folge weitergeht; P steigt damit auch über übersprungene Knoten.
- `[ASSUMPTION]` „Beim Eintritt“ = wenn der erste Knoten von Akt 2 ansteht, also nach Lager (inkl. Beförderung) und Heimsuchungen nach dem Finale; die Armee-Stufe ist die effektive (Profi +15) wie in allen Korridor-Prüfungen.
- `[ASSUMPTION]` `--position k` setzt P des Zielknotens (`--node`, sonst Knoten der `--map-file`, sonst erster Story-Knoten ohne Karte) auf k, indem `base` für den Aufruf verschoben wird; die Zahl der vorher erledigten Story-Knoten folgt aus der gespielten Reihenfolge (`--order`).
- `[ASSUMPTION]` `--start expected`: alle Akt-1-Knoten erledigt samt Belohnungen, alle Gefährten mit `joins` in Akt 1, per `levelUp` (Würfel aus dem Kampagnen-RNG) auf P der ersten gespielten Mission; keine Beförderung, keine Waffen-Aufwertung, Gold 6 000.
- `[ASSUMPTION]` `--flags` gilt ab Laufbeginn und verlangt einen Namen aus dem Flag-Register. Das Epic-Beispiel `e07=warn` heißt im Register (11.10) `e7_warned` (an/aus); 11.5 darf umbenennen.
- Kein Test spielt Akt 1 bis zum Übergang (ein Lauf dauert über 30 s); der verkettete Weg ist über die Messläufe belegt.

### File List

Neu: `tests/unit/sim-acts.test.ts`.
Geändert: `tools/simCampaign.ts`, `tools/simulate.ts`, `tools/simWorker.ts`, `content/core/balance.yaml`, `src/content/schemaBalance.ts`, `src/core/balanceDefs.ts`, `_bmad-output/implementation-artifacts/sprint-status.yaml`.

### Change Log

- 2026-11-09: Story angelegt (gds-create-story).
- 2026-11-09: Umgesetzt (Simulation über Akte, neue Optionen, Messung beim Eintritt), Status review.
