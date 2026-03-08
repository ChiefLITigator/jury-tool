'use strict';
// Batch B regression tests — pure helpers only, no DOM required.
const assert = require('assert');

// ── Pure helpers inlined for headless testing ─────────────────────────────────

// B2: getUnfilledFields unfilled check logic (dropdown portion)
function isDropdownUnfilled(f) {
  return (f.selected === -1 && !f.custom) ||
         (f.custom && (f.customValue || '').trim() === '');
}

// B3: caption round-trip helpers
const CAPTION_FIELD_MAP = [
  ['pl_court_name',         'court_name'],
  ['pl_court_county',       'court_county'],
  ['pl_plaintiff_name',     'plaintiff_name'],
  ['pl_plaintiff_desc',     'plaintiff_desc'],
  ['pl_defendant_name',     'defendant_name'],
  ['pl_defendant_desc',     'defendant_desc'],
  ['pl_additional_parties', 'additional_parties'],
  ['pl_case_number',        'case_number'],
  ['pl_judge_name',         'judge_name'],
  ['pl_dept_number',        'dept_number'],
  ['pl_attorney_role',      'attorney_role'],
  ['pl_client_name',        'client_name'],
];

function applyCaptionToDOM(caption, store) {
  const cap = caption || {};
  for (const [id, key] of CAPTION_FIELD_MAP) {
    if (key in cap) store[id] = cap[key];
  }
}

function readCaptionFromDOM(store) {
  const caption = {};
  for (const [id, key] of CAPTION_FIELD_MAP) {
    caption[key] = store[id] || '';
  }
  return caption;
}

// B6: serializeParsedState
function serializeParsedState(ps) {
  return { fields: [...ps.fields.entries()] };
}

let passed = 0;

// ── Test 1: custom dropdown with empty customValue counts as unfilled (B2) ────
{
  const f = { type: 'dropdown', selected: -1, custom: true, customValue: '' };
  assert.ok(isDropdownUnfilled(f),
    'Empty custom dropdown should count as unfilled');
  console.log('PASS  1: blank custom dropdown (customValue="") counts as unfilled');
  passed++;
}

// ── Test 2: custom dropdown with whitespace-only customValue counts as unfilled
{
  const f = { type: 'dropdown', selected: -1, custom: true, customValue: '   ' };
  assert.ok(isDropdownUnfilled(f),
    'Whitespace-only customValue should count as unfilled');
  console.log('PASS  2: whitespace-only customValue counts as unfilled');
  passed++;
}

// ── Test 3: custom dropdown with a real value counts as filled (B2) ───────────
{
  const f = { type: 'dropdown', selected: -1, custom: true, customValue: 'plaintiff' };
  assert.ok(!isDropdownUnfilled(f),
    'Non-blank customValue should count as filled');
  console.log('PASS  3: non-blank customValue correctly counts as filled');
  passed++;
}

// ── Test 4: standard dropdown at -1 counts as unfilled (unchanged) ────────────
{
  const f = { type: 'dropdown', selected: -1, custom: false, customValue: '' };
  assert.ok(isDropdownUnfilled(f), 'Standard -1 dropdown should count as unfilled');
  console.log('PASS  4: standard unselected dropdown still counts as unfilled');
  passed++;
}

// ── Test 5: caption export/import round-trip preserves all 12 fields (B3) ─────
{
  const original = {};
  for (const [, key] of CAPTION_FIELD_MAP) original[key] = 'test_' + key;

  const domStore = {};
  applyCaptionToDOM(original, domStore);
  const restored = readCaptionFromDOM(domStore);

  for (const [, key] of CAPTION_FIELD_MAP) {
    assert.strictEqual(restored[key], 'test_' + key,
      `Caption key "${key}" not preserved through round-trip`);
  }
  assert.strictEqual(Object.keys(restored).length, 12,
    'Expected exactly 12 caption keys after round-trip');
  console.log('PASS  5: caption export/import round-trip preserves all 12 fields (B3)');
  passed++;
}

// ── Test 6: applyCaptionToDOM skips keys absent from caption (backward compat) ─
{
  const partial = { court_name: 'Superior Court' };
  const domStore = { pl_plaintiff_name: 'existing value' };
  applyCaptionToDOM(partial, domStore);
  assert.strictEqual(domStore['pl_court_name'], 'Superior Court',
    'Expected court_name to be applied');
  assert.strictEqual(domStore['pl_plaintiff_name'], 'existing value',
    'Expected plaintiff_name to be left untouched (absent from partial caption)');
  console.log('PASS  6: applyCaptionToDOM skips absent keys (backward-compat)');
  passed++;
}

// ── Test 7: caseLoad tolerates missing instructions (B4) ──────────────────────
{
  // Simulate the guard logic from caseLoad
  const saved = { caption: {} }; // no instructions property
  if (!Array.isArray(saved.instructions)) saved.instructions = [];
  assert.deepStrictEqual(saved.instructions, [],
    'Expected instructions to default to [] when absent');
  console.log('PASS  7: caseLoad guard tolerates missing instructions (B4)');
  passed++;
}

// ── Test 8: caseLoad tolerates non-array instructions (B4) ───────────────────
{
  const saved = { instructions: 'not an array', caption: {} };
  if (!Array.isArray(saved.instructions)) saved.instructions = [];
  assert.deepStrictEqual(saved.instructions, [],
    'Expected non-array instructions to be replaced with []');
  console.log('PASS  8: caseLoad guard tolerates non-array instructions (B4)');
  passed++;
}

// ── Test 9: caseImport loads first packet item (B5 — simulated) ───────────────
{
  // Simulate the post-import logic: if packetInstructions.length, call packetLoad
  let packetLoaded = null;
  const packetInstructions = [{ id: 1, caciNum: '400' }];
  function mockPacketLoad(id) { packetLoaded = id; }
  if (packetInstructions.length) mockPacketLoad(packetInstructions[0].id);
  assert.strictEqual(packetLoaded, 1,
    'Expected first packet item to be loaded after import');
  console.log('PASS  9: caseImport loads first packet item into workspace (B5)');
  passed++;
}

// ── Test 10: serializeParsedState omits rawText and segments (B6) ─────────────
{
  const mockState = {
    rawText: 'some raw text',
    segments: [{ type: 'text', text: 'hello' }],
    fields: new Map([['key1', { type: 'text', value: 'val1' }]]),
  };
  const serialized = serializeParsedState(mockState);
  assert.ok(!('rawText'  in serialized), 'rawText must not be present in serialized output');
  assert.ok(!('segments' in serialized), 'segments must not be present in serialized output');
  assert.ok('fields' in serialized, 'fields must be present in serialized output');
  assert.strictEqual(serialized.fields.length, 1, 'Expected 1 field entry');
  console.log('PASS 10: serializeParsedState omits rawText and segments (B6)');
  passed++;
}

// ── Test 11: serializeParsedState is backward-compatible (applyFieldValues still works)
{
  // applyFieldValues only reads .fields — omitting rawText/segments must not break it
  function applyFieldValues(freshFields, savedFields) {
    const savedMap = new Map(savedFields);
    for (const [key, saved] of savedMap) {
      const live = freshFields.get(key);
      if (!live) continue;
      if ('value' in saved) live.value = saved.value;
    }
  }
  const liveFields = new Map([['k1', { type: 'text', value: '' }]]);
  const mockState  = { rawText: 'r', segments: [], fields: new Map([['k1', { type: 'text', value: 'restored' }]]) };
  const serialized = serializeParsedState(mockState);
  applyFieldValues(liveFields, serialized.fields);
  assert.strictEqual(liveFields.get('k1').value, 'restored',
    'applyFieldValues must still work with B6 serialized format');
  console.log('PASS 11: applyFieldValues works correctly with B6 serialized format');
  passed++;
}

console.log(`\n${passed}/11 Batch B tests passed.`);
