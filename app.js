'use strict';

// ═══════════════════════════════════════════════════════════════════════
// TOKENIZER
// ═══════════════════════════════════════════════════════════════════════

function tokenize(text) {
  return text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}

/**
 * Remove the leading "NNN. Title" line from an instruction text string.
 * Also applies the same mid-sentence join and list-item split cleanup
 * that lookupCACIText applies, so pasted text gets the same treatment.
 */
function stripInstructionHeading(text) {
  return text.replace(/^\d{3,4}\s*\.\s*[^\n]*\n?/, '').trim();
}

/**
 * Flatten raw CACI instruction text for readable comparison.
 * - Removes [N. [or] ...] alternative signal brackets (keeps both options as separate lines)
 * - Unwraps outer optional brackets around numbered list items
 * - Normalizes bracket spacing
 * - Puts numbered list items on their own lines
 */
function flattenForCompare(text) {
  // Normalize unclosed alternative signal brackets (same as draft-parser)
  text = text.replace(/(\[\d+\.\s*\[\s*or\s*\])(?!\])/g, '$1]');

  // Iteratively remove top-level [N. [or] ...] blocks
  for (let pass = 0; pass < 5; pass++) {
    const prev = text;
    const brackets = findTopLevelBrackets(text);
    for (let i = brackets.length - 1; i >= 0; i--) {
      const { start, end, content } = brackets[i];
      if (/^\d+\.\s*\[\s*or\s*\]/i.test(content.trim())) {
        text = text.slice(0, start).trimEnd() + ' ' + text.slice(end).trimStart();
      }
    }
    if (text === prev) break;
  }

  // Unwrap outer optional brackets around numbered list items
  for (let pass = 0; pass < 3; pass++) {
    const prev = text;
    const brackets = findTopLevelBrackets(text);
    for (let i = brackets.length - 1; i >= 0; i--) {
      const { start, end, content } = brackets[i];
      if (/^\d+\.\s+\S/.test(content.trim())) {
        text = text.slice(0, start) + content.trim() + text.slice(end);
      }
    }
    if (text === prev) break;
  }

  // Normalize spaces inside brackets: [ name of plaintiff ] → [name of plaintiff]
  text = text.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');

  // Put numbered list items on their own lines
  text = text.replace(/(?<=\S)\s+(\d+\.\s+(?:That|The|A|An|Each|Whether|If|All|To|In|Any)\b)/g, '\n$1');

  // Clean up spacing
  text = text.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// ═══════════════════════════════════════════════════════════════════════
// LCS-BASED WORD DIFF
// Returns [{op:'equal'|'insert'|'delete', text:string}, …]
// ═══════════════════════════════════════════════════════════════════════

function computeDiff(a, b) {
  const m = a.length, n = b.length;
  if (m === 0 && n === 0) return [];
  if (m === 0) return b.map(t => ({ op: 'insert', text: t }));
  if (n === 0) return a.map(t => ({ op: 'delete', text: t }));

  // Fall back to chunk-level diff for very large inputs
  if (m * n > 900000) return computeChunkedDiff(a, b, 10);

  // Flat Int32Array DP table for speed
  const stride = n + 1;
  const dp = new Int32Array((m + 1) * stride);

  for (let i = 1; i <= m; i++) {
    const ai = a[i - 1];
    const base = i * stride, prev = (i - 1) * stride;
    for (let j = 1; j <= n; j++) {
      dp[base + j] = ai === b[j - 1]
        ? dp[prev + j - 1] + 1
        : Math.max(dp[prev + j], dp[base + j - 1]);
    }
  }

  // Backtrack
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      ops.push({ op: 'equal',  text: a[i-1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i*stride + j-1] >= dp[(i-1)*stride + j])) {
      ops.push({ op: 'insert', text: b[j-1] }); j--;
    } else {
      ops.push({ op: 'delete', text: a[i-1] }); i--;
    }
  }
  return ops.reverse();
}

function computeChunkedDiff(a, b, sz) {
  const ca = [], cb = [];
  for (let i = 0; i < a.length; i += sz) ca.push(a.slice(i, i+sz).join(' '));
  for (let i = 0; i < b.length; i += sz) cb.push(b.slice(i, i+sz).join(' '));
  const chunkOps = computeDiff(ca, cb);
  const ops = [];
  for (const op of chunkOps) {
    for (const w of op.text.split(' ').filter(Boolean)) {
      ops.push({ op: op.op, text: w });
    }
  }
  return ops;
}

// ═══════════════════════════════════════════════════════════════════════
// THREE-WAY DIFF
// Returns opsA and opsB (ops from CACI→A / CACI→B with yellow marks)
// ═══════════════════════════════════════════════════════════════════════

function threeWayDiff(tA, tCaci, tB) {
  const opsCA = computeDiff(tCaci, tA);
  const opsCB = computeDiff(tCaci, tB);
  const opsAB = computeDiff(tA, tB);

  // Build per-CACI-position change map
  const map = new Map(); // pos → {aD, aI[], bD, bI[]}
  function init(pos) {
    if (!map.has(pos)) map.set(pos, { aD: false, aI: [], bD: false, bI: [] });
    return map.get(pos);
  }

  let pos = 0;
  for (const op of opsCA) {
    const e = init(pos);
    if      (op.op === 'equal')  { pos++; }
    else if (op.op === 'delete') { e.aD = true; pos++; }
    else if (op.op === 'insert') { e.aI.push(op.text); }
  }
  pos = 0;
  for (const op of opsCB) {
    const e = init(pos);
    if      (op.op === 'equal')  { pos++; }
    else if (op.op === 'delete') { e.bD = true; pos++; }
    else if (op.op === 'insert') { e.bI.push(op.text); }
  }

  // Detect conflict positions
  const yellowPos = new Set();
  for (const [p, e] of map) {
    const aCh = e.aD || e.aI.length > 0;
    const bCh = e.bD || e.bI.length > 0;
    if (aCh && bCh) {
      const aOut = (e.aD ? [] : (tCaci[p] ? [tCaci[p]] : [])).concat(e.aI);
      const bOut = (e.bD ? [] : (tCaci[p] ? [tCaci[p]] : [])).concat(e.bI);
      if (aOut.join(' ') !== bOut.join(' ')) yellowPos.add(p);
    }
  }

  // Apply yellow markers
  function applyYellow(rawOps) {
    let p = 0;
    return rawOps.map(op => {
      if (op.op === 'equal')  { p++; return op; }
      if (op.op === 'delete') { const y = yellowPos.has(p); p++; return y ? {...op, op:'yellow'} : op; }
      if (op.op === 'insert') { return yellowPos.has(p) ? {...op, op:'yellow'} : op; }
      return op;
    });
  }

  return {
    opsA:     applyYellow(opsCA),
    opsB:     applyYellow(opsCB),
    opsAB,
    countsCA: counts(opsCA),
    countsCB: counts(opsCB),
    countsAB: counts(opsAB),
    hasYellow: yellowPos.size > 0
  };
}

// ═══════════════════════════════════════════════════════════════════════
// COUNTING
// ═══════════════════════════════════════════════════════════════════════

function counts(ops) {
  let ins = 0, del = 0;
  for (const o of ops) {
    if (o.op === 'insert') ins++;
    else if (o.op === 'delete') del++;
  }
  return { ins, del, total: ins + del };
}

// ═══════════════════════════════════════════════════════════════════════
// HTML RENDERING
// ═══════════════════════════════════════════════════════════════════════

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/** Full redline: equal plain, insert green, delete red, yellow conflicts */
function renderFull(ops) {
  return ops.map(o => {
    const t = esc(o.text);
    switch (o.op) {
      case 'equal':  return t + ' ';
      case 'insert': return `<span class="ins">${t}</span> `;
      case 'delete': return `<span class="del">${t}</span> `;
      case 'yellow': return `<span class="yel">${t}</span> `;
    }
  }).join('').trimEnd()
    .replace(/(\s*\n\s*){2,}/g, '</p><p class="diff-para">');
}

/** Left / base column: show equal + delete (red strikethrough), hide inserts */
function renderLeft(ops) {
  return ops
    .filter(o => o.op !== 'insert')
    .map(o => o.op === 'delete'
      ? `<span class="del">${esc(o.text)}</span> `
      : esc(o.text) + ' ')
    .join('').trimEnd()
    .replace(/(\s*\n\s*){2,}/g, '</p><p class="diff-para">');
}

/** Right / modified column: show equal + insert (green), hide deletes */
function renderRight(ops) {
  return ops
    .filter(o => o.op !== 'delete')
    .map(o => o.op === 'insert'
      ? `<span class="ins">${esc(o.text)}</span> `
      : esc(o.text) + ' ')
    .join('').trimEnd()
    .replace(/(\s*\n\s*){2,}/g, '</p><p class="diff-para">');
}

function colHtml(title, html, isBase = false) {
  const cls = isBase ? ' diff-col-base' : '';
  const body = '<p class="diff-para">' + (html || '<em style="color:var(--muted)">No text provided</em>') + '</p>';
  return `
    <div class="diff-col${cls}">
      <div class="diff-col-head">${title}</div>
      <div class="diff-col-body">${body}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// SCROLL SYNC
// ═══════════════════════════════════════════════════════════════════════

function attachScrollSync() {
  const bodies = [...document.querySelectorAll('.diff-col-body')];
  if (bodies.length < 2) return;
  let syncing = false;
  bodies.forEach(src => {
    src.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      const pct = src.scrollTop / Math.max(1, src.scrollHeight - src.clientHeight);
      bodies.forEach(tgt => {
        if (tgt !== src) tgt.scrollTop = pct * (tgt.scrollHeight - tgt.clientHeight);
      });
      requestAnimationFrame(() => { syncing = false; });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// CACI DATA (loaded from local file on startup)
// ═══════════════════════════════════════════════════════════════════════

function lookupCACIText(caciNum) {
  const key = String(parseInt(caciNum, 10));
  let text = caciDB[key];
  if (!text) throw new Error(`CACI ${caciNum} not found in local data`);

// Step 0: Join wrapped title lines (run up to 3 times for multi-line wraps)
const TITLE_SENTENCE_STARTERS = new Set([
  'To','In','If','On','At','By','For','From','Of','With','No','Not','Each',
  'Either','Neither','Both','All','Any','It','He','She','His','Her','Their',
  'Its','They','Or','And','But','Whether','When','Where','Who','Which','What',
  'How','As','You','We','See','Note','This','The','A','An','That','These'
]);
for (let i = 0; i < 3; i++) {
  const prev = text;
  // Paren continuations: (Corporate Liability...) etc.
  text = text.replace(
    /^(\d{3,4}\s*\.\s*[^\n]+)\n(\([^\n]{1,70})\n/gm,
    (_, t1, cont) => t1 + ' ' + cont + '\n'
  );
  // Word continuations: short line that is NOT a sentence-starter word
  text = text.replace(
    /^(\d{3,4}\s*\.\s*[^\n]+)\n([A-Z][^\n]{0,120})\n/gm,
    (_, t1, cont) => {
  const firstWord = cont.trim().split(/\s/)[0];
  if (cont.trim().length <= 30) return t1 + ' ' + cont + '\n';
  return TITLE_SENTENCE_STARTERS.has(firstWord) ? _ : t1 + ' ' + cont + '\n';
    }
  );
  if (text === prev) break;
}

 // 1. Strip "CACI No. XXXX [title]" running headers
text = text.replace(/^CACI No\.\s+\d{3,4}[^\n]*$/gm, '');

// 2. Strip orphaned ALL-CAPS series title lines (second line of split headers)
text = text.replace(/^[A-Z][A-Z\s\-\/]{5,}$/gm, '');

// 3. Strip bare page folio numbers
text = text.replace(/^\s*\d{1,4}\s*$/gm, '');

// 4. Strip revision history anchored to month name + year at end of text
text = text.replace(
  /\s+(?:New|Renumbered|Formerly)\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}[\s\S]*$/i,
  ''
);

// Add this BEFORE step 5 (the \n{3,} collapse):
text = text.replace(/^[ \t]+$/gm, '');  // blank out lines that are only whitespace

// NEW: Remove blank lines mid-paragraph (line before doesn't end a sentence)
text = text.replace(/([^.!?:\]\n])\n\n([^\n])/g, '$1\n$2');

// Re-split numbered list items that were merged onto one line by PDF extraction
text = text.replace(/(?<=\S)\s+(\d{1,2}\.\s+(?:That|The|A|An|Each|Whether|If|All|To|In|Any)\b)/g, '\n$1');

// Ensure title line is always separated from body by a blank line
text = text.replace(/^(\d{3,4}\s*\.\s*[^\n]+)\n(?!\n)/m, '$1\n\n');

// Join lines broken mid-sentence (PDF column-wrap artifact)
text = text.replace(/([^.!?:;\n])\n([a-z\[])/g, '$1 $2');
text = text.replace(/(\])\n([a-z])/g, '$1 $2');

// 5. Collapse extra blank lines
text = text.replace(/\n{3,}/g, '\n\n');

  text = flattenForCompare(text);

  return text.trim();
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPARE
// ═══════════════════════════════════════════════════════════════════════

async function runCompare() {
  const mode   = document.getElementById('compMode').value;
  const textA  = flattenForCompare(document.getElementById('versionA').value.trim());
  const textB  = flattenForCompare(document.getElementById('versionB').value.trim());
  const textC  = flattenForCompare(document.getElementById('officialCaci').value.trim());
  const statusEl   = document.getElementById('compareStatus');
  const diffColsEl = document.getElementById('diffCols');
  const sumCard    = document.getElementById('card-summary');
  const sumBody    = document.getElementById('sumBody');
  const yelLegend  = document.getElementById('yel-legend');
  const resultsEl  = document.getElementById('results');

  function setStatus(msg, cls = '') {
    statusEl.className = 'status ' + cls;
    statusEl.innerHTML = msg;
  }

  // Validate
  const reqs = { ab: [textA, textB], ao: [textA, textC], bo: [textB, textC], all: [textA, textB, textC] };
  const labels = { ab:'Version A and Version B', ao:'Version A and Official CACI', bo:'Version B and Official CACI', all:'all three texts' };
  if (reqs[mode].some(t => !t)) { setStatus(`Please provide ${labels[mode]}.`, 'err'); return; }

  // Reset
  setStatus('Computing diff…');
  resultsEl.classList.remove('hidden');
  sumCard.classList.add('hidden');
  yelLegend.classList.add('hidden');

  document.getElementById('compareBtn').disabled = true;
  await new Promise(r => setTimeout(r, 20));

  try {
    const tA = tokenize(textA), tB = tokenize(textB), tC = tokenize(textC);

    // ── TWO-WAY ──────────────────────────────────────────────────────

    if (mode === 'ab') {
      const ops = computeDiff(tA, tB);
      const c   = counts(ops);
      diffColsEl.innerHTML =
        colHtml('Version A — Base', renderLeft(ops)) +
        colHtml('Version B — Changes', renderRight(ops));
      setStatus(`${c.ins} addition(s) · ${c.del} deletion(s)`, 'ok');

    } else if (mode === 'ao') {
      const ops = computeDiff(tC, tA);
      const c   = counts(ops);
      diffColsEl.innerHTML =
        colHtml('Official CACI — Base', renderLeft(ops), true) +
        colHtml('Version A — Changes from CACI', renderRight(ops));
      setStatus(`${c.ins} addition(s) · ${c.del} deletion(s) from CACI`, 'ok');

    } else if (mode === 'bo') {
      const ops = computeDiff(tC, tB);
      const c   = counts(ops);
      diffColsEl.innerHTML =
        colHtml('Official CACI — Base', renderLeft(ops), true) +
        colHtml('Version B — Changes from CACI', renderRight(ops));
      setStatus(`${c.ins} addition(s) · ${c.del} deletion(s) from CACI`, 'ok');

    } else {
      // ── THREE-WAY ────────────────────────────────────────────────

      const { opsA, opsB, opsAB, countsCA, countsCB, countsAB, hasYellow } = threeWayDiff(tA, tC, tB);

      if (hasYellow) yelLegend.classList.remove('hidden');

      diffColsEl.innerHTML =
        colHtml('Version A', renderFull(opsA)) +
        colHtml('Official CACI — Base', esc(textC.replace(/\s+/g,' ').trim()), true) +
        colHtml('Version B', renderFull(opsB));

      sumCard.classList.remove('hidden');
      sumBody.innerHTML = `
        <tr><td>Version A vs Official CACI</td>
            <td><span class="badge badge-g">+${countsCA.ins}</span></td>
            <td><span class="badge badge-r">−${countsCA.del}</span></td>
            <td><span class="badge badge-b">${countsCA.total}</span></td></tr>
        <tr><td>Version B vs Official CACI</td>
            <td><span class="badge badge-g">+${countsCB.ins}</span></td>
            <td><span class="badge badge-r">−${countsCB.del}</span></td>
            <td><span class="badge badge-b">${countsCB.total}</span></td></tr>
        <tr><td>Version A vs Version B</td>
            <td><span class="badge badge-g">+${countsAB.ins}</span></td>
            <td><span class="badge badge-r">−${countsAB.del}</span></td>
            <td><span class="badge badge-b">${countsAB.total}</span></td></tr>`;

      setStatus(`A↔CACI: ${countsCA.total} change(s) · B↔CACI: ${countsCB.total} change(s) · A↔B: ${countsAB.total} change(s)`, 'ok');
    }

    attachScrollSync();

  } catch (err) {
    setStatus('Error: ' + err.message, 'err');
  } finally {
    document.getElementById('compareBtn').disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LOAD CACI
// ═══════════════════════════════════════════════════════════════════════

document.getElementById('loadCaci').addEventListener('click', () => {
  const num    = document.getElementById('caciNumber').value.trim();
  const statEl = document.getElementById('loadStatus');
  if (!num) { statEl.textContent = 'Enter a CACI number first.'; statEl.className = 'status err'; return; }

  try {
    const text = stripInstructionHeading(lookupCACIText(num));
    document.getElementById('officialCaci').value = text;
    statEl.textContent = `✓ Loaded CACI ${num}`;
    statEl.className = 'status ok';
  } catch (err) {
    statEl.textContent = `Error: ${err.message}`;
    statEl.className = 'status err';
  }
});

document.getElementById('caciNumber').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loadCaci').click();
});

document.getElementById('resetCaci').addEventListener('click', () => {
  const num    = document.getElementById('caciNumber').value.trim();
  const statEl = document.getElementById('loadStatus');
  if (!num) {
    document.getElementById('officialCaci').value = '';
    statEl.textContent = 'Enter a CACI number first.';
    statEl.className = 'status err';
    return;
  }
  try {
    const text = stripInstructionHeading(lookupCACIText(num));
    document.getElementById('officialCaci').value = text;
    statEl.textContent = `✓ Reset to official CACI ${num}`;
    statEl.className = 'status ok';
  } catch (err) {
    statEl.textContent = `Error: ${err.message}`;
    statEl.className = 'status err';
  }
});

// ═══════════════════════════════════════════════════════════════════════
// COMPARE BUTTON
// ═══════════════════════════════════════════════════════════════════════

document.getElementById('compareBtn').addEventListener('click', runCompare);

// ═══════════════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════════════

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab));
    document.getElementById('caseBar').classList.toggle('hidden', tab !== 'draft');
    // Pre-populate draft number from main tab if blank
    if (tab === 'draft') {
      const mainNum = document.getElementById('caciNumber').value.trim();
      const draftNumEl = document.getElementById('draftCaciNum');
      if (mainNum && !draftNumEl.value.trim()) draftNumEl.value = mainNum;
    }
  });
});

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
    if (f.type === 'dropdown' && f.selected === -1 && !f.custom)      unfilled.push(f);
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
    else if (f.type === 'dropdown') el = formEl.querySelector(`select[data-key="${f.key}"]`);
    else if (f.type === 'note')     el = formEl.querySelector(`textarea[data-key="${f.key}"]`);
    if (el) { el.style.borderColor = '#fbbf24'; el.style.background = '#fffbeb'; }
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
               value="${esc(f.value)}" placeholder="${esc(f.label)}…">
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
                   value="${esc(f.customValue)}" placeholder="Type custom value\u2026"
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
    const text = lookupCACIText(num);
    draftState = parseInstruction(text);
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

/* ─ Print & Export ─────────────────────────────────────────── */

function downloadTXT(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function setPrintHeader(text) {
  document.getElementById('print-header').textContent = text;
}

function doPrint(cls) {
  document.body.classList.add(cls);
  window.addEventListener('afterprint', function cleanup() {
    document.body.classList.remove(cls);
    window.removeEventListener('afterprint', cleanup);
  });
  window.print();
}

// ── Compare tab: Print / Save PDF ───────────────────────────
document.getElementById('printCompareBtn').addEventListener('click', () => {
  const num  = document.getElementById('caciNumber')?.value.trim() || '';
  const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  setPrintHeader('CACI Instruction Comparison' + (num ? ' — No. ' + num : '') + '   |   ' + date);
  doPrint('printing-compare');
});

// ── Compare tab: Export TXT ──────────────────────────────────
document.getElementById('exportCompareBtn').addEventListener('click', () => {
  const num      = document.getElementById('caciNumber')?.value.trim() || '';
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = num ? `CACI-compare-${num}-${dateSlug}.txt` : `CACI-compare-${dateSlug}.txt`;
  const text     = document.getElementById('results').innerText;
  downloadTXT(text, filename);
});

// ── Draft tab: Print / Save PDF ──────────────────────────────
document.getElementById('printDraftBtn').addEventListener('click', () => {
  const num  = document.getElementById('draftCaciNum')?.value.trim() || '';
  const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  setPrintHeader('CACI Instruction' + (num ? ' No. ' + num : '') + '   |   ' + date);
  doPrint('printing-draft');
});

// ── Draft tab: Export TXT ────────────────────────────────────
document.getElementById('exportDraftBtn').addEventListener('click', () => {
  const num      = document.getElementById('draftCaciNum')?.value.trim() || '';
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = num ? `CACI-${num}-${dateSlug}.txt` : `CACI-draft-${dateSlug}.txt`;
  downloadTXT(getDraftText(), filename);
});

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
  compileRow.classList.toggle('hidden', packetInstructions.length < 2);
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
    const text        = lookupCACIText(num);
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

// ═══════════════════════════════════════════════════════════════════════
// PRINT SETTINGS
// ═══════════════════════════════════════════════════════════════════════

const PS_FONTS = {
  serif: 'Georgia, "Times New Roman", serif',
  sans:  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:  '"Consolas", "Courier New", monospace',
};

function updatePrintSettings() {
  const font    = document.getElementById('ps-font').value;
  const size    = document.getElementById('ps-size').value;
  const spacing = document.getElementById('ps-spacing').value;
  const align   = document.getElementById('ps-align').value;
  const margins = document.getElementById('ps-margins').value;

  let tag = document.getElementById('print-settings');
  if (!tag) { tag = document.createElement('style'); tag.id = 'print-settings'; document.head.appendChild(tag); }

  tag.textContent = `@media print {
  body, .diff-col-body, .draft-preview-box { font-family: ${PS_FONTS[font]}; font-size: ${size}; line-height: ${spacing}; text-align: ${align}; }
}
@page { margin: ${margins}; }`;
}

document.getElementById('print-settings-toggle').addEventListener('click', () => {
  document.getElementById('print-settings-panel').classList.toggle('hidden');
});

['ps-font', 'ps-size', 'ps-spacing', 'ps-align', 'ps-margins'].forEach(id => {
  document.getElementById(id).addEventListener('change', updatePrintSettings);
});

updatePrintSettings(); // apply defaults on load

// ═══════════════════════════════════════════════════════════════════════
// CASE FILE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════

const CASE_KEY = 'caci_cases';

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

/** Serialize a parsedState for storage: convert fields Map → array of entries. */
function serializeParsedState(ps) {
  return { rawText: ps.rawText, segments: ps.segments, fields: [...ps.fields.entries()] };
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

function caseSave() {
  const name = document.getElementById('caseNameInput').value.trim();
  if (!name) { setCaseBarStatus('Enter a case name first.', 'err'); return; }
  const instructions = packetInstructions.map(e => ({
    caciNum: e.caciNum, label: e.label, parsedState: serializeParsedState(e.parsedState)
  }));
  try {
    const index = loadCaseIndex();
    index[name] = { instructions };
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
  packetInstructions = [];
  packetIdCounter    = 0;
  activePacketId     = null;
  for (const item of saved.instructions) {
    try {
      const freshState = parseInstruction(lookupCACIText(item.caciNum));
      applyFieldValues(freshState, item.parsedState.fields);
      packetInstructions.push({ id: ++packetIdCounter, caciNum: item.caciNum, label: item.label || '', parsedState: freshState });
    } catch (err) { console.warn(`Case load: skipped CACI ${item.caciNum} —`, err.message); }
  }
  document.getElementById('caseNameInput').value = name;
  renderPacketTray();
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
  packetInstructions = [];
  activePacketId     = null;
  renderPacketTray();
  setCaseBarStatus('Deleted.', 'ok');
}

function caseExport() {
  const name = document.getElementById('caseNameInput').value.trim() || 'case';
  const data = JSON.stringify({
    caseName: name,
    instructions: packetInstructions.map(e => ({
      caciNum: e.caciNum, label: e.label, parsedState: serializeParsedState(e.parsedState)
    }))
  }, null, 2);
  const dateSlug = new Date().toISOString().slice(0, 10);
  downloadTXT(data, `CACI-case-${name}-${dateSlug}.json`);
}

function caseImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !Array.isArray(data.instructions)) {
        setCaseBarStatus('Invalid case file format.', 'err'); return;
      }
      packetInstructions = [];
      packetIdCounter    = 0;
      activePacketId     = null;
      for (const item of data.instructions) {
        if (!item.caciNum || !item.parsedState || !Array.isArray(item.parsedState.fields)) continue;
        try {
          const freshState = parseInstruction(lookupCACIText(item.caciNum));
          applyFieldValues(freshState, item.parsedState.fields);
          packetInstructions.push({ id: ++packetIdCounter, caciNum: item.caciNum, label: item.label || '', parsedState: freshState });
        } catch (err) { console.warn(`Case import: skipped CACI ${item.caciNum} —`, err.message); }
      }
      if (data.caseName) document.getElementById('caseNameInput').value = data.caseName;
      renderPacketTray();
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
    packetInstructions = [];
    activePacketId     = null;
    document.getElementById('caseNameInput').value = '';
    renderPacketTray();
  } else {
    caseLoad(name);
  }
});

populateCaseSelect();
