# 01 – Entscheidungsprotokoll

Dieses Dokument hält **alle getroffenen Entscheidungen** fest. Es ist die verbindliche Referenz: Widerspricht ein anderes Dokument diesem Protokoll, gilt das Protokoll.

- **[A]** = mit dem Produktinhaber abgestimmt.
- **[C]** = von Claude als Default gesetzt (nicht explizit abgestimmt). Darf die Umsetzung begründet ändern; Änderung hier dokumentieren.

Änderungen an Entscheidungen: neue Zeile in „Änderungshistorie“ unten, alte Entscheidung durchstreichen, nicht löschen.

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
| T3 | Rendering | ~~Babylon.js, orthografische Kamera für das 2D-Brett; später glTF-Modelle aus Blender~~ → Babylon.js, orthografische **Draufsicht auf Pixel-Art** (~~32~~ **48** px/Feld laut GA4b, ganzzahliger Zoom, `nearest`), Thin Instances + eigener Shader (Teamtausch, Licht über Normal-Maps). 3D-Ansicht nur als spätere Option (siehe GA2) | A |
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
| G2 | Bedienung | Tap-Tap mit Geistervorschau + Aktionsleiste unten; Bewegung bis zur Aktion zurücknehmbar; Pinch-Zoom, Zwei-Finger-Pan, Langdruck = Info | A |
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
| G20 | Karten | Alle Größen (kompakt bis groß); Zoom, Minikarte, Speichern mitten in der Mission | A |
| G21 | Gelände | FE-Gelände + interaktive Objekte (Türen, Truhen, Hebel, Ballisten, Dörfer); keine Höhenstufen | A |
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
| GA1 | Leitbild | Modernisiertes Fire Emblem (GBA-Ära): Pixel-Karte + moderne Lichtschicht („HD-Pixel“), Anime-Ebene für Porträts/Cut-ins/Hintergründe/Key Art | A |
| GA2 | Kamera | Draufsicht, orthografisch, fest; Figuren/hohe Objekte leicht von vorn (FE-Konvention). Spätere 3D-Ansicht möglich, nicht geplant | A |
| GA3 | Darstellung Brett | Hybrid im Sinne von „3D bauen, 2D rendern“: Figuren und Requisiten in Blender modelliert und zu Pixel-Sprites gerendert | A |
| GA4 | Raster | ~~32 × 32 px pro Feld; Figuren-Frames 32 × 32 (Angriff/große Einheiten 48 × 48)~~ → siehe GA4b | A |
| GA4b | Raster (neu) | **48 × 48 px pro Feld**, Figuren-Zellen 72 × 72 mit Fußpunkt [36, 63] (Figur ca. 38 px hoch), Dual-Grid-Tiles 48 px. Mehr Platz für Gesichter, Signaturdetails und Waffen. Format: `art/README.md` | A |
| GA5 | Stil Anime-Ebene | Hell, klares Cel-Shading, leicht erwachsenere Gesichter | A |
| GA6 | Sprite-Produktion | Blender → Pixel: Low-Poly-Chibi auf gemeinsamem Rig, Toon-Shader, klein rendern, auf Palette Hollow-64 quantisieren | A |
| GA7 | Proportionen | Chibi, ca. 2,5 Köpfe | A |
| GA8 | Animationen V1 | FE-Set: Idle, Laufen 4 Richtungen, Angriff je Waffenart, Treffer, Niedergestreckt | A |
| GA9 | Ausrüstung sichtbar | Ausgerüstete Waffenart als eigene Ebene (nicht jedes Item) | A |
| GA10 | Teamfarben | Teamtuch per Palettentausch + Bodenring; Haare/Haut/Signatur bleiben individuell | A |
| GA11 | Gelände | Pixel-Tileset mit Autotiling (KI-Entwurf + nachgepixelt); Requisiten aus Blender | A |
| GA12 | Licht & Effekte | Pixel + dynamisches Licht (Normal-Maps), dezentes Bloom, auf Pixelraster einrastende Partikel | A |
| GA13 | UI-Stil | Klar, vektorbasiert, Elfenbein/Nachtblau mit Goldornament; Pixel-Schrift nur für Zahlen auf dem Brett | A |
| GA14 | Anime-Assets | VN-Porträts, Krit-Cut-ins, VN-Hintergründe, Key Art & Titel | A |
| GA15 | Bild-KI | ChatGPT (Abo des Produktinhabers), gesteuert über Claude in Chrome; Blender lokal per MCP. Kosten niedrig halten | A |
| GA16 | Weltstimmung | Jahreszeiten als Dramaturgie (Spätsommer → Drachenglut), Fraktionsfarben laut `15` §3.2 | A |
| GA17 | Zeitpunkt | Finale Grafik ist Teil von V1, als paralleler Art-Track A0–A5; Code nutzt bis dahin Platzhalter im finalen Format | A |
| GA18 | Stimmen | Teilvertonung DE + EN: Barks, Boss-Zitate, 2 Schlüsselszenen; Rest gelesen mit Stimm-Lauten. Avatar unvertont | A |
| GA19 | SFX & Musik | ElevenLabs (Sound Effects, Music); Musik Orchester + Folk mit Leitmotiv pro Fraktion; Spieler-/Gegnerphase als Arrangement-Paar | A |
| GA20 | Audio-Zugang | ElevenLabs-MCP (User-Scope), Key aus Umgebungsvariable `ELEVENLABS_API_KEY` | A |
| GA21 | Binärdateien | Git LFS für `.blend`, Roh-Audio, große PNGs; `public/assets` wird generiert, nicht eingecheckt | A |
| GA22 | Feldgröße/Zoom | Zoom nur in ganzzahligen Stufen, Kamera rastet auf Bildpixel ein | C |
| GA23 | Avatar-Porträts | 4 Porträtvorlagen | C |
| GA24 | Schriften | Cinzel (Titel), Nunito Sans (UI), Silkscreen (Brett-Zahlen); alle SIL OFL | C |
| GA25 | Autotiling | Dual-Grid (16 Kacheln pro Geländepaar) | C |
| GA26 | Lizenzen | Vor Produktion: kommerzielle Nutzungsrechte von ChatGPT-Bildern und ElevenLabs-Ausgaben prüfen und hier dokumentieren | offen |

## Erster Wurf V1 (Umsetzungs-Session 2026-10-22)

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| U1 | Umfang erster Wurf | Prolog + Kap. 1–2 spielbar: Kern-Kampf mit allen Regeln, Inventar/Paperdoll, Dialoge DE/EN, Lager (Kompanie, Konvoi, Händler, Schmied, Verzauberer, Heiler, Lagerfeuer, Speichern), Weltkarte, Auto-Save. **Noch nicht:** Taverne, Scharmützel/Übungsplatz, Nebel des Krieges, Krit-Cut-ins, Minikarte, Karten-Viewer (Dev-Route), Canto, Stimmungs-Porträts, Avatar-Vorlagen 3–4 | A |
| U2 | Deployment | GitHub Pages per GitHub Action (`.github/workflows/pages.yml`), LFS-Objekte im Actions-Cache | A |
| U3 | Bild-KI | Neutrale Halbfigur-Porträts (Avatar ×2, Kael, Brenna, Tobin, Mira, Liora, Varek, Grosk, Hask, Morra) + 3 VN-Hintergründe via ChatGPT; Stimmungen später | A |
| U4 | Audio | ElevenLabs; Code hat Audio-Busse und spielt vorhandene Dateien ab, ohne Dateien läuft alles stumm | A |
| U5 | Bedienung | Tippen auf einen Gegner, während eine Einheit gewählt ist, wählt automatisch das nächste Angriffsfeld und öffnet die Vorschau; zweites Tippen auf das Ziel greift an | C |
| U6 | Phasenende | Haben alle Einheiten gehandelt, endet die Spielerphase automatisch | C |
| U7 | Freie Aktionen | Waffe wechseln im Kampf nicht auf 1×/Zug begrenzt; Tauschen legt Items in den Beutel; Konvoi: 1× pro Zug je ein Item nehmen und/oder ablegen | C |
| U8 | KI-Reihenfolge | Zugreihenfolge der KI wird zu Phasenbeginn festgelegt (Kill-Chance, dann Distanz) | C |
| U9 | Dialogwahl | Auswahlantworten nur außerhalb des Kampfs, damit Replays rein bleiben | C |
| U10 | Narbe „Schwaches Auge“ | vereinfacht: −5 Krit und −5 Treffer immer (nicht nur auf Distanz ≥ 2) | C |
| U11 | Neustart (O1) | Umgesetzt wie der Vorschlag in O1: Runde neu starten in Standard/Casual, Mission neu starten in allen Modi. **O1 bleibt offen** (Playtest) | C |
| U12 | Generische Einheiten | Klassen haben `base`/`growth` für generische Einheiten; Stufe L = Basis + ⌊Wachstum × (L−1)⌋, dann Schwierigkeits-Prozent | C |
| U13 | Kapitel 2 | Liora ist dritte Partei mit Profil `hold`, schließt sich nach dem Sieg an; Wellen in Runde 3/5/7; Sim-Siegquote ~40–50 % mit dem einfachen Sim-Spieler (ohne Bergen), Feinbalancing im Playtest | C |

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

## Änderungshistorie

| Datum | Änderung |
|---|---|
| 2026-10-21 | Initiale Anforderungsdefinition (Grilling-Session) |
| 2026-10-22 | Grilling-Session Grafik & Audio: Abschnitt „Grafik & Audio“ (GA1–GA26) ergänzt; T3 geändert (Pixel-Draufsicht statt späterer glTF), T8 präzisiert (Kapitel-Pakete, Qualitätsstufen), S5 ergänzt (Krit-Cut-ins). V1-Scope: finale Grafik, SFX und Musik jetzt in V1 (Art-Track). Neue Dokumente 15–17 |
| 2026-10-22 | Erster Wurf V1: GA4 → GA4b (48 px), T5/T11 präzisiert (Preact 10, TS 6), neuer Abschnitt U1–U13 |
