# Story 9.11: Nebenquest N2 „Der letzte Wachturm“

Status: done

## Story

Als Spieler
möchte ich einen alten Wachturm der Paktwächter erkunden,
damit ich die erste Chronik-Seite und Lore finde.

## Acceptance Criteria

1. **Knoten:** `{ id: n2, kind: side, map: n2_wachturm, titleKey: node.n2.title, pre: scn.n2.intro, post: scn.n2.outro, requires: [{ completed: m1_3 }], … }`, Ort `n2` in `valmora.yaml` mit `node: n2`.
2. **Karte:** Ziel `seize` Turmtor (Produktinhaber 2026-10-26, Kael besetzt); Platzhalter-Gold ersetzt: Chronik-Truhe (8,1) gibt die Chronik-Seite (Wirkung `{ chronicle: <id> }`, Szene `scn.n2.page`), Relikt-Truhe (5,1) das Relikt (Szene `scn.n2.relic`). Wer die Truhen vor dem Sieg nicht öffnet, verpasst Seite und Relikt für diese Kampagne (Produktinhaber 2026-10-26); der Glutfunke kommt mit dem Sieg (Knoten-`effects`).
3. **Belohnung:** Glutfunke (`ember_spark`), Chronik-Seite (neue Seite in `content/acts/act1/chronicle.yaml`, Inhalt Akt 1 „dass die Könige jung starben und wie oft“, verfasst vom Wächter, DE + EN), Relikt **Schild der Paktwächter** Stufe 1 schlafend (`pact_warden_shield`, Nebenhand Schild, Werte wie `iron_shield` + Schutz für Nachbarn [C], Bild `pact_warden_shield_1.png`); Erwachen (Stufen 2/3) kommt in einer späteren Story (Produktinhaber 2026-10-26).
4. **Chronik:** Die Chronik zeigt die Seite (Zähler 1 von 12).
5. **Szenen DE + EN**, `content:check` grün, `pnpm sim n2_wachturm --runs 50` im Korridor, Screenshot.

## Dev Notes

- Narrative: Paktwächter, Paktwacht, Found Documents; items.md §5 Relikte.
- Abhängig von Knoten `m1_3` (Session „Akt 1 Mitte“, Story 9.4).

### References

- [Source: concept/26-epics/epics.md#Story 9.11], [Source: concept/22-narrative/narrative.md#Found Documents], [Source: concept/21-gdd/items.md#5. Relikte]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim n2_wachturm --runs 50`, Normal/Standard, verkettet (17 von 50 Ketten erreichen N2): **100 % Sieg**, Niedergestreckte 0,12, Mediane 2 Runden: Kael erreicht das Turmtor (Ziel `seize`) in 2 Runden, die Kette ignoriert die Plünderer. Gegnerstufen unverändert [C]. Hinweis: Das Ziel `seize` auf 6–7,3 ist vom Aufstellungsrand (Zeile 12–13) in 2 Runden zu erreichen; ein Spieler, der nur das Tor will, verpasst Truhen und Gefecht (so gewollt: Produktinhaber 2026-10-26).
- `pnpm content:check`: nur die erwarteten Abhängigkeiten fehlen (`m1_3`, `ember_spark`).

### Completion Notes List

- Knoten `n2` (`kind: side`, `expectedLevel: 3` [C], Ort `wachturm`, Anforderung `completed: m1_3`). Glutfunke als Knotenwirkung bei Sieg; Chronik-Seite und Relikt nur aus den Truhen (8,1) und (5,1), sonst für diese Kampagne verpasst.
- Neue Truhen-Belohnung `chronicle: <id>` (`Reward.chronicle`): `grantReward` merkt die Seite in `stats.pages`, `finishMission` wendet sie bei Sieg als `{ chronicle }` an (`chronicleAdded`, Ergebniszeile). `content:check` prüft die Seiten-Id; Nebenziel-Belohnungen dürfen keine Seite zahlen.
- Relikt `pact_warden_shield`: Stufe 1 schlafend, Aura-Skill `warden_ward` (Nachbarn +2 VER, solange der Träger steht [C]), Preis 0 / `unsellable`, Bild `pact_warden_shield_1`. Stufen 2/3 nicht gebaut.
- Chronik-Seite `a1_watchtower` „Der Turm zählt“ (DE + EN, 1 von 12). Szenen: intro, outro, page, relic. Ortsbild `wachturm` (neu vom Produktinhaber).
- Ortsbild: `place` löst über `art/mockups/locations-s1/<id>.png` (1672 × 941 RGB) auf, `content:check` prüft die Datei, `pnpm art:build` erzeugt `public/assets/locations/<id>.webp`.

### File List

- Regeln: `src/core/rules/skills.ts` (Aura), `src/core/defs.ts` (`SkillDef.aura`, `Reward.chronicle`), `src/core/state.ts` (`stats.pages`), `src/core/battle/apply.ts` (`grantReward`), `src/core/campaign/apply.ts`, `src/content/schemas.ts`, `src/content/validate.ts`
- Inhalte: `content/core/items.yaml` (`pact_warden_shield`), `content/core/skills.yaml` (`warden_ward`), `content/core/locales/{de,en}.names.yaml`, `content/acts/act1/campaign.yaml` (Knoten n2), `content/acts/act1/chronicle.yaml`, `content/locales/en/act1.chronicle.yaml` (neu), `content/world/valmora.yaml` (n2), `content/acts/act1/maps/n2_wachturm.yaml`, `content/acts/act1/scenes/scn.n2.{intro,outro,page,relic}.yaml`, `content/locales/en/act1.dialogue.yaml`
- Tests: neu `tests/unit/warden-shield.test.ts`
- Doku: `concept/21-gdd/decision-log.md`, `concept/22-narrative/decision-log.md`

### Nachtrag 2026-10-27 (Entscheidung Produktinhaber)

Das Eroberungsfeld (`seize`, Kael) liegt jetzt im Turminneren `[6, 1, 7, 1]`, hinter den Wachen e1 (6,2) und e2 (7,2); das Turmtor (6–7,3) bleibt Engstelle. Vorher erreichte Kael das Tor in 2 Runden, bevor gekämpft wurde. `seize` verlangt kein bestimmtes Terrain, nur Kael (Flag `seizer`) auf einem Feld der Area; die Felder (6–7,1) sind Boden. Sim (`pnpm sim n2_wachturm --runs 50`, Standard, verkettet), vorher / nachher:

| Schwierigkeit | erreichte Läufe | Sieg | Runden (Ø) | Niedergestreckte (Ø) |
|---|---|---|---|---|
| Leicht | 50 / 50 | 100 % / 100 % | 2,0 / 3,5 | 0,04 / 0,08 |
| Normal | 43 / 43 | 100 % / 100 % | 2,1 / 4,9 | 0,16 / 0,28 |
| Schwer | 9 / 9 | 100 % / 100 % | 4,9 / 6,9 | 0,67 / 0,89 |

Gegnerstufen unverändert [C]; Normal liegt knapp unter dem Korridor der Niedergestreckten (0,4–1,3), der Autoplay-Bot rennt am Gefecht vorbei, Schwer ist mit 9 Läufen nur informativ.

## Abnahme 2026-10-27

Abgenommen (Status done). Eroberungsfeld ins Turminnere (Entscheidung 2026-10-27); Sim Normal 100 %/0,52. Gesamtbefund: `acceptance-2026-10-27.md`.
