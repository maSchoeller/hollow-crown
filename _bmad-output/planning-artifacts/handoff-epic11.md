# Übergabe Epic 11 „Akt 2 Glut“ (Stand 2026-10-31)

Die Planung ist pausiert: Epic 10 und 11 werden in einer eigenen Planungssession mit dem Produktinhaber verfeinert, je Mission von Akt 2 als Kurzspezifikation (Karte, Ziel, Gegner, Leutnant, Szenen, Entscheidungen). Danach folgen die vollständigen Akzeptanzkriterien in `concept/26-epics/epics.md`. Code oder Content gibt es noch nicht, nichts ist auf `main` gemergt.

## Was schon entstanden ist

- `_bmad-output/implementation-artifacts/11-1-paket-region-und-gegner-von-akt-2.md`: Entwurf der Story 11-1 mit dem Vermerk „Planung pausiert“. Er enthält 27 Kriterien (Gruppen A–I), die Aufgaben T1–T18, Dev Notes mit dem geprüften Code-Stand, Wertvorschläge, die Abgrenzung zu Epic 10 und die offenen Fragen. Die Story ist nicht ready-for-dev.
- Der Sprint-Status ist unverändert: `epic-11` und alle Stories 11-x stehen auf backlog.
- In den Decision-Logs steht noch nichts. Die Entscheidungen unten stehen bisher nur hier und in den Dev Notes der Story. Vorgesehene Ziele:
  - Entscheidung 1 → `concept/24-architecture/decision-log.md`
  - Entscheidungen 2, 3 und 5 → `concept/21-gdd/decision-log.md`
  - Entscheidung 4 → `concept/22-narrative/decision-log.md`

## Fragen an den Nutzer und seine Antworten (2026-10-31, im Wortlaut)

1. **Frage:** „Akt 2 kommt PR für PR auf main, und main geht an die Spieler. Soll `act2` bis zur Abstimmung (11-13) unveröffentlicht bleiben?“
   **Antwort:** „Sofort veröffentlichen“. act2 ist ab 11-1 `released: true`, IDs werden erst beim echten Release gesperrt.
2. **Frage:** „Akt 2 rechnet mit Aufstiegen per Glutfunke ab Mission 2-2 (Epic 10, noch nicht auf main). Wie gehe ich mit der Abhängigkeit um?“
   **Antwort:** „Erst bauen, später abstimmen (Recommended)“. Die Missionen werden jetzt vorläufig ohne Aufstieg abgestimmt. Die endgültigen Korridore folgen in 11-13, sobald 10-2 und 10-3 auf main sind.
3. **Frage:** „In Akt 1 hast du Kartenlayouts, Gegnerzahlen und Leutnantwerte je Mission selbst entschieden. Wie soll es in Akt 2 laufen?“
   **Antwort:** „Ich entwerfe, du prüfst (Recommended)“. Der Assistent entwirft aus Narrative und GDD und stimmt per Sim ab. Der Nutzer prüft über Screenshots je PR. *Hinweis:* Die neue Planungssession mit Kurzspezifikation je Mission ersetzt diesen Weg wohl zum Teil.
4. **Frage:** „Beat 10 ‚Die Chronik‘ (Liora/Ysolde entziffern die Chronik in der Burg) steht in keiner Story. Wann soll die Szene laufen?“
   **Antwort:** „Nach der 3. Akt-2-Mission (Recommended)“. Die Szene läuft als Burg-Szene bei der Rückkehr nach der 3. abgeschlossenen Story-Mission von Akt 2, egal in welcher Reihenfolge. Sprecherkette Liora → Ysolde → Rhen, umgesetzt mit 11-12.
5. **Vorgabe aus dem Auftrag:** Audio bleibt später. Die Kriterien zu Musik, Klang und Vertonung werden als „später“ markiert.

## Mit Epic 10 vereinbart (Session epic10-castle)

- Epic 10 fasst keine Dateien von 11-1 an: Akt-Übergang, `campaign.act`/`c.act`, `acts/act2/campaign.yaml`, Region, Gegner, Leutnants und Stahl-Items gehören Epic 11. Epic 10 liest `c.act` nur.
- Epic 10 ändert:
  - `content/core/rooms.yaml` (die `requires: act 2` bleiben)
  - `content/core/classes.yaml` (die 10 fehlenden Profi-Klassen)
  - `content/core/items.yaml`, nur `ember_spark`/`promotion_seal` (der Glutfunke wird das Aufstiegs-Item)
  - `content/core/balance.yaml`, nur in einem neuen Abschnitt für Räume und Akademie
  - `src/core/campaign/{camp,apply,commands}.ts` und `src/core/rules/progression.ts`
- Für Epic 11 heißt das:
  - Neue Gegnerklassen (Wyvernreiter) kommen als eigener Block in den Abschnitt Gegnertypen von `classes.yaml`.
  - Stahl-Items kommen als eigener Block in `items.yaml`.
  - In `balance.yaml` ändert Epic 11 nur die Akt-Schlüssel (`tierUp`, `materialByAct`).
  - Änderungen an `apply.ts`, `commands.ts`, `camp.ts` und `progression.ts` bleiben klein, weil dort ein Konfliktrisiko besteht.
- Feste Unit-IDs der Akt-2-Gefährten: `jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable`. Epic 10 bindet die Räume daran.
- Reihenfolge bei Epic 10: zuerst ein Schema-PR, dann 10-2 und 10-3 vor 10-1. Den Stand führt `epic10-castle.md` im Notizordner der Sessions.

## Befunde aus der Code-Sichtung

- **Es gibt keinen Akt-Übergang im Code.**
  - `src/content/load.ts:248` lädt `acts/act1/campaign.yaml` fest verdrahtet (ebenso `units.yaml` und `flags.yaml`).
  - `CampaignState` hat kein Feld `act`. Rund 60 Stellen lesen `data.campaign.act`.
  - `metaFromCampaign` (`src/persistence/save.ts:179`) gibt fest Akt 1 zurück.
  - Die Architektur §5.4 sieht vor, dass `finishMission` nach dem Finale `act + 1` und `actReached` setzt.
  - Vorschlag: `GameData.acts` je Akt und `c.act` im Spielstand. `normalizeCampaign` füllt `c.act` beim Laden nach, sodass Spielstände mit erledigtem `m1_8` ohne Migration in Akt 2 landen; Format 2 bleibt.
- **Weitere fest verdrahtete act1-Stellen:**
  - `src/app/state/flow.ts:514` (devMap)
  - `tools/build/first-mission.mjs:17`
  - `tools/simulate.ts` und `tools/simCampaign.ts`: keine Verkettung über Akte
  - `tools/art/silhouettes.py:79/86`
- **Heimsuchungen in einem Akt ohne Karten:** `hauntGold` fällt auf 0 und `hauntLevel` auf Stufe 1. Beide brauchen einen Rückfall auf den letzten Akt mit Karten.
- **Pakete:**
  - Die breiten Globs von `act1` (`models/**`, `locations/**` usw.) greifen zuerst, Akt-2-Bilder landen sonst in act1. Klammer-Globs gibt es nicht.
  - Die Herbstbäume `autumn_a/b` liegen heute im core-Vorab-Cache.
- **Gegner:**
  - `knight` und `pegasus_knight` sind in `classes.yaml` schon vorhanden.
  - Es gibt keinen Wyvernreiter.
  - Der Objekttyp `ballista` (wie `lever`) steht nur im Schema und in den Typen, eine Regel dazu fehlt.
- **Items:** Es gibt kein `tier`-Feld. Eisen und Stahl unterscheiden sich nur über die Namenskonvention und `tierUp` in `balance.yaml`. Die Signaturen der Akt-2-Leutnants fehlen in `items.yaml`.
- **Vorhandene Assets:**
  - Brettfiguren und neutrale Porträts gibt es für Brakka, Grell, Sable, Rowena, Jory, Odile, Nell, Brann, Amos und Ilka; Stimmungs-Porträts fehlen.
  - Ortsbilder gibt es für brandhang, grauwacht, salzpass und kronfeld.
  - Es fehlen: wyvernhorst, das Kontor am Silbermeer, die Illustrationstafeln 5 bis 7 (Drei Angebote, Kronfeld-Verrat, „Die Krone war hohl“) und Modelle für die generischen Akt-2-Gegner (Eisenmark-Soldat, Ritter, Pegasusritter, Wyvern).
- **Weltkarte:** `content/world/valmora.yaml` hat schon Orte für m2_1 bis m2_8 und n4 bis n6, noch ohne `node`.

## Offene Fragen, Lücken und Widersprüche (je mit Empfehlung)

1. **Räume schließen in Akt 2 wieder.** `storyCount` zählt je Akt, also schließen Schmied, Heiler, Taverne (`min: 3`) und Lagerfeuer (`min: 4`) beim Eintritt in Akt 2. Empfehlung: Die Zählung je Akt bleibt; die vier Räume bekommen `any: [{ act: 2 }, { storyCount… }]`, abgestimmt mit Epic 10.
2. **Reittiere von Rowena und Brakka.** Die Modelle sind zu Fuß, weil Reittiere in Art Direction §4.6 offen sind. Empfehlung: nach den Regeln Flieger, zu Fuß dargestellt mit Flieger-Kennung. Pegasus und Wyvern als eigener Art-Task vor 2-4.
3. **Balliste gegen Flieger.** Mit dreifacher Effektivität holt sie Rowena mit einem Schuss vom Himmel. Empfehlung: keine Effektivität; Mt 12 plus Stärke des Bedieners, Treffer 70, kein Gegenangriff, unbegrenzte Munition.
4. **Wer bedient die Balliste?** Empfehlung: jede Figur zu Fuß oder in Rüstung, keine Flieger. Die KI nutzt sie nur mit dem Profil `hold`/`guard` oder wenn eine Figur schon daneben steht.
5. **Wyvernreiter fehlt als Gegnertyp.** GDD und Epic nennen ihn nicht, Brakka und „Der Wyvernhorst“ setzen ihn voraus. Empfehlung: neue Gegnerklasse `wyvern_rider` (Flieger, Axt).
6. **Moment des Akt-Wechsels.** Empfehlung: in 11-1 nur Nebel, Akt-Band und das Event `actReached`. Eine Titeltafel entscheidet 11-2.
7. **Jahreszeit der Heimsuchungen.** Auf Akt-1-Karten sehen sie in Akt 2 nach Spätsommer aus. Empfehlung: die Jahreszeit nach `c.act` wählen.
8. **Knoten in 11-1.** Weil act2 sofort veröffentlicht wird, wäre ein Platzhalter-Knoten 2-1 auf main spielbar und danach verbraucht. Empfehlung: 11-1 ohne Akt-2-Knoten (`nodes: []`, Weltkarte „Weitere Missionen folgen“); `m2_1` kommt mit 11-2. Für Tests und die Sim gibt es eine Testkarte unter `tests/fixtures/maps/`.
9. **Werte, die nirgends stehen:** Stahl-Teile, Signaturen, Groll-Fähigkeiten, Erkennungsformeln der Leutnants, Werte und Wachstum der sieben Akt-2-Gefährten, Kartenlayouts, Gegnerzahlen. Empfehlung: in der Planungssession je Mission festlegen oder die Vorschläge der Story-Datei als Startwerte nehmen.
10. **Widerspruch bei der Missionszahl.** `concept/21-gdd/epics.md:97-100` nennt 7 Story-Missionen und 2 Nebenquests, GDD und Narrative nennen 8 und 3. Empfehlung: 8 und 3 gelten; `21-gdd/epics.md` nachziehen.
11. **Annahmen im Narrative:** E8 (+1 000 Gold) und Händler −10 % (E4/E7) sind dort als Annahme markiert. Empfehlung: als Startwerte übernehmen, endgültig in 11-13.
12. **Aufteilung von 11-1.** Die Story ist groß. Vorschlag (nicht umnummeriert):
    - **11-1a „Akt-Übergang und Paket“:** Kern, Loader, Spielstand, Pakete, Weltkarte, Grunddaten, Stahl-Items, Gefährten und Sim-Verkettung. Früh mergen, Epic 10 hängt daran (`{ act: 2 }` wird erst damit wahr).
    - **11-1b „Gegner, Balliste, Leutnants, Herbst“:** Wyvernreiter, Balliste, Heimsuchungs-Pools, Leutnants mit Szenen, Herbst-Boden, Testkarte und Asset-Task.
13. **Chronik-Seiten von Akt 2.** Das Narrative verlangt 4 Seiten je Akt, nur N5 ist als Quelle benannt. Empfehlung: N5 und je eine Truhe in 2-2, 2-4 und 2-7.
14. **Reihenfolge E5 und E6 in den Epics.** Story 11.3 sagt, E5 werde „über die Prinzessinnen-Missionen vorbereitet“; das Narrative legt E5 nach 2-3 und E6 nach 2-4 fest. Empfehlung: dem Narrative folgen.
15. **Supports Akt 2.** Paare, deren beide Figuren bis Akt 2 beitreten:
    - Jory × Nell
    - Nell × Varek
    - ★ Varek × Odile
    - Odile × Sable
    - Sable × Ilka
    - ★ Ilka × Brann
    - Liora × Amos
    - Amos × Grosk

    Das sind 8 Paare, 2 davon mit S-Rang. Empfehlung: alle in 11-12, Vertonung später.
