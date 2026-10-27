# Story 5.5: Heimsuchungs-Anker und Generator

Status: review

## Story

Als Spieler
möchte ich auf bekannten Karten neue, faire Aufgaben gegen bekannte Leutnants bekommen,
damit sich Wiederkehr lohnt.

## Acceptance Criteria

1. **Anker im Karten-YAML:** Optionaler Abschnitt `haunts:` (Schema in `mapSchema`, Typ `HauntAnchor` in `MapDef.haunts`), höchstens ein Anker je Variante und Karte:
   ```yaml
   haunts:
     - variant: defend              # boss | rout | defend | escort | treasure
       target: { at: [8, 6] }       # boss, rout, treasure: Feld des Leutnants · defend: Zivilist · escort: Startfeld des Zivilisten
       enemySpawn: { rect: [0, 0, 15, 2] }   # area ({ rect } | { tiles })
       deploy: { rect: [6, 13, 9, 15] }      # area, Einsatzfelder
       max: 5                       # optional, Plätze; Standard deploy.max der Karte
       turns: 8                     # Pflicht bei defend und treasure, optional bei escort
       exit: { rect: [6, 15, 8, 15] }        # nur und Pflicht bei escort
       chests: [[2, 3], [13, 4]]    # nur und Pflicht bei treasure (≥ 1)
   ```
2. **Gegner-Pools:** `content/acts/act1/haunts.yaml` (Paket act1, Schema `hauntPoolsSchema`, `GameData.hauntPools` je Akt): je Fraktion (`border_bands` = Fraktion der Akt-1-Leutnants) eine Liste `{ class, sprite, nameKey, items, share }` (Anteil in %, Summe 100; Ausrüstungs-Tier des Akts = die Items der Einträge, Akt 1 Eisen), dazu der generische Zivilist für defend/escort (`civilian: { class, sprite, portrait?, nameKey }`) und der Truhen-Inhalt für treasure (`chestLoot`: Gold bzw. Items). Startwerte [C].
3. **Balance:** `balance.yaml` Abschnitt `haunt` (strict): `perDay: { min: 1, max: 3 }`, `maxOpen: 6`, `extraEnemies: 2` (Gegner = Plätze + 2 inkl. Leutnant; leicht −1, schwer +1 wie bei Story-Karten), `goldPct: 40`, `expPct: 60`, `catchUpExpPct: 50`, `halveFromNth: 4`, `material: { min: 1, max: 2 }` (Akt-Material über `lieutenant.bounty.materialByAct`). 5.6 nutzt die Belohnungswerte.
4. **Zustand:** `CampaignState.haunts: HauntState[]` (offen, älteste zuerst) mit `{ id, day, map, variant, lt, level, enemies: HauntEnemy[], new: true }`; die Gegner (Klasse, Sprite, Name, Stufe, Items, Feld) werden beim Entstehen erzeugt und gespeichert, damit Spielen und Wiederholen deterministisch sind. `c.hauntLast: Record<mapId, variant>` (zuletzt gespielte Variante je Karte, 5.6 schreibt sie), `c.hauntsSinceStory: number` (5.6). Defaults in `newCampaign`/`normalizeCampaign`.
5. **Generator (`src/core/campaign/haunts.ts`):** Je Tagespaket `d`: `rng = seedRng(hash32(c.seed, d))` (fehlt `hash32`, in `src/core/rng.ts` ergänzen); `n = rng ∈ [perDay.min, perDay.max]`, begrenzt durch die Kandidaten. Kandidaten = abgeschlossene Story-Knoten (`kind: story`, in `c.completed`), deren Karte Anker hat und gerade nicht heimgesucht ist; je Karte eine Variante, nicht `c.hauntLast[map]` (außer es gibt nur einen Anker); Leutnant per `activeLieutenants` (nicht gewechselt), bereits getroffen (`lieutenantState(c, id).met`) und aus erreichten Akten (`def.act ≤ data.campaign.act`); derselbe Leutnant darf mehrere offene Heimsuchungen führen (Produktinhaber 2026-10-26). Gegner: Fraktion des Leutnants, Klassen nach `share`, Stufe = erwartete Armee-Stufe (der Leutnant-Eintrag trägt nur `lieutenant` und `at`; Story 5.6 baut ihn zur Spielzeit) (`expectedLevel` des nächsten verfügbaren Story-Knotens, sonst des zuletzt abgeschlossenen), Felder per RNG aus begehbaren Feldern von `enemySpawn`. Der Leutnant steht bei boss/rout/treasure auf `target`, bei defend/escort in `enemySpawn`.
6. **Tageswechsel:** `advanceDay` erzeugt die Heimsuchungen direkt aus den Paketen (Event `hauntSpawned { id, map, variant, lt }` je Heimsuchung, `dayAdvanced.haunts` = Anzahl); `c.day.pending` wird nicht mehr gefüllt. Vor der ersten Leutnant-Begegnung bleibt `c.day.last` unverändert (`null`), damit die **erste Begegnung sofort** ein Paket für den laufenden Tag bringt (Produktinhaber 2026-10-26): Die App schickt `advanceDay` beim Öffnen der Weltkarte nach der Mission wie bisher.
7. **Deckel:** Mehr als `maxOpen` offen → die älteste verfällt (`hauntExpired { id }`).
8. **content:check:** Schema, Anker-Regeln (Felder auf der Karte und begehbar, `target`/`chests` nicht in `deploy`/`enemySpawn`, Einsatzfelder ≥ Plätze, Spawn-Felder ≥ Plätze + extraEnemies + 1, Pflichtfelder je Variante) und **Erreichbarkeit**: Pfad von jedem Einsatzfeld zu `target`, jeder Truhe bzw. `exit` (bestehendes `walkable` in `validate.ts`). Pools: Klassen, Items, Sprites existieren, Anteile summieren 100, jede Fraktion eines Leutnants hat einen Pool.
9. **Anker gesetzt:** `prologue_paktnacht` und `m1_1_steckbriefe` bekommen je 2–3 Anker aus ihren Kommentaren (die Kommentar-Gründe bleiben über dem Eintrag); die übrigen Akt-1-Karten setzen die Missions-Sessions (Format in `concept/24-architecture/architecture.md` §5.6).
10. **Tests:** reproduzierbar aus Seed und Tag; 1–3 je Paket; keine Karte doppelt; nicht die zuletzt gespielte Variante; gewechselter Leutnant (`joined_grosk`) nie; > 6 → älteste verfällt; erste Begegnung → sofort Paket; Uhr rückwärts erzeugt nichts; content:check meldet unerreichbares Ziel.

## Tasks / Subtasks

- [x] T1 Schema + Typen: `HauntAnchor` in `mapSchema`/`MapDef`, `hauntPoolsSchema` + Loader (`acts/<act>/haunts.yaml`), `balance.haunt` (AC 1–3)
- [x] T2 Zustand + Defaults + Events `hauntSpawned`/`hauntExpired` (AC 4)
- [x] T3 Generator `haunts.ts`, `hash32`, Anbindung in `advanceDay`, Verhalten vor erster Begegnung (AC 5–7)
- [x] T4 content:check (AC 8)
- [x] T5 Anker auf Prolog und 1-1, `haunts.yaml` mit Pool `border_bands` und Zivilist (AC 2, 9)
- [x] T6 Tests (AC 10), Test aus 5.4 „last rückt trotzdem vor“ an die neue Regel anpassen
- [x] T7 Architektur §5.6 (Anker-Format) und `concept/24-architecture/decision-log.md` nachziehen; alle Checks grün

## Dev Notes

- Architektur §5.6 (AR6, AR7), GDD „Welt und Erkundung“ und Missionszustände. Kern bleibt deterministisch: kein `Math.random`, kein `Date.now`.
- Entscheidungen Produktinhaber 2026-10-26: defend/escort mit generischem Zivilisten (alle 5 Varianten); Gegner = Plätze + 2 inkl. Leutnant [C]; Material 1–2 Akt-Material; erste Heimsuchungen sofort nach der ersten Begegnung; Heimsuchungen erscheinen am Weltkarten-Ort ihrer Story-Karte (5.6).
- Heimsuchungen sind keine Kampagnen-Knoten; sie liegen nur in `c.haunts`. Spielen, Belohnung und Weltkarte folgen in 5.6.
- Save: neue Felder nur mit Default in `normalizeCampaign` (vor dem MVP-Release keine Migration nötig, `released-ids.json` gibt es noch nicht).
- Die Karten 1-2 … 1-8 gehören den Missions-Sessions; dort nichts eintragen.

### References

- [Source: concept/26-epics/epics.md#Story 5.5]
- [Source: concept/24-architecture/architecture.md#5.6 Tageswechsel und Heimsuchungen]
- [Source: concept/21-gdd/gdd.md#Welt und Erkundung]
- Notiz `haunt-anchors-5-5.md` im Notizordner der Sessions

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm content:check`, `pnpm build` grün; `pnpm test` grün (856 Tests). Bei voller Parallelität (70 Worker) laufen einzelne langsame Tests mit `loadContentFromDisk` gelegentlich in das 5-s-Zeitlimit (wechselnde Dateien, einzeln grün); mit `--maxWorkers=8` alles grün.

### Completion Notes List

- **Schema/Typen (T1):** `HauntAnchor`/`HauntVariant`/`HauntPoolsDef` in `defs.ts`, `hauntAnchorSchema` (Pflichtfelder je Variante per `superRefine`: `turns` bei defend/treasure Pflicht, bei escort optional, sonst verboten; `exit` nur escort; `chests` nur treasure) und `hauntPoolsSchema` in `schemas.ts`, `mapSchema.haunts`, `balance.haunt` (strict) mit den Startwerten aus AC 3; Loader liest `acts/<act>/haunts.yaml` (Paket act1 über `acts/act1/**`) nach `GameData.hauntPools[act]`, auch in `mergePackContent`.
- **Zustand (T2):** `CampaignState.haunts/hauntLast/hauntsSinceStory` mit Defaults in `newCampaign`/`normalizeCampaign`; `HauntState`/`HauntEnemy` in `state.ts`; Ereignisse `hauntSpawned`, `hauntExpired`.
- **Generator (T3):** `src/core/campaign/haunts.ts` (`spawnHaunts`, `hauntEnemyCount`, `standableTiles`, `hauntLevel`), `hash32` in `rng.ts`. `advanceDay` ändert vor der ersten Begegnung nichts (`last` bleibt `null`, kein Ereignis); `c.day.pending` wird nicht mehr gefüllt. `advanceToToday` (`flow.ts`) sendet davor nichts.
- **content:check (T4):** `validateHaunts` (je Karte) und `validateHauntPools` in `validate.ts`, Erreichbarkeit mit dem vorhandenen `walkable`. Zusätzlich: Einsatz- und Spawn-Bereich dürfen sich nicht überlappen, Ziel/Truhen müssen Standfelder ohne Kartenobjekt sein, bei escort muss der Zivilist den Ausgang erreichen.
- **Inhalte (T5):** `content/acts/act1/haunts.yaml` (Pool `border_bands`: Axt 40, Schwert 20, Lanze 20, Bogen 20 %; Zivilist Klasse `healer` ohne Sprite wie der Dorfälteste in 1-2; Truhen-Inhalt Gold/Heiltrank), Name `unit.civilian.name` (de/en). Anker: Prolog rout `[5,8]`, boss `[5,13]` (statt Säule `[4,13]`), defend `[5,1]`; 1-1 defend `[7,5]` (statt Brunnen `[7,6]`), boss `[6,1]`, escort `[6,13]` → Ausgang `[5..8,0]`.
- **Tests (T6):** `tests/unit/haunts.test.ts` (20 Fälle zu AC 10), `tests/unit/day.test.ts` an die neue Regel angepasst.
- **Doku (T7):** Architektur §5.6 und `decision-log.md` (2026-10-26).
- **Entscheidungen Produktinhaber 2026-10-26:** Nur bereits getroffene Leutnants (`met`) führen Heimsuchungen (dazu nicht gewechselt, Akt erreicht); derselbe Leutnant darf mehrere offene Heimsuchungen führen. Der Leutnant-Eintrag in `enemies` ist nur `{ lieutenant, at }` (kein eingefrorener Level oder Kit, `HauntEnemy`-Felder sind optional): **Story 5.6 baut ihn zur Spielzeit** über denselben Weg wie `createBattle` (`planLieutenants`/`lieutenantUnit`), damit Groll und Klassen-Kit (z. B. Wolfsreiter Ulvric) stimmen.
- **Weitere Annahmen:** (1) Pool-Akt = Akt des Leutnants. (2) `civilian.sprite` ist optional (kein Zivilisten-Modell vorhanden). (3) `turns` bei boss/rout im Schema verboten. (4) `advanceDay` meldet vor der ersten Begegnung kein Ereignis.

### File List

- `src/core/rng.ts`, `src/core/defs.ts`, `src/core/state.ts`, `src/core/index.ts`
- `src/core/campaign/haunts.ts` (neu), `day.ts`, `campaign.ts`, `commands.ts`
- `src/content/schemas.ts`, `load.ts`, `validate.ts`
- `src/app/state/flow.ts`
- `content/core/balance.yaml`, `content/core/locales/de.names.yaml`, `en.names.yaml`
- `content/acts/act1/haunts.yaml` (neu), `content/acts/act1/maps/prologue_paktnacht.yaml`, `m1_1_steckbriefe.yaml`
- `tests/unit/haunts.test.ts` (neu), `tests/unit/day.test.ts`
- `concept/24-architecture/architecture.md`, `concept/24-architecture/decision-log.md`
