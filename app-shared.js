'use strict';

// ═══════════════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════════════════

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

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
 * Build a complete HTML document for printing as PDF.
 * sections: [{heading: string, body: string (HTML)}]
 * type: 'instruction' | 'vf'
 */
function buildPrintHTML(sections, type) {
  const fontKey = document.getElementById('ps-font').value;
  const font    = PS_FONTS[fontKey] || PS_FONTS.serif;
  const size    = document.getElementById('ps-size').value;
  const spacing = document.getElementById('ps-spacing').value;
  const align   = document.getElementById('ps-align').value;
  const margins = document.getElementById('ps-margins').value;

  const bodyParts = sections.map((section, i) => {
    const breakStyle = i === 0 ? '' : 'page-break-before:always;';
    return `<div class="pdf-section" style="${breakStyle}margin:0;padding:0">
      <div class="pdf-heading">${esc(section.heading)}</div>
      <div class="pdf-body">${section.body}</div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
@page { size: letter portrait; margin: ${margins}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: ${font}; font-size: ${size}; line-height: ${spacing}; text-align: ${align}; color: #111827; background: white; }
.pdf-heading { font-size: 1.05em; font-weight: bold; margin-bottom: 1em; text-align: left; }
.pdf-para { text-indent: 2em; margin: 0 0 0.75em 0; }
</style></head><body>${bodyParts}</body></html>`;
}

/**
 * Print-to-PDF via hidden iframe. Triggers the browser's print dialog.
 */
function exportPDF(htmlContent, filename) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
  document.body.appendChild(iframe);
  const fallback = setTimeout(() => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }, 60000);
  iframe.addEventListener('load', () => {
    iframe.contentWindow.addEventListener('afterprint', () => {
      clearTimeout(fallback);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    });
    iframe.contentWindow.print();
  });
  iframe.srcdoc = htmlContent;
}

// Close all export pickers when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.export-picker').forEach(p => p.classList.add('hidden'));
});
