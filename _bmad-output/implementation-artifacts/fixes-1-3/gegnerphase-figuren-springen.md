# Fix 1-3: Figuren springen in der Gegnerphase zurück

**Fehlerbild (PO, iPhone, 2×):** Nach den Gegnerzügen springen Figuren auf ihre Ausgangsfelder zurück, bleiben dort bis zum Ende der Animationen und erscheinen erst danach auf ihrem Endfeld.

**Ursache:** `BoardView.play` (`src/render/board/board.ts`, Fall `spawned`) hat für eine Figur, die mitten in der Wiedergabe erscheint (Verstärkung, Gegner tritt aus dem Nebel), `syncUnits` mit `this.state` aufgerufen. Das ist der Zustand **vor** der Wiedergabe. `syncUnits` setzt jede Figur auf das Feld aus diesem Zustand, macht Gefallene wieder sichtbar und setzt Blickrichtung und Ausgrauen zurück. Erst der `setState(finalState)` am Ende der Wiedergabe hat das korrigiert. Das Tempo spielt keine Rolle (1× und 2× gleich), das adaptive Tempo-Limit aus Story 15.11 ist nicht der Verursacher.

**Fix:** neues `addUnit` in `boardUnits.ts`. Es legt nur die Figur der neuen Einheit an (gemeinsamer Teil mit `syncUnits` in `placeFigure`) und lässt alle anderen Figuren dort, wo die Wiedergabe sie hingestellt hat.

**Test:** `tests/unit/board-playback.test.ts` spielt `BoardView.play` ohne Szene ab (`moved`, `died`, `spawned`, `moved`) und prüft die Felder beim `spawned`. Ohne den Fix schlägt er fehl (Figur wieder auf 2,2 statt 4,2).

## Positionen vorher und nachher

Mission 1-3 (`m1_3`, Normal), Runde 6, Gegnerphase. Die Ereignisse kommen aus dem Core (`applyCommand` mit `endPhase`, gefiltert wie im Spiel), abgespielt über `__board.play` im Dev-Build. Positionen der Figuren auf dem Brett, abgetastet alle 30 ms. Ablauf: Morra tritt aus dem Nebel (`spawned`) und geht von 11,6 nach 11,7, danach erscheint die Verstärkung r42 (`spawned`) und geht von 11,20 nach 11,18. „Alt“ ist das vorige Verhalten, nachgebildet durch den alten Aufruf `syncUnits({ ...this.state, … })`.

| Lauf | Morra nach ihrem Zug | beim Erscheinen von r42 | Ende der Wiedergabe |
|---|---|---|---|
| alt, 1× | 11,7 (0,8 s → 1,5 s) | **springt auf 11,6** (3,1 s) | erst nach 7,7 s wieder auf 11,7 |
| alt, 2× | 11,7 (0,4 s → 0,8 s) | **springt auf 11,6** (1,6 s) | erst nach 4,0 s wieder auf 11,7 |
| Fix, 1× | 11,7 | bleibt auf 11,7 | 11,7 |
| Fix, 2× | 11,7 | bleibt auf 11,7 | 11,7 |

Aus einem früheren Lauf mit dem alten Code (Runde 5, 2×): m5 geht 5,18 → 3,19 und springt beim nächsten `spawned` nach 1,9 s zurück auf 5,18. r40 geht 5,21 → 7,21 und springt beim zweiten `spawned` zurück auf 5,21. Beide stehen erst beim Sync am Ende nach 3,8 s wieder richtig. In Runde 6 tauchte zudem der zuvor gefallene m6 beim `spawned` wieder auf.

Die Wiedergabezeiten der Fix-Läufe sind länger, weil die Vorschau dabei im Hintergrund lief und gedrosselt wurde. Mit dem Fix hat das nichts zu tun.
