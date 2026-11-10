# 2-6 Gold für Banditen · Entwurf 1

**Kurz:** M 22×26 · Abend · alle besiegen · 10 eigene gegen 28 (2,8 : 1) · Leutnants **Grell**, **Sable** · Beitritt **Nell** · **veränderliche Karte**

- **Krähenholm:** Landung am Südstrand, in der Mitte ein Klippenrücken, im Norden die Bucht mit Grells Schiff.
- **Zwei Wege** nach Norden: der bewachte **Klippenpfad** über Plateau und Felsnase oder die **Sandbank** im Osten.
- **Ebbe und Flut:** Die Sandbank liegt nur von Runde 4 bis 8 frei, in Runde 9 ist sie wieder Wasser. Davor kommt eine Warnung.
- **Sable** übergibt auf der Felsnase Dravns Gold, die Truhe ist das Beweisstück. Hat sie bei E7 gewechselt, steht dort ein Hauptmann und sie belastet Dravn in einer Szene.
- **Nell** versteckt sich im Nordwesten, wer sie anspricht, gewinnt sie.

![Raster](s2_2_6_kraehenholm.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 24 · N 28 · S 32, Stufe P−3 bis P−1 (hier 12–14), Leutnants P+1 bis P+2; das Blatt zählt Sable und Hauptmann beide |
| Aufstellung | 10 von 15 Feldern, Pflicht Rhen und Lucan |
| Nebenziele | Nell gewinnen · Dravns Gold bergen |
| Phasen | R1–3 Landung · R4–8 Ebbe · R9–14 Flut |
| Formatwünsche | Modelle Schiff, Boot, Kai, Flags für E7 |
| Datei | `levels/s2_2_6_kraehenholm.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Der Hauptmann ist kein Leutnant mehr. Die Flut trägt `warn: true` (Warnung ab Runde 8). Nell ist Gast.

**Nachtrag Review 11.10:** Genau eine Figur hält die Stelle: der Hauptmann mit `e7_warned`, sonst Sable (`requires: [{ not: { flag: e7_warned } }]`), auch ohne E7 und wenn beide Flags gesetzt wären.

## Übernahme Story 11.17 (2026-11-10)

Ins Spiel übernommen als `content/acts/act2/maps/m2_6_kraehenholm.yaml` (Knoten `m2_6`, Ort `kraehenholm`, Akt 2 unveröffentlicht, sichtbar mit `pnpm dev:act2`, Lab `kraehenholm-2-6` bzw. `kraehenholm-2-6-warn`). Gelände, Stufen (Plateau `terrace`, Felsnase `crag`), Truhe, Aufstellung, Wellen, Ziele und die Gezeiten wie im Entwurf.

**Sim [C]** (`pnpm sim m2_6_kraehenholm --campaign act2 --start expected --runs 50`, Normal; 2-2 bis 2-4 noch ohne Karte, gespielt werden 2-1, 2-5, 2-6; Armee-Stufe 16,3 statt erwartet 17):

| Variante | Sieg | Runden p10/p50/p90 | Niedergestreckte | Tote | Gold |
|---|---|---|---|---|---|
| ohne E7 / obey (Sable) | 100 % | 12 / 13 / 19 | 1,61 | 0,08 | 2 000 + 6 Nebenziele |
| `e07=warn` (Hauptmann) | 100 % | 12 / 14 / 18 | 1,73 | 0,10 | 2 000 + 6 Nebenziele |

Niedergestreckte über dem Korridor (0,4–1,3), Sieg 100 % über ≤ 95 %. Die KI holt Nell fast nie (2 %) und öffnet die Truhe nie (0 %): Nell steht weit im Nordwesten hinter der Bucht, die Truhe braucht einen Schlüssel. Nur berichtet, Abstimmung in Story 11.27.

**Abweichungen vom Entwurf:**

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_6_kraehenholm`, `scn.s2_6.*` | `m2_6_kraehenholm`, `scn.m2_6.*` | Karten-Id des Knotens, Szenen-Schema |
| `level` + `levelOffset` | nur `levelOffset`, Figuren per `sprite` (Schmuggler `unit.smuggler.name`) | Story 11.2, 11.7 |
| Nell Stufe 8 mit Eisendolch | Werte der Gefährtin (`units.yaml`), Stufe P − 1 | Story 11.5, wie Amos in 2-5 |
| Grell Raufbold mit Stahlaxt | Plänkler mit Stahlschwert | Klasse seiner Leutnant-Definition, die auch Heimsuchungen nutzen [ASSUMPTION] |
| Hauptmann „gleiche Werte“ wie Sable | `levelOffset: 1` (P + 1) | Der Hauptmann ist kein Leutnant (Korrektur 11.10) |
| `goldReward: 1400` | 2 000 (+ 800 in der Truhe) | Goldkurve von Akt 2, wie 2-1 und 2-5 [ASSUMPTION] |
| keine Heimsuchungs-Anker | `rout` (Südstrand), `treasure` (Nordbucht) | Muster 2-1; je Variante nur ein Anker [ASSUMPTION] |
| „Fenn öffnet ohne Schlüssel“ | Nell öffnet mit ihrem Schlüssel, sonst der von Sable/Hauptmann | Nell trägt `door_key` (`units.yaml`) |
| „Sable belastet Dravn in einer Szene“ | Trigger `t_proof` → `scn.m2_6.gold_proof` beim Betreten der Felsnase | Truhen lösen keinen Trigger aus [ASSUMPTION] |
| — | `scn.m2_6.burnt_village` als Nachspiel des Knotens (`epilogues`) nur bei `e07: warn`, Bild `brandhang` | Beat 9 auf dem Rückweg [ASSUMPTION F1, F4] |
| Modelle Schiff, Boot, Kai | Gebäude, Sand | Modelle fehlen (Matrix), nicht Teil der Story |
