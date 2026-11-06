# portrait_tests_2026-11 – Herleitung des Porträtstils (Etappe 2 der Überarbeitung)

> Seit Story 15.6 (2026-11-06) heißen Kaels Dateien und IDs `lucan` (`kael_board` → `lucan_anims_base`, sonst `kael*` → `lucan*`). Dieses Protokoll bleibt im Wortlaut der Erzeugung.


> **Die Testbilder wurden am 2026-11-02 entfernt** und liegen im Git-Verlauf (`art/mockups/style-2026-11/` bis Merge von PR #94). Abgenommene Figuren stehen in `art/mockups/characters-s1/`.

> **Abgelöst als Vorlage durch `art/prompts/portrait_master.md`.** Diese Datei bleibt als Herleitung und als Prompt-Protokoll der Testbilder in `art/mockups/style-2026-11/` (licensing.md §6, A2). Für neue Porträts nur `portrait_master.md` verwenden.

- **Datum:** 2026-11-01
- **Zweck:** Ein fester Stil-Block plus Regeln zur Individualisierung, damit die Dialog-Porträts aus einem Guss wirken, die Figuren aber nicht gleich aussehen (Roadmap `concept/27-ueberarbeitung/roadmap.md`, „Figuren-Stil“, Etappe 2).
- **Gilt für:** Dialog-Porträts (`art/mockups/characters-s1/<id>.png` und ihre Stimmungen, Format `art-direction.md` §5.1). **Nicht** für die Brettfiguren: Die 3D-Figuren sind auf dem Brett so klein, dass ihr Stil im Großen und Ganzen passt (Produktinhaber, 2026-11-01); Körper sind zweitrangig.
- **Status:** **Fassung v2.4 gewählt** (Produktinhaber, 2026-11-01), Decision-Log `concept/23-art-direction/decision-log.md`. Getestet an Brenna, Grosk, Liora und Kael (§4); Alternativen in §5.
- **Herkunft (licensing.md §6, A1–A3):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; Tarif **Plus**, Konto `maschoeller` (Seitenleiste, 2026-11-01); keine Modell-Versionsnummer sichtbar (Denkaufwand „Medium“). Originale unverändert in `art/mockups/style-2026-11/` (LFS), Download per `fetch` der Bildquelle im Chat. Menschlicher Anteil: Auswahl, Korrekturanweisungen, keine Retusche. Die Bilder sind Stiltests, keine Spiel-Assets.

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

## 2. Fester Stil-Block (Fassung v2.4)

Wörtlich und unverändert in jeden Prompt (englisch). Stil-Anker anhängen: **`art/mockups/characters-s1/rhen_a.png` und `fenn.png`** (die bisherigen Porträts von Rhen A und Fenn; sie bleiben unverändert und sind der Maßstab, Produktinhaber 2026-11-01). Der Satz dazu steht im Block.

```text
STYLE (fixed, Hollow Crown portrait v2.4). The attached images are STYLE ANCHORS ONLY: copy
their drawing technique and proportions, never their face, hair, body or clothes.
Round-chibi cartoon dialogue portrait. Clean dark-brown line (never black) of even medium
weight, slightly thicker outer contour.
SHADING: two-tone cel shading, light from the upper left: base colour, one clear shadow
tone, plus a smaller darker core shadow in the deepest spots (under chin and hair, inside
folds, under straps and belts, where arms meet the body); a soft occlusion shadow where
layers overlap; one small highlight shape on hair, leather, metal and eyes. No airbrush,
no gradients across big areas, no texture, no glow, no rim light.
FACE MATURITY exactly like the anchors: the same head shape, head size and eye placement
as RHEN and FENN - youthful chibi faces of young adults, NOT babyish, NOT toddler-like: a
defined small chin, normal anchor-sized eyes, a light hint of cheekbones. Each character
looks their stated age the way the anchors look theirs: older characters get a few clean
lines (eye corners, forehead, nasolabial), a firmer jaw, beard or grey hair, but keep the
same chibi head; never a longer, realistic or rugged face.
FACE CONSTRUCTION, identical for every character (only the SHAPES vary):
- Eyes: strong dark upper-lid line, simple coloured iris with a darker top, round pupil,
  exactly ONE small white catchlight; no lower lashes, no sparkles, no extra highlights.
  Eye SIZE and SHAPE come from the character block.
- Nose: a simple line drawing (short stroke or small angled shape) with at most one small
  flat shadow; never a shaded or shiny bulb, no red nose tip.
- Mouth: simple line or open shape with a flat dark inside and one white teeth shape.
- Skin: base tone plus shadow tone; no blush, no glossy skin, no pore or stubble texture
  (stubble or a short beard = one flat darker shape).
- Wrinkles, scars and age lines: a few clean single lines, never hatching.
Hair: a few big clumps with 2-4 stray strands breaking the outline.
PROPORTIONS exactly like the anchors: round chibi, big round head about one third of the
image height, short compact body (about 2.5 heads tall overall), short arms, small hands;
the eyes sit at about one third from the top of the image, the same for every portrait.
Build and face shape vary per character, the chibi proportions do not; tall, noble or
heroic characters show it only through posture, never through a longer body.
CLOTHES rendered like the anchors: a few big clean shapes, no fabric texture, no grain, no
scratches, no weathering marks, no dirt; patches, repairs and missing emblems as clean flat
shapes; chainmail as a flat grey area with a few ring marks at the edges; straps as plain
bands. No gold filigree, no embroidery patterns, no gems, at most one prop, held low and
never covering the face.
```

**Herleitung der Fassungen** (alle am 2026-11-01, Produktinhaber):

- **v2:** Gesichtsbau festgeschrieben, Kopf „40 % der Bildhöhe“. Gesichter gelangen, aber Körper zu erwachsen (3,5–4 Köpfe) und Kleidung mit Stoffstruktur, Kratzern und Abnutzung.
- **v2.1:** Proportionen und Kleidungs-Machart ausdrücklich „wie die Anker“. Ergebnis passt zu Rhen und Fenn, wirkt aber zu flach.
- **v2.2:** Schattierung mit Kernschatten und Okklusion statt „eine Schattenstufe“. Gefiel, aber die Gesichter waren erwachsener als bei Rhen und Fenn.
- **v2.4 (gewählt):** Gesichtsreife „exactly like the anchors“: junge Erwachsene im Chibi-Kopf, nicht kindlich; Ältere zeigen ihr Alter über wenige Linien, festeren Kiefer, Bart, graues Haar. Jede Figur in einem frischen Chat ohne Folgekorrektur (Produktinhaber: v2.3 zu kindlich; trägt v2.4 nicht, gilt v2.2). Ergebnis: Brenna, Grosk, Liora passen im ersten Versuch; Kael war zu groß und bekam per Folgekorrektur die Proportionen der Anker, daher der Satz zu großen und adligen Figuren im Block. Die Korrektur schoss über das Ziel (zu schmal, Kopf zu groß); erst die Proportions-Vorlage (§9) brachte Kael im ersten Versuch auf Rhens Umriss (`v24_kael_guide.png`). Weil dann alle Figuren denselben Körper bekämen, gibt es seither sechs Statur-Vorlagen (Regel 14).
- **v2.3 (verworfen):** kindliches Gesichtsprofil wie die Anker (großer runder Kopf, große Stirn, runde Wangen, kleines Kinn, Augen tief und weit, kurze Nase). Rhen A und Fenn bleiben, wie sie sind, und sind wieder die Anker; alle anderen Porträts werden an sie angeglichen.

Jede Korrektur lief als Folgenachricht im selben Chat und reichte in einem Schritt; die Bausteine stehen in §7.

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
BUILD: <average | slim | broad | heavy | small | tall> (attach guide_build_<build>.png), plus <one detail: e.g. sloping shoulders, thick neck, long arms>.
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
14. **Statur verteilen.** Jede Figur bekommt eine von sechs Statur-Vorlagen (`average`, `slim`, `broad`, `heavy`, `small`, `tall`; `art/mockups/style-2026-11/guide_build_<statur>.png`, erzeugt mit `python tools/art/portrait_guides.py template <datei> <statur>`). Kopf, Augenlinie und Machart bleiben gleich, Schultern, Rumpf, Bauch und Größe im Bild ändern sich. In einer Gruppe höchstens zwei Figuren mit derselben Statur; nebeneinander sprechende Figuren (Dialogpaare) möglichst verschieden. Die Statur folgt der Figur, nicht der Rolle: eine Heilerin kann `broad` sein, ein Ritter `slim`. Zusätzlich ein Detail im Feld `BUILD` (hängende Schultern, kurzer Hals, lange Arme), damit gleiche Statur nicht gleich aussieht.

   | Statur | Wirkung | Beispiele (Vorschlag für Etappe 3) |
   |---|---|---|
   | average | Maßstab, Rhen | Rhen A, Rhen B, Pell |
   | slim | schmale Schultern, schlanker Rumpf | Fenn, Mira, Liora |
   | broad | breite Schultern, kräftiger Rumpf | Brenna, Dravn, Torvald |
   | heavy | Bauch, breite Hüfte | Grosk, Amos, Osric |
   | small | kleiner im Bild, Kopf tiefer | Tobin, Kit, Ysolde |
   | tall | kleinerer Kopf, längerer Rumpf, schmal | Lucan, Odile, Halvard |

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

### Kael (neues Konzept ab v2.1, verstoßener Adliger)

```text
CHARACTER: KAEL, 38, captain of the mercenary company; a cast-out nobleman and former knight-captain of the border army who left after a noble commander sacrificed his unit; upright, calm, protective.
HEAD: well-proportioned head, refined face, slim jaw.
EYES: medium, almond, calm and a little tired, amber.
BROWS: straight, dark brown.
NOSE: straight and elegant.
MOUTH: firm, a faint dry smile.
MARKS AND AGE: a short scar through the right eyebrow, a few fine lines at the eye corners, clean-shaven.
SKIN: light olive.
HAIR: well-kept dark brown hair grown a bit too long, tied into a short low ponytail, a few strands at the temples.
BUILD (visible part): lean, not muscular, upright noble bearing.
PALETTE: dominant royal green #1F5E3B, secondary clean steel grey #8A939C, accent dark brown leather #5A3D26, plus ONE small ember-orange #E8743B cloth knot on his belt (company sign).
CLOTHES TELL: a knight's royal-green surcoat over a plain steel breastplate; the noble house emblem on the surcoat has been unpicked, leaving only a faint outline; one rounded pauldron on his LEFT shoulder; dark green cloak. No red anywhere.
EXPRESSION: calm, steady gaze, faint dry smile.
SIGNATURE: the royal-green surcoat with the unpicked emblem and the left pauldron.
```

### Reproduzierbarkeit: Rhen A und Fenn frisch aus v2.2

Neuer Chat je Figur, Anker `v22_brenna.png` + `v22_kael.png`, Stil-Block v2.2 + Format-Block + Figurenblock, keine Folgekorrektur.

```text
CHARACTER: RHEN, about 24, the player's tactician (masculine-read); expelled from the war academy over gambling debts, joined the company weeks ago and brought them the job that trapped them.
HEAD: round head, soft but defined chin.
EYES: medium, almond, sharp grey.
BROWS: straight, slightly drawn together.
NOSE: small and straight.
MOUTH: small, closed.
MARKS AND AGE: none, young face.
SKIN: light olive.
HAIR: short tousled slate-black hair, a few strands over the forehead.
BUILD (visible part): slim, narrow shoulders.
PALETTE: dominant night blue #24345E, secondary dark brown leather #4B3426, accent ember orange #E8743B (scarf).
CLOTHES TELL: night-blue tactician coat with simple silver trim and a high collar, hood folded back; a small round silver compass-star academy pin that is visibly CRACKED; leather map satchel with rolled maps across the chest; dark gloves; ember-orange scarf.
EXPRESSION: thoughtful, a little guilty, determined; brows slightly drawn together, mouth flat.
SIGNATURE: the cracked academy pin and the map satchel.
```

```text
CHARACTER: FENN, 19, ex-thief and scout; big mouth, soft heart.
HEAD: heart-shaped head, pointed chin.
EYES: large, upturned, golden.
BROWS: thin, arched, mobile.
NOSE: small button nose with a sticking plaster across the bridge.
MOUTH: wide, open cheeky grin.
MARKS AND AGE: the plaster on the nose.
SKIN: warm tan.
HAIR: wild spiky black hair sticking out under an ember-orange headband.
BUILD (visible part): lanky and narrow.
PALETTE: dominant dark grey #4A4A50, secondary brown leather #6B4A2B, accent ember orange #E8743B (headband).
CLOTHES TELL: patched dark-grey hooded jerkin, hood down on the shoulders, with big clean patches; a few pouches on the belt; fingerless gloves.
EXPRESSION: cheeky grin, one brow up, flipping a stolen coin with one hand.
SIGNATURE: the plaster on the nose and the orange headband.
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

- **v2** (erste Runde): Gesichter aus einem Guss, Brenna, Grosk und Liora individuell; Körper zu erwachsen, Kleidung mit Struktur. Kael wirkte zu bullig.
- **v2.1:** Proportionen und Machart wie Rhen A und Fenn; zu flach. Kael neu als verstoßener Adliger in königlichem Grün (Produktinhaber: „besonders der neue Kael“), Name soll sich ändern (offen).
- **v2.2:** mit Kernschatten und Okklusion; Zielstil. Bilder `art/mockups/style-2026-11/v22_*.png`.
- **Reproduzierbarkeit:** Rhen A und Fenn frisch aus v2.2 (ein Versuch je Figur, keine Korrektur), Bilder `repro_rhen_a.png`, `repro_fenn.png`; Bewertung siehe Decision-Log.
- **Alternativen** A–C (Bilderbuch, grafisch, klare Linie): nicht gewählt; B und C fielen einander ähnlich aus, weil der Figurenblock stärker wirkte als der Stil-Block.

## 7. Korrektur-Bausteine (Folgenachricht im selben Chat)

Haben in einem Schritt gewirkt. Immer mit „keep this exact image … and only …“ beginnen, damit ChatGPT nicht neu entwirft.

| Problem | Baustein |
|---|---|
| Körper zu erwachsen, Kleidung mit Struktur | „Good character design: keep this exact character, face, expression, outfit pieces and colours. But redraw it so it matches the attached anchor portraits EXACTLY in proportions and rendering. PROPORTIONS like the anchors: round chibi, big round head about one third of the image height, short compact body (about 2.5 heads tall overall), shorter arms, smaller hands. RENDERING like the anchors: clothes as a few big clean shapes, no fabric texture, no grain, no scratches, no weathering marks, no dirt; patches as flat clean shapes; straps as plain bands.“ |
| zu flach | „Keep this exact image (character, pose, crop, proportions, outfit, colours, line) and only add more DEPTH: two-tone cel shading, light from the upper left: base colour, one clear shadow tone, plus a smaller darker core shadow in the deepest spots (…); a soft occlusion shadow where layers overlap; one small highlight shape on hair, leather, metal and eyes. Still no texture.“ |
| Figur zu jung / Merkmal fehlt | „Keep this exact image … with two small fixes: add <Merkmal> and make him look about <Alter> (a few fine lines at the eye corners, slightly sharper cheekbones).“ |
| Konzept falsch (z. B. zu bullig) | neuer Figurenblock als Folgenachricht, Stil- und Formatangaben kurz wiederholen |

## 8. Schablone für neue Stile

Für den Fall, dass später ein anderer Stil gebraucht wird (neue Figurengruppe, Spin-off, Werbegrafik). Diese Vorlage ist so entstanden; der Weg ist wiederholbar.

**Vorgehen**

1. **Bestand sammeln und nebeneinanderlegen** (Kopfausschnitte in gleicher Größe). Lieblinge benennen lassen.
2. **Familien bilden:** Woran unterscheiden sich die Bilder in der *Machart*? Auge, Nase, Mund, Haut, Linie, Schattierung, Proportion, Kleidungsdetail. Nicht nach Figuren sortieren.
3. **Stil-Block schreiben** mit genau diesen Abschnitten, jeweils als feste Regel für alle Figuren:
   - `STYLE (fixed, <Projekt> <Bildart> v<Nr>)` + Anker-Satz („STYLE ANCHORS ONLY: copy drawing technique and proportions, never face, hair, body or clothes“)
   - Linie (Farbe, Stärke, Außenkontur)
   - `SHADING` (Anzahl Tonstufen, Lichtrichtung, wo Kernschatten, Glanzlichter, Verbote)
   - `FACE CONSTRUCTION` (Auge, Nase, Mund, Haut, Alterslinien; „identical for every character, only the SHAPES vary“)
   - Haar (Büschel, Strähnen)
   - `PROPORTIONS` (Kopfanteil am Bild, Köpfe gesamt, Hände; „build and face shape vary, proportions do not“)
   - `CLOTHES` (Detailgrad, Verbote wie Struktur, Ornament, Requisiten)
4. **Format-Block** getrennt halten (Bildformat, Ausschnitt, Hintergrund, kein Text).
5. **Figurenblock** wie §3: nur Formen und konkrete Dinge, Verbotsliste der Stimmungs-Adjektive.
6. **Zwei Anker** im Zielstil wählen (verschiedene Figurentypen, z. B. Frau und Mann, jung und alt) und jedem Prompt anhängen.
7. **Testen** an 3–4 Figuren aus verschiedenen Familien des Bestands, je neuer Chat; Abweichungen mit Bausteinen (§7) korrigieren und jede wirksame Korrektur in den Stil-Block zurückschreiben (neue Fassungsnummer).
8. **Reproduzierbarkeit prüfen:** zwei Figuren frisch, ohne Korrektur, nur mit Vorlage und Ankern; nebeneinander mit den Ankern abnehmen.
9. **Prompt und Abnahme** je Bild in `art/prompts/<id>.md` (Lizenz-Auflagen `licensing.md` §6: Dienst, Tarif, Datum, Original unverändert in LFS).

**Fehler, die sich gezeigt haben**

- Ein Stil-Block, der Proportionen nur als Zahl nennt („Kopf 40 %“), reicht nicht; „exactly like the anchors“ wirkt stärker.
- Lange Folgechats ziehen alle Figuren zur ersten hin; neuer Chat je Figur.
- Stimmungs-Adjektive (*gentle, serene, confident*) erzeugen Durchschnittsgesichter.
- Ein starker Figurenblock überstimmt einen schwachen Stil-Block; Alternativstile brauchen deshalb Anker, sonst gleichen sie sich an.
- ChatGPT übernimmt Entwürfe zwischen Tabs: Der Eingabeentwurf eines neuen Chats kann den Text eines anderen Tabs enthalten; vor dem Einfügen leeren.

## 9. Maßnahmen gegen lange Iterationen

Die fünf Runden (2026-11-01) zeigten: ChatGPT trifft Gesicht und Machart gut, aber Proportionen (Kopf zu Körper, Schulterbreite, Größe im Bild) schwanken von Bild zu Bild, und jede Folgekorrektur kann über das Ziel hinausschießen (Kael: erst zu massig, dann zu schmal mit zu großem Kopf). Gegenmittel:

1. **Statur-Vorlage als dritter Anhang.** `art/mockups/style-2026-11/guide_build_<statur>.png` (Regel 14 in §3), erzeugt mit `python tools/art/portrait_guides.py template <datei> <statur>`: Rhens Silhouette, nach Statur verformt, hellgrau mit roten Linien TOP, EYES, CHIN, SHOULDERS, BELT (bei `average` 2/20/33/40/78 % der Bildhöhe, bei `small` und `tall` verschoben). Im Prompt nach dem Stil-Block der Absatz `PROPORTION TEMPLATE` (§9a). Die Figur soll die Silhouette füllen; die Linien selbst darf sie nicht zeichnen.
2. **Prüfbogen statt Augenmaß.** Jedes neue Bild sofort mit `python tools/art/portrait_guides.py sheet <bogen.png> rhen_a.png fenn.png <neu>.png:<statur> …` prüfen (mit `:<statur>` wird gegen die Statur-Vorlage gemessen, Toleranz ±0,12): Hilfslinien, Rhens Umriss in Blau darüber, gemessene Breite bei 40/60/78 % mit `!`, wenn sie außerhalb der Spanne liegt. Arme, Umhänge und Requisiten verbreitern einzelne Zeilen; ein einzelnes `!` ist ein Hinweis zum Hinsehen, kein Ausschluss. Was hier durchfällt, sieht der Produktinhaber gar nicht erst.
3. **Varianten statt Kettenkorrektur.** Je Figur zwei frische Chats parallel mit demselben Prompt; die bessere Variante per Prüfbogen wählen. Höchstens **eine** Folgekorrektur je Chat; weicht das Ergebnis danach noch ab, neuer Chat.
4. **Körperbau relativ zu Rhen beschreiben.** Im Feld `BUILD` keine Wörter, die Größe oder Masse ohne Maß setzen (*lean, tall, huge, bulky, broad*), sondern „as wide as RHEN“, „about 1.3 × RHEN's shoulder width, same height“. Adel, Heldentum, Größe nur über Haltung.
5. **Korrekturen nur als „keep this exact image … and only …“** und mit dem Maß aus dem Prüfbogen („shoulders as wide as the grey silhouette“), nie „smaller“ oder „bigger“ ohne Bezug.
6. **Abnahme in einem Schritt.** Der Produktinhaber bekommt einen Prüfbogen mit allen Kandidaten einer Runde nebeneinander, nicht einzelne Bilder; Rückmeldungen gelten dann für die ganze Runde.
7. **Produktion delegieren.** Ist der Prompt fertig, erzeugen Sonnet-Subagenten die Bilder und Prüfbögen; die Session prüft nur noch die Bögen.

### 9a. Absatz für die Proportions-Vorlage

```text
PROPORTION TEMPLATE: the THIRD attached image is a measuring guide for this character's build:
a light-grey body silhouette with red lines labelled TOP, EYES, CHIN, SHOULDERS, BELT. The new
character must fill this silhouette at the same scale: top of the hair on TOP, eyes on EYES,
chin on CHIN, shoulder line on SHOULDERS, belt on BELT, shoulders and torso as wide as the grey
silhouette, the figure cut off by the bottom edge of the image exactly like the anchors.
The head keeps the anchors' size and style; the body takes the silhouette's width. Do NOT draw the lines, labels or the grey silhouette in
the result.
```

### 9b. Test der Statur-Vorlagen (2026-11-01)

Brenna `broad`, Grosk `heavy`, Liora `tall`, je ein frischer Chat ohne Korrektur, erzeugt von einem Sonnet-Subagenten nach dieser Vorlage (`art/mockups/style-2026-11/build_*.png`). Breite bei 40/60/78 %: Rhen 0,44/0,66/0,70; Brenna 0,53/0,79/0,85 (im Rahmen); Grosk 0,75/0,91/0,86 (Schulterzeile durch den erhobenen Arm über der Toleranz); Liora 0,48/0,67/0,73 (Gürtelzeile durch den Umhang darüber). Köpfe, Augenlinie und Machart blieben gleich, die Körper unterscheiden sich deutlich.

### 9c. Erster Test von portrait_master v2.5 (2026-11-01)

Liora (Pakttempel-Kit, abtrünnig; Kristallstab als Signaturteil; Kopf abgewandt, Blick von der Seite) und Hask (Banden-Kit; Irokese; fast frontal, Blick zum Betrachter), beide `slim`, je ein frischer Chat ohne Korrektur, Sonnet-Subagent. Prompt: `portrait_master.md` §2, §3, §3a plus die Figurenblöcke unten; Anhänge `rhen_a.png`, `fenn.png`, `guide_build_slim.png`. Ergebnis `art/mockups/style-2026-11/pm_liora.png` und `pm_hask.png`. Breite 40/60/78 %: Liora 0,75/0,77/0,78, Hask 0,56/0,86/0,73, beide über der `slim`-Spanne, weil Ärmel, offenes Haar, Stab, Fackel und Fell mitgemessen werden; der Körper selbst ist schmal. Die Breitenmessung taugt bei Requisiten und weiten Gewändern deshalb nur als Hinweis. Fraktionsnähe Hask–Grosk (Erdbraun, Oliv, Fell, Leder) ist sichtbar; Lioras Kronensymbol wurde gezeichnet statt ausgeschnitten.

```text
CHARACTER: LIORA, 22, healer; former novice of the Pact Temple, thrown out for asking forbidden questions; foster daughter of the old keeper; guarded and stubborn. FACTION: Pact Temple, cast out - ivory #F4EFE6 robes with flat gold #D9A931 trim bands and carmine #A3172E accents, crown motif, ceremonial and pristine; the crown symbol on her chest is cut out, leaving a clean gap; plus one small ember-orange #E8743B ribbon (company sign). BUILD: slim (see the third image), plus a long neck. HEAD: oval head, small pointed chin. EYES: medium, almond, heavy lids, pale blue. BROWS: straight, serious, slightly drawn together. NOSE: small and straight. MOUTH: small, pressed together. MARKS AND AGE: a small mole under the left eye. SKIN: light brown. HAIR: open long straight hair flowing down to the waist, silver-white, one thin braid with the ember-orange ribbon on the right side. POSE: body three-quarter facing the RIGHT edge of the image; head turned further away toward the right, chin slightly down; gaze back at the viewer from the corner of the eyes. PALETTE: dominant ivory white #F4EFE6, secondary flat gold #D9A931, accent carmine #A3172E. CLOTHES TELL: her white and pale-gold novice robe, still clean and proud, with the temple crown symbol cut out of the chest; a short white capelet; soft brown shoes. EXPRESSION: guarded, mouth tight, one brow slightly lower. SIGNATURE: the long silver-white hair and her light-staff with a small glowing crystal, held upright in one hand, low enough not to cover the face.
```

```text
CHARACTER: HASK, 40, marauder captain of the border gangs (enemy lieutenant); loves fire; his saying is "fire eats everything". FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem. BUILD: slim (see the third image), plus wiry stringy arms and a forward-leaning neck. HEAD: long narrow head, pointed chin. EYES: small, narrow, yellow-brown. BROWS: sparse, sharply angled. NOSE: hooked. MOUTH: wide sneering grin, two missing teeth. MARKS AND AGE: burn scars on one cheek and the scalp, crow's feet. SKIN: ruddy tan. HAIR: a tall spiky fiery-red mohawk with shaved sides, singed tips, a bone bead in it. POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal, leaning toward the viewer; gaze straight at the viewer. PALETTE: dominant earth brown #6B4B34, secondary dirty olive #6F6B3A, accent rust red #8E3B2E. CLOTHES TELL: spiked leather jerkin of looted pieces, a rust-red raider scarf, a necklace of teeth, a fur strip on one shoulder. EXPRESSION: gleeful sneering grin, eyes wide. SIGNATURE: the red mohawk and a burning torch held low in one hand.
```

### 9d. Skalierungstest: 10 Figuren nach portrait_master v2.5 mit Waffe (2026-11-01)

Mira (average), Tobin (small), Ysolde (small), Varek (tall), Jory (broad), Morra (tall), Ulvric (broad), Odile (slim), Mael (broad), Dravn (heavy); je ein frischer Chat, Prompt = `portrait_master.md` §2 (mit WEAPON-Absatz) + §3 + §3a + Figurenblock unten, Anhänge `rhen_a.png`, `fenn.png`, `guide_build_<statur>.png`; erzeugt von einem Sonnet-Subagenten, keine Folgekorrektur. Die erste Runde ohne Waffen-Regel wurde verworfen und neu erzeugt (Produktinhaber: Waffe in der Hand ist Pflicht). Bilder `art/mockups/style-2026-11/t10_<id>.png`.

Bewertung (Prüfbogen, Kopf-Silhouetten mit `portrait_guides.py heads`, Aufstellung aller 17 Testfiguren):

- Machart über alle 17 Figuren einheitlich; Gesichter, Blicke und Waffen deutlich verschieden; Fraktionen erkennbar (Varek und Dravn Grenzheer-Rot mit Fell, Morra, Ulvric, Hask, Grosk Bandenbraun, Mael Paktgarde, Odile Krone).
- Kopf-Silhouetten eindeutig bei Fenn (Kapuze), Tobin (Helm), Jory (Hut), Grosk (Glatze), Hask (Irokese), Morra (hoher Zopf), Ulvric (Wolfskopf), Odile (Dutt), Mael, Dravn. **Häufung:** Rhen, Brenna, Lucan, Mira, Ysolde tragen alle eine lockig-zerzauste Haarmasse; die Frisur-Regel muss bei der Kader-Zuordnung in Etappe 3 strenger greifen (Lucan glatt zurückgebunden, Mira glatt, Ysolde glatter Bob).
- Statur: `broad` und `heavy` wirken, vergrößern aber oft die ganze Figur statt nur den Rumpf (Dravn, Ulvric); `small` wird kaum befolgt (Tobin so groß wie Rhen). Die Breitenmessung schlägt bei Waffen fast immer an.
- Mit Waffe in der Hand verdecken Waffen das Gesicht nirgends; Bogen und Hammer ragen teils bis an den Bildrand.

```text
CHARACTER: MIRA, 24, archer of the company; former poacher who hates nobles. FACTION: Ashen Banner - mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot); personal piece: her old hooded forest-green poacher cloak. BUILD: average (see the third image), plus a straight back and squared shoulders. HEAD: heart-shaped head, pointed chin, small ears. EYES: medium, narrow almond, sharp hazel. BROWS: thin, one raised. NOSE: small upturned button. MOUTH: small sly smirk on one side. MARKS AND AGE: freckles across nose and cheeks, a tiny scar on the left eyebrow. SKIN: fair, sun-freckled. HAIR: thick dark-brown side braid over her left shoulder with a grey hawk feather woven in, loose strands at the temples. POSE: body three-quarter facing the RIGHT edge of the image; head turned further away toward the right; gaze back at the viewer from the corner of the eyes. PALETTE: dominant forest green #3F5A3A, secondary worn leather #8A5A3C, accent ember orange #E8743B. CLOTHES TELL: hooded forest-green cloak with the hood down, leather bracers, a quiver strap across the chest, the ember-orange cloth tied around her bracer. EXPRESSION: sarcastic one-sided smirk, one brow raised. WEAPON: a tall wooden longbow held upright in her left hand, an arrow nocked loosely between the fingers of her right hand. SIGNATURE: the side braid with the feather.
```

```text
CHARACTER: TOBIN, 17, farm boy turned soldier; the youngest of the company. FACTION: Ashen Banner - mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot). BUILD: small (see the third image), plus narrow sloping shoulders. HEAD: round head, soft round chin, ears that stick out. EYES: large, round, bright blue. BROWS: light, raised high. NOSE: small button nose. MOUTH: wide open grin with a gap between the front teeth. MARKS AND AGE: freckled sunburnt cheeks. SKIN: sunburnt pale. HAIR: messy straw-blond tufts sticking out under his helmet. POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal; gaze straight at the viewer. PALETTE: dominant padded cream #D8C9A6, secondary worn leather #8A5A3C, accent ember orange #E8743B. CLOTHES TELL: a padded gambeson clearly too big for him, sleeves rolled up, an ember-orange neckerchief. EXPRESSION: eager, proud, beaming. WEAPON: a long simple spear held upright in both hands, the steel spearhead beside his head. SIGNATURE: an oversized dented steel helmet ON HIS HEAD, tilted, clearly too big.
```

```text
CHARACTER: YSOLDE, 20, fire mage expelled from the academy; brilliant and arrogant. FACTION: Academy, cast out - dark-violet #4B3A6B academy cloth with parchment #E8DCC0 lining and ink #2A2440 trim, compass-star pin; the academy crest torn off, leaving a clean lighter patch; plus an ember-orange scarf (company sign). BUILD: small (see the third image), plus a straight, proud posture. HEAD: round head, small sharp chin. EYES: medium, upturned, sharp amber, behind ROUND GLASSES. BROWS: thin, arched, one higher. NOSE: small straight. MOUTH: small smug closed smile. MARKS AND AGE: ink stains on her fingers. SKIN: pale with a few freckles. HAIR: short choppy fiery-orange bob with a heavy uneven fringe. POSE: body three-quarter facing the RIGHT edge of the image; chin raised, head slightly tilted back; gaze down at the viewer over the rim of her glasses. PALETTE: dominant dark violet #4B3A6B, secondary parchment #E8DCC0, accent ember orange #E8743B. CLOTHES TELL: academy robe with a burnt ragged hem, the crest torn off, ember-orange scarf. EXPRESSION: smug, superior half-smile. WEAPON: a thick academy spellbook held open in one arm, a bright flame dancing above her other open palm at chest height. SIGNATURE: the orange bob and the round glasses.
```

```text
CHARACTER: VAREK, 29, swordsman of the company; deserter from the border army, gambler. FACTION: Border army, deserted - riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain; the wyvern-skull insignia torn off his jerkin; plus an ember-orange belt sash (company sign). BUILD: tall (see the third image), plus loose, slouching shoulders. HEAD: long oval head, narrow jaw. EYES: medium, droopy, dark grey. BROWS: thick, angled. NOSE: long straight. MOUTH: wide crooked grin. MARKS AND AGE: short dark stubble as a flat shape, a small gold earring. SKIN: tan olive. HAIR: black undercut with one long strand falling over his right eye, the rest swept back. POSE: body three-quarter facing the RIGHT edge of the image; head tilted to one side; winking at the viewer. PALETTE: dominant iron red #9E3B2C, secondary iron grey #4A4F57, accent ember orange #E8743B. CLOTHES TELL: open long iron-red army coat over a battered grey jerkin with the insignia torn off, playing cards peeking from a pocket. EXPRESSION: cocky wink, crooked grin. WEAPON: a curved sabre resting on his shoulder, held loosely in his right hand. SIGNATURE: the long strand over the eye and the red coat.
```

```text
CHARACTER: JORY, 26, wandering minstrel of the company, thrown out of a juggler troupe. FACTION: Ashen Banner - mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot); personal piece: faded colourful patchwork from his old troupe. BUILD: broad (see the third image), plus a short thick neck. HEAD: square head, wide jaw, big ears. EYES: medium, round, bright green. BROWS: bushy, high arched. NOSE: broad flat. MOUTH: wide open laughing mouth, teeth showing. MARKS AND AGE: a chipped front tooth, laugh lines. SKIN: deep brown. HAIR: short coily dark hair mostly hidden under his hat. POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal, leaning forward; gaze straight at the viewer. PALETTE: dominant faded teal #3F7A78, secondary faded mustard #C9A23F, accent ember orange #E8743B. CLOTHES TELL: faded patchwork doublet in teal and mustard diamonds with clean patches, the ember-orange ribbon on the lute neck. EXPRESSION: mid-laugh, mocking. WEAPON: his lute held like a club over one shoulder by its neck, a small dagger tucked in the belt. SIGNATURE: a big floppy feathered hat (the hat's silhouette dominates the head).
```

```text
CHARACTER: MORRA, 35, cold bounty huntress (enemy lieutenant); hunts the company for the gold. FACTION: Bounty hunters - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem; personal piece: a long dark leather coat kept clean. BUILD: tall (see the third image), plus long arms. HEAD: long angular head, pointed chin, high cheekbones. EYES: small, narrow, cold violet (only the left eye visible). BROWS: thin, straight, low. NOSE: sharp, slightly hooked. MOUTH: thin-lipped, one corner up. MARKS AND AGE: a black EYEPATCH over her right eye, a thin scar under it. SKIN: cool pale. HAIR: long black hair in a very high tight ponytail swinging behind her. POSE: body three-quarter facing the RIGHT edge of the image; chin raised; cold stare straight at the viewer. PALETTE: dominant black leather #2B2522, secondary earth brown #6B4B34, accent rust red #8E3B2E. CLOTHES TELL: long dark leather coat with a rust-red cloth at the collar, a bundle of blank wanted posters on her belt (no text). EXPRESSION: cool, calculating smirk. WEAPON: a loaded hand crossbow raised in her right hand, pointing up beside her head. SIGNATURE: the eyepatch.
```

```text
CHARACTER: ULVRIC, 38, leader of the wolf riders (enemy lieutenant); feral and proud. FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem. BUILD: broad (see the third image), plus hunched shoulders. HEAD: blocky head, heavy brow ridge. EYES: small, deep-set, yellow like a wolf's. BROWS: bushy, grey-brown. NOSE: broad, broken bump. MOUTH: wide feral grin showing sharp canines. MARKS AND AGE: red-brown war paint stripes across the eyes, crow's feet. SKIN: weathered tan. HAIR: shaggy grey-brown locs and beard braided with small bones. POSE: body three-quarter facing the RIGHT edge of the image; head lowered; glaring up at the viewer from under the brows. PALETTE: dominant wolf grey #6E6A64, secondary earth brown #6B4B34, accent rust red #8E3B2E. CLOTHES TELL: wolf-pelt mantle with the wolf's head worn as a hood over his head, fur and leather, a rust-red rag on the arm, a necklace of wolf teeth. EXPRESSION: wild, hungry grin. WEAPON: a long rough spear with a bone-decorated shaft held diagonally across his body in both hands. SIGNATURE: the wolf-head hood.
```

```text
CHARACTER: ODILE, 31, former royal bodyguard of the princess, dismissed after the king's murder; torn between duty and the company. FACTION: Crown, dismissed - polished rounded silver armour #C9D1DC with sky-blue #6FA8DC cloth and white #F7F9FC trim, winged-lance motif on pauldron or brooch, neat and clean; the winged-lance crest removed from the chest, leaving a clean lighter shape; plus an ember-orange cloth tied around her rapier hilt (company sign). BUILD: slim (see the third image), plus a rigid upright posture. HEAD: long oval head, defined chin. EYES: medium, almond, stern dark brown. BROWS: straight, dark, drawn together. NOSE: straight, narrow. MOUTH: small, firmly closed. MARKS AND AGE: a thin scar on her chin. SKIN: olive. HAIR: sleek black hair in a tight high bun, not a single loose strand. POSE: body three-quarter facing the RIGHT edge of the image; head turned slightly away; gaze to the side, not at the viewer. PALETTE: dominant silver-white #E9EDF2, secondary sky blue #6FA8DC, accent ember orange #E8743B. CLOTHES TELL: slim white royal guard coat with silver trim, the crest removed, white gloves. EXPRESSION: disciplined, doubtful, lips pressed. WEAPON: a slim rapier held upright in front of her in salute, blade beside her face but not covering it, the ember-orange cloth tied to its hilt. SIGNATURE: the strict bun and the white guard coat.
```

```text
CHARACTER: MAEL, 30, paladin of the Pact Guard who will later defect; devout and quietly doubting. FACTION: Pact Guard - ivory #F4EFE6 robes or white armour with flat gold #D9A931 trim bands and carmine #A3172E accents, crown motif, ceremonial and pristine. BUILD: broad (see the third image), plus a thick neck. HEAD: square head, defined jaw. EYES: medium, round, calm dark brown. BROWS: thick, straight. NOSE: broad straight. MOUTH: full lips, closed. MARKS AND AGE: a short neat beard as one flat shape. SKIN: warm brown. HAIR: short neat dark-brown crop. POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal; eyes looking down and to the side. PALETTE: dominant ivory white #F4EFE6, secondary flat gold #D9A931, accent carmine #A3172E. CLOTHES TELL: white Pact Guard plate with flat gold trim bands, a golden crown emblem on the chest, a white cape. EXPRESSION: earnest, troubled, quiet. WEAPON: a heavy white-and-gold warhammer resting on his shoulder, gripped in his right hand. SIGNATURE: the white Pact Guard armour.
```

```text
CHARACTER: DRAVN, 45, general of the border army, the late king's bastard half-brother; proud and distrustful of mercenaries. FACTION: Border army - riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain. BUILD: heavy (see the third image), plus a barrel chest. HEAD: blocky square head, wide jaw. EYES: small, hooded, hard dark brown. BROWS: heavy, low, grey-streaked. NOSE: broad, slightly bent. MOUTH: thin hard line hidden in the beard. MARKS AND AGE: a burn scar on his neck, deep forehead lines, grey temples. SKIN: ruddy pale. HAIR: very short iron-grey buzz cut, thick black beard with grey streaks. POSE: body three-quarter facing the RIGHT edge of the image; chin raised; gaze past the viewer. PALETTE: dominant iron grey #4A4F57, secondary iron red #9E3B2C, accent pine green #3E5B45. CLOTHES TELL: heavy riveted dark plate, iron-red tabard with the wyvern-skull emblem, a fur mantle over the shoulders. EXPRESSION: stern, proud, unimpressed. WEAPON: a huge two-handed war-axe resting on his shoulder, the axe head behind him but inside the image. SIGNATURE: the buzz cut and the fur mantle.
```

### 9e. Waffen nachgezogen: Rhen A, Rhen B, Fenn, Brenna, Lucan, Grosk (2026-11-01)

Alle Figuren ohne Waffe in der Hand neu aus `portrait_master.md` v2.5 (Produktinhaber: neu generieren, nicht das vorhandene Bild bearbeiten), je ein frischer Chat ohne Korrektur, Sonnet-Subagent, Anhänge `rhen_a.png`, `fenn.png`, `guide_build_<statur>.png`. Ergebnis `art/mockups/style-2026-11/w6_<id>.png`. Ein erster Versuch als Bildbearbeitung („alles bleibt, nur Waffe dazu“, nur das Original angehängt) lief schon, bevor die Anweisung kam; diese Bilder liegen als `w6_rhen_a_edit.png`, `w6_rhen_b_edit.png`, `w6_fenn_edit.png` daneben und gelten nicht. Bewertung: alle sechs mit lesbarer Waffe; Lucan mit glattem, gebundenem Haar wie verlangt; Rhen B trotz „STRAIGHT“ wieder wellig. Die alten Porträts `rhen_a.png` und `fenn.png` bleiben bis zur Abnahme der neuen die Stil-Anker.

```text
CHARACTER: RHEN, about 24, the player's tactician (masculine-read); expelled from the war academy over gambling debts, joined the company weeks ago and brought them the job that trapped them. FACTION: Academy, expelled - night-blue #24345E tactician coat with silver trim instead of the violet robe, compass-star academy pin that is visibly CRACKED; plus an ember-orange #E8743B scarf (company sign). BUILD: average (see the third image). HEAD: round head, soft but defined chin. EYES: medium, almond, sharp grey. BROWS: straight, slightly drawn together. NOSE: small and straight. MOUTH: small, closed. MARKS AND AGE: none, young face. SKIN: light olive. HAIR: short tousled slate-black hair, a few strands over the forehead. POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter; gaze toward the right edge, thoughtful. PALETTE: dominant night blue #24345E, secondary dark brown leather #4B3426, accent ember orange #E8743B. CLOTHES TELL: night-blue tactician coat with simple silver trim, high collar, hood folded back, the cracked compass-star pin, a leather map satchel with rolled maps across the chest, dark gloves, ember-orange scarf. EXPRESSION: thoughtful, a little guilty, determined. WEAPON: a plain straight short sword with a simple silver crossguard held in the right hand, the blade resting on the right shoulder. SIGNATURE: the map satchel and the ember scarf.
```

```text
CHARACTER: RHEN, about 24, the player's tactician (feminine-read, clearly a woman); expelled from the war academy over gambling debts, joined the company weeks ago and brought them the job that trapped them. FACTION: Academy, expelled - night-blue #24345E tactician coat with silver trim instead of the violet robe, compass-star academy pin that is visibly CRACKED; plus an ember-orange #E8743B scarf (company sign). BUILD: average (see the third image). HEAD: oval head, soft chin. EYES: medium, almond, calm hazel-grey. BROWS: straight, slightly drawn together. NOSE: small and straight. MOUTH: small, closed. MARKS AND AGE: none, young face. SKIN: fair. HAIR: shoulder-length STRAIGHT dark auburn hair in a low loose ponytail, two strands framing the face. POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter; gaze toward the right edge, thoughtful. PALETTE: dominant night blue #24345E, secondary dark brown leather #4B3426, accent ember orange #E8743B. CLOTHES TELL: night-blue tactician coat with simple silver trim, high collar, hood folded back, the cracked compass-star pin, a leather map satchel with rolled maps across the chest, dark gloves, ember-orange scarf. EXPRESSION: thoughtful, a little guilty, determined. WEAPON: a plain straight short sword with a simple silver crossguard held in the right hand, the blade resting on the right shoulder. SIGNATURE: the map satchel and the ember scarf.
```

```text
CHARACTER: FENN, 19, ex-thief and scout of the company; big mouth, soft heart. FACTION: Ashen Banner - mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot); personal piece: a patched dark-grey hooded jerkin from his thieving days. BUILD: slim (see the third image), plus lanky arms. HEAD: heart-shaped head, pointed chin. EYES: large, upturned, golden. BROWS: thin, arched, mobile. NOSE: small button nose with a sticking plaster across the bridge. MOUTH: wide, open cheeky grin. MARKS AND AGE: the plaster on the nose. SKIN: warm tan. HAIR: wild spiky black hair sticking out under an ember-orange headband, hood down. POSE: body three-quarter facing the RIGHT edge of the image; head tilted; gaze straight at the viewer. PALETTE: dominant dark grey #4A4A50, secondary brown leather #6B4A2B, accent ember orange #E8743B (headband). CLOTHES TELL: the patched dark-grey hooded jerkin with clean patches, a few pouches on the belt, fingerless gloves. EXPRESSION: cheeky grin, one brow up. WEAPON: two short curved daggers, one held in a reverse grip in front of his chest, the other spinning casually in his raised hand. SIGNATURE: the plaster on the nose and the orange headband.
```

```text
CHARACTER: BRENNA, 41, front-line axe fighter and the captain's second; took the blame for her brother's crime and was cast out by her family; motherly, tells bad jokes. FACTION: Ashen Banner - mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot); personal piece: a leather vest with a bare lighter rectangle where her family crest was torn off. BUILD: broad (see the third image), plus a short thick neck; the head stays exactly as big as RHEN's. HEAD: square head, strong wide jaw, small ears. EYES: small, slightly hooded, hazel. BROWS: thick straight, copper. NOSE: broad with an old break (small bump). MOUTH: wide, thin-lipped. MARKS AND AGE: freckles across nose and cheeks, crow's feet, a small scar on the chin. SKIN: ruddy, weathered pale skin. HAIR: thick frizzy copper-red curls pulled back into ONE THICK BRAID over her shoulder. POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter; gaze at the viewer. PALETTE: dominant faded moss green #5E6B45, secondary rust-brown leather #7A4A2B, accent ember orange #E8743B. CLOTHES TELL: a hand-me-down chainmail shirt with a leather patch, the vest with the missing crest, an ember-orange band on her left upper arm. EXPRESSION: one eyebrow raised, lopsided half-grin, like she just told a bad joke. WEAPON: a huge double-bitted battle axe resting on her right shoulder, gripped in her right hand, both axe blades inside the image. SIGNATURE: the thick copper braid and the double axe.
```

```text
CHARACTER: LUCAN, 38, captain of the mercenary company; a cast-out nobleman and former knight-captain of the border army who left after a noble commander sacrificed his unit; upright, calm, protective. FACTION: Border army, cast out - riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain; but his own colour is royal green; the noble house emblem on his surcoat is unpicked, leaving only a faint outline; plus ONE small ember-orange #E8743B cloth knot on his belt (company sign). BUILD: tall (see the third image), plus an upright noble bearing; the head stays exactly as big as RHEN's. HEAD: well-proportioned head, refined face, slim jaw. EYES: medium, almond, calm and a little tired, amber. BROWS: straight, dark brown. NOSE: straight and elegant. MOUTH: firm, a faint dry smile. MARKS AND AGE: a short scar through the right eyebrow, a few fine lines at the eye corners, clean-shaven. SKIN: light olive. HAIR: SMOOTH, STRAIGHT dark brown hair combed back neatly and tied into a low ponytail, no curls, one straight strand at the temple. POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, chin slightly raised; gaze calm at the viewer. PALETTE: dominant royal green #1F5E3B, secondary clean steel grey #8A939C, accent dark brown leather #5A3D26. CLOTHES TELL: a knight's royal-green surcoat over a plain steel breastplate with the unpicked emblem, one rounded pauldron on his LEFT shoulder, a dark green cloak. No red anywhere. EXPRESSION: calm, steady, faint dry smile. WEAPON: a long knightly sword held upright in front of him with both hands on the crossguard, point down, blade beside his body, never covering the face. SIGNATURE: the royal-green surcoat with the unpicked emblem and the left pauldron.
```

```text
CHARACTER: GROSK, 44, bandit chief with a soft heart; discharged from the army as an invalid, now feeds a starving camp. FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem; personal piece: his old army gambeson with the sleeves cut off. BUILD: heavy (see the third image), plus narrow sloping shoulders and a round belly; the head stays exactly as big as RHEN's. HEAD: egg-shaped bald head, ears that stick out. EYES: small, round, dark brown, set close together. BROWS: bushy black, drooping at the outer ends. NOSE: broad flat potato nose (as a simple line drawing). MOUTH: hidden in the beard, a small worried line. MARKS AND AGE: an old scar across the scalp, forehead wrinkles. SKIN: warm tan, sun-browned scalp. HAIR: bald, a HUGE bushy black beard down to the chest. POSE: body three-quarter facing the RIGHT edge of the image; head turned slightly away; gaze sideways and down, shy. PALETTE: dominant dull army olive #6B6A3A, secondary dark brown leather #4A3324, accent faded red #9A3B32. CLOTHES TELL: the sleeveless gambeson with a faded regiment stripe, big crude leather patches, a wooden brace strapped to his left forearm. EXPRESSION: brows up in the middle, worried and apologetic. WEAPON: a big round wooden shield on his left arm, painted with colourful children's handprints, held in front of his belly; a heavy wooden club in his right hand resting on his shoulder. SIGNATURE: the huge beard and the shield with the children's handprints.
```

**Nachkorrektur (2026-11-01, Produktinhaber):** Rhens B Schwert hatte eine abgeknickte zweite Klingenspitze, Brennas Doppelaxt saß schief am Stiel. Je eine Folgekorrektur im selben Chat (§7 der Vorlage: „Keep this exact image … and fix only the sword/axe: … ONE straight, rigid …“) behob beides im ersten Versuch; Ergebnis `w6_rhen_b_fix.png`, `w6_brenna_fix.png`. Waffen-Artefakte (geknickte Klingen, schiefe Köpfe, doppelte Spitzen) gehören deshalb in die Abnahme-Checkliste.
