# Story 9.10: Nebenquest N1 „Der Ring von Varnhold“

Status: review

## Story

Als Spieler
möchte ich Fenns Vergangenheit kennenlernen, wenn ich ihn geschützt habe,
damit Entscheidungen eigene Geschichten öffnen.

## Acceptance Criteria

1. **Knoten:** `campaign.yaml` bekommt `{ id: n1, kind: side, map: n1_ring, titleKey: node.n1.title, pre: scn.n1.intro, post: scn.n1.outro, requires: [{ flag: { e02: protect } }], place: varnhold, expectedLevel: … }` (Flag `e02` aus Story 9.5 der Session „Akt 1 Mitte“); `memorialIf: [{ dead: fenn }]` mit `memorial: { pre: scn.n1.memorial_intro, post: scn.n1.memorial_outro }` (Gedenk-Variante). Weltkarten-Ort `n1` in `valmora.yaml` bekommt `node: n1`. N1 bleibt über Akte offen (Nebenquest, kein Verfall).
2. **Karte:** `n1_ring.yaml` spielbar: Platzhalter-Gold in den Truhen ersetzt; die Ring-Truhe bzw. der Fall des Ringmeisters bringt die Belohnung; Szene `scn.n1.ring` beim Fall des Ringmeisters (Trigger `unit_dies`). Stufen per Simulation im Normal-Korridor.
3. **Belohnung:** **Glutfunke** (`ember_spark`, Item `kind: promotion` laut Architektur §5.11; Bild `art/items/ember_spark.png` existiert; Verwendung erst mit Story 10.2) und **Signaturdolch „Elster“** (`magpie`, items.md §6.2: Werte wie `iron_dagger`, Seltenheit legendär, Preis 1 000 [C], Effekt: Stehlen auch ausgerüsteter Items, mit Regelcode im Kern, Vorschau und Tests). Erhalt des Glutfunkens als Moment inszeniert (Ergebnis-Zeile „Glutfunke erhalten“ mit Symbol). Auch in der Gedenk-Variante volle Belohnung (Produktinhaber 2026-10-26); die Elster geht dann in den Konvoi.
4. **Szenen DE + EN:** `scn.n1.intro`, `scn.n1.ring`, `scn.n1.outro`, Gedenk-Varianten (Fenn gefallen: andere Sprecher über die Ersatzsprecher-Kette, Trauerzeile); Ton laut Narrative (Fenn: Gaunersprache, prahlt; Humor nie in Trauerszenen).
5. **Prüfungen:** `content:check` grün, `pnpm sim n1_ring --runs 50` im Normal-Korridor; Screenshot der Quest.

## Dev Notes

- Narrative: Fenn (19, Späher, vom Diebesring verstoßen, weil er ein Kind nicht bestehlen wollte), E2, Nebenquest-Tabelle; GDD Missionszustände (Nebenquest offen über Akte, Gedenk-Variante).
- Karten N1–N3 gehören dieser Session; in `campaign.yaml`, `valmora.yaml`, Locale-Dateien nur anhängen.
- Abhängig von Story 9.5 (Flag `e02`) der Session „Akt 1 Mitte“: vor dem PR `origin/main` mit deren Stand holen.

### References

- [Source: concept/26-epics/epics.md#Story 9.10], [Source: concept/22-narrative/narrative.md#Die 10 Nebenquests], [Source: concept/21-gdd/items.md#6.2]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim n1_ring --runs 50`, Normal/Standard, verkettet (Prolog, 1-1, ch01, ch02, dann N1; 35 von 50 Ketten erreichen N1): **49 % Sieg, 17 Zeitüberschreitungen**. Grund: Die Autoplay-Spielerseite öffnet keine Türen und nutzt keine Schlüssel (nur bei der Truhenjagd), der Ringmeister bleibt hinter der Lagerhaustür unerreichbar. Mit einer Wegwerfkopie des Simulators, die Türen als Weg behandelt (nicht eingecheckt): **94 % Sieg**, Niedergestreckte 0,49 je Lauf, Mediane 7 Runden. Die Armee der Kette (Stufe 3 bis 4) ist kleiner als nach 1-4 zu erwarten. Gegnerstufen unverändert (Produktinhaber: Stufen lassen, Türgrenze notieren). Korridor Normal: Sieg 75–100 %, Niedergestreckte 0,4–1,3.
- `pnpm content:check`: nur die erwarteten Abhängigkeiten fehlen (`ember_spark`, Flag `e02`).

### Completion Notes List

- Knoten `n1` (`kind: side`, `expectedLevel: 4` [C], Ort `varnhold`, `memorialIf: { dead: fenn }` mit Gedenk-Szenen). Belohnung bei Sieg als Knotenwirkung in den Konvoi: Elster (`magpie`) und Glutfunke (`ember_spark`), in beiden Varianten (Produktinhaber 2026-10-26); die Truhen sind gewöhnliche Beute. Das Ergebnis zeigt beide als Folgezeilen.
- Regelcode: Item-Skill `long_fingers` (`effect.stealEquipped`); `stealableItems(data, target, thief)` bietet nach dem Beutel auch Ausgerüstetes (nicht `convoyOnly`, nicht Leutnant-Signaturen); die Vorschau trägt `takesEquipped` und `equipped`; die Auswahl zeigt „In der Hand“.
- Die Bedingungen des normalen Stehlens (Späher, lebender Gegner auf Nachbarfeld, kein Wurf, Beutel voll → Konvoi) gelten unverändert; „Geschwindigkeit“ ist dort keine Bedingung.
- Nebenquests verfallen nie: `availableNodes` kennt keinen Verfall (getestet).
- Szenen DE + EN: intro, ring (beim Fall des Ringmeisters, Zeilen für beide Fälle), outro, memorial_intro, memorial_outro. Elster als Fenns eigener Dolch und der Glutfunke im Ringhort: Produktinhaber 2026-10-26.
- Offen bis zum Merge der anderen Sessions: `e02` (Flag), `ember_spark` (Item); bis dahin meldet `content:check` genau diese Ids und `core.test.ts` (Inhalt ohne Befunde) schlägt fehl.

### File List

- Regeln: `src/core/rules/scout.ts`, `src/core/battle/apply.ts`, `src/core/defs.ts` (`SkillEffect.stealEquipped`), `src/content/schemas.ts` (`stealEquipped`), `src/app/screens/BattlePanels.tsx`
- Inhalte: `content/core/items.yaml` (`magpie`), `content/core/skills.yaml` (`long_fingers`), `content/core/locales/{de,en}.names.yaml`, `content/core/locales/{de,en}.yaml` (`ui.steal.*`), `content/acts/act1/campaign.yaml` (Knoten n1), `content/world/valmora.yaml` (n1), `content/acts/act1/maps/n1_ring.yaml`, `content/acts/act1/scenes/scn.n1.{intro,ring,outro,memorial_intro,memorial_outro}.yaml`, `content/locales/en/act1.dialogue.yaml`
- Tests: neu `tests/unit/elster-steal.test.ts`, `tests/fixtures/arena.ts`
- Doku: `concept/21-gdd/decision-log.md`, `concept/22-narrative/decision-log.md`
