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
