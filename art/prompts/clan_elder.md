# clan_elder – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Profilmenü, 2026-11-10)
- **Datum:** 2026-11-10
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_small.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/clan_elder.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Auftrag durch den Produktinhaber (2026-11-10), Figurenblatt, Prompt und Prüfung (Prüfbogen `portrait_guides.py sheet`) durch den Assistenten; keine Retusche
- **Chat:** https://chatgpt.com/c/6af35e8b-847c-83eb-befa-01868f6ad52d
- **Iterationen:** 1 Chat, kein Neuversuch. Abweichend von §1 Schritt 4 nur ein Chat statt zwei parallel: der Rechner lief voll ausgelastet und ChatGPT fror in Chrome mit mehreren Tabs ein.
- **A7:** keine Namen fremder Werke, Marken, Studios oder Künstler im Prompt
- **Zweck:** Halbfigur der Clanältesten in N4 (`scn.n4.intro`, `scn.n4.memorial_intro`) und Porträt der Einheit `elder` auf `n4_clanlager`; ersetzt den Platzhalter `villager_elder` (T8-N4F3).

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: CLAN ELDER, about 75, the old head of a mountain clan of hunters in the Ironmark highlands; she has led her people through many hard winters and still decides who may stay.
FACTION: none, mountain clan of the Ironmark (no company sign, no emblem) - undyed grey-white wool #E6E1D6, white wolf fur #F2F0EA and deep forest green #3E5B45, bone and amber beads.
BUILD: small (see the third image), plus a bent back and a heavy fur mantle that looks one size too big.
HEAD: long oval head, narrow pointed chin, large ears.
EYES: small, hooded, pale ice-blue.
BROWS: bushy, white, low heavy.
NOSE: long hooked nose (a simple line drawing).
MOUTH: thin-lipped, closed, corners turned down.
MARKS AND AGE: deep crow's feet, three clean wrinkles on the forehead, two short parallel blue tattoo lines on each cheek.
SKIN: weathered light tan.
HAIR: long thin WHITE hair tied in a high KNOT on top of the head, held by two long bone pins, a few loose strands.
POSE: body three-quarter facing the RIGHT edge of the image; head almost frontal, chin slightly raised; gaze at the viewer, measuring.
PALETTE: dominant wool grey-white #E6E1D6, secondary forest green #3E5B45, accent amber #D9A931.
CLOTHES TELL: a heavy white wolf-fur mantle over a long green-and-grey wool tunic, a necklace of bone and amber beads, a belt with a small antler knife.
EXPRESSION: one white brow raised, mouth pressed into a thin line.
WEAPON: an old hunting spear, longer than she is, ONE rigid straight shaft with a leaf-shaped iron tip and a tuft of white fur under the tip; she leans on it with both hands, the shaft vertical beside her body, the tip inside the image above her head.
SIGNATURE: the white hair knot with bone pins and the spear she leans on.
```

## Abnahme

- Prüfbogen: Kopf auf TOP/EYES/CHIN wie die Anker; Breite bei 60 % und 78 % über der Vorlage (`!`), erklärbar durch den weiten Wolfspelzmantel.
- Weißer Haarknoten mit zwei Knochennadeln ✓, Speer gerade auf einer Achse, Spitze im Bild ✓, Wangentätowierung, Bernsteinkette, Geweihmesser ✓; Alter über Falten lesbar, Kopf in Chibi-Größe ✓. Alphakanal, 1254 px, kein Text ✓.
- Hinweis: ChatGPT hat dem Chat sechs statt drei Anhänge mitgegeben (Entwurfsreste anderer Tabs); das Ergebnis folgt trotzdem Ankern und Statur.
- Abnahme durch den Produktinhaber: abgenommen am 2026-11-10 (Kontaktbogen am Handy, über die orchestrierende Session).
