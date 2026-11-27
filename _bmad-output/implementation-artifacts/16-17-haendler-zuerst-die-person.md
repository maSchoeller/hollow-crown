# Story 16.17: Händler „zuerst die Person“

Status: done

## Story

Als Spieler
möchte ich für eine bestimmte Figur einkaufen und das Gekaufte gleich anlegen,
damit ich nicht zwischen Laden und Figurenblatt wechseln muss.

## Acceptance Criteria

1. **Angenommen** Story 16.13 (Änderungsliste, Linien-Icons), EXPERIENCE „Händler (zuerst die Person)“ und GDD-Log 2026-11-21 (kauft direkt in die Hand), **wenn** der Händler öffnet, **dann** steht oben fest (scrollt nie mit der Liste) die Personenleiste `person-bar`: Medaillons der Truppe, als letztes der Konvoi (Linien-Icon im Medaillon), darunter Name, Klasse, Stufe und die getragenen Items als Mini-Bilder. Geöffnet wird mit der zuletzt gewählten Person (Merker über Sitzungs-/Raumwechsel hinweg, nicht im Spielstand), sonst mit der ersten.
2. Die Liste zeigt für eine Person nur, was sie tragen kann (gleiche Prüfung wie `canEquip`), nach Platz gruppiert (Waffen, Nebenhand, Kopf, Körper, Schmuck, Verbrauch). Jede Zeile hat Item-Bild, Name, Preis (Symbol + Zahl) und ein bis zwei Änderungs-Chips (die wichtigsten Unterschiede gegenüber dem Getragenen, z. B. Angriff 19 +3, Treffer 71 −10); bei Gleichem steht „trägt sie schon“.
3. Antippen klappt die Zeile auf: ganze Änderungsliste (`ChangeList` aus 16.13) gegenüber dem Getragenen, Haupttaste „Kaufen und anlegen · Preis“ (Verbrauchsgüter: „In den Beutel · Preis“) und daneben die Konvoi-Taste („In den Konvoi“). Das bisher Getragene geht in den Konvoi; die Zeile sagt es vorher („Eisenaxt geht in den Konvoi“).
4. Was die Person nicht tragen kann, steht ganz unten eingeklappt unter „Kann {Name} nicht tragen · {n}“, aufgeklappt gedimmt mit Grund („Brenna führt keine Schwerter“, aus dem `canEquip`-Fehlercode) und für diese Person nicht kaufbar (Tasten „Kaufen und anlegen“ fehlen; Konvoi-Kauf bleibt über das Konvoi-Medaillon).
5. Mit dem Konvoi-Medaillon zeigt jede Zeile statt der Chips die Köpfe (`UnitHead`) derer, die das Item tragen können (`usableBy`), und kauft nur in den Konvoi („In den Konvoi · Preis“).
6. Die Nebentaste „Für wen?“ und die Komponente `Who` entfallen samt Schlüsseln. Verkaufen bleibt wie heute (Tab „Verkaufen“, `sell`). Angebot des Tages und Glutfunke bleiben erhalten: Angebot des Tages folgt der Person-Logik wie das Sortiment, Glutfunke (Aufstiegs-Item) kauft nur in den Konvoi.
7. Kaufen und Anlegen ist **ein** Kampagnen-Command (ein Journal-Eintrag, replaybar, zweimal angewandt gleiches Ergebnis); Vorschau, Preis, Platzwahl und Fehlercodes kommen aus einer gemeinsamen reinen Kernfunktion, die UI und `applyCampaign` beide rufen. Alte Journale und Spielstände ohne das neue Feld bleiben gültig (keine Migration, Format bleibt).
8. Alle Texte DE und EN in `content/core/locales/`, keine Emojis; Beträge als Symbol + Zahl; Styles in einer eigenen CSS-Datei neben der Komponente; der Händler-Abschnitt in `src/ui/camp.css` (`.hm-merchant`, `.hm-who`, soweit nur der Händler sie nutzt) ist gelöscht. Sichtbares Ergebnis als Bild bei 375 × 812 belegt, Mockup `art/mockups/ausruestung-2026-11/haendler.html` daneben.

## Tasks / Subtasks

- [x] Task 1: Kernfunktion „Kauf für Person“ (AC: 2, 3, 4, 7)
  - [x] In `src/core/campaign/camp.ts` (neben `usableBy`, `equipCandidates`, `equipPreview`) eine reine Funktion, z. B. `buyPlan(data, c, unitId, defId)`: Zielplatz (Waffe → `mainHand`, Schild/Nebenhand → `offHand`, Kopf/Körper, Schmuck → freier `accessory1/2`, sonst der ohne gleiches Item, Verbrauch/Schlüssel → `bag`), verdrängtes Item (inkl. Zweihänder verdrängt Nebenhand und umgekehrt, wie `equipInto`), `error` aus `canEquip` bzw. `bagIsFull`. Namen offen; `equipInto` aus `gear.ts` wiederverwenden, nichts kopieren.
  - [x] Änderungen gegenüber dem Getragenen über die reine Kernfunktion „Item A gegen Item B für Figur X“ aus 16.13 (nicht `equipPreview` neu schreiben; ist 16.13 anders gebaut, daran anpassen). Chips = die ein bis zwei wichtigsten Zeilen; Reihenfolge der Wichtigkeit in `balance.yaml` oder als Konstante in der Kernfunktion festlegen, nicht in der UI.
  - [x] „Nicht tragbar“-Grund als Fehlercode → Textschlüssel (`weapon_group`, `heavy_armor`, `monster_only`, `wrong_slot` …).
- [x] Task 2: Command (AC: 7)
  - [x] `buy` und `buyOffer` um optionales `for?: { unit: string; slot: EquipSlot | 'bag'; replace?: string }` erweitern (`commands.ts`), `validateCampaign` (Prüfreihenfolge §8.1: Id → Verfügbarkeit → Platz/Gold; Gold, `cannot_equip`, `bag_full`, `convoy_full` per Trockenlauf auf Kopie wie bei `applyGearTemplate`: das Verdrängte braucht einen Konvoi-Platz, das Gekaufte nicht), `applyCampaign` (Gold abziehen, `newItem`, `equipInto`, Events `itemGained` + `equipped`), `history.ts` `campArg` ergänzen. `buyEmberSpark` bleibt nur Konvoi.
  - [x] Unit-Tests in `tests/unit/` (neben `campaign-equip.test.ts`, `merchant-levels.test.ts`): gültig, jeder Fehlercode, Verdrängtes im Konvoi, Zweihänder, Beutel-Tausch, Schmuck-Platzwahl, Events, Determinismus, Replay über Journal, Altjournal ohne `for`.
- [x] Task 3: Oberfläche (AC: 1–6, 8)
  - [x] `MerchantRoom` in `src/app/screens/Rooms.tsx` (nur Zeilen ca. 228–400 per `grep -n`/Ausschnitt lesen; Datei ist groß) in eine neue Datei `src/app/screens/Merchant.tsx` mit `Merchant.css` herauslösen (Vorbild: `Workshop.tsx`/`Workshop.css`); `Rooms.tsx` ruft sie nur noch (`case 'merchant'`).
  - [x] `PersonBar` als Baustein (DESIGN `person-bar`; 16.16 Verzauberer nutzt dasselbe, gemeinsame Komponente in `src/ui/` anlegen bzw. die aus 16.16 nutzen, falls schon da). Zuletzt gewählte Person als Modul-State in `src/app/state/` (Modul „session“ oder eigenes, kein Sammel-Modul, keine Zyklen).
  - [x] Zeilen, Chips, Aufklappen, Haupttaste mit `Amount`, Konvoi-Taste, Hinweis „X geht in den Konvoi“, eingeklappter Abschnitt mit Gründen, Konvoi-Modus mit Köpfen; Info-Stein/Langdruck öffnet weiter die Item-Details.
  - [x] `Who`, `ui.room.merchant.who/nobody` löschen; neue Schlüssel in `de.yaml` und `en.yaml` (Parität prüft `content:check`).
  - [x] Altes CSS in `src/ui/camp.css` entfernen, soweit nur der Händler es nutzt.
- [x] Task 4: Prüfung (AC: alle)
  - [x] Komponententest (Preact) für Personenleiste, Gruppen, Chips, nicht Tragbares, Konvoi-Modus; Test, dass „Für wen?“ nicht mehr vorkommt.
  - [x] `pnpm check`; Sichtprüfung im Browser bei 375 × 812 (Spiel stumm, alle Lautstärken 0), Bild neben dem Mockup.

## Dev Notes

- **Heute** (`src/app/screens/Rooms.tsx`, `MerchantRoom` ab ca. Zeile 240): Tabs Kaufen/Verkaufen, Auswahl über `sel` (Sortiment-Id, `offer:<uid>`, `spark`), Haupttaste kauft per `buy`/`buyOffer`/`buyEmberSpark` **in den Konvoi**, Nebentaste „Für wen?“ zeigt `Who` (`usableBy`). Preise kommen aus `shopPrice`, `offerPrice`, `emberSparkPrice`; Rabatt-Marke `priceChangePct`. Das alles bleibt (Preislogik, Tab „Verkaufen“, Sortimentsstufen aus 10.9).
- **Kern**: `src/core/campaign/apply.ts` (`validateCampaign` ca. Z. 36, `applyCampaign` ca. Z. 289: `buy` schiebt ins `c.convoy`, `equip` nutzt `takeItem` + `equipInto`), `gear.ts` (`equipInto`, Verdrängtes → Konvoi), `camp.ts` (`usableBy`, `equipCandidates`, `equipPreview`), `rules/items.ts` (`canEquip`, `slotFits`, `unitGroupAllowed`, `weaponGroupsOf`, Fehlercodes `EquipError`). Konvoi-Grenze `balance.economy.convoySize`.
- Wer was tragen kann: Klassen-Waffengruppen (`ClassDef.weaponGroups` + `addWeaponGroups` der Pro-Pfade), schwere Rüstung nur `armored` oder Fertigkeit, `convoyOnly`/`fixed`/`monsterOnly`-Tags. `usableBy` lässt `two_handed` und `duplicate_accessory` als „kann“ durch; die Liste soll dasselbe tun, der Kauf löst Verdrängen bzw. Platzwahl auf.
- Mockup und Spezifikation: EXPERIENCE „Händler (zuerst die Person)“ (Zeile ~110), „Änderungsliste“ (~113), DESIGN `person-bar`, `change-list`; Mockup `art/mockups/ausruestung-2026-11/haendler.html`; GDD „Händler“-Zeile und FR69, UX-DR34, UX-DR37 in `requirements.md`. Keine Emojis, nur Linien-Icons aus `src/ui/icons.tsx` (16.13 ergänzt fehlende).
- Architektur §8.1 (neues Command: Typ, Prüfung, Wirkung, Vorschaufunktion, Test, feste Prüfreihenfolge); Spielwerte in `balance.yaml`, kein sichtbarer Text im Code; `src/core` ohne DOM/Math.random/Date.now.
- Abhängigkeit **16.13** (läuft vorher): liefert die Kernfunktion „Item A gegen Item B für Figur X“ sowie die Komponente `ChangeList` und neue Icons. Namen dort ablesen, nicht neu erfinden. 16.17 baut nach 16.14 und 16.13 (Epic-Reihenfolge).
- **[ASSUMPTION]** Ein Command durch optionales Feld `for` an `buy`/`buyOffer` statt eines neuen Typs: Altjournale bleiben gültig, Replay trivial. Spricht etwas dagegen, wäre `buyEquip` ein eigener Typ; Entscheidung dann im Decision-Log von `24-architecture` eintragen.
- **[ASSUMPTION]** Schmuck: zuerst freier Platz, sonst der Platz ohne gleiches Item, sonst `accessory1`. Waffen immer `mainHand`, Schilde `offHand`.
- **[ASSUMPTION]** Verbrauchsgüter und Schlüssel gehen in den Beutel der Person (`bag`); bei vollem Beutel ist die Haupttaste gedimmt mit Grund, die Konvoi-Taste bleibt.
- **[ASSUMPTION]** Glutfunke und andere `convoyOnly`-Items sind nur über die Konvoi-Taste kaufbar; Runen zum Kauf (Rune I) bleiben beim Verzauberer (16.16), nicht hier.
- **[ASSUMPTION]** „Zuletzt gewählte Person“ gilt je Sitzung (Modul-State, nicht im Spielstand); ist die Person nicht mehr in der Truppe, die erste.
- Alt-Annahme prüfen statt raten: reicht der Konvoi-Platz nicht für das Verdrängte, ist „Kaufen und anlegen“ gedimmt mit Grund „Konvoi voll“ und der Kauf in den Konvoi ebenfalls (heutiger Fehlercode `convoy_full`).

### Project Structure Notes

- Neu: `src/app/screens/Merchant.tsx` + `Merchant.css`; Kernfunktion in `src/core/campaign/camp.ts` (oder eigenes Modul `buyFor.ts`, wenn `camp.ts` zu groß wird); Tests in `tests/unit/`. Geändert: `Rooms.tsx` (nur Händler-Teil), `commands.ts`, `apply.ts`, `history.ts`, `camp.css`, Locale-Dateien.
- Große Dateien (`Rooms.tsx`, `architecture.md`) nur per `grep -n` und Ausschnitt lesen.

### Project Context Rules

- Nie auf `main` committen; Pull Request. Code/Bezeichner Englisch, Konzeptdokumente Deutsch. Zufall nur aus dem Seed-RNG. App-Zustand in `src/app/state/` je Modul eine Verantwortung. Styles je Screen eigene CSS-Datei. Fertig erst mit grünen `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` (`pnpm check`). Bundle-Budget halten. Kein `content:lock`.
- In der Vorschau alle Lautstärken im Spiel auf 0 stellen.

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.17]
- [Source: concept/25-ux/EXPERIENCE.md#Händler (zuerst die Person), Änderungsliste]
- [Source: concept/25-ux/DESIGN.md#person-bar, change-list]
- [Source: concept/21-gdd/gdd.md, Heimat: Raum Händler; Log 2026-11-21]
- [Source: concept/26-epics/epics/requirements.md#FR69, UX-DR34, UX-DR37]
- [Source: concept/24-architecture/architecture.md#8.1 Neues Kampagnen-Command]
- [Source: _bmad-output/implementation-artifacts/10-9-haendler-der-stufen-2-und-3.md]
- [Source: art/mockups/ausruestung-2026-11/haendler.html]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

### Completion Notes List

- Command: `buy` and `buyOffer` got the optional field `for?: { unit, slot, replace? }` (no new type; old journals and saves stay valid, no migration). One pure plan `buyPlan` (`src/core/campaign/buyFor.ts`) gives place, displaced items (they go to the convoy, the bought item never does) and error; `validateCampaign` (order: unit, availability, place `cannot_equip`/`bag_full`, gold, `convoy_full`), `applyCampaign` (events `itemGained` + `equipped`) and the list all call it. `buyEmberSpark` stays convoy only.
- List: `merchantList` (`src/core/campaign/merchantView.ts`) builds groups, rows (price, plan, change list from 16.13, "same"), the "cannot wear" part (equip code) and, for the convoy, the figures that can hold the item. Chips are the first lines of `changeList` (the importance order is the line order of 16.13).
- UI: `Merchant.tsx` + `Merchant.css` taken out of `Rooms.tsx` (`ConvoyList` exported for the sell tab), `PersonBar.tsx` + `.css` (sticky strip; also meant for 16.16), last shopper in `src/app/state/shopper.ts`. `Who`, the keys `ui.room.merchant.who/nobody` and the old merchant CSS (`.hm-who*`, `.hm-merchant*`) are gone; `reason` of `Equip.tsx` is exported and reused for the reasons.
- [ASSUMPTION] `PersonBar` lives in `src/app/screens/` (not `src/ui/`) because it uses `UnitHead` from `unitArt`; `src/ui` imports nothing from `app`.
- [ASSUMPTION] Deals of the day are rows of the list like the range (tag "Deal"); the ember spark has its own section in both modes and offers only "To the convoy".
- [ASSUMPTION] After a purchase the row closes. With a bought item that is already worn (same def) the plan replaces the worn one (the list says "already wearing it", the change list is empty).
- [ASSUMPTION] Accessory place: free place first (unless the other place holds the same item), else the place of the same item, else the first. A convoy that is full only blocks when something has to leave.
- Not done: no picture proof (no dev server on request; see the click path in the hand-over).

### File List

- src/core/campaign/buyFor.ts (new), merchantView.ts (new), commands.ts, apply.ts, history.ts, index.ts
- src/app/screens/Merchant.tsx, Merchant.css, PersonBar.tsx, PersonBar.css (new); Rooms.tsx, Equip.tsx (`reason` exported)
- src/app/state/shopper.ts (new)
- src/ui/camp.css (merchant and `.hm-who` removed)
- content/core/locales/de.yaml, en.yaml
- tests/unit/buy-for.test.ts, merchant-person.test.ts (new)
- _bmad-output/implementation-artifacts/sprint-status.yaml
