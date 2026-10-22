# 15 – Art Direction

> Ergebnis der Grilling-Session vom 2026-10-22. Entscheidungen stehen in `01-decisions.md` (Abschnitt „Grafik & Audio“). Pipeline und Formate: `16-asset-pipeline.md`. Audio: `17-audio.md`. Beispiele: `concept/art/`.

## 1. Leitbild

**Ein modernisiertes Fire Emblem der GBA-Ära.** Taktik auf einer **Pixel-Karte in der Draufsicht**, über die eine **moderne Lichtschicht** gelegt wird („HD-Pixel“). Darüber liegt die **Anime-Ebene**: helle, klar cel-geshadete Porträts, Krit-Cut-ins, gemalte Dialoghintergründe und Key Art.

| Ebene | Was | Stil | Quelle |
|---|---|---|---|
| **Karte** | Gelände, Objekte, Einheiten, Effekte | Pixel-Art, 32 px pro Feld, Chibi-Figuren, dynamisches Licht | Tileset (KI-Entwurf + nachgepixelt), Blender-Renders (Figuren, Requisiten) |
| **Anime** | Porträts, Cut-ins, VN-Hintergründe, Key Art | Hell, saubere Linien, Cel-Shading, leicht erwachsene Gesichter | ChatGPT (Bild-KI), nachbearbeitet |
| **UI** | HTML-Overlay | Klar, vektorbasiert, Elfenbein und Nachtblau mit Goldornament | CSS/SVG |

Referenzen (Stimmung, nicht kopieren): Fire Emblem: The Sacred Stones (Karte, Lesbarkeit), Fire Emblem Engage (Helligkeit, Cut-ins), Triangle Strategy / Octopath Traveler (Licht über Pixeln), Into the Breach (Klarheit der Information), Eastward (warme Pixel-Lichtstimmungen).

**Drei Regeln, die alles andere schlagen:**
1. **Lesbarkeit vor Schönheit.** Auf 375 px Breite muss man Team, Klasse, Waffenart und Zustand jeder Einheit in unter einer Sekunde erkennen.
2. **Licht erzählt.** Die Kapitel unterscheiden sich durch Licht und Jahreszeit stärker als durch Geometrie (siehe §4).
3. **Eine Figur, zwei Maßstäbe.** Chibi auf der Karte, erwachsen im Porträt. Wiedererkennung läuft über **Silhouette, Haarfarbe und ein Signaturdetail** (siehe §6).

## 2. Kamera & Raster

> **Abgelöst durch das 3D-Brett** (`01-decisions.md` D1–D16): geneigte orthografische Kamera, 3D-Gelände und -Figuren, drei Zoomstufen. Der folgende Abschnitt beschreibt die Pixel-Draufsicht und gilt nur noch für die 2D-Figuren-Option und die Sprite-Sheets.

- **Draufsicht**, orthografisch, nicht drehbar. Norden ist oben. Eine spätere 3D-Ansicht ist möglich (Renderer-Kapselung `TileView`/`UnitView`), aber nicht geplant.
- Konvention wie bei FE: Boden wird **von oben** gezeigt, Figuren und hohe Objekte (Häuser, Bäume, Festungen) **leicht von vorn** (Schrägaufsicht). Hohe Objekte dürfen ins Feld darüber ragen.
- **Feldgröße 32 × 32 px**. Figuren-Frames 32 × 32 px; große Einheiten (Pegasus, Drache, Boss) 48 × 48 px, am Fußpunkt verankert.
- **Pixelgenau**: Zoom nur in ganzzahligen Stufen der Pixeldichte (siehe `16-asset-pipeline.md` §7), Filter `nearest`, Kamera rastet auf Bildpixel ein. Kein Unterpixel-Ruckeln, keine verschwommenen Kanten.
- Sichtbarer Ausschnitt im Hochformat: Standardzoom zeigt **9–11 Spalten** (Handy 390 pt Breite ≈ 3× Skalierung).

## 3. Farbwelt

### 3.1 Teamfarben (Lesbarkeit, fix)

| Team | Farbe | Hex (Mitte der Rampe) | Wo |
|---|---|---|---|
| Spieler | Blau | `#3D7BE0` | Teamtuch, Bodenring, Bewegungsbereich |
| Gegner | Rot | `#D9413A` | Teamtuch, Bodenring, Gefahrenzone |
| Dritte | Grün | `#3FA65A` | Teamtuch, Bodenring |
| Niedergestreckt | Grau | `#8A8D96` | ganze Figur entsättigt, Puls-Icon |

**Das Teamtuch:** Jede Figur trägt ein Stoffelement (Schärpe, Umhangfutter, Armbinde, Wimpel), das auf der Karte per Palettentausch die Teamfarbe annimmt. Haare, Haut, Metall und Signaturfarben bleiben individuell. Im Porträt trägt dieses Tuch die **Fraktionsfarbe** (für das Aschenbanner: Glutorange). So bleibt die Figur erkennbar und das Team trotzdem eindeutig.

Dazu ein **Bodenring** (Ellipse, 2 px Linie, 60 % Deckkraft) in Teamfarbe unter jeder Einheit. Erschöpfte Einheiten: Sprite auf 35 % Sättigung, Ring gestrichelt.

### 3.2 Fraktionsfarben (Identität: Porträts, UI, Banner, Musik-Leitmotive)

| Fraktion | Primär | Sekundär | Akzent | Emblem | Wirkung |
|---|---|---|---|---|---|
| **Aschenbanner** (Spieler) | Asche-Grau `#5B5A5E` | Leder `#8A5A3C` | Glutorange `#E8743B` | Zerrissene schwarze Fahne mit glühendem Saum | Abgerissen, warm, zusammengehalten |
| **Silberne Lanze** (Krone) | Silber `#C9D1DC` | Himmelblau `#6FA8DC` | Weiß `#F7F9FC` | Geflügelte Lanze | Edel, kühl, ordentlich |
| **Eisenmark** (Grenzheer) | Eisengrau `#4A4F57` | Rost `#A0522D` | Kiefergrün `#3E5B45` | Wyvernschädel über gekreuzten Äxten | Hart, praktisch, militärisch |
| **Orden der Glut** (Kirche) | Elfenbein `#F4EFE6` | Gold `#D9A931` | Karmin `#A3172E` | Flammenkrone (Krone aus Flammen) | Prunkvoll, fanatisch, blendend |
| **Drachen** | Obsidian `#1E1A22` | Magma `#FF6A1A` | Schwefelgelb `#F2C94C` | – | Uralt, glühend, bedrohlich |
| **Banditen/Marodeure** | Erdbraun `#6B4B34` | Schmutzoliv `#6F6B3A` | Rostrot `#8E3B2E` | Kein Emblem, Flicken | Zusammengewürfelt |

### 3.3 Pixel-Palette „Hollow-64“

- Eine **feste Masterpalette mit 64 Farben** für alle Karten-Assets (Tiles, Figuren, Requisiten). Aufbau: 12 Farbrampen à 4–6 Stufen mit **Hue-Shifting** (Schatten kühler/violetter, Lichter wärmer/gelber), dazu Neutrale und die drei Team-Rampen.
- Pro Figur maximal **16 Farben** plus die 4-stufige Team-Rampe.
- Umrisse: **farbige Außenlinie** (dunkelste Stufe der angrenzenden Rampe), kein reines Schwarz. Innenlinien nur, wo Formen sonst verschwimmen.
- Lichtrichtung in allen Sprites: **von oben links**. Die dynamische Lichtschicht ergänzt das, ersetzt es nicht.
- Datei: `art/palette/hollow-64.hex` (Entwurf in `concept/art/palette/`).

## 4. Welt & Kapitel-Farbskript (Akt 1)

Die Jahreszeit trägt die Dramaturgie: Akt 1 läuft vom goldenen Spätsommer bis in die Glut des Drachentempels. Die Farbtemperatur kippt von warm-sicher zu bedrohlich.

| Kapitel | Zeit & Wetter | Hauptlicht | Palette (Leitfarben) | Atmosphäre / Partikel | Musik-Leitmotiv |
|---|---|---|---|---|---|
| Prolog – Die letzte Wacht | Spätsommer, später Nachmittag | warmes Gold von Südwest, lange Schatten | Weizengold, Ocker, saftiges Grün | Pollen, Glühwürmchen gegen Ende | Aschenbanner (Folk) |
| 1 – Asche über Varnhold | Spätsommer, Abenddämmerung | Feuerschein orange, Himmel violett | Glutorange, Ruß, Ziegelrot | Funkenflug, Rauchschwaden, Ascheregen | Aschenbanner + Bedrohung |
| 2 – Der Schrein am Silberbach | Frühherbst, Morgen | kühles Silberlicht, sanft | Silberblau, Moosgrün, Schreinweiß | Bodennebel, Lichtstrahlen, fallende Blätter | Liora / Pakt-Motiv |
| 3 – Die Mauern von Grauwacht | Herbst, Nacht und Regen | Mondlicht blau, Fackeln warm | Nachtblau, nasses Grau, Fackelorange | Regen, Pfützenreflexe, Nebel des Krieges als Dunkelheit | Eisenmark (Trommeln) |
| 4 – Die Furt der Wölfe | Spätherbst, Nebelmorgen | diffuses Grau, Sonne bricht durch | Nebelgrau, Ocker, kaltes Wasser | Nebelbänke, Atemwölkchen, Pegasus-Federn | Silberne Lanze (Blech) |
| 5 – Der Drache erwacht | Beginnender Winter, im Berg | Magma von unten, rot | Obsidian, Magma, Schwefel, Tempelgold | Glut, Hitzeflimmern, herabbröckelnder Stein | Drache (tiefe Streicher) + Orden (Chor) |
| Lager | Nacht | Lagerfeuer | warmes Orange auf Dunkelblau | Funken, Sterne | Lagerthema (Folk, ruhig) |

**Regionen von Valmora** (für Weltkarte und spätere Kapitel): Grenzmarken (Ost, Steppe, Wolfsreiter), Silberbach-Tal (Flüsse, Schreine), Drachengebirge (Nord, Basalt, Tempelruinen), Aurenhall (Hauptstadt, weißer Stein, Goldkuppeln), Silbermeer-Küste (West, post-V1).

**Weltkarte** = der **Kartentisch des Taktikers**: gemalte Karte auf Pergament (Anime-Ebene, nicht Pixel), Kapitelknoten als Wachssiegel, die Route als Tintenlinie, Fraktionsgebiete als Aquarell-Lavur.

## 5. Karte (Pixel-Ebene)

### 5.1 Ebenen (von unten nach oben)

1. **Boden** – Tileset mit Autotiling (Gras, Ebene, Straße, Sand, Wasser …)
2. **Bodendetails** – Decals ohne Spielwirkung (Blumen, Steine, Risse, Pfützen); zufällig, aber deterministisch per Karten-Seed
3. **Hohe Objekte & Requisiten** – Bäume, Häuser, Mauern, Festungen, Truhen, Ballisten (Blender-Renders); y-sortiert mit Einheiten
4. **Einheiten** – Sprites mit Bodenring
5. **Overlays** – Bewegung (blau), Angriff (rot), Gefahrenzone (rot gestreift), Pfad, Geisterfigur
6. **Licht** – Ambientfarbe pro Kapitel + Punktlichter (Fackeln, Feuer, Magie)
7. **Effekte** – Partikel, Treffer, Zauber, Wetter
8. **Bühne** – Schadenszahlen, Sprechblasen, Phasenbanner (zum Teil HTML)

### 5.2 Gelände-Optik

| ID | Optik | Autotile | Hinweis |
|---|---|---|---|
| `plain` | festgetretene Erde, vereinzelt Halme | ja | neutralster Boden |
| `grass` | sattes Gras, Büschel | ja | brennbar → Brand-Variante |
| `road` | Feldweg mit Fahrspuren bzw. Pflaster in Städten | ja | |
| `forest` | 1–3 Bäume pro Feld, Krone ragt nach oben | Objekt | Feld bleibt lesbar: Fuß des Baums auf dem Feld |
| `sand` | heller Sand, Wellen | ja | |
| `mountain` | Felskuppe mit Schneehaube (Kap. 5) bzw. Gras (Prolog) | Objekt | überragt das Feld |
| `shallows` | helles Wasser mit Kieseln | ja | animiert (4 Frames) |
| `river` | tiefes Wasser, Strömungslinien | ja | animiert, Uferkanten |
| `bridge` | Holz bzw. Stein | Objekt | |
| `fort` | kleiner Wachturm mit Fahne | Objekt | Fahne in Fraktionsfarbe |
| `throne` | Thron auf Podest | Objekt | |
| `gate` | Tor in der Mauer | Objekt | offen/zu |
| `village` | Haus mit Tür nach Süden, Rauch aus dem Kamin | Objekt | besucht: Tür offen; zerstört: wird `ruins` |
| `ruins` | eingestürzte Mauerreste | Objekt | |
| `wall` | Mauer mit Zinnen | ja | |
| `burning` | Grund wie vorher + Flammen-Animation (6 Frames) + Licht | Overlay | starkes orangefarbenes Punktlicht |
| `ash` | dunkelgrauer Boden, Glutpunkte für 1 Runde | ja | |
| `rockwall` | aufgebrochene Felsnadeln | Objekt | Auftauch-Animation |

**Nebel des Krieges:** Nicht sichtbare Felder werden **dunkel-entsättigt** (Ambient −60 %, Blaustich). Am Rand liegt ein weicher Übergang über 1 Feld. Gelände bleibt erkennbar, Einheiten verschwinden. In Kap. 3 ist das die Nacht selbst; Fackeln und Laternen sind echte Lichtquellen.

### 5.3 Interaktive Objekte

Türen, Truhen, Hebel, Ballisten und Dörfer haben jeweils **zwei Zustände** (z. B. zu/offen) und einen kurzen Übergang (3–4 Frames). Interagierbare Objekte bekommen im Zielmodus ein **pulsierendes Glanzlicht**, damit sie auf dem kleinen Bildschirm auffallen.

## 6. Figuren

### 6.1 Chibi-Kanon (Karte)

- **~2,5 Köpfe hoch**: Figur ca. 24–26 px hoch im 32-px-Frame, Kopf ca. 10–11 px.
- Füße auf **y = 28** (4 px Luft unten für Bodenring und Schatten), Frame-Mittelpunkt = Feldmittelpunkt.
- Waffen dürfen den Frame nicht verlassen (Lanzen stehen schräg). Ausnahme: Angriffsframes dürfen bis 8 px ins Nachbarfeld ragen (eigene 48 × 48-Frames).
- Blickrichtungen: **unten (Süd), oben (Nord), seitlich (Ost)**; West = gespiegelt Ost. Asymmetrische Signaturdetails (Narbe, Schulterstück) werden beim Spiegeln in Kauf genommen. FE macht das genauso.

### 6.2 Klassen-Silhouetten

Jede Klasse muss **allein an der Silhouette** erkennbar sein (Test: Sprite schwarz füllen).

| Klasse | Silhouette | Waffenebene(n) |
|---|---|---|
| Taktiker (Avatar) | langer Mantel, Kartentasche, Kapuze zurückgeschlagen | Schwert, Buch |
| Hauptmann (Kael) | Umhang, ein großes Schulterstück links | Schwert, Lanze |
| Söldner | Halbumhang, schmal, Schwert an der Hüfte | Schwert |
| Soldat | Kesselhut, langer Schaft | Lanze |
| Kämpfer | breite Schultern, nackte Arme | Axt |
| Schütze | Kapuze, Köcher über der Schulter | Bogen |
| Magier | Spitzhut oder hoher Kragen, weite Ärmel | Buch (Anima) |
| Kleriker | Schleier/Haube, langes Gewand | Stab, Buch (Licht) |
| Bandit (Gegner) | Kopftuch, Bart, Fellweste | Axt |
| Ritter (Gegner) | Vollrüstung, großer Schild, quadratisch | Lanze |
| Pegasusritter (Gegner) | Flügel, 48-px-Frame | Lanze |
| Jungdrache | 48 × 48, Flügel angelegt, Schwanz | Odem (Effekt) |
| Profiklassen | Basis-Silhouette + **ein** neues Großelement (Held: Umhang lang; Hellebardier: Hellebarde + Helmbusch; Krieger: Doppelaxt; Scharfschütze: Langbogen + Federhut; Weiser: Stab-Buch-Kombi + Mantel; Bischof: Mitra) | wie Klasse |

**Waffenebenen** (als eigene Renderebene, zur Build-Zeit kombiniert): `sword`, `lance`, `axe`, `bow`, `tome` (Farbe des Leuchtens nach Element), `staff`, `shield` (Nebenhand). Gezeigt wird die **ausgerüstete Haupthand-Waffenart**, nicht das einzelne Item.

### 6.3 Story-Figuren (Design-Briefings)

Signaturdetail = das eine Merkmal, das in Chibi **und** Porträt sofort wiedererkennbar ist.

| Figur | Erscheinung | Kleidung & Ausrüstung | Farben | Signaturdetail |
|---|---|---|---|---|
| **Kael** (34, Hauptmann, Erde) | groß, dunkelbraunes Haar zum kurzen Zopf gebunden, Dreitagebart, bernsteinfarbene Augen, müder Blick | alter Brustpanzer der Silbernen Lanze, **das Lanzen-Emblem ist herausgekratzt**; aschgrauer, ausgefranster Umhang; großes Schulterstück links; Langschwert | Stahl, Aschgrau, Erdbraun, Glutorange (Schärpe) | herausgekratztes Emblem + Narbe durch die linke Augenbraue |
| **Brenna** (41, Kämpferin, Feuer) | breit, muskulös, rote Haare mit grauen Strähnen in einem dicken Zopf, Sommersprossen, Lachfalten | Lederweste mit Fellkragen, nackte Arme mit **Brandnarben-Tätowierungen**, Handaxt am Gürtel, Streitaxt | Kupferrot, Leder, Ruß, Glutorange | dicker Zopf + Fellkragen |
| **Tobin** (17, Soldat, Wind) | schlaksig, strohblonde Strubbelhaare, Zahnlücke, große Augen | gepolsterter Waffenrock (zu groß), **viel zu großer Kesselhut, der schief sitzt**, Bauernstiefel, Speer mit umwickeltem Schaft | Stroh, Leinen, Windgrün, Glutorange (Armbinde) | schiefer Kesselhut |
| **Mira** (24, Schützin, Wind) | schwarze, asymmetrisch kurze Haare mit grüner Strähne, spöttischer Mundwinkel | Wildererumhang mit eingeflochtenen Blättern, Kapuze, Langbogen, Fingerschutz | Waldgrün, Schwarz, Birkenweiß | grüne Strähne + Blätterumhang |
| **Liora** (22, Klerikerin, Licht) | lange silberweiße Haare, blassgoldene Augen, **ein Auge leicht milchig** (Seherin), ruhig | weiß-goldene Tempelrobe, Saum mit **Drachenschuppen-Muster**; Stab, dessen Kopf eine **leere Krone** ist | Weiß, Blassgold, Himmelblau | Stab mit leerer Krone (Motiv „hohle Krone“) |
| **Varek** (29, Söldner, Dunkel) | schwarze Wolfsfrisur, **violette Augen**, verwegenes Grinsen, Würfel-Ohrring | pflaumenfarbener Duellmantel mit Goldknöpfen, Halbumhang, schmales Schwert | Pflaume, Schwarz, Gold | Würfel-Ohrring + violette Augen |
| **Ysolde** (20, Magierin, Feuer) | kastanienrote Haare im hohen Dutt mit **zwei Federkielen**, scharfer Blick, Sommersprossen | zerrissene Akademierobe (Karmin/Creme), **Kettenrest einer Fessel am Handgelenk** (Grauwacht), Zauberbuch an einer Kette | Karmin, Creme, Kupfer | Federkiele im Dutt + Fesselkette |
| **Avatar „Rhen“** (Taktiker, wählbar) | 4 Porträtvorlagen (verschiedene Gesichter, Haare, Hauttöne; 2 eher maskulin, 2 eher feminin gelesen) | nachtblauer Taktikermantel mit Silberrand, Akademie-Anstecknadel (zerbrochen), Kartentasche, Handschuhe | Nachtblau, Silber, Pergament | Kartentasche + zerbrochene Anstecknadel |

**Antagonisten (V1):**

| Figur | Erscheinung | Signaturdetail |
|---|---|---|
| **Grosk** (Banditenführer, Prolog) | riesig, kahl, Kinnbart in zwei Zöpfen, Fellmantel | Eisenkiefer-Kinnschutz |
| **Hask** (Marodeur-Hauptmann, Kap. 1) | hager, Brandnarben, trägt **eine brennende Fackel** | Halbmaske aus geschwärztem Leder |
| **Morra** (Söldnerführerin, Kap. 2) | drahtig, grauer Kurzhaarschnitt, Augenklappe | Augenklappe mit eingeritzter Münze |
| **Hauptfrau Sable** (Eisenmark, Kap. 3) | streng, schwarzer Kurzhaarschnitt, kalte graue Augen | rostrote Rüstung mit **Wyvernschädel-Schulterstück** |
| **Ulvric** (Wolfsreiter, Kap. 4) | wild, geflochtener Bart mit Knochenperlen | Wolfsfell mit Kopf als Kapuze |
| **Inquisitor Cassian** (Orden, Kap. 5) | schön, kalt, blondes Haar, makellos | goldene **Sonnenmaske**, die er im Kampf abnimmt |
| **Jungdrache Ignar** (Kap. 5) | Obsidianschuppen mit **Magmarissen**, glühende Augen, junger, unfertiger Körper | Risse glühen beim Odem auf |

### 6.4 Generische Einheiten & Söldner

- Generische Gegner tragen die Kleidung ihrer **Fraktion** (Eisenmark = Rost/Eisen, Banditen = Flicken).
- Tavernen-Söldner: Klassenmodell + **3 Kopfvarianten × 4 Haarfarben × 3 Hauttöne** als austauschbare Kopf-Ebene. Ihre Porträts sind **Büsten ohne Stimmungen**, aus einem Baukasten von 12 Gesichtern.

## 7. Anime-Ebene

### 7.1 Porträts

- **Halbfigur** (Kopf bis Hüfte), Blick leicht zur Bildmitte, transparenter Hintergrund.
- **6 Stimmungen** laut `08` §7: `neutral`, `happy`, `angry`, `sad`, `surprised`, `hurt`. Gleiche Pose, nur Gesicht, Augenbrauen und Schultern ändern sich, damit der Wechsel im Dialog nicht springt.
- Linie: sauber, mittlere Stärke, leicht farbige Linien (dunkelbraun statt schwarz). Schatten: **2 Stufen Cel + 1 weicher Verlauf**, Glanzlichter in Haaren und Augen. Hintergrundlicht (Rim-Light) in Fraktionsfarbe.
- Gesichter **leicht erwachsener als Standard-Anime**: kleinere Augen als bei Moe-Stil, erkennbare Wangenknochen bei Kael, Brenna, Sable.
- Spiegelung erlaubt, falls Figur links statt rechts stehen soll. Signaturdetails wie Kaels Schulterstück dürfen dann auf der „falschen“ Seite sein.

### 7.2 Krit-Cut-ins

- Bei **Krit, Tandem-Angriff, Skill-Auslösung und Boss-Auftritt**: ein Band (ca. 35 % Bildschirmhöhe) gleitet diagonal ins Bild, mit dynamischer Illustration der Figur (Augen und Waffe), Speedlines in Elementfarbe und Name des Skills. Dauer **0,9 s** (1x) bzw. 0,5 s (2x), bei Skip aus.
- Eine Illustration pro Story-Figur plus Boss. Zusätzlich gibt es eine generische Variante je Klasse, die eingefärbt wird.

### 7.3 VN-Hintergründe

- Gemalt, **leicht weichgezeichnet** und etwas entsättigt, damit Porträts davor stehen.
- Bildformat: Quelle 2560 × 1440; **Hochformat-Sicherheitszone** = mittlere 810 × 1440 (alles Wichtige dort). Im Querformat wird das volle Bild gezeigt.
- V1-Liste: Lager (Nacht, Feuer), Karawane/Straße (Prolog), Varnhold brennend, Silberbach-Schrein, Grauwacht-Zellen, Furt im Nebel, Pakttempel-Ruine, Kriegsrat-Zelt, Kartentisch (Weltkarte).

### 7.4 Key Art & Titel

- **Titelbild:** Kael und Avatar vor der zerbrochenen, hohlen Glutkrone, im Hintergrund der erwachende Drache als Silhouette im Berg. Hochformat-tauglich mit Logo-Zone oben.
- **Kapitelkarten:** Vollbild beim Kapitelstart, gemaltes Motiv + Kapitelnummer + Titel in Gold.
- **Logo:** „HOLLOW CROWN“ in einer Serifenschrift mit Kapitälchen. Das O von HOLLOW ist eine leere Krone (Ring mit Zacken).

## 8. Licht & Effekte („HD-Pixel“)

- **Ambientlicht** pro Kapitel (Farbe + Helligkeit) laut §4, dazu **Punktlichter** (Fackel, Brand, Magie, Lagerfeuer) mit weichem Abfall. Sprites werden mit **Normal-Maps** beleuchtet, die aus Blender mitgerendert werden (siehe `16` §4). So fällt Fackellicht nachts von der richtigen Seite auf Kael.
- **Bloom** dezent, nur für Feuer, Magie und Krits.
- **Partikel rasten auf das Pixelraster ein** (Position gerundet, quadratische 1–2-px-Partikel, keine weichen Sprites). Ausnahme: Licht-Glows dürfen weich sein.
- **Bildschirmwackeln** nur bei Krit, Tod und Drachenauftritt (abschaltbar laut `09` §6).

| Ereignis | Effekt |
|---|---|
| Treffer (physisch) | 2 Frames weißer Blitz auf dem Ziel, 3–5 Funkenpixel, Rückstoß 2 px |
| Verfehlt | Ziel weicht 4 px aus, „Verfehlt“-Text |
| Krit | Cut-in → Freeze 80 ms → großer Treffer-Stern, Bildschirmwackeln, Schadenszahl doppelt so groß |
| Feuer | Flammenzunge + Funkenregen + orangefarbenes Licht |
| Wind | Sichelförmige Windstreifen, Blätter, Nebel lichtet sich |
| Erde | Felsbrocken brechen aus dem Boden, Staub |
| Wasser | Wasserkugel platzt, Tropfen, Ziel bekommt Nass-Glanz |
| Licht | Lichtsäule von oben, goldene Rauten-Partikel |
| Dunkel | violette Ranken, Licht wird kurz gedimmt |
| Heilung | grüne aufsteigende Funken, sanfter Glow |
| Brennen (Status) | kleine Flamme am Fuß, Glutpunkte |
| Nass (Status) | Tropfen fallen, Sprite leicht bläulich |
| Verlangsamt | Erdklumpen an den Füßen |
| Level-up | Lichtsäule + Werte steigen als Pixel-Zahlen auf (HTML-Popup danach) |
| Niedergestreckt | Figur sinkt zusammen, entsättigt, Puls-Icon |
| Tod | Figur verblasst nach oben in Aschepartikeln (Aschenbanner-Motiv), kurze Stille in der Musik |
| Brand breitet sich aus | Funken springen zum Nachbarfeld, dann Flammen-Aufbau 3 Frames |

## 9. Benutzeroberfläche

- **Stil:** klare Vektor-UI. Flächen Elfenbein `#F5F0E6` (hell) bzw. Nachtblau `#141B2D` (dunkel, Standard im Kampf), Rahmen 1 px Gold `#C9A24A` mit kleinen Eckornamenten (Kronenzacken), weiche Schatten.
- **Schriften** (Lizenz SIL OFL, mit Umlauten):
  - Titel und Kapitel: **Cinzel**
  - Fließtext und UI: **Nunito Sans**
  - Zahlen auf dem Brett: Pixelschrift **Silkscreen** bzw. eigene 5-px-Ziffern
- **Icons:** einheitlicher Satz, 24 px Raster, gefüllt, zweifarbig. Waffenarten, Elemente (Kreis-Embleme in Elementfarbe), Status, Ressourcen.
- **Elementfarben** (Icons, Cut-in-Speedlines, Magie):
  - Feuer `#F2603A`
  - Wind `#7BD389`
  - Erde `#B9874B`
  - Wasser `#4AA8E8`
  - Licht `#F7D96B`
  - Dunkel `#8E5BD9`
- **Kampfvorschau:** zwei Porträt-Ausschnitte (nur Gesicht), Werte in großen Ziffern, Dreieck und Element als Icons, Tandem als kleines Zweitporträt.
- **Dialogfenster:** Nachtblau, 85 % deckend, Namensschild in Fraktionsfarbe, Weiter-Pfeil pulsiert in Gold.

## 10. Do & Don't

| Do | Don't |
|---|---|
| Teamfarbe nur auf dem Teamtuch und dem Ring | ganze Figuren einfärben |
| farbige Umrisse, Hue-Shifting in Schatten | reines Schwarz, Schatten nur dunkler gleiche Farbe |
| ein Signaturdetail pro Figur, groß genug für Chibi | Details, die unter 2 px fallen |
| Licht pro Kapitel erzählt die Stimmung | jedes Kapitel gleich hell |
| ganzzahliges Skalieren, `nearest` | Zwischenstufen-Zoom, Filterung |
| Porträts hell und klar, Hintergründe weich | Porträts mit eigenem gemalten Hintergrund |
| Effekte kurz und knackig (≤ 600 ms bei 1x) | lange Effekte, die die Gegnerphase ausbremsen |
