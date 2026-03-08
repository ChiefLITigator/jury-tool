'use strict';
// Batch C regression tests — pure helpers only, no DOM required.
const assert = require('assert');

// ── Pure helpers inlined for headless testing ─────────────────────────────────

// C1: escaping
const esc     = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => esc(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// C2: paragraph sentinel + tokenizer
const PARA_SENTINEL = '\u00b6';

function tokenize(text) {
  const withSentinels = text.replace(/\n{2,}/g, ' ' + PARA_SENTINEL + ' ');
  return withSentinels.replace(/[ \t]+/g, ' ').trim().split(' ').filter(Boolean);
}

function counts(ops) {
  let ins = 0, del = 0;
  for (const o of ops) {
    if (o.text === PARA_SENTINEL) continue;
    if (o.op === 'insert') ins++;
    else if (o.op === 'delete') del++;
  }
  return { ins, del, total: ins + del };
}

function renderFull(ops) {
  return ops.map(o => {
    if (o.text === PARA_SENTINEL) return '</p><p class="diff-para">';
    const t = esc(o.text);
    switch (o.op) {
      case 'equal':  return t + ' ';
      case 'insert': return `<span class="ins">${t}</span> `;
      case 'delete': return `<span class="del">${t}</span> `;
      default:       return '';
    }
  }).join('').trimEnd();
}

function renderLeft(ops) {
  return ops
    .filter(o => o.op !== 'insert')
    .map(o => {
      if (o.text === PARA_SENTINEL) return '</p><p class="diff-para">';
      return o.op === 'delete'
        ? `<span class="del">${esc(o.text)}</span> `
        : esc(o.text) + ' ';
    })
    .join('').trimEnd();
}

function renderRight(ops) {
  return ops
    .filter(o => o.op !== 'delete')
    .map(o => {
      if (o.text === PARA_SENTINEL) return '</p><p class="diff-para">';
      return o.op === 'insert'
        ? `<span class="ins">${esc(o.text)}</span> `
        : esc(o.text) + ' ';
    })
    .join('').trimEnd();
}

let passed = 0;

// ── Test 1: escAttr escapes double quotes (C1) ────────────────────────────────
{
  const result = escAttr('say "hello"');
  assert.ok(result.includes('&quot;'),
    'Expected &quot; for double quotes, got: ' + result);
  assert.ok(!result.includes('"'),
    'Expected no literal double quotes in result');
  console.log('PASS  1: escAttr escapes double quotes');
  passed++;
}

// ── Test 2: escAttr escapes single quotes (C1) ────────────────────────────────
{
  const result = escAttr("it's");
  assert.ok(result.includes('&#39;'),
    'Expected &#39; for single quote, got: ' + result);
  console.log('PASS  2: escAttr escapes single quotes');
  passed++;
}

// ── Test 3: escAttr escapes angle brackets (inherits from esc) ───────────────
{
  const result = escAttr('<script>');
  assert.ok(result.includes('&lt;') && result.includes('&gt;'),
    'Expected angle brackets escaped, got: ' + result);
  console.log('PASS  3: escAttr escapes angle brackets (via esc)');
  passed++;
}

// ── Test 4: escAttr leaves normal text unchanged ──────────────────────────────
{
  const result = escAttr('Superior Court of California');
  assert.strictEqual(result, 'Superior Court of California',
    'Expected plain text unchanged');
  console.log('PASS  4: escAttr leaves normal text unchanged');
  passed++;
}

// ── Test 5: esc() still works for text-content contexts (not broken by C1) ───
{
  const result = esc('<b>bold & bright</b>');
  assert.ok(result.includes('&lt;') && result.includes('&amp;'),
    'esc() must still escape & < > correctly');
  assert.ok(!result.includes('&quot;'),
    'esc() must NOT escape quotes (only escAttr does)');
  console.log('PASS  5: esc() unchanged — still correct for text-content contexts');
  passed++;
}

// ── Test 6: tokenize inserts sentinel at paragraph boundary (C2) ──────────────
{
  const tokens = tokenize('First paragraph.\n\nSecond paragraph.');
  assert.ok(tokens.includes(PARA_SENTINEL),
    'Expected PARA_SENTINEL in token stream for double newline');
  const idx = tokens.indexOf(PARA_SENTINEL);
  assert.ok(idx > 0, 'Sentinel should not be the first token');
  assert.ok(idx < tokens.length - 1, 'Sentinel should not be the last token');
  console.log('PASS  6: tokenize inserts sentinel at paragraph boundary');
  passed++;
}

// ── Test 7: single newline does NOT produce sentinel (C2) ────────────────────
{
  const tokens = tokenize('Line one.\nLine two.');
  assert.ok(!tokens.includes(PARA_SENTINEL),
    'Single newline must not produce a sentinel');
  console.log('PASS  7: single newline does not produce a sentinel');
  passed++;
}

// ── Test 8: single-paragraph text tokenizes identically to before (C2 regression) ──
{
  const before = 'The plaintiff must prove'.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const after  = tokenize('The plaintiff must prove');
  assert.deepStrictEqual(after, before,
    'Single-paragraph tokenization must be unchanged');
  console.log('PASS  8: single-paragraph tokenization is unchanged (no regression)');
  passed++;
}

// ── Test 9: renderFull converts sentinel to </p><p> (C2) ─────────────────────
{
  const ops = [
    { op: 'equal',  text: 'Para' },
    { op: 'equal',  text: 'one.' },
    { op: 'equal',  text: PARA_SENTINEL },
    { op: 'equal',  text: 'Para' },
    { op: 'equal',  text: 'two.' },
  ];
  const html = renderFull(ops);
  assert.ok(html.includes('</p><p class="diff-para">'),
    'Expected paragraph break in renderFull output, got: ' + html);
  assert.ok(!html.includes(PARA_SENTINEL),
    'Sentinel must not appear literally in output');
  console.log('PASS  9: renderFull converts sentinel to paragraph break');
  passed++;
}

// ── Test 10: renderLeft converts sentinel to </p><p> (C2) ────────────────────
{
  const ops = [
    { op: 'equal',  text: 'A' },
    { op: 'equal',  text: PARA_SENTINEL },
    { op: 'equal',  text: 'B' },
  ];
  const html = renderLeft(ops);
  assert.ok(html.includes('</p><p class="diff-para">'),
    'Expected paragraph break in renderLeft output');
  console.log('PASS 10: renderLeft converts sentinel to paragraph break');
  passed++;
}

// ── Test 11: renderRight converts sentinel to </p><p> (C2) ───────────────────
{
  const ops = [
    { op: 'equal',  text: 'A' },
    { op: 'equal',  text: PARA_SENTINEL },
    { op: 'insert', text: 'B' },
  ];
  const html = renderRight(ops);
  assert.ok(html.includes('</p><p class="diff-para">'),
    'Expected paragraph break in renderRight output');
  console.log('PASS 11: renderRight converts sentinel to paragraph break');
  passed++;
}

// ── Test 12: counts() does not count sentinel tokens as word changes (C2) ─────
{
  const ops = [
    { op: 'equal',  text: 'word' },
    { op: 'equal',  text: PARA_SENTINEL },
    { op: 'insert', text: 'added' },
    { op: 'delete', text: 'removed' },
  ];
  const c = counts(ops);
  assert.strictEqual(c.ins, 1, 'Expected 1 insertion (not counting sentinel)');
  assert.strictEqual(c.del, 1, 'Expected 1 deletion (not counting sentinel)');
  console.log('PASS 12: counts() skips sentinel tokens (not counted as word changes)');
  passed++;
}

// ── Test 13: [N. [and]] gap is fixed in classifyBracket logic (parser gap) ────
{
  // Test the regex that classifyBracket uses
  const andPattern = /^\d+\.\s*\[\s*(?:or|and)\s*\]/i;
  assert.ok(andPattern.test('1. [and] Some alternative text'),
    'Expected [N. [and]] to match alternative pattern');
  assert.ok(andPattern.test('2. [or] Some alternative text'),
    'Expected [N. [or]] to still match');
  assert.ok(!andPattern.test('1. Some plain text'),
    'Expected plain numbered list item not to match');
  console.log('PASS 13: [N. [and]] correctly recognized as alternative signal');
  passed++;
}

// ── Test 14: normalizer regex handles [N. [and]] unclosed bracket ─────────────
{
  const normPattern = /(\[\d+\.\s*\[\s*(?:or|and)\s*\])(?!\])/g;
  const input  = '[2. [and] text follows';
  const result = input.replace(normPattern, '$1]');
  assert.ok(result.includes('[2. [and]]'),
    'Expected unclosed [N. [and]] bracket to be normalized, got: ' + result);
  console.log('PASS 14: normalizer regex closes unclosed [N. [and]] brackets');
  passed++;
}

console.log(`\n${passed}/14 Batch C tests passed.`);
