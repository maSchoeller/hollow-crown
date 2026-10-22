# art/ – Asset-Quellen

Quellen für alle Spielgrafiken. `pnpm art:build` kopiert die fertigen Sheets nach `public/assets/` (generiert, nicht eingecheckt) und schreibt die Manifeste. Stil: `concept/15-art-direction.md`, Pipeline: `concept/16-asset-pipeline.md`.

**Raster: 48 px pro Feld** (Entscheidung GA4b in `concept/01-decisions.md`, ersetzt 32 px).

## Ordner

| Ordner | Inhalt | Erzeugt von |
|---|---|---|
| `palette/hollow-64.hex` | Masterpalette (64 Farben, 52 frei + 3 Team-Rampen à 4) | Hand |
| `sprites/units/<id>/` | Figuren-Sheets (`sheet.key.png`, `sheet.normal.png`, `sheet.json`) | `tools/art/` + Blender |
| `sprites/props/<id>/` | Requisiten (Bäume, Häuser, Festung, Truhe …), gleiches Format, nur Zeile `idle_s` bzw. Zustände | `tools/art/` + Blender |
| `tiles/` | Boden-Tileset, Dual-Grid, je Gelände ein 4×4-Atlas | `tools/art/tiles.py` |
| `fx/` | Effekt-Sheets (Flammen, Funken, Treffer-Stern …) | `tools/art/` |
| `portraits/<id>/<mood>.png` | Anime-Halbfiguren, transparent, Master 1536 px hoch | ChatGPT, nachbearbeitet |
| `backgrounds/<id>.png` | VN-Hintergründe 2560 × 1440 (Sicherheitszone mittlere 810 px) | ChatGPT |
| `icon/icon.png` | App-Icon-Master 1254 × 1254 (Favicon, PWA-Icons, Apple-Touch); `pnpm art:icons` schreibt `public/icons/` (eingecheckt) | ChatGPT |
| `prompts/<asset>.md` | Prompt, Referenzen, Datum | Hand |

## Figuren-Sheet (`sprites/units/<id>/`)

- **Zelle 72 × 72 px.** Fußpunkt (Anker) bei **[36, 63]** in der Zelle. Im Spiel liegt der Anker auf Feldmitte x = 24 und y = 42 des 48er-Feldes; die Zelle ragt also 12 px links/rechts und 21 px nach oben über das Feld hinaus.
- Figur ca. 36–40 px hoch (2,5 Köpfe), Kopf ca. 15 px. Im Ruhezustand bleibt die Figur innerhalb x 12–60 (Feldbreite); Angriffsframes dürfen die ganze Zelle nutzen.
- Zeilen (von oben nach unten) und Frames:

| Zeile | Frames | fps | Loop | Hinweis |
|---|---|---|---|---|
| `idle_s` | 4 | 6 | pingpong | Atmen |
| `walk_s` | 4 | 10 | loop | |
| `walk_n` | 4 | 10 | loop | |
| `walk_e` | 4 | 10 | loop | West = gespiegelt |
| `attack_s` | 6 | 12 | once | Treffer-Frame 3 (0-basiert) |
| `attack_n` | 6 | 12 | once | Treffer-Frame 3 |
| `attack_e` | 6 | 12 | once | Treffer-Frame 3; Zauber/Stab: Wirken statt Hieb |
| `hit_s` | 2 | 12 | once | |
| `downed_s` | 1 | – | – | zusammengesunken |

- `sheet.key.png`: Farbe, Hollow-64, harte Alpha (0 oder 255). Teamtuch in den **Schlüsselfarben** `#400040`, `#800080`, `#C000C0`, `#FF00FF` (dunkel → hell). Der Shader tauscht sie zur Laufzeit gegen die Team-Rampe.
- `sheet.normal.png`: Normal-Map gleicher Größe (RGB = Normal × 0.5 + 0.5, Alpha wie Farbe).
- `sheet.json`:

```json
{ "cell": [72, 72], "anchor": [36, 63],
  "rows": [ { "name": "idle_s", "frames": 4, "fps": 6, "loop": "pingpong" },
            { "name": "attack_e", "frames": 6, "fps": 12, "loop": "once", "hitFrame": 3 } ] }
```

## Requisiten (`sprites/props/<id>/`)

Gleiches Format, Zelle 72 × 72 (große Requisiten 96 × 96 erlaubt, Anker = Mitte des Fußes des Feldes, z. B. [36, 63] bzw. [48, 87]). Zeilen sind Zustände, z. B. `closed`, `open` (Truhe), `intact`, `visited`, `razed` (Dorf), oder `idle` mit Animationsframes.

## Tiles (`tiles/`)

- **Dual-Grid**: Pro Bodentyp eine Datei `<ground>.png` mit 4 × 4 Kacheln à 48 × 48 (192 × 192). Kachel-Index = Ecken-Bits `TL=1, TR=2, BL=4, BR=8`; Kachel (i % 4, i / 4). Index 0 bleibt leer, Index 15 = voll bedeckt. Nicht bedeckte Bereiche sind transparent, Ränder unregelmäßig, mit Kontur/Kante (z. B. Grasbüschel, Uferlinie).
- Das Dual-Grid liegt um ½ Feld versetzt: Kachel (x, y) des Dual-Grids deckt die Ecken der Felder (x−1, y−1), (x, y−1), (x−1, y), (x, y) ab.
- Zusammensetzen: Schichten in Priorität (unten → oben) `river, shallows, plain, sand, road, grass, ash, wall`. Eine Ecke gilt als bedeckt, wenn das Feld eine Priorität ≥ der Schicht hat. Die unterste Schicht wird voll gezeichnet.
- Animiert: `river_0..3.png`, `shallows_0..3.png` (4 Frames, gleicher Aufbau).
- `decals.png`: Bodendetails à 48 × 48 (Blumen, Steine, Halme …) in einer Zeile, `decals.json` mit `{ "count": n, "ground": ["grass", ...] }` (auf welchem Boden jedes Decal erlaubt ist).
- `objects.png` + `objects.json` für feldgebundene Objekte, die zum Boden gehören: `bridge_h`, `bridge_v`, `fort`, `village`, `village_visited`, `ruins`, `throne`, `gate_closed`, `gate_open`, `mountain`, `rockwall`, `chest_closed`, `chest_open` … (falls nicht als Blender-Requisite).
