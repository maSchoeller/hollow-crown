# Story 13.4: Schadensvorschau und Kill-Marker

Status: review

## Story

Als Spieler
möchte ich vor dem Angriff sehen, wie viel die Leiste des Ziels verliert und wen ich diese Runde besiegen kann,
damit ich Angriffe gezielt verteile.

## Acceptance Criteria

**Angenommen** die offene Kampfvorschau
**Wenn** ein Ziel gewählt ist
**Dann** blinkt in seiner Lebensleiste der Teil, den der Angriff bei Treffer nimmt (inklusive Doppelangriff), mit `prefers-reduced-motion` schraffiert statt blinkend
**Und** die Zahl stammt aus `forecast`, nie aus einer Kopie der Formel.

**Angenommen** eine gewählte eigene Einheit in der Spielerphase
**Wenn** ihr Bereich erscheint
**Dann** steht über jedem Gegner, den sie von einem erreichbaren Feld aus angreifen kann, ein Kill-Marker nach DESIGN.md: voller Totenkopf = fällt bei Treffer (inklusive Doppelangriff), halber = fällt nur mit Krit
**Und** Leutnants zeigen statt Totenkopf die Flucht-Marke; gerechnet wird mit der besten angelegten Waffe und dem günstigsten erreichbaren Feld
**Und** die Rechnung ist eine reine Funktion in `src/core/rules` mit Unit-Tests (Treffer, Krit, Doppelangriff, Dreieck, Element, Leutnant).

## Tasks / Subtasks

- [x] T1 `damageAtHit(data, forecast)`: TP, die der Angriff bei Treffer nimmt (Doppelangriff, Schlagreihenfolge, kein Krit, kein Tandem), aus `forecast`
- [x] T2 Kampfvorschau: der Teil der Leiste blinkt (`setHpPreview`), mit reduzierter Bewegung schraffiert
- [x] T3 `killMarks(data, s, unit)`: je Gegner in Reichweite eines erreichbaren Felds mit jeder nutzbaren Waffe `forecast`; voll = fällt bei Treffer, halb = nur mit Krit (erster Schlag mal `critMultiplier`); Leutnant `flees`
- [x] T4 Marker als dunkler Stein links an der Leiste (`kill-marker`), Leutnant mit Flucht-Marke
- [x] T5 Tests: Treffer an der Grenze, Doppelangriff, Krit, Waffendreieck, Element, Leutnant, außer Reichweite, schon gehandelt

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Gerechnet wird mit der sichtbaren Lage (`visibleState`); Gegner im Nebel bekommen keinen Marker.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).
