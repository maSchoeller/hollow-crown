# weapon_rune_concept – Waffen mit eingelassener Runenfassung und Gravurrinne

- **Dateien:** `art/mockups/weapons-2026-11/rune_concept_v1_preview.png` (Bildschirmausschnitt der Großansicht, 1092 × 1092, nur zur Abstimmung). Das unveränderte Original (1254 × 1254) liegt noch im ChatGPT-Chat „Create weapon concept sheet“ und wird nach der Abnahme heruntergeladen (Auflage A3).
- **Datum:** 2026-11-21
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome. Tarif zum Erzeugungsdatum: noch zu dokumentieren (Auflage A1).
- **Referenzen:** `art/items/iron_axe.png`, `iron_sword.png`, `iron_shield.png`, `fire_rune.png` (Stil der gemalten Item-Icons)
- **Zweck:** Konzept „Ausrüstung zum Anfassen“, Thema 1 Runen und Waffe. Die Rune ist Teil der Waffe (Fassung und Gravurrinne), die Stufe füllt die Rinne mit Licht. Vorlage für neue 3D-Waffenmodelle.
- **Iterationen:** 1
- **Menschlicher Anteil:** noch keiner

## Prompt

> Create an image. The four attached images are APPROVED painted item icons from my own original fantasy tactics RPG 'Hollow Crown' (iron axe, iron sword, iron shield, fire rune). Keep exactly this painted style: chunky, toy-like, rounded and slightly oversized shapes, big clean forms, warm hand-painted shading with one shadow tone and one highlight, slightly thick dark-brown outlines, no photorealism, no grime. Draw a WEAPON CONCEPT SHEET on a flat light-grey background #E6E6E6, no text, no labels, no frames. Four rows: AXE, SWORD, SHIELD, SPEAR. Each row shows the SAME item four times from left to right: (1) without a rune, (2) with a tier-1 fire rune, (3) tier-2, (4) tier-3. DESIGN RULE that matters most: the rune is built INTO the item, never stuck on top. Every item has (a) a proper RUNE SETTING forged into the metal: a recessed socket with a raised metal rim and small prongs/claws holding a smooth rounded rune stone flush with the surface (axe: in the axe blade close to the haft; sword: in the centre of the crossguard; shield: in the central boss; spear: at the collar where the head meets the shaft), and (b) a RUNE CHANNEL: a clean engraved groove cut into the metal that starts at the socket and follows the shape of the blade/head (along the sword's fuller, along the curve of the axe bit, in a ring around the shield boss, down the spear head). Without a rune: the socket holds a dark empty stone and the groove is plain dark metal. With the fire rune the stone glows orange-red (#F2603A) and the groove fills with glowing light from the socket outward: tier 1 fills about one third of the groove, tier 2 two thirds, tier 3 the whole groove with a soft warm glow halo and a few tiny sparks. The glow must sit INSIDE the engraved groove and the socket, hugging the metal surface, not floating in the air. Same item, same angle (three-quarter view, blade up) in all four columns of a row, so the progression is easy to compare.

## Abnahme

- Konzeptblatt v1: Richtung bestätigt (Produktinhaber 2026-11-21). Der schräge Axtkopf ist nur im Bild in Ordnung, die 3D-Modelle bauen gerade.
- Blender-Nachbau Axt (`tools/art/blender_weapons_v2.py`, `art/models/weapons-v2/axe.glb`): abgenommen (Produktinhaber 2026-11-21).

## Iteration 2: Bauplan Axt (2026-11-21)

- **Datei:** `art/mockups/weapons-2026-11/axe_blueprint_v1_preview.png` (Bildschirmausschnitt, 1269 × 952; Original 1448 × 1086 im selben Chat)
- **Zweck:** Vorlage für den Blender-Nachbau (Vorder-, Seiten-, Rück-, Draufsicht, Detail der Fassung, Schnitt durch Fassung und Rinne)

> Create an image. Good direction. Now an ORTHOGRAPHIC MODEL REFERENCE SHEET of the AXE only, so a 3D artist can rebuild it exactly in Blender. Same painted style and same design as the axe row above (chunky single-bit axe, rune setting with metal rim and four prongs in the blade near the haft, engraved rune channel following the curve of the cutting edge), but CORRECTED GEOMETRY: the haft is perfectly STRAIGHT and VERTICAL, and the axe head sits exactly PERPENDICULAR on top of the haft (not tilted). Flat light-grey background #E6E6E6, no text, no labels, no perspective, no shadows. Lay out these views at the SAME SCALE, all standing upright with the haft bottom on one common horizontal baseline: (1) FRONT view looking straight at the flat side of the blade, (2) SIDE view looking straight at the cutting edge so the thickness and wedge profile of the head and the shape of the haft socket are clear, (3) BACK view (other flat side of the blade, showing the rune setting goes through or has a matching back plate), (4) TOP view looking down onto the axe head. Below them, two larger DETAIL drawings: (5) a close-up of the rune setting from the front (rim, four prongs, flush domed stone), and (6) a CROSS-SECTION through the blade showing the socket recess depth and the V-shaped engraved groove profile. Show the item WITHOUT glow (empty dark stone, plain groove) so the shapes are readable, except in the front view put a thin orange line inside the groove to show its exact path. Proportions: total height about 2.2 times the blade width, haft about 4 times the head height, rounded grip end with leather wrap.

## Iteration 3: Baupläne Schwert, Schild, Lanze (2026-11-21)

Gleicher Chat, eingebauter Browser. Prompts wie beim Axt-Bauplan, angepasst je Waffe (Sockel in Parierstange, Schildbuckel bzw. Tülle; Rinne in der Hohlkehle, als Ring um den Buckel bzw. über den Mittelgrat). Dateien: `sword_blueprint_v1_preview.png`, `shield_blueprint_v1_preview.png`, `lance_blueprint_v1_preview.png` (Bildschirmausschnitte; Originale 1448 × 1086 bzw. 1312 × 1199 im Chat).

## Iteration 4: Runensteine (2026-11-21)

Zwei Versuche mit Element-Symbolen („rune glyph“, Sonne, Mond, Faust …) hat ChatGPT als möglichen Richtlinienverstoß abgelehnt. Im neuen Chat „Create gem reference sheet“ nur mit Flammenform:

> Create an image. Game asset reference sheet for a cute fantasy mobile game: round glowing orange-red (#F2603A) gemstones that sit in a round metal socket. Painted, chunky, toy-like style with soft hand-painted shading and slightly thick dark-brown outlines. Flat light-grey background #E6E6E6, no text, no labels. Three columns, left to right: quality level 1, level 2, level 3. Every gem has exactly the same round base diameter. In each column, from top to bottom: a top view, a side profile view (showing the flat round base and the dome height), and a three-quarter view with a soft warm glow. Level 1: a smooth, low, domed cabochon with a small simple carved flame shape in the middle. Level 2: a taller dome with a faceted bevel ring around the edge and a bolder carved flame shape. Level 3: a precious cut crystal dome with clear facets, the flame shape inlaid with a thin gold line, a little taller, with a bright glowing core.

Datei: `rune_gem_tiers_v1_preview.png` (Ausschnitt 740 × 500; Original 1536 × 1024 im Chat).

## Iteration 5: Übrige Gruppen ohne ChatGPT-Bauplan (2026-11-22)

ChatGPT war im Nachtlauf nicht erreichbar. Bogen, Dolch, Stab, Buch (zu und offen), Laute und Fokus wurden deshalb direkt in Blender aus den gemalten Gegenstandsbildern gebaut: `art/items/iron_bow.png`, `longbow.png`, `iron_dagger.png`, `stiletto.png`, `heal_staff.png`, `star_staff.png`, `forbidden_compendium.png`, `travel_lute.png`, `silver_lute.png`, `crystal_focus.png`, `moonsteel_orb.png`, `ember_focus.png`. Stil wie die v2-Modelle Axt, Schwert, Lanze und Schild (klobig, gerundet, Vertexfarben aus Hollow-64, keine Teamfarben als Fläche). Skripte: `tools/art/blender_weapon_<gruppe>.py` mit gemeinsamem Werkzeugsatz `tools/art/blender_weapons_v2_kit.py`; Abnahmeblatt: `blender_weapons_v2_sheet.py --set=rest`.

[ASSUMPTION] Baupläne per ChatGPT werden nachgeholt (Iterationen 6 ff. je Gruppe); die Lagen unten sind Augenmaß und können danach nachgezogen werden.

| Gruppe | Hauptfassung | Rinne (UV 1 `fill` 0 → 1) | kleine Fassung |
|---|---|---|---|
| Bogen | Platte im Griffstück über der Faust, +X-Seite | Oberarm entlang, bis zur Wurfarmkappe (Perlen links und rechts) | Platte am Unterarm |
| Dolch | Mitte der Parierstange, beide Seiten (`_r`/`_l`) | Hohlkehle wie beim Schwert, beide Seiten | Parierstangenarm +Y, beide Seiten |
| Stab | Scheibenkopf, beide Seiten | zwei Spiralen (180° versetzt) vom Kragen den Schaft hinab | Kragenblock, beide Seiten |
| Buch zu | Deckelmitte | Prägelinie von der Fassung zum Deckelrand und um drei Seiten | Deckelecke oben rechts |
| Buch offen | rechte Seite, Kuppel nach oben (+Y) | Prägelinie um den Rand der rechten Seite | linke Seite |
| Laute | Rosette im Korpus | am Hals entlang bis zum Wirbelkasten | Korpusende |
| Fokus | Mitte der Halterscheibe | vom Zentrum einmal als Ring um den Kristallhalter | Ohr unten vorn an der Scheibe |

Abnahme: offen (Produktinhaber). Blatt: `s4-16-7-modelle.png` (Vorderansicht, Seite, Fassung Stufe I/II/III, kleine Fassung).
