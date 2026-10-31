# Story 10.4: Fallensteller und Schatten

Status: ready-for-dev

## Story

Als Spieler
möchte ich mit Späher-Profis Fallen legen oder im Nebel verschwinden,
damit Späher im späten Spiel eine eigene Taktik haben.

## Acceptance Criteria

1. **Klassen `shadow` und `trapper`:** Beide Profiklassen der Rolle `scout` stehen in `content/core/classes.yaml` (`tier: pro`, `role: scout`, Kletterer wie die Rolle, Waffen `dagger`, `light_bow`, Öffnen/Stehlen behalten sie), mit Namen, Kurztext, Handbuch-Eintrag `class_shadow`/`class_trapper` und – sobald 10.3 die Mechanik hat – ihrem Brett-Großteil. Werte: **[PO-Frage]** (wie 10.3).
2. **Fallen legen (Fallensteller):**
   **Angenommen** ein Fallensteller mit Aktion
   **Wenn** er die Aktion `trap { at }` auf ein freies, begehbares Feld in Reichweite (Wert in `balance.yaml`, Offene Frage 2) wählt
   **Dann** liegt dort eine Falle (Teil des `BattleState`, z. B. `traps: [{ at, owner, team }]`), die Aktion ist verbraucht; liegen schon 2 Fallen dieses Fallenstellers (`balance.classActions.trap.max: 2`), ist die Aktion gesperrt oder ersetzt die älteste (Offene Frage 3). Fallen bleiben bis Missionsende.
3. **Falle auslösen:**
   **Angenommen** eine gegnerische Einheit betritt das Feld einer Falle
   **Dann** endet ihre Bewegung dort, sie nimmt 8 Schaden (`balance.classActions.trap.damage: 8`, kann töten; Leutnants fliehen bei 0 TP wie sonst) und erhält `slowed` (Verlangsamt, 2 Runden), die Falle verschwindet; Event `trapTriggered { at, unit, damage }`, das die Gegnerphase abspielt.
4. **Unsichtbar für Gegner, sichtbar für den Spieler:** Die Spielerseite sieht ihre Fallen als Markierung auf Feldhöhe; die KI kennt sie **nicht**: Pfadsuche, Gefahrenbewertung und Zielwahl der Gegner ignorieren Fallen (sie laufen hinein). Die Gegnerphase im Worker liefert dasselbe Ergebnis wie synchron (§8.5).
5. **Entschärfen:** `disarm { at }` (Architektur §5.7) entfernt eine Falle auf einem Nachbarfeld – für wen und welche Fallen: Offene Frage 4.
6. **Schatten im Nebel:**
   **Angenommen** eine Karte mit Nebel (`maps.<id>.fog`) und ein Schatten, der nicht angegriffen hat (wann er nach einem Angriff wieder verborgen ist: Offene Frage 5)
   **Dann** ist er für Gegner unsichtbar: kein Gegner wählt ihn als Ziel, keiner bewertet ihn als Gefahr, die Gefahrenzone der Spieler zeigt das (Hinweis „unsichtbar“ an der Figur); greift er an, wird er sichtbar.
   **Und** auf Karten ohne Nebel gilt die Wirkung nicht (Offene Frage 6); die Klassen-Info sagt das.
7. **Reproduzierbar und regelkonform:** Fallen und Unsichtbarkeit liegen vollständig im `BattleState` (Plain-JSON); Replay (Start + Command-Log), Neustart „Runde neu“, Gegnerphase im Worker und Simulation (`pnpm sim`) ergeben identische Ergebnisse; die KI „schummelt“ nicht über Wissen, das der Regel widerspricht (sie liest nur, was eine Gegner-Sicht-Funktion zurückgibt).
8. **Vorschau:** Der Fallen-Modus zeigt gültige Felder als Bereichskacheln (Epic 13), die Zahl gelegter Fallen (z. B. „1/2“) am Aktions-Stein; Einheiten-Info des Gegners nennt keine Fallen.

## Tasks / Subtasks

- [ ] T1 Content (AC 1): `classes.yaml` `shadow`, `trapper`; Texte DE/EN; Handbuch-Einträge; `balance.yaml` `classActions.trap: { max: 2, damage: 8, range: … }` und `classActions.shadow` (falls Werte nötig)
- [ ] T2 Zustand (AC 2, 3, 6): `BattleState.traps` und eine Markierung für „hat angegriffen“ (`BattleUnit.revealed` o. ä.) in `src/core/state.ts`, Default in `createBattle`; keine `undefined` mit Bedeutung (§8.7)
- [ ] T3 Aktionen (AC 2, 3, 5): `Action`-Arten `trap{at}` und `disarm{at}` in `src/core/battle/commands.ts`/`apply.ts`; Auslösen in der Bewegung (`rules/movement.ts` bzw. dort, wo Bewegung aufgelöst wird; Bewegung endet auf dem Fallenfeld); Events `trapSet`, `trapTriggered`, `trapDisarmed` in `events.ts`
- [ ] T4 Gegner-Sicht (AC 4, 6, 7): eine reine Funktion `enemyKnowledge(data, s)` bzw. Filter für die KI (`src/core/ai/ai.ts`): ohne Fallen, ohne unsichtbare Schatten; Spieler-Seite `visibleState` (`rules/vision.ts`) zeigt eigene Fallen
- [ ] T5 Render/UI (AC 4, 8): Fallen-Markierung in `src/render/board/overlays.ts` (Werte in `render.yaml`), Aktions-Stein und Kontext-Band, Hinweis „unsichtbar“ an der Figur (DOM-Ebene wie Lebensleisten); Effekt beim Auslösen nach Art Direction §8 (≤ 600 ms); Klang **später (Audio)**
- [ ] T6 Autoplay/Simulation: `src/core/ai/autoplay.ts` kann Fallen legen (einfache Heuristik: Engstelle vor Gegnern), damit `pnpm sim` die Klasse nicht ignoriert
- [ ] T7 Tests: Falle legen (max. 2), auslösen (8 Schaden + Verlangsamt, Bewegung endet), KI läuft hinein, Entschärfen, Schatten unsichtbar im Nebel/sichtbar nach Angriff/wirkungslos ohne Nebel, Worker = synchron, Replay, „Runde neu“ entfernt in der Runde gelegte Fallen
- [ ] T8 Architektur §5.7 „Stand“, Decision-Log

## Dev Notes

### Heutiger Stand (nicht brechen)

- Späher-Rolle `scout`: `classAction: { id: open_steal }`, `proPaths: [shadow, trapper]`, Skill `climber`, Sicht +2 (`balance.fog.roleBonus.scout`). `rules/scout.ts` (Öffnen/Stehlen, `stealPreview`).
- Nebel ist je Karte (`fogOn(data, s)` = `maps.<id>.fog`); ohne Nebel sieht jeder alles. **Die Gegner-KI sieht immer alles** – der Nebel gilt laut `balance.yaml` (Kommentar über `fog`) nur für Brett, UI, Vorschau und abgespielte Events der Spielerseite (`visibleState`, `filterEvents`). „Für Gegner unsichtbar“ braucht also eine **neue** Gegner-Sicht nur für Fallen und Schatten, kein Umbau des Nebels.
- Status `slowed` (−1 MOV, `balance.status.slowMovPenalty`, Dauer `durationRounds: 2`) existiert; `applyStatus` ist an `mechanics.status` gebunden (Akt 1 ab der 3. Story-Mission) – in Akt 2 ist er an.
- `BattleState.objects` kennt `village | chest | door | lever | ballista`; Fallen sind keine Objekte der Karte, sondern Zustand der Mission (eigene Liste).
- Neustart „Runde neu“ spielt das Log bis `keep` neu ab – Fallen aus dem Log entstehen dabei wieder korrekt, solange sie nur aus Commands entstehen.
- Gegnerphase im Web Worker (Story 2.8) mit synchronem Fallback; neue Daten müssen im `BattleState` reisen.

### Abgrenzung

- Das Item **Fallen-Set** (`trap_kit`, `items.md` Z. 163, Werkstatt Stufe 3 in Story 10.5) ist nicht Teil dieser Story; ob es dieselbe Falle legt, klärt Offene Frage 7.
- Brett-Großteil der Profis: Mechanik aus Story 10.3.

### Regeln

- Jeder Zufall aus dem Seed-RNG; hier gibt es keinen (Falle trifft sicher) – bitte so lassen, sonst Offene Frage.
- Vorschau = Auflösung (AGENTS.md); Werte in `balance.yaml`.
- `src/core` ohne DOM/Babylon.

### Offene Fragen

1. **[PO-Frage]** Werte von `shadow` und `trapper` (wie 10.3, Offene Frage 1).
2. **Reichweite** des Fallenlegens: nur Nachbarfeld, eigenes Feld oder bis 2? Vorschlag: Nachbarfeld (Reichweite 1).
3. **Dritte Falle:** gesperrt oder ersetzt die älteste? Vorschlag: ersetzt die älteste (weniger Taps, kein toter Zustand).
4. **Entschärfen:** Wer entschärft was? GDD „Fallen entschärfen“ steht beim Fallensteller; gibt es Gegner-Fallen (Karten, Leutnants) oder nimmt er nur eigene zurück? Vorschlag: Fallensteller entschärft auf Nachbarfeldern Fallen aus Karten-Daten (neues optionales Feld `traps` je Karte für Akt 2/3) und eigene.
5. **Schatten: wann wieder unsichtbar?** GDD „im Nebel für Gegner unsichtbar, bis er angreift“ – für den Rest der Mission sichtbar oder ab dem nächsten eigenen Zug wieder unsichtbar? Vorschlag: bis Ende der nächsten Gegnerphase sichtbar, danach wieder unsichtbar.
6. **Schatten ohne Nebel:** Die meisten Karten haben keinen Nebel; ist der Schatten dort ohne Wirkung? Vorschlag: auf Karten ohne Nebel gilt „unsichtbar, solange er nicht neben einem Gegner steht“, oder die Akt-2/3-Karten bekommen öfter Nebel (Epic 11/12 Level-Design).
7. **Fallen-Set (`trap_kit`):** Legt jede Figur damit eine Falle mit denselben Werten (dann teilt es sich Code und Zustand mit dieser Story) und zählt es gegen die 2 des Fallenstellers?
8. **Verbündete und dritte Partei:** Lösen Verbündete (`other`) und eigene Einheiten Fallen aus? Vorschlag: nein, nur Team `enemy`.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.4]
- [Source: concept/21-gdd/gdd.md#Rollenklassen (Späher-Zeile), #Primäre Mechaniken (Status), #Gegner-KI]
- [Source: concept/24-architecture/architecture.md#5.7 (Aktionen `trap{at}`, `disarm{at}`, Nebel), #5.13 (Worker), #8.5, #8.7]
- [Source: concept/21-gdd/items.md Z. 163 (trap_kit)]
- [Source: _bmad-output/implementation-artifacts/2-6-nebel-des-krieges-oeffnen-und-stehlen.md, 2-8-gegnerphase-im-web-worker.md, 13-2-bereiche-als-kacheln-und-weg-pfeil.md]
- Code: `content/core/classes.yaml` (`scout`), `balance.yaml` (`fog`, `status`, `classActions`), `src/core/rules/vision.ts`, `scout.ts`, `movement.ts`, `src/core/battle/apply.ts`, `commands.ts`, `src/core/ai/ai.ts`, `autoplay.ts`, `src/render/board/overlays.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
