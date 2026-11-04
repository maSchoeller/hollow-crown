# class_fighter – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a)
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_heavy.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/class_fighter.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c369-5abc-83ed-818b-ea0b7da5fd93, https://chatgpt.com/c/6ae8339c-1a6c-83ed-87a4-8d988a25c1e8
- **Iterationen:** Erste Fassung (2026-11-01) verworfen: Produktinhaber 2026-11-02 wollte namenlose Gegner bewusst einfacher und den Briganten im Gesicht anders, die Axt des Kämpfers war falsch; zweite Fassung im neuen Chat mit dem Absatz `GENERIC ENEMY` (`portrait_master.md` §4a).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a common FIGHTER for hire, a man of about 35 who fights for the borderland gangs; generic enemy type.
FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem.
BUILD: heavy (see the third image), plus a barrel chest; the head stays exactly as big as RHEN's.
HEAD: blocky head, wide jaw.
EYES: small, deep-set, brown.
BROWS: low, heavy, black.
NOSE: broad flat.
MOUTH: grumpy downturned line.
MARKS AND AGE: a thick black moustache.
SKIN: deep brown.
HAIR: completely SHAVED head.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal; gaze straight at the viewer, grumpy.
PALETTE: dominant earth brown #6B4B34, secondary chainmail grey #7D8088, accent rust red #8E3B2E.
CLOTHES TELL: studded brown leather over a short chainmail shirt, a rust-red armband, a fur strip over one shoulder.
EXPRESSION: grumpy, unimpressed.
WEAPON: a big two-handed axe: ONE straight wooden haft with ONE single-bladed iron axe head at its top end, the haft resting on his right shoulder, gripped in his right hand near the bottom end; the blade points away from his head, no second blade, no spike.
SIGNATURE: the shaved head and the moustache.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```
