'use strict';

// ═══════════════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════════════════

const esc     = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => esc(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); // C1: safe for HTML attributes

// ═══════════════════════════════════════════════════════════════════════
// CACI DATA (loaded from local file on startup)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Apply all PDF-extraction cleanup steps to raw CACI text, but do NOT
 * call flattenForCompare. Used by the Draft tab so bracket structure
 * (alternative signal brackets, optional blocks) is preserved for
 * parseInstruction.
 */
function lookupCACITextForDraft(caciNum) {
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
text = text.replace(/([^.!?:\]"'\)\n])\n\n([^\n])/g, '$1\n$2');

// Re-split numbered list items that were merged onto one line by PDF extraction
text = text.replace(/(?<=\S)\s+(\d{1,2}\.\s+(?:That|The|A|An|Each|Whether|If|All|To|In|Any)\b)/g, '\n$1');

// Ensure title line is always separated from body by a blank line
text = text.replace(/^(\d{3,4}\s*\.\s*[^\n]+)\n(?!\n)/m, '$1\n\n');

// Join lines broken mid-sentence (PDF column-wrap artifact)
text = text.replace(/([^.!?:;\n])\n([a-z\[])/g, '$1 $2');
text = text.replace(/(\])\n([a-z])/g, '$1 $2');

// 5. Collapse extra blank lines
text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Same as lookupCACITextForDraft plus flattenForCompare, for the Compare tab.
 */
function lookupCACIText(caciNum) {
  return flattenForCompare(lookupCACITextForDraft(caciNum));
}

// ═══════════════════════════════════════════════════════════════════════
// PRINT & EXPORT UTILITIES
// ═══════════════════════════════════════════════════════════════════════

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
// PDF EXPORT ENGINE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Export sections as a PDF file using pdfmake (silent Blob download).
 * sections: [{heading: string, body: string (plain text, paragraphs separated by \n\n)}]
 * filename: string e.g. 'CACI-302.pdf'
 */
function exportPDF(sections, filename) {
  if (typeof pdfMake === 'undefined') {
    alert('PDF library not loaded. Check your internet connection and reload.');
    return;
  }

  const fontKey    = document.getElementById('ps-font').value;
  const sizeStr    = document.getElementById('ps-size').value;
  const spacingStr = document.getElementById('ps-spacing').value;
  const alignVal   = document.getElementById('ps-align').value;
  const marginsVal = document.getElementById('ps-margins').value;

  const PDF_FONTS  = { serif: 'Times', sans: 'Roboto', mono: 'Courier' };
  const fontPdf    = PDF_FONTS[fontKey] || 'Times';
  const sizeNum    = parseFloat(sizeStr)    || 11;
  const spacingNum = parseFloat(spacingStr) || 1.5;

  const MARGIN_PTS = { '1in': 72, '1.5in': 108, '0.5in': 36 };
  const m          = MARGIN_PTS[marginsVal] || 72;

  const content = [];
  sections.forEach((section, i) => {
    const headingPara = {
      text:         section.heading,
      bold:         true,
      alignment:    'center',
      fontSize:     sizeNum + 1,
      marginBottom: 12,
    };
    if (i > 0) headingPara.pageBreak = 'before';
    content.push(headingPara);

    const blocks = section.body.split(/\n\n/).filter(b => b.trim());
    for (const block of blocks) {
      content.push({
        text:         block.trim(),
        alignment:    alignVal,
        marginBottom: 6,
      });
    }
  });

  pdfMake.createPdf({
    pageSize:        'LETTER',
    pageOrientation: 'portrait',
    pageMargins:     [m, m, m, m],
    defaultStyle: {
      font:       fontPdf,
      fontSize:   sizeNum,
      lineHeight: spacingNum,
    },
    content,
  }).download(filename);
}

// Close all export pickers when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.export-picker').forEach(p => p.classList.add('hidden'));
});

// ═══════════════════════════════════════════════════════════════════════
// ZIP UTILITIES (shared — used by pleading-shell.js, docx-reader.js)
// ═══════════════════════════════════════════════════════════════════════

async function inflateRawBrowser(compData) {
  const input  = compData instanceof Uint8Array ? compData
               : new Uint8Array(compData.buffer, compData.byteOffset, compData.byteLength);
  const ds     = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(input);
  writer.close();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out   = new Uint8Array(total);
  let   off   = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function concatU8(arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const res = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    res.set(a, offset);
    offset += a.length;
  }
  return res;
}

async function readZipEntries(zipBuf) {
  const entries = [];
  const u8 = zipBuf instanceof Uint8Array ? zipBuf : new Uint8Array(zipBuf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let pos = 0;
  while (pos < u8.length - 4) {
    if (dv.getUint32(pos, true) === 0x04034b50) {
      const compression = dv.getUint16(pos + 8, true);
      const compSize    = dv.getUint32(pos + 18, true);
      const fnLen       = dv.getUint16(pos + 26, true);
      const extraLen    = dv.getUint16(pos + 28, true);
      const nameBytes   = u8.subarray(pos + 30, pos + 30 + fnLen);
      const name        = new TextDecoder().decode(nameBytes);
      const dataStart   = pos + 30 + fnLen + extraLen;
      const compData    = u8.subarray(dataStart, dataStart + compSize);
      let data;
      if (compression === 8) {
        data = await inflateRawBrowser(compData);
      } else {
        data = compData;
      }
      entries.push({ name, data });
      pos = dataStart + compSize;
    } else {
      pos++;
    }
  }
  return entries;
}
