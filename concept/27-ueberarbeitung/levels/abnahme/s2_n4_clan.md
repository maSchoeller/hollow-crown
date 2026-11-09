# N4 Der Clan im Schnee · Entwurf 1

**Kurz:** M 20×24 · Schnee, Nebel · 9 Runden überstehen · 8 eigene gegen 20 (2,5 : 1) · Ilka Pflicht · kein Leutnant

- **Clanlager** auf einer Lichtung, **Dravns Vorposten** kommen im Nebel aus dem Wald von allen vier Seiten.
- **Felsnase** im Nordwesten (über Rampe und Treppe): der einzige Blick über den Nebel, wer dort steht, fehlt am Lager.
- Die **Clanälteste** steht mitten im Lager und kann fallen (Nebenziel, keine Niederlage).
- Belohnung: Glutfunke und Ilkas Signaturbogen, auch in der Gedenk-Variante.

![Raster](s2_n4_clan.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 17 · N 20 · S 23, Stufe P−3 bis P−1 (bei P 14: 11–13), Hauptmann ohne Leutnant-Rang |
| Aufstellung | 8 von 10 Feldern, Pflicht Rhen, Lucan, Ilka |
| Nebenziele | niemand fällt · beide Zelte · Älteste schützen |
| Phasen | R1–3 aus dem Nebel · R4–9 Lager halten |
| Formatwünsche | bedingte Pflichtfigur (Ilka nur, wenn sie lebt) |
| Datei | `levels/s2_n4_clan.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Ilka ist Pflicht, solange sie in der Truppe ist; gefallen oder gegangen entfällt sie (gilt ohne Formatänderung, `presentForced`).

## Übernahme Story 11.20 (2026-11-09)

**Kurz:** Karte `content/acts/act2/maps/n4_clanlager.yaml` wie Entwurf (Gelände, Höhen, Gegner, Wellen, Nebenziele, Gold 1 400), Schnee über `season: winter` + `weather: snow`, Nebel `fog: true`. Neu: Sicht je Höhenstufe und der Weißwolf.

<details><summary>Abweichungen und Zahlen</summary>

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_n4_clan` | `n4_clanlager` | Karten-Id des Knotens |
| `unit.dravn_outpost.name` | `unit.border_soldier.name` („Grenzsoldat“), Figuren des Pools `iron_march` | Dravns Grenzheer (11.7); Ritter mit Figur `soldier` |
| `level` + `levelOffset` | nur `levelOffset` | 11.2 |
| Felsnase „sieht über den Nebel“ (nur Text) | Regel `balance.yaml fog.levelBonus: 2` je Höhenstufe ab Stufe 2 (`levelBonusFrom`) [ASSUMPTION]: Felsnase +4, Terrasse und Wehrgang ohne (Akt-1-Nebelkarten unverändert) | Format kannte keine Höhensicht |
| Signaturbogen `white_wolf` | Item mit Werten des Eisenbogens, Skill `white_wolf_sight` (+3 Sicht unter Nebel) [ASSUMPTION] | items.md §6.2 |
| Älteste ohne Figur | Figur und Porträt `villager_elder`, spricht in den Szenen nur in Erzählzeilen [ASSUMPTION] | keine eigene Halbfigur |
| keine Heimsuchungs-Anker | keine | Heimsuchungen nur auf Story-Karten (wie N1–N3) |
| Szenen `scn.s2_n4.*` (keine) | `scn.n4.intro/outro`, Gedenk-Variante `scn.n4.memorial_intro/outro` | Akt-1-Schema, Muster N3 |

**Simulation** (`pnpm sim --campaign act2 --start expected --order n4 --runs 50`; N4 nach 2-1, 2-2/2-3 ohne Karte übersprungen, Ilka tritt beim übersprungenen 2-3 bei; erwartete Stufe 15):

| | Sieg | Runden p50 | Niedergestreckte | Tote | Älteste geschützt | niemand fällt | Zelte | Gold |
|---|---|---|---|---|---|---|---|---|
| Leicht | 100 % | 9 | 0,24 | 0,00 | 92 % | 82 % | 100 % | 2 176 |
| Normal | 100 % | 10 | 1,88 ↑ | 0,41 | 2 % | 16 % | 100 % | 1 906 ↓ |
| Schwer | 59 % | 10 | 4,04 | 1,95 | 0 % | 0 % | 48 % | 1 639 ↓ |

Auffällig (Abstimmung in 11.27, nicht still geändert): Normal über dem Korridor der Niedergestreckten (0,4–1,3); die Älteste überlebt auf Normal fast nie (die KI der Truppe schützt sie nicht gezielt, drei Schützen mehr als auf Leicht); Gold unter der Akt-2-Kurve (2-1 wurde auf 2 000 gehoben); Schwer nur 59 % Sieg.

</details>
