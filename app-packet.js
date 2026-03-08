'use strict';

// ═══════════════════════════════════════════════════════════════════════
// PACKET TRAY
// ═══════════════════════════════════════════════════════════════════════

let packetInstructions = [];
let packetIdCounter    = 0;
let activePacketId     = null;

function renderPacketTray() {
  const listEl     = document.getElementById('packetList');
  const compileRow = document.getElementById('packetCompileRow');
  if (!packetInstructions.length) {
    listEl.innerHTML = '<p class="tray-empty">No instructions added yet.</p>';
    compileRow.classList.add('hidden');
    return;
  }
  compileRow.classList.toggle('hidden', packetInstructions.length === 0);
  document.getElementById('compilePacketBtn').disabled = packetInstructions.length < 2;
  let html = '<div class="tray-list">';
  for (const entry of packetInstructions) {
    const active = entry.id === activePacketId;
    const unfilledCount = getUnfilledFields(entry.parsedState).length;
    const warnHtml = unfilledCount > 0
      ? `<div style="font-family:var(--sans);font-size:.72em;color:var(--yellow);margin-top:2px">\u26A0 ${unfilledCount} unfilled field(s)</div>`
      : '';
    html += `<div class="tray-row${active ? ' active' : ''}">
      <div class="tray-row-info">
        <div class="tray-row-num">CACI ${esc(entry.caciNum)}</div>
        ${entry.label ? `<div class="tray-row-label">${esc(entry.label)}</div>` : ''}
        ${warnHtml}
      </div>
      <div class="tray-row-btns">
        <button class="btn-secondary" onclick="packetLoad(${entry.id})">Load</button>
        <button class="btn-ghost" onclick="packetRemove(${entry.id})">&times;</button>
      </div>
    </div>`;
  }
  html += '</div>';
  listEl.innerHTML = html;
}

function packetLoad(id) {
  const entry = packetInstructions.find(e => e.id === id);
  if (!entry) return;
  if (typeof resetDraftLockState === 'function') resetDraftLockState(); // B1
  activePacketId = id;
  document.getElementById('draftCaciNum').value = entry.caciNum;
  draftState = entry.parsedState;
  renderDraftForm(draftState);
  updateDraftPreview();
  document.getElementById('draftWorkspace').classList.remove('hidden');
  renderPacketTray();
}

function packetRemove(id) {
  packetInstructions = packetInstructions.filter(e => e.id !== id);
  if (activePacketId === id) activePacketId = null;
  renderPacketTray();
}

document.getElementById('packetAddBtn').addEventListener('click', () => {
  const numEl    = document.getElementById('packetCaciNum');
  const labelEl  = document.getElementById('packetLabel');
  const statusEl = document.getElementById('packetAddStatus');
  const num      = numEl.value.trim();

  if (!num) {
    statusEl.textContent = 'Enter a CACI number.';
    statusEl.className   = 'tray-status err';
    return;
  }

  try {
    const text        = lookupCACITextForDraft(num);
    const parsedState = parseInstruction(text);
    packetInstructions.push({ id: ++packetIdCounter, caciNum: num, label: labelEl.value.trim(), parsedState });
    numEl.value          = '';
    labelEl.value        = '';
    statusEl.textContent = '';
    statusEl.className   = 'tray-status';
    renderPacketTray();
  } catch (err) {
    statusEl.textContent = 'Error: ' + err.message;
    statusEl.className   = 'tray-status err';
  }
});

document.getElementById('packetCaciNum').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('packetAddBtn').click();
});

// ═══════════════════════════════════════════════════════════════════════
// PACKET COMPILE
// ═══════════════════════════════════════════════════════════════════════

/** Returns [{caciNum, label, count}] for any packet instruction with unfilled fields. */
function getPacketUnfilledSummary() {
  return packetInstructions
    .map(e => ({ caciNum: e.caciNum, label: e.label, count: getUnfilledFields(e.parsedState).length }))
    .filter(x => x.count > 0);
}

function compilePacket() {
  const parts = [];
  const warnItems = getPacketUnfilledSummary();
  if (warnItems.length > 0) {
    let warn = '\u26A0 UNFILLED FIELDS DETECTED\n';
    for (const { caciNum, label, count } of warnItems) {
      const name = label ? `CACI ${caciNum} \u2014 ${label}` : `CACI ${caciNum}`;
      warn += `[${name}]: ${count} unfilled field(s)\n`;
    }
    parts.push(warn.trimEnd());
  }
  for (const entry of packetInstructions) {
    const titleMatch = entry.parsedState.rawText.match(/^\d{3,4}\s*\.\s*([^\[\n]+)/);
    const title   = titleMatch ? titleMatch[1].trim() : '';
    const heading = title ? `CACI ${entry.caciNum}: ${title}` : `CACI ${entry.caciNum}`;
    const body    = compileInstruction(entry.parsedState);
    parts.push(heading + '\n\n' + body);
  }
  return parts.join('\n\n---\n\n');
}

document.getElementById('compilePacketBtn').addEventListener('click', () => {
  document.getElementById('packetCompileText').textContent = compilePacket();
  document.getElementById('packetCompileOverlay').classList.remove('hidden');
});

document.getElementById('closeCompileOverlay').addEventListener('click', () => {
  document.getElementById('packetCompileOverlay').classList.add('hidden');
});

document.getElementById('exportPacketBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('exportPacketPicker').classList.toggle('hidden');
});

document.getElementById('exportPacketPicker').addEventListener('click', e => {
  const fmt = e.target.dataset.fmt;
  if (!fmt) return;
  document.getElementById('exportPacketPicker').classList.add('hidden');
  const dateSlug = new Date().toISOString().slice(0, 10);
  if (fmt === 'pdf') {
    const sections = packetInstructions.map(entry => {
      const titleMatch = entry.parsedState.rawText.match(/^\d{3,4}\s*\.\s*([^\[\n]+)/);
      const title   = titleMatch ? titleMatch[1].trim() : '';
      const heading = title ? `CACI ${entry.caciNum}: ${title}` : `CACI ${entry.caciNum}`;
      const body    = compileInstruction(entry.parsedState);
      return { heading, body };
    });
    exportPDF(sections, `CACI-packet-${dateSlug}.pdf`);
  } else if (fmt === 'docx') {
    exportDOCX({ type: 'instruction', heading: 'CACI Instruction Packet', body: compilePacket() }, `CACI-packet-${dateSlug}.docx`);
  } else if (fmt === 'txt') {
    downloadTXT(compilePacket(), `CACI-packet-${dateSlug}.txt`);
  } else if (fmt === 'pleading') {
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
        fields.document_title = 'PROPOSED JURY INSTRUCTIONS';
        fields.body_text      = compilePacket();
        const paperCheck = document.getElementById('packetPleadingCheck');
        const blob = await generatePleadingShell({ fields, plainPaper: !(paperCheck && paperCheck.checked) });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `CACI-packet-pleading-${dateSlug}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('[packet] Pleading DOCX failed:', err);
      }
    })();
  }
});
