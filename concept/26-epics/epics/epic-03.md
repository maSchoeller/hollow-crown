## Epic 3: Leutnants

Spieler treffen benannte Leutnants, die bei 0 TP fliehen, Groll gegen ihren Vertreiber tragen, mitwachsen und Kopfgeld bringen. Nichts davon wird prozedural erzeugt (NFR14).

### Story 3.1: Leutnants als Content und auf dem Brett

Als Spieler
möchte ich Leutnants sofort von normalen Gegnern unterscheiden,
damit ich weiß, wer wiederkommt.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act1/lieutenants.yaml` (bis Epic 4 vorläufig `content/lieutenants.yaml`) mit id, Name, Porträt, Modell, Klasse, Fraktion, Signatur-Item, 3 Groll-Fähigkeiten und Zeilen
**Wenn** `pnpm content:check` läuft
**Dann** prüft es Schema und Referenzen, höchstens 4 Leutnants je Akt und eindeutige IDs
**Und** Karteneinheiten können `lieutenant: <id>` tragen.

**Angenommen** ein Leutnant steht auf dem Brett
**Wenn** er gerendert wird
**Dann** hat er den doppelten Bodenring mit Goldkante und über dem Kopf den Groll-Wimpel mit 0–3 Kerben
**Und** beim Antippen zeigt eine dünne Linie zum Groll-Ziel, falls Groll ≥ 1.

### Story 3.2: Flucht bei 0 TP

Als Spieler
möchte ich vorher sehen, dass ein Leutnant flieht statt stirbt,
damit sich nichts beliebig anfühlt.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant würde auf 0 TP fallen
**Wenn** der Treffer aufgelöst wird
**Dann** setzt der Kern `gone: 'fled'` und meldet `fled{unit, by}`; der Leutnant verlässt die Karte
**Und** die Ziele `boss` und `rout` zählen ihn als besiegt.

**Angenommen** die Kampfvorschau gegen einen Leutnant
**Wenn** der Angriff ihn auf 0 TP bringen würde
**Dann** zeigt sie „flieht“ statt 0 (Mockup 01/02)
**Und** das Brett spielt Rückwärtssprung, Rauchwölkchen und fallenden Wimpel, dazu eine Fluchtzeile als Sprechblase (Zeilen-Content über das Szenen-Schema aus Story 4.4).

### Story 3.3: Groll und Groll-Ziel

Als Spieler
möchte ich, dass ein Leutnant sich an die Figur erinnert, die ihn vertrieben hat,
damit die Welt sich an meine Truppe erinnert.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant ist geflohen
**Wenn** die Mission gewonnen ist
**Dann** erhöht `finishBattle` in `c.lieutenants[id]` `routs`, setzt `grudge = min(3, grudge + 1)` und `target` auf den Vertreiber
**Und** die Wirkung `grudge: { lt, delta: -1 }` senkt den Groll (für Entscheidungen; Wirkungssprache aus Story 4.2, Epic 4 läuft vorher).

**Angenommen** ein Leutnant mit Groll-Ziel steht auf der Karte
**Wenn** die KI Ziele bewertet
**Dann** bekommt das Groll-Ziel +20; beim ersten Sichtkontakt spricht der Leutnant seine Groll-Zeile mit dem Namen des Ziels
**Und** ist das Ziel gefallen, bleibt der Groll, und er spricht die Gedenk-Spottzeile, bis die nächste Vertreibung ein neues Ziel setzt.

### Story 3.4: Mitwachsende Stärke

Als Spieler
möchte ich, dass Leutnants weder abgehängt noch unschlagbar sind,
damit jede Begegnung fordernd bleibt.

**Akzeptanzkriterien:**

**Angenommen** eine Mission mit Leutnant
**Wenn** der Kampf erzeugt wird
**Dann** ist seine Stufe der effektive Durchschnitt der 6 stärksten Einheiten der Armee plus Groll; je Groll-Stufe +1 Ausrüstungs-Tier und eine weitere Groll-Fähigkeit
**Und** das Ergebnis ist deterministisch und getestet.

### Story 3.5: Kopfgeld und Signatur-Item

Als Spieler
möchte ich für jede Vertreibung belohnt werden,
damit ein wiederkehrender Feind kein Frust ist.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant wurde vertrieben
**Wenn** die Mission endet
**Dann** gibt es Kopfgeld 200 × (Groll + 1) Gold + 1–2 Material des Akts und mit 10 % das Signatur-Item, garantiert bei der 4. Vertreibung desselben Leutnants (Werte in `balance.yaml`, Zufall aus dem Kampf-RNG)
**Und** das Ergebnis zeigt Kopfgeld und neuen Groll mit Symbol + Zahl (Mockup 08).

### Story 3.6: Steckbriefe

Als Spieler
möchte ich alles über einen Leutnant nachlesen können,
damit ich planen kann, wer ihn stellt.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant im Kampf
**Wenn** der Spieler ihn lange drückt
**Dann** zeigt das Brett seine Gefahrenzone, und zugleich öffnet der Steckbrief: Medaillon mit Goldring, Groll-Kerben, Name und Rolle, Groll-Ziel, Fluchtregel, Kopfgeld, Begegnungen und Vertreibungen, Groll-Fähigkeiten (gesperrte gestrichelt) (Mockup 02)
**Und** dieselbe Ansicht gibt es als Liste aller bekannten Leutnants, erreichbar über das Menü (ab Epic 5 über die Leiste „Steckbriefe“).

### Story 3.7: Seitenwechsel

Als Spieler
möchte ich, dass ein Leutnant nach meiner Entscheidung zu meiner Truppe wechselt,
damit Entscheidungen Feinde zu Gefährten machen können (FR25).

**Akzeptanzkriterien:**

**Angenommen** eine Entscheidung mit der Wirkung `recruit: { lt }` (Grosk, Sable, Mael; Wirkungssprache aus Story 4.2)
**Wenn** sie angewendet wird
**Dann** wird der Leutnant zum Gefährten mit Rolle, Stufe (mitwachsende Stärke aus 3.4 ohne Groll) und Startausrüstung inklusive Signatur-Item, setzt das Flag `joined_<lt>` und meldet `companionJoined`
**Und** er erscheint in keiner Heimsuchung und keiner Finale-Aufstellung mehr; Groll gegen ihn und von ihm verfällt.

**Angenommen** das Armee-Limit ist voll
**Wenn** ein Beitritt per Entscheidung oder Ansprechen ansteht
**Dann** findet er trotzdem statt, und der Spieler muss vor der nächsten Mission einen Söldner entlassen
**Und** Tests decken Wechsel, Ausschluss aus Heimsuchungen und das volle Limit ab.
