'use strict';

// Polyfill DOMMatrix for pdfjs-dist (requires DOM APIs not present in Node.js)
if (!globalThis.DOMMatrix) {
  globalThis.DOMMatrix = require('@napi-rs/canvas').DOMMatrix;
}

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const PDF_PATH = path.join(__dirname, 'caci-2026.pdf');
const OUTPUT_PATH = path.join(__dirname, 'caci-data.json');
const MIN_BODY_LENGTH = 0;

// TOC lines contain ". . . . ." dot-leader sequences before a page number
const TOC_LINE_RE = /(\.\s){3,}/;

// Words that start sentences or in-body list items but NOT instruction titles.
// Real CACI titles are noun phrases: "Negligence", "Battery", "Contract Formation", etc.
const SENTENCE_STARTERS = new Set([
  'A', 'An', 'The', 'That', 'This', 'These', 'Those',
  'To', 'In', 'If', 'On', 'At', 'By', 'For', 'From', 'Of', 'With',
  'No', 'Not', 'Each', 'Either', 'Neither', 'Both', 'All', 'Any',
  'It', 'He', 'She', 'His', 'Her', 'Their', 'Its', 'They',
  'Or', 'And', 'But', 'Whether', 'When', 'Where', 'Who', 'Which', 'What', 'How', 'As',
  'You', 'We', 'Your', 'Our', 'There',
]);

/**
 * Groups text items by y-coordinate and sorts left-to-right within each line.
 * Inserts a blank line whenever the vertical gap between consecutive text lines
 * exceeds a threshold, marking paragraph and section breaks.
 *
 * In PDF coordinate space y=0 is at the bottom, so descending y = top-to-bottom.
 */
function extractPageText(textContent) {
  const items = textContent.items.filter(item => item.str.trim());
  if (items.length === 0) return '';

  // Group items sharing the same baseline y (rounded to nearest point)
  const lineMap = new Map();
  for (const item of items) {
    const y = Math.round(item.transform[5]);
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y).push(item);
  }

  // Sort lines top-to-bottom (descending y in PDF space)
  const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

  const lines = [];
  let prevY = null;
  for (const y of sortedYs) {
    if (prevY !== null && (prevY - y) > 20) {
      // Gap larger than ~1.5 normal line heights → paragraph or section break.
      // Insert a blank line so the parser can detect section boundaries.
      lines.push('');
    }
    const lineItems = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
    lines.push(lineItems.map(item => item.str).join(' ').trim());
    prevY = y;
  }

  return lines.join('\n');
}

/**
 * Returns true only if this line is a genuine CACI instruction header.
 *
 * Guards against false positives:
 *  1. 3–4 digit number requirement — CACI numbers are always 100–4999;
 *     single/double-digit numbers are body list items or verdict form questions.
 *  2. TOC dot-leader filter — rejects "302. Title . . . . 34" TOC entries.
 *  3. Sentence-starter filter — rejects list items like "302. That the defendant…"
 *  4. End-punctuation filter — list items end with ; or ,
 *  5. Placeholder filter — in-body items contain [name of…] markers
 */
function isInstructionHeader(line) {
  // Must start with: 3–4 digits, optional space, period, space, optional opening quote, uppercase letter.
  // TOC format:  302. Contract Formation
  // Page format: 302 . Contract Formation   (space before period on actual instruction pages)
  // Quoted:      3113. "Recklessness" Explained
  const match = line.match(/^(\d{3,4})\s*\.\s+["\u201C]?([A-Z]\S*)/);
  if (!match) return false;

  // Reject TOC dot-leader lines
  if (TOC_LINE_RE.test(line)) return false;

  // Reject if the first title word is a sentence/list-item starter
  if (SENTENCE_STARTERS.has(match[2])) return false;

  // Reject if the line contains in-body placeholder markers
  if (line.includes('[name of') || line.includes('[insert') || line.includes('[describe')) return false;

  return true;
}

function getInstructionNumber(line) {
  const m = line.match(/^(\d{3,4})\s*\./);
  return m ? m[1] : null;
}

/**
 * Splits the full extracted text into a map of { instructionNumber → bodyText }.
 * Short entries (< MIN_BODY_LENGTH chars) are discarded as TOC artifacts.
 */
function parseInstructions(fullText) {
  const instructions = {};
  let currentKey = null;
  let currentLines = [];

  for (const line of fullText.split('\n')) {
    const trimmed = line.trim();

    if (isInstructionHeader(trimmed)) {
      // Flush the completed previous instruction — keep whichever version is longer
      // (actual instruction pages are longer than TOC/index re-listings of the same number)
      if (currentKey !== null) {
        const body = currentLines.join('\n').trim();
        if (body.length >= MIN_BODY_LENGTH) {
          const existing = instructions[currentKey];
          if (!existing || body.length > existing.length) {
            instructions[currentKey] = body;
          }
        }
      }
      currentKey = getInstructionNumber(trimmed);
      currentLines = [trimmed];
    } else if (currentKey !== null) {
      currentLines.push(trimmed);
    }
    // Lines before the first real header are silently ignored (title page, TOC, index)
  }

  // Flush the final instruction — keep whichever version is longer
  if (currentKey !== null) {
    const body = currentLines.join('\n').trim();
    if (body.length >= MIN_BODY_LENGTH) {
      const existing = instructions[currentKey];
      if (!existing || body.length > existing.length) {
        instructions[currentKey] = body;
      }
    }
  }

  // Post-process: stray fragment cleanup and Directions for Use split
  const result = {};
  for (const [key, value] of Object.entries(instructions)) {
    // Drop any entry whose value doesn't begin with "key." (stray fragment)
    if (!new RegExp(`^${key}\\s*\\.`).test(value)) continue;

    // Split out "Directions for Use" section if present
    const dirIdx = value.search(/\nDirections for Use\b/i);
    if (dirIdx !== -1) {
      result[key] = value.slice(0, dirIdx).trim();
      result[`${key}_directions`] = value.slice(dirIdx + 1).trim();
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`ERROR: PDF not found at ${PDF_PATH}`);
    process.exit(1);
  }

  console.log(`Loading PDF: ${PDF_PATH}`);
  const dataBuffer = fs.readFileSync(PDF_PATH);

  // Dynamic ESM import required because pdfjs-dist legacy build ships .mjs only
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) });
  const pdfDocument = await loadingTask.promise;
  console.log(`Total pages: ${pdfDocument.numPages}`);

  const pageTexts = [];
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    if (i % 100 === 0) console.log(`  Extracting page ${i}/${pdfDocument.numPages}...`);
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    pageTexts.push(extractPageText(textContent));
  }

  console.log('Text extraction complete. Parsing instructions...');

  // Join pages with a blank line so each page boundary counts as a section separator,
  // allowing the first header on a new page to be detected by isInstructionHeader.
  const fullText = pageTexts.join('\n\n');

  const instructions = parseInstructions(fullText);
  const count = Object.keys(instructions).length;

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(instructions, null, 2), 'utf8');
  console.log(`Done. Parsed ${count} instruction(s) → ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
