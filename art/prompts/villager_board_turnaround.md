# villager_elder, villager_child – Zivilisten (Porträt, Brett-Turnaround, Tripo)

Zivilisten für die Klasse `civilian` (Produktinhaber 2026-10-26, Stories 9.3 und 9.6): der Dorfälteste in 1-2 „Asche über Erlbach“ und die Kinder im Hungerlager 1-5. Generische Figuren, keine Gefährten.

- **Dateien:**
  - Porträts `art/mockups/characters-s1/villager_elder.png`, `villager_child.png` (1254 × 1254, RGBA, unveränderte Downloads)
  - Brett-Turnarounds `art/turnarounds/villager_elder_board/sheet.png`, `art/turnarounds/villager_child_board/sheet.png` (1536 × 1024, Originale); daraus `front.png`, `side.png`, `back.png` (`tools/art/split_turnaround.py`)
  - Tripo-Exporte `art/models/source/villager_elder_board_tripo.glb`, `villager_child_board_tripo.glb` (Originale); aufbereitet `art/models/units/villager_elder.glb`, `villager_child.glb` (`pnpm art:tripo`, Blender 5.2)
- **Datum:** 2026-10-26
- **ChatGPT:** Bildgenerierung, Denkaufwand „Medium“, gesteuert über Claude in Chrome; **Tarif Plus**, Konto `maschoeller` (Anzeige im Profilmenü, A1). Chat: https://chatgpt.com/c/6adf8ca4-50cc-83eb-b437-ef3acf893a73
- **Tripo:** Studio, Smart-Mesh aus Multi-View (Vorne, Rechts = Seitenansicht mit Blick nach rechts, Zurück), Quad, 3 000 Polygone, Datenschutz **Privat**, dann Textur, Auto-Rig „Humanoid“ (Mixamo), Export GLB 2k mit Skelett. Tarif laut Produktinhaber Pro (2026-10-26). Ergebnis: Ältester 3 659 Quads, Kind 3 742 Quads (Kind: erste von vier Varianten).
- **Referenzen:** Porträts: `rhen_a.png`, `kael.png`, `halvard.png`, `tobin.png` (Stilreferenz wie in `characters-s1/README.md`); Turnarounds: `art/turnarounds/soldier_board/sheet.png` als Formatreferenz und das jeweilige Porträt aus demselben Chat.
- **Iterationen:** je 1
- **Menschlicher Anteil:** Figurenentwurf, Prompt, Auswahl, Abnahme; keine Retusche.
- **A7:** Prompts ohne Namen geschützter Werke, Marken oder Künstler.

## Prompts

**Porträt Ältester** (erste Nachricht): *Create an image. The four attached portraits (RHEN, KAEL, HALVARD, TOBIN) are the APPROVED STYLE REFERENCES for my fantasy tactics RPG 'Hollow Crown'. Match their style EXACTLY: 'Round Chibi Cartoon' - big ROUND head, large expressive eyes, short rounded body, soft dark-brown outlines, simple glossy cel shading, bright warm colors, toy-like rounded forms. Older characters stay in this SAME cute round style - show age only with beard, grey hair, wrinkles, never with realistic proportions, long faces or detailed anatomy. FORMAT: square 1:1, one single character, half-body dialogue portrait (head to hips), centered, FULLY TRANSPARENT background (PNG with real alpha channel), no floor, no shadow, no text. Character: VILLAGE ELDER of a small farming village in the borderland, about 70, a kind but worried old farmer: bald on top with a fluffy white fringe and a big round white beard, bushy white eyebrows, rosy cheeks, a simple undyed linen shirt, a brown wool vest, a sage-green neckerchief, a plain wooden walking stick in one hand, the other hand raised in a worried welcoming gesture. Not a soldier, not a priest, no weapon, no armour, no ember-orange (he is not a company member). Expression: tired relief and hope.*

**Porträt Kind:** *Approved. Next portrait - same style and format (round chibi like the references, square 1:1, half-body, FULLY TRANSPARENT background with real alpha, no text). Character: a CHILD from a hunger camp of poor refugees and bandits, about 8 years old, gender-neutral look: messy short brown hair, big hopeful eyes, a smudge of dirt on one round cheek, an oversized patched grey-brown tunic with a rope belt, a faded mustard-yellow cloth scarf, holding a small carved wooden toy horse to the chest. Thin but still cute and soft, NOT grim, no weapon, no ember-orange. Expression: shy, curious, a little scared.*

**Brett-Turnaround Ältester:** *Approved. Now a BOARD TURNAROUND SHEET for a 3D figure (input for image-to-3D), made from the VILLAGE ELDER portrait above. The attached sheet is the APPROVED FORMAT reference for these sheets: landscape 3:2, three full-body views of the same figure side by side with wide spacing: FRONT, SIDE looking to the RIGHT, BACK; A-pose (arms slightly away from the body, legs slightly apart), same size in all views, flat light-grey background #E6E6E6, no text, no shadow. Style: strongly SIMPLIFIED round chibi for a small board figure: big round head, short rounded body, large flat color areas, few big hair/beard clumps, at most one belt, one shade step, slightly thicker outline. VILLAGE ELDER: bald top with fluffy white fringe, big round white beard, bushy white eyebrows, undyed linen shirt, brown wool vest, dark brown trousers, simple brown shoes. TEAM CLOTH: his NECKERCHIEF (front and back, a bit larger than in the portrait) in ONE flat pure MAGENTA (#FF00FF), no shading, no gradient, no highlights, like a chroma-key mask; no emblem. NO walking stick, NO weapon, nothing in his hands.*

**Brett-Turnaround Kind:** *Approved. Next BOARD TURNAROUND SHEET, same format and style as this elder sheet (landscape 3:2, FRONT, SIDE looking to the RIGHT, BACK, wide spacing, A-pose, flat light-grey background #E6E6E6, no text, strongly simplified round chibi), made from the CHILD portrait above: about 8 years old, messy short brown hair in a few big clumps, big eyes, a small dirt smudge on one cheek, an oversized patched grey-brown tunic (two or three big simple patches), a rope belt, dark trousers, simple worn brown shoes. The figure is clearly SMALLER and rounder than the elder (a child). TEAM CLOTH: the SCARF (front and back) in ONE flat pure MAGENTA (#FF00FF), no shading, no gradient, like a chroma-key mask; no emblem. NO toy, NO weapon, nothing in the hands.*

## Abnahme

- Porträts im Round-Chibi-Stil, echter Alphakanal ✓; keine Firmenfarbe ✓.
- Turnarounds vereinfacht, Seite blickt nach rechts, Teamtuch flach Magenta (Halstuch bzw. Schal) ✓, nichts in den Händen ✓.
- Tripo: Budget eingehalten (Ältester 6 600 Dreiecke, Kind 6 413; je 512 px, ~0,18 MB gz), Rig und Teamtuch erkannt.
- Hinweis: `pnpm art:tripo` normiert die Höhe; das Kind ist auf dem Brett so groß wie der Älteste. Eine kleinere Darstellung bräuchte einen Maßstab je Figur.
