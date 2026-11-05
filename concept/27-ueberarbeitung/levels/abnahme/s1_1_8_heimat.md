# 1-8 Die Heimat halten · Entwurf 1

**Kurz:** G 30×40 · Abend, Asche · Burgverwalter 12 Runden schützen · 14 eigene gegen 41 (2,9 : 1) · Leutnants **Morra** (führt), **Hask**, **Ulvric**, **Grosk**

- **Gleiche Karte wie 1-6**, nur andersherum: Jetzt hält die Truppe Vorburg, Terrassen und Burghof. Die Ostpforte ist vermauert.
- **Von Süden** steigen drei Leutnants die Terrassen hinauf: Hask über die Mitte, Ulvric mit Wölfen von Westen, Grosk von Osten. **Grosk** fehlt samt seinen Leuten, wenn er bei E3 gewechselt ist (dann 36 Gegner).
- **Im Rücken:** Ab Runde 4 kommt **Morra** mit ihren Häschern die Passstraße hinauf, über einen Hangweg vom **Wachpass** und greift durch das Westtor den Bergfried an. Der Pass liegt 2 bis 4 km westlich der Burg. In Runde 7 folgt Nachschub.
- Die Truppe muss sich **auf zwei Fronten teilen**. Weitere Wellen von Süden in Runde 3, 6 und 9, in Runde 10 ein kleiner Trupp über den Ziegenpfad.

**Im Spiel (2026-11-05):**

- **Stufen und Wehrgänge wie 1-6.** Burgtor offen, statt Hebel Wehrgang, Ostpforte vermauert. Aufstellplätze auch auf den Wehrgängen.
- **Grosk:** Das Flag heißt `joined_grosk` (der Entwurf nannte `e03: join`). Grosk fehlt dann von selbst, die Hungernden hängen per `requires` daran.
- **Abweichungen:** Gegner L 33 · N 39 · S 43 statt 33 · 41 · 43, Häscher und späte Wellen eine Stufe tiefer, weil die Truppe kleiner ist als die 14 Plätze. Der Verwalter bleibt Heiler auf Stufe 8 und steht auf dem Thronfeld [15,5] (Entwurf: Zivilist). Morra mit Eisenbogen, damit Groll greift; Rückzug in Runde 10 zum Wachpass. Wetter Asche wie im Entwurf, die Szenen sagen jetzt Asche statt Regen. Gold kleiner (1200, Hof 300, Nebenziel 500). Figuren der Wellen in `reinforcements` wie im Entwurf.

![Raster](s1_1_8_heimat.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 33 · N 41 (24 in Wellen) · S 43, Stufe 3–5 plus vier Leutnants (St. 6–7) |
| Aufstellung | 14 in Vorburg und Burghof, freie Plätze füllen Söldner |
| Nebenziele | 4 Häuser (Hof, Mühle, zwei Ställe) · niemand fällt |
| Phasen | R1–3 Aufmarsch · R4–7 zwei Fronten · R8–12 halten |
| Veränderung | keine (die nächste veränderliche Karte kommt in Akt 2) |
| Datei | `levels/s1_1_8_heimat.yaml` |

</details>
