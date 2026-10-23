# Stilprobe 3D – Round-Chibi auf dem Diorama

Prüft, ob der Round-Chibi-Stil (B8) und der Spielzeug-Diorama-Look aus `concept/23-art-direction/art-direction.md` §3–§4 in Echtzeit-3D tragen.

- **Dateien:** `closeup.png` (Kael und Bandit, Perspektive 3/4), `diorama_35.png` (Brettkamera 35° aus der Senkrechten, D2), `diorama_50.png` (Vergleich 50°)
- **Datum:** 2026-10-23
- **Werkzeug:** Blender 5.2, EEVEE, headless; Skript `tools/art/style_probe_3d.py`:

  ```bash
  blender -b --factory-startup --python tools/art/style_probe_3d.py -- art/mockups/style-3d-2026-10
  ```

- **Aufbau:** ein gemeinsamer Rumpf (2,5 Köpfe), dazu je Figur Kopf, Frisur, Farben und Signaturteil (Kael: Schulterstück, Bandit: Kopftuch, Bart, Axt) – der Baukasten aus §4.2. Toon-Shader mit 2 Lichtstufen und hue-verschobenen Schatten, dunkelbraune Hüllen-Outline, Teamring ungelit, Blöcke gefast. Eine dritte Figur (Kael-Rumpf mit anderen Farben) zeigt den Farbtausch.
- **Status: vom Produktinhaber abgelehnt (2026-10-23).** Die Karte ist viel zu einfach und fällt hinter die bestehende 3D-Karte zurück. Daraus folgen die Detailgrad-Vorgabe in §3 der Art Direction und der Wechsel zu Bild-zu-3D für die Figuren. Die Bilder bleiben als Beleg liegen.

## Beobachtungen

- **Trägt:** runde Köpfe, Outline und Toon-Licht ergeben denselben freundlichen Spielzeug-Eindruck wie das Stil-Mockup. Team ist über Umhang und Ring auch auf der kleinen Brettansicht sofort lesbar.
- **Gesichter bei 35°:** Von der Brettkamera aus sieht man vor allem Haar und Stirn; Gesicht und Signaturteile vorn verschwinden. Bei 50° sind Augen und Ausrüstung deutlich besser lesbar. Spricht für die obere Hälfte des offenen Bereichs in D2.
- **Signaturteile müssen groß und oben bzw. seitlich sitzen:** Kaels Schulterstück und das Kopftuch des Banditen sind auf dem Brett sichtbar, die Narbe nicht. Kleine Gesichtsdetails tragen nur im Porträt.
- **Grundkörper reichen nicht:** Frisuren aus Kugeln wirken wie Helme, die Figuren verlieren den Charme der Porträts. Für die Produktion: Frisur und Gesicht je Figur modellieren, Augen als Textur.
- **Shader:** EEVEE glättet die Lichtstufen weich; in Babylon braucht es einen eigenen Toon-Shader mit harter Stufe, damit der Look dem Mockup näherkommt.
- **Höhen:** Bei 35° sind Seitenwände kaum sichtbar, die Diorama-Wirkung lebt dort fast nur von Schatten. Auch das spricht für einen steileren Blick bzw. höhere Blöcke an Hängen.
