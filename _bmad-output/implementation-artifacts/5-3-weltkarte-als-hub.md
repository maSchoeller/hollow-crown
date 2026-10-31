# Story 5.3: Weltkarte als Hub

Status: review

## Story

Als Spieler
möchte ich nach jeder Mission auf der Weltkarte landen und von dort alles erreichen,
damit ich immer sehe, was als Nächstes ansteht.

## Acceptance Criteria

1. **Hub:** Nach einer Mission (Ergebnis → Weiter) und bei „Fortsetzen“ vom Titel erscheint die Weltkarte mit Akt-Pille (Nummer, Jahreszeit, Name), Gold und Material als Pillen, rundem Menü oben rechts und der Leiste unten mit vier Steinen (Heimat, Truppe, Steckbriefe, Chronik), Mockup 03. Der Kriegslager-Hub entfällt; die Heimat ist zusätzlich ein Ort auf der Karte.
2. **Knoten:** Knoten aus `availableNodes` sind Story-Knoten (orange mit Nummer), Erledigtes klein und grau, Heimat Creme mit Zelt. Ein Tipp zoomt leicht heran und öffnet die Knoten-Karte (Kicker, Titel, Ziel, Plätze, Stufe, Belohnung als Symbol + Zahl, Aufstellung, Aufbrechen).

Umfang laut Produktinhaber: Story 5.2 (Valmora als 3D-Szene) fehlt noch, die Karte ist deshalb eine 2D-Ansicht über dem gemalten Bild `weltkarte_valmora.png`. Nebenquest-Knoten (grün, „!“), Heimsuchungen (rot, Leutnant-Gesicht, „NEU“) und die Leutnant-Zeile der Karte gibt es mangels Daten noch nicht; sie kommen mit den Epics 3 und 5.

## Tasks / Subtasks

- [x] T1 Bild: `weltkarte_valmora.png` → `public/assets/world/valmora.webp` (`tools/art/build.py`, `build_world`; Ordner `world/` ist schon nicht vorgecacht)
- [x] T2 Inhalt: Knotenpositionen neu auf das Bild gesetzt (`campaign.yaml` `pos`), neu `homePos` (Schema, `CampaignDef`, Prüfung 0–100 %), Akt-Name und Jahreszeit als Schlüssel `act.<n>.name|season`
- [x] T3 UI: `WorldMap.tsx` + `WorldMap.css` (Karte mit Schwenk, Knoten, Pfade, HUD, Leiste, Knoten-Karte, Ladezustand, Ende-Karte); PoC-`WorldMap` und `EndScreen` samt `end.css` und Abschnitt in `styles.css` gelöscht
- [x] T4 Navigation: `restore` und Ergebnis führen auf die Weltkarte; Lager verliert „Aufbrechen“; `prep` und `troop` merken sich, woher sie kamen (`From`)
- [x] T5 Texte `ui.map.*` (de, en), alte `ui.world.*`-Texte des PoC-Hubs und `ui.camp.title` entfernt

## Dev Notes

- **Karte:** Das Bild ist 16:9, das Handy hochkant. Die Ansicht ist deshalb ein Schwenkbereich (`overflow: auto`, Bild 125 % der Höhe, mindestens Breite des Fensters); Knoten stehen in Prozent des Bildes. Beim Öffnen liegt die nächste Mission in der Mitte. Ein Tipp auf einen Knoten schwenkt ihn in die obere Hälfte (über die Karte) und skaliert die Welt um ×1,12 mit dem Knoten als Ursprung.
- **Laden:** Bild lädt bei Bedarf (nicht vorgecacht). Bis es da ist, stehen Knoten und HUD auf blauem Grund mit dem Stein „Karte wird geladen …“; schlägt es fehl, steht dort „Die Karte ist gerade nicht erreichbar. Die Orte funktionieren trotzdem.“
- **Sichtbare Knoten:** erledigte und verfügbare; gesperrte bleiben im Nebel (nicht gezeichnet). Pfade verbinden sichtbare Knoten entlang `next`.
- **Leiste:** Heimat (→ Lager), Truppe (→ Truppen-Ansicht, Zurück führt auf die Karte), Steckbriefe und Chronik gedimmt (Stories 3.6 und 4.7 fehlen); ein Tipp nennt den Grund. Bei geöffneter Knoten-Karte ersetzt sie die Leiste; Tipp daneben schließt sie.
- **Menü:** rund oben rechts mit Optionen und Zum Titel. Speichern fehlt dort noch (es liegt im Lager).
- **Lager:** bleibt „Heimat“. Seine Leiste behält vorerst Truppe, **Aufstellung**, Weltkarte und **Speichern**. Offen für den Produktinhaber: Gehört Aufstellung nur auf die Knoten-Karte und Speichern ins Menü? Bis zur Entscheidung stehen beide im Lager (Aufstellung von dort öffnet für die nächste Mission, Zurück führt ins Lager).
- **Ende:** Ist kein Knoten mehr verfügbar, liegt die Karte „Ende des ersten Akts“ (Texte `ui.end.*`) über der Leiste; die Taste „Heimat“ ist ihre Haupttaste. Der alte Ende-Bildschirm entfällt.
- **Speicherstand:** `autosave('worldmap'|'camp'|'battle')` unverändert; geladen wird ohne Kampf immer die Weltkarte.
- **Bundle:** 326 KB (WebP q72, 1672 × 941) unter `world/`, nicht im Vorab-Download; Budget bleibt 14,84 von 15,00 MB.
- **Bewusst offen:** Nebenquest- und Heimsuchungs-Stile (grün „!“, rot mit Gesicht und „NEU“), Leutnant-Zeile und Belohnung mit Material (die Karte zeigt Gold der Mission und die Zahl der Nebenziele), echter Pinch-Zoom (2 Stufen), Tageswechsel-Hinweis (5.4).

### References

- [Source: concept/26-epics/epics/epic-05.md#Story 5.3]
- [Source: concept/25-ux/mockups/03-weltkarte.html]
- [Source: concept/25-ux/DESIGN.md#map-node, Knoten-Karte, Leiste]
- [Source: concept/25-ux/EXPERIENCE.md#Navigation]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- `pnpm lint` grün; `pnpm test` 141 Tests grün; `pnpm content:check` OK (810 Schlüssel je Sprache); `pnpm build` grün, Bundle 14,84 MB von 15,00 MB (39 Dateien bei Bedarf, darunter `world/valmora.webp`); `pnpm test:e2e` 12 von 12 grün.
- Browser (375 × 812): Titel → Fortsetzen landet auf der Weltkarte; Knoten Kapitel 2 öffnet die Karte (Ziel, Plätze, Stufe, Gold, Nebenziele); Heimat → Lager (ohne Aufbrechen), Aufstellung aus dem Lager (Zurück → Lager), Weltkarte-Stein, Truppe von der Karte (Zurück → Karte), Steckbriefe-Tipp zeigt den Grund, Menü zeigt Optionen und Titel; Ende-Karte bei leerer Verfügbarkeit; Fehlerzustand des Bildes; keine Konsolenfehler.

### Completion Notes List

- Die Knoten stehen als Prozent in `campaign.yaml`: Prolog (81, 52), Kapitel 1 (60, 42), Kapitel 2 (43, 66), Heimat (52, 79).
- Das Ergebnis führt immer auf die Weltkarte, auch am Ende des Inhalts.

### File List

- `tools/art/build.py`
- `content/acts/act1/campaign.yaml`, `content/core/locales/{de,en}.yaml`, `content/core/locales/{de,en}.names.yaml`
- `src/app/screens/WorldMap.tsx` (neu), `src/app/screens/WorldMap.css` (neu), `src/app/screens/{Menus,Camp,Troop}.tsx`, `src/app/App.tsx`
- `src/app/state/{flow,screen}.ts`, `src/ui/{icons.tsx,styles.css}`, `src/ui/end.css` (gelöscht)
- `src/core/defs.ts`, `src/content/{schemas,validate}.ts`
