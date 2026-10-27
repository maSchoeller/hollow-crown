# status_icons – Status-Symbole über den Figuren (Story 8.6)

- **Dateien:** Originale `art/status/source/<id>.png` (1254 × 1254, RGBA mit echtem Alphakanal, unverändert von ChatGPT) für `burning`, `wet`, `slowed`; Laufzeitformat wird von `pnpm art:build` abgeleitet
- **Datum:** 2026-10-26
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller; Tarif im Konto-Menü geprüft), gesteuert über Claude in Chrome; ein Chat, drei Nachrichten, je 1 Versuch
- **Referenzen:** die abgenommenen Item-Bilder `art/items/blaze.png`, `art/items/remedy_salve.png`, `art/items/wind_feather.png` (Stilvorlage, siehe `items_all.md`)
- **Grundlage:** Art Direction §8 (Status), Entscheidung Produktinhaber 2026-10-26: gemalte Symbole für Brennen, Nass, Verlangsamt; Rückschlag ist kein gespeicherter Zustand und bekommt kein Symbol; Symbole ausnahmsweise im Paket `core`, damit der Prolog sie zeigt
- **Menschlicher Anteil:** keiner am Bild; Auswahl und Abnahme durch den Produktinhaber, Zuschnitt und Größen per Build-Skript
- **Herkunft Download:** aus dem Chat per Seitenskript (Blob des generierten Bilds) in den Downloads-Ordner, dann unverändert nach `art/status/source/` verschoben

## Erste Nachricht (mit den drei Referenzbildern)

> Create an image. The three attached images are APPROVED inventory icons of my fantasy tactics RPG 'Hollow Crown' (round chibi cartoon style). Match their style exactly: chunky, toy-like rounded shapes, soft dark-brown outline (#3B2A20) a bit bold, simple glossy cel shading, warm colors, light from the top-left. I need a small series of STATUS EFFECT ICONS shown above units on the battle board, one image per message, all in the SAME style and format: square 1:1, a single bold symbol centered and filling about 80% of the canvas, inside a round badge disc with a cream (#FFF8EC) fill and the same dark-brown outline; no character, no text or letters, no numbers, no frame outside the badge, no ground shadow, FULLY TRANSPARENT background outside the badge (PNG with real alpha channel); must stay readable at 24x24 pixels (bold silhouette, no thin details). First icon - STATUS: BURNING. SYMBOL: one chubby rounded flame in fire orange-red (#F2603A) with a yellow core, two tiny ember sparks.

## Folge-Nachrichten

> Next icon - exactly the same style and format as the burning icon (same cream badge disc, same outline weight, symbol at about 80%, FULLY TRANSPARENT background outside the badge, no text). STATUS: WET. SYMBOL: one chubby rounded water droplet in water blue (#4AA8E8) with a white glossy highlight, two tiny droplets splashing beside it.

> Next icon - exactly the same style and format as the two previous icons (same cream badge disc, same outline weight, symbol at about 80%, FULLY TRANSPARENT background outside the badge, no text). STATUS: SLOWED. SYMBOL: one chubby cute snail seen from the side, shell in muted violet-grey (#8A7FA8) with a simple spiral, soft beige body, no face details beyond two tiny eye stalks.

## Abnahme

- Einheitlicher Stil mit den Item-Bildern, gleiche Plakette, gleiche Konturstärke ✓; echter Alphakanal außerhalb der Plakette ✓; kein Text ✓
- Bei 24 px: Flamme und Tropfen klar lesbar ✓, Schnecke als Form lesbar, Spirale verschwimmt; akzeptiert
- Keine Namen geschützter Werke in den Prompts (licensing §6 A7) ✓
