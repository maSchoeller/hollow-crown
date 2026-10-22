# app_icon – App-Icon und Favicon

- **Datei:** `art/icon/icon.png` (1254 × 1254, RGB)
- **Datum:** 2026-10-22
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome
- **Referenzen:** keine; Motiv nach `concept/15-art-direction.md` (hohle, zerbrochene Glutkrone)
- **Iterationen:** 1

## Prompt

> Professional app icon for a dark-fantasy tactics RPG called "Hollow Crown". Square 1:1, 1024x1024. Subject: a single hollow, broken royal crown seen from the front, slightly cracked open on one side, with five sharp points; the inside of the crown is empty and glows with faint ember light. Crown made of aged, dark gold metal with crisp engraved edges. Background: solid deep midnight navy (#141B2D) filling the whole square edge to edge, with a very subtle warm ember glow behind the crown. Style: clean, bold, iconic, flat-ish painted emblem like a premium mobile game icon (Fire Emblem / Battle Brothers mood), strong silhouette that stays readable at 16x16 pixels, high contrast, limited palette (navy, dark gold #C9A24A, pale gold #F2D98C, ember orange #E8743B). Composition: crown centered, occupying about 65% of the width, generous safe margin on all sides. No text, no letters, no border, no frame, no rounded corners, no drop shadow, no gradient banding, no extra objects.

## Nachbearbeitung

`pnpm art:icons` (`tools/art/icons.py`): Favicon als quadratischer Zuschnitt eng um die Krone (Kontrast +15 %, ICO 16/32/48 und PNG 32), Apple-Touch 180 und PWA 192/512 als ganzes Bild, maskable 512 mit dem ganzen Bild auf 70 % verkleinert und mit der Randfarbe `#0E1729` aufgefüllt (Krone liegt im 80-%-Sicherheitskreis).

## Abnahme

- Krone hohl und an einer Seite gesprungen ✓, Glut im Inneren ✓, kein Text, kein Rahmen ✓, Silhouette bei 16 px noch als Krone lesbar ✓.
