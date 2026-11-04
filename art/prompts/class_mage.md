# class_mage – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a)
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_tall.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/class_mage.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c36b-8cf8-83ed-9871-b28d788bf54f, https://chatgpt.com/c/6ae8338e-ac68-83ed-9760-1469c36fdf00
- **Iterationen:** Erste Fassung (2026-11-01) verworfen: Produktinhaber 2026-11-02 wollte namenlose Gegner bewusst einfacher und den Briganten im Gesicht anders, die Axt des Kämpfers war falsch; zweite Fassung im neuen Chat mit dem Absatz `GENERIC ENEMY` (`portrait_master.md` §4a).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a common hedge MAGE, a man of about 40 who once studied at the academy and now casts for the borderland gangs; generic enemy type.
FACTION: Academy, cast out - dark-violet #4B3A6B academy cloth with parchment #E8DCC0 lining and ink #2A2440 trim, compass-star pin; the pin gone; plus rust-red #8E3B2E rags of the gangs.
BUILD: tall (see the third image), plus thin arms in wide sleeves.
HEAD: long oval head, pointed chin.
EYES: small, narrow, sly grey.
BROWS: thin, arched.
NOSE: long, hooked.
MOUTH: thin-lipped smirk.
MARKS AND AGE: a short pointed grey-black beard as one flat shape.
SKIN: sallow pale.
HAIR: STRAIGHT grey-black hair to the jaw under a tall POINTED, slightly bent dark-violet hat.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, chin lowered; gaze at the viewer from under the hat brim.
PALETTE: dominant dark violet #4B3A6B, secondary parchment #E8DCC0, accent rust red #8E3B2E.
CLOTHES TELL: a plain dark-violet robe with a rust-red sash.
EXPRESSION: sly smirk.
WEAPON: a small spellbook held open in his left hand and a bright flame dancing above his right palm.
SIGNATURE: the pointed hat.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```
