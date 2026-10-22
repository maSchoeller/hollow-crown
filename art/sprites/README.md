# art/sprites – Figuren und Requisiten (48-px-Raster)

Erzeugt mit Blender + `tools/art/` (siehe unten). Format laut `art/README.md`: `sheet.key.png` (Hollow-64, harte Alpha, Teamtuch in `#400040 #800080 #C000C0 #FF00FF`), `sheet.normal.png` (Normal × 0,5 + 0,5, gleiche Alpha), `sheet.json`.

Vorschau: `preview_units.png` (pro Figur: idle_s, walk_e, attack_e/attack_s Treffer-Frame, walk_n in Blau, dann idle_s + attack_e in Rot), `preview_props.png`.

## Einheiten (`units/<id>/`)

Zelle 72 × 72, Anker [36, 63], Zeilen `idle_s` (4, 6 fps, pingpong), `walk_s|walk_n|walk_e` (4, 10 fps), `attack_s|attack_n|attack_e` (6, 12 fps, `hitFrame` 3), `hit_s` (2), `downed_s` (1). Waffe ist ins Sheet eingebacken.

| id | Waffe / Angriff | Teamtuch | Signatur |
|---|---|---|---|
| `kael` | Langschwert, Hieb | Schärpe + Gürtelschärpe | aschgrauer Umhang, großes Schulterstück links, ausgekratztes Emblem, Zopf |
| `avatar` | Schwert, Hieb | Halstuch | nachtblauer Mantel mit Silbersaum, Kartentasche, Kapuze im Nacken |
| `brenna` | Doppelaxt, Hieb | Armbinden, Axtgriff-Wicklung | breit, roter Zopf mit grauen Strähnen, Fellkragen, nackte Arme |
| `tobin` | Speer + Holzschild, Stoß | Armbinde links | schiefer übergroßer Kesselhut, strohblond, grüner Schal, umwickelter Speer |
| `brigand` | Axt, Hieb | Kopftuch | Bart, Fellweste, Erdbraun/Oliv |
| `bandit_archer` | Bogen, Schuss | Maske vor Mund/Nase | Kapuze, Köcher |
| `grosk` | große Axt, Hieb (Maßstab 1,24) | Gürtelschärpe | kahl, Eisen-Kinnschutz, zwei geflochtene Bartzöpfe, Fellmantel |
| `mira` | Langbogen, Schuss | Gürtelband | schwarzer Bob mit grüner Strähne, Blätterumhang |
| `hask` | Axt + brennende Fackel (flackert), Hieb | Schärpe | hager, geschwärzte Halbmaske, rostroter Mantel |
| `liora` | Stab mit leerer Krone, Wirken | Stola | lange silberweiße Haare, weiß-goldene Robe, Stirnreif |
| `varek` | schmales Schwert, Hieb | Gürtelschärpe | schwarze Wolfsfrisur, pflaumenfarbener Mantel, Goldknöpfe, Halbumhang |
| `morra` | Schwert, Hieb | Schärpe + Halstuch | grauer Kurzhaarschnitt, Augenklappe mit Münze |
| `mercenary` | Schwert, Hieb | Halbumhang | Söldner-Silhouette, Scheide an der Hüfte |
| `archer` | Bogen, Schuss | Kapuze | Köcher, Armschiene |
| `fighter` | Axt, Hieb | Stirnband | breit, nackte Arme, Fellschulter |
| `mage` | Buch, Wirken (Glühen in Hand/Buch, Ausbruch vorn) | Schärpe | Spitzhut, hoher Kragen, weite Ärmel |
| `soldier` | Lanze, Stoß | Waffenrock (Tabard) | Kesselhut |

## Requisiten (`props/<id>/`)

| id | Zelle / Anker | Zeilen |
|---|---|---|
| `tree` | 96 × 96 / [48, 87] | `a` Laubbaum, `b` Tanne, `c` Birke |
| `house` | 96 × 96 / [48, 87] | `intact`, `visited` (Tür offen, Licht innen), `razed` (Wände eingestürzt, verkohlt, Glut) |
| `fort` | 96 × 96 / [48, 87] | `idle` (Wachturm; die Fahne nutzt die Team-Schlüsselfarben) |
| `wagon` | 96 × 96 / [48, 87] | `idle` (Planwagen; kleiner Wimpel in Team-Schlüsselfarbe) |
| `shrine` | 96 × 96 / [48, 87] | `idle` |
| `chest` | 72 × 72 / [36, 63] | `closed`, `open` |
| `rock` | 96 × 96 / [48, 87] | `idle` (Felskuppe, ragt nach oben) |
| `ruins` | 96 × 96 / [48, 87] | `idle` |

## Abweichungen / Hinweise

- `downed_s` steht im JSON mit `fps: 1` (statt „–“), damit kein Laufzeitcode durch 0 teilt.
- Statische Requisiten haben eine Zeile `idle` mit 1 Frame (`fps: 1`, `loop: "once"`).
- Fahne (`fort`) und Wimpel (`wagon`) sind Teamtuch, färben sich also mit der Teamfarbe. Soll die Fahne fest in einer Fraktionsfarbe bleiben, die Rolle `flag` in `tools/art/ramps.py` auf feste Palettenindizes umstellen.
- Die Waffe ist pro Einheit eingebacken (keine getrennte Waffenebene wie in `concept/16` §4.2). Für Klasse × Waffenart müsste je Kombination ein Sheet gerendert werden (Waffe = Parameter im Builder).
- In den Treffer-Frames einiger Nahkämpfer (Axt, Speer, Grosk) berühren Waffenspitze oder Schwungbogen den Zellrand um wenige Pixel; die README erlaubt dort die ganze Zelle.
- Farben pro Figur: höchstens 20 Hollow-64-Farben plus Team-Rampe (`pixelize.py` legt bei Überschreitung die seltenste Farbe auf ihre nächste Nachbarin im OKLab-Raum).
- Schwungbogen (Hieb), Speedlines (Stoß, Schuss) und Magie-Glühen sind Teil der Frames (Rolle `smear`/`glow`, ohne Umriss).

## Neu erzeugen

Voraussetzung: Blender 5.x (Pfad über `$BLENDER`, Standard `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`), Python 3.11+ mit Pillow und NumPy.

```
python tools/art/build_sprites.py --render              # alles: Blender-Durchgänge + Sheets + Vorschauen
python tools/art/build_sprites.py --render kael chest   # nur einzelne IDs
python tools/art/build_sprites.py --save-blend          # zusätzlich art/blender/hc_sprites.blend neu aufbauen
```

Ablauf:

1. `tools/art/render_cli.py` (Blender headless) baut die Figur aus `blender_units.py` / `blender_props.py` (Chibi-Rig aus Empties, Teile in `blender_parts.py`) und rendert pro Frame drei Datendurchgänge in 4-facher Größe mit Cycles (1 Sample): Rollen-ID, Kameraraum-Normale, Tiefe. Posen und Animationstabellen: `blender_render.py`.
2. `tools/art/pixelize.py` verkleinert per 4 × 4-Mehrheit (Details wie Augen haben Vorrang), schattiert per n·L (Licht oben links) auf die **Rampe der Materialrolle** (`ramps.py`, Schatten kühl/violett, Lichter warm), setzt Kontaktschatten aus der Tiefe, Innenlinien an Tiefenkanten, einen farbigen Umriss (heller auf der Lichtseite), stempelt Augen-Vorlagen (Lid, Pupille + Glanzpunkt, Iris) und schreibt die Sheets.
3. `tools/art/previews.py` erzeugt Kontaktbögen und GIFs (`python tools/art/previews.py gifs art/sprites/units/kael <outdir>`).

Neue Materialrollen immer **am Ende** von `ROLES` in `ramps.py` anhängen (die Rollen-ID ist die Position in der Tabelle). Die Rohdurchgänge landen standardmäßig in `<Temp>/hollow-crown-art-raw` und werden nicht eingecheckt.
