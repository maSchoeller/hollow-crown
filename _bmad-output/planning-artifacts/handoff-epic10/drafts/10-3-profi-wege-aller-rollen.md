# Story 10.3: Profi-Wege aller Rollen

Status: ready-for-dev

## Story

Als Spieler
möchte ich zwischen zwei klar verschiedenen Profi-Wegen je Rolle wählen,
damit ein Aufstieg die Spielweise ändert.

## Acceptance Criteria

1. **Alle Profiklassen als Content:** `content/core/classes.yaml` enthält neben den sechs vorhandenen (`duelist`, `bulwark`, `breaker`, `sharpshooter`, `sage`, `bishop`) die Profiklassen `blade_dancer`, `ranger`, `hexer`, `battle_priest`, `bard`, `standard_bearer`, `grand_strategist`, `banner_lord` (je `tier: pro`, `role` = Herkunftsrolle, `classAction`, `weaponGroups`, `base`/`growth`/`growthMod`/`caps`/`promotionBonus`, `playable: true`), Namen und Kurztext in `de.yaml`/`en.yaml`. `shadow` und `trapper` legt Story 10.4 an. Werte: **[PO-Frage]** (fehlen im GDD); bis zur Antwort keine Zahlen erfinden – Story blockiert an dieser Stelle (siehe Dev Notes „Reihenfolge“).
2. **Wirkungen laut GDD-Tabelle „Rollenklassen“** – jede als Daten (Skill-Baustein in `skills.yaml` oder Feld der Klasse), nicht als `if (classId === …)`:

   | Profi | Wirkung (GDD) | Umsetzung im Kern |
   |---|---|---|
   | Bollwerk | Schutz für Nachbarn +10 % | Schutzchance (wie Support-Schutz `guardOf`, `rules/combat.ts`) +10 für Nachbarn, siehe Offene Frage 3 |
   | Sturmbrecher | jeder Treffer mit Rückstoß 1 Feld | Status `knockback` bei Treffer (Baustein `statusOnHit`, wie Wind-Rune III) |
   | Klingentänzer | +15 Ausweichen, +10 Krit | passiver Skill `avoidBonus`/`critBonus` |
   | Duellant | Konter schlagen zuerst | `on_defend` `strikeFirst` ohne Bedingung |
   | Scharfschütze | Reichweite bis 4 | `rangeBonus` mit Deckel 4 (Zielen +1 eingerechnet) |
   | Waldläufer | Bogen + Schwert, Wald kostet 1 | `weaponGroups: [bow, sword]`, `terrainCost: { forest: 1 }` |
   | Weiser | Wirken im Radius 1 | Wirken-Fläche Radius 1 (`castArea`, `rules/cast.ts`) |
   | Hexer | Dunkel, Statuschance +20 % | Waffengruppe `dark`, `statusChanceBonus: 20` |
   | Bischof | Heilen im Radius 1 | Heilen trifft alle Verbündeten im Radius 1 um das Ziel |
   | Kampfpriester | Stab + Hammer | `weaponGroups` mit Stab und Hammer (Offene Frage 5) |
   | Barde | Anfeuern Radius 2, max. 2 Ziele | Anfeuern (`cheer`) mit Reichweite 2 und bis zu 2 Zielen |
   | Bannerträger | Nachbarn ignorieren Trauer, +5 Ausweichen | Aura: Nachbarn ohne `griefHitPenalty`, `avoidBonus: 5` |
   | Großstratege | Befehl 2×/Karte | `classAction.perMap: 2` |
   | Bannerherr | Sammelruf Radius 3 | `rally.radius` je Klasse 3 |

   **Angenommen** eine aufgestiegene Figur **Wenn** sie handelt bzw. angegriffen wird **Dann** gilt ihre Wirkung im Kampf, in der KI-Bewertung (Worker) und in der Simulation.
3. **Vorschau:** Jede Wirkung, die eine Zahl oder Fläche ändert, erscheint in derselben Vorschau wie die Auflösung (Kampfvorschau, Bereichskacheln, Wirken-/Heil-Fläche, Anfeuern-Ziele, Rückstoß-Pfeil), über dieselbe Funktion (`forecast`, `previewAction`, `castArea`); kein Kopie-Code.
4. **Signaturteil auf dem Brett (Art Direction §4.2):** Eine aufgestiegene Figur zeigt auf dem Brett **ein** neues Großteil je Profi-Weg (z. B. Bollwerk Turmschild, Scharfschütze Langbogen + Federhut, Bischof Mitra); **[PO-Frage]** wie es entsteht (eigenes Tripo-Modell je Figur × Weg, oder ein Anbauteil am Sockel/Knochen für alle). Bis zur Antwort: Datenfeld `proPart` je Profiklasse (Id des Teils, `render.yaml`) und Anzeige des Namens in Akademie und Figur.
5. **Steckbriefe:** Jede neue spielbare Klasse hat einen Handbuch-Eintrag `class_<id>` (Epic 14, Story 14.5: `content:check` verlangt jede spielbare Klasse) mit Wirkung, Werten aus den Daten und Querverweis auf die Basisrolle; die Basisrolle verweist auf beide Wege.
6. **Akademie zeigt beide Wege:** In der Akademie (Story 10.2) sind für jede Rolle beide Wege wählbar, mit Wirkungstext und Wertgewinn; Rollen mit nur einem vorhandenen Weg zeigen den zweiten gesperrt mit Grund (bis 10.4 Späher).
7. **Bestehende Profiklassen an das GDD angleichen:** Die sechs vorhandenen Profiklassen tragen heute PoC-Skills (`duelist: sol`, `bulwark: impale`, `breaker: climber`, `sharpshooter: longshot`, `sage: elemental_focus`, `bishop: blessing`), die nicht den GDD-Wirkungen entsprechen (z. B. `elemental_focus` = Statuschance +20 % ist die Hexer-Wirkung, liegt aber beim Weiser). Nach Antwort auf Offene Frage 2 ersetzt die GDD-Wirkung den PoC-Skill.

## Tasks / Subtasks

- [ ] T0 **Schema-PR vorziehen (Koordination Epic 11):** Felder, die Profiklassen und Gefährten von Akt 2/3 brauchen, als eigener kleiner PR vor der Logik: `proPart` (optional), Bausteine der Skill-Wirkungen (`statusOnHit`, `guardBonus`, `healRadius`, `castRadius`, `cheerRange`/`cheerTargets`, `rallyRadius`, `ignoreGrief`-Aura, `rangeCap`), `skillSchema.effect` und `classSchema` in `src/content/schemas.ts`, Typen in `defs.ts`. Mael tritt in Akt 3 als „Heiler (Kampfpriester)“ bei (Narrative Z. 228): `battle_priest` muss vor Epic 12 existieren
- [ ] T1 Content (AC 1, 7): Klassen-Einträge mit Werten nach [PO-Frage]; Kommentarkopf in `classes.yaml` aktualisieren (Z. 7 „kommen mit der Akademie (Epic 6)“ → Epic 10); Namen/Texte `class.<id>.name|desc`
- [ ] T2 Kern-Wirkungen (AC 2): je Zeile der Tabelle in `src/core/rules/` (`combat.ts` Schutz/Konter/Rückstoß, `cast.ts` Radius, `movement.ts` Gelände, Heilen in `battle/apply.ts`, `cheer`/`rally`/`command` in `battle/apply.ts`), Werte in `balance.yaml` `classActions` oder in den Skill-Bausteinen
- [ ] T3 KI (AC 2): `src/core/ai/*` bewertet die neuen Wirkungen regelkonform (Bollwerk-Schutz in `counterWeight`/Gefahr, Konter zuerst, Rückstoß); Worker-Anfrage bleibt gleich (§8.5)
- [ ] T4 Vorschau (AC 3): `forecast`, `previewAction`, Overlays (`render/board/overlays.ts`) für Radius-Heilen/-Wirken und Barde
- [ ] T5 Brett (AC 4): nach [PO-Frage]; mindestens `render.yaml` Zuordnung `proPart` → Modellteil, Anhängen an einen Sockel wie Waffen (`gear`, Art Direction §4.6 Punkt 6)
- [ ] T6 Handbuch (AC 5): `handbook.yaml` Einträge `class_<id>`, Texte DE/EN
- [ ] T7 Tests: je Wirkung ein Kerntest (Fixture-Karte), Vorschau = Auflösung, KI-Determinismus, Replay; `content:check` (jede Profiklasse hat Herkunftsrolle mit passendem `proPaths`, Handbuch-Eintrag); `pnpm test:coverage` für `src/core` nicht senken
- [ ] T8 Balancing: `pnpm sim <mapId> --runs 50` auf einer Akt-2-Karte (sobald Epic 11 sie liefert) mit aufgestiegenen Figuren; GDD-Korridore
- [ ] T9 GDD/Architektur: §5.7 „Stand“, Decision-Log (Umsetzung jeder Wirkung)

## Dev Notes

### Heutiger Stand (nicht brechen)

- `classSchema` (`src/content/schemas.ts` Z. 137): `tier`, `proPaths` (max. 2), `promotionBonus`, `classAction { id, kind, perMap }`, `skill` (ein Klassen-Skill). Profiklassen übernehmen heute die Klassen-Aktion der Rolle (`bulwark.classAction = hold`).
- Alle sieben Kernrollen nennen ihre `proPaths` schon (`classes.yaml` Z. 66–196), `tactician` → `grand_strategist`, `captain` → `banner_lord`. Fehlende Ids filtert `promotionTargets` heraus – neue Klassen werden also automatisch wählbar.
- Profi-MOV: Kommentar Z. 208 „MOV = Rolle +1 wie im PoC“; `bulwark`/`breaker` sind `moveType: foot`, `mov: 6`, obwohl der Vorkämpfer laut GDD „Gepanzert (4)“ ist (Offene Frage 4).
- Skill-Bausteine (`skillSchema.effect`): `hitBonus`, `avoidBonus`, `critBonus`, `statusChanceBonus`, `healBonus`, `terrainCost`, `rangeBonus`, `strikeFirst`, … – Klingentänzer, Duellant, Waldläufer (Gelände), Hexer (Status) lassen sich damit fast ohne neuen Code bauen; Schutz-, Radius- und Aura-Wirkungen brauchen neue Bausteine.
- Support-Schutz: `guardOf` (`rules/combat.ts` Z. ~225) mit `balance.supports.guardChance` A 20 / S 30.
- Rückstoß: Status `knockback` (`balance.status.knockbackBlockedDamage`), Wind-Rune III `statusOnHit: knockback` in `runes.yaml`.
- `rally: { radius: 2 }` und `classActions.cheer` stehen global in `balance.yaml`; Bannerherr/Barde brauchen Werte je Klasse.
- Nebel: Die KI sieht alles (`balance.yaml` `fog`-Kommentar); betrifft 10.4, nicht diese Story.
- Item `hammer` ist Waffengruppe `axe` (`items.yaml` Z. 20); eine Gruppe `hammer` gibt es nicht (`WEAPON_GROUPS`, `defs.ts` Z. 17).

### Reihenfolge

Die Kern-Wirkungen (T2–T4) lassen sich mit Platzhalter-Klassen in Test-Fixtures bauen; Content (T1) und Brett (T5) warten auf die [PO-Fragen]. Vorschlag: T0 + T2–T4 + T7 zuerst, T1/T5/T6 nach den Antworten.

### Koordination mit Epic 11

Epic 11 legt Gefährten von Akt 2 an (Jory Spielmann, Odile/Sable Plänkler, Nell Späher, Brann Elementarist, Amos Heiler, Ilka Schütze), die in Akt 2 aufsteigen sollen („erste Aufstiege ab Mission 2“, GDD). Das Schema (T0) früh als eigener PR mergen, damit deren `units.yaml` gültig ist.

### Regeln

- Spielwerte nur in YAML; die Kampfvorschau ruft denselben Formelcode wie die Auflösung (AGENTS.md).
- Jeder Zufall aus dem Seed-RNG (Schutzchance, Statuschance); Replays identisch.
- Kein sichtbarer Text im Code.

### Offene Fragen

1. **[PO-Frage]** Werte der 10 fehlenden Profiklassen (`base`, `growth`, `growthMod`, `caps`, `promotionBonus`, `mov`/`moveType`). Vorschlag: aus der Basisrolle +Muster der vorhandenen sechs ableiten, als [C] markieren und per Simulation abstimmen.
2. **Vorhandene sechs Profiklassen:** Sollen ihre PoC-Skills (`sol`, `impale`, `climber`, `longshot`, `elemental_focus`, `blessing`) den GDD-Wirkungen weichen oder zusätzlich bleiben? Vorschlag: ersetzen (PoC ist Wegwerfware); `longshot` passt zum Scharfschützen und bleibt als dessen Umsetzung.
3. **Bollwerk „Schutz für Nachbarn +10 %“:** +10 Prozentpunkte auf die Support-Schutzchance (nur mit Support-Rang A/S) oder ein eigener Schutz für jeden Nachbarn (10 %, auch ohne Support)? Vorschlag: eigener Schutz 10 % für jeden Nachbarn, stapelt mit dem Support-Schutz bis höchstens 30 %.
4. **Bewegung der Profis:** GDD „Vorkämpfer Gepanzert (4)“, Code `bulwark`/`breaker` Fuß 6 (PoC-Regel „Rolle +1“). Behalten Profis Bewegungstyp und MOV der Rolle (+1)? Vorschlag: Bewegungstyp der Rolle, MOV +1.
5. **Kampfpriester „Stab + Hammer“:** Eine Waffengruppe `hammer` gibt es nicht, das Item `hammer` ist eine Axt. Vorschlag: `weaponGroups: [staff, light, axe]`.
6. **[PO-Frage]** Wie entsteht das neue Großteil auf dem Brett (eigenes Tripo-Modell je Figur und Weg kostet laut §4.6 je 140 Credits; ein Anbauteil am Knochen wäre billiger)? Vorschlag: Anbauteil (Blender) je Profi-Weg an einem neuen Sockel `socket_back`/`socket_head`.
7. **Barde „max. 2 Ziele“:** zwei getrennte Ziele in einem Zug (zwei Taps) oder alle bis 2 im Radius automatisch? Vorschlag: zwei Ziele wählen, zweites optional.
8. **Bischof „Heilen im Radius 1“:** Gilt das für Stab-Heilen (Ziel + Nachbarn des Ziels) oder um den Bischof? Vorschlag: um das Ziel; EP nach GDD „12 + 3 je Zusatzziel“ (`experience.healExtraTarget` existiert).

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.3]
- [Source: concept/21-gdd/gdd.md#Rollenklassen (Z. 133–153), #Primäre Mechaniken (Schutz, Rückstoß), #Figurensystem]
- [Source: concept/22-narrative/narrative.md Gefährten-Tabelle (Z. 212–233, Mael als Kampfpriester)]
- [Source: concept/23-art-direction/art-direction.md#4.2 (Profi-Wege: ein neues Großteil), #4.6 (Produktion, Credits)]
- [Source: concept/24-architecture/architecture.md#5.7, #8.3, #8.5]
- [Source: concept/25-ux/DESIGN.md Klassen-Steckbrief (Profi-Wege); mockups/08-ergebnis-abschied.html (Bollwerk/Sturmbrecher mit Signaturteil)]
- [Source: _bmad-output/implementation-artifacts/2-2-rollenmodell-und-waffengruppen.md, 14-5-klassen-steckbriefe.md]
- Code: `content/core/classes.yaml`, `skills.yaml`, `balance.yaml` (`classActions`, `rally`, `supports.guardChance`), `src/content/schemas.ts`, `src/core/rules/combat.ts`, `cast.ts`, `movement.ts`, `progression.ts`, `src/core/battle/apply.ts`, `content/core/handbook.yaml`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
