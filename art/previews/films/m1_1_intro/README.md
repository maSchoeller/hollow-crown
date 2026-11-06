# Film m1_1 Intro – filmische Referenz (Blender)

Referenzfassung der Filmszene `film.m1_1.intro` (Szene `scn.m1_1.intro`, Karte `m1_1_steckbriefe`): wie die Szene aussehen
könnte, wenn sie ein Animationsstudio mit den Brettfiguren dreht. Kein Spiel-Asset, nur Vorlage für Kamera, Licht und Look.

## Dateien

- `shot_NN_<zeile>.png` – je Shot ein Standbild, 720×1280, Cycles.
- `contact.png` – alle Shots als Kontaktbogen.
- `film.mp4` – Animatic des ganzen Films (12 Shots, je Shot seine `ms`, ≈ 53 s), 270×480, 12 fps, H.264.
- `camera_fixes.yaml` – Kamerakorrekturen aus den Review-Runden; der Wrapper legt sie über den Film. Werte zum Übernehmen
  in `content/acts/act1/films/film.m1_1.intro.yaml`.

## Erzeugen

```
python tools/art/film_render.py content/acts/act1/films/film.m1_1.intro.yaml            # Standbilder + Video
python tools/art/film_render.py <film> --stills --shots 3,10 --res 360x640 --samples 16 # schnelle Probe
python tools/art/film_render.py <film> --video --video-res 270x480 --video-samples 4 --fps 12
```

`tools/art/film_render.py` liest Film, Karte und Szene (Sprecher je Zeile), entpackt die meshopt-komprimierten Figuren
mit `gltfpack` (der glTF-Import von Blender 4.2 kann `EXT_meshopt_compression` nicht) und startet
`blender -b -P tools/art/blender_film.py -- <job.json>`. Blender 4.2 LTS, Python 3.12+ mit PyYAML und Pillow.

## Aufbau

- **Bühne**: Kartenraster als Mesh (Feld = 1 Einheit, Feld [x, y] → Blender (x+0.5, −(y+0.5), h)), drumherum 68×64 Felder
  Landschaft (Fluss und Uferstraße laufen weiter, Wald nach Süden, Hügel am Horizont). Boden aus einer Geländemaske
  (1 Pixel je Feld, weich überblendet und mit Rauschen verzerrt): Gras, Erde, Feldweg, Kopfsteinpflaster (Voronoi mit
  Fugen-Bump), Flussbett. Mauer und Türme als Ziegel-Material mit Zinnen. Wasser mit Brechung, Absorption und animierten Wellen.
- **Requisiten** aus `art/models/props` nach `content/core/render.yaml` (Häuser, Besuchshaus `lodge_b_intact`, Marktstände,
  Brunnen, Waldfelder, Treppen, Brücke); dazu Zäune, Wagen, Heu, Boot, Steine, Kisten, Fässer, Banner, Laternen.
  Steckbriefe (Pillow-Textur, vier Gesichter) an der Hauswand am Ufer.
- **Streu**: ≈ 175 000 Grashalm-Dreiecke (Farbverlauf zur Spitze, trockene Halme, Durchscheinen im Gegenlicht) und Blumen
  rund um die Handlung.
- **Figuren**: die Spielfiguren `art/models/units/*.glb` mit ihren Armature-Aktionen (walk, idle, cheer, hit, attack) über NLA mit
  Überblendung; Höhe 0,8 × figureScale 1,3 = 1,04 Felder wie auf dem Brett. Teamtuch über den Vertex-Alpha-Schlüssel,
  gedämpftes Blau/Rot; etwas Subsurface, kaum Spekulares (weiches Vinyl).
- **Kamera** je Shot: Hochformat, vertikales fov aus dem Film, Fahrt über `ms` mit Ease-in/out, Schnitt über Timeline-Marker.
  Tiefenschärfe auf das Gesicht des Sprechers, wenn er im Bild ist (f/2.4 bei Nahen, f/5.6 bei Totalen), sonst auf das Kameraziel.
- **Licht**: warme, tiefe Sonne (27°, aus Westsüdwest), Nishita-Himmel als kühle Füllung; je Nah-Shot ein eigenes Licht-Set,
  nur während des Shots an: weiches warmes Key neben der Kamera, kühles Fill, starkes warmes Rim hinter der Figur.
  Volumen-Dunst über der Szene (Lichtstrahlen, Tiefe), zusätzlich Mist-Pass als Luftperspektive.
- **Look**: AgX „Medium High Contrast“, Compositor: Dunst, Fog-Glow, Lift/Gamma/Gain (kühle Schatten, warme Lichter),
  leichte chromatische Dispersion; Vignette und Filmkorn danach im Wrapper (nur Standbilder).
- **Render**: Cycles CPU, Standbilder 24 Samples adaptiv + OpenImageDenoise (≈ 1–2 min je Bild auf 4 Kernen);
  Animatic 3 Samples, ohne Volumen-Dunst, mit Bewegungsunschärfe (≈ 0,5 s je Bild, 640 Bilder).

## Review-Runden

1. **Erster Durchlauf** (360×640): Figuren-Texturen zerhackt (eigenes Material ohne das UV-Mapping des glTF) → Material
   umgebaut, Mapping-Kette behalten. Totale l01: Truppe unter dem Bildrand → Endposition tiefer und weiter zurück.
   Häscher in l11 und die Truppe in l12 links und rechts außerhalb des Hochformats, l08 nur ein Auge, l03/l10 Hinterköpfe
   → Kameras korrigiert (ab hier galten die vom Parent neu gesetzten Filmwerte). Treppen von hinten (schwarze Öffnungen) gedreht,
   Fässer im Bild von l06 versetzt, Horizont leer → Hügelring.
2. **Kinolook** (nach „reicht bei weitem nicht“): tiefere warme Sonne, Key/Fill/Rim je Shot, Volumen-Dunst, Grasstreu und
   Blumen, Set-Dressing, Banner, Korn, Dispersion. Kritik: Dunst milchig, alles flau → Dunst 0,035 → 0,012, Mist schwächer,
   Himmel dunkler, Sonne stärker. Hintergründe der Nahen leere Ebene → dichterer Wald südlich. Spiegelnde Flecken auf Stirn und
   Wangen → Rauheit hoch. l12 schwarz: Kamera stand in der Brückenrampe → ans Ufer. l03/l09/l10: Sprecher im Profil oder von hinten
   → Kamera auf die Seite des Angesprochenen (Dreiviertel).
3. **Feinschliff**: helle Scheibe auf Tobins Wange → erst für einen Glanz des Key-Lichts gehalten (Key größer, Specular fast aus,
   Lichter für die Kamera unsichtbar), blieb aber in der Bildmitte: Ursache war die Ellipsen-Vignette im Compositor → Vignette und
   Filmkorn jetzt mit numpy im Wrapper. l01 halb Himmel → Ziel tiefer. Schwarze Löcher an den Brückenenden → Widerlager aus Stein.
4. **Schärfe und Nähe**: Nahe Gesichter weich, weil der Fokus in der Kopfmitte lag → Fokuspunkt auf die Gesichtsfläche, f/2.4.
   l03 erst zu nah und dann in Lucans Kopf → Kamera südöstlich auf Tobins Seite. l10 nur Stirn bis Kinn → etwas zurück.
5. **Abnahme der 720er**: l09 – die Dreiviertel-Kamera stand im Kopf des Avatars (die Truppe steht eng) → zurück auf die
   Profil-Kamera aus dem Film. l12 zeigte die Truppe nur am Bildrand → Kamera auf die Brücke (Untersicht über das Deck), fov 56.

## Offene Schwächen

- Maßstab des Bretts: Figuren (1,04) sind größer als die Häuser (≈ 0,9) – spieltreu, im Film wirkt die Stadt wie Puppenstube.
- Keine Waffen in den Händen (Sockel vorhanden, Waffenmodelle nicht angehängt); `attack` ist daher eine Leerbewegung.
- Fußrutschen beim Gehen (Schrittlänge der walk-Aktion nicht an die Wegstrecke angepasst).
- Kein Schornsteinrauch, keine Wolken; der Himmel bleibt eine helle Fläche.
- Brücke ist ein skaliertes Brett-Modell (doppelt breit), wirkt klobig; an den Enden bleibt ein dunkler Spalt.
- Animatic ohne Volumen-Dunst, Vignette und Korn, mit 3 Samples: Rauschen/Flimmern des Denoisers, nur zur Prüfung von Timing und Schnitt.
- l12 hat noch viel leeren Himmel, l01 einen leeren Vordergrund; die Totalen wirken flacher als die Nahen.
- Kein Letterbox im Bild (der Film setzt `letterbox: true`, das Spiel zeichnet die Balken selbst).
