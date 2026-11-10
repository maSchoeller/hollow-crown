# border_captain – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Profilmenü, 2026-11-10)
- **Datum:** 2026-11-10
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_average.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/border_captain.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Auftrag durch den Produktinhaber (2026-11-10), Figurenblatt, Prompt und Prüfung (Prüfbogen `portrait_guides.py sheet`) durch den Assistenten; keine Retusche
- **Chat:** https://chatgpt.com/c/6af362d1-1b94-83eb-ae6e-89ea6462c69f
- **Iterationen:** 1 Chat, kein Neuversuch. Abweichend von §1 Schritt 4 nur ein Chat statt zwei parallel: der Rechner lief voll ausgelastet und ChatGPT fror in Chrome mit mehreren Tabs ein.
- **A7:** keine Namen fremder Werke, Marken, Studios oder Künstler im Prompt
- **Zweck:** Porträt der Einheit `captain` (Hauptmann des Grenzheers) auf `m2_5_silberquell`, `m2_6_kraehenholm` und `m2_8_kronfeld` (Kampf-Medaillon und Halbfigur, falls er später spricht); bisher ohne eigenes Bild (T7-16F3).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: CAPTAIN OF THE BORDER ARMY, about 40, a hard veteran officer of the Ironmark who once served under Sable and now holds the road against her.
FACTION: Border Army of the Ironmark - riveted iron-grey #4A4F57 armour, iron-red #9E3B2C tabard, pine-green #3E5B45 lining, fur mantle, wyvern-skull emblem, practical and plain.
BUILD: average (see the third image), plus square shoulders under the fur mantle.
HEAD: blocky head, square jaw, small ears.
EYES: small, narrow, dark grey.
BROWS: low heavy, straight, dark.
NOSE: broken bump (a simple line drawing).
MOUTH: thin-lipped, closed, set hard.
MARKS AND AGE: a clean diagonal scar across the left cheek, grey temples.
SKIN: ruddy fair.
HAIR: an open-faced IRON HALF-HELM with a short nose guard as the silhouette, short dark hair and a short dark beard (one flat shape) below it.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, chin up; gaze over the viewer toward the right edge.
PALETTE: dominant iron grey #4A4F57, secondary iron red #9E3B2C, accent pine green #3E5B45.
CLOTHES TELL: riveted iron breastplate under an iron-red tabard with a small white wyvern-skull emblem, a grey fur mantle on the shoulders, an officer's red sash.
EXPRESSION: brows down, jaw set, mouth a straight line.
WEAPON: a straight steel longsword held in his right hand, resting diagonally on his right shoulder, blade up and inside the image: ONE rigid object on ONE straight axis, pommel, grip, guard and blade in the same straight line; his left hand on the belt.
SIGNATURE: the iron half-helm and the officer's red sash.
```

## Abnahme

- Prüfbogen: Kopf und Breiten innerhalb der Vorlage `average`, kein `!`.
- Eiserne Halbhelm-Silhouette mit Nasenschutz ✓, eisenroter Wappenrock mit weißem Lindwurmschädel, Pelzmantel, grünes Futter, rote Offiziersschärpe ✓ (Kit wie Sable); Langschwert gerade auf einer Achse über der rechten Schulter ✓; Bart als flache Form ✓. Alphakanal, 1254 px, kein Text ✓.
- Die Narbe auf der Wange ist kaum zu sehen; stört die Lesbarkeit nicht.
- Abnahme durch den Produktinhaber: abgenommen am 2026-11-10 (Kontaktbogen am Handy, über die orchestrierende Session).
