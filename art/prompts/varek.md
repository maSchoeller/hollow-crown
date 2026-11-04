# varek – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-03
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png`, `guide_build_tall.png`, dazu die vorige Fassung `art/mockups/style-2026-11/t10_varek.png` als Vorlage für sein Aussehen
- **Original (A3):** `art/mockups/characters-s1/varek.png` und die Stimmungen sind unveränderte Downloads (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt, Auswahl aus zwei Fassungen, Korrekturanweisungen und Abnahme durch den Produktinhaber; keine Retusche
- **Chat:** https://chatgpt.com/c/6aea0ab5-e6bc-83eb-8f51-56a24661964d (verworfene Fassung B: https://chatgpt.com/c/6aea0af0-c7c0-83ed-b5e0-76606e31b975)
- **Iterationen:** Die Testfassung `t10_varek.png` hatte eine gegen den Griff verzogene Klinge (Produktinhaber 2026-11-02). Eine Folgekorrektur mit roter Hilfslinie als Anhang half kaum (Griff etwa 31°, Klinge etwa 20°) und wurde verworfen. Neu gemalt in zwei frischen Chats mit ausdrücklicher Achsen-Vorgabe; der Produktinhaber wählte Fassung A (Griff etwa 14,5°, Klingenansatz etwa 13,5°).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: VAREK, 29, swordsman of the company; deserter from the border army, gambler. FACTION: Border army, deserted - riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain; the wyvern-skull insignia torn off his jerkin; plus an ember-orange belt sash (company sign). BUILD: tall (see the third image), plus loose, slouching shoulders. HEAD: long oval head, narrow jaw. EYES: medium, droopy, dark grey. BROWS: thick, angled. NOSE: long straight. MOUTH: wide crooked grin. MARKS AND AGE: short dark stubble as a flat shape, a small gold earring. SKIN: tan olive. HAIR: black undercut with one long strand falling over his right eye, the rest swept back. POSE: body three-quarter facing the RIGHT edge of the image; head tilted to one side; winking at the viewer. PALETTE: dominant iron red #9E3B2C, secondary iron grey #4A4F57, accent ember orange #E8743B. CLOTHES TELL: open long iron-red army coat over a battered grey jerkin with the insignia torn off, playing cards peeking from a pocket. EXPRESSION: cocky wink, crooked grin. WEAPON: a slightly curved sabre in his right hand, held loosely with the blade resting on his right shoulder and passing behind his neck. The whole sword is ONE rigid object on ONE straight axis: pommel, grip, guard and blade all continue in the same straight line, the fist wraps around the grip on that line, the blade leaves the guard in exactly the direction of the grip, no angle or kink at the guard; the blade curves only very slightly toward the tip; one single blade. SIGNATURE: the long strand over the eye and the red coat.

CHARACTER REFERENCE: the FOURTH attached image is the approved look of VAREK: keep his face, wink, hair, skin, outfit and colours like that image. The sword in that image is WRONG (the blade is bent against the grip); draw the sword only as described under WEAPON.
```

## Stimmungen

`varek_happy.png`, `varek_angry.png`, `varek_sad.png` (unveränderte Downloads), im selben Chat direkt nach dem neutralen Bild, je eine Nachricht nach `portrait_master.md` §7 mit dem Zusatz „exactly the same straight sabre: pommel, grip, guard and blade on one straight axis“.
