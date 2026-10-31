## Epic 6: Truppe, Fortschritt und Lager

Spieler verwalten Truppe und Ausrüstung im neuen Stil, versorgen sich im Lager und ab 1-6 in der Paktwacht, sehen nach jeder Mission ein klares Ergebnis und nehmen Abschied von Gefallenen; die Kurven tragen über Akt 1.

### Story 6.1: Truppe und Figur

Als Spieler
möchte ich meine Truppe auf einen Blick sehen und jede Figur genau ansehen,
damit ich weiß, wer bereit ist und wer etwas braucht.

**Akzeptanzkriterien:**

**Angenommen** die Leiste „Truppe“
**Wenn** der Spieler sie öffnet
**Dann** zeigt ein Medaillon-Raster alle Gefährten und Söldner mit Rolle und Stufe, filterbar nach Rollengruppe, mit Marken für „kann aufsteigen“, „Gespräche bereit“ und „Narbe“ (Mockup 06)
**Und** Gefallene erscheinen nicht hier.

**Angenommen** eine Figur
**Wenn** der Spieler sie öffnet
**Dann** sieht er Halbfigur, Rolle und Stufe, EP-Balken, 10 Werte, 6 Ausrüstungs- und 3 Beutelplätze (Zahl = Aufwertung oder Ladungen, Raute = Seltenheit), Last und Meisterung; Wischen wechselt die Figur
**Und** die Ansicht ist auch aus der Einheitenkarte im Kampf per Langdruck erreichbar (nur lesend).

### Story 6.2: Ausrüsten mit Vergleich

Als Spieler
möchte ich beim Ausrüsten sofort sehen, was besser oder schlechter wird,
damit Ausrüstung eine bewusste Entscheidung ist.

**Akzeptanzkriterien:**

**Angenommen** ein Ausrüstungsplatz einer Figur
**Wenn** der Spieler ihn antippt
**Dann** listet die Ansicht passende Items aus Beutel und Konvoi mit Bild, Werten und Vergleich grün/rot gegen das Angelegte; Items, die die Rolle nicht führen darf, stehen gedimmt mit Grund
**Und** erster Tipp wählt, die Haupttaste („Wurfspieß anlegen“) führt das Kampagnen-Command aus.

**Angenommen** der Konvoi
**Wenn** der Spieler ihn öffnet
**Dann** folgt er demselben Listen-Muster mit Filter nach Art.

### Story 6.3: Das Lager in Akt 1

Als Spieler
möchte ich zwischen Missionen im Lager meine Truppe versorgen,
damit die Heimat schon in Akt 1 ein Ort ist.

**Akzeptanzkriterien:**

**Angenommen** `content/core/rooms.yaml` und `c.home = { kind: 'camp', rooms }`
**Wenn** der Spieler die Heimat öffnet
**Dann** zeigt sie oben das Lager-Diorama und unten die Stationen Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer als Raumsteine (Mockup 04, Lager)
**Und** jede Station öffnet ein Raum-Panel über der weichgezeichneten Ansicht; jede Handlung braucht höchstens 2 Taps und ist ein Kampagnen-Command.

**Angenommen** die Freischaltung aus U20 (Schmied und Heiler nach der ersten Mission usw.)
**Wenn** sie durch `requires` je Station ersetzt ist
**Dann** sind gesperrte Stationen gestrichelt mit Grund.

### Story 6.4: Händler, Schmied, Heiler und Taverne

Als Spieler
möchte ich kaufen, aufwerten, Narben heilen und Söldner anheuern,
damit ich Gold sinnvoll einsetze.

**Akzeptanzkriterien:**

**Angenommen** der Händler
**Wenn** der Spieler ihn öffnet
**Dann** sieht er Börse, Kaufen/Verkaufen, Sortiment nach Ausrüstungs-Tier des Akts (das Angebot des Tages kommt erst mit Händler-Stufe 3, Epic 10) und jeden Preis als Münze + Zahl; die Haupttaste nennt den Betrag; „Für wen?“ zeigt, wer das Item führen kann
**Und** Preisänderungen aus Entscheidungen (`priceMod`) und Dorfhilfe (`villageAid`) wirken sichtbar.

**Angenommen** Schmied, Heiler und Taverne
**Wenn** der Spieler sie nutzt
**Dann** gelten Kosten und Grenzen aus `balance.yaml` (Aufwerten bis +3 auf Stufe 1, Narbe heilen, Söldner 600 + 150 × Stufe, 3 Angebote) und das Armee-Limit 20 Gefährten + 6 Söldner (Beitritt über Entscheidung oder Ansprechen bei vollem Limit: Story 3.7).

### Story 6.5: Stufendeckel und EP-Regeln

Als Spieler
möchte ich, dass meine Truppe in Akt 1 nicht davonläuft,
damit Akt 2 noch Herausforderung bietet.

**Akzeptanzkriterien:**

**Angenommen** `levelCap` aus der Akt-Kampagne (Akt 1: 10)
**Wenn** eine Einheit die Grenze erreicht
**Dann** verfallen weitere EP und das `exp`-Event meldet `capped`; die UI zeigt „Stufe 10 · Deckel in Akt 1“
**Und** Leutnant-Vertreibung gibt +20 EP wie ein Boss; die übrigen EP-Regeln laut GDD sind getestet.

### Story 6.6: Missionsergebnis

Als Spieler
möchte ich nach einer Mission auf einen Blick sehen, was ich gewonnen und verloren habe,
damit sich Erfolg und Verlust klar anfühlen.

**Akzeptanzkriterien:**

**Angenommen** eine gewonnene Mission
**Wenn** das Ergebnis erscheint
**Dann** zeigt es die Sieg-Pille mit Missionsname und Runden, Beute (Gold, Material, Item-Bilder), Kopfgeld vertriebener Leutnants mit neuem Groll, Nebenziele (erfüllt/nicht) und EP je Figur mit Stufenaufstieg; Gefallene grau (Mockup 08)
**Und** alle Mengen als Symbol + Zahl.

**Angenommen** eine Niederlage
**Wenn** sie eintritt
**Dann** nennt der Bildschirm den Grund in einem Satz und bietet die Neustarts des Tod-Modus an (Story 1.5).

### Story 6.7: Abschied von Gefallenen

Als Spieler
möchte ich von jedem Gefallenen Abschied nehmen,
damit ein Verlust erzählerisch getragen wird.

**Akzeptanzkriterien:**

**Angenommen** eine Mission mit Gefallenen
**Wenn** der Spieler im Ergebnis „Weiter“ tippt
**Dann** folgt je Gefallenem die Abschieds-Karte: alles entsättigt bis auf eine Glutlinie, Halbfigur grau, Ort und Rolle, letzte Zeile aus der Szene des Gefährten, Trauer-Zeile des Support-Partners mit Wirkung, Taste „Abschied nehmen“ in Grau (Mockup 08)
**Und** die ersten 2 s lassen sich nicht überspringen; ein Glockenschlag erklingt.

**Angenommen** ein gefallener Söldner aus der Taverne
**Wenn** er fällt
**Dann** bekommt auch er einen Abschied (kurze Form) und später einen Gedenkstein.

### Story 6.8: Wirtschaftskurve und verkettete Simulation

Als Entwickler
möchte ich den ganzen Akt am Stück simulieren,
damit Gold, EP und Schwierigkeit über alle Missionen zusammenpassen.

**Akzeptanzkriterien:**

**Angenommen** `pnpm sim --campaign act1`
**Wenn** es läuft
**Dann** spielt es die Story-Missionen in einer gültigen Reihenfolge mit KI auf beiden Seiten und einer einfachen Heimat-Heuristik (kaufen, aufwerten, heilen), optional mit Heimsuchungen zwischen den Missionen
**Und** es gibt je Story-Mission Siegquote, Niedergestreckte, Gold und Armee-Stufe aus und markiert Missionen außerhalb der Korridore (NFR12) sowie Gold außerhalb der GDD-Kurve.

### Story 6.9: Die Paktwacht als Heimat

Als Spieler
möchte ich nach der Eroberung der Paktwacht dort statt im Lager leben,
damit die Truppe schon in Akt 1 ein Zuhause hat und ihre Gefallenen einen Ort.

**Akzeptanzkriterien:**

**Angenommen** die Wirkung `setHome` (Architektur §5.3, Muster §8.2) und Knoten `m1_6` mit `effects: [{ setHome: castle }]`
**Wenn** die Mission 1-6 gewonnen ist
**Dann** ist `c.home.kind = 'castle'`, die Räume behalten ihre Stufe, und `render/home/` zeigt die Paktwacht als Ruine im 3D-Diorama mit Raum-Ankern und unten Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer und Gedächtnishalle als Raumsteine (UX-DR10)
**Und** die Ausbau-Bänder sind bis Akt 2 gestrichelt mit Grund gesperrt (`requires: [{ act: 2 }]` in `rooms.yaml`, kein `if (act >= 2)`).

**Angenommen** gefallene Gefährten und Söldner, darunter Gerrit aus dem Prolog
**Wenn** der Spieler die Gedächtnishalle öffnet
**Dann** stehen ihre Gedenksteine dort (entsättigt, Glutlinie, Zitat), Gerrits Stein zuerst; Lektionen gibt es erst ab Akt 2 (Story 10.7) (UX-DR11 Teil).

### Story 6.10: Aufstellung vor der Mission im Stil B

Als Spieler
möchte ich die Aufstellung vor einer Mission im selben Stil wie Truppe, Lager und Ergebnis sehen,
damit der Weg von der Knoten-Karte in den Kampf nicht durch einen Bildschirm aus dem Prototyp bricht.

**Akzeptanzkriterien:**

**Angenommen** die Knoten-Karte der Weltkarte („Aufstellung“) oder mehr Gefährten als Plätze („Aufbrechen“)
**Wenn** der Vorbereitungs-Screen (`prep`) erscheint
**Dann** zeigt er Ziel, Plätze (x/y) und die Truppe als Steine im Stil B (DESIGN.md, Studio-Look): Porträt, Name, Klasse und Stufe ohne Umbruch, TP, Waffe, Pflicht-Figuren gesperrt mit Grund, Tasche/Ausrüsten wie heute, und „Kampf beginnen“ als Primär-Knopf
**Und** die Funktion bleibt unverändert (Auswahl, Pflicht-Figuren, Ausrüsten, Start); Styles in einer eigenen CSS-Datei neben der Komponente, der Abschnitt in `src/ui/styles.css` entfällt.

**Angenommen** ein Mockup in `concept/25-ux/mockups/` (fehlt noch, UX liefert es zuerst)
**Wenn** die Story umgesetzt ist
**Dann** passt der Screen bei 375 × 812 und am Desktop zum Mockup, alle Texte stehen in `de.yaml`/`en.yaml`.
