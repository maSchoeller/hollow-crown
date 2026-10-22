# Prompts der Anime-Beispiele (ChatGPT, 2026-10-22)

Erzeugt im ChatGPT-Plus-Abo des Produktinhabers, gesteuert über Claude in Chrome. Folgebilder einer Figur entstanden **im selben Chat** wie das Referenzblatt, damit Gesicht, Rüstung und Farben gleich bleiben (siehe `16-asset-pipeline.md` §3).

## Gemeinsamer Stil-Block

> Style: bright anime illustration, clean cel shading with two shadow tones and one soft gradient, clean medium-weight colored line art (dark brown lines, not black), saturated but grounded palette, slightly mature facial proportions (not moe), plain light ivory background.

## Referenzblätter

Aufbau: *„Create an image: character reference sheet for an original high-fantasy tactics RPG called 'Hollow Crown'. {Stil-Block} Landscape layout: full-body front view, three-quarter view and back view of the same character side by side, plus a head close-up and a row of color swatches with labels. Character: {Briefing}. No text other than the swatch labels and the name {NAME}.“*

| Datei | Briefing (gekürzt, vollständig in `15` §6.3) |
|---|---|
| `kael_sheet.png` | KAEL, 34, mercenary captain, dark brown low ponytail, stubble, tired amber eyes, scar through left eyebrow, dented knight's breastplate with **scratched-off winged-lance emblem**, single large left pauldron, ash-grey frayed cloak, ember-orange sash, longsword |
| `brenna_sheet.png` | BRENNA, 41, fighter, broad and muscular, copper-red braid with grey strands, freckles, fur-collared leather vest, burn-scar tattoos, ember-orange arm band, hand axe + two-handed battle axe |
| `tobin_sheet.png` | TOBIN, 17, spearman, lanky, messy straw-blond hair, tooth gap, oversized gambeson, **far too large crooked kettle hat**, ember-orange arm band, wind-green scarf, cloth-wrapped spear |

## Folgebilder

| Datei | Prompt (gekürzt) |
|---|---|
| `kael_expressions.png` | *„Using exactly this Kael design … expression sheet for visual-novel dialogue portraits: a 3x2 grid of six identical half-body portraits (same pose and framing) … NEUTRAL, HAPPY (small dry smile), ANGRY, SAD, SURPRISED, HURT … Only the face, eyebrows and shoulders change … Subtle ember-orange rim light.“* |
| `kael_cutin.png` | *„Critical-hit cut-in banner … ultra-wide 8:3, dynamic diagonal composition, close-up of Kael's intense amber eyes, longsword slashing diagonally with a bright motion arc, earth-element energy (stone shards, golden-brown dust), speed lines in warm ochre (#B9874B) over dark navy with ember-orange accents. No text.“* |
| `bg_varnhold_burning.png` | *„Visual-novel dialogue background, 16:9, no characters: market town Varnhold at dusk on fire … painted anime film background style, slightly desaturated and softly blurred … important elements inside the central third for a portrait crop.“* |
| `keyart_draft.png` | *„Key art / title screen, 9:16: Kael and the hooded tactician from behind, a broken hollow golden crown of embers above them, mountain range at dusk with the silhouette of an awakening dragon with magma cracks … top 20 % calm for a logo.“* |

## Beobachtungen

- Die Referenzblätter treffen Briefing und Signaturdetails zuverlässig (herausgekratztes Emblem, schiefer Kesselhut, Zopf mit grauen Strähnen).
- Der Stil fällt eher **semi-realistisch** aus als „hell, klares Cel-Shading“. Für die Produktion den Stil-Block um *„flat cel shading, fewer rendered textures, brighter highlights“* schärfen und ein freigegebenes Bild als Stilreferenz mitschicken.
- Konsistenz innerhalb eines Chats ist gut, aber **nicht verlässlich bei Signaturdetails**: Im Stimmungsblatt ist Kaels Lanzen-Emblem wieder intakt statt herausgekratzt. Signaturdetails im Folge-Prompt ausdrücklich wiederholen und jedes Bild gegen `15` §6.3 abnehmen.
- Für neue Chats das Referenzblatt als Bild hochladen.
- Der VN-Hintergrund kommt scharf und voll gesättigt, obwohl „weichgezeichnet, entsättigt“ verlangt war. Das in der Nachbearbeitung (Blur + Sättigung −15 %) erledigen statt im Prompt.
- Key Art: Die „zerbrochene“ Krone wurde als **zwei** Kronen gedeutet. Für die finale Fassung „one single crown, cracked down the middle, hollow inside“ formulieren.
- Text im Bild (Namen, Swatch-Labels) gelingt sauber; für Porträts trotzdem „no text“, damit keine Reste bleiben.
- Wartezeit pro Bild mit Plus etwa 1–2 Minuten; drei Chats parallel funktionieren.
