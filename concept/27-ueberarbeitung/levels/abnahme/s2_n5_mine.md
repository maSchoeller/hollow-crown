# N5 Glut unter dem Berg · Entwurf 1

**Kurz:** K 16×20 · Innen, Nebel · 4 Truhen in 12 Runden · 7 eigene gegen 15 (2,1 : 1) · Beitritt **Brann** · kein Leutnant

- **Enge Stollen**, vier Truhen in vier Winkeln: Wer alles holen will, muss sich aufteilen.
- Zur **Knochenhalle** führen die verschlossene Mitteltür (Schlüssel beim Vorarbeiter, Fenn braucht keinen) oder das **Gatter im Osten**, das ein Hebel öffnet.
- **Brann** sitzt im Westgang, Ilka oder Lucan sprechen ihn an.
- In der Halle liegen **Drachenknochen** im Fels (Saat), dazu Relikt Drachenglut und Erd-Rune III.

![Raster](s2_n5_mine.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 12 · N 15 · S 18, Stufe P−3 bis P−1 (bei P 15: 12–14), Vorarbeiter ohne Leutnant-Rang |
| Aufstellung | 7 von 10 Feldern, Pflicht Rhen und Lucan |
| Nebenziele | Brann gewinnen · binnen 9 Runden · niemand fällt |
| Truhen | Drachenglut · Erd-Rune III · Chronik-Seite · Mondstahl ×3 |
| Formatwünsche | Modelle Glutader, Drachenknochen, Lore |
| Datei | `levels/s2_n5_mine.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Brann ist Gast: Er tritt nur bei, wenn Ilka oder Lucan ihn ansprechen.

## Übernahme Story 11.21 (2026-11-09)

**Kurz:** Karte `content/acts/act2/maps/n5_kupfermine.yaml` (Knoten `n5`, nach 2-4) · Innen, Nebel, eben · Sim Normal 96 % Sieg, Median 8 Runden, 0,34 Niedergestreckte · Brann tritt über Ilka oder Lucan bei · Belohnung Glutfunke + 2 000 Gold [ASSUMPTION].

<details><summary>Abweichungen und Simulation</summary>

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_n5_mine` | `n5_kupfermine` | Karten-Id des Knotens |
| `level` + `levelOffset` | nur `levelOffset` | Story 11.2 |
| Gegner ohne Figur | Figuren wie Pool `silver_sea` (brigand, mercenary, bandit_archer); Namen „Plünderer der Herzogin“, „Vorarbeiter“ neu in den Akt-2-Locales | Plünderer des Hauses Silbermeer [ASSUMPTION] |
| nur der Vorarbeiter trägt einen Schlüssel | dazu a2 (Schacht), c1 (Ostgang), d1 und d2 (Halle) | Truhen brauchen Schlüssel oder Späher; die Jagd hängt nicht an Fenn (Regel 9.8) [ASSUMPTION] |
| zwei Türfelder | zwei verknüpfte Flügel: ein Schlüssel oder Fenn öffnet beide | Muster Torhaus 1-6 |
| Brann Stufe 8, `rockfall` | `char: brann`, Werte aus `units.yaml` (Stufe P − 1, `stone_fist`, `rockfall`) | Story 11.5 |
| `t_bones` beim Öffnen der Drachenglut | `scn.n5.bones` beim Betreten der Knochenhalle, `scn.n5.relic` an der Truhe | Knochen tragen die Saat, Relikt eigene Szene |
| Chronik-Seite `a2_mine` (fehlte) | neue Seite in `content/acts/act2/chronicle.yaml` (erste Seite von Akt 2) | Text Vorschlag [ASSUMPTION] |
| `goldReward: 1500` | 2 000 | Goldkurve Akt 2 wie 2-1 [ASSUMPTION] |
| keine Heimsuchungs-Anker | keine (unverändert) | Heimsuchungen spielen nur auf Karten von Story-Knoten, wie N1–N3 |
| Innen-Look | `interior`, `timeOfDay: indoor`, rote Glutadern und Grubenlampen als `lights`, keine Höhenstufen (Entwurf eben) | Muster Gewölbe 1-7 |

**Simulation** [C]: Die Kampagnen-Simulation spielt nur Story-Knoten; N5 wurde als Kopie der Karte an Stelle von 2-2 gespielt
(`pnpm sim --campaign act2 --start expected --runs 50 --map-file .sim/n5_probe.yaml --node m2_2 --position 16`, P = 16 wie nach 2-4, Truppe nach 2-1 mit Jory, **ohne Ilka**, weil 2-3 noch nicht gebaut ist).

| | Sieg | Runden p10/p50/p90 | Niedergestreckte | Tote | Brann | in 9 Runden | niemand fällt |
|---|---|---|---|---|---|---|---|
| Leicht | 100 % | 6/6/7 | 0,00 | 0,00 | 92 % | 100 % | 100 % |
| Normal | 96 % | 7/8/10 | 0,34 (unter dem Korridor 0,4–1,3) | 0,08 | 8 % | 80 % | 68 % |
| Schwer | 82 % | 8/9/12 | 0,50 | 0,13 | 0 % | 55 % | 72 % |

Sieg heißt alle vier Truhen. Brann: Die Simulator-KI spricht ihn nur an, wenn Lucan nichts anderes zu tun hat; die Quote sagt über Spieler wenig. Abstimmung in Story 11.27.

</details>
