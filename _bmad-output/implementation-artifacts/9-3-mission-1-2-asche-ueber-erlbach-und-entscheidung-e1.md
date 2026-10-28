# Story 9.3: Mission 1-2 „Asche über Erlbach“ und Entscheidung E1

Status: done

## Story

Als Spieler
möchte ich ein Dorf gegen Hask verteidigen und ihm zum ersten Mal begegnen,
damit ich die Leutnants kennenlerne.

## Acceptance Criteria

1. **Karte:** `m1_2_erlbach` (16 × 16, Ziel `defend`: der Dorfälteste übersteht 8 Runden, Leutnant Hask erste Begegnung, fünf besuchbare Häuser, Marodeure mit Profil `raider`). Gegner Leicht 8 / Normal 10 / Schwer 12 (mit Wellen in Runde 3 und 5). Gelände unverändert.
2. **Knoten:** `m1_2` (`requires: completed m1_1`, `place erlbach`, `merchantTier 1`, `expectedLevel 3`), Weltkarte 1-2 zeigt ihn. Der PoC-Knoten `ch01` samt Karte, Szenen und Locale-Schlüsseln entfällt; `ch02` verlangt `completed m1_1`; das Glutbuch geht an `m1_1`.
3. **Szenen:** `scn.m1_2.intro`, `hask_battle` (Kampfzeile), `mira_house`, `mira_lost`, `house_elder/n1/n2/w`, `outro` mit E1; DE in der Szene, EN im Locale, Box ≤ 110 Zeichen.
4. **Mira:** Beitritt per Besuch des Hauses `v_e` (`reward: { recruit: mira }`); zerstört ein Marodeur es vorher, ist sie weg und E1 entfällt (Szene prüft `alive: mira`).
5. **E1:** Entscheidung `keep` / `release` (Flag `e01`), Folgen-Karte zeigt `leave: mira` und `villageAid`.
6. **Dorfhilfe:** Wirkung `villageAid: { act: 1 }` umgesetzt (Heiltrank 4 statt 3 Ladungen im Akt, Auffüllen nach jeder Mission).
7. **Zivilist:** Klasse `civilian` (keine Waffe), der Älteste nutzt sie.
8. **Heimsuchungs-Anker:** `haunts:` mit drei Ankern (defend, rout, boss).
9. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Simulation siehe Dev Agent Record.

## Tasks / Subtasks

- [x] T1 PoC-Reste `ch01` entfernt (Knoten, Karte, Szenen, EN-/Namens-Schlüssel); Tests, `flow.ts`, README, Raum-/Tavernen-Bedingungen auf `storyCount` umgestellt (AC 2)
- [x] T2 Knoten `m1_2`, Weltkarte, Glutbuch an `m1_1`, `ch02` verlangt `m1_1` (AC 2)
- [x] T3 Karte: Belohnungen, Zivilist, Hask auf Eisen, Trigger `t_mira_lost`, Stufen/Profile per Simulation, `haunts` (AC 1, 4, 8)
- [x] T4 Szenen und Englisch (AC 3, 5)
- [x] T5 Flag `e01` (AC 5)
- [x] T6 Klasse `civilian` (Schema erlaubt leere `weaponGroups`), Namen DE/EN (AC 7)
- [x] T7 Wirkung `villageAid` (Zustand `c.villageAid`, Regel in `createBattle`/`finishBattle`, Wert in `balance.yaml`), Tests `village-aid.test.ts` (AC 6)
- [x] T8 Simulation abgestimmt (AC 9); Autoplay schützt bei `defend` den Schutzbefohlenen (`ai.wardGuardRadius`)
- [x] T9 Decision-Logs (Narrative, Architektur), Architektur §5.3 Stand

## Dev Notes

- **Quellen:** Epics 9.3; Narrative (Mira, Hask, E1, Dialogue Style); Architektur §5.4, §5.8, §5.9; EXPERIENCE (Entscheidung, Folgen-Karte); Vorbild `9-2-mission-1-1-steckbriefe.md`.
- **Entscheidungen des Produktinhabers (bindend, 2026-10-26):**
  - Miras Beitritt per Hausbesuch im Kampf; Haus `v_e` [13,7] (Ziel des Marodeurs r5), Zerstörung → Mira dauerhaft weg, E1 entfällt. Bedingung der Entscheidungszeile: `requires: [{ alive: mira }]` (Mira ist in der Truppe).
  - E1 in `scn.m1_2.outro`: `keep` → `e01: keep`; `release` → `e01: release`, `leave: mira`, `villageAid: { act: 1 }`. Flag `e01` (decision, `season2: false`).
  - Dorfhilfe = Wirkung `villageAid` (siehe Architektur-Decision-Log): Heiltrank (`use.heal`, derzeit nur `vulnerary`, 3 Ladungen, füllt nach jeder Mission auf) hat im Akt 4 Ladungen (`balance.economy.villageAid.healCharges: 1`).
  - Neue Klasse `civilian` (Nichtkämpfer). Figur und Porträt des Ältesten: `villager_elder`.
  - Hasks Flucht ohne Sonderwirkung; Hask `iron_axe` statt `steel_axe` (R15/R35); Szene `hask_battle` als `quote`.
  - Glutbuch (Ember) für Rhen wandert an `m1_1`.
  - Heimsuchungen beginnen mit Hasks `met` (Generator Story 5.5); hier nichts zu tun.
- **Technische Entscheidungen:**
  - Die Karte `v_e` gibt `recruit: mira` statt des Wurfspießes; `v_elder` behält das Fläschchen, weil der Älteste nicht mehr auf der Haus-Kachel steht.
  - **Nacharbeit (Produktinhaber 2026-10-26):** Der Älteste steht wieder im Dorf, auf der Dorfstraße am Brückenkopf [7,10] (sein Haus [6,8]); Gegnerstufen wieder 3–4 (Hask rechnet `createBattle`). Der Korridor kommt aus Startabständen, Profilen und Wellen: Raider r1/r2/r3 starten im Norden/Nordwesten (Weg zum Ziel mindestens 6 Felder), brauchen also zwei Gegnerphasen und brennen ein Haus frühestens in Gegnerphase 3 nieder; jedes Haus ist in Spielerphase 2 oder 3 erreichbar. Der Raider auf Miras Haus (r5) kommt in einer Welle (Runde 2, Start [13,1]). r4/r6/r7/r9 sind `trigger`; Schwer tauscht r2 und r3 gegen `r2h` (trigger Radius 4) und `r3h` (Raider auf das Haus des Ältesten), hat den Wächter `r10` (trigger Radius 2) und in Runde 6 eine Welle aus Lanzenträger und Schütze.
  - **Mira nach dem Sieg:** Das Karten-Trigger `t_mira_lost` setzt zusätzlich das Battle-Flag `mira_house_razed` (flags.yaml). Neue kleine Kernfähigkeit: Knoten haben `effectsIf: [{ requires, effects }]` (Schema, `content:check`, `finishMission`, Simulation); `m1_2` hat `effectsIf: [{ requires: [{ not: { flag: mira_house_razed } }], effects: [{ recruit: mira }] }]`. Steht ihr Haus noch und wurde nicht besucht, tritt Mira nach dem Sieg bei, die Nachszene bringt E1; nur ein abgebranntes Haus kostet sie dauerhaft. Wer im Kampf besucht hat, ist schon dabei (`recruit` ist idempotent).
  - **Ergebnis-Screen:** `withoutLeavers` (core/campaign/resultView.ts) nimmt Figuren, die in der Nachszene gehen, aus `recruited` und den Einheitenzeilen.
  - **Zivilist-Figur:** `villager_elder` (Brettfigur `art/models/units/villager_elder.glb`, Porträt `art/mockups/characters-s1/villager_elder.png`) per `sprite`/`portrait` am Ältesten und `art: villager_elder` an der Klasse `civilian`; `pnpm art:build` nimmt beides ohne Eintrag auf (Modell im Pack act1, Halbfigur und Kopf).
  - Das Glutbuch hat eine Zeile in `scn.m1_1.outro` (`l01b`, Rhen).
  - `weaponGroups` im Klassenschema darf leer sein (Test in `roles.test.ts` angepasst).
  - `ConsequenceLine` `villageAid` trägt jetzt `act`.
  - Titel: „Asche über Erlbach“ ohne Nummer (wie `node.m1_1.title`).
- **OFFEN:**
  1. **Weltkarten-Variante von Erlbach** (Epics-AC „folgt dem Ausgang“) ist nicht gebaut; es gibt kein Variantenbild.
  2. **Heiltrank:** `remedy_salve` zählt nicht (Produktinhaber).
  3. **Simulation:** Normal fresh liegt bei 0,2 statt 0,4 Niedergestreckten; Fenn fällt als Schnellster oft.
- **Folgen für Bestehendes:** PoC-Knoten `ch01` weg; Raum-Freischaltungen (Schmied, Heiler, Taverne: 3 Story-Missionen; Lagerfeuer: 4) und Taverne (Elementarist, Heiler) hängen an `storyCount`; `ch02` verlangt nur noch `m1_1` und ist damit parallel zu 1-2 spielbar (Story 9.4 ersetzt ihn).

### Project Structure Notes

- Neu: `content/acts/act1/scenes/scn.m1_2.{intro,hask_battle,mira_house,mira_lost,house_elder,house_n1,house_n2,house_w,outro}.yaml`, `tests/unit/village-aid.test.ts`.
- Gelöscht: `content/acts/act1/maps/ch01_varnhold.yaml`, `content/acts/act1/scenes/scn.ch01.*.yaml`.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale; Code und Schlüssel englisch, Konzept deutsch.

### References

- [Source: concept/26-epics/epics.md#Story 9.3]
- [Source: concept/22-narrative/narrative.md]
- [Source: _bmad-output/implementation-artifacts/9-2-mission-1-1-steckbriefe.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim m1_2 --runs 50`, Standard-Tod. **Verkettet:** Leicht 100 % / 0,14; Normal 93 % / 0,66 (44 von 50 erreichen 1-2); Schwer 81 % / 0,56 (nur 16 von 50 erreichen 1-2). **Mit `--fresh`:** Leicht 100 % / 0,36; Normal 98 % / 0,22; Schwer 42 % / 0,42. Median jeweils 9 Runden (Ende von `defend`). Der Autoplay rettet Miras Haus in Leicht (50 von 50), in Normal/Schwer wegen des Schutzauftrags selten.
- Korridor: Leicht (≥ 95 %, ≤ 0,5) und Schwer fresh (30–70 %) liegen darin; Normal liegt im Siegbereich, aber mit 0,22 unter der Untergrenze der Niedergestreckten (0,4). Schwer verkettet über 70 % bei nur 16 Läufen.
- Die Simulation schwankt stark mit einzelnen Einheiten (ein Raider auf der falschen Seite kippt Schwer von 100 auf 0 %); die Werte wurden an 30–50 Läufen abgestimmt.

### Completion Notes List

- Gegnerzahlen 8 / 10 / 12 unverändert; Gelände unverändert.
- Gate: `pnpm lint`, `pnpm test` (849 Tests), `pnpm content:check`, `pnpm build` grün.

### File List

- Neu: `content/acts/act1/scenes/scn.m1_2.*.yaml` (9), `tests/unit/village-aid.test.ts`, diese Datei
- Gelöscht: `content/acts/act1/maps/ch01_varnhold.yaml`, `content/acts/act1/scenes/scn.ch01.*.yaml` (10)
- Geändert: `content/acts/act1/{campaign,flags,units}.yaml`, `content/acts/act1/maps/m1_2_erlbach.yaml`, `content/core/{balance,classes,rooms}.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `content/world/valmora.yaml`, `README.md`
- Code: `src/core/{defs,state}.ts`, `src/core/rules/items.ts`, `src/core/campaign/{campaign,effects,consequences}.ts`, `src/core/battle/setup.ts`, `src/core/ai/autoplay.ts`, `src/core/campaign/resultView.ts`, `tools/simCampaign.ts`, `src/content/schemas.ts`, `src/app/state/flow.ts`, `src/ui/{components,pieces}.tsx`
- Tests: `tests/unit/{camp,core,decisions,enemy-types,graph,home,lieutenants-join,lieutenants-scaling,migrations,packs,result-recruit-level,roles,sim-campaign,story,terrain3d,worker-replay}.test.ts`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/{architecture,decision-log}.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-10-26: Story 9.3 umgesetzt (Karte, Szenen, E1, Klasse `civilian`, Wirkung `villageAid`, Heimsuchungs-Anker), Simulation abgestimmt.
- 2026-10-26 (Nacharbeit nach Kontrolle, Entscheidungen des Produktinhabers): Ältester zurück ins Dorf (Dorfstraße [7,10]), Gegnerstufen 3–4, Raider-Starts so, dass jedes Haus ab Spielerphase 2 erreichbar ist; Mira tritt im Outro bei, wenn ihre Hütte steht (Knoten-`effectsIf`, Battle-Flag `mira_house_razed`); Glutbuch-Zeile in `scn.m1_1.outro`; Ergebnis-Screen ohne Gehende (`withoutLeavers`); Zivilisten-Figur `villager_elder` (Porträt, Halbfigur, Tripo-Brettfigur) statt Platzhalter, der Älteste spricht mit Namensschild; Zieltexte nennen ihre Einheit (`defend`/`escort` {name}, Nebenziel `recruit` {name}, `kill_with` {weapon}); Nebenziel `s_bow` gestrichen (`kill_with` zählt nur Bosse, 1-2 hat keinen). `e02`/`e03` im Flag-Register vorab deklariert (Abstimmung mit der Session N1–N3).

## Abnahme 2026-10-27

Abgenommen (Status done). Gespielt (Mira-Haus zerstört, E1 entfällt) und E1 „gehen lassen“ per `__hc.devNode` (Folgen-Karte, Dorfhilfe). Gesamtbefund: `acceptance-2026-10-27.md`.
