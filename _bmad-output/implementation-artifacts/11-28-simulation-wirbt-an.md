# Story 11.28: Die Simulation wirbt an

Status: review

## Story

Als Produktinhaber
möchte ich, dass die verkettete Kampagnen-Simulation Söldner anwirbt wie ein vernünftiger Spieler,
damit die Messung über die ganze Kampagne (vor allem 2-8) eine Truppe in voller Stärke zeigt und Akt 2 nach Epic 10 belastbar neu abgestimmt werden kann.

Folge-Story aus 11.27 (Antwort 6 B vom 2026-11-10). Dort lag 2-8 verkettet auf Normal bei 5 %, im Lab mit voller Truppe bei 85 %.

## Acceptance Criteria

Siehe `concept/26-epics/epics/epic-11.md`, Story 11.28.

1. Die Heimat-Heuristik wirbt zwischen den Missionen Söldner an, bis die Truppe das Einsatz-Limit der nächsten Mission füllt. Sie nimmt das Angebot mit der höchsten Stufe zuerst und behält mindestens `simulation.hire.reserve` Gold. Angeworben wird nach dem Heilen der Narben und vor Heiltränken und Aufwertungen.
2. Die Angebote kommen aus dem Seed-RNG der Kampagne (`refreshTavern`), gleiche Seeds geben gleiche Läufe. Der Bericht nennt Söldner und Anwerbe-Gold je Lauf.
3. Messung mit `pnpm sim --campaign act2` auf Leicht, Normal und Schwer, 50 Läufe. Akt 1 läuft dabei je Stufe verkettet mit, `--campaign act1` zusätzlich auf Normal. Die Tabelle steht unten. In `balance.yaml` ändert sich kein Spielwert.

## Tasks / Subtasks

- [x] `hireMercenaries` in `tools/simCampaign.ts` und Aufruf in `homeHeuristic(…, next)`; `simulateCampaign` übergibt den nächsten Knoten (AC 1)
- [x] Simulationsparameter `simulation.hire.reserve` (Schema, Typ, `balance.yaml`, Startwert 500 [ASSUMPTION]) (AC 1)
- [x] Bericht: `hire` in „home spent per run“, Söldner je Lauf, JSON `hiredPerRun` und `deployed` je Mission (AC 2)
- [x] Test in `tests/unit/sim-campaign.test.ts`: Limit, Reserve, höchste Stufe zuerst, gleiche Seeds geben gleiche Söldner, ohne nächste Mission kein Anwerben (AC 1, 2)
- [x] Messung vorher/nachher, nach dem Merge von Story 10.1 wiederholt (AC 3)

## Dev Notes

- Wer in den Kampf geht, bleibt unverändert: Die Sim stellt die Truppe in Roster-Reihenfolge auf, Gefährten zuerst, Söldner füllen die freien Plätze. So bleiben Figuren, die für Anwerbe-Gespräche gebraucht werden, im Einsatz.
- Das Einsatz-Limit ist `min(deploy.max, Anzahl der Startfelder)` der Karte des nächsten Story-Knotens (`nextNode`, mit `--order`). Ohne Karte (Platzhalter) wird nicht angeworben.
- Die Tavernen-Regeln (`hireError`: Söldner-Limit 6, Gold) gelten unverändert; die Heuristik ruft nur den Kampagnen-Command `hire`.
- Reihenfolge der Heuristik nach dem Merge von Story 10.1: Supports, Aufstieg, Räume ausbauen, Narben heilen, Söldner anwerben, Heiltränke, Aufwertungen.
- `tests/fixtures/saves/generate-act1-finale.ts` ruft `homeHeuristic` ohne nächsten Knoten auf und wirbt deshalb nicht an. Das Fixture bleibt unverändert.

### References

- `_bmad-output/implementation-artifacts/11-27-akt-2-abstimmen-und-abschliessen.md`, Abschnitt „Offen“
- `src/core/campaign/camp.ts` (`hireError`, `hireCost`, `mercenaryRoom`), `src/core/campaign/campaign.ts` (`refreshTavern`)

## Messung (2026-11-13)

Seit Story 10.1 (PR #201, während dieser Story gemergt) baut die Heuristik vor dem Heilen Räume aus, und die Räume nehmen das meiste Gold. Maßgeblich ist deshalb Messung A auf dem gemergten Stand. Messung B ist der erste Lauf auf `main` f1cfb3b0, noch ohne Räume.

### A: mit Raumausbau (Branch nach dem Merge von `main` ba9648b7)

Je Stufe `pnpm sim --campaign act2 --runs 50 --difficulty <stufe>` (Seed 1). „Ohne“ ist derselbe Stand mit `--set simulation.hire.reserve=100000000`, also ohne Anwerben. Akt 1 läuft in jedem Lauf verkettet mit. Je Zelle steht ohne → mit Anwerben. Die Spalte „Sieg“ ist der erste Versuch, „Einsatz“ die mittlere Zahl eigener Figuren beim Sieg.

**Normal**

| Mission | Sieg | Niedergestreckte | Tote | Einsatz | Armee / P |
|---|---|---|---|---|---|
| 1-8 | 0,94 → 0,98 | 0,96 → 1,00 | 0,38 → 0,37 | 5,3 → 9,1 | 8,8 → 8,9 / 9 |
| 2-1 | 1,00 → 0,96 | 1,04 → **2,69** | 0,28 → 0,69 | 4,9 → 8,4 | 12,1 → 11,2 / 12 |
| 2-2 | 1,00 → 1,00 | 0,55 → **1,47** | 0,11 → 0,47 | 5,2 → 6,9 | 13,2 → 12,2 / 13 |
| 2-3 | 1,00 → 1,00 | 0,57 → **1,96** | 0,26 → 1,06 | 5,1 → 8,4 | 14,6 → 13,4 / 14 |
| 2-4 | 1,00 → 1,00 | 1,23 → **3,45** | 0,36 → 1,43 | 5,5 → 9,0 | 16,1 → 15,1 / 15 |
| 2-5 | 1,00 → 0,98 | 0,32 → 0,67 | 0,04 → 0,18 | 5,2 → 7,5 | 18,3 → 16,5 / 16 |
| 2-6 | 1,00 → 1,00 | 1,28 → **2,59** | 0,06 → 0,29 | 7,1 → 9,1 | 19,4 → 18,7 / 17 |
| 2-7 | 0,91 → 0,82 | 0,66 → 1,12 | 0,21 → 0,35 | 6,9 → 8,9 | 21,2 → 20,4 / 18 |
| **2-8** | **0,07 → 0,28** | 6,42 → 8,87 | 1,64 → 3,00 | 7,7 → 10,1 | 22,1 → 21,4 / 19 |

Akt 2 bis zum Ende geschafft (mit Neustarts): 11/50 → 26/50. Beim Eintritt in Akt 2: Armee 12,1 → 11,2, Gold 2 318 → 1 548. Je Lauf gehen 17 110 → 11 300 Gold in Räume und 0 → 7 218 Gold an 4,6 Söldner.

**Leicht und Schwer**

| | Leicht ohne → mit | Schwer ohne → mit |
|---|---|---|
| 2-8 Sieg | 0,86 → 0,84 | 0,00 → 0,09 |
| 2-8 Einsatz | 9,6 → 12,6 | – → 8,0 |
| 2-1 Sieg / Niedergestreckte | 1,00 / 0,42 → 0,98 / 0,92 | 0,88 / 2,04 → 0,70 / 5,48 |
| 2-4 Sieg / Niedergestreckte | 1,00 / 0,94 → 1,00 / 1,78 | 0,59 / 1,53 → 0,76 / 1,72 |
| 2-7 Sieg / Niedergestreckte | 1,00 / 0,60 → 1,00 / 2,16 | 0,92 / 0,00 → 1,00 / 0,82 |
| 2-8 erreicht | 50 → 50 | 11 → 22 |
| Akt 2 fertig | 50/50 → 50/50 | 0/50 → 2/50 |
| Söldner je Lauf, Gold | 3,8, 5 706 | 3,8, 5 979 |
| Räume je Lauf, Gold | 28 100 → 21 960 | 5 630 → 1 990 |

Auf Schwer gewinnt schon 1-1 nur 49 %, vor jedem Anwerben (unverändert).

### B: ohne Raumausbau (`main` f1cfb3b0, erster Lauf)

| | 2-8 Sieg | 2-8 Einsatz | Akt 2 fertig | Söldner je Lauf |
|---|---|---|---|---|
| Leicht | 0,96 → 0,78 | 9,6 → 14,8 | 50 → 50 | 5,9 |
| Normal | 0,16 → 0,51 | 8,4 → 12,5 | 14 → 34 | 6,8 |
| Schwer | 0,00 → 0,00 | – | 0 → 3 | 4,3 |

`--campaign act1` auf Normal: fertig 47/50 → 49/50, Einsatz in 1-8 5,3 → 9,0 von 14, Gold am Ende 5 882 → 2 133, 3,5 Söldner je Lauf. Die Siegquoten von Akt 1 bleiben im Korridor.

### Vergleich mit 11.27 und Auffälligkeiten (für den Produktinhaber)

1. **2-8 auf Normal:** In 11.27 lag 2-8 verkettet bei 5 %, das Lab mit voller Truppe misst 85 %. Mit Anwerben steigt der Wert auf 28 % (mit Räumen) bzw. 51 % (ohne Räume). Die Truppe stellt in 2-8 im Mittel 10 von 15 Figuren. Was fehlt, liegt am Gold:
   - Räume gehen in der Heuristik vor Narben und Söldnern.
   - Narben kosten je 2 500.
   - Das Söldner-Limit liegt bei 6.
   - Söldner tragen nur Eisenwaffen.
2. **Reihenfolge der Ausgaben:** Ob ein Spieler zuerst Räume ausbaut oder zuerst die Truppe füllt, bestimmt die Messung stark (Räume 17 110 → 11 300 Gold je Lauf). Das sollte vor der Neuabstimmung festgelegt werden. Die Heuristik folgt hier 10.1 (Räume zuerst).
3. **Niedergestreckte auf Normal:** 2-1, 2-2, 2-3, 2-4 und 2-6 liegen mit Anwerben über 1,3. Die Söldner sind schwächer als die Kerntruppe und fallen häufiger; in 2-8 gibt es 3 Tote je Sieg.
4. **Armee-Stufe:** Die Erfahrung verteilt sich auf mehr Köpfe. Beim Eintritt in Akt 2 liegt die Armee bei 11,2 statt 12,1 und damit unter P (12). Bis 2-5 holt sie auf.
5. **2-8 auf Leicht** liegt mit 84–86 % unter dem Korridor von 95 %, mit und ohne Anwerben. Ohne Räume fiel der Wert mit Anwerben von 96 auf 78 %. Mehr Figuren auf dem Feld machen das Finale für die Autoplay-KI nicht leichter. Das sollte an der KI geprüft werden, bevor Werte geändert werden.
6. **Schwer:** Es fehlt an Gold. Die Truppe stellt in Akt 2 nur 4–6 Figuren. 2-8 steigt von 0 auf 9 %, die verkettete Schwer-Messung taugt weiter nur bedingt.
7. **Gold beim Eintritt in Akt 2:** Auf Normal sind es noch etwa 1 500. Der Wert `simulation.startExpected['2'].gold: 6000` (`--start expected`) beruht auf der alten Messung und passt nicht mehr. Hier wurde nichts geändert.

Annahme: `simulation.hire.reserve: 500` [ASSUMPTION]. Das ist ein Parameter der Simulation, kein Spielwert.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Messung B lief in einem zweiten Checkout auf `main` f1cfb3b0, Messung A nach dem Merge von `main` (Story 10.1) auf dem Story-Branch. Beide liefen mit Seed 1 und 50 Läufen; „ohne Anwerben“ über `--set simulation.hire.reserve=100000000`.
- Bis zum ersten Anwerben sind die Läufe vorher und nachher gleich (1-1 auf allen Stufen identisch). Das bestätigt den Determinismus.

### File List

- `tools/simCampaign.ts`
- `tools/simulate.ts`
- `src/content/schemaBalance.ts`
- `src/core/balanceDefs.ts`
- `content/core/balance.yaml` (nur `simulation.hire`)
- `tests/unit/sim-campaign.test.ts`, `tests/unit/rooms-build.test.ts` (nur das neue Feld `hire` in `spent`)
- `tests/fixtures/saves/generate-act1-finale.ts`
- `concept/26-epics/epics/epic-11.md`, `concept/26-epics/decision-log.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
