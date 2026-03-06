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

/** Full redline: equal plain, insert green, delete red, yellow conflicts */
function renderFull(ops) {
  return ops.map(o => {
    const t = esc(o.text);
    switch (o.op) {
      case 'equal':  return t + ' ';
      case 'insert': return `<span class="ins">${t}</span> `;
      case 'delete': return `<span class="del">${t}</span> `;
      case 'yellow': return `<span class="yel">${t}</span> `;
      default:       return '';
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

      const caciHtml = esc(textC).replace(/\n{2,}/g, '</p><p class="diff-para">');
      diffColsEl.innerHTML =
        colHtml('Version A', renderFull(opsA)) +
        colHtml('Official CACI — Base', caciHtml, true) +
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
    document.getElementById('caseBar').classList.toggle('hidden', tab !== 'draft' && tab !== 'vf');
    // Pre-populate draft number from main tab if blank
    if (tab === 'draft') {
      const mainNum = document.getElementById('caciNumber').value.trim();
      const draftNumEl = document.getElementById('draftCaciNum');
      if (mainNum && !draftNumEl.value.trim()) draftNumEl.value = mainNum;
    }
  });
});

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
