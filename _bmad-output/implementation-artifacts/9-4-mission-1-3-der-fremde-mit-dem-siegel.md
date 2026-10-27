# Story 9.4: Mission 1-3 „Der Fremde mit dem Siegel“

Status: review

## Story

Als Spieler
möchte ich Liora sicher herausbringen und Halvard zum ersten Mal sehen,
damit die Paktgeschichte beginnt.

## Acceptance Criteria

1. **Karte:** `m1_3_silberbach` (16 × 18, Ziel `escort`: Liora zum Ausgang [6,17,9,17], Leutnant Morra erste Begegnung, zwei Häuser). Gegner Leicht 8 / Normal 10 / Schwer 12 (mit Wellen in Runde 3 und 5). Gelände unverändert.
2. **Knoten:** `m1_3` (`requires: completed m1_1`, `place silberbach`, `merchantTier 1`, `expectedLevel 3`), Weltkarte 1-3 zeigt ihn. Der PoC-Knoten `ch02` samt Karte, Szenen, Locale-Schlüsseln und Flags `ch02_hold`/`ch02_question` entfällt.
3. **Beitritt:** Liora tritt nach dem Sieg genau einmal bei (Kern: `escort` mit `join`) und erscheint im Ergebnis-Screen (`recruited`).
4. **Szenen:** `scn.m1_3.intro`, `morra_battle` (Kampfzeile, „Kopfgeld in Gold“), `house_hut`, `house_mill`, `outro` (Halvards erster Auftritt); DE in der Szene, EN im Locale, Box ≤ 110 Zeichen.
5. **Händlerstufe:** Stufe 2 öffnet mit der 4. abgeschlossenen Story-Mission, egal welche (`merchant[].storyCount`).
6. **Heimsuchungs-Anker:** `haunts:` mit drei Ankern (escort, rout, boss).
7. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Simulation siehe Dev Agent Record.

## Tasks / Subtasks

- [x] T1 PoC-Reste `ch02` entfernt (Knoten, Karte, Szenen, EN-/Namens-Schlüssel, Flags); Tests und Tools umgestellt
- [x] T2 Knoten `m1_3`, Weltkarte, Ortsbild `silberbach` (`tools/art/build.py`: `ACT1_LOCATIONS`)
- [x] T3 Karte: Ziel `escort`, Liora `follow`, Morra Eisenbogen mit Zitat, Häuser mit Szenen, Stufen/Profile per Simulation, `haunts`
- [x] T4 Szenen und Englisch; Name `unit.halvard.name`
- [x] T5 Händlerstufe nach Zahl der Missionen (`storyCount`), Tests `merchant-tier.test.ts`
- [x] T6 Liora und Varek in `units.yaml` (`joins`), Eskorten-Beitritt nur einmal
- [x] T7 Simulation abgestimmt, Decision-Logs

## Dev Notes

- **Entscheidungen des Produktinhabers (bindend, 2026-10-26):** Ziel echt `escort`; Morra marksman mit `iron_bow`; PoC-Knoten `ch02` entfernen; Händlerstufe nach Zahl der Missionen.
- **Technische Entscheidungen:**
  - Händlerstufe: `merchant[].storyCount` (optional) in der `campaign.yaml`; `currentTier` = Maximum aus Knoten-`merchantTier` und erreichten `storyCount`-Stufen; `refreshOffers` nach der Mission nutzt `currentTier`. Tier 2: `storyCount: 4`.
  - `finishBattle`: eine eskortierte dritte Partei tritt nur bei, wenn sie noch nicht im Tross ist (Wiederholung der Mission).
  - Liora: Karten-Einheit mit `char`, daher zählen die Charakterwerte (die Stufe der Karte wirkt nicht); sie trägt zusätzlich `leather_vest` und `leather_cap` (bleiben beim Beitritt am Körper).
  - Varek: `units.yaml` zeigt auf `m1_5` (`joins: m1_5`, `recruit: { chapter: m1_5, by: [kael] }` ohne Szene); Ansprechen und Szene baut Story 9.6 auf der Karte.
  - Morra auf [14,14] (nicht neben dem Haus [12,11], sonst fällt Fenn beim Hausbesuch), Auslöseradius 4; h1/h2/h4/h8 lösen bei Radius 3–4 aus.
  - Ortsbild: `silberbach` in `ACT1_LOCATIONS` des Art-Builds.
  - Halvards Hinweis (Dunn bei den Wolfsreitern im Wald) folgt der Karte `m1_4_wolfslager`.
- **Folgen für Bestehendes:** Tests mit `ch02` auf `m1_3` oder `avatar_bold` umgestellt (camp, core, enemy-types, graph, home, migrations, story, worker-replay, world-map, campaign-commands, restart), `tools/bench-ai.ts`, Kommentar in `src/app/state/flow.ts`.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim m1_3 --runs 50`, Standard-Tod (Siegrate / niedergestreckte Spielerfiguren je Lauf / Median-Runden):

| | Leicht | Normal | Schwer |
|---|---|---|---|
| verkettet | 100 % / 0,20 / 5 | 98 % / 0,15 / 6 | 85 % / 0,08 / 9 |
| `--fresh` | 100 % / 0,00 / 4 | 88 % / 0,40 / 7 | 30 % / 0,26 / 11 |

- Korridor: Leicht erfüllt; Normal fresh erfüllt, verkettet 98 % mit 0,15 unter der Untergrenze der Niedergestreckten (0,4); Schwer fresh erfüllt (30 %), verkettet 85 % über 70 %. Der Abstand verkettet/fresh kommt von den Stufen (frische Liste: Rhen und Kael Stufe 1); die Eskorte reagiert stark auf einzelne Schützen (Morra, h3). Der Autoplay führt Liora sinnvoll (bleibt im `follow`-Radius, läuft über die Brücke).
- Frühe Fassung (Morra Radius 6, Stufe 3–4): Schwer fresh 5–20 %, Liora fiel auf der Brücke durch Morras Bogen; Fenn fiel beim Hausbesuch der Mühle.

### Completion Notes List

- Gegnerzahlen 8 / 10 / 12 unverändert; Gelände unverändert. Gate: `pnpm lint`, `pnpm test` (856 Tests), `pnpm content:check`, `pnpm build` grün.

### File List

- Neu: `content/acts/act1/scenes/scn.m1_3.{intro,morra_battle,house_hut,house_mill,outro}.yaml`, `tests/unit/merchant-tier.test.ts`, diese Datei
- Gelöscht: `content/acts/act1/maps/ch02_silverbrook.yaml`, `content/acts/act1/scenes/scn.ch02.*.yaml` (10)
- Geändert: `content/acts/act1/{campaign,flags,units}.yaml`, `content/acts/act1/maps/m1_3_silberbach.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `content/world/valmora.yaml`, `tools/art/build.py`, `tools/bench-ai.ts`
- Code: `src/core/campaign/campaign.ts`, `src/core/defs.ts`, `src/content/{schemas,validate}.ts`, `src/app/state/flow.ts`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-10-26: Story 9.4 umgesetzt (Karte, Szenen, Halvards Auftritt, Liora-Beitritt, Händlerstufe nach Missionszahl).
