# Story 6.1: Truppe und Figur

Status: review

## Story

Als Spieler
möchte ich meine Truppe auf einen Blick sehen und jede Figur genau ansehen,
damit ich weiß, wer bereit ist und wer etwas braucht.

## Acceptance Criteria

1. **Truppe:** Die Ansicht „Truppe“ zeigt ein Medaillon-Raster aller Gefährten und Söldner mit Rolle und Stufe, filterbar nach Rollengruppe (Alle, Nahkampf, Fernkampf, Hilfe), mit Marken für „kann aufsteigen“, „Gespräche bereit“ und „Narbe“ (Mockup 06). Gefallene erscheinen nicht.
2. **Figur:** Eine Figur zeigt Halbfigur, Rolle und Stufe, EP-Balken, zehn Werte (TP, STÄ, MAG, GES, TEM, GLÜ, VER, RES, BEW, TRAG), die Ausrüstungsplätze (Zahl = Aufwertung oder Ladungen, Raute = Seltenheit), Last und Meisterung; Wischen (oder die Pfeile) wechselt die Figur.
3. **Nur lesend:** Die Figur-Ansicht lässt sich mit `readOnly` einbetten (Einheitenkarte im Kampf, Langdruck). Das Einbinden in das Kampf-HUD gehört zum Kampf-Overlay und ist hier nicht verdrahtet (siehe Dev Notes).

## Tasks / Subtasks

- [x] T1 Inhalt: `roleGroup` je Klasse (`classes.yaml`, Schema, `ClassDef`) (AC 1)
- [x] T2 Kern: `canPromote`, `expProgress`, `supportTalksOf`, `isMercenary` in `core/campaign/camp.ts` (AC 1, 2)
- [x] T3 Kunst: `tools/art/build.py` baut Halbfiguren `busts/<id>.webp` (200 px, q70) für dieselben Figuren wie die Köpfe (AC 2)
- [x] T4 UI: `Troop.tsx` (Raster, Filter, Marken, Legende), `Figure` (Wischen, Pfeile, Plätze, Last, Meisterung, Loadout, Aufsteigen), `unitArt.tsx`, `troop.css`; gemeinsame Bausteine `Backdrop`, `Tabs`, `Wallet`, `ItemLine` (AC 1, 2)
- [x] T5 Verdrahtung: Screen `troop`, Route in `App.tsx`, Einstieg aus dem Lager (AC 1)

## Dev Notes

- **Plätze:** 6 Ausrüstungsplätze plus `balance.bag.size` (3) Beutelplätze = 9 (GDD: „Beutel 3“); der Epic-Text nennt 8, das Mockup zeigt 2 Beutelplätze. Die Daten (GDD) gelten; Raster 3 × 3.
- **Marke „kann aufsteigen“:** Stufe ≥ `levels.promoteFrom` und die Klasse hat eine Beförderung; das Siegel prüft das Command `promote` (Fehler als Hinweis).
- **Rollengruppen:** `roleGroup` je Klasse in `classes.yaml` (Tactician und Cleric/Bischof = Hilfe, Bogen und Magie = Fernkampf, Rest Nahkampf).
- **Kampf-Langdruck:** `Figure` ist eigenständig (`readOnly`, `units`, `onSelect`, `onBack`). `BattleHud.tsx` gehört dem Kampf-Overlay (anderer Agent), daher dort nicht eingehängt.
- **Bilder:** Köpfe `avatars/`, neu Halbfiguren `busts/` (12 Dateien, rund 0,15 MB). Söldner ohne Bild zeigen den Anfangsbuchstaben.

### References

- [Source: concept/26-epics/epics/epic-06.md#Story 6.1]
- [Source: concept/25-ux/mockups/06-truppe.html]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- siehe Story 6.4 (gemeinsame Prüfläufe am Ende der Reihe)

### Completion Notes List

- Browser: Truppe-Raster und Figur Brenna geprüft (375 × 812).

### File List

- `src/app/screens/Troop.tsx`, `src/app/screens/unitArt.tsx`, `src/ui/troop.css` (neu)
- `src/ui/pieces.tsx`, `src/ui/pieces.css`, `src/ui/components.tsx`, `src/app/App.tsx`, `src/app/state/screen.ts`
- `src/core/defs.ts`, `src/core/campaign/camp.ts`, `src/content/schemas.ts`, `content/core/classes.yaml`, `content/core/locales/{de,en}.yaml`, `tools/art/build.py`
