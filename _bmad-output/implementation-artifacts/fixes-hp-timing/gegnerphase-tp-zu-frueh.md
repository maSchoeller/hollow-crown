# Fix: Lebensleiste zeigt den Gegenschlag schon beim Laufen

**Kurz:** Ein Gegner, der aus dem Nebel kommt, wurde aus dem Zustand *nach* dem Command aufs Brett gesetzt. Der enthält schon den Gegenschlag, den er erst später bekommt. Jetzt trägt das `spawned`-Event die TP des Augenblicks, in dem er erscheint, und das Brett zeigt ihn damit.

<details>
<summary>Fehlerbild und Nachstellung</summary>

- Gemeldet vom PO auf dem iPhone in 1-5 (Nebelkarte).
- Laborszenario `tests/fixtures/lab/nebel-gegenschlag.yaml`: Räuber (25 TP) startet im Nebel, läuft an Lucan heran, verfehlt, Lucan trifft zweimal (14, dann 3 TP).
- Dev-Build `?lab=nebel-gegenschlag`, 375×812, alle Lautstärken 0, „Phase beenden“. Die Leiste (`--hc-hp` der Plakette) alle 20 ms mitgeschrieben:

| Schritt | vorher | nachher |
|---|---|---|
| Räuber erscheint aus dem Nebel | 0.12 | 1 |
| läuft an Lucan heran, schlägt zu | 0.12 | 1 |
| 1. Gegenschlag | 0.56 (springt hoch) | 0.56 |
| 2. Gegenschlag | 0.12 | 0.12 |

</details>

<details>
<summary>Ursache</summary>

- Das Brett setzt die TP bei `strike`, `damage` und `heal` richtig pro Event (Story 13.3).
- Eine Einheit, die erst während der Wiedergabe aufs Brett kommt (`spawned`: Gegner aus dem Nebel, Kampfgast, Hinterhalt, Verstärkung), wurde aber aus `finalState` bzw. `after.units` gebaut, also mit den TP, Zuständen und dem Tod nach dem ganzen Command. Gleiches Muster wie bei #147, nur bei den TP statt bei den Positionen.
- Eine Verstärkung oder ein Nebelgegner, der im selben Command fällt, kam als `gone` gar nicht erst aufs Brett.
- Die HUD-Leisten (Gegnerstreifen, Kompanie, Einheitenkarte) lesen während der Wiedergabe den Zustand nach dem Command. Den Stand pro Event (`onUnitHp`) hatten sie nur für Einheiten, die schon getroffen waren.

</details>

<details>
<summary>Fix</summary>

- `spawned` hat jetzt `hp`: der Kern setzt es bei Verstärkungen, der Nebelfilter (`filterEvents`) führt die TP über alle Events mit, auch über die ungesehenen, und gibt sie jeder eingelassenen Einheit mit.
- `unitAtSpawn` (`src/render/board/spawnUnit.ts`): die Einheit beim Erscheinen. TP aus dem Event, steht (nicht gefallen), Zustände über die folgenden `status`-Events zurückgerechnet. Das Brett meldet die TP auch ans HUD.
- `battleCommands.ts`: Vor jedem Command setzt das HUD die TP aller Einheiten auf den Stand davor. `onUnitHp` schiebt sie pro Event weiter, und nach der Wiedergabe gilt wieder der Zustand.
- Gilt für 1×, 2×, Überspringen und das adaptive Tempo, denn die Reihenfolge der Events ändert sich dabei nicht. Gilt auch in der Spielerphase. Kein zusätzlicher Aufwand pro Frame.
- Tests: `tests/unit/hp-timing.test.ts` (Nebelfilter, `unitAtSpawn`, Wiedergabe mit mitgeschriebenen Leisten), angepasst `fog.test.ts` und `board-playback.test.ts`.

</details>

<details>
<summary>Offen (nicht Teil des Fixes)</summary>

- Lebensraub (`lifestealPercent`) hat kein eigenes Event. Die Heilung des Angreifers erscheint erst beim Abgleich am Ende der Wiedergabe, also zu spät, nicht zu früh.

</details>
