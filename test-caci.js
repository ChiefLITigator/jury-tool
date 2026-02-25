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
