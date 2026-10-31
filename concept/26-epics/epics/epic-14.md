## Epic 14: Handbuch

Spieler schlagen jede Spielregel im Spiel nach: aus dem Menü oder direkt über ein „?“ an der Stelle, an der die Regel wirkt. Entschieden in der UX-Werkstatt am 2026-10-30 (`concept/sprint-change-proposal-2026-10-30.md`); Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`. Werte in Einträgen sind Verweise auf Content-Pfade und stimmen damit nach jedem Balancing. Texte DE + EN entwirft der Assistent aus GDD, Narrative und Content, der Produktinhaber nimmt sie im Pull Request ab. Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil dieses Epics, weil sie das Speicherformat ändern.

### Story 14.1: Handbuch als Content

Als Entwickler
möchte ich Handbuch-Einträge als YAML mit Schema anlegen,
damit Texte, Werte und Verweise geprüft werden und nie im Code stehen.

**Akzeptanzkriterien:**

**Angenommen** `content/core/handbook.yaml` mit Zod-Schema (Kategorien in fester Reihenfolge; Einträge mit id, Kategorie, Grafik-Typ, Wert-Verweisen, Querverweisen, optionalem Kontext-Anker)
**Wenn** `pnpm content:check` läuft
**Dann** scheitert er bei fehlendem DE- oder EN-Schlüssel unter `handbook.*`, bei einem Wert-Verweis, der sich nicht auflöst (z. B. `balance.triangle.hit`, `terrain.forest.avoid`, `classes.vanguard.mov`), bei Querverweisen auf unbekannte Einträge und bei doppelten Kontext-Ankern
**Und** eine reine Funktion löst Wert-Verweise gegen `GameData` auf (getestet); kein Zahlenwert steht als Text im YAML.

### Story 14.2: Handbuch-Screen und Einstieg

Als Spieler
möchte ich das Handbuch aus jedem Menü öffnen und Einträge schnell finden,
damit ich Regeln nachlese, wann immer ich unsicher bin.

**Akzeptanzkriterien:**

**Angenommen** das Menü im Kampf, das Menü auf der Weltkarte oder der Titel
**Wenn** der Spieler „Handbuch“ wählt (im Kampf an zweiter Stelle unter Optionen)
**Dann** öffnet eine Vollbild-Ansicht im Stil B mit Zurück-Stein, Titelpille, Suchfeld und den Kategorien als Steine im Zweier-Raster
**Und** die Suche findet Einträge über Titel und Stichworte in der aktuellen Sprache.

**Angenommen** ein gewählter Eintrag
**Wenn** er öffnet
**Dann** zeigt er Grafik, Werte-Feld (aufgelöste Werte, Symbol + Zahl), einen Satz „wo im Spiel“ und Querverweise als Chips; ein Querverweis öffnet den anderen Eintrag, Zurück führt zum vorigen
**Und** aus dem Kampf heraus liegt das Handbuch über dem Kampf; Schließen kehrt in denselben Zustand zurück, ohne Command und ohne Speichern.

### Story 14.3: Einträge Grundlagen, Kampf, Waffen und Elemente

Als Spieler
möchte ich verstehen, wie Phasen, Bewegung, Treffer, Krit, Doppelangriff, Waffendreieck und Elemente funktionieren,
damit ich die Kampfvorschau deuten kann.

**Akzeptanzkriterien:**

**Angenommen** die Kategorien Grundlagen, Kampf sowie Waffen & Elemente
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge mindestens zu Phasen und Aktionen, Bewegung und Zurücknehmen, Speichern, Trefferchance (zwei Würfel), Schaden, Krit, Doppelangriff, Supports im Kampf, Waffendreieck (Grafik) und Elementkreislauf (Grafik) mit Werten aus `balance.yaml`
**Und** die Texte liegen DE und EN vor und sind vom Produktinhaber abgenommen.

### Story 14.4: Einträge Gelände, Zustände, Leutnants, Tod und Bergen

Als Spieler
möchte ich nachlesen, was Gelände, Zustände, Leutnants und die Tod-Modi bewirken,
damit mich weder Feuer noch eine Flucht noch das Verbluten überrascht.

**Akzeptanzkriterien:**

**Angenommen** die Kategorien Gelände, Zustände, Leutnants sowie Tod & Bergen
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge zu jedem Gelände mit Verteidigung, Ausweichen, Heilung und Bewegungskosten je Bewegungstyp aus `terrain.yaml`, zu Feuer und Ausbreitung, Nass, Langsam, Wegstoßen, Felswand und Nebel, zu Groll und Kerben, Flucht bei 0 TP, Kopfgeld und Heimsuchungen, zu Niederstrecken, Verbluten, Bergen, Narben und den Modi Klassik/Standard/Casual
**Und** Texte DE + EN abgenommen.

### Story 14.5: Klassen-Steckbriefe

Als Spieler
möchte ich für jede spielbare Klasse Stärken und Schwächen sehen,
damit ich meine Truppe gezielt einsetze.

**Akzeptanzkriterien:**

**Angenommen** die Kategorie Klassen
**Wenn** der Spieler eine spielbare Klasse öffnet (`playable: true` in `classes.yaml`)
**Dann** zeigt der Steckbrief Rollen-Icon, ein Werte-Netz aus dem Wachstum, Bewegung, Bewegungstyp, Waffengruppen, Klassen-Aktion und Profi-Wege aus `classes.yaml`
**Und** je 2–3 Zeilen „stark“ und „schwach“ (Text in den Locales, DE + EN abgenommen)
**Und** eine neue spielbare Klasse ohne Steckbrief lässt `content:check` scheitern.

### Story 14.6: Einträge Heimat und Items

Als Spieler
möchte ich nachlesen, wie Räume, Ausbau, Items, Seltenheit, Runen, Sets und Last funktionieren,
damit ich Gold und Material sinnvoll einsetze.

**Akzeptanzkriterien:**

**Angenommen** die Kategorien Heimat und Items
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge zu Lager und Burg, Räumen und Ausbau (`rooms.yaml`), Glutfunke, Seltenheit (Rauten), Aufwerten, Runen, Sets, Gewicht und Last mit Werten aus den Content-Dateien
**Und** Inhalte, die erst mit Epic 10 kommen, sind als „ab Akt 2“ gekennzeichnet; Texte DE + EN abgenommen.

### Story 14.7: Lektionen und Kontext-„?“

Als Spieler
möchte ich die Lektionen des Prologs später nachlesen und aus dem Kampf direkt zur passenden Regel springen,
damit ich nicht erst suchen muss.

**Akzeptanzkriterien:**

**Angenommen** die Kategorie Lektionen
**Wenn** der Spieler sie öffnet
**Dann** stehen dort die Lektionen des Prologs (Bewegung, Gefahr, Heilen und alle weiteren Lektionen) als Text aus denselben Szenen-Schlüsseln, nicht als Kopie.

**Angenommen** Kampfvorschau, Gelände-Chip, Zustands-Symbole und Lektionen im Kampf
**Wenn** dort ein Kontext-„?“ steht (DESIGN.md `help-stone`) und der Spieler es antippt
**Dann** öffnet der Eintrag mit dem passenden Kontext-Anker als Blatt über dem Kampf; Schließen kehrt ohne Zustandsverlust zurück
**Und** jedes „?“ hat eine Tippfläche von mindestens 44 pt und verdeckt keine Zahl.
