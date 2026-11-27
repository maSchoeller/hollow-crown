# Story 16.1: Straßen und Brücken kosten ½

Status: done

## Story

Als Spieler
möchte ich auf Straßen und Brücken doppelt so weit kommen,
damit lange Laufwege auf großen Karten schneller gehen.

## Acceptance Criteria

1. **Gelände:** `road` und `bridge` kosten in `content/core/terrain.yaml` für alle Bewegungsarten 0.5; Tor, Rampe, Treppe, Türen, Asche und übriges Gelände bleiben bei 1. Das Zod-Schema erlaubt halbe Punkte (`multipleOf(0.5)`), auch für Skill-Überschreibungen (`terrainCost`).
2. **Kern:** Bewegung kennt halbe Punkte: Mov 4 auf Straße = 8 Felder; eine übrige halbe Bewegung reicht für ein weiteres Straßenfeld, nicht für ein Feld mit Kosten 1. Nichts rundet.
3. **Eine Rechnung:** Bewegungsbereich (`reachable`), Wegsuche (`walkPath`), Gegner-KI (`distanceField`, `bestApproach`), Gefahrenzone (`dangerZone`), Autoplay (`walkField`) und Simulation nutzen dieselben Kosten; je Stelle ein Test.
4. **Restbewegung:** Ein Unit-Test belegt „noch 1½“ (Mov 4, Weg mit Kosten 2,5 → Rest 1,5; Nachsetzen-Vorschau).
5. **Replays:** Alte Logs werden nicht nachgerechnet, sondern als neue Regel geführt; keine Kompatibilitätsschicht.
6. **Grenze:** Anzeige der Kosten am Brett (Punkte, „½“, „noch n“, Feldkarte) ist Story 16.11; Nachbalancieren der Karten ist Story 16.2.

## Tasks / Subtasks

- [x] T1 Gelände (AC 1): `terrain.yaml`, Schemas `schemaMap.ts`, `schemaUnits.ts`
- [x] T2 Kern (AC 2, 3): `movement.ts` rechnete schon ohne Rundung; `minStepCost(data)` neu; KI-Abstandsfelder (`ai.ts`, `autoplay.ts`) bucketten und klemmten auf ganze Punkte, jetzt Halbpunkt-Buckets und Klemme `minStepCost`; Beschneidung im Wall-Zauber der KI nutzt dieselbe Untergrenze
- [x] T3 Tests (AC 2–4): `tests/unit/road-half-cost.test.ts`
- [x] T4 Prüfungen und Simulation (AC 5)

## Dev Notes

- [ASSUMPTION] Steg (`boardwalk`), Fußsteg (`footbridge`) und Hängebrücke (`rope_bridge`) sind Brücken (Werte „wie die Brücke“) und kosten ebenfalls ½; Kai (`quay`, Werte wie `plain`) bleibt 1.
- [ASSUMPTION] `walkDistances` (Autoplay, Schatzsuche) zählt Schritte hinter Mauern, keine Kosten, und bleibt unverändert.
- Die Anzeige `ui.pursue.hint` zeigt die Restbewegung als Zahl (z. B. 1.5); die Formatierung mit „½“ gehört zu Story 16.11.
- Keine gesperrten IDs, kein `content:lock`.

## Review 2026-11-27

**Urteil: DONE.** Alle AC auf `main` erfüllt.
- `content/core/terrain.yaml:10,18,75,76,78`: road, bridge, boardwalk, footbridge, rope_bridge 0.5 für alle Bewegungsarten; gate, ramp, stairs, door_open, ash bleiben 1. `multipleOf(0.5)` in `src/content/schemaMap.ts:9` und `schemaUnits.ts:224` (`terrainCost`).
- `minStepCost` (`src/core/rules/movement.ts:94`) in `ai.ts:48,283` und `autoplay.ts:66`; `tests/unit/road-half-cost.test.ts` (12 Tests: Reichweite, Rest 1½, Nachsetzen, walkPath, Gefahrenzone, KI, Autoplay) grün.
