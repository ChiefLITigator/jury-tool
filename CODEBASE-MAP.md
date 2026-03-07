# CODEBASE MAP
## California Civil Litigation Tool Suite
## Last updated: 2026-03-07

Use this file to orient any LLM at the start of a session.
Paste this file + only the specific source file(s) being touched.
Never paste caci-data.js or vf-data.js into a session unless debugging data.

---

## FILE INVENTORY

| File | Lines | ~Tokens | Status | Load for session? |
|------|-------|---------|--------|-------------------|
| caci-compare.html | 638 | ~8,300 | Active | Only if touching HTML/CSS/tabs |
| app-shared.js | 155 | ~1,700 | Active | Yes — shared utilities, CACI lookup, print |
| app-compare.js | 465 | ~5,200 | Active | Yes — diff engine, compare tab |
| app-draft.js | 553 | ~6,100 | Active | Yes — instruction drafter |
| app-packet.js | 161 | ~1,800 | Active | Yes — packet tray |
| app-cases.js | 180 | ~2,000 | Active | Yes — localStorage case system |
| draft-parser.js | 341 | ~3,700 | Stable | Only if touching parse logic |
| vf-app.js | 980 | ~10,500 | Active | When touching VF tab |
| docx-export.js | 291 | ~2,800 | Stable | When touching DOCX export |
| pleading-shell.js | 600 | ~5,500 | Stable | When touching pleading shell |
| vf-data.js | 42 | ~400 | Stable | NEVER — data file |
| caci-data.js | large | ~150k+ | Stable | NEVER — too large |
| parse-caci.js | 208 | ~1,900 | Utility | Only if re-parsing CACI PDF |
| verify-caci.js | 114 | ~1,100 | Utility | Only if verifying data |
| test-caci.js | 111 | ~1,100 | Utility | Only if running tests |

**Rule:** Total context per session should stay under ~40,000 tokens.
Logic files only. Data files never.

---

## ARCHITECTURE OVERVIEW

```
caci-compare.html              — single-page app shell, all tabs live here
  ├── caci-data.js             — 1st: exposes window.caciDB (read-only)
  ├── draft-parser.js          — 2nd: exposes parseInstruction(), findTopLevelBrackets()
  ├── app-shared.js            — 3rd: esc, lookupCACIText*, downloadTXT, doPrint, print settings
  ├── app-compare.js           — 4th: diff engine, compare tab logic
  ├── app-draft.js             — 5th: instruction drafter
  ├── app-packet.js            — 6th: packet tray
  ├── app-cases.js             — 7th: localStorage case system
  ├── node_modules/docx/...    — 8th: window.docx (UMD bundle, docx v9)
  ├── pdfmake.min.js           — 9th: window.pdfMake (CDN, v0.2.7)
  ├── vfs_fonts.min.js         — 10th: registers bundled fonts for pdfmake (CDN)
  ├── docx-export.js           — 11th: exposes exportDOCX()
  ├── vf-data.js               — 12th: exposes window.vfDB
  └── vf-app.js                — 13th: all VF builder logic

Standalone utilities (Node.js CLI + browser module, no HTML):
  └── pleading-shell.js        — generates blank CA pleading paper DOCX shells
```

**No build step. No bundler. No framework. All vanilla JS.**
Served locally via VS Code Live Server. Opened in browser as file or localhost.

---

## caci-compare.html

**Purpose:** App shell. Contains all HTML structure, CSS, and `<script>` tags.
No inline JavaScript (all logic is in .js files).

**Tabs:**
- `data-tab="compare"` — diff viewer (`#tab-compare`)
- `data-tab="draft"` — instruction drafter (`#tab-draft`)
- `data-tab="vf"` — verdict form builder (`#tab-vf`)

**Case bar** (`#caseBar`): shown on draft tab and VF tab. Hidden on compare tab.

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
<script src="app-compare.js"></script>
<script src="app-draft.js"></script>
<script src="app-packet.js"></script>
<script src="app-cases.js"></script>
<script src="node_modules/docx/dist/index.iife.js"></script>
<script src="docx-export.js"></script>
<script src="vf-data.js"></script>
<script src="vf-app.js"></script>
```

---

## app-shared.js  (155 lines)

**Purpose:** Shared utilities used across multiple app files.
Reads from caciDB (set by caci-data.js). No module system — all globals.

| Function / Const | Description |
|-----------------|-------------|
| `const esc` | HTML-escape helper — used by compare, draft, and packet renderers |
| `lookupCACITextForDraft(num)` | PDF cleanup only, bracket structure preserved → use for draft/parse pipeline |
| `lookupCACIText(num)` | Same + `flattenForCompare()` → use for compare tab only |
| `downloadTXT(text, filename)` | Creates blob and triggers download |
| `setPrintHeader(text)` | Sets `#print-header` text content |
| `doPrint(cls)` | Adds print class, calls `window.print()`, cleans up on afterprint |
| `const PS_FONTS` | Font family map for print settings |
| `updatePrintSettings()` | Injects `@media print` / `@page` style tag from form values |
| Print settings event listeners | `print-settings-toggle`, `ps-*` change listeners, initial call |
| `exportPDF(sections, filename)` | pdfmake silent Blob download; `sections: [{heading, body}]`, body split on `\n\n` per paragraph |

### Two lookup functions — know which to use:
- `lookupCACITextForDraft(num)` — bracket structure preserved → use for draft/parse pipeline
- `lookupCACIText(num)` — same + `flattenForCompare()` → use for compare tab only

---

## app-compare.js  (465 lines)

**Purpose:** Diff engine and all compare tab logic.

| Lines | Section | Key Functions |
|-------|---------|---------------|
| 1–67 | TOKENIZER | `tokenize()`, `stripInstructionHeading()`, `flattenForCompare()` |
| 68–124 | LCS DIFF | `computeDiff(a,b)`, `computeChunkedDiff(a,b,sz)` |
| 125–191 | THREE-WAY DIFF | `threeWayDiff(tA, tCaci, tB)` |
| 192–203 | COUNTING | `counts(ops)` |
| 204–256 | HTML RENDERING | `renderFull()`, `renderLeft()`, `renderRight()`, `colHtml()` |
| 257–277 | SCROLL SYNC | `attachScrollSync()` |
| 278–365 | MAIN COMPARE | `runCompare()` — orchestrates 2-way and 3-way diff |
| 366–end | EVENT LISTENERS | loadCaci, resetCaci, compareBtn, tab navigation, print/export compare |

---

## app-draft.js  (553 lines)

**Purpose:** Instruction drafter — all draft form and preview logic.

### Global State:
```javascript
let draftState = null;   // current parsed instruction (or null)
```

| Lines | Section | Key Functions |
|-------|---------|---------------|
| 1–13 | STATE | `let draftState = null` |
| 14–68 | COMPILER | `resolveDropdown()`, `substituteInner()`, `compileInstruction(state)` |
| 69–163 | UNFILLED TRACKING | `getUnfilledFields()`, `applyUnfilledHighlights()` |
| 164–303 | FORM RENDERER | `renderDraftForm(state)`, `onDraftChange(e)` |
| 304–352 | CUSTOM DROPDOWN | `activateDraftCustom()`, `restoreDraftDropdown()` |
| 353–418 | PREVIEW | `updateDraftPreview()` |
| 419–end | EVENT LISTENERS + HELPERS | loadDraftBtn, draftCaciNum, addToPacketBtn, lockEditBtn, copyDraftBtn, print/export draft, `getDraftText()`, `getDraftHeading()`, `getDraftBodyText()` |

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

## app-packet.js  (161 lines)

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

---

## app-cases.js  (180 lines)

**Purpose:** localStorage case persistence system.

### Global State:
```javascript
const CASE_KEY = 'caci_cases';   // localStorage key
```

| Function | Description |
|----------|-------------|
| `loadCaseIndex()` | Reads and parses the case index from localStorage |
| `saveCaseIndex(obj)` | Writes the case index to localStorage |
| `populateCaseSelect()` | Populates `#caseSelect` with sorted case names |
| `setCaseBarStatus(msg, cls)` | Sets status message in case bar |
| `serializeParsedState(ps)` | Converts fields Map → array for JSON storage |
| `applyFieldValues(fresh, saved)` | Restores field values onto a freshly-parsed state |
| `caseSave()` | Saves current packet + VF state under a case name |
| `caseLoad(name)` | Restores packet instructions and VF state from localStorage |
| `caseDelete()` | Deletes a case from localStorage |
| `caseExport()` | Downloads case as JSON file (includes verdictForms) |
| `caseImport(file)` | Reads a JSON file and restores packet + VF state |
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
          fields: [  // serialized Map as array of [key, fieldObj] pairs
            ["key_string", { type, key, label, value/checked/selected, ... }]
          ]
        }
      }
    ],
    verdictForms: [ ...vf state objects... ]  // saved by caseSave(), restored by caseLoad()
  }
}
```

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

## docx-export.js  (291 lines)

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

## vf-app.js  (~980 lines)

**Purpose:** Verdict Form Builder — all VF tab logic.
Isolated from app-draft.js/app-cases.js (no shared mutable state except via the two bridge functions below).

**Exposes to app-cases.js (case persistence bridge):**
- `getVFSerializedState()` — called by `caseSave()` in app-cases.js
- `setVFState(data)` — called by `caseLoad()` in app-cases.js

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

**Exposes:** `window.vfDB`

**Current contents:** VF-400 (Negligence — Essential Factual Elements) only.
Additional groups added manually as cases require them.

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
          type: "yes_no",    // yes_no | damages | percentage | write_in
          text: "Was [name of defendant] negligent?",
          fields: ["name of defendant"],
          if_yes: "q2",      // routing: internal ID | "sign" | "stop"
          if_no: "stop",
          stop_text: "..."   // required when routing = "stop"
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

## pleading-shell.js  (~600 lines)

**Purpose:** Generates blank California pleading paper DOCX shells
with bracketed placeholders for all caption fields.

**Dual-context:** Works as Node.js CLI (`node pleading-shell.js`)
AND as browser module (`window.generatePleadingShell(options)`).

**Exposes:** `generatePleadingShell(options)` → `Promise<Buffer|Blob>`

**options shape:**
```javascript
{
  // Attorney block
  attorney_name, state_bar_number, firm_name,
  firm_address_1, firm_address_2,
  firm_phone, firm_fax, firm_email,
  attorney_role,    // "Plaintiff" | "Defendant"
  client_name,      // displayed under "Attorneys for X"

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
  complaint_filed, trial_date                 // omit if empty
}
```

**Page layout:** California pleading paper standard
- 8.5" × 11", Times New Roman 12pt body, 10pt caption
- Left margin: 1.0", right: 0.5", top: 0.75", bottom: 0.438"
- Line numbers 1–28 with double vertical bar (injected from template XML via ZIP patch)
- Footer: horizontal rule + page number + document title

**NOT yet integrated into caci-compare.html** — standalone Node utility only.
Integration point (future): button in case bar calling `generatePleadingShell()`
with fields from the current case object.

---

## KNOWN LIMITATIONS (BY DESIGN)

- Alternative elements may drop their element number in output — attorney fixes in Lock & Edit
- Element numbers do not auto-renumber when optional elements toggled — attorney fixes in Lock & Edit
- caci-data.js requires manual refresh when Judicial Council updates CACI (re-run parse-caci.js)
- vf-data.js contains only VF-400 (Negligence); additional verdict form groups added manually

## KNOWN BUGS (PENDING FIX)

*No known open bugs as of 2026-03-05.*

**Previously fixed:**
- ~~caseExport drops verdict form state~~ — FIXED. Both `caseExport()` and `caseImport()`
  now correctly include `verdictForms` via `getVFSerializedState()` / `setVFState()`.

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
