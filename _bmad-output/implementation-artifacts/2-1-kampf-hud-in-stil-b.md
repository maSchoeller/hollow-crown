# Story 2.1: Kampf-HUD in Stil B

Status: review

## Story

Als Spieler
möchte ich im Kampf eine klare, einhändige Oberfläche im neuen Stil,
damit ich Ziel, Einheit und Aktionen auf einen Blick erfasse.

## Acceptance Criteria

1. **Oben und unten:** Der Kampfbildschirm zeigt oben die Rundenpille mit Hauptziel und darunter Nebenziel-Pillen, unten die Einheitenkarte (Medaillon mit TP-Ring, Name, Rolle, TP, Waffen-Chip) und das Dock mit vier festen Plätzen: Angriff, Klassen-Aktion, Item, Warten (Mockup 02). Nicht mögliche Aktionen sind gedimmt, nie versteckt; passive Rollen zeigen den Platz „Klassen-Aktion“ als Rollen-Symbol, nicht auslösbar, Tippen erklärt die Regel (Rollen selbst: Story 2.2 bis 2.4).
2. **Leerlauf:** Ohne gewählte Einheit in der Spielerphase zeigt das Dock Gefahr (Umschalter), Nächste und Phase beenden mit der Zahl bereiter Einheiten; Phase beenden fragt nach, solange Einheiten bereit sind.
3. **Gegnerphase:** Dock und Einheitenkarte verschwinden, oben erscheint die rote Phasen-Pille, unten rechts Tempo 1×/2×/Überspringen.
4. **Kampfvorschau** im Stil B mit Dreieck/Element und Tandem als Chips; sie nutzt denselben Formelcode wie die Auflösung (`forecast` im Kern).
5. **Breiten und Tasten:** Seitenleiste 320 px ab 600 px, Panels ab 1024 px (EXPERIENCE.md); Tastenkürzel Esc, Leertaste, E, D.
6. **Nichts geht verloren:** Bewegen, Angriff, Stab, Items, Tauschen, Konvoi, Bergen, Ansprechen, Neustart-Menü, Dialoge, Beute-Hinweis, Ziele, Niederlage und Sieg laufen wie vorher.

## Tasks / Subtasks

- [x] T1 Bausteine (AC 1–4)
  - [x] `src/app/screens/BattleHud.tsx`: `Medallion`/`Head` (TP-Ring in Teamfarbe, Stufen-Pille, niedergestreckt grau, erschöpft gestrichelt), `PhasePill`, `TurnPill`, `GoalPills`, `SpeedControl`, `UnitCardB`, `TerrainCard`, `ContextBand`, `DockAction`/`Dock`, `BackPill`, `HintPill`, `ForecastCard`, `RosterPanel`; Stile in `src/ui/hud.css`
  - [x] Icons `shield`, `blade`, `bow`, `end`; `wait` als Sanduhr (Mockup)
  - [x] Kern: `sideObjectiveProgress` (Dörfer/Truhen als „0/3“) mit Unit-Test
- [x] T2 Kampfbildschirm umbauen (AC 1–3, 5, 6)
  - [x] `Battle.tsx`: Kopf (Rundenpille, Menü-Stein, Nebenziele), Sheet je Modus (Leerlauf, gewählt, Bewegung gesetzt, Ziel, Vorschau), Dock mit vier festen Plätzen, Kontext-Bänder, Gegnerphase mit Pille und Tempo, Szenen blenden das HUD aus
  - [x] Platz „Klassen-Aktion“: vorhandene Fertigkeits-Aktionen (Heilen, Befehl, Sammelruf) belegen ihn; sonst Rollen-Symbol gedimmt, Tipp nennt den Grund
  - [x] Phasen-Banner entfällt (Pille ersetzt es); Sieg/Niederlage behalten das Banner
  - [x] Tasten: Esc schließt zuerst Overlays, dann zurück; E fragt nach wie die Taste; D, Leertaste wie bisher; Tasten ruhen bei offenem Panel/Dialog
  - [x] Kamera holt gewählte Einheit/Zielfeld unter dem HUD hervor
- [x] T3 Köpfe für die Medaillons (AC 1)
  - [x] `tools/art/build.py`: `build_avatars` → `build_heads` für alle Figuren, die in `units.yaml` oder einer Karte vorkommen (112 px, WebP q70; Rhen-Looks wie bisher 160 px); Vorladen beim Kampfstart
- [x] T4 PoC-Reste entfernt (AC 6)
  - [x] `styles.css`: `.topbar`, `.hud-bar/-round/-goal`, `.phase-*`, `.bottom`, `.dock*`, `.act*`, `.primary-act`, `.forecast`/`.fc-*`, `.roster-mini`, Seitenspalten-Regeln, Phasen-Banner-Farben, Dialog-Versatz unter der alten Leiste
  - [x] `components.tsx`: `ForecastView`; `Battle.tsx`: `TileInfo`, Aktions-Tabellen, „Mehr“-Dialog
  - [x] Locale: `ui.hud.more`, `ui.hud.tapAgain` entfernt; neu `ui.hud.*`, `ui.ctx.*`
- [x] T5 Prüfung
  - [x] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, E2E-Smoke (Selektoren auf `.hud-top`/`.hud-bottom`)
  - [x] Browser (375 × 812, ~800 px und ~1200 px): Prolog und Kapitel 1 mit `__hc.autoWin()`, Kapitel 1 von Hand (Auswahl, Tauschen, Vorschau, Angriff, Gegnerphase, Neustart per Fortsetzen)

## Dev Notes

- **Stand vor der Story:** `Battle.tsx` (U21-Look, abgeschrägte Ecken, Glas-Leiste) mit Aktionsleiste „eine große Taste + vier kleine + Mehr“ und eigener Vorschau `ForecastView`. Spielregeln, Brett (`src/render/board.ts`) und Overlays blieben unangetastet; der Modus-Automat (`idle`/`selected`/`moved`/`target`/`forecast`) und `doAction` sind unverändert.
- **Rolle/Klasse:** Es gibt noch kein Rollenmodell. `ROLE_ICON` in `BattleHud.tsx` ordnet PoC-Klassen vorläufig ein Rollen-Symbol zu (Soldat/Kämpfer Schild, Söldner Klinge, Hauptmann Fahne, Schütze Bogen, Magier Feuer, Kleriker Kreuz, Taktiker Ziel); Story 2.2 ersetzt das durch `role`/`classAction` aus `classes.yaml`.
- **Gegnerphase:** Der Kern wendet die ganze Phase an, bevor das Brett sie abspielt. Die Phase der Anzeige kommt deshalb aus den `phase`-Ereignissen (`phaseView`), nicht aus `state.phase`; `run(endPhase)` setzt sie sofort auf „Gegner“.
- **Tempo:** `settings.enemySpeed` bleibt der Wert; ein Tipp setzt zusätzlich `board.speed`/`board.skip` der laufenden Phase. Die „Überspringen“-Taste heißt für Screenreader „Gegnerphase vorspulen“, damit sie sich nicht mit dem Dialog-„Überspringen“ verwechselt (E2E-Selektor).
- **Vorschau:** `ForecastCard` liest nur `Forecast` aus dem Kern (`forecast(...)`), keine eigene Formel.
- **Köpfe und Bundle:** 9 neue Köpfe + 2 Rhen = 67 KB (vorher 22 KB); Initial-Download 14,92 MB (Budget 15 MB). Weitere Figuren aus `art/mockups/characters-s1` kommen automatisch dazu, sobald sie als Einheit in Content stehen. Das Build-Skript braucht dafür keine neue Abhängigkeit (Regex über die YAML-Dateien).
- **Offen / nicht Teil der Story:** Steckbrief per Langdruck mit Leutnant (Epic 3), Groll-Wimpel und Sprechblase, Verblutungs-Zähler im Band (Story 1.6), Rollenaktionen (2.2 bis 2.4); das Info-Panel (`UnitInfo`), Tausch- und Konvoi-Dialog, Ziele-Panel und Menü sind noch PoC-Modals und folgen mit den Panel-Stories.

### Project Structure Notes

- Neu: `src/app/screens/BattleHud.tsx`, `src/ui/hud.css`.
- Geändert: `src/app/screens/Battle.tsx`, `src/core/battle/objectives.ts`, `src/ui/components.tsx|icons.tsx|styles.css`, `content/locales/de|en.yaml`, `tools/art/build.py`, `tests/unit/core.test.ts`, `tests/e2e/smoke.spec.ts`.

### Project Context Rules

- Kein sichtbarer Text im Code (Schlüssel `ui.hud.*`, `ui.ctx.*` in DE und EN); Beträge unverändert als Symbol + Zahl.
- Spielwerte bleiben in `content/`; der Kern bekommt nur `sideObjectiveProgress` (rein, ohne neue Regeln).

### References

- [Source: concept/26-epics/epics.md#Story 2.1]
- [Source: concept/25-ux/mockups/02-kampf.html]
- [Source: concept/25-ux/DESIGN.md#Components] (medallion, phase-pill, dock-action, class-action, context-band)
- [Source: concept/25-ux/EXPERIENCE.md#Component Patterns, #Interaction Primitives, #Responsive]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm test` (64), `pnpm content:check` (705 Schlüssel je Sprache), `pnpm build` grün; Bundle 18,53 MB roh / 14,92 MB Transfer (Budget 15 MB); `pnpm test:e2e` 12/12 (4 Geräteprofile).
- Browser: Leerlauf, Einheit gewählt (gedimmtes Dock), Bewegung gesetzt mit Kontext-Bändern (Tauschen, Konvoi), Grund-Pille bei gedimmtem Item, Vorschau mit Angriff, Gegnerphase mit Pille und Tempo, Szenen ohne HUD, Seitenspalte und Truppen-Panel bei Tablet-/PC-Breite, Esc/Leertaste/E; Prolog und Kapitel 1 mit `autoWin()` bis zum Ergebnis.

### Completion Notes List

- Entscheidungen im Decision-Log `concept/25-ux/.decision-log.md` (Klassen-Platz mit vorhandenen Fertigkeiten, Grund-Pille, Bänder für alle Kontext-Aktionen, Phasen-Pille statt Banner, Köpfe nur für Figuren im Content).
- Nicht von Hand geprüft: Bergen-Band (kein niedergestreckter Verbündeter erreicht), Stab-/Sammelruf-Auswahl (Heilen/Befehl/Sammelruf laufen über denselben `doAction`).

### File List

- `src/app/screens/BattleHud.tsx`, `src/ui/hud.css` (neu)
- `src/app/screens/Battle.tsx`, `src/core/battle/objectives.ts`
- `src/ui/components.tsx`, `src/ui/icons.tsx`, `src/ui/styles.css`
- `content/locales/de.yaml`, `content/locales/en.yaml`
- `tools/art/build.py`
- `tests/unit/core.test.ts`, `tests/e2e/smoke.spec.ts`
- `concept/25-ux/.decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
