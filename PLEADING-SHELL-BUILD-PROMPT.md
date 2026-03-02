# Build Prompt: Pleading Shell Generator
## pleading-shell.js — Standalone + In-App Module

---

## CONTEXT

You are working on a local litigation tool suite for a California civil
attorney. This is a new, self-contained utility. It does not depend on
any existing tool files (app.js, vf-app.js, draft-parser.js) and they
do not depend on it.

The finished file must work in TWO contexts:
1. **Standalone Node.js script** — run from the terminal, prompts for
   input, writes a DOCX to disk
2. **Browser module** — exposes a global function `generatePleadingShell(options)`
   that returns a Blob, called from the browser-based litigation tool

Both contexts use the same core generation logic. A single file handles
both by detecting its environment (Node vs. browser) at runtime.

---

## WHAT THIS GENERATES

A California pleading paper DOCX with:
- Line-numbered header (1–28) with double vertical bar — from template
- Two-column case caption table
- Attorney block on first page
- Fillable content controls throughout
- Footer with rule, page number, and document title
- Blank body ready for content

---

## REFERENCE DOCUMENT

The template document is:
  `/mnt/user-data/uploads/Reply_ISO_Plaintiff_MIL_1_2-13-26.docx`

Read this file before writing any code. Use it to:
- Extract the header XML (line numbers, double bar) for injection
- Reference the exact page dimensions, margins, and font settings
- Understand the caption table structure (2 cells, left=parties, right=case info)

The extracted measurements from this document are:
  Page:         8.5" × 11" (12240 × 15840 DXA)
  Margins:      top=0.75" (1080), bottom=0.438" (630),
                left=1.00" (1440), right=0.50" (720)
  Header dist:  0.50" (720)
  Font:         Times New Roman 12pt (sz=24 in half-points)
  Line spacing: double (480, auto) for body text
  Line numbers: 28 per page in header as positioned frame

---

## FILLABLE FIELDS

Use Word **content controls** (structured document tags, SDTs) for all
fillable fields. These appear highlighted in Word, can be tabbed through,
and have placeholder text visible until filled. They are the correct modern
Word approach for fillable documents.

Each content control has:
- A `tag` (machine identifier, e.g. `"attorney_name"`)
- A `title` (human label shown in Word, e.g. `"Attorney Name"`)
- `placeholder` text shown before filling (e.g. `"[Attorney Name]"`)

**Required content controls and their locations:**

ATTORNEY BLOCK (lines 1–7, left of center, first page):
  attorney_name        "Attorney Name"         [Attorney Name]
  state_bar_number     "State Bar Number"      [SBN XXXXXX]
  firm_name            "Firm Name"             [Firm Name]
  firm_address_1       "Firm Address"          [Street Address]
  firm_address_2       "Firm City/State/Zip"   [City, State ZIP]
  firm_phone           "Phone"                 [Telephone: (XXX) XXX-XXXX]
  firm_fax             "Fax"                   [Fax: (XXX) XXX-XXXX]
  firm_email           "Email"                 [Email: attorney@firm.com]
  attorney_for         "Representing"          [Attorney for Plaintiff/Defendant NAME]

COURT NAME (centered, line 8 area):
  court_name           "Court Name"            [SUPERIOR COURT OF THE STATE OF CALIFORNIA]
  court_county         "County"                [FOR THE COUNTY OF LOS ANGELES]

CAPTION TABLE — LEFT CELL (party names):
  plaintiff_name       "Plaintiff Name"        [PLAINTIFF NAME]
  plaintiff_type       "Plaintiff Description" [an Individual,]
  defendant_name       "Defendant Name"        [DEFENDANT NAME]
  defendant_type       "Defendant Description" [a Delaware LLC,]
  additional_parties   "Additional Parties"    [and DOES 1-50, Inclusive,]

CAPTION TABLE — RIGHT CELL (case info):
  case_number          "Case Number"           [Case No.: XXXXXXXXXX]
  judge_name           "Judge"                 [Hon. Judge Name]
  dept_number          "Department"            [Dept. XX]
  document_title       "Document Title"        [DOCUMENT TITLE]
  hearing_date         "Hearing Date"          [Date: Month DD, YYYY]
  hearing_time         "Hearing Time"          [Time: X:XX x.m.]
  hearing_dept         "Hearing Dept"          [Dept.: XX]
  complaint_filed      "Complaint Filed"       [Complaint Filed: Month DD, YYYY]
  trial_date           "Trial Date"            [Trial Date: Month DD, YYYY]

FOOTER:
  footer_title         "Footer Title"          [DOCUMENT TITLE]
  (page number is auto-generated, not a content control)

---

## DOCUMENT STRUCTURE

### Page 1 layout (following CRC Rule 2.111):

**Zone 1 — Lines 1–7, left of center:** Attorney block
  Each line is a separate paragraph using the standard double-spaced
  line grid. Content controls for each field.

**Zone 2 — Lines 1–7, right of center:** Blank clerk space
  Implemented as right-column content. Leave blank — the line-number
  header creates the visual column separation.

**Zone 3 — Line 8+ (≥3⅓" from top):** Court name
  Two centered paragraphs: court name, then county/district.
  Both use content controls.

**Zone 4 — Caption table:**
  A 2-column table spanning the full text width.

  Left column (~50% width, ~4680 DXA):
    - Plaintiff name and description
    - Blank line
    - "Plaintiff," (indented)
    - Blank line
    - "v."
    - Blank line
    - Defendant name and description
    - Blank line
    - "Defendants." (right-aligned within cell)
  
  Table border: left, top, bottom, and the center dividing line only.
  No right border (open right edge is standard California caption style).
  A short horizontal line appears at the bottom of the left cell only.

  Right column (~50% width, ~4680 DXA):
    - Case number
    - Blank line
    - Judge / department assignment
    - Blank line
    - Document title (bold, uppercase)
    - Blank line
    - Hearing date, time, department (each on own line)
    - Blank line
    - Complaint filed date
    - Trial date

**Zone 5 — Body:**
  After the caption, several blank lines, then a content control for
  the document title/heading (bold, centered) and then open body area.
  Body text is double-spaced, Times New Roman 12pt.

---

## CAPTION TABLE BORDERS

The California caption box uses a specific border pattern:
- Left cell: left border (single), top border (single), bottom border (single)
- Center divider: single vertical line between cells
- Right cell: top border (single), NO right border, NO bottom border
- The visual "box" is open on the right — this is the correct CA style

In docx-js:
```javascript
// Left cell borders
borders: {
  top:    { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  left:   { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  right:  { style: BorderStyle.SINGLE, size: 6, color: "000000" }
}
// Right cell borders
borders: {
  top:    { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  bottom: { style: BorderStyle.NONE },
  left:   { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  right:  { style: BorderStyle.NONE }
}
```

---

## LINE NUMBER HEADER

The line-number header (1–28 with double vertical bar) must be injected
directly from the reference document's header XML. Do not attempt to
reconstruct it programmatically — extract it verbatim.

Steps:
1. Read `word/header2.xml` from the reference DOCX using adm-zip or
   the Node.js zip approach
2. Store it as a constant string `PLEADING_HEADER_XML` in the file
3. When generating the output document, inject this XML as the default
   header for all pages using the docx library's `Header` with raw XML

The header applies to all pages including the first. The reference
document uses three header variants (header1, header2, header3) where
header2 is the standard body page header and also the correct one for
pleading paper. Use header2.

---

## FOOTER STRUCTURE

Every page (including page 1) gets:
- A horizontal rule separating footer from body
- Page number (auto field, Arabic numerals) on the left
- Document title content control on the right or centered
- 10pt minimum font per CRC Rule 2.110

First page: suppress page number display (page 1 number is typically
omitted on pleading paper, matching standard practice).

---

## CONTENT CONTROL IMPLEMENTATION

Use the docx library's `StructuredDocumentTag` (SDT) for content controls.
Each SDT wraps a paragraph or run containing the placeholder text.

```javascript
// Example pattern for a text content control
new StructuredDocumentTag({
  alias: "Attorney Name",
  tag: "attorney_name",
  appearance: "boundingBox",
  contents: [
    new Paragraph({
      children: [new TextRun({
        text: "[Attorney Name]",
        font: "Times New Roman",
        size: 24,
        color: "808080"  // gray for placeholder
      })]
    })
  ]
})
```

If `StructuredDocumentTag` is not available in the installed version of
docx-js, fall back to plain text placeholders in brackets:
`[Attorney Name]`, `[Case Number]`, etc.
Check the installed docx version before deciding which approach to use.
Plain text brackets are acceptable and widely used in practice.

---

## DUAL-CONTEXT ARCHITECTURE

The file must work in both Node.js and browser without modification.

```javascript
// ═══════════════════════════════════════════════════════════
// pleading-shell.js
// Standalone + in-app California pleading shell generator
// ═══════════════════════════════════════════════════════════

// ─ CONSTANTS ─
const PLEADING_HEADER_XML = `...extracted header XML...`;

// ─ CORE GENERATION FUNCTION ─
// Works in both Node and browser
// options: { fields: { attorney_name, firm_name, ... }, format: 'pleading'|'plain' }
// Returns: Promise<Buffer> in Node, Promise<Blob> in browser
async function generatePleadingShell(options = {}) {
  const { fields = {}, format = 'pleading' } = options;
  
  // ... build document ...
  
  const doc = new Document({ ... });
  
  if (typeof window === 'undefined') {
    // Node.js context
    const { Packer } = require('docx');
    return Packer.toBuffer(doc);
  } else {
    // Browser context
    return Packer.toBlob(doc);
  }
}

// ─ STANDALONE CLI ─
// Only runs when executed directly in Node.js
if (typeof require !== 'undefined' && require.main === module) {
  runCLI();
}

// ─ BROWSER EXPORT ─
if (typeof window !== 'undefined') {
  window.generatePleadingShell = generatePleadingShell;
}
```

---

## STANDALONE CLI (Node.js)

When run as `node pleading-shell.js`, the script:

1. Prompts for each field using Node's `readline` module
2. Fields with defaults (court name, county) show the default and accept
   Enter to keep it
3. Shows a summary of entered values before generating
4. Writes the output DOCX to the current directory with an auto-generated
   filename: `Pleading_Shell_[CaseNumber]_[YYYY-MM-DD].docx`
5. Prints the output filename on success

**Default values for common fields:**
```
court_name:   "SUPERIOR COURT OF THE STATE OF CALIFORNIA"
court_county: "FOR THE COUNTY OF LOS ANGELES - CENTRAL DISTRICT"
```

**Fields to prompt for (in order):**
```
1.  Attorney name and SBN (e.g. "David S. Bederman, SBN 285262")
2.  Firm name
3.  Firm address line 1
4.  Firm address line 2 (city/state/zip)
5.  Phone
6.  Email
7.  Attorney for (e.g. "Plaintiff JOHN MUSERO")
8.  Court name [default shown]
9.  Court county/district [default shown]
10. Plaintiff name
11. Plaintiff description (e.g. "an Individual,")
12. Defendant name
13. Defendant description (e.g. "a Delaware LLC,")
14. Additional parties (e.g. "and DOES 1-50" — press Enter to skip)
15. Case number
16. Judge name and department
17. Document title (e.g. "PLAINTIFF'S MOTION FOR SUMMARY JUDGMENT")
18. Hearing date (press Enter to skip)
19. Hearing time (press Enter to skip)
20. Complaint filed date (press Enter to skip)
21. Trial date (press Enter to skip)
```

---

## DEPENDENCIES

Check whether these are already installed before installing:
- `docx` — DOCX generation (should already be installed)
- `adm-zip` — for reading the template header XML (may need installation)

If `adm-zip` is not available, read the header XML using Node's built-in
`zlib` and `fs` modules instead (a DOCX is a ZIP file).

---

## OUTPUT QUALITY REQUIREMENTS

The generated DOCX must:
- Open in Microsoft Word and LibreOffice without errors
- Display the line numbers and double bar correctly on every page
- Show the caption table with correct borders
- Have all content controls navigable via Tab key in Word
- Print correctly to PDF from Word or LibreOffice
- Pass validation with `python scripts/office/validate.py` if available

---

## IMPLEMENTATION ORDER

1. Extract and store the header XML constant from the reference document
2. Build and test the core `generatePleadingShell()` function with
   hardcoded test values — verify the output visually before adding CLI
3. Add the readline CLI wrapper
4. Add the browser export (`window.generatePleadingShell`)
5. Test standalone: `node pleading-shell.js`
6. Test module: verify the function can be called from a browser console
   after loading the script with a `<script>` tag

---

## WHAT NOT TO DO

- Do not attempt to replicate the line-number header in docx-js code —
  inject the raw XML from the reference template
- Do not use any external service or API
- Do not use any npm package other than `docx` and `adm-zip`
- Do not add a GUI — the standalone mode is CLI only
- Do not modify any existing tool files (app.js, vf-app.js, etc.)
- Do not add a `<script>` tag to caci-compare.html — that happens later
  when the in-app button is wired up

---

## DELIVERABLE

One file: `pleading-shell.js`

Copy to `/mnt/user-data/outputs/pleading-shell.js` when complete.

After delivering the file, provide:
1. The exact command to run the standalone version
2. A one-line test confirming the output file was created successfully
3. The function signature to call from the browser
4. Any manual verification steps recommended before using in production
