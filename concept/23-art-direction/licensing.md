# Lizenzprüfung GA26 / O5 – KI-Assets (Recherche und Entscheidungsvorlage)

> **Keine Rechtsberatung.** Dieses Dokument ist eine Recherche eines KI-Assistenten, kein Rechtsgutachten. Es wurde nicht von einer Anwältin oder einem Anwalt geprüft. Allgemeine Geschäftsbedingungen und Gesetzeslage können sich ändern, und mehrere Quellen waren nicht abrufbar (siehe §1). Verbindlich sind allein die Verträge, die der Produktinhaber tatsächlich abgeschlossen hat, und die Auskunft einer fachkundigen Person.
>
> **Status:** **Geklärt** – der Produktinhaber hat GA26/O5 am 2026-10-24 als geklärt erklärt; die Veröffentlichungssperre (NFR15) ist aufgehoben. Die Auflagen für die Pipeline (§6, A1–A14) und die Kennzeichnungspflichten (§6a) gelten weiter. Die Recherche unten bleibt als Grundlage.
>
> **Stand der Recherche:** 2026-10-23. Alle Abrufdaten in §10 sind dieser Tag.

## 0. Kurzfassung

| Dienst | Ergebnis | Kern |
|---|---|---|
| **ChatGPT / OpenAI** (Porträts, Turnarounds, Items, Hintergründe, Logo) | **mit Bedingungen, Wortlaut nicht verifiziert** | Nutzer besitzt die Ausgaben (Abtretung „if any“). Die Originalseiten waren für mich gesperrt (HTTP 403); die Aussage stützt sich nur auf Suchtreffer. Wortlaut vor Freigabe selbst prüfen. |
| **ElevenLabs – Soundeffekte** | **mit Bedingungen** | Nur Ausgaben aus einem **bezahlten Abo zum Zeitpunkt der Erzeugung** sind kommerziell nutzbar. Nur in Verbindung mit anderem Material, nicht als Einzeldatei weitergeben. |
| **ElevenLabs – Musik (Eleven Music)** | **mit Bedingungen, Widersprüche in den Quellen** | Bezahltes Abo nötig (strenge Lesart). **Studio-Game-Grenze:** Ein Spiel mit Monetarisierung gilt als „Indie Game“ nur unter **500 000 USD Spielumsatz** und **1 Mio. USD Entwicklerumsatz**; darüber ist ein Enterprise-Tarif nötig. |
| **ElevenLabs – Stimmen (Voice Design)** | **mit Bedingungen, Lücke** | Bezahltes Abo, keine Klone realer Personen. Eine ausdrückliche Aussage zu den Rechten an Voice-Design-Stimmen habe ich nicht gefunden. Noch nicht erzeugt (`17-audio.md`). |
| **Tripo (Bild-zu-3D)** | **mit Bedingungen, Widerspruch Terms ↔ Werbung** | Rechte an Ausgaben nur für **zahlende Nutzer**. Im Free-Tarif behält Tripo laut Terms alle Rechte. Rückwirkung bei Upgrade ist nicht belegt. Betrifft Kaels ersten Test (Free, öffentlich) und möglicherweise Testrunden. |
| **Schriften** | **erlaubt mit Bedingungen** | Alle sechs `@fontsource`-Pakete tragen OFL-1.1; Lizenztext und Copyright-Hinweis müssen mitgeliefert werden. |
| **Bibliotheken** | **erlaubt mit Bedingungen** | Apache-2.0 (Babylon.js), MIT, ISC; Hinweise in die Credits. |

**Angaben des Produktinhabers** (§7a, ohne Beleg): ChatGPT Plus, ElevenLabs Pro, Tripo Pro; alle Inhalte nur in diesen bezahlten Tarifen erzeugt.

**Größte offene Fragen an den Produktinhaber** (Details §7): Welche Rechtsform hat er (Einzelperson oder Firma)? Läuft die Web-Demo bereits öffentlich? Ist Steam geplant? Wie hoch ist der erwartete Umsatz (Indie-Grenze bei Musik)?

**Empfehlung zum Anwalt** (Details §9): Ja, gezielt – vor allem für die ElevenLabs-Verträge (Widersprüche, „Individual Use Only“, Studio Game), die Tripo-Rückwirkung und die Schutzstrategie (Logo/Marke). Für Schriften, Bibliotheken und die Store-Fragebögen reicht Sorgfalt ohne Anwalt.

## 1. Methode, Quellenlage und Lücken

Primärquellen: AGB, Nutzungsbedingungen, Richtlinien, Hilfeartikel und Preisseiten der Anbieter, Gesetzestexte, Behördenmitteilungen. Jede Quelle trägt in §10 eine Kennung **Q1…Qn**, URL und Abrufdatum. Die Abrufe liefen über ein Werkzeug, das Seiten zusammenfasst; Zitate und Paragrafennummern sind **sinngemäß aus diesen Abrufen** übernommen und vor Freigabe gegen die Originalseite zu prüfen.

| Kennung | Bedeutung |
|---|---|
| **[P]** | Primärquelle direkt abgerufen |
| **[S]** | nur indirekt belegt (Suchtreffer auf der Anbieterseite, Fachblog, Kanzlei-Beitrag); als Beleg schwächer, Quelle nennt Originalseite |
| **[X]** | Primärquelle konnte nicht abgerufen werden |

**Nicht abrufbar (Lücken, die der Produktinhaber oder ein Anwalt schließen muss):**

| Lücke | Was fehlt | Wie die Aussage hier belegt ist |
|---|---|---|
| L1 | OpenAI Terms of Use (global, EWR, UK), Usage Policies, Service Terms: `openai.com` und `help.openai.com` antworteten mit **HTTP 403** | nur Suchtreffer mit Auszügen [S]; der EWR-Vertrag für Kunden in Deutschland ist ein eigener Text, den ich nicht lesen konnte |
| L2 | Tripo Terms (`tripo3d.ai/terms`), Preisseite, Hilfeseiten: **HTTP 403** | nur Suchtreffer und Tripo-Blog/Hilfetexte [S]; Terms „zuletzt aktualisiert 11. Juli 2025“ laut Suchtreffer |
| L3 | EUR-Lex (AI Act, Änderungsverordnung 2026/1744) und `gesetze-im-internet.de` (503) | Artikel 50 über die inoffizielle Wiedergabe `artificialintelligenceact.eu` [P, inoffiziell], § 2 UrhG über `dejure.org`; Omnibus nur über Kanzlei-Beiträge [S] |
| L4 | Urteile (AG München, LG Frankfurt, OLG Düsseldorf), Urteilstexte | nur Beiträge von Kanzleien [S] |
| L5 | EuGH-Rechtsprechung zur Schutzfähigkeit („eigene geistige Schöpfung“) | in dieser Recherche **nicht** abgerufen; zur Prüfung beim Anwalt |
| L6 | Steam: Darstellung der KI-Angabe im Shop, Datum der Seite | die Steamworks-Seite nennt beides nicht |

Versucht habe ich einen Archiv-Abruf (vom Werkzeug blockiert) und einen einzelnen Probeaufruf mit Browser-Kennung (ebenfalls 403); weitere Umgehungsversuche gab es nicht. Die gesperrten Seiten muss der Produktinhaber selbst im Browser lesen und archivieren (A5).

## 2. Tabelle je Dienst

Bewertung: **erlaubt** (ohne Bedingung), **mit Bedingungen**, **nicht erlaubt**. „Plan“ = Tarif, der zum Zeitpunkt der **Erzeugung** laufen muss.

| Dienst / Ausgabe | Bewertung | Erforderlicher Plan | Wichtigste Bedingungen | Quellen (Abruf 2026-10-23) |
|---|---|---|---|---|
| **OpenAI / ChatGPT** – Bilder (Porträts, Turnarounds, Items, Hintergründe, Logo) | mit Bedingungen (unverifiziert, L1) | laut Hilfeartikel Free und bezahlt gleich; Wortlaut prüfen | Nutzer „besitzt“ die Ausgabe, OpenAI tritt seine Rechte „falls vorhanden“ ab; keine Abtretung fremder Rechte; Ausgabe kann anderen ähnlich sein; keine Verwendung fremder Abbilder ohne Einwilligung | Q1, Q2, Q3 [S] |
| **ElevenLabs** – Soundeffekte | mit Bedingungen | bezahlt (Starter oder höher) bei Erzeugung | Nutzung in Spielen erlaubt, aber nur in Verbindung mit anderem Material; kein Weiterverkauf als Einzeldatei; „Community Sharing“ aus; kein Beta-Dienst | Q4, Q5, Q6 [P] |
| **ElevenLabs** – Musik (Eleven Music) | mit Bedingungen; Widerspruch Free-Zeile ↔ AGB | bezahlt, ab Starter laut Preisseite „Music commercial use“; für **Studio Games** Enterprise Music | Indie-Grenze 500 000 / 1 Mio. USD; kein Music Library; keine Streaming-Verbreitung unter Creator; Eligibility „Individual Use Only“ bis Pro | Q7, Q8, Q4, Q5, Q6 [P] |
| **ElevenLabs** – Stimmen (Voice Design) | mit Bedingungen; Rechteaussage fehlt (Lücke) | bezahlt | keine Imitation lebender Personen; Voice-Design-Stimmen nicht teilbar; Herkunftsmarken nicht entfernen | Q4, Q9, Q10, Q11 [P] |
| **Tripo** – Brettfiguren (GLB) | mit Bedingungen (L2) | Pro (privat) | Rechte an Ausgaben nur zahlende Nutzer; Free: Tripo behält Rechte, Ausgaben öffentlich; Rückwirkung unklar | Q12, Q13 [S] |
| **Schriften** (Grenze Gotisch, Barlow, Barlow Condensed, Silkscreen; Cinzel, Nunito Sans in `package.json`) | erlaubt mit Bedingungen | – | OFL-1.1: Lizenztext und Copyright-Hinweis mitliefern; Schrift nicht allein verkaufen; Reserved Font Name nur bei veränderten Fassungen | Q14, Q15 [P] |
| **npm-Bibliotheken** (Laufzeit) | erlaubt mit Bedingungen | – | Apache-2.0 (Babylon.js), MIT (Preact, signals, zod, PWA-Plugins), ISC (yaml, idb); Hinweise in Credits | Q16 [P] |

## 3. Die Dienste im Einzelnen

### 3.1 ChatGPT bzw. OpenAI-Bildgenerierung

**Verwendung im Repo:** Porträts (`art/portraits/`, `art/mockups/characters-s1/`, 38 Dateien), Turnarounds (`art/turnarounds/`), Hintergründe (`art/backgrounds/`, `art/mockups/locations-s1/`), App-Icon (`art/icon/`), geplant Item-Bilder und Logo. Gesteuert über Claude in Chrome (`concept/16-asset-pipeline.md` §3). Prompt-Dateien: `art/prompts/` (18 Dateien) und README der Mockup-Ordner.

- **Kommerzielle Nutzung:** Laut Suchtreffern erlauben die Terms kommerzielle Nutzung der Ausgaben; der Hilfeartikel sagt, das Eigentum an der Ausgabe gelte „ob Free oder bezahlt“ (Q1, Q3 [S]). Eine tarifabhängige Sperre habe ich nicht gefunden, aber die Originale nie gelesen (L1).
- **Eigentum:** Suchauszug aus den Terms: „As between you and OpenAI, and to the extent permitted by applicable law, you … (b) own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output.“ Die Abtretung umfasst **nicht** Ausgaben anderer Nutzer oder Ausgaben Dritter; die Ausgabe kann **anderen Nutzern ähnlich** sein (Q1 [S]). Das „if any“ ist wichtig: OpenAI überträgt nur, was es hat. Ob am Bild überhaupt ein Urheberrecht besteht, regelt §5.
- **Einschränkungen:** Die Usage Policies untersagen Abbild und Stimme einer Person ohne Einwilligung in verwechselbarer Weise; Visual Capabilities dürfen nicht für das Abbild einer Person ohne Einwilligung genutzt werden (Q2 [S]). Einen allgemeinen Satz zu fremdem Urheberrecht bei Bildern habe ich nicht gefunden. Verbote für Logos oder Marken habe ich nicht gefunden.
- **Kennzeichnung durch den Anbieter:** Ausgaben tragen laut Sekundärquelle unsichtbare C2PA-Metadaten und eine Pixelmarke (Q17 [S]).
- **Nach Kündigung:** Dazu habe ich keine Aussage gefunden. Die Abtretung der Ausgabe wird in den Auszügen nicht an ein laufendes Abo geknüpft, ein Widerrufsrecht fand ich nicht. Nicht verifiziert (L1).
- **Regionaler Vertrag:** Die Suche zeigt getrennte Fassungen (global, `en-GB`, `row-terms-of-use`, EU). Für einen Nutzer in Deutschland gilt vermutlich die EWR-Fassung; **Frage an den Produktinhaber/Anwalt** (L1).

### 3.2 ElevenLabs

**Verwendung im Repo:** 26 Soundeffekte und 5 Musikstücke in `audio-src/build/` (`tools/audio/elevenlabs.py`, `U4`). Stimmen und Barks stehen noch aus (`17-audio.md`). Das Skript hat einen Befehl `status`, der den Plan zeigt.

**Gültige Texte:** Terms of Service (Fassung für EWR, Schweiz, UK sowie Fassung für andere Länder), Music Terms, ElevenCreative Terms (Exhibit 4 = Sound Effects), Prohibited Use Policy, Hilfeartikel. Alle Haupttexte tragen **Last Updated: 09 October 2026**, also zwei Wochen alt (Q4–Q8). Die EWR-Fassung der Terms stimmt in den hier relevanten Klauseln mit der anderen überein (Q4a).

**Kommerzielle Nutzung und Plan**

- Terms §1(c): Free-Nutzer dürfen die Dienste „only … for non-commercial purposes“, bezahlte Nutzer dürfen kommerziell nutzen (Q4).
- Hilfeartikel: „The free plan does not include a commercial license and cannot be used for any commercial purpose.“ „All paid plans include a commercial license, provided you’re not using Beta Services.“ (Q5).
- Preisseite: Free ohne Lizenz-Hinweis; „Commercial License“ ab **Starter** (Preis siehe Seite, wegen Aktionspreisen hier nicht übernommen); Musik: „Music commercial use“ ab Starter (Q18).

**Rückwirkung und Kündigung**

- Hilfeartikel: „Content created outside of a paid subscription (before or after) cannot be used commercially.“ Damit macht ein späteres Upgrade **frühere Free-Ausgaben nicht kommerziell nutzbar** (Q5).
- Während eines bezahlten Abos erzeugte Inhalte dürfen „indefinitely“ bzw. „forever“ kommerziell genutzt werden, auch nach Kündigung; Audio, das **außerhalb** eines Abos entsteht, braucht immer Namensnennung (Q5, Q19).
- Musik: „Output remains subject to the plan in effect when that Output was created“ (§1.5, Q7). Bei Upgrade gilt der höhere Tarif für alle Ausgaben im Konto.
- Zugriff auf Inhalte nach Kündigung ist nicht garantiert; Nutzer müssen selbst exportieren (Terms §14, Q4; Q19). Nicht verbrauchte Credits verfallen bei geschlossenem Konto (§3).

**Eigentum**

- Terms §4(c)(ii): „as between you and ElevenLabs, you retain all rights in and to your Output.“ Zwischen den Parteien, nicht gegenüber Dritten (Q4). Music Terms §2.2: gleichlautend für Input und Output (Q7).
- ElevenLabs erhält an eurem Content eine unwiderrufliche, unbefristete Lizenz zur Nutzung für Betrieb und Verbesserung (Terms §4(d), Q4). Prompts und hochgeladene Referenzen fallen darunter.
- Namensnennung: Terms nennen keine; Free-Ausgaben brauchen „elevenlabs.io“ oder „11.ai“ im Titel bzw. „Eleven Music“ bei Musik; bezahlte Tarife: „No Attribution Required“ (Q5, Q7).

**Soundeffekte** (ElevenCreative Terms, Exhibit 4, Q6)

- Nutzung erlaubt „incorporating it into films, trailers, advertising, video, games, applications, and other productions“, aber nur, soweit der Tarif es erlaubt.
- Verboten: Output zu verkaufen, weiterzulizenzieren oder zu verbreiten, **wenn es als Einzeldatei oder Sample verfügbar gemacht wird** („standalone basis“). Heißt: kein SFX-Pack, und auch Rohdateien nicht frei zugänglich machen. Im PWA stecken sie in einem Audio-Sprite; prüfen, ob das als „standalone“ gilt (Anwalt).
- **Community Sharing:** Nur wenn die Freigabe aktiviert ist, darf ElevenLabs Ausgaben anderen Nutzern lizenzieren; frühere Lizenzen bleiben bei späterem Abschalten gültig. Kontoeinstellung prüfen.

**Musik** (Music Terms, Q7)

- Exhibit A „Media Rights“: Free bis Enterprise Music Lite „All online and offline commercial use permitted, except film, TV, radio, and **Studio Games**“; nur **Enterprise Music** ohne Ausnahme.
- **Studio Game** (§4.8(j)): ein Spiel, das öffentlich angeboten und „commercialized by sale, advertising, or any other form of monetization“ wird, **außer** einem Indie Game. **Indie Game** (§4.8(c)): Spiel mit allen Fassungen/DLC unter **500 000 USD Umsatz** seit Erstveröffentlichung, entwickelt von einer Einheit, deren Umsatz aus allen Spielen unter **1 000 000 USD** liegt; gemessen **netto** nach Store-Gebühren, Rückerstattungen; Umsätze von Verbundenen und alle Monetarisierungsarten zählen. Wird die Grenze überschritten, bleiben **60 Tage**, einen passenden Tarif zu holen; danach darf die Ausgabe nicht mehr im Spiel verwendet werden (bereits verteilte Kopien ausgenommen) (§4.7). Wer prüft, ob das Spiel qualifiziert, ist der Nutzer. Monetarisierung laut `12-monetization.md`: Werbung, Kosmetik, Unterstützer-Paket → **Studio-Game-Regel greift, sobald die Grenzen überschritten sind**.
- **Eligibility:** Free, Starter, Creator, Pro sind „For Individual Use Only“; Scale und Business hängen von der Mitarbeiterzahl ab. „Individual Use Only“ ist nicht definiert. Ob ein Einzelunternehmer, eine UG oder GmbH darunter fällt, ist **offen** (Anwalt). Unzulässige Einstufung kann zu Kontosperre und „loss of Output, Fees, or credits“ führen (§1.4).
- **Free:** Namensnennung „Required“, **Downloads „Not permitted“**, 11 Minuten pro Monat, keine Streaming-Verbreitung. Starter: ebenfalls keine Streaming-Verbreitung. **Dass die Musik-Free-Zeile kommerzielle Rechte zulässt, widerspricht Terms §1(c) und dem Hilfeartikel**; das Dokument sagt nicht, was bei Widerspruch gilt (Q7). → **Strenge Lesart: Musik nur aus einem bezahlten Abo verwenden.**
- **Music Library** (§4.2): Output darf nicht in eine Musikbibliothek eingebracht werden; **Model Resale** (§4.3) verboten. Ein separat verkaufter Soundtrack (DLC) ist nicht ausdrücklich geregelt → Anwalt/Anfrage an ElevenLabs.
- **Plattformen:** Nutzer ist selbst für die Offenlegungsregeln der jeweiligen Plattform zuständig (§4.4).
- **Nicht geregelt:** Content ID, Training mit Ausgaben, Lizenzpartner (Q7 nennt sie nicht). ElevenLabs behauptet auf seiner API-Seite, Eleven Music sei mit lizenzierten Stems und Musik trainiert und Hauptlizenzen reichten für „broad commercial use“, Film/TV/große Studiospiele brauchten Enterprise (Q20 [S], Werbetext, nicht bindend).

**Stimmen** (Voice Design statt Klon)

- Prohibited Use Policy §3: verboten ist, „the voice, identity, or likeness of any living individual“ ohne Einwilligung zu klonen, zu synthetisieren oder nachzuahmen; Stimmaufnahmen von Personen unter 18 für Stimmmodelle verboten (Q10).
- Voice-Design-Stimmen sind **nicht in der Voice Library teilbar** und nur im eigenen Workspace teilbar (Q9). Die allgemeinen Terms §4(d)/(e) räumen ElevenLabs eine Lizenz an Stimmmodellen ein, „to the extent you own or acquire“ Rechte; ElevenLabs vermarktet „your voice“ nicht eigenständig ohne Erlaubnis (Q4).
- **Lücke:** Weder Terms noch ElevenCreative-Exhibit 4 sagen ausdrücklich etwas zu **kommerziellen Rechten an Voice-Design-Stimmen** (Q6, Q9). Die allgemeinen Aussagen „paid plans include commercial license“ gelten, aber für ein Spiel mit 250+ Zeilen sollte die Zusage **schriftlich** vom Support kommen.
- **Provenance:** Policy §10: ElevenLabs-„watermarks, metadata or other provenance signals“ dürfen nicht entfernt, verändert oder verborgen werden (Q10). Unsere Pipeline kodiert zu Opus/AAC (`16-asset-pipeline.md` §6) und verwirft dabei Metadaten. Ob das „Entfernen“ ist, ist offen → Originale unverändert in LFS aufbewahren und Frage an den Support.
- **Offenlegung:** „You must clearly disclose when people are interacting with AI where required by law“ (Q10). Das Spiel setzt zur Laufzeit keine KI ein (kein Treffer für OpenAI/ElevenLabs/Anthropic in `src/`); Sprache ist voraufgezeichnet.

### 3.3 Tripo (Bild-zu-3D)

**Verwendung:** Brettfiguren als GLB (`art/models/source/*_board_tripo.glb` → `art/models/units/*.glb`), Rig und Animationen im Tripo-Dienst (`art-direction.md` §4.6, `art/mockups/tripo-test-2026-10/README.md`). Danach Aufbereitung in Blender (`tools/art/prepare_tripo_unit.py`).

- Terms (Auszug laut Suchtreffer, Abschnitt 5, Q12 [S]): **Free-Nutzer**: Tripo „retains all rights“ an Eingaben und Ausgaben, einschließlich der Rechte zu nutzen, zu kopieren, zu verändern, zu veröffentlichen, zu lizenzieren und daraus Erlöse zu erzielen (Abschnitt 5.2.1). **Zahlende Nutzer**: sie halten alle Rechte an Eingaben und Ausgaben, einschließlich kommerzieller Nutzung, Änderung, Verbreitung und Lizenzierung (5.2.2); sie räumen Tripo eine begrenzte, weltweite Lizenz zum Hosten und Anzeigen ein. Tripo verwendet Ein-/Ausgaben zahlender Nutzer laut Hilfeseite **nicht** für das Training; für Free-Nutzer gibt es diese Zusage nicht (Q13 [S]).
- **Widerspruch:** Die Preis- und Blogseiten sagen, Free-Modelle seien öffentlich unter **CC BY 4.0** und damit mit Namensnennung kommerziell nutzbar (Q13 [S]). Die Terms selbst erwähnen CC BY nicht. Eine dritte Quelle sagt, Free sei nur nicht-kommerziell. **Dem Terms-Text ist zu folgen; Free-Ausgaben nicht ausliefern.**
- **Rückwirkung bei Upgrade:** nicht belegt. Mehrere Tripo-Seiten sagen nur, es gelte die **zum Zeitpunkt der Erzeugung gültige** Fassung; eine Marketingseite behauptet, maßgeblich sei ein aktives Pro-Abo bei der Erzeugung (Q13 [S]). → Vorsicht: **was im Free-Tarif entstand, nicht ausliefern.**
- **Betrifft das Repo konkret:**
  - `art/models/source/kael_tripo.glb` und Bilder in `art/mockups/tripo-test-2026-10/`: **Free-Tarif, in der Tripo-Galerie öffentlich** (README dort). Nicht ausliefern. Das ausgelieferte Kael-Modell stammt aus dem späteren Weg (`kael_board_tripo.glb`).
  - Beim zweiten und dritten Durchgang steht „0 Credits (Testversion)“ bzw. „letzte kostenlose Testrunde“ für den **Smart-Mesh-Schritt**. Ob dieser Schritt unter den Rechten eines **zahlenden** Nutzers lief, ist aus dem Repo nicht ersichtlich (**Frage F3**, Tripo-Support, F9).
- **Eingaben:** Die Turnarounds (Eingabebilder) stammen aus ChatGPT. Tripo erhält daran eine Lizenz (siehe oben). Die Rechtekette ist also OpenAI → Produktinhaber → Tripo → Produktinhaber.
- **Kündigung:** Die Terms-Auszüge sagen dazu nichts; nicht belegt (L2).

### 3.4 Schriften und weitere Drittquellen

- **Schriften:** `package.json` führt `@fontsource/barlow`, `barlow-condensed`, `cinzel`, `grenze-gotisch`, `nunito-sans`, `silkscreen`; npm weist für alle `OFL-1.1` aus (Q15). `src/ui/styles.css` importiert nur Grenze Gotisch, Barlow, Barlow Condensed und Silkscreen (Z. 3–8). Cinzel und Nunito Sans stehen noch in `package.json` und in GA24, werden aber nicht geladen (Aufräumfrage, keine Lizenzfrage).
  - OFL-1.1 erlaubt Nutzung, Einbetten, Weitergabe und Verkauf **zusammen mit Software**; die Schrift darf nicht **für sich allein** verkauft werden; jede Kopie braucht Copyright-Hinweis und Lizenztext; **Reserved Font Names** dürfen veränderte Fassungen nicht tragen (Q14). `node_modules` war nicht installiert; ob die Pakete Lizenzdateien mitliefern, habe ich nicht geprüft → Lizenztext und Copyright-Zeilen in die Credits aufnehmen.
  - Das neue Logo („freundliche, weichere Serifenschrift“, `decision-log.md`) ist noch nicht gestaltet; falls es eine Schrift nutzt, deren Lizenz prüfen.
- **Bibliotheken:** Babylon.js (core, loaders, materials) Apache-2.0; Preact, @preact/signals, zod, vite-plugin-pwa, workbox-window MIT; yaml, idb ISC (Q16). Alle erlauben kommerzielle Nutzung, verlangen aber Hinweise (Apache-2.0: NOTICE-Datei, falls vorhanden). Capacitor und Werbe-SDKs (AdMob) sind noch nicht eingebunden; ihre Bedingungen sind vor dem Store-Release zu prüfen.
- **Werkzeuge** (Blender, Python/Pillow/numpy): erzeugen die Dateien, ihre Lizenzen betreffen die Ausgaben nicht; nicht untersucht.
- **Mixamo-Skelett:** Tripo nennt den Rig „Mixamo-Skelett“ (Knochennamen `mixamorig:`). Von Mixamo selbst stammt kein Asset; nicht weiter geprüft.

## 4. Antworten auf die übrigen Fragen

### 4.1 Wem gehören die Ausgaben, welche Einschränkungen gibt es?

| Dienst | Eigentum | Einschränkungen |
|---|---|---|
| OpenAI | Nutzer, Abtretung „if any“ (Q1 [S]) | keine Abtretung fremder Rechte; Ähnlichkeit zu anderen Ausgaben möglich; Abbild/Stimme realer Personen |
| ElevenLabs | Nutzer, „as between you and ElevenLabs“ (Q4, Q7) | Einzelweitergabe von SFX, Music Library, Model Resale, Beta-Dienste, Voice-Clone-Verbote |
| Tripo | zahlende Nutzer: ja; Free: Tripo (Q12 [S]) | Training auf Free-Ausgaben, öffentliche Galerie; Marketing widerspricht |

**Weiterverkauf als Asset:** Das fertige Spiel ist kein Weiterverkauf; die Einzelweitergabe von Musik, SFX oder Modellen (z. B. Soundtrack-Album, Asset-Pack) ist eigens zu prüfen (ElevenLabs verbietet sie ausdrücklich bei SFX und Music Library). **Training:** ElevenLabs lizenziert unsere Eingaben für Verbesserung des Dienstes; bei Tripo besteht die Training-Zusage nur für zahlende Nutzer. **Exklusivität:** Ausgaben sind **nicht exklusiv**; OpenAI weist ausdrücklich auf ähnliche Ausgaben für andere hin (Q1 [S]). **Logos/Marken:** Ein Verbot habe ich in den Quellen nicht gefunden, aber die rechtliche Wirkung ist wegen §5 schwach.

### 4.2 Musik und Stimmen

Siehe §3.2. Zusammengefasst: Musik nur aus bezahltem Abo, Studio-Game-Grenze und „Individual Use Only“ beachten, kein Streaming-Vertrieb des Soundtracks unter Creator-Eligibility ohne Prüfung, Content ID in den Terms nicht geregelt. Stimmen nur über Voice Design, nie Klone realer Personen, Herkunftsmarken nicht entfernen.

### 4.3 Nach Kündigung weiter nutzen?

| Dienst | Antwort |
|---|---|
| OpenAI | Keine Aussage gefunden; die Abtretung erscheint nicht abo-gebunden (nicht verifiziert, L1) |
| ElevenLabs | Ja für alles, was **während eines bezahlten Abos** entstand; sonst nein. Zugriff im Konto nicht garantiert, deshalb Export (Q4, Q5, Q19) |
| Tripo | Nicht belegt; Terms-Auszüge schweigen (L2) |

### 4.4 Rückwirkung für Free-Ausgaben

ElevenLabs: **keine Rückwirkung** („before or after“, Q5). Tripo: **nicht belegt**; vorsichtig wie nicht rückwirkend behandeln. OpenAI: keine tarifabhängige Sperre gefunden. Ob sich im Repo Free-Ausgaben befinden, weiß nur der Produktinhaber (§7).

## 5. Urheberrechtlicher Schutz der KI-Ausgaben

| Rechtsraum | Stand | Quellen |
|---|---|---|
| **USA** | Das Copyright Office hat in Part 2 (29.01.2025) festgehalten: Schutz nur, „where a human author has determined sufficient expressive elements“; „the mere provision of prompts“ genügt nicht; Schutz möglich, wenn ein menschliches Werk in der Ausgabe erkennbar ist oder ein Mensch Ausgaben kreativ **anordnet oder verändert**; KI als Hilfsmittel nimmt dem Gesamtwerk den Schutz nicht. Der Supreme Court lehnte die Revision in *Thaler v. Perlmutter* am 02.03.2026 ab; damit bleibt das Urteil des D.C. Circuit (18.03.2025) bestehen: Urheber muss ein Mensch sein. | Q21 [P], Q22 [S] |
| **Deutschland** | § 2 Abs. 2 UrhG: „Werke im Sinne dieses Gesetzes sind nur persönliche geistige Schöpfungen.“ Nach Fachbeiträgen verneinte das **AG München** (13.02.2026, 142 C 9786/25) den Schutz von KI-Logos trotz langer, mehrfach überarbeiteter Prompts: maßgeblich sei, ob der menschliche Einfluss das Ergebnis klar überwiegt; das **LG Frankfurt** (17.12.2025) und das **OLG Düsseldorf** (02.04.2026, Eilverfahren) sollen ähnlich entschieden haben. Einordnung: erstinstanzlich bzw. Eilverfahren, Urteilstexte nicht geprüft. | Q23 [P, Gesetz über dejure], Q24 [S] |
| **EU** | Maßstab ist die „eigene geistige Schöpfung“ des Urhebers (Rechtsprechung des EuGH; **nicht abgerufen**, L5). Eine EU-weite gesetzliche Regel für KI-Ausgaben gibt es nicht; das Europäische Parlament hat 2025 eine Studie dazu veröffentlicht, die hier nicht ausgewertet wurde. | Q25 [S] |

**Was folgt für Nachahmer?**

- Reine Ausgaben (ein Bild, eine Musikspur, ein Tripo-Modell) haben nach diesem Stand **keinen oder nur schwachen Urheberrechtsschutz**. Ein Dritter darf sie womöglich kopieren, ohne eine Urheberrechtsverletzung zu begehen. Der Beitrag zum AG-München-Urteil zieht dasselbe Fazit für Logos: Wettbewerber ließen sich nicht stoppen (Q24 [S]).
- Das Spiel ist ein **PWA im Browser**: Alle Assets sind für jeden Nutzer herunterladbar. Praktisch lässt sich Kopieren nicht verhindern, rechtlich nur dort, wo Schutz besteht.
- **Bleibt schützbar:** der eigene Code und Text, soweit menschlich geschaffen (die Programmierung geschieht mit KI-Unterstützung; Frage an den Anwalt), die **Auswahl und Anordnung** der Inhalte (Q21), das gezeichnete oder stark bearbeitete Material, Marken (Name, Logo) und Designs.

**Wie viel menschliche Bearbeitung ändert etwas?** Es gibt keine Schwelle in Prozent. In den USA gilt „sufficient expressive elements“ im Einzelfall (Q21); in Deutschland muss der menschliche Anteil das Ergebnis **prägen** (Q24 [S]). Aufräumen von Meshes in Blender, Freistellen oder Farbkorrektur sind vermutlich zu wenig. Stärkere Eingriffe: Neuzeichnen, Übermalen, eigene Komposition, eigene Modellierung von Teilen, eigene Arrangements bei Musik. **Eigenanteil dokumentieren** (§6, A2).

## 6. Auflagen für die Pipeline

Vorschläge für den Produktinhaber; sie ändern nichts am Stand von GA26.

**Pläne und Zeitpunkt**

| # | Auflage |
|---|---|
| A1 | **Nur unter bezahltem Tarif erzeugen und nur solche Ausgaben ausliefern.** ElevenLabs: mindestens Starter, für Studio Games Enterprise Music, sobald die Indie-Grenzen reißen. Tripo: Pro mit Datenschutz „Privat“. ChatGPT: Tarif dokumentieren (Wortlaut zuerst prüfen). Vor jedem Batch den Tarif nachweisen, bei ElevenLabs mit `python tools/audio/elevenlabs.py status`, Ergebnis ins Prompt-Protokoll. |
| A2 | **Prompt-Protokoll als Herkunftsnachweis.** Jede Datei in `art/prompts/<id>.md` bekommt zusätzlich: Dienst und Modellversion, **Tarif und Konto zum Erzeugungsdatum**, Prompt, Referenzen mit Quelle, Iterationen, **Ablageort der unveränderten Originaldatei**, **menschlicher Anteil** (Retusche, Übermalen, Blender-Arbeit; Verweis auf Commit). Für Audio und 3D gilt dasselbe, auch für die Mockup-READMEs (`characters-s1`, `locations-s1`, `style-2026-10`). |
| A3 | **Originale unverändert aufbewahren** (Git LFS bzw. `audio-src`), einschließlich Metadaten (C2PA, Provenance). Die Laufzeitformate (WebP, Opus) sind abgeleitet. |
| A4 | **Free-Reste aussondern.** Ausgaben aus Free-Tarifen (ElevenLabs, Tripo, ChatGPT falls zutreffend) nicht ausliefern; neu erzeugen. Kaels erster Tripo-Test (`kael_tripo.glb`) als „nicht ausliefern“ markieren. Free-Audio in der öffentlichen Web-Demo braucht **Namensnennung** („elevenlabs.io“, „Eleven Music“), solange sie dort läuft (Q5, Q7). |
| A5 | **Terms archivieren.** Zum Erzeugungsdatum PDF oder Screenshot der gültigen Bedingungen je Dienst ablegen (außerhalb des Git-Verlaufs oder in LFS). Zusagen des Supports (F9) ebenfalls. |
| A6 | **Vor dem Release neu prüfen.** ElevenLabs hat seine Texte am 2026-10-09 aktualisiert, Apple am 2026-10-16. Bedingungen ändern sich. |

**Inhalte**

| # | Auflage |
|---|---|
| A7 | **Keine Namen geschützter Werke oder Marken in Prompts.** Treffer im Repo: „Ghibli-like warmth“ (`art/mockups/characters-s1/README.md`, `locations-s1/README.md`), „Fire Emblem meets Battle Brothers“ (`art/mockups/style-2026-10/round_chibi_kael.md`) und „Fire Emblem / Battle Brothers mood“ (`art/prompts/app_icon.md`). `16-asset-pipeline.md` §3 verbietet Namen lebender Künstler und geschützter Figuren; Studio- und Spieletitel nennt die Regel nicht, sie bergen aber dasselbe Ähnlichkeitsrisiko. Künftig neutral beschreiben („warm, friendly, rounded cartoon“) und die genannten Stellen beim nächsten Durchlauf bereinigen. **Bereits erzeugte Bilder auf Ähnlichkeit zu bekannten Figuren prüfen.** |
| A8 | **Logo und Name:** Logo vom Menschen neu zeichnen (Vektor), nicht als KI-Rohausgabe nutzen (Schutz, siehe §5). Namensrecherche (O4) und Markenanmeldung vor dem Store-Release; die Vorlage dafür ist eine Anwaltsaufgabe (§9). |
| A9 | **Stimmen:** Nur Voice Design, nie Klon; Prompts ohne Namen von Personen; Audition mit 3 Kandidaten (`17-audio.md` §2) auch auf **zufällige Ähnlichkeit mit bekannten Stimmen** prüfen; Voice-IDs, Prompts und finale Audiodateien exportieren (Konto-Zugriff nicht garantiert). |
| A10 | **SFX:** „Community Sharing“ im ElevenLabs-Konto ausschalten; SFX nicht einzeln zum Download anbieten. **Musik:** Indie-Grenze (500 000 / 1 Mio. USD, netto) im Controlling beobachten und bei Überschreitung innerhalb von 60 Tagen umstellen; keine Registrierung der Stücke bei Content-ID-Diensten oder Aggregatoren ohne Rückfrage; Soundtrack nicht ohne Klärung veröffentlichen. |
| A11 | **Keine KI zur Laufzeit.** Das Spiel erzeugt zur Laufzeit keine Inhalte mit KI; das entlastet Google Play (AI-Generated-Content-Richtlinie) und den AI Act. Soll das ändern, neu prüfen. |

**Kennzeichnung und Credits**

| # | Auflage |
|---|---|
| A12 | **Credits/Impressum:** Abschnitt „Drittquellen“ mit Schriftnamen, OFL-1.1-Text und Copyright-Zeilen, Bibliotheken (Apache-2.0-Hinweis, MIT/ISC-Hinweise). Einen Vorschlag zur KI-Kennzeichnung (DE): *„Grafiken, Musik, Soundeffekte und Stimmen dieses Spiels wurden mit Hilfe generativer KI-Werkzeuge erstellt (OpenAI, ElevenLabs, Tripo) und von Menschen ausgewählt, bearbeitet und zusammengestellt.“* – Vorschlag, nicht rechtlich geprüft. |
| A13 | **Steam (falls geplant):** KI-Inhalte im Content Survey angeben (§6a). **Apple/Google:** Fragebögen wahrheitsgemäß beantworten, siehe §6a. |
| A14 | **Metadaten:** Anbieter-Marken nicht gezielt entfernen. Prüfen lassen, ob die Umwandlung in WebP/Opus als Entfernen gilt (Anfrage an den Support, F9). |

### 6a. Kennzeichnungspflichten

| Regelwerk | Aussage | Folge für Hollow Crown | Quelle |
|---|---|---|---|
| **EU AI Act Art. 50** | Gilt ab 2. August 2026. Art. 50(2): **Anbieter** von KI-Systemen (also OpenAI, ElevenLabs, Tripo) müssen synthetische Ausgaben maschinenlesbar markieren. Art. 50(4): **Betreiber („Deployer“)** müssen Deepfakes (Inhalte, die bestehenden Personen, Gegenständen, Orten, Ereignissen ähneln und echt wirken könnten) kennzeichnen; bei „evidently artistic, creative, satirical, fictional“ nur als Hinweis darauf, dass es solche Inhalte gibt, ohne den Genuss zu stören. Die Änderungsverordnung (EU) 2026/1744 (in Kraft 27.07.2026) gewährt für schon am Markt befindliche Systeme eine Schonfrist für Art. 50(2) bis 2. Dezember 2026. | Fiktive Figuren, keine realen Personen → vermutlich **keine eigene Kennzeichnungspflicht** für die Spiel-Assets. Sicherheitshalber freiwillig kennzeichnen (A12). Ob der Produktinhaber als „Deployer“ gilt, ist eine Anwaltsfrage. | Q26 [P, inoffiziell], Q27 [S] |
| **Apple App Store** | Review Guidelines (Stand 16.10.2026): keine eigene Kennzeichnungspflicht für KI-erzeugte Assets gefunden. 5.2: „Make sure your app only includes content that you created or that you have a license to use“; 5.2.1: keine geschützten Marken oder Werke ohne Erlaubnis; 5.1.2(i): Weitergabe personenbezogener Daten an Dritte, auch **Dritt-KI**, offenlegen und Einwilligung einholen; 1.2 gilt für Apps, die Nutzer Inhalte erzeugen lassen (hier nicht). | Lizenznachweise nach 5.2 bereithalten (→ A2, A5). Keine Laufzeit-KI → 5.1.2(i) nicht betroffen. | Q28 [P] |
| **Google Play** | Richtlinie zu KI-erzeugten Inhalten betrifft Apps, die **zur Laufzeit** mit KI Inhalte erzeugen; Apps, die KI-Inhalte nur hosten, sind ausgenommen. Zu **im Vorfeld** erzeugten Assets sagt die Seite nichts; eine Kennzeichnungspflicht nennt sie nicht. Datum nicht angegeben. | Voraussichtlich nicht betroffen, in der Play Console prüfen. | Q29 [P] |
| **Steam** | Content Survey: Angabe nötig, wenn Spiel „used AI services during development or incorporates AI services“; **vorab erzeugte** Inhalte, die mit dem Spiel ausgeliefert und von Spielern konsumiert werden, sind anzugeben; Live-Generierung samt Schutzmaßnahmen auch; Effizienzgewinne seien nicht Gegenstand. Anzeige im Shop und Datum nennt die Seite nicht. | Porträts, Hintergründe, Musik, Stimmen und Figuren sind vorab erzeugte KI-Inhalte → **angeben, falls Steam kommt**. | Q30 [P], Q31 [S] |

## 7. Fragen an den Produktinhaber

Ohne diese Antworten lässt sich GA26 nicht schließen. Pläne bitte mit **Tarifname, Zeitraum (von–bis)** und Kontoinhaber.

**Konten und Pläne**

| # | Frage |
|---|---|
| F1 | **ChatGPT:** Welcher Tarif (Free, Go, Plus, Pro, Team, Enterprise) war wann aktiv? Läuft das Konto in der EWR-Fassung der Terms? Ist „Modell verbessern“ (Datennutzung) an oder aus? |
| F2 | **ElevenLabs:** Welche Tarife seit wann? Wurden die **26 SFX und 5 Musikstücke** in `audio-src/build/` während eines bezahlten Abos erzeugt (Datum der Erzeugung)? Falls in Free: neu erzeugen. Ist „Community Sharing“ aktiv? |
| F3 | **Tripo:** Seit wann Pro? Welche Modelle entstanden vor dem Kauf? Welche Modelle in `art/models/units/` laufen auf Ergebnissen von **Testversion/Gratisrunden**? Sind weitere Modelle öffentlich in der Galerie? |
| F4 | Wurden **Referenzen** hochgeladen, die nicht von dir stammen (Screenshots anderer Spiele, Stockbilder, Fanart)? |

**Unternehmen und Vertrieb**

| # | Frage |
|---|---|
| F5 | **Rechtsform:** Einzelperson/Einzelunternehmen oder Gesellschaft (UG, GmbH)? Wer ist Vertragspartner bei den Diensten? (relevant für „Individual Use Only“) |
| F6 | **Vertrieb:** Apple, Google, Steam, Web? Wann ist ein Release geplant? Monetarisierung wie `12-monetization.md` (Werbung, Kosmetik, Unterstützer-Paket)? Erwarteter Umsatz im ersten Jahr (zur Indie-Grenze von 500 000 USD)? |
| F7 | **Öffentliche Demo:** Läuft die GitHub-Pages-Fassung (U2) öffentlich? Mit welchen Assets, und stammen sie aus Free-Tarifen? |
| F8 | Soll ein **Soundtrack** oder ein Asset-Pack separat erscheinen? |
| F9 | Wer holt die **schriftlichen Zusagen** von ElevenLabs und Tripo (§9)? |
| F10 | Gibt es weitere Quellen, die ich nicht kenne (Stockbilder, Sound-Pakete, Auftragsarbeiten, andere KI-Werkzeuge)? |

### 7a. Angaben des Produktinhabers (2026-10-23)

Mündlich im Chat gemacht, ohne Rechnung und ohne Datumsangaben; nicht von mir geprüft.

| Dienst | Angabe |
|---|---|
| ChatGPT | Plus-Abo |
| ElevenLabs | Pro-Tarif |
| Tripo | Pro-Tarif |
| Herkunft der Assets | Alle Inhalte wurden nur in diesen bezahlten Tarifen erzeugt, nichts im Free-Tarif |

Abgleich mit dem Repo und Folgen:

- **Kaels erster Tripo-Test** entstand laut `art/mockups/tripo-test-2026-10/README.md` im kostenlosen Tarif und liegt öffentlich in der Galerie. Das ist mit der Angabe vereinbar, solange `kael_tripo.glb` nicht ausgeliefert wird (A4). Er ist in den Dateien als Test dokumentiert, nicht als Produktivasset.
- **Smart-Mesh-Runden „Testversion“** (zweiter und dritter Tripo-Durchgang): Die Angabe deckt sie ab, wenn sie im Pro-Konto liefen. Eine Bestätigung des Tripo-Supports bleibt sinnvoll (F3, F9).
- **ElevenLabs Pro** erfüllt die Tarifvoraussetzung für SFX und Musik. Offen bleiben „Individual Use Only“ (F5) und die Studio-Game-Grenze (A10).
- **Nachweis:** Rechnungen mit Datum je Dienst archivieren (A5). Sie belegen, dass der Tarif zum Zeitpunkt der Erzeugung lief; das Prompt-Protokoll (A2) hält das Erzeugungsdatum fest.
- **Weiter offen:** F4–F10 (Referenzen, Rechtsform, Vertrieb, öffentliche Demo, Soundtrack, Zusagen, weitere Quellen). Die Angaben ändern nichts an §5 (Schutz der Ausgaben), Marke/Logo (A8) und an den Kennzeichnungspflichten (§6a).

## 8. Entscheidungsvorlage (Freigabe liegt beim Produktinhaber)

Der Status von GA26/O5 und NFR15 ist nicht geändert. Zur Entscheidung stehen drei Wege; **keiner ist gewählt**.

| Weg | Inhalt | Vorteil | Nachteil |
|---|---|---|---|
| **A – Bedingte Freigabe** | GA26 gilt als geklärt, wenn F1–F10 beantwortet sind, die Auflagen A1–A14 erfüllt sind, ElevenLabs und Tripo ihre offenen Punkte schriftlich bestätigen und ein Anwalt die Punkte in §9 gesichtet hat. | Klare Kriterien, kein Neuerzeugen nötig, wenn die Tarife passen | Dauer; Restrisiko bei unverifizierten OpenAI-Texten |
| **B – Neu erzeugen** | Alles aus unklaren Tarifen (Free/Test) unter bezahltem Abo mit Prompt-Protokoll neu erzeugen, bevor Freigabe | Reinste Herkunft, kein Rückwirkungsstreit | Credits und Zeit; Stil kann abweichen |
| **C – Anwalt zuerst** | Erst anwaltliche Prüfung der §9-Punkte, dann Weg A oder B | Rechtssicherheit vor Investition | Kosten, Verzögerung |

Empfehlung des Assistenten (nicht bindend): **A mit C für die dort genannten Punkte**, B nur für Dateien, bei denen F2/F3 einen Free-Ursprung ergeben.

## 9. Brauchen wir einen Anwalt?

**Ja, gezielt.** Gesucht ist eine Kanzlei mit IT-, Urheber- und Medienrecht (idealerweise Spielebranche). Gegenstände:

1. **ElevenLabs-Verträge:** Widerspruch zwischen Music Terms (Free: kommerziell, Studio Games ausgenommen), Terms §1(c) und Hilfeartikel; Bedeutung von „Individual Use Only“ für eine Gesellschaft; Studio-/Indie-Game-Grenze (inkl. Verbundene, Netto-Umsatz); Soundtrack-Veröffentlichung; „standalone basis“ bei SFX im Audio-Sprite; Rechte an Voice-Design-Stimmen; Auslegung „Entfernen von Herkunftsmarken“.
2. **Tripo:** Wirkung von Free→Pro auf frühere Ausgaben, Widerspruch Terms ↔ CC BY, Testrunden, Haftung bei Tarifwechsel.
3. **OpenAI:** Lesen der für Deutschland geltenden EWR-Terms (ich konnte sie nicht abrufen), Bedeutung des „if any“ in der Abtretung.
4. **Schutzstrategie:** Marke und Logo (O4, Namensrecherche, Anmeldung bei DPMA/EUIPO), Schutz des Gesamtwerks, Umgang mit fehlendem Urheberrecht an reinen Ausgaben, Nachweis des Eigenanteils, Wirkung gegen Nachahmer im Web.
5. **Einordnung nach AI Act Art. 50** und der Frage, ob der Hinweistext (A12) genügt.
6. **Haftung bei Ähnlichkeit** zu bekannten Figuren oder Titeln (Prompt-Namen in A7, Name „Hollow Crown“ vor der Markenanmeldung gegen Titel wie die BBC-Serie *The Hollow Crown* prüfen – **in dieser Recherche nicht untersucht**).
7. Hinweis außerhalb des Auftrags: Code und Texte des Projekts entstehen ebenfalls mit KI-Unterstützung; für sie gelten dieselben Schutzfragen.

**Ohne Anwalt machbar:** OFL-Hinweise und Bibliotheks-Credits, Steam-/Apple-/Google-Fragebögen, Archivieren der Terms, Prompt-Protokoll, Plan-Nachweise.

## 10. Quellenverzeichnis

Alle Abrufe am **2026-10-23**. Kennung wie in §1.

| Q | Quelle | URL | Status |
|---|---|---|---|
| Q1 | OpenAI Terms of Use (global); regionale Fassungen (`en-GB`, `row-terms-of-use`, EU) | https://openai.com/policies/terms-of-use/ | [X] 403; Auszug über Suchtreffer [S] |
| Q2 | OpenAI Usage Policies; Service Terms | https://openai.com/policies/usage-policies/ , https://openai.com/policies/service-terms/ | [X] 403; Auszug über Suchtreffer [S] |
| Q3 | OpenAI Hilfe: Eigentum an Ausgaben, Free und bezahlt (Content Policy und Terms) | https://help.openai.com/en/articles/6783457-what-is-chatgpt , https://help.openai.com/en/articles/5008634-will-openai-claim-copyright-over-what-outputs-i-generate-with-the-api | [X] 403; Inhalt über Suchtreffer [S] |
| Q4 | ElevenLabs Terms of Service (Last Updated 09 Oct 2026) | https://elevenlabs.io/terms-of-use | [P] |
| Q4a | ElevenLabs Terms of Use, Fassung EWR/Schweiz/UK (Last Updated 09 Oct 2026) | https://elevenlabs.io/terms-of-use-eu | [P] |
| Q5 | ElevenLabs Hilfe: Can I publish the content I generate on the platform? | https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform | [P], ohne Datum |
| Q6 | ElevenCreative Terms inkl. Exhibit 4 Sound Effects (Last Updated 09 Oct 2026) | https://elevenlabs.io/creative-terms | [P] |
| Q7 | ElevenLabs Music Terms (Last updated 09 Oct 2026); Parallelseite „Eleven Music Model-Specific Terms“ | https://elevenlabs.io/music-terms , https://elevenlabs.io/eleven-music-model-specific-terms | [P] |
| Q8 | ElevenLabs Service-Specific Terms (Übersicht, Last Updated 09 Oct 2026) | https://elevenlabs.io/service-specific-terms | [P] |
| Q9 | ElevenLabs Docs: Voice Library | https://elevenlabs.io/docs/eleven-creative/voices/voice-library | [P], ohne Datum |
| Q10 | ElevenLabs Prohibited Use Policy (Last Updated 09 Oct 2026) | https://elevenlabs.io/use-policy | [P] |
| Q11 | ElevenLabs Voice Design (Produktdoku) | https://elevenlabs.io/docs/eleven-creative/voices/voice-design | [S] |
| Q12 | Tripo Terms of User Agreement | https://www.tripo3d.ai/terms | [X] 403; Inhalt über Suchtreffer [S] |
| Q13 | Tripo Hilfe und Blog zu Lizenz, Privatsphäre und Training | https://www.tripo3d.ai/help/privacy-policy/can-i-use-models-commercially , https://www.tripo3d.ai/help/privacy-policy/how-to-understand-data-privacy-and-ai-training-at-tripo , https://www.tripo3d.ai/blog/commercial-use-ai-3d-models | [X] 403; über Suchtreffer [S]; Werbeseiten, nicht bindend |
| Q14 | SIL Open Font License 1.1 | https://openfontlicense.org/open-font-license-official-text/ | [P] |
| Q15 | npm-Registry-Metadaten der `@fontsource`-Pakete (Lizenzfeld OFL-1.1) | https://registry.npmjs.org/@fontsource/cinzel/latest u. a. (barlow, barlow-condensed, grenze-gotisch, nunito-sans, silkscreen) | [P], Paketmetadaten, nicht die Lizenzdateien |
| Q16 | npm-Registry-Metadaten der Laufzeit-Bibliotheken | https://registry.npmjs.org/@babylonjs/core/latest u. a. | [P], Paketmetadaten |
| Q17 | Suchtreffer zur C2PA-Kennzeichnung von ChatGPT-Bildern | keine einzelne URL; Fundstelle nicht eindeutig zuzuordnen | [S], nicht belastbar; bei OpenAI nachlesen |
| Q18 | ElevenLabs Preisseite | https://elevenlabs.io/pricing | [P] |
| Q19 | ElevenLabs Hilfe: What happens to my content after my subscription ends? | https://elevenlabs.io/docs/help-center/account/general/what-happens-to-my-content-after-my-subscription-ends | [P], ohne Datum |
| Q20 | ElevenLabs Eleven Music API (FAQ, Werbetext) | https://elevenlabs.io/eleven-music-api | [S] |
| Q21 | US Copyright Office, Copyright and AI, Part 2: Copyrightability (29.01.2025); Mitteilung NewsNet 1060 | https://www.copyright.gov/ai/ , https://www.copyright.gov/newsnet/2025/1060.html | [P] (Mitteilung); der Berichts-PDF-Abruf misslang |
| Q22 | *Thaler v. Perlmutter*: Revision abgelehnt 02.03.2026, D.C. Cir. 18.03.2025 | https://www.jonesday.com/en/insights/2026/03/jones-day-talks-women-in-ip--supreme-court-denies-review-of-thaler-v-perlmutter-ai-authorship-questions-remain | [S], Kanzlei-Beitrag |
| Q23 | § 2 UrhG | https://dejure.org/gesetze/UrhG/2.html | [P] (Gesetzestext über dejure; Original `gesetze-im-internet.de` antwortete 503) |
| Q24 | AG München, 13.02.2026, 142 C 9786/25 (KI-Logos); weitere Entscheidungen | https://www.beyer.law/2026/03/20/urheberrecht-bei-ki-logos-amtsgericht-muenchen-verneint-schutz-trotz-detaillierter-prompts/ , https://www.beyer.law/2026/04/20/olg-duesseldorf-keine-urheberrechtsverletzung-durch-ki-generiertes-bild/ | [S], Kanzlei-Beitrag; Urteilstexte nicht geprüft |
| Q25 | Europäisches Parlament, Studie *Generative AI and Copyright: Training, Creation, Regulation* (PE 774.095, 09.07.2025) | https://merlin.obs.coe.int/article/10360 | [S] |
| Q26 | EU AI Act, Art. 50 (inoffizielle Wiedergabe; EUR-Lex-Abruf lieferte keinen Text) | https://artificialintelligenceact.eu/article/50/ | [P, inoffiziell] |
| Q27 | Änderungsverordnung (EU) 2026/1744 (Digital Omnibus on AI), Art. 50(2) Schonfrist | https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/ u. a. | [S], Kanzlei-Beiträge; Amtsblatt-Text nicht geprüft |
| Q28 | Apple App Store Review Guidelines (Last Updated October 16, 2026) | https://developer.apple.com/app-store/review/guidelines/ | [P] |
| Q29 | Google Play, Richtlinie zu KI-erzeugten Inhalten | https://support.google.com/googleplay/android-developer/answer/14094294 | [P], ohne Datum |
| Q30 | Steamworks, Content Survey (KI-Offenlegung) | https://partner.steamgames.com/doc/gettingstarted/contentsurvey | [P], ohne Datum |
| Q31 | Berichte zur Steam-Änderung vom Januar 2026 | https://www.notebookcheck.net/Steam-updates-AI-disclosure-form-requiring-developers-to-report-visible-and-in-game-AI-but-not-background-tools.1206103.0.html | [S] |

## 11. Was dieses Dokument nicht tut

- Es **entscheidet nicht**. `01-decisions.md` (eingefroren seit 2026-10-23), NFR15 und der Status von GA26/O5 bleiben unverändert. Die Freigabe gibt der Produktinhaber.
- Es **ersetzt keine Rechtsberatung** und keine eigene Lektüre der Bedingungen.
- Es sagt nichts über Urheberrechte an Code, Konzept und Text, zur Altersfreigabe, zum Datenschutz (DSGVO/ATT) oder zu den Bedingungen von Werbe-SDKs und Stores (Zahlungen); sie sind vor dem Release eigens zu klären.
