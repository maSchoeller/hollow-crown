# 01 – Entscheidungsprotokoll (Proof of Concept, eingefroren)

> **Eingefroren am 2026-10-23.** Ab jetzt werden Entscheidungen im BMAD-System dokumentiert, und zwar im jeweiligen Artefakt mit seinem `.decision-log.md`: Game Brief (`20-game-brief/`), GDD, Narrative, Art Direction, Architektur. Hier kommen keine neuen Einträge mehr hinzu. Noch gültige Einträge wandern in das passende Artefakt, sobald es entsteht: Spielmechanik ins GDD, Story in die Narrative, Grafik und Audio in die Art Direction, Technik in die Architektur. Bis dahin gilt dieses Protokoll weiter, soweit der Game Brief (B1–B9) nichts anderes sagt. Widerspricht ein BMAD-Artefakt diesem Protokoll, gilt das Artefakt.

Dieses Dokument hielt alle Entscheidungen des Proof of Concept fest.

- **[A]** = mit dem Produktinhaber abgestimmt.
- **[C]** = von Claude als Default gesetzt (nicht explizit abgestimmt). Darf die Umsetzung begründet ändern; Änderung hier dokumentieren.

Änderungen an Entscheidungen erfolgen nur noch im zuständigen BMAD-Artefakt (siehe Hinweis oben).

## Produkt

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| P1 | Name | **Hollow Crown**, Repo `hollow-crown`; Store-Untertitel später | A |
| P2 | Grundkonzept | Story-Kampagne in Kapiteln + Lager/Söldner-Systeme zwischen Missionen | A |
| P3 | Geschäftsmodell | F2P fair: Kosmetik + freiwillige Bonus-Ads (gedeckelt), kein Ad-Revive, keine Energie, Werbefrei-Kauf. **Nicht in V1** | A |
| P4 | V1-Umfang | Vertical Slice: Prolog + 5 Kapitel, ~8 Story-Charaktere + Taverne, ~40 Items, Lager, Scharmützel | A |
| P5 | Sprachen | Spiel DE + EN mit i18n ab Tag 1 | A |
| P6 | Doku/Code-Sprache | Konzept Deutsch, Code/Bezeichner/Datenschlüssel Englisch | A |

## Technik

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| T1 | Plattform | Web-first (Browser auf Handy/Tablet/PC), PWA; später Capacitor für App Stores | A |
| T2 | Sprache/Build | TypeScript (strict) + Vite | A |
| T3 | Rendering | ~~Babylon.js, orthografische Kamera für das 2D-Brett; später glTF-Modelle aus Blender~~ → ~~Babylon.js, orthografische Draufsicht auf Pixel-Art (48 px/Feld laut GA4b, ganzzahliger Zoom, `nearest`), Thin Instances + eigener Shader (Teamtausch, Licht über Normal-Maps). 3D-Ansicht nur als spätere Option (siehe GA2)~~ → Babylon.js in **Echtzeit-3D**, siehe D1–D16 | A |
| T4 | UI | HTML/CSS-Overlay über dem Canvas | A |
| T5 | UI-Framework | Preact **10** + @preact/signals (leicht). Preact 11 hängt kein `px` mehr an Zahlen-Styles an; bis zur Umstellung bleibt V1 auf 10.x | C |
| T6 | Regelkern | Pure TS ohne DOM/Babylon-Abhängigkeit, deterministisch mit Seed-RNG, Command/Event-Architektur | A |
| T7 | Tests | Vitest (Kern), Playwright mit Mobil-Profilen (E2E) | A |
| T8 | Performance | 60 FPS auf ~3 Jahre altem Mittelklasse-Handy, Ladezeit < 5 s, initialer Download < 15 MB, offline-fähig. **Präzisiert:** < 15 MB gilt für Shell + Prolog; weitere Kapitel als Pakete nachgeladen und offline gecacht; Qualitätsstufen Niedrig/Mittel/Hoch (siehe `16-asset-pipeline.md` §8–9) | A / C |
| T9 | Speichern | Lokal in IndexedDB, Auto-Save nach jeder Aktion + 3 Slots, Export/Import als Datei, versioniert mit Migrationen; Cloud später | A |
| T10 | Content-Format | Eigenes YAML-Textformat (Karten als ASCII-Raster) + Zod-Schemas; Karten-Viewer/-Validator im Browser + CLI-Simulator (KI vs. KI) in V1 | A |
| T11 | Paketmanager/Runtime | pnpm, Node 22 LTS. TypeScript auf **6.0.x** gepinnt, weil typescript-eslint TS 7 noch nicht unterstützt | C |
| T12 | Barrierefreiheit | Nicht in V1 (Farbenblind-Modus, Schriftgröße, Linkshänder-Layout später). Maus-Bedienung am PC ist Pflicht | A |

## Spielmechanik

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| G1 | Ausrichtung | Hochformat, adaptiv (Tablet/PC: Seitenpanels) | A |
| G2 | Bedienung | Tap-Tap mit Geistervorschau + Aktionsleiste unten; Bewegung bis zur Aktion zurücknehmbar; Pinch-Zoom, Zwei-Finger-Pan, Langdruck = Info. **Ergänzt:** Pinch/Mausrad schalten zwischen den Zoomstufen aus D9 | A |
| G3 | Zugfolge | Phasen wie FE: Spieler → Gegner → Dritte Partei | A |
| G4 | Kampfauflösung | Trefferchance + Vorschau; fester Schaden; geglätteter Zufall (Mittel aus 2 Würfen) | A |
| G5 | Konter-Regeln | Waffendreieck (Schwert > Axt > Lanze > Schwert) + Effektivität | A |
| G6 | Magie | Elementkreis Feuer > Wind > Erde > Wasser > Feuer, zusätzlich Licht ↔ Dunkel; Angriffselement vs. Verteidiger-Affinität | A |
| G7 | Verzauberung | Runen-Slots (1–2) in Waffen, beim Verzauberer im Lager ein-/ausbaubar; Waffe erhält Element (+ ggf. Effekt) | A |
| G8 | Element-Effekte | Status (Brennen, Nass, Verlangsamt, Rückstoß) + Geländeeffekte (Wald brennt, Wasser löscht, Felswall, Wind vertreibt Nebel) | A |
| G9 | Inventar | Paperdoll (Haupt-/Nebenhand, Kopf, Körper, 2 Accessoires, Beutel 3), Gewicht vs. Tragkraft, **kein Verschleiß** | A |
| G10 | Loot | Seltenheit + 0–2 Affixe, handgemachte Legendäre, Set-Boni | A |
| G11 | Skills | Ausrüstung lehrt Skills (Meisterung → dauerhaft), + Klassen-Skills + persönlicher Skill | A |
| G12 | Wachstum | Wachstumsraten, geglättet (kein Totalausfall). Stufe 1–20 | A |
| G13 | Klassen | 2 Stufen, verzweigt: ~10 Basisklassen → je 2 Profiklassen ab Stufe 10 per Siegel | A |
| G14 | Tod | Niedergestreckt → Narbe → Tod; Tod-Modus Klassik/Standard/Casual | A |
| G15 | Schwierigkeit | Leicht/Normal/Schwer × Tod-Modus; Schwierigkeit nur absenkbar | A |
| G16 | Rekrutierung | Story-Helden (inkl. Ansprechen im Kampf) + Taverne mit generischen Söldnern | A |
| G17 | Beziehungen | Supports C/B/A/S + Nachbarbonus + Tandem-Angriff ab B (50 % Schaden), Schutz ab A; auch Gegner-Paare | A |
| G18 | Wirtschaft | Druck durch Schmied (Aufwerten +1…+5, Affix neu würfeln), Anwerbung, Narbenheilung | A |
| G19 | Verbrauch | Tränke mit Ladungen, nach Mission kostenlos aufgefüllt; seltene Verbrauchsgüter echt verbraucht | A |
| G20 | Karten | Alle Größen (kompakt bis groß); Zoom, Minikarte, Speichern mitten in der Mission. **Ergänzt:** Kartenform siehe D11 | A |
| G21 | Gelände | FE-Gelände + interaktive Objekte (Türen, Truhen, Hebel, Ballisten, Dörfer); keine Höhenstufen in den Regeln (Höhen nur optisch, siehe D3) | A |
| G22 | Missionen | Ziele: Besiegen, Erreichen, Beschützen, Einnehmen, Wellen überleben, Entkommen; 1–3 Nebenziele mit Bonus-Loot | A |
| G23 | Gegner/KI | Volle Info (Gefahrenzonen, Langdruck) + KI-Profile; Nebel des Krieges auf einzelnen Karten | A |
| G24 | Lager | Konvoi, Händler, Schmied, Verzauberer, Taverne, Heiler, Supports, Vorbereitung, Scharmützel (V1); Mahlzeiten/Training (V1.1) | A |

## Story & Darstellung

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| S1 | Setting | Klassische High Fantasy | A |
| S2 | Prämisse | „Der gebrochene Drachenpakt“ | A |
| S3 | Hauptfiguren | Avatar (Taktiker, auf dem Feld, Fähigkeit „Befehl“) + Lord **Kael**, Hauptmann des Aschenbanners | A |
| S4 | Verzweigung | Akt 1 linear, danach Fraktionswahl (3 Routen); V1 nur Datenmodell vorbereitet | A |
| S5 | Darstellung | Visual-Novel-Dialoge mit Porträts, Kurzkampf auf dem Brett; Speed 1x/2x/Skip; 3D-Kampfszene später optional. **Ergänzt:** Krit-Cut-ins (Anime-Illustration) bei Krit/Tandem/Skill/Boss | A |

## Grafik & Audio (Grilling-Session 2026-10-22)

Details: `15-art-direction.md`, `16-asset-pipeline.md`, `17-audio.md`.

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| GA1 | Leitbild | Modernisiertes Fire Emblem (GBA-Ära): ~~Pixel-Karte + moderne Lichtschicht („HD-Pixel“)~~ → 3D-Diorama-Karte (D1), Anime-Ebene für Porträts/Cut-ins/Hintergründe/Key Art | A |
| GA2 | Kamera | ~~Draufsicht, orthografisch, fest; Figuren/hohe Objekte leicht von vorn (FE-Konvention). Spätere 3D-Ansicht möglich, nicht geplant~~ → siehe D2 | A |
| GA3 | Darstellung Brett | ~~Hybrid im Sinne von „3D bauen, 2D rendern“: Figuren und Requisiten in Blender modelliert und zu Pixel-Sprites gerendert~~ → Figuren und Requisiten in Blender modelliert und **als 3D-Modelle gerendert** (D4, D5); Pixel-Sprites bleiben als umschaltbare Figuren-Alternative | A |
| GA4 | Raster | ~~32 × 32 px pro Feld; Figuren-Frames 32 × 32 (Angriff/große Einheiten 48 × 48)~~ → siehe GA4b | A |
| GA4b | Raster (neu) | **48 × 48 px pro Feld**, Figuren-Zellen 72 × 72 mit Fußpunkt [36, 63] (Figur ca. 38 px hoch), Dual-Grid-Tiles 48 px. Mehr Platz für Gesichter, Signaturdetails und Waffen. Format: `art/README.md` | A |
| GA5 | Stil Anime-Ebene | Hell, klares Cel-Shading, leicht erwachsenere Gesichter | A |
| GA6 | Sprite-Produktion | Blender → Pixel: Low-Poly-Chibi auf gemeinsamem Rig, Toon-Shader, klein rendern, auf Palette Hollow-64 quantisieren | A |
| GA7 | Proportionen | Chibi, ca. 2,5 Köpfe | A |
| GA8 | Animationen V1 | FE-Set: Idle, Laufen 4 Richtungen, Angriff je Waffenart, Treffer, Niedergestreckt | A |
| GA9 | Ausrüstung sichtbar | Ausgerüstete Waffenart als eigene Ebene (nicht jedes Item) | A |
| GA10 | Teamfarben | Teamtuch per Palettentausch + Bodenring; Haare/Haut/Signatur bleiben individuell. **Ergänzt:** in 3D über die Teamtuch-Materialien, siehe D12 | A |
| GA11 | Gelände | ~~Pixel-Tileset mit Autotiling (KI-Entwurf + nachgepixelt)~~ → detailreiche Bodentexturen im Stil der 3D-Welt (D6); Requisiten aus Blender | A |
| GA12 | Licht & Effekte | ~~Pixel + dynamisches Licht (Normal-Maps), dezentes Bloom, auf Pixelraster einrastende Partikel~~ → siehe D7 | A |
| GA13 | UI-Stil | Klar, vektorbasiert, Elfenbein/Nachtblau mit Goldornament; Pixel-Schrift nur für Zahlen auf dem Brett | A |
| GA14 | Anime-Assets | VN-Porträts, Krit-Cut-ins, VN-Hintergründe, Key Art & Titel | A |
| GA15 | Bild-KI | ChatGPT (Abo des Produktinhabers), gesteuert über Claude in Chrome; Blender lokal per MCP. Kosten niedrig halten | A |
| GA16 | Weltstimmung | Jahreszeiten als Dramaturgie (Spätsommer → Drachenglut), Fraktionsfarben laut `15` §3.2 | A |
| GA17 | Zeitpunkt | Finale Grafik ist Teil von V1, als paralleler Art-Track A0–A5; Code nutzt bis dahin Platzhalter im finalen Format | A |
| GA18 | Stimmen | Teilvertonung DE + EN: Barks, Boss-Zitate, 2 Schlüsselszenen; Rest gelesen mit Stimm-Lauten. Avatar unvertont | A |
| GA19 | SFX & Musik | ElevenLabs (Sound Effects, Music); Musik Orchester + Folk mit Leitmotiv pro Fraktion; Spieler-/Gegnerphase als Arrangement-Paar | A |
| GA20 | Audio-Zugang | ElevenLabs-MCP (User-Scope), Key aus Umgebungsvariable `ELEVENLABS_API_KEY` | A |
| GA21 | Binärdateien | Git LFS für `.blend`, Roh-Audio, große PNGs; `public/assets` wird generiert, nicht eingecheckt | A |
| GA22 | Feldgröße/Zoom | ~~Zoom nur in ganzzahligen Stufen, Kamera rastet auf Bildpixel ein~~ → siehe D9; `nearest`-Filter gilt nur noch für die 2D-Figuren-Alternative | C |
| GA23 | Avatar-Porträts | 4 Porträtvorlagen | C |
| GA24 | Schriften | Cinzel (Titel), Nunito Sans (UI), Silkscreen (Brett-Zahlen); alle SIL OFL | C |
| GA25 | Autotiling | ~~Dual-Grid (16 Kacheln pro Geländepaar)~~ → Splat-Map, siehe D6 | C |
| GA26 | Lizenzen | Vor Produktion: kommerzielle Nutzungsrechte von ChatGPT-Bildern und ElevenLabs-Ausgaben prüfen und hier dokumentieren | offen |

## Erster Wurf V1 (Umsetzungs-Session 2026-10-22)

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| U1 | Umfang erster Wurf | Prolog + Kap. 1–2 spielbar: Kern-Kampf mit allen Regeln, Inventar/Paperdoll, Dialoge DE/EN, Lager (Kompanie, Konvoi, Händler, Schmied, Verzauberer, Heiler, Lagerfeuer, Speichern), Weltkarte, Auto-Save. **Noch nicht:** Taverne, Scharmützel/Übungsplatz, Nebel des Krieges, Krit-Cut-ins, Minikarte, Karten-Viewer (Dev-Route), Canto, Stimmungs-Porträts, Avatar-Vorlagen 3–4 | A |
| U2 | Deployment | GitHub Pages per GitHub Action (`.github/workflows/pages.yml`), LFS-Objekte im Actions-Cache | A |
| U3 | Bild-KI | Neutrale Halbfigur-Porträts (Avatar ×2, Kael, Brenna, Tobin, Mira, Liora, Varek, Grosk, Hask, Morra) + 3 VN-Hintergründe via ChatGPT; Stimmungen später | A |
| U4 | Audio | ElevenLabs per API (`tools/audio/elevenlabs.py`, Key aus `ELEVENLABS_API_KEY`): 26 SFX (UI, Treffer mit Varianten, Elemente, Ereignisse) und 5 Musikstücke (Titel, Weltkarte, Lager, Spieler-/Gegnerphase). Noch nicht: Stimmen/Barks, Stimm-Laute, Ambiente, nahtlose Loop-Punkte. Lizenzprüfung GA26/O5 weiterhin offen | A |
| U5 | Bedienung | Tippen auf einen Gegner, während eine Einheit gewählt ist, wählt automatisch das nächste Angriffsfeld und öffnet die Vorschau; zweites Tippen auf das Ziel greift an | C |
| U6 | Phasenende | Haben alle Einheiten gehandelt, endet die Spielerphase automatisch | C |
| U7 | Freie Aktionen | Waffe wechseln im Kampf nicht auf 1×/Zug begrenzt; Tauschen legt Items in den Beutel; Konvoi: 1× pro Zug je ein Item nehmen und/oder ablegen | C |
| U8 | KI-Reihenfolge | Zugreihenfolge der KI wird zu Phasenbeginn festgelegt (Kill-Chance, dann Distanz) | C |
| U9 | Dialogwahl | Auswahlantworten nur außerhalb des Kampfs, damit Replays rein bleiben | C |
| U10 | Narbe „Schwaches Auge“ | vereinfacht: −5 Krit und −5 Treffer immer (nicht nur auf Distanz ≥ 2) | C |
| U11 | Neustart (O1) | Umgesetzt wie der Vorschlag in O1: Runde neu starten in Standard/Casual, Mission neu starten in allen Modi. **O1 bleibt offen** (Playtest) | C |
| U12 | Generische Einheiten | Klassen haben `base`/`growth` für generische Einheiten; Stufe L = Basis + ⌊Wachstum × (L−1)⌋, dann Schwierigkeits-Prozent | C |
| U13 | Kapitel 2 | Liora ist dritte Partei mit Profil `hold`, schließt sich nach dem Sieg an; Wellen in Runde 3/5/7; ~~Sim-Siegquote ~40–50 % mit dem einfachen Sim-Spieler (ohne Bergen), Feinbalancing im Playtest~~ → siehe U18 | C |

## Einführung, Balancing, Audio (Session 2026-10-22, Nachmittag)

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| U14 | Gestaffelte Mechaniken | Eine neue Regel pro Kapitel: `campaign.yaml` `mechanics` nennt pro Mechanik den ersten Knoten (Dreieck ab Kap. 1, Magie ab Kap. 2, Elemente/Status/Runen-Effekte und Unterstützungen ab Kap. 3). Vorher rechnet der Kern ohne sie (`BattleState.locked`), alte Spielstände ohne Feld = alles an. Details: `06` §10. Grund: Wunsch des Produktinhabers, Prolog bisher mit Dreieck, Magie und Affinität überladen | C |
| U15 | Schwierigkeit über Aufstellung | Karteneinheiten und Verstärkungen haben optional `difficulty: [...]`. Leicht = weniger Gegner/kleinere Wellen, Schwer = Zusatzgegner und Flanken. `enemyStatPercent` bleibt −15/0/+15 | C |
| U16 | Rhens Zauberbuch | Der Avatar startet ohne Glut; das Glut-Folio gibt es nach Kap. 1 (`grants` am Kampagnenknoten, Ergebnisbildschirm zeigt es). Händler: Glut ab Stufe 1, Feuerbombe ab Stufe 2. Dorf West in Kap. 1 gibt einen Wurfspieß statt einer Feuerrune | C |
| U17 | Lektionen | Tutorial-Dialoge: höchstens eine Lektion pro Runde, max. drei Zeilen, situativ ausgelöst. Prolog: Bewegen/Vorschau (R1), Gefahrenzone + Deckung (R2), Heiltrank (Kael < 60 % TP). Kap. 1: Ziel + Dreieck (R1), Feuer beim Betreten der Stadtmitte. Kap. 2: Beschützen + Magie (R1), Varek-Hinweis beim Überqueren des Bachs. Kap. 1 ohne Truhe, ohne Nebenziel „keine Verluste“; Kap. 2 ohne Gegner-Unterstützungspaar | C |
| U18 | Balancing-Stand | (Werte vor dem Neu-Layout, siehe D18) Sim (40 Läufe, verkettete Kampagne, Tod-Modus Standard; Sim-Spieler besucht jetzt Dörfer und wirbt an): **Leicht** 100 / 100 / 97 %, **Normal** 100 / 100 / 83 % (0,07 / 0,42 / 1,30 Niedergestreckte), **Schwer** 70 / 36 / 40 %. Vorher: Leicht 100/100/73, Normal 100/95/39, Schwer 90/86/29. Zielkorridore in `06` §10 | C |
| U19 | Audio-Mischung | Vier SFX-Kanäle: UI (1 Stimme, ersetzt), Kampf (max. 2), Ereignis (1 Stimme + kurze Warteschlange), Jingle (Phase, Stufenaufstieg, Anwerben, Sieg, Niederlage; senkt die Musik um ≈ −9 dB). Sieg/Niederlage blenden die Kampfmusik aus und halten den nächsten Titel bis zum Ende des Jingles an. Gleicher Sound nicht öfter als alle 60 ms. Behoben: Musik startete bei Taps während des Ladens mehrfach übereinander. Tab im Hintergrund → Audio pausiert (`17` §7) | C |
| U20 | Bedienführung (Vorschlag) | Ein Hub „Kriegslager“ statt Weltkarte + Lager, „Aufbrechen“ als Haupttaste, Aufstellung nur wenn nötig, Kampfleiste mit max. 4 Aktionen, „Phase beenden“ nie neben „Zurück“, Neues Spiel nur Name/Porträt/Schwierigkeit, Affinität erst mit den Elementen, Lager-Einrichtungen schalten sich frei. Mockups A/B/C: Design-Leinwand „Hollow Crown – UI-Richtungen“. **Umgesetzt:** Hub `Camp` mit Haupttaste „Aufbrechen“ und „Aufstellung“, Einrichtungen per `campaign.yaml` `facilities` (Kompanie/Konvoi/Händler ab Start, Schmied/Heiler nach Kap. 1, Lagerfeuer nach Kap. 2, Verzauberer ab Kap. 3); Aufstellung wird übersprungen, wenn die Kompanie nicht größer als die Einsatzplätze ist; Kampf-Dock in vier Zuständen (Leerlauf: Gefahr / Nächste / Phase beenden mit Rückfrage bei bereiten Einheiten), Zoom-Tasten entfallen (Pinch/Mausrad); Affinität vorerst fest „Wind“, Wahl folgt mit den Elementen; eigenes Linien-Icon-Set statt Emoji (`src/ui/icons.tsx`) | A |
| U21 | UI-Stil | **B hell – Wappen & Banner, Studio-Fassung**: Knochenweiß `#F3EEE4`, Panels `rgba(250,247,240,.9)` mit Hintergrund-Unschärfe über dem Brett, Tinte `#1F1E24`, Grau `#65605A`, Tonfläche `#E9E3D6` für Nebenaktionen, Glutorange `#E8743B` nur für Haupttaste und Panelkante (mit Raute), Blau `#2F64C8`/Rot `#B83A2E` nur für Teams. Formen: Banner, Wappenschild als Porträtrahmen, Ecken 6 px abgeschrägt. **Keine Schlagschatten**, keine Verläufe, keine Rundungen, Haarlinien statt Rahmen, eine weiche Schattenkante nur unter dem Bottom Sheet. Schriften: Grenze Gotisch nur für Namen und Titel, Barlow (Text), Barlow Condensed (Labels, Zahlen) – ersetzt Cinzel/Nunito Sans aus GA24 für die UI. Präzisiert GA13 (Elfenbein bleibt, Nachtblau/Gold entfällt). Ziel: professioneller Studio-Look statt Fantasy-Kitsch | A |
| U22 | App-Icon und Hintergründe | **App-Icon:** hohle, an einer Seite gesprungene Goldkrone mit Glut auf Nachtblau, generiert mit ChatGPT (`art/icon/icon.png`, Prompt `art/prompts/app_icon.md`); `pnpm art:icons` leitet Favicon (ICO/PNG, enger Zuschnitt), Apple-Touch-Icon und PWA-Icons inkl. maskable ab, das selbstgezeichnete SVG-Icon entfällt. **Hintergründe:** Bildschirm-Hintergründe (`.screen-bg`) sind `position: fixed` mit `cover` und füllen immer den ganzen Viewport, auch beim Scrollen; der Lager-Hub nutzt sie statt des 300 px hohen Bildstreifens, damit auf breiten Bildschirmen keine leeren Flächen neben und unter dem Bild bleiben. **Randlos auf dem iPhone:** Als Home-Bildschirm-App (`display-mode: standalone`) sind `html/body/#app` und `.screen-bg` `100lvh` hoch statt `100%`, weil iOS mit `100%` vor Statusleiste und Home-Indikator endet und die abgerundeten Ecken leer bleiben; `#app` ist `position: relative`, damit Bildschirme und Kampf (`position: absolute; inset: 0`) diese Höhe übernehmen statt des zu kurzen Start-Viewports; Bedienelemente bleiben über `--safe-top`/`--safe-bottom` im sicheren Bereich | C |

## 3D-Karte (Session 2026-10-22, Mockup „Hollow Crown 3D-Karte“)

Grundlage: drei Fragerunden und das Mockup (claude.ai/artifact/2LzhXxZWubQz7bKCYjYuAT). Gewählt wurde **Variante A (3D-Figuren)**.

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| D1 | Kartendarstellung | Die Kampfkarte wird in Echtzeit-3D gerendert: Felder als Diorama-Blöcke mit Höhe, Seitenflächen (Erde, Fels, Mauerwerk) und abgesenktem Wasser. Löst die Pixel-Draufsicht ab (T3, GA1, GA2). Anime-Ebene, Porträts und UI bleiben unverändert | A |
| D2 | Kamera | Orthografisch, Norden oben, nicht drehbar, **ca. 35° aus der Senkrechten geneigt**. Gespielt wird weiterhin von oben nach unten. Feinabstimmung des Winkels im Playtest; im Mockup wirken 40–50° räumlicher | A |
| D3 | Höhen | Nur optisch: Berge, Mauern und Forts stehen hoch, Flüsse liegen tiefer. Die Höhe ist ein Darstellungswert pro Gelände in `terrain.yaml`; `src/core` und die Regeln bleiben unverändert (G21) | A |
| D4 | Figuren | **3D-Modelle** aus den Blender-Bauskripten (`tools/art/blender_*.py`), als glTF exportiert. Die 2D-Pixel-Sprites bleiben als umschaltbare Alternative (Option „Figuren: 3D / 2D“) erhalten, als aufrechte Aufsteller auf der 3D-Karte | A |
| D5 | Requisiten | Bäume, Häuser, Forts, Brücken, Truhen, Felsen usw. als 3D-Modelle aus Blender (glTF); gleiche Modelle werden gebündelt gezeichnet (Thin Instances) | A |
| D6 | Bodentexturen | Detailreich und gemalt, im Stil der 3D-Welt statt 48-px-Pixelkacheln: je Bodenart eine kachelbare Textur (Gras, Erde, Pflaster, Sand, Mauer, Erd-/Felswand, Holz, Wasser). Übergänge weich und unregelmäßig über eine Splat-Map statt Dual-Grid (GA25). Die Texturen erzeugt `pnpm art:build` reproduzierbar aus einem Skript | A / C |
| D7 | Licht | Echte weiche Schatten von Sonne/Mond plus Punktlichter aus der Karten-YAML (Fackeln, Feuer); Stimmung (Umgebungslicht, Sonnenfarbe und -richtung) pro Karte | A |
| D8 | Leistung | Qualitätsstufen Hoch/Mittel/Niedrig in den Optionen, automatisch vorgewählt: Render-Auflösung und Schattenkarte (2048/1024/aus). **Kein** 2D-Kartenrenderer als Fallback | A |
| D9 | Zoom | **3 feste Stufen** (Nah ≈ 7, Mittel ≈ 10, Übersicht ≈ 15 Spalten auf der kürzeren Bildschirmseite) mit weichem Übergang; Pinch und Mausrad wechseln die Stufe (keine Zoom-Tasten, U20). Ersetzt GA22 | A |
| D10 | Kamera-Rand | Die Karte lässt sich rundherum um **25 % der freien Sichtfläche** über den Rand hinausschieben. Freie Fläche = zwischen oberer und unterer Leiste, gemessen in CSS-Pixeln. Behebt den Fehler, dass die untere Leiste auf dem Handy die letzten Reihen verdeckt. Außerhalb der Karte liegt abgedunkelte Landschaft | A |
| D11 | Kartenform | Keine feste Form, je Karte frei, aber weniger länglich als bisher (eher quadratisch). Prolog, Kap. 1 und Kap. 2 werden neu gelayoutet; Ziele, Dörfer, Gegnertypen und Dialoge bleiben inhaltlich gleich, Balance per `pnpm sim` | A |
| D12 | Teamfarben 3D | Die Teamtuch-Rollen (K0–K3) werden in 3D zu Team-Materialien mit der Team-Rampe aus GA10; der Bodenring bleibt | C |
| D13 | Animationen 3D | Das FE-Set aus GA8 bleibt. Die Posen-Tabellen aus `blender_render.py` werden als glTF-Animationen exportiert (Idle, Laufen, Angriff je Waffenart, Treffer, Niedergestreckt) | C |
| D14 | Asset-Format | `public/assets/models/<id>.glb` je Figur und Requisite, Bodentexturen als PNG in `public/assets/ground/`; das Budget aus T8 (< 15 MB für Shell + Prolog) gilt weiter | C |
| D15 | Markierungen | Bewegung (blau), Angriff (rot), Gefahrenzone, Pfad und Cursor liegen als Flächen auf Feldhöhe; Antippen wählt das Feld per Strahl aus | C |
| D16 | Darstellungswerte | Kamerawinkel, Zoomstufen, Rand und Qualitätsstufen stehen in der neuen `content/render.yaml` (nicht in `balance.yaml`, das nur Regelkonstanten hält; `src/core` liest sie nie), Höhe/Bodentextur/Seitenwand/Wasser pro Gelände in `terrain.yaml`, Sonne pro Karte in der Karten-YAML (`sun`) | C |
| D17 | Umsetzung R2/R3 | Software-WebGL (kein Grafikchip, z. B. Headless-Tests) wählt automatisch „Niedrig“ und rendert mit halber Auflösung; auf „Niedrig“ stehen Bäume/Felsen der Landschaft nur `board.sceneryPropsLow` Felder um die Karte. Das 2D-Tileset (`art/tiles`) und die 2D-Requisiten-Sheets werden nicht mehr gebaut. Türen, Tore und Throne sind vorerst schlichte Kisten-Modelle, bis es Blender-Modelle gibt. Figuren sind 1,3-mal so groß wie im Blender-Maßstab (`board.figureScale`). **Leistung:** Figuren als ein Mesh mit Skelett (GPU-Skinning, ein Zeichenaufruf statt ~14), Bäume und Felsen beim Export auf rund ein Drittel der Dreiecke reduziert, Landschafts-Requisiten ohne Schattenwurf, Bildrate gedeckelt auf `board.fpsActive` (60) bei Bewegung und `board.fpsIdle` (30) in Ruhe, glTF ohne Materialien geladen. Gemessen auf Kap. 1 (Mittel): 192 → 49 Zeichenaufrufe, 4,25 → 1,04 Mio. Indizes, CPU-Last in Ruhe −74 % | C |
| D18 | Neue Kartenformen (R5) | **Prolog** 12 × 12 (je eine Waldspalte links/rechts, Ablauf unverändert). **Kap. 1** 16 × 16, neu gelayoutet: Pflasterstraße Süd → Nord, zwei Mauerriegel mit Toren, Hask neben dem Brückenkopf, Miras Dorf im Südosten (gleiche Wegstrecke wie zuvor, Plünderer erreicht es in Gegnerphase 3), neuer Torwächter `e9` (Normal/Schwer). **Kap. 2** 18 × 18: zwei Spalten Ufer- und Waldland je Seite, die zwei südlichsten Reihen entfallen; Nordwellen auf Schwer starten am Kartenrand; die Magierin steht auf Leicht ein Feld abseits des Schrein-Wegs (`m6e`). Sim (60 Läufe, verkettet, Standard): Leicht 100 / 100 / 100 %, Normal 98 / 88 / 87 % (0,08 / 0,15 / 1,65 Niedergestreckte), Schwer 75 / 49 / 50 %. Kap. 2 Normal liegt mit 1,65 über dem Korridor; das alte Kap.-2-Layout liefert hinter dem neuen Kap. 1 dieselben Werte, Ursache ist der kürzere Fortschritt in Kap. 1, nicht das Layout. Ersetzt die Werte aus U18 | C |

## Game Brief Staffel 1 (BMAD-Session 2026-10-23)

Grundlage: `concept/20-game-brief/brief.md` (BMAD `gds-create-game-brief`), Herleitung in `concept/20-game-brief/.decision-log.md`. Der Proof of Concept (Prolog, Kap. 1–2) bleibt technische Grundlage.

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| B1 | V1-Umfang | ~~P4 Vertical Slice~~ → **V1 = Staffel 1**: 3 Akte, rund 20 Story-Missionen, rund 15 Aufträge, rund 20 Story-Gefährten + Taverne, 25–30 h. Endet mit Staffelfinale, nicht mit dem Gesamtfinale. Lieferung Akt für Akt, Akt 1 = MVP | A |
| B2 | Einsatz | Leidenschaftsprojekt; P3 (Monetarisierung) bleibt geparkt | A |
| B3 | Kernfantasie & Ton | Found Family; warm-ernst (freundliche Bilder, ernste Themen) | A |
| B4 | Säulen | Jeder zählt · Ausrüstung ist der Charakter · Lesbare Taktik. „Daumenfreundlich“ ist verbindliche Randbedingung; „Fair F2P“ entfällt | A |
| B5 | Kampagnenstruktur | Akte mit je einer Region auf der Weltkarte, Missionsreihenfolge innerhalb eines Akts teils frei. Löst S4 ab: **keine Fraktionsrouten**, stattdessen viele kleine Entscheidungen → Epilog-Mosaik, Flags wirken in Staffel 2 weiter | A |
| B6 | Heimat-Burg | Suikoden-Prinzip ab Akt 2 (Akt 1 wanderndes Lager). Ein Raum pro spielerischer Funktion, keine feste Raumzahl. Erweitert G24 | A |
| B7 | Nemesis-Leutnants | 12 handgeschriebene Leutnants (4 pro Akt), fliehen nach sichtbarer Regel, kehren stärker zurück, endgültig besiegbar. Deterministisch, nicht prozedural | A |
| B8 | Zeichenstil | **Runder Chibi-Cartoon** für Porträts und Figuren (Mockup `art/mockups/style-2026-10/round_chibi_kael.png`). Löst GA5 und GA14 (Anime-Halbfiguren/-Ebene) ab; Ausarbeitung in der Art-Etappe | A |
| B9 | Audio | Folk-lastig und wärmer, Orchester nur bei Bossen/Drama, Leitmotive pro Figur/Truppe statt pro Fraktion (präzisiert GA19); Hub-, Weltkarten- und Menümusik dezent, ohne Gesang | A |

## Von Claude gesetzte Detail-Defaults [C]

Diese Werte wurden nicht einzeln abgestimmt, sondern als **Startwerte** gesetzt. Balancing im Playtest.

- Alle Formeln und Zahlen in `03-combat.md`, `04-units-progression.md`, `05-inventory-items.md`, `07-camp-economy.md`.
- Tragkraft = STR + Bewegungstyp-Bonus (statt reiner STR), damit Startausrüstung nicht sofort überlädt.
- Beutel-Gegenstände zählen nicht zum Gewicht.
- Tauschen und Konvoi-Zugriff beenden den Zug nicht (einmal pro Zug).
- Niederlage (Avatar/Kael fällt): Neustart ab Rundenbeginn (Standard/Casual) bzw. Missionsbeginn (Klassik). → siehe Offene Punkte.
- Einheit mit 2 Narben stirbt beim nächsten Erreichen von 0 TP sofort.
- Skill-Loadout: max. 4 gemeisterte Skills ausgerüstet (5 nach Klassenaufstieg).
- V1 implementiert pro Basisklasse **eine** Profiklasse; alle 12 sind spezifiziert.
- Weltkarte als einfache Knotenkarte.

## Offene Punkte (vor/während V1 klären)

| # | Frage | Vorschlag |
|---|---|---|
| O1 | Darf man in Standard/Casual eine Runde neu starten? (Soft-Reset untergräbt Permadeath) | Ja in Casual/Standard, Nein in Klassik; im Playtest beobachten |
| O2 | Niedergestreckte Einheit: Blutungs-Countdown statt „bis Missionsende“? | Erst ohne Countdown testen; Option `bleedOutTurns` im Datenmodell vorsehen |
| O3 | Kosmetik-Katalog & Preisgestaltung | Nach V1, siehe `12-monetization.md` |
| O4 | Store-Name / Markenrecherche | Vor Store-Release |
| O5 | Kommerzielle Nutzungsrechte ChatGPT-Bilder / ElevenLabs (GA26) | Vor Beginn von Art-Meilenstein A1 prüfen und dokumentieren |
| ~~O6~~ | ~~UI-Stilrichtung~~ | → entschieden: U21 (B hell) |

## Änderungshistorie

| Datum | Änderung |
|---|---|
| 2026-10-21 | Initiale Anforderungsdefinition (Grilling-Session) |
| 2026-10-22 | Grilling-Session Grafik & Audio: Abschnitt „Grafik & Audio“ (GA1–GA26) ergänzt; T3 geändert (Pixel-Draufsicht statt späterer glTF), T8 präzisiert (Kapitel-Pakete, Qualitätsstufen), S5 ergänzt (Krit-Cut-ins). V1-Scope: finale Grafik, SFX und Musik jetzt in V1 (Art-Track). Neue Dokumente 15–17 |
| 2026-10-22 | Erster Wurf V1: GA4 → GA4b (48 px), T5/T11 präzisiert (Preact 10, TS 6), neuer Abschnitt U1–U13 |
| 2026-10-22 | Einführung, Balancing, Audio: U14–U21 (UI-Stil B hell gewählt und umgesetzt, Bedienführung U20 umgesetzt), U13-Simwert ersetzt; neuer Abschnitt `06` §10 |
| 2026-10-22 | U22: App-Icon aus ChatGPT, bildschirmfüllende Hintergründe (Lager-Hub) |
| 2026-10-22 | U22 ergänzt: randlose Darstellung als iOS-Home-Bildschirm-App (`100lvh`) |
| 2026-10-22 | U22 ergänzt: Kampf füllt als iOS-Home-Bildschirm-App die ganze Höhe (`#app` positioniert) |
| 2026-10-22 | 3D-Karte (Mockup, Variante A mit 3D-Figuren): neuer Abschnitt D1–D18 (D18: neue Kartenformen und Balancing); T3, GA1, GA2, GA3, GA11, GA12, GA22, GA25 abgelöst; G2, G20, G21, GA10 ergänzt |
| 2026-10-23 | Game Brief Staffel 1 (BMAD): neuer Abschnitt B1–B9; P4, S4, GA5, GA14 abgelöst, G24, GA19 präzisiert. Neues Dokument `20-game-brief/` |
| 2026-10-23 | Protokoll eingefroren; Entscheidungen leben ab jetzt in den BMAD-Artefakten unter `concept/` |
