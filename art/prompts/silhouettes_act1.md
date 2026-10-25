# silhouettes_act1 – Silhouettentest der Brettfiguren von Akt 1 (Story 8.3)

Art Direction §4.2: „Jede Rolle muss schwarz gefüllt in Zoom ‚Mittel‘ unterscheidbar sein“; §4.3: Signaturteile der Story-Figuren.

- **Werkzeug:** `pnpm art:silhouettes` (`tools/art/silhouettes.py`, Blender 5.2), kein KI-Dienst
- **Datum:** 2026-10-25
- **Bögen:** `art/previews/silhouettes_act1.png` (Originalgröße bei Zoom „Mittel“ auf 375 px Breite) und `silhouettes_act1_large.png` (dreifach gerendert); je Figur schwarz von vorn und 3/4, farbig von vorn und 3/4, gruppiert nach Kompanie, Leutnants, generischen Gegnern
- **Maßstab:** 37,5 px je Feld (375 / 10 Spalten); der Körper einer Figur ist rund 28 CSS-Pixel hoch, mit Waffe, Haar und Fußtiefe 35–45 px
- **Waffen:** je Figur die Waffengruppe aus `content/core/units.yaml` bzw. der ersten Karte, auf der sie steht; Wolfsreiterin und Tempelwache (noch ohne Karte) mit Lanze. Fenn und Ulvric haben noch keine Ausrüstungsdaten und stehen ohne Waffe im Bogen.

## Abnahme

Geprüft durch den Assistenten am Bogen in Originalgröße und dreifach.

| Gruppe | Ergebnis |
|---|---|
| Kompanie | ✓ Rollen unterscheidbar über Waffe und Umriss: Brenna (Axt, breit), Tobin (Lanze, Schild, großer Helm), Mira (Bogen, schmal), Liora (Stab, langes Haar, Gewand), Ysolde (Buch, Bob), Varek (Schwert, Mantel). **Schwach:** Rhen (maskulin) und Kael – gleiche Größe, strubbeliges Haar, Schwert; Kaels Schulterstück trägt schwarz gefüllt kaum. In Farbe sofort getrennt (Nachtblau gegen Grau und Glutorange). Fenn ohne Waffe ist kein fairer Vergleich. |
| Leutnants | ✓ Hask (Irokese), Morra (Pferdeschwanz, Armbrust-Haltung), Grosk (breit, rund) und Ulvric (Wolfsfell-Masse) unterscheidbar; Grosk und Ulvric am ähnlichsten, in der 3/4-Ansicht getrennt. |
| Generische Gegner | ✓ Soldatin (Kesselhut, Lanze) und Bogen-Bandit klar; Tempelwache (Helmbusch, Lanze) klar. **Schwach:** Brigant und Söldner (runde Kopfform, Axt gegen Schwert bei 28 px kaum zu sehen); Wolfsreiterin und Ulvric (beide Fellmasse). |

**Signaturteile (§4.3) im Modell:** sichtbar bei Brenna (rotes Haar, Axt), Tobin (zu großer Helm), Fenn (Kapuze), Liora (langes silberweißes Haar), Ysolde (orangeroter Bob), Varek (roter Mantel, Strähne), Grosk (Bart; Schild kommt als Ausrüstung), Hask (Irokese), Ulvric (Wolfsfell). In Brettgröße nicht lesbar: Kaels Schulterstück, Brennas Zopf, Miras Feder, Fenns Pflaster, Ysoldes Brille, Morras Augenklappe – Details unter 2 Gerätepixel tragen laut §4.1 nur noch als Farbe. Waffen-Signaturen (Kristallstab, Fackel, Armbrust) kommen über die Waffengruppe an den Hand-Sockel, nicht als eigenes Modell.

**Ergebnis:** Alle Rollen sind in Zoom „Mittel“ unterscheidbar; drei Paare sind nur über Farbe oder Waffe sicher zu trennen (Rhen/Kael, Brigant/Söldner, Wolfsreiterin/Ulvric). Für die Lesbarkeit im Spiel tragen dort Teamfarbe, Bodenring und Leutnant-Goldkante (§4.4) mit. Verbesserung (z. B. größeres Schulterstück bei Kael, eigene Kopfbedeckung für den Brigant) wäre ein neuer Tripo-Durchlauf und ist nicht Teil dieser Story.

**Abnahme Produktinhaber (2026-10-25):** so abgenommen; die drei schwachen Paare bleiben im Protokoll vermerkt, kein neuer Tripo-Durchlauf.
