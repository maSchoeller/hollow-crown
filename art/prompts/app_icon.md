# app_icon – App-Icon und Favicon

- **Datei:** `art/icon/icon.png` (1254 × 1254, RGB, unverändertes Original von ChatGPT; ersetzt die dunkle Navy-Krone vom 2026-10-22, die in der Git-Historie liegt)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller), gesteuert über Claude in Chrome
- **Referenzen:** keine; Stil nach `concept/25-ux/DESIGN.md` (runder Chibi, dunkelbraune Kontur) und `art/mockups/style-2026-10/round_chibi_kael.png`; Motiv nach Art Direction (hohle, gesprungene Goldkrone mit Glut)
- **Iterationen:** 1
- **Menschlicher Anteil:** keiner am Bild; Zuschnitte und Größen per `tools/art/icons.py`. Nach `licensing.md` §6 A8 ist das Logo vor dem Store-Release vom Menschen als Vektor neu zu zeichnen; dieses Icon ist bis dahin die Platzhalter-Marke.

## Prompt

> Create an image (square 1:1, 1024x1024): a mobile game app icon for a tactics RPG called "Hollow Crown". Style: round chibi toy-diorama look, like a premium cute-but-grown-up mobile game (Fire Emblem Heroes / Battle Brothers mood): chunky, rounded, toy-like shapes with soft rounded tips instead of sharp spikes, a thick soft dark-brown outline (#3B2A20) around every shape, cel-shading with two shadow tones and one clear highlight, light from top left, warm saturated colors. Subject: one single hollow golden crown seen from the front with five chubby rounded points, each tipped with a small round gem or ball. The crown is hollow: through the open inside you see a warm ember glow, and one clean crack runs down the front band on one side, with a few tiny glowing embers floating out of it. Colors: gold #D9A931 with lighter cream-gold highlights, ember orange #E8743B glow inside the crack, outline #3B2A20. Background: solid, flat warm cream #FFF8EC filling the entire square edge to edge, with a very soft slightly darker cream circle behind the crown. Composition: crown centered, about 70% of the width, generous safe margin on all sides, strong simple silhouette that stays readable at 16x16 pixels. Absolutely no text, no letters, no frame, no border, no rounded-corner mask, no drop shadow under the crown, no extra objects.

## Nachbearbeitung

`pnpm art:icons` (`tools/art/icons.py`): Favicon als quadratischer Zuschnitt eng um die Krone (Kontrast +15 %, ICO 16/32/48 und PNG 32), Apple-Touch 180 und PWA 192/512 als ganzes Bild, maskable 512 mit dem ganzen Bild auf 70 % verkleinert und mit der Randfarbe `#FEF8EB` aufgefüllt (Krone liegt im 80-%-Sicherheitskreis). `theme_color` und `background_color` des Manifests sowie das `theme-color`-Meta sind jetzt Creme `#FFF8EC`, passend zum Icon-Hintergrund (vorher Navy `#141B2D`).

## Abnahme

- Krone hohl mit Glut im Inneren ✓, Riss mit Glut an der Vorderseite ✓, runde Formen mit dunkelbrauner Kontur wie die Spielwelt ✓, kein Text, kein Rahmen ✓, bei 16 px noch als goldene Krone lesbar ✓.
- Abweichung vom Prompt: Edelsteine und Rauten im Kronreif (Prompt verlangte nur Kugeln an den Spitzen); als Detail akzeptiert.
