## Epic 16: Filmszenen

Spieler erleben die wichtigsten Momente der Staffel nicht nur als Bild und Text, sondern als kurzen Film: Die Figuren laufen über die Karte, die Kamera geht nah heran, schneidet, fährt und folgt dem Dialog. Je Akt gibt es 4–5 solcher Filmszenen; später sprechen die Hauptfiguren mit eigener Stimme, und Musik und Klang tragen den Film. Angelegt am 2026-11-06 als Entwurf (Auftrag des Produktinhabers, autonom ausgearbeitet; Rückfragen offen, siehe unten).

**Grundlage:** `concept/22-narrative/narrative.md` (Story Beats, Cutscenes), `missionsliste-s1.md`, Architektur §5.8 (Szenen) und §5.12 (Rendering), Art Direction (Chibi, Tripo-Brettfiguren §4.6). Entscheidungen im Decision-Log der Architektur (2026-11-06) und der Epics.

**Leitidee:** Ein Film ist eine **Regie-Spur über einer bestehenden Szene**. Text, Sprecher, Stimmungen, Bedingungen, Gedenkzeilen und Antworten bleiben in der Szenen-YAML (eine Quelle, übersetzt wie bisher). Die Film-YAML (`content/acts/actN/films/film.<…>.yaml`) legt je Zeile einen Kamera-Shot fest, dazu Wege und Gesten der Darsteller auf der Karte der Mission. Gespielt wird **in Echtzeit in Babylon** auf dem Spielbrett als Bühne (gleiche Karten, gleiche Figuren, kein Video im Paket); Blender dient der Vorschau, dem Look und der Abnahme.

**Gilt für alle Stories:** Bild- oder Videonachweis bei 375 × 812; der Film ist überspringbar (Skip und Log der Szene) und abschaltbar (Option „Filmszenen“, dann die Visual-Novel-Szene); keine Spielregel hängt am Film; Werte in YAML; Bundle- und Paketbudget halten; KI-Assets nur nach `licensing.md` §6.

**Reihenfolge:**

```text
16.1 Filmformat ──> 16.2 Player ──> 16.3 Kinolook ──┬─> 16.9 Filme Akt 1 ──> 16.12 Leistung
16.6 Blender-Vorschau (parallel ab 16.1) ──────────┤
16.4 Bühnen ohne Kampfkarte ───────────────────────┤
16.5 Figuren für die Nähe ─────────────────────────┘
16.7 Stimmen ──┬─> in 16.9–16.11 einhängen
16.8 Musik und Klang ┘
16.10 Filme Akt 2 (mit Epic 11), 16.11 Filme Akt 3 (mit Epic 12)
```

**Stand des Entwurfs (2026-11-06):** 16.1 und 16.2 als Prototyp umgesetzt, 16.6 als Prototyp mit der Referenzszene „Ankunft in Varnhold“ (`film.m1_1.intro`, Renders in `art/previews/films/m1_1_intro/`).

### Filmszenen der Staffel (Vorschlag)

| # | Film | Szene | Bühne | Beat | Inhalt |
|---|---|---|---|---|---|
| A1-1 | Die Paktnacht | `scn.prologue.intro` | Karte des Prologs (Glutdom) | 1 | Alarm im Glutdom, der König tot, die Wachen wenden sich gegen das Aschenbanner |
| A1-2 | Gerrits Grab | `scn.prologue.outro` | Bühne Lagerfeuer (16.4) | 2 | Die Truppe begräbt den Bannerträger; Nacht, Feuer, Stille |
| A1-3 | Ankunft in Varnhold (**Referenz**) | `scn.m1_1.intro` | `m1_1_steckbriefe` | 3 | Die Truppe kommt von Süden, Steckbriefe an jeder Wand, Morras Häscher an der Brücke |
| A1-4 | Der Fremde mit dem Siegel | `scn.m1_3.outro` | `m1_3_silberbach` (Schrein) | 4 | Halvard tritt aus dem Nebel, bringt Brot und einen Namen |
| A1-5 | Das Banner auf der Ruine | `scn.m1_6.outro` | `m1_6_paktwacht` | 7 | Die Paktwacht ist erobert, das Banner geht hoch, Blick über den Wachpass |
| A2-1 | Drei Angebote | Szene nach 2-1 | Karte 2-1 (Windscharte) | 8 | Seraphine und Dravn bieten Freispruch, die Truppe zwischen den Lagern |
| A2-2 | Die Brandschneise | Szene nach 2-4 | Karte 2-4 | 9 | Dravns Lüge platzt, das Bergdorf brennt, Drachenschatten am Himmel |
| A2-3 | Die Chronik der Wächter | Burg-Szene (Beat 10) | Bühne Burg (16.4) | 10 | Liora entziffert die Aufzeichnungen, Kerzenlicht, die Truppe hört zu |
| A2-4 | Kronfeld: der Verrat | Szene in 2-8 | Karte 2-8 | 11 | Der „neutrale“ Treffpunkt wird zum Hinterhalt |
| A2-5 | „Die Krone war hohl.“ | Szene nach 2-8 | Karte 2-8 (Abend) | 12 | Nach der Schlacht wird die Wahrheit ausgesprochen |
| A3-1 | Winter über Aurenhall | Szene vor 3-1 | Karte 3-1 / Stadtbühne | 13 | Schnee über der Stadt, die Drachen erwachen sichtbar |
| A3-2 | Die Krönung | Szene in 3-5 | Karte 3-5 (Glutdom) | 14 | Die Truppe sprengt die Krönung, Halvard wird enttarnt |
| A3-3 | Das Südtor | Szene nach 3-6 | Karte 3-6 | 16 | Die Truppe hält das Tor für die Menschen, die sie gejagt haben |
| A3-4 | Der Preis | Szene nach 3-8 | Karte 3-8 | 18 | Halvard gibt sich in den Pakt |
| A3-5 | Wahrheit oder Frieden | Schluss-Szene | Bühne Glutdom (16.4) | 19 | Die letzte Entscheidung; der Film endet vor der Wahl |

Die Szenen der Akte 2 und 3 entstehen erst mit Epic 11 und 12; die Film-IDs folgen dann deren Szenen-IDs.

### Story 16.1: Filmformat und Prüfung (neu)

Als Autor
möchte ich zu einer Szene eine Regie-Spur schreiben, ohne den Text zu verdoppeln,
damit Film und Visual-Novel-Szene immer dasselbe sagen.

**Akzeptanzkriterien:**

**Angenommen** eine Szene mit Zeilen-IDs
**Wenn** `content/acts/actN/films/film.<…>.yaml` sie mit `scene`, `map`, `actors` und `shots` (je Zeile `camera` mit `from`, `to`, `end`, `fov`, `ms`; `moves`; `gestures`) begleitet
**Dann** lädt der Content-Loader den Film nach `data.films`, und `content:check` meldet unbekannte Szenen, Karten, Zeilen und Darsteller, doppelte Shots, Punkte weit außerhalb der Karte und eine zweite Regie-Spur zur selben Szene
**Und** eine Zeile ohne eigenen Shot behält den vorigen; fällt eine Zeile über `requires` weg, stimmt die Position der Figuren trotzdem (`filmCuts`, `actorSpot`, getestet).

### Story 16.2: Film-Player auf dem Spielbrett (neu)

Als Spieler
möchte ich die Szene als Film auf der Karte sehen, mit meiner Truppe in Ausrüstung und Aussehen,
damit sich die Geschichte wie ein Teil des Spiels anfühlt.

**Akzeptanzkriterien:**

**Angenommen** eine Szene mit Film, eine laufende Kampagne und die Option „Filmszenen“ an
**Wenn** die Szene startet (Knoten `pre`/`post`, Raum, Weltkarte; nicht über einem laufenden Kampf)
**Dann** baut `FilmView` die Karte mit genau den Darstellern (`filmStage`), schaltet auf eine Perspektivkamera und schneidet je Zeile auf ihren Shot; Figuren laufen ihre Wege und spielen ihre Gesten
**Und** Textbox, Auto, Log, Skip und Antworten sind die der Szene; ohne Kampagne oder mit Option aus läuft die Visual-Novel-Szene wie bisher.

### Story 16.3: Kinolook (neu)

Als Spieler
möchte ich, dass die Filme wie aus einem Animationsstudio aussehen,
damit sich die Schlüsselszenen vom Spielbrett abheben.

**Akzeptanzkriterien:**

**Angenommen** die Qualitätsstufen `low`, `mid`, `high`
**Wenn** ein Film läuft
**Dann** gibt es je Stufe abgestimmte Nachbearbeitung (Tiefenschärfe auf den Sprecher, Bloom, Vignette, Farbgrading je Akt und Tageszeit, Filmkorn), weiche Übergänge zwischen Shots (Schnitt, Blende, Abblende) und Kinobalken, alles in `render.yaml film`
**Und** die Kamera richtet die Tiefenschärfe automatisch auf den Kopf des Sprechers der Zeile, falls der Shot nichts anderes sagt.

### Story 16.4: Bühnen ohne Kampfkarte (neu)

Als Autor
möchte ich Filme auch am Lagerfeuer, in der Burg oder im Glutdom inszenieren,
damit Szenen ohne eigene Mission ebenfalls Filme sein können.

**Akzeptanzkriterien:**

**Angenommen** eine Bühne `content/acts/actN/stages/<id>.yaml` im Kartenformat ohne Gegner, Ziele und Trigger
**Wenn** ein Film `stage` statt `map` nennt
**Dann** spielt er dort, Licht und Tageszeit aus der Bühne (Nacht, Feuer als Punktlicht)
**Und** Lager und Burg verwenden die vorhandenen Modelle (Heimat-Diorama, Requisiten).

### Story 16.5: Figuren für die Nähe (neu)

Als Spieler
möchte ich in Nahaufnahmen Gefühle in den Gesichtern sehen,
damit Trauer, Wut und Freude im Chibi-Stil tragen (Risiko aus dem GDD).

**Akzeptanzkriterien:**

**Angenommen** die Stimmungen `neutral`, `happy`, `angry`, `sad` einer Zeile
**Wenn** der Sprecher in einem Shot unter `fov` 35 zu sehen ist
**Dann** zeigt seine Figur das passende Gesicht (Textur-Tausch oder Gesichts-Decal aus den Porträts) und ein paar zusätzliche Gesten (nicken, zeigen, knien, trauern) als gebackene Clips
**Und** das Figurenbudget (`packs.yaml figureBudget`) gilt weiter; Nah-Varianten nur für die Hauptfiguren.

### Story 16.6: Blender-Vorschau und Abnahme (neu)

Als Entwickler
möchte ich jeden Film vorab in Blender als Standbilder und Animatic sehen,
damit Bildaufbau, Licht und Timing abgenommen sind, bevor sie ins Spiel gehen.

**Akzeptanzkriterien:**

**Angenommen** eine Film-YAML und Blender 4.2
**Wenn** `tools/art/film_render.py <film>` läuft
**Dann** entstehen je Shot ein Standbild, ein Kontaktbogen und ein Animatic unter `art/previews/films/<film>/`, mit derselben Koordinaten-Umrechnung wie im Spiel
**Und** jede Abnahme steht mit Kritik und Änderungen in `README.md` daneben.

### Story 16.7: Stimmen der Hauptfiguren (neu)

Als Spieler
möchte ich die Hauptfiguren in den Filmen sprechen hören,
damit sie Persönlichkeit bekommen.

**Akzeptanzkriterien:**

**Angenommen** je Hauptfigur ein Stimmprofil (ElevenLabs, `ELEVENLABS_API_KEY`, Prompts und Abnahme in `art/prompts/voice_<id>.md`)
**Wenn** eine Filmzeile spricht
**Dann** spielt der Clip `vo.<sceneId>.<lineId>.<lang>` aus dem Paket `voice` der Sprache, die Zeile wartet auf sein Ende, Auto schaltet danach weiter
**Und** fehlt ein Clip, läuft die Zeile stumm wie bisher; Gedenkzeilen und Ersatzsprecher bekommen den Clip ihres tatsächlichen Sprechers.

### Story 16.8: Musik und Klang der Filme (neu)

Als Spieler
möchte ich zu jedem Film eigene Musik und Geräusche hören,
damit die Momente Gewicht bekommen.

**Akzeptanzkriterien:**

**Angenommen** ein Film
**Wenn** er läuft
**Dann** spielt sein Cue (`music` der Film-YAML, sonst der Szene), dazu Ambiente der Bühne und Schritte der laufenden Figuren
**Und** Herkunft und Lizenz jedes Stücks stehen in `licensing.md`; Suno-Musik erst nach Klärung der Lizenzfrage (offen, siehe unten).

### Story 16.9: Filme Akt 1

Als Spieler
möchte ich in Akt 1 fünf Filmszenen erleben (A1-1 bis A1-5),
damit Prolog und Akt 1 mit starken Momenten beginnen und enden.

**Akzeptanzkriterien:**

**Angenommen** 16.1–16.6
**Wenn** die fünf Film-YAMLs geschrieben, in Blender abgenommen und im Spiel geprüft sind
**Dann** laufen alle fünf auf einem Mittelklassegerät ohne Ruckler, überspringbar und mit Option aus
**Und** jede Abnahme (Kontaktbogen, Video) liegt unter `art/previews/films/`.

### Story 16.10: Filme Akt 2

Wie 16.9 für A2-1 bis A2-5, sobald die Szenen von Epic 11 stehen.

### Story 16.11: Filme Akt 3

Wie 16.9 für A3-1 bis A3-5, sobald die Szenen von Epic 12 stehen; A3-5 endet vor der Entscheidung, die Schlusstafeln bleiben.

### Story 16.12: Leistung und Rückfall

Als Spieler mit einem schwächeren Gerät
möchte ich die Geschichte trotzdem flüssig erleben,
damit kein Film das Spiel blockiert.

**Akzeptanzkriterien:**

**Angenommen** die Leistungsmessung aus Story 15.11
**Wenn** ein Film auf `low` oder mit Software-WebGL startet
**Dann** läuft er ohne Nachbearbeitung, oder die Szene fällt nach `render.yaml film.minFps` auf die Visual-Novel-Fassung zurück
**Und** ein Film lädt nichts, was das Akt-Paket nicht schon hat (Karte, Figuren, Requisiten); Stimmen kommen aus dem Paket `voice`.

### Offene Fragen an den Produktinhaber

1. **Tafeln oder Filme:** Ersetzen die Filme die geplanten Illustrationstafeln (Narrative „Cutscenes“, 11 Tafeln) ganz, teilweise, oder laufen beide (Tafel als Standbild am Filmende)?
2. **Suno:** Musik per Suno ist in `licensing.md` §6 noch nicht geregelt (Nutzungsrechte je Abo-Stufe, Kennzeichnung). Freigabe nötig, bevor 16.8 Suno-Stücke ausliefert; bis dahin ElevenLabs Music/SFX oder vorhandene Stücke.
3. **Englische Stimmen:** zuerst nur Deutsch, oder beide Sprachen zugleich?
4. **Format:** Hochformat bildfüllend (Vorschlag, wie der Prototyp) oder Querformat mit Balken?
5. **Fotorealismus:** Gewünscht ist ein Detailgrad „mal 3–4“, der filmisch wirkt. Umgesetzt ist das als Kino-Rendering im runden Chibi-Stil (Licht, Atmosphäre, Tiefenschärfe, Grading, Set-Dressing). Sollen auch die Figuren selbst realistischer werden, ist das eine Änderung der Art Direction (B8) und braucht deine Entscheidung.
6. **Szenenauswahl:** Die 15 Filme oben sind ein Vorschlag nach den Story Beats; Änderungen vor 16.9.
