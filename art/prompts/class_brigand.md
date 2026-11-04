# class_brigand – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a)
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_slim.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/class_brigand.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c1dd-6a20-83ed-85fe-421405f77232, https://chatgpt.com/c/6ae83342-3f38-83ed-9f72-941cbfd17078
- **Iterationen:** Erste Fassung (2026-11-01) verworfen: Produktinhaber 2026-11-02 wollte namenlose Gegner bewusst einfacher und den Briganten im Gesicht anders, die Axt des Kämpfers war falsch; zweite Fassung im neuen Chat mit dem Absatz `GENERIC ENEMY` (`portrait_master.md` §4a).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a common BRIGAND of the borderland gangs, a man of about 30; generic enemy type.
FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem.
BUILD: slim (see the third image), plus wiry arms.
HEAD: round head, heavy round jaw, small ears.
EYES: small, heavy-lidded, plain brown.
BROWS: low, thick, straight.
NOSE: broad flat nose.
MOUTH: small mouth, lower lip pushed out in a sulky pout.
MARKS AND AGE: a short round reddish-brown beard as one flat shape.
SKIN: ruddy pale.
HAIR: a rust-red BANDANA pulled low over the brows, covering all the hair, only short red-brown sideburns show.
POSE: body three-quarter facing the RIGHT edge of the image; head tilted; gaze at the viewer, sneering.
PALETTE: dominant earth brown #6B4B34, secondary dirty olive #6F6B3A, accent rust red #8E3B2E.
CLOTHES TELL: a plain fur-trimmed leather vest over a dirty-olive shirt.
EXPRESSION: sulky, mean pout.
WEAPON: a short hand axe with ONE straight single-bladed iron head on a straight wooden haft, raised beside his head in his right hand.
SIGNATURE: the rust-red bandana.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```
