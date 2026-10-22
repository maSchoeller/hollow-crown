# concept/art – Beispiele zur Art Direction

Anschauungsmaterial zu `15-art-direction.md`, `16-asset-pipeline.md` und `17-audio.md`. Nichts hier wird vom Spiel geladen. Die echten Quellen kommen in der Umsetzung nach `art/` und `audio-src/` (siehe `16` §2).

| Ordner / Datei | Inhalt |
|---|---|
| `styleguide.html` | Visueller Styleguide zum Durchklicken (Farbwelt, Figuren, Karte, UI, Audio). Lokal im Browser öffnen |
| `palette/hollow-64.hex` / `.png` | Masterpalette Hollow-64 (52 frei + 3 Team-Rampen à 4) |
| `pipeline/` | Pipeline-Beweis A0: `blender_chibi.py` (Szene, Toon-Material, Chibi-Figuren, Requisiten), `blender_render.py` (Posen, Farb- und Normal-Durchgang), `pixelize.py` (Palette, Verkleinerung, Umriss, Teamtausch, Sheets), `compose_map.py` (Kartenmockup mit Licht), `previews.py` (GIFs) |
| `blender/hc_pixel_proof.blend` | Blender-Szene `HC_Sprites` des Pipeline-Beweises |
| `sprites/` | Ergebnisse: Sprite-Sheets (Kael, Bandit, Haus, Baum) in den Varianten key/player/enemy/other/normal, animierte GIFs, Teamfarben-Vergleich, Normal-Map, Kartenmockup Varnhold |
| `characters/` | Anime-Referenzblätter, Porträt-Stimmungen und Krit-Cut-in aus ChatGPT + Prompts |
| `audio/` | *folgt:* Stimm-, SFX- und Musikproben aus ElevenLabs (MCP ist eingetragen, der API-Key war in der Session vom 2026-10-22 nicht verfügbar) |

## Pipeline-Beweis nachbauen

1. Blender 5.x mit MCP-Add-on starten.
2. In Blender ausführen: `pipeline/blender_chibi.py`, dann `render_all(<raw>)` aus `pipeline/blender_render.py`.
3. `python pipeline/pixelize.py <raw> <pix>`
4. `python pipeline/previews.py <pix> sprites` und `python pipeline/compose_map.py <pix> sprites/varnhold_mock.png 3`

Benötigt: Python 3.11+ mit Pillow und NumPy.

**Hinweis:** Die Boden-Tiles im Kartenmockup sind prozedurale Platzhalter. Das finale Tileset wird gepixelt (`16` §4.5).
