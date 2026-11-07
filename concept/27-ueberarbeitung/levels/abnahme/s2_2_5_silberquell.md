# 2-5 Die verstoßene Leibwache · Entwurf 1

**Kurz:** M 20×25 · Mittag · Odile zum Ausgang bringen · 9 eigene gegen 22 (2,4 : 1) · Leutnant **Sable** · Beitritt **Odile**, **Amos** · **veränderliche Karte**

- Die Truppe stürmt von Süden den **Klosterhof**, Odile folgt dann der nächsten eigenen Figur. Der Ausgang liegt jenseits der Schlucht.
- **Zwei Hängebrücken** führen über die Schlucht. In Runde 6 kappen Sables Leute die **Westbrücke**, eine Runde vorher kommt die Warnung.
- Der **Nordrand** liegt eine Stufe höher: Schützen schießen weiter, Ritter halten die Rampen.
- **Sable** hält den Ausgang. Hat sie bei E7 gewechselt, steht dort ein Hauptmann des Grenzheers mit gleichen Werten.
- **Amos** ist im Hospiz, wer ihn anspricht, gewinnt ihn.

![Raster](s2_2_5_silberquell.png)

<details><summary>Details</summary>

| | |
|---|---|
| Gegner | L 18 · N 22 · S 26, Stufe P−3 bis P−1 (hier 12–14), Leutnants P+1 bis P+2; das Blatt zählt Sable und Hauptmann beide |
| Aufstellung | 9 von 12 Feldern, Pflicht Rhen und Lucan |
| Niederlage | Rhen, Lucan oder Odile fallen |
| Nebenziele | Amos gewinnen · binnen 11 Runden |
| Phasen | R1–3 Klosterhof · R4–7 Brücken · R8–12 Ausgang |
| Formatwünsche | Modelle Hängebrücke und Wasserfall, Flags für E7 |
| Datei | `levels/s2_2_5_silberquell.yaml` |

</details>

**Korrektur Story 11.10 (2026-11-07):** Der Hauptmann ist kein Leutnant mehr (`lieutenant: sable` entfernt, sonst wäre er Sable); Sable darf als Leutnant `requires` tragen. Das Kappen der Westbrücke trägt `warn: true` (Warnung ab Runde 5). Amos ist Gast. Flags `e7_order`/`e7_warned` im Paket `act2` (Platzhalter bis 11.5).

**Nachtrag Review 11.10:** Genau eine Figur hält die Stelle: der Hauptmann mit `e7_warned`, sonst Sable (`requires: [{ not: { flag: e7_warned } }]`), auch ohne E7 und wenn beide Flags gesetzt wären.
