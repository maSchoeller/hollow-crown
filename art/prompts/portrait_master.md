# portrait_master – Vorlage für Dialog-Porträts

- **Stand:** 2026-11-01, Fassung **v2.5** (Stil v2.4 vom Produktinhaber gewählt, ergänzt um Statur, Blick, Fraktion, Frisur).
- **Gilt für:** alle Dialog-Porträts (`art/mockups/characters-s1/<id>.png` und Stimmungen, Format `art-direction.md` §5.1). Brettfiguren entstehen zu diesen Porträts neu, soweit sie widersprechen (Beschluss 2026-11-05, Liste und Reihenfolge in `concept/23-art-direction/figuren-bestand.md`).
- **Herleitung und Testbilder:** `art/prompts/portrait_tests_2026-11.md`, Bilder `art/mockups/style-2026-11/`, Entscheidungen `concept/23-art-direction/decision-log.md`.
- **Werkzeug:** `tools/art/portrait_guides.py` (Statur-Vorlagen, Prüfbogen, Kopf-Silhouetten).
- **Stil-Anker:** `art/mockups/style-2026-11/anchor_rhen.png` und `anchor_fenn.png` (Produktinhaber, 2026-11-01; vorher die Spiel-Porträts `characters-s1/rhen_a.png` und `fenn.png`). Die Statur-Vorlagen und der blaue Umriss im Prüfbogen bleiben aus dem alten, waffenlosen `rhen_a.png` gebaut, damit keine Waffe in die Silhouette gerät; die Linien liegen beim neuen Anker an denselben Stellen.

## 1. Ablauf für eine neue Figur

1. **Figurenblatt ausfüllen** (§4): Fraktion, Statur, Kopf, Gesicht, Frisur, Blick, Palette, Kleidung, Signaturteil. Vorher die Regeln für den Kader (§5) gegen die Gruppe prüfen, in der die Figur auftritt.
2. **Prompt zusammensetzen:** Einleitungssatz + Stil-Block (§2) + Format-Block (§3) + Statur-Absatz (§3a) + Figurenblock. Nichts davon umformulieren.
3. **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker, seit 2026-11-01 die neuen Rhen A und Fenn mit Waffe), dann `art/mockups/style-2026-11/guide_build_<statur>.png`.
4. **Zwei frische Chats parallel** mit demselben Prompt. Keine langen Folgechats.
5. **Prüfbogen:** `python tools/art/portrait_guides.py sheet <bogen.png> art/mockups/style-2026-11/anchor_rhen.png art/mockups/style-2026-11/anchor_fenn.png <a>.png:<statur> <b>.png:<statur>`. Bessere Variante wählen; höchstens **eine** Folgekorrektur (§7), sonst neuer Chat.
6. **Abnahme** (§8) zusammen mit den Nachbarn aus der Gruppe; der Produktinhaber bekommt pro Runde einen Bogen, keine Einzelbilder.
7. **Stimmungen** `_happy`, `_angry`, `_sad` im selben Chat mit dem abgenommenen Bild als Vorlage (§7).
8. **Protokoll** `art/prompts/<id>.md` nach `licensing.md` §6 (Dienst, Tarif, Konto, Datum, Prompt, Anhänge, Iterationen, Original unverändert in LFS, menschlicher Anteil).

Die Bildproduktion (Schritte 4–5) übernimmt ein Sonnet-Subagent mit fertigem Prompt; die Session schreibt Figurenblätter und prüft die Bögen.

## 2. Stil-Block (fest)

```text
STYLE (fixed, Hollow Crown portrait v2.5). The first two attached images (RHEN and FENN) are
STYLE ANCHORS ONLY: copy their drawing technique, head size and face maturity, never their
face, hair, body or clothes.
Round-chibi cartoon dialogue portrait. Clean dark-brown line (never black) of even medium
weight, slightly thicker outer contour.
SHADING: two-tone cel shading, light from the upper left: base colour, one clear shadow
tone, plus a smaller darker core shadow in the deepest spots (under chin and hair, inside
folds, under straps and belts, where arms meet the body); a soft occlusion shadow where
layers overlap; one small highlight shape on hair, leather, metal and eyes. No airbrush,
no gradients across big areas, no texture, no glow, no rim light.
FACE MATURITY exactly like the anchors: the same head size and eye placement as RHEN and
FENN - youthful chibi faces of young adults, NOT babyish: a defined small chin, normal
anchor-sized eyes, a light hint of cheekbones. Each character looks their stated age the way
the anchors look theirs: older characters get a few clean lines, a firmer jaw, beard or grey
hair, but keep the same chibi head; never a longer, realistic or rugged face.
FACE CONSTRUCTION, identical for every character (only the SHAPES vary):
- Eyes: strong dark upper-lid line, simple coloured iris with a darker top, round pupil,
  exactly ONE small white catchlight; no lower lashes, no sparkles, no extra highlights.
- Nose: a simple line drawing with at most one small flat shadow; never a shiny bulb.
- Mouth: simple line or open shape with a flat dark inside and one white teeth shape.
- Skin: base tone plus shadow tone; no blush, no glossy skin, no pore or stubble texture
  (stubble or a short beard = one flat darker shape).
- Wrinkles, scars and age lines: a few clean single lines, never hatching.
HAIR: a bold, readable hair SILHOUETTE as described in the character block, slightly
exaggerated in volume; big clumps with a few stray strands; one shadow tone, one highlight.
CLOTHES rendered like the anchors: a few big clean shapes, no fabric texture, no grain, no
scratches, no weathering marks, no dirt; patches, repairs and missing emblems as clean flat
shapes; straps as plain bands; faction trim as flat colour bands, never filigree.
WEAPON: the character HOLDS the weapon given in the character block in one or both hands,
clearly readable and big enough to recognise at a glance: held diagonally across the body,
resting on the shoulder or raised beside the head, the blade or head of the weapon inside
the image, never covering the face. Weapons are drawn in the same clean style (one shadow
tone, one highlight shape on metal). Besides the weapon at most one more item.
```

## 3. Format-Block (fest)

```text
FORMAT: square 1:1, one single character, half-body dialogue portrait (head to hips),
centred, cut off by the bottom edge like the anchors, FULLY TRANSPARENT background (PNG with
real alpha channel), no floor, no shadow, no text, no frame. Body and head direction and
gaze as given in the character block.
```

### 3a. Statur-Absatz (fest, nach dem Format-Block)

```text
PROPORTION TEMPLATE: the THIRD attached image is a measuring guide for this character's build:
a light-grey body silhouette with red lines labelled TOP, EYES, CHIN, SHOULDERS, BELT. The new
character must fill this silhouette at the same scale: top of the hair on TOP, eyes on EYES,
chin on CHIN, shoulder line on SHOULDERS, belt on BELT, shoulders and torso as wide as the grey
silhouette, the figure cut off by the bottom edge of the image exactly like the anchors.
The head keeps the anchors' size and style; the body takes the silhouette's width. Do NOT draw
the lines, labels or the grey silhouette in the result.
```

## 4. Figurenblock (je Figur ausfüllen)

Jede Zeile ist Pflicht. Konkrete Formen und Dinge, keine Stimmungs-Adjektive (§5, Regel 9).

```text
CHARACTER: <NAME>, <age>, <role>; <one sentence biography>.
FACTION: <faction> - <the kit line from the faction table, copied>.
BUILD: <average | slim | broad | heavy | small | tall> (see the third image), plus <one detail>.
HEAD: <round | square | long oval | heart | pear | egg | blocky> head, <jaw/chin>, <ears>.
EYES: <small | medium | large>, <round | almond | narrow | droopy | hooded | upturned>, <iris colour>.
BROWS: <thick straight | thin arched | bushy | low heavy | sparse>.
NOSE: <button | straight | long | hooked | broad flat | broken bump> (a simple line drawing).
MOUTH: <wide | small | thin-lipped | full>, <teeth detail if any>.
MARKS AND AGE: <freckles | scar | mole | crow's feet | grey temples | missing tooth | none>.
SKIN: <explicit tone>.
HAIR: <silhouette type from the hair catalogue>, <texture>, <colour>, <one extravagant detail>.
POSE: body three-quarter facing the RIGHT edge of the image; head <three-quarter | almost frontal | turned further away>, <tilt if any>; gaze <at the viewer | toward the right edge | down | to the side>.
PALETTE: dominant <colour #hex>, secondary <colour #hex>, accent <colour #hex>.
CLOTHES TELL: <origin>, <what is worn, repaired or wrong-sized>, <one hint at the past>.
EXPRESSION: <concrete: e.g. one brow raised, lopsided half-grin>.
WEAPON: <weapon of the class's weapon group or the signature weapon, its look>, <in which hand, how held>.
SIGNATURE: <the one recognisable part from art-direction.md §4.3, incl. its prop if listed>.
```

### 4a. Namenlose Gegner (Klassen-Büsten)

Klassen-Büsten (`class_*`) stehen für namenlose Einheiten und sind bewusst einfacher als Story-Figuren (Produktinhaber, 2026-11-02). Ihr Figurenblock lässt MARKS leer (`none`) und nennt keine persönlichen Stücke; angehängt wird dieser Absatz:

```text
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors:
fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches;
a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly
shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```

## 5. Regeln für den Kader

**Gestaltung**

1. **Machart fest, Form frei.** Linie, Schattierung, Gesichtsbau und Kopfgröße sind für alle gleich; Statur, Kopfform, Augen, Nase, Haar, Blick und Kleidung variieren.
2. **Signaturteil ist Kanon.** Das Signaturteil aus `art-direction.md` §4.3 (inklusive Requisit, etwa Lioras Kristallstab) steht immer im Figurenblock. Änderungen daran nur per Entscheidung des Produktinhabers.
3. **Kleidung als Biografie,** aber innerhalb des Fraktions-Kits (Regel 10). Abgerissenes oder Geflicktes nur, wenn die Figur es erklärt.
3a. **Waffe in der Hand ist Pflicht** für alle Kämpfer und Gegner (Produktinhaber, 2026-11-01). Sie zeigt die Waffengruppe der Klasse (`content/core/classes.yaml`, `weaponGroups`), als persönliche Ausführung; steht in §4.3 eine Signaturwaffe, ist es diese. Elementaristen halten Fokus (Buch, Kugel) und Element, Heiler den Stab, Spielleute Laute oder Dolch. Nur Nicht-Kämpfer (Halvard, Seraphine, Maelis, Gerrit …) halten statt einer Waffe ihr Rollenstück (Schlüssel, Banner, Fächer). Nicht auf den Rücken schnallen, nicht weglassen.

   | Klasse | Waffe im Porträt |
   |---|---|
   | tactician (Rhen) | Schwert, alternativ Zauberbuch |
   | captain (Lucan) | Langschwert |
   | vanguard | Axt, Lanze oder Schild (Brenna Doppelaxt, Tobin langer Speer, Grosk Schild mit Kinderhänden) |
   | skirmisher, duelist | Schwert oder Dolch (Varek Säbel, Odile Rapier) |
   | marksman, sharpshooter | Bogen oder Armbrust (Mira Langbogen, Morra Armbrust) |
   | scout | Dolche (Fenn) |
   | elementalist, sage | Fokus + Element (Ysolde Buch und Flamme) |
   | healer, bishop | Stab (Liora Kristallstab) |
   | minstrel | Laute oder Dolch (Jory) |
   | brigand | Axt (Hask Hackbeil + Fackel) |
   | wolf_rider, knight | Lanze/Speer (Ulvric) |
   | Paktgarde (Mael) | Kriegshammer |
   | Grenzheer (Dravn) | Kriegsaxt |

**Unterscheidbarkeit** (in einer Gruppe = Kompanie, Leutnants einer Fraktion, Hof)

4. **Statur:** sechs Vorlagen, höchstens zwei gleiche je Gruppe; Dialogpaare verschieden. Statur folgt der Figur, nicht der Rolle. Vorschlag: average Rhen A/B, Pell · slim Fenn, Mira, Liora · broad Brenna, Dravn, Torvald · heavy Grosk, Amos, Osric · small Tobin, Kit, Ysolde · tall Lucan, Odile, Halvard.
5. **Kopfform:** höchstens zwei gleiche je Gruppe.
6. **Frisur-Silhouette:** jede Figur einer Gruppe hat einen anderen Typ aus dem Katalog; Frisuren dürfen auffällig sein (Volumen, Schnitt, Schmuck), solange sie zur Fraktion passen.
   Katalog: kurz zerzaust · Stoppeln/Glatze · Irokese · Undercut/Seitenrasur · Stachelhaar · Pony-Bob · Pagenkopf · Locken-Mähne · Afro/Krause · Locs · tiefer Zopf · hoher Zopf · Seitenzopf · dicker Flechtzopf · Kronenzopf · Dutt/Knoten · offen lang glatt · wehend lang wellig · Kapuze/Hut/Helm als Silhouette.
7. **Farbe:** Hautton und Haarfarbe ausdrücklich nennen und streuen; dominante Kleidungsfarbe innerhalb einer Fraktion über Helligkeit unterscheiden (Regel 10).
8. **Silhouettentest:** Köpfe einer Gruppe schwarz gefüllt nebeneinander (64 px hoch) müssen ohne Farbe unterscheidbar sein.
9. **Verbotene Wörter im Figurenblock:** *beautiful, handsome, cute, gentle, serene, kind, warm, cheerful, confident, heroic, elegant, twinkling*.

**Fraktionen**

10. **Fraktions-Kit:** Jede Figur trägt das Kit ihrer Fraktion (Tabelle unten): zwei der drei Kleidungsfarben aus der Fraktion, das gemeinsame Material und ein gemeinsames Motiv. Individuell bleiben Statur, Gesicht, Frisur, ein persönliches Stück und das Signaturteil. So wirkt eine Gruppe geordnet, ohne uniform zu sein.
11. **Abtrünnige** (Rhen, Lucan, Liora, Varek, Ysolde, Odile …) tragen das Kit ihrer **alten** Fraktion mit entferntem oder zerkratztem Emblem, dazu ein Stück Glutorange als Zeichen des Aschenbanners. Das erzählt ihre Geschichte ohne Text.
12. **Aschenbanner** hat kein eigenes Uniform-Kit: ein glutoranges Stoffteil (`#E8743B`) ist das einzige gemeinsame Zeichen, Aschgrau und Leder als verbindende Grundtöne.

| Fraktion | Kit-Zeile für den Figurenblock |
|---|---|
| Aschenbanner | `mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot)` |
| Krone / Silberne Lanze | `polished rounded silver armour #C9D1DC with sky-blue #6FA8DC cloth and white #F7F9FC trim, winged-lance motif on pauldron or brooch, neat and clean` |
| Grenzheer der Eisenmark | `riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain` |
| Haus Silbermeer | `sea-blue #1F3F6E brocade with silver #BFC6CF bands and gold #D9A931 coin-and-wave motif, high collars, rich and smooth` |
| Pakttempel / Paktgarde | `ivory #F4EFE6 robes or white armour with flat gold #D9A931 trim bands and carmine #A3172E accents, crown motif, ceremonial and pristine` |
| Grenzlandbanden / Kopfgeldjäger | `earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem` |
| Akademie | `dark-violet #4B3A6B academy cloth with parchment #E8DCC0 lining and ink #2A2440 trim, compass-star pin` |

**Blickrichtung**

13. **Grundausrichtung:** Körper dreiviertel zum **rechten** Bildrand (wie Rhen A und Fenn). Im Dialog steht die Figur links und schaut zur Mitte; rechts wird sie gespiegelt (umgesetzt, siehe §9).
14. **Kopf und Blick variieren mit dem Wesen:** offen und direkt → fast frontal, Blick zum Betrachter; misstrauisch oder schüchtern → Kopf weiter weg, Blick seitlich oder von unten; stolz → Kinn hoch, Blick über den Betrachter hinweg. In einer Gruppe nicht mehr als die Hälfte mit gleichem Kopfwinkel und Blick.
15. **Spiegeln:** Asymmetrische Signaturteile (Lucans linke Schulterplatte, Narben, Augenklappe, Seitenzopf) wandern beim Spiegeln auf die andere Seite. Figuren, bei denen das stört, bekommen zusätzlich ein eigenes, zum linken Rand gewandtes Bild (`<id>_l.png`, selber Chat, „same character, mirrored pose, keep <Teil> on his LEFT“).

## 6. Fehlerbilder und ihre Gegenmittel

| Problem | Ursache | Gegenmittel |
|---|---|---|
| Körper zu erwachsen, Kopf zu klein | Zahl statt Anker | Statur-Vorlage als dritter Anhang |
| Figur zu groß oder zu schmal | Wörter wie *tall, lean, broad* ohne Maß | Statur-Feld nur mit Vorlagen-Namen + ein Detail |
| Gesichter zu kindlich oder zu hart | Gesichtsreife ohne Anker | „FACE MATURITY exactly like the anchors“ |
| Stoffstruktur, Kratzer, Abnutzung | Weathering-Wörter im Figurenblock | „as clean flat shapes“, Stil-Block nicht kürzen |
| Alle ähnlich frisiert | keine Silhouetten-Vorgabe; ChatGPT fällt auf „lockig zerzaust“ zurück | Frisur-Katalog, Regel 6; Haar ausdrücklich glatt, kurz, gebunden usw. beschreiben, Silhouettentest mit `portrait_guides.py heads` |
| `small` wird ignoriert, `broad`/`heavy` vergrößern die ganze Figur | Statur-Vorlage wirkt nur auf die Breite | Kleinheit über Umgebung erzählen (zu große Kleidung, Helm), bei `broad`/`heavy` „the head stays exactly as big as RHEN's“ ergänzen |
| Fraktion wirkt zusammengewürfelt | jede Figur eigene Palette | Kit-Zeile, Regel 10 |
| Signaturteil fehlt | Figurenblock ohne §4.3 | Regel 2 |
| Waffe fehlt oder hängt auf dem Rücken | „at most one prop“, Waffe unter SIGNATURE versteckt | Feld `WEAPON` mit Hand und Haltung, Regel 3a |
| Griff und Klinge geknickt, Klinge krumm statt gerade | Waffe nur benannt; „curved“ bei Dolchen | im Feld `WEAPON` verlangen: „ONE rigid object on ONE straight axis: pommel, grip, guard and blade in the same straight line“; Dolche und Schwerter gerade, nur der Säbel leicht zur Spitze gekrümmt. Eine Korrektur mit Hilfslinie half bei Varek kaum, beim Söldner schon; im Zweifel neu malen |
| Sehne läuft durch den Körper, Pfeil falsch gebaut oder zu klein | gespannter Bogen im Halbporträt | Bogen ungespannt neben dem Körper, Sehne gerade von Spitze zu Spitze; Pfeil voll lang, Spitze an einem Ende, Federn am anderen |
| Lange Folgechats ziehen Figuren zur ersten | Kontext im Chat | neuer Chat je Figur |
| Stimmungs-Adjektive → Durchschnittsgesicht | *gentle, confident …* | Regel 9 |

## 7. Folgekorrekturen und Stimmungen (Bausteine)

Immer „Keep this exact image (…) and only …“, mit Maß statt „bigger/smaller“.

- **Proportionen:** „Keep this exact character, face, expression, outfit and colours, but fill the grey silhouette of the third image: shoulders and torso as wide as the silhouette, chin on CHIN, belt on BELT.“
- **Tiefe:** „Keep this exact image and only add more depth: a smaller darker core shadow in the deepest spots and a soft occlusion shadow where layers overlap.“
- **Waffen-Artefakt:** „Keep this exact image (…) and fix only the <sword/axe>: draw ONE straight, rigid <weapon>, <grip and position>, no kink, no bend, no second blade.“
- **Merkmal/Alter:** „Keep this exact image with two small fixes: add <Merkmal> and make <him/her> look about <Alter> (a few fine lines …).“
- **Stimmung:** „Same character, same pose, crop, outfit and colours. Change only brows, eyes, mouth and shoulders to <happy: open grin, raised cheeks | angry: brows down, teeth showing, shoulders up | sad: brows up in the middle, mouth down, shoulders dropped>.“
- **Spiegelbild:** „Same character, same outfit, mirrored pose facing the LEFT edge; keep <Teil> on the character's <Seite>.“

## 8. Abnahme (Checkliste)

- Prüfbogen ohne `!` oder `!` erklärbar (Arm, Umhang, offenes Haar, Requisit; die Breitenmessung zählt alles mit und ist bei weiten Gewändern nur ein Hinweis).
- Augen, Nase, Linie, Schatten gebaut wie bei Rhen A und Fenn; Kopf gleich groß.
- Alter lesbar, aber kein hartes oder kindliches Gesicht.
- Fraktions-Kit erkennbar, Signaturteil vorhanden, Waffe in der Hand und lesbar, ohne Artefakte (geknickte Klinge, zweite Spitze, schiefer Axtkopf; Korrektur siehe §7).
- Waffenlogik mit Prüflinie nachgemessen: Griff und Klinge auf einer Achse, Bogensehne von Spitze zu Spitze und nicht durch den Körper, Pfeil vollständig und richtig herum. Der Bericht eines Subagenten ersetzt das Nachmessen nicht.
- Neben den anderen Figuren der Gruppe: andere Statur, Kopfform, Frisur-Silhouette; Silhouettentest bestanden. Eine Figur wird über Haar, Brauen, Nase und Kopfbedeckung unverwechselbar, nie über ein längeres oder realistisches Gesicht (§2 FACE MATURITY). Alte Männer nicht alle mit Glatze und weißem Vollbart.
- Freigestellt (echter Alphakanal), kein Text, quadratisch, ≥ 1254 px.

## 9. Offene Punkte

- **Spiegeln im Dialog: erledigt (2026-11-01).** `src/ui/Dialogue.tsx` spiegelt die rechte Figur (`pickSideHalf` in `src/ui/halfFigure.ts`); gibt es ein nach links gewandtes Bild `<id>_l` bzw. `<id>_l_<mood>`, wird es rechts ungespiegelt gezeigt.
- **Kader-Zuordnung** (Statur, Frisur, Kopfform, Blick je Figur) macht Etappe 3 (Figuren-Bibel) mit dieser Vorlage.

## 10. Schablone für einen neuen Stil

Für einen späteren anderen Stil denselben Weg gehen (erprobt 2026-11-01, siehe Herleitung):

1. Bestand in gleicher Größe nebeneinanderlegen, Lieblinge benennen lassen.
2. Familien nach **Machart** bilden (Auge, Nase, Mund, Haut, Linie, Schattierung, Proportion, Kleidungsdetail), nicht nach Figuren.
3. Stil-Block mit den Abschnitten aus §2 schreiben (Anker-Satz, Linie, SHADING, FACE MATURITY, FACE CONSTRUCTION, HAIR, CLOTHES), Format-Block getrennt.
4. Zwei Anker im Zielstil wählen; daraus mit `portrait_guides.py` (Konstante `ANCHOR`) Statur-Vorlagen erzeugen.
5. An 3–4 Figuren aus verschiedenen Familien testen; jede wirksame Korrektur in den Block zurückschreiben (neue Fassungsnummer).
6. Reproduzierbarkeit: zwei Figuren frisch ohne Korrektur; Prüfbogen mit den Ankern.
