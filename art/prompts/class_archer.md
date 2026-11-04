# class_archer – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a)
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_slim.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/class_archer.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c2b1-4c24-83eb-a85d-4fd3f1717269, https://chatgpt.com/c/6ae83457-f9bc-83ed-a420-52e97dca6a52
- **Iterationen:** Erste Fassung (2026-11-01) verworfen: Produktinhaber 2026-11-02 wollte namenlose Gegner bewusst einfacher und den Briganten im Gesicht anders, die Axt des Kämpfers war falsch; zweite Fassung im neuen Chat mit dem Absatz `GENERIC ENEMY` (`portrait_master.md` §4a).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a common ARCHER of the borderland raiders, a woman of about 28; generic enemy type.
FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem.
BUILD: slim (see the third image), plus a straight back.
HEAD: heart-shaped head, small chin.
EYES: medium, narrow, green.
BROWS: thin, straight.
NOSE: small straight nose.
MOUTH: small, closed.
MARKS AND AGE: none.
SKIN: medium brown.
HAIR: HOOD UP: a pointed earth-brown hood covering the head, only a few straight dark strands at the face.
POSE: body three-quarter facing the RIGHT edge of the image; head turned away; gaze sideways toward the right edge, watchful.
PALETTE: dominant earth brown #6B4B34, secondary dirty olive #6F6B3A, accent rust red #8E3B2E.
CLOTHES TELL: hooded earth-brown cloak, a rust-red scarf pulled down under the chin, leather bracers, a quiver strap across the chest.
EXPRESSION: cool, watchful.
WEAPON: a simple wooden longbow held upright in her left hand, an arrow between the fingers of her right hand.
SIGNATURE: the pointed hood and the longbow.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```
