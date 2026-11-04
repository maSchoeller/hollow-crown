# ilka – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_average.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/ilka.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c338-b2f4-83ed-81bc-2f0d60e0a20c
- **Iterationen:** 1 Chat, kein Neuversuch Sehne lief durch den Körper (Produktinhaber 2026-11-02): erste Folgekorrektur („… fix only the bow …“) verworfen, weil die gespannte Sehne weiter den Rumpf kreuzte; zweite Folgekorrektur im selben Chat mit ungespanntem Bogen neben dem Körper.

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: ILKA, 27, huntress from a mountain clan of the Ironmark, cast out by her clan; taciturn, reads tracks.
FACTION: Ashen Banner - mismatched gear from many sources in ash grey #5B5A5E and worn leather #8A5A3C, one ember-orange #E8743B cloth piece (scarf, band or knot); personal piece: her white wolf-fur clan hood and cloak.
BUILD: average (see the third image), plus a straight back.
HEAD: long oval head, sharp chin, high cheekbones.
EYES: small, narrow, ice blue.
BROWS: thin, straight, pale.
NOSE: straight, narrow.
MOUTH: thin-lipped, closed.
MARKS AND AGE: three blue clan face-paint stripes on each cheek.
SKIN: very pale.
HAIR: white-blonde hair in tight braids under a WHITE WOLF-FUR HOOD (fur only, no wolf head).
POSE: body three-quarter facing the RIGHT edge of the image; head turned away; gaze sideways toward the right edge, focused.
PALETTE: dominant white fur #EDEDE8, secondary worn leather #8A5A3C, accent ember orange #E8743B.
CLOTHES TELL: the white wolf-fur hood and short cloak over leather armour, an ember-orange cord on her quiver.
EXPRESSION: focused, silent, no smile.
WEAPON: a recurve bow held in her left hand, an arrow nocked and pointed upward, the right hand at the string.
SIGNATURE: the white wolf-fur hood.
```

## Korrektur 2026-11-03 (gilt, ersetzt die Datei oben)

- **Anlass:** Pelz zu voluminös. Die erste Korrektur (`ilka_fur`, https://chatgpt.com/c/6aea3a1e-d750-83ed-aa12-48e67e82cc43) ließ dem Produktinhaber zu wenig Pelz, gewünscht war ein Zwischending; verworfen.
- **Chat:** https://chatgpt.com/c/6aea412f-09cc-83eb-bddb-1c496f9f686e
- **Anhänge:** in dieser Reihenfolge die verworfene Fassung mit wenig Pelz, dann die vorige `ilka.png`
- **Menschlicher Anteil:** Korrekturanweisung, Auswahl und Abnahme durch den Produktinhaber (2026-11-03); keine Retusche
- **Original (A3):** die Datei im Spielordner ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)

```text
Create an image. The FIRST attached image is the APPROVED dialogue portrait of ILKA, a huntress from my original fantasy tactics RPG 'Hollow Crown'. Keep it exactly: same character, face, face paint, braids, pose, crop, leather armour, belts, quiver, the unstrung bow and the arrow, same drawing style, square 1:1, FULLY TRANSPARENT background (PNG with real alpha channel), no text.
The SECOND attached image is an older version of her with far too much fur. Her fur now has to be IN BETWEEN these two images: more than in the first image and clearly less than in the second.
Change ONLY the fur: a fuller white wolf-fur hood with a thick fur edge around her face, a medium-length fur cape covering the shoulders and upper arms and ending at the upper chest, plus narrow fur cuffs at the wrists. The dark leather armour stays clearly visible on her chest, waist and lower arms, and her silhouette stays slim. The white fur hood stays her signature.
```
