# 2-2 Das Siegel im Salzpass · Entwurf 1

**Kurz:** K 16×20 · Nebel · Truhe binnen 11 Runden öffnen · 7 eigene gegen 16 (2,3 : 1) · Leutnant **Grell** · **veränderliche Karte**

- Enger Pass mit drei Kammern. Die **Straße** ist sicher, aber lang, die schmale **Felsleiste** im Osten ist kurz, aber von Schützen besetzt.
- **Steinschlag:** Runde 3 engt die Südenge ein, Runde 5 die Nordenge auf ein Feld, Runde 8 sperrt die Leiste. Die Straße bleibt immer offen.
- **Nebel:** Man sieht nur, was die eigenen Figuren sehen. Fenn sieht weiter und öffnet die Siegeltruhe ohne Schlüssel, sonst trägt ihn Grells Zahlmeister.
- **Kundschafter aus Kharesh** warten im Westwinkel, ihre Truhe trägt die Saat. In Runde 6 schließt Grells Nachhut von Süden auf.

![Raster](s2_2_2_salzpass.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 13 · N 16 · S 19, Stufe P−3 bis P−1 (hier 9–11), Leutnants P+1 bis P+2 |
| Aufstellung | 7 von 9 Feldern, Pflicht Rhen und Lucan |
| Nebenziele | alle drei Truhen (eine mit Chronik-Seite) |
| Phasen | R1–3 Südenge · R4–7 Mittelkammer · R8–11 Karawane |
| Formatwünsche | Gegenstand Siegel, Chronik-Seite, Leutnant `grell` |
| Datei | `levels/s2_2_2_salzpass.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Der zweite Steinschlag (Runde 5) trägt `warn: true`: Ab Runde 4 zeigt der HUD die Warnzeile und das Brett schraffiert die Felder. Das Flag `m2_2_seal` ist im Paket `act2` deklariert (Platzhalter bis 11.5).

## Übernahme Story 11.13 (2026-11-09)

Ins Spiel übernommen als `content/acts/act2/maps/m2_2_salzpass.yaml` (Knoten `m2_2`, Akt 2 unveröffentlicht, sichtbar mit `pnpm dev:act2`, Lab `salzpass-2-2`). Gelände, Leiste, Rampe, Treppe, Truhen, Aufstellung, Nachhut, Steinschlag und Ziele wie im Entwurf. Offene PO-Fragen F1–F5 vorläufig nach Vorschlag umgesetzt, Stellen mit `[PO offen F<n>]` markiert.

**Sim [C]** (`pnpm sim m2_2_salzpass --campaign act2 --start expected --runs 50`, 2-2 nach 2-1, P = 13, 7 eigene):

| Stufe | Sieg | Niedergestreckte | Tote | Runden p10/p50/p90 | Korridor |
|---|---|---|---|---|---|
| Leicht | 100 % | 0,10 | 0,00 | 5/6/6 | im Korridor |
| Normal | 100 % | 0,37 | 0,08 | 6/7/8 | Niedergestreckte knapp darunter (0,4–1,3) |
| Schwer | 20 % | 0,90 | 0,16 | 10/11/11 | Sieg darunter (30–70 %), Niederlagen an der Frist |

Späteste Position (`--position 14`, P = 14, Normal): 100 %, 0,28 Niedergestreckte, 0,02 Tote. Verkettet nach Akt 1 (`pnpm sim --campaign act2 --runs 50`): Leicht 50 Läufe erreichen 2-2, 100 % / 0,50 / 0,00; Normal 46, 100 % / 0,46 / 0,00; Schwer 26, 58 % / 0,04 / 0,04. Gold 2 000 (+ 500 in Truhen). Nebenziel „alle Truhen“ 0 % auf allen Stufen: die Sim-KI öffnet nur die Siegeltruhe (Befund, KI nicht umgebaut). Abstimmung in Story 11.27.

<details><summary>Abweichungen vom Entwurf</summary>

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_2_salzpass` | `m2_2_salzpass` | Karten-Id des Knotens (11.3/11.11) |
| `scn.s2_2.*` | `scn.m2_2.*` | Szenen-Schema `scn.<knoten>.*` |
| `level` + `levelOffset` | nur `levelOffset` | Story 11.2 |
| Grell `brigand`, `steel_axe`, Stufe 13 | `skirmisher`, `steel_sword`, Stufe nach der Leutnant-Regel | `lieutenants.yaml` (11.5); Muster Brakka |
| `unit.smuggler.name`, `unit.kharesh_scout.name` | neue Schlüssel „Schmuggler“, „Kundschafter aus Kharesh“, Figuren des Pools `silver_sea` | fehlten [ASSUMPTION] |
| `c_seal` mit `vulnerary` | leer, Szene `scn.m2_2.seal_found` + Flag `m2_2_seal` | F1 Vorschlag A (vorläufig) |
| Zweifel „Wer schreibt der Prinzessin?“ | Brief mit grauem Wachs beim Siegel, niemand benennt ihn | F2 Vorschlag C (vorläufig) |
| `chron_a2_salzpass` | `a2_salzpass` in `acts/act2/chronicle.yaml` | F3 Vorschlag A (vorläufig) |
| `c_scouts` nur 200 Gold | 200 Gold + Szene `scn.m2_2.scouts_chart` (Seekarte) | F4 Vorschlag A (vorläufig) |
| `goldReward: 900` | 2 000 | F5 Vorschlag A (vorläufig) |
| Kundschafter „fliehen nach Westen“ | Profil `trigger → aggressive` | Westwinkel ist Sackgasse |
| keine Anker | `rout` Mittelkammer (Ziel [8,10]), `treasure` Nordkammer bei den Wagen (Ziel [7,2]) | wie 2-1; Südkammer läge im Startbereich |

</details>
