---
title: 'Art Direction'
project: 'Hollow Crown – Staffel 1'
date: '2026-10-23'
author: 'Marvin'
version: '1.0'
status: 'complete'
brief: 'concept/20-game-brief/brief.md'
gdd: 'concept/21-gdd/gdd.md'
narrative: 'concept/22-narrative/narrative.md'
decisions: 'concept/23-art-direction/decision-log.md'
supersedes: 'concept/15-art-direction.md (ganz); D1–D16, GA1–GA25 aus 01-decisions.md, soweit hier geregelt'
---

# Art Direction – Hollow Crown, Staffel 1

Quelle der Wahrheit für Grafik und Audio-Richtung von Staffel 1. Entscheidungen mit Begründung stehen in `decision-log.md`. Pipeline, Formate und Budgets bleiben in `16-asset-pipeline.md`, Casting und Cue-Technik in `17-audio.md`; wo diese Dokumente widersprechen, gilt dieses. **[A]** = vom Produktinhaber abgestimmt, **[C]** = vom Assistenten gesetzter Startwert.

## 1. Leitbild

**Ein warmes Spielzeug-Diorama mit runden Chibi-Figuren.** Taktik spielt auf einer hellen 3D-Miniaturlandschaft, die wie ein bemalter Spieltisch aussieht. Figuren und Porträts teilen denselben runden Chibi-Stil (B8), die UI bleibt ruhig und professionell (U21). Ernste Themen, freundliche Bilder: Ghibli-Ernst statt Grimdark.

| Ebene | Was | Stil | Quelle |
|---|---|---|---|
| **Brett** | Kampfkarte, Heimat-Burg | 3D-Diorama, Spielzeug-Look, Toon-Licht | Blender-Bauskripte → glTF, Bodentexturen per Skript |
| **Figuren** | Einheiten auf Brett und Burg | 3D-Round-Chibi, 2,5 Köpfe, gemalte Textur | Turnaround (ChatGPT) → Tripo (Bild-zu-3D) → Blender |
| **Bildebene** | Porträts, Dialog-Hintergründe, Illustrationstafeln, Cut-ins, Key Art | Round-Chibi-Cartoon (Figuren), warm gemalter Cartoon (Orte) | ChatGPT über Claude in Chrome, Prompt in `art/prompts/` |
| **UI** | HTML-Overlay | Studio-Look „B hell – Wappen & Banner“ (U21) | CSS/SVG |

**Referenzen** (Stimmung, nicht kopieren): Stil-Mockup `art/mockups/style-2026-10/round_chibi_kael.png` (verbindliche Leitreferenz), Figuren- und Orte-Moodboards in `art/mockups/characters-s1/` und `locations-s1/`; außerdem Fire Emblem Engage (Helligkeit, Lesbarkeit), Kingdom Rush und Mario + Rabbids (runde Formen, Cartoon-Effekte), Triangle Strategy (Diorama-Karte), Ghibli (warme Ernsthaftigkeit).

**Drei Regeln, die alles andere schlagen:**

1. **Lesbarkeit vor Schönheit.** Auf 375 px Breite erkennt man Team, Rolle, Waffenart und Zustand jeder Einheit in unter einer Sekunde. Kein Licht, kein Wetter und kein Effekt darf das brechen.
2. **Eine Figur, ein Stil.** Porträt und Brettfigur sind dieselbe Figur in derselben Formensprache. Wiedererkennung über Silhouette, Haarfarbe und ein großes Signaturteil.
3. **Die Jahreszeit erzählt.** Akt 1 Spätsommer, Akt 2 Herbst, Akt 3 Winter. Licht und Vegetation tragen die Dramaturgie stärker als Geometrie.

## 2. Farbwelt

### 2.1 Teamfarben (fix, Lesbarkeit)

| Team | UI-Farbe (U21) | 3D-Rampe (dunkel → hell) [C] | Wo |
|---|---|---|---|
| Spieler | `#2F64C8` | `#1E3F86` `#2F64C8` `#5C8EE6` `#A9C6F4` | Tuch/Umhang, Bodenring, Bewegungsbereich |
| Gegner | `#B83A2E` | `#7A2219` `#B83A2E` `#DB6A5C` `#F2B2A8` | Tuch/Umhang, Bodenring, Gefahrenzone |
| Dritte | `#3FA65A` | `#25693A` `#3FA65A` `#74C98A` `#BFE6C9` | Tuch/Umhang, Bodenring |
| Niedergestreckt | `#8A8D96` | – | ganze Figur entsättigt, Puls-Symbol, Verblutungs-Zähler |

- **Teamtuch:** Jede Figur trägt ein großes Stoffteil (Umhang, Schärpe, Waffenrock), das auf dem Brett die Teamfarbe annimmt (Material-Rolle K0–K3, D12). Haare, Haut, Metall und Signaturfarben bleiben individuell. [A]
- **Kompanie-Glut:** Zusätzlich bleibt das kleine glutorangefarbene Stück (`#E8743B`) jedes Aschenbanner-Mitglieds sichtbar. Seitenwechsler bekommen es beim Beitritt. Es ist Story, nicht Teamkennung. [A]
- **Bodenring:** Ellipse in Teamfarbe unter jeder Einheit, 60 % Deckkraft. Erschöpfte Einheiten: Figur auf 40 % Sättigung, Ring gestrichelt.
- Glutorange ist nie Teamfarbe und nie Markierungsfarbe (Kollision mit Feuer-Effekten).

### 2.2 Fraktionsfarben (Identität: Porträts, Banner, generische Gegner, Musik)

Neu geordnet nach den Fraktionen der Narrative. Abgeleitet aus den Moodboards. [C]

| Fraktion | Primär | Sekundär | Akzent | Emblem | Wirkung |
|---|---|---|---|---|---|
| **Aschenbanner** | Aschgrau `#5B5A5E` | Leder `#8A5A3C` | Glutorange `#E8743B` | zerrissene schwarze Fahne mit glühendem Saum | abgerissen, warm, zusammengehalten |
| **Krone / Silberne Lanze** | Silber `#C9D1DC` | Himmelblau `#6FA8DC` | Weiß `#F7F9FC` | geflügelte Lanze | edel, kühl, idealistisch |
| **Grenzheer der Eisenmark** | Eisengrau `#4A4F57` | Eisenrot `#9E3B2C` | Kiefergrün `#3E5B45` | Wyvernschädel über gekreuzten Äxten | hart, praktisch, militärisch |
| **Haus Silbermeer** | Meerblau `#1F3F6E` | Silber `#BFC6CF` | Gold `#D9A931` | Münze mit Welle | reich, glatt, berechnend |
| **Pakttempel / Paktgarde** | Elfenbein `#F4EFE6` | Gold `#D9A931` | Karmin `#A3172E` | Krone (in Akt 3 sichtbar hohl) | prunkvoll, fromm, blendend |
| **Grenzlandbanden / Kopfgeldjäger** | Erdbraun `#6B4B34` | Schmutzoliv `#6F6B3A` | Rostrot `#8E3B2E` | kein Emblem, Flicken | zusammengewürfelt |
| **Akademie** (nur Kleidung) | Dunkelviolett `#4B3A6B` | Pergament `#E8DCC0` | Tinte `#2A2440` | Kompassstern | gelehrt, streng |
| **Drachen** | Obsidian `#1E1A22` | Magma `#FF6A1A` | Schwefelgelb `#F2C94C` | – | uralt, glühend, nicht böse |

### 2.3 Elementfarben (Icons, Speedlines, Magie)

Unverändert aus `15` §9: Feuer `#F2603A`, Wind `#7BD389`, Erde `#B9874B`, Wasser `#4AA8E8`, Licht `#F7D96B`, Dunkel `#8E5BD9`.

### 2.4 Jahreszeiten (je Akt) [A]

Die Jahreszeit legt Vegetation, Grundpalette und Sonnenstand fest. Jede Karte gehört zu genau einem Akt.

| Akt | Jahreszeit | Vegetation | Leitfarben | Grundstimmung |
|---|---|---|---|---|
| 1 – Asche | Spätsommer | sattes Gras mit Goldspitzen, Weizenfelder, volle Laubbäume | Weizengold, Ocker, Saftgrün, Himmelblau | warm, staubig, Asche am Horizont |
| 2 – Glut | Herbst | Heide, Orange- und Rotlaub, braunes Gras, kahle Einzelbäume | Herbstorange, Rostrot, Heidelila, kühles Hochlandblau | windig, klar, kühl |
| 3 – Krone | Winter | Schnee auf Dächern und Blöcken, Nadelbäume, Eis an Ufern | Schneeweiß, Gold, Eisblau, Drachenrot als Akzent | festlich und bedrohlich |

### 2.5 Tageszeit und Wetter (je Mission) [A]

Jede Karten-YAML wählt `timeOfDay` und `weather` aus festen Listen; die Werte (Sonnenfarbe, Richtung, Umgebungslicht, Nebel) stehen in `content/render.yaml`. [C]

| `timeOfDay` | Licht | Untergrenze Helligkeit |
|---|---|---|
| `morning` | kühles, weiches Licht von Osten, lange Schatten | 85 % |
| `noon` | neutral-warm von oben, kurze Schatten | 100 % |
| `evening` | goldorange von Westen, lange Schatten, violetter Himmel | 80 % |
| `night` | Mondlicht blau, Punktlichter (Fackel, Feuer, Fenster) tragen | 60 % |

| `weather` | Wirkung | Akte |
|---|---|---|
| `clear` | – | alle |
| `rain` | Regenstriche, nasser Glanz auf Blöcken, Pfützen | 1, 2 |
| `fog` | Bodennebel zwischen Blöcken, Fernsicht weich | 1, 2 |
| `ash` | fallende Ascheflocken, leicht grauer Himmel | 1, 3 |
| `snow` | Schneeflocken, Schneehauben | 3 |

**Lesbarkeitsregel:** Teamfarben, Bodenringe und Markierungen werden nie vom Szenenlicht gefärbt (ungelit), nachts bekommen Figuren ein schwaches Rim-Licht. Die Untergrenze in der Tabelle gilt für Figuren, nicht für die Landschaft.

**Ruhe- und Gedenkszenen** (Narrative): Lager und Burg sind immer abendlich warm. Gedenken entsättigt alles außer Glutorange.

## 3. Brett: das Diorama [A]

Technik bleibt wie in D1–D16 (orthografische Kamera ca. 35°, Höhen nur optisch, 3 Zoomstufen, Qualitätsstufen).

**Detailgrad ist Untergrenze, nicht Stellschraube.** Maßstab ist die bestehende 3D-Karte (Prolog, Stand 2026-10-23): gemalte, detailreiche Bodentexturen (Pflaster, Erde, Gras), dichte Requisiten (Baumgruppen, Felsen, Mauerreste, Wagen), weiche Schatten. Die Art Direction darf diesen Detailgrad nicht senken; „Spielzeug-Look“ heißt helle, warme Farben und runde Formen, nicht weniger Details. Das Ergebnis muss wie ein professionelles Studio-Spiel aussehen. [A]

Der Look wird auf dieser Basis an das Stil-Mockup angeglichen:

- **Blöcke:** Felder als Diorama-Blöcke mit sichtbaren Seitenwänden, Kanten leicht abgerundet bzw. gefast (≈ 8 % der Feldbreite), keine messerscharfen Kanten. Seitenwände in warmen Erdtönen bzw. Mauerwerk, Oberkante etwas heller (Kantenlicht).
- **Farben:** hell und gesättigt, aber nicht grell. Hue-Shifting: Schatten kühler und violetter, Lichter wärmer.
- **Licht:** weiche Schatten der Sonne (D7), dazu eine dezente Umgebungsverdunkelung in Ecken und unter Requisiten. Toon-Abstufung bei Figuren und Requisiten, weicher Übergang beim Boden.
- **Bodentexturen:** gemalt, ruhig, mit wenigen großen Formen (Grasbüschel, Pflastersteine, Kiesel). Kein feines Rauschen, das auf dem Handy flimmert. Übergänge per Splat-Map (D6).
- **Wasser:** klares Türkisblau, helle Schaumkanten an Ufern und Pfeilern, leichte Wellenbewegung, abgesenkt (D3).
- **Requisiten:** Bäume als runde Kronen in 2–3 Kugeln, Häuser mit dicken Dächern und warm leuchtenden Fenstern, Zäune, Laternen, Fässer. Gleiche Outline wie die Figuren, aber dünner.
- **Umgebung außerhalb der Karte** (D10): dieselbe Landschaft, aber entsättigt und leicht unscharf, damit das Spielfeld klar abgegrenzt ist.
- **Markierungen** (D15): Bewegung als hellblaue, halbtransparente Fläche mit weicher Kante, Angriff rot, Gefahrenzone rot schraffiert, Pfad als Pfeil-Linie. Ungelit.
- **Nebel des Krieges:** nicht sichtbare Felder dunkel-entsättigt mit Blaustich, weicher Übergang über 1 Feld; Gelände bleibt erkennbar, Einheiten verschwinden.

### 3.1 Gelände-Optik

| ID | Optik | Hinweis |
|---|---|---|
| `plain` | festgetretene Erde mit vereinzelten Halmen | neutralster Boden |
| `grass` | sattes Gras je Jahreszeit, Büschel, Blumen | brennbar → Brand-Variante |
| `road` | Feldweg mit Fahrspuren bzw. Pflaster in Städten | |
| `forest` | 1–3 runde Bäume pro Feld, Stamm auf dem Feld | Feld bleibt lesbar |
| `sand` | heller Sand, Wellenlinien | |
| `mountain` | hoher Felsblock, Gras- bzw. Schneehaube je Akt | |
| `shallows` | helles Wasser mit Kieseln | animiert |
| `river` | tiefes Wasser, Strömungslinien | animiert, Uferkanten |
| `bridge` | Holz bzw. Stein | |
| `fort` | kleiner Wachturm mit Fahne | Fahne in Fraktionsfarbe |
| `throne` | Thron auf Podest | |
| `gate` | Tor in der Mauer | offen/zu |
| `village` | Haus, Tür nach Süden, Rauch | besucht: Tür offen; zerstört: `ruins` |
| `ruins` | eingestürzte Mauerreste mit Efeu | |
| `wall` | Mauer mit Zinnen | |
| `burning` | Grund + Cartoon-Flammen + orangefarbenes Punktlicht | |
| `ash` | dunkelgrauer Boden, Glutpunkte | |
| `rockwall` | runde Felsnadeln | Auftauch-Animation |

Interaktive Objekte (Türen, Truhen, Hebel, Ballisten, Dörfer) haben zwei Zustände mit kurzem Übergang und im Zielmodus ein pulsierendes Glanzlicht.

## 4. Figuren auf dem Brett [A]

### 4.1 Kanon

- **Proportionen 2,5 Köpfe**: großer runder Kopf, kurzer runder Körper, kräftige Hände, damit Waffen lesbar bleiben.
- **Formen:** weich, spielzeughaft, Detail wie im Turnaround (Nähte, Schnallen, Dellen); was unter 2 Gerätepixel fällt, trägt nur noch als Farbe.
- **Farbe und Licht:** gemalte Grundfarb-Textur aus dem Bild-zu-3D-Modell, beleuchtet vom Brettlicht; keine eigenen Normal- oder Metallkarten. Ob ein Toon-Shader oder eine Outline nötig ist, klärt der Feinabgleich mit der Karte. [C]
- **Augen und Gesicht:** in die Textur gemalt wie im Porträt; Blinzeln entfällt vorerst.
- **Blickrichtung:** Figuren drehen sich frei in 4 Richtungen; asymmetrische Signaturteile bleiben auf ihrer Seite (3D, keine Spiegelung nötig).

### 4.2 Baukasten je Rolle

Jede Rolle bzw. jeder Gegnertyp hat ein **gemeinsames Skelett mit gemeinsamen Animationen** und eine gemeinsame Silhouette (Tabelle). Jede Story-Figur ist ein **eigenes Modell aus ihrem Turnaround** mit eigenem Kopf, Frisur, Farben und genau einem großen Signaturteil (§4.6). Generische Einheiten teilen sich ein Modell je Gegnertyp und Fraktion.

| Rolle | Rumpf-Silhouette | Waffengruppen sichtbar |
|---|---|---|
| Vorkämpfer | breit, Schulterpanzer, großer Schild | Lanze, Axt, Schild |
| Plänkler | schmal, Halbumhang, leicht vorgebeugt | Schwert, Dolch |
| Schütze | Kapuze, Köcher über der Schulter | Bogen |
| Elementarist | weite Ärmel, hoher Kragen bzw. Hut | Zauberbuch mit Elementleuchten |
| Heiler | langes Gewand, Haube oder Schleier | Stab, Lichtbuch |
| Späher | geduckt, Kapuze, viele Taschen | Dolch, leichter Bogen |
| Spielmann | Federhut bzw. Mütze, Instrument auf dem Rücken | Dolch, Laute |
| Taktiker (Rhen) | langer Mantel, Kartentasche | Schwert, Zauberbuch |
| Hauptmann (Kael) | Umhang, großes Schulterstück links | Schwert, Lanze |
| Gegnertypen | Bandit (Kopftuch, Fellweste), Wolfsreiter (in Akt 1 zu Fuß mit Wolfsfell; Reittier erst nach dem MVP), Ritter (Vollrüstung, eckiger Schild), Pegasus- und Wyvernreiter (Reittier, großer Rahmen), Glut-Fanatiker (Kapuzenrobe, Flammenkrone), Untote (zerrissenes Tuch, Lichtaugen), Drache (eigenes Modell) | |

- **Profi-Wege** bekommen auf dem Rumpf **ein** neues Großteil (z. B. Bollwerk: Turmschild; Scharfschütze: Langbogen + Federhut; Bischof: Mitra).
- **Ausgerüstete Waffenart** als eigenes Modellteil in der Hand (GA9); gezeigt wird die Waffengruppe, nicht das einzelne Item.
- **Silhouettentest:** Jede Rolle muss schwarz gefüllt in Zoom „Mittel“ unterscheidbar sein.

### 4.3 Signaturteile der Story-Figuren

Das eine Teil, das auf dem Brett und im Porträt sofort erkennbar ist. Abgeleitet aus den Figuren-Moodboards. [C]

| Figur | Signaturteil | Figur | Signaturteil |
|---|---|---|---|
| Kael | großes Schulterstück links, Zopf | Rhen | Kartentasche, Glutschal |
| Brenna | dicker roter Zopf, Doppelaxt | Tobin | zu großer Helm |
| Mira | Seitenzopf mit Feder | Fenn | Kapuze mit Pflaster auf der Nase |
| Liora | langes silberweißes Haar, Kristallstab | Varek | lange Strähne übers Auge, roter Mantel |
| Ysolde | orangeroter Bob, runde Brille | Grosk | riesiger Bart, Schild mit Kinderhänden |
| Jory | Federschlapphut, Laute | Odile | strenger Dutt, weißer Gardistenrock |
| Nell | rotes Bandana, Fernrohr | Brann | sehr groß, leuchtende Steinadern |
| Amos | Glatze, Brille, Schürze | Ilka | weiße Wolfsfellkapuze |
| Sable | aschblonde Stoppeln, Rundschild | Mael | weiße Paktgarden-Rüstung, Hammer |
| Pell | blaue Stadtwachen-Mütze | Vesna | wehendes weißes Haar, Bänderstab |
| Kit | Schlüsselbund, Kopftuch | Harlan | Harfe |
| Hask | roter Irokese, Fackel | Morra | Augenklappe, Armbrust |
| Ulvric | Wolfskopf-Kapuze | Rowena | Flügelhelm, Pegasus |
| Grell | Dreispitz, Goldhaken | Brakka | türkiser Haarschnitt, Wyvern |
| Cassian | hoher Kragen, Lichtbuch | Torvald | Turmschild, weißer Bart |
| Eluned | Porzellan-Halbmaske | Gerrit (kein Kämpfer) | Kompaniebanner |

Story-NSC ohne Kampfrolle (Halvard, Seraphine, Dravn, Maelis, Gerrit) bekommen nur ein Modell, wenn sie auf einer Karte stehen; sonst reicht das Porträt.

### 4.4 Leutnants [A]

- Bodenring doppelt mit Goldkante (`#D9A931`) außen.
- Über dem Kopf ein kleiner **Groll-Wimpel** in Fraktionsfarbe mit 0–3 Kerben; bei Groll ≥ 1 zeigt eine dünne Linie zum Groll-Ziel, sobald man den Leutnant antippt.
- Flucht: Leutnant springt zurück, Rauchwölkchen, Wimpel bleibt kurz in der Luft und fällt (lesbar „kommt wieder“).

### 4.5 Animationen

FE-Set aus GA8/D13 auf jedem Rumpf: Idle (atmen, gelegentlich blinzeln), Laufen, Angriff je Waffengruppe, Treffer, Niedergestreckt; dazu **Flucht** (Leutnants) und **Jubel** (Sieg, Stufenaufstieg). Bewegung mit leichtem Squash-and-Stretch, Laufen als kleines Hüpfen. Dauer einer Angriffsanimation ≤ 600 ms bei 1×.

### 4.6 Produktion (Bild-zu-3D) [A]

Erprobt an Kael (Free-Tarif-Probe, Dateien am 2026-10-24 aus dem Repo entfernt; Ergebnis im Entscheidungslog).

Die Brettfigur muss **nicht** 1:1 wie das Porträt aussehen: Sie ist eine bewusst vereinfachte Fassung derselben Figur. [A]

1. **Porträt-Turnaround** per ChatGPT aus dem freigegebenen Porträt: vorn, Seite, hinten, A-Pose, gleiche Größe, grauer Grund (`art/turnarounds/<id>/`, Prompt in `art/prompts/<id>_turnaround.md`).
2. **Brett-Turnaround** per ChatGPT aus dem Porträt-Turnaround, stark vereinfacht: große Farbflächen, glatte Rüstung ohne Dellen, wenige große Haarsträhnen, höchstens zwei Gürtel, eine Schattenstufe, etwas dickere Outline; **ohne Waffe und ohne Scheide**; das **Teamtuch flach in Magenta (#FF00FF)** als Schlüsselfarbe (`art/turnarounds/<id>_board/`, Prompt-Vorlage `art/prompts/kael_board_turnaround.md`). Die Seitenansicht geht in das Tripo-Feld, dessen Seite sie geometrisch zeigt (Blick nach rechts = rechte Seite).
3. **Tripo** (Pro, Datenschutz „Privat“): Smart-Mesh P2.0 aus Multi-View, Quad, 3 000 Polygone, dann „Textur“. Ergebnis Kael: 3 772 Quads.
4. **Rig** in Tripo: Auto-Rig „Humanoid“ mit Mixamo-Skelett, Export GLB mit Skelett (ohne Animationen) nach `art/models/source/<id>_board_tripo.glb`. Die Animationen kommen aus der **Bibliothek** (Kaels Export `art/models/source/kael_board_tripo.glb`): idle = Inaktiv, walk = Gehen, hit = Körpertreffer_01, downed = fallen (Presets), attack = KI „one-handed sword slash“, attack_cast = Preset Zauberspruch, attack_shoot / attack_chop / attack_thrust = KI-Animationen Bogenschuss, Axthieb, Speerstoß, flee (Flucht, Leutnants) und cheer (Jubel, Sieg und Stufenaufstieg) = KI-Animationen „Fearful Retreat Pose“ und „Happy Victory Cheer“ in der zweiten Bibliotheksdatei `kael_anims_flee_cheer.glb`. Neue Bibliotheks-Animationen entstehen an Kaels Rig und werden „an Ort und Stelle“ mit exportiert.
5. **Aufbereitung** mit `pnpm art:tripo` (`tools/art/tripo_units.py` → `prepare_tripo_unit.py`, braucht Blender): Füße auf den Boden, Blick nach Süden, Höhe wie die bisherigen Figuren, Ränder der UV-Inseln auffüllen, nur Grundfarbe; Magenta → Teamtuch (Textur neutral, Vertex-Alpha mit Team-Schlüssel K2); fehlende Animationen ruheposen-relativ aus der Bibliothek übertragen, mit 12 fps und nur Rotationen neu abtasten, Angriffe und Treffer auf 0,5 s takten (Aufprall bei 0,25 s); Hand-Sockel `socket_r`/`socket_l`. Ergebnis `art/models/units/<id>.glb`, das `pnpm art:build` wie die Blender-Figuren übernimmt.
6. **Waffen** (GA9): eigene kleine Modelle je Waffengruppe (`tools/art/blender_weapons.py` → `art/models/weapons/`), zur Laufzeit an den Hand-Sockel gehängt; Zuordnung Waffengruppe → Modell, Hand, Angriffsbewegung und Ruhehaltung in `content/render.yaml` `gear`. **Offen:** Reittiere und Vierbeiner; eigene Ruhehaltung des Bogens; Kapitelpakete fürs Größenbudget.

**Budget je Brettfigur:** etwa **6 000–7 000 Dreiecke**, Textur **512 × 512** (nur Grundfarbe), **≤ 0,5 MB Transfergröße** (gzip, wie der Build-Check). Auf dem Handy ist eine Figur in der Zoomstufe „Nah“ nur rund 120 Gerätepixel hoch; mehr Auflösung ist nicht sichtbar. Große Einheiten (Reittiere, Drachen) dürfen das Doppelte haben. Kael: 6 385 Dreiecke, 0,91 MB roh, ≈ 0,4 MB übertragen. [A]

**Credits:** sparsam (Decision Log). Je Figur Smart-Mesh (100, gleich ob 1 oder 4 Varianten, also immer 4), Textur (20) und Auto-Rig (20) = **140**; Presets kosten nichts, KI-Animationen (20) nur für die Bibliothek; Requisiten und Umgebung in Blender. Stand nach Brenna: 5 805 Credits.

## 5. Bildebene [A]

### 5.1 Porträts

- **Format:** quadratisch 1:1, Halbfigur (Kopf bis Hüfte), Körper leicht gedreht, freigestellt (echter Alphakanal), kein Boden, kein Text. Quelle ≥ 1254 px.
- **Stil:** Round-Chibi-Cartoon wie die Moodboards: großer runder Kopf, große Augen, dunkelbraune weiche Outlines, einfaches glänzendes Cel-Shading, warme Farben. Alter nur über Bart, graues Haar, Falten, Narben zeigen, nie über realistische Proportionen.
- **4 Stimmungen:** `neutral`, `happy`, `angry`, `sad`. Gleiche Pose und gleicher Ausschnitt, nur Gesicht, Brauen und Schultern ändern sich. Überrascht und verletzt entstehen im Dialog über Effekte: kurzes Wackeln bzw. Hüpfen, Schreck-Symbol, rote Tönung bei verletzt.
- **Umfang:** Kernfiguren (Kompanie, Leutnants, Halvard, Seraphine, Dravn, Maelis) bekommen alle 4 Stimmungen, Nebenfiguren nur `neutral`. Söldner der Taverne: Büsten aus einem Baukasten, keine Stimmungen.
- **Rahmen:** Wappenschild als Porträtrahmen nach U21; Leutnants mit Goldkante.
- **Avatar:** 4 Porträtvorlagen bleiben das Ziel (GA23); vorhanden sind 2 (`rhen_a`, `rhen_b`).

### 5.2 Dialog-Hintergründe

- Stil des Orte-Moodboards: warm gemalter Cartoon, runde Formen, weiche Outlines, Ghibli-Wärme. Die Moodboards in `art/mockups/locations-s1/` gelten als Kandidaten für die finalen Bilder.
- Im Spiel **leicht weichgezeichnet und etwas entsättigt**, damit die Porträts klar davor stehen.
- 16:9, Hochformat-Sicherheitszone in der Bildmitte (mittleres Drittel), unteres Drittel ruhig (Dialogfenster).
- Jahreszeit passend zum Akt; Orte, die in mehreren Akten vorkommen (Glutdom, Paktwacht), bekommen eine Variante je Zustand.

### 5.3 Illustrationstafeln

Rund 11 Vollbild-Standbilder laut Narrative (Cutscenes), Round-Chibi-Figuren vor einem Hintergrund im Orte-Stil. Hochformat-tauglich: Hauptmotiv in der Mitte, oben und unten erweiterbar.

### 5.4 Cut-ins [A]

Bei Krit, Tandem, Skill-Auslösung und Leutnant-Auftritt gleitet ein diagonales Band (ca. 35 % Bildschirmhöhe) ins Bild: Porträt in Stimmung `angry`, Speedlines in Elementfarbe bzw. Fraktionsfarbe, Skillname. Dauer 0,9 s (1×) bzw. 0,5 s (2×), bei Überspringen aus. Keine eigenen Action-Illustrationen.

### 5.5 Key Art, Logo, App-Icon

- **Logo:** „HOLLOW CROWN“ in einer freundlichen, weicheren Serifenschrift (Schrift: **Fraunces**, SIL OFL, gewählt am 2026-10-25 nach Vergleich mit Alegreya SC); das O von HOLLOW ist die gesprungene hohle Goldkrone mit Glut aus dem App-Icon (U22). [A]
- **Titelbild:** Kael und Rhen am Lagerfeuer, dahinter die Paktwacht und am Himmel die Drachensilhouette; Logo-Zone oben, Hochformat.
- **Akt-Karten:** je Akt ein Vollbild zum Aktbeginn im Stil der Illustrationstafeln.

### 5.6 Item-Icons

Bilder für Inventar, Konvoi, Händler und Beute. Katalog und Regeln in `concept/21-gdd/items.md`. Getrennt von den flachen 24-px-UI-Icons der Waffengruppen (§9).

- **Ein Icon je Basis-Item** (Tier sichtbar, Seltenheit nicht); Unikate (Signatur, Legendär) mit eigenem Bild; Relikte mit einem Bild je Erwachungsstufe. Rund 139 Icons. [A]
- **Stil:** dieselbe Formensprache wie die Chibi-Figuren. Übergroße, runde, spielzeughafte Formen mit abgerundeten Spitzen und dicken Griffen, weiche dunkelbraune Outline (kräftiger als im Porträt), Cel-Shading mit zwei Schattentönen und einem klaren Glanzlicht, warme satte Farben, Licht von oben links. [C]
- **Format:** quadratisch, freigestellt (echter Alphakanal), Item zentriert auf rund 80 % der Fläche. Lange Items (Klingen, Lanzen, Stäbe, Bögen) diagonal von unten links nach oben rechts, kompakte Items (Buch, Trank, Ring, Schild) frontal und leicht gedreht. Kein Rahmen, kein Text, kein Bodenschatten, keine Hand. Master `art/items/<id>.png` mit 512 × 512 px, im Spiel 128 bzw. 256 px. [C]
- **Lesbarkeit:** Die schwarz gefüllte Silhouette zeigt bei 48 px die Waffengruppe, die Metallfarbe bei 64 px das Tier. Keine dünnen Details. [C]

| Tier | Metall | Griff und Beschläge |
|---|---|---|
| Eisen | warmes Dunkelgrau, gehämmert, matt | braune Lederwicklung, schlichtes Eisen |
| Stahl | helles Blaugrau, poliert, kräftiges Glanzlicht | dunkles Leder, Messing |
| Silber | fast Weiß, kühles Glanzlicht, feine Gravur | helles Leder, kleine Goldbeschläge |
| Mondstahl | kühles Silber mit dunklen Gravuren und Mondsichel | wie Silber |

- **Bücher:** Einband in Elementfarbe (§2.3) mit Element-Symbol; das Tier zeigen die Eckbeschläge (Leder, Messing, Silber mit Gold).
- **Unikate:** eigene Form und die Signaturfarbe des Besitzers (z. B. Brennas Glutorange-Wicklung); Leutnant-Signaturen tragen die Fraktionsfarbe (§2.2).
- **Relikte:** schlafend matt mit Patina und Rissen, erwachend mit Glutlinien in den Rissen, erwacht mit voller Glut und einzelnen Funken.
- **Detail nach Seltenheit:** Je seltener das Item im Katalog, desto mehr Oberflächendetail. Gewöhnliche Basis-Items schlicht mit klaren Farbflächen ohne Gravur, seltene mit etwas Struktur und einem kleinen Schmuckteil, Legendär und Signatur reich verziert (Gravuren, Wicklungen, Steine), Relikte am reichsten (alte Gravuren, Goldeinlagen, Glut). Basis-Items, die selten oder episch droppen, behalten ihr schlichtes Bild; das zeigt nur der Rahmen. [A]

**Seltenheit im UI-Rahmen** (nicht im Icon). Farbe und Rauten sind doppelt kodiert, damit es auch ohne Farbsehen lesbar ist. Blau kommt nicht vor, weil Blau und Rot den Teams gehören. [A]

| Stufe | Rahmenfarbe [C] | Zeichen |
|---|---|---|
| Gewöhnlich | Steingrau `#9A9488` | keine Raute |
| Selten | Türkis `#1F9E94` | 1 Raute |
| Episch | Violett `#7A4CC2` | 2 Rauten |
| Legendär | Gold `#D9A931` | 3 Rauten; Signatur zusätzlich mit Namensbanner des Besitzers |
| Relikt | Gold `#D9A931` mit Glutorange `#E8743B` | hohle Krone statt Rauten |

**Erzeugung:** ChatGPT über Claude in Chrome, parallel in mehreren Tabs; Referenzen sind nur die aktuellen Charakterbilder aus `art/mockups/characters-s1/` (Kael, Brenna, Mira, Tobin), bei Unikaten zusätzlich das Bild des Besitzers; nicht das Stil-Mockup und nicht `art/portraits/`. Zuerst 10 Testbilder (`art/prompts/items_test.md`). Die abgenommenen Tests werden zur Stilreferenz für alle weiteren. Ob danach Einzelbilder oder 3×3-Bögen entstehen, entscheidet der Test. Prompt und Abnahme je Durchgang in `art/prompts/items_<batch>.md`.

## 6. Weltkarte [A]

- **Flaches gemaltes Bild** (Produktinhaber 2026-10-24, löst die 3D-Szene vom 23./24.10. ab): `art/world/map_flat_v1.png`, Hochformat 2:3 (1024 × 1536), von ChatGPT nach der Layout-Skizze `art/world/map_guide.png` und dem Stil von `weltkarte_valmora.png` gemalt (`art/prompts/world_map.md`). Das Bild zeigt **keine Gebäude, Wege oder Schrift**; Orte, Wege, Nebel, Namen und Marker legt das Spiel als HTML darüber.
- **Aufbau:** Reise von unten nach oben: Akt 1 Grenzland (Spätsommer, Felder und Wälder, Start unten rechts), Akt 2 Eisenmark (Herbst, Tafelland mit Canyon und großer Ebene in der Mitte), Akt 3 Aurenhall und Drachengebirge (Winter, oben). Silbermeer im Westen, ein Fluss vom Gebirge zur Südwestküste. Die Akt-Grenzen laufen als weiche Wellenbänder, damit der Nebel späterer Akte ein einfacher Verlauf von oben ist.
- **35 Orte plus Heimat** auf gemalten Lichtungen (`art/world/map_placed_v1.json`, Plan in `art/world/map_layout.json`): 25 Story-Missionen (Prolog + 8, 8, 8) und 10 Nebenquests (3, 3, 4), Mindestabstand 100 px im Quellbild. Aurenhall (3-1, 3-5, 3-6, N7, N10) und die Paktwacht (Heimat, 1-6 bis 1-8) sind Gruppen von Lichtungen nebeneinander.
- **Steine:** Story-Missionen als Kreis mit Beschriftung (P, 1-1 …), Nebenquests als goldene Raute (N1 …), die Heimat mit Lager-Symbol; erledigte Orte klein und grau. Kamera: verschiebbar mit Nachgleiten, 2 Zoomstufen, Tipp auf einen Ort zoomt leicht heran.
- **Später optional:** kleine Aufsätze auf den Lichtungen (Burg, Lager, verbranntes Dorf als Variante), Drachenzeichen je Akt (Asche, Risse, Schatten) als Ebenen, Heimsuchungen und Aufträge als Wimpel bzw. Steckbrief-Symbole, Leutnants als kleine Figuren mit Groll-Wimpel.
- **Schärfe:** Der Build verdoppelt das 1024-px-Bild auf 2048 × 3072 (Lanczos plus leichte Schärfung, WebP 1,4 MB, auf Abruf); das bringt knackigere Kanten, aber keine neuen Details.
- **Offen:** Die Lichtungen wirken ohne Marker wie gleichförmige Sandflecken.

## 7. Heimat-Burg [A]

- Die **Paktwacht als 3D-Diorama**, Vorlage `paktwacht_ruine.png` und `paktwacht_heimat.png`. Akt 1 zeigt bis Mission 1-6 das wandernde Lager (ebenfalls 3D: Zelte, Lagerfeuer, Wagen), danach die Burg als Ruine mit Räumen auf Stufe 1; Ausbauteile ab Akt 2.
- **Ausbaustufen** als zusätzliche Modellteile je Raum: Stufe 1 Gerüst und Planen, Stufe 2 neues Dach und Fenster, Stufe 3 Banner, Licht und Leben (Rauch, Figuren).
- **Gefährten-Gegenstände** (Brennas Axtständer, Jorys Laute, Ysoldes Bücherstapel …) stehen als Modelle an festen Plätzen. Stirbt ein Gefährte, bleibt der Gegenstand liegen; in der Gedächtnishalle steht ein Gedenkstein.
- Antippen eines Raums öffnet ein Panel (U21) über der Ansicht; es gibt kein eigenes Raumbild.
- Licht immer abendlich warm (Narrative: Ruhe).

## 8. Effekte [A]

Cartoon-Effekte: flache, klar umrissene Formen mit Kontur, wenige große Partikel, kurze knackige Timings. Glows nur für Feuer, Magie und Drachenglut, sparsam.

| Ereignis | Effekt |
|---|---|
| Treffer (physisch) | weißer Blitz auf dem Ziel (2 Frames), Treffer-Stern, Rückstoß |
| Verfehlt | Ziel weicht aus, Wölkchen, „Verfehlt“-Text |
| Krit | Cut-in → kurzer Freeze (80 ms) → großer Treffer-Stern, Bildschirmwackeln, Schadenszahl doppelt so groß |
| Feuer | Flammenzunge mit Kontur, Funken, orangefarbenes Punktlicht |
| Wind | sichelförmige Windstreifen, Blätter |
| Erde | runde Felsbrocken brechen aus dem Boden, Staubwolken |
| Wasser | Wasserkugel platzt, Tropfen, Nass-Glanz |
| Licht | Lichtsäule von oben, goldene Rauten |
| Dunkel | violette Ranken, Licht kurz gedimmt |
| Heilung | grüne aufsteigende Plus-Funken |
| Brennen / Nass / Verlangsamt | kleine Flamme am Fuß / Tropfen / Erdklumpen an den Füßen |
| Stufenaufstieg | Lichtsäule, Jubel-Animation, Werte als Zahlen |
| Niedergestreckt | Figur sinkt zusammen, entsättigt, Puls-Symbol und Verblutungs-Zähler |
| Tod | Figur verblasst nach oben in Aschepartikeln mit Glutpunkten, Glockenschlag, kurze Stille |
| Brand breitet sich aus | Funken springen zum Nachbarfeld, Flammen bauen sich auf |
| Leutnant flieht | Rückwärtssprung, Rauchwölkchen, Wimpel fällt |

Bildschirmwackeln nur bei Krit, Tod und Drachenauftritt, abschaltbar.

## 9. Benutzeroberfläche

Verbindlich ist U21 („B hell – Wappen & Banner, Studio-Fassung“): Knochenweiß, Panels mit Unschärfe über dem Brett, Glutorange nur für Haupttaste und Panelkante, Blau/Rot nur für Teams, keine Schlagschatten, keine Verläufe, 6-px-Fasen statt Rundungen. Schriften Grenze Gotisch (Namen, Titel), Barlow (Text), Barlow Condensed (Labels, Zahlen).

Ergänzungen dieser Etappe: [C]

- **Kontrast zur runden Grafik:** Die UI bleibt bewusst eckig und ruhig; runde Formen gehören der Spielwelt, nicht dem Rahmen.
- **Icons:** einheitlicher Satz im 24-px-Raster, gefüllt, zweifarbig: Rollen (neu, ersetzt Klassen-Icons), Waffengruppen, Elemente (Kreis in Elementfarbe), Status, Ressourcen, Groll.
- **Dialogfenster:** Knochenweiß, Namensschild als Banner in Fraktionsfarbe, Porträt im Wappenschild.

## 10. Audio-Richtung

Grundlage B9 und Narrative (Audio Storytelling). Details der Produktion bleiben in `17-audio.md`, das für die neue Besetzung überarbeitet werden muss.

- **Klang:** folk-lastig und warm (Laute, Flöte, Fiedel, Rahmentrommel); Orchester nur bei Bossen, Leutnant-Finalen und Drama. Burg, Lager, Weltkarte und Menüs dezent und ohne Gesang.
- **Leitmotive pro Figur und Truppe** statt pro Fraktion: Truppen-Thema (wächst von Laute in Akt 1 zum Ensemble in Akt 3), Halvard (warme Pakt-Variante, kippt bei der Enttarnung in Moll), Drache (in Akt 1 nur ein tiefer Ton), je Gefährte ein kurzes Motiv, das bei seinem Tod solo erklingt.
- **Phasenpaare** (Spieler-/Gegnerphase als zwei Arrangements desselben Stücks) bleiben.
- **Akt-Klangfarbe:** Akt 1 Zikaden, Wind im Korn, fernes Beben; Akt 2 Wind, Wyvern-Rufe, Schmiede; Akt 3 Glocken, Schnee, Menschenmengen, tiefer Atem im Fels.
- **Stimmen:** Teilvertonung DE + EN (Barks, Groll-Zeilen, Boss-Zitate, 2 Schlüsselszenen), Rest mit Stimm-Lauten; Avatar unvertont.
- **Signaturklänge:** Beben (Drachen), Glockenschlag (Tod eines Gefährten), Funkenknistern (Glutfunke).

## 11. Asset-Umfang Staffel 1

Startschätzung zur Planung der Epics. [C]

| Asset | Umfang |
|---|---|
| 3D-Figuren (Tripo) | rund 35 Story-Figuren, rund 16 generische Gegner (Typ × Fraktion), 3 Reittiere (nach dem MVP), 2 Drachen; je ein Turnaround |
| Skelette und Animationen | 9 Rollen (7 Rollen + Taktiker + Hauptmann), rund 8 Gegnertypen, Reittiere und Drachen eigens |
| Porträts | rund 18 Kernfiguren × 4 Stimmungen + rund 20 Nebenfiguren × 1 ≈ 90 Bilder |
| Dialog-Hintergründe | rund 26 (14 aus dem Moodboard + Varianten; neu durch 8/8/8: Gewölbe der Paktwacht, Kontor am Silbermeer, Pass ins Gebirge, Pachthof, Gauklerlager, Unterstadt) |
| Illustrationstafeln | 11 + 3 Akt-Karten + Titelbild |
| Requisiten | rund 60 Modelle (davon Burg-Ausbauteile und Gefährten-Gegenstände rund 25) |
| Weltkarte | 1 flaches Bild (Hochformat 2:3), 3 Regionen; Orts-Aufsätze mit Varianten später optional (§6) |
| Bodentexturen | 8 Bodenarten × 3 Jahreszeiten |
| Item-Bilder | jedes Item (Waffen, Schilde, Rüstungen, Accessoires, Runen, Verbrauchsgüter, Glutfunke, Material) als gemaltes Bild im Round-Chibi-Cartoon-Stil per ChatGPT, quadratisch, freigestellt; Prompt in `art/prompts/`. 142 Bilder für Staffel 1; erzeugt sind 139 (60 Basiswaffen, 16 Signaturen, 5 Legendäre, 3 Relikte × 3 Stufen, 49 weitere Items), offen 3 neue Signaturen aus der Course Correction 8/8/8 (Erbstück, Letzter Vorhang, Turmfalke) (Regeln §5.6, Dateien `art/items/`) [A] |

## 12. Do & Don't

| Do | Don't |
|---|---|
| Teamfarbe auf Tuch und Ring | ganze Figuren einfärben |
| runde, weiche Formen, ein großes Signaturteil | Kleinteile, die auf dem Handy unter 2 px fallen |
| dunkelbraune Outline, Hue-Shifting in Schatten | reines Schwarz, Schatten nur dunkler gleiche Farbe |
| Jahreszeit und Tageszeit erzählen Stimmung | Licht, das Teams oder Markierungen umfärbt |
| Cartoon-Effekte, kurz und klar (≤ 600 ms bei 1×) | Partikelnebel, lange Effekte in der Gegnerphase |
| Porträts hell und freigestellt, Hintergründe weich | Porträts mit eigenem Hintergrund |
| Alter über Bart, Falten, Narben zeigen | realistische Proportionen bei älteren Figuren |
| ernste Momente über Licht, Leere und Stille | Blut, Wunden, Folter |

## 13. Offene Punkte

- **Lizenzen (GA26/O5):** kommerzielle Nutzungsrechte von ChatGPT-Bildern und ElevenLabs bleiben offen; nichts kommerziell veröffentlichen.
- **Kamerawinkel (D2):** 35° vs. 40–50° weiter im Playtest.
- **Logo-Schrift:** entschieden am 2026-10-25: Fraunces (Entscheidungslog).
- **Casting** der neuen Figuren in `17-audio.md` (Stimmbilder für 20 Gefährten und 12 Leutnants).
- **Figuren:** Rig, Animationen und Teamtuch-Maske für Tripo-Figuren (§4.6); Feinabgleich von Licht, Toon-Look und Outline mit der Karte.
- **Datenschutz:** Kaels erstes HD-Modell liegt öffentlich in der Tripo-Galerie (kostenloser Tarif); ggf. dort auf privat stellen oder löschen.

## 14. Verhältnis zum Altbestand

| Altbestand | Status |
|---|---|
| `15-art-direction.md` | abgelöst; Elementfarben, Effekt-Liste, Gelände-IDs und Lesbarkeitsregeln sind hier übernommen |
| GA1, GA2, GA5, GA7, GA10, GA12, GA14, GA16 | durch §1–§8 präzisiert bzw. abgelöst (B8: Round-Chibi statt Anime-Ebene) |
| GA3, GA6 (Pixel-Sprites) | 2D-Sprites bleiben nur als umschaltbare Alternative (D4), werden aber nicht mehr weiterentwickelt [C] |
| D1–D16 | Technik bleibt; Look nach §3, Figuren nach §4 |
| Kartentisch auf Pergament (`15` §4) | abgelöst durch die flache gemalte Weltkarte (§6) |
| Kapitel-Farbskript (`15` §4) | abgelöst durch Jahreszeit je Akt + Tageszeit je Mission (§2.4, §2.5) |
| 6 Porträt-Stimmungen (`15` §7.1) | abgelöst durch 4 Stimmungen (§5.1) |
| `16-asset-pipeline.md` | gilt weiter für Formate, Budgets und Versionierung; der Figuren-Teil (Blender-Bauskripte) wird durch den Bild-zu-3D-Weg aus §4.6 ersetzt |
| `17-audio.md` | gilt weiter für Technik und Mischung; Leitmotive und Casting nach §10 überarbeiten |
