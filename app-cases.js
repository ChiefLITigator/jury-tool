'use strict';

// ═══════════════════════════════════════════════════════════════════════
// CASE FILE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════

const CASE_KEY = 'caci_cases';

// Single source of truth for caption DOM field IDs ↔ storage keys (B3).
const CAPTION_FIELD_MAP = [
  ['pl_court_name',         'court_name'],
  ['pl_court_county',       'court_county'],
  ['pl_plaintiff_name',     'plaintiff_name'],
  ['pl_plaintiff_desc',     'plaintiff_desc'],
  ['pl_plaintiff_label',    'plaintiff_label'],
  ['pl_defendant_name',     'defendant_name'],
  ['pl_defendant_desc',     'defendant_desc'],
  ['pl_defendant_label',    'defendant_label'],
  ['pl_additional_parties', 'additional_parties'],
  ['pl_case_number',        'case_number'],
  ['pl_judge_name',         'judge_name'],
  ['pl_dept_number',        'dept_number'],
  ['pl_attorney_role',      'attorney_role'],
  ['pl_client_name',        'client_name'],
];

/** Read current caption values from DOM inputs. */
function readCaptionFromDOM() {
  const caption = {};
  for (const [id, key] of CAPTION_FIELD_MAP) {
    const el = document.getElementById(id);
    caption[key] = el ? el.value.trim() : '';
  }
  return caption;
}

/** Write saved caption values back to DOM inputs (backward-compat: skips absent keys). */
function applyCaptionToDOM(caption) {
  const cap = caption || {};
  for (const [id, key] of CAPTION_FIELD_MAP) {
    if (!(key in cap)) continue;
    const el = document.getElementById(id);
    if (el) el.value = cap[key];
  }
}

/** Clear all caption DOM inputs. */
function clearCaptionDOM() {
  for (const [id] of CAPTION_FIELD_MAP) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  }
}

function loadCaseIndex() {
  try {
    const raw = localStorage.getItem(CASE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) return {};
    return parsed;
  } catch { return {}; }
}

function saveCaseIndex(obj) {
  localStorage.setItem(CASE_KEY, JSON.stringify(obj));
}

function populateCaseSelect() {
  const sel     = document.getElementById('caseSelect');
  const index   = loadCaseIndex();
  const current = sel.value;
  sel.innerHTML = '<option value="">— new session —</option>';
  for (const name of Object.keys(index).sort()) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = name;
    sel.appendChild(opt);
  }
  if (current && index[current]) sel.value = current;
}

function setCaseBarStatus(msg, cls = '') {
  const el = document.getElementById('caseBarStatus');
  el.textContent = msg;
  el.className = 'status ' + cls;
  if (msg) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
}

/** Serialize a parsedState for storage: only fields are needed on restore (B6). */
function serializeParsedState(ps) {
  return { fields: [...ps.fields.entries()] };
}

/** Restore field values from a saved parsedState onto a freshly-parsed live state. */
function applyFieldValues(freshState, savedFields) {
  const savedMap = new Map(savedFields);
  for (const [key, saved] of savedMap) {
    const live = freshState.fields.get(key);
    if (!live) continue;
    if ('value'       in saved) live.value       = saved.value;
    if ('checked'     in saved) live.checked      = saved.checked;
    if ('selected'    in saved) live.selected     = saved.selected;
    if ('custom'      in saved) live.custom       = saved.custom;
    if ('customValue' in saved) live.customValue  = saved.customValue;
  }
}

function clearAllWorkspace() {
  if (typeof resetDraftLockState === 'function') resetDraftLockState(); // B1
  packetInstructions = [];
  activePacketId     = null;
  draftState         = null;
  document.getElementById('draftWorkspace').classList.add('hidden');
  clearCaptionDOM(); // B3
  if (typeof setVFState === 'function') setVFState([]);
  renderPacketTray();
}

function caseSave() {
  const name = document.getElementById('caseNameInput').value.trim();
  if (!name) { setCaseBarStatus('Enter a case name first.', 'err'); return; }
  const instructions = packetInstructions.map(e => ({
    caciNum: e.caciNum, label: e.label, parsedState: serializeParsedState(e.parsedState)
  }));
  const caption = readCaptionFromDOM(); // B3
  try {
    const index = loadCaseIndex();
    // [VF integration] include verdict form state alongside instructions
    index[name] = {
      instructions,
      verdictForms: (typeof getVFSerializedState === 'function') ? getVFSerializedState() : [],
      caption,
    };
    saveCaseIndex(index);
    populateCaseSelect();
    document.getElementById('caseSelect').value = name;
    setCaseBarStatus('✓ Saved', 'ok');
  } catch (err) {
    setCaseBarStatus('Save failed: ' + (err.message || 'localStorage quota exceeded'), 'err');
  }
}

function caseLoad(name) {
  const index = loadCaseIndex();
  const saved = index[name];
  if (!saved) return;
  if (typeof resetDraftLockState === 'function') resetDraftLockState(); // B1
  packetInstructions = [];
  packetIdCounter    = 0;
  activePacketId     = null;
  if (!Array.isArray(saved.instructions)) saved.instructions = []; // B4
  for (const item of saved.instructions) {
    try {
      const freshState = parseInstruction(lookupCACITextForDraft(item.caciNum));
      applyFieldValues(freshState, item.parsedState.fields);
      packetInstructions.push({ id: ++packetIdCounter, caciNum: item.caciNum, label: item.label || '', parsedState: freshState });
    } catch (err) { console.warn(`Case load: skipped CACI ${item.caciNum} —`, err.message); }
  }
  document.getElementById('caseNameInput').value = name;
  applyCaptionToDOM(saved.caption); // B3
  renderPacketTray();
  if (packetInstructions.length) packetLoad(packetInstructions[0].id);
  // [VF integration] restore verdict form state
  if (typeof setVFState === 'function') setVFState(saved.verdictForms || []);
}

function caseDelete() {
  const name = document.getElementById('caseSelect').value;
  if (!name) { setCaseBarStatus('No case selected.', 'err'); return; }
  const index = loadCaseIndex();
  delete index[name];
  saveCaseIndex(index);
  populateCaseSelect();
  document.getElementById('caseSelect').value = '';
  document.getElementById('caseNameInput').value = '';
  clearAllWorkspace();
  setCaseBarStatus('Deleted.', 'ok');
}

function caseExport() {
  const name = document.getElementById('caseNameInput').value.trim() || 'case';
  const data = JSON.stringify({
    caseName: name,
    instructions: packetInstructions.map(e => ({
      caciNum: e.caciNum, label: e.label, parsedState: serializeParsedState(e.parsedState)
    })),
    verdictForms: (typeof getVFSerializedState === 'function') ? getVFSerializedState() : [],
    caption: readCaptionFromDOM(), // B3
  }, null, 2);
  const dateSlug = new Date().toISOString().slice(0, 10);
  const nameSlug = name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  downloadTXT(data, `CACI-case-${nameSlug}-${dateSlug}.json`);
}

function caseImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !Array.isArray(data.instructions)) {
        setCaseBarStatus('Invalid case file format.', 'err'); return;
      }
      clearAllWorkspace();
      packetIdCounter = 0;
      for (const item of data.instructions) {
        if (!item.caciNum || !item.parsedState || !Array.isArray(item.parsedState.fields)) continue;
        try {
          const freshState = parseInstruction(lookupCACITextForDraft(item.caciNum));
          applyFieldValues(freshState, item.parsedState.fields);
          packetInstructions.push({ id: ++packetIdCounter, caciNum: item.caciNum, label: item.label || '', parsedState: freshState });
        } catch (err) { console.warn(`Case import: skipped CACI ${item.caciNum} —`, err.message); }
      }
      if (data.caseName) document.getElementById('caseNameInput').value = data.caseName;
      if (data.caption) applyCaptionToDOM(data.caption); // B3
      renderPacketTray();
      if (typeof setVFState === 'function') setVFState(data.verdictForms || []);
      if (packetInstructions.length) packetLoad(packetInstructions[0].id); // B5
      setCaseBarStatus(`✓ Imported ${packetInstructions.length} instruction(s)`, 'ok');
    } catch (err) { setCaseBarStatus('Import failed: ' + err.message, 'err'); }
  };
  reader.readAsText(file);
}

document.getElementById('caseSaveBtn').addEventListener('click', caseSave);
document.getElementById('caseDeleteBtn').addEventListener('click', caseDelete);
document.getElementById('caseExportBtn').addEventListener('click', caseExport);
document.getElementById('caseImportFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) { caseImport(file); e.target.value = ''; }
});
document.getElementById('caseSelect').addEventListener('change', (e) => {
  const name = e.target.value;
  if (!name) {
    document.getElementById('caseNameInput').value = '';
    clearAllWorkspace();
  } else {
    caseLoad(name);
  }
});

populateCaseSelect();
