# Story 9.12: Nebenquest N3 „Das Erbe“

Status: review

## Story

Als Spieler
möchte ich mit Tobin auf den Pachthof seines Vaters zurückkehren,
damit auch der Jüngste eine eigene Geschichte bekommt.

## Acceptance Criteria

1. **Knoten:** `{ id: n3, kind: side, map: n3_erbe, titleKey: node.n3.title, pre: scn.n3.intro, post: scn.n3.outro, requires: [{ completed: m1_6 }, { any: [{ alive: tobin }, { dead: tobin }] }], memorialIf: [{ dead: tobin }], memorial: { pre: scn.n3.memorial_intro, post: scn.n3.memorial_outro } }` (Tobin in der Truppe oder gefallen; gegangen = kein N3), Ort `n3` mit `node: n3`. Bleibt über Akte offen.
2. **Karte:** `n3_erbe.yaml` als Variante von Erlbach spielbar, Tobin Pflichtfigur (`deploy.forced: [avatar, kael, tobin]`, Produktinhaber 2026-10-26; fehlt er, weil gefallen, greift die bestehende Filterung `forced ∩ roster`). Platzhalter-Gold ersetzt.
3. **Belohnung:** Signaturlanze **Erbstück** (`heirloom`, items.md §6.2: Werte wie `iron_lance`, legendär, Preis 1 000 [C], Effekt: +Mt, solange ein Verbündeter in Reichweite 2 niedergestreckt ist – Regelcode im Kern, über dieselbe Formel wie die Kampfvorschau, Tests), **kein Glutfunke**. Auch in der Gedenk-Variante (Waffe in den Konvoi). Item-Bild `art/items/heirloom.png` per ChatGPT (Prompt und Abnahme in `art/prompts/`).
4. **Szenen DE + EN** inkl. Gedenk-Varianten (Tobin gefallen: Brenna als Ziehmutter, Ersatzsprecher-Kette), `content:check` grün, `pnpm sim n3_erbe --runs 50` im Korridor, Screenshot.

## Dev Notes

- Narrative: Tobin (17, vom Vater enterbt, weil er die Pacht nicht übernehmen wollte; „Helden sterben jung“), Brenna × Tobin.
- Abhängig von Knoten `m1_6` (Session „Akt 1 Ende“).

### References

- [Source: concept/26-epics/epics.md#Story 9.12], [Source: concept/22-narrative/narrative.md], [Source: concept/21-gdd/items.md#6.2]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim n3_erbe --runs 50`, Normal/Standard, verkettet (Stand 2026-10-27, mit dem Autoplay, der Türen öffnet und Gegner im Zaun angreift): 35 von 50 Ketten erreichen N3, 100 % Sieg (Korridor 75–100 %), Ø 0,09 Niedergestreckte, Ø 5,7 Runden; keine Anpassung der Gegnerstufen nötig. Vorher (alter Autoplay) 29 % mit 12 von 17 Zeitüberschreitungen.
- `pnpm content:check`: grün (m1_6 und die Knoten 1-4/1-5 liegen auf main). expectedLevel 7 (nach 1-6), damit die Kurve nie fällt.
- Ergebnisbild: die Knotenwirkung `heirloom` erscheint im Abschnitt „Erhalten“ (Erbstück erhalten), kein Glutfunke (Test in result.test.ts).

### Completion Notes List

- Knoten `n3` (`kind: side`, `expectedLevel: 6` [C], Ort `erlbach`, Anforderung `completed: m1_6` und Tobin lebt oder ist gefallen, `memorialIf: { dead: tobin }`). Erbstück als Knotenwirkung in den Konvoi, auch in der Gedenk-Variante, kein Glutfunke. Die Karte hat `deploy.forced: [avatar, kael, tobin]`; ein gefallener Tobin wird von der bestehenden Aufstellungsfilterung entfernt (getestet).
- Regelcode: Item-Skill `young_heroes` (`allyDownedWithin: 2`, `damageBonus: 3` [C]) über `skillTotals`, also dieselbe Formel für Vorschau, Auflösung und Gegenschlag (getestet).
- Szenen DE + EN: intro, outro, memorial_intro, memorial_outro (Brenna als Ziehmutter, kein Humor), home (Elternhaus, Dorfbelohnung `dialogue`). Der Vater bleibt abwesend, sein Verbleib ist offen [C].
- Nebenquests verfallen nie (getestet).

### File List

- Regeln: `src/core/rules/skills.ts` (`allyDownedWithin`), `src/core/defs.ts` (`SkillCondition.allyDownedWithin`), `src/content/schemas.ts`
- Inhalte: `content/core/items.yaml` (`heirloom`), `content/core/skills.yaml` (`young_heroes`), `content/core/locales/{de,en}.names.yaml`, `content/acts/act1/campaign.yaml` (Knoten n3), `content/world/valmora.yaml` (n3), `content/acts/act1/maps/n3_erbe.yaml`, `content/acts/act1/scenes/scn.n3.{intro,outro,memorial_intro,memorial_outro,home}.yaml`, `content/locales/en/act1.dialogue.yaml`; Bild `art/items/heirloom.png` und Prompt `art/prompts/heirloom.md` (schon vorhanden)
- Tests: neu `tests/unit/heirloom.test.ts`
- Doku: `concept/21-gdd/decision-log.md`, `concept/22-narrative/decision-log.md`
