# items_test – 10 Testbilder für Item-Icons

- **Dateien:** `art/items/<id>.png` (Master 512 × 512, RGBA, transparent; ChatGPT liefert 1024 × 1024)
- **Datum:** 2026-10-23
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome, parallel in mehreren Tabs
- **Referenzen:** nur die aktuellen Charakterbilder `art/mockups/characters-s1/kael.png`, `brenna.png`, `mira.png`, `tobin.png` (zeigen Schwert, Axt, Bogen, Speer), in jedem Chat alle vier (vorher `git lfs pull`). Nicht verwenden: Stil-Mockup und `art/portraits/` (alter Stil)
- **Ablauf:** 5 parallele Chats mit je 2 Items (erste Nachricht mit Referenzen, zweite als Folge-Nachricht); Download per Chrome, Rohbild 1254 × 1254 nach `art/items/source/<id>.png`, Master per Skript auf das Motiv zugeschnitten und auf 80 % von 512 × 512 gerahmt
- **Regeln:** `concept/23-art-direction/art-direction.md` §5.6, Katalog `concept/21-gdd/items.md`
- **Ziel:** Stil, Lesbarkeit bei 48 px und Tier-Unterschied prüfen; die abgenommenen Bilder werden Referenz für alle weiteren Icons

## Auswahl

Deckt alle drei Tiers, lange und kompakte Items, Magie, Verbrauchsgut, eine Signatur und ein Relikt ab.

| # | id | Item | Tier/Art | Ausrichtung |
|---|---|---|---|---|
| 1 | `iron_sword` | Eisenschwert | Eisen | diagonal |
| 2 | `steel_axe` | Stahlaxt | Stahl | diagonal |
| 3 | `silver_lance` | Silberlanze | Silber | diagonal |
| 4 | `hunting_bow` | Jagdbogen | Holz, Eisen | diagonal |
| 5 | `ember` | Glimmen (Feuerbuch) | Buch, Stufe 1 | frontal |
| 6 | `heal_staff` | Heilstab | Holz, Eisen | diagonal |
| 7 | `iron_shield` | Eisenschild (Set Aschenbanner-Wacht) | Eisen | frontal |
| 8 | `vulnerary` | Heiltrank | Verbrauch | frontal |
| 9 | `homecoming` | Heimkehr, Brennas Signatur-Doppelaxt | Signatur | diagonal |
| 10 | `pact_warden_shield_3` | Schild der Paktwächter, erwacht | Relikt | frontal |

## Basis-Prompt

> Game inventory icon for a warm, cozy fantasy tactics RPG. Draw a single item: {ITEM}. Style: round chibi cartoon matching the attached character art – chunky, oversized, toy-like proportions with rounded tips and thick simple shapes, soft dark-brown outline (medium-thick, a bit bolder than in the portrait), clean cel shading with two shadow tones and one crisp highlight, warm saturated colors, light from the top-left. Composition: square 1:1, the item centered and filling about 80 % of the canvas, {ORIENTATION}. No hands, no character, no frame, no border, no text, no ground shadow, no background scenery. Fully transparent background (PNG with alpha). It must stay readable at 48 × 48 pixels: bold silhouette, no thin details.

- `{ORIENTATION}` diagonal: „long axis diagonal from bottom-left to top-right, tip pointing to the top-right“
- `{ORIENTATION}` frontal: „seen from the front, turned slightly to the side“

**Tier-Bausteine**

- IRON: „made of dark warm-grey hammered iron with matte surfaces, a simple brown leather grip wrap and plain iron fittings“
- STEEL: „made of bright blue-grey polished steel with a strong highlight, a dark leather grip and brass fittings“
- SILVER: „made of near-white silver with a cool pale highlight, a light leather grip, small gold fittings and one fine engraved line“

## Items

1. `iron_sword`: „a short, broad one-handed sword“ + IRON
2. `steel_axe`: „a one-handed battle axe with one big rounded blade“ + STEEL
3. `silver_lance`: „a lance with a broad leaf-shaped spearhead and a short pale wooden shaft“ + SILVER
4. `hunting_bow`: „a light short recurve hunting bow of warm brown wood with a green-brown grip wrap, small iron tips and a taut string“
5. `ember`: „a fire spell tome: a chunky leather-bound book with a fire-red (#F2603A) cover, a simple glowing flame symbol on the front and plain leather corner caps; three tiny embers float above it“
6. `heal_staff`: „a healer's wooden staff topped with a soft green-glowing round crystal in a simple iron holder“
7. `iron_shield`: „a heater shield with a riveted iron rim and an ash-grey (#5B5A5E) field showing a small torn black banner with a glowing ember-orange (#E8743B) hem“ + IRON
8. `vulnerary`: „a healing potion: a round chubby glass flask with a cork, filled with glowing warm red liquid, a small cloth tag tied at the neck“
9. `homecoming`: „the signature two-handed double-bladed battle axe of Brenna (see attached character): two big crescent blades of dark steel with copper-red accents, the haft wrapped in ember-orange (#E8743B) cloth with a small braided leather charm hanging from it; unique and heroic, clearly more special than a normal axe“
10. `pact_warden_shield_3`: „the fully awakened relic shield of the ancient Pact Wardens: a round-shouldered ivory (#F4EFE6) and gold (#D9A931) shield with a stylized hollow crown emblem; fine cracks run across the surface and glow with warm ember-orange (#E8743B) light, a few tiny sparks; ancient, sacred, powerful“

Tatsächlich verwendete erste Nachricht (statt Basis-Prompt oben): *Create an image. The four attached character portraits (KAEL, BRENNA, MIRA, TOBIN) are the APPROVED STYLE REFERENCES for my fantasy tactics RPG 'Hollow Crown' ('Round Chibi Cartoon'). Match their style exactly, especially how their weapons and gear are drawn. Task: a game inventory icon showing a single item: {ITEM}. Style: chunky, slightly oversized, toy-like proportions with rounded tips and thick simple shapes, soft dark-brown outline (a bit bolder than in the portraits), simple glossy cel shading, warm colors, light from the top-left. Composition: square 1:1, the item centered and filling about 80% of the canvas, {ORIENTATION}. No hands, no character, no frame, no border, no text, no ground shadow, no background scenery. FULLY TRANSPARENT background (PNG with real alpha channel). It must stay readable at 48x48 pixels: bold silhouette, no thin details.*

Folge-Nachricht: *Great. Next icon - exactly the same style, outline, shading and format (square 1:1, item centered at about 80%, FULLY TRANSPARENT background, no text, no hands). Item: …*

## Abnahme

Erster Durchgang 2026-10-23, je 1 Versuch; Abnahme durch den Produktinhaber steht aus.

- Alle 10 mit echtem Alphakanal und einheitlichem Stil (dunkelbraune Outline, glänzendes Cel-Shading) ✓
- Tier über die Metallfarbe erkennbar: Eisen dunkelgrau, Stahl blaugrau mit Messing, Silber hell mit Gold ✓
- ChatGPT ignoriert die 80 %: die Motive füllen 92–100 % des Bildes. Das gleicht das Zuschneiden im Skript aus
- Lange, dünne Items (Jagdbogen, Lanze) sind bei 48 px schwach; künftig dickere Schäfte und Sehnen verlangen
- Relikt: Die Krone im Wappen wirkt nicht hohl, die Glut ist dezent
- Ein versehentlicher erster Durchgang mit Stil-Mockup und altem Kael-Porträt als Referenz wurde verworfen
