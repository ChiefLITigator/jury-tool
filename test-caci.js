const { parseInstruction, findTopLevelBrackets } = require('./draft-parser.js');
const db = require('./caci-data.json');
const KNOWN_EXCEPTIONS = new Set(['224', '904', '905']);
const results = { total: 0, noFields: 0, allText: 0, errors: [] };

for (const [key, text] of Object.entries(db)) {
  if (key.includes('_')) continue; // skip _directions keys
  results.total++;

  // Test 1: Does any instruction throw an error during parse?
  try {
    const { fields } = parseInstruction(text);
    // Test 2: Flag instructions where EVERY bracket became 'text' type
    // (likely a classifier miss)
    const types = [...fields.values()].map(f => f.type);
    if (types.length > 5 && types.every(t => t === 'text')) {
      results.allText++;
      const brackets = findTopLevelBrackets(text).map(b => b.content);
      results.errors.push({ key, issue: 'all brackets classified as text', brackets });
    }

    // Test 3: Flag instructions with zero fields despite having brackets
    if (!KNOWN_EXCEPTIONS.has(key) && /\[/.test(text) && types.length === 0) {
      results.noFields++;
      const brackets = findTopLevelBrackets(text).map(b => b.content);
      results.errors.push({ key, issue: 'has brackets but no fields parsed', brackets });
    }
  } catch(e) {
    results.errors.push({ key, issue: e.message, brackets: [] });
  }
}

console.log(`Tested ${results.total} instructions`);
console.log(`All-text misclassifications: ${results.allText}`);
console.log(`Bracket-but-no-field: ${results.noFields}`);
results.errors.slice(0, 15).forEach(e => {
  console.log(e.key, '→', e.issue);
  (e.brackets || []).forEach(b => console.log('  [' + b + ']'));
});

// ── Pass 2: suspicious all-text results in known optional/alt-element series ──
const SUSPICIOUS_SERIES = [
  [300, 399], [600, 699], [1000, 1099],
  [1200, 1299], [1900, 1999], [2000, 2099],
];
function inSuspiciousSeries(key) {
  const n = parseInt(key, 10);
  return !isNaN(n) && SUSPICIOUS_SERIES.some(([lo, hi]) => n >= lo && n <= hi);
}

console.log('\n── Pass 2: all-text in known optional/alt-element series ──');
let suspiciousCount = 0;
for (const [key, text] of Object.entries(db)) {
  if (key.includes('_') || !inSuspiciousSeries(key)) continue;
  if (!/\[/.test(text)) continue;
  try {
    const { fields } = parseInstruction(text);
    const types = [...fields.values()].map(f => f.type);
    if (types.length > 0 && types.every(t => t === 'text')) {
      suspiciousCount++;
      const brackets = findTopLevelBrackets(text).map(b => b.content);
      console.log(key, '→ all fields text (' + types.length + ' bracket' + (types.length === 1 ? '' : 's') + ')');
      brackets.forEach(b => console.log('  [' + b + ']'));
    }
  } catch(e) { /* already caught in pass 1 */ }
}
console.log(`Suspicious all-text count: ${suspiciousCount}`);

// ── Pass 3: [N. [and] alternative signal variants ──────────────────────
console.log('\n── Pass 3: [N. [and] alternative signal variants ──');
const andSignalPattern = /\[\d+\.\s*\[\s*and\s*\]/;
let andSignalCount = 0;
for (const [key, text] of Object.entries(db)) {
  if (key.includes('_')) continue;
  if (andSignalPattern.test(text)) {
    andSignalCount++;
    const matches = text.match(new RegExp('\\[\\d+\\.\\s*\\[\\s*and\\s*\\][^\\n]*', 'g')) || [];
    console.log(key, '→ [N. [and]] pattern found');
    matches.forEach(m => console.log('  ' + m.trim().slice(0, 100)));
  }
}
console.log(`[N. [and]] count: ${andSignalCount}`);

// ── Pass 4: brackets containing "e.g." (normalized text, with classified type) ──
console.log('\n── Pass 4: brackets containing "e.g." ──');
// Inline the same normalization used in parseInstruction so nested brackets
// inside unclosed [N. [or] blocks are visible at top level.
function normalizeText(t) {
  return t.replace(/(\[\d+\.\s*\[\s*or\s*\])(?!\])/g, '$1]');
}
const { parseInstruction: _pi, findTopLevelBrackets: _ftlb } = require('./draft-parser.js');
let egCount = 0;
for (const [key, text] of Object.entries(db)) {
  if (key.includes('_')) continue;
  if (!/e\.g\./.test(text)) continue;
  const norm = normalizeText(text);
  const brackets = findTopLevelBrackets(norm).filter(b => /e\.g\./.test(b.content));
  if (brackets.length === 0) continue;
  egCount++;
  console.log(key, '→', brackets.length, 'bracket(s) with e.g.');
  brackets.forEach(b => {
    const { fields } = parseInstruction(text);
    const snip = b.content.trim().replace(/\s+/g, ' ').slice(0, 120);
    // find what type this bracket got classified as
    const mk = b.content.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_/]/g,'').slice(0,60);
    const field = [...fields.values()].find(f => f.key === mk);
    const classifiedAs = field ? field.type : '(not in fields — likely consumed/nested)';
    console.log('  type=' + classifiedAs + '  [' + snip + ']');
  });
}
console.log(`Instructions with e.g. brackets: ${egCount}`);
