## Epic 5: Weltkarte und Heimsuchungen

Spieler wählen die nächste Mission auf einer Weltkarte, die nach jeder Mission der Startpunkt ist, und finden jeden Tag neue Heimsuchungen bekannter Leutnants auf bekannten Karten.

### Story 5.1: Szenen-Host und geteilter Asset-Cache

Als Spieler
möchte ich zwischen Brett, Weltkarte und Heimat wechseln, ohne lange zu warten,
damit sich das Spiel wie ein Ganzes anfühlt.

**Akzeptanzkriterien:**

**Angenommen** `src/render/host.ts` mit Engine, Canvas, Qualitätsstufe und FPS-Deckel
**Wenn** die App zwischen Szenen wechselt
**Dann** ist immer nur eine Szene aktiv; die alte wird entsorgt, Modelle bleiben im geteilten Asset-Cache (Referenzzählung) und werden nicht neu geladen
**Und** das Brett ist in `render/board/` und gemeinsame Teile (Gelände, Modelle, Figuren, Kamera, Jahreszeit) in `render/shared/` aufgeteilt, mit unveränderter Schnittstelle (`load`, `play`, `setOverlays`, `centerOn`, `relayout`, `quality`, `dispose`).

**Angenommen** eine Szene im Hintergrund eines Dialogs
**Wenn** eine Visual-Novel-Szene läuft
**Dann** rendert der Canvas mit `board.fpsIdle` oder pausiert
**Und** die Zeichenaufrufe auf Kap. 1 (Mittel) steigen nicht gegenüber D17.

### Story 5.2: Die Weltkarte als flaches Bild

Als Spieler
möchte ich Valmora als gemalte Karte sehen, auf der meine Truppe von Akt zu Akt nach Norden zieht,
damit ich spüre, wo sie gewesen ist.

*(Geändert vom Produktinhaber, 2026-10-24: flaches Bild statt 3D-Szene; siehe `concept/23-art-direction/decision-log.md`.)*

**Akzeptanzkriterien:**

**Angenommen** `content/world/valmora.yaml` (Bild, Regionen mit Akt und Ort des Namens, Nebelkanten je Akt, Orte als Prozentpositionen mit Beschriftung und Art, optional mit Knoten-ID)
**Wenn** die Weltkarte geladen wird
**Dann** zeigt sie das gemalte Hochformat-Bild (Akt 1 unten, Akt 2 Mitte, Akt 3 oben) mit den Steinen der Knoten darauf; Regionen späterer Akte liegen unter Nebel mit Regionsname
**Und** die Karte hat 2 Zoomstufen und lässt sich verschieben; `content:check` prüft, dass jeder Knoten und die Heimat einen Ort haben und die Steine mindestens 90 px Abstand halten.

**Angenommen** ein Ort mit Varianten oder Drachenzeichen (z. B. Varnhold gerettet/verbrannt)
**Wenn** diese Aufsätze gebaut sind
**Dann** liegen sie als kleine Bilder oder Modelle auf der Lichtung (nicht Teil dieser Story; später optional).

### Story 5.3: Weltkarte als Hub

Als Spieler
möchte ich nach jeder Mission auf der Weltkarte landen und von dort alles erreichen,
damit ich immer sehe, was als Nächstes ansteht.

**Akzeptanzkriterien:**

**Angenommen** eine Kampagne nach dem Prolog
**Wenn** eine Mission endet oder der Spieler fortsetzt
**Dann** erscheint die Weltkarte mit Akt-Pille (Nummer, Jahreszeit, Name), Gold und Material als Pillen, Menü rund oben rechts und der Leiste unten mit vier Steinen (Heimat, Truppe, Steckbriefe, Chronik) (Mockup 03)
**Und** der Kriegslager-Hub aus U20 entfällt; die Heimat ist zusätzlich ein Ort auf der Karte.

**Angenommen** Knoten aus `availableNodes`
**Wenn** sie dargestellt werden
**Dann** sind Story-Knoten orange mit Nummer, Nebenquests grün mit „!“, Heimsuchungen rot mit Leutnant-Gesicht (am ersten Tag „NEU“), Heimat mit Zelt bzw. Burg, Erledigtes klein und grau
**Und** ein Tipp zoomt leicht heran und öffnet die Knoten-Karte (Kicker, Titel, Ziel, Plätze, Stufe, Leutnant mit Fluchtregel bzw. Groll, Belohnung als Symbol + Zahl, Aufstellung, Aufbrechen).

### Story 5.4: Tageswechsel

Als Spieler
möchte ich jeden Tag neue Heimsuchungen finden, ohne dass mir etwas wegläuft,
damit ich gern, aber nicht aus Pflicht zurückkomme.

**Akzeptanzkriterien:**

**Angenommen** `src/app/day.ts` mit `dayNumber(now, 4)` (Tageswechsel 04:00 Ortszeit)
**Wenn** die Weltkarte öffnet oder die App fortgesetzt wird
**Dann** schickt die App `advanceDay{ day }`; der Kern erzeugt Tagespakete für höchstens die letzten 3 Tage bis `day` und setzt `c.day.last`
**Und** ist `day ≤ last`, passiert nichts (zurückgestellte Uhr erzeugt nichts).

**Angenommen** neue Tagespakete
**Wenn** die Weltkarte erscheint
**Dann** zeigt ein Hinweis „Neuer Tag: n Heimsuchungen · nächste ab morgen 4:00“
**Und** vor der ersten Leutnant-Begegnung entstehen keine Heimsuchungen; Sommerzeitwechsel ändert nichts (Test).

### Story 5.5: Heimsuchungs-Anker und Generator

Als Spieler
möchte ich auf bekannten Karten neue, faire Aufgaben gegen bekannte Leutnants bekommen,
damit sich Wiederkehr lohnt.

**Akzeptanzkriterien:**

**Angenommen** Karten-YAML mit `haunts:`-Ankern (Variante, Ziel, Spawn-Zone, Einsatzzone, Rundenlimit bzw. Truhen) und `content/acts/act1/haunts.yaml` mit Gegner-Pools
**Wenn** ein Tagespaket entsteht
**Dann** wählt der Generator mit `seedRng(hash32(c.seed, day))` 1–3 abgeschlossene Story-Karten mit Ankern, die gerade nicht heimgesucht sind, je eine Variante (nicht die zuletzt gespielte) und einen Leutnant aus erreichten Akten, der nicht gewechselt ist
**Und** Gegner kommen aus den Pools auf erwarteter Armee-Stufe mit dem Ausrüstungs-Tier des Akts.

**Angenommen** mehr als 6 offene Heimsuchungen
**Wenn** eine neue entsteht
**Dann** verfällt die älteste
**Und** `content:check` prüft für jeden Anker die Erreichbarkeit (Pfad von jedem Einsatzfeld zum Ziel); Tests zeigen Reproduzierbarkeit aus Seed und Tag.

### Story 5.6: Heimsuchungen spielen und belohnen

Als Spieler
möchte ich für Heimsuchungen angemessen belohnt werden, ohne davonzulaufen,
damit sie eine Ergänzung zur Story bleiben.

**Akzeptanzkriterien:**

**Angenommen** eine gewonnene Heimsuchung
**Wenn** das Ergebnis berechnet wird
**Dann** gibt es 40 % des Story-Golds des aktuellen Akts, Kopfgeld, Material und 60 % EP, keine Glutfunken (Werte in `balance.yaml`)
**Und** ab der 4. Heimsuchung seit der letzten Story-Mission halbieren sich Gold und Kopfgeld; Einheiten über der erwarteten Armee-Stufe der nächsten Story-Mission erhalten 50 % der Heimsuchungs-EP.

**Angenommen** `pnpm sim --haunt <mapId>:<variant>`
**Wenn** es für jeden Anker der Akt-1-Karten läuft
**Dann** liegen die Ergebnisse im Normal-Korridor oder die Abweichung ist begründet.
