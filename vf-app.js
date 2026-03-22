'use strict';

// ═══════════════════════════════════════════════════════════════════════
// DATA & STATE
// ═══════════════════════════════════════════════════════════════════════

let vfForms        = [];   // all working forms for the session
let activeVfFormId = null; // id of the currently displayed form
let vfUidCounter   = 0;    // monotonic uid counter — never reset
let vfFormIdCtr    = 0;    // form id counter

let vfOpenEditorUid = null; // uid of question with inline editor open
let vfDragSrcIndex  = null; // source index for current drag operation

function nextUid()    { return 'vfq_' + (++vfUidCounter); }
function nextFormId() { return 'vf_'  + (++vfFormIdCtr);  }

function activeWorkingForm() {
  return vfForms.find(f => f.id === activeVfFormId) || null;
}

// ═══════════════════════════════════════════════════════════════════════
// WORKING FORM STATE
// ═══════════════════════════════════════════════════════════════════════

function newBlankForm(name) {
  return {
    id:       nextFormId(),
    name:     name || 'New Verdict Form',
    caption:  { court: '', caseName: '', caseNumber: '', dept: '' },
    parties:  { plaintiff: '', defendant: '' },
    questions: []
  };
}

/** Escape regex metacharacters in a string (A5). */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace [name of KEY] placeholders with party values wherever non-empty. */
function substituteParties(text, parties) {
  let out = text;
  for (const key of Object.keys(parties)) {
    const val = parties[key];
    if (val) {
      out = out.replace(new RegExp('\\[name of ' + escapeRegex(key) + '\\]', 'gi'), val);
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT PALETTE
// ═══════════════════════════════════════════════════════════════════════

function renderPalette() {
  const listEl = document.getElementById('vfPaletteList');
  if (!listEl) return;

  const groups = (typeof vfDB !== 'undefined' && vfDB.groups) ? vfDB.groups : [];
  if (!groups.length) {
    listEl.innerHTML = '<p style="font-family:var(--sans);font-size:.78em;color:var(--muted)">No components available.</p>';
    return;
  }

  // Collect categories in order of first appearance
  const catOrder = [];
  const byCategory = {};
  for (const group of groups) {
    const cat = group.category || 'general';
    if (!byCategory[cat]) { byCategory[cat] = []; catOrder.push(cat); }
    byCategory[cat].push(group);
  }

  let html = '';
  for (const cat of catOrder) {
    const catLabel = cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const catId    = 'vfcat-' + cat;
    html += `<div class="vf-palette-group">
      <div class="vf-palette-group-title" data-toggle="${catId}-body">
        <span>${catLabel}</span><span class="vf-toggle-arrow" data-for="${catId}-body">▸</span>
      </div>
      <div class="vf-palette-group-body" id="${catId}-body" style="display:none">`;
    for (const group of byCategory[cat]) {
      const subId = 'vfsub-' + group.id;
      const titlePreview = escHtml(group.title).substring(0, 60);
      html += `<div class="vf-palette-subgroup">
        <div class="vf-palette-subgroup-title" data-toggle="${subId}-body">
          <span style="font-weight:600">${escHtml(group.id)}</span>
          <span style="margin-left:6px;opacity:.7">${titlePreview}</span>
          <span class="vf-toggle-arrow" data-for="${subId}-body" style="margin-left:auto">▸</span>
        </div>
        <div id="${subId}-body" style="display:none">`;
      for (const q of group.questions) {
        const preview = q.text.replace(/\[.*?\]/g, '[…]').substring(0, 55);
        html += `<div class="vf-palette-item">
          <div style="min-width:0;flex:1">
            <div class="vf-palette-item-type">${typeBadgeLabel(q.type)}</div>
            <div class="vf-palette-item-text" title="${escHtml(q.text)}">${escHtml(preview)}</div>
          </div>
          <button class="btn-secondary"
            style="padding:2px 8px;font-size:.72em;white-space:nowrap;flex-shrink:0"
            data-pal-group="${escHtml(group.id)}" data-pal-qid="${escHtml(q.id)}">+ Add</button>
        </div>`;
      }
      html += `</div></div>`;
    }
    html += `</div></div>`;
  }

  listEl.innerHTML = html;

  // Collapse toggles (works for both category and subgroup levels)
  listEl.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      const targetId = el.dataset.toggle;
      const body  = document.getElementById(targetId);
      const arrow = listEl.querySelector(`.vf-toggle-arrow[data-for="${targetId}"]`);
      const hide  = body.style.display !== 'none';
      body.style.display = hide ? 'none' : '';
      if (arrow) arrow.textContent = hide ? '▸' : '▾';
    });
  });

  // Add buttons
  listEl.querySelectorAll('[data-pal-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      addQuestionFromPalette(btn.dataset.palGroup, btn.dataset.palQid);
    });
  });
}

function addQuestionFromPalette(groupId, sourceQid) {
  if (typeof vfDB === 'undefined') return;
  const form  = activeWorkingForm();
  if (!form) return;

  const group   = vfDB.groups.find(g => g.id === groupId);
  if (!group) return;
  const sourceQ = group.questions.find(q => q.id === sourceQid);
  if (!sourceQ) return;

  closeEditorIfOpen();

  // Build uid map: source_id → uid for questions from this group already in form
  const uidMap = {};
  for (const q of form.questions) {
    if (q.source_group === groupId) uidMap[q.source_id] = q.uid;
  }
  const newUid = nextUid();
  uidMap[sourceQid] = newUid;

  // Deep-copy and translate
  const block = JSON.parse(JSON.stringify(sourceQ));
  block.uid          = newUid;
  block.source_group = groupId;
  block.source_id    = sourceQid;
  if (block.if_yes     != null) block.if_yes     = translateRouting(block.if_yes,     uidMap, groupId);
  if (block.if_no      != null) block.if_no      = translateRouting(block.if_no,      uidMap, groupId);
  if (block.if_done    != null) block.if_done    = translateRouting(block.if_done,    uidMap, groupId);
  if (block.if_none    != null) block.if_none    = translateRouting(block.if_none,    uidMap, groupId);
  if (block.if_any_yes != null) block.if_any_yes = translateRouting(block.if_any_yes, uidMap, groupId);
  if (block.if_all_no  != null) block.if_all_no  = translateRouting(block.if_all_no,  uidMap, groupId);

  form.questions.push(block);
  normalizeRoutes(form);
  renderBuilder();
  renderPreview();
}

/**
 * Map a source routing id to a uid (A1).
 * If the target is not yet in the form, store a deferred sentinel
 * "__src__:{groupId}:{sourceId}" instead of silently collapsing to "sign".
 */
function translateRouting(val, uidMap, groupId) {
  if (val === 'stop' || val === 'sign') return val;
  return uidMap[val] || '__src__:' + groupId + ':' + val;
}

/**
 * Resolve any deferred "__src__:..." route sentinels to live UIDs (A1/A2).
 * Called after every add, delete, reorder, import, and load operation.
 * Sentinels that cannot yet resolve are left in place.
 * Routes pointing to UIDs no longer in the form are left as-is;
 * routingLabel() and routingText() surface them as [BROKEN].
 */
function normalizeRoutes(form) {
  const qs = form.questions;
  const srcMap = {};
  for (const q of qs) {
    if (q.source_group && q.source_id && q.source_group !== 'custom') {
      srcMap[q.source_group + ':' + q.source_id] = q.uid;
    }
  }
  for (const q of qs) {
    for (const field of ['if_yes', 'if_no', 'if_done', 'if_none', 'if_any_yes', 'if_all_no']) {
      const val = q[field];
      if (typeof val === 'string' && val.startsWith('__src__:')) {
        const key = val.slice('__src__:'.length);
        if (srcMap[key]) q[field] = srcMap[key];
      }
    }
  }
}

function addCustomQuestion() {
  const form = activeWorkingForm();
  if (!form) return;
  closeEditorIfOpen();

  const uid = nextUid();
  form.questions.push({
    uid,
    source_group: 'custom',
    source_id:    'custom',
    type:         'yes_no',
    text:         '',
    fields:       [],
    if_yes:       'sign',
    if_no:        'stop',
    stop_text:    ''
  });

  renderBuilder();
  renderPreview();
  openEditor(uid);
}

// ═══════════════════════════════════════════════════════════════════════
// FORM BUILDER
// ═══════════════════════════════════════════════════════════════════════

function typeBadgeLabel(type) {
  switch (type) {
    case 'yes_no':       return 'YES/NO';
    case 'yes_no_multi': return 'YES/NO (MULTI)';
    case 'damages':      return 'DAMAGES';
    case 'percentage':   return '%';
    case 'write_in':     return 'WRITE-IN';
    case 'select_one':   return 'SELECT ONE';
    default:             return type ? type.toUpperCase() : '?';
  }
}

function escHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function uidToDisplayNum(uid, questions) {
  const idx = questions.findIndex(q => q.uid === uid);
  return idx >= 0 ? idx + 1 : null;
}

function routingLabel(val, questions) {
  if (!val || val === 'sign') return 'Sign';
  if (val === 'stop') return 'Stop';
  if (typeof val === 'string' && val.startsWith('__src__:')) return '[PENDING]';
  const n = uidToDisplayNum(val, questions);
  return n != null ? 'Q' + n : '[BROKEN]';
}

function renderBuilder() {
  const listEl = document.getElementById('vfQuestionList');
  if (!listEl) return;
  const form = activeWorkingForm();

  if (!form || !form.questions.length) {
    listEl.innerHTML = '<p style="font-family:var(--sans);font-size:.8em;color:var(--muted);font-style:italic;padding:14px 0">No questions yet. Use the palette to add questions.</p>';
    return;
  }

  const qs   = form.questions;
  let   html = '';

  qs.forEach((q, idx) => {
    const num         = idx + 1;
    const subText     = substituteParties(q.text || '', form.parties);
    const preview     = subText.substring(0, 80) + (subText.length > 80 ? '…' : '');
    const badge       = typeBadgeLabel(q.type);
    const isEditing   = vfOpenEditorUid === q.uid;

    let routing = '';
    if (q.type === 'yes_no') {
      routing = `Yes → ${routingLabel(q.if_yes, qs)}  |  No → ${routingLabel(q.if_no, qs)}`;
    } else if (q.type === 'yes_no_multi') {
      routing = `Any Yes → ${routingLabel(q.if_any_yes, qs)}  |  All No → ${routingLabel(q.if_all_no, qs)}`;
    } else if (q.if_done) {
      routing = `Done → ${routingLabel(q.if_done, qs)}`;
    }

    const optionalStyle = q.optional ? 'border:2px dashed var(--muted);opacity:.85' : '';
    html += `<div class="vf-q-block" data-uid="${escHtml(q.uid)}" data-idx="${idx}" draggable="true"${optionalStyle ? ` style="${optionalStyle}"` : ''}>
      <span class="vf-q-drag" title="Drag to reorder">⠿</span>
      <div class="vf-q-body">
        <div>
          <span class="vf-q-type-badge">${badge}</span>
          ${q.optional ? '<span style="font-family:var(--sans);font-size:.62em;color:var(--muted);margin-left:4px;border:1px solid var(--muted);border-radius:3px;padding:0 4px">[optional]</span>' : ''}
          <span style="font-family:var(--sans);font-size:.7em;color:var(--muted);margin-left:6px">#${num}</span>
          ${q.source_group && q.source_group !== 'custom' ? `<span style="font-family:var(--sans);font-size:.65em;color:var(--muted);margin-left:6px;opacity:.7">${escHtml(q.source_group)}</span>` : ''}
        </div>
        <div class="vf-q-preview-text">${escHtml(preview)}</div>
        ${routing ? `<div class="vf-q-routing">${escHtml(routing)}</div>` : ''}
      </div>
      <div class="vf-q-actions">
        <button class="btn-ghost" data-edit="${escHtml(q.uid)}" title="Edit">✎</button>
        <button class="btn-ghost" data-del="${escHtml(q.uid)}"  title="Delete">×</button>
      </div>
    </div>`;

    if (isEditing) html += buildInlineEditorHTML(q, form);
  });

  listEl.innerHTML = html;

  // ── Drag-and-drop ────────────────────────────────────────────────
  listEl.querySelectorAll('.vf-q-block').forEach(block => {
    const idx = parseInt(block.dataset.idx, 10);

    block.addEventListener('dragstart', e => {
      vfDragSrcIndex = idx;
      block.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    block.addEventListener('dragend', () => {
      block.classList.remove('dragging');
      listEl.querySelectorAll('.vf-q-block').forEach(b => b.classList.remove('drag-over'));
    });
    block.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      listEl.querySelectorAll('.vf-q-block').forEach(b => b.classList.remove('drag-over'));
      block.classList.add('drag-over');
    });
    block.addEventListener('drop', e => {
      e.preventDefault();
      block.classList.remove('drag-over');
      const f = activeWorkingForm();
      if (!f || vfDragSrcIndex == null) return;
      const target = parseInt(block.dataset.idx, 10);
      if (vfDragSrcIndex === target) { vfDragSrcIndex = null; return; }
      const [moved] = f.questions.splice(vfDragSrcIndex, 1);
      f.questions.splice(target, 0, moved);
      vfDragSrcIndex = null;
      normalizeRoutes(f);
      closeEditorIfOpen();
      renderBuilder();
      renderPreview();
    });
  });

  // ── Edit / Delete ─────────────────────────────────────────────────
  listEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.edit;
      vfOpenEditorUid === uid ? closeEditorIfOpen() : openEditor(uid);
    });
  });

  listEl.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = activeWorkingForm();
      if (!f) return;
      closeEditorIfOpen();
      f.questions = f.questions.filter(q => q.uid !== btn.dataset.del);
      normalizeRoutes(f);
      renderBuilder();
      renderPreview();
    });
  });

  // ── Inline editor events ──────────────────────────────────────────
  if (vfOpenEditorUid) wireEditorEvents();
}

// ═══════════════════════════════════════════════════════════════════════
// INLINE EDITOR
// ═══════════════════════════════════════════════════════════════════════

function openEditor(uid) {
  vfOpenEditorUid = uid;
  renderBuilder();
  const el = document.getElementById('vfed-' + uid);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeEditorIfOpen() {
  if (!vfOpenEditorUid) return;
  vfOpenEditorUid = null;
  renderBuilder();
}

function buildRoutingOptions(excludeUid, questions, selected, includeStop = true) {
  let opts = '';
  questions.forEach((q, idx) => {
    if (q.uid === excludeUid) return;
    const sel = selected === q.uid ? ' selected' : '';
    opts += `<option value="${escHtml(q.uid)}"${sel}>Q${idx + 1}: ${escHtml(q.text.substring(0, 40))}</option>`;
  });
  opts += `<option value="sign"${selected === 'sign' ? ' selected' : ''}>Sign (end of form)</option>`;
  if (includeStop) {
    opts += `<option value="stop"${selected === 'stop' ? ' selected' : ''}>Stop (directed verdict)</option>`;
  }
  return opts;
}

function buildInlineEditorHTML(q, form) {
  const qs    = form.questions;
  const uid   = q.uid;
  const types = [
    { v: 'yes_no',       l: 'Yes/No'         },
    { v: 'yes_no_multi', l: 'Yes/No (Multi)' },
    { v: 'damages',      l: 'Damages'        },
    { v: 'percentage',   l: '%'              },
    { v: 'write_in',     l: 'Write-in'       },
    { v: 'select_one',   l: 'Select One'     },
  ];

  const typeRadios = types.map(t =>
    `<label style="display:inline-flex;align-items:center;gap:4px;margin-right:14px;cursor:pointer;font-weight:normal">
      <input type="radio" name="vfqtype_${uid}" value="${t.v}"${q.type === t.v ? ' checked' : ''}>
      ${t.l}
    </label>`
  ).join('');

  let typeFields = '';

  if (q.type === 'yes_no') {
    const showStop = q.if_no === 'stop';
    const hasAlt   = !!(q.alt_text);
    typeFields = `
      <div style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.82em">
          <input type="checkbox" data-ed-toggle="alt_text" ${hasAlt ? 'checked' : ''}
            style="accent-color:var(--navy);cursor:pointer">
          Alternative formulation
        </label>
      </div>
      <div id="vfed-alt-${uid}" style="${hasAlt ? '' : 'display:none;'}margin-bottom:8px">
        <label style="display:block">Alternative text</label>
        <textarea data-ed-field="alt_text" rows="2"
          style="width:100%;font-family:var(--serif);font-size:.83em">${escHtml(q.alt_text || '')}</textarea>
      </div>
      <div class="vf-routing-row">
        <div>
          <label style="display:block">If Yes →</label>
          <select data-ed-field="if_yes" style="width:100%">${buildRoutingOptions(uid, qs, q.if_yes)}</select>
        </div>
        <div>
          <label style="display:block">If No →</label>
          <select data-ed-field="if_no" style="width:100%">${buildRoutingOptions(uid, qs, q.if_no)}</select>
        </div>
      </div>
      <div id="vfed-stop-${uid}" style="margin-top:8px${showStop ? '' : ';display:none'}">
        <label style="display:block">Stop text</label>
        <textarea data-ed-field="stop_text" rows="2"
          style="width:100%;font-family:var(--serif);font-size:.83em">${escHtml(q.stop_text || '')}</textarea>
      </div>`;

  } else if (q.type === 'damages') {
    let rows = '';
    const items = q.line_items || [];
    items.forEach((item, i) => {
      rows += `<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center">
        <input type="text" data-ed-li="${i}" value="${escHtml(item.label)}"
          style="flex:1;font-family:var(--serif);font-size:.83em;padding:4px 8px;border:1px solid var(--border);border-radius:3px;font-weight:700">
        <button class="btn-ghost" data-ed-li-up="${i}" title="Move up" style="padding:2px 5px;font-size:.7em"${i === 0 ? ' disabled' : ''}>&#x25B2;</button>
        <button class="btn-ghost" data-ed-li-down="${i}" title="Move down" style="padding:2px 5px;font-size:.7em"${i === items.length - 1 ? ' disabled' : ''}>&#x25BC;</button>
        <button class="btn-ghost" data-ed-li-addchild="${i}" title="Add sub-item" style="padding:2px 6px;font-size:.7em">+&#x25BF;</button>
        <button class="btn-ghost" data-ed-li-del="${i}" style="padding:2px 8px;font-size:.8em">×</button>
      </div>`;
      if (item.children) {
        item.children.forEach((child, j) => {
          rows += `<div style="display:flex;gap:4px;margin-bottom:3px;margin-left:24px;align-items:center">
            <input type="text" data-ed-child="${i}-${j}" value="${escHtml(child.label)}"
              style="flex:1;font-family:var(--serif);font-size:.8em;padding:3px 7px;border:1px solid var(--border);border-radius:3px">
            <button class="btn-ghost" data-ed-child-up="${i}-${j}" title="Move up" style="padding:2px 5px;font-size:.65em"${j === 0 ? ' disabled' : ''}>&#x25B2;</button>
            <button class="btn-ghost" data-ed-child-down="${i}-${j}" title="Move down" style="padding:2px 5px;font-size:.65em"${j === item.children.length - 1 ? ' disabled' : ''}>&#x25BC;</button>
            <button class="btn-ghost" data-ed-child-del="${i}-${j}" style="padding:2px 8px;font-size:.75em">×</button>
          </div>`;
        });
      }
    });
    typeFields = `
      <div id="vfed-lilist-${uid}">${rows}</div>
      <button class="btn-ghost" id="vfed-liadd-${uid}" style="font-size:.78em;margin-top:4px">+ Add line item</button>`;

  } else if (q.type === 'percentage') {
    const pItems = q.parties || [];
    const rows = pItems.map((p, i) =>
      `<div style="display:flex;gap:4px;margin-bottom:5px;align-items:center">
        <input type="text" data-ed-party="${i}" value="${escHtml(p.label)}"
          style="flex:1;font-family:var(--serif);font-size:.83em;padding:4px 8px;border:1px solid var(--border);border-radius:3px">
        <button class="btn-ghost" data-ed-party-up="${i}" title="Move up" style="padding:2px 5px;font-size:.7em"${i === 0 ? ' disabled' : ''}>&#x25B2;</button>
        <button class="btn-ghost" data-ed-party-down="${i}" title="Move down" style="padding:2px 5px;font-size:.7em"${i === pItems.length - 1 ? ' disabled' : ''}>&#x25BC;</button>
        <button class="btn-ghost" data-ed-party-del="${i}" style="padding:2px 8px;font-size:.8em">×</button>
      </div>`
    ).join('');
    typeFields = `
      <div id="vfed-plist-${uid}">${rows}</div>
      <button class="btn-ghost" id="vfed-padd-${uid}" style="font-size:.78em;margin-top:4px">+ Add party</button>`;

  } else if (q.type === 'yes_no_multi') {
    const subjects = q.subjects || [];
    const subjRows = subjects.map((s, i) =>
      `<div style="display:flex;gap:4px;margin-bottom:5px;align-items:center">
        <input type="text" data-ed-subj="${i}" value="${escHtml(s.label)}"
          style="flex:1;font-family:var(--serif);font-size:.83em;padding:4px 8px;border:1px solid var(--border);border-radius:3px">
        <button class="btn-ghost" data-ed-subj-up="${i}" title="Move up" style="padding:2px 5px;font-size:.7em"${i === 0 ? ' disabled' : ''}>&#x25B2;</button>
        <button class="btn-ghost" data-ed-subj-down="${i}" title="Move down" style="padding:2px 5px;font-size:.7em"${i === subjects.length - 1 ? ' disabled' : ''}>&#x25BC;</button>
        <button class="btn-ghost" data-ed-subj-del="${i}" style="padding:2px 8px;font-size:.8em">×</button>
      </div>`
    ).join('');
    const showMultiStop = q.if_all_no === 'stop';
    typeFields = `
      <div style="margin-bottom:6px;font-family:var(--sans);font-size:.75em;color:var(--muted)">
        Use [subject] in the question text as a placeholder for each subject name.
      </div>
      <div id="vfed-subjlist-${uid}">${subjRows}</div>
      <button class="btn-ghost" id="vfed-subjadd-${uid}" style="font-size:.78em;margin-top:4px">+ Add subject</button>
      <div class="vf-routing-row" style="margin-top:8px">
        <div>
          <label style="display:block">If any Yes →</label>
          <select data-ed-field="if_any_yes" style="width:100%">${buildRoutingOptions(uid, qs, q.if_any_yes)}</select>
        </div>
        <div>
          <label style="display:block">If all No →</label>
          <select data-ed-field="if_all_no" style="width:100%">${buildRoutingOptions(uid, qs, q.if_all_no)}</select>
        </div>
      </div>
      <div id="vfed-multistop-${uid}" style="margin-top:8px${showMultiStop ? '' : ';display:none'}">
        <label style="display:block">Stop text</label>
        <textarea data-ed-field="stop_text" rows="2"
          style="width:100%;font-family:var(--serif);font-size:.83em">${escHtml(q.stop_text || '')}</textarea>
      </div>`;
  }

  if (q.type === 'select_one') {
    const opts = q.options || [];
    const optRows = opts.map((o, i) =>
      `<div style="display:flex;gap:4px;margin-bottom:5px;align-items:center">
        <textarea data-ed-opt="${i}" rows="2"
          style="flex:1;font-family:var(--serif);font-size:.83em;padding:4px 8px;border:1px solid var(--border);border-radius:3px">${escHtml(o)}</textarea>
        <button class="btn-ghost" data-ed-opt-del="${i}" style="padding:2px 8px;font-size:.8em">\u00d7</button>
      </div>`
    ).join('');
    typeFields += `
      <div style="margin-bottom:6px;font-family:var(--sans);font-size:.75em;color:var(--muted)">
        Each option is a selectable choice on the verdict form.
      </div>
      <div id="vfed-optlist-${uid}">${optRows}</div>
      <button class="btn-ghost" id="vfed-optadd-${uid}" style="font-size:.78em;margin-top:4px">+ Add option</button>`;
  }

  // if_done routing for non-yes_no types ("stop" not supported for these — A4)
  if (q.type !== 'yes_no' && q.type !== 'yes_no_multi') {
    const doneLabel = (q.type === 'damages' && q.if_none != null) ? 'If damages proved →' : 'When done →';
    typeFields += `
      <div style="margin-top:8px">
        <label style="display:block">${doneLabel}</label>
        <select data-ed-field="if_done" style="width:200px">${buildRoutingOptions(uid, qs, q.if_done || 'sign', false)}</select>
      </div>`;
    if (q.type === 'damages') {
      typeFields += `
        <div style="margin-top:6px">
          <label style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" data-ed-toggle="if_none" ${q.if_none != null ? 'checked' : ''}
              style="accent-color:var(--navy);cursor:pointer">
            Conditional routing (if no damages proved)
          </label>
        </div>`;
      if (q.if_none != null) {
        typeFields += `
          <div style="margin-top:4px">
            <label style="display:block">If no damages →</label>
            <select data-ed-field="if_none" style="width:200px">${buildRoutingOptions(uid, qs, q.if_none, true)}</select>
          </div>`;
      }
    }
  }

  return `
    <div class="vf-inline-editor" id="vfed-${uid}">
      <div style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.82em">
          <input type="checkbox" data-ed-toggle="optional" ${q.optional ? 'checked' : ''}
            style="accent-color:var(--navy);cursor:pointer">
          Optional (include only if this issue is at play)
        </label>
      </div>
      <div style="margin-bottom:8px">
        <label style="display:block;margin-bottom:5px">Question type</label>
        <div>${typeRadios}</div>
      </div>
      <div style="margin-bottom:8px">
        <label style="display:block">Question text</label>
        <textarea data-ed-field="text" rows="3"
          style="width:100%;font-family:var(--serif);font-size:.85em">${escHtml(q.text)}</textarea>
      </div>
      ${typeFields}
      <div style="margin-top:12px;text-align:right">
        <button class="btn-secondary" id="vfed-done-${uid}"
          style="font-size:.82em;padding:5px 18px">Done</button>
      </div>
    </div>`;
}

function wireEditorEvents() {
  const form = activeWorkingForm();
  if (!form) return;
  const q   = form.questions.find(x => x.uid === vfOpenEditorUid);
  if (!q)   return;
  const el  = document.getElementById('vfed-' + q.uid);
  if (!el)  return;
  const uid = q.uid;

  // Type radio
  el.querySelectorAll(`input[name="vfqtype_${uid}"]`).forEach(radio => {
    radio.addEventListener('change', () => {
      const prev = q.type;
      q.type = radio.value;
      if (q.type === 'yes_no') {
        q.if_yes    = q.if_yes  || 'sign';
        q.if_no     = q.if_no   || 'stop';
        q.stop_text = q.stop_text || '';
        delete q.if_done;
        delete q.if_any_yes; delete q.if_all_no; delete q.subjects;
      } else if (q.type === 'yes_no_multi') {
        if (!q.subjects) q.subjects = [];
        q.if_any_yes = q.if_any_yes || 'sign';
        q.if_all_no  = q.if_all_no  || 'stop';
        q.stop_text  = q.stop_text  || '';
        delete q.if_yes; delete q.if_no; delete q.if_done;
      } else {
        q.if_done = q.if_done || 'sign';
        delete q.if_yes; delete q.if_no;
        delete q.if_any_yes; delete q.if_all_no; delete q.subjects;
        if (q.type !== 'damages') { delete q.if_none; delete q.stop_text; }
        if (q.type === 'damages'    && !q.line_items) q.line_items = [];
        if (q.type === 'percentage' && !q.parties)    q.parties    = [];
        if (q.type === 'select_one' && !q.options)    q.options    = [];
      }
      // Clean up alt_text when switching away from yes_no
      if (prev === 'yes_no' && q.type !== 'yes_no') delete q.alt_text;
      renderBuilder();
      renderPreview();
    });
  });

  // Text textarea (live preview update)
  const textArea = el.querySelector('[data-ed-field="text"]');
  if (textArea) {
    textArea.addEventListener('input', () => { q.text = textArea.value; renderPreview(); });
  }

  // Optional checkbox
  const optToggle = el.querySelector('[data-ed-toggle="optional"]');
  if (optToggle) {
    optToggle.addEventListener('change', () => {
      q.optional = optToggle.checked;
      renderBuilder();
      renderPreview();
    });
  }

  // Alt-text toggle (yes_no only)
  const altToggle = el.querySelector('[data-ed-toggle="alt_text"]');
  if (altToggle) {
    altToggle.addEventListener('change', () => {
      if (altToggle.checked) {
        q.alt_text = q.alt_text || '';
        const wrap = document.getElementById('vfed-alt-' + uid);
        if (wrap) wrap.style.display = '';
      } else {
        delete q.alt_text;
        const wrap = document.getElementById('vfed-alt-' + uid);
        if (wrap) wrap.style.display = 'none';
      }
      renderPreview();
    });
  }

  // Alt-text textarea (yes_no only)
  const altArea = el.querySelector('[data-ed-field="alt_text"]');
  if (altArea) {
    altArea.addEventListener('input', () => { q.alt_text = altArea.value; renderPreview(); });
  }

  // Damages: conditional routing toggle (if_none)
  const ifNoneToggle = el.querySelector('[data-ed-toggle="if_none"]');
  if (ifNoneToggle) {
    ifNoneToggle.addEventListener('change', () => {
      if (ifNoneToggle.checked) {
        q.if_none = 'stop';
      } else {
        delete q.if_none;
      }
      renderBuilder();
      renderPreview();
    });
  }

  // Routing selects (if_yes, if_no, if_done, if_none, if_any_yes, if_all_no)
  el.querySelectorAll('select[data-ed-field]').forEach(sel => {
    sel.addEventListener('change', () => {
      const field = sel.dataset.edField;
      q[field] = sel.value;
      if (field === 'if_no') {
        const wrap = document.getElementById('vfed-stop-' + uid);
        if (wrap) wrap.style.display = sel.value === 'stop' ? '' : 'none';
      }
      if (field === 'if_all_no') {
        const wrap = document.getElementById('vfed-multistop-' + uid);
        if (wrap) wrap.style.display = sel.value === 'stop' ? '' : 'none';
      }
      renderPreview();
    });
  });

  // stop_text textarea
  const stopArea = el.querySelector('[data-ed-field="stop_text"]');
  if (stopArea) {
    stopArea.addEventListener('input', () => { q.stop_text = stopArea.value; renderPreview(); });
  }

  // Damages: line item labels
  el.querySelectorAll('[data-ed-li]').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = parseInt(inp.dataset.edLi, 10);
      if (q.line_items && q.line_items[i] != null) {
        q.line_items[i].label = inp.value;
        renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-li-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edLiDel, 10);
      if (q.line_items) { q.line_items.splice(i, 1); renderBuilder(); renderPreview(); }
    });
  });
  el.querySelectorAll('[data-ed-li-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edLiUp, 10);
      if (i > 0 && q.line_items) {
        [q.line_items[i - 1], q.line_items[i]] = [q.line_items[i], q.line_items[i - 1]];
        renderBuilder(); renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-li-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edLiDown, 10);
      if (q.line_items && i < q.line_items.length - 1) {
        [q.line_items[i], q.line_items[i + 1]] = [q.line_items[i + 1], q.line_items[i]];
        renderBuilder(); renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-li-addchild]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edLiAddchild, 10);
      if (q.line_items && q.line_items[i]) {
        if (!q.line_items[i].children) q.line_items[i].children = [];
        q.line_items[i].children.push({ id: 'ch_' + Date.now(), label: '' });
        renderBuilder(); renderPreview();
      }
    });
  });
  // Damages: sub-item (child) labels
  el.querySelectorAll('[data-ed-child]').forEach(inp => {
    inp.addEventListener('input', () => {
      const [pi, ci] = inp.dataset.edChild.split('-').map(Number);
      if (q.line_items && q.line_items[pi] && q.line_items[pi].children && q.line_items[pi].children[ci] != null) {
        q.line_items[pi].children[ci].label = inp.value;
        renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-child-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [pi, ci] = btn.dataset.edChildDel.split('-').map(Number);
      if (q.line_items && q.line_items[pi] && q.line_items[pi].children) {
        q.line_items[pi].children.splice(ci, 1);
        renderBuilder(); renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-child-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [pi, ci] = btn.dataset.edChildUp.split('-').map(Number);
      const ch = q.line_items && q.line_items[pi] && q.line_items[pi].children;
      if (ch && ci > 0) {
        [ch[ci - 1], ch[ci]] = [ch[ci], ch[ci - 1]];
        renderBuilder(); renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-child-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [pi, ci] = btn.dataset.edChildDown.split('-').map(Number);
      const ch = q.line_items && q.line_items[pi] && q.line_items[pi].children;
      if (ch && ci < ch.length - 1) {
        [ch[ci], ch[ci + 1]] = [ch[ci + 1], ch[ci]];
        renderBuilder(); renderPreview();
      }
    });
  });
  const liAdd = document.getElementById('vfed-liadd-' + uid);
  if (liAdd) {
    liAdd.addEventListener('click', () => {
      if (!q.line_items) q.line_items = [];
      q.line_items.push({ id: 'li_' + Date.now(), label: '' });
      renderBuilder(); renderPreview();
    });
  }

  // Percentage: party labels
  el.querySelectorAll('[data-ed-party]').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = parseInt(inp.dataset.edParty, 10);
      if (q.parties && q.parties[i] != null) {
        q.parties[i].label = inp.value;
        renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-party-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edPartyDel, 10);
      if (q.parties) { q.parties.splice(i, 1); renderBuilder(); renderPreview(); }
    });
  });
  el.querySelectorAll('[data-ed-party-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edPartyUp, 10);
      if (i > 0 && q.parties) {
        [q.parties[i - 1], q.parties[i]] = [q.parties[i], q.parties[i - 1]];
        renderBuilder(); renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-party-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edPartyDown, 10);
      if (q.parties && i < q.parties.length - 1) {
        [q.parties[i], q.parties[i + 1]] = [q.parties[i + 1], q.parties[i]];
        renderBuilder(); renderPreview();
      }
    });
  });
  const pAdd = document.getElementById('vfed-padd-' + uid);
  if (pAdd) {
    pAdd.addEventListener('click', () => {
      if (!q.parties) q.parties = [];
      q.parties.push({ label: '' });
      renderBuilder(); renderPreview();
    });
  }

  // Yes/No Multi: subject labels
  el.querySelectorAll('[data-ed-subj]').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = parseInt(inp.dataset.edSubj, 10);
      if (q.subjects && q.subjects[i] != null) {
        q.subjects[i].label = inp.value;
        renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-subj-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edSubjDel, 10);
      if (q.subjects) { q.subjects.splice(i, 1); renderBuilder(); renderPreview(); }
    });
  });
  el.querySelectorAll('[data-ed-subj-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edSubjUp, 10);
      if (i > 0 && q.subjects) {
        [q.subjects[i - 1], q.subjects[i]] = [q.subjects[i], q.subjects[i - 1]];
        renderBuilder(); renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-subj-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edSubjDown, 10);
      if (q.subjects && i < q.subjects.length - 1) {
        [q.subjects[i], q.subjects[i + 1]] = [q.subjects[i + 1], q.subjects[i]];
        renderBuilder(); renderPreview();
      }
    });
  });
  const subjAdd = document.getElementById('vfed-subjadd-' + uid);
  if (subjAdd) {
    subjAdd.addEventListener('click', () => {
      if (!q.subjects) q.subjects = [];
      q.subjects.push({ id: 's' + (q.subjects.length + 1), label: '' });
      renderBuilder(); renderPreview();
    });
  }

  // Select One: option text
  el.querySelectorAll('[data-ed-opt]').forEach(ta => {
    ta.addEventListener('input', () => {
      const i = parseInt(ta.dataset.edOpt, 10);
      if (q.options && q.options[i] != null) {
        q.options[i] = ta.value;
        renderPreview();
      }
    });
  });
  el.querySelectorAll('[data-ed-opt-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.edOptDel, 10);
      if (q.options) { q.options.splice(i, 1); renderBuilder(); renderPreview(); }
    });
  });
  const optAdd = document.getElementById('vfed-optadd-' + uid);
  if (optAdd) {
    optAdd.addEventListener('click', () => {
      if (!q.options) q.options = [];
      q.options.push('');
      renderBuilder(); renderPreview();
    });
  }

  // Done button
  const doneBtn = document.getElementById('vfed-done-' + uid);
  if (doneBtn) {
    doneBtn.addEventListener('click', () => { vfOpenEditorUid = null; renderBuilder(); renderPreview(); });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED ROUTING TEXT HELPER (A3)
// Used by renderPreview, renderVFPlainText, and buildVFDocxContent
// so all three output paths stay in sync.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build the routing instruction text for a question.
 * Returns a string ready for display/export, or '' if no routing applies.
 * Broken/unresolved routes are surfaced as "[ROUTE BROKEN]" (A2).
 * For non-yes/no types, stored "stop" is treated as "sign" on render (A4).
 */
function routingText(q, qs, num) {
  function targetLabel(val, isYesNo) {
    if (!val || val === 'sign') return 'have the presiding juror sign and date this form';
    if (val === 'stop') {
      if (!isYesNo) return 'have the presiding juror sign and date this form'; // A4: treat as sign
      const st = (q.stop_text || 'stop here and do not answer any further questions').replace(/\.$/, '');
      return st;
    }
    if (typeof val === 'string' && val.startsWith('__src__:')) {
      return 'answer question [PENDING — add remaining questions from palette]';
    }
    if (typeof val === 'string' && !qs.some(x => x.uid === val)) {
      return 'answer question [ROUTE BROKEN]';
    }
    const n = uidToDisplayNum(val, qs);
    return n != null ? 'answer question ' + n : 'answer question [ROUTE BROKEN]';
  }
  const parts = [];
  if (q.type === 'yes_no') {
    const optFor = q.alt_text ? 'either option for ' : '';
    if (q.if_yes != null) parts.push(`If your answer to ${optFor}question ${num} is Yes, ${targetLabel(q.if_yes, true)}.`);
    if (q.if_no  != null) parts.push(`If your answer is No, ${targetLabel(q.if_no, true)}.`);
  } else if (q.type === 'yes_no_multi') {
    if (q.if_any_yes != null) parts.push(`If you answered yes for any subject in question ${num}, ${targetLabel(q.if_any_yes, false)}.`);
    if (q.if_all_no  != null) parts.push(`If you answered no for all subjects in question ${num}, ${targetLabel(q.if_all_no, true)}.`);
  } else if (q.type === 'damages' && q.if_none != null) {
    parts.push(`If damages have been proved, ${targetLabel(q.if_done || 'sign', false)}.`);
    parts.push(`If no damages have been proved, ${targetLabel(q.if_none, true)}.`);
  } else if (q.if_done != null) {
    parts.push(`After completing this question, ${targetLabel(q.if_done, false)}.`);
  }
  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════════════
// LIVE PREVIEW
// ═══════════════════════════════════════════════════════════════════════

function renderPreview() {
  const el = document.getElementById('vfPreview');
  if (!el) return;
  const form = activeWorkingForm();
  if (!form) { el.innerHTML = '<em style="color:var(--muted)">No active form.</em>'; return; }

  const cap     = form.caption  || {};
  const parties = form.parties  || {};
  const qs      = form.questions;
  let html = '';

  // Caption block
  if (cap.court || cap.caseName || cap.caseNumber || cap.dept) {
    html += '<div class="vf-preview-caption">';
    if (cap.court)      html += `<div><strong>${escHtml(cap.court.toUpperCase())}</strong></div>`;
    if (cap.dept)       html += `<div>DEPARTMENT ${escHtml(cap.dept.toUpperCase())}</div>`;
    if (cap.caseName)   html += `<div style="text-align:right">${escHtml(cap.caseName)}</div>`;
    if (cap.caseNumber) html += `<div style="text-align:right">Case No. ${escHtml(cap.caseNumber)}</div>`;
    html += '</div>';
  }

  const isGeneral = qs.some(q => q.type === 'select_one');
  html += '<div class="vf-preview-title">' + (isGeneral ? 'GENERAL VERDICT FORM' : 'SPECIAL VERDICT FORM') + '</div>';

  qs.forEach((q, idx) => {
    const num  = idx + 1;
    const text = substituteParties(q.text || '', parties);
    const ob = q.optional ? '[' : '';
    const cb = q.optional ? ']' : '';
    html += '<div class="vf-preview-question">';

    if (q.type === 'yes_no_multi') {
      // Render one sub-question per subject
      const subjects = q.subjects || [];
      subjects.forEach(subj => {
        const subjText = substituteParties((q.text || '').replace(/\[subject\]/gi, subj.label || '[subject]'), parties);
        html += `<div>${ob}<span class="vf-preview-q-num">${num}.</span>  ${escHtml(subjText)}${cb}</div>`;
        html += `<div class="vf-preview-yn">${ob}Yes &nbsp;______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No &nbsp;______${cb}</div>`;
      });
      if (!subjects.length) {
        html += `<div>${ob}<span class="vf-preview-q-num">${num}.</span>  ${escHtml(text)}${cb}</div>`;
        html += `<div class="vf-preview-yn">${ob}Yes &nbsp;______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No &nbsp;______${cb}</div>`;
      }
      const rt = routingText(q, qs, num);
      if (rt) html += `<div class="vf-preview-routing">${ob}${escHtml(rt)}${cb}</div>`;

    } else {
      html += `<div>${ob}<span class="vf-preview-q-num">${num}.</span>  ${escHtml(text)}${cb}</div>`;
    }

    if (q.type === 'yes_no') {
      html += `<div class="vf-preview-yn">${ob}Yes &nbsp;______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No &nbsp;______${cb}</div>`;
      if (q.alt_text) {
        const altText = substituteParties(q.alt_text, parties);
        html += `<div style="margin:0.4em 0 0.2em 2em;font-style:italic">${ob}[or]${cb}</div>`;
        html += `<div>${ob}<span class="vf-preview-q-num">${num}.</span>  ${escHtml(altText)}${cb}</div>`;
        html += `<div class="vf-preview-yn">${ob}Yes &nbsp;______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No &nbsp;______${cb}</div>`;
      }
      const rt = routingText(q, qs, num);
      if (rt) html += `<div class="vf-preview-routing">${ob}${escHtml(rt)}${cb}</div>`;

    } else if (q.type === 'damages') {
      for (const item of (q.line_items || [])) {
        if (item.children && item.children.length) {
          html += `<div class="vf-preview-damage-row">
            <div class="vf-preview-damage-label"><strong>${escHtml(item.label)}</strong></div>
            <div class="vf-preview-damage-blank"></div>
          </div>`;
          for (const child of item.children) {
            html += `<div class="vf-preview-damage-row" style="margin-left:2em">
              <div class="vf-preview-damage-label">${escHtml(child.label)}</div>
              <div class="vf-preview-damage-blank">$________________</div>
            </div>`;
          }
        } else {
          html += `<div class="vf-preview-damage-row">
            <div class="vf-preview-damage-label"><strong>${escHtml(item.label)}</strong></div>
            <div class="vf-preview-damage-blank">$________________</div>
          </div>`;
        }
      }
      if ((q.line_items || []).length) {
        html += `<div class="vf-preview-damage-row">
          <div class="vf-preview-damage-label"><strong>TOTAL</strong></div>
          <div class="vf-preview-damage-blank">$________________</div>
        </div>`;
      }

    } else if (q.type === 'percentage') {
      for (const party of (q.parties || [])) {
        html += `<div class="vf-preview-damage-row">
          <div class="vf-preview-damage-label">${escHtml(substituteParties(party.label, parties))}</div>
          <div class="vf-preview-damage-blank">_____%</div>
        </div>`;
      }
      if ((q.parties || []).length) {
        html += `<div class="vf-preview-damage-row">
          <div class="vf-preview-damage-label"><strong>TOTAL</strong></div>
          <div class="vf-preview-damage-blank">100%</div>
        </div>`;
      }

    } else if (q.type === 'select_one') {
      for (const opt of (q.options || [])) {
        const optText = substituteParties(opt, parties);
        html += `<div style="margin:0.5em 0 0.3em 2em">______ ${escHtml(optText)}</div>`;
      }

    } else if (q.type === 'write_in') {
      for (let i = 0; i < 3; i++) {
        html += '<div style="margin:0.4em 0 0.1em 2em;color:var(--border)">_______________________________________________</div>';
      }
    }

    // Routing text for non-yes_no question types (A3)
    if (q.type !== 'yes_no' && q.type !== 'yes_no_multi') {
      const rt = routingText(q, qs, num);
      if (rt) html += `<div class="vf-preview-routing">${ob}${escHtml(rt)}${cb}</div>`;
    }

    html += '</div>';
  });

  // Signature block
  html += `<div class="vf-preview-sig">
    <div>Dated: ________________</div>
    <div style="margin-top:1.2em">________________________________</div>
    <div style="font-size:.85em;margin-top:4px">Presiding Juror</div>
  </div>`;

  el.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════
// PARTY NAMES & CAPTION PANEL
// ═══════════════════════════════════════════════════════════════════════

function renderPartyFields() {
  const form      = activeWorkingForm();
  const container = document.getElementById('vfPartyFields');
  if (!container || !form) return;

  let html = '';
  for (const [key, val] of Object.entries(form.parties)) {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    html += `<div class="vf-party-row">
      <label>${escHtml(label)}</label>
      <input type="text" data-party="${escHtml(key)}" value="${escHtml(val)}" placeholder="${escHtml(label)}…">
    </div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('[data-party]').forEach(inp => {
    inp.addEventListener('input', () => {
      form.parties[inp.dataset.party] = inp.value;
      renderBuilder();
      renderPreview();
    });
  });
}

function renderCaptionFields() {
  const form      = activeWorkingForm();
  const container = document.getElementById('vfCaptionFields');
  if (!container || !form) return;

  const fields = [
    { key: 'court',      label: 'Court'     },
    { key: 'dept',       label: 'Dept'      },
    { key: 'caseName',   label: 'Case Name' },
    { key: 'caseNumber', label: 'Case No.'  },
  ];
  let html = '';
  for (const { key, label } of fields) {
    html += `<div class="vf-caption-row">
      <label>${label}</label>
      <input type="text" data-caption="${key}" value="${escHtml((form.caption || {})[key] || '')}"
        placeholder="${label}…">
    </div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('[data-caption]').forEach(inp => {
    inp.addEventListener('input', () => {
      if (!form.caption) form.caption = {};
      form.caption[inp.dataset.caption] = inp.value;
      renderPreview();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// FORM SELECTOR  (Multiple Forms Per Case)
// ═══════════════════════════════════════════════════════════════════════

const VF_SAVED_KEY = 'vf_saved_forms';

function loadSavedVFs() {
  try { return JSON.parse(localStorage.getItem(VF_SAVED_KEY) || '{}'); } catch { return {}; }
}
function saveSavedVFs(obj) { localStorage.setItem(VF_SAVED_KEY, JSON.stringify(obj)); }

function renderFormSelector() {
  const container = document.getElementById('vfFormSelector');
  if (!container) return;
  const form = activeWorkingForm();

  const opts = vfForms.map(f =>
    `<option value="${escHtml(f.id)}"${f.id === activeVfFormId ? ' selected' : ''}>${escHtml(f.name)}</option>`
  ).join('');

  // Saved forms for Load picker
  const saved = loadSavedVFs();
  const savedNames = Object.keys(saved).sort();
  const savedOpts = savedNames.length
    ? savedNames.map(n => `<option value="${escHtml(n)}">${escHtml(n)}</option>`).join('')
    : '<option value="" disabled>No saved forms</option>';

  container.innerHTML = `
    <select id="vfFormSelect" style="width:100%">${opts}</select>
    <input type="text" id="vfFormRename" placeholder="Rename form…"
      value="${escHtml(form ? form.name : '')}">
    <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
      <button class="btn-secondary" id="vfNewFormBtn" style="font-size:.78em;flex:1">+ New</button>
      <button class="btn-secondary" id="vfDeleteFormBtn" style="font-size:.78em;flex:1"${vfForms.length <= 1 ? ' disabled' : ''}>Delete</button>
    </div>
    <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
      <button class="btn-secondary" id="vfSaveFormBtn" style="font-size:.78em;flex:1">Save Form</button>
      <select id="vfLoadFormSelect" style="font-size:.78em;flex:1;min-width:0">
        <option value="">Load saved…</option>
        ${savedOpts}
      </select>
    </div>
    <div id="vfFormStatus" style="font-family:var(--sans);font-size:.72em;color:var(--muted);margin-top:3px;min-height:1em"></div>`;

  document.getElementById('vfFormSelect').addEventListener('change', e => {
    vfOpenEditorUid = null;
    activeVfFormId  = e.target.value;
    renderAll();
  });

  document.getElementById('vfFormRename').addEventListener('input', e => {
    const f = activeWorkingForm();
    if (!f) return;
    f.name = e.target.value;
    const opt = container.querySelector(`#vfFormSelect option[value="${f.id}"]`);
    if (opt) opt.textContent = f.name;
  });

  document.getElementById('vfNewFormBtn').addEventListener('click', () => {
    const f = newBlankForm('New Verdict Form');
    vfForms.push(f);
    activeVfFormId  = f.id;
    vfOpenEditorUid = null;
    renderAll();
  });

  document.getElementById('vfDeleteFormBtn').addEventListener('click', () => {
    if (vfForms.length <= 1) return;
    const f = activeWorkingForm();
    if (!f) return;
    if (!confirm(`Delete "${f.name}"?`)) return;
    vfForms = vfForms.filter(x => x.id !== f.id);
    activeVfFormId  = vfForms[0].id;
    vfOpenEditorUid = null;
    renderAll();
  });

  document.getElementById('vfSaveFormBtn').addEventListener('click', () => {
    const f = activeWorkingForm();
    if (!f) return;
    const name = (f.name || '').trim() || 'Untitled';
    const lib = loadSavedVFs();
    if (lib[name] && !confirm(`Overwrite saved form "${name}"?`)) return;
    lib[name] = JSON.parse(JSON.stringify(f));
    saveSavedVFs(lib);
    const statusEl = document.getElementById('vfFormStatus');
    if (statusEl) statusEl.textContent = `✓ Saved "${name}"`;
    renderFormSelector();
  });

  document.getElementById('vfLoadFormSelect').addEventListener('change', e => {
    const name = e.target.value;
    if (!name) return;
    const lib = loadSavedVFs();
    const saved_form = lib[name];
    if (!saved_form) return;
    // Deep-copy, assign fresh ids so it doesn't collide with existing forms
    const loaded = JSON.parse(JSON.stringify(saved_form));
    loaded.id = nextFormId();
    // Reassign UIDs to all questions to avoid collisions
    const uidRemap = {};
    for (const q of loaded.questions) {
      const oldUid = q.uid;
      q.uid = nextUid();
      uidRemap[oldUid] = q.uid;
    }
    // Remap routing references
    for (const q of loaded.questions) {
      for (const field of ['if_yes', 'if_no', 'if_done', 'if_none', 'if_any_yes', 'if_all_no']) {
        if (q[field] && uidRemap[q[field]]) q[field] = uidRemap[q[field]];
      }
    }
    vfForms.push(loaded);
    activeVfFormId  = loaded.id;
    vfOpenEditorUid = null;
    const statusEl = document.getElementById('vfFormStatus');
    if (statusEl) statusEl.textContent = `✓ Loaded "${name}"`;
    renderAll();
  });
}

// ═══════════════════════════════════════════════════════════════════════
// OUTPUT & EXPORT
// ═══════════════════════════════════════════════════════════════════════

function renderVFPlainText() {
  const form = activeWorkingForm();
  if (!form) return '';
  const cap     = form.caption  || {};
  const parties = form.parties  || {};
  const qs      = form.questions;
  const lines   = [];

  if (cap.court)      lines.push(cap.court.toUpperCase(), '');
  if (cap.dept)       lines.push('DEPARTMENT ' + cap.dept.toUpperCase(), '');
  if (cap.caseName)   lines.push(cap.caseName);
  if (cap.caseNumber) lines.push('Case No. ' + cap.caseNumber);
  if (lines.length)   lines.push('');
  const isGeneral = qs.some(q => q.type === 'select_one');
  lines.push(isGeneral ? 'GENERAL VERDICT FORM' : 'SPECIAL VERDICT FORM', '');

  qs.forEach((q, idx) => {
    const num  = idx + 1;
    const text = substituteParties(q.text || '', parties);
    const ob = q.optional ? '[' : '';
    const cb = q.optional ? ']' : '';

    if (q.type === 'yes_no_multi') {
      const subjects = q.subjects || [];
      subjects.forEach(subj => {
        const subjText = substituteParties((q.text || '').replace(/\[subject\]/gi, subj.label || '[subject]'), parties);
        lines.push(`${ob}${num}.  ${subjText}${cb}`);
        lines.push(`    ${ob}Yes  ______          No  ______${cb}`);
      });
      if (!subjects.length) {
        lines.push(`${ob}${num}.  ${text}${cb}`);
        lines.push(`    ${ob}Yes  ______          No  ______${cb}`);
      }
      const rt = routingText(q, qs, num);
      if (rt) lines.push(`    ${ob}${rt}${cb}`);
    } else {
      lines.push(`${ob}${num}.  ${text}${cb}`);
    }

    if (q.type === 'yes_no') {
      lines.push(`    ${ob}Yes  ______          No  ______${cb}`);
      if (q.alt_text) {
        const altText = substituteParties(q.alt_text, parties);
        lines.push(`    ${ob}[or]${cb}`);
        lines.push(`${ob}${num}.  ${altText}${cb}`);
        lines.push(`    ${ob}Yes  ______          No  ______${cb}`);
      }
      const rt = routingText(q, qs, num);
      if (rt) lines.push(`    ${ob}${rt}${cb}`);

    } else if (q.type === 'damages') {
      for (const item of (q.line_items || [])) {
        if (item.children && item.children.length) {
          lines.push(`    ${item.label}`);
          for (const child of item.children) lines.push(`        ${child.label}    $________________`);
        } else {
          lines.push(`    ${item.label}    $________________`);
        }
      }
      if ((q.line_items || []).length) lines.push('    TOTAL    $________________');

    } else if (q.type === 'percentage') {
      for (const p of (q.parties || [])) lines.push(`    ${substituteParties(p.label, parties)}    _____%`);
      if ((q.parties || []).length) lines.push('    TOTAL    100%');

    } else if (q.type === 'select_one') {
      for (const opt of (q.options || [])) {
        lines.push(`    ______ ${substituteParties(opt, parties)}`);
      }

    } else if (q.type === 'write_in') {
      lines.push('    _______________________________________________');
      lines.push('    _______________________________________________');
      lines.push('    _______________________________________________');
    }
    // Routing text for non-yes_no question types (A3)
    if (q.type !== 'yes_no' && q.type !== 'yes_no_multi') {
      const rt = routingText(q, qs, num);
      if (rt) lines.push(`    ${ob}${rt}${cb}`);
    }
    lines.push('');
  });

  lines.push('');
  lines.push('Dated:  ________________________');
  lines.push('');
  lines.push('________________________________');
  lines.push('Presiding Juror');
  return lines.join('\n');
}

function buildVFDocxContent() {
  const form = activeWorkingForm();
  if (!form) return null;
  const parties = form.parties || {};
  const qs      = form.questions;

  return {
    type:      'verdict_form',
    caption:   Object.assign({}, form.caption),
    formTitle: qs.some(q => q.type === 'select_one') ? 'GENERAL VERDICT FORM' : 'SPECIAL VERDICT FORM',
    questions: qs.map((q, idx) => {
      const num  = idx + 1;
      const text = substituteParties(q.text || '', parties);
      const obj  = { displayNumber: num, type: q.type, text };

      obj.routing_text = routingText(q, qs, num);
      if (q.optional) obj.optional = true;
      if (q.alt_text) obj.alt_text = substituteParties(q.alt_text, parties);

      if (q.type === 'yes_no_multi') {
        obj.subjects = (q.subjects || []).map(s => ({
          id: s.id,
          label: substituteParties(s.label || '', parties)
        }));
      } else if (q.type === 'damages') {
        obj.line_items = (q.line_items || []).map(li => {
          const out = { label: li.label };
          if (li.children && li.children.length) {
            out.children = li.children.map(ch => ({ label: ch.label }));
          }
          return out;
        });
      } else if (q.type === 'percentage') {
        obj.parties = (q.parties || []).map(p => ({ label: substituteParties(p.label, parties) }));
      } else if (q.type === 'select_one') {
        obj.options = (q.options || []).map(o => substituteParties(o, parties));
      }
      return obj;
    }),
    include_signature: true
  };
}

// ═══════════════════════════════════════════════════════════════════════
// CASE SYSTEM INTEGRATION
// (getVFSerializedState / setVFState are called from app.js caseSave/caseLoad)
// ═══════════════════════════════════════════════════════════════════════

function getVFSerializedState() {
  return { forms: JSON.parse(JSON.stringify(vfForms)), activeFormId: activeVfFormId };
}

function setVFState(data) {
  // Normalize: support both old plain-array format and new {forms, activeFormId} format (A7)
  let forms, savedActiveId;
  if (Array.isArray(data)) {
    forms = data;
    savedActiveId = null;
  } else if (data && Array.isArray(data.forms)) {
    forms = data.forms;
    savedActiveId = data.activeFormId || null;
  } else {
    forms = [];
    savedActiveId = null;
  }

  vfForms         = forms.length ? JSON.parse(JSON.stringify(forms)) : [];
  vfOpenEditorUid = null;

  // Advance counters past restored ids so new ones never collide
  for (const form of vfForms) {
    const fn = parseInt((form.id || '').replace('vf_', ''), 10);
    if (!isNaN(fn) && fn > vfFormIdCtr) vfFormIdCtr = fn;
    for (const q of (form.questions || [])) {
      const qn = parseInt((q.uid || '').replace('vfq_', ''), 10);
      if (!isNaN(qn) && qn > vfUidCounter) vfUidCounter = qn;
    }
  }

  // Normalize routes for all restored forms (resolves any __src__: sentinels)
  for (const form of vfForms) normalizeRoutes(form);

  // Restore active form; fall back to first form if saved id is absent or invalid (A7)
  if (savedActiveId && vfForms.some(f => f.id === savedActiveId)) {
    activeVfFormId = savedActiveId;
  } else {
    activeVfFormId = vfForms.length ? vfForms[0].id : null;
  }

  // Ensure at least one blank form exists — mirrors init behavior (A6)
  if (!vfForms.length) {
    const f = newBlankForm('New Verdict Form');
    vfForms.push(f);
    activeVfFormId = f.id;
  }

  renderAll();
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER ALL  (orchestrator — re-renders every panel)
// ═══════════════════════════════════════════════════════════════════════

function renderAll() {
  renderFormSelector();
  renderPalette();
  renderBuilder();
  renderPartyFields();
  renderCaptionFields();
  renderPreview();
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT LISTENERS & INIT
// ═══════════════════════════════════════════════════════════════════════

(function vfInit() {
  // + Custom Question button
  const addCustomBtn = document.getElementById('vfAddCustomBtn');
  if (addCustomBtn) addCustomBtn.addEventListener('click', addCustomQuestion);

  // + Add Party button (builder panel)
  const addPartyBtn = document.getElementById('vfAddPartyBtn');
  if (addPartyBtn) {
    addPartyBtn.addEventListener('click', () => {
      const form = activeWorkingForm();
      if (!form) return;
      const raw = prompt('Party role (e.g. "third party"):');
      if (!raw || !raw.trim()) return;
      const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
      if (!(key in form.parties)) {
        form.parties[key] = '';
        renderPartyFields();
      }
    });
  }

  // Export picker
  const vfExportBtn = document.getElementById('vfExportBtn');
  if (vfExportBtn) {
    vfExportBtn.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('exportVfPicker').classList.toggle('hidden');
    });
  }

  const exportVfPicker = document.getElementById('exportVfPicker');
  if (exportVfPicker) {
    exportVfPicker.addEventListener('click', e => {
      const fmt = e.target.dataset.fmt;
      if (!fmt) return;
      exportVfPicker.classList.add('hidden');
      const form     = activeWorkingForm();
      const slug     = form ? form.name.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-') : 'verdict-form';
      const dateSlug = new Date().toISOString().slice(0, 10);
      if (fmt === 'docx') {
        const content = buildVFDocxContent();
        if (!content) return;
        exportDOCX(content, `VF-${slug}-${dateSlug}.docx`);
      } else if (fmt === 'filed' || fmt === 'reading') {
        if (!form) return;
        (async () => {
          try {
            // Load saved attorney profile; strip 'pl_' prefix to get field keys
            const profileRaw = localStorage.getItem('pleading_attorney_profile');
            const profile    = profileRaw ? JSON.parse(profileRaw) : {};
            const fields     = {};
            for (const [k, v] of Object.entries(profile)) {
              if (k.startsWith('pl_')) fields[k.slice(3)] = v;
            }
            // Overlay caption from the currently-selected case (only fills missing keys)
            const caseSel = document.getElementById('caseSelect');
            if (caseSel && caseSel.value) {
              const cases   = JSON.parse(localStorage.getItem('caci_cases') || '{}');
              const caption = (cases[caseSel.value] && cases[caseSel.value].caption) || {};
              for (const [k, v] of Object.entries(caption)) {
                if (!fields[k]) fields[k] = v;
              }
            }
            // Document title from form name; body is the verdict questions only
            // (strip caption preamble that renderVFPlainText prepends)
            const isGV = form.questions.some(q => q.type === 'select_one');
            fields.document_title = form.name || (isGV ? 'GENERAL VERDICT FORM' : 'SPECIAL VERDICT FORM');
            const full   = renderVFPlainText();
            const marker = isGV ? 'GENERAL VERDICT FORM\n' : 'SPECIAL VERDICT FORM\n';
            const mIdx   = full.indexOf(marker);
            fields.body_text = mIdx >= 0 ? full.slice(mIdx + marker.length).trimStart() : full;
            const plainPaper = (fmt === 'reading');
            const blob = await generatePleadingShell({ fields, plainPaper });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = plainPaper
              ? `VF-${slug}-jury-copy-${dateSlug}.docx`
              : `VF-${slug}-filed-copy-${dateSlug}.docx`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error('[vf-app] Pleading DOCX failed:', err);
          }
        })();
      }
    });
  }

  // Auto-create one blank form so the builder is never in an undefined state
  if (!vfForms.length) {
    const f = newBlankForm('New Verdict Form');
    vfForms.push(f);
    activeVfFormId = f.id;
  }

  // Pre-fill VF caption from saved case caption when a case is selected.
  // Mirrors pleading-ui.js: read-only, one-way, only fills fields that are
  // currently empty. Does not create or overwrite forms.
  const caseSelectVF = document.getElementById('caseSelect');
  if (caseSelectVF) {
    caseSelectVF.addEventListener('change', e => {
      const name = e.target.value;
      if (!name) return;
      const form = activeWorkingForm();
      if (!form) return;
      try {
        const cases   = JSON.parse(localStorage.getItem('caci_cases') || '{}');
        const caption = (cases[name] && cases[name].caption) || {};
        if (!form.caption) form.caption = {};
        const cap = form.caption;

        if (!cap.court      && caption.court_name)   cap.court      = caption.court_name;
        if (!cap.dept       && caption.dept_number)  cap.dept       = caption.dept_number;
        if (!cap.caseNumber && caption.case_number)  cap.caseNumber = caption.case_number;

        // caseName: "plaintiff v. defendant", or whichever is present, or blank
        if (!cap.caseName) {
          const p = caption.plaintiff_name || '';
          const d = caption.defendant_name || '';
          if (p && d)      cap.caseName = p + ' v. ' + d;
          else if (p || d) cap.caseName = p || d;
          // both absent: leave blank
        }

        renderCaptionFields();
      } catch (err) {
        console.warn('[vf-app] caption pre-fill failed:', err);
      }
    });
  }

  renderAll();
})();
