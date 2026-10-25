# Story 9.1: Prolog „Die Paktnacht“

Status: in-progress

## Story

Als Spieler
möchte ich in der Paktnacht ankommen, die Truppe kennenlernen und Gerrit verlieren,
damit ich weiß, worum es geht, bevor ich die Regeln kenne.

## Acceptance Criteria

1. **Karte:** `prologue_paktnacht` (12 × 16, Nacht, äußerer Ring des Glutdoms in Aurenhall) ersetzt `prologue_caravan`; Ziel `escape` (alle vier, Kael als Letzter), keine Leutnants, nur Nahkampf-Tempelwachen (Leicht 4, Normal 5, Schwer 6 plus eine angekündigte Verstärkung aus dem Seitentor in Runde 3). Knoten-Id bleibt `prologue`, Paket `core`.
2. **Szenen:** `scn.prologue.intro` (Schlüsselgespräch 1 „Die Wache am Ring“, danach die Tafel „Die Paktnacht: Alarm im Glutdom“, Wahl `c01` mit den Flags `avatar_honest`/`avatar_proud` bleibt) und `scn.prologue.outro` (Schlüsselgespräch 2 „Gerrits Grab“, Tafel „Gerrits Grab“). Gerrit spricht nur in den Szenen und fällt auf der Flucht (erzählt in der Nachszene).
3. **Beitritte:** Rhen, Kael, Brenna, Tobin (`joins: prologue`, unverändert).
4. **Lektionen:** höchstens eine je Runde, höchstens drei Zeilen: Bewegung + Kampfvorschau + Ziel (Runde 1, `scn.prologue.tutorial_move`), Gefahrenzone + Deckung (Runde 2), Heiltrank (Kael < 60 %).
5. **Nebenziele:** `no_downs` (Belohnung Heiltrank), `turn_limit` (Startwert 7 Runden, 200 Gold; die Steuerung stimmt ab). `goldReward` 300.
6. **Prüfungen:** `pnpm content:check`, `pnpm lint`, `pnpm test`, `pnpm build` grün; `pnpm sim prologue --runs 50` liegt im Korridor (siehe Dev Agent Record, abhängig von der Fluchtregel im Kern).

## Tasks / Subtasks

- [x] T1 Karte `prologue_paktnacht.yaml` (AC 1, 4, 5); alte Karte und Grosk-Zitat (`scn.prologue.grosk_battle`) gelöscht
- [x] T2 Neues Gelände `stall` (Requisite `tent`), `brazier` (Requisite `campfire`), `well` (Requisite `rock`) in `terrain.yaml`, Namen DE/EN (AC 1)
- [x] T3 Szenen `intro`/`outro` neu, Lektionen angepasst, Englisch in `content/locales/en/act1.dialogue.yaml` (AC 2, 4)
- [x] T4 Sprecher Gerrit (`unit.gerrit.name`), Tempelwache (`unit.temple_guard.name`), Karten- und Knotentitel DE/EN (AC 1, 2)
- [x] T5 Verweise nachgezogen: `tools/simulate.ts`, `tests/perf/benchMap.ts`, `.github/workflows/ci.yml`, Tests (siehe File List), Spielstand-Fixtures neu erzeugt
- [x] T6 Heimsuchungs-Anker als Kommentarblock (3 Felder, Story 5.5 hat noch kein Schema)
- [ ] T7 Offene Punkte der Steuerung klären (siehe Dev Notes „OFFEN“), Sim-Korridor nach der Fluchtregel im Kern abstimmen (AC 6)
- [ ] T8 Screenshots der Karte und der Szenen (Hintergründe `bg_glutdom_night`, `bg_gerrit_grave` kommen mit Story 8.7)

## Dev Notes

- **Quellen:** Epics 9.1; Narrative „Story Beats“ 1–2, „Key Conversations“ 1 und 2, „Dialogue Style“ (Stimmen), „Missionsfolge“ (P ★); `concept/06-maps-missions.md` §10 (Lektionsregeln); Art Direction §2.4/2.5 (Nacht: Mondlicht blau, Punktlichter), §3.1 (Gelände), §5.2; Architektur §5.8 (Szenen), `content/acts/act1/campaign.yaml`.
- **Entscheidungen des Produktinhabers (bindend, 2026-10-25):**
  - Der neue Prolog **ersetzt** `prologue_caravan` samt Grosk-Zitat und Karawanentexten; Wahl `c01` und ihre Flags bleiben.
  - Schauplatz: Nacht des Paktfestes, äußerer Ring des Glutdoms; Gerrit (alter Bannerträger, nicht spielbar) steht nur in den Szenen, nicht auf der Karte.
  - Karte 12 × 16, Nord nach Süd: Glutdom-Mauer mit geschlossener Tür oben (Aufstellung davor, 4 Plätze, Avatar + Kael erzwungen), Hof mit Säulen (einzelne `wall`-Felder) und Kohlebecken (`brazier`, Punktlichter), Straße in der Mitte, Gärten links und rechts (Gras/Wald als Deckung), Seitentore in den Mauern (Zugänge der Verstärkung), unten das Tempeltor als Ausgang (4 Felder).
  - Ziel `escape` mit `min: 4`, Kael als Letzter (Regel läuft parallel im Kern: `mustStayForRest`). Niederlage: Rhen oder Kael fällt.
  - Gegner: Tempelwachen, nur Nahkampf (Lanzen-Vorkämpfer + Schwert-Plänkler), Stufe 1–2, `nameKey unit.temple_guard.name`. Das Waffendreieck ist noch aus (`mechanics`).
  - Platzhalter-Figuren bis Story 8.3: Sprite `soldier` (Lanze) und `mercenary` (Schwert).
  - Hintergründe: `bg_glutdom_night` (Tafel „Alarm im Glutdom“), `bg_gerrit_grave` (Lagerfeuer am Grab). Szenen-Hintergründe prüft `content:check` nicht, die Bilder liefert die Art-Session (Story 8.7). Das Ortsbild des Knotens (`place`) wird geprüft und nutzt bis dahin `backgrounds/bg_camp_night`.
- **Szenen kennen nur einen Hintergrund** (`background`). Die Tafel „Alarm im Glutdom“ liegt darum im selben Hintergrund wie das ganze Gespräch davor. Ein Wechsel mitten in der Szene bräuchte ein Schema.
- **Nicht-Gefährte als Sprecher:** Gerrit gilt als Sprecher durch den Schlüssel `unit.gerrit.name` (validate.ts: Figur oder Schlüssel); seine Zeilen haben `fallback: skip`. Sein Halbbild kommt aus `art/mockups/characters-s1/gerrit.png` (`build_halves` baut jedes Bild dort, kein Eintrag nötig); fehlt es, zeigt die Szene keine Figur.
- **Gelände:** `stall`, `brazier`, `well` sind unpassierbar außer für Flieger (Werte wie `wagon`), Startwerte [C]. `well` zeigt bis zu einem Brunnenmodell den Felsblock (`prop: rock`).
- **Heimsuchungs-Anker:** `[5,8]`, `[4,13]`, `[5,1]` als Kommentar in der Karte (Story 5.5, noch ohne Schema).
- **OFFEN:**
  1. `min: 4` macht die Karte unlösbar, sobald eine der vier Einheiten fällt (Niederlage gilt nur für Rhen und Kael): die Schlacht liefe ohne Ende weiter, im Sim als Zeitüberschreitung sichtbar. Ohne `min` müssten alle Überlebenden hinaus.
  2. Nebenziel `turn_limit` (7 Runden, 200 Gold) und Korridore: Steuerung stimmt per Simulation ab, sobald die Fluchtregel im Kern landet.
  3. Szenen-Hintergrundwechsel (siehe oben).
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

- `pnpm sim prologue --runs 50` (verkettet, Standard-Tod), Stand mit der Fluchtregel in der Arbeitskopie (`mustStayForRest`): Leicht 100 % / 0,00 Niedergestreckte; Normal 98 % / 0,02 (Korridor 0,4–1,3: zu leicht); Schwer 22 % / 1,10 (Korridor 30–70 %: zu schwer, 19 von 50 Läufen enden als Zeitüberschreitung, weil nach einem Tod `min: 4` nicht mehr erreichbar ist). Die Zahlen ändern sich, sobald die Fluchtregel und der Sim-Spieler fertig sind.

### Completion Notes List

- Verstärkung (Schwer) ist ein Stufe-1-Schwert-Plänkler am Osttor (11,8); ein Lanzenträger dort ließ Schwer bei 4 % Sieg, ohne die Verstärkung lag Schwer bei 48 %.
- Die Spielstand-Fixtures `tests/fixtures/saves/format{1,2}-auto.json` wurden mit `tests/fixtures/saves/generate.ts` neu erzeugt (der alte Kampf lief auf der gelöschten Karte); nach der Fluchtregel im Kern noch einmal erzeugen.

### File List

- Neu: `content/acts/act1/maps/prologue_paktnacht.yaml`
- Gelöscht: `content/acts/act1/maps/prologue_caravan.yaml`, `content/acts/act1/scenes/scn.prologue.grosk_battle.yaml`
- Geändert: `content/acts/act1/scenes/scn.prologue.{intro,outro,tutorial_move,tutorial_danger}.yaml`, `content/acts/act1/campaign.yaml`, `content/core/terrain.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`
- `tools/simulate.ts`, `tests/perf/benchMap.ts`, `.github/workflows/ci.yml`
- Tests: `tests/unit/{core,camp,graph,migrations,packs,scene,story,supports-pairs,worker-replay}.test.ts`, `tests/fixtures/saves/format{1,2}-auto.json`
- Doku: `concept/22-narrative/decision-log.md`
