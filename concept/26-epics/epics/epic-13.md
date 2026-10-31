## Epic 13: Kampf lesbar machen

Spieler lesen das Brett auf einen Blick: Felder, TP jeder Figur, Reichweiten und Gefahr sind sichtbar, bevor sie ziehen; nach der Gegnerphase wissen sie, was passiert ist. Entschieden in der UX-Werkstatt am 2026-10-30 (`concept/sprint-change-proposal-2026-10-30.md`), Verhalten in `EXPERIENCE.md`, Aussehen in `DESIGN.md`, Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`. Alle Zahlen der Anzeigen kommen aus Kern-Funktionen über `dangerZone`/`threatTiles` und `forecast` (Vorschau = Auflösung, AGENTS.md); Stufen, Schwellen und Deckkraft stehen in `render.yaml`.

### Story 13.1: Brett-Anzeige in den Optionen und Raster

Als Spieler
möchte ich die Felder des Bretts zählen können und selbst bestimmen, wie viel Hilfe das Brett zeigt,
damit ich Reichweiten sicher einschätze, ohne dass das Diorama zum Schachbrett wird.

**Akzeptanzkriterien:**

**Angenommen** die Optionen (Titel und Menü)
**Wenn** der Spieler sie öffnet
**Dann** gibt es einen Block „Brett-Anzeige“ mit Raster (aus / dezent / stark), Lebensleisten (Immer / Nur verletzte / Aus), Gegner-Leiste (an/aus) und dem bisherigen Schalter „Gefahrenzone standardmäßig“
**Und** die Standardwerte sind Raster dezent, Lebensleisten Immer, Gegner-Leiste aus; die Werte liegen in `src/app/state/settings.ts`, nicht im Spielstand, und alte Einstellungen laden ohne Fehler.

**Angenommen** ein Kampf mit Raster „dezent“
**Wenn** das Brett steht
**Dann** liegen kleine Creme-Kreuze an allen Feldecken auf Feldhöhe, nie vom Szenenlicht gefärbt (Art Direction §2.5)
**Und** „stark“ zeichnet feine durchgehende Linien, „aus“ nichts; Deckkraft und Größe je Stufe stehen in `render.yaml`
**Und** die Bildrate bleibt über den Zielen aus Story 7.8.

### Story 13.2: Bereiche als Kacheln und Weg-Pfeil

Als Spieler
möchte ich Bewegungs- und Angriffsbereich als einzelne Felder mit klarer Kante sehen und meinen Weg als Pfeil,
damit ich nicht raten muss, wie weit eine Figur kommt.

**Akzeptanzkriterien:**

**Angenommen** eine gewählte eigene Einheit
**Wenn** ihr Bereich erscheint
**Dann** ist jedes erreichbare Feld eine Einzelkachel mit kleiner Lücke und runden Ecken in Teamblau, Angriffsfelder ebenso in Rot, und der Bewegungsbereich hat eine gemeinsame Außenkante (Creme unter Blau)
**Und** Haltezonen, Wirken-Felder und Ziele behalten ihre bisherige Darstellung (Story 2.4, 2.5).

**Angenommen** ein gesetztes Zielfeld
**Wenn** die Geist-Figur dort steht
**Dann** zeigt ein dicker, runder Pfeil mit Creme-Rand den Weg vom Start bis zum Ziel, mit Spitze am Ziel; er ersetzt die bisherige Weg-Markierung.

### Story 13.3: Lebensleisten über den Figuren

Als Spieler
möchte ich über jeder Figur sehen, wie viele TP sie noch hat,
damit ich angeschlagene Gegner und gefährdete Gefährten ohne Antippen erkenne.

**Akzeptanzkriterien:**

**Angenommen** ein Kampf mit Lebensleisten „Immer“
**Wenn** das Brett steht
**Dann** trägt jede sichtbare Figur über dem Kopf eine Leiste nach DESIGN.md (`hp-bar`): Creme-Grund, Füllung in Teamfarbe, dunkle Kontur, Leutnant mit Goldkontur, Teilstrich je 5 TP und ab 40 max. TP je 10 (`render.yaml`)
**Und** sie liegt in der DOM-Ebene der Verblutungs-Zähler, folgt der Figur bei Bewegung, Zoom und Kamerafahrt und verdeckt weder Groll-Wimpel noch Zustands-Symbole.

**Angenommen** eine Figur unter 25 % ihrer max. TP (Schwelle in `render.yaml`)
**Wenn** sie auf dem Brett steht
**Dann** hat ihre Leiste einen pulsierenden Glutrand; mit `prefers-reduced-motion` ist der Rand fest
**Und** die Füllung bleibt Teamfarbe.

**Angenommen** die Gegnerphase oder ein eigener Angriff
**Wenn** eine Figur Schaden nimmt oder geheilt wird
**Dann** ändert sich ihre Leiste im Takt der Trefferanimation (`onUnitHp`)
**Und** „Nur verletzte“ zeigt Leisten nur unter max. TP (Leutnants immer), „Aus“ zeigt keine; niedergestreckte, geflohene und tote Figuren haben keine Leiste.

### Story 13.4: Schadensvorschau und Kill-Marker

Als Spieler
möchte ich vor dem Angriff sehen, wie viel die Leiste des Ziels verliert und wen ich diese Runde besiegen kann,
damit ich Angriffe gezielt verteile.

**Akzeptanzkriterien:**

**Angenommen** die offene Kampfvorschau
**Wenn** ein Ziel gewählt ist
**Dann** blinkt in seiner Lebensleiste der Teil, den der Angriff bei Treffer nimmt (inklusive Doppelangriff), mit `prefers-reduced-motion` schraffiert statt blinkend
**Und** die Zahl stammt aus `forecast`, nie aus einer Kopie der Formel.

**Angenommen** eine gewählte eigene Einheit in der Spielerphase
**Wenn** ihr Bereich erscheint
**Dann** steht über jedem Gegner, den sie von einem erreichbaren Feld aus angreifen kann, ein Kill-Marker nach DESIGN.md: voller Totenkopf = fällt bei Treffer (inklusive Doppelangriff), halber = fällt nur mit Krit
**Und** Leutnants zeigen statt Totenkopf die Flucht-Marke; gerechnet wird mit der besten angelegten Waffe und dem günstigsten erreichbaren Feld
**Und** die Rechnung ist eine reine Funktion in `src/core/rules` mit Unit-Tests (Treffer, Krit, Doppelangriff, Dreieck, Element, Leutnant).

### Story 13.5: Gefahrenzone mit Stufen

Als Spieler
möchte ich in der Gefahrenzone sehen, wie viele Gegner ein Feld erreichen,
damit ich zwischen leicht und sehr gefährlich unterscheiden kann.

**Akzeptanzkriterien:**

**Angenommen** die Gefahrenzone ist an (Leerlauf-Dock „Gefahr“, PC D)
**Wenn** das Brett sie zeigt
**Dann** ist sie eine durchscheinende rote Fläche in drei Stufen (1 / 2 / 3+ Gegner, Deckkraft in `render.yaml`) mit roter Außenkante auf Creme
**Und** die Felder tragen keine Zahl der Angreifer (Playtest 2026-10-30: überfrachtet; die Stufe zeigt die Menge)
**Und** eigene Figuren und ihre Lebensleisten bleiben darunter lesbar.

**Angenommen** Gegner mit den KI-Profilen hold/guard, schlafende Gegner (trigger) und angekündigte Verstärkung
**Wenn** die Zone berechnet wird
**Dann** zählen hold/guard wie heute ohne Bewegung, schlafende Gegner zählen nicht und ihre Zone steht als gestrichelte Kante da, Verstärkungen behalten ihre Ankunftsmarke
**Und** die Zählung ist eine reine Funktion (`threatCounts`) aus `threatTiles`, getestet.

**Angenommen** ein Langdruck auf einen Gegner (Steckbrief bzw. Einheiten-Info)
**Wenn** seine Zone erscheint
**Dann** zeigt sie nur seine Außenkante in dunklerem Rot, damit sie über der Gesamtzone lesbar bleibt.

### Story 13.6: Zielfeld-Check und Warnung für eigene Figuren

Als Spieler
möchte ich vor dem Bestätigen sehen, welche Gegner mein Zielfeld erreichen und welche meiner Figuren fallen könnten,
damit ich nicht aus Versehen in eine Falle ziehe.

**Akzeptanzkriterien:**

**Angenommen** eine gesetzte Geist-Figur auf einem Zielfeld (Handy) bzw. die Maus über einem erreichbaren Feld (PC, Hover)
**Wenn** das Feld feststeht
**Dann** leuchtet jeder Gegner, der das Feld in seiner nächsten Phase erreicht (Regeln wie Story 13.5), rötlich auf (Farbe und Stärke in `render.yaml`; Playtest 2026-10-30: statt Linien zum Feld)
**Und** eine Pille unter den Ziel-Pillen sagt „n Gegner erreichen dieses Feld“ (ab 2 auf Rot-hell, bei 1 auf Creme, bei 0 keine Pille)
**Und** am Feld steht der Gelände-Chip mit Name, Verteidigung, Ausweichen und Heilung als Symbol + Zahl aus `terrain.yaml`.

**Angenommen** die Spielerphase
**Wenn** die Summe des Schadens bei Treffer aller Gegner, die eine eigene Figur erreichen, ihre aktuellen TP erreicht (ohne Krit und Trefferchance, mit Doppelangriff)
**Dann** steht über dieser Figur ein grauer Warn-Totenkopf mit „!“ (DESIGN.md `kill-marker.warn`)
**Und** er verschwindet, sobald die Bedingung nicht mehr gilt; die Rechnung ist eine getestete reine Funktion.

### Story 13.7: Gegnerphase-Rückblick

Als Spieler
möchte ich nach der Gegnerphase kurz sehen, was passiert ist,
damit ich bei 2× oder Überspringen nichts Wichtiges verpasse.

**Akzeptanzkriterien:**

**Angenommen** eine Gegnerphase, in der etwas geschah
**Wenn** die Spielerphase beginnt
**Dann** liegt über der Einheitenkarte ein Stein „Gegnerphase n“ mit einer Zeile je Ereignis: zuerst Niedergestreckte und Gefallene (mit Verblutungs-Zähler bzw. in Klassik „gefallen“), dann Treffer auf eigene Figuren (TP vorher → nachher, Verfehlt als „weicht aus“), dann Verstärkungen und geweckte Gegner
**Und** eine Nebentaste „Figur zeigen“ bzw. ein Tipp auf eine Zeile zentriert die Kamera auf Figur oder Ort
**Und** die Liste entsteht als reine Funktion aus den Events der Phase, getestet.

**Angenommen** der Rückblick ist offen
**Wenn** der Spieler aufs Brett tippt oder eine Einheit wählt
**Dann** schließt er sich ohne Rückfrage; er blockiert nie, erscheint nicht, wenn nichts geschah, und Lektionen und Szenen haben Vorrang.

### Story 13.8: Gegner-Leiste

Als Spieler
möchte ich auf Wunsch alle Gegner mit ihren TP in einer Reihe sehen,
damit ich auf großen Karten niemanden übersehe.

**Akzeptanzkriterien:**

**Angenommen** die Option „Gegner-Leiste“ ist an (Standard aus)
**Wenn** die Spielerphase läuft
**Dann** steht unter den Ziel-Pillen eine Reihe kleiner Medaillons aller sichtbaren Gegner mit TP-Ring und TP-Zahl, Leutnants mit Goldring zuerst; Gegner im Nebel fehlen
**Und** ein Tipp zentriert die Kamera auf den Gegner, ein Langdruck öffnet seine Info; bei vielen Gegnern lässt sich die Reihe seitlich wischen
**Und** auf Tablet und PC sitzt sie in der Seitenleiste (UX-DR24).

### Story 13.9: Fertig-Häkchen, Kamera-Griffe und Zurück an der Figur

Als Spieler
möchte ich sehen, wer schon gehandelt hat, schnell zu einer Figur oder zur ganzen Karte springen und eine Bewegung direkt an der Figur zurücknehmen,
damit sich lange Runden flüssig spielen.

**Akzeptanzkriterien:**

**Angenommen** eine Figur hat in dieser Phase gehandelt
**Wenn** sie auf dem Brett steht
**Dann** trägt sie zusätzlich zur Entsättigung ein kleines grünes Häkchen am Kopf (DESIGN.md Fertig-Häkchen).

**Angenommen** das Brett
**Wenn** der Spieler doppelt auf eine Figur tippt
**Dann** gleitet die Kamera auf sie, ohne sie zu wählen oder eine Aktion auszulösen
**Und** Herauspinchen über die weiteste Zoomstufe hinaus bzw. am PC Taste M oder Mausrad zeigt die ganze Karte (vierte Zoomstufe, aus der Kartengröße berechnet; Rand in `render.yaml`); erneutes Hineinzoomen kehrt zur weitesten Stufe zurück.

**Angenommen** eine gesetzte Geist-Figur vor der Aktion
**Wenn** der Spieler am PC rechts klickt
**Dann** steht die Figur wieder auf dem Startfeld wie mit dem bisherigen Zurück (FR1); die Leisten-Taste „Zurück“ bleibt; einen eigenen Zurück-Stein an der Figur gibt es nicht (Playtest 2026-10-30: überfüllte Bedienung).
