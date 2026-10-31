## Epic 7: Akt-Pakete und Offline

Spieler laden das Spiel schnell, bekommen den Rest eines Akts im Hintergrund und spielen danach offline; neue Akte kommen per Update, ohne dass Spielstände brechen.

### Story 7.1: Pakete im Build

Als Spieler
möchte ich, dass das Spiel beim ersten Öffnen schnell startet,
damit ich nicht auf einen großen Download warte.

**Akzeptanzkriterien:**

**Angenommen** `content/packs.yaml` mit Paketen `core` (Shell, Regeln, Prolog), `act1`, `voice.act1.de`, `voice.act1.en`, Globs und `released`
**Wenn** `pnpm build` läuft
**Dann** erzeugt ein Vite-Plugin je Paket ein virtuelles Modul `virtual:hc-pack/<id>` und eine `packs.json` mit Dateien, Hashes und Größen; nur veröffentlichte Pakete kommen in den Build
**Und** `pnpm art:build` schreibt Assets nach `public/assets/<pack>/` mit Manifest je Paket.

**Angenommen** `tools/check-bundle-size.mjs`
**Wenn** der Build fertig ist
**Dann** bricht er ab, wenn `core` über 15 MB (gzip) liegt, und meldet die anderen Pakete gegen ihre Budgets.

### Story 7.2: Hintergrund-Download und Offline

Als Spieler
möchte ich, dass der Rest eines Akts im Hintergrund lädt und danach offline bleibt,
damit ich unterwegs ohne Netz spielen kann.

**Akzeptanzkriterien:**

**Angenommen** ein fehlendes Paket eines erreichten Akts
**Wenn** die App läuft
**Dann** lädt `src/packs/` alle Dateien des Pakets in einen Cache `hc-pack-<id>-<hash>`, der Service Worker liefert sie cache-first, und `loadPack(id)` registriert Daten und Locales (auch im Worker)
**Und** die Weltkarte zeigt den Fortschrittsring (Prozent, MB, „danach offline spielbar“), Missionen des Pakets sind sichtbar mit „Wird noch geladen …“ (Mockup 07).

**Angenommen** der Download scheitert oder das Gerät ist offline
**Wenn** die App es bemerkt
**Dann** versucht sie es mit Backoff erneut und zeigt „Wird geladen, sobald du online bist“
**Und** bei einem Update werden nur geänderte Dateien neu geholt und alte Caches nach Erfolg gelöscht.

### Story 7.3: Ende eines veröffentlichten Akts

Als Spieler
möchte ich wissen, dass es weitergeht, wenn ich alle verfügbaren Missionen gespielt habe,
damit ich nicht vor einem leeren Bildschirm stehe.

**Akzeptanzkriterien:**

**Angenommen** das Finale eines Akts ist gewonnen und das nächste Akt-Paket ist nicht im Build
**Wenn** die Weltkarte erscheint
**Dann** steht über der nächsten Region im Nebel „Akt n „Name“ erscheint bald“ mit dem Hinweis auf Heimsuchungen, Nebenquests und Lagerfeuer
**Und** nach dem Akt-Finale erinnert die App einmal an ein Backup (Export).

### Story 7.4: Stabile IDs und Release-Ablauf

Als Spieler
möchte ich, dass mein Spielstand jedes Update übersteht,
damit ich Akt für Akt mit derselben Truppe weiterspiele.

**Akzeptanzkriterien:**

**Angenommen** `pnpm content:lock`
**Wenn** ein Akt veröffentlicht wird
**Dann** schreibt es alle veröffentlichten IDs in `content/released-ids.json`; `content:check` scheitert, wenn eine gesperrte ID fehlt und nicht in `content/renames.yaml` steht
**Und** jede Save-Migration hat einen Fixture-Spielstand und einen Test; der Release-Ablauf (`released: true`, `content:lock`, Migration, Pull Request) steht in `AGENTS.md`.

### Story 7.5: Leistung messen

Als Spieler
möchte ich, dass das Spiel auf meinem Handy flüssig läuft und schnell startet,
damit große Schlachten Spaß machen.

**Akzeptanzkriterien:**

**Angenommen** ein Playwright-Lauf mit Referenzprofil (Pixel 6a / iPhone 12, gedrosselte CPU und Netz)
**Wenn** er eine komplette Gegnerphase einer großen Schlacht (24×32, ~40 Einheiten) und einen Kaltstart misst
**Dann** schreibt er Frame-Zeiten (Ziel 60 FPS, NFR1) und Kaltstartzeit (< 5 s, NFR2) als Bericht
**Und** die Messung läuft in CI und meldet Überschreitungen; 9.14 nutzt sie für die Freigabe.

### Story 7.6: Ladeanzeige beim ersten Start und vor Missionen

Als Spieler
möchte ich sehen, wenn das Spiel etwas herunterlädt, und wissen, wie lange es dauert,
damit ich nicht vor einem leeren Bildschirm warte und weiß, wann ich offline spielen kann.

**Akzeptanzkriterien:**

**Angenommen** der erste Start der App (Service Worker installiert den ersten Download)
**Wenn** die Dateien geladen werden
**Dann** zeigt ein Stein „Spiel wird vorbereitet · Größe · danach offline spielbar“ mit Fortschritt; ohne Klick, danach erscheint der Titel
**Und** bricht die Verbindung ab, sagt der Stein es in einem Satz und versucht es erneut.

**Angenommen** eine Mission oder Szene, deren Bilder oder Modelle (bei Bedarf geladen: Orte, Halbfiguren, Weltkarte, Einheiten-Modelle) noch nicht im Cache liegen
**Wenn** der Spieler sie startet
**Dann** erscheint ein Ladebildschirm mit Missionsname, Ortsbild und Fortschritt, bis alles da ist, und die Mission startet danach von selbst
**Und** liegt alles im Cache, erscheint kein Ladebildschirm; offline ohne fehlende Dateien wird gespielt, offline mit fehlenden Dateien steht ein Satz mit „Erneut versuchen“.

_Nachgetragen 2026-10-24: Entscheidung Produktinhaber (UX-Log), Anlass: große Bilder werden bei Bedarf geladen. Ergänzt 7.2 (Akt-Pakete im Hintergrund, Fortschrittsring)._

### Story 7.7: Große Schlachten flüssig

Als Spieler
möchte ich, dass auch die größte Schlacht auf meinem Handy flüssig läuft,
damit die Gegnerphase nicht ruckelt.

**Akzeptanzkriterien:**

**Angenommen** die Messung aus 7.5 (`pnpm perf`, Referenzschlacht 24×32 mit 40 Einheiten)
**Wenn** die Ursache der niedrigen Bildrate untersucht ist (Profil von CPU und GPU über die Gegnerphase)
**Dann** sind die größten Kosten benannt und behoben, und die Gegnerphase erreicht unter dem Referenzprofil 60 FPS (NFR1)
**Und** der Bericht von `pnpm perf` zeigt Vorher und Nachher.

_Nachgetragen 2026-10-24: Entscheidung Produktinhaber. Anlass: Die erste Messung (7.5) ergab 10–13 FPS mit GPU bei 4× gedrosselter CPU._

### Story 7.8: Große Schlachten ohne Ruckler

Als Spieler
möchte ich, dass die größte Schlacht auch auf einem schwächeren Handy ohne Hänger läuft,
damit die Gegnerphase gleichmäßig flüssig bleibt.

**Akzeptanzkriterien:**

**Angenommen** die Messung aus 7.5/7.7 (`PERF_GPU=1 pnpm perf`, Referenzschlacht 24×32, Vorher-Werte in `tests/perf/baseline.json`)
**Wenn** die Gegnerphase mit 2× und 4× gedrosselter CPU läuft
**Dann** erreicht sie 60 FPS bei 2× und 30 FPS bei 4× auf beiden Geräteprofilen (NFR1, Zielmaß aus 7.7)
**Und** der Bericht zeigt Vorher (Stand nach 7.7) und Nachher.

**Angenommen** eine Figur kommt während einer Kamerafahrt neu ins Bild, oder der Speicher wird aufgeräumt (GC)
**Wenn** das in der Gegnerphase passiert
**Dann** entstehen keine einzelnen Frames über 100 ms mehr (heute 300–470 ms bei 2×)
**Und** die Ursachen (erstes Zeichnen eingeschalteter Figuren, Speicherbereinigung) sind im Story-Log benannt.

**Angenommen** die Figuren-Pipeline (`tools/art`, Tripo-Rigs nach Art Direction §4.6)
**Wenn** Figuren für das Brett gebaut werden
**Dann** haben ihre Rigs nur so viele Gelenke, wie die Animationen brauchen, und Idle, Gehen, Angriff und Treffer laufen als gebackene Vertex-Animation-Texturen statt als Skelett im Hauptthread
**Und** die Optik bleibt gleich (Screenshots vorher/nachher, Abnahme Produktinhaber).

_Nachgetragen 2026-10-25: Entscheidung Produktinhaber bei der Abnahme von 7.7 (erreicht: 58,8 FPS bei 2×, 28,9–34,8 FPS bei 4×). Grenzt an Epic 8 (Figuren-Pipeline): abstimmen mit dem Grafik-Strang._
