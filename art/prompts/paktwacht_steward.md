# paktwacht_steward – Verwalter der Paktwacht (Porträt)

Nebenfigur der Paktwacht-Missionen (langjähriger Schlüsselverwalter der Ruine). Sprecher-/Porträt-ID in Szenen: `paktwacht_steward`.

- **Datei:** `art/mockups/characters-s1/paktwacht_steward.png` (1254 × 1254, RGBA, echter Alphakanal 0–255, unverändertes Original, Git LFS; A3). Nur Stimmung `neutral` (wie Osric und Aldric); Stimmungsvarianten gibt es nicht, die App fällt auf neutral zurück.
- **Datum:** 2026-10-26 (Freigabe des Produktinhabers für diese vier Bilder am 2026-10-26)
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome
- **Tarif und Konto zum Erzeugungsdatum (A1):** ChatGPT **Plus**, Konto `maschoeller` (Seitenleiste, 2026-10-26); keine Modell-Versionsnummer sichtbar (Denkaufwand „Medium“)
- **Chat:** https://chatgpt.com/c/6adf9390-906c-83ed-902b-11e39148860f
- **Referenzen:** `kael.png`, `halvard.png`, `osric.png`, `brenna.png` (eigene Assets)
- **Iterationen:** 1 (der erste interne Versuch fand die Anhänge nicht; ChatGPT wiederholte ihn selbst mit den Referenzen und lieferte ein Bild, das abgenommen wurde)
- **Menschlicher Anteil (A2):** Figurenentwurf, Prompt, Auswahl und Abnahme; keine Nachbearbeitung
- **A7:** Prompt ohne Namen geschützter Werke, Marken oder Künstler; eigene Figur, keine erkennbare Vorlage

## Prompt

> Create an image. The four attached portraits (KAEL, HALVARD, OSRIC, BRENNA) are the APPROVED STYLE REFERENCES for my original fantasy tactics RPG 'Hollow Crown'. Match their style EXACTLY: 'Round Chibi Cartoon' - big ROUND head, large expressive eyes, short rounded body, soft dark-brown outlines, simple glossy cel shading, bright warm colors, toy-like rounded forms. Older characters stay in this SAME cute round style - show age only with grey hair, wrinkles, beard, never with realistic proportions, long faces or detailed anatomy. FORMAT: square 1:1, one single character, half-body dialogue portrait (head to hips), body turned slightly, centered, FULLY TRANSPARENT background (PNG with real alpha channel), no floor, no shadow, no text, no frame. Character: THE STEWARD of the Paktwacht castle ruin, about 68, who has kept the ruin's keys for many years: thin grey hair combed back with a few wisps, short grey stubble, kind but tired warm brown eyes with deep laugh lines and bags under them, slightly stooped; simple worn steward clothes: a faded dark-green wool vest over a cream linen shirt with patched elbows, a brown leather belt, a big ring of old iron keys of different sizes hanging from his belt and one old key held in his hand. No ember-orange (he is not a company member). Expression: gentle, tired, quietly relieved smile.

**Abnahme:** Round-Chibi wie die Referenzen, grauhaarig, Schlüsselbund am Gürtel und ein Schlüssel in der Hand, kein Glutorange, Hintergrund transparent, kein Text.

## Dialog-Porträt neu (Stil v2.5, 2026-11-01)

- **Dienst (A1, A2):** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome von Sonnet-Subagenten; keine Modell-Versionsnummer sichtbar
- **Tarif und Konto:** Plus, Konto `maschoeller` (Stand 2026-11-01)
- **Datum:** 2026-11-01/02
- **Vorlage:** `art/prompts/portrait_master.md` v2.5
- **Anhänge:** `art/mockups/style-2026-11/anchor_rhen.png`, `anchor_fenn.png` (Stil-Anker), `art/mockups/style-2026-11/guide_build_slim.png` (Statur-Vorlage)
- **Original (A3):** `art/mockups/characters-s1/paktwacht_steward.png` ist der unveränderte Download (1254 × 1254, RGBA, echter Alphakanal, Git LFS)
- **Menschlicher Anteil:** Figurenblatt (Session), Auswahl, Korrekturanweisungen und Abnahme durch den Produktinhaber (2026-11-02); keine Retusche
- **Chats:** https://chatgpt.com/c/6ae7c38e-1010-83ed-b4e1-461dd377350d
- **Iterationen:** 1 Chat, kein Neuversuch

## Prompt

Einleitung `Create an image.`, dann Stil-Block (§2), Format-Block (§3) und Statur-Absatz (§3a) aus `portrait_master.md` v2.5 wortgleich, danach:

```text
CHARACTER: THE STEWARD of the Paktwacht castle ruin, about 68, has kept the ruin's keys alone for many years.
FACTION: none, old castle servant (no company sign) - faded dark-green wool and cream linen.
BUILD: slim (see the third image), plus a clear stoop and thin arms.
HEAD: long oval head, narrow chin, big ears.
EYES: small, droopy, brown, bags under the eyes.
BROWS: sparse grey.
NOSE: long, slightly hooked.
MOUTH: thin-lipped, a small tired smile.
MARKS AND AGE: short grey stubble as one flat shape, deep laugh lines.
SKIN: pale, weathered.
HAIR: thin STRAIGHT grey hair combed back flat, a few wisps standing up.
POSE: body three-quarter facing the RIGHT edge of the image; head three-quarter, slightly bowed; gaze up at the viewer.
PALETTE: dominant faded dark green #4F5E48, secondary cream linen #E8DEC8, accent brown leather #6B4B34.
CLOTHES TELL: a faded dark-green wool vest over a cream linen shirt with clean patched elbows, a brown leather belt with a big ring of old iron keys.
EXPRESSION: quietly relieved, tired smile.
WEAPON: NONE - he is not a fighter; instead he holds up one big old iron key in his right hand.
SIGNATURE: the key ring and the raised old key.
```
