# class_cleric – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a)
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_broad.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/class_cleric.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c3fe-d2c4-83eb-81a4-bee399282deb, https://chatgpt.com/c/6ae8342f-5dbc-83ed-b86d-bcfc7f06e9b0
- **Iterationen:** Erste Fassung (2026-11-01) verworfen: Produktinhaber 2026-11-02 wollte namenlose Gegner bewusst einfacher und den Briganten im Gesicht anders, die Axt des Kämpfers war falsch; zweite Fassung im neuen Chat mit dem Absatz `GENERIC ENEMY` (`portrait_master.md` §4a).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a common enemy CLERIC, a woman of about 45, healer of the borderland gangs; generic enemy type.
FACTION: Border gangs - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem.
BUILD: broad (see the third image), plus soft round shoulders; the head stays exactly as big as RHEN's.
HEAD: round head, soft chin.
EYES: medium, round, calm grey.
BROWS: straight, greying.
NOSE: small straight nose.
MOUTH: small, closed.
MARKS AND AGE: a few laugh lines.
SKIN: light olive.
HAIR: short greying hair under a plain grey-brown VEIL.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal; gaze at the viewer, stern.
PALETTE: dominant grey-brown #7A6E60, secondary earth brown #6B4B34, accent rust red #8E3B2E.
CLOTHES TELL: plain grey-brown robes with a rust-red stole.
EXPRESSION: stern but calm.
WEAPON: a simple wooden healing staff held upright in her right hand, topped with a bundle of dried herbs and a small carved wooden ring (no crystal).
SIGNATURE: the veil and the herb-topped staff.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```
