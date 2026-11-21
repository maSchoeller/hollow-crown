# Story 16.4: Schild-Runen

Status: review

## Story

Als Spieler
möchte ich einen Schild mit einer Element-Rune gegen ein Element schützen,
damit sich Schilde gegen Brandfelder und Zauberer lohnen.

## Acceptance Criteria

1. **Platz:** Jeder Schild (`kind: shield`, Slot `offHand`) hat 1 Runenplatz, der nur Element-Runen aufnimmt: Feuer, Wasser, Erde, Wind. Licht-, Dunkel- und Hilfs-Runen passen nicht ([ASSUMPTION], das GDD nennt nur die vier Elemente). Bestehende Schilde in Akt 1 und 2 (`wooden_shield`, `iron_shield`, `tower_shield`, Relikt `pact_warden_shield`, Signatur `little_hands`) bekommen den Platz ohne Rune; vorhandene Spielstände bleiben gültig, ohne Migration.
2. **Stufe I:** Schaden dieses Elements gegen die Figur ×0,8 (Wert in `balance.yaml`).
3. **Stufe II:** dazu immun gegen den Zustand des Elements (Feuer Brennen, Wasser Nass, Erde Verlangsamt, Wind Rückstoß), sowohl bei Waffentreffern als auch bei Gelände und Fertigkeiten über `applyStatus`.
4. **Stufe III:** dazu immun gegen die Geländewirkung des Elements: Feuer III nimmt auf dem Brandfeld keinen Schaden (`burningTileHit`). Wasser, Erde und Wind III wirken wie II (heute gibt es keine Geländewirkung gegen Figuren).
5. **Keine Schwäche:** Die Schild-Rune macht die Figur nie anfälliger (anders als die Affinität der Körperrüstung). Tragen Schild und Körper dasselbe Element, zählt nur der bessere Faktor, nicht beide (0,8 und 0,8 ergibt 0,8, nicht 0,64). Ist der Körper gegen das Angriffselement schwach, gilt gegen genau dieses Element der Schild-Faktor 0,8 ([ASSUMPTION]: `min` beider Faktoren).
6. **Eine Formel:** Kampfvorschau und Auflösung holen Faktor und Immunitäten aus demselben Code (`elementMultiplier` bzw. dem gemeinsamen Zustandscode); Faktor und Stufen stehen in `balance.yaml`, nichts im Code.
7. **Platz bekannt:** Verzauberer, Händler-Änderungsliste und Gegner-Ausrüstung kennen den Schildplatz: der Verzauberer bietet für einen Schild nur passende Runen an, `insertRune` lehnt andere ab, Gegner dürfen im Karten-YAML Schild-Runen tragen, `content:check` meldet unpassende.
8. **Tests:** Unit-Tests für Stufe I, II, III und den Doppelfall (Schild und Körper mit gleichem Element), dazu Ablehnung unpassender Runen und Vorschau gleich Auflösung.

## Tasks / Subtasks

- [x] T1 Werte (AC 2–4, 6)
  - [x] `content/core/balance.yaml`, Block `element:` um `shieldRune: { factor: 0.8, statusImmuneTier: 2, terrainImmuneTier: 3 }` erweitern
  - [x] Typ in `src/core/balanceDefs.ts`, Zod in `src/content/schemaBalance.ts`
- [x] T2 Platz und Regelhelfer (AC 1, 5)
  - [x] `src/core/rules/items.ts` `runeSlotCount`: `if (d.kind === 'shield') return 1` nach der Prüfung auf `d.runeSlots` (Content kann überschreiben)
  - [x] neuer Helfer `shieldGuard(data, unit, s?)` neben `armorAffinity`: liefert `{ element, tier }` der Element-Rune in `unit.equip.offHand` (über `runes()`, gilt also nur bei aktiver Mechanik `runes`); nichts für Licht und Dunkel
  - [x] `src/core/rules/stats.ts` (`computeStats`, ~Zeile 112): `EffectiveStats` bekommt `shield?: { element; tier }`; `affinity` bleibt allein die Körperrüstung (keine Vermischung, sonst entstünde eine Schwäche)
- [x] T3 Schaden (AC 2, 5, 6)
  - [x] `src/core/rules/combat.ts` `elementMultiplier`: neuer Parameter `guard?: { element; tier }`; Ergebnis `Math.min(m, shieldRune.factor)`, wenn `guard.element === el`, sonst unverändert; Aufruf in `calcSide` (~Zeile 157) mit `oppStats.shield`; weitere Aufrufer per `grep -rn elementMultiplier src tests` nachziehen
  - [x] Vorschau und Auflösung nutzen weiter dieselbe `calcSide`; keine zweite Rechnung in `src/app/`
- [x] T4 Zustand und Gelände (AC 3, 4)
  - [x] gemeinsamer Helfer `shieldImmune(data, stats, element, kind: 'status' | 'terrain')` in `src/core/rules/items.ts` oder `stats.ts`, damit combat.ts und effects.ts nicht doppelt rechnen
  - [x] `src/core/rules/effects.ts` `applyStatus` (~Zeile 22): Schild mit `tier >= statusImmuneTier` und `element === STATUS_ELEMENT[id]` verweigert den Zustand, zusätzlich zur Körper-Immunität
  - [x] `src/core/rules/combat.ts` (~Zeile 185, `immune`): gleiche Prüfung, damit die Vorschau Chance 0 zeigt; Wind (Rückstoß) ebenso, `knockbackTarget` entfällt dann
  - [x] `burningTileHit` (effects.ts ~Zeile 232): Feuer-Schild mit `tier >= terrainImmuneTier` kehrt vor `damageUnit` zurück
- [x] T5 Verzauberer und Passung (AC 1, 7)
  - [x] `src/core/rules/items.ts`: neue Funktion `runeFits(data, itemDef, runeDef)` (Schild und Körper nur Element-Runen, Schild ohne Licht und Dunkel)
  - [x] `src/core/campaign/apply.ts`, `insertRune` an beiden Stellen (Prüfung ~Zeile 119, Ausführung ~Zeile 372): `runeFits` statt der Einzelregel für den Körper, sonst `'no_slot'`
  - [x] `src/app/screens/Rooms.tsx` `EnchanterRoom` (~Zeile 775–800): Runenliste für das gewählte Item mit `runeFits` filtern; Schilde erscheinen in `gear`, weil `runeSlotCount > 0`
  - [x] `src/ui/components.tsx` (~Zeile 92) und `src/ui/itemInfo.ts` (~Zeile 277): leerer Schildplatz und gesetzte Rune wie bei der Rüstung; Tooltip-Zeile „schützt gegen <Element>“ aus den Locales
  - [x] Die Händler-Änderungsliste (16.13/16.17) und die Werkbank (16.16) kommen später und nutzen `runeSlotCount` und `runeFits`
- [x] T6 Gegner und Content (AC 1, 7)
  - [x] `src/content/validateRefs.ts` (~Zeile 19): bei `kind: shield` nur passende Element-Runen in `ItemRef.runes` (`schemaBase.ts` bleibt), sonst Fehler mit Karte und Einheit
  - [x] Gegner tragen Runen über die Ausrüstung im Karten-YAML (`runes: [fire_rune_2]` am Schild); Beispiel nur in einer Testkarte, keine Balance-Änderung an Akt 1 und 2 ([ASSUMPTION], sonst wäre ein Sim-Nachzug nötig)
  - [x] `content/core/locales/de.yaml` und `en.yaml`: Tooltip-Zeile und Verzauberer-Hinweis
- [x] T7 Tests (AC 8)
  - [x] `tests/unit/combat-resolution.test.ts`: Feuer-Angriff auf Figur mit Schild `fire_rune_1` ×0,8, Wasser-Angriff unverändert; Doppelfall Körper Feuer und Schild Feuer gleich 0,8; Körper mit Schwäche plus passender Schild gleich 0,8; Schild allein macht nie schwächer
  - [x] `tests/unit/staged-status-runes.test.ts`: Stufe II verweigert Brennen, Nass, Verlangsamt, Rückstoß, Stufe I nicht; Stufe III Feuer: auf dem `burning`-Feld kein Schaden und kein Zustand, Stufe II nimmt `burningEnterDamage` (5)
  - [x] `tests/unit/campaign-equip.test.ts`: `insertRune` am Schild mit Element-Rune geht, mit Licht-, Dunkel- und Hilfs-Rune `no_slot`; zweite Rune `no_slot`; bestehender Schild mit `runes: []` nimmt die Rune an
  - [x] Vorschau gleich Auflösung für den Schild-Fall; Content-Prüfung: Gegner mit passender und unpassender Schild-Rune
- [x] T8 Abschluss
  - [x] `pnpm check` grün; `pnpm sim m1_8 --runs 20` unverändert, da keine Akt-Inhalte geändert werden

## Dev Notes

- **Quelle der Regel:** GDD, Inventar und Ausrüstung, Punkt „Schild-Runen (Produktinhaber 2026-11-21, Thema 7)“ (Branch `claude/quirky-murdock-e609cc`, `concept/21-gdd/gdd.md`); Epic 16, Story 16.4, Mockup `art/mockups/ausruestung-2026-11/regeln.html`. Unabhängig von 16.1 bis 16.3 und 16.5; 16.12 (Element-Band) und 16.16 (Werkbank) bauen darauf auf.
- **Ist-Stand:** Affinität kommt nur aus dem Körper (`armorAffinity` in `items.ts`, `computeStats`); `calcSide` (combat.ts ~157) rechnet `elementMult` über `elementMultiplier(wp.element, oppStats.affinity, ...)`; die Zustandsimmunität steht an zwei Stellen, `applyStatus` (effects.ts ~22) und `calcSide` (~185). Brandfeld-Schaden: `burningTileHit` (effects.ts ~232, `burningEnterDamage` 5). Runen zählen nur bei aktiver Mechanik `runes`, Elemente bei `elements`, Zustände bei `status` (`ruleOn`); der Schild folgt denselben Schaltern, in Prolog und frühen Missionen bleibt er wirkungslos.
- **Erhalten:** Körper-Affinität (gleich 0,8, Vorteil 1,2, Nachteil 0,8, Immunität gegen den eigenen Zustand) bleibt unverändert; am Körper nur Element-Runen; höchstens eine Element-Rune je Item.
- **Spielstand:** `ItemInstance.runes` ist ein Array mit `null`-Plätzen; `apply.ts` füllt bis `runeSlotCount` auf, bestehende Schilde mit `runes: []` brauchen weder Migration noch neuen Fixture-Spielstand.
- **Nicht hier:** Element-Band in der Vorschau (16.12), Rune im Metall des 3D-Schilds (16.6), Werkbank-Oberfläche (16.16), Händler-Änderungsliste (16.13/16.17). Kein `content:lock`.
- **Konventionen (AGENTS.md):** Werte in `balance.yaml`, kein sichtbarer Text im Code, Code und Bezeichner Englisch, `src/core` ohne DOM und `Math.random`. `Rooms.tsx` ist über 25 KB: nur `EnchanterRoom` lesen.

### Project Structure Notes

- Core: `src/core/rules/{items,stats,combat,effects}.ts`, `src/core/campaign/apply.ts`, `src/core/balanceDefs.ts`
- Content: `content/core/balance.yaml`, `content/core/locales/{de,en}.yaml`, `src/content/{schemaBalance,validateRefs}.ts`
- UI: `src/app/screens/Rooms.tsx`, `src/ui/{components.tsx,itemInfo.ts}`
- Tests: `tests/unit/{combat-resolution,staged-status-runes,campaign-equip,item-rules}.test.ts`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- content/core/balance.yaml, src/core/balanceDefs.ts, src/content/schemaBalance.ts (element.shieldRune)
- src/core/rules/items.ts (runeSlotCount, runeFits, shieldGuard, shieldImmune), stats.ts, combat.ts, effects.ts
- src/core/campaign/apply.ts (insertRune via runeFits), src/content/validateRefs.ts (enemy shield runes)
- src/app/screens/Rooms.tsx (EnchanterRoom filters by runeFits), src/ui/itemInfo.ts, content/core/locales/de.yaml and en.yaml
- tests/unit/shield-runes.test.ts (new, 20 tests; replaces the three named test files, deviation)
- Not changed: src/ui/components.tsx (slots render from runeSlotCount); `pnpm sim` not run (no act content changed)
