# 2-3 Die Rabenweide · Entwurf 1

**Kurz:** M 22×26 · Mittag · Boss Rowena · 9 eigene gegen 24 (2,7 : 1) · Beitritt **Ilka**

- Die Truppe kommt im Süden über **offene Weiden**. Dort gibt es keine Deckung, Rücken und Flanken sind offen (Runde 3 von Osten, Runde 5 von Westen).
- Die **Aure** hat drei Furten und keine Brücke. Die Furten kosten Bewegung und sind die Engstellen.
- Nördlich liegen die **Koppeln**: Zäune sperren alle Figuren, die Lücken sind Engstellen für Vorkämpfer. Lanzen warten darin, bis jemand nah kommt; die Pferde sind nur Kulisse.
- **Rowena** kämpft zu Fuß und hält den Gestütshof mit Rittern und gibt nach ihrer Niederlage auf. Sie lässt einen verwundeten Gefährten versorgen.
- **Ilka** steht im Wald am Nordostufer. Wer sie anspricht, gewinnt sie.

![Raster](s2_2_3_rabenweide.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 20 · N 24 · S 28, Stufe P−3 bis P−1 (hier 9–11), Leutnants P+1 bis P+2 |
| Aufstellung | 9 von 12 Feldern, Pflicht Rhen und Lucan |
| Nebenziele | Ilka gewinnen · beide Ställe besuchen |
| Phasen | R1–4 Weide · R5–7 Furten · R8–12 Gestütshof |
| Formatwünsche | Leutnant `rowena`, Modelle Koppel, Stall, Gestüt |
| Datei | `levels/s2_2_3_rabenweide.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Gepanzerte kommen nicht durch die Furten (`shallows` ist für `armored` gesperrt). Rowena und die Lanzen r1, r3, r5 bleiben nach dem Wecken in ihren Koppeln (`then: guard` statt `aggressive`), der Ausfall in Runde 7 kommt mit einem Plänkler statt eines Vorkämpfers. [ASSUMPTION], bei 11.14 per `pnpm sim` prüfen.

## Übernahme Story 11.14 (2026-11-10)

Ins Spiel übernommen als `content/acts/act2/maps/m2_3_rabenweide.yaml` (Knoten `m2_3`, Ort `rabenweide`, Akt 2 unveröffentlicht, sichtbar mit `pnpm dev:act2`, Lab `rabenweide-2-3`, Blatt `levels/out/m2_3_rabenweide.svg`). Gelände, Aufstellung, Gegner, Wellen R3/R5/R7, Ilka und Ziele wie im Entwurf; PO-Antworten F1–F8 vom 2026-11-09 umgesetzt.

**Sim [C]** (`pnpm sim m2_3_rabenweide --campaign act2 --start expected --runs 50`, 9 eigene; früheste Position `--order m2_3` direkt nach 2-1, P = 13; späteste nach 2-2, P = 14):

| Stufe | Position | erreicht | Sieg | Niedergestreckte | Tote | Runden p10/p50/p90 | Ilka / Ställe | Korridor |
|---|---|---|---|---|---|---|---|---|
| Leicht | früh | 49 | 100 % | 0,02 | 0,00 | 6/7/8 | 100 % / 78 % | im Korridor |
| Leicht | spät | 49 | 100 % | 0,00 | 0,00 | 6/7/9 | 100 % / 84 % | im Korridor |
| Normal | früh | 49 | 100 % | 0,61 | 0,06 | 6/9/15 | 96 % / 78 % | im Korridor |
| Normal | spät | 49 | 100 % | 0,49 | 0,10 | 6/10/15 | 88 % / 82 % | im Korridor |
| Schwer | früh | 49 | 82 % | 2,49 | 0,83 | 14/22/30 | 100 % / 100 % | Sieg über 30–70 %, Niedergestreckte über 1,3, lange Kämpfe |
| Schwer | spät | 25 | 92 % | 1,36 | 0,29 | 13/17/25 | 100 % / 96 % | Sieg über 30–70 %, Niedergestreckte knapp über 1,3 |

Gold 2 000 (+ 600 in den Ställen, + 300 für Ilka); die Sim meldet den Nebenziel-Anteil als unter der Kurve (↓, wie 2-1). Schwer spät: nur 25 Läufe erreichen 2-3, weil 2-2 auf Schwer selten gewonnen wird. Abstimmung in Story 11.27, nichts weggetunt.

Verkettet nach Akt 1 (`pnpm sim --campaign act2 --runs 50`, 2-3 nach 2-2, P = 14): Leicht 50 Läufe erreichen 2-3, 100 % / 0,20 Niedergestreckte / 0,14 Tote, Runden 7/8/10; Normal 46, 100 % / 0,70 / 0,33, 6/9/14, Ilka 57 %; Schwer 24, 100 % / 0,54 / 0,29, 15/18/19 (Sieg über dem Korridor). Act-1-Basislauf unverändert (`pnpm sim:diff`: kein Wert über 0,02).

<details><summary>Abweichungen vom Entwurf</summary>

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_3_rabenweide` | `m2_3_rabenweide` | Karten-Id des Knotens |
| `scn.s2_3.*` | `scn.m2_3.*` | Szenen-Schema `scn.<knoten>.*` |
| `unit.silver_lance.name` | `unit.lance_knight.name` (Ritter) / `unit.lance_squire.name`, Figuren des Pools `silver_lance` | Schlüssel existiert nicht |
| `level` + `levelOffset` | nur `levelOffset` | Story 11.2 |
| Plänkler mit `iron_lance` | `iron_sword` | Klasse `skirmisher` führt keine Lanze |
| Rowena Stufe 14 | Leutnant-Stufe; `steel_lance`, `rowenas_lance` nur Beute | 11.5, 11.12 |
| Trigger `t_rowena` (`unit_dies`) | gestrichen; Aufgabe in der Nachszene | Leutnants fliehen bei 0 KP (F1 = A) |
| Ilka Stufe 11, `hunting_bow`, Szene `scn.s2_3.ilka_talk` | Werte aus `units.yaml` (P − 1, `steel_bow`), `scn.m2_3.ilka_talk`, `by: any` | 11.5, F3 = A |
| Aure ohne Brücke, mittlere Furt drei Felder | Steg (`footbridge`) auf der Straße [10,12]–[10,13], Furt daneben [9] und [11] | F5 = C [ASSUMPTION A1] |
| Zaun (`fence`) | Koppelzaun `paddock` (Modelle paddock_straight/_corner nach Nachbarn), geschlossene Koppeltore `paddock_gate` in der Nordlinie [4,5], [16,5]; Werte wie Zaun | F6 = D [ASSUMPTION A2] |
| Kulissenhäuser im Hof | Ställe `stable_a` (zwei Felder), Scheunen `barn_a`, Heu `hay_a` per `propVariants` | F6 = D |
| `goldReward: 1200`, keine Anker | 2 000, Anker `rout` (Südweide, Ziel [10,16]) und `defend` (Gestütshof, Ziel [10,3], 5 Runden) | F8 = A [ASSUMPTION A3 für die Runden] |
| Rowenas Fluchtzeile „… Nicht, wann er aufgibt.“ | „… Das ist keine Schande.“ (DE/EN) | F1 = A |

</details>

**Offen:** Spielbild bei 375 × 812 (Lautstärken 0) – die Browser-Ansicht war während der Story verborgen, Sichtprüfung der Koppel- und Stallmodelle auf dem Brett steht aus.
