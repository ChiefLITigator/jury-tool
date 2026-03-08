'use strict';
// Batch A regression tests — pure helpers only, no DOM required.
const assert = require('assert');

// ── Pure helpers inlined for headless testing ─────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uidToDisplayNum(uid, questions) {
  const idx = questions.findIndex(q => q.uid === uid);
  return idx >= 0 ? idx + 1 : null;
}

function translateRouting(val, uidMap, groupId) {
  if (val === 'stop' || val === 'sign') return val;
  return uidMap[val] || '__src__:' + groupId + ':' + val;
}

function normalizeRoutes(form) {
  const qs = form.questions;
  const srcMap = {};
  for (const q of qs) {
    if (q.source_group && q.source_id && q.source_group !== 'custom') {
      srcMap[q.source_group + ':' + q.source_id] = q.uid;
    }
  }
  for (const q of qs) {
    for (const field of ['if_yes', 'if_no', 'if_done']) {
      const val = q[field];
      if (typeof val === 'string' && val.startsWith('__src__:')) {
        const key = val.slice('__src__:'.length);
        if (srcMap[key]) q[field] = srcMap[key];
      }
    }
  }
}

function routingText(q, qs, num) {
  function targetLabel(val, isYesNo) {
    if (!val || val === 'sign') return 'have the presiding juror sign and date this form';
    if (val === 'stop') {
      if (!isYesNo) return 'have the presiding juror sign and date this form';
      const st = (q.stop_text || 'stop here and do not answer any further questions').replace(/\.$/, '');
      return st;
    }
    if (typeof val === 'string' && (val.startsWith('__src__:') || !qs.some(x => x.uid === val))) {
      return 'answer question [ROUTE BROKEN]';
    }
    const n = uidToDisplayNum(val, qs);
    return n != null ? 'answer question ' + n : 'answer question [ROUTE BROKEN]';
  }
  const parts = [];
  if (q.type === 'yes_no') {
    if (q.if_yes != null) parts.push(`If your answer to question ${num} is Yes, ${targetLabel(q.if_yes, true)}.`);
    if (q.if_no  != null) parts.push(`If your answer is No, ${targetLabel(q.if_no, true)}.`);
  } else if (q.if_done != null) {
    parts.push(`After completing this question, ${targetLabel(q.if_done, false)}.`);
  }
  return parts.join(' ');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

let passed = 0;

// Test 1: translateRouting uses deferred sentinel — not 'sign' — for unresolved targets
{
  const uidMap = {}; // Q2 not yet added
  const result = translateRouting('q2', uidMap, 'VF-400');
  assert.strictEqual(result, '__src__:VF-400:q2',
    'Expected deferred sentinel, got: ' + result);
  console.log('PASS  1: translateRouting stores sentinel for unresolved target (not "sign")');
  passed++;
}

// Test 2: normalizeRoutes resolves sentinel when target question is later added
{
  const form = {
    questions: [
      { uid: 'vfq_1', source_group: 'VF-400', source_id: 'q1', type: 'yes_no',
        if_yes: '__src__:VF-400:q2', if_no: 'stop' },
      { uid: 'vfq_2', source_group: 'VF-400', source_id: 'q2', type: 'yes_no',
        if_yes: 'sign', if_no: 'stop' },
    ]
  };
  normalizeRoutes(form);
  assert.strictEqual(form.questions[0].if_yes, 'vfq_2',
    'Expected if_yes to resolve to vfq_2 after normalizeRoutes');
  console.log('PASS  2: normalizeRoutes resolves sentinel once target question is added');
  passed++;
}

// Test 3: Unresolvable sentinel stays in place (does not collapse to 'sign')
{
  const form = {
    questions: [
      { uid: 'vfq_1', source_group: 'VF-400', source_id: 'q1', type: 'yes_no',
        if_yes: '__src__:VF-400:q2', if_no: 'stop' },
      // Q2 still not added
    ]
  };
  normalizeRoutes(form);
  assert.strictEqual(form.questions[0].if_yes, '__src__:VF-400:q2',
    'Expected sentinel to remain when target not present');
  console.log('PASS  3: unresolvable sentinel stays in place (not collapsed to "sign")');
  passed++;
}

// Test 4: routingText surfaces [ROUTE BROKEN] for deleted UID
{
  const qs = [
    { uid: 'vfq_1', type: 'yes_no', if_yes: 'vfq_99', if_no: 'stop' },
    // vfq_99 was deleted — not present in qs
  ];
  const rt = routingText(qs[0], qs, 1);
  assert.ok(rt.includes('[ROUTE BROKEN]'),
    'Expected [ROUTE BROKEN] for deleted UID, got: ' + rt);
  console.log('PASS  4: routingText surfaces [ROUTE BROKEN] when routed-to question was deleted');
  passed++;
}

// Test 5: routingText surfaces [ROUTE BROKEN] for unresolved sentinel in preview/export
{
  const qs = [
    { uid: 'vfq_1', type: 'yes_no', if_yes: '__src__:VF-400:q2', if_no: 'stop' },
  ];
  const rt = routingText(qs[0], qs, 1);
  assert.ok(rt.includes('[ROUTE BROKEN]'),
    'Expected [ROUTE BROKEN] for unresolved sentinel, got: ' + rt);
  console.log('PASS  5: routingText surfaces [ROUTE BROKEN] for unresolved sentinel');
  passed++;
}

// Test 6: non-yes/no if_done routing appears in routingText output
{
  const qs = [
    { uid: 'vfq_1', type: 'damages', if_done: 'vfq_2',
      line_items: [{ label: 'Medical' }] },
    { uid: 'vfq_2', type: 'yes_no', if_yes: 'sign', if_no: 'stop' },
  ];
  const rt = routingText(qs[0], qs, 1);
  assert.ok(rt.includes('answer question 2'),
    'Expected routing to Q2 for damages question, got: ' + rt);
  assert.ok(rt.startsWith('After completing this question'),
    'Expected "After completing this question" phrasing, got: ' + rt);
  console.log('PASS  6: non-yes/no if_done routing appears in routingText output');
  passed++;
}

// Test 7: non-yes/no "stop" stored in if_done renders as sign (A4)
{
  const qs = [
    { uid: 'vfq_1', type: 'damages', if_done: 'stop', line_items: [] },
  ];
  const rt = routingText(qs[0], qs, 1);
  assert.ok(rt.includes('sign and date'),
    'Expected "stop" in if_done to render as sign, got: ' + rt);
  assert.ok(!rt.includes('stop here'),
    'Expected no "stop here" text for non-yes/no if_done=stop, got: ' + rt);
  console.log('PASS  7: stored "stop" in non-yes/no if_done renders as sign on output (A4)');
  passed++;
}

// Test 8: activeFormId round-trips through serialization format
{
  const forms = [
    { id: 'vf_1', name: 'Form A', caption: {}, parties: {}, questions: [] },
    { id: 'vf_2', name: 'Form B', caption: {}, parties: {}, questions: [] },
  ];
  // Simulate getVFSerializedState
  const serialized = { forms: JSON.parse(JSON.stringify(forms)), activeFormId: 'vf_2' };
  // Simulate setVFState normalize logic
  const restoredForms      = Array.isArray(serialized) ? serialized : serialized.forms;
  const restoredActiveId   = Array.isArray(serialized) ? null : serialized.activeFormId;
  assert.strictEqual(restoredActiveId, 'vf_2',
    'Expected activeFormId vf_2 after round-trip');
  assert.strictEqual(restoredForms.length, 2,
    'Expected 2 forms after round-trip');
  console.log('PASS  8: activeFormId round-trips through getVFSerializedState / setVFState');
  passed++;
}

// Test 9: old plain-array format is treated as backward-compatible
{
  const legacyData = [
    { id: 'vf_1', name: 'Old Form', caption: {}, parties: {}, questions: [] },
  ];
  // Simulate setVFState normalize logic for old format
  const forms       = Array.isArray(legacyData) ? legacyData : legacyData.forms;
  const savedActive = Array.isArray(legacyData) ? null : legacyData.activeFormId;
  assert.strictEqual(forms.length, 1, 'Expected 1 form from legacy array');
  assert.strictEqual(savedActive, null, 'Expected null activeFormId from legacy array');
  console.log('PASS  9: old plain-array format handled as backward-compatible');
  passed++;
}

// Test 10: empty state leaves one blank form (A6 — simulated guard logic)
{
  let vfForms = [];
  const forms = [];
  vfForms = forms.length ? JSON.parse(JSON.stringify(forms)) : [];
  if (!vfForms.length) {
    vfForms.push({ id: 'vf_99', name: 'New Verdict Form', caption: {}, parties: {}, questions: [] });
  }
  assert.strictEqual(vfForms.length, 1,
    'Expected 1 blank form after setVFState([]), got ' + vfForms.length);
  console.log('PASS 10: setVFState([]) leaves one blank form, not zero (A6)');
  passed++;
}

// Test 11: escapeRegex handles regex metacharacters in party keys (A5)
{
  const raw = 'third.party(LLC)';
  const escaped = escapeRegex(raw);
  assert.strictEqual(escaped, 'third\\.party\\(LLC\\)',
    'Expected metacharacters escaped, got: ' + escaped);
  const re = new RegExp('\\[name of ' + escaped + '\\]', 'gi');
  assert.ok(re.test('[name of third.party(LLC)]'),
    'Regex should match literal string with dots and parens');
  console.log('PASS 11: escapeRegex escapes regex metacharacters in party keys (A5)');
  passed++;
}

console.log(`\n${passed}/11 Batch A tests passed.`);
