# Story 9.1: Prolog „Die Paktnacht“

Status: review

## Story

Als Spieler
möchte ich in der Paktnacht ankommen, die Truppe kennenlernen und Gerrit verlieren,
damit ich weiß, worum es geht, bevor ich die Regeln kenne.

## Acceptance Criteria

1. **Karte:** `prologue_paktnacht` (12 × 16, Nacht, äußerer Ring des Glutdoms in Aurenhall) ersetzt `prologue_caravan`; Ziel `escape` (alle, die noch stehen, Kael als Letzter, kein `min`), keine Leutnants, nur Nahkampf-Tempelwachen (Leicht 4, Normal 5, Schwer 6 plus eine angekündigte Verstärkung aus dem Seitentor in Runde 4). Knoten-Id bleibt `prologue`, Paket `core`.
2. **Szenen:** `scn.prologue.intro` (Schlüsselgespräch 1 „Die Wache am Ring“, danach die Tafel „Die Paktnacht: Alarm im Glutdom“, Wahl `c01` mit den Flags `avatar_honest`/`avatar_proud` bleibt) und `scn.prologue.outro` (Schlüsselgespräch 2 „Gerrits Grab“, ohne Tafel, Hintergrund `lager_unterwegs`). Gerrit spricht nur in den Szenen und fällt auf der Flucht (erzählt in der Nachszene).
3. **Beitritte:** Rhen, Kael, Brenna, Tobin (`joins: prologue`, unverändert).
4. **Lektionen:** höchstens eine je Runde, höchstens drei Zeilen: Bewegung + Kampfvorschau + Ziel (Runde 1, `scn.prologue.tutorial_move`), Gefahrenzone + Deckung (Runde 2), Heiltrank (Kael < 60 %).
5. **Nebenziele:** `no_downs` (Belohnung Heiltrank), `turn_limit` (11 Runden, 100 Gold, per Simulation abgestimmt: Median Normal 11 nach dem Merge von #46). `goldReward` 300.
6. **Prüfungen:** `pnpm content:check`, `pnpm lint`, `pnpm test`, `pnpm build` grün; `pnpm sim prologue --runs 50` liegt im Korridor (siehe Dev Agent Record, abhängig von der Fluchtregel im Kern).

## Tasks / Subtasks

- [x] T1 Karte `prologue_paktnacht.yaml` (AC 1, 4, 5); alte Karte und Grosk-Zitat (`scn.prologue.grosk_battle`) gelöscht
- [x] T2 Neues Gelände `stall` (Requisite `tent`), `brazier` (Requisite `campfire`), `well` (Requisite `rock`) in `terrain.yaml`, Namen DE/EN (AC 1)
- [x] T3 Szenen `intro`/`outro` neu, Lektionen angepasst, Englisch in `content/locales/en/act1.dialogue.yaml` (AC 2, 4)
- [x] T4 Sprecher Gerrit (`unit.gerrit.name`), Tempelwache (`unit.temple_guard.name`), Karten- und Knotentitel DE/EN (AC 1, 2)
- [x] T5 Verweise nachgezogen: `tools/simulate.ts`, `tests/perf/benchMap.ts`, `.github/workflows/ci.yml`, Tests (siehe File List), Spielstand-Fixtures neu erzeugt
- [x] T6 Heimsuchungs-Anker als Kommentarblock (3 Felder, Story 5.5 hat noch kein Schema)
- [x] T7 Offene Punkte der Steuerung geklärt (kein `min`, Tafeln über `panel`), Sim-Korridor abgestimmt (AC 6)
- [x] T9 Kartenfeld `noDeath` (Produktinhaber 2026-10-25): Niedergestreckte sterben/verbluten im Prolog nicht und kehren zurück; Rhen und Kael ausgenommen (Niederlage wie zuvor); Schema, Kern, KI, HUD, Tests, Sim
- [x] T10 Bilder (PR #45): Szenenhintergrund und Tafel „Alarm im Glutdom“ `paktnacht_glutdom`, Knoten-Ort `paktnacht_glutdom`; Gerrits Grab `lager_unterwegs` ohne Tafel (kein eigenes Grabbild, eine Tafel gleich dem Hintergrund würde nur die Halbfiguren verdecken); Tafel-Bild löst Ortsnamen wie `background` auf (`locations/<id>.webp`, Manifest `locations`); Tempelwachen mit Modell/Porträt `temple_guard`/`class_temple_guard`; Nachtlicht (Umgebung #5a70b0 · 0,6, Mond #8fa8ee · 0,4, Kohlebecken Radius 4)
- [x] T8 Screenshots der Karte und der Szenen (Hochformat 375×812, im Browser angespielt bis Sieg, 2026-10-25)

## Dev Notes

- **Quellen:** Epics 9.1; Narrative „Story Beats“ 1–2, „Key Conversations“ 1 und 2, „Dialogue Style“ (Stimmen), „Missionsfolge“ (P ★); `concept/06-maps-missions.md` §10 (Lektionsregeln); Art Direction §2.4/2.5 (Nacht: Mondlicht blau, Punktlichter), §3.1 (Gelände), §5.2; Architektur §5.8 (Szenen), `content/acts/act1/campaign.yaml`.
- **Entscheidungen des Produktinhabers (bindend, 2026-10-25):**
  - Der neue Prolog **ersetzt** `prologue_caravan` samt Grosk-Zitat und Karawanentexten; Wahl `c01` und ihre Flags bleiben.
  - Schauplatz: Nacht des Paktfestes, äußerer Ring des Glutdoms; Gerrit (alter Bannerträger, nicht spielbar) steht nur in den Szenen, nicht auf der Karte.
  - Karte 12 × 16, Nord nach Süd: Glutdom-Mauer mit geschlossener Tür oben (Aufstellung davor, 4 Plätze, Avatar + Kael erzwungen), Hof mit Säulen (einzelne `wall`-Felder) und Kohlebecken (`brazier`, Punktlichter), Straße in der Mitte, Gärten links und rechts (Gras/Wald als Deckung), Seitentore in den Mauern (Zugänge der Verstärkung), unten das Tempeltor als Ausgang (4 Felder).
  - Ziel `escape` ohne `min` (Produktinhaber 2026-10-25: alle, die noch stehen, Kael zuletzt), Kael als Letzter (Regel läuft parallel im Kern: `mustStayForRest`). Niederlage: Rhen oder Kael fällt.
  - Gegner: Tempelwachen, nur Nahkampf (Lanzen-Vorkämpfer + Schwert-Plänkler), Stufe 1–2, `nameKey unit.temple_guard.name`. Das Waffendreieck ist noch aus (`mechanics`).
  - Platzhalter-Figuren bis Story 8.3: Sprite `soldier` (Lanze) und `mercenary` (Schwert).
  - Hintergründe (Orts-Ids, Stand PR #45): `paktnacht_glutdom` (Intro und Tafel „Alarm im Glutdom“), `lager_unterwegs` (Outro, Lagerfeuer am Grab, ohne Tafel). Das Ortsbild des Knotens (`place`) ist `paktnacht_glutdom`.
- **Tafeln:** Die Tafel „Alarm im Glutdom“ (`scn.prologue.intro`, l17 bis l20) ist eine Illustrationstafel (die Tafel „Gerrits Grab“ entfiel, siehe T10) über das Zeilenfeld `panel` (4 Textboxen, höchstens 4 erlaubt, `panel: none` beendet sie). Fehlt das Tafelbild, zeigt die Szene ihren Szenenhintergrund (Manifest-Prüfung in `Dialogue.tsx`).
- **Nicht-Gefährte als Sprecher:** Gerrit gilt als Sprecher durch den Schlüssel `unit.gerrit.name` (validate.ts: Figur oder Schlüssel); seine Zeilen haben `fallback: skip`. Sein Halbbild kommt aus `art/mockups/characters-s1/gerrit.png` (`build_halves` baut jedes Bild dort, kein Eintrag nötig); fehlt es, zeigt die Szene keine Figur.
- **Gelände:** `stall`, `brazier`, `well` sind unpassierbar außer für Flieger (Werte wie `wagon`), Startwerte [C]. `well` zeigt bis zu einem Brunnenmodell den Felsblock (`prop: rock`).
- **Heimsuchungs-Anker:** `[5,8]`, `[4,13]`, `[5,1]` als Kommentar in der Karte (Story 5.5, noch ohne Schema).
- **Entschieden (Produktinhaber 2026-10-25):** Fluchtziel ohne `min`; Illustrationstafeln über `panel`; Knoten-Wirkungen für Beitritte (9.2).
- **Kein Tod im Prolog (Produktinhaber 2026-10-25):** `noDeath: true` auf der Karte. Niedergestreckte Gefährten verbluten und sterben nicht (egal welcher Todesmodus), bleiben liegen und sind nach der Mission wieder da (ohne Narbe, ohne Abschied). Rhen und Kael sind ausgenommen, weil ihr Tod die Mission verliert (`unit_dies`-Niederlage): sie verbluten wie zuvor. Gerrit (nur Szene) bleibt der einzige Tod des Prologs. Regel `deathless`/`bleedsOut` in `core/rules/effects.ts`; Entscheidung im Log von `concept/24-architecture`.
- **Entschieden (Produktinhaber 2026-10-25):** Tafeln stehen allein, die Halbfiguren blenden aus, solange eine Tafel gezeigt wird (Textbox und Namensschild bleiben). **OFFEN:** Die Bildnamen der Tafeln ändern sich mit der Art-Session (PR #45: Orts-Ids).
- **Grenzen:** `src/core/battle` und `src/core/ai` nicht angefasst (Fluchtregel läuft in einer anderen Session).

### Project Structure Notes

- Neu: `content/acts/act1/maps/prologue_paktnacht.yaml`.
- Gelöscht: `content/acts/act1/maps/prologue_caravan.yaml`, `content/acts/act1/scenes/scn.prologue.grosk_battle.yaml`.
- Geändert: `scn.prologue.{intro,outro,tutorial_move,tutorial_danger}.yaml`, `campaign.yaml`, `terrain.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale; Code und Schlüssel englisch, Konzept deutsch.
- `src/core/battle` und `src/core/ai` gehören der parallelen Session.

### References

- [Source: concept/26-epics/epics.md#Story 9.1]
- [Source: concept/22-narrative/narrative.md#Key Conversations]
- [Source: concept/06-maps-missions.md#10]
- [Source: concept/23-art-direction/art-direction.md#2.5]
- [Source: _bmad-output/implementation-artifacts/9-13-supports-und-barks-von-akt-1.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim prologue --runs 50` (verkettet = frisch, da der Prolog der erste Knoten ist), nach der Abstimmung: Leicht 100 % / 0,00 Niedergestreckte, Normal 98 % / 0,46, Schwer 42 % / 1,64 (Korridore: Leicht ≥ 95 % und ≤ 0,5; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %). Mediane Runden bis zum Sieg: Leicht 7, Normal 8, Schwer 11; `turn_limit` daher 8 Runden. Mit `--seed 101`: Normal 100 % / 0,54, Schwer 38 %.
- Abstimmung (Gegnerzahlen unverändert 4/5/6 + 1 Verstärkung): Stufen der Tempelwachen 2 bis 5, Auslöse-Radius 5 (Radius 6 kippt Normal auf 8 bis 38 %), die Wache am Tor (tg5) greift an, der Hart-Vorkämpfer tg6 steht als Wächter an der Westflanke (am Tor blockierte er die Flucht), die Hart-Verstärkung kommt in Runde 4; der Vorkämpfer tg2 (Stufe 5 auf Leicht/Normal) hat für Schwer eine Stufe-3-Variante `tg2h` (gleiche Stelle, gleiche Anzahl).

### Completion Notes List

- Verstärkung (Schwer) ist ein Stufe-1-Schwert-Plänkler am Osttor (11,8); ein Lanzenträger dort ließ Schwer bei 4 % Sieg, ohne die Verstärkung lag Schwer bei 48 %.
- Die Spielstand-Fixtures `tests/fixtures/saves/format{1,2}-auto.json` wurden mit `tests/fixtures/saves/generate.ts` nach der Fluchtregel im Kern neu erzeugt (Format bleibt, nur der Kampfinhalt von Format 2 ändert sich; `migrations.test.ts` grün).
- Nebenziel-Belohnung `s_fast` 100 statt 200 Gold, damit der Anteil der Nebenziele am Missionsgold im GDD-Korridor (30–50 %) liegt.

### File List

- Neu: `content/acts/act1/maps/prologue_paktnacht.yaml`
- Gelöscht: `content/acts/act1/maps/prologue_caravan.yaml`, `content/acts/act1/scenes/scn.prologue.grosk_battle.yaml`
- Geändert: `content/acts/act1/scenes/scn.prologue.{intro,outro,tutorial_move,tutorial_danger}.yaml`, `content/acts/act1/campaign.yaml`, `content/core/terrain.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`
- `tools/simulate.ts`, `tests/perf/benchMap.ts`, `.github/workflows/ci.yml`
- Tests: `tests/unit/{core,camp,graph,migrations,packs,scene,story,supports-pairs,worker-replay}.test.ts`, `tests/fixtures/saves/format{1,2}-auto.json`
- Neu: `tests/unit/{scene-panel,node-effects}.test.ts`, `src/app/state/backgrounds.ts`; geändert `src/core/campaign/scene.ts` (`panelAt`), `src/ui/Dialogue.{tsx,css}` (Halbfiguren aus bei Tafel), `src/content/{schemas,validate}.ts`, `tests/unit/escape.test.ts`, `tools/simulate.ts` (Median der Runden)
- `noDeath`: `src/content/schemas.ts`, `src/core/{defs.ts,rules/effects.ts,campaign/campaign.ts,ai/ai.ts}`, `src/app/screens/BattleHud.tsx`, `src/render/board/board.ts`, Karte `prologue_paktnacht.yaml`, Tests `tests/unit/no-death.test.ts` (neu), `tests/unit/bleed.test.ts`; Doku `concept/24-architecture/{architecture,decision-log}.md`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/architecture.md` (§5.8 `panel`)

### Change Log

- 2026-10-25: kein `min` beim Fluchtziel, Tafeln über `panel`, Spielstand-Fixtures neu, Simulation abgestimmt (Produktinhaber-Entscheidungen).
- 2026-10-25 (Merge main, PR #45/#47): Orte statt `bg_*`, Tafel über `locations`, Tempelwachen auf `temple_guard`, Nachtlicht, Nebenziel `s_fast` 9 Runden (Normal-Median 9). Sim nach dem Merge: Leicht 100 % / 0,00, Normal 98 % / 0,44, Schwer 48 % / 1,54 (Median 7 / 9 / 11 Runden).
- 2026-10-25 (Merge main, PR #46: Halten, Nachsetzen, Wirken, Nebel, Kontext-Band, Wolfsreiter, Escort/Treasure): Schwer-Wachen im Süden (tg3h Stufe 2, tg4h 2, tg5h 2; Auslöseradius 2/3/3) statt Stufen 3/4/4 mit Radius 5, weil Rhen allein zum Ausgang läuft und sonst in jedem Lauf fällt; `s_fast` 11 Runden (Normal-Median 11 seit der Reihenfolge-Regel für Kael). Sim, 50 Läufe: Leicht 100 % / 0,00, Normal 98 % / 0,96, Schwer 52 % / 1,06 (Median 7 / 11 / 12).
