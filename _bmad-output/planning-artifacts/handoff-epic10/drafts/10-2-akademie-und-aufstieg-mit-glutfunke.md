# Story 10.2: Akademie und Aufstieg mit Glutfunke

Status: ready-for-dev

## Story

Als Spieler
möchte ich ausgewählte Gefährten mit einem Glutfunken aufsteigen lassen,
damit die knappe Wahl, wer wächst, ein Moment wird.

## Acceptance Criteria

1. **Raum Akademie:**
   **Angenommen** Akt 2 ist erreicht und die Heimat ist die Burg
   **Wenn** der Spieler die Heimat öffnet
   **Dann** steht die Akademie als Raumstein (Icon `academy`, Name `room.academy.name`) mit Stufe als Punkte unter den Räumen; in `rooms.yaml` als `{ id: academy, function: academy, fromAct: 2, homes: [castle], levels: [...] }` (Ausbau über Story 10.1), kein `if (act >= 2)` im Code. In Akt 1 gibt es sie nicht.
2. **Aufstieg nur mit Glutfunke in der Akademie (Architektur §5.11):**
   **Angenommen** eine Figur der Truppe mit Stufe ≥ `balance.levels.promoteFrom` (10), deren Klasse Profi-Wege mit vorhandenem Klassen-Eintrag hat (`promotionTargets`), mindestens ein `ember_spark` im Konvoi und eine offene Akademie
   **Wenn** der Spieler `{ type: 'promote', unit, classId }` mit einem der zwei Wege schickt
   **Dann** wird die Figur Profi (`promote`: Stufe → 1, EP → 0, `promotionBonus` bis zu den Caps), ein Glutfunke verschwindet aus dem Konvoi (Event `itemLost`), Event `promoted`; der Loadout fasst danach 5 statt 4 Skills (`loadoutSlots` über `tier: pro`, `skills.loadoutAdvanced`).
   **Und** Fehlercodes ohne Änderung: `unknown_unit`, `not_available` (Stufe zu niedrig **oder** keine offene Akademie), `unknown_class` (kein Weg dieser Klasse), `not_enough_materials` (kein Glutfunke). Welches Item genau zählt, regelt Offene Frage 1 ([PO-Frage] `promotion_seal`/`ember_spark`).
3. **Akademie-Panel (UX-DR21, Mockup 08 „Akademie · Aufstieg“):**
   **Angenommen** das offene Panel der Akademie
   **Dann** zeigt es oben den Vorrat an Glutfunken (Item-Bild `ember_spark` + Zahl, nie als Wort), darunter die Figuren, die aufsteigen können (Stufe ≥ 10), Gesperrte gedimmt mit Grund („ab Stufe 10“); nach Wahl einer Figur zwei Weg-Karten „Profi A/Profi B“ mit Name, Wirkung in einem Satz (Text aus `class.<id>.desc` bzw. Effekt-Schlüssel, Story 10.3), Wertgewinn aus `promotionBonus` („TP +4 · DEF +3 …“, dieselben Zahlen wie `promote`) und dem neuen Signaturteil (Name, Art Direction §4.2); die Haupttaste „Aufsteigen · [Glutfunke] 1“.
   **Und** Figur wählen (1), Weg wählen (2), Haupttaste (3) – die Weg-Wahl zählt als Auswahl, nicht als Ausführung; ohne Glutfunken ist die Haupttaste gesperrt und nennt den Grund.
4. **Funken-Moment:** Nach dem Aufstieg spielt ein kurzer Funkenmoment über dem Panel (dieselbe Darstellung wie `.vn-sparks` aus Story 9.9, `src/ui/Dialogue.tsx`/`Dialogue.css`, `prefers-reduced-motion` beachtet) und, falls vorhanden, die Bark-Zeile `ember` der Figur (`hasBark`, wie heute in `Troop.tsx`). Funkenknistern: **später (Audio)**, bis dahin vorhandener Klang oder still.
5. **Truppe/Figur:** Die Marke „Bereit für den Aufstieg“ (Mockup 06, `canPromote`) erscheint nur, wenn auch eine Akademie offen ist; die Taste „Aufsteigen“ der Figur öffnet die Akademie mit dieser Figur vorgewählt (keine zweite Aufstiegs-Oberfläche). In Akt 1 gibt es weder Marke noch Taste.
6. **Akademie-Stufen laut GDD:**
   - Stufe 2: Profi-Weg innerhalb der Rolle wechseln (Command `changeProPath { unit, classId }`; Kosten und Stufe nach dem Wechsel siehe Offene Frage 3).
   - Stufe 3: „zweiter Profi-Weg für Aufgestiegene“ **[PO-Frage]** – nicht umsetzen, bis die Bedeutung geklärt ist; das Ausbau-Band zeigt die Stufe trotzdem.
   - „Skill-Loadout“ (GDD-Funktion der Akademie): Die bestehende Loadout-Wahl (`setLoadout`, heute in `Troop.tsx` Z. ~330) bleibt in der Figur; die Akademie verlinkt nur dorthin (Offene Frage 5).
7. **Reproduzierbar:** `promote` und `changeProPath` stehen im Journal; Replay ergibt denselben Zustand; die effektive Stufe zählt sofort mit +15 (`advancedLevelOffset`) für EP, Leutnant-Skalierung und Heimsuchungs-Deckel.

## Tasks / Subtasks

- [ ] T1 Raum (AC 1): `rooms.yaml` Eintrag `academy` (Funktion im Schema aus Story 10.1 T0), Icon `academy` in `src/ui/icons.tsx`, Texte `room.academy.name|desc` DE/EN; Anker in `content/home/home.yaml` (nur wenn die Burg ein Bild bleibt; Position [C] nach `paktwacht_ruine`)
- [ ] T2 Item (AC 2): nach Antwort auf Offene Frage 1 – `ember_spark` bekommt `use: { promote: true, minLevel: 10 }` (oder `kind: promotion` laut Architektur §5.11, dann Schema `itemKind` erweitern); `sealOf` in `apply.ts` sucht nur noch das gewählte Item; `promotion_seal` je nach Antwort entfernen (Locales, Item-Bild, `itemInfo.ts`) oder nur nicht mehr verkaufen
- [ ] T3 Kern (AC 2, 7): `validateCampaign` `promote` prüft zusätzlich „Akademie offen“ über `homeRooms` (Funktion `academyOpen(data, c)` in `camp.ts`); `canPromote` nimmt `c` und prüft Akademie + Glutfunke getrennt (für Marke vs. Taste); Funktion `promotionPreview(data, u, classId)` liefert Wertgewinn (UI und `promote` rechnen gleich, `progression.ts`)
- [ ] T4 Stufe 2 (AC 6): `changeProPath` in `commands.ts`/`apply.ts` mit `roomLevel(c, 'academy') ≥ 2` aus `balance.yaml` (`academy.changePathFromLevel`), Wert-Rückrechnung siehe Offene Frage 3
- [ ] T5 UI (AC 3–5): `AcademyRoom` in `Rooms.tsx` (oder eigene Datei `Academy.tsx` + `academy.css`, wenn `Rooms.tsx` > 700 Zeilen), `Room`-Dispatch ergänzen; Funkenmoment als wiederverwendbare Komponente aus `Dialogue.tsx` herauslösen (`src/ui/Sparks.tsx`), nicht kopieren; `Troop.tsx` Aufstiegs-Taste → `screen.value = { name: 'camp', tab: 'academy' }` mit Vorwahl; Schlüssel `ui.academy.*`
- [ ] T6 Handbuch: Eintrag `ember_spark` (fromAct 2) verweist auf die Akademie; neuer Eintrag `academy` (Kategorie home) mit Werten als Verweise (`balance.levels.promoteFrom`, `balance.skills.loadoutAdvanced`)
- [ ] T7 Tests `tests/unit/academy.test.ts`: Aufstieg gültig (Stufe 1, Loadout 5, Glutfunke weg), jeder Fehlercode (auch Akt 1 ohne Akademie), Determinismus, Replay; `promotion_seal`-Verhalten nach Antwort; Wechsel auf Stufe 2; `content:check` (Raum, Item)
- [ ] T8 E2E (optional): Spielstand Akt 2 mit Figur St. 10 und Glutfunke importieren, Akademie → Aufstieg → Funkenmoment; Screenshots 375 × 812 (Memory: Screenshots zeigen)
- [ ] T9 Architektur §5.11 „Stand“, Decision-Logs (Item, Ort der Aufstiegs-Taste)

## Dev Notes

### Heutiger Stand (nicht brechen)

- `promote` existiert schon: Command in `commands.ts`, Prüfung `apply.ts` Z. ~129 (Stufe ≥ `promoteFrom`, `promotionTargets`, Siegel), Wirkung Z. ~387 (Siegel aus Konvoi oder Beutel, `promote()` in `src/core/rules/progression.ts`, Event `promoted`). **Keine** Prüfung auf Akademie oder Akt.
- `sealOf` sucht ein Item mit `use.promote` – das ist nur `promotion_seal` (PoC, `items.yaml` Z. 117, Preis 3 000, von keinem Händler verkauft). `ember_spark` (Z. 119, Story 9.9) hat **kein** `use`, `kind: seal`, `tags: [convoyOnly]`. Ergebnis heute: in Akt 1 kann praktisch niemand aufsteigen. Akt 1 vergibt 4 Glutfunken (n1, n2, 2× m1_8 in `content/acts/act1/campaign.yaml`).
- `promotionTargets` filtert Profi-Wege ohne Klassen-Eintrag heraus: heute wählbar nur `duelist`, `bulwark`, `breaker`, `sharpshooter`, `sage`, `bishop` (Story 10.3 ergänzt die übrigen).
- `Troop.tsx` Z. ~343–362: Taste „Aufsteigen“ (wenn `canPromote`), Auswahl der Ziele, danach Toast mit Bark `ember`. Diese Stelle wird umgebaut, nicht verdoppelt. `canPromote` (`camp.ts`) prüft nur Stufe + Ziele; die Marke „kann aufsteigen“ in der Truppenliste (Story 6.1) hängt daran.
- `loadoutSlots`: `tier === 'pro'` → `loadoutAdvanced` (5). `effectiveLevel` (`rules/skills.ts`) zählt Profis +15.
- Funkenmoment: `.vn-sparks` in `src/ui/Dialogue.tsx` Z. ~96 / `Dialogue.css` Z. ~426 (Story 9.9, Glutfunken-Tafel).
- UI-Ressource `emberSpark` mit Bild existiert (`src/ui/pieces.tsx`, `ui.resource.emberSpark`), `Wallet` kann den Vorrat zeigen.
- Handbuch: `ember_spark` (`fromAct: 2`) und `class_<pro>`-Einträge verweisen schon auf `ember_spark`.

### Abhängigkeiten

- Story 10.1 (Schema `academy`, `buildRoom` für Stufe 2/3). Story 10.3 liefert die Wirkungstexte und Klassen der übrigen Profi-Wege; 10.2 funktioniert vorher mit den sechs vorhandenen.
- Epic 11 vergibt Glutfunken in Akt 2 (N4/N5 laut Epic 11) – ID `ember_spark` bleibt.

### Regeln

- Ein Command je Handlung; Wertgewinn-Vorschau ruft dieselbe Funktion wie `promote` (AGENTS.md „Kampfvorschau ruft denselben Formelcode“ sinngemäß).
- Kein sichtbarer Text im Code; Glutfunke immer als Item-Bild + Zahl (DESIGN „Ressourcen haben feste Symbole“).
- Nur eine Haupttaste (Glutorange) je Ansicht.

### Offene Fragen

1. **[PO-Frage]** Überschneidung `promotion_seal`/`ember_spark`: `items.md` Z. 163 sagt „Glutfunke (`ember_spark`, ersetzt `promotion_seal`)“, `items.yaml` Z. 118 sagt „promotion_seal bleibt unberührt“. Vorschlag: `promotion_seal` entfernen (PoC ist Wegwerfware, noch keine gesperrten IDs), `ember_spark` bekommt `use.promote`; Architektur §5.11 (`kind: promotion`) auf `kind: seal` angleichen.
2. **[PO-Frage]** Bedeutung von Akademie Stufe 3 „zweiter Profi-Weg für Aufgestiegene“ (GDD-Annahme 10): zweite Klasse zusätzlich (Wechsel ohne Kosten?) oder Effekte beider Wege? Vorschlag: auf Stufe 3 darf ein Profi kostenlos zwischen beiden Wegen seiner Rolle wechseln; sonst Stufe 3 streichen.
3. **Stufe 2 „Profi-Weg wechseln“:** Kostet der Wechsel einen Glutfunken, Gold oder nichts? Werden `promotionBonus` des alten Wegs zurückgerechnet und Stufe/EP behalten? Vorschlag: Gold (Wert in `balance.yaml`), Bonus wird ausgetauscht, Stufe bleibt.
4. **Avatar und Kael:** Großstratege und Bannerherr sind Profi-Wege (`proPaths` der Klassen `tactician`/`captain`). Brauchen sie einen Glutfunken aus den 12 und die Akademie, und gibt es nur einen Weg (keine Wahl)? Vorschlag: ja, gleicher Ablauf mit einer Weg-Karte.
5. **Skill-Loadout als Akademie-Funktion (GDD-Tabelle):** Soll der Loadout künftig nur in der Akademie änderbar sein (heute frei in der Figur)? Vorschlag: bleibt in der Figur, die Akademie verlinkt.
6. **Wertgewinne:** Mockup 08 zeigt Bollwerk „TP +4 · DEF +3 · RES +2“ und Sturmbrecher „TP +3 · STR +3 · SPD +1“, `classes.yaml` hat `bulwark` `{ hp 4, str 2, skl 1, spd 1, def 3, res 1 }` und `breaker` `{ hp 5, str 3, skl 1, def 2 }`. Vorschlag: Daten gelten, Mockup ist Beispiel.
7. **Abbruch nach Aufstieg:** Die Figur fällt von Stufe 10 auf 1; in Akt 2 gilt der Deckel 20 je Klassenstufe. Muss `levelCap` von Akt 2 (`campaign.yaml` von Epic 11) dafür 20 sein? Vorschlag: ja, in Epic 11 so anlegen.

### References

- [Source: concept/26-epics/epics.md#Story 10.2], UX-DR21
- [Source: concept/21-gdd/gdd.md#Figurensystem (Aufstieg, effektive Stufe), #Fortschritt des Spielers (Glutfunke), #Heimat (Akademie-Zeile), #Annahmen-Index 10]
- [Source: concept/21-gdd/items.md Z. 163 (Glutfunke ersetzt promotion_seal)]
- [Source: concept/24-architecture/architecture.md#5.11 (Glutfunke, promote prüft Stufe und Akademie), #8.1]
- [Source: concept/25-ux/EXPERIENCE.md Z. 43, 45, 160 (Glutfunke beim Aufstieg: Funkenmoment mit Funkenknistern); DESIGN.md Ressourcen-Symbole]
- [Source: concept/25-ux/mockups/08-ergebnis-abschied.html „Akademie · Aufstieg“, 06-truppe.html „Bereit für den Aufstieg“]
- [Source: _bmad-output/implementation-artifacts/9-9-mission-1-8-die-heimat-halten-finale.md (ember_spark, Funkenmoment, OFFEN 8), 6-1-truppe-und-figur.md (canPromote)]
- Code: `content/core/items.yaml`, `content/core/classes.yaml`, `content/core/balance.yaml` (`levels`, `skills`, `experience.advancedLevelOffset`), `src/core/rules/progression.ts`, `src/core/campaign/apply.ts`, `camp.ts`, `commands.ts`, `src/app/screens/Troop.tsx`, `Rooms.tsx`, `src/ui/Dialogue.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
