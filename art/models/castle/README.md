# Heimat-Burg: die Paktwacht (Art Direction §7)

`paktwacht.glb` ist die ganze Burg in einer Datei, gebaut von `tools/art/blender_paktwacht.py` (Räume, Gegenstände und
Grundformen aus `tools/art/blender_castle.py`), von Hand modelliert mit Vertex-Farben – **kein KI-Asset**, die Auflagen aus
`concept/23-art-direction/licensing.md` §6 greifen hier also nicht. Die Datei liegt in Git LFS; im frischen Worktree erst
`git lfs pull`.

```bash
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P tools/art/blender_paktwacht.py
```

Danach `pnpm art:build` (kopiert die Datei nach `public/assets/models/castle/`). Mit `-- --preview <ordner> --tier 0123`
rendert das Skript je Burgstufe ein Bild aus Blender.

## Teile

Jedes Mesh heißt `<gruppe>_<kennung>`; `a` ist immer sichtbar, sonst nennt die Kennung die Stufen, auf denen das Teil steht.

| Gruppe | Schaltet nach | Wer schaltet |
|---|---|---|
| `shell`, `land` | Burgstufe 0–3 (`castleTier`, Schwellen in `balance.yaml` `castle.tierAt`) | `CastleView.setTier` |
| Räume (`smith`, `tavern`, …) | Raumstufe 1–3 | `CastleView.setLevel` |
| Gegenstände (`axe`, `lute`, …) | Zustand des Gefährten (`castleScene`) | `CastleView.setKeepsake` |

Die Plätze der Gegenstände stehen in `LAYOUT` von `blender_paktwacht.py`, die Liste der Ids in `CASTLE_PLACES`
(`src/core/campaign/castleScene.ts`); `tests/unit/castle-model.test.ts` hält beide und die exportierte Datei gegeneinander.
Das Vorwerk am Passfuß (Burgstufe 3, F4) baut `build_outwork()` in `shell_3`.

## Abnahme (Story 10.14)

Bilder bei 375 × 812 aus dem laufenden Akt-2-Dev-Server, Ton auf 0:

```bash
pnpm dev:act2 --port 5175
```

```bash
node tools/art/castle-shots.mjs
```

| Bild | Was es zeigt |
|---|---|
| `shots/level-1.png` | alle Räume auf Stufe 1, Burgstufe 0 (Ruine), alle Gegenstände an ihren Plätzen |
| `shots/level-2.png` | alle Räume auf Stufe 2 |
| `shots/level-3.png` | alle Räume auf Stufe 3, Burgstufe 3 mit Bannern, Licht und Vorwerk am Passfuß |
| `shots/loss.png` | wie Stufe 3, aber Brenna ist gefallen (Axtständer bleibt liegen, entsättigt) und Varek gegangen (Würfelbrett weg) |

Im Spiel setzt `__hc.devCastle(stufe, verlust)` denselben Stand; die Dev-Leiste (`?castle3d=1`) schaltet Burgstufe und den
Zustand aller Gegenstände von Hand.
