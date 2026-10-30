---
name: Hollow Crown – Staffel 1
description: Spielzeug-Diorama-UI für ein Taktik-RPG im Hochformat; runde Spielsteine mit Chibi-Kontur über einer hellen 3D-Welt.
status: final
created: 2026-10-23
updated: 2026-10-30
sources:
  - concept/20-game-brief/brief.md
  - concept/21-gdd/gdd.md
  - concept/22-narrative/narrative.md
  - concept/23-art-direction/art-direction.md
  - concept/24-architecture/architecture.md
decisions: concept/25-ux/.decision-log.md
supersedes: U21 (UI-Stil „B hell – Wappen & Banner“) für alle Spielflächen; Teamfarben und Glutorange bleiben
colors:
  cream: '#FFF8EC'
  cream-2: '#F4E9D6'
  line: '#3B2A20'
  soft: '#7A6553'
  ember: '#E8743B'
  ember-dark: '#B44C18'
  team-player: '#2F64C8'
  team-player-soft: '#E7EFFF'
  team-enemy: '#B83A2E'
  team-enemy-soft: '#FDEEE9'
  team-other: '#3FA65A'
  downed: '#8A8D96'
  gold: '#D9A931'
  lieutenant: '#8A6A10'
  positive: '#2F8A4C'
  positive-soft: '#E9F6EC'
  negative: '#B83A2E'
  offer-soft: '#FFF1D6'
  selection-soft: '#FDF0E3'
  mourn: '#F3EFE8'
  mourn-quiet: '#E9E6E1'
  fog: '#E0E5EF'
  material-ore: '#8B9BB0'
  rarity-common: '#9A9488'
  rarity-rare: '#1F9E94'
  rarity-epic: '#7A4CC2'
  rarity-legendary: '#D9A931'
  rarity-relic: '#D9A931'
  rarity-relic-accent: '#E8743B'
  element-fire: '#F2603A'
  element-wind: '#7BD389'
  element-earth: '#B9874B'
  element-water: '#4AA8E8'
  element-light: '#F7D96B'
  element-dark: '#8E5BD9'
  device-frame: '#101014'
typography:
  name:
    fontFamily: 'Fraunces, Georgia, serif'
    fontWeight: 700
    fontSize: 24px
    lineHeight: 1
  name-small:
    fontFamily: 'Fraunces, Georgia, serif'
    fontWeight: 700
    fontSize: 16px
    lineHeight: 1.1
  body:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontWeight: 600
    fontSize: 14px
    lineHeight: 1.35
  dialogue:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontWeight: 600
    fontSize: 17px
    lineHeight: 1.38
  label:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontWeight: 700
    fontSize: 13px
    lineHeight: 1.1
  caps:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontWeight: 700
    fontSize: 11px
    letterSpacing: 0.1em
  number:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontWeight: 700
    fontSize: 15px
    note: 'font-variant-numeric: tabular-nums'
  quote:
    fontFamily: 'Fraunces, Georgia, serif'
    fontWeight: 600
    fontSize: 16px
    note: kursiv
rounded:
  piece: 18px
  action: 16px
  stone: 16px
  card-inner: 12px
  chip: 12px
  pill: 9999px
spacing:
  hud-edge: 10px
  hud-top: 12px
  gap: 8px
  gap-tight: 6px
  piece-padding: 12px
  touch-min: 44px
  outline: 2.5px
  outline-small: 2px
  press-depth: 4px
components:
  piece:
    background: '{colors.cream}'
    border: '{spacing.outline} solid {colors.line}'
    rounded: '{rounded.piece}'
    shadow: '0 {spacing.press-depth} 0 {colors.line}, 0 10px 20px rgba(40,28,20,.28)'
  button-primary:
    background: '{colors.ember}'
    text: '#FFFFFF'
    rounded: '{rounded.pill}'
    shadow: '0 4px 0 {colors.ember-dark}, 0 4px 0 2px {colors.line}'
    typography: '{typography.label}'
  button-secondary:
    background: '{colors.cream}'
    rounded: '{rounded.pill}'
    shadow: '0 4px 0 {colors.line}'
  button-quiet:
    background: '{colors.mourn-quiet}'
    rounded: '{rounded.pill}'
  dock-action:
    background: '{colors.cream}'
    rounded: '{rounded.action}'
    icon: 26px
    typography: '{typography.label}'
  class-action:
    extends: dock-action
    background: '{colors.team-player-soft}'
    counter: '{colors.ember}'
  context-band:
    background: '{colors.positive-soft}'
    action: '{colors.positive}'
    rounded: '{rounded.pill}'
  medallion:
    size: 78px
    border: '{spacing.outline} solid {colors.line}'
    hp-ring: 'conic-gradient in Teamfarbe'
    lieutenant-ring: '3px {colors.gold} + 2px {colors.line}'
  nametag:
    background: '{colors.ember}'
    text: '#FFFFFF'
    typography: '{typography.name-small}'
    rounded: '{rounded.pill}'
  phase-pill:
    player: '{colors.ember}'
    enemy: '{colors.team-enemy}'
  map-node:
    story: '{colors.ember}'
    side: '{colors.team-other}'
    haunt: '{colors.team-enemy}'
    home: '{colors.cream}'
    done: '{colors.cream-2}'
  room-stone:
    background: '{colors.cream-2}'
    rounded: '{rounded.stone}'
    size: 50px
  currency:
    gold: 'gemaltes Item-Bild (art/items/gold.png)'
    ore: 'gemaltes Item-Bild (art/items/iron_ore.png)'
    exp: 'gemaltes Item-Bild (art/items/exp.png)'
    ember-spark: 'gemaltes Item-Bild (art/items/ember_spark.png)'
    typography: '{typography.number}'
  consequence-card:
    marker: 'schwarze Pille {colors.line} mit Glutraute'
  mourn-card:
    background: '{colors.mourn}'
    accent: '{colors.ember}'
  item-image:
    size: 44px
    rounded: '{rounded.chip}'
    source: 'gemaltes Bild (ChatGPT), Stil der Porträts'
  hp-bar:
    background: '{colors.cream}'
    fill: 'Teamfarbe ({colors.team-player} / {colors.team-enemy} / {colors.team-other})'
    border: '{spacing.outline-small} solid {colors.line}; Leutnant {colors.gold}'
    tick: '{colors.cream}, je 5 TP; ab 40 max. TP je 10 (render.yaml)'
    critical: 'Rand {colors.ember}, pulsierend, unter 25 % (render.yaml)'
  grid-mark:
    color: '{colors.cream}'
    note: 'Kreuz an jeder Feldecke, Deckkraft je Stufe aus render.yaml'
  range-tile:
    move: '{colors.team-player}, Einzelkachel mit Lücke, Außenkante'
    attack: '{colors.team-enemy}'
  threat:
    fill: '{colors.team-enemy}, drei Deckkraft-Stufen'
    edge: '{colors.team-enemy} über {colors.cream}'
    sleeping: 'gestrichelte Kante'
    reach: 'Gegner, die das Zielfeld erreichen, leuchten rötlich (render.yaml legibility.reach)'
  kill-marker:
    background: '{colors.line}'
    symbol: 'Totenkopf {colors.cream}; halb = halbe Füllung'
    warn: 'Totenkopf {colors.downed} mit „!“ über eigenen Figuren'
  help-stone:
    background: '{colors.cream-2}'
    border: '{spacing.outline-small} solid {colors.line}'
    text: '{colors.line}'
    note: 'Kontext-„?“; kein Blau, weil Blau Team ist'
---

# DESIGN.md – Hollow Crown, Staffel 1

> Visuelle Identität der Oberfläche. Verhalten steht in `EXPERIENCE.md`, die Spielwelt (Brett, Figuren, Licht) in `concept/23-art-direction/art-direction.md`. Herleitungen in `.decision-log.md`. Die Mockups in `mockups/` illustrieren; bei Widerspruch gilt dieses Dokument.

## Brand & Style

**Die Oberfläche ist Spielzeug aus derselben Kiste wie die Welt.** Jedes Bedienelement ist ein runder Spielstein mit dunkelbrauner Kontur und einer dicken Unterkante, als läge er auf dem Diorama und ließe sich drücken. Die Kontur ist dieselbe wie bei Figuren und Porträts, deshalb gehören UI und Welt zusammen und die Oberfläche wirkt nicht wie eine Website über dem Spiel (Grund für die Ablösung von U21).

Warm, freundlich, klar lesbar. Ernste Momente (Abschied, Gedächtnishalle, Gedenken) nehmen die Farbe heraus und lassen nur das Glutorange stehen: weniger Spielzeug, mehr Stille.

Referenz ist das Stil-Mockup `art/mockups/style-2026-10/round_chibi_kael.png`. Visuelle Grundrichtung: `mockups/01-ui-richtungen.html` (Richtung B).

## Colors

| Rolle | Token | Wert | Wofür | Nie für |
|---|---|---|---|---|
| Grundfläche | `{colors.cream}` | `#FFF8EC` | alle Steine, Panels, Dialogbox | Text |
| Tonfläche | `{colors.cream-2}` | `#F4E9D6` | Wertefelder, Chips, Raumsteine, leere Plätze | Haupttasten |
| Kontur und Text | `{colors.line}` | `#3B2A20` | Konturen, Unterkanten, Haupttext, Marke „hat Folgen“ | Flächen größer als Pillen |
| Nebentext | `{colors.soft}` | `#7A6553` | Untertitel, Labels, Einheiten | Zahlen, die zählen |
| Glutorange | `{colors.ember}` | `#E8743B` | genau eine Haupttaste je Ansicht, Story-Knoten, Namensschild, Runden-Badge, Glutlinie im Gedenken; einzige Ausnahme auf dem Brett: Rand der kritischen Lebensleiste | Teamkennung, sonstige Markierungen auf dem Brett, Warnungen |
| Glut dunkel | `{colors.ember-dark}` | `#B44C18` | Unterkante der Haupttaste, Hervorhebung in Panels | Flächen |
| Team Spieler | `{colors.team-player}` | `#2F64C8` | TP-Ring, Phasen-Label, Bewegungsbereich | Seltenheit, Dekor |
| Team Gegner | `{colors.team-enemy}` | `#B83A2E` | TP-Ring Gegner, Gegnerphase, Heimsuchungs-Knoten, Leutnant-Wimpel | Fehler im UI |
| Dritte Partei | `{colors.team-other}` | `#3FA65A` | dritte Partei, Nebenquest-Knoten | Erfolgsmeldungen |
| Niedergestreckt | `{colors.downed}` | `#8A8D96` | Verblutungs-Marke, entsättigte Figur | |
| Gold | `{colors.gold}` | `#D9A931` | Münz-Symbol, Leutnant-Goldring, Groll-Kerben, Angebot des Tages | Text |
| Positiv | `{colors.positive}` | `#2F8A4C` | Werte-Plus, Kontext-Aktion, Ausbau möglich, EP-Stern, erfüllte Nebenziele | Teamkennung |
| Negativ | `{colors.negative}` | `#B83A2E` | Werte-Minus im Vergleich | |
| Nebel | `{colors.fog}` | `#E0E5EF` | gesperrte Regionen der Weltkarte | |
| Gedenken | `{colors.mourn}`, `{colors.mourn-quiet}` | `#F3EFE8`, `#E9E6E1` | Abschied, Gedächtnishalle, ruhige Taste | fröhliche Momente |
| Material | `{colors.material-ore}` | `#8B9BB0` | Eisenerz-Raute; weitere Materialien bekommen eigene Farbe + Form | |
| Seltenheit | `{colors.rarity-*}` | Steingrau `#9A9488`, Türkis `#1F9E94`, Violett `#7A4CC2`, Gold `#D9A931`; Relikt Gold mit Glutorange `#E8743B` | Rauten am Item (Gewöhnlich 0, Selten 1, Episch 2, Legendär 3), Relikt hohle Krone; gleiche Werte wie Art Direction §5.6 | Teamfarben, Blau |
| Elemente | `{colors.element-*}` | aus Art Direction §2.3 | Element-Symbole, Speedlines | UI-Rahmen |

**Kontrast:** `{colors.line}` auf `{colors.cream}` ≈ 13 : 1, `{colors.soft}` auf `{colors.cream}` ≈ 5 : 1, Weiß auf `{colors.ember}` ≈ 3 : 1 (nur für fette Labels ab 16 px). Teamfarben, Glutorange und Positiv/Negativ stehen nie allein: immer zusammen mit Form, Symbol oder Text.

**Ressourcen haben feste Symbole** (Entscheidung Produktinhaber): Gold = Münze, EP = grüner Stern, Glutfunke und jedes Material zeigen ihr gemaltes Item-Bild aus `art/items/` (`gold`, `exp`, `ember_spark`, Material-id) (Eisenerz, Mondstahl, Drachenschuppe, Arkanstaub …). Ein Material ohne Bild erscheint nicht im Spiel (`content:check`).

## Typography

| Rolle | Token | Einsatz |
|---|---|---|
| Namen und Titel | `{typography.name}` / `{typography.name-small}` | Figuren, Leutnants, Missionen, Räume, Panel-Titel. Fraunces ersetzt Grenze Gotisch (U21) und ist Logo-Kandidat (Art Direction §5.5) |
| Text | `{typography.body}` | Beschreibungen, Notizen, Folgen |
| Dialog | `{typography.dialogue}` | Dialogbox; max. 110 Zeichen je Box (Architektur §5.8) |
| Labels | `{typography.label}` | Tasten, Dock, Chips |
| Großbuchstaben | `{typography.caps}` | Abschnittsmarken, Phasen-Label, Kicker |
| Zahlen | `{typography.number}` | TP, Werte, Preise, EP; immer tabellarische Ziffern |
| Zitate | `{typography.quote}` | letzte Zeilen, Gedenkzitate |

Keine weiteren Schriften. Silkscreen und Cinzel aus dem PoC entfallen in der UI.

## Layout & Spacing

- **Hochformat zuerst.** HUD hält `{spacing.hud-edge}` Abstand zu den Rändern plus Safe Area; oben `{spacing.hud-top}`.
- **Oben Information, unten Handlung** (Daumenzone): Status-Pillen oben, Karten, Panels und Dock unten.
- Abstände zwischen Steinen `{spacing.gap}`, in Rastern `{spacing.gap-tight}`; Innenabstand eines Steins `{spacing.piece-padding}`.
- Jedes tippbare Element mindestens `{spacing.touch-min}` hoch.
- Vier-Spalten-Raster für Dock, Leiste und Raumsteine; die Zahl 4 ist überall gleich, damit Muskelgedächtnis entsteht.
- Vollbild-Ansichten (Truppe, Händler, Kampagnen) liegen über der weichgezeichneten Heimat bzw. Szene, nie über einer leeren Fläche.

## Elevation & Depth

Drei Ebenen:

1. **Welt** (3D-Brett, Burg, Weltkarte-Bild, Szenenbild): darf weichgezeichnet und entsättigt werden, wenn etwas darüber liegt.
2. **Steine** (`{components.piece}`): harte Unterkante `{spacing.press-depth}` in `{colors.line}` plus weicher Schatten. Gedrückt: Unterkante 1 px, Stein 3 px tiefer.
3. **Karten und Overlays** (Folgen-Karte, Abschied, Raum-Panel): über einem Schleier aus `{colors.line}` mit 45 % Deckkraft.

Kein Stapel tiefer als eine Karte über einem Panel.

## Shapes

- Steine `{rounded.piece}`, Aktionen und Raumsteine `{rounded.action}`, innere Flächen `{rounded.card-inner}`, Status, Chips und Tasten als Pille `{rounded.pill}`.
- Porträts im Spiel rund (Medaillon); in der Gedächtnishalle oben rund, unten gerade (Grabstein).
- Konturen `{spacing.outline}`, auf kleinen Elementen `{spacing.outline-small}`.
- Ecken immer rund. Die Fasen und Wappenschilde aus U21 entfallen auf Spielflächen.

## Components

| Komponente | Aufbau und Aussehen |
|---|---|
| **Stein** (`piece`) | Grundbaustein aller Panels; Creme, Kontur, harte Unterkante |
| **Haupttaste** (`button-primary`) | Glut-Pille mit weißem Label; höchstens eine je Ansicht; nennt Preise mit Symbol (z. B. „Kaufen · ● 1 000“) |
| **Nebentaste** (`button-secondary`) | Creme-Pille; Zurück, Abbrechen, Aufstellung |
| **Ruhige Taste** (`button-quiet`) | grau, ohne Glut; nur in Abschied und Gedenken |
| **Dock-Aktion** (`dock-action`) | quadratischer Stein, Icon 26 px über Label; Haupt-Aktion (Angriff) in Glut |
| **Klassen-Aktion** (`class-action`) | wie Dock-Aktion, hellblau, Rollen-Icon, Zähler (z. B. „1×“) als Glut-Pille oben rechts |
| **Kontext-Band** (`context-band`) | grüne Pille über der Einheitenkarte: Mini-Porträt, Aktion, Grund (z. B. „Verblutet nach 2 eigenen Phasen“), grüne Taste |
| **Medaillon** (`medallion`) | rundes Porträt mit TP-Ring in Teamfarbe und Stufen-Pille unten; Leutnant mit Goldring; Niedergestreckte grau |
| **Einheitenkarte** | Stein mit Medaillon, Name, Rolle, TP als Zahl, Waffen-Chip |
| **Phasen-Pille** (`phase-pill`) | oben mittig; Spielerphase Glut-Badge mit Runde, Gegnerphase rot mit großem Titel |
| **Ziel-Pillen** | Hauptziel in der Rundenpille, Nebenziele als kleine Pillen mit Icon und Stand |
| **Groll-Wimpel** | roter Wimpel über dem Leutnant, 0–3 weiße Kerben |
| **Sprechband** (`speech-band`) | Stein am oberen Bildschirmrand unter den Pillen, nicht am Brett befestigt: rundes Porträt mit Ring in Teamfarbe, Namensschild in Teamfarbe, max. 2 Zeilen (löst die Sprechblase am Kopf ab) |
| **Steckbrief** | Stein mit großem Leutnant-Medaillon, Groll-Kerben (Goldpunkte), Groll-Ziel, Faktenfeld (Fluchtregel, Kopfgeld, Begegnungen), Groll-Fähigkeiten als Chips (gesperrte gestrichelt) |
| **Weltkarten-Knoten** (`map-node`) | runder Stein mit Spitze und Ortslabel; Story Glut mit Nummer, Nebenquest grün mit „!“, Heimsuchung rot mit Leutnant-Gesicht und Marke „NEU“, Heimat Creme mit Zelt/Burg, erledigt klein und grau; gewählt mit weißem Hof |
| **Knoten-Karte** | Stein unten: Kicker, Titel, Tag-Chips (Ziel, Plätze, Stufe), Leutnant-Zeile, Belohnung, Aufstellung + Aufbrechen |
| **Leiste** | vier Steine unten (Weltkarte/Heimat, Truppe, Steckbriefe, Chronik) im Raster des Docks |
| **Raumstein** (`room-stone`) | quadratischer Stein mit Raum-Icon, Name, Stufe als drei Punkte; grüner Pfeil = ausbaubar, Glut-Zahl = Neues; gesperrt gestrichelt |
| **Raum-Panel** | Stein mit Kopf (Raum-Icon, Name, Stufe, Wirkung), Ausbau-Band in Grün, Liste, zwei Tasten |
| **Overlay-Blatt** (`Sheet`) | Stein über dem Schleier (45 %) mit Kopf wie der Bildschirmkopf (runder Schließen-Stein, Titelpille), scrollendem Körper und Tastenreihe; Esc oder Tipp daneben schließt. Trägt Einheiten-Info, Ziele, Kampfmenü, Aktions- und Item-Auswahl, Tausch, Konvoi |
| **Item-Zeile** | Item-Bild (`item-image`), Name, Werte, rechts Vergleich (grün/rot) oder Preis; gewählt mit Glutrand |
| **Item-Bild** (`item-image`) | gemaltes Bild im Stil der Porträts (`art/items/`), Rahmen in Seltenheitsfarbe, Seltenheits-Rauten oben rechts (Relikt: hohle Krone, Rahmen mit Glutorange-Akzent), Zahl unten (Aufwertung, Ladungen) |
| **Item-Chip** (`item-chip`) | Pille mit Item-Bild und Name, z. B. Waffen-Chip der Einheitenkarte und der Kampfvorschau: **ein einziger Rahmen**. Das Bild darin hat keinen eigenen Rahmen (`ItemImage bare`), die Pille nimmt die Seltenheitsfarbe als Rand und trägt die Rauten an ihrer Ecke. Bilder ohne Namen (Listenzeile, Ausrüstungsplatz) behalten den Rahmen des Item-Bilds |
| **Währung** (`currency`) | Symbol + Zahl in `{typography.number}`; nie Wort, nie nackte Zahl |
| **Namensschild** (`nametag`) | Glut-Pille am Rand der Dialogbox, auf der Seite des Sprechers |
| **Entscheidungs-Marke** | schwarze Pille „Entscheidung · hat Folgen“ mit Glutraute |
| **Folgen-Karte** (`consequence-card`) | Stein über Schleier: Marke „Folgen“, Titel, eine Zeile je Wirkung (rundes Symbol, fetter Satz, Erklärung), Haupttaste „Weiter“ |
| **Abschieds-Karte** (`mourn-card`) | entsättigte Halbfigur, Name, Ort und Rolle, Glutlinie, Zitat, Trauer-Zeile des Partners, ruhige Taste |
| **Kampagnen-Zeile** | Avatar-Medaillon, Name, Modus-Marke (Klassik dunkel), Stand, Spielzeit, Speicherplätze als kleine Felder |
| **Fortschrittsring** | Glutring für Downloads mit Prozent und MB |
| **Lebensleiste** (`hp-bar`) | Stein-Pille über dem Kopf jeder Figur: Creme-Grund, Füllung in Teamfarbe, dunkle Kontur (Leutnant Goldkontur), Teilstriche in Creme je 5 TP (ab 40 max. TP je 10); unter 25 % pulsierender Glutrand; in der Kampfvorschau blinkt der Teil, den der Angriff nimmt. Nie rot gefärbt, weil Rot Team ist |
| **Raster-Eckpunkte** (`grid-mark`) | kleine Creme-Kreuze an den Feldecken auf Feldhöhe; Stufe „stark“ zeichnet durchgehende feine Linien |
| **Bereichs-Kachel** (`range-tile`) | Einzelfeld mit 2–3 px Lücke und runden Ecken, gemeinsame Außenkante (Creme unter Teamfarbe); Weg als dicker runder Pfeil in `{colors.team-player}` mit Creme-Rand |
| **Gefahrenzone** (`threat`) | rote durchscheinende Fläche in drei Stufen, Außenkante rot auf Creme, keine Zahl auf den Feldern; schlafende Gegner als gestrichelte Kante |
| **Zielfeld-Pille** | Pille oben unter den Ziel-Pillen: „⚠ n Gegner erreichen dieses Feld“, ab 2 auf `{colors.team-enemy-soft}` mit roter Schrift, bei 1 auf Creme; die Gegner, die das Feld erreichen, leuchten rötlich (statt Linien) |
| **Gelände-Chip** | Pille am Zielfeld: Gelände-Symbol, Name, Verteidigung (Schild), Ausweichen, Heilung; Werte als Symbol + Zahl, Bonus in `{colors.positive}` |
| **Kill-Marker** (`kill-marker`) | runder dunkler Stein mit Creme-Totenkopf über dem Gegner, halb gefüllt = nur mit Krit; Warnung über eigenen Figuren grau mit „!“; nie Glutorange |
| **Rückblick-Stein** | Stein über der Einheitenkarte: Titel „Gegnerphase n“ (Fraunces), Zeilen mit Medaillon, Satz, Zahl rechts (Schaden rot, ausgewichen grün); eine Nebentaste „Figur zeigen“ |
| **Gegner-Leiste** | Reihe kleiner Medaillons (34 px) mit TP-Ring in `{colors.team-enemy}` und TP-Zahl als Pille unten; Leutnant mit Goldring |
| **Fertig-Häkchen** | kleiner runder Stein in `{colors.positive}` mit weißem Haken am Kopf der Figur |
| **Kontext-„?“** (`help-stone`) | runder Stein 22 px in `{colors.cream-2}` mit dunkler Kontur und „?“ neben dem erklärten Wert; mindestens 44 pt Tippfläche. Die Mockups zeigen ihn noch blau; es gilt diese Zeile |
| **Handbuch-Kategorie** | Stein im Zweier-Raster: Name (Label), Unterzeile mit Stichworten |
| **Handbuch-Eintrag** | Overlay-Blatt: Titelpille, Grafik (Diagramm in Stil B, z. B. Waffendreieck), Werte-Feld (Label in Großbuchstaben, Wert tabellarisch), ein Satz „wo im Spiel“, Querverweise als Chips mit Pfeil (Creme, dunkle Kontur) |
| **Klassen-Steckbrief** | Eintrag mit Rollen-Icon, Werte-Netz aus dem Wachstum, Fakten (Bewegung, Bewegungstyp, Waffengruppen, Klassen-Aktion), je 2–3 Zeilen „stark“ (grün, +) und „schwach“ (rot, −), Profi-Wege |
| **Epilog-Kachel** | Medaillon + Name + ein Satz; lebt farbig, gefallen grau, gegangen sepia; Regionen als breite grüne Kachel |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Jedes Bedienelement als Stein mit Kontur und Unterkante | flache Flächen mit Haarlinien (U21-Look) auf Spielflächen |
| Eine Glut-Haupttaste je Ansicht | zwei orange Tasten nebeneinander |
| Beträge als Symbol + Zahl, Symbol je Ressource immer gleich | „400 Gold“, nackte „600“, wechselnde Symbole |
| Items mit gemalten Bildern | Linien-Icons für Items (nur für Aktionen, Rollen, Navigation) |
| Teamfarben nur für Teams | Blau oder Rot für Seltenheit, Dekor oder Fehler |
| Ernstes über Entsättigung und Stille | Glut-Tasten, Konfetti oder Wackeln im Abschied |
| Fraunces für Namen, Barlow für Text | dritte Schrift, Großbuchstaben-Fließtext |
| Welt dahinter weichzeichnen | leere Hintergründe hinter Panels |
