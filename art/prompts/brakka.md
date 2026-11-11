# brakka – Dialog-Porträt (Stil v2.5)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_average.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/brakka.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c33e-6cd0-83ed-b0a1-e1d9283b68bb
- **Iterationen:** 1 Chat, kein Neuversuch

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: BRAKKA, 33, wyvern rider who sells her lance to the highest bidder (enemy lieutenant); reckless and cocky.
FACTION: Sellswords - earth brown #6B4B34 and dirty olive #6F6B3A leather and fur with rust-red #8E3B2E rags, patched, trophies (teeth, coins, bones), no emblem; personal piece: dark-olive scale riding armour.
BUILD: average (see the third image), plus muscular arms.
HEAD: square head, wide grin cheeks.
EYES: medium, narrow, amber.
BROWS: thin, one raised, teal.
NOSE: straight with a ring piercing.
MOUTH: wide sharp grin.
MARKS AND AGE: several ear piercings, a nose ring.
SKIN: tanned.
HAIR: teal hair in a short UNDERCUT, sides shaved, top swept to one side; riding goggles pushed up on the forehead.
POSE: body three-quarter facing the RIGHT edge of the image; head tilted; gaze at the viewer.
PALETTE: dominant dark olive #4F5A3A, secondary earth brown #6B4B34, accent teal #2BA39A.
CLOTHES TELL: dark-olive scale riding armour with leather straps, a rust-red rag at the belt.
EXPRESSION: reckless, cocky grin.
WEAPON: a long axe-lance (a lance with an axe blade at the tip) held diagonally across her body in both hands.
SIGNATURE: the teal undercut and the goggles.
```

## Nachtrag 2026-11-11 (Story 11.25): Figurenblatt berichtigt

Der Prompt oben bleibt im Wortlaut der Erzeugung (A3). Seit der Missionsliste (Narrative-Log 2026-11-05) gilt für Brakka:

- **Rolle:** **Ballistenmeisterin** zu Fuß, Söldnerin für den Meistbietenden (Klasse `marksman`, Grollfähigkeiten `ballista_reach`, `steady_crew`, `paid_in_full`; `content/acts/act2/lieutenants.yaml`); kein Wyvern, keine Flieger in Staffel 1.
- **Waffe im Spiel:** Bogen bzw. Ballisten auf der Karte statt Axtlanze (Art Direction §4.3: türkiser Haarschnitt, Bogen).
- **Aussehen bleibt:** türkiser Undercut, Fliegerbrille auf der Stirn und die oliv-braune Schuppenrüstung passen auch zur Ballistenmeisterin (die Brille als Zielbrille). Porträt und Brettfigur bleiben unverändert, kein neues Modell (F2, Produktinhaber 2026-11-06).
