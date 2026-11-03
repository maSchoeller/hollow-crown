# class_mercenary – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a)
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_broad.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/class_mercenary.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c1db-9b54-83eb-9bce-a30c75f8f80e, https://chatgpt.com/c/6ae8341e-e60c-83ed-b33a-a4269536aa54
- **Iterationen:** Erste Fassung (2026-11-01) verworfen: Produktinhaber 2026-11-02 wollte namenlose Gegner bewusst einfacher und den Briganten im Gesicht anders, die Axt des Kämpfers war falsch; zweite Fassung im neuen Chat mit dem Absatz `GENERIC ENEMY` (`portrait_master.md` §4a). Schwert zwischen Griff und Klinge geknickt (Produktinhaber 2026-11-02): Folgekorrektur im Chat der zweiten Fassung mit Hilfslinie (rote Achse) als Anhang.

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a common MERCENARY, a sellsword of about 35 hired by bandits and bounty hunters; generic enemy type.
FACTION: Bounty hunters - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem.
BUILD: broad (see the third image), plus a stocky short neck; the head stays exactly as big as RHEN's.
HEAD: square head, wide jaw.
EYES: small, hooded, grey.
BROWS: low, heavy.
NOSE: crooked nose with a bump.
MOUTH: thin-lipped, bored straight line.
MARKS AND AGE: short scruffy dark beard as one flat shape.
SKIN: weathered tan.
HAIR: short dark-brown hair under a DENTED ROUND STEEL CAP.
POSE: body three-quarter facing the RIGHT edge of the image; head turned slightly away; gaze to the side, bored.
PALETTE: dominant dirty olive #6F6B3A, secondary steel grey #8A939C, accent rust red #8E3B2E.
CLOTHES TELL: a padded dirty-olive gambeson with a plain steel breastplate, a rust-red scarf around the neck.
EXPRESSION: bored, mercenary, one brow lowered.
WEAPON: a plain straight arming sword resting on his right shoulder, held loosely in his right hand.
SIGNATURE: the dented round steel cap.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```
