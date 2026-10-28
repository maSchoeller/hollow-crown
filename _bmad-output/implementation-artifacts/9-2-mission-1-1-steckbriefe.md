# Story 9.2: Mission 1-1 „Steckbriefe“

Status: done

## Story

Als Spieler
möchte ich erfahren, dass die Truppe als Königsmörder gesucht wird,
damit der Antrieb „Sündenbock“ greift.

## Acceptance Criteria

1. **Karte:** `m1_1_steckbriefe` (14 × 16, Varnhold, Mittag, klar), Ziel `rout`, neue Regel Waffendreieck (Lektion `scn.m1_1.tutorial_triangle`, drei Zeilen). Freie Kopfgeldjäger (nicht Morras Leute) mit Axt, Lanze und Schwert gemischt, ein Anführer ohne Leutnant-Status: Leicht 6, Normal 7 (mit Anführer), Schwer 8 plus eine Welle von hinten (Süden) in Runde 3 (Zahlen unverändert; Stufen und Profile per Simulation abgestimmt).
2. **Knoten:** `m1_1`, `expectedLevel 2`, `requires: completed prologue`, `merchantTier 1`, Titel „Steckbriefe“ / „Wanted“. `ch01` verlangt jetzt `completed m1_1`; die PoC-Knoten `ch01` und `ch02` bleiben als Brücke im Graphen (Prolog → 1-1 → ch01 → ch02), Weltkarte: ch01 auf 1-2, ch02 auf 1-3, bis die Stories 9.3 und 9.4 sie ersetzen.
3. **Szenen:** `scn.m1_1.intro` (Ankunft, Steckbriefe, Gerrit noch spürbar, nicht schwer) und `scn.m1_1.outro` (Fenn tritt bei, neues Ziel „Wer hat uns angeheuert?“), Stimmen laut Narrative, je Box ≤ 110 Zeichen, DE in der Szene, EN im Locale.
4. **Fenn:** als Einheit in `units.yaml` (Späher, Stufe 2, Werte [C]), Support-Paar Mira × Fenn in `supports.yaml`.
5. **Nebenziele:** `visit_villages` (vier Häuser mit kurzen Besuchsszenen), `no_downs`, `turn_limit` (9 Runden, per Simulation abgestimmt: Median Normal 9 nach dem Merge von #46). `goldReward` 800 [C].
6. **Heimsuchungs-Anker:** drei Felder als Kommentarblock (Story 5.5, noch ohne Schema).
7. **Prüfungen:** `pnpm content:check`, `pnpm lint`, `pnpm test`, `pnpm build` grün; `pnpm sim m1_1 --runs 50` liegt im Korridor (siehe Dev Agent Record).

## Tasks / Subtasks

- [x] T1 Karte `m1_1_steckbriefe.yaml` mit Märkten, Ständen (`stall`), Brunnen (`well`), Steckbriefwand (Mauerstück), vier Häusern (AC 1, 5, 6)
- [x] T2 Knoten `m1_1`, Graph, Weltkarte (`valmora.yaml`: m1_1 → m1_1, m1_2 → ch01, m1_3 → ch02) (AC 2)
- [x] T3 Szenen `intro`, `outro`, `tutorial_triangle`, `posters`, vier Haus-Szenen; Englisch (AC 3)
- [x] T4 Fenn in `units.yaml`, Paar in `supports.yaml`, `supports` bei Mira (AC 4)
- [x] T5 Tests auf den neuen Graphen umgestellt (siehe File List)
- [x] T6 Sim-Abstimmung der Gegnerstufen und Zielverhalten (AC 7)
- [x] T7 Fenns Beitritt als Knoten-Wirkung (`effects: [{ recruit: fenn }]` an `m1_1`, Architektur §5.4)
- [x] T9 Bild `varnhold` (Ort und Szenenhintergründe, PR #45); Mittagslicht gedämpft (Umgebung #e9e9e6 · 0,75, Sonne #fff4e2 · 0,85); Stadtrand mit neuem Gelände `building` (Requisite `house`, nicht besuchbar) [C], Karren (`wagon`), Zäunen (`fence`) und Ständen, drei Gassen und Südzugang frei
- [x] T8 Screenshots der Karte und der Szenen (Hochformat 375×812, im Browser angespielt bis Sieg, 2026-10-25)

## Dev Notes

- **Quellen:** Epics 9.2; Narrative „Story Beats“ 3, „Gefährten“ (Fenn), „Dialogue Style“ (Fenn: Gaunersprache, prahlt, übertreibt; Humor erst nach Trauer), „Missionsfolge“ (1-1 ★); `concept/06-maps-missions.md` §10; Art Direction §2.4/2.5; `scn.ch01.tutorial_triangle` als Vorbild der Lektion.
- **Entscheidungen des Produktinhabers (bindend, 2026-10-25):**
  - Varnhold am Mittag, klar: Sonne hoch, neutral-warm; Staub, Markt. Beat 3: ganz Valmora hält die Truppe für die Mörder des Königs, Steckbriefe hängen in der Stadt, neues Ziel: Wer hat uns angeheuert?
  - Gegner: freie Kopfgeldjäger, nicht Morras Leute (Morra erst in 1-3), Axt/Lanze/Schwert gemischt, ein Anführer ohne Leutnant (`boss` nicht gesetzt, kein `lieutenant`). Zahlen: Leicht 6, Normal 7, Schwer 8 + Welle von hinten.
  - Fenn tritt **nach dem Sieg** in der Nachszene bei, nicht auf der Karte.
  - Karte: Südstraße (Aufstellung 6 Plätze, max. 4, Avatar + Kael erzwungen), Markt mit Ständen, Brunnen, Steckbriefwand in der Mitte, Kopfgeldjäger aus Nord-, West- und Ostgasse, besuchbare Häuser am Rand mit Gold, kleinen Gegenständen und einem Satz über die Steckbriefe.
  - Brunnen: kein Modell, bis dahin der Felsblock (`well` → `prop: rock`); Marktstände `stall` → Requisite `tent`.
  - Brücke im Graphen: `prologue → m1_1 → ch01 → ch02`; `mechanics` in `campaign.yaml` unverändert (Dreieck nach 1, Magie nach 2, Elemente/Unterstützungen nach 3 Story-Missionen). Folge: Magie ist durch die zusätzliche Mission schon in `ch01` frei, Elemente/Unterstützungen in `ch02`.
  - Gold: Akt-1-Story-Mission 800–1 500; `goldReward` 800 [C].
- **Unterschiede zu den Annahmen im Skizzentext:** Die Skizze der Karte war nicht maßstäblich (12 Spalten, 9 Zeilen); die Karte ist 14 × 16 neu gesetzt. Die Steckbriefwand sind zwei Mauerfelder (6,3) und (7,3) mit einer einmaligen Szene beim Betreten (`scn.m1_1.posters`).
- **Ortsbild des Knotens:** `place` nennt `backgrounds/bg_caravan_road` (Platzhalter bis Story 8.7: `bg_varnhold_market`), weil `content:check` den Hintergrund prüft. Szenen-Hintergründe werden nicht geprüft; die Szenen nutzen `bg_varnhold_market`.
- **OFFEN:**
  1. **Fenns Beitritt** ist entschieden (Produktinhaber 2026-10-25): Knoten-Wirkung `recruit: fenn` an `m1_1`, bei Sieg angewendet (`finishMission`), der Ergebnis-Screen führt ihn bei den Beitritten; die Simulationen wenden die Knotenwirkung selbst an.
  2. `personalSkill` und Affinität von Fenn: kein passender Skill, keine Vorgabe im Konzept (`# OFFEN` in `units.yaml`; Affinität `wind` als Startwert [C]).
  3. Belohnungen der Nebenziele (Dörfer 200, schnell 100 Gold) und `goldReward` sind Startwerte [C]; `turn_limit` 9 Runden ist abgestimmt (Median Normal 9).
  4. `ch01` zeigt in seiner Einführung die Mechanik Waffendreieck noch einmal (PoC unverändert), seine Einleitung behandelt die Nachricht vom Tod des Königs noch als Neuigkeit, was nach Prolog und 1-1 überholt ist.
- **Folgen für Bestehendes:** Sprecher `grosk` steht nur noch in Szenen, nicht mehr als Karteneinheit (bisher im Prolog); sein Namensschild gilt damit bis Story 9.5 als Spielerseite.

### Project Structure Notes

- Neu: `content/acts/act1/maps/m1_1_steckbriefe.yaml`, `content/acts/act1/scenes/scn.m1_1.{intro,outro,tutorial_triangle,posters,house_nw,house_ne,house_w,house_e}.yaml`.
- Geändert: `content/acts/act1/{campaign,units,supports}.yaml`, `content/world/valmora.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale; Code und Schlüssel englisch, Konzept deutsch.

### References

- [Source: concept/26-epics/epics.md#Story 9.2]
- [Source: concept/22-narrative/narrative.md#Story Beats]
- [Source: concept/06-maps-missions.md#10]
- [Source: _bmad-output/implementation-artifacts/9-13-supports-und-barks-von-akt-1.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim m1_1 --runs 50`, Standard-Tod. **Verkettet:** Leicht 100 % / 0,02; Normal 69 % / 0,51 (49 Läufe); Schwer 0 % (nur 21 von 50 Läufen gewinnen den Prolog, danach stirbt Rhen in 20 von 21). **Mit `--fresh`** (volle Truppe): Leicht 100 % / 0,00; Normal 78 % / 0,64 (Median 8 Runden); Schwer 56 % / 1,24 (Median 15). Kette über den Akt (`--campaign act1 --runs 30`, Normal): Prolog 97 % / 0,40, 1-1 100 % / 0,17 (Downs unter dem Korridor), ch01 100 % / 0,40, ch02 83 % / 0,77.
- Grenze: In der Kette fehlen nach dem Prolog oft Brenna und Tobin (Standard-Tod: Niedergestreckte scheiden aus); Rhen und Kael allein verlieren auf Schwer fast immer und auf Normal etwa jede dritte Kette. Das lässt sich über Gegnerstufen nicht beheben, ohne die volle Truppe (Korridor mit `--fresh`) zu leicht oder zu schwer zu machen (Anführer Stufe 4 und stärkerer Hold-Jäger: 40 bis 56 % Sieg bei voller Truppe).
- Abstimmung: Gegnerstufen 2 bis 3 (Anführer 3), Flanken-Jäger bh2/bh3 greifen erst auf Radius 5 an, Hart-Jäger bh7 ist Wächter (Stufe 1), die Welle aus dem Süden (Stufe 2) bleibt in Runde 3. Nebenziele: Dörfer 200 und schnell 100 Gold (Anteil am Missionsgold im GDD-Korridor).

### Completion Notes List

- Zahlen der Gegner sind unverändert nach Vorgabe (6/7/8 + 2 Jäger von Süden).

### File List

- Neu: `content/acts/act1/maps/m1_1_steckbriefe.yaml`, `content/acts/act1/scenes/scn.m1_1.{intro,outro,tutorial_triangle,posters,house_nw,house_ne,house_w,house_e}.yaml`
- Geändert: `content/acts/act1/campaign.yaml`, `content/acts/act1/units.yaml`, `content/acts/act1/supports.yaml`, `content/world/valmora.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`
- Tests: `tests/unit/{core,camp,graph,migrations,scene,story,supports-pairs,worker-replay}.test.ts`, neu `tests/unit/node-effects.test.ts`
- Knoten-Wirkungen: `src/content/{schemas,validate}.ts`, `src/core/defs.ts`, `src/core/campaign/{apply,campaign,resultView}.ts`, `tools/{simulate,simCampaign}.ts`; Karte umbenannt von `m1_1_varnhold`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/architecture.md` (§5.4 Stand)

### Change Log

- 2026-10-25: Karte in `m1_1_steckbriefe` umbenannt, Fenn über Knoten-Wirkung, Simulation abgestimmt, Nebenziel-Belohnungen auf den GDD-Anteil gesenkt.
- 2026-10-25 (Merge main): Ort `varnhold`, Stadtrand mit `building`/`wagon`/`fence`/Ständen, Licht gedämpft, Simulation neu abgestimmt (Stufen: Schwer-Varianten `*h` der Jäger +2, Normal: bh3 4 und bh4 4 ohne Hold-Anführer, bh5 mit Stahllanze, bh2 Stufe 2). Verkettet / frisch, 50 Läufe: Leicht 98 % / 0,04 · 98 % / 0,02; Normal 78 % / 0,41 · 76 % / 0,44; Schwer 50 % / 1,33 (nur 24 von 50 Läufen erreichen 1-1 verkettet) · 46 % / 1,52. Mediane Normal 7 Runden (`s_fast` 8 erreichbar).
- 2026-10-25 (Merge main, PR #46): Normal bh4 Stufe 6 (Schwer bleibt bh4h Stufe 4), bh5 Stufe 4, `s_fast` 9 Runden (Normal-Median 9). Sim, 50 Läufe, verkettet / frisch: Leicht 100 % / 0,00 · 100 % / 0,02; Normal 90 % / 0,43 · 96 % / 0,40; Schwer 62 % / 0,69 (26 von 50 Läufen erreichen 1-1) · 36 % / 1,70. Mediane Normal 9 Runden.

## Abnahme 2026-10-27

Abgenommen (Status done). Gespielt, Fenn tritt bei. Balancing PR #72: Schwer-Welle Runde 2 statt 3, Stufen nur auf Schwer. Gesamtbefund: `acceptance-2026-10-27.md`.
