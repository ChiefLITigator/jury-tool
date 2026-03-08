# CODEBASE-REVIEW.md
## California Civil Litigation Tool Suite — Deep Reference for AI Chat Review
### Last updated: 2026-03-08

**Purpose:** Self-contained reference for Claude.ai chat sessions where files cannot be opened.
Supplements CODEBASE-MAP.md (architecture, file inventory, load order, localStorage schemas, parsedState/vfDB/exportDOCX/pleading-shell shapes, known bugs). This document adds function signatures, globals, event listeners, cross-file dependencies, and key code snippets.

---

## CROSS-FILE DEPENDENCY MAP

```
draft-parser.js   → EXPOSES: parseInstruction(rawText)→parsedState, findTopLevelBrackets(text)→[{start,end,content}]
                              classifyBracket, makeDraftKey, splitOnSlashDepth0 (global scope — used by app-draft.js)
                    READS: nothing external

app-shared.js     → EXPOSES: esc, escAttr, lookupCACITextForDraft(num)→string, lookupCACIText(num)→string,
                              downloadTXT(text,filename), setPrintHeader(text), doPrint(cls),
                              updatePrintSettings(), exportPDF(sections,filename), PS_FONTS
                    READS: caciDB (caci-data.js), flattenForCompare (app-compare.js — runtime only, safe)

app-compare.js    → EXPOSES: flattenForCompare(text)→string, tokenize(text)→string[]+sentinels,
                              stripInstructionHeading(text)→string
                    READS: findTopLevelBrackets (draft-parser.js)

app-draft.js      → EXPOSES: draftState (let global), getDraftText(), getDraftBodyText(), getDraftHeading(),
                              renderDraftForm(state), updateDraftPreview(), compileInstruction(state)→string,
                              getUnfilledFields(parsedState)→field[], resetDraftLockState()
                    READS: parseInstruction, findTopLevelBrackets, classifyBracket, makeDraftKey (draft-parser.js)
                           lookupCACITextForDraft, exportPDF, downloadTXT, esc, escAttr (app-shared.js)
                           packetInstructions, packetIdCounter, activePacketId, renderPacketTray (app-packet.js)
                           exportDOCX (docx-export.js)

app-packet.js     → EXPOSES: packetInstructions (let []), packetIdCounter (let 0), activePacketId (let null),
                              renderPacketTray(), packetLoad(id), packetRemove(id),
                              compilePacket()→string, getPacketUnfilledSummary()→[{caciNum,label,count}]
                    READS: draftState, renderDraftForm, updateDraftPreview, getUnfilledFields,
                           compileInstruction, resetDraftLockState (app-draft.js)
                           parseInstruction, lookupCACITextForDraft (draft-parser.js / app-shared.js)
                           exportPDF, exportDOCX, downloadTXT, esc (app-shared.js / docx-export.js)
                           generatePleadingShell (pleading-shell.js)
                           localStorage: 'pleading_attorney_profile', 'caci_cases'

app-cases.js      → EXPOSES: CASE_KEY, CAPTION_FIELD_MAP, loadCaseIndex()→{}, saveCaseIndex(obj),
                              populateCaseSelect(), setCaseBarStatus(msg,cls),
                              readCaptionFromDOM()→{}, applyCaptionToDOM(caption), clearCaptionDOM(),
                              serializeParsedState(ps)→{fields}, applyFieldValues(freshState,savedFields),
                              caseSave(), caseLoad(name), caseDelete(), caseExport(), caseImport(file),
                              clearAllWorkspace()
                    READS: packetInstructions, packetIdCounter, activePacketId, renderPacketTray,
                           packetLoad (app-packet.js)
                           draftState, resetDraftLockState (app-draft.js)
                           parseInstruction, lookupCACITextForDraft (draft-parser.js / app-shared.js)
                           downloadTXT (app-shared.js)
                           getVFSerializedState, setVFState (vf-app.js)

app-browse.js     → EXPOSES: nothing (self-contained)
                    READS: caciDB (caci-data.js), esc (app-shared.js)

docx-export.js    → EXPOSES: exportDOCX(content,filename)→void
                    READS: window.docx (UMD bundle)

vf-app.js         → EXPOSES: getVFSerializedState()→{forms,activeFormId}, setVFState(data)→void,
                              renderVFPlainText()→string
                    READS: vfDB (vf-data.js)
                           exportPDF, downloadTXT (app-shared.js)
                           exportDOCX (docx-export.js)
                           generatePleadingShell (pleading-shell.js)
                           localStorage: 'pleading_attorney_profile', 'caci_cases'

pleading-shell.js → EXPOSES: window.generatePleadingShell(options)→Promise<Blob> [browser]
                              module.exports.generatePleadingShell [Node]
                    READS: window.docx [browser] / require('docx') [Node]

pleading-ui.js    → EXPOSES: nothing (self-contained)
                    READS: generatePleadingShell (pleading-shell.js)
                           localStorage: 'pleading_attorney_profiles', 'pleading_attorney_profile', 'caci_cases'
```

---

## GLOBAL VARIABLES MASTER LIST

| Variable | File | Type | Initial |
|----------|------|------|---------|
| `caciDB` | caci-data.js | `{[num:string]:string}` | static |
| `vfDB` | vf-data.js | `{groups:[...]}` | static |
| `draftState` | app-draft.js | `parsedState\|null` | `null` |
| `packetInstructions` | app-packet.js | `Array<{id,caciNum,label,parsedState}>` | `[]` |
| `packetIdCounter` | app-packet.js | `number` | `0` |
| `activePacketId` | app-packet.js | `number\|null` | `null` |
| `vfForms` | vf-app.js | `workingForm[]` | `[]` (1 auto-created at init) |
| `activeVfFormId` | vf-app.js | `string\|null` | `null` |
| `vfUidCounter` | vf-app.js | `number` | `0` |
| `vfFormIdCtr` | vf-app.js | `number` | `0` |
| `vfOpenEditorUid` | vf-app.js | `string\|null` | `null` |
| `vfDragSrcIndex` | vf-app.js | `number\|null` | `null` |
| `caciIndex` | app-browse.js | `Array<{num,title}>` | `[]` |
| `browseMode` | app-browse.js | `'search'\|'browse'` | `'search'` |
| `browseOpenCenturies` | app-browse.js | `{[c:number]:bool}` | `{}` |
| `PARA_SENTINEL` | app-compare.js | `const string` | `'\u00b6'` (pilcrow) |
| `_DEBUG` | draft-parser.js | `boolean` | `location.search.includes('debug')` |
| `CASE_KEY` | app-cases.js | `const string` | `'caci_cases'` |
| `CAPTION_FIELD_MAP` | app-cases.js | `const [string,string][]` | 12 `[pl_id, bare_key]` pairs |
| `PLEADING_PROFILES_KEY` | pleading-ui.js | `const string` | `'pleading_attorney_profiles'` |
| `PLEADING_PROFILE_KEY` | pleading-ui.js | `const string` | `'pleading_attorney_profile'` |

**workingForm shape:**
```js
{ id: 'vf_N', name: string,
  caption: { court:'', caseName:'', caseNumber:'', dept:'' },
  parties: { plaintiff:'', defendant:'', ...customKeys },
  questions: [{ uid:'vfq_N', source_group, source_id, type, text, fields:[],
                if_yes?, if_no?, if_done?, stop_text?, line_items?:[{label}], parties?:[{label}] }] }
```

---

## EVENT LISTENERS MASTER LIST

| File | Element | Handler |
|------|---------|---------|
| app-shared.js | `#print-settings-toggle` click | toggle `#print-settings-panel` |
| app-shared.js | `#ps-*` change (5 inputs) | `updatePrintSettings()` |
| app-shared.js | `document` click | close all `.export-picker` |
| app-compare.js | `#loadCaci` click | lookup + set `#officialCaci` |
| app-compare.js | `#caciNumber` keydown Enter | click `#loadCaci` |
| app-compare.js | `#resetCaci` click | reload `#officialCaci` |
| app-compare.js | `#compareBtn` click | `runCompare()` |
| app-compare.js | `.tab-btn` click | tab switch + case bar toggle + draft num copy |
| app-compare.js | `#printCompareBtn` click | `setPrintHeader()` + `doPrint('printing-compare')` |
| app-compare.js | `#exportCompareBtn` click | `downloadTXT(results.innerText)` |
| app-draft.js | `#loadDraftBtn` click | lookup → parse → `renderDraftForm` + `updateDraftPreview` |
| app-draft.js | `#draftCaciNum` keydown Enter | click `#loadDraftBtn` |
| app-draft.js | `#addToPacketBtn` click | push to `packetInstructions`, `renderPacketTray()` |
| app-draft.js | `#lockEditBtn` click | toggle lock/unlock, swap preview↔textarea |
| app-draft.js | `#copyDraftBtn` click | `navigator.clipboard.writeText(getDraftText())` |
| app-draft.js | `#exportDraftBtn` click | toggle `#exportDraftPicker` |
| app-draft.js | `#exportDraftPicker` click | dispatch pdf/docx/txt with lock-state awareness |
| app-draft.js | draftForm inputs | `onDraftChange(e)` |
| app-packet.js | `#packetAddBtn` click | lookup → parse → push to tray |
| app-packet.js | `#packetCaciNum` keydown Enter | click `#packetAddBtn` |
| app-packet.js | `#compilePacketBtn` click | `compilePacket()` → show overlay |
| app-packet.js | `#closeCompileOverlay` click | hide overlay |
| app-packet.js | `#exportPacketBtn` click | toggle `#exportPacketPicker` |
| app-packet.js | `#exportPacketPicker` click | dispatch pdf/docx/txt/pleading |
| app-cases.js | `#caseSaveBtn` click | `caseSave()` |
| app-cases.js | `#caseDeleteBtn` click | `caseDelete()` |
| app-cases.js | `#caseExportBtn` click | `caseExport()` |
| app-cases.js | `#caseImportFile` change | `caseImport(file)` |
| app-cases.js | `#caseSelect` change | `caseLoad(name)` or `clearAllWorkspace()` |
| app-browse.js | `#caciSearchToggleBtn` click | open/close panel (blocked on vf/pleading tabs) |
| app-browse.js | `document` click | close panel if click outside |
| app-browse.js | `#caciModeSearch/Browse` click | `switchMode()` |
| app-browse.js | `#caciSearchInput` input | debounced 250ms `renderSearchResults()` |
| app-browse.js | panel click (delegated) | `pickResult()` or browse-group expand/collapse |
| app-browse.js | `.tab-btn` click | close panel on vf/pleading |
| vf-app.js | `#vfAddCustomBtn` click | `addCustomQuestion()` |
| vf-app.js | `#vfAddPartyBtn` click | `prompt()` → add party key |
| vf-app.js | `#vfExportBtn` click | toggle `#exportVfPicker` |
| vf-app.js | `#exportVfPicker` click | dispatch pdf/docx/pleading |
| vf-app.js | `#caseSelect` change | VF caption pre-fill (one-way, only-if-empty) |
| vf-app.js | builder q-blocks | drag+drop, edit/delete (re-wired every `renderBuilder()`) |
| vf-app.js | `#vfFormSelect` change | switch active form |
| vf-app.js | `#vfNewFormBtn` click | `newBlankForm()` + `renderAll()` |
| pleading-ui.js | `#saveProfileBtn` click | `saveProfile()` |
| pleading-ui.js | `#deleteProfileBtn` click | `deleteProfile()` |
| pleading-ui.js | `#profileSelect` change | `applyProfileFields()` + write legacy key |
| pleading-ui.js | `#generatePleadingBtn` click | `generateShell()` |
| pleading-ui.js | `#caseSelect` change | Section B caption pre-fill (one-way, only-if-empty) |

**caseSelect listener order:** app-cases.js fires first (loads packet+VF state), then vf-app.js (caption pre-fill), then pleading-ui.js (caption pre-fill). Guaranteed by script load order.

---

## FILE-BY-FILE: SIGNATURES + KEY LOGIC

### draft-parser.js

| Signature | Returns |
|-----------|---------|
| `findTopLevelBrackets(text)` | `[{start,end,content}]` |
| `parseInstruction(rawText)` | `{rawText, segments:[{type,text\|key}], fields:Map}` |

**classifyBracket order (critical — wrong order = misclassification):**
```js
1. empty → 'skip'
2. bare int, legal cite (N P.2d N), roman numeral → 'skip'
3. /^(or|and|,|;|an|s|ed|ing|he|she|...)$/ → 'connector'  // MUST be before slash check
4. /^\d+\.\s*\[\s*(?:or|and)\s*\]/ → 'alternative'        // handles [N. [or]] and [N. [and]]
5. /^(specify|insert|name\s+of|briefly|...)/ → 'text'      // BEFORE slash check
6. /^(add|include)/ → 'note'
7. /^e\.g\./ → 'text'
8. slash-depth-0 parts > 1, no option starts with "name of" → 'dropdown'
9. /^(and|or)\s+\w{2,}/ → 'optional'
10. ends with ':' → 'skip'
11. contains '[' → 'optional'
12. length > 25 or multi-sentence → 'optional'
13. else → 'text'
```

**parseInstruction two-pass algorithm:**
```
Pass 1: build altContentMap (signal bracket index → content bracket index)
        "[N. [or]]" signals mapped to next "[N. ...]" content bracket
        Content brackets added to `consumed` set — skipped in Pass 2

Pass 2: main segment loop
  - consumed brackets: emit text span, advance lastEnd, continue
  - alternative brackets: get altText from altContentMap; scan segments backward
    to find pairedOptionalKey (optional with same elemNum "N."); register inner brackets
  - optional brackets: register all inner brackets (1-2 levels deep) as form fields
  - text/dropdown/connector/note: standard key-based de-duplication
```

**Non-obvious:** `optional` defaults `checked: true` (included). `connector` defaults `checked: false` (excluded).

---

### app-shared.js

| Signature | Returns |
|-----------|---------|
| `esc(s)` | `string` — escapes `& < >` (text node contexts) |
| `escAttr(s)` | `string` — escapes `& < > " '` (attribute value contexts) |
| `lookupCACITextForDraft(caciNum)` | `string` — throws if not found |
| `lookupCACIText(caciNum)` | `string` — + `flattenForCompare()` |
| `downloadTXT(text, filename)` | `void` |
| `setPrintHeader(text)` | `void` |
| `doPrint(cls)` | `void` — adds class, prints, removes on `afterprint` |
| `updatePrintSettings()` | `void` — injects `<style id="print-settings">` |
| `exportPDF(sections, filename)` | `void` — pdfMake; body split on `\n\n` per paragraph |

**lookupCACITextForDraft** applies 10 regex cleanup steps in order. Key steps: join wrapped title lines (up to 3 passes), strip running headers/folio numbers/revision history, re-split numbered list items merged by PDF extraction, join mid-sentence line breaks (`([^.!?:;\n])\n([a-z\[])` → space join).

---

### app-compare.js

| Signature | Returns |
|-----------|---------|
| `tokenize(text)` | `string[]` — inserts `PARA_SENTINEL` at `\n{2,}` boundaries, then collapses whitespace and splits on space |
| `stripInstructionHeading(text)` | `string` |
| `flattenForCompare(text)` | `string` — normalizes unclosed `[N. [or]]`/`[N. [and]]` brackets, removes alt signal brackets, unwraps optional list items |
| `computeDiff(a,b)` | `[{op,text}]` — falls back to `computeChunkedDiff` at `m*n > 900_000` |
| `computeChunkedDiff(a,b,sz)` | `[{op,text}]` — sz=10 words per chunk |
| `threeWayDiff(tA,tCaci,tB)` | `{opsA,opsB,opsAB,countsCA,countsCB,countsAB,hasYellow}` |
| `counts(ops)` | `{ins,del,total}` — skips ops where `o.text === PARA_SENTINEL` |
| `renderFull/Left/Right(ops)` | `string` (HTML) — sentinel → `</p><p class="diff-para">` |
| `colHtml(title,html,isBase)` | `string` (HTML column wrapper) |
| `attachScrollSync()` | `void` — proportional scroll sync across `.diff-col-body` elements |
| `runCompare()` | `async void` |

**threeWayDiff yellow logic:** position in CACI token array changed by BOTH A and B but to different outputs → `op:'yellow'`. Applied via `applyYellow()` to raw opsCA and opsCB.

---

### app-draft.js

| Signature | Returns |
|-----------|---------|
| `resolveDropdown(f)` | `string` — blank/option/custom; strips surrounding `[ ]` from option |
| `substituteInner(text,fields)` | `string` — recursive inner-bracket substitution |
| `compileInstruction(state)` | `string` |
| `getUnfilledFields(parsedState)` | `field[]` — only reachable fields (skips inner fields of unchecked optionals) |
| `applyUnfilledHighlights(state)` | `void` — yellow border on unfilled inputs |
| `renderDraftForm(state)` | `void` — builds HTML, sets `formEl.innerHTML`, wires input/change events |
| `onDraftChange(e)` | `void` |
| `activateDraftCustom(key)` | `void` — sets `f.custom=true`, re-renders form |
| `restoreDraftDropdown(key)` | `void` — resets `f.custom=false, selected=-1` |
| `updateDraftPreview()` | `void` |
| `getDraftText()` | `string` — reads textarea if locked, preview DOM if unlocked |
| `getDraftHeading()` | `string` — reads `#draftPreview .draft-preview-heading` |
| `getDraftBodyText()` | `string` — reads `#draftPreview .draft-para` elements |
| `resetDraftLockState()` | `void` — removes `draft-locked`, clears textarea, restores preview, resets button+warning |

**compileInstruction post-processing:**
```js
out = out
  .replace(/^\d{3,4}\s*\.\s*[^\n]+\n?/, '')  // strip heading line
  .replace(/[ \t]+$/gm, '')
  .replace(/ {2,}/g, ' ')
  .replace(/ ([,;:.!?])/g, '$1')              // fix orphan punctuation
  .replace(/,\s*,/g, ',')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
```

**Lock/unlock — export picker guard:**
```js
const locked = ws.classList.contains('draft-locked');
if (locked) {
  const fullText   = getDraftText();              // reads textarea
  const firstBlank = fullText.indexOf('\n\n');
  if (firstBlank !== -1) {
    heading = fullText.slice(0, firstBlank).trim();
    body    = fullText.slice(firstBlank + 2).trim();
  } else {
    heading = fullText.trim();
    body    = '';
  }
} else {
  heading = getDraftHeading();                 // reads hidden #draftPreview
  body    = getDraftBodyText();
}
```

**onDraftChange alternative-radio side effect:**
```js
if (f.type === 'alternative' && f.pairedOptionalKey) {
  const paired = draftState.fields.get(f.pairedOptionalKey);
  if (paired) paired.checked = (el.value === 'a'); // A=include standard, B=exclude
}
```

---

### app-packet.js

| Signature | Returns |
|-----------|---------|
| `renderPacketTray()` | `void` |
| `packetLoad(id)` | `void` — calls `resetDraftLockState()` first, sets `activePacketId`, restores `draftState`, calls `renderDraftForm` |
| `packetRemove(id)` | `void` |
| `getPacketUnfilledSummary()` | `[{caciNum,label,count}]` |
| `compilePacket()` | `string` — sections joined by `\n\n---\n\n`; prefixed with unfilled warning if any |

**Pleading DOCX export pattern (identical in vf-app.js):**
```js
const profileRaw = localStorage.getItem('pleading_attorney_profile');
const profile    = profileRaw ? JSON.parse(profileRaw) : {};
const fields     = {};
for (const [k,v] of Object.entries(profile)) {
  if (k.startsWith('pl_')) fields[k.slice(3)] = v;  // strip pl_ prefix
}
// overlay case caption (only-if-missing)
const caption = (cases[caseSel.value] && cases[caseSel.value].caption) || {};
for (const [k,v] of Object.entries(caption)) { if (!fields[k]) fields[k] = v; }
fields.document_title = 'PROPOSED JURY INSTRUCTIONS';
fields.body_text      = compilePacket();
const paperCheck = document.getElementById('packetPleadingCheck'); // independent checkbox
const blob = await generatePleadingShell({ fields, plainPaper: !(paperCheck && paperCheck.checked) });
```

---

### app-cases.js

| Signature | Returns |
|-----------|---------|
| `loadCaseIndex()` | `{}` — returns `{}` on any error or malformed data |
| `saveCaseIndex(obj)` | `void` |
| `populateCaseSelect()` | `void` — sorted alphabetically, preserves current selection |
| `setCaseBarStatus(msg,cls)` | `void` — auto-clears after 3s |
| `readCaptionFromDOM()` | `{court_name,...}` — reads all 12 Section B inputs via CAPTION_FIELD_MAP |
| `applyCaptionToDOM(caption)` | `void` — writes caption object to 12 Section B inputs |
| `clearCaptionDOM()` | `void` — clears all 12 Section B inputs |
| `serializeParsedState(ps)` | `{fields:[...Map.entries()]}` — rawText/segments excluded (re-derived on load) |
| `applyFieldValues(freshState,savedFields)` | `void` — copies value/checked/selected/custom/customValue |
| `clearAllWorkspace()` | `void` — resets packet/draft/VF; calls `resetDraftLockState()`, `clearCaptionDOM()`, `setVFState([])` |
| `caseSave()` | `void` — snapshot includes caption via `readCaptionFromDOM()` |
| `caseLoad(name)` | `void` — calls `resetDraftLockState()`, restores caption via `applyCaptionToDOM()`, guards non-array instructions |
| `caseDelete()` | `void` |
| `caseExport()` | `void` — JSON includes instructions + verdictForms + caption |
| `caseImport(file)` | `void` — FileReader; validates instructions; calls `applyCaptionToDOM()`; auto-loads first packet |

**caseSave caption snapshot:** uses `readCaptionFromDOM()` — reads 12 Pleading Section B DOM inputs (`pl_court_name`…`pl_client_name`) into `caption` object WITHOUT `pl_` prefix. Keys: `court_name, court_county, plaintiff_name, plaintiff_desc, defendant_name, defendant_desc, additional_parties, case_number, judge_name, dept_number, attorney_role, client_name`.

**caseLoad:** calls `resetDraftLockState()` first. Re-parses each CACI number from `caciDB` (fresh), then `applyFieldValues` to overlay saved edits. Guards `if (!Array.isArray(saved.instructions)) saved.instructions = []`. Silent skip on CACI lookup errors. Auto-loads first packet entry via `packetLoad(packetInstructions[0].id)`. Restores caption via `applyCaptionToDOM(saved.caption)`.

---

### app-browse.js

| Signature | Returns |
|-----------|---------|
| `buildCaciIndex()` | `[{num,title}]` — skips `_`-suffix keys; sorts numerically |
| `getActiveTab()` | `string` |
| `pickResult(num)` | `void` — populates `#caciNumber` (compare) or `#draftCaciNum`/`#packetCaciNum` (draft) |
| `openPanel()` / `closePanel()` | `void` |
| `renderSearchResults(query)` | `void` — max 20 hits, case-insensitive |
| `renderBrowseList()` | `void` — built once; expand/collapse toggled in-place |
| `switchMode(mode)` | `void` |

**Non-obvious:** Panel is blocked (toggle refuses to open) on `'vf'` and `'pleading'` tabs. Does nothing on those tabs.

---

### docx-export.js

| Signature | Returns |
|-----------|---------|
| `exportDOCX(content, filename)` | `void` — `Packer.toBlob` + anchor click |

**verdict form routing_text:** computed in `buildVFDocxContent()` (vf-app.js) from routing fields + `uidToDisplayNum()`. `displayNumber` passed explicitly. `exportDOCX` does NOT compute routing itself.

---

### vf-app.js

| Signature | Returns |
|-----------|---------|
| `activeWorkingForm()` | `workingForm\|null` |
| `nextUid()` | `'vfq_N'` |
| `nextFormId()` | `'vf_N'` |
| `newBlankForm(name)` | `workingForm` |
| `escapeRegex(s)` | `string` — escapes regex metacharacters in party keys |
| `substituteParties(text,parties)` | `string` — `[name of KEY]` → party value (uses `escapeRegex`) |
| `renderPalette()` | `void` |
| `addQuestionFromPalette(groupId,sourceQid)` | `void` — calls `normalizeRoutes(form)` after add |
| `translateRouting(val,uidMap,groupId)` | `string` — returns `'__src__:{groupId}:{val}'` sentinel if target uid not yet in map |
| `normalizeRoutes(form)` | `void` — resolves all `__src__:...` sentinels in `form.questions` to live UIDs; called after every mutation |
| `addCustomQuestion()` | `void` |
| `renderBuilder()` | `void` — re-wires all drag/edit/delete events on each call; drop handler calls `normalizeRoutes` |
| `openEditor(uid)` / `closeEditorIfOpen()` | `void` |
| `wireEditorEvents()` | `void` |
| `buildRoutingOptions(excludeUid,questions,selected,includeStop)` | `string` (HTML `<option>` list) — `includeStop=false` for non-yes_no if_done |
| `routingLabel(val,questions)` | `string` — `'Q3'\|'Sign'\|'Stop'\|'[PENDING]'\|'[BROKEN]'` |
| `routingText(q,qs,num)` | `string` — shared routing line for preview/TXT/DOCX; outputs `[ROUTE BROKEN]` for bad routes |
| `renderPartyFields()` / `renderCaptionFields()` / `renderFormSelector()` | `void` |
| `renderVFPlainText()` | `string` — includes caption preamble BEFORE "SPECIAL VERDICT FORM\n" |
| `buildVFDocxContent()` | `exportDOCX content object\|null` — uses `routingText()` for all question types |
| `getVFSerializedState()` | `{forms:workingForm[], activeFormId:string}` — deep clone via `JSON.parse(JSON.stringify(...))` |
| `setVFState(data)` | `void` — accepts `{forms,activeFormId}` object OR legacy `workingForm[]`; restores activeVfFormId; ensures ≥1 form; calls `normalizeRoutes` on each form |
| `uidToDisplayNum(uid,questions)` | `number\|null` — array index + 1 |
| `renderAll()` | `void` — calls all 6 render functions |
| `escHtml(str)` | `string` — local escape, NOT same as shared `esc` |

**setVFState — counter advancement + compat:**
```js
// Accepts both formats:
vfForms = Array.isArray(data) ? data : (data.forms || []);
// Restore active form ID if valid:
if (!Array.isArray(data) && data.activeFormId) {
  if (vfForms.some(f => f.id === data.activeFormId))
    activeVfFormId = data.activeFormId;
}
// Counter advancement (same as before):
for (const form of vfForms) { /* advance vfFormIdCtr, vfUidCounter */ }
// Ensure at least one form:
if (!vfForms.length) vfForms = [newBlankForm()];
if (!activeVfFormId || !vfForms.some(f=>f.id===activeVfFormId))
  activeVfFormId = vfForms[0].id;
// Normalize sentinels:
vfForms.forEach(f => normalizeRoutes(f));
```

**PDF export — heading/body split (fmt === 'pdf' branch):**
```js
try {
  const full    = renderVFPlainText();
  const marker  = 'SPECIAL VERDICT FORM\n';
  const mIdx    = full.indexOf(marker);
  const heading = 'SPECIAL VERDICT FORM';
  const body    = mIdx >= 0 ? full.slice(mIdx + marker.length).trimStart() : full;
  exportPDF([{ heading, body }], filename);
} catch (err) {
  console.error('[vf-app] PDF export failed:', err);
}
// heading is always 'SPECIAL VERDICT FORM' — NOT form.name
// body strips caption preamble using same marker pattern as pleading path
```

**Pleading DOCX body stripping (fmt === 'pleading' branch):**
```js
const full   = renderVFPlainText();
const marker = 'SPECIAL VERDICT FORM\n';
const mIdx   = full.indexOf(marker);
fields.body_text = mIdx >= 0 ? full.slice(mIdx + marker.length).trimStart() : full;
// Uses #vfPleadingCheck (independent from Pleading tab's #pleadingPaperCheck)
```

**VF caption pre-fill mapping** (from `cases[name].caption` → `form.caption`):
```
court_name   → court        dept_number  → dept
case_number  → caseNumber   plaintiff_name + defendant_name → caseName ("p v. d" / whichever)
```

---

### pleading-shell.js

| Signature | Returns |
|-----------|---------|
| `generatePleadingShell(options)` | `Promise<Buffer>` [Node] / `Promise<Blob>` [browser] |

**Browser code paths:**
```js
// plainPaper=true → EARLY RETURN (still present), browser-safe:
if (!IS_NODE && plainPaper) return await Packer.toBlob(doc);

// plainPaper=false → ZIP patching, now browser-safe (no Buffer required):
const blob = await Packer.toBlob(doc);
docBuf     = new Uint8Array(await blob.arrayBuffer());  // no Buffer dependency
const patched = await injectPleadingHeader(docBuf);     // DataView/Uint8Array throughout
return new Blob([patched], { type: '...docx' });
```

**Margins:** plainPaper: `{top:1440,bottom:1440,left:1800,right:1440}` DXA. Pleading paper: `{top:1080,bottom:1170,left:1440,right:720,header:720,footer:432}`.

**body_text handling in buildBody:**

Court block uses `lineRule: 'exact'` via a local `EXACT` const; final blank line has `after: 480`. Caption table has `margins: { left: 10, right: 10, top: 0, bottom: 0 }`.

Body area (post-caption) always uses `lineRule: 'exact'`. Two paths:
- **No `body_text`** (blank shell, Pleading tab): single exact-spaced blank line — matches reference DOCX.
- **With `body_text`** (packet/VF Pleading DOCX exports): blank + centered bold `document_title` + blank + one paragraph per `\n`-split line.
```js
const EXACT_SP = { spacing: { line: 480, lineRule: 'exact', before: 0, after: 0 } };
const docTitle = fields.document_title || '[DOCUMENT TITLE]';
const bodyText = fields.body_text || '';
const bodyArea = bodyText
  ? [
      bp([tr('')], EXACT_SP),
      bp([tr(docTitle, { bold: true })], { alignment: AlignmentType.CENTER, ...EXACT_SP }),
      bp([tr('')], EXACT_SP),
      ...bodyText.split('\n').map(line => bp([tr(line)], EXACT_SP)),
    ]
  : [bp([tr('')], EXACT_SP)];
```

---

### pleading-ui.js

| Signature | Returns |
|-----------|---------|
| `loadProfilesIndex()` | `{[name]:profileObj}` |
| `saveProfilesIndex(profiles)` | `void` |
| `populateProfileSelect(profiles,selectedName)` | `void` |
| `applyProfileFields(profile)` | `void` — clears fields if key absent |
| `readProfileFields()` | `profileObj` — `{[pl_id]:value}` |
| `saveProfile()` | `void` |
| `deleteProfile()` | `void` — refuses if 1 profile remains |
| `generateShell()` | `async void` |

**Multi-profile localStorage:**
```
'pleading_attorney_profiles'  →  { "Default": {pl_attorney_1_name:..., ...}, "Work": {...} }
'pleading_attorney_profile'   →  same shape as single profile (always mirrors active — for compat)
```

**Legacy migration on first load:**
```js
const raw = localStorage.getItem(PLEADING_PROFILES_KEY);
if (raw) return JSON.parse(raw);
const legacy = localStorage.getItem(PLEADING_PROFILE_KEY);
const profiles = { Default: legacy ? JSON.parse(legacy) : {} };
localStorage.setItem(PLEADING_PROFILES_KEY, JSON.stringify(profiles));
return profiles;
```

**saveProfile name resolution:** uses `#profileNameInput.value` if filled (creates/renames), otherwise uses `#profileSelect.value`. Always writes `PLEADING_PROFILE_KEY` too (legacy compat for export handlers).

**Caption pre-fill:** reads `cases[name].caption` WITHOUT `pl_` prefix (stored that way by caseSave). Fills `pl_`-prefixed DOM inputs via `FIELD_MAP`. Only fills currently-empty inputs.

---

## COMPATIBILITY CHECKLIST

**Adding a Pleading Section A field:**
1. `PROFILE_FIELD_IDS` + `FIELD_MAP` in pleading-ui.js
2. `<input id="pl_NEW">` in caci-compare.html
3. `buildBody()` handling in pleading-shell.js
4. Update schemas in CODEBASE-MAP.md + this file

**Adding an export format to a picker:**
1. `<button data-fmt="name">` in caci-compare.html
2. `else if (fmt === 'name')` in the picker click handler
3. The `document.click` listener in app-shared.js closes all `.export-picker` automatically

**Pleading paper checkboxes — three independent controls:**
- `#pleadingPaperCheck` → controls `generateShell()` in pleading-ui.js (Pleading tab)
- `#packetPleadingCheck` → controls packet Pleading DOCX in app-packet.js
- `#vfPleadingCheck` → controls VF Pleading DOCX in vf-app.js
- All three default `checked` (pleading paper format on)
