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
- [x] Messung vorher/nachher (AC 3)

## Dev Notes

- Wer in den Kampf geht, bleibt unverändert: Die Sim stellt die Truppe in Roster-Reihenfolge auf, Gefährten zuerst, Söldner füllen die freien Plätze. So bleiben Figuren, die für Anwerbe-Gespräche gebraucht werden, im Einsatz.
- Das Einsatz-Limit ist `min(deploy.max, Anzahl der Startfelder)` der Karte des nächsten Story-Knotens (`nextNode`, mit `--order`). Ohne Karte (Platzhalter) wird nicht angeworben.
- Die Tavernen-Regeln (`hireError`: Söldner-Limit 6, Gold) gelten unverändert; die Heuristik ruft nur den Kampagnen-Command `hire`.
- `tests/fixtures/saves/generate-act1-finale.ts` ruft `homeHeuristic` ohne nächsten Knoten auf und wirbt deshalb nicht an. Das Fixture bleibt unverändert.

### References

- `_bmad-output/implementation-artifacts/11-27-akt-2-abstimmen-und-abschliessen.md`, Abschnitt „Offen“
- `src/core/campaign/camp.ts` (`hireError`, `hireCost`, `mercenaryRoom`), `src/core/campaign/campaign.ts` (`refreshTavern`)

## Messung (2026-11-13)

Stand `main` f1cfb3b0. Gemessen mit `pnpm sim --campaign act2 --runs 50 --difficulty <stufe>` (Seed 1), vorher ohne und nachher mit Anwerben. Je Zelle steht vorher → nachher. Die Spalte „Sieg“ ist der erste Versuch, „Einsatz“ die mittlere Zahl eigener Figuren beim Sieg.

### Normal

| Mission | Sieg | Niedergestreckte | Tote | Einsatz | Armee / P |
|---|---|---|---|---|---|
| 1-8 | 1,00 → 0,96 | 0,98 → 0,94 | 0,36 → 0,24 | 5,3 → 9,0 | 8,8 → 8,8 / 9 |
| 2-1 | 0,96 → 0,98 | 1,26 → **2,78** | 0,45 → 0,78 | 5,0 → 8,5 | 12,0 → 11,2 / 12 |
| 2-2 | 1,00 → 0,98 | 0,68 → **1,49** | 0,06 → 0,55 | 5,0 → 6,9 | 13,2 → 12,1 / 13 |
| 2-3 | 1,00 → 1,00 | 0,53 → **2,10** | 0,13 → 0,88 | 5,0 → 8,4 | 14,6 → 13,3 / 14 |
| 2-4 | 1,00 → 1,00 | 1,34 → **2,96** | 0,40 → 0,92 | 5,6 → 9,8 | 16,0 → 15,3 / 15 |
| 2-5 | 1,00 → 0,98 | 0,32 → 0,82 | 0,04 → 0,20 | 5,1 → 8,4 | 18,4 → 17,0 / 16 |
| 2-6 | 1,00 → 1,00 | 1,28 → **2,71** | 0,13 → 0,51 | 7,1 → 9,7 | 19,5 → 18,9 / 17 |
| 2-7 | 0,85 → 0,82 | 0,72 → 1,33 | 0,14 → 0,47 | 7,0 → 9,7 | 21,2 → 20,5 / 18 |
| **2-8** | **0,16 → 0,51** | 6,21 → 11,64 | 1,79 → 4,76 | 8,4 → 12,5 | 22,2 → 22,3 / 19 |

Akt 2 bis zum Ende geschafft (mit Neustarts): 14/50 → 34/50. Eintritt in Akt 2: Armee 12,0 → 11,2, Gold 5 882 → 1 655. Je Lauf 6,8 Söldner für 14 244 Gold.

### Leicht

| Mission | Sieg | Niedergestreckte | Einsatz |
|---|---|---|---|
| 1-8 | 1,00 → 1,00 | 0,20 → 0,16 | 6,6 → 10,2 |
| 2-1 | 0,96 → 0,98 | 0,48 → 0,90 | 6,6 → 9,0 |
| 2-4 | 1,00 → 1,00 | 0,90 → 1,76 | 8,3 → 12,0 |
| 2-6 | 1,00 → 1,00 | 0,48 → 1,64 | 9,5 → 10,0 |
| 2-7 | 1,00 → 1,00 | 0,80 → 2,38 | 9,5 → 10,0 |
| **2-8** | **0,96 → 0,78** | 3,20 → 5,54 | 9,6 → 14,8 |

Fertig: 50/50 → 50/50. Je Lauf 5,9 Söldner für 12 714 Gold.

### Schwer

| Mission | Sieg | Niedergestreckte | Einsatz | erreicht |
|---|---|---|---|---|
| 1-8 | 0,75 → 0,71 | 0,50 → 1,00 | 4,0 → 5,8 | 28 → 34 |
| 2-1 | 0,83 → 0,76 | 1,96 → 4,59 | 3,8 → 6,3 | 24 → 29 |
| 2-4 | 0,58 → 0,65 | 1,37 → 2,13 | 4,4 → 5,9 | 19 → 23 |
| 2-7 | 0,67 → 0,86 | 0,33 → 1,00 | 4,9 → 6,4 | 12 → 21 |
| **2-8** | **0,00 → 0,00** | 3,78 → 6,60 | – | 9 → 20 |

Fertig: 0/50 → 3/50. Je Lauf 4,3 Söldner für 7 431 Gold. Schon 1-1 gewinnt auf Schwer nur 49 %, vor jedem Anwerben (unverändert).

### Akt 1 (`--campaign act1`, Normal)

Fertig: 47/50 → 49/50. Gold am Ende: 5 882 → 2 133. Je Lauf 3,5 Söldner für 4 716 Gold. Einsatz in 1-8: 5,3 → 9,0 von 14. Die Siegquoten aller Akt-1-Missionen bleiben im Korridor.

### Vergleich mit 11.27 und Auffälligkeiten (für den Produktinhaber)

1. **2-8 auf Normal:** verkettet 51 % statt 5 % in 11.27 (16 % auf dem heutigen `main`). Das Lab mit voller Truppe misst 85 %. Die Lücke bleibt, weil die Truppe in 2-8 im Mittel 12,5 statt 15 Figuren stellt (Söldner-Limit 6, Tote) und Söldner nur Eisenwaffen tragen.
2. **Niedergestreckte auf Normal:** 2-1, 2-2, 2-3, 2-4 und 2-6 liegen jetzt über 1,3. Die neuen Figuren sind schwächer als die Kerntruppe und fallen häufiger. Söldner sterben auch öfter: 2-8 hat 4,8 Tote je Sieg.
3. **Armee-Stufe:** Die Erfahrung verteilt sich auf mehr Köpfe. Beim Eintritt in Akt 2 liegt die Armee bei 11,2 statt 12,0 und damit unter P (12). Bis 2-5 holt sie auf.
4. **2-8 auf Leicht** fällt von 96 auf 78 %, also unter den Korridor von 95 %. Mehr Figuren auf dem Feld machen das Leicht-Finale für die Sim-KI schwerer. Wahrscheinlich liegt das an der Autoplay-KI und nicht an der Karte. Das sollte geprüft werden, bevor Werte geändert werden.
5. **Schwer:** Gold fehlt. Die Truppe stellt in Akt 2 nur 5–6 Figuren. Narben und Tote fressen das Gold, und das Anwerben scheitert an der Reserve. 2-8 bleibt bei 0 %. Die verkettete Schwer-Messung taugt weiter nur bedingt, das Lab bleibt für Schwer maßgeblich.
6. **Gold beim Eintritt in Akt 2** fällt auf Normal von rund 5 900 auf 1 700. `simulation.startExpected['2'].gold: 6000` (`--start expected`) beruht auf der alten Messung ohne Anwerben und passt nicht mehr. Das wird vor der Neuabstimmung nach Epic 10 entschieden, hier wurde nichts geändert.
7. **Heilen** kostet auf Normal weiter rund 13 000 Gold je Lauf (Narben zu 2 500). Die Heuristik heilt jede Narbe der sechs Stärksten. Ob ein Spieler das so macht, ist offen; der Wert bestimmt mit, wie viel fürs Anwerben bleibt.

Annahme: `simulation.hire.reserve: 500` [ASSUMPTION]. Das ist ein Parameter der Simulation, kein Spielwert.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Die Ausgangsmessung lief in einem zweiten Checkout auf `main` f1cfb3b0, die neue auf dem Story-Branch, beide mit Seed 1 und 50 Läufen.
- Bis zum ersten Anwerben sind die Läufe vorher und nachher gleich (1-1 auf allen Stufen identisch). Das bestätigt den Determinismus.

### File List

- `tools/simCampaign.ts`
- `tools/simulate.ts`
- `src/content/schemaBalance.ts`
- `src/core/balanceDefs.ts`
- `content/core/balance.yaml` (nur `simulation.hire`)
- `tests/unit/sim-campaign.test.ts`
- `tests/fixtures/saves/generate-act1-finale.ts`
- `concept/26-epics/epics/epic-11.md`, `concept/26-epics/decision-log.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
