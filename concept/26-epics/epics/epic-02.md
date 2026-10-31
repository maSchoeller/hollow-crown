## Epic 2: Rollenklassen und neues Kampf-HUD

Spieler kämpfen mit Rollen statt Waffenklassen; jede Rolle hat eine Klassen-Aktion auf festem Platz im neuen HUD (Stil B). Die Gegnerphase rechnet im Web Worker.

### Story 2.1: Kampf-HUD in Stil B

Als Spieler
möchte ich im Kampf eine klare, einhändige Oberfläche im neuen Stil,
damit ich Ziel, Einheit und Aktionen auf einen Blick erfasse.

**Akzeptanzkriterien:**

**Angenommen** die bestehenden Kampfregeln (FR1–FR3, FR6, FR9, FR10)
**Wenn** der Kampfbildschirm neu gebaut ist
**Dann** zeigt er oben die Rundenpille mit Hauptziel und darunter Nebenziel-Pillen, unten die Einheitenkarte (Medaillon mit TP-Ring, Name, Rolle, TP, Waffen-Chip) und das Dock mit vier festen Plätzen: Angriff, Klassen-Aktion, Item, Warten (Mockup 02)
**Und** nicht mögliche Aktionen sind gedimmt, nie versteckt; bei passiven Rollen (Vorkämpfer: Halten, Plänkler: Nachsetzen) zeigt der Platz „Klassen-Aktion“ das Rollen-Symbol als Zustand (bereit/aktiv), ist nicht auslösbar, und Tippen erklärt die Regel mit Vorschau.

**Angenommen** keine Einheit ist gewählt
**Wenn** die Spielerphase läuft
**Dann** zeigt das Dock Gefahr (Umschalter), Nächste und Phase beenden mit der Zahl bereiter Einheiten; Phase beenden fragt nach, solange Einheiten bereit sind.

**Angenommen** die Gegnerphase
**Wenn** sie beginnt
**Dann** verschwinden Dock und Einheitenkarte, oben erscheint die rote Phasen-Pille, unten rechts Tempo 1×/2×/Überspringen
**Und** die Kampfvorschau erscheint im Stil B mit Dreieck/Element und Tandem als Chips und nutzt denselben Formelcode wie die Auflösung.

**Angenommen** Tablet- oder PC-Breite
**Wenn** das HUD gerendert wird
**Dann** gelten die Breakpoints aus EXPERIENCE.md (Seitenleiste 320 px ab 600 px, Panels ab 1024 px) und die Tastenkürzel Esc, Leertaste, E, D.

### Story 2.2: Rollenmodell und Waffengruppen

Als Spieler
möchte ich, dass die Rolle bestimmt, wie sich eine Figur verhält, und die Ausrüstung, womit sie kämpft,
damit Ausrüstung der Charakter ist.

**Akzeptanzkriterien:**

**Angenommen** `classes.yaml` im Rollenschema (`role`, `tier`, `moveType`, `mov`, `weaponGroups`, `classAction`, `proPaths`, Wachstum, Basiswerte, Caps)
**Wenn** der Content geladen wird
**Dann** gibt es die 7 Kernrollen sowie Taktiker und Hauptmann mit Werten aus den PoC-Klassen abgeleitet (GDD-Annahme 3)
**Und** jedes Item hat eine Waffengruppe `group`; `canEquip` erlaubt nur Gruppen der Rolle.

**Angenommen** die PoC-Figuren und -Karten
**Wenn** sie umgemappt sind (Söldner/Held → Plänkler, Soldat/Ritter → Vorkämpfer, Schütze → Schütze, Magier → Elementarist, Kleriker → Heiler)
**Dann** laufen Prolog und die bestehenden Karten weiter und `pnpm sim` liegt in den Korridoren aus NFR12 oder die Abweichung ist im Log der Story begründet
**Und** das Ausrüsten zeigt unpassende Items gedimmt mit Grund.

### Story 2.3: Klassen-Aktionen Zielen, Fernbergen und Anfeuern

Als Spieler
möchte ich die Klassen-Aktionen von Schütze, Heiler und Spielmann einsetzen,
damit jede Rolle eine eigene Antwort auf die Lage hat.

**Akzeptanzkriterien:**

**Angenommen** ein Schütze, der sich nicht bewegt hat
**Wenn** der Spieler „Zielen“ wählt
**Dann** greift er mit +1 Reichweite und +15 Treffer an; die Vorschau zeigt beides.

**Angenommen** ein Heiler und eine niedergestreckte Figur in bis zu 2 Feldern
**Wenn** der Spieler „Fernbergen“ wählt
**Dann** wird die Figur geborgen wie beim normalen Bergen.

**Angenommen** ein Spielmann neben einem Verbündeten
**Wenn** der Spieler „Anfeuern“ wählt
**Dann** erhält der Verbündete bis Zugende +1 MOV und +10 Treffer
**Und** jede Klassen-Aktion ersetzt die Aktion des Zugs, hat eine Vorschau, sitzt auf dem festen Dock-Platz mit Rollen-Icon und ist in `src/core` getestet.

### Story 2.4: Halten und Nachsetzen

Als Spieler
möchte ich mit Vorkämpfern Engstellen halten und mit Plänklern nach dem Angriff weiterziehen,
damit Positionierung zählt.

**Akzeptanzkriterien:**

**Angenommen** ein Vorkämpfer
**Wenn** ein Gegner ein Nachbarfeld betritt
**Dann** endet dessen Bewegung dort; die Bewegungsbereiche von Spieler und KI berücksichtigen das
**Und** die KI-Pfadsuche umgeht Haltezonen, wenn der Umweg höchstens 2 Felder länger ist, sonst läuft sie hinein.

**Angenommen** ein Plänkler hat angegriffen und noch Restbewegung
**Wenn** der Spieler ein erreichbares Feld wählt
**Dann** zieht er per Command `pursue` dorthin; jedes andere Command beendet die Möglichkeit
**Und** Replays mit `pursue` liefern identische Ergebnisse.

### Story 2.5: Wirken der Elementaristen

Als Spieler
möchte ich mit Elementaristen das Gelände formen,
damit Magie mehr ist als Schaden.

**Akzeptanzkriterien:**

**Angenommen** ein Elementarist mit Zauberwaffe eines Elements
**Wenn** der Spieler „Wirken“ auf ein Feld in Reichweite wählt
**Dann** entsteht für 2 Runden: Feuer → Brand, Wasser → löscht und macht Nass, Erde → Felswall, Wind → lichtet Nebel im Radius 2
**Und** die Vorschau zeigt die betroffenen Felder; Brandausbreitung bleibt reproduzierbar.

**Angenommen** ein gegnerischer Elementarist
**Wenn** mindestens 2 Spieler-Einheiten im Brand-Ausbreitungsbereich stehen oder ein Felswall einen Spieler-Pfad zum Ziel sperrt
**Dann** nutzt die KI Wirken statt anzugreifen.

### Story 2.6: Nebel des Krieges, Öffnen und Stehlen

Als Spieler
möchte ich auf Nebelkarten nur sehen, was meine Truppe sieht, und mit Spähern Türen, Truhen und Taschen öffnen,
damit Späher eine eigene Aufgabe haben.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit `fog: true`
**Wenn** der Kampf läuft
**Dann** berechnet `visibleTiles(state, team)` im Kern die Sicht (Basis 3, Schütze/Späher +2, Flieger +1; Mauern und geschlossene Türen blockieren)
**Und** Brett und UI zeigen nur Sichtbares; Events auf unsichtbaren Feldern werden vor dem Abspielen gefiltert, die Vorschau verrät nichts Verborgenes.

**Angenommen** ein Späher neben einer Tür, Truhe oder einem Gegner mit nicht ausgerüstetem Item
**Wenn** der Spieler „Öffnen“ bzw. „Stehlen“ wählt
**Dann** öffnet er ohne Schlüssel bzw. nimmt das Item in den Beutel (oder Konvoi, wenn voll)
**Und** auf Nebelkarten hat der Späher +2 Sicht.

### Story 2.7: Kontext-Band für Bergen, Ansprechen, Besuchen und Öffnen

Als Spieler
möchte ich situative Aktionen genau dann angeboten bekommen, wenn sie möglich sind,
damit das Dock fest bleibt und ich nichts übersehe.

**Akzeptanzkriterien:**

**Angenommen** eine gewählte Einheit auf einem Feld, von dem aus Bergen, Ansprechen, Besuchen oder Öffnen möglich ist
**Wenn** die Bewegung gesetzt ist
**Dann** erscheint das grüne Kontext-Band über der Einheitenkarte mit Mini-Porträt bzw. Objekt, Aktion und Grund (z. B. „Verblutet nach 2 eigenen Phasen“) und einer Taste
**Und** ein Tipp führt die Aktion aus; das Dock bleibt unverändert (Mockup 02, „Kontext-Aktion: Bergen“).

**Angenommen** mehrere Kontext-Aktionen sind möglich
**Wenn** das Band erscheint
**Dann** steht die dringlichste vorn (Bergen vor Ansprechen vor Besuchen vor Öffnen) und die anderen sind per Wischen erreichbar.

### Story 2.8: Gegnerphase im Web Worker

Als Spieler
möchte ich, dass das Spiel in der Gegnerphase großer Schlachten flüssig bleibt,
damit es sich auf dem Handy nie hakelig anfühlt.

**Akzeptanzkriterien:**

**Angenommen** `src/worker/core.worker.ts`
**Wenn** der Spieler die Phase beendet
**Dann** rechnet der Worker `applyCommand(state, endPhase)` mit denselben Content-Daten und gibt `{ state, events }` zurück (Protokoll Architektur §5.13); fehlt `Worker`, läuft dieselbe Funktion synchron
**Und** ein Test zeigt: Replay mit und ohne Worker ergibt denselben Zustand.

**Angenommen** CI
**Wenn** `pnpm bench:ai` läuft
**Dann** misst es die Gegnerphase der größten vorhandenen Karte und scheitert über 300 ms je Gegnereinheit
**Und** ESLint-Schichtregeln kennen `src/worker` (nur `core` und `content`).

### Story 2.9: Gegnertypen von Akt 1

Als Spieler
möchte ich in Akt 1 unterscheidbare Gegner (Banditen, Wolfsreiter zu Fuß, Söldner) erleben,
damit Kämpfe abwechslungsreich bleiben.

**Akzeptanzkriterien:**

**Angenommen** die Gegnerklassen von Akt 1 im Rollenschema
**Wenn** sie auf Karten stehen
**Dann** sind Wolfsreiter in Akt 1 Fußtruppen mit Wolfsfell (kein Reittier, keine Beritten-Effektivität; Vierbeiner und Reittiere erst nach dem MVP); Banditen, Wolfsreiter und Söldner unterscheiden sich in Waffen und KI-Profil
**Und** ihre Werte stehen in Content-YAML und sind per `pnpm sim` geprüft.

### Story 2.10: Kampf-Overlays im Stil B

Als Spieler
möchte ich alle Fenster im Kampf im selben Stil wie das HUD sehen,
damit Infos zu Gegnern und eigenen Figuren, Tausch und Konvoi sofort lesbar sind.

**Akzeptanzkriterien:**

**Angenommen** ein Gegner oder eine eigene Einheit auf dem Brett
**Wenn** der Spieler sie antippt bzw. die Einheitenkarte öffnet
**Dann** zeigt die Einheiten-Info im Stil B Medaillon mit TP-Ring, Name, Klasse/Rolle, Stufe, Werte, Ausrüstung mit Item-Bildern, Fähigkeiten und bei Gegnern das KI-Verhalten; eigene Einheiten bieten Ausrüsten, solange sie handeln können (Steckbriefe der Leutnants bleiben Story 3.6, die volle Figur Story 6.1)
**Und** sie erscheint als Stein über einem Schleier und schließt mit Esc oder Tipp daneben.

**Angenommen** Ziele-Panel, Kampfmenü (Optionen, Runde neu, Mission neu, zum Titel), Auswahl der Klassen-Aktion, Item-Liste, Tausch, Konvoi und der Stufenaufstieg im Kampf
**Wenn** sie geöffnet werden
**Dann** folgen sie dem Panel-Muster aus DESIGN.md (Stein, Liste mit Item-Bildern, eine Glut-Haupttaste, Beträge als Symbol + Zahl), Funktionen bleiben unverändert
**Und** der alte `Modal`-Look und die PoC-Klassen dieser Ansichten sind entfernt.

_Nachgetragen 2026-10-24: Lücke aus der Bestandsaufnahme der PoC-Ansichten; 2.1 hatte nur HUD, Dock und Vorschau umgebaut._
