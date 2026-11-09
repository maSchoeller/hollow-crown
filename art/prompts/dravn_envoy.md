# dravn_envoy – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von einem Opus-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-09)
- **Datum:** 2026-11-09
- **Vorlage:** `art/prompts/portrait_master.md` v2.5, mit Absatz GENERIC ENEMY (§4a): namenloser Sprecher (Bote des Grenzheers), Story 11.12
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_slim.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/dravn_envoy.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session nach Vorgabe des Produktinhabers 2026-11-09: eigene Halbfigur für den Sprecher der Nachszene von 2-1), Auswahl; keine Retusche. Vom Produktinhaber abgenommen am 2026-11-09.
- **Chats:** https://chatgpt.com/c/6af22d0c-15f0-83eb-a06d-5497f7f61c3f
- **Iterationen:** 1 Chat, kein Neuversuch; keine Stimmungen (die App zeigt für jede Stimmung die neutrale Figur)

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: an ENVOY of the border army, a wiry man of about 40, a rider who carries General Dravn's message; a nameless messenger, not a story character.
FACTION: Border army - riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain.
BUILD: slim (see the third image), plus a dusty travelling cloak over the shoulders.
HEAD: long oval head, narrow chin.
EYES: small, narrow, dark brown.
BROWS: low heavy, black.
NOSE: long nose.
MOUTH: thin-lipped, closed.
MARKS AND AGE: a few clean lines at the eyes, a short black beard as one flat darker shape.
SKIN: tan.
HAIR: black hair under a pulled-back HOOD of the pine-green travelling cloak, only a few strands at the forehead.
POSE: body three-quarter facing the RIGHT edge of the image; head turned slightly away; gaze to the side, measuring.
PALETTE: dominant iron red #9E3B2C, secondary pine green #3E5B45, accent iron grey #4A4F57.
CLOTHES TELL: iron-red tabard with the wyvern-skull emblem over a riveted iron-grey leather jerkin, pine-green hooded travelling cloak with a fur collar, dust on the hem as flat shapes.
EXPRESSION: curt and cool, one brow slightly lowered.
WEAPON: NONE - a messenger; holds up a rolled letter with a big iron-red wax seal stamped with the wyvern skull in his right hand, the other hand on the cloak.
SIGNATURE: the sealed letter with the wyvern-skull wax seal.
GENERIC ENEMY (a nameless unit, NOT a story character): draw this figure deliberately SIMPLER than the anchors: fewer and bigger shapes, at most two straps or belts, no personal items, no scars, no trophies, no jewellery, no patches; a plain everyday face with smaller, simpler eyes (small iris, one catchlight) and a plain look; the upper face slightly shaded by the headgear where there is one; flat faction colours. Head size, line and shading technique stay as in the anchors.
```

## Abnahme

- **Abgenommen** vom Produktinhaber am 2026-11-09 (Bild und Nachszene von 2-1).

- Prüfbogen (`portrait_guides.py sheet`, slim): 40 % 0.49, 60 % 0.55, 78 % 0.57, ohne `!`.
- Fraktions-Kit des Grenzheers (Eisenrot mit Wyvernschädel, Kiefergrün, Pelzkragen), als Bote ohne Waffe (Rollenstück: Brief mit Wyvernschädel-Siegel, `portrait_master.md` §5 Regel 3a für Nicht-Kämpfer). Der „Staub am Saum“ kam als flache Flecken unten am Mantel, im Halbbild kaum sichtbar.
- Unterscheidbar von Dravn (breit, graues Kurzhaar, Vollbart, Rüstung, Kriegsaxt) und class_soldier (Kesselhut): Kapuze, schmal, schwarzer Kinnbart, Brief statt Waffe.
