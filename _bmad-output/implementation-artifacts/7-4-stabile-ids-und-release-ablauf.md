# Story 7.4: Stabile IDs und Release-Ablauf

Status: review

## Story

Als Spieler
möchte ich, dass mein Spielstand jedes Update übersteht,
damit ich Akt für Akt mit derselben Truppe weiterspiele.

## Acceptance Criteria

1. `pnpm content:lock` schreibt beim Veröffentlichen eines Akts alle veröffentlichten IDs (Gefährten, Klassen, Items, Skills, Affixe, Sets, Knoten, Karten, Flags, Räume, Szenen) in `content/released-ids.json`; früher gesperrte IDs bleiben gesperrt.
2. `pnpm content:check` scheitert, wenn eine gesperrte ID fehlt und nicht mit vorhandenem Ziel in `content/renames.yaml` steht.
3. Jede Save-Migration hat einen Fixture-Spielstand und einen Test (erzwungen durch `tests/unit/migrations.test.ts`).
4. Der Release-Ablauf (`released: true`, `content:lock`, Migration, Pull Request) steht in `AGENTS.md`.

## Tasks / Subtasks

- [x] T1 Reine Regeln `src/content/ids.ts`: `ID_KINDS`, Schemas für `released-ids.json` und `renames.yaml`, `collectIds`, `mergeLock`, `checkLockedIds`, `renamedId` (AC 1, 2)
- [x] T2 `tools/content-lock.ts` + Skript `content:lock`; Karten und Szenen nur aus veröffentlichten Paketen (AC 1)
- [x] T3 `content:check` prüft die Sperre, sobald `released-ids.json` existiert; `renames.yaml` und `packs.yaml` gelten nicht als Content (`META_FILES`) (AC 2)
- [x] T4 `migrationFormats()` in `src/persistence/save.ts`; `tests/unit/migrations.test.ts`: Migration und Fixture je Format, jede Fixture ab Format 2 migriert zu einem gültigen aktuellen Stand (AC 3)
- [x] T5 Abschnitt „Akt-Release“ in `AGENTS.md` (AC 4)

## Dev Notes

- **Noch nicht gesperrt:** `released-ids.json` ist nicht eingecheckt. Akt 1 steht zwar mit `released: true` im Build, ist aber noch nicht als MVP veröffentlicht, und der PoC-Content ändert sich laufend (andere Sessions benennen IDs um). Ein Probelauf sperrt 208 IDs (8 Gefährten, 19 Klassen, 78 Items, 33 Skills, 15 Affixe, 2 Sets, 3 Knoten, 3 Karten, 6 Flags, 7 Räume, 34 Szenen). Die erste echte Sperre gehört zum MVP-Release (Story 9.14).
- **Leutnants** fehlen in der Liste, weil der Content sie noch nicht hat (Epic 3); `ID_KINDS` bekommt dann `lieutenants`.
- **Umbenennen:** `renames.yaml` je Art `alt: neu`, Ketten erlaubt (`renamedId` folgt ihnen, Schleifen brechen ab). Die Migration des Releases, das umbenennt, wendet `renamedId` auf die betroffenen Felder des Spielstands an; welche Felder das sind, hängt von der Art ab und wird mit der ersten echten Umbenennung geschrieben (heute gibt es keine Migration ab Format 2).
- **Fixtures:** Vorhanden sind `format1-auto.json` (PoC, nur Legacy) und `format2-auto.json`; der Test verlangt für jede Migration `format<n>-*.json`.

### References

- [Source: concept/26-epics/epics.md#Story 7.4]
- [Source: concept/24-architecture/architecture.md#5.15, #5.16, #12]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm content:lock` (Probelauf, danach verworfen): 208 IDs. `pnpm lint`, `pnpm test` (290 Tests), `pnpm content:check`, `pnpm build` grün.

### Completion Notes List

- Offen für den Produktinhaber: Zeitpunkt der ersten Sperre (Vorschlag: mit dem MVP-Release, Story 9.14).

### File List

- src/content/ids.ts (neu), tools/content-lock.ts (neu), tests/unit/migrations.test.ts (neu)
- tools/content-check.ts, src/content/node.ts, src/content/packs.ts, tools/build/packs-plugin.ts
- src/persistence/save.ts, package.json, AGENTS.md
- concept/24-architecture/decision-log.md
