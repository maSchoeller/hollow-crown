## Epic 4: Akt-Struktur, Szenen und Entscheidungen

Spieler erleben einen Akt mit teils freier Reihenfolge, Szenen mit Halbfiguren und Ersatzsprechern, Entscheidungen mit Folgen, eine Chronik und feste Support-Paare.

### Story 4.1: Content je Akt ablegen

Als Entwickler
möchte ich Regeln und Akt-Inhalte getrennt ablegen,
damit Akte einzeln wachsen und später als Pakete ausgeliefert werden können.

**Akzeptanzkriterien:**

**Angenommen** das Layout aus Architektur §7
**Wenn** die Story umgesetzt ist
**Dann** liegen Regeln, UI-Texte und Werte in `content/core/`, Akt-Inhalte in `content/acts/act1/` (Kampagne, Karten, Leutnants, Dialoge); Browser-Loader, Node-Loader, `content:check` und `pnpm sim` finden alles
**Und** das Spiel verhält sich unverändert (E2E-Smoke-Test grün).

**Angenommen** die Story-Knoten in `content/acts/actN/campaign.yaml`
**Wenn** `content:check` läuft
**Dann** trägt jeder Story-Knoten `expectedLevel` (erwartete effektive Armee-Stufe nach GDD, Akt 1: 1 → 9, Finale 10), und die Kurve fällt innerhalb eines Akts nicht ab
**Und** Gegnerstufen (5.5, 5.6), Heimsuchungs-Deckel und die Simulation (6.8) lesen nur dieses Feld.

### Story 4.2: Bedingungen und Wirkungen

Als Content-Autor
möchte ich „wenn“ und „dann“ in YAML ausdrücken,
damit Szenen, Knoten, Entscheidungen und Belohnungen ohne Code wirken.

**Akzeptanzkriterien:**

**Angenommen** die Bedingungen `flag`, `alive`, `dead`, `left`, `completed`, `storyCount`, `act`, `support`, `stance`, `met`, `chronicle`, `any`, `not` und die Wirkungen `setFlag`, `recruit`, `leave`, `grudge`, `gold`, `material`, `item`, `priceMod`, `villageAid`, `openQuest`, `stance`, `chronicle` (Architektur §5.3)
**Wenn** sie in `src/core/campaign/conditions.ts` und `effects.ts` umgesetzt sind
**Dann** sind sie per Zod-Schema validiert und jede Referenz wird von `content:check` geprüft
**Und** `recruit`/`leave` für Avatar oder Kael lehnt das Schema ab; Tests decken jede Bedingung und Wirkung ab.

**Angenommen** ein Flag-Register `content/acts/act1/flags.yaml`
**Wenn** ein Content-Element ein undeklariertes Flag nutzt
**Dann** scheitert `content:check`
**Und** `CampaignState.flags` ist ein Record mit Werten statt einer Liste.

### Story 4.3: Kampagnen-Graph eines Akts

Als Spieler
möchte ich nach dem Akt-Einstieg zwischen mehreren Missionen wählen,
damit ich die Mitte eines Akts in meiner Reihenfolge spiele.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act1/campaign.yaml` mit Knoten (`kind`, `fixed: first|finale`, `requires`, `memorialIf`)
**Wenn** die Kampagne fortschreitet
**Dann** liefert `availableNodes(data, c)` die verfügbaren Knoten: zuerst nur die feste erste Mission, danach alle mit erfüllten Bedingungen, das Finale erst nach allen anderen Story-Knoten
**Und** `CampaignState.available` und `next` entfallen.

**Angenommen** gestaffelte Regeln im Akt (`mechanics` nach `storyCount`)
**Wenn** eine Mission startet
**Dann** sperrt `lockedMechanics` nach Zahl abgeschlossener Story-Missionen statt Knotenposition
**Und** Klassen-Aktionen einer Rolle sind erst aktiv, wenn der erste Gefährte dieser Rolle beigetreten ist (`c.rolesSeen`).

**Angenommen** eine Nebenquest, deren Auslöser gefallen ist
**Wenn** sie gespielt wird
**Dann** läuft die Gedenk-Variante der Szene; Story-Knoten sind nach Abschluss nicht wiederholbar.

### Story 4.4: Szenen-Schema mit Ersatzsprechern

Als Content-Autor
möchte ich Szenen mit deutschem Text, Sprecherketten und Bedingungen in einer Datei schreiben,
damit Permadeath nie eine Szene zerbricht.

**Akzeptanzkriterien:**

**Angenommen** eine Szene `content/acts/act1/scenes/<id>.yaml` mit Zeilen (`id`, `speaker` als Kette, `mood`, `text`, `requires`, `memorial`) und Antworten (`choice` mit `id`, `text`, `stance`, `effects`) (Architektur §5.8)
**Wenn** `resolveScene(data, ctx, id)` läuft
**Dann** spricht der erste lebende Sprecher der Kette, Zeilen mit unerfüllten Bedingungen entfallen, und eine Gedenkzeile erscheint, wenn die erste Figur der Kette tot ist
**Und** Schlüssel entstehen automatisch (`dlg.<szene>.<zeile>`); Englisch steht in `content/locales/en/act1.dialogue.yaml`.

**Angenommen** `pnpm content:check`
**Wenn** Szenen geprüft werden
**Dann** scheitert es bei Boxen über 110 Zeichen (DE oder EN), Ketten ohne Avatar/Kael am Ende und ohne `fallback: skip`, fehlenden EN-Schlüsseln, unbekannten Stimmungen und Antworten in Kampf-Szenen
**Und** die PoC-Dialoge sind ins neue Format überführt; das alte Schema entfällt.

### Story 4.5: Szenen im neuen Stil

Als Spieler
möchte ich Gespräche mit großen Figuren erleben, die zeigen, wer spricht,
damit mir die Truppe ans Herz wächst.

**Akzeptanzkriterien:**

**Angenommen** eine aufgelöste Szene
**Wenn** sie läuft
**Dann** steht der Sprecher als Halbfigur hell im Vordergrund, Zuhörer gedämpft, das Namensschild als Glut-Pille an seiner Seite, der Hintergrund weichgezeichnet und leicht entsättigt (Mockup 05)
**Und** oben rechts gibt es Log, Auto und Überspringen; bereits gesehene Szenen lassen sich ganz überspringen; ein Tipp führt weiter.

**Angenommen** eine Sprechblase im Kampf
**Wenn** ein Trigger oder Leutnant spricht
**Dann** erscheint sie am Kopf der Figur, höchstens 2 Zeilen, und blockiert bis zum Tipp bzw. 2,5 s im Auto-Modus.

### Story 4.6: Entscheidungen und Folgen-Karte

Als Spieler
möchte ich wissen, wann eine Antwort Folgen hat, und sehen, welche,
damit sich kleine Wahlen groß anfühlen.

**Akzeptanzkriterien:**

**Angenommen** eine Antwort-Zeile
**Wenn** sie erscheint
**Dann** trägt sie die Marke „Entscheidung · hat Folgen“; der erste Tipp markiert, der zweite bestätigt; Überspringen und Auto sind aus
**Und** die Wahl läuft als Kampagnen-Command `choose`, wendet die `effects` an und zählt die Haltung (warm, nüchtern, trotzig).

**Angenommen** eine bestätigte Wahl mit Wirkungen
**Wenn** sie angewendet ist
**Dann** zeigt die Folgen-Karte je Wirkung eine Zeile (Symbol, Satz, Erklärung, Mengen als Symbol + Zahl) und schreibt einen Chronik-Eintrag
**Und** das Dialog-Log hebt die eigene Wahl hervor; Wahlen lassen sich nicht zurückspulen.

### Story 4.7: Chronik

Als Spieler
möchte ich nachlesen, was ich entschieden habe und welche Chronik-Seiten ich gefunden habe,
damit ich die Geschichte meines Durchlaufs im Blick behalte.

**Akzeptanzkriterien:**

**Angenommen** getroffene Entscheidungen und gefundene Chronik-Seiten
**Wenn** der Spieler die Chronik öffnet (Menü; ab Epic 5 Leiste)
**Dann** sieht er je Akt die Entscheidungen mit gewählter Antwort und Folgen sowie die Chronik-Seiten (x von 12) zum Lesen
**Und** die Ansicht folgt dem Listen-Muster aus Stil B.

### Story 4.8: Neue Missionsziele escort und treasure

Als Spieler
möchte ich Eskorten und Truhenjagden spielen,
damit Missionen und Heimsuchungen abwechslungsreich sind.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit Ziel `escort` (NPC, Ausgang)
**Wenn** der NPC den Ausgang erreicht
**Dann** ist die Mission gewonnen; fällt der NPC, ist sie verloren.

**Angenommen** eine Karte mit Ziel `treasure` (Truhen, Rundenlimit)
**Wenn** alle Truhen vor Ablauf geborgen sind
**Dann** ist die Mission gewonnen; läuft das Limit ab, ist sie verloren
**Und** beide Ziele erscheinen in Rundenpille, Knoten-Karte und Vorschau der Mission; Zod-Schema und Tests decken sie ab.

### Story 4.9: Feste Support-Paare

Als Spieler
möchte ich, dass Freundschaften zwischen bestimmten Gefährten wachsen,
damit jeder seine eigene Geschichte in der Truppe hat.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act1/supports.yaml` mit festen Paaren (Narrative, 25 Paare über die Staffel) und Kennzeichnung der 6 S-Kernpaare
**Wenn** Punkte die Schwellen C 10, B 25, A 45, S 70 erreichen
**Dann** steht am Lagerfeuer ein Gespräch bereit; S gibt es nur für Kernpaare
**Und** das Lagerfeuer erlaubt in Akt 1 nur C und B (A und S über die Burg-Stufen, Epic 10); die Marke „Gespräche bereit“ erscheint in Truppe und Lager.
