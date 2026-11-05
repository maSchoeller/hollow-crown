# 1-6 Die Paktwacht · Entwurf 1

**Kurz:** G 30×40 · Mittag · Thron einnehmen · 12 eigene gegen 36 (3 : 1) · Leutnants **Hask** und **Ulvric**

- Sturm **von Süden nach Norden** über sechs Stufen: Brücke über die Erle → Felder mit Mühle und Höfen → **3 Terrassen** → Vorburg → Burghof → Thron im Bergfried.
- Jede Stufe hat eine **Engstelle** mit Schützen darüber: Brücke (Furten rechts und links), Mittelrampe, Randrampen im Zickzack, Vorburgtor, Burgtor.
- **Ulvric** jagt mit Wölfen auf der untersten Terrasse, in Runde 5 kommen weitere Wölfe aus dem Westwald. In Runde 8 setzen Marodeure über die Furten und fallen der Truppe in den Rücken.
- **Hask** hält die Vorburg. Bei 0 TP flieht er durch die Ostpforte über den **Ziegenpfad** nach Süden (den können auch Späher als Flankenweg nutzen).
- Schon sichtbar für später: das **Gewölbe-Tor** im Fels (1-7) und der **Wachpass** im Nordwesten (1-8).

**Im Spiel (2026-11-05):**

- **Stufen:** Felder und Terrasse 1 = 0. Terrasse 2 und 3, Vorburg, Burghof, Bergfried, Wachpass = 1. Stützmauer y 25 führt hinauf: Mittelrampe, Rampe Ostwald, Treppe am Ziegenpfad. Stützmauer y 21 bleibt Zickzack auf Stufe 1.
- **Wehrgänge auf Stufe 2:** Vorburg-Südmauer samt kurzer Seitenmauern (Treppen [9,16], [20,16]), Burgmauer West samt Seitenmauer (Treppe [7,10]), Burgmauer Ost (Treppe [17,13]). Ecktürme der Vorburg als `tower_top`.
- **Burgtor** geschlossen, Hebel [20,12] am Ende des Wehrgangs Ost, nur von oben zu ziehen. Späher und Schlüssel öffnen auch.
- **Abweichungen:** Schützen t7, t13, t14, k3, k4 auf Rampe und Wehrgang umgestellt. Treppen an Seitenmauern, weil die Kamera eine Treppe auf der Nordseite einer Mauer nur von hinten zeigt. Gegner L 28 · N 33 · S 40 statt 30 · 36 · 40, weil die Truppe nach 1-5 nur 4 bis 8 Figuren hat; Stufen einiger Gegner gesenkt, Auslöse-Radien kleiner. Gold kleiner (900, Truhe 300, Häuser 300, Nebenziel 400). Felder als Gelände `field`.

![Raster](s1_1_6_paktwacht.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 30 · N 36 (4 in Wellen R5/R8) · S 40, Stufe 2–5 plus Hask, Ulvric, Kastellan (Ritter St. 5) |
| Aufstellung | 12, freie Plätze füllen Söldner aus der Taverne |
| Nebenziele | 4 Häuser besuchen (Höfe, Mühle, Fähre) · in 18 Runden |
| Phasen | R1–4 Brücke und Felder · R5–9 Terrassen · R10–14 Vorburg · R15–18 Burghof |
| Veränderung | keine; die Karte ist die Vorlage für 1-8 |
| Datei | `levels/s1_1_6_paktwacht.yaml` |

</details>
