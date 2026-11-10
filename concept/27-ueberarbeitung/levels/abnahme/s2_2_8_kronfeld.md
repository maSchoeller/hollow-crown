# 2-8 Kronfeld · Entwurf 1

**Kurz:** G 30×40 · Abend · 6 Figuren aufs Nordufer retten · 15 eigene gegen 40 (2,7 : 1) · Leutnants **Rowena**, **Grell**, **Brakka**, **Sable** · **veränderliche Karte**

- Der **neutrale Treffpunkt** ist die Falle: Die Truppe steht auf dem Hügel in der Mitte, die vier Mächte kommen von allen Seiten.
- **Überleben, dann ausbrechen:** Das Brückentor ist zu. In **Runde 6 zögert Rowena**, das Tor geht auf, und ihre Leute halten still.
- Wer früher weg will, muss zur **Furt** im Osten. Sie ist weit und wird ab Runde 9 von Lanzen gesperrt.
- **Brakkas Balliste** steht auf dem Osthügel und reicht bis zum Treffpunkt. Wellen kommen in Runde 3 und 5 über die Ebene.
- Hat Sable bei E7 gewechselt, führt im Süden der Hauptmann.

![Raster](s2_2_8_kronfeld.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 36 · N 40 · S 46, Stufe P−3 bis P−1 (hier 16–18), Leutnants P+1 bis P+2; das Blatt zählt Sable und Hauptmann beide |
| Aufstellung | 15 von 24 Feldern, Pflicht Rhen und Lucan |
| Sieg | 6 Figuren aufs Nordufer (Vorschlag, per `pnpm sim` prüfen) |
| Nebenziele | niemand fällt · binnen 14 Runden |
| Phasen | R1–5 überleben · R6–9 das Tor · R10–15 Ausbruch |
| Formatwünsche | Regel Balliste, Modelle Zelt, Boden Herbst |
| Datei | `levels/s2_2_8_kronfeld.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Die Balliste auf dem Hügel steht jetzt auf dem Gelände `ballista`, auf Stufe 2. Der Hauptmann ist kein Leutnant mehr.

**Nachtrag Review 11.10:** Genau eine Figur hält die Stelle: der Hauptmann mit `e7_warned`, sonst Sable (`requires: [{ not: { flag: e7_warned } }]`), auch ohne E7 und wenn beide Flags gesetzt wären.

## Übernahme Story 11.19 (2026-11-10)

Ins Spiel übernommen als `content/acts/act2/maps/m2_8_kronfeld.yaml` (Knoten `m2_8`, Finale von Akt 2, Ort `kronfeld`, Akt 2 unveröffentlicht, sichtbar mit `pnpm dev:act2`, Lab `kronfeld-2-8`). Gelände, Höhen, Balliste, Brückentor (R6), Wellen (R3/R5/R7/R9), Aufstellung und Nebenziele wie im Entwurf. Szenen `scn.m2_8.intro`, `.hollow_crown` (R1), `.rowena_hesitates` (R6), `.ford`, `.outro` mit den Folgen von E5–E8.

**Sim [C]** (50 Läufe, nur berichtet, Abstimmung in Story 11.27):

| Lauf | erreicht | Sieg | Runden p10/p50/p90 | Niedergestreckte | Tote | Gold | Armee-Stufe |
|---|---|---|---|---|---|---|---|
| Normal verkettet (`--campaign act2`) | 38 / 50 | 8 % | 17 / 18 / 19 | 6,00 | 1,60 | 3 000 | 22,4 (erwartet 19) |
| Normal `--start expected --map-file` (30 Läufe) | 26 / 30 | 19 % | 12 / 20 / 24 | 6,88 | 2,13 | 3 133 | 22,5 |
| Probe `min: 4` statt 6 (30 Läufe) | 26 / 30 | 31 % | 12 / 20 / 28 | 6,88 | 2,70 | 3 175 | 22,5 |
| Schwer `--start expected` | 2 / 50 | 0 % | – | 7,50 | 0 | 0 | 22,9 |

Weit unter dem Korridor (Normal ≥ 75 %, Schwer ≥ 30 %), Niedergestreckte weit darüber. `min: 6` ist nicht die Hauptursache (Probe mit 4: 31 %); die Truppe stellt im Schnitt nur 7,7 bis 10 Figuren gegen 40 Gegner auf. Schwer: verkettet erreichen nur 2 Läufe die Karte (vorbestehend an 2-4/2-7). Der Wert `min: 6` bleibt wie im Entwurf; Gegnerzahl, Wellen und Flucht stimmt 11.27 ab.

**Abweichungen vom Entwurf:**

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_8_kronfeld`, `scn.s2_8.*` | `m2_8_kronfeld`, `scn.m2_8.*` | Karten-Id des Knotens, Szenen-Schema |
| `level` + `levelOffset` | nur `levelOffset`, Figuren per `sprite` | Story 11.2, 11.7 |
| `silver_lance`, `crown_soldier`, `smuggler`, `mercenary` | `lance_knight`, `lance_squire`, `privateer`, `free_blade` | vorhandene Namen aus 11.7 |
| Grell `brigand` mit `steel_axe` | `skirmisher` mit `steel_sword` | Leutnant-Regel |
| `victory: escape`, Phase über das Tor | `survive 5 → escape`, `min 6`, `must: [avatar, lucan]` | Ziel-Phasen (Story 11.8) |
| keine Regel an der Furt | Trigger `t_ford` beginnt die Flucht sofort | „Wer früher weg will“ [ASSUMPTION F7] |
| `goldReward: 2000` | 3 000 (+ 800 + 500 Nebenziele) | Finale am oberen Rand [ASSUMPTION F4] |
| keine Heimsuchungs-Anker | `rout` (Treffpunkt), `treasure` (Osthügel) | Muster 2-1/2-5–2-7 |
| Modelle Zelt, Banner | `stall`, keine Banner | Modelle fehlen (Matrix), nicht Teil der Story |
