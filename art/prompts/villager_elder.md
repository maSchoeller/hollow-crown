# villager_elder – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_heavy.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/villager_elder.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c3dc-e324-83ed-9d91-aad79b443ed5
- **Iterationen:** 1 Chat, kein Neuversuch

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: VILLAGE ELDER of a small farming village in the borderland, about 70, a worried old farmer.
FACTION: none, borderland farmers (no company sign, no emblem) - undyed linen, brown wool and a sage-green neckerchief.
BUILD: heavy (see the third image), plus a round belly and a slight stoop; the head stays exactly as big as RHEN's.
HEAD: round head, a round full beard hiding the jaw.
EYES: medium, round, blue.
BROWS: bushy white.
NOSE: small round button nose.
MOUTH: small, slightly open.
MARKS AND AGE: rosy cheeks as one flat tone, crow's feet.
SKIN: ruddy pale.
HAIR: bald on top with a fluffy white fringe around the sides and a big ROUND white beard.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal; gaze at the viewer.
PALETTE: dominant undyed linen #E3D8C0, secondary brown wool #7A5A3C, accent sage green #8FA37A.
CLOTHES TELL: a simple undyed linen shirt, a brown wool vest, a sage-green neckerchief.
EXPRESSION: tired relief and hope, brows up in the middle.
WEAPON: NONE - not a fighter; a plain wooden walking stick in his right hand, his left hand raised in a worried welcoming gesture.
SIGNATURE: the round white beard and the walking stick.
```

## Korrektur 2026-11-03 (gilt, ersetzt die Datei oben)

- **Anlass:** Gesicht zu ähnlich zu Halvard und Amos, der Produktinhaber wollte ihn nicht dick. Er ist jetzt normal gebaut, trägt einen Strohhut und nur ein dünnes Kinnbärtchen.
- **Chat:** https://chatgpt.com/c/6aea3f4e-d044-83eb-bdba-bcda3e51801e
- **Anhänge:** `anchor_rhen.png`, `anchor_fenn.png`, `guide_build_average.png`
- **Iterationen:** Wie bei Halvard zwei verworfene Runden (Prompt-Fehler; Statur `slim` war dem Produktinhaber zu dünn).
- **Menschlicher Anteil:** Korrekturanweisung, Auswahl und Abnahme durch den Produktinhaber (2026-11-03); keine Retusche
- **Original (A3):** die Datei im Spielordner ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)

## Prompt

Einleitung `Create an image.`, Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: VILLAGE ELDER of a small farming village in the borderland, about 70, a worried old farmer.
FACTION: none, borderland farmers (no company sign, no emblem) - undyed linen, brown wool and a sage-green neckerchief.
BUILD: average (see the third image), normal healthy proportions, slightly sturdy, a slight stoop, NOT thin and NOT skinny, no big belly; the head stays exactly as big as RHEN's.
HEAD: normal round-chibi head, small pointed chin, big ears.
EYES: small, deep-set, hazel, tired.
BROWS: thin grey brows, up in the middle.
NOSE: thin slightly crooked nose (simple line drawing).
MOUTH: small, slightly open, one tooth missing.
MARKS AND AGE: a small wispy grey chin tuft (NO full beard, NO moustache), a few clean forehead and cheek lines.
SKIN: sun-browned.
HAIR: thin grey hair under a frayed wide-brimmed STRAW HAT.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal; gaze at the viewer.
PALETTE: dominant undyed linen #E3D8C0, secondary brown wool #7A5A3C, accent sage green #8FA37A.
CLOTHES TELL: a simple undyed linen shirt, a brown wool vest, a sage-green neckerchief.
EXPRESSION: tired relief and hope, brows up in the middle.
WEAPON: NONE - not a fighter; a plain straight wooden walking stick in his right hand, his left hand raised in a worried welcoming gesture.
SIGNATURE: the frayed straw hat, the wispy chin tuft and the walking stick.
HEAD SIZE: exactly the round-chibi head and face size of RHEN and FENN, and the same close framing as the anchors (head and upper body fill the image). Make him recognisable through hair, brows, nose and headgear, never through a longer or realistic face.
```
