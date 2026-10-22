# 17 – Audio: Stimmen, Soundeffekte, Musik

> Ergebnis der Grilling-Session vom 2026-10-22. Werkzeug: **ElevenLabs** (Voice Design, Text-to-Speech, Sound Effects, Music) über MCP bzw. API. Formate und Budgets: `16-asset-pipeline.md` §6 und §9.

## 1. Grundsätze

- **Teilvertonung** in DE und EN:
  - Kampf-Barks für alle Story-Figuren
  - Boss-Zitate
  - zwei Schlüsselszenen (Prolog-Intro, Kap.-5-Cliffhanger)
- Alle übrigen Dialoge werden gelesen. Beim Einblenden jeder Zeile spielt ein kurzer **Stimm-Laut** der Figur (Seufzer, „Hm.“, Lachen), passend zur Stimmung.
- **Soundeffekte und Musik** kommen ebenfalls aus ElevenLabs.
- **Lizenz:** Vor der Produktion prüfen wir die Nutzungsbedingungen des ElevenLabs-Plans auf kommerzielle Nutzung in Spielen. Das gilt für Stimmen, SFX und Music. Ergebnis und Datum tragen wir in `01-decisions.md` ein. **Keine** geklonten Stimmen realer Personen. Alle Stimmen entstehen per **Voice Design** und werden als eigene Stimmen gespeichert.
- Audio ist **reine Darstellung**: Der Kern weiß nichts davon. Der Renderer bzw. die App reagiert auf Events (`AttackStrike`, `UnitDowned`, `LevelUp` …).
- Variantenauswahl (welcher von 3 Barks) nutzt einen Darstellungs-Zufall außerhalb von `src/core`. Das beeinflusst keine Replays.

## 2. Stimmen (Casting)

Jede Figur hat **eine Stimme pro Sprache**. DE und EN müssen dieselbe Person sein (Alter, Timbre, Haltung), nicht dieselbe Tonspur. Die Voice-Design-Beschreibungen sind Startpunkte. Pro Figur erzeugen wir 3 Kandidaten und der Produktinhaber wählt.

| Figur | Stimmbild | Voice-Design-Beschreibung (EN, für ElevenLabs) |
|---|---|---|
| **Kael** | ruhiger Bariton, trocken, müde Autorität | *Male, mid-30s, warm low baritone, calm and dry, weary authority of a former knight, slight rasp, measured pace, understated emotion* |
| **Brenna** | rauchiger Alt, laut, herzlich | *Female, early 40s, smoky alto, loud and hearty, rough around the edges, motherly warmth, quick to laugh, northern rural accent* |
| **Tobin** | heller Tenor, eifrig, kippt manchmal | *Male, 17 years old, bright youthful tenor, eager and earnest, slightly breathless, voice occasionally cracks when excited* |
| **Mira** | klar, schnell, sarkastisch | *Female, mid-20s, clear mid-range voice, fast and sardonic, playful edge, confident, slight country twang* |
| **Liora** | leise, sanft, entrückt | *Female, early 20s, soft gentle soprano, calm and ethereal, speaks slowly as if listening to something far away, serene* |
| **Varek** | samtig, verwegen, Lächeln in der Stimme | *Male, late 20s, smooth velvety baritone, roguish charm, audible smile, relaxed drawl, hint of danger* |
| **Ysolde** | präzise, schnell, hochnäsig | *Female, 20, crisp precise mezzo, fast articulate speech, haughty academic tone, impatient, brilliant* |
| **Avatar** | **nicht vertont** (Identifikationsfigur, Pronomen wählbar) | nur Stimm-Laute aus 2 neutralen Sets (heller/tiefer) wählbar |
| **Grosk** | tiefer Bass, grob | *Male, 40s, deep gravelly bass, brutish, slow menacing growl* |
| **Hask** | heiser, fiebrig, verrückt | *Male, 30s, hoarse feverish voice, manic energy, hissing laughter* |
| **Morra** | kühl, geschäftsmäßig | *Female, 50s, cool level alto, businesslike, unimpressed* |
| **Sable** | kalt, militärisch knapp | *Female, mid-30s, cold controlled mezzo, clipped military cadence, no wasted words* |
| **Ulvric** | rau, wild, lacht | *Male, 40s, rough wild baritone, barking laugh, feral* |
| **Cassian** | schön, salbungsvoll, gefährlich | *Male, late 30s, beautiful resonant tenor, sermon-like cadence, serene and menacing* |
| **Ignar (Drache)** | kein Text, nur Laute | SFX: tiefes Grollen, Brüllen, Atem (siehe §5) |

Der **Erzähler** für das Prolog-Intro ist Liora (Vision) aus dem Off, damit wir keine zusätzliche Stimme brauchen und ihre Sehergabe vorbereiten.

## 3. Barks (Kampf-Ausrufe)

Pro Story-Figur sind das **18 Zeilen pro Sprache**, meist 1–5 Wörter. Kurze Zeilen kosten wenig, und spätere Textänderungen sind billig.

| Ereignis | Anzahl | Beispiel Kael (DE / EN) |
|---|---|---|
| Auswahl | 3 | „Befehl?“ / „Orders?“ · „Ich höre.“ / „Go on.“ · „Aschenbanner.“ / „Ashen Banner.“ |
| Bewegung bestätigt | 2 | „Verstanden.“ / „Understood.“ · „Rücken frei halten.“ / „Watch our backs.“ |
| Angriff | 3 | „Für den Sold.“ / „For the coin.“ · „Weiche!“ / „Yield!“ · (Kampfschrei) |
| Krit | 2 | „Das endet jetzt!“ / „This ends now!“ · „Für die, die wir verloren haben!“ / „For the ones we lost!“ |
| Treffer erlitten | 2 | (Ächzen) · „Nur ein Kratzer.“ / „Just a scratch.“ |
| Ausgewichen | 1 | „Zu langsam.“ / „Too slow.“ |
| Niedergestreckt | 1 | „Nicht… so…“ / „Not… like this…“ |
| Tod (Klassik) | 1 | eigene, längere Zeile, z. B. Kael: „Brenna… führ sie heim.“ / „Brenna… take them home.“ |
| Level-up | 1 | „Ich werde nicht langsamer.“ / „Not slowing down yet.“ |
| Tandem | 1 | „Zusammen!“ / „Together!“ |
| Geheilt | 1 | „Danke.“ / „Thanks.“ |

**Stimm-Laute** für Dialoge: pro Figur 6 Laute (je Stimmung `neutral`, `happy`, `angry`, `sad`, `surprised`, `hurt`), sprachunabhängig.

**Datenformat** (`content/audio/barks.yaml`):
```yaml
kael:
  voice: { de: voice_kael_de, en: voice_kael_en }
  barks:
    select:  [bark.kael.select.1, bark.kael.select.2, bark.kael.select.3]   # i18n-Schlüssel = Untertitel
    attack:  [bark.kael.attack.1, bark.kael.attack.2, bark.kael.attack.3]
    crit:    [bark.kael.crit.1, bark.kael.crit.2]
    downed:  [bark.kael.downed.1]
    death:   [bark.kael.death.1]
  blips: { neutral: blip.kael.neutral, happy: blip.kael.happy }   # usw.
```
Die Audiodatei heißt wie der i18n-Schlüssel plus Sprache: `bark.kael.crit.1.de.webm`. `content:check` prüft, dass zu jedem Schlüssel in beiden Sprachen eine Datei existiert.

**Häufigkeit:** Auswahl-Barks höchstens bei jeder 3. Auswahl derselben Einheit, Angriffs-Barks 50 %, Krit/Niedergestreckt/Tod immer. Option „Stimmen: Alle / Nur wichtige / Aus“.

## 4. Vertonte Szenen und Boss-Zitate

| Szene | Länge (Ziel) | Figuren |
|---|---|---|
| Prolog-Intro „Die hohle Krone“ (Vision, über Kartentisch-Bild) | 45–60 s | Liora (Erzählerin) |
| Kap. 5 Cliffhanger „Die Krone war hohl“ | 60–90 s | Liora, Kael, Ysolde |
| Boss-Zitate: Auftritt, Kampfbeginn, Niederlage | je 3 Zeilen | Grosk, Hask, Morra, Sable, Ulvric, Cassian |
| Ansprechen-Dialog (Rekrutierung im Kampf) | 2–4 Zeilen | Kael × Varek |

Die übrigen Dialoge sind gelesen, ohne Vertonung. Eine spätere Vollvertonung ist möglich, weil das Schlüsselformat oben dafür schon passt.

## 5. Soundeffekte

Alle SFX entstehen per ElevenLabs-Soundeffekt-Generierung. Pro Effekt erzeugen wir **3 Varianten**, die zufällig abgespielt werden, plus leichte Tonhöhenvariation (±3 %). Stil: **knackig, filmisch, nicht realistisch-dreckig**. Kurze Transienten, die über Handylautsprecher funktionieren.

| Kategorie | Effekte (V1) |
|---|---|
| UI | Tap, Bestätigen, Abbrechen, Menü öffnen/schließen, Bottom Sheet, Tab wechseln, Fehler, Gold erhalten, Item anlegen, Item ablegen, Schmied-Hammer, Rune einsetzen, Speichern |
| Brett | Einheit auswählen (je Bewegungstyp: Schritt, Rüstung, Huf, Flügel), Schritte (Gras, Stein, Holz, Wasser), Geisterfigur setzen, Phasenwechsel (Spieler/Gegner/Dritte), Gefahrenzone an/aus |
| Kampf physisch | Schwert (Schwung, Treffer Fleisch, Treffer Rüstung), Axt, Lanze, Bogen (Spannen, Abschuss, Einschlag), Schild-Block, Verfehlt (Luftzug), Krit-Aufladung, Krit-Einschlag, Konter |
| Magie | Feuer, Wind, Erde, Wasser, Licht, Dunkel (je Aufladen + Einschlag), Heilung, Stab |
| Status/Gelände | Brennen (Loop), Brand breitet sich aus, Löschen (Zischen), Felswall bricht hervor, Wind lichtet Nebel, Nass |
| Objekte | Tür auf/zu (Holz, Eisen), Truhe auf, Hebel, Balliste spannen/Schuss, Dorf besuchen (Glocke), Beute aufheben, Schlüssel |
| Ereignisse | Level-up (Fanfare kurz), Werte steigen (Ping je Wert), Skill gemeistert, Niedergestreckt (Herzschlag), Tod (dumpfer Schlag + Ausklang), Rekrutiert, Ziel erfüllt, Verstärkung erscheint (Horn), Sieg, Niederlage |
| Drache | Grollen (Loop), Brüllen, Odem (Aufladen + Feuerstrom), Flügelschlag, Beben |
| Ambiente (Loops) | Sommerwiese (Grillen, Wind), brennende Stadt, Bach + Vögel, Regen auf Stein (Nacht), Nebel-Furt (Wasser, Krähen), Tempel (Hall, Lava), Lagerfeuer |

**Prompt-Beispiele** (EN):
- *„Short sharp sword slash hitting leather armor, punchy, cinematic, no reverb, 0.4 seconds“*
- *„Magical fire spell impact, whoosh into crackling burst, bright, 0.8 seconds“*
- *„Medieval UI confirm sound, small metal chime with soft wooden click, pleasant, 0.2 seconds“*

## 6. Musik

**Stil:** Fantasy-Orchester wie Fire Emblem, verbunden mit Folk-Elementen. Jede Fraktion hat ein **Leitmotiv** (kurze, 4–8-taktige Melodie), das in Varianten wiederkehrt.

| Leitmotiv | Instrumentierung | Charakter |
|---|---|---|
| **Aschenbanner** (Hauptthema) | Fiddle, Laute, Rahmentrommel, später volles Orchester | warm, unverwüstlich, Lagerfeuer |
| **Silberne Lanze** | Blechbläser, Fanfare, Snare | edel, stolz, etwas starr |
| **Eisenmark** | Kriegstrommeln, tiefe Streicher, Hörner | hart, marschierend |
| **Orden der Glut** | Chor, Orgel, Glocken | erhaben, unheimlich-schön |
| **Drache / Pakt** | tiefe Streicher, Kontrabass, Taiko, Frauenstimme | uralt, bedrohlich, traurig |
| **Liora / Krone** | Harfe, Solo-Flöte, Celesta | geheimnisvoll, zerbrechlich |

**Cue-Liste V1:**

| Cue | Länge (Loop) | Leitmotiv | Hinweis |
|---|---|---|---|
| Titel | 1:30 | Aschenbanner + Krone | |
| Weltkarte | 1:30 | Aschenbanner (ruhig) | |
| Lager | 2:00 | Aschenbanner (Lagerfeuer, solo Laute) | |
| Dialog: ruhig / angespannt / traurig / heiter | je 1:00 | situativ | 4 Stimmungs-Cues |
| **Spielerphase** Kampf A | 2:00 | Aschenbanner | **Paar mit Gegnerphase A** |
| **Gegnerphase** Kampf A | 2:00 | Bedrohung, gleiche Tonart/BPM | Überblendung beim Phasenwechsel |
| Spieler-/Gegnerphase Kampf B (Kap. 3–5) | je 2:00 | Eisenmark / Orden | |
| Boss | 2:00 | Gegnerfraktion | |
| Drache | 2:00 | Drache / Pakt | Kap. 5 |
| Sieg (Stinger) | 0:08 | Aschenbanner | |
| Niederlage (Stinger) | 0:08 | | |
| Level-up (Stinger) | 0:03 | | |
| Prolog-Intro (Szene) | 1:00 | Krone → Drache | unter Lioras Erzählung |
| Kap.-5-Cliffhanger (Szene) | 1:30 | Krone, Drache | |

**Phasenpaare:** Spieler- und Gegnerphase sind **dasselbe Stück in zwei Arrangements** (gleiche Tonart, gleiches Tempo, gleiche Länge). Beim Phasenwechsel blendet der Player in 0,5 s **an derselben Position** über. Das ist das bekannte FE-Prinzip und wirkt sehr hochwertig. Mit ElevenLabs Music erzeugen wir dafür erst die Spielerphase und dann die Variante mit „same melody, tempo and key, darker arrangement“. Passt das nicht exakt, bauen wir die Paare aus Stems.

**Loops:** Jedes Stück hat `loopStart`/`loopEnd` im Manifest (`content/audio/music.yaml`). Nahtlos über Web Audio `AudioBufferSourceNode.loopStart/loopEnd`.

## 7. Mischung & Technik

- **Web Audio API**: Busse für Musik, SFX, Stimmen, Ambiente, UI, mit Lautstärkereglern laut Optionen (`09` §5).
- **Ducking:** Stimmen senken die Musik um −6 dB (Attack 50 ms, Release 300 ms). Krit-Cut-in senkt Musik kurz um −9 dB.
- **Lautheit:**
  - Musik −18 LUFS integriert
  - Stimmen −16 LUFS
  - SFX Spitzen max. −3 dBTP
  - Normalisierung in `tools/audio/normalize`
- **Mobil:** Audio startet erst nach der ersten Nutzerinteraktion (Autoplay-Regel). Bei `visibilitychange` → hidden wird stummgeschaltet und angehalten.
- **Haptik** ist an dieselben Events gekoppelt (`09` §6).
- **Formate und Budgets:** `16-asset-pipeline.md` §6 und §9.

## 8. Umfang V1 (Schätzung)

| Posten | Anzahl |
|---|---|
| Barks | 7 Figuren × 18 × 2 Sprachen ≈ 250 Zeilen |
| Boss-Zitate | 6 × 3 × 2 ≈ 36 Zeilen |
| Szenen | 2 Szenen ≈ 3 Minuten × 2 Sprachen |
| Stimm-Laute | 9 Sets × 6 |
| SFX | ca. 110 Effekte × 3 Varianten |
| Musik | ca. 20 Cues, ca. 30 Minuten |
