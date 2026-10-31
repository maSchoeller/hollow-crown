## Epic 12: Akt 3 „Krone“ und Staffelende – grob

Spieler spielen Akt 3 in Aurenhall und im Drachengebirge bis zum Staffelfinale, sehen das Epilog-Mosaik und nehmen ihre Entscheidungen als Staffel-Zusammenfassung mit in Staffel 2. Vor Akt 3 verfeinern.

### Story 12.1: Paket, Region und Gegner von Akt 3

**Akzeptanzkriterien:**

**Angenommen** Paket `act3` mit Region 3, Winter, Glut-Orden, Untoten, Drachen (dritte Partei, eigene Modelle), Leutnants Eluned, Cassian, Mael, Torvald und Tier Silber/Mondstahl
**Wenn** Akt 3 erreicht ist
**Dann** lichtet sich der Nebel über Aurenhall und dem Drachengebirge.

### Story 12.2: Mission 3-1 „Winter über Aurenhall“ (reach, Eluned)

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** treten Kit und Pell bei; 3-2 bis 3-4 sind frei wählbar.

### Story 12.3: Mission 3-2 „Das verbotene Lied“ (escort Harlan, Cassian)

**Akzeptanzkriterien:**

**Angenommen** Harlan erreicht den Ausgang
**Wenn** die Mission gewonnen ist
**Dann** tritt Harlan bei; N9 öffnet.

### Story 12.4: Mission 3-3 „Die Einsiedlerin“ (defend, Torvald) und E9

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** tritt Vesna bei, und E9 (Vesna will Ysolde mit ins Gebirge nehmen) fällt; bei „bleiben“ öffnet N7.

### Story 12.5: Mission 3-4 „Der Zweifler“ (boss Mael) und E11

**Akzeptanzkriterien:**

**Angenommen** die Karte (Ziel `boss` Mael, Nebenziel `recruit`) und die Chronik aus dem Burgarchiv
**Wenn** die Mission gewonnen ist und E11 fällt
**Dann** tritt Mael bei „verschonen und die Chronik zeigen“ bei, sonst sinkt Torvalds Groll um 1.

### Story 12.6: Mission 3-5 „Die Krönung“ (seize Glutdom)

**Akzeptanzkriterien:**

**Angenommen** 3-2 bis 3-4 sind gespielt
**Wenn** die Krönung gewonnen ist
**Dann** wird Halvard enttarnt (Illustrationstafel); ab hier läuft Akt 3 linear.

### Story 12.7: Mission 3-6 „Drachen über der Stadt“ (große Schlacht, defend)

**Akzeptanzkriterien:**

**Angenommen** Drachen als dritte Partei und Torvald
**Wenn** die Mission gewonnen ist
**Dann** gelten die Leistungsziele auch mit Drachen; danach öffnet sich 3-7.

### Story 12.8: Mission 3-7 „Der Weg ins Gebirge“ (reach, Eluned)

**Akzeptanzkriterien:**

**Angenommen** die Karte (Ziel `reach` über den Pass, Leutnant Eluned, Drachen als Gefahr im Gelände)
**Wenn** die Mission gewonnen ist
**Dann** öffnet sich das Finale 3-8; die Drachen-Gefahr ist in der Vorschau sichtbar und aus dem Seed reproduzierbar.

### Story 12.9: Mission 3-8 „Im Drachengebirge“ (Finale, boss Halvard), E10 und E12

**Akzeptanzkriterien:**

**Angenommen** das Finale ist gewonnen
**Wenn** E10 (Liora und Halvard) und E12 (Wahrheit, Frieden oder mit 12 Chronik-Seiten „Vhaelyra fragen“) fallen
**Dann** setzt `choose` `s1_ending` und schreibt `c.archive.s1` (Ende, Haltung, Überlebende, Gefallene, Gegangene, Staffel-2-Flags).

### Story 12.10: Epilog-Mosaik

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act3/epilogue.yaml` mit Kacheln je Gefährte und Region und Varianten nach Bedingungen
**Wenn** das Staffelfinale endet
**Dann** zeigt das Mosaik je Gefährte lebt (farbig), gefallen (grau) oder gegangen (sepia) mit einer Wendung, je Region eine breite Kachel, im Kopf Ende und Haltung (Mockup 08, UX-DR22); jede Kachel hat eine Variante ohne Bedingung.

### Story 12.11: Nebenquests N7, N8, N9 und N10

**Akzeptanzkriterien:**

**Angenommen** die Auslöser aus der Narrative (E9, Brenna mit B-Support zu Kael oder Tobin, 3-2 gespielt, Kit und Pell in der Truppe)
**Wenn** der Spieler sie spielt
**Dann** gibt es bei N7–N9 je Glutfunke und Sonderbelohnung, bei N10 die Signatur Turmfalke (keinen Glutfunken); N9 liefert die Zeile für „Vhaelyra fragen“.

### Story 12.12: Nach dem Finale und Übergabe an Staffel 2

**Akzeptanzkriterien:**

**Angenommen** eine abgeschlossene Staffel
**Wenn** der Spieler weiterspielt
**Dann** laufen Heimsuchungen, offene Nebenquests, Supports und Burgausbau weiter; die Abschlussszene bietet den Export der Staffel-Zusammenfassung an (AR20).

### Story 12.13: Akt 3 abstimmen und veröffentlichen

**Akzeptanzkriterien:**

**Angenommen** alle Akt-3-Stories
**Wenn** die verkettete Simulation über die ganze Staffel läuft
**Dann** liegen alle Missionen in den Korridoren, die Spielzeit trifft 30–35 Stunden auf Normal, `act3` ist veröffentlicht und Spielstände aus Akt 1 und 2 laufen weiter.
