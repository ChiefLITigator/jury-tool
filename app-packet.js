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

document.getElementById('printPacketBtn').addEventListener('click', () => {
  const printArea = document.getElementById('packetPrintArea');
  let html = '';
  for (let i = 0; i < packetInstructions.length; i++) {
    const entry      = packetInstructions[i];
    const titleMatch = entry.parsedState.rawText.match(/^\d{3,4}\s*\.\s*([^\[\n]+)/);
    const title      = titleMatch ? titleMatch[1].trim() : '';
    const heading    = title ? `CACI ${entry.caciNum}: ${title}` : `CACI ${entry.caciNum}`;
    const body       = compileInstruction(entry.parsedState);
    const bodyHtml   = body.split(/\n+/).filter(p => p.trim())
      .map(p => `<p class="draft-para">${esc(p.trim())}</p>`).join('');
    html += `<div><div class="draft-preview-heading">${esc(heading)}</div><div class="draft-preview-body">${bodyHtml}</div></div>`;
    if (i < packetInstructions.length - 1) html += '<div class="packet-page-break"></div>';
  }
  printArea.innerHTML = html;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  setPrintHeader('CACI Instruction Packet   |   ' + date);
  window.addEventListener('afterprint', function cleanup() {
    printArea.innerHTML = '';
    window.removeEventListener('afterprint', cleanup);
  });
  doPrint('printing-packet');
});

document.getElementById('exportPacketBtn').addEventListener('click', () => {
  const dateSlug = new Date().toISOString().slice(0, 10);
  downloadTXT(compilePacket(), `CACI-packet-${dateSlug}.txt`);
});
