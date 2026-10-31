# Story 6.3: Das Lager in Akt 1

Status: review

## Story

Als Spieler
möchte ich zwischen Missionen im Lager meine Truppe versorgen,
damit die Heimat schon in Akt 1 ein Ort ist.

## Acceptance Criteria

1. **Heimat als Daten:** `content/core/rooms.yaml` und `c.home = { kind: 'camp', rooms }`. Die Heimat zeigt oben das Lager-Diorama (`locations/lager_unterwegs`) und unten die Stationen Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer als Raumsteine (Mockup 04, Lager). Jede Station öffnet ein Raum-Panel über der weichgezeichneten Ansicht; jede Handlung braucht höchstens 2 Taps und ist ein Kampagnen-Command.
2. **Freischaltung je Station:** Die Freischaltung aus U20 (Schmied und Heiler nach der ersten Mission usw.) steht als `requires` je Raum (Bedingungen aus Story 4.2); gesperrte Stationen sind gestrichelt und nennen den Grund.

## Tasks / Subtasks

- [x] T1 Inhalt: `rooms.yaml` (Schema `roomSchema`, `RoomDef`, `GameData.rooms`, Referenzprüfung und Namensschlüssel in `content:check`); `campaign.yaml`: `home: camp` statt `facilities`
- [x] T2 Zustand: `CampaignState.home` mit Default in `normalizeCampaign`; `homeRooms`, `roomLevel` in `core/campaign/camp.ts`
- [x] T3 UI: `Camp.tsx` (Diorama, HUD mit Börse, Stationen, „Aufbrechen“, Leiste Truppe/Aufstellung/Kartentisch/Speichern), `Rooms.tsx` (Raum-Panels), `camp.css`; Konvoi mit Filter nach Art (Story 6.2 AC 2)
- [x] T4 Aufräumen: Kriegslager-Abschnitte aus `styles.css` gelöscht, Texte `ui.camp.*`/`ui.hub.*` des alten Hubs entfernt
- [x] T5 Tests: `tests/unit/camp.test.ts` (Stationen, `requires`, Burg), `story.test.ts` (Raum-Bedingungen)

## Dev Notes

- **Stationen:** Anzeige = Räume mit `homes` ∋ `c.home.kind` und `fromAct` ≤ Akt. `requires` gilt als UND-Liste; die erste nicht erfüllte Bedingung liefert den Grund (`completed` → „nach Mission …“, `act` → „ab Akt n“). Der Verzauberer ist ein Raum der Burg ab Akt 2 (Epic 10.5); sein Panel läuft (`screen { name: 'camp', tab: 'enchanter' }`).
- **Aufbrechen:** bleibt bis Story 5.3 auf dem Lager (Haupttaste). `Prep` ist unverändert, nur das Inventar öffnet die neue Figur-Ansicht.
- **Börse:** `Wallet` in der Kopfzeile zeigt Gold und alle Materialien als Symbol + Zahl in jedem Panel.
- **Bundle:** Halbfiguren `busts/` nur für beitretende Story-Figuren, 150 px (Budget 14,98 von 15,00 MB).

### References

- [Source: concept/26-epics/epics/epic-06.md#Story 6.3]
- [Source: concept/24-architecture/architecture.md#5.10]
- [Source: concept/25-ux/mockups/04-heimat.html]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- siehe Story 6.4 (Prüfläufe der ganzen Reihe)
- Browser: Prolog gewonnen → Ergebnis → Lager; Stationen gesperrt mit Grund; Händler, Taverne, Heiler, Schmied, Konvoi, Lagerfeuer, Verzauberer öffnen; keine Konsolenfehler.

### Completion Notes List

- U20-Freischaltung (`facilities`) ist durch `requires` ersetzt.

### File List

- `content/core/rooms.yaml` (neu), `content/acts/act1/campaign.yaml`
- `src/app/screens/Camp.tsx`, `src/app/screens/Rooms.tsx` (neu), `src/ui/camp.css` (neu), `src/ui/styles.css`, `src/ui/icons.tsx`
- `src/core/defs.ts`, `src/core/state.ts`, `src/core/campaign/{camp,campaign}.ts`, `src/content/{schemas,load,validate}.ts`
- `tests/unit/{camp,story}.test.ts`, `content/core/locales/{de,en}.yaml`
