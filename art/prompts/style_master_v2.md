# style_master_v2 – Stil-Vorlage für Porträts und Gesichter (Etappe 2 der Überarbeitung)

- **Datum:** 2026-11-01
- **Zweck:** Ein fester Stil-Block plus Regeln zur Individualisierung, damit die Dialog-Porträts aus einem Guss wirken, die Figuren aber nicht gleich aussehen (Roadmap `concept/27-ueberarbeitung/roadmap.md`, „Figuren-Stil“, Etappe 2).
- **Gilt für:** Dialog-Porträts (`art/mockups/characters-s1/<id>.png` und ihre Stimmungen, Format `art-direction.md` §5.1). **Nicht** für die Brettfiguren: Die 3D-Figuren sind auf dem Brett so klein, dass ihr Stil im Großen und Ganzen passt (Produktinhaber, 2026-11-01); Körper sind zweitrangig.
- **Status:** getestet an Brenna, Grosk, Liora und Kael (§4); Alternativen in §5; Wahl des Produktinhabers im Decision-Log `concept/23-art-direction/decision-log.md`.

## 1. Befund: vier Stile nebeneinander

Die 42 Porträts in `art/mockups/characters-s1/` stammen aus mehreren Chats mit wechselnden Referenzen (README dort). Sie wirken nicht wie aus einem Guss, sondern wie vier parallele Zeichenstile. Am deutlichsten an den Gesichtern:

| Familie | Figuren (Beispiele) | Merkmale im Gesicht |
|---|---|---|
| **A – klares Chibi** (gefällt) | Rhen A und B, Fenn, Tobin, Ysolde, Pell, Kit | runder Kopf mit weichem Kinn, Augen mittelgroß mit kräftiger Oberlid-Linie und einfacher Iris, Nase als kurzer Strich, Mund als einfache Form, kaum Hautschatten, Haar in großen Büscheln, gleichmäßige Linie |
| **B – halbrealistisch** | Kael, Dravn, Torvald, Aldric | längeres Gesicht, kantiger Kiefer, modellierte Nase, Bartstoppeln als Textur, viele Hautschatten und Falten, Rüstung mit Glanz und Gravur |
| **C – Cartoon-Karikatur** | Grosk, Osric, Brenna, Mira, Hask, Gerrit, Amos | Knollennase mit rotem Glanz, rosige Wangen, breites Zahn-Grinsen, dicke Wimpern (Brenna, Mira), große glänzende Augen mit mehreren Lichtern, „Animationsfilm-Look“ |
| **D – Puppengesicht** | Seraphine, Liora, Eluned, Rowena, Vesna | sehr große, funkelnde Augen mit Wimpern, winziger Mund, porzellanglatte Haut, symmetrisch, Goldschmuck |

Was A von den anderen trennt, sind nicht die Figuren, sondern **die Bauweise des Gesichts**: wie Auge, Nase, Mund und Haut gezeichnet werden und wie viel gerendert wird. B rendert zu viel, C übertreibt Nase und Glanz, D vergrößert die Augen. Jede Familie hat ihre eigene Augen-, Nasen- und Schattierungsregel; deshalb wirkt der Kader zerrissen.

**Folgerung:** Die Zeichenregeln für Auge, Nase, Mund, Haut, Linie und Rendering werden für alle festgeschrieben (Familie A). Unterschiede entstehen nur über **Form** (Kopfform, Kiefer, Nasenform, Augenform, Brauen, Ohren, Haar, Alterszeichen, Hautton, Palette, Kleidung) – nie über die Machart.

Was die Lieblinge zusätzlich auszeichnet: Jede hat einen konkreten Makel oder ein Ding (gesprungene Nadel, Pflaster, Zahnlücke, Brille, Tintenflecken) und einen bestimmten Ausdruck (ernst, frech, eifrig, süffisant). Die schwächeren Prompts beschreiben Stimmung mit Adjektiven (*gentle, serene, kind, warm*); das führt zum Durchschnittsgesicht.

## 2. Fester Stil-Block

Wörtlich und unverändert in jeden Prompt (englisch). Dazu als Stil-Anker die Bilder `rhen_a.png` und `fenn.png` anhängen (Satz im Block).

```text
STYLE (fixed, Hollow Crown portrait v2). The attached images are STYLE ANCHORS ONLY: copy
their drawing technique, never their face, hair, body or clothes.
Round-chibi cartoon dialogue portrait. Clean dark-brown line (never black) of even medium
weight, slightly thicker outer contour. Flat colours with exactly ONE shadow tone per colour
and at most one simple highlight shape on hair and metal; no airbrush, no gradients, no
texture, no glow, no rim light.
FACE CONSTRUCTION, identical for every character (only the SHAPES vary):
- Eyes: strong dark upper-lid line, simple coloured iris with a darker top, round pupil,
  exactly ONE small white catchlight; no lower lashes, no sparkles, no extra highlights.
  Eye SIZE and SHAPE come from the character block.
- Nose: a simple line drawing (short stroke or small angled shape) with at most one small
  flat shadow; never a shaded or shiny bulb, no red nose tip unless stated.
- Mouth: simple line or open shape with a flat dark inside and one white teeth shape.
- Skin: one flat tone plus one shadow tone; no blush, no glossy skin, no pore or stubble
  texture (stubble = one flat slightly darker area).
- Wrinkles, scars and age lines: a few clean single lines, never hatching.
Hair: a few big clumps with 2-4 stray strands, one shadow tone, one highlight shape.
PROPORTIONS exactly like the anchors: round chibi, big round head about one third of the
image height, short compact body (about 2.5 heads tall overall), short arms, small hands;
the eyes sit at about one third from the top of the image, the same for every portrait.
Build and face shape vary per character, the chibi proportions do not.
Clothes rendered like the anchors: a few big clean shapes, flat colour plus one shadow
tone, no fabric texture, no grain, no scratches, no weathering marks, no dirt; patches,
repairs and missing emblems as flat clean shapes (like the patches on Fenn); chainmail as a
flat grey area with a few ring marks at the edges; straps as plain bands; metal with one
shadow tone and one simple highlight shape. No gold filigree, no embroidery patterns, no
gems, at most one prop, held low and never covering the face.
```

> **v2.1 (2026-11-01, nach Feedback):** In v2 stand nur „Kopf 40 % der Bildhöhe“. ChatGPT malte die Gesichter richtig, aber Körper zu erwachsen (3,5–4 Köpfe) und Kleidung mit Stoffstruktur, Kratzern und Abnutzung. Der Produktinhaber: Figuren gefallen, sollen aber in Proportion und Machart genau wie die Anker sein. Deshalb stehen Proportionen und Kleidungs-Machart jetzt ausdrücklich im Block. Die Korrektur lief als Folgenachricht im selben Chat (Anker schon angehängt) und reichte in einem Schritt.

### Format-Block (§5.1)

```text
FORMAT: square 1:1, one single character, half-body dialogue portrait (head to hips), body
turned slightly to the viewer's left, face three-quarter, centred, FULLY TRANSPARENT
background (PNG with real alpha channel), no floor, no shadow, no text, no frame.
```

## 3. Figurenblock (Individualisierung)

Jede Zeile ist Pflicht. Konkrete Formen und Dinge statt Stimmungs-Adjektive.

```text
CHARACTER: <NAME>, <age>, <role>; <one sentence biography>.
HEAD: <round | square | long oval | heart | pear | egg | blocky> head, <jaw/chin>, <ears>.
EYES: <small | medium | large>, <round | almond | narrow | droopy | hooded | upturned>, <iris colour>.
BROWS: <thick straight | thin arched | bushy | low heavy | sparse>.
NOSE: <button | straight | long | hooked | broad flat | broken bump> (still a simple line drawing).
MOUTH: <wide | small | thin-lipped | full>, <teeth detail if any>.
MARKS AND AGE: <freckles | scar | mole | crow's feet | grey temples | missing tooth | none>.
SKIN: <explicit tone>.
HAIR: <texture: straight | wavy | curly | coily | stubble | bald>, <cut and how it is worn>.
BUILD (visible part): <narrow-shouldered | broad | heavy | wiry | soft>.
PALETTE: dominant <colour #hex>, secondary <colour #hex>, accent <colour #hex>.
CLOTHES TELL: <origin>, <what is worn, repaired or wrong-sized>, <one hint at the past>.
EXPRESSION: <concrete: e.g. one brow raised, lopsided half-grin | flat mouth, tired eyes>.
SIGNATURE: <the one recognisable part>.
```

### Regeln für den Kader

1. **Machart fest, Form frei.** Auge, Nase, Mund, Haut, Linie und Rendering sind für alle gleich (Stil-Block); Kopfform, Augenform und -größe, Nasenform, Brauen, Ohren, Haar, Alterszeichen variieren.
2. **Kopfformen streuen:** In einer Gruppe (Kompanie, Leutnants, Hof) teilen höchstens zwei Figuren dieselbe Kopfform. Rund = weich, jung; Quadrat und Block = verlässlich, stur; langes Oval = vornehm, ernst; Herz = schlau, verspielt; Birne und Ei = behäbig, komisch.
3. **Augengröße nach Alter, nicht nach Geschlecht:** groß für Kinder und Jugendliche, mittel für junge Erwachsene, klein für Ältere und Harte. Nie die D-Augen (riesig, Wimpern, Funkeln) für junge Frauen als Standard.
4. **Nasen variieren in der Form, nicht in der Machart:** Knollennase ist erlaubt, aber als Linie, nicht als glänzende Kugel.
5. **Alter und Härte** über Linien (Falten, Narben, Tränensäcke), Haar und Bart zeigen, nie über realistisches Rendering.
6. **Hautton** immer ausdrücklich nennen und über den Kader streuen; ohne Angabe malt ChatGPT alle gleich hell.
7. **Haarstruktur** ausdrücklich nennen und streuen; höchstens eine Figur je Gruppe mit langem glatten Haar.
8. **Palette:** drei Farben mit Hex; Glutorange `#E8743B` bleibt das kleine Aschenbanner-Teil. Adel und Tempel ohne Goldornament; Reichtum über Stoffmenge und Farbe zeigen.
9. **Kleidung als Biografie:** Herkunft, Zustand, ein Hinweis auf die Vergangenheit (abgetrenntes Wappen, gesprungene Nadel). Keine Teile nur „weil Krieger“.
10. **Verbotene Wörter im Figurenblock:** *beautiful, handsome, cute, gentle, serene, kind, warm, cheerful, confident, heroic, elegant, twinkling*.
11. **Stimmungen** (`_happy`, `_angry`, `_sad`) im selben Chat direkt nach dem neutralen Bild, mit dem neutralen Bild als einziger Referenz: „same character, same pose and crop, change only brows, eyes, mouth and shoulders“.
12. **Neuer Chat je Figur** (Stil-Anker neu anhängen). Lange Folgechats ziehen die Gesichter zur ersten Figur hin.
13. **Abnahme nebeneinander:** jedes neue Porträt neben Rhen A und Fenn in gleicher Größe prüfen: Augen, Nase, Linie, Schatten gleich gebaut? Kopf gleich groß im Bild?

## 4. Test an Brenna, Grosk, Liora (und Kael als Vergleich)

ChatGPT (Bildgenerierung) über Claude in Chrome, je ein neuer Chat, Stil-Anker `rhen_a.png` + `fenn.png`, Stil-Block + Format-Block + Figurenblock. Bilder in `art/mockups/style-2026-11/`. Bewertung in §6.

### Brenna

```text
CHARACTER: BRENNA, 41, front-line axe fighter and the captain's second; took the blame for her brother's crime and was cast out by her family; motherly, tells bad jokes.
HEAD: square head, strong wide jaw, small ears.
EYES: small, slightly hooded, hazel.
BROWS: thick straight, copper.
NOSE: broad with an old break (small bump).
MOUTH: wide, thin-lipped.
MARKS AND AGE: freckles across nose and cheeks, crow's feet, a small scar on the chin.
SKIN: ruddy, weathered pale skin.
HAIR: thick frizzy copper-red curls pulled back into ONE THICK BRAID over her shoulder, frizz at the temples.
BUILD (visible part): broad shoulders, thick strong arms.
PALETTE: dominant faded moss green #5E6B45, secondary rust-brown leather #7A4A2B, accent ember orange #E8743B.
CLOTHES TELL: a hand-me-down chainmail shirt with a leather patch; a leather vest with a bare lighter rectangle on the chest where a family crest was torn off; ember-orange band on her left upper arm.
EXPRESSION: one eyebrow raised, lopsided half-grin, like she just told a bad joke and waits for the laugh.
SIGNATURE: the thick copper braid.
```

### Grosk

```text
CHARACTER: GROSK, 44, bandit chief with a soft heart; discharged from the army as an invalid, now feeds a starving camp.
HEAD: egg-shaped bald head, small chin hidden by the beard, ears that stick out.
EYES: small, round, dark brown, set close together.
BROWS: bushy black, drooping at the outer ends.
NOSE: broad flat potato nose (as a simple line drawing).
MOUTH: hidden in the beard, a small worried line.
MARKS AND AGE: an old scar across the scalp, forehead wrinkles.
SKIN: warm tan, sun-browned scalp.
HAIR: bald, a HUGE bushy black beard down to the chest.
BUILD (visible part): huge, round belly, narrow sloping shoulders.
PALETTE: dominant dull army olive #6B6A3A, secondary dark brown leather #4A3324, accent faded red #9A3B32.
CLOTHES TELL: his old army gambeson with sleeves cut off and a faded regiment stripe on one shoulder; big crude leather patches; a wooden brace strapped to his left forearm (old injury).
EXPRESSION: brows up in the middle, worried and apologetic, shoulders slightly hunched.
SIGNATURE: the huge beard.
```

### Liora

```text
CHARACTER: LIORA, 22, healer; former temple novice thrown out for asking forbidden questions; foster daughter of the old keeper; guarded and stubborn.
HEAD: long oval head, narrow pointed chin.
EYES: medium, narrow almond, heavy lids, pale grey-blue.
BROWS: straight, serious, slightly drawn together.
NOSE: long and straight.
MOUTH: small, pressed together.
MARKS AND AGE: faint tired shadows under the eyes, a small mole under the left eye.
SKIN: light brown.
HAIR: very long straight silver-white hair, tied loosely low at the nape, one uneven chopped-off strand on the right side.
BUILD (visible part): thin, narrow shoulders, long neck.
PALETTE: dominant undyed oatmeal linen #C9BBA0, secondary slate grey #5D6470, accent ember orange #E8743B (small hair ribbon).
CLOTHES TELL: her plain novice robe with a darker unfaded patch on the chest where the temple sign was picked off; a grey travel shawl that is too big.
EXPRESSION: guarded, chin down, eyes looking up from under the brows, mouth tight.
SIGNATURE: the very long silver-white hair.
```

### Kael (auch Probefigur der Alternativen)

```text
CHARACTER: KAEL, 38, captain of a mercenary company; border-war veteran whose unit was sacrificed by a noble commander; dry, reliable, a bear with a quiet voice.
HEAD: blocky square head, heavy jaw.
EYES: small, slightly droopy, tired amber.
BROWS: low and heavy, dark brown.
NOSE: straight, a little broad.
MOUTH: wide, flat line.
MARKS AND AGE: short scar through the right eyebrow, short dark stubble (as a flat darker area), faint lines under the eyes.
SKIN: light olive, weathered.
HAIR: dark brown, thick and straight, tied into a short low ponytail, strands falling at the temples.
BUILD (visible part): very broad shoulders and chest.
PALETTE: dominant gunmetal grey #5A5F66, secondary dark brown leather #4B3426, accent ember orange #E8743B.
CLOTHES TELL: a dented old army breastplate with the noble crest scratched out; one big mismatched rounded pauldron on his left shoulder; frayed grey cloak; ember-orange sash.
EXPRESSION: calm, unimpressed, mouth a flat line, one corner slightly up.
SIGNATURE: the big mismatched left pauldron and the low ponytail.
```

## 5. Alternativstile (Vergleich, Probefigur Kael)

Drei bewusst andere Richtungen mit demselben Kael-Figurenblock und demselben Format-Block, ohne Stil-Anker. Der Stil-Block wird ersetzt.

### Alt A – Bilderbuch, Tusche und Gouache

```text
STYLE: European storybook illustration for a dialogue portrait: loose hand-inked dark-sepia
line with varying width, flat gouache colour fills with a slight paper grain, muted earthy
palette, small expressive eyes (simple dots or short strokes), slightly longer proportions
(head about one third of the visible body), characterful and a little rough, like a page
from a hand-painted picture book. One soft shadow tone. Every character drawn with the same
brush, same eye and nose shorthand.
```

### Alt B – Grafische Formensprache

```text
STYLE: bold graphic cartoon dialogue portrait with strong geometric shape language: head and
body built from a few big simple shapes, sharp clean corners mixed with round ones, NO
outline (shapes separated by colour only), flat colours with one hard-edged shadow shape,
small simple eyes (dark ovals with one catchlight), nose as one geometric shape, modern
stylised TV-animation look, very readable at small size.
```

### Alt C – Klare Linie

```text
STYLE: European clear-line comic dialogue portrait: one uniform thin black ink line, no line
variation, completely flat colours with NO shading at all, simple dot-like eyes with no
highlights, small clear noses, natural cartoon proportions (head about one quarter of the
visible half-body), precise, calm and readable, like a classic adventure comic album panel.
```

## 6. Ergebnis

Wird nach dem Test ergänzt.
