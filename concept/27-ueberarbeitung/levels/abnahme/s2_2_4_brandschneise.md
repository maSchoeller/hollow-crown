# 2-4 Die Brandschneise · Entwurf 1

**Kurz:** G 30×40 · Abend, Asche · Brann 12 Runden verteidigen · 12 eigene gegen 38 (3,2 : 1) · Leutnant **Grell** · Sable sieht zu · **veränderliche Karte**

- **Drei Stufen:** oben Wald und Getreide, in der Mitte das Dorf, unten Felder. Durch die Kanten kommt man nur über Rampen und Treppen, Schützen oben schießen weiter.
- **Feuer** frisst sich von Norden durch den Wald. **Brann** steht auf dem Schrein und reißt in Runde 3 und 6 die Schneise auf, die das Dorf rettet.
- **Plünderer** in den Flanken gehen auf die Häuser, nicht auf die Truppe. Wer sie schützen will, muss sich teilen.
- **Grell** kommt in Runde 6 über das Verbrannte, weitere Wellen von Süden, Westen und Osten.
- **Sable** steht als Dravns Offizierin auf einer Lichtung und greift nicht ein (danach E7).

![Raster](s2_2_4_brandschneise.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 33 · N 38 · S 44, Stufe P−3 bis P−1 (hier 11–13), Leutnants P+1 bis P+2 |
| Aufstellung | 12 von 18 Feldern im Dorf, Pflicht Rhen und Lucan, Brann als Gast |
| Niederlage | Rhen, Lucan oder Brann fallen |
| Nebenziele | alle 4 Häuser besuchen · Chronik-Seite in der Köhlerruine |
| Phasen | R1–4 Brand · R5–8 Häuser halten · R9–12 Durchhalten |
| Formatwünsche | Leutnant `grell`, Modelle Getreideterrasse und Stützmauer |
| Datei | `levels/s2_2_4_brandschneise.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Brann ist Gast (`guest: true`): nicht steuerbar, Schutzziel, tritt nach der Mission nicht bei (das geschieht in N5). Wetter Asche ist jetzt auch in Akt 2 erlaubt (`render.yaml`).

## Übernahme Story 11.15 (2026-11-10)

Ins Spiel übernommen als `content/acts/act2/maps/m2_4_brandschneise.yaml` (Knoten `m2_4`, Ort `brandschneise`, Akt 2 unveröffentlicht, sichtbar mit `pnpm dev:act2`, Lab `brandschneise-2-4`, Blatt `levels/out/m2_4_brandschneise.svg`). Gelände, Stufen, Aufstellung, Gegner, Wellen R3/R5/R6/R8/R9/R10, Schneise R3/R6 und Ziele wie im Entwurf. Die PO-Fragen F1–F6 sind noch offen; umgesetzt ist jeweils der Vorschlag (`[ASSUMPTION]` in Karte, Szenen und Chronik).

- **Feuer (F1 = A vorläufig):** feste Feuerfront über die neue Trigger-Aktion `ignite`, je eine Runde vorher angekündigt (gestreifte Felder, Zeile „Geländewechsel in Runde n: Brennendes Feld“). West R2 y 4–7, R3 y 8–11, R4 y 12–16; Ost je zwei Reihen, R7 y 14–16. Jede Kante brennt eine Runde nach ihrer Schneise; südlich y 17 brennt nie etwas (Test über acht Seeds).
- **Sable (F4 = D vorläufig):** ohne Waffe auf einer Lichtung aus `plain`, unangreifbar, geht in Runde 7 nach ihrer Szene. **E7 (F2 = A, F3 = A vorläufig)** in der Nachszene, danach Maelis' Brief mit drei Haltungen. **Gold 2 500 (F5 = B)**, **Chronik `a2_brandhang` (F6 = A)**.

**Sim [C]** (`pnpm sim m2_4_brandschneise --campaign act2 --start expected --node m2_4 --runs 50`, 12 eigene, P = 15):

| Stufe | erreicht | Sieg | Niedergestreckte | Tote | Runden p10/p50/p90 | Häuser / Truhe | Korridor |
|---|---|---|---|---|---|---|---|
| Leicht | 49 | 100 % | 0,41 | 0,06 | 13/13/13 | 100 % / 0 % | im Korridor |
| Normal | 49 | 92 % | 2,27 | 0,82 | 13/13/13 | 80 % / 0 % | Niedergestreckte über 1,3 (↑) |
| Schwer | 24 | 21 % | 1,92 | 1,40 | 12/13/13 | 70 % / 0 % | Sieg unter 30–70 % (↓) |

Gold je Sieg 3 700–3 900 (2 500 + Häuser + Nebenziel), die Sim meldet es über der Kurve (↑) und den Nebenziel-Anteil darunter (↓). Schwer: nur 24 Läufe erreichen 2-4, weil 2-2 auf Schwer selten gewonnen wird. Niederlagen sind fast immer Branns Tod: auf Normal 1 von 10 Läufen (Runde 4), auf Schwer fiel er vor der Änderung unten in allen Läufen in Runde 3, getroffen von den Schwer-Zusätzen h0–h4 und dem Fußvolk aus dem Süden. Darum warten die Schwer-Zusätze jetzt, bis jemand nah kommt (`trigger`, Radius 4) [ASSUMPTION]; Sieg Schwer 13 % → 21 %. Die Sieg-KI öffnet die Köhlertruhe nie (wie in 2-2, Schlüssel trägt a0) und lässt 0–1 von 4 Häusern niederbrennen. Abstimmung in Story 11.27, nichts weiter getunt.

Verkettet nach Akt 1 (`pnpm sim --campaign act2 --runs 50`, 2-4 nach 2-1, 2-2, 2-3): Leicht 50 Läufe erreichen 2-4, 100 % / 1,10 Niedergestreckte / 0,32 Tote, Häuser 58 %; Normal 46, **54 %** / 1,54 / 0,77, im Schnitt nur 5,6 Figuren aufgestellt, Häuser 5 %; Schwer 24, **0 %** (auch mit Neustarts kein Sieg; Brann fällt in Runde 3–4, getroffen von der Nordgruppe, dem Südtrupp und Plünderern). Beide E7-Zweige (`--flags e07=warn` / `obey`) geben dieselben Zahlen, weil hinter 2-4 noch keine Karte liegt. Verkettet Schwer ist die Karte damit nicht gewinnbar, Normal unter dem Korridor: Befund für 11.27 (Hebel: Brann zäher machen, die Nord- und Südgruppe später wecken – ein Versuch mit wartendem Südtrupp änderte nichts). Act-1-Basislauf unverändert (`pnpm sim:diff`: kein Wert über 0,02).

<details><summary>Abweichungen vom Entwurf</summary>

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_4_brandschneise`, `scn.s2_4.*` | `m2_4_brandschneise`, `scn.m2_4.*` | Karten-Id des Knotens, Szenen-Schema |
| `level` + `levelOffset`, P = 14 | nur `levelOffset`, P = 15 | Story 11.2; 2-4 kommt nach drei Story-Missionen |
| Plünderer ohne Figur | Figuren des Pools `silver_sea` | wie 2-2 |
| Grell `brigand`, `steel_axe`, Stufe 15 | `skirmisher`, `steel_sword`, Leutnant-Stufe | `lieutenants.yaml` |
| Brann `level: 8` | Stufe aus `units.yaml`, auf P − 1 gehoben (14, 25 KP) | Einheit mit `char` |
| Sable mit `steel_sword`, `hold`, Lichtung Gras | `items: []`, Lichtung `plain`, geht in R7 | F4 = D vorläufig |
| Feuer nach der vorhandenen Regel | Feuerfront `ignite` (`t_fire_*`) | die Regel erreicht die Schneise nie (F1) |
| Schwer-Zusätze h0–h5 `aggressive` | `trigger`, Radius 4 | Brann fiel auf Schwer immer in R3 |
| Truhe ohne Schlüssel | a0 trägt den Truhenschlüssel | Truhen brauchen Schlüssel oder Späher |
| `chron_a2_brandhang` | `a2_brandhang` | Id-Schema |
| keine Anker | `rout` (untere Felder), `treasure` (Köhlerlager) | PO 2026-11-09 zu 2-1 |
| `goldReward: 1600` | 2 500 | F5 = B vorläufig |
| Szenen `brann_break_*`, `sable_watches` | dazu `grell_battle` (R6), `page`, `intro`, `outro` mit E7 | Story 11.15 |

</details>

Offen: Bild der Karte bei 375 × 812 im Spiel und der Folgen-Karte von E7 (nicht in dieser Nachtsitzung). Weltkarten-Bild `burnt_slope_burnt` liegt vor (`art/prompts/burnt_slope_burnt_site.md`), Abnahme durch den PO offen.
