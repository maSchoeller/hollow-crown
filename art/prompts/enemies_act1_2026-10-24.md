# enemies_act1_2026-10-24 – Porträts der neuen Gegnertypen von Akt 1

Generische Gegnerporträts für Wolfsreiterin, Söldner und Tempelwache (Story 8.3/8.4). Sie sind zugleich die Figurenvorlage der Brett-Turnarounds (`wolf_rider_board_turnaround.md`, `mercenary_board_turnaround.md`, `temple_guard_board_turnaround.md`). Vorgabe des Produktinhabers (2026-10-24): Porträts ohne Tripo-Figur dürfen neu gedacht werden, und nicht alle Gegner sollen Männer sein; deshalb sind Wolfsreiterin und Tempelwache Frauen, der Söldner ein Mann.

- **Dateien:** `art/mockups/characters-s1/class_wolf_rider.png`, `class_mercenary.png` (ersetzt die Fassung vom 2026-10-24 13:21, siehe `missing_2026-10-24.md`), `class_temple_guard.png`; je 1254 × 1254, RGBA, echter Alphakanal
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; ein Chat „Create Wolf Rider Image“ (https://chatgpt.com/c/6add06fe-771c-83ed-99f7-4507af6e0afe)
- **Tarif und Konto zum Erzeugungsdatum (A1):** ChatGPT **Plus**, Konto `maschoeller` (Seitenleiste, 2026-10-24 21:10)
- **Modellversion:** ChatGPT-Bildgenerierung; die Oberfläche nennt keine Versionsnummer (Denkaufwand „Medium“)
- **Datum:** 2026-10-24, 21:10–21:50
- **Referenzen:** `art/mockups/characters-s1/rhen_a.png`, `kael.png`, `tobin.png` (Stil), `class_soldier.png` (generischer Gegner)
- **Originale (A3):** ChatGPT lieferte die Bilder im Zielformat; die Dateien sind die unveränderten Downloads (Git LFS), keine zweite Kopie
- **Menschlicher Anteil (A2):** Figurenentwurf (Geschlecht, Fraktionsfarben nach Art Direction §2.2), Prompt, Auswahl und Abnahme; keine Nachbearbeitung
- **A7:** Prompts ohne Namen geschützter Werke, Marken oder Künstler

## Prompts

**Erste Nachricht** (vier Referenzen angehängt):

> Create an image. The four attached portraits (RHEN, KAEL, TOBIN and a generic SOLDIER enemy) are the APPROVED STYLE REFERENCES for my original fantasy tactics RPG 'Hollow Crown'. Match their style EXACTLY: 'Round Chibi Cartoon' - big ROUND head, large expressive eyes, short rounded body, soft dark-brown outlines, simple glossy cel shading, bright warm colors, toy-like rounded forms; friendly and readable even for enemies, never gritty or realistic. FORMAT: square 1:1, one single character, half-body dialogue portrait (head to hips), body turned slightly, centered, FULLY TRANSPARENT background (PNG with real alpha channel), no floor, no shadow, no text, no name, no logo, no frame. I will ask for three GENERIC ENEMY TYPES, one per message. Enemy type 1: WOLF RIDER (a woman, about 30) of a wild borderland raider band that fights on foot in Act 1: wiry and fierce, tanned skin, messy dark-blonde hair in two rough braids with small wolf-tooth beads, blue-grey war-paint stripe across the eyes; a big shaggy GREY WOLF-FUR MANTLE over both shoulders (just the pelt, NO wolf head and NO hood), patched brown leather armour, rust-red (#8E3B2E) cloth wrapped around her waist, leather bracers, holding a simple long hunting spear upright. Colours of the raider faction: earth brown, dirty olive, rust red. Expression: feral, confident grin.

**Korrektur 1** (Wolfsreiterin):

> Close, but the style is too anime and too grown-up compared to the references. Please redo the SAME wolf rider so it matches the ROUND CHIBI references exactly: a much BIGGER, ROUNDER head (about 40% of the visible figure), short rounded body, chubby rounded hands, simpler rounded shapes, fewer small straps and buckles, the same soft dark-brown outline and simple glossy cel shading as RHEN and KAEL. Keep her look (…). Her torso must be FULLY covered: a simple closed brown leather jerkin with a high neckline, no cleavage, no bare midriff. Same format: square 1:1, half-body, FULLY TRANSPARENT background (real alpha), no text.

**Korrektur 2** (Wolfsreiterin):

> Great, this style is right - approved design. Now the same character, identical design, style and colours, but framed as a HALF-BODY dialogue portrait exactly like the RHEN and KAEL references: from the top of the head down to the hips only (legs and feet NOT visible), the figure filling the square canvas like in the references, body turned slightly, spear held upright beside her. Square 1:1, FULLY TRANSPARENT background (real alpha), no floor, no shadow, no text.

**Söldner:**

> Approved. Enemy type 2, same style as your last approved image (big round chibi head about 40% of the figure, short rounded body, chubby hands, simple rounded shapes, soft dark-brown outline, glossy cel shading) and the same HALF-BODY framing (head to hips, no legs), square 1:1, FULLY TRANSPARENT background (real alpha), no text: MERCENARY (a man, about 35), a sellsword hired by the borderland bandits and bounty hunters: stocky, short dark-brown hair under a dented round steel cap, short scruffy beard, a crooked nose, one small scar on the cheek; a padded quilted gambeson in dirty olive with a simple steel breastplate over it, a rust-red (#8E3B2E) scarf around the neck, brown leather gloves, a small pouch of coins at the belt, holding a plain short sword (arming sword) resting on his shoulder. Raider faction colours: earth brown, dirty olive, rust red; no emblem. Expression: bored, mercenary smirk - in it for the money.

**Tempelwache:**

> Approved. Enemy type 3, same style (…), same HALF-BODY framing (head to hips, no legs), square 1:1, FULLY TRANSPARENT background (real alpha), no text: TEMPLE GUARD (a woman, about 25) of the Pact Guard, the holy guard of the great Pact Temple: neat chin-length chestnut hair under an open-faced rounded ivory-and-gold helmet with a small carmine plume, calm serious brown eyes, rosy cheeks; polished ivory (#F4EFE6) plate armour with gold (#D9A931) trim and rounded pauldrons, a carmine (#A3172E) tabard with a simple golden CROWN emblem on the chest, a short carmine cape, white gloves, holding a long ceremonial spear with a gold spearhead upright. Pact Guard colours: ivory, gold, carmine. Expression: dutiful, stern but not evil - she believes she protects the realm.

## Abnahme

| Datei | Iterationen | Ergebnis |
|---|---|---|
| `class_wolf_rider.png` | 3 | 1. Fassung **verworfen**: zu erwachsen und anime-haft, kleiner Kopf, offener Ausschnitt. 2. Fassung Stil ✓, aber Ganzfigur statt Halbfigur. 3. Fassung ✓ runder Chibi, Halbfigur, Wolfsfell ohne Kopf, Kriegsbemalung, Speer, Oberkörper bedeckt. Verworfene Fassungen liegen nicht im Repo. |
| `class_mercenary.png` | 1 | ✓ runder Chibi, Halbfigur, verbeulte Kesselhaube (Signatur), rostroter Schal, Kurzschwert auf der Schulter |
| `class_temple_guard.png` | 1 | ✓ Elfenbein/Gold/Karmin der Paktgarde, Kronen-Emblem, Speer mit Goldspitze; streng, aber nicht böse |

Geprüft je Bild in voller Größe und als Miniatur: Stil wie die Referenzen, Alphakanal echt (0–255), kein Text. Ähnlichkeitsprüfung (A7): eigene Entwürfe, keine erkennbare Vorlage.
