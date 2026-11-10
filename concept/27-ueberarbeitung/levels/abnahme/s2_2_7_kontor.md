# 2-7 Das Kontor am Silbermeer · Entwurf 1

**Kurz:** M 20×25 · Regen · Schreibstube erreichen · 10 eigene gegen 26 (2,6 : 1) · Leutnant **Brakka** · **veränderliche Karte**

- Ein **Hafenbecken** teilt die Karte, nur eine Steinbrücke führt hinüber, und **Brakkas Balliste** hält sie unter Feuer.
- **Hebel am Kran** im Osten: Er legt einen **Steg** über das Becken und öffnet den Weg zur Ostseite.
- Das **Kontor** hat zwei verschlossene Eingänge. Den Schlüssel trägt der **Zahlmeister** an der Ostseite, Fenn braucht keinen.
- Eine Figur in der **Schreibstube** genügt, die Chronik-Seite liegt in der Nordostecke desselben Raums.
- Wellen in Runde 3, 5 und 7 von den Kais und von hinten.

![Raster](s2_2_7_kontor.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 22 · N 26 · S 30, Stufe P−3 bis P−1 (hier 14–16), Leutnants P+1 bis P+2 |
| Aufstellung | 10 von 14 Feldern, Pflicht Rhen und Lucan |
| Nebenziele | Chronik-Seite · binnen 12 Runden |
| Phasen | R1–4 Südkai · R5–8 über das Becken · R9–13 Kontor |
| Formatwünsche | Modelle Kai, Lagerhaus, Kran, Schiff, Regel Balliste |
| Datei | `levels/s2_2_7_kontor.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Die Balliste am Kai steht jetzt auf dem Gelände `ballista`.

## Übernahme Story 11.18 (2026-11-10)

Ins Spiel übernommen als `content/acts/act2/maps/m2_7_kontor.yaml` (Knoten `m2_7`, Ort `kontor`, Akt 2 unveröffentlicht, sichtbar mit `pnpm dev:act2`, Lab `kontor-2-7`). Gelände, Türen, Balliste, Kran-Hebel und Steg, Truhe, Aufstellung, Wellen (R3/R5/R7) und Ziele wie im Entwurf. E8 in `scn.m2_7.outro`, Chronik-Seite `a2_kontor` mit Saat Pakt in `scn.m2_7.page`.

**Sim [C]** (`pnpm sim --campaign act2 --runs 50`, verkettet ab Akt 1):

| Stufe | erreicht | Sieg | Runden p10/p50/p90 | Niedergestreckte | Tote | Gold | Armee-Stufe |
|---|---|---|---|---|---|---|---|
| Normal | 39 / 50 | 92 % | 12 / 14 / 17 | 0,44 | 0,11 | 2 042 (Nebenziele 42) | 21,5 (erwartet 18) |
| Schwer (`--start expected`; verkettet endet jeder Lauf an 2-4) | 9 / 50 | 22 % (2 / 9) | 12 / 13 / 13 | 0,89 | 1,00 | 2 200 | 22,8 (erwartet 18) |

Normal im Korridor bei Sieg und Niedergestreckten; Schwer mit 22 % unter dem Korridor (≥ 70 %), bei nur 9 Läufen, die 2-7 erreichen; Nebenziel-Gold unter dem Anteil (Seite 0 %, 12 Runden 11 %: die KI öffnet die Truhe nicht), Armee-Stufe über der Erwartung. Nur berichtet, Abstimmung in Story 11.27.

**Abweichungen vom Entwurf:**

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_7_kontor`, `scn.s2_7.*` | `m2_7_kontor`, `scn.m2_7.*` | Karten-Id des Knotens, Szenen-Schema |
| `level` + `levelOffset` | nur `levelOffset`, Figuren per `sprite` | Story 11.2, 11.7 |
| `unit.mercenary.name`, `unit.kontor_guard.name` | `unit.free_blade.name` (Brakkas Freie Klingen), `unit.counting_guard.name`, Zahlmeister `unit.purser.name` | vorhandene Schlüssel aus 11.7 |
| flach | Nordkai (rect [1,0,18,10]) Stufe 1, Treppen [9,11], [10,11], [18,11]; Schützen n3/n4 auf y 10 | Höhenstufen [ASSUMPTION F4] |
| Steg-Pfad über [16,7] | über [18,11] (Treppe) hinauf | Lagerhaus [15,10] versperrt den direkten Aufgang |
| `chron_a2_ledger` | `a2_kontor` „Die letzte Seite“, dazu `scn.m2_7.page` | Schema der Akt-2-Seiten [ASSUMPTION F3] |
| `goldReward: 1300` | 2 000 (+ 300 Truhe, + 400 Nebenziel) | Goldkurve von Akt 2 [ASSUMPTION F6] |
| keine Heimsuchungs-Anker | `rout` (Südkai), `treasure` (Nordkai) | Muster 2-1/2-5/2-6 [ASSUMPTION] |
| Modelle Kai, Lagerhaus, Kran, Schiff | Gebäude, Wagen, Hebel | Modelle fehlen (Matrix), nicht Teil der Story |
