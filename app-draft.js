'use strict';

// ═══════════════════════════════════════════════════════════════════════
// DRAFT INSTRUCTION — BRACKET PARSER
// ═══════════════════════════════════════════════════════════════════════

let draftState = null;

// ═══════════════════════════════════════════════════════════════════════
// DRAFT INSTRUCTION — COMPILER
// ═══════════════════════════════════════════════════════════════════════

/** Return the string value for a dropdown field (blank, option, or custom). */
function resolveDropdown(f) {
  if (f.custom) return f.customValue;
  if (f.selected === -1) return '[' + f.label + ']';  // verbatim original bracket
  const raw = f.options[f.selected] || '';
  // Strip surrounding brackets so [name of plaintiff] → name of plaintiff in output
  return raw.startsWith('[') && raw.endsWith(']') ? raw.slice(1, -1).trim() : raw;
}

/** Replace inner brackets inside an optional block's content. */
function substituteInner(text, fields) {
  const brackets = findTopLevelBrackets(text);
  if (!brackets.length) return text;
  let out = '', lastEnd = 0;
  for (const br of brackets) {
    out += text.slice(lastEnd, br.start);
    const key = makeDraftKey(br.content);
    const f   = fields.get(key);
    if (f) {
      if (f.type === 'text')      out += f.value || `[${f.label}]`;
      else if (f.type === 'dropdown')  out += resolveDropdown(f);
      else if (f.type === 'connector') out += f.checked ? f.label : '';
      else out += text.slice(br.start, br.end);
    } else {
      if (br.content.includes('[')) {
        out += substituteInner(br.content, fields);
      } else {
        out += text.slice(br.start, br.end);
      }
    }
    lastEnd = br.end;
  }
  return out + text.slice(lastEnd);
}

function compileInstruction(state) {
  let out = '';
  for (const seg of state.segments) {
    if (seg.type === 'text') {
      out += seg.text;
    } else {
      const f = state.fields.get(seg.key);
      if (!f) continue;
      switch (f.type) {
        case 'text':      out += f.value || `[${f.label}]`; break;
        case 'dropdown':  out += resolveDropdown(f); break;
        case 'connector': out += f.checked ? f.label : ''; break;
        case 'optional':     if (f.checked) out += substituteInner(f.fullContent, state.fields); break;
        case 'note':         out += f.value || ''; break;
        case 'alternative':  if (f.selected === 'b') out += substituteInner(f.altText, state.fields); break;
      }
    }
  }
  // Strip leading "NNN. Title" line — it is rendered separately as the heading
  out = out.replace(/^\d{3,4}\s*\.\s*[^\n]+\n?/, '');
  // Tidy: strip trailing whitespace per line, collapse excess blank lines,
  // and remove artefacts left by blank dropdown selections (double spaces,
  // leading/orphaned commas or spaces before punctuation).
  return out
    .replace(/[ \t]+$/gm, '')
    .replace(/ {2,}/g, ' ')
    .replace(/ ([,;:.!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ═══════════════════════════════════════════════════════════════════════
// DRAFT INSTRUCTION — UNFILLED FIELD TRACKING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Returns an array of field objects (text, dropdown, note) that are
 * currently reachable but unfilled in parsedState.
 * Skips inner fields of unchecked optional blocks and unselected
 * alternative-B blocks.
 */
function getUnfilledFields(parsedState) {
  const { segments, fields } = parsedState;

  // Collect top-level field keys referenced directly in segments
  const topLevelKeys = new Set(
    segments.filter(s => s.type === 'field').map(s => s.key)
  );

  // Build reachable set: start with top-level, then add inner fields
  // of active optional / alternative-B blocks
  const reachable = new Set(topLevelKeys);
  for (const key of topLevelKeys) {
    const f = fields.get(key);
    if (!f) continue;
    if (f.type === 'optional' && f.checked) {
      for (const ibr of findTopLevelBrackets(f.fullContent)) {
        const ibtype = classifyBracket(ibr.content);
        if (ibtype === 'skip' || ibtype === 'alternative') continue;
        const ikey = makeDraftKey(ibr.content);
        if (fields.has(ikey)) reachable.add(ikey);
        // Recurse one level deeper for doubly-nested optional blocks
        if (ibtype === 'optional') {
          for (const iibr of findTopLevelBrackets(ibr.content)) {
            const iibtype = classifyBracket(iibr.content);
            if (iibtype === 'skip' || iibtype === 'alternative') continue;
            const iikey = makeDraftKey(iibr.content);
            if (fields.has(iikey)) reachable.add(iikey);
          }
        }
      }
    }
    if (f.type === 'alternative' && f.selected === 'b') {
      for (const ibr of findTopLevelBrackets(f.altText)) {
        const ibtype = classifyBracket(ibr.content);
        if (ibtype === 'skip' || ibtype === 'alternative') continue;
        const ikey = makeDraftKey(ibr.content);
        if (fields.has(ikey)) reachable.add(ikey);
      }
    }
  }

  const unfilled = [];
  for (const key of reachable) {
    const f = fields.get(key);
    if (!f) continue;
    if (f.type === 'text'     && f.value === '')                      unfilled.push(f);
    if (f.type === 'dropdown' && ((f.selected === -1 && !f.custom) ||
        (f.custom && (f.customValue || '').trim() === '')))            unfilled.push(f); // B2
    if (f.type === 'note'     && f.value === '')                      unfilled.push(f);
  }
  return unfilled;
}

/** Apply/clear yellow border highlights on form inputs for unfilled fields. */
function applyUnfilledHighlights(state) {
  const formEl = document.getElementById('draftForm');
  if (!formEl) return;
  // Clear existing highlights
  formEl.querySelectorAll('input[type="text"], select, textarea').forEach(el => {
    el.style.borderColor = '';
    el.style.background  = '';
  });
  // Highlight unfilled fields
  for (const f of getUnfilledFields(state)) {
    let el;
    if      (f.type === 'text')     el = formEl.querySelector(`input[data-key="${f.key}"][data-ftype="text"]`);
    else if (f.type === 'dropdown') el = f.custom                                              // B2
      ? formEl.querySelector(`input[data-ftype="custom"][data-key="${f.key}"]`)
      : formEl.querySelector(`select[data-key="${f.key}"]`);
    else if (f.type === 'note')     el = formEl.querySelector(`textarea[data-key="${f.key}"]`);
    if (el) { el.style.borderColor = 'var(--yellow, #fbbf24)'; el.style.background = 'var(--yellow-bg, #fffbeb)'; }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DRAFT INSTRUCTION — FORM RENDERER
// ═══════════════════════════════════════════════════════════════════════

function renderDraftForm(state) {
  const { fields } = state;
  const textFields    = [...fields.values()].filter(f => f.type === 'text');
  const connFields    = [...fields.values()].filter(f => f.type === 'connector');
  const dropFields    = [...fields.values()].filter(f => f.type === 'dropdown');
  const altFields     = [...fields.values()].filter(f => f.type === 'alternative');
  // Suppress standard optional elements that are paired with an alternative toggle
  const pairedOptKeys = new Set(altFields.map(f => f.pairedOptionalKey).filter(Boolean));
  const optFields     = [...fields.values()].filter(f => f.type === 'optional' && !pairedOptKeys.has(f.key));
  const noteFields    = [...fields.values()].filter(f => f.type === 'note');

  let html = '';

  if (textFields.length) {
    html += '<div class="draft-section"><div class="draft-section-label">Fill in the Blanks</div>';
    for (const f of textFields) {
      const id = 'df_' + f.key;
      html += `<div class="draft-field">
        <label for="${id}">${esc(f.label)}</label>
        <input type="text" id="${id}" data-key="${f.key}" data-ftype="text"
               value="${escAttr(f.value)}" placeholder="${escAttr(f.label)}…">
      </div>`;
    }
    html += '</div>';
  }

  if (connFields.length) {
    html += '<div class="draft-section"><div class="draft-section-label">Connectors</div>';
    for (const f of connFields) {
      html += `<div class="draft-field">
        <label class="draft-opt-label">
          <input type="checkbox" data-key="${f.key}" data-ftype="connector"${f.checked ? ' checked' : ''}>
          <span class="draft-opt-text" style="font-family:var(--mono);font-size:.82em">[${esc(f.label)}]</span>
        </label>
      </div>`;
    }
    html += '</div>';
  }

  if (dropFields.length) {
    html += '<div class="draft-section"><div class="draft-section-label">Select Alternatives</div>';
    for (const f of dropFields) {
      const id = 'df_' + f.key;
      if (f.custom) {
        // Render the custom text-input state
        html += `<div class="draft-field" id="dff_${f.key}">
          <label>${esc(f.label)}</label>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="text" data-key="${f.key}" data-ftype="custom"
                   value="${escAttr(f.customValue)}" placeholder="Type custom value\u2026"
                   style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:4px;font-family:var(--serif);font-size:.85em;color:var(--text)">
            <button type="button" class="btn-ghost" style="white-space:nowrap"
                    onclick="restoreDraftDropdown('${f.key}')">&#8592; back</button>
          </div>
        </div>`;
      } else {
        html += `<div class="draft-field" id="dff_${f.key}"><label for="${id}">${esc(f.label)}</label>
          <select id="${id}" data-key="${f.key}" data-ftype="dropdown">
            <option value="-1"${f.selected === -1 ? ' selected' : ''}>&#8212; select &#8212;</option>`;
        f.options.forEach((opt, i) => {
          const label = opt.startsWith('[') && opt.endsWith(']') ? opt.slice(1, -1).trim() : opt;
          html += `<option value="${i}"${i === f.selected ? ' selected' : ''}>${esc(label)}</option>`;
        });
        html += `<option value="__custom__">Custom\u2026</option>
          </select></div>`;
      }
    }
    html += '</div>';
  }

  if (altFields.length) {
    html += '<div class="draft-section"><div class="draft-section-label">Alternative Elements</div>';
    for (const f of altFields) {
      const raw = f.altText.replace(/\s+/g, ' ');
      const preview = raw.length > 60 ? raw.slice(0, 60) + '\u2026' : raw;
      html += `<div class="draft-field">
        <div style="font-family:var(--sans);font-size:.73em;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--navy);margin-bottom:6px">Element ${esc(f.elemNum)}</div>
        <label class="draft-opt-label" style="margin-bottom:7px">
          <input type="radio" name="alt_${f.key}" value="a"
                 data-key="${f.key}" data-ftype="alternative"${f.selected === 'a' ? ' checked' : ''}
                 style="margin-top:2px;flex-shrink:0;accent-color:var(--navy)">
          <span class="draft-opt-text">Standard element ${esc(f.elemNum)}</span>
        </label>
        <label class="draft-opt-label">
          <input type="radio" name="alt_${f.key}" value="b"
                 data-key="${f.key}" data-ftype="alternative"${f.selected === 'b' ? ' checked' : ''}
                 style="margin-top:2px;flex-shrink:0;accent-color:var(--navy)">
          <span class="draft-opt-text">Alternative: <em style="color:var(--muted)">${esc(preview)}</em></span>
        </label>
      </div>`;
    }
    html += '</div>';
  }

  if (optFields.length) {
    html += '<div class="draft-section"><div class="draft-section-label">Optional Elements</div>';
    for (const f of optFields) {
      html += `<div class="draft-field">
        <label class="draft-opt-label">
          <input type="checkbox" data-key="${f.key}" data-ftype="optional"${f.checked ? ' checked' : ''}>
          <span class="draft-opt-text">${esc(f.label)}</span>
        </label>
      </div>`;
    }
    html += '</div>';
  }

  if (noteFields.length) {
    html += '<div class="draft-section"><div class="draft-section-label">Drafting Notes</div>';
    for (const f of noteFields) {
      const id = 'df_' + f.key;
      html += `<div class="draft-field">
        <label for="${id}">${esc(f.label)}</label>
        <textarea id="${id}" data-key="${f.key}" data-ftype="note" rows="3"
                  placeholder="Enter text to insert…">${esc(f.value)}</textarea>
      </div>`;
    }
    html += '</div>';
  }

  const formEl = document.getElementById('draftForm');
  formEl.innerHTML = html || '<p style="color:var(--muted);font-style:italic;font-family:var(--sans);font-size:.85em">No fill-in placeholders found in this instruction.</p>';

  formEl.querySelectorAll('input[type="text"], select, textarea').forEach(el => {
    el.addEventListener('input', onDraftChange);
  });
  formEl.querySelectorAll('input[type="checkbox"]').forEach(el => {
    el.addEventListener('change', onDraftChange);
  });
  formEl.querySelectorAll('input[type="radio"]').forEach(el => {
    el.addEventListener('change', onDraftChange);
  });
  applyUnfilledHighlights(state);
}

function onDraftChange(e) {
  if (!draftState) return;
  const el = e.target, key = el.dataset.key, ftype = el.dataset.ftype;
  const f = draftState.fields.get(key);
  if (!f) return;
  if (ftype === 'text' || ftype === 'note') {
    f.value = el.value;
  } else if (ftype === 'custom') {
    f.customValue = el.value;
  } else if (ftype === 'dropdown') {
    if (el.value === '__custom__') { activateDraftCustom(key); return; }
    f.selected = parseInt(el.value, 10);
  } else if (ftype === 'optional' || ftype === 'connector') {
    f.checked = el.checked;
  } else if (ftype === 'alternative') {
    f.selected = el.value;
    // Auto-toggle paired standard optional: Option A = include standard, B = exclude it
    if (f.pairedOptionalKey) {
      const paired = draftState.fields.get(f.pairedOptionalKey);
      if (paired) {
        paired.checked = (el.value === 'a');
        const cb = document.querySelector(`input[data-key="${f.pairedOptionalKey}"][data-ftype="optional"]`);
        if (cb) cb.checked = paired.checked;
      }
    }
  }
  updateDraftPreview();
  renderPacketTray();
  applyUnfilledHighlights(draftState);
}

// ─ Custom dropdown → text input swap ──────────────────────────────────

function activateDraftCustom(key) {
  const f = draftState.fields.get(key);
  if (!f || f.type !== 'dropdown') return;
  f.custom = true;
  f.customValue = '';
  // Re-render just the dropdown section by rebuilding the whole form while
  // preserving all other field values — simplest way to get the custom
  // input wired up correctly.
  renderDraftForm(draftState);
  // Focus the newly rendered custom input for this key
  const input = document.querySelector(`input[data-key="${key}"][data-ftype="custom"]`);
  if (input) input.focus();
  updateDraftPreview();
}

function restoreDraftDropdown(key) {
  const f = draftState && draftState.fields.get(key);
  if (!f) return;
  f.custom = false;
  f.customValue = '';
  f.selected = -1;
  renderDraftForm(draftState);
  updateDraftPreview();
}

function updateDraftPreview() {
  if (!draftState) return;
  const el = document.getElementById('draftPreview');
  el.style.color = '';
  el.style.fontStyle = '';
  const num = document.getElementById('draftCaciNum')?.value.trim() || '';
  const titleMatch = draftState.rawText.match(/^\d{3,4}\s*\.\s*([^\[\n]+)/);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const bodyText = compileInstruction(draftState);

  el.innerHTML = '';

  if (num && title) {
    const headingEl = document.createElement('div');
    headingEl.className = 'draft-preview-heading';
    headingEl.textContent = `CACI ${num}: ${title}`;
    el.appendChild(headingEl);
  }

  const bodyEl = document.createElement('div');
  bodyEl.className = 'draft-preview-body';
  bodyEl.innerHTML = '';
  const paragraphs = bodyText.split(/\n+/).filter(p => p.trim());
  for (const para of paragraphs) {
    const p = document.createElement('p');
    p.className = 'draft-para';
    p.textContent = para.trim();
    bodyEl.appendChild(p);
  }
  el.appendChild(bodyEl);

  // Update unfilled status line
  const statusEl = document.getElementById('draftUnfilledStatus');
  if (statusEl) {
    const unfilled = getUnfilledFields(draftState);
    const hasTracked = [...draftState.fields.values()].some(
      f => f.type === 'text' || f.type === 'dropdown' || f.type === 'note'
    );
    if (unfilled.length > 0) {
      let labels = unfilled.map(f => f.label).join(', ');
      if (labels.length > 80) labels = labels.slice(0, 80) + '\u2026';
      statusEl.textContent = `\u26A0 ${unfilled.length} unfilled field(s): ${labels}`;
      statusEl.className = 'warn';
    } else if (hasTracked) {
      statusEl.textContent = '\u2713 All fields filled';
      statusEl.className = 'ok';
    } else {
      statusEl.textContent = '';
      statusEl.className = '';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DRAFT INSTRUCTION — LOAD & COPY
// ═══════════════════════════════════════════════════════════════════════

document.getElementById('loadDraftBtn').addEventListener('click', () => {
  const numEl    = document.getElementById('draftCaciNum');
  const num      = numEl.value.trim() || document.getElementById('caciNumber').value.trim();
  const statusEl = document.getElementById('draftLoadStatus');

  if (!num) {
    statusEl.textContent = 'Enter a CACI number first.';
    statusEl.className   = 'status err';
    return;
  }

  try {
    const text = lookupCACITextForDraft(num);
    draftState = parseInstruction(text);
    activePacketId = null;
    renderPacketTray();
    renderDraftForm(draftState);
    updateDraftPreview();
    document.getElementById('draftWorkspace').classList.remove('hidden');
    if (!numEl.value.trim()) numEl.value = num;
    statusEl.textContent = `✓ Loaded CACI ${num}`;
    statusEl.className   = 'status ok';
  } catch (err) {
    statusEl.textContent = 'Error: ' + err.message;
    statusEl.className   = 'status err';
  }
});

document.getElementById('draftCaciNum').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loadDraftBtn').click();
});

document.getElementById('addToPacketBtn').addEventListener('click', () => {
  if (!draftState) return;
  const caciNum  = document.getElementById('draftCaciNum').value.trim();
  if (!caciNum) return;
  const statusEl = document.getElementById('addToPacketStatus');
  if (activePacketId !== null) {
    statusEl.textContent = 'Already in packet';
    statusEl.className   = 'status';
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
    return;
  }
  const label = document.getElementById('addToPacketLabel').value.trim();
  packetInstructions.push({ id: ++packetIdCounter, caciNum, label, parsedState: draftState });
  activePacketId = packetIdCounter;
  document.getElementById('addToPacketLabel').value = '';
  renderPacketTray();
  statusEl.textContent = '\u2713 Added to packet';
  statusEl.className   = 'status ok';
  setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 3000);
});

/**
 * Reset lock/edit mode to the default unlocked state (B1).
 * Called before every instruction load, packet load, case load,
 * case import, and clear-all path so stale locked text cannot
 * bleed into a new instruction.
 */
function resetDraftLockState() {
  const ws      = document.getElementById('draftWorkspace');
  if (!ws) return;
  const preview  = document.getElementById('draftPreview');
  const editArea = document.getElementById('draftEditArea');
  const lockBtn  = document.getElementById('lockEditBtn');
  const warning  = document.getElementById('draftLockWarning');
  ws.classList.remove('draft-locked');
  if (editArea) { editArea.value = ''; editArea.classList.add('hidden'); }
  if (preview)  preview.classList.remove('hidden');
  if (lockBtn)  lockBtn.textContent = 'Lock & Edit';
  if (warning)  warning.classList.add('hidden');
}

function getDraftText() {
  const ws = document.getElementById('draftWorkspace');
  if (ws.classList.contains('draft-locked')) {
    return document.getElementById('draftEditArea').value;
  }
  const headingEl = document.querySelector('#draftPreview .draft-preview-heading');
  const paras     = document.querySelectorAll('#draftPreview .draft-para');
  const heading   = headingEl ? headingEl.textContent.trim() + '\n\n' : '';
  const body      = [...paras].map(p => p.textContent.trim()).join('\n\n');
  return heading + body;
}

document.getElementById('lockEditBtn').addEventListener('click', () => {
  const ws      = document.getElementById('draftWorkspace');
  const preview = document.getElementById('draftPreview');
  const editArea = document.getElementById('draftEditArea');
  const lockBtn  = document.getElementById('lockEditBtn');
  const warning  = document.getElementById('draftLockWarning');

  if (!ws.classList.contains('draft-locked')) {
    // Lock: capture compiled text, switch to textarea
    editArea.value = getDraftText();
    preview.classList.add('hidden');
    editArea.classList.remove('hidden');
    ws.classList.add('draft-locked');
    lockBtn.textContent = 'Unlock Form';
    warning.classList.remove('hidden');
  } else {
    // Unlock: restore live preview (pre-edit compiled state), re-enable form
    editArea.classList.add('hidden');
    preview.classList.remove('hidden');
    ws.classList.remove('draft-locked');
    lockBtn.textContent = 'Lock & Edit';
    warning.classList.add('hidden');
  }
});

document.getElementById('copyDraftBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(getDraftText()).then(() => {
    const btn  = document.getElementById('copyDraftBtn');
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
});

// ── Draft tab: Export DOCX helper functions ──────────────────

// Returns the heading string from the draft preview heading element
function getDraftHeading() {
  const el = document.querySelector('#draftPreview .draft-preview-heading');
  return el ? el.textContent.trim() : '';
}

// Returns the body text with paragraphs separated by \n\n
function getDraftBodyText() {
  const paras = document.querySelectorAll('#draftPreview .draft-para');
  return [...paras].map(p => p.textContent.trim()).join('\n\n');
}

// ── Draft tab: Export picker ──────────────────────────────────
document.getElementById('exportDraftBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('exportDraftPicker').classList.toggle('hidden');
});

document.getElementById('exportDraftPicker').addEventListener('click', e => {
  const fmt = e.target.dataset.fmt;
  if (!fmt) return;
  document.getElementById('exportDraftPicker').classList.add('hidden');
  const num      = document.getElementById('draftCaciNum')?.value.trim() || '';
  const dateSlug = new Date().toISOString().slice(0, 10);

  // When locked, the preview is hidden — derive heading and body from getDraftText()
  // so post-edit textarea content is exported. When unlocked, use the DOM helpers.
  const ws     = document.getElementById('draftWorkspace');
  const locked = ws.classList.contains('draft-locked');
  let heading, body;
  if (locked) {
    const fullText   = getDraftText();
    const firstBlank = fullText.indexOf('\n\n');
    if (firstBlank !== -1) {
      heading = fullText.slice(0, firstBlank).trim();
      body    = fullText.slice(firstBlank + 2).trim();
    } else {
      heading = fullText.trim();
      body    = '';
    }
  } else {
    heading = getDraftHeading();
    body    = getDraftBodyText();
  }

  if (fmt === 'docx') {
    const filename = num ? `CACI-${num}-${dateSlug}.docx` : `CACI-draft-${dateSlug}.docx`;
    exportDOCX({ type: 'instruction', heading, body }, filename);
  } else if (fmt === 'txt') {
    const filename = num ? `CACI-${num}-${dateSlug}.txt` : `CACI-draft-${dateSlug}.txt`;
    downloadTXT(getDraftText(), filename);
  }
});
