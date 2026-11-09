# lance_rider – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von einem Opus-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-09)
- **Datum:** 2026-11-09
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a): namenloser Sprecher (Lanzenreiter der Silbernen Lanze), Story 11.12
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_average.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/lance_rider.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session nach Vorgabe des Produktinhabers 2026-11-09: eigene Halbfigur für den Sprecher der Nachszene von 2-1), Auswahl; keine Retusche. Vom Produktinhaber abgenommen am 2026-11-09.
- **Chats:** https://chatgpt.com/c/6af22b56-0e20-83ed-89aa-eab241d47d73
- **Iterationen:** 1 Chat, kein Neuversuch; keine Stimmungen (die App zeigt für jede Stimmung die neutrale Figur)

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: a LANCE RIDER of the Silver Lance, a young man of about 24, mounted knight of the princess's guard who brings her message; a nameless messenger, not a story character.
FACTION: Crown / Silver Lance - polished rounded silver armour #C9D1DC with sky-blue #6FA8DC cloth and white #F7F9FC trim, winged-lance motif on pauldron or brooch, neat and clean.
BUILD: average (see the third image), plus a stiff upright courtly bearing.
HEAD: square head, firm straight jaw.
EYES: medium, almond, grey.
BROWS: thick straight, dark blond.
NOSE: straight nose.
MOUTH: thin-lipped, closed.
MARKS AND AGE: none.
SKIN: fair.
HAIR: neat short dark-blond hair, mostly under an OPEN-FACED ROUND SILVER HELMET with a short sky-blue plume on top.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, chin slightly raised; gaze toward the right edge.
PALETTE: dominant silver #C9D1DC, secondary sky blue #6FA8DC, accent white #F7F9FC.
CLOTHES TELL: rounded silver breastplate over a sky-blue surcoat with white trim, the winged-lance brooch at the collar, riding gauntlets.
EXPRESSION: formal and polite, a small bow of the head, mouth closed.
WEAPON: a long knightly lance held upright in his right hand with a small sky-blue pennant with a silver winged lance just below the steel tip, the tip inside the image; ONE rigid straight shaft.
SIGNATURE: the sky-blue pennant on the lance.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```

## Abnahme

- **Abgenommen** vom Produktinhaber am 2026-11-09 (Bild und Nachszene von 2-1).

- Prüfbogen (`portrait_guides.py sheet`, average): 40 % 0.36 !, 60 % 0.61 !, 78 % 0.67. Die schmalen Werte oben erklärt der runde Helm (Kopf schmaler als Rhens Haar), Schultern und Gürtel liegen auf den Linien.
- Fraktions-Kit der Silbernen Lanze (Silber, Himmelblau, Weiß, Flügellanze an Brosche und Wimpel), Lanze gerade auf einer Achse, Spitze im Bild; Kopf gleich groß wie die Anker, schlicht nach §4a.
- Körper dreiviertel nach rechts, Blick zum rechten Rand; im Dialog rechts gespiegelt (kein asymmetrisches Signaturteil außer dem Wimpel, Spiegeln unkritisch).
