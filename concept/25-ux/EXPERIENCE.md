---
title: 'EXPERIENCE.md – Hollow Crown, Staffel 1'
status: final
created: 2026-10-23
updated: 2026-10-30
form_factor: Handy-Browser im Hochformat (PWA), dazu Tablet und PC-Browser mit Maus; später Capacitor
sources:
  - concept/20-game-brief/brief.md
  - concept/21-gdd/gdd.md
  - concept/22-narrative/narrative.md
  - concept/23-art-direction/art-direction.md
  - concept/24-architecture/architecture.md
  - concept/09-ux-mobile.md
decisions: concept/25-ux/.decision-log.md
design: concept/25-ux/DESIGN.md
supersedes: concept/09-ux-mobile.md §4–§5 (Wireframes, Bildschirmliste) und U20 (Kriegslager-Hub); §1, §3, §6, §7 von 09 gelten weiter, soweit hier nicht geändert
---

# EXPERIENCE.md – Hollow Crown, Staffel 1

> Wie die Oberfläche funktioniert. Aussehen und Tokens stehen in `DESIGN.md` und werden hier als `{pfad.zum.token}` referenziert. Mockups in `mockups/` illustrieren; bei Widerspruch gilt dieses Dokument.

## Foundation

- **Plattform:** Handy-Browser im Hochformat zuerst, einhändig spielbar; Tablet und PC mit Maus als Pflicht (T12). Später Capacitor mit denselben Screens.
- **Technik:** HTML/CSS-Overlay in Preact über einem Babylon-Canvas (`concept/24-architecture/architecture.md` §5.12). Die UI liest den Zustand und schickt Commands; Regeln stehen nie in der UI.
- **Randbedingungen aus dem Brief:** daumenfreundlich, ein Zug in höchstens 3 Taps je Einheit, Speichern nach jeder Aktion, jede Heimat-Interaktion in höchstens 2 Taps.
- **Visuelle Identität:** `DESIGN.md` (Richtung B „Spielzeug-Diorama“).

## Information Architecture

| Fläche | Erreicht über | Zweck | Mockup |
|---|---|---|---|
| Titel | App-Start | Fortsetzen, Kampagnen, Optionen | `mockups/07-start-kampagnen.html` |
| Kampagnen | Titel | bis zu 3 Kampagnen, Speicherplätze, Neue Kampagne, Import/Export, PoC-Stand exportieren | `mockups/07-start-kampagnen.html` |
| Neue Kampagne | Kampagnen, freier Platz | Name, Aussehen und Pronomen, Schwierigkeit, Tod-Modus | `mockups/07-start-kampagnen.html` |
| **Weltkarte (Hub)** | Fortsetzen, nach jeder Mission, Leiste | Knoten wählen, Tagespaket sehen, Akt-Fortschritt | `mockups/03-weltkarte.html` |
| Knoten-Karte | Tap auf Knoten | Mission prüfen, Aufstellung, Aufbrechen | `mockups/03-weltkarte.html` |
| Heimat (Lager/Burg) | Leiste, Heimat-Knoten | Räume, Ausbau, Gefährten sichtbar | `mockups/04-heimat.html` |
| Raum-Panel | Raumstein oder Gebäude | eine Raumfunktion, Ausbau | `mockups/04-heimat.html` |
| Gedächtnishalle | Raumstein | Gedenksteine, Lektion vererben | `mockups/04-heimat.html` |
| Truppe | Leiste | Übersicht, Filter, Marken | `mockups/06-truppe.html` |
| Figur | Truppe, Einheitenkarte (Langdruck) | Werte, Ausrüstung, Skills, Supports, Aufstieg | `mockups/06-truppe.html` |
| Ausrüsten | Platz der Figur | passende Items mit Vergleich | `mockups/06-truppe.html` |
| Händler, Konvoi, Verzauberer, Akademie, Werkstatt | Raumstein | gleiche Listen-Muster wie Ausrüsten | `mockups/06-truppe.html` |
| Steckbriefe | Leiste | alle Leutnants mit Groll, Ziel, Begegnungen | `mockups/02-kampf.html` (Einzelansicht) |
| Chronik | Leiste | Entscheidungen, Folgen, Chronik-Seiten | – (spine-only) |
| Aufstellung | Knoten-Karte („Aufstellung“, von selbst bei Truppe > Plätze) | Einsatzplätze besetzen, Pflicht-Figuren gesperrt, Ausrüsten über die Tasche | `mockups/09-aufstellung.html` |
| Kampf | Aufbrechen | Brett, HUD, Vorschau, Gegnerphase | `mockups/02-kampf.html` |
| Szene | vor/nach Missionen, Trigger, Lagerfeuer | Dialog, Entscheidung, Folgen | `mockups/05-szenen.html` |
| Ergebnis | Missionsende | Beute, Kopfgeld, Nebenziele, EP, Gefallene | `mockups/08-ergebnis-abschied.html` |
| Abschied | Ergebnis, je Gefallenem | Tod erzählerisch tragen | `mockups/08-ergebnis-abschied.html` |
| Epilog-Mosaik | Staffelfinale | Kacheln je Gefährte und Region | `mockups/08-ergebnis-abschied.html` |
| Optionen | Titel, Menü | Sprache, Tempo, Qualität, Lautstärke, Bildschirmwackeln, Figuren 3D/2D; Block **Brett-Anzeige**: Raster, Lebensleisten, Zahlen in der Gefahrenzone, Gegner-Leiste, Gefahrenzone standardmäßig | – (Bestand 09 §5; Block Brett-Anzeige `mockups/10-lesbarkeit-handbuch.html`) |
| Handbuch | Menü im Kampf, Menü auf der Weltkarte, Titel | Spielregeln nachschlagen: Kategorien als Steine, Suche, Einträge mit Grafik, Werten aus den Daten und Querverweisen | `mockups/10-lesbarkeit-handbuch.html` |
| Handbuch-Eintrag | Handbuch, Kontext-„?“ im Kampf | ein Eintrag als Overlay-Blatt, ohne den Kampf zu verlassen | `mockups/10-lesbarkeit-handbuch.html` |

**Navigation:** Die Weltkarte ist der Hub. Die Leiste unten hat vier Steine: Heimat (auf der Heimat: Weltkarte), Truppe, Steckbriefe, Chronik. Das Menü (rund, oben rechts) enthält Speichern (nicht in Klassik), Optionen, Handbuch und Titel; im Kampf steht das Handbuch an zweiter Stelle direkt unter Optionen. Vollbild-Ansichten haben oben links einen runden Zurück-Stein. Nichts liegt tiefer als zwei Ebenen unter dem Hub.

## Voice and Tone

Mikrotext; die Markenhaltung steht in `DESIGN.md` (Brand & Style).

| Do | Don't |
|---|---|
| „Aufbrechen“, „Aufwerten auf +3“, „Wurfspieß anlegen“ (Verb + Ziel) | „OK“, „Bestätigen“ |
| „Verblutet nach 2 eigenen Phasen“ | „Achtung, kritischer Zustand!“ |
| „Mira verlässt die Truppe“ | „Mitglied entfernt“ |
| „Bleibt offen; erst die 7. Heimsuchung verdrängt die älteste.“ | „Läuft bald ab!“ (kein Täglich-Druck) |
| „Wird noch geladen …“ | „Fehler: Ressource nicht verfügbar“ |
| „Abschied nehmen“ | „Weiter“ nach einem Tod |
| Spielbegriffe aus dem Glossar (`14-glossary.md`): Leutnant, Groll, Heimsuchung, Glutfunke | Technik-Begriffe (Paket, Slot, Node) im Spiel |

Beträge immer als Symbol + Zahl (`{components.currency}`), auch in Sätzen.

## Component Patterns

| Komponente | Verhalten |
|---|---|
| Haupttaste | eine je Ansicht; nennt Ziel und ggf. Preis; gesperrt grau mit Grund darunter |
| Dock-Aktion | vier feste Plätze: Angriff, Klassen-Aktion, Item, Warten. Nicht mögliche Aktionen gedimmt, nie versteckt |
| Klassen-Aktion | fester Platz neben Angriff; Zähler zeigt Restnutzungen (1×/Karte); Tipp öffnet die Zielauswahl mit Vorschau wie beim Angriff. Passive Rollen (Vorkämpfer: Halten, Plänkler: Nachsetzen): Rollen-Symbol als Zustand (bereit/aktiv), nicht auslösbar, Tipp erklärt die Regel mit Vorschau |
| Kontext-Band | erscheint über der Einheitenkarte, sobald Bergen, Ansprechen, Besuchen oder Öffnen auf dem Zielfeld möglich ist; ein Tipp führt die Aktion aus; das Dock bleibt unverändert |
| Leerlauf-Dock | Gefahr (Umschalter), Nächste (nächste bereite Einheit), Phase beenden (zeigt bereite Einheiten, fragt nach, solange welche bereit sind) |
| Kampfvorschau | öffnet beim Tipp auf ein Ziel; zweiter Tipp auf dasselbe Ziel oder „Angreifen“ bestätigt; zeigt „flieht“ statt 0 TP bei Leutnants; der Teil der Lebensleiste des Ziels, den der Angriff nimmt, blinkt; Werte tragen ein Kontext-„?“ |
| Raster | Eckpunkte (kleine Kreuze an den Feldecken) liegen dezent über dem ganzen Brett; Option „Raster: aus / dezent / stark“, stark = feine Linien überall; Standard dezent |
| Bewegungsbereich | bei gewählter Einheit Einzelkacheln mit kleiner Lücke und einer gemeinsamen Außenkante, Angriffsfelder ebenso in Rot; der gesetzte Weg als dicker, runder Pfeil mit Spitze am Ziel |
| Lebensleiste | über dem Kopf jeder Figur auf dem Brett; Option „Lebensleisten: Immer / Nur verletzte / Aus“, Standard „Immer“; bleibt in der Gegnerphase sichtbar und folgt jedem Treffer |
| Gefahrenzone | Umschalter „Gefahr“ (Leerlauf-Dock, PC: D): durchscheinende Fläche in drei Stufen (1 / 2 / 3+ Gegner) mit roter Außenkante, Zahl der Angreifer auf Feldern ab 2 (Option „Zahlen in der Gefahrenzone“, Standard an). Wache und Halten rechnen ohne Bewegung; schlafende Gegner zählen nicht, ihre Zone steht als gestrichelte Kante da. Langdruck auf einen Gegner zeigt nur seine Zone als Kante |
| Zielfeld-Check | sobald ein Zielfeld gesetzt ist (Geist-Figur) bzw. am PC beim Hover: gestrichelte Linien von jedem Gegner, der das Feld in seiner nächsten Phase erreicht, eine Pille „n Gegner erreichen dieses Feld“ (0: keine Pille) und der Gelände-Chip des Felds (Name, Verteidigung, Ausweichen, Heilung, Symbol + Zahl); zählt nach denselben Regeln wie die Gefahrenzone |
| Kill-Marker | bei gewählter Einheit über jedem Gegner, den sie in dieser Phase erreichen kann: voller Totenkopf = fällt bei einem Treffer (inklusive Doppelangriff), halber = nur mit Krit; Leutnants zeigen statt Totenkopf die Flucht-Marke; gerechnet mit dem Formelcode der Vorschau |
| Warnung eigene Figur | in der Spielerphase grauer Totenkopf mit „!“ über eigenen Figuren, deren TP der Schaden aller Gegner, die sie erreichen, bei Treffer erreicht (ohne Krit und Trefferchance) |
| Gegnerphase-Rückblick | Stein über der Einheitenkarte direkt nach der Gegnerphase, nur wenn etwas geschah: Niedergestreckte und Gefallene zuerst (mit Verblutungs-Zähler und „Figur zeigen“), dann Treffer auf eigene Figuren (TP vorher → nachher, Verfehlt als „weicht aus“), dann Verstärkungen und geweckte Gegner mit Sprung zur Stelle; der erste Tipp aufs Brett schließt ihn, nie blockierend |
| Gegner-Leiste | Option (Standard aus): Medaillons aller sichtbaren Gegner mit TP-Ring unter den Ziel-Pillen, Leutnant mit Goldring; Tipp zentriert den Gegner, Langdruck öffnet seine Info |
| Fertig-Häkchen | grünes Häkchen über Figuren, die in dieser Phase gehandelt haben, zusätzlich zur Entsättigung |
| Zurück an der Figur | nach dem Setzen eines Zielfelds steht ein runder Zurück-Stein neben der Geist-Figur; PC: Rechtsklick nimmt die Bewegung zurück |
| Kontext-„?“ | runder Stein mit „?“ an Werten, die eine Regel tragen (Kampfvorschau, Gelände-Chip, Zustands-Symbole, Lektionen); Tipp öffnet den passenden Handbuch-Eintrag als Blatt über dem Kampf |
| Handbuch | Kopf mit Zurück-Stein und Titelpille, Suchfeld, Kategorien als Steine im Zweier-Raster; Eintrag mit Grafik, Werten aus den Daten (nie abgetippt), einem Satz „wo im Spiel“ und Querverweisen als Chips; alle Einträge sind von Anfang an sichtbar (Entdecken folgt später) |
| Steckbrief | Langdruck auf einen Leutnant (Brett, Weltkarte, Steckbriefe); auf dem Brett zeigt derselbe Langdruck zugleich seine Gefahrenzone; schließt mit Zurück oder Tipp daneben |
| Sprechband | blockiert kurz (bis Tipp oder 2,5 s bei Auto), nie länger als 2 Zeilen; sitzt fest am Bildschirm, die Kamera bewegt sich nicht, der Sprecher muss nicht auf dem Brett stehen; Barks und Leutnant-Zeilen laufen ebenso, ohne Tipp und mit Brett-Tempo |
| Weltkarten-Knoten | Tipp zoomt leicht heran und öffnet die Knoten-Karte; Tipp daneben schließt |
| Raumstein | Tipp öffnet das Raum-Panel; Ausbau-Band erscheint nur, wenn Gefährte und Gold reichen; sonst nennt die Stufe, was fehlt |
| Item-Zeile | erster Tipp wählt und zeigt den Vergleich, Haupttaste führt aus; Unpassendes bleibt sichtbar, gedimmt, mit Grund; Info-Stein rechts oder Langdruck öffnet die Item-Details |
| Item-Details | Overlay-Blatt: Bild, Seltenheit, Typ, Beschreibung, jeder Wert mit vollem Namen und kurzer Erklärung, Wirkungen, gelehrte Fähigkeit (FP), Set, Runen, Preis; schließt mit Zurück, Esc oder Tipp daneben |
| Dialogbox | Tipp irgendwo führt weiter; Log, Auto, Überspringen oben rechts; bereits gesehene Szenen lassen sich ganz überspringen |
| Entscheidung | Marke „Entscheidung · hat Folgen“; erster Tipp markiert, zweiter bestätigt; Überspringen und Auto sind aus |
| Folgen-Karte | erscheint direkt nach der Wahl; eine Zeile je Wirkung; schreibt einen Eintrag in die Chronik |
| Abschieds-Karte | je Gefallenem nach dem Ergebnis; die ersten 2 s nicht überspringbar |
| Kampagnen-Zeile | Tipp lädt den Auto-Save; Speicherplätze einzeln ladbar (nicht in Klassik); Langdruck: Löschen mit Rückfrage |
| Fortschrittsring | nur sichtbar, solange ein Akt-Paket lädt; Tipp zeigt Größe und Hinweis „danach offline spielbar“ |
| Erster Start | lädt ohne Klick; Stein „Spiel wird vorbereitet · Größe · danach offline spielbar“ mit Fortschritt, danach Titel (Entscheidung 2026-10-24) |
| Ladebildschirm | vor einer Mission oder Szene, deren Bilder oder Modelle noch fehlen: Stein mit Missionsname, Ortsbild und Fortschritt; erscheint nicht, wenn alles im Cache liegt; nie Laden ohne Rückmeldung |

## State Patterns

| Fläche | Zustände |
|---|---|
| Kampf | Leerlauf · Einheit gewählt (Kill-Marker) · Bewegung gesetzt (zurücknehmbar bis zur Aktion, Zielfeld-Check) · Ziel gewählt (Vorschau, Schaden in der Lebensleiste) · Gegnerphase (Tempo 1×/2×/Überspringen) · Rückblick nach der Gegnerphase · Lektion (max. 1 je Runde, 3 Zeilen) · Niederlage (Gründe + Neustart je Tod-Modus) |
| Einheit | bereit · in Gefahr (Warn-Totenkopf) · erschöpft (entsättigt, Ring gestrichelt, Häkchen) · kritisch (Lebensleiste unter 25 % mit pulsierendem Glutrand) · niedergestreckt (grau, Puls, Verblutungs-Zähler) · geflohen (Leutnant, Wimpel fällt) · tot |
| Weltkarte | normal · neuer Tag (Hinweis mit Zahl der Heimsuchungen) · Paket lädt · Akt beendet, nächster nicht veröffentlicht („erscheint bald“ im Nebel) · offline mit fehlendem Paket (Knoten sichtbar, „Wird geladen, sobald du online bist“) |
| Heimat | Lager (Akt 1 bis Mission 1-6, sechs Stationen) · Burg (ab 1-6: sechs Räume auf Stufe 1 und Gedächtnishalle; ab Akt 2 elf Räume) · Raum gesperrt · ausbaubar · Neues vorhanden |
| Szene | Zeile · Sprecher fehlt (Ersatzsprecher, ggf. Gedenkzeile) · Entscheidung · Folgen · Log |
| Kampagnen | leer (nur „Neue Kampagne“) · 1–3 belegt · voll (Neue Kampagne verlangt Löschen) · PoC-Stand vorhanden · Import fehlerhaft (Grund in einem Satz) |
| Speichern | gespeichert (still) · fehlgeschlagen (Banner, nächster Versuch beim nächsten Commit, Export anbieten) · Speicherschutz fehlt (Hinweis „Zum Home-Bildschirm“, einmal) |
| Fehler im Kern | „Etwas ist schiefgelaufen“, Fehlerbericht exportieren, letzter Auto-Save (Architektur AR22) |
| Fehler melden | jederzeit über Optionen → „Fehler melden“: Sheet mit Textfeld „Was ist passiert?“, Zahl der aufgezeichneten Aktionen, „Bericht exportieren“ (Touch: Teilen-Dialog, sonst Download), „Protokoll leeren“ (Architektur AR24, §6.2a) |

## Interaction Primitives

| Eingabe | Wirkung |
|---|---|
| Tipp | wählen, bestätigen, weiter |
| Doppeltipp auf eine Figur | Kamera zentriert die Figur |
| Zweiter Tipp auf dasselbe Ziel | bestätigen (Bewegung, Angriff, Antwort) |
| Langdruck ≥ 400 ms | Info: Steckbrief, Figur, Gefahrenzone eines Gegners, Item-Details |
| Pinch, Mausrad | Zoomstufe wechseln (3 auf dem Brett plus eine vierte „ganze Karte“ beim Herauspinchen über die weiteste Stufe; 2 auf der Weltkarte) |
| Ziehen | Kamera verschieben |
| Wischen | nächste Figur, nächste Epilog-Kachel, nächstes Kontext-Band (Punkte-Anzeige darunter) |
| PC | Linksklick = Tipp, Rechtsklick/Esc = zurück, Hover = Info, Hover über ein Zielfeld = Zielfeld-Check, Leertaste = nächste Einheit, E = Phase beenden, D = Gefahrenzone, M = ganze Karte, F = vorderes Kontext-Band ausführen, Pfeiltasten = zwischen Kontext-Bändern |
| Zurück | jede Ansicht hat einen Zurück-Stein; Abbrechen ist nie ein Verlust (außer nach bestätigter Aktion) |

## HUD & Diegetic UI

- **Nicht diegetisch** (Overlay): Rundenpille, Ziel-Pillen, Gegner-Leiste, Zielfeld-Pille, Gegnerphase-Rückblick, Einheitenkarte, Dock, Leiste, Panels.
- **Diegetisch** (in der 3D-Welt): Bodenringe in Teamfarbe, Groll-Wimpel, Verblutungs-Zähler, Lebensleisten, Kill- und Warn-Marker und Fertig-Häkchen über der Figur, Raster-Eckpunkte, Bereichskacheln, Weg-Pfeil und Markierungen auf Feldhöhe, Ausbauteile und Gefährten-Gegenstände in der Burg. Der Nebel der Weltkarte ist ein Verlauf über dem Bild, nicht diegetisch in 3D.
- **Rangfolge:** Teamfarbe und TP der gewählten Einheit, dann Ziel, dann alles andere. In der Gegnerphase verschwinden Dock und Einheitenkarte; Phasen-Pille und Tempo bleiben. In Szenen verschwindet das HUD ganz.
- Markierungen und UI werden nie vom Szenenlicht gefärbt (Art Direction §2.5).

## Input Schemes

- **Touch (primär):** alles mit einem Daumen in der unteren Bildschirmhälfte; tippbare Ziele mindestens `{spacing.touch-min}`.
- **Maus und Tastatur (Pflicht am PC):** Hover zeigt, was ein Langdruck zeigt; Tastenkürzel siehe Interaction Primitives.
- **Gamepad:** nicht in V1.
- Kein Zeitlimit für Eingaben.

## Game Feel & Juice

- Steine geben beim Drücken 3 px nach (Unterkante wird dünner) und klicken leise (UI-Kanal, U19).
- Treffer, Krit, Cut-ins, Leutnant-Flucht, Stufenaufstieg: Effekte laut Art Direction §8, Angriff ≤ 600 ms bei 1×.
- Glutfunke beim Aufstieg: kurzer Funkenmoment mit Funkenknistern.
- Abschied und Gedächtnishalle: keine Bewegung außer einem langsamen Ausblenden, Glockenschlag beim Tod.
- Bildschirmwackeln nur bei Krit, Tod und Drachenauftritt, abschaltbar; Haptik bei Krit und Tod, abschaltbar (09 §6).

## Accessibility Floor

Barrierefreiheit im Sinne von Farbenblind-Modus, Schriftgröße und Linkshänder-Layout bleibt nach V1 (T12). In V1 gilt trotzdem:

- Nichts nur über Farbe: Teams auch über Form (Ring, Wimpel, Seite), Vergleich auch über +/−, Knoten auch über Symbol, Gefahrenstufen auch über Zahl und Kante, Kill-Marker über Form (voll/halb), kritische TP über Rand und Puls.
- Kontraste laut `DESIGN.md` (Colors).
- Tippziele ≥ 44 pt, alles mit einer Hand und mit Maus bedienbar.
- Untertitel für vertonte Zeilen immer an (Narrative, Localization).
- Bildschirmwackeln und Haptik abschaltbar; `prefers-reduced-motion` schaltet Wackeln und Hüpfen ab, Puls und Blinken (kritische Lebensleiste, Schadensvorschau) werden zu einem festen Rand bzw. einer Schraffur.

## Responsive & Platform

| Breite | Verhalten |
|---|---|
| < 600 px (Handy hoch) | Layout dieses Dokuments |
| 600–1023 px (Tablet, Handy quer) | Brett bzw. Szene links, Panels und Karten als Seitenleiste rechts (320 px); Leiste bleibt unten |
| ≥ 1024 px (PC) | Brett mittig; Einheitenkarte und Vorschau rechts, Truppe/Steckbriefe als Panel links; Hover-Infos |

Safe Areas (Notch, Home-Indikator) gelten für alle Ränder (U22). Die Anordnung der vier Leisten- und Dock-Plätze bleibt auf allen Breiten gleich.

## Inspiration & Anti-patterns

- **Vorbild:** Stil-Mockup Round-Chibi (Leitreferenz), Kingdom Rush und Mario + Rabbids (runde Spielstein-UI), Fire Emblem Engage (Lesbarkeit der Vorschau), Triangle Strategy (Weltkarte als Diorama).
- **Abgelehnt:** flacher Website-Look mit Haarlinien (U21 auf Spielflächen), dunkle Konsole (Richtung C), Marker nur im Diorama ohne Übersicht, Medaillon statt Halbfigur in Szenen, Ecken-Navigation ohne Leiste.
- **Vermeiden:** Ablaufdaten und Countdowns auf der Weltkarte (Täglich-Druck), Menüfriedhof in der Burg (mehr als 2 Taps), Gacha-artige Belohnungseffekte.

## Key Flows

> Protagonisten aus der Zielgruppe des Briefs, vom Produktinhaber bestätigt.

### Lena spielt Akt 1 in der S-Bahn

Lena (34) kennt Fire Emblem und spielt auf dem Weg zur Arbeit 20 Minuten, das Handy in einer Hand.

1. Sie öffnet die App; der Titel zeigt „Fortsetzen · Rhen · Akt 1 · vor Mission 1-2“. Ein Tipp bringt sie auf die Weltkarte.
2. Der Tages-Hinweis meldet zwei neue Heimsuchungen. Sie tippt auf den orangefarbenen Knoten „1-2 Erlbach“; die Karte nennt „Dorf verteidigen“, 6 Plätze und den Leutnant Hask, der bei 0 TP flieht.
3. „Aufbrechen“. Im Kampf wählt sie Brenna, tippt ein Feld und dann Hask: Die Vorschau zeigt „6 → 0 · flieht“.
4. Tobin ist niedergestreckt; über seiner Figur steht „2“. Sie zieht Liora daneben, das grüne Band bietet „Tobin bergen“ an, ein Tipp genügt.
5. **Höhepunkt:** Brenna trifft. Hask springt zurück, Rauchwölkchen, sein Wimpel fällt, und er ruft „Das merk ich mir, Brenna!“. Lena weiß sofort: Er kommt wieder, und er hat jetzt Groll auf Brenna.
6. Das Ergebnis zeigt Beute, Kopfgeld und EP je Figur mit Symbolen. Die Szene danach bietet die Wahl, ob Mira heimkehrt; die Folgen-Karte sagt genau, was passiert. Die S-Bahn hält, sie schließt die App. Gespeichert war schon nach dem letzten Tipp.

**Fehlerweg:** Kael fällt → Niederlage mit Grund; in Standard „Runde neu“ oder „Mission neu“, beides setzt auch Tote zurück.

### Jonas verliert in Klassik einen Gefährten

Jonas (41) spielt Battle Brothers und hat bewusst Klassik gewählt.

1. In Mission 1-4 steht Fenn ungedeckt; ein Krit trifft ihn. Klassik kennt kein Niederstrecken, Fenn ist sofort tot.
2. Es gibt keine Taste „Runde neu“, das Menü bietet nur Optionen und Titel.
3. Nach dem Sieg zeigt das Ergebnis Fenn grau zwischen den anderen. „Weiter“ führt nicht zur Weltkarte, sondern zum Abschied.
4. **Höhepunkt:** Alles ist entsättigt, nur eine Glutlinie leuchtet. Fenns letzte Zeile steht da, darunter „Mira trauert · 3 Missionen −10 Treffer“. Zwei Sekunden lang lässt sich nichts überspringen. Jonas tippt „Abschied nehmen“.
5. In der Burg steht später Fenns Gedenkstein in der Gedächtnishalle. Einmal im Akt kann Jonas Fenns Lektion an Tobin weitergeben.

### Mara schaut morgens nach Heimsuchungen

Mara (28) spielt Standard und hat Akt 1 durch, Akt 2 ist noch nicht erschienen.

1. Um 7:10 öffnet sie die App. Der Tageswechsel war um 4:00; der Hinweis meldet „Neuer Tag: 3 Heimsuchungen“.
2. Ein roter Knoten zeigt Morras Gesicht mit „NEU“. Die Karte sagt: Truhenjagd, Groll 2 gegen Mira, Kopfgeld ● 600, bleibt offen.
3. Sie spielt sie in 15 Minuten; das Ergebnis zeigt ● +400 Gold, eine Eisenerz-Raute und 60 % EP.
4. **Höhepunkt:** Über der Eisenmark liegt Nebel mit „Akt 2 ‚Glut‘ erscheint bald“, aber die Burg hat einen grünen Pfeil: In der Taverne wartet ein neues Söldner-Angebot. Sie hat einen Grund, morgen wiederzukommen, und keinen Zwang. (Die Burg ist seit 1-6 Heimat; ihre Räume lassen sich erst ab Akt 2 ausbauen.)

## Offene Punkte

- **Burg in 3D:** Der obere Teil der Heimat (Diorama, Raum-Anker, Ausbauteile) wird neu geprüft, sobald die 3D-Burg steht; Raumsteine, Panels und ≤ 2 Taps bleiben.
- **Item-Bilder:** In den Mockups stehen Platzhalter; die gemalten Bilder entstehen per ChatGPT (Art Direction §11).
- **Chronik, Optionen, Steckbrief-Liste:** spine-only; Mockups bei Bedarf in der Umsetzung.
- **Logo:** im Titel-Mockup nur angedeutet; Auswahl zwischen den Kandidaten aus Art Direction §5.5.
- **Umsetzung:** `src/ui/styles.css` (U21) wird in Story 1.1 auf die Tokens aus `DESIGN.md` umgestellt.
