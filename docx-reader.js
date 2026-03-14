'use strict';

// ═══════════════════════════════════════════════════════════════════════
// DOCX INSTRUCTION READER
// Parses a DOCX file (ArrayBuffer) into an array of CACI instructions.
// Uses readZipEntries / inflateRawBrowser / concatU8 from app-shared.js.
// ═══════════════════════════════════════════════════════════════════════

const DOCX_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

// Regex for CACI instruction titles
const CACI_TITLE_RE = /^CACI\s*(?:No\.?\s*)?(\d+[A-Za-z]?)\s*[:\u2013\u2014\-.\s]\s*(.*)/i;
// Regex for special instructions (S-1, Plaintiff's S-1, etc.)
const SPECIAL_TITLE_RE = /^(?:(?:Plaintiff|Defendant)(?:'s|s')?\s+)?(S-\d+)\s*[:\u2013\u2014\-.\s]\s*(.*)/i;

/**
 * Build a set of short text strings that appear 3+ times in the document.
 * These are almost certainly header/footer artifacts from PDF-to-Word conversion
 * (firm addresses, phone numbers, document titles repeated on every page).
 * Excludes sentence-like body text and parser keywords from the noise set.
 */
function buildNoiseSet(paragraphs) {
  const counts = new Map();
  for (const p of paragraphs) {
    const t = p.text.trim();
    if (!t || t.length > 80) continue; // only short text can be header/footer noise
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  const noiseSet = new Set();
  for (const [text, count] of counts) {
    if (count < 3) continue;
    // Preserve parser keywords that have specific handling
    if (/^(?:Authority|Reservation of Objection)\s*:/i.test(text)) continue;
    // Preserve sentence-like body text (ends with punctuation + enough words)
    const words = text.split(/\s+/).length;
    if (words > 6 && /[.;!?]$/.test(text)) continue;
    // Preserve text starting with common sentence starters
    if (/^(?:That|The|A|An|If|When|Each|Whether|To|In|Any|You|Do|It|This)\b/.test(text) && words > 3) continue;
    noiseSet.add(text);
  }
  return noiseSet;
}

/**
 * Parse a DOCX ArrayBuffer into an array of instructions.
 * Returns: [{ caciNum: string|null, title: string, text: string, special: boolean }]
 */
async function parseDocxInstructions(arrayBuffer) {
  const entries = await readZipEntries(arrayBuffer);
  const docEntry = entries.find(e => e.name === 'word/document.xml');
  if (!docEntry) throw new Error('Invalid DOCX: word/document.xml not found');

  const xmlText = new TextDecoder().decode(docEntry.data);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  // Check for XML parse errors (corrupted or non-DOCX file)
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) throw new Error('File appears corrupted or is not a valid DOCX');

  // Extract all paragraphs with style and formatting info
  const paragraphs = extractParagraphs(doc);

  // Build repeated-text noise set (header/footer artifacts)
  const noiseSet = buildNoiseSet(paragraphs);

  // Detect which parsing strategy to use
  const hasHeadingStyles = paragraphs.some(p => /^Heading\s*1$/i.test(p.style));

  if (hasHeadingStyles) {
    return parseByHeadingStyle(paragraphs, noiseSet);
  } else {
    return parseByFormatting(paragraphs, noiseSet);
  }
}

/**
 * Extract paragraph data from parsed DOCX XML.
 * Returns: [{ text, style, isBold, isCentered, hasPageBreak, hasColumnBreak }]
 */
function extractParagraphs(doc) {
  const body = doc.getElementsByTagNameNS(DOCX_NS, 'body')[0];
  if (!body) return [];

  const wParas = body.getElementsByTagNameNS(DOCX_NS, 'p');
  const result = [];

  for (let i = 0; i < wParas.length; i++) {
    const p = wParas[i];
    const pPr = p.getElementsByTagNameNS(DOCX_NS, 'pPr')[0];

    // Style
    let style = 'Normal';
    if (pPr) {
      const pStyle = pPr.getElementsByTagNameNS(DOCX_NS, 'pStyle')[0];
      if (pStyle) style = pStyle.getAttribute('w:val') || 'Normal';
    }

    // Alignment
    let isCentered = false;
    if (pPr) {
      const jc = pPr.getElementsByTagNameNS(DOCX_NS, 'jc')[0];
      if (jc && jc.getAttribute('w:val') === 'center') isCentered = true;
    }

    // Check for page break before (paragraph-level)
    let hasPageBreak = false;
    if (pPr) {
      const pbBefore = pPr.getElementsByTagNameNS(DOCX_NS, 'pageBreakBefore')[0];
      if (pbBefore) hasPageBreak = true;
    }

    // Extract runs — text, bold, page breaks, column breaks
    const runs = p.getElementsByTagNameNS(DOCX_NS, 'r');
    let text = '';
    let allRunsBold = runs.length > 0;
    let hasColumnBreak = false;

    for (let r = 0; r < runs.length; r++) {
      const run = runs[r];

      // Check for breaks within runs
      const brs = run.getElementsByTagNameNS(DOCX_NS, 'br');
      for (let b = 0; b < brs.length; b++) {
        const brType = brs[b].getAttribute('w:type');
        if (brType === 'page') hasPageBreak = true;
        if (brType === 'column') hasColumnBreak = true;
      }

      // Bold check
      const rPr = run.getElementsByTagNameNS(DOCX_NS, 'rPr')[0];
      let isBold = false;
      if (rPr) {
        const bEl = rPr.getElementsByTagNameNS(DOCX_NS, 'b')[0];
        if (bEl) {
          const val = bEl.getAttribute('w:val');
          isBold = val === null || val === 'true' || val === '1';
        }
      }
      if (!isBold) allRunsBold = false;

      // Collect text
      const tEls = run.getElementsByTagNameNS(DOCX_NS, 't');
      for (let t = 0; t < tEls.length; t++) {
        text += tEls[t].textContent || '';
      }
    }

    result.push({
      text: text,
      style: style,
      isBold: allRunsBold && runs.length > 0,
      isCentered: isCentered,
      hasPageBreak: hasPageBreak,
      hasColumnBreak: hasColumnBreak,
    });
  }

  return result;
}

/**
 * Parse using Heading 1 style as delimiters (PDF-to-Word documents).
 * Filters out line-number sequences, firm name blocks, footer lines,
 * address/phone noise, and repeated header/footer text.
 */
function parseByHeadingStyle(paragraphs, noiseSet) {
  const instructions = [];
  let current = null;

  // Noise filters for PDF-to-Word artifacts
  const isLineNumber = (t) => /^\d{1,2}$/.test(t);
  const isFooterLine = (t) => /^\d{5,}/.test(t);
  const isFirmName   = (t) => t.length < 80 &&
    /(?:LLP|LLC|P\.?C\.?|Law\s+(?:Firm|Office|Group)|Esq\.|Attorney)/i.test(t);
  const isAddress    = (t) => t.length < 100 &&
    /(?:,\s*(?:CA|California|[A-Z]{2})\s+\d{5}|Suite\s+\d|^\d+\s+\w+.+(?:Blvd|Boulevard|Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Way|Place|Pl)\b)/i.test(t);
  const isPhoneFax   = (t) => t.length < 80 &&
    /^(?:Tel|Fax|Phone|Telephone|Facsimile)\s*[:.]?\s*\(?[\d]/i.test(t);
  const isDocTitle   = (t) =>
    /^\[?(?:PROPOSED|DEFENDANTS?|PLAINTIFFS?).{0,20}(?:JURY\s+INSTRUCTIONS|VERDICT\s+FORM)/i.test(t);
  const isEmail      = (t) => t.length < 80 && /^E-?[Mm]ail\s*:/i.test(t);

  function isNoise(p) {
    const t = p.text.trim();
    if (!t) return true;
    if (noiseSet.has(t)) return true;
    if (isLineNumber(t)) return true;
    if (isFooterLine(t)) return true;
    if (isFirmName(t)) return true;
    if (isAddress(t)) return true;
    if (isPhoneFax(t)) return true;
    if (isDocTitle(t)) return true;
    if (isEmail(t)) return true;
    return false;
  }

  for (const p of paragraphs) {
    const trimmed = p.text.trim();
    if (isNoise(p)) continue;

    const isH1 = /^Heading\s*1$/i.test(p.style);

    if (isH1 && trimmed) {
      // Check if this heading is a CACI instruction title
      const caciMatch = trimmed.match(CACI_TITLE_RE);
      const specialMatch = trimmed.match(SPECIAL_TITLE_RE);

      if (caciMatch) {
        if (current) instructions.push(current);
        current = {
          caciNum: caciMatch[1],
          title: caciMatch[2].trim() || trimmed,
          lines: [],
          special: false,
        };
        continue;
      } else if (specialMatch) {
        if (current) instructions.push(current);
        current = {
          caciNum: null,
          title: specialMatch[1] + ': ' + (specialMatch[2].trim() || trimmed),
          lines: [],
          special: true,
        };
        continue;
      }
      // Non-instruction heading (firm name, court, proof of service) — skip
      continue;
    }

    // Body content — accumulate if inside an instruction
    if (current && trimmed) {
      // Skip "Authority:" and "Reservation of Objection:" sub-sections
      if (/^(?:Authority|Reservation of Objection)\s*:/i.test(trimmed)) {
        // Push current and stop accumulating (authority sections are after body)
        instructions.push(current);
        current = null;
        continue;
      }
      current.lines.push(trimmed);
    }
  }

  if (current) instructions.push(current);

  return instructions.map(inst => ({
    caciNum: inst.caciNum,
    title: inst.title,
    text: inst.lines.join('\n'),
    special: inst.special,
  }));
}

/**
 * Parse using formatting detection (clean Word documents).
 * Title = centered + bold + matches CACI pattern.
 * Also detects CACI titles without formatting as a fallback (the CACI_TITLE_RE
 * pattern is specific enough that false positives in body text are rare).
 */
function parseByFormatting(paragraphs, noiseSet) {
  const instructions = [];
  let current = null;

  for (const p of paragraphs) {
    const trimmed = p.text.trim();
    if (!trimmed) continue;
    if (noiseSet.has(trimmed)) continue;

    // Detect instruction title: prefer centered/bold, but also detect
    // CACI titles without formatting (handles inconsistent Word docs)
    const caciMatch = trimmed.match(CACI_TITLE_RE);
    const specialMatch = !caciMatch ? trimmed.match(SPECIAL_TITLE_RE) : null;

    if (caciMatch) {
      if (current) instructions.push(current);
      current = {
        caciNum: caciMatch[1],
        title: caciMatch[2].trim() || trimmed,
        lines: [],
        special: false,
      };
      continue;
    } else if (specialMatch && (p.isCentered || p.isBold)) {
      if (current) instructions.push(current);
      current = {
        caciNum: null,
        title: specialMatch[1] + ': ' + (specialMatch[2].trim() || trimmed),
        lines: [],
        special: true,
      };
      continue;
    }

    // Body content
    if (current && trimmed) {
      current.lines.push(trimmed);
    }
  }

  if (current) instructions.push(current);

  return instructions.map(inst => ({
    caciNum: inst.caciNum,
    title: inst.title,
    text: inst.lines.join('\n'),
    special: inst.special,
  }));
}

/**
 * Match two instruction sets by CACI number.
 * Returns { matched, aOnly, bOnly, specials }
 */
function matchInstructions(instA, instB) {
  const mapA = new Map();
  const mapB = new Map();
  const specialsA = [];
  const specialsB = [];
  const duplicates = [];  // track skipped duplicate CACI numbers

  for (const inst of instA) {
    if (inst.caciNum) {
      if (mapA.has(inst.caciNum)) {
        duplicates.push({ caciNum: inst.caciNum, party: 'A' });
      } else {
        mapA.set(inst.caciNum, inst);
      }
    } else {
      specialsA.push(inst);
    }
  }
  for (const inst of instB) {
    if (inst.caciNum) {
      if (mapB.has(inst.caciNum)) {
        duplicates.push({ caciNum: inst.caciNum, party: 'B' });
      } else {
        mapB.set(inst.caciNum, inst);
      }
    } else {
      specialsB.push(inst);
    }
  }

  const matched = [];
  const aOnly = [];
  const bOnly = [];

  // All CACI numbers from both sides, sorted numerically
  const allNums = new Set([...mapA.keys(), ...mapB.keys()]);
  const sorted = [...allNums].sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    return na - nb || a.localeCompare(b);
  });

  for (const num of sorted) {
    const a = mapA.get(num);
    const b = mapB.get(num);
    if (a && b) {
      matched.push({
        caciNum: num,
        titleA: a.title,
        textA: a.text,
        titleB: b.title,
        textB: b.text,
      });
    } else if (a) {
      aOnly.push({ caciNum: num, title: a.title, text: a.text });
    } else {
      bOnly.push({ caciNum: num, title: b.title, text: b.text });
    }
  }

  const specials = [
    ...specialsA.map(s => ({ ...s, party: 'A' })),
    ...specialsB.map(s => ({ ...s, party: 'B' })),
  ];

  return { matched, aOnly, bOnly, specials, duplicates };
}
