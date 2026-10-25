# Story 2.2: Rollenmodell und Waffengruppen

Status: done

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
- **Nebenhand-Regel neu:** Schilde nur Vorkämpfer, Fokus nur Elementarist/Weiser; Der Avatar (Taktiker) kann keinen Schild führen; Kael (Hauptmann) schon (Produktinhaber 2026-10-24, siehe Log unten).

### Offene Fragen für den Produktinhaber

- **Vorkämpfer-MOV / Plänkler-MOV:** entschieden am 2026-10-24 (Produktinhaber), siehe „Entscheidungen Produktinhaber 2026-10-24“ unten.
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

### Entscheidungen Produktinhaber 2026-10-24 und Neubalance der PoC-Karten

- **GDD-Werte wiederhergestellt:** Vorkämpfer `moveType: armored`, MOV 4; Plänkler `foot`, MOV 6. Die übrigen Rollen stimmen mit der GDD-Tabelle überein (Schütze, Elementarist, Heiler, Spielmann, Taktiker, Hauptmann Fuß 5; Späher Fuß 6). Die Profiklassen (Bollwerk, Sturmbrecher MOV 6) bleiben unverändert.
- **Schilde:** `captain` führt Lanze, Schwert und Schild; `tactician` bleibt bei Schwert und Anima. Test `roles.test.ts` angepasst.
- **Ursache des Einbruchs:** Mit MOV 4 bleiben Brenna und Tobin hinter dem Avatar zurück, den die Autoplay-Gruppe allein nach vorn schickt (ch01: 2 % Siegquote, der Avatar fällt in Runde 3). Die Gegner-Plänkler laufen jetzt mit MOV 6 und erreichen Avatar und Liora früher.
- **Karten (nur Inhalte, keine Klassenwerte):**
  - `ch01_varnhold`: Gegner e2 hält (Position [8, 9], Straßen-Engstelle) statt anzugreifen; e6 startet bei [4, 5] und ist Stufe 3, Archer e3 Stufe 3, e8 Stufe 4; vierter Aufstellungsplatz [13, 15], damit Tobin das Dorf mit Mira (hinter den Mauern bei [15, 11]) in Runde 2 erreicht (Mira wird in 48 von 50 Läufen angeworben).
  - `ch02_silverbrook`: Varek wartet (`hold`) statt den Schrein anzugreifen (er tötete Liora in 7 Läufen, solange Kael ihn nicht ansprach); Morra Stufe 5; m1–m6 Stufe 2; die Söldner m1, m5 und der Nachzügler in Runde 3 sind Banditen (MOV 5, Axt) statt Plänkler (MOV 6); Welle in Runde 7 Stufe 3.
  - `prologue_caravan`: unverändert auf Normal; Schwer verliert einen Nachzügler (Siegquote 20 % → 62 %).
- **Messung** (`pnpm sim <map> --runs 50`, verkettet, standard). Korridore: Leicht ≥ 95 % und ≤ 0,5; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %.

| Karte | Leicht | Normal vorher | Normal nachher | Schwer |
|---|---|---|---|---|
| prologue_caravan | 100 % / 0,00 | 100 % / 0,06 | 100 % / 0,04 | 62 % / 0,54 |
| ch01_varnhold | 100 % / 0,00 | 92 % / 0,14 | 96 % / 0,46 | 35 % / 1,71 |
| ch02_silverbrook | 100 % / 0,22 | 76 % / 1,37 | 85 % / 0,85 | 36 % / 0,09 (nur 19 Läufe erreichen die Karte) |

  Zwischenstand mit den GDD-Werten ohne Kartenänderung: prologue 100 %, ch01 2 %, ch02 1 von 50 Läufen erreicht.
- **Nicht im Korridor:** Der Prolog liegt bei Normal mit 0,04 Niedergestreckten unter 0,4. Er ist die Tutorialkarte (nur Axt-Banditen, keine Fernkämpfer); höhere Stufen oder zwei zusätzliche Banditen ließen die Quote bei 96 % und 0,04–0,08, weil Niedergestreckte fast nur den Avatar betreffen. Offen für den Produktinhaber, ob der Prolog vom Korridor ausgenommen wird.

### Neubalance Prolog, Produktinhaber 2026-10-24: „Prolog im Korridor, nur Nahkampf-Gegner“

Nur `content/acts/act1/maps/prologue_caravan.yaml` geändert (keine Klassenwerte, kein Code, kein `balance.yaml`). Gegner jetzt Nahkampf-Mischung statt nur Axt-Banditen, weiterhin keine Fernkämpfer.

- `p_e1`: Bandit Stufe 1 → Plänkler (Schwert) Stufe 1, aggressiv (alle Schwierigkeiten); er läuft MOV 6 und bindet Brenna früh.
- `p_e2`: Bandit Stufe 1 → Plänkler (Schwert) Stufe 2, aggressiv.
- `p_e3`: Bandit (hält) → Vorkämpfer (Eisenlanze) Stufe 2, aggressiv; Normal und Schwer.
- `p_e5`: bleibt Axt-Bandit, jetzt Stufe 1 und nur Normal (vorher nur Schwer, Stufe 2).
- Schwer: Nachzügler in Runde 3 bleibt; das Gegnerplus von +15 % macht die Karte dort ohne `p_e5` schwer genug.
- Grosk, `p_e4`, Trigger, Szenen und Nebenziele („Niemand fällt“, „Sieg in höchstens 7 Runden“) unverändert.

Messung (`pnpm sim prologue_caravan --runs 50`, verkettet, standard; Seed 1, in Klammern Seed 200):

| Schwierigkeit | Korridor | vorher | nachher |
|---|---|---|---|
| Leicht | ≥ 95 %, ≤ 0,5 | 100 % / 0,00 | 100 % / 0,00 (100 % / 0,00) |
| Normal | 75–100 %, 0,4–1,3 | 100 % / 0,04 | 94 % / 0,70 (92 % / 0,50) |
| Schwer | 30–70 % | 62 % / 0,54 | 40 % / 1,34 (54 % / 1,06) |

Alle drei Korridore sind erreicht. Damit ist die offene Frage „Prolog vom Korridor ausnehmen?“ erledigt.
