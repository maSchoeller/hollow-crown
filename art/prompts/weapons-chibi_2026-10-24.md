# weapons-chibi_2026-10-24 – Basiswaffen-Bilder und Brenna/Mira im Round-Chibi-Stil

Beauftragt vom Produktinhaber am 2026-10-24: (1) je eine Basiswaffe für die Waffengruppen ohne Item (Dolch, leichter Bogen, Laute) samt Item-Bild, (2) Brenna und Mira, deren Neutralbilder aus dem ersten Moodboard-Durchlauf weniger „chibi“ waren als die übrigen, neu im Round-Chibi-Stil (B8) samt Stimmungsvarianten.

- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome
- **Tarif und Konto zum Erzeugungsdatum (A1):** ChatGPT **Plus**, Konto `maschoeller` (in der ChatGPT-Seitenleiste abgelesen am 2026-10-24 16:02)
- **Modellversion:** ChatGPT-Bildgenerierung; die Oberfläche nennt keine Versionsnummer (Modus „Medium“)
- **Datum:** 2026-10-24, 16:02–16:25; zwei Chats (Brenna, Mira), gleichzeitig in eigenen Tabs
- **Originale (A3):** ChatGPT lieferte alle Bilder im Zielformat (1254 × 1254, RGBA, echter Alphakanal). Die Dateien `art/mockups/characters-s1/{brenna,mira}*.png` sind die **unveränderten Originale** (byte-gleich mit dem Download, Git LFS), wie in `moods_2026-10-24.md`.
- **Abgelöste Fassungen (A3):** die bisherigen Neutralbilder (Moodboard 2026-10-23) und ihre Stimmungen (`moods_2026-10-24.md`) liegen unverändert in `art/mockups/characters-s1/source/superseded_2026-10-24/` (`brenna.png`, `brenna_angry.png`, `brenna_happy.png`, `brenna_sad.png`, `mira.png`, `mira_angry.png`, `mira_happy.png`). Sie werden nicht mehr ausgeliefert; `tools/art/build.py` liest nur die oberste Ebene von `characters-s1/`.
- **Menschlicher Anteil (A2):** Prompt, Auswahl, Abnahme und Korrekturanweisung; keine Nachbearbeitung, kein Zuschnitt, keine Übermalung
- **A7:** Prompts ohne Namen geschützter Werke, Marken oder Künstler

## Teil 1 – Item-Bilder der Basiswaffen

**Keine neue Erzeugung.** Für alle drei Items lagen bereits gemalte Bilder aus dem Item-Durchlauf vom 2026-10-23 vor (`art/prompts/items_all.md`, Chat 1 „Basiswaffen“ und Chat 2 „Bücher, Fokus, Laute“), weil damals schon der ganze Staffel-Katalog (`concept/21-gdd/items.md` §6.1) gemalt wurde. Nach der Regel des Produktinhabers („vorhandene generierte Bilder im Zweifel verwenden“, UX-Entscheidungslog 2026-10-24) werden sie unverändert verwendet; Herkunft, Tarif und Originale stehen in `items_all.md`.

| Item | Bild | Prüfung |
|---|---|---|
| `iron_dagger` (Eisendolch) | `art/items/iron_dagger.png` | ✓ schlichter Eisendolch, Lederwicklung, Stil wie `iron_sword` |
| `hunting_bow` (Jagdbogen, Gruppe `light_bow`) | `art/items/hunting_bow.png` | ✓ schlanker Holzbogen mit grüner Griffwicklung, sichtbar leichter als `iron_bow` |
| `travel_lute` (Wanderlaute) | `art/items/travel_lute.png` | ✓ einfache Laute mit rotem Band, Stil der übrigen Items |

Verdrahtung wie alle Items: Feld `image` entfällt (Standard = `id`), `pnpm art:build` baut `public/assets/items/<id>.webp`. Übersicht: `art/mockups/weapons_2026-10-24_overview.png`.

## Teil 2 – Brenna und Mira

**Referenzen je Chat (Bildanhänge):** 1. das bisherige Neutralbild der Figur (`brenna.png` bzw. `mira.png`, Moodboard 2026-10-23) nur für die Identität; 2.–4. `tobin.png`, `kael.png`, `halvard.png` (freigegebene Round-Chibi-Porträts aus `art/mockups/characters-s1/`) als Stilreferenz.

**Erste Nachricht (Brenna):**

> Create an image. The FIRST attached image shows BRENNA, a character of my original fantasy tactics RPG 'Hollow Crown' - use it ONLY for her identity (face, freckles, curly copper-red hair in a thick braid, broad grin, fur-trimmed leather and chain armour, ember-orange armband, huge double-bitted axe resting on her shoulder, all colours). The other three attached portraits (TOBIN, KAEL, HALVARD) are the APPROVED STYLE REFERENCES. Redraw Brenna in EXACTLY their style: 'Round Chibi Cartoon' - big ROUND head, large expressive eyes, short rounded body with chibi proportions (head clearly larger relative to the body than in her current image), soft dark-brown outlines, simple glossy cel shading, bright warm colors, toy-like rounded forms. She stays a big, strong, 41-year-old woman - show that with broad shoulders, sturdy build and laugh lines, never with realistic proportions, detailed muscles or detailed anatomy. Keep her outfit, axe and colours unchanged. FORMAT like the references: square 1:1, one single character, half-body dialogue portrait (head to hips), body turned slightly, centered, FULLY TRANSPARENT background (PNG with real alpha channel), no floor, no shadow, no text, no frame. Expression: neutral-friendly - motherly, rough, a warm broad grin.

**Erste Nachricht (Mira):** gleich aufgebaut, Identität *24-year-old former poacher and archer: face, freckles, sharp hazel eyes, sly smirk, dark-brown hair in a messy side braid with a feather, hooded forest-green cloak, leather bracers, quiver with arrows over the shoulder, longbow in hand with ember-orange cloth tied to the bow, all colours*; Stilteil ohne den Satz zum Alter, dafür *never realistic proportions or detailed anatomy*; Ausdruck *neutral - sarcastic, skeptical, a sly smirk*.

**Korrektur (beide Chats, 2. Nachricht):**

> Good direction - identity, outfit, `<axe | bow>` and colours are right. But she is still not chibi enough compared with the TOBIN reference. Please redo it from scratch with STRONGER round-chibi proportions like TOBIN: the head clearly bigger and rounder (about one third of the visible figure height), a short, compact, rounded body, chunkier simplified hands and arms, simpler rounded `<armour>` shapes with less fine detail, the same soft dark-brown outlines and simple glossy cel shading. Keep everything else identical: same character, `<MERKMALE>`. Square 1:1, half-body (head to hips), centered, FULLY TRANSPARENT background with real alpha, no text.

**Stimmungen (Folgenachrichten im selben Chat):** erste Stimmung mit *Approved - this last image is now the official neutral portrait of `<NAME>`. Now make a MOOD VARIANT of exactly this approved image (your last generated image): the same character (`<MERKMALE>`), the same pose, the same framing and crop, the same size and position on the canvas, the same round chibi style and rendering. Square 1:1, one single character, FULLY TRANSPARENT background (PNG with real alpha channel), no floor, no shadow, no text. Change ONLY the facial expression, eyebrows and shoulders. Mood: `<STIMMUNG>`*; weitere mit *Approved. Next variant of the SAME approved neutral portrait (`<the grinning | smirking one>`, not your variants) - identical in everything (…); change ONLY the facial expression, eyebrows and shoulders. Mood: `<STIMMUNG>`*. Die Stimmungstexte sind dieselben wie in `moods_2026-10-24.md` (brenna angry/happy/sad, mira angry/happy).

## Abnahme

Geprüft je Bild nebeneinander mit dem alten Neutralbild, `tobin.png` und dem neuen Neutralbild (volle Größe und 320-px-Miniatur): Identität, Kleidung, Farben, Waffe gleich; Proportionen wie Tobin; Leinwand 1254 × 1254, Alphakanal echt (0–255), Ausschnitt Kopf bis Hüfte wie bei den anderen.

| Datei | Iterationen | Ergebnis |
|---|---|---|
| `brenna.png` | 2 | 1. Fassung **verworfen**: Gesicht runder, Körper aber noch fast so lang und muskulös wie vorher, nicht chibi genug neben Tobin. 2. Fassung ✓ großer runder Kopf, kompakter Körper, Zopf, Doppelaxt, Armbinde und Pelzkragen erhalten |
| `brenna_angry.png` | 1 | ✓ Schrei mit gefletschten Zähnen, Pose und Ausschnitt gleich |
| `brenna_happy.png` | 1 | ✓ geschlossene Lachaugen, warmes Lächeln – anders als das laute Grinsen des Neutralbilds |
| `brenna_sad.png` | 1 | ✓ Brauenmitte hoch, glasige Augen, Mund unten, Schultern leicht gesenkt |
| `mira.png` | 2 | 1. Fassung **verworfen**: Kopf größer, aber noch zu gestreckt und detailreich. 2. Fassung ✓ runder Kopf, große haselnussbraune Augen, Seitenzopf mit Feder, grüner Umhang, Langbogen mit glutorangem Band |
| `mira_angry.png` | 1 | ✓ Knurren mit gefletschten Zähnen, gesenkte Brauen |
| `mira_happy.png` | 1 | ✓ offenes Lächeln mit Zähnen statt Grinsen |

- Die verworfenen Fassungen werden nicht ausgeliefert und liegen nicht im Repo.
- **Ähnlichkeitsprüfung (A7):** Neuzeichnungen eigener Figuren; keine erkennbare Vorlage, keine Namen von Werken, Marken oder Künstlern in den Prompts.
- **Laufzeit:** `pnpm art:build` baut daraus Köpfe (`public/assets/avatars/brenna.webp`, `mira.webp`), Halbfiguren der Truppe (`busts/`) und Szenen-Halbfiguren (`halves/<id>[_<mood>].webp`). Übersicht aller Stimmungen: `art/mockups/moods_overview.png` (neu gebaut).
