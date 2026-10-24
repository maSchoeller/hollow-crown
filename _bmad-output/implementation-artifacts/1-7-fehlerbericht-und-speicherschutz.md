# Story 1.7: Fehlerbericht und Speicherschutz

Status: review

## Story

Als Spieler
möchte ich nach einem Fehler weiterspielen und meinen Spielstand vor dem Browser schützen,
damit eine lange Kampagne nicht an einem Absturz oder an gelöschten Websitedaten scheitert.

## Acceptance Criteria

1. **Fehlerbildschirm:** Wird eine Kern-Invariante verletzt (`CoreInvariantError`), fängt die App den Fehler und zeigt „Etwas ist schiefgelaufen“ (Stein in Stil B über Schleier) mit „Fehlerbericht exportieren“ und „Letzten Auto-Save laden“.
2. **Fehlerbericht:** JSON mit App- und Content-Version, Gerät (User-Agent, Qualität), letztem Checkpoint, Journal danach, laufendem Kampf (Start + Commands) und den letzten 500 Log-Zeilen; nur lokal erzeugt, vom Spieler geteilt.
3. **Log:** `src/app/log.ts` hält einen Ringpuffer (500) mit Stufen `error/warn/info/debug` und festem `area`-Satz; `debug` nur im Dev-Build oder mit `?debug`.
4. **Speicherschutz:** Beim ersten Speichern ruft die App `navigator.storage.persist()` auf; läuft sie nicht als Home-Bildschirm-App, zeigt sie einmal „Zum Home-Bildschirm hinzufügen, damit dein Spielstand sicher bleibt“.
5. **Speichern scheitert:** Banner mit Export-Angebot (exportiert den Stand aus dem Speicher); der nächste Commit versucht es erneut, bei Erfolg verschwindet das Banner.

## Tasks / Subtasks

- [x] T1 `CoreInvariantError(code, details)` in `src/core/errors.ts`; genutzt in `applyCommand`, `applyCampaign`, `getUnit`, `itemDef`, `terrainDef`, `equipWeapon`, `promote` (AC 1)
- [x] T2 `src/app/log.ts` (Fabrik `createLog` + `log`) (AC 3)
- [x] T3 `src/app/report.ts` (`assembleReport`), `state/rescue.ts` (Sammeln, Export, Auto-Save neu laden) (AC 1, 2)
- [x] T4 `state/fault.ts` (Signal, `guarded`, globale Listener), Fänger in `command`, `campaignCommand`, `concludeBattle`, `restore`, Preact-`useErrorBoundary` im Root (AC 1)
- [x] T5 `state/protection.ts`, Banner und Hinweis (`screens/Fault.tsx`, `fault.css`), Auto-Save meldet Erfolg/Fehler (AC 4, 5)
- [x] T6 Locales de/en; Tests `tests/unit/fault.test.ts`; Dev-Helfer `__hc.crash()`, `__hc.failSaves()`, `__hc.showHomeHint()`

## Dev Notes

- Spieler-Eingabe wird weiter über `validate` abgelehnt; geworfen wird nur bei verletzter Invariante. Nicht unterstützte Bedingungen/Wirkungen (`not yet supported`) bleiben normale Fehler (Content-Lücke, keine Invariante).
- Der erste Fehler bleibt stehen (Folgefehler überschreiben ihn nicht). Scheitert das Neuladen des Auto-Saves (Replay wirft wieder), bleibt der Schirm, mit „Zum Titel“.
- Der Hinweis erscheint nicht während Kampf, Dialog oder Aufstellung, sondern auf dem nächsten ruhigen Schirm. Er folgt dem AC wörtlich (auch auf dem Desktop, wenn nicht installiert).
- Nicht Teil dieser Story: Backup-Erinnerung nach Akt-Finale (§5.15), Content-Fehler-Overlay.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm test` (105 Tests), `pnpm content:check`, `pnpm build` grün; Bundle 14,93 MB (Budget 15).
- Browser (375×812): Hinweis, Banner bei `__hc.failSaves(true)` (verschwindet nach `false` und nächstem Commit), Fehlerschirm per `__hc.crash()`, Auto-Save neu laden, Bericht-Export (Schlüssel, Checkpoint, Log geprüft).

### File List

`src/core/errors.ts`, `src/core/index.ts`, `src/core/{battle,campaign}/apply.ts`, `src/core/util.ts`, `src/core/rules/{items,movement,combat,progression}.ts`, `src/app/log.ts`, `src/app/report.ts`, `src/app/App.tsx`, `src/main.tsx`, `src/app/state/{fault,protection,rescue,session,battle,flow}.ts`, `src/app/screens/{Fault.tsx,fault.css}`, `content/core/locales/{de,en}.yaml`, `tests/unit/fault.test.ts`
