## Epic 8: Chibi-Stil, Item-Bilder und Audio

Spieler sehen und hören Akt 1 im Stil der Art Direction: Tripo-Figuren, Porträts mit Stimmungen, gemalte Item-Bilder, warmes Licht und Effekte, folk-lastige Musik und vertonte Schlüsselzeilen. Bilder per ChatGPT über Claude in Chrome mit Prompt und Abnahme in `art/prompts/`.

### Story 8.1: Tonbruch-Test mit einer Gedenkszene

Als Produktinhaber
möchte ich früh prüfen, ob der Chibi-Stil einen Tod ernst genug trägt,
damit das größte Stilrisiko vor der Massenproduktion geklärt ist.

**Akzeptanzkriterien:**

**Angenommen** Fenns Porträt in 4 Stimmungen, ein Dialog-Hintergrund und die Abschieds-Karte (Story 6.7)
**Wenn** die Gedenkszene im Spiel läuft
**Dann** bewerten Produktinhaber und 2–3 Tester, ob der Stil den Tod verharmlost (Brief-Risiko „Tonbruch“)
**Und** das Ergebnis steht in `concept/23-art-direction/decision-log.md`.

### Story 8.2: Tripo-Pipeline vervollständigen

Als Entwickler
möchte ich jede neue Tripo-Figur ohne Handarbeit und ohne zusätzliche KI-Animationen ins Spiel bringen,
damit alle Figuren gleich aussehen, ins Budget passen und Credits sparen.

**Akzeptanzkriterien:**

**Angenommen** die bestehende Pipeline `pnpm art:tripo` (Teamtuch per Magenta-Schlüssel, Animationen mit 12 fps, Skript-Schwert an der Hand; Art Direction §4.6)
**Wenn** die Story umgesetzt ist
**Dann** gibt es eine Bibliothek der Waffengruppen (Schwert, Lanze, Axt, Bogen, Buch, Stab, Schild, Dolch, Laute) als Modellteile an der Hand, passend zur ausgerüsteten Waffengruppe
**Und** Animationen eines Skeletttyps (inklusive Flucht und Jubel) lassen sich in Blender auf weitere Figuren übertragen, sodass je Skeletttyp höchstens eine KI-Animation nötig ist.

**Angenommen** eine aufbereitete Figur
**Wenn** `pnpm art:build` läuft
**Dann** landet sie im Paket ihres ersten Auftritts (`public/assets/<pack>/models/`, Epic 7)
**Und** jede Figur liegt bei ≤ 7 000 Dreiecken, 512er-Textur und ≤ 0,5 MB Transfergröße; der Build meldet Ausreißer.

### Story 8.3: Brettfiguren für Akt 1

Als Spieler
möchte ich jede Story-Figur und jeden Gegnertyp von Akt 1 auf dem Brett wiedererkennen,
damit Porträt und Figur zusammengehören.

**Akzeptanzkriterien:**

**Angenommen** die Story-Figuren von Akt 1 (Rhen in 2 Varianten, Kael, Brenna, Tobin, Fenn, Mira, Liora, Ysolde, Varek, Grosk), die Leutnants Hask, Morra, Ulvric, Grosk und die Gegnertypen Bandit, Wolfsreiter, Söldner, Tempelwache
**Wenn** sie über Turnaround → Tripo → Pipeline entstanden sind
**Dann** besteht jede Rolle den Silhouettentest in Zoom „Mittel“ und trägt ihr Signaturteil (Art Direction §4.3)
**Und** Prompts und Abnahmen liegen in `art/prompts/`.

### Story 8.4: Porträts mit Stimmungen für Akt 1

Als Spieler
möchte ich Gesichter, die Gefühle zeigen,
damit Szenen tragen.

**Akzeptanzkriterien:**

**Angenommen** die Moodboard-Porträts aus `art/mockups/characters-s1/`
**Wenn** die Kernfiguren von Akt 1 final sind
**Dann** haben sie 4 Stimmungen (`neutral`, `happy`, `angry`, `sad`) in gleicher Pose, freigestellt; Nebenfiguren nur `neutral`
**Und** die alten Anime-Porträts in `art/portraits/` werden ersetzt und die Veraltet-Hinweise entfernt.

### Story 8.5: Item-Bilder

Als Spieler
möchte ich jedes Item als gemaltes Bild sehen,
damit Ausrüstung so lebendig wirkt wie die Figuren.

**Akzeptanzkriterien:**

**Angenommen** alle Items, Runen, Verbrauchsgüter, Glutfunke und Materialien, die in Akt 1 vorkommen
**Wenn** ihre Bilder per ChatGPT im Round-Chibi-Stil entstanden sind (quadratisch, freigestellt, einheitliches Licht)
**Dann** zeigen Inventar, Händler, Beute, Vorschau und Ergebnis sie statt Platzhaltern
**Und** `content:check` meldet Items ohne Bild.

### Story 8.6: Licht, Wetter und Effekte auf dem Brett

Als Spieler
möchte ich ein warmes, lebendiges Diorama mit klaren Effekten,
damit Kämpfe schön und trotzdem lesbar sind.

**Akzeptanzkriterien:**

**Angenommen** `timeOfDay` und `weather` je Karte und die Presets in `render.yaml` (Art Direction §2.5)
**Wenn** eine Karte geladen wird
**Dann** gelten Jahreszeit des Akts, Tageszeit und Wetter; Teamfarben, Bodenringe und Markierungen bleiben ungelit
**Und** die Effekte aus Art Direction §8 (Cartoon-Treffer, Elemente, Status, Krit mit Cut-in, Leutnant-Flucht, Tod in Asche) laufen ≤ 600 ms bei 1×; Bildschirmwackeln ist abschaltbar.

### Story 8.7: Titelbild, Logo und Dialog-Hintergründe von Akt 1

Als Spieler
möchte ich beim Start und in Szenen Bilder im Stil der Welt sehen,
damit der erste Eindruck stimmt.

**Akzeptanzkriterien:**

**Angenommen** das Titelbild (Kael und Rhen am Lagerfeuer), das Logo mit Kronen-O und die Orte von Akt 1 aus dem Moodboard
**Wenn** sie final sind
**Dann** zeigen Titel und Szenen sie; Hintergründe im Spiel leicht weichgezeichnet und entsättigt, Hochformat-Sicherheitszone in der Mitte
**Und** die Logo-Schrift ist aus den Kandidaten der Art Direction gewählt und im Log vermerkt.

### Story 8.8: Musik und Klang von Akt 1

Als Spieler
möchte ich warme, folk-lastige Musik und klare Klänge,
damit Akt 1 nach Spätsommer und Aufbruch klingt.

**Akzeptanzkriterien:**

**Angenommen** ElevenLabs (MCP oder `tools/audio/elevenlabs.py`)
**Wenn** die Stücke für Weltkarte, Lager, Kampf (Phasenpaar), Leutnant und Gedenken sowie die Signaturklänge (Glockenschlag, Funkenknistern, Beben) entstanden sind
**Dann** spielt das Spiel sie nach `17-audio.md` und dem Mischkonzept aus U19; Hub-Musik ohne Gesang
**Und** Lizenzfrage GA26 bleibt offen; nichts wird kommerziell veröffentlicht.

### Story 8.9: Teilvertonung von Akt 1

Als Spieler
möchte ich die wichtigsten Zeilen hören,
damit Gefährten und Leutnants eine Stimme haben.

**Akzeptanzkriterien:**

**Angenommen** Barks der Akt-1-Gefährten, Groll- und Fluchtzeilen der Akt-1-Leutnants und die Schlüsselszene „Gerrits Grab“
**Wenn** sie in DE und EN vertont sind (eine mehrsprachige Stimme je Figur)
**Dann** liegen sie im Paket `voice.act1.<lang>` und spielen zur passenden Zeile; Untertitel sind immer an
**Und** fehlt eine Aufnahme, läuft die Zeile ohne Ton weiter.

### Story 8.10: Verdeckte Figuren bleiben sichtbar

Als Spieler
möchte ich jede Figur sehen, auch wenn sie hinter oder in einem Haus, Turm, einer Ruine oder einem Baum steht,
damit ich keine Einheit übersehe.

**Akzeptanzkriterien:**

**Angenommen** die Kamera des Bretts (Neigung `camera.tiltDeg`, Blick von Süden) und eine Requisite, die eine Figur auf demselben Feld oder auf Feldern nördlich davon um mindestens `board.fade.cover` Felder ihrer Höhe verdeckt
**Wenn** eine Einheit (Spieler oder Gegner) dort steht, hinzieht oder beim Aufstellen dort landet
**Dann** wird die Requisite halbdurchsichtig („schleierhaft“, Deckkraft `board.fade.alpha` in `render.yaml`), die Figur bleibt erkennbar
**Und** verlässt die Einheit das Feld, ist die Requisite sofort wieder deckend; neu berechnet wird nur, wenn sich ein Feld einer Einheit ändert, nie jedes Bild.

### Story 8.11: Abwechslungsreiche Karten und Besuchshäuser

Als Spieler
möchte ich Karten mit unterschiedlichen Häusern, Bäumen und Felsen sehen und sofort erkennen, welche Häuser ich besuchen soll,
damit die Brettwelt lebendig wirkt und ich keine Ziele suchen muss.

**Akzeptanzkriterien:**

**Angenommen** die Requisiten-Bibliothek (Häuser, Bäume je Jahreszeit, Felsen, Brunnen, Zauntor) mit mehreren Varianten je Klasse
**Wenn** eine Karte aufgebaut wird
**Dann** wählt sie die Variante je Feld deterministisch (Feld-Hash plus Seed, optional `propVariants` im Karten-YAML), nie mit `Math.random`; gleiche Nachbarn werden vermieden
**Und** Besuchsziele sind ein eigenes, deutlich erkennbares Haus („lodge“: blaugrünes Dach, Schild, Banner, Laterne; besucht: Tür offen, Banner eingeholt), das sich von Kulissenhäusern abhebt
**Und** das Ziel heißt überall „Häuser besuchen“ (DE/EN: Zieltext, Kontext-Band, Toast, KI-Text); echte Dörfer als Handlungsorte bleiben „Dorf“
**Und** ein Tipp auf das Nebenziel in der Zielanzeige markiert die offenen Ziel-Orte auf dem Brett (Besuch, Truhen, Anwerben, Schutz, Boss), ein zweiter Tipp oder `board.markMs` löscht sie
**Und** die neuen Modelle liegen im Paket `act1`, nicht im ersten Download; die Bildrate bleibt über den Zielen aus Story 7.8.
