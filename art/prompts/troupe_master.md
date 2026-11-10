# troupe_master – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Profilmenü, 2026-11-10)
- **Datum:** 2026-11-10
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_tall.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/troupe_master.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Auftrag durch den Produktinhaber (2026-11-10), Figurenblatt, Prompt und Prüfung (Prüfbogen `portrait_guides.py sheet`) durch den Assistenten; keine Retusche
- **Chat:** https://chatgpt.com/c/6af3620c-8ad0-83eb-bf1e-ece7224dadb8
- **Iterationen:** 1 Chat, kein Neuversuch. Abweichend von §1 Schritt 4 nur ein Chat statt zwei parallel: der Rechner lief voll ausgelastet und ChatGPT fror in Chrome mit mehreren Tabs ein.
- **A7:** keine Namen fremder Werke, Marken, Studios oder Künstler im Prompt
- **Zweck:** Halbfigur der Meisterin Maren in N6 (`scn.n6.master_talk`, `scn.n6.outro`, `scn.n6.memorial_outro`) und Porträt der Einheit `troupe_master` auf `n6_auemarkt`; bisher sprach sie nur in Erzählzeilen (T8-N6F4).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: MASTER MAREN, about 50, leader of a travelling troupe of players and knife-throwers who taught Jory to play; sharp-tongued, protective of her people.
FACTION: none, travelling players (no company sign, no emblem) - a coat sewn from many patches of colour (wine red #8E2B3A, mustard #D1A23A, teal #2F7F7A, plum #6B3A6B), the red stage curtain as her motif.
BUILD: tall (see the third image), plus long arms.
HEAD: heart-shaped head, small pointed chin.
EYES: medium, upturned, amber.
BROWS: thin arched, one higher than the other.
NOSE: straight (a simple line drawing).
MOUTH: wide, a lopsided half-smile showing a few teeth.
MARKS AND AGE: grey temples, crow's feet, a small round mole above the lip.
SKIN: warm olive.
HAIR: thick dark-auburn CURLY MANE with grey streaks, held back by a wide wine-red headscarf tied with a big knot and two hanging ends.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, tilted slightly; gaze toward the right edge.
PALETTE: dominant wine red #8E2B3A, secondary mustard #D1A23A, accent teal #2F7F7A.
CLOTHES TELL: a long patchwork coat with clean flat patches in four colours, gold-fringed shoulders like a stage curtain, a white blouse, a belt with three throwing knives in loops.
EXPRESSION: lopsided half-smile, one brow raised.
WEAPON: a throwing knife held between two fingers of her raised right hand beside her head, blade up: ONE rigid object on ONE straight axis, pommel, grip, guard and blade in the same straight line; her left hand rests on her hip.
SIGNATURE: the patchwork coat and the wine-red headscarf.
```

## Abnahme

- Prüfbogen: Kopf auf TOP/EYES/CHIN wie die Anker; Breite bei 40 % über der Vorlage (`!`), erklärbar durch die Lockenmähne.
- Flickenmantel in Weinrot, Senf, Petrol und Pflaume mit Goldfransen an den Schultern ✓, weinrotes Kopftuch mit Knoten ✓, Wurfmesser gerade zwischen zwei Fingern, drei Messer am Gürtel ✓, Hand an der Hüfte ✓, Muttermal, graue Strähnen ✓. Alphakanal, 1254 px, kein Text ✓.
- Sie wirkt eher jünger als 50 (graue Strähnen, wenige Falten); bei Bedarf Folgekorrektur „Merkmal/Alter“ (§7).
- Abnahme durch den Produktinhaber: offen (Kontaktbogen an die orchestrierende Session, 2026-11-10).
