## Epic 16: Ausrüstung zum Anfassen

Spieler sehen und begreifen ihre Ausrüstung: Runen sitzen sichtbar im Metall der 3D-Waffen, die Truppe steht in 3D im Figurenblatt, jede Waffe hat eine eigene Ansicht mit Chronik, Verzauberer und Händler zeigen nur, was sich ändert, und das Brett erklärt Gelände, Bewegungskosten und Elemente selbst. Dazu kommen vier Regeln mit Zahlen (Straße ½, Gegnerphase 2×, Schild-Runen, Waffen-Chronik) und die Waffenkammer im Bergfried. Festgeschrieben am 2026-11-21 nach den acht abgenommenen Themen der Konzeptreihe „Ausrüstung zum Anfassen“ (Produktinhaber) und seinen Antworten zu Zeitpunkt und Umfang (Decision-Log der Epics).

**Grundlage:** Mockups `art/mockups/ausruestung-2026-11/` (`verzauberer.html`, `truppe.html`, `haendler.html`, `brett.html`, `animation.html`, `regeln.html`, `vitrine.html`), Modelle `art/models/weapons-v2/` und `art/models/runes-v2/`; Regeln im GDD (Geländetabelle, Raster und Bewegung, Inventar und Ausrüstung, Kampfsystem, Heimat), Abläufe in `concept/25-ux/EXPERIENCE.md` (Kampfvorschau, Bewegungsbereich, Gelände-Linse, Feldkarte, Kampfhaltung, Verzauberer (Werkbank), Figurenblatt (Ankleidepuppe), Händler (zuerst die Person), Waffenansicht, Waffenkammer (Bergfried), Änderungsliste), Bausteine in `DESIGN.md` (`workbench-stage`, `rune-gem`, `change-list`, `person-bar`, `terrain-lens`, `tile-card`, `cost-pips`, `element-band`, `stand-plate`, Linien-Icons), Bild in Art Direction §4.5, §4.7 und §7. Einträge vom 2026-11-21 in den Decision-Logs von `21-gdd`, `23-art-direction` und `25-ux`.

**Gilt für alle Stories:** sichtbare Änderungen als Bild bei 375 × 812 belegt, mit dem Mockup daneben; **keine Emojis, nur Linien-Icons** im Stil von `src/ui/icons.tsx` (fehlende Zeichen werden dort ergänzt); Beträge als Symbol + Zahl; Werte in `balance.yaml` bzw. den Content-YAMLs, Texte DE und EN; Vorschau und Auflösung rufen denselben Formelcode. 3D-Ansichten teilen den Asset-Cache des Brett-Szenen-Hosts (AR12/AR13). Waffenmodelle entstehen ohne Tripo: ChatGPT-Baupläne, Nachbau per Blender-Skript (§4.7, Protokoll unter `art/prompts/`). Das Paket-Budget aus `check-bundle-size.mjs` hält. Kein `content:lock`.

**Zeitpunkt (Produktinhaber 2026-11-21):** Epic 16 kommt **vor Story 9.14** (Release von Akt 1). Die Waffen-Chronik ändert damit den Spielstand, bevor etwas gesperrt ist, und Straße ½ wird vor dem Release abgestimmt.

**Reihenfolge:** Drei Stränge laufen parallel. Regeln: 16.1 zuerst, 16.2 direkt danach; 16.3, 16.4 und 16.5 unabhängig. Bild: 16.6 → 16.7 → 16.8; 16.9 nach 16.6 und 16.7, dann 16.10. Oberfläche: 16.13 zuerst, 16.11 nach 16.1, 16.12 nach 16.4 und 16.6, 16.14 nach 16.5, 16.6 und 16.13, danach 16.15–16.17; 16.18 nach 16.8 und 16.14. 16.19 zuletzt, danach Story 9.14.

```text
Regeln     16.1 Straße ½ ──> 16.2 Karten nachziehen ──────────────────────────────┐
           16.3 Gegnerphase 2× · 16.4 Schild-Runen · 16.5 Waffen-Chronik ─────────┤
Bild       16.6 Waffen v2 im Spiel ──> 16.7 übrige Gruppen ──> 16.8 Signaturen ───┤
           16.9 Griff-Rig + Finger (nach 16.6/16.7) ──> 16.10 Ruhe + Kampfhaltung ┤
Oberfläche 16.13 Änderungsliste + Icons                                           │
           16.11 Brett: Linse + Kosten (nach 16.1)                                │
           16.12 Kampfvorschau: Element-Band (nach 16.4, 16.6)                    │
           16.14 Waffenansicht (nach 16.5, 16.6, 16.13) ──> 16.15 Figurenblatt    │
                                                       ├──> 16.16 Verzauberer     │
                                                       └──> 16.17 Händler         │
           16.18 Waffenkammer im Bergfried (nach 16.8, 16.14) ────────────────────┤
16.19 Handbuch, Leistung und Abnahme ─────────────────────────────────────────────┴──> 9.14 Release
```

### Story 16.1: Straßen und Brücken kosten ½

Als Spieler
möchte ich auf Straßen und Brücken doppelt so weit kommen,
damit lange Laufwege auf großen Karten schneller gehen.

**Akzeptanzkriterien:**

**Angenommen** die Geländetabelle im GDD (Thema 7, gewählt A)
**Wenn** Straße und Brücke in `terrain.yaml` für alle Bewegungsarten ½ kosten, Tor, Rampe und Treppe bei 1 bleiben und Bewegung im Kern halbe Punkte kennt
**Dann** kommt eine Figur mit Bewegung 4 auf der Straße 8 Felder weit, und eine übrige halbe Bewegung reicht für ein weiteres Straßenfeld, nicht für ein Feld mit Kosten 1
**Und** Bewegungsbereich, Wegsuche, Gegner-KI, Gefahrenzone, Autoplay und Simulation rechnen mit denselben Kosten (ein Test je Stelle), Replays alter Logs werden nicht nachgerechnet, sondern als neue Regel geführt
**Und** ein Unit-Test belegt „noch 1½“ als Restbewegung; die Kampagnen-Simulation zeigt Akt 1 rund 2,1 h und Akt 2 rund 2,4 h Kampfzeit (Sim 2026-11-21).

### Story 16.2: Balancing-Nachzug für Prolog, 1-2, 2-1 und 2-8

Als Spieler
möchte ich, dass die Karten nach der Straßen-Regel wieder im Siegkorridor liegen,
damit schnellere Wege das Spiel nicht unfair machen.

**Akzeptanzkriterien:**

**Angenommen** Story 16.1 und die Sim vom 2026-11-21 (Sieg im ersten Versuch: Prolog 88 → 38 %, 1-2 96 → 70 %, 2-1 100 → 86 %, 2-8 60 → 36 %)
**Wenn** die vier Karten über Weckrunden, Startpositionen und Gegneraufstellung nachgezogen sind (nicht über die Straßenkosten und nicht über Spielwerte in `balance.yaml`)
**Dann** liegen alle vier mit `pnpm sim <mapId> --runs 50` wieder im Korridor NFR12 (2-8 als Finale am oberen Rand wie in Story 11.27), und die Läufe sind als JSON gesichert und per `pnpm sim:diff` gegen den Stand vor 16.1 verglichen
**Und** im Prolog fällt der vorgelaufene Avatar nicht mehr gehäuft; alle übrigen Story-Karten von Akt 1 und 2 sind ebenfalls neu simuliert, und jede, die aus dem Korridor fällt, ist in dieser Story mitgezogen.

### Story 16.3: Gegnerphase standardmäßig 2×

Als Spieler
möchte ich, dass die Gegnerphase von selbst schnell läuft,
damit ich weniger warte.

**Akzeptanzkriterien:**

**Angenommen** die Option „Tempo“ der Gegnerphase (GDD-Log 2026-11-21, nimmt den Standard 1× vom 2026-10-28 zurück)
**Wenn** neue Einstellungen mit 2× starten und gespeicherte Einstellungen einmal auf 2× gesetzt werden (eine Einstellungs-Migration mit Marke, damit ein späteres 1× bleibt)
**Dann** läuft die Gegnerphase mit 2×, „Gegnerzüge: Gemeinsam“ bleibt Standard und die Zeitgrenze bleibt 13 s
**Und** ein Test belegt: wer nach der Umstellung 1× wählt, behält 1× nach dem Neuladen; Regeln und Replays bleiben unverändert.

### Story 16.4: Schild-Runen

Als Spieler
möchte ich einen Schild mit einer Element-Rune gegen ein Element schützen,
damit sich Schilde gegen Brandfelder und Zauberer lohnen.

**Akzeptanzkriterien:**

**Angenommen** die Regel im GDD (Inventar und Ausrüstung, Thema 7, gewählt A)
**Wenn** jeder Schild 1 Runenplatz nur für Element-Runen hat und die Stufen wirken: I Schaden des Elements ×0,8, II dazu immun gegen dessen Zustand, III dazu immun gegen dessen Geländewirkung
**Dann** nimmt eine Figur mit Feuer III am Schild auf dem Brandfeld keinen Schaden, und tragen Schild und Körper dasselbe Element, zählt nur der bessere Faktor (Unit-Tests für alle drei Stufen und den Doppelfall)
**Und** die Schild-Rune bringt keine Schwäche; Faktoren und Immunitäten stehen in `balance.yaml`, und die Kampfvorschau holt sie aus `elementMultiplier` bzw. demselben Zustandscode wie die Auflösung
**Und** Verzauberer, Händler-Änderungsliste und Gegner-Ausrüstung kennen den Schildplatz; bestehende Schilde in Akt 1 und 2 bekommen den Platz ohne Rune.

### Story 16.5: Waffen-Chronik mit Kill-Zähler und Beinamen

Als Spieler
möchte ich sehen, wie viele Gegner eine Waffe schon gefällt hat, und ihr einen Beinamen verdienen,
damit meine Waffen eine Geschichte haben.

**Akzeptanzkriterien:**

**Angenommen** die Regel im GDD (Thema 7, gewählt A) und `ItemInstance` in `src/core/state.ts`
**Wenn** jede Waffen-Instanz ihre Kills zählt (letzter Schlag, auch beim Konter; ein vertriebener Leutnant zählt) und das Kampf-Event den Zähler setzt
**Dann** bekommt die Waffe beim 10. Kill einen Beinamen aus Name der führenden Figur und einem Wort ihrer Waffengruppe (Wortliste DE/EN in den Locales), und vertreibt oder fällt sie einen Leutnant, sofort einen Beinamen nach ihm („Haskbrecher“), wenn sie noch keinen hat
**Und** Zähler und Beiname wandern mit der Waffe, bleiben beim Weitergeben und ändern keine Spielwerte; Schwelle 10 steht in `balance.yaml`
**Und** das Feld ist im Speicherformat aufgenommen: alte Spielstände laden mit 0 Kills; erhöht die Story `SAVE_FORMAT`, gibt es die Migration in `src/persistence/save.ts` und den Fixture-Stand nach AGENTS.md; Replays liefern identische Zähler
**Und** die Kampagnen-Simulation meldet Kills und Beinamen je Durchgang (Richtwert Akt 1 rund 150 Kills und 6 Beinamen, bis Ende Akt 2 höchstens 8).

### Story 16.6: Runenwaffen v2 im Spiel (Axt, Schwert, Lanze, Schild)

Als Spieler
möchte ich die Rune als Teil der Waffe sehen, eingelassen ins Metall und nach Stufe leuchtend,
damit ich Runen auf einen Blick erkenne.

**Akzeptanzkriterien:**

**Angenommen** die Modelle aus `art/models/weapons-v2/` und `art/models/runes-v2/` und Art Direction §4.7
**Wenn** sie über die Asset-Pipeline (`pnpm art:build`, `render.yaml`) die alten Gruppenmodelle für Axt, Schwert, Lanze und Schild ersetzen, der Füllwert `fill` der Rinne die Stufe zeigt (I ein Drittel, II zwei Drittel, III ganz mit Puls) und der Runenstein der eingesetzten Rune in der Fassung sitzt
**Dann** glimmen Runenwaffen auf dem Brett gedämpft, leuchten bei der gewählten Figur und bei Angreifer und Ziel der Kampfvorschau voll, und Gegnerwaffen leuchten genauso
**Und** Eisen, Stahl und Silber unterscheiden sich durch Tönung bei gleicher Form; Selten und besser zeigen die zweite, kleine Fassung im Modell
**Und** die offenen Punkte der Abnahme sind nachgearbeitet und vom Produktinhaber abgenommen: Schild nicht mehr einheitlich beige, Steinstufen I und II von vorn unterscheidbar, Krallen größer, Axt-Tülle weniger kastig, Tiefenversatz gegen das Flimmern von Rinne und Stein
**Und** je Waffe rund 8 000 Dreiecke, je Stein unter 2 000; das Paket-Budget hält.

### Story 16.7: Runenwaffen v2 für alle übrigen Waffengruppen

Als Spieler
möchte ich, dass jede Waffe auf dem Brett im neuen Stil mit Fassung und Rinne erscheint,
damit nicht alte und neue Modelle nebeneinander stehen.

**Akzeptanzkriterien:**

**Angenommen** Story 16.6 und die Entscheidung des Produktinhabers 2026-11-21 (alle Gruppen)
**Wenn** Bogen, Dolch, Stab, Buch (zugeklappt und aufgeschlagen, §4.5), Laute und Fokus nach dem Verfahren aus §4.7 entstehen (Baupläne per ChatGPT, Prompt und Abnahme in `art/prompts/<id>.md`, Blender-Skript je Gruppe unter `tools/art/`, Ablage `art/models/weapons-v2/`)
**Dann** hat jede Gruppe eine Fassung gleicher Größe, eine Rinne entlang ihrer Form mit `fill` und Tönungen für Eisen, Stahl und Silber
**Und** der Produktinhaber hat jede Gruppe an Abnahmebildern (Ansichten von vorn, Seite, mit Stein I/II/III) abgenommen
**Und** die alten Modelle unter `public/assets/models/weapons/` sind nicht mehr referenziert und entfernt.

### Story 16.8: Modelle für Signaturwaffen und Relikte

Als Spieler
möchte ich Signaturwaffen und Relikte an ihrem eigenen Merkmal erkennen,
damit eine Trophäe nicht aussieht wie jede andere Waffe.

**Akzeptanzkriterien:**

**Angenommen** die Signaturen der Leutnants und Gefährten von Akt 1 und 2 und die Relikte in `content/core/items.yaml` und Story 16.7
**Wenn** jede Signatur das v2-Modell ihrer Gruppe mit eigener Tönung, fester Rune und einem Merkmal bekommt (z. B. Zahn an `wolf_fang`, Haken an `gold_hook`; Entscheidung Produktinhaber 2026-11-21: Gruppenmodell + Merkmal) und das Item in `render.yaml` auf sein Modell zeigt
**Dann** haben auch die Stücke ohne bisheriges Modell eins: die Bogen-Signaturen (`bounty`, `white_wolf`, `wasp_sting`), die Dolch-Signatur `magpie`, die Laute `final_curtain` („Letzter Vorhang“) und `pact_warden_shield`
**Und** das Relikt `dragon_ember` („Drachenglut“) bekommt als Schmuckstück ein eigenes Modell
**Und** der Produktinhaber hat die Merkmale an einem Sammelbild aller Stücke abgenommen; Brett, Figurenblatt, Waffenansicht und Waffenkammer zeigen dasselbe Modell.

### Story 16.9: Griff-Rig und Fingerknochen für alle Brettfiguren

Als Spieler
möchte ich, dass jede Figur ihre Waffe richtig in der Hand hält,
damit Schwert, Lanze und Buch nicht schräg an der Hand kleben.

**Akzeptanzkriterien:**

**Angenommen** die Tabelle „Haltung je Waffenart“ in Art Direction §4.5 und die 45 Brettfiguren unter `art/models/units/`
**Wenn** jedes Waffenmodell einen Griffpunkt mit fester Achse trägt, jede Figur einen Griff-Sockel in der Handfläche (statt `socket_r`/`socket_l` am Handgelenk) und Fingerknochen bekommt (Tripo-Rig mit Fingern oder Nachrig in Blender, per Skript wiederholbar)
**Dann** schließt sich die Hand je Griffart (Faust um Schaft und Heft, flache Hand unter dem aufgeschlagenen Buch), und Hand und Griffpunkt kommen aus der Waffenart in `render.yaml`
**Und** der Griffwinkel `hold` ist entfernt; ein Abnahmebild zeigt jede Waffenart an zwei Figuren in Ruhe und Kampfhaltung
**Und** alle 45 Figuren (Gefährten, Söldner, Gegner, Leutnants) sind umgestellt (Entscheidung Produktinhaber 2026-11-21); jede Figur bleibt im Budget von Story 15.9 (7 000 Dreiecke, 512er-Textur, 0,5 MB).

### Story 16.10: Ruhe, Haltung je Waffenart und Kampfhaltung bei Auswahl

Als Spieler
möchte ich ruhig atmende Figuren sehen, die bei Auswahl kampfbereit werden,
damit das Brett lebendig wirkt, ohne zu taumeln.

**Akzeptanzkriterien:**

**Angenommen** Story 16.9 und Art Direction §4.5 (Ruhe C, Brett B)
**Wenn** je Waffenart die Clips Ruhe (Atmen etwa alle 4 s), drei Gesten (umsehen, Gewicht verlagern, Waffe nachfassen) und Kampfhaltung als gebackene Vertex-Animation entstehen und das bisherige Taumeln entfällt
**Dann** stehen Figuren in Ruhe in der Haltung ihrer Waffenart, jede startet ihre Schleife an anderer Stelle und zeigt alle 6–10 s eine Geste zu eigener Zeit; die Hände bleiben ruhig, Waffe und Schild drehen nicht weg
**Und** die gewählte Figur sowie Angreifer und Ziel der Kampfvorschau wechseln in 0,25 s in die Kampfhaltung, gleichzeitig mit dem vollen Runenleuchten, und zurück, wenn die Auswahl endet
**Und** die Bildrate auf dem Referenzgerät hält auf der größten Karte (Messung wie Story 15.11); Laufen, Angriff, Treffer, Niedergestreckt, Flucht und Jubel nutzen dieselben Griffe.

### Story 16.11: Brett erklärt Gelände und Bewegungskosten

Als Spieler
möchte ich sehen, was ein Feld bewirkt und was mich ein Weg kostet,
damit ich ohne Handbuch plane.

**Akzeptanzkriterien:**

**Angenommen** Story 16.1, EXPERIENCE (Gelände-Linse, Feldkarte, Bewegungsbereich) und DESIGN (`terrain-lens`, `tile-card`, `cost-pips`)
**Wenn** ein langer Druck (≥ 400 ms, Füllring) auf „Gefahr“ bzw. G am PC die Gelände-Linse einschaltet, die bis zum nächsten Tipp an bleibt und die Gefahrenzone ersetzt
**Dann** färbt sie jedes Feld nach Wirkung für „zu Fuß“ (grün Schutz, gelb langsam, hell gestreift schnell, rot Schaden, grau schraffiert gesperrt, zwei Wirkungen diagonal geteilt) mit Legende als Pille, und im ersten Kampf mit besonderem Gelände erscheint einmal der Hinweis „Gefahr gedrückt halten: Gelände“
**Und** im Bewegungsbereich tragen teure Felder Punkte, die Straße „½“, und am Pfeilende steht „noch n“ mit Stiefel
**Und** die Feldkarte zeigt Feldbild, Name, Wirkungen als Chips mit Linien-Icon und Kontext-„?“ und die Kosten der gewählten, sonst der nächsten bereiten Figur („kommt nicht hin“ bei gesperrt), ohne Abkürzungen; Kosten kommen aus derselben Funktion wie die Wegsuche.

### Story 16.12: Kampfvorschau mit Element-Band

Als Spieler
möchte ich in der Kampfvorschau sehen, was die Runen bewirken,
damit ich Elementvorteile nutze.

**Akzeptanzkriterien:**

**Angenommen** Story 16.4 und 16.6, EXPERIENCE „Kampfvorschau“ (Thema 5, B) und DESIGN `element-band`
**Wenn** der Waffen-Chip den Runenstein als Kreis in Elementfarbe mit Stufe trägt und eine Rune des Ziels in Rüstung oder Schild als zweiter Chip unter seiner Waffe steht
**Dann** steht über der Tabelle das Element-Band mit beiden Elementen und einem Satz mit Faktor („Feuer schlägt Wind · Schaden ×1,2“), die Schadenszahl trägt denselben Faktor als Marke, und unter der Tabelle steht die Status-Zeile mit Chance, Dauer und Schaden je Runde
**Und** ohne Rune fallen Band und Zeile weg; Faktor und Chance kommen aus `elementMultiplier` und `balance.yaml` (Test: Vorschau = Auflösung); das „?“ am Band öffnet den Handbuch-Eintrag zum Elementrad.

### Story 16.13: Änderungsliste und Linien-Icons als gemeinsame Bausteine

Als Spieler
möchte ich bei jeder Probe nur sehen, was sich ändert,
damit Vergleiche ohne Rechnen gehen.

**Akzeptanzkriterien:**

**Angenommen** EXPERIENCE „Änderungsliste“ und DESIGN `change-list` sowie die Icon-Regel (DESIGN „Linien-Icons statt Emojis“)
**Wenn** eine Komponente die Änderungsliste aus dem Kern-Ergebnis „Item A gegen Item B für Figur X“ baut (eine Zeile je Änderung mit Symbol, Bezeichnung, neuem Wert und Differenz; Element-Wechsel, Schaden je Gegner-Element nur bei Änderung, „neu“ und „fällt weg“) und ohne Probe den aktuellen Stand zeigt
**Dann** rechnet sie über dieselben Stat- und Formelfunktionen wie Kampf und Figurenblatt (Test: Änderung = Differenz der berechneten Werte)
**Und** `src/ui/icons.tsx` hat die fehlenden Zeichen (TP, Bewegung, Gewicht, Reichweite, Krit, Resistenz, Stärke und die Elemente) im 24er Raster mit Strich 1,9; kein Screen dieses Epics nutzt Emojis.

### Story 16.14: Waffenansicht

Als Spieler
möchte ich eine Waffe groß und drehbar mit Rune, Werten und Chronik ansehen,
damit ich meine Ausrüstung kenne.

**Akzeptanzkriterien:**

**Angenommen** Story 16.5, 16.6 und 16.13 und EXPERIENCE „Waffenansicht“
**Wenn** eine gemeinsame 3D-Bühne für Items entsteht (Modell drehbar per Ziehen, Rune in der Fassung, Rinne nach Stufe; DESIGN `workbench-stage`) und die Waffenansicht sie als Vollbild nutzt
**Dann** zeigt sie Kopf mit Name, Seltenheit und Schließen, Werte als Symbol + Zahl, die Wirkung der Rune als Änderungsliste gegenüber „ohne Rune“, die Chronik-Zeile (Kills, Beiname, Herkunft) und die Tasten „Verzaubern“ (Verzauberer für diese Waffe) und „Aufwerten“ (Schmied)
**Und** Stücke ohne 3D-Modell (Rüstung, Accessoires) zeigen ihr Item-Bild; die Bühne gibt beim Schließen ihre Ressourcen frei.

### Story 16.15: Figurenblatt als 3D-Ankleidepuppe

Als Spieler
möchte ich meine Figur in 3D mit ihrer Ausrüstung sehen und direkt umziehen,
damit ich verstehe, was sie gerade leisten kann.

**Akzeptanzkriterien:**

**Angenommen** Story 16.10 und 16.14, EXPERIENCE „Figurenblatt (Ankleidepuppe)“ und Mockup `truppe.html` (Fassung 5)
**Wenn** die Figur als ihr Brettmodell über das ganze Handy in leichter Kampfhaltung steht, drehbar per Ziehen, mit Kopfpille (Name, Klasse, Stufe, Erfahrung, Pfeile, Wischen)
**Dann** hängen die Plätze über dem Bild (links Haupthand, Kopf, Körper, rechts Nebenhand, zwei Accessoires, je mit Item-Bild und Runenpunkt), Tippen markiert ohne Kamerafahrt
**Und** das untere Viertel zeigt Leistungs-Tabelle (acht Werte), Beutel und Last, hochgezogen Grundwerte, Können mit FP-Stand und Elemente; ein gewählter Platz zeigt die Item-Details wie beim Kauf mit „Wechseln“ und „Waffe ansehen“ (öffnet 16.14)
**Und** ein leerer Beutelplatz füllt sich direkt aus dem Konvoi, ein voller gibt sein Item zurück; der Abschnitt des alten Figurenblatts in `src/ui/styles.css` ist gelöscht.

### Story 16.16: Verzauberer als Werkbank

Als Spieler
möchte ich eine Rune zur Probe in die Waffe legen und sehen, was sie ändert,
damit Verzaubern kein Rätselraten ist.

**Akzeptanzkriterien:**

**Angenommen** Story 16.4, 16.13 und 16.14, EXPERIENCE „Verzauberer (Werkbank)“ und GDD (Runenplätze frei belegbar, höchstens eine Element-Rune je Item)
**Wenn** der Raum für eine Person öffnet (Medaillons, ihre Items mit Runenpunkten, Item in der 3D-Bühne, Änderungsliste, Runenvorrat als Steine mit Stufe und Anzahl)
**Dann** legt der erste Tipp auf einen Stein ihn zur Probe in die Fassung (Stein wächst auf, Rinne füllt sich), die Haupttaste setzt ein bzw. heißt „Tauschen“ und schickt die alte Rune in den Konvoi; ohne Stein baut sie die Rune kostenlos aus; unpassende Steine sind gedimmt mit Grund; Rune I zum Kauf steht gestrichelt mit Preis
**Und** im Modus „Verschmelzen“ zeigt jeder Stein seinen Stand, verschmolzen wird nur aus dem Konvoi, und drei Steine fliegen in der Bühne zusammen (Lichtblitz in Elementfarbe)
**Und** Rüstung erscheint bis zu ihrem Modell als Bild mit Stein am Brustteil; alle Aktionen laufen als Kampagnen-Commands und sind im Replay identisch.

### Story 16.17: Händler „zuerst die Person“

Als Spieler
möchte ich für eine bestimmte Figur einkaufen und das Gekaufte gleich anlegen,
damit ich nicht zwischen Laden und Figurenblatt wechseln muss.

**Akzeptanzkriterien:**

**Angenommen** Story 16.13, EXPERIENCE „Händler (zuerst die Person)“ und GDD-Log 2026-11-21 (kauft direkt in die Hand)
**Wenn** oben fest die Medaillons der Truppe mit dem Konvoi als letztem stehen und darunter Name, Klasse, Stufe und Getragenes der gewählten Person (geöffnet mit der zuletzt gewählten)
**Dann** zeigt die Liste nur, was die Person tragen kann, nach Platz gruppiert, mit ein bis zwei Änderungs-Chips je Zeile („trägt sie schon“ bei Gleichem); aufgeklappt die ganze Änderungsliste und „Kaufen und anlegen“ mit Preis (Verbrauch: „In den Beutel“) und die Konvoi-Taste
**Und** das bisher Getragene geht in den Konvoi, die Zeile sagt es vorher; Nicht Tragbares steht eingeklappt unten mit Grund und ist für die Person nicht kaufbar; mit dem Konvoi-Medaillon zeigt jede Zeile die Köpfe möglicher Träger und kauft nur in den Konvoi
**Und** „Für wen?“ entfällt, Verkaufen bleibt; Kaufen und Anlegen ist ein Command.

### Story 16.18: Waffenkammer im Bergfried

Als Spieler
möchte ich meine Relikte und Signaturwaffen in der Burg ausgestellt sehen,
damit meine Trophäen einen Ort haben.

**Akzeptanzkriterien:**

**Angenommen** Story 16.8 und 16.14, GDD Heimat, Art Direction §7 und EXPERIENCE „Waffenkammer (Bergfried)“
**Wenn** über dem Bergfried ein eigener Stein ohne Stufen erscheint, sobald das erste Relikt oder die erste Signatur im Besitz ist, und in der Raumliste eine letzte Kachel ohne Stufenpunkte steht
**Dann** öffnet er das Gewölbe als 3D-Vollbild mit Zurück-Stein und Kopfpille (Zahl der Stücke), Ständern auf einer Drehscheibe (Wischen dreht, das vordere Stück im Licht) und langsam drehenden Stücken mit Runenleuchten
**Und** die Kammer ist ein Spiegel: Getragenes steht als heller Umriss mit dem Kopf der Trägerin; leere Ständer zeigen verborgene Relikte mit Schloss und Signaturen in Reichweite mit Stand („Ulvric 2 von 4“); Beinamen-Waffen und Ausrüstung Gefallener kommen nicht hinein
**Und** Tippen auf Stück oder Namensschild öffnet die Waffenansicht; außen am Bergfried hängt je Stück ein Banner in Runenfarbe (ohne Rune gold); keine Funktion, keine Spielwerte, kein Dock-Knopf.

### Story 16.19: Handbuch, Leistung und Abnahme

Als Spieler
möchte ich die neuen Regeln im Handbuch finden und alles flüssig auf dem Handy erleben,
damit das Epic vor dem Release rund ist.

**Akzeptanzkriterien:**

**Angenommen** Stories 16.1–16.18
**Wenn** das Handbuch Einträge zu Straße ½, Schild-Runen, Waffen-Chronik, Gelände-Linse und Element-Band hat (Werte aus den Daten, Kontext-„?“ an Linse, Feldkarte und Element-Band) und das Paket-Budget, die Ladezeit der 3D-Ansichten und die Bildrate auf dem Referenzgerät gemessen sind
**Dann** liegen alle Messwerte in den Budgets aus NFR1 und `check-bundle-size.mjs`, und der Produktinhaber hat Akt 1 auf dem Handy mit allen Neuerungen durchgespielt
**Und** Auffälligkeiten aus dem Durchlauf sind behoben oder als eigene Story eingetragen; danach ist Story 9.14 frei.

**Nachträge aus dem Review vom 2026-11-27 (Produktinhaber: Teil von 16.19):**

- Lanzen- und Stabende schweben etwa 0,1 über dem Boden: Griffpunkt tiefer setzen, sodass das Schaftende den Boden berührt (16.10).
- Miras Bogen liegt in der Ruhe hinter dem Bein (16.10).
- Bildrate der Kampfhaltung bei Auswahl messen (16.10 AK 5), zusammen mit den übrigen Messungen dieser Story.
- Fehlende Vorlagen und Vorschauen von 16.7 nachziehen: Blaupausen für Bogen, Dolch, Stab, Buch, Laute und Fokus sowie `<gruppe>_v2_preview.png` in `art/mockups/weapons-2026-11/`, als Grundlage der Abnahme je Waffengruppe.

### Story 16.20: Brett unter Drosselung flüssig halten (aus 16.19)

Als Spieler auf einem schwächeren Handy
möchte ich, dass das Brett mit Kampfhaltung bei Auswahl und im Leerlauf flüssig bleibt,
damit die Neuerungen aus Epic 16 nicht ruckeln.

Angelegt am 2026-11-27 aus der Messung von 16.19 (Desktop-Ersatz nach NFR1, Intel UHD 630, Profil pixel6a, zweimal gemessen): Kampfhaltung bei Auswahl 55 statt 60 FPS bei 2×, 24–32 statt 30 FPS bei 4× mit Frames bis 151 ms; Brett im Leerlauf bei 4× Frames von 130–137 ms. Die Messung auf dem Referenzgerät (Produktinhaber, 16.19) entscheidet, ob die Story vor 9.14 nötig ist.

**Akzeptanzkriterien:**

**Angenommen** `PERF_GPU=1 PERF_VIEWS=1 PERF_STAGES=1,2,4 pnpm perf --project=pixel6a` (Zeilen „Brett Leerlauf“ und „Brett Kampfhaltung“)
**Wenn** die Kosten von Kampfhaltung (Clip-Wechsel, Leuchten) und Leerlauf-Bild gesenkt sind (Werte in `render.yaml`, keine Regeländerung)
**Dann** erreicht das Brett mit Kampfhaltung 60 FPS bei 2× und 30 FPS bei 4×, und kein Frame liegt über 100 ms (NFR1)
**Und** die übrigen Perf-Zeilen (Gegnerphase, große Karten, Burg, 3D-Ansichten) werden nicht schlechter.

