# CACI Tool — Session Notes

## Session: 2026-02-25

### Output Quality Fixes (caci-compare.html)

**Fix 1 — Join mid-sentence line breaks in lookupCACIText**
- Added step (before the existing `\n{3,}` collapse) that joins single newlines
  where the preceding line does not end a sentence boundary (`.!?:;\]`) and the
  following line starts with a lowercase letter or `[`.
- Regex: `text.replace(/([^.!?:;\]\n])\n([a-z\[])/g, '$1 $2')`
- Reason: PDF extraction breaks long lines mid-sentence at column boundaries;
  these show up as spurious hard line breaks inside otherwise continuous paragraphs.

**Fix 2 — Print CSS: hide form panel reliably**
- Added `id="packetTray"` to the packet tray div.
- Added class `draft-form-panel` to the inner `.card` div in the live-preview column.
- Replaced the fragile `#draftWorkspace .row > *:first-child` print rule with two
  targeted rules:
  - `body.printing-draft #packetTray { display: none }` — hides the tray by ID.
  - `body.printing-draft .draft-form-panel > *:not(#draftPreview):not(#draftEditArea) { display: none }` — hides toolbar, lock warning, and buttons while keeping only the preview or locked textarea visible.

**Fix 3 — Prepend instruction heading to compiled preview**
- `updateDraftPreview()` now builds a heading string `CACI [num]: [title]` by
  reading `draftCaciNum` and extracting the title from `draftState.rawText` via
  `/^\d{3,4}\s*\.\s*(.+)/`.
- The preview div is split into two sub-divs: `.draft-preview-heading` (bold,
  sans-serif, margin-bottom) and `.draft-preview-body` (body text). Each sub-div
  is populated with `textContent` (XSS-safe). The heading div is hidden if no
  number/title can be extracted.
- `getDraftText()` reads `draftPreview.innerText` which spans both sub-divs, so
  copy, export, print, and lock-to-edit all automatically include the heading.

**Follow-up corrections (same session)**

- Fix A: `compileInstruction` now strips the leading `NNN. Title` line from `out`
  before the cleanup chain, so the body text no longer duplicates the heading.
- Fix B: `titleMatch` regex changed to non-greedy `(.+?)(?:\n|$)` to prevent
  body text concatenated onto the first line during PDF extraction from leaking
  into the heading string.
- Fix C: Mid-sentence join regex: removed `\]` from the exclusion character class
  so lines ending with `]` (e.g., `[name of defendant]`) are joined to their
  continuation. Added a second pass `(\])\n([a-z])` → `$1 $2` for the same case.

**Further corrections (same session — round 2)**

- Fix 1/heading regex: `titleMatch` regex changed to `/^\d{3,4}\s*\.\s*([^\[\n]+)/` —
  stops at the first `[` or newline, whichever comes first, so body text starting
  with a bracket never bleeds into the heading string.
- Fix 2/heading style: `updateDraftPreview` rewritten to build sub-elements with
  `createElement`/`appendChild` (no more `innerHTML` reuse). Heading is centered,
  bold, underlined (`.draft-preview-heading`); body is left-aligned, 2em indent,
  pre-wrap (`.draft-preview-body`). `getDraftText()` updated to read the two
  sub-elements explicitly rather than `innerText` on the container.
- Fix 3/classifyBracket: keyword list expanded to include `briefly`, `brief `,
  `state the`, `denial of`, `summary of`; added safety rule for brackets ≤ 60
  chars with no clause-leading word (`and/or/that/if/when/whether/by/because/
  provided`) → always `text`, placed immediately before the `c.length > 25`
  optional check.

**Round 3 corrections (same session)**

- Fix 1/list re-split: Added step in `lookupCACIText` (before the mid-sentence join
  regexes) that inserts a newline before any mid-line list item number followed by
  a sentence-starting word (`That|The|A|An|Each|Whether|If|All|To|In|Any`). Fixes
  instructions (e.g. CACI 303) where tight PDF vertical spacing caused multiple
  numbered elements to merge onto one line.
- Fix 2/paragraph indent: `.draft-preview-body` no longer uses `pre-wrap` or
  `padding-left`. Body is now rendered as `<p class="draft-para">` elements
  (split on `\n\n+`), each with `text-indent: 2em` and `margin-bottom: 0.75em`,
  matching standard jury instruction formatting. `getDraftText()` updated to
  reconstruct plain text by joining `.draft-para` text content with `\n\n`.

### Changes to draft-parser.js

**Fix 1 — Pass 1 exclusion regex (inner loop)**
- Changed `!/^\d+\.\s*\[or\]/i` → `!/^\d+\.\s*\[\s*or\s*\]/i` in the Pass 1 inner
  `for (let pj …)` loop that builds `altContentMap`.
- Reason: The exclusion guard was meant to prevent a signal bracket (e.g., `[2. [or]]`)
  from matching itself as its own content bracket. If the inner `[or]` has spaces
  (`[ or ]`), the old regex failed to exclude it, causing a self-referential map entry.

**Fix 2 — Fallback altText strip regex**
- Changed `replace(/^\d+\.\s*\[or\]\s*/i, '')` → `replace(/^\d+\.\s*\[\s*or\s*\]\s*/i, '')`
  in the `else` branch of the `altContentMap.has(i)` check inside the `alternative` block.
- Reason: When no forward-pointer exists and the fallback strip is used, the `[or]` token
  in the raw bracket content may have internal spaces (`[ or ]`). The old regex left that
  token in place, polluting the displayed alt text.

Both fixes align these two regexes with the already-correct patterns used in
`classifyBracket` and the Pass 1 signal-detection line.

### Pass 1 — Packet Tray (in-memory)

Added a Packet Tray to the Draft tab in `caci-compare.html`. No existing logic
was touched — only new HTML, CSS, and JS were added.

**Layout**
- `#tab-draft` now uses a `.draft-tab-body` flex wrapper.
- Left column: `.packet-tray` (fixed 280px wide, right border separator).
- Right column: `.draft-main-col` (flex:1) containing the existing CACI loader
  card and `#draftWorkspace` unchanged.

**Tray behavior**
- `packetInstructions` array holds `{ id, caciNum, label, parsedState }` entries.
- "Add to Packet": calls `lookupCACIText()` + `parseInstruction()`, pushes entry,
  re-renders the list. Shows inline error if CACI number not found.
- "Load": sets `draftState = entry.parsedState` (same object reference — no extra
  sync needed), calls `renderDraftForm` + `updateDraftPreview`, highlights active row.
- "Remove": splices entry from array, clears `activePacketId` if it was active.
- Empty state shows "No instructions added yet." placeholder.

**Print rules updated**
- Replaced `#tab-draft > *:not(#draftWorkspace)` (broken by new nesting) with:
  `.packet-tray { display:none }`, `.draft-tab-body { display:block }`,
  `.draft-main-col > *:not(#draftWorkspace) { display:none }`.

**Next passes**
- Pass 2: Compile & export the full packet as a single combined draft.
- Pass 3: localStorage persistence — save/reload packet per named case.

### Changes to module.exports

- Changed `module.exports = { parseInstruction, findTopLevelBrackets }` to `if (typeof module !== 'undefined') {module.exports = { parseInstruction, findTopLevelBrackets }}`

## Session: 2026-02-24

### Changes to draft-parser.js

**Fix A — Alternative detection spaces (classifyBracket + Pass 1)**
- Changed `/^\d+\.\s*\[or\]/i` → `/^\d+\.\s*\[\s*or\s*\]/i` in two places:
  1. `classifyBracket` line 86 (main type detection)
  2. `parseInstruction` Pass 1 loop (altContentMap builder)
- Reason: CACI 303 element 4 uses `[ or ]` with spaces inside the bracket; the old
  regex failed to match it and the signal bracket fell through to `optional`.

**Fix B — Inner bracket registration for optional blocks**
- Added `findTopLevelBrackets` loop inside the `btype === 'optional'` branch of
  `parseInstruction`, mirroring the same loop already present in the `alternative` branch.
- Registers inner `text`, `dropdown`, and `connector` brackets as named form fields.
- Reason: Optional blocks containing fill-in placeholders (e.g., CACI 303 element 3:
  `That [ specify occurrence... ]`) were rendering raw bracket text in the compiled output
  instead of the user's entered value.

**Fix C — e.g.-prefixed bracket classification**
- Added rule in `classifyBracket` (after `note` check, before `dropdown`):
  `if (/^e\.g\./i.test(c)) return 'text';`
- Reason: Brackets like `[e.g., workers' compensation claim]` (> 25 chars) were falling
  through to `optional` due to length. Semantically these are always text fill-ins
  (the `e.g.` shows an example value the user should replace).
- Confirmed fix by Pass 4 diagnostic: CACI 457, 2512 and others now `text`.

### Test results after all three fixes
- 874 instructions tested
- All-text misclassifications: 0
- Bracket-but-no-field: 0
- Pass 3 ([N. [and]] patterns): 0 found in data — no handling needed
- Pass 4 (e.g. brackets): all `e.g.`-starting brackets now correctly `text`
