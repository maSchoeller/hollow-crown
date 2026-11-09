---
baseline_commit: e9ed729
---
# Story 11.11: Kampagnenfolge von Akt 2

Status: review

## Story

Als Spieler
möchte ich Akt 2 in der Folge der abgenommenen Missionsliste spielen,
damit Weg und Geschichte zusammenpassen.

Setzt auf 11.1 (`c.act`, `enterNextAct`, Nebenquests früherer Akte bleiben offen), 11.3 (Platzhalter-Knoten `m2_*`, `n4`–`n6` in `content/acts/act2/campaign.yaml`, Filter `mapInBuild`) und 11.5 (Gefährten `ilka`, `jory` in `content/acts/act2/units.yaml`). Kein Live-Schritt: Die Knoten bleiben Platzhalter, bis ihre Missions-Story (11.12–11.22) die Karte anlegt. Klein: im Kern ändert sich voraussichtlich nichts, die Arbeit liegt in `campaign.yaml` und einem Reihenfolge-Test nach dem Vorbild von Akt 1.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.11 (BDD dort); Folge und Nebenquests: `concept/22-narrative/missionsliste-s1.md` § „Regeln“, § „Akt 2 „Glut““, § „Prüfungen“; Ziele: Entwürfe `concept/27-ueberarbeitung/levels/s2_*.yaml` (`objectives.victory.type`).

1. **Folge:** `acts/act2/campaign.yaml` erlaubt genau `m2_1 → (m2_2 ∥ m2_3) → m2_4 → (m2_5 ∥ m2_6) → m2_7 → m2_8`, also 4 Reihenfolgen der Story-Missionen; jede spielt alle 8 Story-Knoten einmal und endet mit `fixed: finale` (`m2_8`). Über jeden Schritt jeder Reihenfolge sind höchstens 2 Story-Missionen gleichzeitig offen (gemessen: genau 2).
2. **Ziele:** In keiner erlaubten Reihenfolge folgt ein Ziel (`victory.type`) zweimal aufeinander, auch nicht über ein Paar hinweg; nur Story-Missionen zählen. Solange ein Knoten keine Karte hat, kommt sein Ziel aus dem Entwurf (Zuordnung Knoten → Entwurf im Test); hat er eine, aus der Karte (dann muss `map.design` auf denselben Entwurf zeigen). Erwartet: survive · {treasure, boss} · defend · {escort, rout} · reach · escape.
3. **N4** öffnet nach `m2_3`, wenn Ilka in der Truppe ist; **N5** öffnet nach `m2_4` ohne weitere Bedingung; **N6** öffnet mit `m2_7`, wenn Jory in der Truppe ist. Je ein Test „vorher zu / danach offen / ohne Figur zu“ wie in `act1-campaign-order.test.ts`. Genaue Bedingung bei gefallener oder gegangener Figur und Zeitpunkt von N6: Offene Fragen 1 und 2.
4. **Nebenquests bleiben offen:** Eine geöffnete Nebenquest von Akt 2 bleibt in jeder Reihenfolge bis einschließlich vor `m2_8` spielbar (sie zählt nicht als Story-Mission und sperrt nichts); offene Nebenquests von Akt 1 (`n1`–`n3`) bleiben in ganz Akt 2 angeboten (Regel aus 11.1, hier für alle Reihenfolgen geprüft). Nach `m2_8`: Offene Frage 3.
5. **Platzhalter:** Knoten, deren Karte in keinem Paket des Builds liegt, bietet die Weltkarte nicht an (`mapInBuild`, vorhanden seit 11.1/11.3); ein Test belegt das für alle Knoten von Akt 2 im heutigen Stand. Mit einer Karte für genau einen Knoten des Paars wird nur dieser angeboten, der nächste Knoten nach dem Paar bleibt zu, bis beide gespielt sind.
6. **Simulation:** `pnpm sim --campaign act2 --runs 20` und mit `--order m2_3,m2_6` laufen ohne Fehler durch (die Platzhalter spielt die Simulation über ihre eigene Logik aus 11.4; hier nur, dass die geänderten `requires` sie nicht brechen).
7. `content:check` grün; kein Formatwechsel, kein `content:lock`, `released-ids.json` unberührt.

## Tasks / Subtasks

- [x] `content/acts/act2/campaign.yaml`: `requires` von `n4` (Ilka), `n6` (Jory, Zeitpunkt „mit 2-7“) nach den PO-Antworten setzen; Kopfkommentar und Kommentar über `nodes` von „[ASSUMPTION] … 11.11 prüft“ auf den geprüften Stand bringen; Story-Knoten unverändert lassen, falls der Test sie bestätigt (AC 1, 3)
  - [x] Falls Antwort 1 = A (wie N3): `memorialIf`/`memorial` erst mit 11.20 bzw. 11.22 (Szenen fehlen noch); hier nur die Bedingung, Kommentar mit Verweis
- [x] Neuer Test `tests/unit/act2-campaign-order.test.ts` nach `tests/unit/act1-campaign-order.test.ts` (AC 1–4)
  - [x] Daten: `loadContentFromDisk().data` mit `releasedActs: [1, 2]` (Muster `act-transition.test.ts` Z. 72); Startzustand in Akt 2 = neue Kampagne mit allen Story-Knoten von Akt 1 in `completed`, `act: 2`, `home` Burg (Muster `inAct2`, Z. 226)
  - [x] `walk()` über `availableNodes(...).filter(kind === 'story')` und nur Knoten von `data.acts[2]` → 4 Reihenfolgen, `mostOpen === 2`
  - [x] Ziel je Knoten: `data.maps[n.map]?.objectives.victory.type`, sonst aus dem Entwurf (Tabelle `m2_1 → s2_2_1_windscharte` … `m2_8 → s2_2_8_kronfeld`, Dateien per `readFileSync` + `yaml.parse` wie `act2-drafts.test.ts`); Test, dass jeder Story-Knoten einen Entwurf oder eine Karte hat
  - [x] Nebenquests: vorher/nachher/ohne Figur (Ilka bzw. Jory über `c.roster` ein-/austragen wie Tobin im Akt-1-Test), Fälle gefallen/gegangen nach Antwort 1
  - [x] Offenbleiben: für jede Reihenfolge und jeden Schritt nach dem Auslöser ist die Nebenquest angeboten, bis `m2_8` gespielt ist; `n1`–`n3` (per `quests`/Flags/Tobin offen gemacht) in jedem Schritt von Akt 2 angeboten
- [x] Platzhalter-Test (AC 5): `mapInBuild` aus `src/app/state/packs.ts` liest `packOfMap` (`src/content/browser.ts`, `contentIndex.maps`); Test in `tests/unit/world-map.test.ts` oder `packs.test.ts` (dort ist das Paket-Setup schon da) – heute ist `mapInBuild` für alle `m2_*`/`n4`–`n6`-Karten false; mit einer Test-Karte für `m2_2` wird nur `m2_2` angeboten, `m2_4` erst nach `m2_2` und `m2_3`
- [x] Simulation (AC 6) laufen lassen, Ausgabe nur auf Fehler prüfen
- [x] `pnpm check`; Entscheidungen (PO-Antworten) ins Decision-Log der Missionsliste bzw. Epics (`concept/22-narrative/.decision-log.md` oder `concept/26-epics/.decision-log.md`, das zuständige wählen)

## Dev Notes

- **Graph (Ist-Stand, `src/core/campaign/graph.ts`):** `availableNodes` rechnet bei jedem Aufruf neu, nichts wird gespeichert. Erst nur `fixed: first`; Story-Knoten bei erfüllten `requires` (mehrere Einträge = UND); `fixed: finale` zusätzlich erst, wenn alle anderen Story-Knoten des Akts erledigt sind. Nebenquest (`kind: side`) offen, wenn `c.quests` sie enthält (Wirkung `openQuest`) **oder** ihre nicht-leeren `requires` gelten. Nebenquests früherer Akte bleiben offen (`nodesUpTo(act − 1)` mit `kind: side`), Story-Knoten früherer Akte nie. „Höchstens 2 offen“ ist keine Regel im Code, sondern folgt aus dem Graphen; der Test misst es.
- **Bedingungen (`src/core/campaign/conditions.ts`):** `alive: <id>` = steht im `roster` (also „in der Truppe“), `dead: <id>` = gefallen, `left: <id>` = gegangen, `completed`, `flag`, `any`, `not`, `storyCount`, `act`. Wichtig: `requires` einer Nebenquest werden **jedes Mal** ausgewertet. Mit nur `alive: ilka` verschwindet N4 wieder, wenn Ilka danach fällt oder geht. Akt 1 löst das zweifach: N3 mit `any: [alive tobin, dead tobin]` + `memorialIf` (Gedenk-Variante), N1 zusätzlich per `openQuest` (bleibt in `c.quests`). Siehe Frage 1.
- **Heutige Platzhalter (11.3):** `n4` `requires: [completed m2_3]`, `n5` `[completed m2_4]`, `n6` `[completed m2_7]` – Ilka/Jory fehlen, und N6 öffnet erst *nach* 2-7, die Missionsliste sagt „öffnet mit 2-7“ (Frage 2). Story-Knoten haben die Folge schon richtig; `m2_8` trägt zusätzlich `completed m2_7` (überflüssig neben `finale`, unschädlich, stehen lassen).
- **Ziele der Entwürfe:** 2-1 survive, 2-2 treasure, 2-3 boss, 2-4 defend, 2-5 escort, 2-6 rout, 2-7 reach, 2-8 escape (Ziel-Phasen survive → escape, 11.8; verglichen wird `victory.type`, dasselbe Feld wie in Akt 1). Keine Reihenfolge verletzt die Regel; der Test hält das fest, damit eine Missions-Story beim Übernehmen kein Ziel still ändert. N4 survive, N5 treasure, N6 escort zählen nicht mit. Entwurf-Ids (`s2_2_1_windscharte`) ≠ Karten-Ids der Knoten (`m2_1_windscharte`): Zuordnung im Test, nicht im Content.
- **Platzhalter-Filter:** `WorldMap.tsx` Z. 68–70: `availableNodes(...).filter((n) => mapInBuild(n.map))`. Andere Stellen nehmen ungefiltert `availableNodes`: `resumeWhere` (`src/app/campaignInfo.ts` Z. 38, Titelbild „vor Mission …“ kann einen Platzhalter nennen), `refreshTavern` (`campaign.ts` Z. 451, Stufe des nächsten Knotens; mit `positionLevel` unschädlich), `hauntLevel` filtert schon über `data.maps`. `[ASSUMPTION]` `resumeWhere` filtert ebenfalls mit `mapInBuild` und fällt sonst auf `ui.title.where.end`-artigen Text bzw. „Weitere Missionen folgen“ zurück – nur wenn der Fix klein bleibt, sonst als Befund in die Notizen.
- **Simulation:** `tools/simCampaign.ts` `nextNode` nimmt den ersten offenen Story-Knoten (mit `--order` bevorzugt), `prepareActData` setzt mit `--map-file` eine Karte für den Zielknoten; Platzhalter ohne Karte behandelt 11.4. Hier nichts ändern.
- **Nicht anfassen:** `sprint-status.yaml` (parallel bearbeitet), `content/core/items.yaml` (Story 11.9 parallel), Karten (Missions-Stories), Szenen (`memorial`-Szenen gehören 11.20/11.22).
- **Regeln (AGENTS.md):** keine Werte/Texte im Code, Bedingungen in YAML mit Zod-Schema (`src/content/schemaConditions.ts`, nichts Neues nötig); Tests lesen Content über `loadContentFromDisk`; Coverage `src/core` nicht senken; Vitest-Timeout 15 s – die Reihenfolgen-Suche ist klein (4 Wege), kein eigenes Timeout nötig.

### Learnings aus 11.3 und 11.5

- 11.3 hat die Platzhalter mit der Folge in `requires` angelegt und die Prüfung ausdrücklich an 11.11 übergeben (Annahmen dort); Karten-Ids `m2_<n>_<ort>` sind vorläufig, die Missions-Stories dürfen sie ändern (noch nichts gesperrt) – der Test darf Karten-Ids deshalb nicht hart erwarten, nur über `node.map` gehen.
- 11.5: `joined_<lt>` gilt als gesetzt (`isJoined`); Gefährtenzeilen unter `requires: alive` gehören den Missions-Stories. Akt 1 darf sich nicht ändern: Akt-1-Tests (`act1-campaign-order.test.ts`, `act-transition.test.ts`) müssen unverändert grün bleiben.
- Kein Formatwechsel: Diese Story fügt kein persistiertes Feld hinzu.

### Annahmen

- `[ASSUMPTION]` Ziel einer Karte im Vergleich = `victory.type` (bei 2-8 also escape, nicht die erste Phase survive); ändert hier nichts, weil 2-7 reach ist.
- `[ASSUMPTION]` N5 hat keine Figurenbedingung (Brann ist dort erst Beitritt).

### Fragen an den Produktinhaber – entschieden 2026-11-09

**PO-Entscheidung 2026-11-09 (Marvin, alle wie empfohlen, Option A):** 1 A (N4/N6 offen bei Figur in der Truppe oder gefallen, zu bei gegangen; Gedenk-Variante in 11.20/11.22), 2 A (N6 gleichzeitig mit 2-7), 3 A (Nebenquests von Akt 2 nach 2-8 nachholbar). Eingetragen in `concept/22-narrative/decision-log.md`.


1. **N4/N6, wenn Ilka bzw. Jory fällt oder geht:** A) wie N3/Tobin: offen bei „in der Truppe oder gefallen“ (Gedenk-Variante in 11.20/11.22), zu bei „gegangen“ – **Empfehlung**; B) einmal geöffnet bleibt sie offen (`openQuest` wie N1), auch wenn die Figur danach geht; C) nur solange die Figur lebt und dabei ist.
2. **„N6 öffnet mit 2-7“:** A) gleichzeitig mit 2-7 (nach 2-5 und 2-6), passt zu „liegt vor dem Kontor“ – **Empfehlung**; B) erst nach 2-7 (heutiger Platzhalter).
3. **Nebenquests von Akt 2 nach 2-8:** A) bleiben wie in Akt 1 über die Akte offen (Graph heute, Missionsliste „nach dem Akt nachholbar“) – **Empfehlung**; B) verfallen mit dem Finale (neue Regel im Graphen, widerspricht Akt 1).

### References

- `concept/26-epics/epics/epic-11.md` Z. 1–49 (Kopf, Platzhalter, Stückweise live), Z. 277–289 (Story)
- `concept/22-narrative/missionsliste-s1.md` § Regeln (Parallelität, Nebenquests), § Akt 2 (Folge, Nebenquests N4–N6), § Prüfungen (Ziele)
- `content/acts/act2/campaign.yaml`, `content/acts/act1/campaign.yaml` (N1/N3-Muster), `content/acts/act2/units.yaml`
- `src/core/campaign/graph.ts` (`availableNodes`, `open`), `src/core/campaign/conditions.ts` (`evalCondition`)
- `src/app/state/packs.ts` Z. 188–189 (`mapInBuild`), `src/content/browser.ts` Z. 35 (`packOfMap`), `src/app/screens/WorldMap.tsx` Z. 64–71
- `tests/unit/act1-campaign-order.test.ts` (Vorbild), `tests/unit/act-transition.test.ts` Z. 72, 226–244, `tests/unit/act2-drafts.test.ts` (Entwürfe lesen)
- `tools/simulate.ts` Kopf, `tools/simCampaign.ts` `nextNode`, `prepareActData`
- `_bmad-output/implementation-artifacts/11-3-paket-act2-weltkarte-und-titeltafel.md` (Annahmen), `11-5-gefaehrten-leutnants-und-flags-von-akt-2.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (gds-dev-story)

### Debug Log References

### Completion Notes List

- Story-Kontext erstellt (gds-create-story); sprint-status bewusst nicht geändert.
- `campaign.yaml`: N4 `requires: [completed m2_3, any(alive ilka, dead ilka)]`, N6 `requires: [completed m2_5, completed m2_6, any(alive jory, dead jory)]` (gleichzeitig mit 2-7); N5 und alle Story-Knoten unverändert, der Test bestätigt die Folge. Kopf- und Knotenkommentar auf den geprüften Stand; `memorialIf`/`memorial` erst mit 11.20/11.22 (Kommentar).
- Neuer Test `tests/unit/act2-campaign-order.test.ts` (15 Fälle): 4 Reihenfolgen, je 8 Story-Knoten, Finale am Ende, höchstens 2 offen (gemessen 2); Ziele aus Entwurf bzw. Karte (abweichend von AC 2: Karten tragen keinen Verweis auf ihren Entwurf – `design` sind Planungsnotizen –, daher muss eine gebaute Karte dasselbe `victory.type` wie ihr Entwurf haben) survive · {treasure, boss} · defend · {escort, rout} · reach · escape, nie zweimal hintereinander; N4/N5/N6 vorher zu / danach offen / gefallen offen / gegangen bzw. ohne Figur zu; jede geöffnete Nebenquest bleibt in jedem späteren Schritt und nach 2-8 angeboten; N1–N3 in jedem Schritt von Akt 2 angeboten; Nebenquests sperren keinen Story-Knoten.
- Platzhalter (AC 5) im selben Test statt in `world-map.test.ts`/`packs.test.ts`: echtes `mapInBuild` aus `src/app/state/packs.ts` (virtuelles Paket-Modul in Vitest vorhanden); heute für alle Knoten von Akt 2 false, mit Test-Karte für `m2_2` nur `m2_2` angeboten, `m2_4` erst nach `m2_2` und `m2_3`.
- `[ASSUMPTION]` `resumeWhere` (`src/app/campaignInfo.ts`) bleibt ungefiltert: Akt 2 ist unveröffentlicht, im Build nicht erreichbar; mit dem ersten Live-Schritt nennt das Titelbild sonst einen Platzhalter („vor …“). Befund für die Live-Story (Filter `mapInBuild`, Rückfall `ui.map.moreMissions`), hier nicht umgesetzt (kein Task).
- Prüfungen: `pnpm check` grün, `pnpm test:coverage` grün (152 Dateien, 1787 Tests). `pnpm sim --campaign act2 --runs 50`: ohne Fehler, Eintritt in Akt 2 46/50, Armee-Stufe 12,0, Gold 6022; alle 8 Story-Knoten als „no playable map yet“ übersprungen (Platzhalter). `--runs 20 --order m2_3,m2_6` ebenso fehlerfrei. Akt 1 unverändert (kein Akt-1-Content angefasst), daher kein `sim:diff`.
- Keine sichtbare Änderung (Akt 2 nicht im Build), daher kein Screenshot. Kein Formatwechsel, kein `content:lock`, `released-ids.json` unberührt.

### File List

- `content/acts/act2/campaign.yaml` (geändert)
- `tests/unit/act2-campaign-order.test.ts` (neu)
- `concept/22-narrative/decision-log.md` (geändert)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (geändert)
- `_bmad-output/implementation-artifacts/11-11-kampagnenfolge-von-akt-2.md` (neu)

## Change Log

- 2026-11-09: Story 11.11 umgesetzt – N4/N6-Bedingungen nach PO-Entscheidung 2026-11-09, Reihenfolge- und Platzhalter-Test für Akt 2; Status review.
