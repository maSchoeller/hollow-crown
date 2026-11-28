# Story 16.12: Kampfvorschau mit Element-Band

Status: done

## Story

Als Spieler
möchte ich in der Kampfvorschau sehen, was die Runen bewirken,
damit ich Elementvorteile nutze.

## Acceptance Criteria

1. **Waffen-Chip mit Runenstein:** Trägt die Waffe einer Seite eine Element-Rune, steht am Waffen-Chip (`WeaponChip` in `BattleHud.tsx`, ~Zeile 250) ein Runenstein: Kreis 15 px in Elementfarbe (`el-<element>` aus `ElementIcon`) mit römischer Stufe I–III. Ohne Rune kein Stein. Licht und Dunkel zählen mit (die Waffe darf jedes Element tragen), aber nur Feuer, Wasser, Erde und Wind haben Zustände.
2. **Ziel-Chip:** Trägt das Ziel eine Element-Rune in Rüstung (Affinität) oder Schild (Story 16.4, `EffectiveStats.shield`), steht sie als zweiter Chip unter seiner Waffe: Linien-Icon `armored` bzw. `shield`, Kurzname, Runenstein wie in 1. Tragen Rüstung und Schild dasselbe Element, erscheint nur der Chip, der den Faktor bestimmt ([ASSUMPTION]: bei Gleichstand die Rüstung, weil 16.4 dort „zählt nur der bessere Faktor“ sagt). Gilt für beide Seiten (auch der Angreifer kann Gegenschlag-Ziel sein).
3. **Element-Band:** Über der Tabelle (zwischen Kopf `hud-fc__head` und `hud-fc__table`) steht eine Pille mit beiden Elementen als Kreis 18 px mit Linien-Icon und einem Satz in 12,5 px:
   - Vorteil: „Feuer schlägt Wind · Schaden ×1,2“, Grund grünlich, Marke grün;
   - Nachteil: „Wasser hält Feuer ab · Schaden ×0,8“, Grund rötlich, Marke rot (auch bei gleichem Element: „Feuer gegen Feuer · Schaden ×0,8“; Schild-Rune: „Schild hält Feuer ab“ ist nicht nötig, der Satz nennt Angriffs- und Schutzelement);
   - Waffe mit Element, Ziel ohne Schutzelement (oder Faktor genau 1): „Feuer · kein Vorteil, kein Nachteil“, Grund Creme, nur das Angriffselement als Kreis.
   Rechts im Band das Kontext-„?“ (`HelpStone`, Anker `elements`, Eintrag `elements` in `content/core/handbook.yaml` bekommt `anchor: elements`; die Zeile `anchor: forecast` am Eintrag `forecast` bleibt). Der „?“ unter der Tabelle (`anchor="forecast"`) bleibt.
4. **Faktor an der Schadenszahl:** Ist `elementMult !== 1`, trägt die Schadenszahl derselben Seite den Faktor als kleine Marke (`×1,2` grün, `×0,8` rot, Dezimalkomma per i18n-Zahlenformat, nicht per String-Ersetzen). Die heutige Chip-Anzeige „+20 %“ in `who()` (`s.elementMult !== 1`, ~Zeile 501) entfällt, damit der Faktor nicht dreimal steht.
5. **Status-Zeile:** Unter der Tabelle steht, wenn die Waffe der Seite ab Stufe II einen Zustand mit Chance > 0 hat, eine Zeile mit Elementkreis und Satz „**30 %** Brennen · 2 Runden je 3 TP“. Beträge als Symbol + Zahl (TP-Symbol, Runden-Symbol), keine ausgeschriebenen Einheiten außer in der Beschriftung für Screenreader. Chance aus `Forecast.<seite>.status` (bereits inkl. Immunität: ein Schild ab Stufe II des Elements, Körper-Immunität und Boni; Chance 0 blendet die Zeile aus); Dauer aus `balance.status.durationRounds`; Schaden je Runde nur bei Brennen: `floor(Ziel-maxTP × balance.status.burnPercentMaxHp / 100)` ([ASSUMPTION]: dieselbe Rechnung wie die Auflösung; der Dev holt sie aus dem vorhandenen Brenn-Code, siehe 7, und baut keine zweite). Nass, Verlangsamt und Rückstoß zeigen Chance und Dauer bzw. „1 Feld weg“ (vorhandener Schlüssel `ui.fc.knockback`) ohne TP-Teil. Das alte Chip `status` in `hud-fc__notes` (`{Status} {Chance}%`) entfällt, ersetzt durch die Zeile.
6. **Ohne Rune weg:** Hat weder Angreifer- noch Verteidigerseite ein Element (Waffe ohne Rune, Ziel ohne Schutzrune), fallen Band und Zeile weg; die Vorschau sieht aus wie heute. Ist die Mechanik `elements` aus (`ruleOn(state,'elements')`), ebenfalls weg. Ein Gegenschlag der anderen Seite mit eigener Rune zeigt dort eigenes Band nur, wenn sie Element hat; sonst genügt der Chip. Das Band zeigt immer die Seite des Angreifers der Vorschau (der Tipp-Angriff); Zustände des Gegenschlags erscheinen als zweite Status-Zeile, wenn vorhanden ([ASSUMPTION]: selten, aber `Forecast.defender.status` existiert und darf nicht stumm verschwinden).
7. **Eine Formel (AR „Vorschau = Auflösung“):** Band, Marke und Zeile lesen nur Felder von `Forecast` (`elementMult`, `status`, `element`). Fehlendes wird **im Kern** ergänzt und von `calcSide` mitgeliefert, nie in `src/app` gerechnet: `SideForecast.elementTier?: number` (Stufe der Waffenrune), `SideForecast.guard?: { element: Element; tier: number; source: 'armor' | 'shield' }` (Schutzelement des Ziels, das den Faktor bestimmt, aus `oppStats.affinity` und `oppStats.shield`; Eintrag liegt auf der **angreifenden** Seite, weil `elementMult` dort liegt) und `SideForecast.statusTurns?: Array<{ status; rounds; perRound?: number }>`, berechnet über den vorhandenen Brenn-/Statuscode in `src/core/rules/effects.ts`. Test: für jede Kombination (Vorteil, Nachteil, gleich, Schild-Rune, neutral) ist der in `Forecast` stehende Faktor gleich dem Faktor, den `resolveAttack` am Schaden anwendet, und `statusTurns.perRound` gleich dem tatsächlichen Brandschaden der ersten Runde.
8. **Tests und Beleg:** Unit-Tests für 7 (Kern); Komponententest für `ElementBand` (Satz, Farbklasse, Faktor-Format, Wegfall ohne Rune); Lab-Szenario mit Bild bei 375 × 812 neben dem Mockup (siehe Beleg).

## Tasks / Subtasks

- [x] T1 Kern: Forecast liefert alles (AC 7)
  - [x] `src/core/rules/combat.ts` `SideForecast` (Zeile 16): Felder `elementTier`, `guard`, `statusTurns` ergänzen; in `calcSide` (~Zeile 150–215, dort wo `elementMult` und `status` entstehen) füllen. `guard` aus `oppStats.affinity`/`oppStats.shield` (16.4); bei beidem das Element wählen, dessen Faktor gilt (Rüstung bei Gleichstand).
  - [x] Brandschaden je Runde über die vorhandene Funktion in `effects.ts` (grep `burnPercentMaxHp`), Dauer `balance.status.durationRounds`; keine Zahl im UI-Code.
  - [x] `tests/unit/shield-runes.test.ts` bzw. neue `tests/unit/forecast-element.test.ts`: Faktor, Stufe, Guard-Quelle, `perRound` gleich Auflösung (Seed-RNG, Replay-sicher), Zustand Chance 0 bei Schild II.
- [x] T2 Komponente `ElementBand` (AC 3, 4, 6)
  - [x] Neue Datei `src/app/screens/ElementBand.tsx` und eigenes `ElementBand.css` (nicht in `hud.css`, nicht in `styles.css`); enthält `ElementBand`, `RuneStone` (Kreis + Stufe), `ElementFactor` (Marke) und `StatusLine`. `BattleHud.tsx` (über 25 KB) wird nur an den Einbaustellen angefasst: `ForecastCard` lesen (~Zeile 464–625), nicht ganz.
  - [x] Sätze und Zahlenformat über i18n: Schlüssel `ui.fc.band.beats` („{a} schlägt {d}“ / „{a} beats {d}“), `ui.fc.band.resists` („{d} hält {a} ab“ / „{d} resists {a}“), `ui.fc.band.same` („{a} gegen {a}“), `ui.fc.band.neutral` („{a} · kein Vorteil, kein Nachteil“), `ui.fc.band.damage` („Schaden“), `ui.fc.status` („{chance} % {status} · {rounds} Runden je {hp} TP“ mit Symbolen statt Wörtern, wo das UI sie schon nutzt), `ui.fc.runeTier` (aria „Stufe {n}“); Elementnamen aus `ui.element.*`. DE und EN in `content/core/locales/de.yaml` und `en.yaml`. Kein sichtbarer Text im Code.
  - [x] Linien-Icons nur aus `src/ui/icons.tsx` (`ElementIcon`, `armored`, `shield`, `attack`); fehlt ein Zeichen (Runde/Uhr, falls kein `turns`-Icon), dort ergänzen, kein Emoji, keine Unicode-Symbole.
  - [x] Farben aus den bestehenden `el-<element>`-Tokens und den Pos-/Neg-Tokens von `DESIGN.md`; keine harten Schatten; Pille Radius und Höhe wie `hud-chip` (Tippziel in der Vorschau liegt auf „Angreifen“, das Band selbst ist nicht klickbar außer dem „?“ mit ≥ 44 px Treffer).
- [x] T3 Einbau in `ForecastCard` (AC 1, 2, 4, 5)
  - [x] `WeaponChip` bekommt optional `rune?: { element; tier }` und rendert `RuneStone`; Ziel-Chip als zweite Zeile in `hud-fc__id` unter dem Waffen-Chip (Platz: Kopf bleibt zwei Zeilen hoch bei 375 px, Namen nicht überdecken – siehe Notiz Story 14.7 im Code zum „?“).
  - [x] `<ElementBand />` zwischen Kopf und Tabelle, `<StatusLine />` nach der Tabelle; Faktor-Marke in `val()` bei `k === 'dmg'`; alten Element-Chip (~Zeile 501) und alten Status-Chip (~Zeile 596) entfernen.
  - [x] `content/core/handbook.yaml`: `anchor: elements` am Eintrag `elements` (Eintrag-ID `elements`), prüfen, dass `pnpm content:check` den Anker einmalig findet.
- [x] T4 Lab-Szenario und Beleg (AC 8)
  - [x] `tests/fixtures/lab/kampfvorschau-element.yaml` (Kopf wie `handy-ansicht.yaml`: Frage, Aufruf `?lab=kampfvorschau-element`, `__hc.lab(...)`, `pnpm lab kampfvorschau-element --forecast a b`): Karte `dev_terrain_warn` oder eine Fixture-Karte ohne Hindernisse; `units`/`add` mit
    1. Angreifer mit Axt und `fire_rune_2` (Brennen 30 %), Ziel „Windläufer“ mit Wind-Affinität in der Körperrüstung → Band „Feuer schlägt Wind · Schaden ×1,2“, Zeile „30 % Brennen · 2 Runden je X TP“;
    2. dasselbe Ziel ohne Rune für den Fall „ohne Rune fällt weg“ (zweites Szenario `kampfvorschau-element-leer` oder ein weiterer Gegner im selben Szenario);
    3. Ziel mit Schild `fire_rune_1` gegen dieselbe Axt → „Feuer · Schaden ×0,8“ mit Schild-Chip; ein viertes Ziel mit Wasser-Schild II → „Wasser hält Feuer ab“.
    Genaue Einheiten-Syntax in `src/lab/scenario.ts` (Kopfkommentar, `add` im Karten-Einheitenformat mit `equip`/`runes`); die Fälle dürfen auf mehrere Szenario-Dateien verteilt werden, wenn eine Lage nicht alle Ziele trägt.
  - [x] `tests/unit/lab.test.ts`: das Szenario lädt (`buildLab`) und `labAttack` bzw. `forecast` liefert die erwarteten Faktoren (×1,2, ×0,8, 1).
  - [x] Bild: Dev-Server, 375 × 812, Spiel stumm (alle Lautstärken 0), `?lab=kampfvorschau-element`, Tipp auf das Ziel, Screenshot (Maßstab 0,5) mit dem Mockup `art/mockups/ausruestung-2026-11/brett.html`, Teil „Runen in der Kampfvorschau“, Variante B, daneben. Beide Bilder im Browser-Fenster zeigen. Mockup und Spiel dürfen in Maßen abweichen (Platzhalter-Medaillons), nicht in Reihenfolge und Zeilenaufbau.
- [x] T5 Abschluss
  - [x] `pnpm check` grün (lint, test, content:check, build; Paket-Budget hält); `pnpm test:coverage` für `src/core` nicht gesenkt.
  - [x] Handbuch-Eintrag `elements` ergänzt, falls er die Schild-Rune noch nicht erwähnt (`see: [... runes]` besteht schon).

## Dev Notes

- **Quellen:** Epic 16, Story 16.12 und „Gilt für alle Stories“ (Branch `claude/quirky-murdock-e609cc`, `concept/26-epics/epics/epic-16.md`); `concept/25-ux/EXPERIENCE.md` Zeile „Kampfvorschau“ (Produktinhaber 2026-11-21, Thema 5, Variante B) und `concept/25-ux/DESIGN.md` Baustein `element-band`; Mockup `art/mockups/ausruestung-2026-11/brett.html`, Funktion `forecast(P)` (Band `.band`, Status `.stat`, Marke `.mult`, Sheet `sheet(P)` = Elementrad). Mockup-Rechnung ist Platzhalter, die Zahlen kommen aus dem Kern.
- **Ist-Stand der Vorschau:** `ForecastCard` in `src/app/screens/BattleHud.tsx` (~464): Kopf `hud-fc__head` mit `who()` (Medaillon, Name, `WeaponChip`, Dreieck-Chip, „wirksam“, Element-Chip `±n %`), Tabelle `hud-fc__table` (Schaden, Treffer, Krit, TP danach), darunter Chips `hud-fc__notes` (Balliste, Zielen, **Status-Chips des Angreifers mit `HelpStone anchor="status.<id>"`**, Tandem, Wache, Konter zuerst, Rückstoß, `HelpStone anchor="forecast"`). Styles in `src/ui/hud.css` (`.hud-fc*`, ~Zeile 682–730). Das Band ist ein **neuer** Baustein; er übernimmt die Status-Chips (die `HelpStone`-Anker `status.<id>` bleiben an der Zeile erhalten, sonst verliert der Spieler den Weg zum Handbuch).
- **Forecast-Kern:** `SideForecast` (`combat.ts` ~16) hat bereits `element`, `elementMult` und `status: [{status, chance}]`; `knockback`-Ziel ebenfalls. Es fehlen Stufe, Schutzquelle und Dauer/Schaden (AC 7). `elementMultiplier(data, el, aff, defTags, guard?)` trägt seit 16.4 den Schild; nicht kopieren. Tests `tests/unit/shield-runes.test.ts` zeigen die Hilfen `dmg`/`burnChance` und den Aufbau (`forecast(data, s, a.uid, d.uid)`).
- **Abhängigkeiten:** 16.4 (Schild-Rune, `EffectiveStats.shield`, `balance.element.shieldRune`) ist auf diesem Branch umgesetzt (uncommitted) und Voraussetzung. 16.6 (Rune im Metall der 3D-Waffen) ist ein anderer Strang und für dieses Band nicht nötig: Runenstein und Band sind 2D-HUD aus Daten. Berührung nur im Beleg-Bild: das Leuchten der Waffe auf dem Brett hinter der Vorschau („voll in der Vorschau“, Art Direction §4.7) kommt erst mit 16.6; fehlt es beim Screenshot, ist das kein Fehler dieser Story. Reihenfolge laut Epic: 16.12 nach 16.4 und 16.6; bauen darf man nach 16.4, Abnahme der Optik nach 16.6.
- **Erhalten:** Dreieck-Chip, „wirksam“, „flieht“, Tandem, Wache, Zielen, Balliste, Rückstoß-Vorschau (`knockback` mit Zielfeld auf dem Brett), blinkende Lebensleiste. Vorschau für Zauber (`ClassPreviewCard`) bleibt unberührt.
- **Konventionen (AGENTS.md):** Werte in `balance.yaml`; Texte DE+EN als Schlüssel; Beträge Symbol + Zahl; keine Emojis, nur `icons.tsx`; Styles in eigener CSS-Datei neben der Komponente; `src/core` ohne DOM/`Math.random`; Code und Bezeichner Englisch. Große Dateien nicht ganz lesen (`BattleHud.tsx`: nur `ForecastCard`, `WeaponChip`). Kein `content:lock`.
- **Offene Punkte:** keiner der O1–O5 berührt; Texte der Sätze sind aus dem Mockup übernommen, Feinwortlaut („hält … ab“) im Beleg-Bild prüfen.

### Project Structure Notes

- Core: `src/core/rules/combat.ts` (`SideForecast`, `calcSide`), `src/core/rules/effects.ts` (Brandschaden), `src/core/balanceDefs.ts` nur lesen
- UI: `src/app/screens/ElementBand.tsx` + `ElementBand.css` (neu), `src/app/screens/BattleHud.tsx` (Einbau), `src/app/screens/HelpStone.tsx` (unverändert), `src/ui/icons.tsx` (nur bei fehlendem Zeichen)
- Content: `content/core/handbook.yaml` (Anker), `content/core/locales/{de,en}.yaml`
- Tests: `tests/unit/forecast-element.test.ts` (neu), `tests/unit/lab.test.ts`, `tests/fixtures/lab/kampfvorschau-element.yaml` (neu)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- Lab-Schlüssel `locked: []` neu in `src/lab/scenario.ts` (Standard-Knoten sperrt Runen/Elemente); Kämpfer der Lab-Szenen sind `brigand` (Breaker hat Rückstoß-Skill), Schild-Ziel `breaker`.

### Completion Notes List

- Kern: `SideForecast.elementTier/guard/statusTurns`, `armorGuard` (items.ts), `burnDamage` (effects.ts, von `startOfPhase` mitbenutzt). `guard` erscheint auch ohne Waffenelement (Ziel-Chip); Wahl nach Faktor, Rüstung bei Gleichstand.
- [ASSUMPTION] Ein Schild mit anderem Element als die Waffe ändert den Faktor nicht (16.4); „Wasser hält Feuer ab“ im Lab kommt daher aus einer Wasser-Rüstung II, nicht aus einem Wasser-Schild. Rückstoß bleibt in der Status-Zeile ohne TP-Teil, Rückstoß-Chip in `hud-fc__notes` entfiel. Neue Icons `armored`, `hp`, `turns`.
- Bild-Beleg (Screenshot 375 x 812 neben Mockup) macht der Auftraggeber; Lab: `?lab=kampfvorschau-element`.

### File List

- src/core/rules/combat.ts, items.ts, effects.ts; src/lab/scenario.ts
- src/app/screens/ElementBand.tsx, ElementBand.css (neu), BattleHud.tsx; src/ui/icons.tsx
- content/core/locales/de.yaml, en.yaml; content/core/handbook.yaml
- tests/unit/forecast-element.test.ts, element-band.test.ts (neu), lab.test.ts; tests/fixtures/lab/kampfvorschau-element.yaml (neu)

## Review 2026-11-27

**Urteil: DONE (ein Beleg offen).** Kern (`SideForecast.elementTier`/`guard`, `src/core/rules/combat.ts:30,32`), `ElementBand.tsx`/`.css`, `anchor: elements` (`content/core/handbook.yaml:101`), Lab `tests/fixtures/lab/kampfvorschau-element.yaml`; `element-band.test.ts` und `forecast-element.test.ts` grün (18 Tests).
- Wirklich offen: Bild-Beleg aus AC 8 (Screenshot 375 × 812 neben dem Mockup) wurde nie gemacht; Status bleibt done.
- **Nachgeholt 2026-11-28:** Bild-Beleg AC 8: `screens-16-12/vorschau-element-band-375x812.jpg` (Lab `kampfvorschau-element`, Axt-Kämpferin gegen Wind-Rüstung: „Feuer schlägt Wind · Schaden ×1,2“, Band über den Zeilen) und daneben mit dem Mockup (`brett.html`, Teil 3, Variante B): `screens-16-12/vorschau-element-band-spiel-links-mockup-rechts.jpg`. Reihenfolge und Zeilenaufbau stimmen überein.
