# Story 6.2: Ausrüsten mit Vergleich

Status: review

## Story

Als Spieler
möchte ich beim Ausrüsten sofort sehen, was besser oder schlechter wird,
damit Ausrüstung eine bewusste Entscheidung ist.

## Acceptance Criteria

1. **Liste je Platz:** Ein Platz einer Figur antippen öffnet die passenden Items aus Beutel und Konvoi mit Bild, Werten und Vergleich grün/rot gegen das Angelegte; Items, die die Rolle nicht führen darf, stehen gedimmt mit Grund. Der erste Tipp wählt, die Haupttaste („Handaxt anlegen“) führt das Kampagnen-Command `equip` aus; „Ablegen“ führt `unequip` aus.
2. **Konvoi:** Der Konvoi folgt demselben Listen-Muster mit Filter nach Art (umgesetzt als Raum-Panel des Lagers, Story 6.3: `ConvoyRoom` in `Rooms.tsx`).

## Tasks / Subtasks

- [x] T1 Kern: `equipCandidates`, `equipPreview` (gleiche Formeln wie der Kampf: `computeStats`, `weaponProfile`), `usableBy` in `core/campaign/camp.ts` (AC 1)
- [x] T2 UI: `Equip.tsx` (`EquipView`, `Deltas`), `FigureFlow` in `Troop.tsx`, `ItemLine` (AC 1)
- [x] T3 Texte: Waffenarten, Gründe, Tasten in `de.yaml`/`en.yaml`
- [x] T4 Tests: `tests/unit/camp.test.ts` (Kandidaten, Gründe, Vorschau, Command, „Für wen?“)
- [x] T5 Konvoi-Liste mit Filter nach Art (siehe 6.3)

## Dev Notes

- **Vergleich:** `equipPreview` rechnet Figur vorher/nachher mit `computeStats` und bei Waffen mit `weaponProfile`; grün/rot nach `better` (Gewicht und Last: weniger ist besser). Ein Beutelplatz zeigt keinen Vergleich.
- **Zweihänder:** erlaubt; die andere Hand geht in den Konvoi (wie im Command).
- **Mockup-Abweichung:** der Wurfspieß ist im Datenbestand eine Lanze, ein Vorkämpfer (Axt) darf ihn nicht führen; das Beispiel des Mockups zeigt daher die Handaxt.

### References

- [Source: concept/26-epics/epics.md#Story 6.2]
- [Source: concept/25-ux/mockups/06-truppe.html]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` grün; Browser: Brenna, Haupthand, Handaxt gewählt und angelegt (Command), Eisenlanze gedimmt mit Grund.

### Completion Notes List

- Konvoi-Filter folgt mit den Lager-Räumen (6.3).

### File List

- `src/app/screens/Equip.tsx` (neu), `src/app/screens/Troop.tsx`, `src/core/campaign/camp.ts`, `tests/unit/camp.test.ts` (neu), `content/core/locales/{de,en}.yaml`
