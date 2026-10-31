# Story 14.1: Handbuch als Content

Status: done

## Story

Als Entwickler
möchte ich Handbuch-Einträge als YAML mit Schema anlegen,
damit Texte, Werte und Verweise geprüft werden und nie im Code stehen.

## Acceptance Criteria

**Angenommen** `content/core/handbook.yaml` mit Zod-Schema (Kategorien in fester Reihenfolge; Einträge mit id, Kategorie, Grafik-Typ, Wert-Verweisen, Querverweisen, optionalem Kontext-Anker)
**Wenn** `pnpm content:check` läuft
**Dann** scheitert er bei fehlendem DE- oder EN-Schlüssel unter `handbook.*`, bei einem Wert-Verweis, der sich nicht auflöst (z. B. `balance.triangle.hit`, `terrain.forest.avoid`, `classes.vanguard.mov`), bei Querverweisen auf unbekannte Einträge und bei doppelten Kontext-Ankern
**Und** eine reine Funktion löst Wert-Verweise gegen `GameData` auf (getestet); kein Zahlenwert steht als Text im YAML.

## Tasks / Subtasks

- [x] T1 Typen `HandbookDef`/`HandbookEntryDef`/`HandbookValueDef` in `src/core/defs.ts`, `GameData.handbook`
- [x] T2 Zod-Schema `handbookSchema` (Kategorien in fester Reihenfolge, Einträge mit id, Kategorie, Grafik-Typ, Wert-Verweisen mit Format und Symbol, Querverweisen, Kontext-Anker, `terrain`/`class`/`lesson`, `fromAct`), geladen aus `content/core/handbook.yaml`
- [x] T3 Reine Funktionen in `src/core/handbook.ts`: `resolveHandbookRef` (Pfad gegen `GameData`), `formatHandbookValue`, `handbookParams` (Werte als `{id}` in den Texten), `entryAnchors`/`entryByAnchor`, `searchHandbook`, `cycleOrder`
- [x] T4 `src/content/validateHandbook.ts` in `content:check`: DE/EN-Schlüssel, Wert-Pfade, Querverweise, doppelte Anker, jedes Gelände genau ein Eintrag, Pflicht-Anker (Vorschau, jeder Zustand), keine Ziffern und nur bekannte Platzhalter in Eintragstexten
- [x] T5 Tests `tests/unit/handbook.test.ts`

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 14, Verhalten `concept/25-ux/EXPERIENCE.md` („Handbuch“, Kontext-„?“), Aussehen `concept/25-ux/DESIGN.md` (Handbuch-Kategorie, Handbuch-Eintrag, `help-stone`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §8.3 und Decision-Log 2026-10-30.
- Inhalt: `content/core/handbook.yaml`, Texte `content/core/locales/de.handbook.yaml` und `en.handbook.yaml`; Werte sind Pfade in die Content-Daten, Texte setzen sie als `{id}` ein.
- Kein neues Speicherformat: Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil des Epics.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 14 auf dem Branch `claude/elegant-wozniak-3p2ee2`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Titel → Handbuch und Prolog-Kampf, ohne LFS-Grafik).
- Offen zur Abnahme: Texte DE + EN durch den Produktinhaber.

## Abnahme (2026-10-31)

Abgenommen im Spiel (Titel, Kampfmenü, Kontext-„?“ an Lektion und Kampfvorschau) und gegen den Code geprüft; Texte DE + EN vom Produktinhaber abgenommen. Bei der Abnahme behoben: Kontext-„?“ auch an den Zustands-Chips von Einheitenkarte und Kampfvorschau, „?“ der Kampfvorschau unter die Tabelle (verdeckte den Waffennamen), Abstand des „?“ zu Zahlen, Ziffern-Prüfung auf alle `handbook.*`-Texte ausgeweitet, Kulissenhaus heißt „Gebäude“, Profi-Klassen tragen „ab Akt 2“. Wunsch für später: Einträge mit Ausschnitten wichtiger UI-Elemente bzw. Beispiel-Assets bebildern. Status: done.
