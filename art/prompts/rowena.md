# rowena – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_tall.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/rowena.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c29c-c804-83ed-b5c0-be3ce91cdabb
- **Iterationen:** 1 Chat, kein Neuversuch

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: DAME ROWENA, 28, pegasus knight and champion of the princess (enemy lieutenant); noble and idealistic.
FACTION: Crown / Silver Lance - polished rounded silver armour #C9D1DC with sky-blue #6FA8DC cloth and white #F7F9FC trim, winged-lance motif on pauldron or brooch, neat and clean.
BUILD: tall (see the third image), plus a straight noble bearing.
HEAD: oval head, defined chin.
EYES: large, almond, blue.
BROWS: thin, straight, platinum.
NOSE: small straight nose.
MOUTH: small, determined.
MARKS AND AGE: none.
SKIN: fair.
HAIR: long platinum hair in ONE HIGH BRAID swinging behind her.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, chin raised; gaze past the viewer.
PALETTE: dominant silver #C9D1DC, secondary sky blue #6FA8DC, accent white #F7F9FC.
CLOTHES TELL: gleaming rounded silver armour with a winged-lance pauldron, a sky-blue cape, a white feather on the pauldron.
EXPRESSION: noble, determined.
WEAPON: a long knightly lance held upright in her right hand, the steel tip inside the image; her helmet with small feathered wings held under her left arm.
SIGNATURE: the winged helmet.
```

## Nachtrag 2026-11-11 (Story 11.25): Figurenblatt berichtigt

Der Prompt oben bleibt im Wortlaut der Erzeugung (A3). Seit der Missionsliste (Narrative-Log 2026-11-05) gilt für Rowena:

- **Rolle:** Lanzenritterin der Prinzessin, kämpft **zu Fuß** (Klasse `knight`, `content/acts/act2/lieutenants.yaml`); kein Pegasus, keine Flieger in Staffel 1.
- **Signatur:** Ritterhelm mit kleinen weißen Flügeln, **unterm linken Arm bzw. in der linken Hand**, nie auf dem Kopf; dazu der lange hohe Zopf und die Lanze (Art Direction §4.3).
- **Das Porträt passt** und bleibt: Es zeigt sie schon zu Fuß mit Helm unterm Arm. Brettfigur: `art/prompts/rowena_board_turnaround.md` (Fassung 2026-11-11).
