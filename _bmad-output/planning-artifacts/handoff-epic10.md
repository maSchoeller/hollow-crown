# Übergabe Epic 10 „Die Burg ausbauen“ (Stand 2026-10-31)

Branch `claude/epic10-castle-2a96a1`, kein PR. Epic 10 ist pausiert, bis Epic 10 und 11 in einer eigenen Planungssession mit dem Nutzer verfeinert sind. Nichts davon ist auf `main`.

## 1. Fragen an den Nutzer und Antworten (Wortlaut)

### Runde 1

1. **Raum-Gefährte:** „Für Stufe 2/3 braucht jeder Raum laut GDD ‚den passenden Gefährten in der Truppe‘, aber weder GDD noch Narrative sagen, wer zu welchem Raum gehört. Wie soll das festgelegt werden?“
   Antwort: „Mein Vorschlag, je 2 (Recommended)“. Die Vorschau dazu (einer der zwei reicht):
   ```
   Konvoi        Tobin  | Nell
   Händler       Fenn   | Nell
   Schmied       Brenna | Grosk
   Verzauberer   Ysolde | Brann
   Heiler        Liora  | Amos
   Taverne       Varek  | Jory
   Lagerfeuer    Jory   | Brenna
   Akademie      Varek  | Odile
   Werkstatt     Fenn   | Brann
   Gedächtnishalle Liora | Amos
   Übungsplatz   Mira   | Ilka
   ```
2. **Fehlende Werte:** „Für Epic 10 fehlen im GDD Zahlen: Bonuswerte der 10 noch fehlenden Profi-Klassen, Lektionen-Liste je Rolle, Werkstatt-Rezepte (Material je Item), Kosten Rune II/III, das Fallen-Set. Wie gehe ich vor?“
   Antwort: „Ableiten + markieren (Recommended)“, also nach dem Muster vorhandener Werte ableiten, als [ASSUMPTION] in den Decision-Log, mit `pnpm sim` prüfen.
3. **3D-Burg:** „Story 10.1 verlangt ‚die Burg zeigt das neue Modellteil‘ und Art Direction §7 die Burg als 3D-Diorama mit Ausbauteilen je Stufe; Story 6.9 hat bewusst nur das gemalte Bild gebaut. Was gilt in Epic 10?“
   Antwort (Freitext): „mache mir ein 3D testssetup ich bin mir noch nciht sicher ob es 3d sein soll oder das die qulatät des spiels senkt“
4. **Profi-Teil:** „Profi-Wege sollen laut Art Direction §4.2 auf dem Brett ein neues Großteil am Rumpf bekommen (z. B. Bollwerk: Turmschild, Bischof: Mitra). Die Story-Figuren sind eigene Tripo-Modelle. Wie entsteht das?“
   Antwort: „Anhängeteil je Profi-Weg (Recommended)“, also 16 kleine 3D-Teile, an die vorhandene Figur gehängt (Kopf/Rücken/Hand), gültig für alle Gefährten derselben Klasse.

### Runde 2

5. **10.1 teilen:** „Story 10.1 (Räume ausbauen) wäre mit allen Stufen-Wirkungen zu groß: Angebot des Tages und Glutfunke-Rotation beim Händler, Traits und Wunschrolle in der Taverne, Ausrüstungs-Vorlagen und ‚Bestes anlegen‘ im Konvoi sind teils nirgends genau beschrieben. Aufteilen?“
   Antwort: „Neue Story 10.8 (Recommended)“, also 10.1 = Ausbau-Command, Kosten, Gefährten-Bedingung, Schmied/Heiler-Stufen; Händler-, Taverne- und Konvoi-Stufen in eine neue Story 10.8.
6. **Akademie:** „Akademie: Was bedeutet Stufe 3 ‚zweiter Profi-Weg für Aufgestiegene‘ ([ASSUMPTION] im GDD), und brauchen Avatar und Kael für Großstratege bzw. Bannerherr auch einen Glutfunken?“
   Antwort: „Beide Effekte, Funke nötig (Recommended)“, also auf Stufe 3 kann eine Aufgestiegene für einen weiteren Glutfunken auch den Effekt des anderen Profi-Wegs lernen (Klasse bleibt). Avatar und Kael steigen wie alle mit Glutfunke auf; der Glutfunke ersetzt das alte Siegel.
7. **Kampfpriester:** „Kampfpriester führt laut GDD ‚Stab + Hammer‘, im Spiel gibt es aber keine Waffengruppe Hammer (das Item hammer zählt als Axt). Was gilt?“
   Antwort: „Stab, Licht, Axt (Recommended)“.
8. **Bollwerk:** „Bollwerk: ‚Schutz für Nachbarn +10 %‘ – wie gemeint?“ Optionen: eigener Schutz 10 % für jeden Nachbarn (mit Support-Schutz zusammen höchstens 30 %) oder +10 auf den Support-Schutz.
   Antwort: „[No preference]“

### Runde 3 (alle „[No preference]“)

9. **Schatten:** „Schatten (Späher-Profi) ist ‚im Nebel für Gegner unsichtbar, bis er angreift‘. Die meisten Karten haben keinen Nebel, und die Gegner-KI sieht heute alles. Was gilt auf Karten ohne Nebel?“ Optionen: unsichtbar, solange kein Gegner näher als 3 Felder steht (Empfehlung) / nur im Nebel / erster Zug unsichtbar.
   Antwort: „[No preference]“
10. **Lektionen:** „Gedächtnishalle: Stufe 1 ‚1 Lektion‘, Stufe 2 ‚2 Lektionen‘, Stufe 3 ‚freie Wahl der Lektion‘. Wie genau?“ Empfehlung: Stufe 1 ein Vererben je Akt mit fester Lektion je Gefallenem, Stufe 2 zwei je Akt, Stufe 3 freie Wahl unter den Lektionen der Rolle des Gefallenen; Söldner vererben auch, Gerrit nicht; Empfänger jeder Rolle, eine Lektion je Figur, kein Loadout-Platz.
    Antwort: „[No preference]“
11. **Gegenstände:** „Lebende Burg: Jeder Gefährte bringt einen Gegenstand mit. Die Narrative nennt nur drei Beispiele (…). Wer legt die Liste für alle 20 Gefährten fest, und was passiert, wenn jemand die Truppe verlässt (nicht stirbt)?“ Empfehlung: ableiten und als [ASSUMPTION] in die Narrative; Gehende nehmen den Gegenstand mit, bei Gefallenen bleibt er liegen.
    Antwort: „[No preference]“
12. **Runen:** „Runen: Laut GDD öffnen sie sich nach der 3. Story-Mission, einsetzen kann man sie aber nur beim Verzauberer, und den gibt es erst ab Akt 2. Außerdem gibt die Nebenquest N5 schon eine Rune III. Was gilt?“ Empfehlung: Verzauberer ab Akt 2, seine Stufe begrenzt Einsetzen und Verschmelzen (I/II/III), in Akt 1 werden Runen nur gefunden.
    Antwort: „[No preference]“

Bei „[No preference]“ wollte diese Session die Empfehlung übernehmen; eingetragen ist das noch nirgends. Die Planungssession sollte 8–12 bestätigen oder neu entscheiden.

## 2. Noch offene Fragen

Aus den Story-Entwürfen, noch nicht mit dem Nutzer geklärt (Quelle → Vorschlag des Entwurfs):

- **3D oder Bild:** Entscheidung nach dem Testaufbau (Abschnitt 4). Davon hängen das „neue Modellteil“ (10.1) und die Gefährten-Gegenstände (10.7) ab.
- **Profi-Skills:** Die sechs vorhandenen Profi-Klassen tragen PoC-Skills (`sol`, `impale`, `climber` …); `sage` hat `elemental_focus` (Status +20 %), was laut GDD der Hexer ist. → durch die GDD-Effekte ersetzen.
- **Profi-Bewegung:** `bulwark`/`breaker` sind in `classes.yaml` Fuß mit MOV 6, der Vorkämpfer im GDD gepanzert mit MOV 4. → Bewegungstyp der Rolle behalten, MOV +1.
- **Aufstiegs-Bonus:** Mockup 08 zeigt andere Wertgewinne als `classes.yaml`. → Daten gelten.
- **Akademie Stufe 2** (Weg wechseln): Kosten, Stufe und Werte nach dem Wechsel offen.
- **Skill-Loadout** (GDD-Funktion der Akademie): bleibt die Wahl in der Figur, oder zieht sie in die Akademie?
- **Fallen:** Das Fallen-Set aus der Werkstatt (`items.md` Z. 163) überschneidet sich mit den max. 2 Fallen des Fallenstellers; „verstärktes Gegengift“ gibt es nicht; „Trank verstärken“ hat seit 6.4 kein Command. → eine Fallen-Mechanik, neue Items, Zuständigkeit je Story klären.
- **Händler Stufe 3:** `c.offers` wird nach jeder Story-Mission erzeugt, aber nie gezeigt (`campaign.ts` Z. ~418); „größeres Sortiment“ überschneidet sich mit `merchantTier`; Takt der Glutfunke-Rotation fehlt im GDD.
- **Heiler „Trauer 2 statt 3“:** keine Stufe genannt. → ab Stufe 3.
- **Ort der Raumwerte:** Architektur §5.10 legt Stufen-Wirkungen in `rooms.yaml` `unlocks`, der Code nutzt Stufen-Listen in `balance.yaml`. → Kosten in `rooms.yaml`, Wirkungen in `balance.yaml`.
- **Ausbau-Band:** EXPERIENCE Z. ~102 sagt „erscheint nur, wenn Gefährte und Gold reichen“, Story 6.9 zeigt es gestrichelt mit Grund. → 6.9-Verhalten behalten, EXPERIENCE anpassen.
- **Architektur §8.1:** Beispiel `(rooms[id] ?? 0) + 1` ist falsch, weil `roomLevel` ab 1 zählt. → `roomLevel + 1`, Doku korrigieren.
- **Begriff „Lektion“** doppelt (Lern-Hinweise im Handbuch, Kategorie `lessons`, Story 14.7, und Erbe der Gedächtnishalle). → getrennte Code-IDs, sichtbares Wort bleibt.
- **Übungsplatz:** Zählen Heimsuchungen? Gehören Söldner zur Reserve? → beides ja.
- **Lebende Burg:** nur Gegenstand oder auch die Figur? → Gegenstand plus Porträt-Marke.
- **Akt-2-Stufendeckel 20** (Akt 1: 10) muss Epic 11 setzen, sonst stocken Aufgestiegene.
- **Knowledge-Filter der Gegner-KI** für Schatten: neu, deterministisch; heute sieht die KI alles (`balance.yaml`, Kommentar über `fog`).

## 3. Vereinbarung mit Epic 11 (Akt 2)

Nachricht an die Session Epic 11 vom 2026-10-31 (Antwort auf ihre Frage):

- **Epic 11 gehört:** Akt-Übergang, `campaign.act` (Epic 10 liest nur), `content/acts/act2/**`, Region Eisenmark, Gegner und Leutnants Akt 2, Stahl-Items.
- **Epic 10 ändert:** `content/core/rooms.yaml` (Räume, Stufen, Kosten, Gefährten-Bedingungen; `requires: act 2` bleibt), `content/core/classes.yaml` (die 10 fehlenden Profi-Klassen), `content/core/items.yaml` nur `ember_spark`/`promotion_seal`, `content/core/balance.yaml` nur ein neuer Abschnitt für Räume/Akademie, `src/core/campaign/camp.ts`, `apply.ts`, `commands.ts`, `src/core/rules/progression.ts`.
- **Reihenfolge:** Schema-PR (Raum-Felder, Profi-Klassen, Glutfunke als Aufstiegs-Item) → 10.2 und 10.3 vorgezogen (die Sim 11-13 hängt daran) → Rest.
- **Feste IDs:** Akt-2-Gefährten `jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable`; Akt 1 hat `brenna`, `tobin`, `mira`, `fenn`, `liora`, `varek`, `ysolde`, `grosk`. Profi-Wege laut `classes.yaml` `proPaths`: `bulwark`, `breaker`, `blade_dancer`, `duelist`, `sharpshooter`, `ranger`, `sage`, `hexer`, `bishop`, `battle_priest`, `shadow`, `trapper`, `bard`, `standard_bearer`, `grand_strategist`, `banner_lord`. Glutfunke = `ember_spark`. Neue Raum-IDs aus den Entwürfen: `academy`, `workshop`, `training`, dazu die vorhandenen `convoy`, `merchant`, `smith`, `healer`, `tavern`, `campfire`, `memorial`, `enchanter`.
- Gleiche Angaben im Notizordner der Sitzungsgruppe: `epic10-castle.md`.

## 4. Was gebaut ist

- **Story-Entwürfe** `_bmad-output/implementation-artifacts/10-1-…` bis `10-7-…` (Status `ready-for-dev` im Kopf, im Sprint-Status unverändert `backlog`). Antworten 1–12 sind darin **noch nicht** eingearbeitet (der Einarbeitungs-Agent wurde für die Pause gestoppt, bevor er schrieb). Die Entwürfe sind gründlich (Heutiger Stand aus dem Code, Aufgaben mit Dateien) und eignen sich als Grundlage; nach der Verfeinerung in `epics.md` neu erzeugen oder anpassen.
- **3D-Testaufbau der Burg (Spike, nur zur Bewertung):** `src/render/home/`, `src/app/screens/Castle3d.tsx`, `Castle3d.css`, Änderungen in `Camp.tsx`, `src/render/shared/models.ts` und den Locales. Stand und Bedienung siehe Abschnitt 5. Kein Produktionscode; nach der 3D-Entscheidung behalten (3D) oder löschen (Bild).
- **Keine** Änderungen an Content-Schemas, `rooms.yaml`, `classes.yaml`, `items.yaml`, Kern-Commands, `sprint-status.yaml` oder Konzeptdokumenten. Der Schema-PR für Epic 11 ist noch nicht gebaut.

Voraussichtlich bleibt nach der Verfeinerung: die Zuordnung der Raum-Gefährten, die Entscheidungen 2–7, die Code-Bestandsaufnahme in den Entwürfen. Der Spike hängt an der 3D-Entscheidung.

## 5. 3D-Testaufbau

Gebaut von einem Subagenten, von dieser Session per Screenshot geprüft. Nur zur Bewertung, nicht abgenommen.

- **Öffnen:** Dev-Server mit `?castle3d=1` (oder Build mit `&debug`), dann in der Konsole `await __hc.devNode('m1_6'); __hc.runEffects([{setHome:'castle'}]); __hc.screen.value={name:'camp'}`. Die Dev-Leiste schaltet Bild/3D und alle Räume auf Stufe 1/2/3 und zeigt FPS und Draw-Calls.
- **Technik:** `CastleView` (`src/render/home/castle.ts`) auf dem vorhandenen Szenen-Host mit den Low-Poly-Props des Bretts plus Grundkörpern (Mauern, Türme, Bergfried); Licht `evening` aus `render.yaml`; 11 Raumgebäude (Akt-1-Räume an den Ankern aus `home.yaml`, die vier Akt-2-Räume an Platzhalter-Positionen [C]); Stufe 1 Gerüst und Planen, Stufe 2 Dach und erleuchtete Fenster, Stufe 3 Banner, Laternen, Licht, Rauch; Axtständer, Laute, Bücherstapel; Tippen öffnet das Raum-Panel. `loadStaticMesh` in `models.ts`, sechs Schlüssel `ui.dev.castle3d.*`.
- **Prüfungen:** `pnpm lint`, `content:check`, `build` grün; `pnpm test` 1220/1222, zwei Zeitüberschreitungen unter Last (`story.test.ts`, `lieutenants-review.test.ts`), einzeln grün. Burg-Code als eigener Chunk 36 kB (13 kB gzip), erster Download 11,30 MB.
- **Leistung:** ca. 85 (Stufe 1) bis 117 (Stufe 3) Draw-Calls, 73k Vertices; FPS im versteckten Vorschaufenster nicht aussagekräftig, auf echtem Gerät messen. Die Kamera schwingt ständig, also zeichnet die Heimat dauernd neu (Akku). Laden der Props dauert einige Sekunden ohne Ladeanzeige.
- **Einschätzung des Subagenten:** Mit den vorhandenen Modellen liegt 3D sichtbar unter dem gemalten Bild (Efeu, gotische Bögen, Licht, Tiefe gehen verloren; wirkt wie das Kampfbrett). Für 3D sprechen sichtbare Ausbaustufen, Drehen, Stil-Einheit mit dem Brett. Konkurrenzfähig wäre es erst mit eigenen Burg-Modellen (Tripo/Blender) und Atmosphäre. Mittelweg: gemaltes Bild je Ausbaustufe.
- **Screenshots (375 × 812):** `handoff-epic10/1-painted.png`, `2-3d-level1.png`, `3-3d-level3.png`.
