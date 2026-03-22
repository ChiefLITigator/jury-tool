# CODEBASE MAP
## California Civil Litigation Tool Suite
## Last updated: 2026-03-21

Use this file to orient any LLM at the start of a session.
Paste this file + only the specific source file(s) being touched.
Never paste caci-data.js or vf-data.js into a session unless debugging data.

**NEVER push to GitHub unless the user explicitly instructs you to do so. Push authorization is per-commit — it does NOT carry forward to subsequent commits.**

---

## FILE INVENTORY

| File | Lines | ~Tokens | Status | Load for session? |
|------|-------|---------|--------|-------------------|
| caci-compare.html | ~1145 | ~10,000 | Active | Only if touching HTML/CSS/tabs |
| app-shared.js | 281 | ~2,500 | Active | Yes — shared utilities, CACI lookup, print |
| docx-reader.js | 385 | ~3,500 | Active | When touching batch compare / DOCX parsing |
| app-compare.js | 476 | ~5,300 | Active | Yes — diff engine, compare tab |
| app-draft.js | 595 | ~6,300 | Active | Yes — instruction drafter |
| app-packet.js | 192 | ~1,800 | Active | Yes — packet tray |
| app-cases.js | 238 | ~2,300 | Active | Yes — localStorage case system |
| app-browse.js | 203 | ~1,200 | Active | When touching browse/search panel |
| draft-parser.js | 341 | ~3,700 | Stable | Only if touching parse logic |
| vf-app.js | 1645 | ~16,000 | Active | When touching VF tab |
| docx-export.js | 401 | ~3,800 | Active | When touching DOCX export |
| pleading-shell.js | 812 | ~7,000 | Active | When touching pleading shell |
| pleading-ui.js | 385 | ~2,800 | Active | When touching Pleading tab UI |
| vf-data.js | 6022 | ~50k+ | Stable | NEVER — data file |
| parse-vf.js | 841 | ~7,500 | Utility | Only if re-parsing VF corpus |
| caci-data.js | large | ~150k+ | Stable | NEVER — too large |
| parse-caci.js | 208 | ~1,900 | Utility | Only if re-parsing CACI PDF |
| verify-caci.js | 114 | ~1,100 | Utility | Only if verifying data |
| test-caci.js | 111 | ~1,100 | Utility | Only if running tests |
| test-batch-a.js | 226 | ~1,800 | Test | Only if running/editing VF routing tests |
| test-batch-b.js | 189 | ~1,600 | Test | Only if running/editing case persistence tests |
| test-batch-c.js | 234 | ~1,900 | Test | Only if running/editing diff/escAttr/parser tests |
| CHANGELOG.md | — | — | Docs | Never — reference only |

**Rule:** Total context per session should stay under ~40,000 tokens.
Logic files only. Data files never.

---

## ARCHITECTURE OVERVIEW

```
caci-compare.html              — single-page app shell, all tabs live here
  ├── caci-data.js             — 1st: exposes window.caciDB (read-only)
  ├── draft-parser.js          — 2nd: exposes parseInstruction(), findTopLevelBrackets()
  ├── app-shared.js            — 3rd: esc, lookupCACIText*, downloadTXT, doPrint, print settings, ZIP utilities
  ├── docx-reader.js           — 4th: parseDocxInstructions(), matchInstructions() for batch compare
  ├── app-compare.js           — 5th: diff engine, compare tab logic (single + batch)
  ├── app-draft.js             — 6th: instruction drafter
  ├── app-packet.js            — 7th: packet tray
  ├── app-cases.js             — 8th: localStorage case system
  ├── app-browse.js            — 9th: CACI browse/search panel
  ├── lib/docx.iife.js         — 10th: window.docx (UMD bundle, docx v9)
  ├── pdfmake.min.js           — 11th: window.pdfMake (CDN, v0.2.7)
  ├── vfs_fonts.min.js         — 12th: registers bundled fonts for pdfmake (CDN)
  ├── docx-export.js           — 13th: exposes exportDOCX()
  ├── vf-data.js               — 14th: exposes window.vfDB
  ├── vf-app.js                — 15th: all VF builder logic
  ├── pleading-shell.js        — 16th: exposes window.generatePleadingShell(options)
  └── pleading-ui.js           — 17th: Pleading Shell tab UI controller
```

**No build step. No bundler. No framework. All vanilla JS.**
Python may be used for local utility scripts (data parsing, verification, file processing) that run outside the browser. Do not introduce Python to the browser app.
Served locally via VS Code Live Server. Opened in browser as file or localhost.

---

## caci-compare.html

**Purpose:** App shell. Contains all HTML structure, CSS, and `<script>` tags.
No inline JavaScript (all logic is in .js files).

**Theme:** `[data-theme="dark"]` CSS variables + `color-scheme: dark`. Toggle via `#themeToggle` button. All colors use CSS variables (`--card`, `--bg`, `--text`, `--border`, etc.). **Never use hardcoded colors** (`#fff`, `white`, etc.) in inline styles — always use `var(--card)`, `var(--bg)`, `var(--text)` so dark mode works.

**Tabs:**
- `data-tab="compare"` — diff viewer (`#tab-compare`)
- `data-tab="draft"` — instruction drafter (`#tab-draft`)
- `data-tab="vf"` — verdict form builder (`#tab-vf`)
- `data-tab="pleading"` — pleading shell generator (`#tab-pleading`)

**Case bar** (`#caseBar`): shown on draft, VF, and pleading tabs. Hidden on compare tab only.
Note: case persistence (caseSave/caseLoad) includes pleading Section B caption fields (added 2026-03-08). Old saves without `caption` are loaded as `caption || {}`.

**Print settings panel** (`#print-settings-wrap`): shared across tabs.
Controls font, size, spacing, alignment, margins for print/PDF output.

**Key DOM IDs:**
```
Compare tab:
  #caciNumber, #versionA, #officialCaci, #versionB
  #compMode, #compareBtn, #compareStatus, #loadCaci, #resetCaci
  #results, #diffCols, #legend, #card-summary, #sumBody

Draft tab:
  #packetTray, #packetCaciNum, #packetLabel, #packetAddBtn
  #packetList, #packetCompileRow, #compilePacketBtn
  #draftCaciNum, #draftLoadStatus, #draftWorkspace
  #draftForm, #draftPreview, #draftEditArea
  #draftLockWarning, #draftUnfilledStatus

Pleading tab:
  #pleadingMode (radio: blank/request/response)
  #discoveryPanel, #discoveryPanelLabel
  #disc_type, #disc_propounding_name, #disc_propounding_role
  #disc_responding_name, #disc_responding_role
  #disc_set_number, #disc_count, #disc_include_requests
  #pleadingPaperCheck, #generatePleadingBtn, #pleadingGenStatus

Shared:
  #caseBar, #caseSelect, #caseNameInput
  #caseSaveBtn, #caseDeleteBtn, #caseExportBtn, #caseImportFile
  #caseBarStatus, #print-header, #packetPrintArea
  #packetCompileOverlay, #packetCompileText
  #ps-font, #ps-size, #ps-spacing, #ps-align, #ps-margins
```

**Script load order (current — all live):**
```html
<script src="caci-data.js"></script>
<script src="draft-parser.js"></script>
<script src="app-shared.js"></script>
<script src="docx-reader.js"></script>
<script src="app-compare.js"></script>
<script src="app-draft.js"></script>
<script src="app-packet.js"></script>
<script src="app-cases.js"></script>
<script src="app-browse.js"></script>
<script src="lib/docx.iife.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js"></script>
<script src="docx-export.js"></script>
<script src="vf-data.js"></script>
<script src="vf-app.js"></script>
<script src="pleading-shell.js"></script>
<script src="pleading-ui.js"></script>
```

---

## app-shared.js  (281 lines)

**Purpose:** Shared utilities used across multiple app files.
Reads from caciDB (set by caci-data.js). No module system — all globals.

| Function / Const | Description |
|-----------------|-------------|
| `const esc` | HTML-escape for text content — escapes `& < >` only |
| `const escAttr` | HTML-escape for attribute values — escapes `& < > " '` (superset of esc) |
| `lookupCACITextForDraft(num)` | PDF cleanup + bracket repair, bracket structure preserved → use for draft/parse pipeline |
| `lookupCACIText(num)` | Same + `flattenForCompare()` → use for compare tab only |
| `downloadTXT(text, filename)` | Creates blob and triggers download |
| `setPrintHeader(text)` | Sets `#print-header` text content |
| `doPrint(cls)` | Adds print class, calls `window.print()`, cleans up on afterprint |
| `const PS_FONTS` | Font family map for print settings |
| `updatePrintSettings()` | Injects `@media print` / `@page` style tag from form values |
| Print settings event listeners | `print-settings-toggle`, `ps-*` change listeners, initial call |
| `exportPDF(sections, filename)` | pdfmake silent Blob download; `sections: [{heading, body}]`, body split on `\n\n` per paragraph |

**escAttr vs esc:** Use `escAttr` for HTML attribute values (`value="..."`, `placeholder="..."`). Use `esc` for text node content. `escAttr` is a strict superset.

### Two lookup functions — know which to use:
- `lookupCACITextForDraft(num)` — bracket structure preserved → use for draft/parse pipeline
- `lookupCACIText(num)` — same + `flattenForCompare()` → use for compare tab only

### lookupCACITextForDraft cleanup pipeline (in order):
1. **Step 0:** Join wrapped title lines (paren continuations, non-sentence-starter words)
2. **Step 1:** Strip `CACI No. XXXX` running headers
3. **Step 2:** Strip orphaned ALL-CAPS series title lines
4. **Step 3:** Strip bare page folio numbers
5. **Step 4:** Strip revision history (`New/Renumbered/Formerly/Derived from [Month] [Year]...`)
6. **Step 4a:** Strip leaked next-instruction header lines at end
7. **Step 4b:** Strip leaked `NNNN–NNNN. Reserved for Future Use` lines
8. **Step 4c:** Strip trailing footnote marker (`*`)
9. **Step 4d:** Bracket-balance repair: close `[N. [or]` → `[N. [or]]`, `[N. [and]` → `[N. [and]]`
10. **Whitespace cleanup:** blank-only lines, mid-paragraph blank line removal
11. **Re-split** numbered list items merged by PDF extraction
12. **Line joins:** lowercase, uppercase (with sentence-starter guard), digit (with `N.` guard), quote/§/slash, connector signals
13. **Collapse** extra blank lines
14. **Step 5a:** Per-instruction bracket fixes (16 targeted `.replace()` calls for specific CACI numbers)

---

## app-compare.js  (476 lines)

**Purpose:** Diff engine and all compare tab logic.

| Lines | Section | Key Functions |
|-------|---------|---------------|
| 1–70 | TOKENIZER | `tokenize()`, `stripInstructionHeading()`, `flattenForCompare()` |
| 71–127 | LCS DIFF | `computeDiff(a,b)`, `computeChunkedDiff(a,b,sz)` |
| 128–194 | THREE-WAY DIFF | `threeWayDiff(tA, tCaci, tB)` |
| 195–210 | COUNTING | `counts(ops)` — skips PARA_SENTINEL tokens |
| 211–265 | HTML RENDERING | `renderFull()`, `renderLeft()`, `renderRight()`, `colHtml()` |
| 266–286 | SCROLL SYNC | `attachScrollSync()` |
| 287–375 | MAIN COMPARE | `runCompare()` — orchestrates 2-way and 3-way diff |
| 376–end | EVENT LISTENERS | loadCaci, resetCaci, compareBtn, tab navigation, print/export compare |

**Paragraph sentinel:** `const PARA_SENTINEL = '\u00b6'` (pilcrow). `tokenize()` inserts sentinels at `\n{2,}` boundaries before collapsing whitespace. `counts()` skips sentinels so paragraph breaks don't inflate word-change statistics. `renderFull/Left/Right` convert sentinels to `</p><p class="diff-para">`.

**`flattenForCompare` normalizer:** Closes unclosed `[N. [or]]` and `[N. [and]]` brackets (PDF extraction sometimes drops closing `]`). Filter step also removes both `[or]` and `[and]` signals.

---

## app-draft.js  (595 lines)

**Purpose:** Instruction drafter — all draft form and preview logic.

### Global State:
```javascript
let draftState = null;   // current parsed instruction (or null)
```

| Lines | Section | Key Functions |
|-------|---------|---------------|
| 1–13 | STATE | `let draftState = null` |
| 14–68 | COMPILER | `resolveDropdown()`, `substituteInner()`, `compileInstruction(state)` |
| 69–175 | UNFILLED TRACKING | `getUnfilledFields()`, `applyUnfilledHighlights()` |
| 176–320 | FORM RENDERER | `renderDraftForm(state)`, `onDraftChange(e)` |
| 321–370 | CUSTOM DROPDOWN | `activateDraftCustom()`, `restoreDraftDropdown()` |
| 371–440 | PREVIEW | `updateDraftPreview()` |
| 441–end | EVENT LISTENERS + HELPERS | loadDraftBtn, draftCaciNum, addToPacketBtn, lockEditBtn, copyDraftBtn, print/export draft, `getDraftText()`, `getDraftHeading()`, `getDraftBodyText()`, `resetDraftLockState()` |

**`resetDraftLockState()`:** Removes `draft-locked` class from `#draftWorkspace`, clears `#draftEditArea` textarea, restores `#draftPreview` visibility, resets `#lockEditBtn` text and `#draftLockWarning` visibility. Called by `packetLoad()` (app-packet.js), `clearAllWorkspace()` (app-cases.js), and `caseLoad()` (app-cases.js) before every load path to prevent stale textarea content bleeding into a new instruction.

**Export picker locked-state bug fix (2026-03-07):** When the workspace is locked
(`draft-locked` class), `getDraftHeading()` and `getDraftBodyText()` read from
`#draftPreview` which is hidden. The export picker now checks `draft-locked` first:
if locked, it calls `getDraftText()` (which reads `#draftEditArea`) and splits the
result on `\n` / `\n\n` to derive heading and body. Unlocked path unchanged.

### Data Flow (Draft tab):
```
User types CACI# → lookupCACITextForDraft() → raw text
  → parseInstruction() [draft-parser.js] → parsedState
  → draftState = parsedState
  → renderDraftForm(draftState) → DOM form
  → user fills form → onDraftChange() → draftState.fields updated
  → updateDraftPreview() → compileInstruction(draftState) → preview text
  → "Add to Packet" → packetInstructions.push({ parsedState: draftState })
  → renderPacketTray()
```

---

## app-packet.js  (191 lines)

**Purpose:** Packet tray — manage and compile multi-instruction packets.

### Global State:
```javascript
let packetInstructions = [];   // array of { id, caciNum, label, parsedState }
let packetIdCounter    = 0;    // auto-increment for packet entry IDs
let activePacketId     = null; // which packet entry is currently in draft form
```

| Function | Description |
|----------|-------------|
| `renderPacketTray()` | Renders the tray list with load/remove buttons and unfilled warnings |
| `packetLoad(id)` | Loads a packet entry into the draft form |
| `packetRemove(id)` | Removes a packet entry |
| `getPacketUnfilledSummary()` | Returns [{caciNum, label, count}] for entries with unfilled fields |
| `compilePacket()` | Joins all instructions into a single text block with separators |
| Event listeners | packetAddBtn, packetCaciNum keydown, compilePacketBtn, closeCompileOverlay, printPacketBtn, exportPacketBtn |

**exportPacketPicker — "Pleading DOCX" format:**
Loads saved attorney profile (localStorage `pleading_attorney_profile`, strips `pl_` prefix),
overlays the current case caption (only-if-missing), sets `document_title = 'PROPOSED JURY INSTRUCTIONS'`,
sets `body_text = compilePacket()`, calls `generatePleadingShell({ fields, plainPaper })`.
Respects `#packetPleadingCheck` (independent from Pleading tab checkbox). Async IIFE pattern; errors logged to console.

---

## app-cases.js  (238 lines)

**Purpose:** localStorage case persistence system.

### Global State:
```javascript
const CASE_KEY = 'caci_cases';   // localStorage key
const CAPTION_FIELD_MAP = [      // 14 Pleading Section B fields → no-prefix key
  ['pl_court_name', 'court_name'], ['pl_court_county', 'court_county'],
  ['pl_plaintiff_name', 'plaintiff_name'], ['pl_plaintiff_desc', 'plaintiff_desc'],
  ['pl_plaintiff_label', 'plaintiff_label'],
  ['pl_defendant_name', 'defendant_name'], ['pl_defendant_desc', 'defendant_desc'],
  ['pl_defendant_label', 'defendant_label'],
  ['pl_additional_parties', 'additional_parties'],
  ['pl_case_number', 'case_number'], ['pl_judge_name', 'judge_name'],
  ['pl_dept_number', 'dept_number'],
  ['pl_attorney_role', 'attorney_role'], ['pl_client_name', 'client_name']
];
```

| Function | Description |
|----------|-------------|
| `loadCaseIndex()` | Reads and parses the case index from localStorage |
| `saveCaseIndex(obj)` | Writes the case index to localStorage |
| `populateCaseSelect()` | Populates `#caseSelect` with sorted case names |
| `setCaseBarStatus(msg, cls)` | Sets status message in case bar |
| `readCaptionFromDOM()` | Reads all 12 Section B DOM inputs → `{court_name, ...}` object |
| `applyCaptionToDOM(caption)` | Writes caption object to 12 Section B DOM inputs |
| `clearCaptionDOM()` | Clears all 12 Section B DOM inputs |
| `serializeParsedState(ps)` | Converts fields Map → `{fields:[...entries()]}` for JSON storage (rawText/segments excluded — re-derived on load) |
| `applyFieldValues(fresh, saved)` | Restores field values onto a freshly-parsed state |
| `clearAllWorkspace()` | Resets packet/draft/VF; calls `resetDraftLockState()` and `clearCaptionDOM()` |
| `caseSave()` | Saves current packet + VF state + caption under a case name |
| `caseLoad(name)` | Restores packet + VF state + caption; calls `resetDraftLockState()`; auto-loads first packet |
| `caseDelete()` | Deletes a case from localStorage |
| `caseExport()` | Downloads case as JSON file (includes verdictForms + caption) |
| `caseImport(file)` | Reads JSON, restores packet + VF state + caption; auto-loads first packet |
| Event listeners | caseSaveBtn, caseDeleteBtn, caseExportBtn, caseImportFile, caseSelect |

### localStorage Schema:
```javascript
// Key: 'caci_cases'
// Value: JSON object
{
  "Case Name String": {
    instructions: [
      {
        caciNum: "302",
        label: "Plaintiff 1",
        parsedState: {
          // rawText and segments are NOT stored (re-derived from caciDB on load)
          fields: [  // serialized Map as array of [key, fieldObj] pairs
            ["key_string", { type, key, label, value/checked/selected, ... }]
          ]
        }
      }
    ],
    verdictForms: [ ...vf state objects... ],  // saved by caseSave(), restored by caseLoad()
    caption: {                                 // Pleading Section B snapshot
      court_name, court_county,
      plaintiff_name, plaintiff_desc,
      defendant_name, defendant_desc,
      additional_parties,
      case_number, judge_name, dept_number,
      attorney_role, client_name             // added 2026-03-08; absent on older saves
    }  // absent on cases saved before this feature; read as caption || {}
  }
}
```

---

## app-browse.js  (203 lines)

**Purpose:** CACI browse and search panel. Lets users find instructions by
keyword or series without knowing the CACI number. Self-contained — no shared
mutable state with other modules.

**Reads globals:** `caciDB` (caci-data.js), `esc` (app-shared.js).

**DOM additions** (in caci-compare.html):
- `#caciSearchToggleBtn` — "Browse / Search CACI" button, right-aligned in the tab bar
- `#caciSearchPanel` — floating dropdown panel, positioned absolutely below the tab nav
- `#caciModeSearch`, `#caciModeBrowse` — mode toggle buttons
- `#caciSearchBody`, `#caciSearchInput`, `#caciSearchResults` — search mode UI
- `#caciBrowseBody`, `#caciBrowseList` — browse mode UI

| Function | Description |
|----------|-------------|
| `buildCaciIndex()` | Scans caciDB keys (skips `_*` keys), extracts `{num, title}` from first line of each entry, sorts numerically. Called once at DOMContentLoaded. |
| `pickResult(num)` | Populates the active tab's CACI input and closes the panel. Compare tab: `#caciNumber`. Draft tab: `#draftCaciNum` (+ `#packetCaciNum` if empty). No-op on VF/Pleading tabs. |
| `openPanel()` / `closePanel()` | Show/hide the panel. Open resets search input and focuses it. |
| `renderSearchResults(query)` | Case-insensitive match against num and title. Up to 20 results. Debounced 250 ms via `searchTimer`. |
| `renderBrowseList()` | Groups index by century (floor to nearest 100). Series header label: first 3 words of the first instruction's title. Rendered once at init; expand/collapse toggled in-place. |
| `switchMode(mode)` | Toggles `.active` on mode buttons; toggles `.hidden` on body divs. |
| DOMContentLoaded listener | Builds index, renders both lists, wires all event handlers. |

**Panel behavior:**
- Hidden by default; opened by the toggle button
- Hidden entirely (panel closes + button refuses to open) on VF and Pleading tabs
- Closes on click outside (document click listener, checks `panel.contains(target)`)
- Mode (search/browse) remembered within the session (`browseMode` variable)
- Browse expand state remembered within the session (`browseOpenCenturies` object)

---

## draft-parser.js  (341 lines)

**Purpose:** Parses a raw CACI instruction string into a structured state
object that the draft form renderer (in app-draft.js) consumes.

**Exposes:** `parseInstruction(rawText)`, `findTopLevelBrackets(text)`
(both exported via `module.exports` guard for Node test scripts)

**parsedState shape:**
```javascript
{
  rawText: string,           // original input text
  segments: [                // ordered array — text nodes and field refs
    { type: 'text', text: string },
    { type: 'field', key: string }
  ],
  fields: Map(key → field)   // all bracket fields, de-duplicated
}
```

**Field types (values in the fields Map):**
```javascript
// text — free-form fill-in
{ type: 'text', key, label, value: '' }

// dropdown — pick from options (e.g. plaintiff/defendant)
{ type: 'dropdown', key, label, options: [string], selected: -1,
  custom: false, customValue: '' }

// optional — checkbox to include/exclude a bracketed phrase
// NOTE: checked defaults to TRUE (optional elements included by default)
{ type: 'optional', key, label, checked: true, fullContent: string }

// alternative — numbered element with alt text choice (a/b)
{ type: 'alternative', key, elemNum, altText, selected: 'a',
  pairedOptionalKey: string|null }

// connector — short word (and/or/he/she) toggled by checkbox
{ type: 'connector', key, label, checked: false }

// skip — numeric refs, roman numerals, colon-terminated labels, etc.
// not rendered as a form field

// note — [add...] / [include...] instructions — displayed as note, not input
{ type: 'note', key, label, value: '' }
```

**Key internal functions (not exported):**
- `classifyBracket(content)` — determines field type from bracket content
- `makeDraftKey(content)` — generates stable Map key from bracket text
- `splitOnSlashDepth0(s)` — splits "a / b / c" only at top nesting level
- `stripInstructionWord(s)` — removes leading "name of", "specify", etc.

**Debug mode:** add `?debug` to the URL to enable console diagnostic logging
from `parseInstruction` (logs bracket classifications and field map).

---

## caci-data.js  (DO NOT LOAD IN SESSIONS)

**Purpose:** Static reference data. All ~900 CACI instructions.

**Exposes:** `window.caciDB` — plain object keyed by instruction number string.
Values are **strings** (raw extracted text), not objects.

**Shape:**
```javascript
caciDB = {
  "302": "302. Contract Formation\n\nTo recover...",   // plain string
  "302_directions": "Directions for Use\n...",          // _directions suffix where present
  // ~900+ entries
}
```

**Consumed by:** `lookupCACITextForDraft(caciNum)` in app-shared.js only.

**Never modify directly.** Re-generate from source PDF using `parse-caci.js`
then wrap output as `const caciDB = { ... };` → save as `caci-data.js`.

---

## docx-export.js  (401 lines)

**Purpose:** Shared DOCX export utility. Wraps docx v9 (loaded as `window.docx`
by the preceding `node_modules/docx/dist/index.iife.js` script tag).

**Exposes:** `exportDOCX(content, filename)`

**content shape:**
```javascript
// Instruction:
{ type: 'instruction', heading: 'CACI 302: Contract Formation', body: '...' }

// Verdict form:
{ type: 'verdict_form', caption: {...}, formTitle: '...', questions: [...], include_signature: true }
```

**Called by:** app-draft.js (single instruction DOCX export) and vf-app.js (VF DOCX export).

---

## vf-app.js  (1645 lines)

**Purpose:** Verdict Form Builder — all VF tab logic.
Isolated from app-draft.js/app-cases.js (no shared mutable state except via the two bridge functions below).

**Palette:** Categories render collapsed by default (click to expand).
Category labels are title-cased from `group.category` (e.g., `medical_negligence` → "Medical Negligence").

**Exposes to app-cases.js (case persistence bridge):**
- `getVFSerializedState()` — returns `{ forms: workingForm[], activeFormId: string }`. Called by `caseSave()`.
- `setVFState(data)` — accepts new `{forms, activeFormId}` object **or** legacy plain array; restores `activeVfFormId` if the saved ID is still valid. Always ensures at least one blank form. Called by `caseLoad()` and `clearAllWorkspace()`.

**VF routing sentinel system (A1):**
When a question is imported from a palette group, outbound routes to sibling questions in the same group are stored as deferred sentinels `"__src__:{groupId}:{sourceId}"` (e.g. `"__src__:VF-400:q2"`). `normalizeRoutes(form)` resolves all sentinels in a form to live UIDs by scanning `form.questions`; it is called after every mutation (add, delete, reorder, setVFState). Unresolvable sentinels show as `[PENDING]` in the builder and `[ROUTE BROKEN]` in all output paths. UIDs deleted after routing is set show as `[BROKEN]`/`[ROUTE BROKEN]`.

**`caseSelect` change listener (inside `vfInit` IIFE):**
Reads `cases[name].caption` from localStorage when a case is selected and pre-fills
the active working form's caption fields if they are currently empty (same one-way,
only-if-empty pattern as pleading-ui.js). Mapping: `court_name → court`,
`dept_number → dept`, `case_number → caseNumber`,
`plaintiff_name + " v. " + defendant_name → caseName` (handles both/one/neither).
Calls `renderCaptionFields()` after updating. Does not create or overwrite forms.

**`select_one` question type:**
General verdict forms use `select_one` questions with an `options` array.
Preview renders each option with a `______` blank-line prefix. Form title
auto-switches to "GENERAL VERDICT FORM" when any question is `select_one`.
Inline editor supports add/remove/edit of options. Supported across all
output paths: preview, plain text, DOCX, and pleading DOCX.

**VF Export — "Pleading DOCX" format (in exportVfPicker click handler):**
Loads the saved attorney profile from localStorage (strips `pl_` prefix from keys),
overlays the current case caption (only-if-missing), sets `document_title` from
the form name, sets `body_text` from `renderVFPlainText()` with the caption
preamble stripped (starts after "SPECIAL VERDICT FORM\n" or "GENERAL VERDICT FORM\n"),
then calls `generatePleadingShell({ fields, plainPaper })`. Respects `#vfPleadingCheck`
(independent from Pleading tab checkbox).

**Architecture:** Three-column layout
- Left: component palette (groups of question blocks from vfDB)
- Middle: form builder (working form, drag-to-reorder questions)
- Right: live preview (auto-numbered, party substitution, routing instructions)

**Key internal state:**
```javascript
let vfForms        = [];    // all working forms for the session
let activeVfFormId = null;  // id of currently displayed form
let vfUidCounter   = 0;     // monotonic uid counter
let vfFormIdCtr    = 0;     // form id counter
```

---

## vf-data.js  (DO NOT LOAD IN SESSIONS)

**Purpose:** Static VF reference data. Component palette source.
Auto-generated by `parse-vf.js` from `vf-corpus-target.txt`.

**Exposes:** `window.vfDB`

**Current contents:** 64 verdict forms across 11 categories:
contract (5), negligence (12), medical_negligence (3), motor_vehicle (5),
premises_liability (4), dangerous_condition (2), products_liability (8),
insurance (4), employment (9), damages (10), general_verdict (2).

**Re-generating:** Run `node parse-vf.js` to re-parse the corpus. Output goes to
`vf-data-generated.js` + `vf-parse-report.txt`. Copy generated file to `vf-data.js`
after reviewing the report.

**Shape:**
```javascript
vfDB = {
  groups: [
    {
      id: "VF-400",
      title: "Negligence—Essential Factual Elements",
      category: "negligence",
      signature_block: true,
      questions: [
        {
          id: "q1",          // stable internal ID, never shown on form
          type: "yes_no",    // yes_no | damages | percentage | write_in | select_one
          text: "Was [name of defendant] negligent?",
          fields: ["name of defendant"],
          if_yes: "q2",      // routing: internal ID | "sign" | "stop"
          if_no: "stop",
          stop_text: "...",  // required when routing = "stop"
          options: [...]     // select_one only: array of option strings
        }
      ]
    }
  ]
}
```

**Key schema rule:** Internal IDs (q1, q2...) are stable source identifiers.
Display numbers (1., 2., 3. on printed form) are computed at render time
from array order. Never store display numbers — always compute them.

---

## parse-vf.js  (841 lines)

**Purpose:** Automated parser for the CACI verdict form corpus.
Reads `vf-corpus-target.txt` and generates `vf-data-generated.js` + `vf-parse-report.txt`.

**Usage:** `node parse-vf.js [corpus-file]` (defaults to `vf-corpus-target.txt`)

**What it does:**
- Splits corpus by `===== VF-XXX =====` delimiters
- Extracts title, category, questions for each form
- Detects question types: `yes_no`, `yes_no_multi`, `damages`, `percentage`
- Extracts `[ name of ... ]` fields, routing instructions, damage line items, percentage parties
- Handles optional brackets, [or] alternatives, multi-party questions, inline `$` amounts
- Generates validation report with warnings + round-trip renderings for diff checking

**Manual overrides:** `MANUAL_OVERRIDES` object contains hand-crafted entries for
forms that don't fit the numbered-question parser pattern. These bypass the parser entirely:
- VF-3920: unique `[e.g., ...]` + `[Enter the amount...]` bracket structure per damage line
- VF-5000, VF-5001: general verdict forms with `select_one` options

**Validation report categories:**
- "Complex routing" — skip patterns, [or] alternatives, multi-target routing (flagged, usually parsed correctly)
- "No routing instruction found" — terminal questions (auto-defaulted to sign)
- "[or] alternative formulations" — informational flag only

---

## pleading-shell.js  (812 lines)

**Purpose:** Generates California pleading paper DOCX shells — blank shells,
discovery requests, and discovery responses with auto-numbered request/response pairs.

**Dual-context:** Works as Node.js CLI (`node pleading-shell.js`)
AND as browser module (`window.generatePleadingShell(options)`).

**Exposes:** `generatePleadingShell(options)` → `Promise<Buffer|Blob>`

**options shape:**
```javascript
{
  fields: {
    // Attorney block (Section A — persisted)
    attorney_1_name, attorney_1_bar,          // required
    attorney_2_name, attorney_2_bar,          // optional — omit line if name blank
    attorney_3_name, attorney_3_bar,          // optional — omit line if name blank
    firm_name, firm_address_1, firm_address_2,
    firm_phone, firm_fax,                     // fax optional — omit portion if blank
    attorney_role,    // optional — from Section B; omit "Attorneys for" line if blank
    client_name,      // optional — from Section B; all caps; omit line if blank

    // Court (defaults provided)
    court_name,       // default: "IN THE SUPERIOR COURT..."
    court_county,     // default: "COUNTY OF LOS ANGELES"

    // Caption — left cell
    plaintiff_name, plaintiff_desc,
    defendant_name, defendant_desc,
    additional_parties,   // optional, omit line if empty

    // Caption — right cell
    case_number, judge_name, dept_number,
    document_title,       // bold in output
    hearing_date, hearing_time, hearing_dept,   // omit if empty
    complaint_filed, trial_date,                // omit if empty
    body_text,            // optional — replaces blank body paragraphs; split on \n per line
  },
  plainPaper: true,   // optional — plain paper mode (browser-safe)
  discovery: {        // optional — discovery shell mode
    direction,        // 'request' or 'response'
    type,             // 'rfa' | 'srog' | 'rfp'
    propoundingName, propoundingRole,
    respondingName, respondingRole,
    setNumber,        // e.g. 'ONE'
    count,            // number of request/response pairs
    includeRequests,  // response mode only: include REQUEST lines (default true)
  },
}
```

**Discovery mode (`options.discovery`):**
- **Request mode** (`direction: 'request'`): Party ID block + centered/bold/underlined
  section heading + auto-numbered request lines only. No boilerplate.
- **Response mode** (`direction: 'response'`): Party ID + "TO ALL PARTIES" +
  "COMES NOW" + preliminary statement boilerplate + centered/bold/underlined
  section heading + auto-numbered request/response pairs.
  `includeRequests: true` (default) interleaves REQUEST lines for pasting
  propounding party text; `false` generates RESPONSE lines only.
- Word auto-numbering via `disc-request` and `disc-response` numbering sequences;
  deleting a request/response pair causes remaining items to renumber.
- `DISC_TYPES` constant maps type to numbering label text and section headings.

**Page layout:** California pleading paper standard
- 8.5" × 11", Times New Roman 12pt body, 12pt caption
- Left margin: 1.0", right: 0.5", top: 0.75", bottom: 0.8125"
- Line numbers 1–28 with double vertical bar (injected from template XML via ZIP patch)
- Footer: horizontal rule + page number + document title

**Browser integration:** Loaded as `<script src="pleading-shell.js">` (14th script).
Exposes `window.generatePleadingShell(options)`. Called by `pleading-ui.js`.

**`plainPaper` option:**
- `options.plainPaper === true` → plain paper margins (top 1", right 1", bottom 1", left 1.25"),
  header injection skipped (no line numbers, no bar). **Browser-safe.**
  Browser path uses `Packer.toBlob(doc)` and returns early — no Buffer, no ZIP patching.
- `options.plainPaper` false/absent → pleading paper format. **Works in both Node and browser.**
  `injectPleadingHeader` patches the DOCX ZIP using `DataView`/`Uint8Array` — no `Buffer` required.

**Pleading paper checkboxes — three independent controls (all default checked):**
- `#pleadingPaperCheck` — Pleading tab, controls `generateShell()` in pleading-ui.js
- `#packetPleadingCheck` — Packet tray, controls packet Pleading DOCX in app-packet.js
- `#vfPleadingCheck` — VF preview header, controls VF Pleading DOCX in vf-app.js

All three ship **checked** by default. Checking = pleading paper format (line numbers + bar).
Browser pleading-paper path uses `DataView`/`Uint8Array` for ZIP patching — no `Buffer` polyfill needed.
Unchecked = plain paper (browser-safe, early-return path).

---

## pleading-ui.js  (385 lines)

**Purpose:** Pleading Shell tab UI controller. Self-contained — no shared mutable state
with other app files. Does not read `draftState`, `packetInstructions`, or `vfForms`.

| Function | Description |
|----------|-------------|
| `loadProfilesIndex()` | Reads `PLEADING_PROFILES_KEY` from localStorage; migrates legacy single-profile to "Default" on first load |
| `saveProfilesIndex(profiles)` | Writes entire profiles object to localStorage |
| `populateProfileSelect(profiles,selectedName)` | Rebuilds `#profileSelect` dropdown |
| `applyProfileFields(profile)` | Writes profile values to Section A inputs; clears inputs with no matching key |
| `readProfileFields()` | Reads Section A inputs into a profile object |
| `saveProfile()` | Saves current fields under profile name (`#profileNameInput` if filled, else dropdown selection); always writes legacy key too |
| `deleteProfile()` | Removes selected profile; refuses if only 1 profile; loads next available |
| `getPleadingMode()` | Returns current mode: `'blank'`, `'request'`, or `'response'` |
| `isDiscoveryMode()` | Returns true if mode is `'request'` or `'response'` |
| `updateDiscoveryTitle()` | Auto-generates document title from discovery fields; uppercases party roles |
| `readDiscoveryFields()` | Reads discovery panel inputs into `options.discovery` object |
| `generateShell()` | Reads all live inputs, builds options (incl. discovery if applicable), calls `generatePleadingShell()`, downloads DOCX |
| DOMContentLoaded listener | Loads profiles index, populates dropdown, wires all buttons, discovery mode toggle, discovery field change listeners, `caseSelect` listener |
| `caseSelect` change listener | Pre-fills Section B inputs that are currently empty from case caption. Fires after app-cases.js. No write-back. |

**Constants:**
- `PLEADING_PROFILES_KEY = 'pleading_attorney_profiles'` — named profiles store
- `PLEADING_PROFILE_KEY = 'pleading_attorney_profile'` — legacy compat (mirrors active profile; read by export handlers in app-packet.js and vf-app.js)
- `PROFILE_FIELD_IDS` — Section A input IDs (persisted): attorney 1/2/3 names+bars, firm fields
- `DOC_FIELD_IDS` — Section B required input IDs (not persisted): court, parties, case info, document title
- `OPTIONAL_FIELD_IDS` — omitted from options when blank: attorney_role, client_name, hearing fields, dates
- `FIELD_MAP` — maps HTML input IDs to `generatePleadingShell options.fields` keys

### localStorage Schema (pleading tab):
```javascript
// Key: 'pleading_attorney_profiles'  — named profile store
{ "Default": { "pl_attorney_1_name": "...", "pl_firm_name": "...", ... },
  "Work":    { "pl_attorney_1_name": "...", ... } }

// Key: 'pleading_attorney_profile'  — always mirrors active profile (legacy compat)
{ "pl_attorney_1_name": "...", "pl_attorney_1_bar": "...",
  "pl_attorney_2_name": "...", "pl_attorney_2_bar": "...",   // optional
  "pl_attorney_3_name": "...", "pl_attorney_3_bar": "...",   // optional
  "pl_firm_name": "...", "pl_firm_address_1": "...", "pl_firm_address_2": "...",
  "pl_firm_phone": "...", "pl_firm_fax": "..." }
```

---

## KNOWN LIMITATIONS (BY DESIGN)


- Alternative elements may drop their element number in output — attorney fixes in Lock & Edit
- Element numbers do not auto-renumber when optional elements toggled — attorney fixes in Lock & Edit
- caci-data.js requires manual refresh when Judicial Council updates CACI (re-run parse-caci.js)
- vf-data.js is auto-generated by parse-vf.js from vf-corpus-target.txt; re-run parser to update
- VF-3920, VF-5000, VF-5001 use `MANUAL_OVERRIDES` in parse-vf.js — parser cannot auto-parse these unique formats
- VF-5001 ships with 2 claim blocks; attorney adds more claims via custom questions or Lock & Edit
- Discovery response auto-numbering uses two independent Word numbering sequences (request + response); deleting a request without its paired response will desync the numbering
- CACI 803: sequential bracket alternatives (`[A railroad company]` / `[A train operator]`) appear as separate brackets rather than a single choice set — classifier cannot detect adjacent mutually exclusive brackets

## KNOWN BUGS (PENDING FIX)

**CACI:**
- CACI 115: multi-paragraph `[ Describe each class, e.g., ... ]` block classified as text input instead of note — bracket structure is correct but `classifyBracket` in draft-parser.js triggers `'text'` on the `Describe` verb; needs special-case or length heuristic

**VF — empty question text (parser failed to extract):**
- VF-402 q8: question text is empty (complex multi-party form with non-standard routing)
- VF-1200 q9: question text is empty (percentage allocation question with unusual structure)

**VF — missing or incomplete routing (44 warnings total in parse report):**
- 3 yes_no questions with no routing: VF-402 q8, VF-1200 q6, VF-1201 q5
- 6 terminal questions defaulted to sign (correct in most cases)
- 20 complex routing patterns (skip questions, multi-target, [either option]) — parsed approximately but may not match CACI precisely
- 10 `[or]` alternative formulations — flagged for review, mostly handled by alt_text feature

> See CHANGELOG.md for full fix history. See vf-parse-report.txt for complete warning details.

---

## SESSION STARTER TEMPLATE

Copy-paste to begin any new session:

```
[Paste this CODEBASE-MAP.md]

I am working on [specific file: app-draft.js / app-compare.js / etc].
The issue is: [describe problem].
[Paste only the relevant file(s) — see token table above]
```

For bug fixes: paste the specific function (~20-50 lines), not the whole file.
For new features: paste the section it will live in + any functions it calls.
Claude Code (terminal): no need to paste files — just reference by name and
it will read them directly from the filesystem.
