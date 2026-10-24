# Story 2.2: Rollenmodell und Waffengruppen

Status: review

## Story

Als Spieler
möchte ich, dass die Rolle bestimmt, wie sich eine Figur verhält, und die Ausrüstung, womit sie kämpft,
damit Ausrüstung der Charakter ist.

## Acceptance Criteria

1. **Rollenschema:** `classes.yaml` im Rollenschema (`role`, `tier`, `moveType`, `mov`, `weaponGroups`, `classAction`, `proPaths`, Wachstum, Basiswerte, Caps) mit Zod-Schema. Es gibt die 7 Kernrollen sowie Taktiker und Hauptmann, Werte aus den PoC-Klassen abgeleitet (GDD-Annahme 3). Jedes Item mit Waffe, Tome, Stab oder Schild hat eine Waffengruppe `group`; `canEquip` erlaubt nur Gruppen der Rolle.
2. **Umgemappt:** PoC-Figuren und -Karten (Söldner/Held → Plänkler, Soldat/Ritter → Vorkämpfer, Schütze → Schütze, Magier → Elementarist, Kleriker → Heiler) laufen weiter; `pnpm sim <mapId> --runs 50` liegt in den Korridoren aus NFR12 oder die Abweichung ist im Log begründet.
3. **Ausrüsten:** Das Ausrüsten zeigt unpassende Items gedimmt mit Grund (Story 6.2).

## Tasks / Subtasks

- [x] T1 Daten: `classes.yaml` im Rollenschema (Kernrollen, Taktiker, Hauptmann, sechs Profiklassen, Gegnertypen), `classAction` nur als Daten
- [x] T2 Schema und Typen: `classSchema`, `ClassDef`, `WeaponGroup`, `CORE_ROLES`; `weapons: WeaponType[]` entfällt, `promotesTo` → `proPaths` (`promotionTargets`)
- [x] T3 Items: `group` an allen Waffen, Tomes, Stäben, Schilden, Fokus; `canEquip`/`usableWeapons`/`usableStaves` prüfen die Gruppe (`groupAllowed`), Fehler `weapon_group`
- [x] T4 Remap: Figuren, Karten, Taverne; Klassen-Icons, Platzhalterfarben, Porträt je Klasse (`art`)
- [x] T5 Validierung (`content:check`): Kernrollen vorhanden, Profi-Wege passen zur Rolle, spielbare Klassen mit Klassen-Aktion, Gruppe an Waffen, Startausrüstung der Figuren passt zur Rolle
- [x] T6 Ausrüsten: Grund-Text `ui.equip.why.weapon_group`, Gruppenzeile für Haupt- und Nebenhand, Texte für neue Gruppen und Klassennamen (de/en)
- [x] T7 Tests: `tests/unit/roles.test.ts`; Speicher-Fixtures neu erzeugt
- [x] T8 Sim je Karte gegen NFR12 (siehe Log)

## Dev Notes

- **Waffengruppe vs. `weaponType`:** `weaponType` bleibt der Regeltyp (Dreieck, Reichweite); `group` entscheidet, wer es führen darf. Schild, Fokus und Laute sind Gruppen der Nebenhand. Gruppen: sword, lance, axe, dagger, bow, light_bow, anima, light, dark, staff, shield, focus, lute, breath (items.md §4).
- **Klassen-Ids sind jetzt Rollen:** `vanguard`, `skirmisher`, `marksman`, `elementalist`, `healer`, `scout`, `minstrel`, `tactician`, `captain`; Profi: `duelist` (Held), `bulwark` (Hellebardier), `breaker` (Krieger), `sharpshooter`, `sage`, `bishop`; Gegnertypen `brigand`, `knight`, `pegasus_knight`, `drake_young`. Die übrigen Profi-Wege stehen in `proPaths`, sind aber erst mit der Akademie (Epic 6) wählbar (`promotionTargets` filtert auf definierte Klassen).
- **Herleitung (GDD-Annahme 3):** Plänkler = Söldner, Schütze = Schütze, Elementarist = Magier, Heiler = Kleriker, Vorkämpfer = Soldat (der Kämpfer fällt darin auf). Neu: Späher (Mittel Söldner/Schütze, Kletterer), Spielmann (Mittel Söldner/Kleriker). Profi-MOV = Rollen-MOV + 1 wie im PoC.
- **Klassen-Aktionen** sind nur Daten (`classAction: {id, kind, perMap?}`); Umsetzung in Story 2.3 ff. Platzhalter-Skills der PoC-Klassen bleiben.
- **Porträt generischer Einheiten:** `art` verweist auf die vorhandenen `class_<art>`-Bilder, es wurde nichts umbenannt.
- **Speicherstände:** Klassen-Ids der Fixtures neu erzeugt; ältere Test-Saves mit PoC-Ids laden nicht mehr (Prototyp, keine veröffentlichten Akt-Builds).
- **Nebenhand-Regel neu:** Schilde nur Vorkämpfer, Fokus nur Elementarist/Weiser; Kael und der Avatar können keinen Schild führen.

### Offene Fragen für den Produktinhaber

- **Vorkämpfer-MOV:** GDD sagt „Gepanzert (4)“. Mit MOV 4 brechen die PoC-Karten (ch01 Siegquote ~0 %, die Autoplay-Gruppe zerfällt); mit Bewegungstyp Gepanzert und MOV 5 sinken ch01/ch02 auf 80 %/~55 %. Umgesetzt ist `moveType: foot`, MOV 5 wie der PoC-Soldat. Entscheidung (MOV 4 samt Neubalancing der Karten, Epic 11) steht aus.
- **Plänkler-MOV:** GDD sagt 6; umgesetzt 5 (PoC-Söldner), weil MOV 6 ch02 auf ~53 % drückt. Gleiche Frage.
- **Vorkämpfer-Werte:** exakt der PoC-Soldat (Mittel mit dem Kämpfer ließ ch02 auf 67 % fallen); Brenna (Kämpfer) und die Gegner-Kämpfer laufen damit als Vorkämpfer ohne den PoC-Skill „Kletterer“ des Kämpfers.
- **Waffengruppen Dolch/Leichter Bogen/Laute** haben noch keine Items (Katalog-Story); Späher und Spielmann können bis dahin keine Waffe führen.
- **Zauber-Gruppen:** Elementarist führt `anima` plus Fokus (Nebenhand, items.md), `dark` erst mit dem Hexer.

### References

- [Source: concept/26-epics/epics.md#Story 2.2]
- [Source: concept/21-gdd/gdd.md#Rollenklassen]
- [Source: concept/24-architecture/architecture.md §5.7]
- [Source: concept/21-gdd/items.md §4]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

- Sim (normal/standard, 50 Läufe, verkettet) siehe unten; Basis vor der Story: prologue 100 %/0,06, ch01 90 %/0,14, ch02 89 %/1,60 (45 von 50 Läufen erreichen ch02).

### Completion Notes List

`pnpm sim <map> --runs 50` (normal/standard, verkettet), nachher gegen vorher:

| Karte | Siegquote | Niedergestreckte/Lauf | Läufe die die Karte erreichen |
|---|---|---|---|
| prologue_caravan | 100 % (vorher 100 %) | 0,06 (0,06) | 50 |
| ch01_varnhold | 92 % (90 %) | 0,14 (0,14) | 50 |
| ch02_silverbrook | 76 % (89 %) | 1,37 (1,60) | 46 (45) |

Korridor Normal 75–100 % Sieg und 0,4–1,3 Niedergestreckte: alle drei Siegquoten liegen darin; die Verluste von ch01 (0,14) und ch02 (1,37) lagen schon vor der Story außerhalb und sind nicht schlechter geworden. Abweichung: ch02 verliert 13 Punkte Siegquote, weil Brenna und die Gegner-Kämpfer als Vorkämpfer die Werte des Soldaten bekommen (Kämpfer-Skill „Kletterer“ und Kämpfer-Wachstum entfallen). Leicht und Schwer wurden nicht neu gemessen. Zwischenstände (GDD-Werte MOV 4 gepanzert: ch01 ≈ 0 %; Plänkler MOV 6: ch02 53 %) stehen in den offenen Fragen.

### File List

- `content/core/classes.yaml`, `items.yaml`, `balance.yaml`, `locales/{de,en}{,.names}.yaml`; `content/acts/act1/units.yaml`, `maps/ch01_varnhold.yaml`, `maps/ch02_silverbrook.yaml`
- `src/core/defs.ts`, `src/core/rules/{items,progression,skills}.ts`, `src/core/ai/ai.ts`, `src/core/campaign/{apply,camp}.ts`, `src/content/{schemas,validate}.ts`
- `src/app/screens/{Equip,BattleHud,BattlePanels,Battle,Troop,unitArt}.tsx`, `src/render/assets.ts`
- `tests/unit/roles.test.ts` (neu), `tests/unit/{camp,campaign-commands}.test.ts`, `tests/fixtures/saves/*`
