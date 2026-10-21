# 01 – Entscheidungsprotokoll

Dieses Dokument hält **alle getroffenen Entscheidungen** fest. Es ist die verbindliche Referenz: Widerspricht ein anderes Dokument diesem Protokoll, gilt das Protokoll.

- **[A]** = mit dem Produktinhaber abgestimmt.
- **[C]** = von Claude als Default gesetzt (nicht explizit abgestimmt). Darf die Umsetzung begründet ändern; Änderung hier dokumentieren.

Änderungen an Entscheidungen: neue Zeile in „Änderungshistorie“ unten, alte Entscheidung durchstreichen, nicht löschen.

## Produkt

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| P1 | Name | **Hollow Crown**, Repo `hollow-crown`; Store-Untertitel später | A |
| P2 | Grundkonzept | Story-Kampagne in Kapiteln + Lager/Söldner-Systeme zwischen Missionen | A |
| P3 | Geschäftsmodell | F2P fair: Kosmetik + freiwillige Bonus-Ads (gedeckelt), kein Ad-Revive, keine Energie, Werbefrei-Kauf. **Nicht in V1** | A |
| P4 | V1-Umfang | Vertical Slice: Prolog + 5 Kapitel, ~8 Story-Charaktere + Taverne, ~40 Items, Lager, Scharmützel | A |
| P5 | Sprachen | Spiel DE + EN mit i18n ab Tag 1 | A |
| P6 | Doku/Code-Sprache | Konzept Deutsch, Code/Bezeichner/Datenschlüssel Englisch | A |

## Technik

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| T1 | Plattform | Web-first (Browser auf Handy/Tablet/PC), PWA; später Capacitor für App Stores | A |
| T2 | Sprache/Build | TypeScript (strict) + Vite | A |
| T3 | Rendering | Babylon.js, orthografische Kamera für das 2D-Brett; später glTF-Modelle aus Blender | A |
| T4 | UI | HTML/CSS-Overlay über dem Canvas | A |
| T5 | UI-Framework | Preact + @preact/signals (leicht) | C |
| T6 | Regelkern | Pure TS ohne DOM/Babylon-Abhängigkeit, deterministisch mit Seed-RNG, Command/Event-Architektur | A |
| T7 | Tests | Vitest (Kern), Playwright mit Mobil-Profilen (E2E) | A |
| T8 | Performance | 60 FPS auf ~3 Jahre altem Mittelklasse-Handy, Ladezeit < 5 s, initialer Download < 15 MB, offline-fähig | A |
| T9 | Speichern | Lokal in IndexedDB, Auto-Save nach jeder Aktion + 3 Slots, Export/Import als Datei, versioniert mit Migrationen; Cloud später | A |
| T10 | Content-Format | Eigenes YAML-Textformat (Karten als ASCII-Raster) + Zod-Schemas; Karten-Viewer/-Validator im Browser + CLI-Simulator (KI vs. KI) in V1 | A |
| T11 | Paketmanager/Runtime | pnpm, Node 22 LTS | C |
| T12 | Barrierefreiheit | Nicht in V1 (Farbenblind-Modus, Schriftgröße, Linkshänder-Layout später). Maus-Bedienung am PC ist Pflicht | A |

## Spielmechanik

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| G1 | Ausrichtung | Hochformat, adaptiv (Tablet/PC: Seitenpanels) | A |
| G2 | Bedienung | Tap-Tap mit Geistervorschau + Aktionsleiste unten; Bewegung bis zur Aktion zurücknehmbar; Pinch-Zoom, Zwei-Finger-Pan, Langdruck = Info | A |
| G3 | Zugfolge | Phasen wie FE: Spieler → Gegner → Dritte Partei | A |
| G4 | Kampfauflösung | Trefferchance + Vorschau; fester Schaden; geglätteter Zufall (Mittel aus 2 Würfen) | A |
| G5 | Konter-Regeln | Waffendreieck (Schwert > Axt > Lanze > Schwert) + Effektivität | A |
| G6 | Magie | Elementkreis Feuer > Wind > Erde > Wasser > Feuer, zusätzlich Licht ↔ Dunkel; Angriffselement vs. Verteidiger-Affinität | A |
| G7 | Verzauberung | Runen-Slots (1–2) in Waffen, beim Verzauberer im Lager ein-/ausbaubar; Waffe erhält Element (+ ggf. Effekt) | A |
| G8 | Element-Effekte | Status (Brennen, Nass, Verlangsamt, Rückstoß) + Geländeeffekte (Wald brennt, Wasser löscht, Felswall, Wind vertreibt Nebel) | A |
| G9 | Inventar | Paperdoll (Haupt-/Nebenhand, Kopf, Körper, 2 Accessoires, Beutel 3), Gewicht vs. Tragkraft, **kein Verschleiß** | A |
| G10 | Loot | Seltenheit + 0–2 Affixe, handgemachte Legendäre, Set-Boni | A |
| G11 | Skills | Ausrüstung lehrt Skills (Meisterung → dauerhaft), + Klassen-Skills + persönlicher Skill | A |
| G12 | Wachstum | Wachstumsraten, geglättet (kein Totalausfall). Stufe 1–20 | A |
| G13 | Klassen | 2 Stufen, verzweigt: ~10 Basisklassen → je 2 Profiklassen ab Stufe 10 per Siegel | A |
| G14 | Tod | Niedergestreckt → Narbe → Tod; Tod-Modus Klassik/Standard/Casual | A |
| G15 | Schwierigkeit | Leicht/Normal/Schwer × Tod-Modus; Schwierigkeit nur absenkbar | A |
| G16 | Rekrutierung | Story-Helden (inkl. Ansprechen im Kampf) + Taverne mit generischen Söldnern | A |
| G17 | Beziehungen | Supports C/B/A/S + Nachbarbonus + Tandem-Angriff ab B (50 % Schaden), Schutz ab A; auch Gegner-Paare | A |
| G18 | Wirtschaft | Druck durch Schmied (Aufwerten +1…+5, Affix neu würfeln), Anwerbung, Narbenheilung | A |
| G19 | Verbrauch | Tränke mit Ladungen, nach Mission kostenlos aufgefüllt; seltene Verbrauchsgüter echt verbraucht | A |
| G20 | Karten | Alle Größen (kompakt bis groß); Zoom, Minikarte, Speichern mitten in der Mission | A |
| G21 | Gelände | FE-Gelände + interaktive Objekte (Türen, Truhen, Hebel, Ballisten, Dörfer); keine Höhenstufen | A |
| G22 | Missionen | Ziele: Besiegen, Erreichen, Beschützen, Einnehmen, Wellen überleben, Entkommen; 1–3 Nebenziele mit Bonus-Loot | A |
| G23 | Gegner/KI | Volle Info (Gefahrenzonen, Langdruck) + KI-Profile; Nebel des Krieges auf einzelnen Karten | A |
| G24 | Lager | Konvoi, Händler, Schmied, Verzauberer, Taverne, Heiler, Supports, Vorbereitung, Scharmützel (V1); Mahlzeiten/Training (V1.1) | A |

## Story & Darstellung

| # | Thema | Entscheidung | Status |
|---|---|---|---|
| S1 | Setting | Klassische High Fantasy | A |
| S2 | Prämisse | „Der gebrochene Drachenpakt“ | A |
| S3 | Hauptfiguren | Avatar (Taktiker, auf dem Feld, Fähigkeit „Befehl“) + Lord **Kael**, Hauptmann des Aschenbanners | A |
| S4 | Verzweigung | Akt 1 linear, danach Fraktionswahl (3 Routen); V1 nur Datenmodell vorbereitet | A |
| S5 | Darstellung | Visual-Novel-Dialoge mit Porträts, Kurzkampf auf dem Brett; Speed 1x/2x/Skip; 3D-Kampfszene später optional | A |

## Von Claude gesetzte Detail-Defaults [C]

Diese Werte wurden nicht einzeln abgestimmt, sondern als **Startwerte** gesetzt. Balancing im Playtest.

- Alle Formeln und Zahlen in `03-combat.md`, `04-units-progression.md`, `05-inventory-items.md`, `07-camp-economy.md`.
- Tragkraft = STR + Bewegungstyp-Bonus (statt reiner STR), damit Startausrüstung nicht sofort überlädt.
- Beutel-Gegenstände zählen nicht zum Gewicht.
- Tauschen und Konvoi-Zugriff beenden den Zug nicht (einmal pro Zug).
- Niederlage (Avatar/Kael fällt): Neustart ab Rundenbeginn (Standard/Casual) bzw. Missionsbeginn (Klassik). → siehe Offene Punkte.
- Einheit mit 2 Narben stirbt beim nächsten Erreichen von 0 TP sofort.
- Skill-Loadout: max. 4 gemeisterte Skills ausgerüstet (5 nach Klassenaufstieg).
- V1 implementiert pro Basisklasse **eine** Profiklasse; alle 12 sind spezifiziert.
- Weltkarte als einfache Knotenkarte.

## Offene Punkte (vor/während V1 klären)

| # | Frage | Vorschlag |
|---|---|---|
| O1 | Darf man in Standard/Casual eine Runde neu starten? (Soft-Reset untergräbt Permadeath) | Ja in Casual/Standard, Nein in Klassik; im Playtest beobachten |
| O2 | Niedergestreckte Einheit: Blutungs-Countdown statt „bis Missionsende“? | Erst ohne Countdown testen; Option `bleedOutTurns` im Datenmodell vorsehen |
| O3 | Kosmetik-Katalog & Preisgestaltung | Nach V1, siehe `12-monetization.md` |
| O4 | Store-Name / Markenrecherche | Vor Store-Release |

## Änderungshistorie

| Datum | Änderung |
|---|---|
| 2026-10-21 | Initiale Anforderungsdefinition (Grilling-Session) |
