# Story 10.5: Verzauberer und Werkstatt

Status: ready-for-dev

## Story

Als Spieler
möchte ich Runen bearbeiten und Verbrauchsgüter aus Material herstellen,
damit Material aus Heimsuchungen einen Zweck hat.

## Acceptance Criteria

1. **Verzauberer-Stufen (GDD „Rune I → II → III“):**
   **Angenommen** der Verzauberer der Burg (Akt 2, Raum `enchanter` aus Story 6.9) auf Stufe n
   **Wenn** der Spieler eine Rune einsetzt oder Runen verschmilzt
   **Dann** sind nur Runen bis Stufe n erlaubt (Grenze aus `balance.yaml`, z. B. `economy.enchanterMaxRuneTier: [1, 2, 3]`, gelesen über `roomLevel(c, 'enchanter')`): Einsetzen einer höheren Rune → Fehler `max_level` mit Grund „ab Verzauberer Stufe n“; Verschmelzen zur Stufe N+1 nur, wenn N+1 ≤ n. Ausbauen geht immer. (Lesart siehe Offene Frage 1.)
2. **Verschmelzen mit Kosten laut GDD:** 3 × Rune Stufe N + 200 × N Gold → 1 Rune Stufe N+1 (`balance.economy.runeMerge { count: 3, goldPerTier: 200 }`, existiert), Kaufpreis Rune I 400 (`runes.yaml` `price`, existiert); die Taste nennt den Betrag als ● + Zahl, nicht nur „Verschmelzen“.
3. **Raum Werkstatt:** `rooms.yaml` `{ id: workshop, function: workshop, fromAct: 2, homes: [castle], levels: … }`, Icon, Texte, Raumstein mit Punkten, Anker (solange Bild).
4. **Rezepte als Content:**
   **Angenommen** `content/core/recipes.yaml` (Schema in `schemas.ts`, Typ `RecipeDef`, Prüfung in `content:check`: Item existiert, Material existiert und hat ein Bild, Raumstufe 1–3)
   **Dann** gibt es je Werkstatt-Stufe die Rezepte laut GDD: Stufe 1 Feuerbombe (`fire_bomb`), Schlüssel (`door_key`); Stufe 2 Hast (`haste_scroll`), verstärktes Gegengift; Stufe 3 Fallen-Set (`trap_kit`), Rune I. Mengen und Kosten: **[PO-Frage]** (Werkstatt-Rezepte in Material fehlen im GDD).
5. **Command `craft`:**
   **Angenommen** ein Rezept, dessen Stufe die Werkstatt erreicht, genug Material (und ggf. Gold) und Platz im Konvoi (`convoySize`)
   **Wenn** der Spieler `{ type: 'craft', recipe }` schickt
   **Dann** sinken Material/Gold, das Item liegt im Konvoi (`newItem`), Events `materialChanged`, `goldChanged`, `itemGained`.
   **Und** Fehler ohne Änderung: `unknown_item` (Rezept unbekannt), `room_locked` (Stufe zu niedrig, Werkstatt nicht offen), `not_enough_materials`, `not_enough_gold`, `convoy_full`.
6. **Werkstatt-Panel:** Liste der Rezepte mit Item-Bild, Name, Info-Stein (`ItemInfoButton`), Kosten als Material-Bild + Zahl bzw. ● + Zahl (fehlende Menge rot), Bestand im Konvoi; Rezepte höherer Stufen gedimmt mit „ab Stufe n“; Rezept wählen (1), „Herstellen · …“ (2). Gleiches Listen-Muster wie Händler (EXPERIENCE Z. 45).
7. **Neue Items:** `trap_kit` (Fallen-Set) und das verstärkte Gegengift existieren in `items.yaml` mit Namen, Beschreibung, Bild unter `art/items/` (ChatGPT, Prompt + Abnahme in `art/prompts/<id>.md`, Lizenzauflagen `licensing.md` §6) und Wirkung (Offene Fragen 3, 4); ohne Bild scheitert `content:check` (Material-/Item-Bild-Regel).

## Tasks / Subtasks

- [ ] T1 Verzauberer (AC 1, 2): `balance.yaml` Stufen-Grenze; `validateCampaign` `insertRune`/`mergeRunes` (`apply.ts` Z. ~95/111) prüfen die Grenze über eine Funktion `runeTierLimit(data, c)` in `camp.ts`; `EnchanterRoom` (`Rooms.tsx` Z. ~527) zeigt Grenze, Kosten auf der Verschmelzen-Taste (`runeMerge().gold`) und Grund
- [ ] T2 Schema (AC 3, 4): Raumfunktion `workshop` (kommt mit Story 10.1 T0), `recipeSchema` (`{ id, item, roomLevel, materials: Record<string, number>, gold? }`), Laden in `src/content/load.ts`, `GameData.recipes`, Prüfungen in `src/content/validate.ts`
- [ ] T3 Daten (AC 3, 4, 7): `rooms.yaml` `workshop`; `recipes.yaml` nach [PO-Frage] (bis dahin nur Struktur mit Kommentar `# [PO] Mengen offen`, keine erfundenen Zahlen im Release); `items.yaml` `trap_kit`, verstärktes Gegengift; Locales `de/en.names.yaml`, `de/en.items.yaml`
- [ ] T4 Kern (AC 5): `craft` in `commands.ts`/`apply.ts` nach Muster §8.1, Vorschau `craftCost(data, c, recipe)` für UI und Command
- [ ] T5 UI (AC 6): `WorkshopRoom` (in `Rooms.tsx` oder eigene Datei mit eigener CSS, falls `Rooms.tsx` zu groß wird), `Room`-Dispatch, Icon `workshop`, Schlüssel `ui.workshop.*`
- [ ] T6 Bilder (AC 7): `art/prompts/trap_kit.md`, `art/prompts/<antidote_id>.md`, Bilder per ChatGPT über Claude in Chrome, `pnpm art:build` (vorher `git lfs pull`)
- [ ] T7 Handbuch: Einträge `runes` (Stufen-Grenze als Verweis) und neu `workshop`; Item-Einträge, falls Story 14.6 Items einzeln führt
- [ ] T8 Simulation: Heimat-Heuristik in `tools/simulate.ts` stellt Feuerbomben her, wenn Material übrig ist (prüft die Materialkurve)
- [ ] T9 Tests: Grenze je Verzauberer-Stufe (Einsetzen, Verschmelzen), `craft` gültig und jeder Fehlercode, Determinismus, Replay, `content:check` (Rezept auf fehlendes Item/Material)

## Dev Notes

### Heutiger Stand (nicht brechen)

- Raum `enchanter`: `fromAct: 2`, `homes: [castle]`, `levels` nur mit `{ act: 2 }` (Story 6.9). Das Panel `EnchanterRoom` funktioniert: Einsetzen (`insertRune`), Ausbauen (`removeRune`), Verschmelzen (`mergeRunes`, Taste ohne Betrag), Kaufen von Runen Stufe 1 und Hilfs-Runen (`buy`, `buyPrice` erlaubt `runes[id].price` bei `tier ≤ 1`).
- `runeMerge(data, runeId)` (`camp.ts`) liefert nächste Stufe, Gold `goldPerTier × tier`, Anzahl 3 – entspricht GDD „3× Stufe N + 200 × N“.
- `runes.yaml`: Element-Runen I–III für Feuer/Wind/Erde/Wasser/Licht, Dunkel I nur als Drop; Stufe III mit Geländewirkung (`terrainOnHit`) bzw. Status (`statusOnHit`); Hilfs-Runen (`utility`). Statuschance Rune II/III `balance.status.rune2StatusChance: 30`, `rune3StatusChance: 50`.
- `mechanics.runes` (Story 9.6): in Akt 1 ab der 3. Story-Mission wirken Runen im Kampf; im Lager/Laden zählen sie immer.
- Materialien: `iron_ore`, `moonsteel`, `dragon_scale`, `arcane_dust` (`items.yaml` Z. ~123, `convoyOnly`); `c.materials` hält Mengen; `Wallet` zeigt sie mit Bild. Quellen: Heimsuchungen (`balance.haunt.material`), Kopfgeld (`lieutenant.bounty.materials`).
- Vorhandene Rezept-Items: `fire_bomb` (Z. 114), `door_key` (Z. 113), `haste_scroll` (Z. 115), `remedy_salve` (Linderungssalbe = Gegengift laut GDD „Gegengift (2)“, Z. 112). **Fehlen:** verstärktes Gegengift, `trap_kit`.

### Abhängigkeiten

- Story 10.1 (Ausbau, Schema-Felder), Story 10.4 (was eine Falle ist, falls `trap_kit` dieselbe Falle legt).
- Epic 11 vergibt „Erd-Rune III“ als Belohnung (N5) – Runen höherer Stufe können also schon vor dem Ausbau im Konvoi liegen.

### Regeln

- Spielwerte nur in YAML; Kosten immer Symbol + Zahl; ein Command je Handlung; Vorschau = Command.
- KI-Bilder nur nach `concept/23-art-direction/licensing.md` §6.

### Offene Fragen

1. **Lesart „Rune I → II → III“:** Grenze für Einsetzen **und** Verschmelzen (Vorschlag), nur fürs Verschmelzen, oder nur, welche Runen man kaufen kann? Eine Rune III aus einer Nebenquest wäre bei Verzauberer-Stufe 1 sonst nicht nutzbar.
2. **[PO-Frage]** Werkstatt-Rezepte in Material (Mengen, Material je Rezept, Gold ja/nein) und Rune-II/III-Kosten (nur Verschmelzen oder auch Kauf?). Vorschlag: Akt-Material als Hauptzutat (Stufe 1 Eisenerz, Stufe 2 Mondstahl, Stufe 3 Arkanstaub), Rune II/III nur über Verschmelzen.
3. **[PO-Frage]** „Verstärktes Gegengift“: eigenes Item (z. B. 3 Ladungen statt 2, oder heilt zusätzlich) oder die Smith-Funktion „Trank verstärken“ (`potionUpgrade`)? Die GDD-Tabelle führt beides.
4. **[PO-Frage]** Fallen-Set (`trap_kit`): Wirkung (jede Figur legt eine Falle wie der Fallensteller?), Ladungen, ob es gegen die 2 Fallen zählt (siehe Story 10.4).
5. **„Rune I“ als Werkstatt-Rezept:** welches Element (Wahl beim Herstellen, Zufall aus dem Seed-RNG, oder je Element ein Rezept)? Vorschlag: je Element ein Rezept.
6. **Runen in Akt 1:** GDD „Gestaffelte Regeln“ schaltet Runen nach der 3. Story-Mission frei, aber der Verzauberer (einziger Ort zum Einsetzen) existiert erst ab Akt 2. Bewusst so (Runen in Akt 1 nur als Beute), oder braucht Akt 1 eine Einsetz-Möglichkeit? Betrifft nicht die Umsetzung dieser Story, aber die Handbuch-Texte.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.5]
- [Source: concept/21-gdd/gdd.md#Heimat (Verzauberer, Werkstatt), #Wirtschaft und Ressourcen (Material, Kosten), #Inventar und Ausrüstung (Runen I–III, Verbrauchsgüter)]
- [Source: concept/21-gdd/items.md Z. 163–165]
- [Source: concept/24-architecture/architecture.md#5.10, #5.11, #8.1, #8.3]
- [Source: concept/25-ux/EXPERIENCE.md Z. 45 (gleiche Listen-Muster); DESIGN.md Ressourcen-Symbole]
- [Source: concept/23-art-direction/licensing.md §6, art-direction.md §5.6]
- [Source: _bmad-output/implementation-artifacts/6-4-haendler-schmied-heiler-und-taverne.md, 6-9-die-paktwacht-als-heimat.md]
- Code: `content/core/runes.yaml`, `items.yaml`, `balance.yaml` (`economy.runeMerge`, `status`), `rooms.yaml`, `src/core/campaign/camp.ts` (`runeMerge`), `apply.ts` (`insertRune`, `mergeRunes`, `buyPrice`), `src/app/screens/Rooms.tsx` (`EnchanterRoom`), `src/content/schemas.ts`, `load.ts`, `validate.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
