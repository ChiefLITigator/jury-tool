# CHANGELOG
## California Civil Litigation Tool Suite

---

## 2026-03-08

**Previously fixed (pre-Batch):**
- ~~`inflateRawBrowser()` returned `Buffer.from(out)` (Node-only) instead of the `Uint8Array` directly~~ — FIXED (2026-03-08). Browser DOCX export would throw `ReferenceError: Buffer is not defined`. Now returns `out` (Uint8Array); line 104 already handled the `!IS_NODE` branch correctly.
- ~~caseExport drops verdict form state~~ — FIXED. Both `caseExport()` and `caseImport()`
  now correctly include `verdictForms` via `getVFSerializedState()` / `setVFState()`.
- ~~Draft export picker uses pre-edit text when locked~~ — FIXED. PDF and DOCX branches
  now check `draft-locked` and derive heading/body from `getDraftText()` (reads textarea)
  instead of `getDraftHeading()`/`getDraftBodyText()` (read hidden `#draftPreview`).

**Batch A fixes (2026-03-08 — vf-app.js):**
- ~~VF routing silently collapsed to `'sign'` when a palette question's target UID wasn't mapped yet~~ — FIXED (A1). Deferred sentinel `"__src__:{groupId}:{sourceId}"` stored instead; `normalizeRoutes(form)` resolves after every mutation.
- ~~Builder showed `'?'` for broken/unresolved routing targets — no user-visible distinction~~ — FIXED (A2). `routingLabel()` now shows `[PENDING]` for sentinels and `[BROKEN]` for deleted UIDs.
- ~~Preview, TXT export, and DOCX export had three separate diverging routing code paths~~ — FIXED (A3). All three now use `routingText(q, qs, num)` as single source of truth; outputs `[ROUTE BROKEN]` for broken routes.
- ~~`buildRoutingOptions()` always included "Stop" as an option for non-yes_no questions~~ — FIXED (A4). `includeStop` param added; `if_done` dropdowns for non-yes_no pass `false`.
- ~~`substituteParties` built regex from unescaped party keys — broken for keys with special chars~~ — FIXED (A5). `escapeRegex(s)` helper added; party keys escaped before regex.
- ~~`setVFState([])` left `vfForms` empty, crashing all renders~~ — FIXED (A6). Now ensures at least one blank form after applying data.
- ~~`getVFSerializedState()` returned plain `workingForm[]` — active form ID lost on save/load~~ — FIXED (A7). Now returns `{forms, activeFormId}`; `setVFState` handles both old array format and new object format.

**Batch B fixes (2026-03-08 — app-draft.js, app-packet.js, app-cases.js):**
- ~~Switching packets left stale textarea content visible in draft form~~ — FIXED (B1). `resetDraftLockState()` added; called by `packetLoad`, `clearAllWorkspace`, and `caseLoad`.
- ~~Custom dropdown value not flagged as unfilled when `customValue` is blank/whitespace~~ — FIXED (B2). `getUnfilledFields` now checks `(selected === -1 && !custom) || (custom && customValue.trim() === '')`. `applyUnfilledHighlights` highlights `input[data-ftype="custom"]` for custom dropdowns.
- ~~`caseSave`/`caseLoad`/`caseExport`/`caseImport` had 12-field inline loops for caption — hard to maintain~~ — FIXED (B3). `CAPTION_FIELD_MAP` constant + `readCaptionFromDOM`/`applyCaptionToDOM`/`clearCaptionDOM` helpers centralize caption DOM access.
- ~~`caseLoad` crashed when `saved.instructions` was missing or not an array~~ — FIXED (B4). Guard added: `if (!Array.isArray(saved.instructions)) saved.instructions = []`.
- ~~`caseImport` did not auto-load the first packet entry after import~~ — FIXED (B5). Now calls `packetLoad(packetInstructions[0].id)` when instructions present.
- ~~`serializeParsedState` stored `rawText` and `segments` which are re-derived on load (wasted space)~~ — FIXED (B6). Now returns `{ fields: [...ps.fields.entries()] }` only.

**Batch C fixes (2026-03-08 — app-shared.js, app-compare.js, app-draft.js, docx-export.js, draft-parser.js, package.json):**
- ~~`value="..."` and `placeholder="..."` attributes in draft form used `esc()` — double-quotes in field values broke attribute parsing~~ — FIXED (C1). `escAttr()` added to app-shared.js; three attribute sites in app-draft.js changed from `esc` to `escAttr`.
- ~~Diff engine lost paragraph structure — all paragraphs merged into one diff block~~ — FIXED (C2). `PARA_SENTINEL` (`\u00b6`) inserted by `tokenize()` at `\n{2,}` boundaries; rendered as `</p><p class="diff-para">` by renderFull/Left/Right; skipped by `counts()`.
- ~~`setStatus()` used `innerHTML` — XSS risk from CACI lookup error messages~~ — FIXED (C3). Changed to `textContent`.
- ~~`write_in` questions in DOCX export emitted 4 empty paragraphs instead of visible writing lines~~ — FIXED (C4). Now emits 3 paragraphs of `'_'.repeat(60)`.
- ~~`package.json` test script was a dummy echo; `@napi-rs/canvas` version pinned to `"*"`~~ — FIXED (C5). Test script now runs all three batch test files; canvas pinned to `"0.1.94"`.
- ~~`[N. [and]]` pattern not recognized in `classifyBracket` or the compare normalizer~~ — FIXED (C6, partial). `classifyBracket` step 4 and `flattenForCompare` normalizer updated to `(?:or|and)`. `parseInstruction` Pass 1/2 were not yet fixed (see D1).

**Batch F fixes (2026-03-08 — pleading-shell.js, reference DOCX alignment):**
- ~~Bottom margin was 630 DXA (0.4375") — too small, caused footer overlap~~ — FIXED (F1). Changed to 1170 DXA (0.8125") to match reference document.
- ~~Court block used `lineRule: 'auto'` — lines could grow beyond double-spacing~~ — FIXED (F2). All court name paragraphs switched to `lineRule: 'exact'`; trailing blank line gets `after: 480 DXA` to match the pre-caption gap in the reference document.
- ~~Caption table had no explicit cell margins — Word applied its own defaults~~ — FIXED (F3). Added `margins: { left: 10, right: 10, top: 0, bottom: 0 }` to Table constructor, matching reference DOCX (10 DXA left/right).
- ~~Blank shell body area rendered 5+ paragraphs (centered title + blanks) instead of a single post-caption line~~ — FIXED (F4). Blank shell (no `body_text`) now emits one exact-spaced blank line, matching reference. `body_text` path (packet/VF exports) retained: renders centered title + blank + body lines, all with `lineRule: 'exact'`.

**Batch D fixes (2026-03-08 — draft-parser.js, app-cases.js):**
- ~~`parseInstruction` Pass 1 altContentMap signal detection and Pass 2 fallback stripping only matched `[or]`, not `[and]`~~ — FIXED (D1). Three regex sites inside `parseInstruction` updated to `(?:or|and)`: line 151 (Pass 1 signal detection), line 157 (Pass 1 guard filter), line 220 (Pass 2 fallback strip). All 36 tests pass. Completes the C6 parser gap fix.
- ~~`caseExport` built filename directly from raw case name — special characters could produce invalid filenames~~ — FIXED (D2). `nameSlug` now sanitized: `name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60)` before composing download filename.

**Batch E fixes (2026-03-08 — pleading-shell.js):**
- ~~Caption block text was 10pt (docx `size: 20`) — smaller than body text, did not meet court standard~~ — FIXED (E1). `const SZ = 24` (12pt) throughout caption.
- ~~Attorney block automatically appended ", ESQ." to all attorney names regardless of preference~~ — FIXED (E2). ESQ. suffix removed; names output as entered.
- ~~Body area below caption used `bp()` double-spacing (`lineRule: 'auto'`, `line: 480`) — "at-least" rule allows lines to grow~~ — FIXED (E3). Local `bbp()` helper scoped to `buildBody()` uses `lineRule: 'exact'`, `line: 480` (exactly 24pt). Caption/court block above intentionally left on `bp()` double-spacing.
- ~~`makeFirstPageFooter` was a byte-for-byte duplicate of `makeDefaultFooter` — edit one, forget the other~~ — FIXED (E4). `makeFirstPageFooter` removed; both `default` and `first` footer sites now call `makeDefaultFooter(fields)`.
- ~~`ph()` helper (gray placeholder TextRun) defined but never called anywhere in the file~~ — FIXED (E5). Dead function removed.
- ~~CLI prompt numbering skipped 8 — prompts jumped from 7 to 9 (field 8 was deleted at some point)~~ — FIXED (E6). Renumbered: 9→8, 10→9 … 23→22 (sequential 1-22).
