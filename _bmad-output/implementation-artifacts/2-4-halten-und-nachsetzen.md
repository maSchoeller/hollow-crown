# Story 2.4: Halten und Nachsetzen

Status: done

## Story

Als Spieler
möchte ich mit Vorkämpfern Engstellen halten und mit Plänklern nach dem Angriff weiterziehen,
damit Positionierung zählt.

## Acceptance Criteria

1. **Halten:** Betritt ein Gegner das Nachbarfeld eines Vorkämpfers, endet seine Bewegung dort. Die Bewegungsbereiche von Spieler und KI (`reachable`, damit auch Gefahrenzone, Bedrohungsfelder, Autoplay) berücksichtigen das.
2. **KI-Pfadsuche:** Die KI umgeht Haltezonen, wenn der Umweg höchstens 2 Felder länger ist, sonst läuft sie hinein. Die Zahl 2 steht in `balance.yaml`.
3. **Nachsetzen:** Hat ein Plänkler angegriffen und noch Restbewegung, zieht der Spieler per Command `pursue { unit, to }` auf ein erreichbares Feld. Jedes andere Command beendet die Möglichkeit.
4. **Replay:** Replays mit `pursue` liefern identische Ergebnisse (Startzustand + Command-Log).
5. **Dock:** Beide Rollen zeigen im festen Klassen-Platz ihr Rollen-Symbol als Zustand (bereit/aktiv), nicht auslösbar; ein Tipp erklärt die Regel mit Vorschau (EXPERIENCE „Klassen-Aktion“). Alle Zahlen in `balance.yaml`; Logik in `src/core` getestet.

## Tasks / Subtasks

- [x] T0 Offene Fragen mit dem Produktinhaber klären (siehe unten), bevor T2/T3 festgelegt werden; Antworten ins Entscheidungsprotokoll `concept/21-gdd/decision-log.md`
- [x] T1 Zahlen: `balance.yaml › classActions` um `hold: { detourMax: 2 }` (und je nach Antwort `pursue`-Werte) ergänzen; Typ `classActions` in `src/core/defs.ts`, Zod-Schema in `src/content/schemas.ts` (Z. ~621)
- [x] T2 Halten in `src/core/rules/movement.ts`:
  - [x] `holdZone(data, s, team): Set<string>` (Nachbarfelder aller aktiven, feindlichen Einheiten mit `classActionId === 'hold'`, über `classActionId` aus `battle/actions.ts` oder eine Hilfsfunktion in `rules/`, die `lockedRoles` beachtet)
  - [x] `reachable`: Feld in der Haltezone darf betreten werden (kostet normal), wird aber nicht weiter expandiert (kein `open.push`)
  - [x] `moveValid`/`doMove` (`battle/apply.ts`) nutzen unverändert `reachable`; Pfad endet damit automatisch dort
  - [x] `threatTiles`/`dangerZone` und `reachNow` prüfen (Gefahrenzone muss das Anhalten abbilden)
- [x] T3 KI-Pfadsuche in `src/core/ai/ai.ts`: `distanceField`/`bestApproach` kennen Haltezonen (Umgehungs-Feld ohne Haltezone; ist `Umweg ≤ detourMax`, wird das Umgehungs-Feld genutzt, sonst das Feld mit Haltezone); Angriffspläne (`attackPlans`) wählen Standfelder weiter über `destinations`; deterministische Tie-Breaks wie bisher
- [x] T4 Nachsetzen, Zustand und Command:
  - [x] `Command` um `{ type: 'pursue'; unit: string; to: Pos }` in `battle/commands.ts`, neue `CommandError`-Werte nach Bedarf (`no_pursue`)
  - [x] Zustand im `BattleState` (`src/core/state.ts`), Plain-JSON: z. B. `pursue?: { unit: string; left: number }`; gesetzt in `finishUnit`/`doAction` nach `attack`, gelöscht von jedem anderen Command in `applyCommand` (auch `endPhase`); Speicherformat prüfen (Kampf-Zwischenstand im Save, `src/persistence/save.ts`)
  - [x] `validate`/`applyCommand` in `battle/apply.ts`: `pursue` ist für eine Einheit mit `acted === true` erlaubt, wenn der Zustand sie nennt; Reichweite `reachable(data, s, u, u.pos, left)` (Parameter `mov` existiert)
  - [x] Event: `moved` wiederverwenden oder `pursued`; Karten-Auslöser und Ziel-Prüfung (`afterUnitMoved`, `checkObjectives`) laufen wie bei jeder Bewegung
  - [x] `finishUnit` darf die Einheit erst nach der Nachsetz-Möglichkeit endgültig als „ausgelaugt“ zeigen (Event `exhausted` und Support-Punkte bleiben unverändert beim Angriff)
- [x] T5 Vorschau: `pursuePreview` neben `classPreview` in `battle/actions.ts` (Felder, Restbewegung); gleicher Code wie `apply`
- [x] T6 Tests (Fixtures, neue Datei `tests/unit/hold-pursue.test.ts`, Muster `class-actions.test.ts`):
  - [x] Halten: Gegner stoppt auf dem ersten Nachbarfeld; Bereich von Spieler und KI identisch; keine Haltezone ohne Vorkämpfer / bei Niedergestreckten
  - [x] KI: Umweg 2 wird umgangen, Umweg 3 läuft hinein
  - [x] Nachsetzen: nur direkt nach Angriff, nur mit Restbewegung, Ziel im Rest-Bereich, jedes andere Command (auch `endPhase`, anderer Befehl) beendet es
  - [x] Replay: gleiche Commands ergeben gleichen State; `pnpm test:coverage` für `src/core` nicht senken
- [x] T7 UI in `src/app/screens/Battle.tsx` und `BattleHud.tsx`:
  - [x] Nach einem Angriff eines Plänklers mit Rest: Zielwahl der Nachsetz-Felder (blau) mit Haupttaste „Nachsetzen“ und Option „Fertig“ (verwirft die Möglichkeit); die Auto-Phasenende-Prüfung (Z. ~296) und „Nächste“/Bereit-Zähler (`selectable`) berücksichtigen den offenen Nachsetz-Zustand
  - [x] Passive Rollen im Klassen-Platz: Zustand statt gedimmt-leer (Vorkämpfer „bereit“, Plänkler „bereit“ vor, „aktiv“ nach dem Angriff); Tipp zeigt Regel + Vorschau (Haltezone / Nachsetz-Felder) statt `ui.hud.noClass`
  - [x] Haltezonen der Vorkämpfer auf dem Brett markieren (Vorschau beim Wählen eines Vorkämpfers)
  - [x] Texte de/en in `content/core/locales/{de,en}.yaml`; Rollen-Icons `shield`/`blade` bleiben (`ROLE_ICON`), Zustandsmarke neu
- [x] T8 Sim und Protokoll: `pnpm sim <map> --runs 50` je Karte vorher/nachher (Halten verändert die Gegner-Bewegung, `ch01_varnhold` hat 3 gegnerische Vorkämpfer); Korridore NFR12; Eintrag im Entscheidungsprotokoll

## Dev Notes

- **Bewegung heute:** `act` ist ein Paket aus Bewegung + Aktion; `applyCommand › act` ruft `doMove`, `doAction`, dann `finishUnit`, das `acted = true` und `moved = true` setzt. Es gibt keine Restbewegung im State. Der Bewegungspreis des Zugs steht nur implizit in `reachable(...)[to].cost`. Nachsetzen braucht daher neuen Zustand (Restbewegung = `st.mov` minus Kosten der Bewegung vor dem Angriff). Wegen `u.acted → 'unit_exhausted'` in `validate` muss `pursue` den Check gezielt umgehen.
- **KI geht an `validate` vorbei:** `aiAct` ruft `applyAct` direkt. Halten muss deshalb in `reachable` selbst sitzen (nicht nur in `moveValid`), sonst läuft die KI durch Haltezonen. Der Autoplay (`autoCommand`) nutzt `act`-Commands und bleibt ohne `pursue`, die Sim-Werte ändern sich nur durch Halten.
- **Wer hält:** Es gibt gegnerische Vorkämpfer (`ch01_varnhold`: e2, e5, e9; `prologue_caravan` mischt Lanzen-Vorkämpfer unter die Banditen). Halten wirkt daher auch auf Spielerbewegung. Pro-Wege `bulwark` und `breaker` tragen `hold` ebenfalls (`classes.yaml`). Klassenaktion ist über `classActionId(data, u, s)` lesbar (berücksichtigt `lockedRoles`, Story 4.3).
- **Kein Gelegenheitsangriff, keine Kontrollzone außer Halten** (GDD Z. 183, „Eine Kontrollzone hat nur der Vorkämpfer“).
- **Zähl-/Messfunktionen:** `dangerZone`/`threatTiles` bauen auf `reachable`; mit Halten schrumpft die Zone, die rote Gefahrenanzeige und die KI-Gefahrenwertung (`dangerMap`) werden dadurch automatisch ehrlicher.
- **Phasenende:** `Battle.tsx` beendet die Spielerphase automatisch, sobald alle Einheiten `acted` sind; offene Nachsetz-Möglichkeit darf das nicht auslösen (siehe T7). Der Zustand `pursue` ist Teil des Replay (reines JSON im State, kein Zufall).
- **Dock (Stand Story 2.1/2.3):** Der Klassen-Platz zeigt bei Rollen ohne verfügbare Aktion das Rollen-Icon gedimmt (`roleIcon`), die Antwort beim Tipp ist `ui.hud.noClass`, ein Text, der nur Zielen/Anfeuern/Fernbergen erklärt. Für passive Rollen ist noch nichts gebaut: kein Zustandssymbol, keine Regelerklärung mit Vorschau. EXPERIENCE verlangt beides.
- **Grenze zu Story 2.8:** Die Gegnerphase wandert dort in einen Web Worker. Diese Story ändert nur die Regeln (`reachable`, `bestApproach`/`distanceField`) und nimmt keine Rücksicht auf Worker-Infrastruktur. Ändert sich die KI-Schnittstelle (neue Parameter für `bestApproach`/`distanceField`, neue Daten wie Haltezonen im State), ist das in der Story 2.8 zu vermerken; Haltezonen sollen aus dem `BattleState` ableitbar bleiben (keine Zwischenspeicher außerhalb des States).
- **Zielstruktur (architecture.md §5.7):** Halten in `movement.ts`, Nachsetzen als `pursue{unit,to}` direkt nach Angriff mit Restbewegung; jedes andere Command beendet die Möglichkeit.


### Fragen an den Produktinhaber – entschieden am 2026-10-24

Die Fragen waren weder im GDD (Z. 133–138, 183, 190) noch in der Architektur (§5.7) beantwortet. Der Produktinhaber hat sie am 2026-10-24 entschieden; Entscheidung je Frage in **Fettschrift**, übernommen in `concept/21-gdd/decision-log.md`.

1. **Hält ein Vorkämpfer nur Gegner oder auch Verbündete?** Der Text sagt „Gegner“. Optionen: (a) nur Feinde des Vorkämpfers, auch gegen den Spieler wenn der Vorkämpfer ein Gegner ist; (b) nur Spieler-Vorkämpfer wirken, gegnerische Vorkämpfer haben kein Halten. Empfehlung: (a), weil es das GDD-Wort („Engstelle für Vorkämpfer“) und die vorhandenen Gegner-Vorkämpfer trägt; Folge: Gegner-Vorkämpfer verändern die Spielerwege und die Balance (Sim nötig).
   **Entschieden: Halten wirkt für beide Teams.** Auch gegnerische Vorkämpfer stoppen Spieler-Einheiten.
2. **Starten Einheiten, die schon im Nachbarfeld eines Vorkämpfers stehen, mit voller Bewegung?** „Betritt“ sagt: nur Eintritt zählt. Optionen: (a) ja, Eintritt zählt, Verlassen kostet nichts; (b) wer startet in der Haltezone, darf nur ein Feld weit ziehen. Empfehlung: (a), wörtliche Auslegung, kein Festkleben.
   **Entschieden: volle Bewegung im Nachbarfeld.** Wer im Nachbarfeld startet, hat volle Bewegung; nur der Eintritt in ein Haltefeld zählt.
3. **Zählt ein Feld in der Haltezone, das durch Verbündete durchzogen wird?** Ein Feind kann durch eigene Einheiten ziehen. Optionen: (a) Anhalten gilt auch bei Durchzug und das Feld muss zum Stehen frei sein, sonst endet die Bewegung davor; (b) Stehen nur auf freien Haltefeldern, Durchzug über besetzte Haltefelder gesperrt. Empfehlung: (b) (Bewegung endet auf dem Feld, also nie durch ein besetztes), vereinfacht Pfadkosten.
   **Entschieden: Durchzug über besetzte Haltefelder ist gesperrt.** Ein besetztes Haltefeld wird weder betreten noch durchquert.
4. **Wechselwirkung mit Fliegern, Verdrängung und Teleport.** Optionen Flieger (Pegasusritter, `moveType: flier`): (a) werden wie alle angehalten; (b) ignorieren Halten. Rückstoß (Sturmbrecher, Windstatus `knockback`) und künftige Verschiebungen: (a) enden auch auf Haltefeldern ohne weiteren Effekt (Halten gilt nur für eigene Bewegung); (b) zählen als Betreten. Teleport gibt es im Code nicht; Regel für später offenlassen. Empfehlung: Flieger werden angehalten (GDD nennt keine Ausnahme), Rückstoß und Verschiebung lösen Halten nicht aus.
   **Entschieden: Flieger werden gehalten.** Rückstoß und Verschiebung lösen Halten nicht aus. Teleport gibt es nicht; die Regel dafür bleibt offen.
5. **Gilt Halten gegen Bewegung nach Nachsetzen?** Nachsetzen eines Spieler-Plänklers neben einem gegnerischen Vorkämpfer: wie normale Bewegung (Haltezone stoppt). Optionen: (a) ja wie jede Bewegung; (b) Nachsetzen ignoriert Halten. Empfehlung: (a).
   **Entschieden: Halten gilt auch für die Nachsetz-Bewegung.**
6. **Wie wird „Restbewegung“ gezählt?** Optionen: (a) Budget = `mov` minus Kosten der Bewegung vor dem Angriff, neuer Weg ab dem Standfeld nach Geländekosten; (b) pauschal ein fester Wert (z. B. `pursue.tiles`) in `balance.yaml`; (c) Rest in Feldern statt Kosten. Empfehlung: (a), entspricht „Restbewegung“ und `mov` aus den Werten; Buffs (Anfeuern +1 MOV) zählen mit, weil `computeStats` sie einrechnet.
   **Entschieden: Restbewegung = MOV (inkl. Buffs wie Anfeuern) minus bereits verbrauchte Bewegungskosten.** Auch die Kosten einer früheren `move`-Bewegung derselben Phase zählen.
7. **Gilt Nachsetzen nach jedem Angriff, auch nach Zielen/Heilen/Klassen-Aktionen?** GDD: „nach dem Angriff“. Optionen: (a) nur nach `attack` (und `aim`, den es für Plänkler nicht gibt, also nur `attack`); (b) auch nach Stab/Heilen, Item und Klassen-Aktionen. Zusatz: Gilt es, wenn der Angriff das Ziel nicht trifft, wenn der Plänkler im Konter fällt oder wenn er schon an dem Gelände-/Haltefeld festhängt? Empfehlung: nur nach `attack`, unabhängig von Treffer/Tod des Ziels, nicht wenn der Plänkler selbst niedergestreckt ist.
   **Entschieden: Nachsetzen nur nach `attack`, auch wenn das Ziel fällt; nicht, wenn der Plänkler selbst niedergestreckt ist.**
8. **Zählt „Restbewegung“ auch, wenn der Plänkler vor dem Angriff gar nicht gezogen ist?** Dann wäre das volle `mov` übrig (Angriff aus dem Stand, danach 6 Felder zurückziehen: „Hit and Run“). Optionen: (a) ja, volles Budget; (b) Nachsetzen nur nach vorheriger Bewegung; (c) mit Abzug (z. B. höchstens halbes `mov`). Empfehlung: (a), wörtliche Regel, aber per Sim prüfen; falls zu stark, (c) über `balance.yaml`.
   **Entschieden: auch nach einem Angriff aus dem Stand** (dann ist die volle MOV der Rest).
9. **Wann ist „jedes andere Command“?** Optionen: (a) jedes Command beendet die Möglichkeit, auch eines einer anderen Einheit, `equip`, `trade`, `convoy` und `endPhase`; (b) nur Commands derselben Einheit. Empfehlung: (a) (Architektur-Text), mit sichtbarem „Fertig“ und Nachsetz-Rest-Marke, damit das nicht überrascht. Zusatzfrage: Soll das Dock für den Spieler eine Option „Nachsetzen lassen“ haben (ein Tipp), wenn er nicht mehr weiterziehen will? Empfehlung: ja.
   **Entschieden: jedes andere Command beendet die Möglichkeit** (jede Einheit, auch `endPhase`, `equip`); zusätzlich gibt es die sichtbare Taste „Fertig“ im Dock.
10. **Wie nutzt die KI Nachsetzen?** Gegnerische Plänkler gibt es (`ch01_varnhold` e4, e7). Optionen: (a) KI nutzt es nicht (wie bei Story 2.3, Sim ändert sich nur durch Halten); (b) KI zieht nach dem Angriff auf das Feld mit dem niedrigsten `dangerMap`-Wert in ihrer Restbewegung (Rückzug aus der Gefahr); (c) Vorrücken zum nächsten Ziel. Empfehlung: (a) in dieser Story, KI-Nutzung als eigene Story; entscheidet die Balance und macht die Schwierigkeitskurve prüfbar.
   **Entschieden: die KI nutzt Nachsetzen in dieser Story nicht.**
11. **Umweg-Messung „höchstens 2 Felder länger“.** Optionen: (a) in Bewegungskosten (Gelände zählt), (b) in Feldschritten (Pfadlänge). Und: gegen welchen Weg wird verglichen, wenn auch Gegner/Hindernisse blockieren (kürzester freier Weg bis zum Ziel-Standfeld)? Empfehlung: (a) Kosten, verglichen mit dem kürzesten Weg ohne Haltezone-Rücksicht bis zum selben Ziel (Standfeld für Angriff oder Zielfeld des Profils); wirkt auf `bestApproach` und auf das Wählen der Angriffs-Standfelder. Außerdem: Läuft die KI absichtlich in eine Haltezone und stoppt dort, gilt das Feld als Zielfeld (Angriff nur wenn dort die Reichweite stimmt)?
   **Entschieden: Umweg in Bewegungskosten** gegen den kürzesten Weg ohne Haltezone zum selben Ziel-Standfeld; der Wert 2 steht in `balance.yaml › classActions.hold.detourMax`. Ein Haltefeld ist ein normales erreichbares Endfeld (auch als Angriffs-Standfeld).
12. **Spieler-Warnung?** Soll die Bewegungsvorschau des Spielers die Haltezonen der Gegner einfärben und beim Ziehen eines Pfads durch eine Haltezone eine Warnung zeigen (Pfad endet früher)? Empfehlung: Haltezonen aller Vorkämpfer als schmale Schraffur im Gefahrenmodus; der Pfad endet automatisch am ersten Haltefeld (Geistervorschau zeigt das).
   **Entschieden: Haltezonen im Gefahr-Modus schraffiert;** der Bewegungspfad endet automatisch am ersten Haltefeld. (Umsetzung: siehe Dev Agent Record, Schraffur braucht eine neue Overlay-Liste in `src/render/board.ts`.)
13. **Profi-Wege.** `bulwark` (Schutz Nachbarn +10 %) und `breaker` (Rückstoß) berühren Halten. Rückstoß: siehe Frage 4. Unklar, ob Bollwerk/Sturmbrecher in dieser Story schon wirken sollen. Empfehlung: nein, eigene Stories mit den Profi-Wegen.
   **Entschieden: Profi-Wege Bollwerk/Sturmbrecher nicht in dieser Story.**

## Dev Agent Record

### Completion Notes List

- **Halten:** `holdZone(data, s, team)` in `src/core/rules/movement.ts` leitet die Zone aus dem State ab (Nachbarfelder aktiver, feindlicher Einheiten mit `classActionId === 'hold'`; Vorkämpfer und die Profi-Wege Bollwerk/Sturmbrecher tragen die Aktion in `classes.yaml`; `lockedRoles` greift). `reachable` nimmt das Haltefeld mit normalen Kosten auf, expandiert es aber nicht; ein besetztes Haltefeld wird weder betreten noch durchquert; wer im Haltefeld startet, bewegt sich frei. Spielerbereich, Gefahrenzone, Bedrohungsfelder, KI und Autoplay laufen alle über `reachable`, die Regel steht nur dort. Rückstoß/Verschiebung setzen `pos` direkt und lösen Halten nicht aus (Teleport gibt es nicht, Regel bleibt offen).
- **Nachsetzen:** neues Command `{ type: 'pursue'; unit; to }`, Fehler `no_pursue`, State `BattleState.pursue?: { unit, left }` (reines JSON), neues optionales Feld `BattleUnit.moveSpent` (Kosten der Bewegung dieser Phase, damit auch eine frühere `move`-Bewegung von der MOV abgezogen wird). `applyCommand` löscht `pursue` bei jedem Command und setzt es nach einem `attack` eines Plänklers (Klassen-Aktion `pursue`, auch Profi-Weg) neu, wenn der Plänkler noch aktiv ist, die Schlacht läuft und es ein anderes erreichbares freies Feld gibt. `pursue` umgeht `unit_exhausted` gezielt, nutzt `reachable(…, left)` (Halten gilt) und das Event `moved`; `afterUnitMoved`/`checkObjectives` laufen wie bei jeder Bewegung. `exhausted` und Support-Punkte bleiben beim Angriff. Die KI geht über `applyAct` und setzt kein `pursue`.
- **KI-Pfadsuche:** `bestApproach` (Signatur unverändert) kennt die Haltezonen. Es berechnet ein Umgehungs-Feld (`distanceField(…, avoid)`, Haltefelder werden nicht durchquert) zu dem Ziel-Standfeld, zu dem der kürzeste Weg ohne Rücksicht auf Haltezonen führt. Ist der Umweg in Bewegungskosten höchstens `classActions.hold.detourMax` (2, `balance.yaml`) länger, nimmt die KI das Umgehungs-Feld und endet nicht auf einem Haltefeld; sonst läuft sie hinein und bleibt dort stehen. Angriffspläne wählen Standfelder wie bisher aus den erreichbaren Zielen; ein Haltefeld ist ein normales Endfeld.
- **Vorschau:** `pursueRest` (Rest der MOV; `applyCommand` und Vorschau rufen dieselbe Funktion) und `passivePreview` (Haltezone bzw. Rest) in `battle/actions.ts`; `pursueReach` in `movement.ts` liefert die Nachsetz-Felder für UI und `validate`. `classActionId` wohnt jetzt in `src/core/rules/roles.ts` (Import-Zyklus mit `movement.ts` vermieden) und wird weiter aus `battle/actions` exportiert.
- **UI:** Der Klassen-Platz zeigt für Vorkämpfer und Plänkler das Rollen-Symbol als Zustand „bereit“ (gestrichelter Rahmen, nicht gedimmt, `DockAction state`); ein Tipp öffnet die Regelkarte (`PassiveRuleCard`) mit Vorschau (Haltezone auf dem Brett bzw. Rest nach dem Angriff). Nach dem Angriff eines Plänklers mit Rest öffnet sich der Nachsetz-Modus: blaue Felder, Pfad und Geisterfigur, Haupttaste „Nachsetzen“, Taste „Fertig“ (verwirft die Möglichkeit ohne Command; das Phasenende läuft dann wie nach der letzten Aktion). Die Auto-Phasenende-Prüfung wartet, solange `pursue` offen ist; die Auswahl einer anderen Einheit lässt die Möglichkeit los. Der Modus öffnet sich auch nach dem Laden eines Spielstands mit offenem `pursue`. Der Zustand „aktiv“ erscheint als Rollen-Symbol im Hinweis des Nachsetz-Modus. Texte in `de.yaml`/`en.yaml` (`ui.passive.*`, `ui.pursue.*`).
- **Haltezonen im Gefahr-Modus:** Entscheidung des Produktinhabers (2026-10-24): eigene Overlay-Liste `hold` mit Schraffur in `src/render/board/overlays.ts` (diagonale Streifen, violett); `Battle.tsx` nutzt sie für die Zonen feindlicher Vorkämpfer im Gefahr-Modus und für die Vorschau der Haltezone eines eigenen Vorkämpfers. Der Zustand „aktiv“ des Plänklers bleibt als Rollen-Symbol im Hinweis des Nachsetz-Modus (bestätigt).
- **Nicht visuell geprüft:** Die Oberfläche wurde typgeprüft und gelintet, aber nicht im Browser angesehen (kein Screenshot).
- **Tests:** `tests/unit/hold-pursue.test.ts` (32 Tests): Haltezone, Halten für beide Teams/Flieger/Profi-Wege/gesperrte Rolle, Start im Haltefeld, besetztes Haltefeld, KI-Umweg 2 umgangen / 3 hinein / Korridor, Nachsetzen (Rest, Stand, Buffs, frühere `move`-Bewegung, Ziel fällt, nur Plänkler und `attack`, Plänkler niedergestreckt, eingekesselt, Ende durch `endPhase`/`equip`/anderes Command, Halten beim Nachsetzen, KI nutzt es nicht, Replay, Vorschau). `class-actions.test.ts` kennt `hold` in `classActions`.
- **Prüfungen:** `pnpm lint` grün, `pnpm content:check` grün, `pnpm build` grün (Bundle 10,69 MB von 15 MB). `pnpm test`: 405/405 grün; bei hoher Last der Maschine (mehrere parallele Sessions) laufen einzelne Dateien in das 5-s-Standard-Timeout, mit `--testTimeout=120000 --hookTimeout=120000 --maxWorkers=3` ist alles grün.

### Simulation (`pnpm sim <map> --runs 50 --difficulty …`, Standard-Tod-Modus, vor 2.4 → nach 2.4 inklusive Prolog-Nachjustierung)

| Karte | Stufe | vorher: Sieg / Niedergestreckte | nachher: Sieg / Niedergestreckte |
| --- | --- | --- | --- |
| prologue_caravan | normal | 94 % / 0,70 | 96 % / 0,48 |
| prologue_caravan | schwer | 40 % / 1,34 | 46 % / 1,06 |
| ch01_varnhold | normal | 77 % / 0,36 | 81 % / 0,21 |
| ch01_varnhold | schwer | 35 % / 1,00 | 48 % / 0,91 |
| ch02_silverbrook | normal | 89 % / 0,56 | 82 % / 0,69 |
| ch02_silverbrook | schwer | 29 % / 0,00 | 27 % / 0,36 |

Korridore (GDD): Normal 75–100 % Sieg und 0,4–1,3 Niedergestreckte, Schwer 30–70 % Sieg. Zwischenstand nur mit Halten (Prolog unverändert): Prolog normal 92 % / 0,16, schwer 46 % / 1,06; ch01 normal 85 % / 0,37, schwer 48 % / 0,91; ch02 normal 90 % / 0,79, schwer 27 % / 0,36. Halten hatte die Niedergestreckten im Prolog (Normal) von 0,70 auf 0,16 gedrückt. **Nachjustierung (Entscheidung des Produktinhabers):** in `content/acts/act1/maps/prologue_caravan.yaml` ist der nur auf Normal vorhandene Westrand-Bandit `p_e5` jetzt angriffslustig (`aggressive` statt `trigger`), steht auf (2,5) und trägt eine Handaxt statt der Eisenaxt; Schwer ist unberührt (46 % / 1,06 wie zuvor). Ein stärkerer Bandit (Eisenaxt, Stufe 2–3) brachte den Prolog zwar in den Korridor, drückte aber über die verkettete Kampagne ch01 und ch02 Normal unter 75 % (67 % und 73 %). Nach der Nachjustierung liegen alle Normal-Siege ≥ 75 %, die Niedergestreckten im Prolog (0,48) und in ch02 (0,69) im Korridor; ch01 normal liegt mit 0,21 unter 0,4, wie schon vor 2.4 (0,36). ch02 schwer liegt mit 27 % unter 30 % (vorher 29 %). Gegengeprüft mit den Seeds 1, 101, 201 (Eisenaxt-Variante 0,42–0,48), die gewählte Variante mit Seed 1.

### Schnittstellen und Hinweise für Story 2.8 (Worker)

- Keine Signatur öffentlicher KI-Funktionen geändert (`runAiPhase`, `bestApproach`, `attackPlans`); das private `distanceField` bekam den optionalen Parameter `avoid`.
- Neu und öffentlich: `holdZone`, `moveBudget`, `pursueReach` (`rules/movement.ts`), `pursueRest`, `passivePreview`, `PassivePreview` (`battle/actions.ts`); `classActionId` kommt aus `rules/roles.ts`.
- Neue Daten im State: `BattleState.pursue?` und `BattleUnit.moveSpent?` (beide optional und serialisierbar; Speicherformat bleibt 2, keine Migration nötig). Haltezonen sind aus dem `BattleState` ableitbar, es gibt keinen Zwischenspeicher.
- `Command` hat die neue Variante `pursue`, `CommandError` den Wert `no_pursue`.

### File List

- `_bmad-output/implementation-artifacts/2-4-halten-und-nachsetzen.md`
- `concept/21-gdd/decision-log.md`
- `content/acts/act1/maps/prologue_caravan.yaml`
- `content/core/balance.yaml`
- `content/core/locales/de.yaml`
- `content/core/locales/en.yaml`
- `src/app/screens/Battle.tsx`
- `src/app/screens/BattleHud.tsx`
- `src/content/schemas.ts`
- `src/core/ai/ai.ts`
- `src/core/battle/actions.ts`
- `src/core/battle/apply.ts`
- `src/core/battle/commands.ts`
- `src/core/defs.ts`
- `src/core/rules/movement.ts`
- `src/core/rules/roles.ts` (neu)
- `src/core/state.ts`
- `src/render/board/overlays.ts`
- `src/ui/hud.css`
- `tests/unit/class-actions.test.ts`
- `tests/unit/hold-pursue.test.ts` (neu)
