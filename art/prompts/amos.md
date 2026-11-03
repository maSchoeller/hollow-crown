# amos – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_heavy.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/amos.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c294-ac94-83eb-a787-aff467cd4c19
- **Iterationen:** 1 Chat, kein Neuversuch

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: BROTHER AMOS, 58, old field medic monk expelled from his order for treating enemies; gallows humour.
FACTION: Pact Temple order, cast out - ivory #F4EFE6 robes or white armour with flat gold #D9A931 trim bands and carmine #A3172E accents, crown motif, ceremonial and pristine; his habit faded to beige, the crown symbol unpicked; plus an ember-orange #E8743B rope belt (company sign).
BUILD: heavy (see the third image), plus a round belly; the head stays exactly as big as RHEN's.
HEAD: round head, round full cheeks.
EYES: small, round, brown, behind little ROUND SPECTACLES.
BROWS: bushy grey.
NOSE: broad round nose (simple line drawing).
MOUTH: crooked closed smile.
MARKS AND AGE: a bushy grey beard as one flat shape, crow's feet.
SKIN: medium olive.
HAIR: SHAVED bald head, shiny highlight.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, slightly tilted; gaze at the viewer over the spectacles.
PALETTE: dominant faded ivory beige #E3D9C3, secondary flat gold #D9A931, accent ember orange #E8743B.
CLOTHES TELL: the faded habit with rolled-up sleeves, a canvas APRON with bandages and herb pouches, the ember-orange rope belt.
EXPRESSION: crooked, dry smile, one brow raised.
WEAPON: a short wooden healing staff held in his right hand like a walking stick, its top bound with bandage.
SIGNATURE: the bald head, the spectacles and the apron.
```

## Korrektur 2026-11-03 (gilt, ersetzt die Datei oben)

- **Anlass:** Der Produktinhaber wollte den Stab aus der vorigen Fassung zurück; die Statur bleibt.
- **Chat:** https://chatgpt.com/c/6aea3982-3cb8-83eb-ba23-692a13a620ec
- **Anhänge:** die vorige Datei `amos.png` (Stand PR #98) und `amos.png` von `main` als Vorlage für den Stab. Abweichung: ChatGPT teilt den Entwurf eines neuen Chats zwischen Tabs, deshalb gingen in dieser einen Nachricht vier fremde Anhänge mit (`anchor_*`, `guide_*`), alle aus diesem Repository.
- **Menschlicher Anteil:** Korrekturanweisung, Auswahl und Abnahme durch den Produktinhaber (2026-11-03); keine Retusche
- **Original (A3):** die Datei im Spielordner ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)

```text
Create an image. The FIRST attached image is the APPROVED dialogue portrait of BROTHER AMOS from my original fantasy tactics RPG 'Hollow Crown'. Keep it exactly: same character, face, beard, spectacles, pose, crop, faded ivory habit, apron, pouches, rope belt, same drawing style, square 1:1, FULLY TRANSPARENT background (PNG with real alpha channel), no text.
Change ONLY the staff in his right hand: remove the staff with the bandage and draw instead EXACTLY the staff from the SECOND attached image (an older version of him): dark knotted brown wood, spiral wood grain, at its top a small claw holding a glowing amber crystal, a small round gold medallion hanging on a short cord below the crystal. His hand grips it at the same place as now.
Do not use anything else from the second image: his clothes and his face stay as in the first image.
```
