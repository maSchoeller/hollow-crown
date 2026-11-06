## Epic 15: Umbau von Akt 1

Spieler bekommen Akt 1 in der abgenommenen Fassung der Überarbeitung (`concept/27-ueberarbeitung/`): neue, größere Karten mit mehr und schwächeren Gegnern, die neue Missionsfolge, Weltkarte v5, Szenen passend zu Welt und Folge, Lucan statt Kael und die ersten Brettfiguren zu den neuen Porträts. Danach folgt das erste echte Release mit Story 9.14. Festgeschrieben am 2026-11-05 nach den Entscheidungen des Produktinhabers (`umsetzung-lueckenliste.md`, Decision-Log der Epics).

**Grundlage:** abgenommene Entwürfe `concept/27-ueberarbeitung/levels/s1_*.yaml`, `concept/22-narrative/missionsliste-s1.md`, `geografie-valmora.md`, `concept/23-art-direction/figuren-bestand.md`, `map-assets/matrix.md`. Was dort steht, gilt vor `narrative.md` und den alten Missions-Stories 9.1–9.12.

**Gilt für alle Stories:** sichtbare Änderungen als Bild bei 375 × 812 belegt; Karten mit `pnpm sim` geprüft; Werte in YAML; kein `content:lock` vor Story 9.14. Keine Flieger und keine Pferde auf dem Brett (GDD-Log 2026-11-05).

**Reihenfolge:** 15.1 und 15.2 zuerst, dann 15.3–15.5 (15.8 parallel), dann 15.6 und 15.10. 15.7, 15.9 und 15.11 (nach 15.5) laufen unabhängig. Story 9.14 (Release) kommt nach allen Stories dieses Epics; Musik und Vertonung (8.8, 8.9) blockieren das Release nicht.

```text
15.1 Format-Reste ──┐
15.2 Kampagnenfolge ┴─> 15.3–15.5 Karten ──> 15.6 Szenen ──> 15.10 Abstimmung ──> 9.14 Release
15.7 Weltkarte v5 ─────────────────────────────────────────────────────────────────────┤
15.8 Galerie-Modelle (parallel zu 15.3–15.5)                                           │
15.9 Brettfiguren, Schritt 1 ──────────────────────────────────────────────────────────┤
15.11 Leistung großer Karten (nach 15.5) ──────────────────────────────────────────────┤
15.12 Weltkarte flüssig, Paktwacht als Ruine (nach 15.7) ──────────────────────────────┘
15.13 Figuren auf Treppen (Fehlerbehebung zu 15.3–15.5, unabhängig)
15.14 Brettfigur Dorfältester (Folge zu 15.9, unabhängig)
```

### Story 15.1: Format-Reste für die Entwürfe

Als Leveldesigner
möchte ich alles im Spielformat ausdrücken können, was die abgenommenen Entwürfe verlangen,
damit keine Karte einen Sonderfall im Code braucht.

**Akzeptanzkriterien:**

**Angenommen** die 12 Entwürfe in `concept/27-ueberarbeitung/levels/`
**Wenn** Gelände `roof` samt Stufe (N1), Item `pactwarden_shield` (N2) und die Wehrgänge in 1-6 und 1-8 als Schema, Regel und Darstellung ergänzt sind
**Dann** bestehen alle 12 Entwürfe `content:check` ohne Ausnahme
**Und** der Handbuch-Eintrag zu Höhe, Tor und Hebel stimmt mit den Regeln überein.

### Story 15.2: Neue Kampagnenfolge von Akt 1

Als Spieler
möchte ich Akt 1 in der Folge der abgenommenen Missionsliste spielen,
damit Weg und Geschichte zusammenpassen.

**Akzeptanzkriterien:**

**Angenommen** `campaign.yaml` von Akt 1
**Wenn** die Folge `P → 1-1 → (1-2 ∥ 1-3) → 1-4 → 1-5 → 1-6 → 1-7 → 1-8` gilt, mit höchstens 2 offenen Story-Missionen (Nebenquests zählen nicht mit), N1 nach E2 „schützen“, N2 nach 1-5 und N3 nach 1-6
**Dann** prüft ein Test jede erlaubte Reihenfolge, und keine verletzt die Regel „kein Ziel zweimal hintereinander“
**Und** Varek tritt nur noch über N2 bei, wenn Lucan ihn anspricht; der Weg ohne Varek läuft durch alle Szenen.

### Story 15.3: Kleine Karten (P, 1-1, N1, N2, N3, 1-7)

Als Spieler
möchte ich die kleinen Karten von Akt 1 in der neuen Fassung spielen,
damit Einstieg und Nebenquests zum neuen Maßstab passen.

**Akzeptanzkriterien:**

**Angenommen** die Entwürfe für P, 1-1, N1, N2, N3 und 1-7
**Wenn** sie die alten Karten unter `content/acts/act1/maps/` ersetzen (Feld `design:` bleibt), die Gegner auf das neue Bild abgestimmt sind (2–3× so viele, schwächer) und die Heimsuchungs-Anker neu gesetzt sind
**Dann** ist jede Karte im Spiel gewinnbar und liegt vorläufig im Korridor
**Und** im Prolog öffnet das Beben die Pforte, in 1-7 setzt der Einsturz Zeitdruck (`set_terrain`); alte Karten und ihre IDs sind entfernt.

### Story 15.4: Mittlere Karten (1-2, 1-3, 1-4, 1-5)

Als Spieler
möchte ich die mittleren Karten von Akt 1 in der neuen Fassung spielen,
damit die Kernmissionen Raum für mehr Gegner und Wege haben.

**Akzeptanzkriterien:**

**Angenommen** die Entwürfe für 1-2, 1-3, 1-4 und 1-5
**Wenn** sie wie in 15.3 übernommen und abgestimmt sind
**Dann** ist jede Karte gewinnbar und liegt vorläufig im Korridor
**Und** 1-3 hat das Ziel `reach`, in 1-4 löst ein Hebel den Felsrutsch aus, in 1-2 steht das Haus ab Runde 2 und kommen die Plünderer ab Runde 4; verschlossene Truhen und Schlüsselträger funktionieren laut GDD-Log.

### Story 15.5: Große Karten (1-6, 1-8)

Als Spieler
möchte ich die Paktwacht auf großen Karten erobern und halten,
damit die Wendepunkte des Akts als Schlachten wirken.

**Akzeptanzkriterien:**

**Angenommen** die Entwürfe für 1-6 und 1-8 (je 30 × 40, gespiegelt)
**Wenn** sie wie in 15.3 übernommen und abgestimmt sind
**Dann** sind beide Karten gewinnbar und liegen vorläufig im Korridor
**Und** Morra kommt durchs Westtor, Hask durch die Ostpforte; Söldner füllen freie Plätze auf.

### Story 15.6: Szenen an Welt und Folge anpassen, Lucan statt Kael

Als Spieler
möchte ich vor und nach jeder Mission Szenen sehen, die zu Ort und Folge passen,
damit die überarbeitete Geschichte ankommt.

**Akzeptanzkriterien:**

**Angenommen** `missionsliste-s1.md` und `geografie-valmora.md`
**Wenn** die Szenen DE und EN nachgezogen sind (Flucht per Lastkahn, Banden in der Ruine, Gräber-Zeile in 1-7, Saaten Kharesh, Stimme und Pakt, Halvard und Liora, Goldspur durch die Erlenbucht, Lucans Herkunft) und fehlende Ortsbilder vorliegen
**Dann** hat jede Mission eine Vor- und Nachszene passend zum Ort, und die Prüfung auf Ersatzsprecher ist grün
**Und** `lucan` heißt überall `lucan`: Texte DE und EN, IDs, Dateinamen, Porträts und Dokumente, vor dem ersten `content:lock`.

### Story 15.7: Weltkarte v5 einbinden

Als Spieler
möchte ich die neue Weltkarte von Valmora sehen,
damit Orte und Wege der Geschichte entsprechen.

**Akzeptanzkriterien:**

**Angenommen** `art/world/map_v5.png` und `map_places_v5.json`
**Wenn** die Karte als 3 × 3 Kacheln mit den Orten, Stadtbildern für 12 Orte, Nebel je Akt und Knoten nach der neuen Folge eingebunden ist
**Dann** zoomt sie auf dem Handy gestochen scharf, und das Paket-Budget hält
**Und** Fehlendes zeigt einen Rückfall statt einer Lücke; über Zustandsvarianten der Stadtbilder entscheidet der Produktinhaber in dieser Story (Art-Log).

### Story 15.8: Galerie-Modelle für Akt 1

Als Spieler
möchte ich auf den neuen Karten die Kulisse sehen, die beim Leveldesign abgenommen wurde,
damit Brett und Abnahme-Ansicht übereinstimmen.

**Akzeptanzkriterien:**

**Angenommen** die 113 Galerie-Modelle und `map-assets/matrix.md`
**Wenn** nur die Modelle in den Build kommen, die eine abgenommene Karte von Akt 1 braucht (Art-Log), im Paket `act1`
**Dann** besteht jedes verwendete Modell die vier Lesbarkeitsregeln, und Dreiecks- und Paket-Budget halten
**Und** `content:check` meldet kein fehlendes Modell; Akt 2 und 3 bekommen je eine eigene Story in ihrem Epic.

### Story 15.9: Brettfiguren zu den neuen Porträts, Schritt 1

Als Spieler
möchte ich die Hauptfiguren auf dem Brett so sehen wie in ihren Porträts,
damit ich sie wiedererkenne.

**Akzeptanzkriterien:**

**Angenommen** `concept/23-art-direction/figuren-bestand.md` und das vorhandene Tripo-Guthaben (rund 425 Credits)
**Wenn** Lucan, der Verwalter der Paktwacht und Osric Dunn neu entstehen (Turnaround → Tripo → Pipeline nach Art Direction §4.6) und `archer` auf das vorhandene `bandit_archer` getauscht ist
**Dann** bestehen die drei Figuren den Silhouettentest im Zoom „Mittel“ und bleiben im Budget (7 000 Dreiecke, 512er-Textur, 0,5 MB)
**Und** Prompts und Abnahmen liegen unter `art/prompts/`; über die übrigen 9 Modelle und einen Nachkauf von Credits entscheidet der Produktinhaber danach.

### Story 15.10: Akt 1 neu abstimmen

Als Produktinhaber
möchte ich Akt 1 auf den neuen Karten abgestimmt haben,
damit Schwierigkeit und Spielzeit zum neuen Gegnerbild passen.

**Akzeptanzkriterien:**

**Angenommen** die Stories 15.1–15.6
**Wenn** `pnpm sim --campaign act1` auf allen Schwierigkeiten läuft
**Dann** liegen alle Story-Missionen in den Korridoren (NFR12), und EP- und Goldkurve tragen über den Akt
**Und** die Spielzeit von Akt 1 passt zu 30–35 Stunden für die Staffel; die Dauer der Gegnerphase auf großen Karten ist gemessen.

### Story 15.11: Leistung großer Karten

Als Spieler
möchte ich auch auf großen Karten flüssig spielen,
damit die Schlachten auf dem Handy funktionieren.

**Akzeptanzkriterien:**

**Angenommen** Story 15.5 und die 3D-Burg
**Wenn** auf dem Referenzgerät Karten bis 1 200 Felder mit 50+ Figuren und die Burg gemessen werden
**Dann** halten sie die Leistungsziele; NFR1 ist auf den neuen Maßstab gehoben
**Und** Kamera und Übersicht funktionieren auf 30 × 40, die Gegnerphase lässt sich beschleunigen.

### Story 15.12: Weltkarte flüssig auf dem Handy, Paktwacht als Ruine

Als Spieler
möchte ich die Weltkarte auf dem Handy ruckelfrei ziehen und zoomen und die Paktwacht zu Beginn als Ruine sehen,
damit die Karte sich gut anfühlt und zur Geschichte passt.

**Akzeptanzkriterien:**

**Angenommen** die Weltkarte v5 aus Story 15.7 und der Handy-Test des Produktinhabers vom 2026-11-06 (starkes Ruckeln)
**Wenn** die Ursache gemessen (CPU 4–6× gedrosselt, 375 × 812) und die Karte als vorab zusammengefügtes Grundbild in Auflösungsstufen mit den Stadtbildern als einzelnen Sprites ausgeliefert ist
**Dann** laufen Ziehen und Zoomen ohne lange Frames, die Karte bleibt scharf, und das Paket-Budget hält; Messung vorher und nachher steht in der Story
**Und** die Paktwacht zeigt ab Spielbeginn eine Ruine; die ausgebaute Burg ist eine Zustandsvariante (`site.variants`), die erst mit der Burgstufe erscheint; das „P“ und der Rest der Karte bleiben unverändert.

### Story 15.13: Figuren auf Treppen (Fehlerbehebung zu 15.3–15.5)

Als Spieler
möchte ich meine Figuren auf Treppen, Rampen und Leitern sichtbar auf den Stufen stehen sehen,
damit ich Höhenwechsel auf dem Brett lesen kann.

Gemeldet vom Produktinhaber am 2026-11-06: Läuft eine Figur Treppen hoch, steht sie nicht auf der Treppe, und die Treppe wird durchsichtig.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit Höhenstufen (1-4, Wehrgänge in 1-6)
**Wenn** eine Figur auf einer Treppe, Rampe oder Leiter steht oder darüber läuft, auch über mehrere Stufen
**Dann** steht sie sichtbar auf der Oberfläche in der passenden Höhe, schwebt nicht und steckt nicht im Modell
**Und** Treppen, Rampen und Leitern werden nie durchsichtig; Häuser, Dächer und andere Gebäude blenden bei Verdeckung weiter aus.

### Story 15.14: Brettfigur Dorfältester (Folge zu 15.9)

Als Spieler
möchte ich den Dorfältesten auf dem Brett so sehen wie in seinem Porträt,
damit ich ihn wiedererkenne.

Beschlossen vom Produktinhaber am 2026-11-06: die nach Story 15.9 übrigen 205 Tripo-Credits für Schritt 1b in `concept/23-art-direction/figuren-bestand.md` einsetzen.

**Akzeptanzkriterien:**

**Angenommen** das Porträt `villager_elder` v2.5 (Strohhut, Kinnbärtchen, normal gebaut) und mindestens 140 Tripo-Credits aus dem bezahlten Tarif (Konto zeigt Free; Lauf vom Produktinhaber am 2026-11-06 freigegeben)
**Wenn** der Dorfälteste neu entsteht (Turnaround → Tripo mit Datenschutz „Privat“ → Pipeline nach Art Direction §4.6)
**Dann** besteht die Figur den Silhouettentest im Zoom „Mittel“ und bleibt im Budget (7 000 Dreiecke, 512er-Textur, 0,5 MB)
**Und** sie steht auf allen Karten, auf denen der Dorfälteste vorkommt; Prompts und Abnahme liegen unter `art/prompts/`, der neue Credit-Stand im Decision-Log der Art Direction.

### Story 15.15: Jahreszeiten-Boden (Vorbereitung für Akt 2 und 3)

Als Spieler
möchte ich in Akt 2 Herbstboden und in Akt 3 Schnee auf Boden, Felsen und Dächern sehen,
damit die Jahreszeit erzählt (Art Direction §2.4) und kein Herbstlaub oder keine Schneefichte mehr auf Sommerwiese steht.

Vorbereitung für Epic 11 und Akt 3 nach `concept/23-art-direction/map-assets/jahreszeiten-plan.md`; Akt-1-Karten bleiben unverändert.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit `season` in der YAML (`summer`, `autumn`, `winter`) oder ohne Angabe die Jahreszeit ihres Akts (`render.yaml board.actSeason`)
**Wenn** das Brett sie zeigt
**Dann** tauscht der Boden nach `board.seasonGround` nur die Texturen der Splat-Layer (Herbst: Gras mit Laub; Winter: Schnee, gefrorene Erde, Schneeweg), Innenräume (`interior: true`) tauschen nichts, und es lädt nur die Texturen der gezeigten Jahreszeit
**Und** im Winter tragen Felsmasse, Häuser und Kleinkram Weiß auf nach oben zeigenden Flächen (Weg B, Material), Mauer und Turm ihre Schneehauben-Modelle (Weg A), der Wald seine Jahreszeit-Fassung
**Und** Figuren, Teamfarben, Ringe und Markierungen bleiben ungefärbt und vom Boden unterscheidbar; die Wirkung eines Felds bleibt an derselben Form erkennbar (§3.2)
**Und** `content:check` prüft `season` und die Texturen von `seasonGround`; Dreiecks- und Paket-Budget halten, die Bildrate großer Karten sinkt bei gedrosselter CPU nicht.
