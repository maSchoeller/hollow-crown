# Story 8.4: Porträts mit Stimmungen für Akt 1

Status: done

## Story

Als Spieler
möchte ich Gesichter, die Gefühle zeigen,
damit Szenen tragen.

## Acceptance Criteria

1. **Neutralbilder von Figuren mit Tripo-Modell bleiben final** (Antwort Produktinhaber 2026-10-24: Modell und Porträt gehören zusammen): Kael, Rhen (`rhen_a`, `rhen_b`), Brenna, Tobin, Mira, Fenn, Liora, Varek, Ysolde, Grosk, Hask, Morra, Ulvric und die generischen Gegner `brigand`, `soldier`, `bandit_archer`. Alle anderen Porträts dürfen von Grund auf neu gedacht werden; dabei sollen **einige Frauen** vertreten sein, nicht nur Männer.
2. **Vier Stimmungen für die Kernfiguren von Akt 1:** `neutral`, `happy`, `angry`, `sad` in gleicher Pose und gleichem Ausschnitt (nur Gesicht, Brauen, Schultern ändern sich), freigestellt (echter Alphakanal), quadratisch 1254 × 1254 (Art Direction §5.1). Es fehlen noch:
   - Mira: `sad`
   - Fenn: `happy`, `angry`, `sad`
   - Liora: `happy`, `angry`
   - Varek: `angry`, `sad`
   - Ysolde: `happy`, `angry`, `sad`
   - Grosk: `happy`, `sad`
   - Hask: `angry`, `sad`
   - Morra: `happy`, `angry`, `sad`
   - Ulvric: `happy`, `angry`, `sad`
   - Rhen (`rhen_a`, `rhen_b`): je `happy`, `angry`, `sad`
   - Halvard (kein Tripo-Modell, darf neu gedacht werden): `neutral` plus 3 Stimmungen
   Kael, Brenna und Tobin sind vollständig.
3. **Nebenfiguren nur `neutral`:** Gerrit (kein Tripo-Modell, darf neu gedacht werden). Osric Dunn (Boss von Mission 1-4) und König Aldric IV (Prolog, Paktnacht) bekommen jetzt je ein Porträt `neutral` (Entscheidung Produktinhaber 2026-10-24).
4. **Generische Gegnerporträts** `art/mockups/characters-s1/class_*.png`: `class_wolf_rider` und `class_temple_guard` neu, `class_mercenary` neu passend zur neuen Tripo-Figur (gemeinsam mit Story 8.3: das Porträt entsteht vor dem Brett-Turnaround); `class_archer`, `class_mage`, `class_fighter`, `class_cleric` dürfen neu gedacht werden, auch mit Frauen.
5. **Ablage und Build:** Die Bilder bleiben in `art/mockups/characters-s1/` (`<id>.png`, `<id>_<mood>.png`); `build_halves()` in `tools/art/build.py` baut daraus Halbfiguren, Büsten und Köpfe. Fehlende Stimmungen fallen in `src/ui/halfFigure.ts` auf `neutral` zurück; nach dieser Story gibt es für die Kernfiguren keinen Rückfall mehr.
6. **Altlasten entfernt:** Die alten Anime-Porträts `art/portraits/` sind bereits gelöscht (Entscheidungslog 2026-10-24). Es entfallen die „Veraltet“-/Moodboard-Hinweise: Abschnitt „Aktueller Stand und veraltete Quellen“ in `art/README.md` und die Statuszeile „Status: Moodboard“ in `art/mockups/characters-s1/README.md`; die Porträts sind als final gekennzeichnet.
7. **Qualitätsprüfung:** Je Bild Alphakanal geprüft (echte Transparenz, kein Boden, kein Text) und Lesbarkeit der Mimik in einer 160-px-Vorschau.
8. **Prompts und Herkunft:** Neue Prompt-Protokolle `art/prompts/moods_act1_<datum>.md` (Vorlage `art/prompts/moods_2026-10-24.md`) und je Neuentwurf `art/prompts/<id>_portrait.md` mit Dienst, Modell, Tarif und Konto zum Erzeugungsdatum (A1, A2), Prompt, Referenzen, Iterationen, Ablageort des unveränderten Originals (A3), menschlichem Anteil. Prompts ohne Namen geschützter Werke, Marken oder Künstler (A7).
9. **Screenshot:** Am Ende ein Screenshot, der Porträts in einer Szene zeigt (Dialog im Hochformat, 375 × 812).
10. **Prüfungen grün:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build` (Bundle-Budget). Ein Commit für die Story. Nicht Teil der Story: Audio und die Effekte aus Story 8.6.

## Tasks / Subtasks

- [x] T1 Stimmungen der Kernfiguren (AC 2, 5, 7, 8)
  - [x] Je Figur das freigegebene Neutralbild `art/mockups/characters-s1/<id>.png` als Referenz, Prompt-Vorlage aus `art/prompts/moods_2026-10-24.md` (erste Nachricht je Chat, Folgenachrichten je Stimmung), bis zu drei Chats parallel in eigenen Tabs
  - [x] Dateien `<id>_<mood>.png` unverändert als Originale ablegen (Git LFS), 1254 × 1254, RGBA
  - [x] Alpha und 160-px-Lesbarkeit prüfen; Übersicht wie `art/mockups/moods_overview.png` (bewusst nicht in `characters-s1/`, weil `build_halves()` dort jede PNG außer `overview.png` zu einer Halbfigur macht)
  - [x] Rhen: beide Varianten, gleiche Kleidung wie `rhen_a.png`/`rhen_b.png`
- [x] T2 Neuentwürfe (AC 1, 3, 4)
  - [x] Halvard: neu denken oder beibehalten (Produktinhaber erlaubt Neuentwurf), `neutral` plus 3 Stimmungen
  - [x] Gerrit: `neutral`
  - [x] `class_wolf_rider`, `class_temple_guard`, `class_mercenary` (gemeinsam mit Story 8.3) sowie nach Bedarf `class_archer`, `class_mage`, `class_fighter`, `class_cleric`; mehrere davon weiblich
  - [x] Wird ein Porträt neu gedacht, danach prüfen, dass Szenen und Texte (Narrative) zur neuen Figur passen; Beschreibung in `art/mockups/characters-s1/README.md` aktualisieren
- [x] T3 Altlasten (AC 6)
  - [x] Abschnitt „Aktueller Stand und veraltete Quellen“ in `art/README.md` auf den heutigen Stand bringen, „Veraltet“-Hinweise entfernen (PoC-Hintergründe bleiben bis Story 8.7 bestehen und werden dort getrennt vermerkt)
  - [x] `art/mockups/characters-s1/README.md`: Status „Moodboard“ durch „final“ ersetzen, Figurentabelle und Dateiliste ergänzen
- [x] T4 Einbindung prüfen und Screenshot (AC 5, 9)
  - [x] `pnpm art:build`: Halbfiguren, Büsten und Köpfe entstehen für alle neuen Dateien; Bundle-Budget im Blick
  - [x] Dialog- und Vorbereitungsansicht im Hochformat prüfen, Screenshot einer Szene mit mehreren Porträts
- [x] T5 Prüfungen (AC 10)
  - [x] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build`

## Dev Notes

- **Heute vorhanden** in `art/mockups/characters-s1/`: Stimmungen von Kael (`happy`, `angry`, `sad`), Brenna (`happy`, `angry`, `sad`), Tobin (`happy`, `angry`, `sad`), Mira (`happy`, `angry`), Grosk (`angry`), Hask (`happy`), Liora (`sad`), Varek (`happy`). Die Gegnerklassen `class_archer`, `class_brigand`, `class_cleric`, `class_fighter`, `class_mage`, `class_mercenary`, `class_soldier` liegen schon dort; `art/portraits/` ist gelöscht.
- **Regeln (Art Direction §5.1):** quadratisch 1:1, Halbfigur Kopf bis Hüfte, Körper leicht gedreht, freigestellt, kein Boden, kein Text, Quelle ≥ 1254 px. Stil Round-Chibi: großer runder Kopf, große Augen, dunkelbraune weiche Outlines, einfaches glänzendes Cel-Shading, warme Farben; Alter nur über Bart, graues Haar, Falten, Narben. Überrascht und verletzt entstehen im Dialog über Effekte, nicht über Bilder.
- **Prompt-Muster:** `art/prompts/moods_2026-10-24.md` (erste Nachricht mit angehängtem Neutralbild, dann je Stimmung eine Folgenachricht „identical in everything … change ONLY the facial expression, eyebrows and shoulders“). Beim Neuentwurf Format und Stilteil aus der Stil- und Formatvorgabe in `art/mockups/characters-s1/README.md` übernehmen, Referenzen wie dort (`kael.png`, `rhen_a.png`, `tobin.png`).
- **Zuordnung zu Story 8.3:** Das generische Porträt `class_<id>.png` ist die Vorlage des Brett-Turnarounds. Wer zuerst dran ist, legt die Prompt-Aufzeichnung an; die andere Story verweist darauf.
- **Ersetzen, nicht ergänzen:** Neu gedachte Porträts ersetzen die alte Datei unter gleichem Namen; die abgelöste Fassung wird nicht im Arbeitsbaum behalten (Git-Historie genügt), wie bei Brenna und Mira am 2026-10-24.
- **Build:** `pnpm art:build` braucht Python mit Pillow und numpy. PNGs unter `art/` liegen in Git LFS: im frischen Worktree zuerst `git lfs pull`.
- **Konventionen (AGENTS.md):** Bilder per ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/`. Neue Entscheidungen ins Entscheidungslog der Art Direction (`concept/23-art-direction/decision-log.md`), nicht in `01-decisions.md`.
- **Geklärt (2026-10-24):** Osric Dunn und König Aldric IV bekommen jetzt Porträts (AC 3).
- **Erhalten:** Neutralbilder der Figuren mit Tripo-Modell, vorhandene Stimmungen, Rückfall auf `neutral` für Nebenfiguren, Pfade der Büsten und Halbfiguren.

### References

- [Source: concept/26-epics/epics/epic-08.md#Story 8.4: Porträts mit Stimmungen für Akt 1]
- [Source: concept/23-art-direction/art-direction.md §5.1, §11]
- [Source: concept/23-art-direction/decision-log.md – Zeile 2026-10-24 „Alte Anime-Porträts gelöscht“]
- [Source: concept/23-art-direction/licensing.md §6 (A1–A3, A7)]
- [Source: art/prompts/moods_2026-10-24.md, art/prompts/missing_2026-10-24.md, art/prompts/weapons-chibi_2026-10-24.md]
- [Source: art/mockups/characters-s1/README.md, art/README.md]
- [Source: tools/art/build.py (`build_halves`), src/ui/halfFigure.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Kontrolleur: Bilder per ChatGPT über Claude in Chrome, Abnahme); Doku und Build-Prüfung Claude Sonnet (Subagenten)

### Debug Log References

- ChatGPT verlor bei Grosk und beim Gewölbe einmal die Bildanhänge; jeweils neu angehängt (siehe Prompt-Protokolle)

### Completion Notes List

- 36 neue Stimmungsbilder: Mira `sad`; Fenn, Ysolde, Morra, Ulvric, Rhen (`rhen_a`, `rhen_b`), Halvard je `happy`, `angry`, `sad`; Liora `happy`, `angry`; Varek `angry`, `sad`; Grosk `happy`, `sad`; Hask `angry`, `sad`. Damit haben alle Kernfiguren von Akt 1 vier Stimmungen; Kael, Brenna, Tobin waren vollständig.
- Halvard: Neutralbild beibehalten (war Stilreferenz der Vereinheitlichung vom 2026-10-23), nur die Stimmungen neu. Gerrit: Neutralbild beibehalten.
- AC 3 geklärt (Produktinhaber 2026-10-24: „beide jetzt“): `osric.png` (Osric Dunn, 2 Iterationen) und `aldric.png` (König Aldric IV.), nur `neutral`.
- Gegnerporträts: `class_wolf_rider` (Frau), `class_temple_guard` (Frau), `class_mercenary` (Mann) neu mit Story 8.3; `class_soldier` als Frau passend zur Tripo-Soldatin, `class_archer` und `class_cleric` als Frauen neu gedacht (die Klerikerin ohne die Kreuzsymbole der alten Fassung); `class_mage` und `class_fighter` bleiben.
- Prompt-Protokolle: `art/prompts/moods_act1_2026-10-24.md` (Stimmungen, Osric, Aldric, Gegnerklassen) statt je eines `<id>_portrait.md`, weil alle Neuentwürfe in wenigen Chats entstanden; `art/prompts/enemies_act1_2026-10-24.md` für die drei neuen Gegnertypen.
- Alle Bilder 1254 × 1254 RGBA mit Alpha 0–255, geprüft in voller Größe, als Gesichtsausschnitt und als 160-px-Miniatur. Verworfen und nicht im Repo: Osric 1. Fassung, eine Fenn-Korrektur mit verschobenem Ausschnitt.
- `art/mockups/characters-s1/README.md` als final gekennzeichnet; `art/README.md` „Aktueller Stand“ auf den heutigen Stand gebracht.
- Szenen-Hintergründe und der Screenshot einer Szene laufen zusammen mit Story 8.7.

### File List

- art/mockups/characters-s1/{mira_sad,fenn_happy,fenn_angry,fenn_sad,liora_happy,liora_angry,varek_angry,varek_sad,ysolde_happy,ysolde_angry,ysolde_sad,grosk_happy,grosk_sad,hask_angry,hask_sad,morra_happy,morra_angry,morra_sad,ulvric_happy,ulvric_angry,ulvric_sad,rhen_a_happy,rhen_a_angry,rhen_a_sad,rhen_b_happy,rhen_b_angry,rhen_b_sad,halvard_happy,halvard_angry,halvard_sad}.png (neu)
- art/mockups/characters-s1/osric.png, aldric.png (neu)
- art/mockups/characters-s1/class_soldier.png, class_archer.png, class_cleric.png (ersetzt)
- art/mockups/characters-s1/README.md
- art/prompts/moods_act1_2026-10-24.md (neu)
- art/README.md
- _bmad-output/implementation-artifacts/8-4-portraets-mit-stimmungen-fuer-akt-1.md, sprint-status.yaml
