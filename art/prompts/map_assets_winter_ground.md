# map_assets_winter_ground – Winterboden (Story 15.15)

- **Datei (Original, unverändert aus ChatGPT heruntergeladen):** `art/ground/refs/sheet7_snow_frozen_road_ice.png` (1254 × 1254, 2 × 2 mit weißem Spalt), erzeugt am 2026-11-06.
- **Abgeleitet:** Bodentexturen `snow`, `dirt_frozen`, `road_snow` über `tools/art/ground.py` (`SHEETS`). Das vierte Feld (Seeeis) ist eine Reserve für das Eis mit Bruchstellen (3-3, 3-4, 3-7) und noch nicht im Spiel.
- **Plan:** `concept/23-art-direction/map-assets/jahreszeiten-plan.md`. Herbstgras kommt aus dem vierten Feld von `sheet6` (`map_assets_moor.md`).
- **Abnahme:** im Spiel auf dem Akt-2-Entwurf 2-8 (`__hc.devMap('s2_2_8_kronfeld', { season: 'winter' })`), Belege in `_bmad-output/implementation-artifacts/15-15-belege/`.

## Prompt

> Create a square image 1024x1024: a texture sheet of four seamless tileable game textures in a 2x2 grid, separated by a thin pure white gap in the exact middle, no labels, no text, no frame. Each quadrant is a flat, straight-on, evenly lit texture seen from directly above, with no perspective and no cast shadow, hand-painted, chunky rounded forms, calm with few large shapes, no fine noise, cheerful storybook style. Top left: fresh snow lying over a meadow, soft creamy white with very light cool blue-grey hollows, a few small tufts of dry straw-coloured grass tips poking through, NOT pure flat white, gentle low contrast. Top right: frozen bare earth, cool grey-brown soil with patches of pale hoarfrost and a few small frozen pebbles, clearly darker than the snow. Bottom left: a packed dirt road in snow, two soft parallel wheel ruts of trampled grey-brown slush running straight from top to bottom, snowy shoulders on both sides. Bottom right: thick lake ice, pale blue-teal with soft white cracks and frosted patches. Every quadrant tiles seamlessly.
