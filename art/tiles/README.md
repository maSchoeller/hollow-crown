# art/tiles – Boden-Tileset (Dual-Grid, 48 px)

Alles in diesem Ordner ist **generiert**. Nicht von Hand bearbeiten, sondern das Skript ändern und neu erzeugen:

```
python tools/art/fx.py              # art/fx/fx.png + fx.json (zuerst, die Vorschau nutzt die Flammen)
python tools/art/tiles.py --check   # art/tiles/* + Selbsttest (Nähte, Varianten)
```

Benötigt Python 3.13, Pillow und numpy. Das Skript ist deterministisch (feste Seeds) und verwendet nur Farben aus `hollow-64.hex`.

## Dateien

| Datei | Inhalt |
|---|---|
| `<ground>.png` | 4 × 4 Kacheln à 48 px (192 × 192) für `plain, sand, road, grass, ash, wall` |
| `river_0..3.png`, `shallows_0..3.png` | animiert, 4 Frames (Vorschlag 6 fps, Schleife); `river.png`/`shallows.png` = Frame 0 |
| `<ground>_full.png` | Zeile voll bedeckter Varianten (Spalte 0 = Atlas-Index 15) für `plain, grass, sand, road, ash` (je 4) und `wall` (2) |
| `decals.png/.json` | 16 Bodendetails à 48 × 48 in einer Zeile |
| `objects.png/.json` | feldgebundene Objekte à 48 × 48 (6 Spalten) |
| `preview_map.png` | 12 × 10 Beispielkarte in 2×, exakt nach den Regeln unten zusammengesetzt |

## Regeln (gleich wie `art/README.md`)

- **Index** = Ecken-Bits `TL=1, TR=2, BL=4, BR=8`, Kachel `(i % 4, i // 4)`. Index 0 ist leer, 15 voll.
- **Versatz**: Dual-Kachel `(dx, dy)` mit `dx ∈ 0..W`, `dy ∈ 0..H` deckt die Felder `(dx−1, dy−1)`, `(dx, dy−1)`, `(dx−1, dy)`, `(dx, dy)` ab und liegt bei Pixel `(dx·48 − 24, dy·48 − 24)`. Felder außerhalb der Karte wiederholen das nächste Randfeld.
- **Schichten** von unten nach oben: `river, shallows, plain, sand, road, grass, ash, wall`. Gezeichnet werden alle Schichten von der niedrigsten bis zur höchsten vorkommenden; eine Ecke ist bedeckt, wenn `prio(Feld) ≥ prio(Schicht)`. Die niedrigste vorkommende Schicht wird überall mit Index 15 gezeichnet.
- **Varianten**: Bei Index 15 darf der Renderer eine Variante aus `<ground>_full.png` wählen, z. B. `hash(dx, dy) % n`. Alle Varianten haben denselben 3-px-Rand und kacheln miteinander.
- Referenzimplementierung: `compose()` in `tools/art/tiles.py` (lädt genau diese Dateien).

## Konventionen im Tileset

- **Verschachtelte Masken**: Eine höhere Schicht deckt an einer gemeinsamen Kante die tieferen vollständig ab. Darum schauen Zwischenschichten (z. B. `road` unter `grass` an einer Gras/Erde-Kante) nie hervor. Gras und Asche haben zusätzlich Halme, die 1–2 px über die Kante ragen.
- **Nur zwei Schichten zeichnen außerhalb ihrer Maske**: `plain` (Uferschaum und Schatten unter der Uferkante auf dem Wasser, `plain` ist die „Land“-Schicht unter jedem Landfeld) und `wall` (Schlagschatten nach Südosten, Alpha 70/120). Alles andere ist hart freigestellt.
- **Mauer**: ragt 6 px über ihr Feld hinaus, Front (Ziegel) 13 px hoch an der Südseite, Brüstung mit Zinnen an allen Kanten, Wehrgang innen. Wo tiefere Schichten weiter reichen als das Mauerwerk, liegt Schutt.
- **Licht** von oben links: helle Kanten N/W, dunkle Kanten S/O, Schatten kühl, Lichter warm (Hollow-64-Rampen).
- **Wasser**: `river` hat Strömungsstriche nach Osten (Muster mit 24 px Periode, 6 px pro Frame), `shallows` kleine Wellenkämme. Die Strömung ist richtungsfest (Ost); für Nord-Süd-Flüsse ist das ein bekannter Kompromiss.

## decals.json

`{ "cell": [48, 48], "count": n, "ground": [...], "allowed": [[...], ...], "names": [...] }`. `ground[i]` ist der Hauptboden (Format aus `art/README.md`), `allowed[i]` die vollständige Liste der erlaubten Böden, `names[i]` die ID. Die Platzierung erfolgt deterministisch pro Karten-Seed. Decals nicht auf Objektfelder setzen.

## objects.json

`{ "cell": [48, 48], "items": { "<id>": [col, row] } }`. Ids: `bridge_h`, `bridge_v`, `bridge_stone_h`, `fort_base`, `throne`, `gate_closed`, `gate_open`, `rockwall`, `cliff`, `door_closed`, `door_open`. Die Objekte liegen innerhalb ihres Feldes (keine Überhänge), werden nach dem Boden und den Decals gezeichnet und nach y sortiert. Brücken schließen nahtlos an gleichartige Nachbarn an. `gate_*`/`door_*` zeigen ein komplettes Mauerstück im Stil von `wall.png`. Bei `gate_open`/`door_open` ist der Durchgang unten halbtransparent, dort scheint der Boden durch.
