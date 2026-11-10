# N6 Die Gauklertruppe · Entwurf 1

**Kurz:** K 14×18 · Mittag · Gauklermeisterin zum Boot bringen · 7 eigene gegen 16 (2,3 : 1) · Jory Pflicht · **veränderliche Karte**

- **Herbstmarkt** auf der Aue-Insel: Die Truppe kommt von Süden, holt die Meisterin von der **Bühne** im Norden und bringt sie zum Boot im Südwesten.
- **Flut:** Der Steg im Westen steht in Runde 6 unter Wasser (Warnung in Runde 5), dann bleibt nur die Steinbrücke in der Mitte.
- **Schuldeneintreiber** zwischen Buden und Wagen, Boote in Runde 3 und 5.
- Belohnung: Jorys Signaturlaute, auch in der Gedenk-Variante.

![Raster](s2_n6_gaukler.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 13 · N 16 · S 19, Stufe P−3 bis P−1 (bei P 12: 9–11), Anführer ohne Leutnant-Rang |
| Aufstellung | 7 von 10 Feldern, Pflicht Rhen, Lucan, Jory |
| Niederlage | Rhen, Lucan oder die Meisterin fallen |
| Nebenziele | niemand fällt · beide Stände besuchen |
| Phasen | R1–3 zur Bühne · R4–9 zurück zum Boot |
| Formatwünsche | bedingte Pflichtfigur (Jory nur, wenn er lebt), Modelle Bühne, Boot |
| Datei | `levels/s2_n6_gaukler.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Die Gauklermeisterin ist keine Gefährtin: `escort` mit `join: false`. Der Steg trägt `warn: true` (Warnung ab Runde 5). Jory ist Pflicht, solange er in der Truppe ist (gilt ohne Formatänderung).

## Übernahme Story 11.22 (2026-11-10)

**Kurz:** Karte `content/acts/act2/maps/n6_auemarkt.yaml` · Herbst (Jahreszeit des Akts) · Bühne Terrasse St.1 mit Treppe · Steg ab Runde 6 Fluss (Warnung ab Runde 5) · Boote R3 Ost, R5 West · Gedenk-Variante, wenn Jory gefallen ist · Belohnung Laute **Letzter Vorhang** (Anfeuern auf zwei Ziele, Story 10.4).

| Probe an Stelle von 2-2, P 18, 50 Läufe | Sieg | Runden p10/p50/p90 | Niedergestreckte | Tote | Meisterin überlebt |
|---|---|---|---|---|---|
| Leicht | 100 % | 5/6/7 | 0,02 | 0,02 | in allen Siegen |
| Normal | 98 % | 7/8/10 | 0,80 | 0,08 | in allen Siegen |
| Schwer | 20 % ↓ | 9/10/16 | 1,57 | 1,04 | in allen Siegen |

Schwer liegt unter dem Korridor; die Truppe kommt dort mit Stufe 16,3 statt 18 und sechs Figuren an (2-1 auf Schwer davor). Abstimmung in Story 11.27.

<details><summary>Abweichungen vom Entwurf</summary>

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_n6_gaukler` | `n6_auemarkt`, Szenen `scn.n6.*` | Karten-Id des Knotens |
| `level` + `levelOffset` | nur `levelOffset` | Story 11.2 |
| Meisterin Stufe 7 (P−5) | `levelOffset: −3` [ASSUMPTION] | Band P−3 bis P+2 |
| Eintreiber greifen alles an | Startgegner `ai.prefer: player`, auf die Meisterin gehen nur die Boote und die Zusatzgegner auf Schwer [ASSUMPTION] | ohne: 0 von 20 Siegen, die Meisterin fällt in Gegnerrunde 1–2 |
| Flut zu Beginn der Gegnerrunde 6 | zu Beginn der Spielerrunde 6 [ASSUMPTION] | „ab Runde 6 unter Wasser“ |
| `goldReward: 1300` | 2 000 [ASSUMPTION] | Goldkurve Akt 2, wie 2-1 |
| – | Szene `scn.n6.master_talk` beim Betreten der Bühne | Jory trifft Maren |
| Modelle Bühne, Boot | Bühne als Terrasse + Treppe, Boote ohne Modell | kein Modell vorhanden |
| Meisterin spricht | Erzählzeilen, bis eine Halbfigur da ist [ASSUMPTION] | jede Sprecherin braucht ein Bild |
| Laute mit eigenem Bild | vorläufig Bild der Silberlaute [ASSUMPTION] | kein Bild `final_curtain` |

Steht beim Fluten eine Figur auf dem Steg, bleibt er Steg (Regel `eventTerrain`, Trigger einmalig).

</details>
