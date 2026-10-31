# Story 1.8: Optionen, Ende und Hinweise im Stil B

Status: review

## Story

As a Spieler,
I want, dass auch Einstellungen, Hinweise und das Ende des bisherigen Inhalts wie der Rest des Spiels aussehen,
so that nirgends noch der alte Prototyp durchscheint.

## Acceptance Criteria

1. Die Optionen (Sprache, Tempo, Gegnertempo, Gefahr, Qualität, Figuren, Wackeln, Musik, Effekte, Bildschirm wach) erscheinen, vom Titel, aus dem Kampfmenü oder aus der Heimat geöffnet, als Steine mit Segment-Schaltern und Reglern im Stil B (`ScreenHead`, Tokens aus DESIGN.md) über der weichgezeichneten Szene; jede Änderung wirkt sofort und bleibt gespeichert.
2. Endbildschirm, Toast und Banner nutzen Steine, Pillen und Schriften aus Stil B; Titel-Rahmen und Update-Hinweis der Versionszeile ebenso; die PoC-Klassen dieser Ansichten sind aus `styles.css` entfernt.

## Tasks / Subtasks

- [x] `Segment` aus `Campaigns.tsx` nach `src/ui/pieces.tsx` (+ `.hc-seg` nach `pieces.css`), Campaigns nutzt es weiter (AC: 1)
- [x] `Options` neu: `ScreenHead`, drei Steine, Segmente, Regler (`options.css`), weichgezeichneter Lager-Hintergrund (AC: 1)
- [x] `EndScreen` neu: Stein mit Krone, Titel, Text, Primär-/Sekundärknopf (`end.css`) (AC: 2)
- [x] `Toast` und Kampf-Banner als Pillen (`notices.css`, Markup unverändert) (AC: 2)
- [x] Titel-CSS nach `title.css`, Versionszeile als Pillen, Update als Ember-Chip, Hinweis „anderer Tab“ als Stein (AC: 2)
- [x] PoC-Regeln aus `styles.css` entfernt: Titel-Block, `.link-btn`, `.update-btn`, `.field`, `.choice*`, `input[type=range]`, `.banner`, `.toast` (AC: 2)

## Dev Notes

- Was blieb: `.logo`/`.tagline` (Niederlage-Bildschirm in `App.tsx` nutzt sie noch), `.linkish` (Camp.tsx), `.page-head` (Camp, Weltkarte), `input[type='text']` (Rahmen für `hc-input`).
- Neue Dateien: `src/ui/title.css`, `options.css`, `end.css`, `notices.css`. Keine neuen Texte, keine neuen Schlüssel.
- Banner: Klasse `.banner` bleibt in `Battle.tsx`, nur das CSS ist neu (Pille, Gegnerphase in Teamfarbe Gegner, Sieg in Ember).
- `Segment` ist nun generisch über string | number | boolean (Optionen brauchen Zahlen und Booleans).
- Kein Game-Balancing, keine Core-Änderung.

### Project Structure Notes

- Jede neu gebaute Ansicht hat ihre CSS-Datei neben der Komponente; `styles.css` schrumpft nur.

### References

- `concept/26-epics/epics/epic-01.md` Story 1.8; `concept/25-ux/DESIGN.md`, `EXPERIENCE.md`; Mockup `07-start-kampagnen.html`.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint` grün; `pnpm test` 97 Tests grün; `pnpm content:check` OK; `pnpm build` grün, Bundle 14.92 MB transfer (Budget 15.00 MB).
- Browser (375×812): Titel, Optionen, Ende, Toast und Banner geprüft, keine Konsolenfehler im Pfad.

### Completion Notes List

- Keine Entscheidung außerhalb der Dokumente nötig.

### File List

- `src/app/screens/Menus.tsx`, `src/app/screens/Campaigns.tsx`
- `src/ui/pieces.tsx`, `src/ui/pieces.css`, `src/ui/campaigns.css`, `src/ui/components.tsx`, `src/ui/styles.css`
- `src/ui/title.css`, `src/ui/options.css`, `src/ui/end.css`, `src/ui/notices.css`
- `_bmad-output/implementation-artifacts/1-8-optionen-ende-und-hinweise-im-stil-b.md`, `sprint-status.yaml`
