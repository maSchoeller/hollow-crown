# Story 3.4: Mitwachsende Stärke

Status: ready-for-dev

## Story

Als Spieler
möchte ich, dass Leutnants weder abgehängt noch unschlagbar sind,
damit jede Begegnung fordernd bleibt.

## Acceptance Criteria

1. **Stufe:** Beim Kampfaufbau (`createBattle`, `src/core/battle/setup.ts`) ist die Stufe jedes Leutnants `round(Durchschnitt der effektiven Stufen der 6 stärksten Einheiten der Armee) + Groll`. „Effektiv“ ist `effectiveLevel` (`src/core/rules/skills.ts`: Stufe, Profiklasse +15). Armee ist `c.roster`; die Anzahl 6 steht in `balance.yaml` (neuer Schlüssel `lieutenant.scaling.armySize: 6`, nie im Code; gleicher Wert wie `simulation.armySize`, aber eigener Schlüssel, damit Spiel und Sim einzeln einstellbar bleiben). Kaufmännisch gerundet (x,5 → auf). Hat die Armee weniger als 6 Einheiten, zählt der Durchschnitt der vorhandenen. Die Berechnung ist eine reine Funktion `lieutenantLevel(data, c, grudge)` in `src/core/campaign/lieutenants.ts`.
2. **Werte:** Die Werte auf der errechneten Stufe sind der Erwartungswert (Basis + Wachstum % × Stufendifferenz, kaufmännisch gerundet, Klassen-Deckel) und deterministisch, ohne Würfe. Dasselbe gilt für generische Gegner über `genericStats` (`src/core/battle/create.ts`, bisher abgerundet): beide laufen über eine gemeinsame Funktion, damit Leutnant und generische Gegner nicht auseinanderlaufen. Weicht die Rundung gegenüber heute ab, ist das eine bewusste Änderung; sie wird in den Sim-Zahlen der PoC-Karten geprüft und gemeldet (AC 7).
3. **Ausrüstung:** Der Leutnant trägt die Waffe(n) der Karteneinheit; je Groll eine Tier-Stufe höher in derselben Waffengruppe (iron → steel → …), gedeckelt beim höchsten vorhandenen Tier der Gruppe (kein Fehler, wenn die Gruppe endet). Nicht-Waffen der Karte bleiben. Die Signaturwaffe (`signatureItem`) trägt er nie: sie ist nur Beute (Story 3.5).
4. **Fähigkeiten:** Je Groll-Stufe gilt eine weitere Groll-Fähigkeit aus `grudgeSkills` (Groll 1: erste, 2: erste und zweite, 3: alle; Groll 0: keine). Sie wirken im Kampf wie jeder Skill (`skills.ts`), die Vorschau berücksichtigt sie über denselben Formelcode. Die Auswahl ist eine reine Funktion `lieutenantSkills(def, grudge)`.
5. **Schwierigkeit und Karten-Stufe:** Die Schwierigkeit (`statPercent`) wirkt weiter auf die Werte wie bei generischen Gegnern; die Stufe ändert sie nicht. `BattleUnit.level` trägt die errechnete Stufe; die Karten-`level` einer Leutnant-Einheit wird für den Leutnant ignoriert (das Feld bleibt im Schema).
6. **Steckbrief:** Die im Steckbrief (Story 3.6) angezeigten Groll-Fähigkeiten (gesperrte gestrichelt) stimmen mit `lieutenantSkills` überein.
7. **Prüfungen:** Tests für `lieutenantLevel` (1, 3, 6, 9 Einheiten; Profiklasse +15; Rundung x,5 auf; Groll 0–3), `lieutenantSkills`, Ausrüstungs-Tier je Groll (Gruppe mit und ohne höheres Tier; Signaturwaffe wird nie getragen), deterministische Werte (zweimal gleicher Ausgang) und Replay-Gleichheit; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün; Coverage von `src/core` nicht senken. Zusätzlich `pnpm sim ch01_varnhold --runs 50` und `pnpm sim ch02_silverbrook --runs 50` im Korridor von `balance.yaml` `simulation.corridors`; Ergebnis im Bericht nennen. Keine neue sichtbare Oberfläche, daher kein Screenshot Pflicht (empfohlen: Steckbrief mit Stufe).

## Tasks / Subtasks

- [ ] T1 Balance (AC 1)
  - [ ] `balance.yaml` `lieutenant.scaling`, `defs.ts` Typ, `balanceSchema`
- [ ] T2 Stufe und Werte (AC 1, 2, 5)
  - [ ] `lieutenantLevel` (kaufmännisch gerundet, `effectiveLevel`)
  - [ ] Erwartungswert-Werte als gemeinsame Funktion mit `genericStats`
  - [ ] `createBattle`/`battleUnitFromMap` übergeben Stufe und Groll
- [ ] T3 Ausrüstung (AC 3)
  - [ ] Tier-Kette `lieutenant.scaling.tierUp` in `balance.yaml` (siehe Offene Fragen), ohne Eintrag Deckel; Signaturwaffe ausschließen
- [ ] T4 Fähigkeiten (AC 4, 6)
  - [ ] `lieutenantSkills`, Einbindung in die Skill-Summen des Leutnants
- [ ] T5 Tests, Sim, Prüfungen (AC 7)
  - [ ] `tests/unit/lieutenants-scaling.test.ts`, Sim der Karten, Decision-Log

## Dev Notes

### Quellen

- Epics 3.4; GDD „Leutnants“ (effektiver Durchschnitt der 6 stärksten + Groll, Profiklasse +15, je Groll ein Tier und eine Fähigkeit mehr) und „Figurensystem“; Architektur §5.5; `balance.yaml` `simulation.armySize`.
- Produktentscheidungen 2026-10-25: Stufe = `round(Ø der effektiven Stufen der 6 stärksten) + Groll`, kaufmännisch; Anzahl 6 in `balance.yaml`; Ausrüstung = Karten-Waffe(n), je Groll ein Tier höher in derselben Gruppe, gedeckelt beim höchsten vorhandenen Tier, Signaturwaffe nie getragen; Werte als Erwartungswert, deterministisch, für Leutnants wie generische Gegner.
- Groll-Fähigkeiten je Leutnant (in `lieutenants.yaml` als `grudgeSkills`, Quelle `core/skills.yaml`): Hask Wucht / Brandmal / Feuer frisst alles; Morra Kimme / Fernschuss / Kopfgeldblick; Ulvric Wolfslauf / Rudel / Durchbruch; Grosk Schildwall / Zäh / Aushalten.

### Vorhandener Code (Fundstellen)

- **Stufe/Werte:** `src/core/battle/create.ts` `genericStats(data, classId, level, statPercent)` (Basis + `floor(Wachstum × (Stufe−1) / 100)`, dann Schwierigkeit, Deckel), `battleUnitFromMap`; Leutnant-Felder (Name, Modell, Porträt) ab ~Zeile 153. `campaign.ts:391` nutzt `genericStats` für Söldner.
- **Effektive Stufe:** `src/core/rules/skills.ts:110` `effectiveLevel(data, u)`; `tools/simCampaign.ts:82` rechnet den Armee-Durchschnitt (nur Muster: Datei liegt in `tools/`, der Kern braucht eine eigene Funktion).
- **Aufbau:** `src/core/battle/setup.ts:28` `createBattle` (hat `c`), ~Zeile 76 liest `c.lieutenants[id]` für `grudge`/`grudgeTarget`.
- **Leutnant-Modul:** `src/core/campaign/lieutenants.ts` (reine Funktionen zum Leutnant dort ergänzen).
- **Items:** `content/core/items.yaml` (Waffengruppe, Seltenheit/Preis), `src/core/defs.ts` `ItemDef`; Signaturen aus Story 3.5.
- **Skills:** `content/core/skills.yaml`, `src/core/rules/skills.ts`; prüfen, wie eine generische Einheit Skills bekommt, und denselben Weg nutzen.

### Was sich ändert / was bleibt

- **Verhalten:** Karten ohne Leutnant ändern sich nur dort, wo die Erwartungswert-Rundung von der bisherigen Abrundung abweicht; das Sim-Ergebnis entscheidet, ob es bleibt (Rundung ist entschieden: kaufmännisch).
- **Armee unter 6:** Durchschnitt der vorhandenen, keine Auffüllung mit Nullen. Gefallene und Verlassene zählen nicht (nicht in `c.roster`).
- **Seitenwechsel:** Story 3.7 nutzt `lieutenantLevel` mit Groll 0 für den Beitritt.

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** Flucht (3.2), Seitenwechsel (3.7), Heimsuchungs-Gegnerstufen (5.5/5.6, lesen `expectedLevel`), Wirtschaftskurve (6.8), Missions-Content (9.x), Karten.
- **Abhängigkeiten:** 3.1 (Definitionen, `grudgeSkills`), 3.3 (`grudge` in `BattleUnit`), 3.5 (Signaturen als Items).

### Offene Fragen

- Keine. **Entscheidung Kontrolleur (technisch):** Die Items haben kein Tier-Feld, und eine Reihenfolge nach Preis wäre falsch (hand_axe 700 liegt zwischen iron_axe 450 und steel_axe 1000). Die Tier-Kette steht deshalb ausdrücklich in `balance.yaml` (z. B. `lieutenant.scaling.tierUp: { iron_axe: steel_axe, iron_lance: steel_lance, iron_bow: steel_bow, iron_sword: steel_sword, … }`); ohne Eintrag bleibt die Waffe (Deckel). `content:check` prüft die Kette (gleiche Gruppe, existierende Items). Im Architektur-Decision-Log festhalten.

### Project Structure Notes

- Neu: `tests/unit/lieutenants-scaling.test.ts`.
- Geändert: `src/core/campaign/lieutenants.ts`, `src/core/battle/{setup,create}.ts`, `src/core/defs.ts`, `src/content/schemas.ts`, `content/core/balance.yaml`.

### Project Context Rules

- `src/core` rein, State serialisierbar; kein Zufall (hier deterministisch); Replays identisch.
- Spielwerte (Anzahl 6) nur in `balance.yaml`; Rundung als eine gemeinsame Funktion.
- Code, Bezeichner, Commits englisch.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün sind; Coverage `src/core` nicht senken; Sim im Korridor.
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics.md#Story 3.4]
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: _bmad-output/implementation-artifacts/3-1-leutnants-als-content-und-auf-dem-brett.md]
- [Source: _bmad-output/implementation-artifacts/3-3-groll-und-groll-ziel.md]
- [Source: _bmad-output/implementation-artifacts/3-5-kopfgeld-und-signatur-item.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
