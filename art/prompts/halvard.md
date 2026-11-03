# halvard – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_tall.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/halvard.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS); Stimmungen ebenso
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c1d0-d198-83eb-a239-d7341f1f7ac1
- **Iterationen:** 1 Chat, kein Neuversuch

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: HALVARD, 72, the Keeper of the Pact, highest priest of the Pact Temple; beloved by everyone, knows every name, brings bread and advice; secretly the king's murderer, which must NOT show.
FACTION: Pact Temple - ivory #F4EFE6 robes or white armour with flat gold #D9A931 trim bands and carmine #A3172E accents, crown motif, ceremonial and pristine.
BUILD: tall (see the third image), plus slightly rounded old shoulders; the head stays exactly as big as RHEN's.
HEAD: pear-shaped head, soft round jaw under the beard, large ears.
EYES: medium, round, pale blue, deep laugh lines at the corners.
BROWS: bushy white, raised at the inner ends.
NOSE: long straight nose.
MOUTH: wide, a broad closed smile visible above the beard.
MARKS AND AGE: crow's feet, two clean forehead lines, age spots on the scalp.
SKIN: pale rosy.
HAIR: bald crown with short white hair at the sides, a LONG white beard reaching the chest, its tip braided and tied with a small gold ring.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal, slightly tilted; gaze straight at the viewer.
PALETTE: dominant ivory #F4EFE6, secondary carmine #A3172E, accent flat gold #D9A931.
CLOTHES TELL: layered ivory and carmine temple robes with flat gold trim bands and a stylised crown embroidered on the chest, wide sleeves, a heavy plain iron key on a cord around his neck.
EXPRESSION: open, grandfatherly smile, eyes slightly squinted from smiling.
WEAPON: NONE - he is not a fighter; instead he holds a round loaf of bread wrapped in a cloth in both hands in front of his chest, as a gift.
SIGNATURE: the long white beard with the braided tip and the iron key on its cord.
```

## Stimmungen

`halvard_happy.png`, `halvard_angry.png`, `halvard_sad.png` (unveränderte Downloads). Im selben Chat wie das neutrale Bild, direkt danach. Je eine Nachricht nach `portrait_master.md` §7:

> Change only brows, eyes, mouth and shoulders to happy: open grin, raised cheeks. / … angry: brows down, teeth showing, shoulders up. / … sad: brows up in the middle, mouth down, shoulders dropped.

(Vollständige Nachrichten: Notizen der Session `PROCEDURE.md` §B/§C, wortgleich: „Create an image. The attached image is the APPROVED dialogue portrait of NAME … Same character, same pose, crop, outfit, weapon and colours, same drawing style, square 1:1, FULLY TRANSPARENT background … Change only …“.)

## Korrektur 2026-11-03 (gilt, ersetzt die Datei oben)

- **Anlass:** Gesicht zu ähnlich zu Amos und dem Dorfältesten, gewünscht war ein ikonischeres Gesicht. Halvard hat deshalb volles Haar statt Glatze und einen schmalen statt eines breiten Barts.
- **Chat:** https://chatgpt.com/c/6aea3e0b-2c8c-83eb-916b-55e52f331093
- **Anhänge:** `anchor_rhen.png`, `anchor_fenn.png`, `guide_build_average.png`
- **Iterationen:** Eine erste Runde (zwei Fassungen, `halvard_a`, `halvard_b`) wurde verworfen: Das Skript hatte die Änderungen in den Stil-Block statt in den Figurenblock geschrieben, die Köpfe waren zu klein und zu realistisch. Eine zweite Runde (Statur `tall`) wurde abgebrochen und verworfen, weil sie dem Produktinhaber zu dünn war. Aus der dritten Runde wählte er Fassung A (Haarwelle) statt B (Kappe, glatt rasiert, https://chatgpt.com/c/6aea3ec7-792c-83eb-98f3-9a9e8a2e30a5).
- **Menschlicher Anteil:** Korrekturanweisung, Auswahl und Abnahme durch den Produktinhaber (2026-11-03); keine Retusche
- **Original (A3):** die Datei im Spielordner ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)

## Prompt

Einleitung `Create an image.`, Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: HALVARD, 72, the Keeper of the Pact, highest priest of the Pact Temple; beloved by everyone, knows every name, brings bread and advice; secretly the king's murderer, which must NOT show.
FACTION: Pact Temple - ivory #F4EFE6 robes or white armour with flat gold #D9A931 trim bands and carmine #A3172E accents, crown motif, ceremonial and pristine.
BUILD: average (see the third image), normal healthy proportions, slightly sturdy, NOT thin, NOT gaunt and NOT massive; the head stays exactly as big as RHEN's.
HEAD: slightly narrow oval chibi head, small pointed chin.
EYES: medium, heavy-lidded, pale grey-blue, warm, laugh lines at the corners.
BROWS: very long white brows sweeping outward past the temples.
NOSE: clearly hooked nose (simple line drawing).
MOUTH: warm closed smile, fully visible, no moustache covering it.
MARKS AND AGE: two clean cheek lines, one forehead line.
SKIN: pale rosy.
HAIR: FULL head of white hair swept back in one big high wave, falling to the shoulders (NOT bald), and a NARROW white chin beard, thin as a hand, reaching the chest, tied with a small gold ring.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal, slightly tilted; gaze straight at the viewer.
PALETTE: dominant ivory #F4EFE6, secondary carmine #A3172E, accent flat gold #D9A931.
CLOTHES TELL: layered ivory and carmine temple robes with flat gold trim bands and a stylised crown embroidered on the chest, wide sleeves, a heavy plain iron key on a cord around his neck.
EXPRESSION: open, grandfatherly smile, eyes slightly squinted from smiling.
WEAPON: NONE - he is not a fighter; instead he holds a round loaf of bread wrapped in a cloth in both hands in front of his chest, as a gift.
SIGNATURE: the high swept-back white hair, the sweeping brows and the iron key on its cord.
HEAD SIZE: exactly the round-chibi head and face size of RHEN and FENN, and the same close framing as the anchors (head and upper body fill the image). Make him recognisable through hair, brows, nose and headgear, never through a longer or realistic face.
```

## Stimmungen

`halvard_happy.png`, `halvard_angry.png`, `halvard_sad.png` (unveränderte Downloads) entstanden im selben Chat direkt nach dem neutralen Bild, je eine Nachricht nach `portrait_master.md` §7 („Same character … Change only brows, eyes, mouth and shoulders to …“).
