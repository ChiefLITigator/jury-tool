'use strict';
// ═══════════════════════════════════════════════════════════════════
// parse-vf.js — Automated VF corpus parser
// Usage:  node parse-vf.js [corpus-file]
//         Default corpus: vf-corpus-target.txt
// Output: vf-data-generated.js  (ready to replace vf-data.js)
//         vf-parse-report.txt   (validation warnings)
// ═══════════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

const CORPUS_FILE = process.argv[2] || 'vf-corpus-target.txt';
const OUT_JS      = 'vf-data-generated.js';
const OUT_REPORT  = 'vf-parse-report.txt';

// ─ CATEGORY MAP ─────────────────────────────────────────────────────────────
function getCategory(id) {
  const num = parseInt(id.replace('VF-', ''), 10);
  if (num >= 300 && num < 400) return 'contract';
  if (num >= 400 && num < 500) return 'negligence';
  if (num >= 500 && num < 600) return 'medical_negligence';
  if (num >= 700 && num < 800) return 'motor_vehicle';
  if (num >= 1000 && num < 1100) return 'premises_liability';
  if (num >= 1100 && num < 1200) return 'dangerous_condition';
  if (num >= 1200 && num < 1300) return 'products_liability';
  if (num >= 2300 && num < 2400) return 'insurance';
  if (num >= 2400 && num < 2500) return 'employment';
  if (num >= 3900 && num < 4000) return 'damages';
  if (num >= 5000 && num < 5100) return 'general_verdict';
  return 'other';
}

// ─ WARNINGS COLLECTOR ───────────────────────────────────────────────────────
const warnings = [];
function warn(formId, qId, msg) {
  warnings.push({ formId, qId, msg });
}

// ─ SPLIT CORPUS INTO FORMS ──────────────────────────────────────────────────
function splitCorpus(text) {
  const parts = text.split(/^=====\s+(VF-\d+)\s+=====$/m);
  const forms = [];
  for (let i = 1; i < parts.length; i += 2) {
    forms.push({ id: parts[i], raw: parts[i + 1] });
  }
  return forms;
}

// ─ CLEAN FORM TEXT ──────────────────────────────────────────────────────────
function cleanFormLines(raw) {
  let lines = raw.replace(/\r/g, '').split('\n');

  // Strip everything from "Signed:" onward (signature block + revision history)
  const sigIdx = lines.findIndex(l => /^\s*Signed:\s*$/.test(l));
  if (sigIdx !== -1) lines = lines.slice(0, sigIdx);

  // Strip everything from "Directions for Use" onward
  const dirIdx = lines.findIndex(l => /^\s*Directions for Use\s*$/.test(l));
  if (dirIdx !== -1) lines = lines.slice(0, dirIdx);

  // Strip title line (VF-XXX .Title)
  // Strip "We answer the questions submitted to us as follows:"
  // Strip standalone page numbers (3-4 digit numbers alone on a line)
  // Strip trailing headers like "NEGLIGENCE VF-402"
  lines = lines.filter(l => {
    const trimmed = l.trim();
    if (!trimmed) return false;
    if (/^VF-\d+\s*\./.test(trimmed)) return false;
    if (/^We answer the questions submitted to us as follows:?$/i.test(trimmed)) return false;
    if (/^\d{3,4}$/.test(trimmed)) return false;
    if (/^[A-Z\s\u2014]+VF-\d+$/.test(trimmed)) return false;  // trailing headers like "NEGLIGENCE VF-402"
    if (/^VF-\d+\s+[A-Z\s\u2014]+$/.test(trimmed)) return false;  // "VF-402 NEGLIGENCE"
    return true;
  });

  return lines;
}

// ─ EXTRACT TITLE ────────────────────────────────────────────────────────────
// Handles multi-line titles (title text may continue on the next line before
// "We answer the questions...")
function extractTitle(raw) {
  const lines = raw.split('\n');
  let titleLines = [];
  let capturing = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!capturing) {
      const m = trimmed.match(/^VF-\d+\s*\.\s*(.+)/);
      if (m) { titleLines.push(m[1]); capturing = true; }
    } else {
      if (/^We answer/i.test(trimmed) || /^\d+\./.test(trimmed)) break;
      if (trimmed) titleLines.push(trimmed);
    }
  }
  return titleLines.join(' ').replace(/\s+/g, ' ').trim();
}

// ─ GROUP LINES INTO QUESTION BLOCKS ─────────────────────────────────────────
// Each question starts with N. or [N. at the beginning of a line.
// Lines without a number prefix are continuations of the previous block.
function groupQuestionBlocks(lines) {
  const blocks = [];   // { num: number, lines: string[] }
  let current = null;

  // Pattern: optional leading brackets + digit(s) + period
  const qStartRe = /^(\[*)(\d+)\./;

  for (const line of lines) {
    const m = line.match(qStartRe);
    if (m) {
      const num = parseInt(m[2], 10);
      if (!current || current.num !== num) {
        // New question block
        current = { num, lines: [] };
        blocks.push(current);
      }
      current.lines.push(line);
    } else if (current) {
      // Continuation of current block
      current.lines.push(line);
    }
    // else: orphan line before first question — skip
  }

  return blocks;
}

// ─ JOIN CONTINUATION LINES ──────────────────────────────────────────────────
// Within a block, join lines that are continuations (don't start with N. or [N.)
function joinBlockLines(lines) {
  const qStartRe = /^(\[*)(\d+)\./;
  const joined = [];
  for (const line of lines) {
    const isNewEntry =
      qStartRe.test(line) ||
      /^\[?[a-d]\./.test(line) ||
      /^\[lost |^\[medical |^\[other /i.test(line) ||
      /^\[?Name.*\]\s*:\s*%?\s*$/i.test(line) ||   // percentage party line: [Name of X]: %
      /^TOTAL/i.test(line) ||
      /^\(\d\)\s*\[/.test(line);                     // (3) [lost earnings $ ]
    if (isNewEntry) {
      joined.push(line);
    } else if (joined.length > 0) {
      joined[joined.length - 1] += ' ' + line.trim();
    }
  }
  return joined;
}

// ─ EXTRACT FIELDS FROM TEXT ─────────────────────────────────────────────────
// Finds [ name of ... ] patterns in question text.
// Returns deduplicated array of field names.
function extractFields(text) {
  const fields = [];
  // Match [ ... ] but skip common non-field brackets
  const re = /\[\s*(name\s+of\s+[^\]]+|insert\s+[^\]]+|specify\s+[^\]]+|product\s*|describe\s+[^\]]+)\s*\]/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const field = m[1].replace(/\s+/g, ' ').trim();
    if (!fields.includes(field)) fields.push(field);
  }
  return fields;
}

// ─ PARSE ROUTING FROM INSTRUCTION TEXT ──────────────────────────────────────
const STOP_TEXT = 'Stop here, answer no further questions, and have the presiding juror sign and date this form.';

function parseRouting(routingLine, formId, qNum, totalQs) {
  const result = {};
  if (!routingLine) return result;

  // Strip outer brackets from bracket-wrapped routing
  let r = routingLine.replace(/^\[+/, '').replace(/\]+$/, '').trim();

  // Damages routing: "If [name] has proved any damages, then answer question N"
  const dmgRoute = r.match(/has proved any damages,?\s+(?:then )?answer\s+question (\d+)/i);
  const noDmgRoute = r.match(/has not proved any damages/i);
  if (dmgRoute) {
    result.if_done = 'q' + dmgRoute[1];
    if (noDmgRoute) { result.if_none = 'stop'; result.stop_text = STOP_TEXT; }
    return result;
  }

  // "If you answered yes for any defendant" pattern (multi-party)
  const anyYes = r.match(/If you answered yes for any .+?,?\s+(?:then )?answer\s+question (\d+)/i);
  if (anyYes) {
    result.if_yes = 'q' + anyYes[1];
    if (/If you answered no for all .+?stop here/i.test(r)) {
      result.if_no = 'stop'; result.stop_text = STOP_TEXT;
    }
    return result;
  }

  // Skip pattern: "If your answer to question N is yes, skip question M and answer question P"
  const skipYes = r.match(/answer to question \d+ is yes,?\s+skip question \d+ and answer question (\d+)/i);
  if (skipYes) {
    result.if_yes = 'q' + skipYes[1];
    const noAfterSkip = r.match(/If you answered no,?\s+(.*)/i);
    if (noAfterSkip) {
      if (/stop here/i.test(noAfterSkip[1])) { result.if_no = 'stop'; result.stop_text = STOP_TEXT; }
      else { const m2 = noAfterSkip[1].match(/answer question (\d+)/i); if (m2) result.if_no = 'q' + m2[1]; }
    }
    return result;
  }

  // [either option for] pattern
  const eitherYes = r.match(/answer to \[?either option for\]?\s+question \d+ is yes,?\s+(?:then )?answer question (\d+)/i);
  if (eitherYes) {
    result.if_yes = 'q' + eitherYes[1];
    if (/stop here/i.test(r)) { result.if_no = 'stop'; result.stop_text = STOP_TEXT; }
    return result;
  }

  // Inverted: "If your answer to question N is no, then answer question M"
  const noYesRoute = r.match(/answer to question \d+ is no,?\s+(?:then )?answer question (\d+)/i);
  if (noYesRoute && !/answer to question \d+ is yes/i.test(r)) {
    result.if_no = 'q' + noYesRoute[1];
    if (/If you answered yes,?\s+.*stop here/i.test(r)) {
      result.if_yes = 'stop'; result.stop_text = STOP_TEXT;
    } else if (!result.if_yes) {
      const yesAlt = r.match(/answered yes.*?answer question (\d+)/i);
      if (yesAlt) result.if_yes = 'q' + yesAlt[1];
    }
    return result;
  }

  // Unconditional: "Regardless of your answer to question N, answer question M"
  const regardless = r.match(/regardless of your answer.*?answer question (\d+)/i);
  if (regardless) {
    result.if_yes = 'q' + regardless[1];
    result.if_no = 'q' + regardless[1];
    return result;
  }

  // Standard: "If your answer to question N is yes, then answer question M"
  const yesRoute = r.match(/answer to question \d+ is yes,?\s+(?:then )?answer questions? (\d+)/i);
  if (yesRoute) {
    result.if_yes = 'q' + yesRoute[1];
    const noRoute = r.match(/If you answered no,?\s+(.*)/i);
    if (noRoute) {
      if (/stop here/i.test(noRoute[1])) { result.if_no = 'stop'; result.stop_text = STOP_TEXT; }
      else {
        const m2 = noRoute[1].match(/answer question (\d+)/i);
        if (m2) result.if_no = 'q' + m2[1];
        else result.if_no = 'sign';
      }
    }
    return result;
  }

  // Catch-all: try to extract any "answer question N"
  const fallback = r.match(/answer question (\d+)/i);
  if (fallback) {
    result.if_yes = 'q' + fallback[1];
    if (/stop here/i.test(r)) { result.if_no = 'stop'; result.stop_text = STOP_TEXT; }
  }
  warn(formId, 'q' + qNum, 'Complex routing — review manually: ' + r.slice(0, 120));
  return result;
}

// ─ PARSE DAMAGE LINE ITEMS ──────────────────────────────────────────────────
function parseDamageItems(lines) {
  const items = [];
  let currentParent = null;

  for (const line of lines) {
    // Strip leading/trailing brackets for analysis, but keep original for $ detection
    const trimmed = line.replace(/^\[+/, '').replace(/\]+$/, '').trim();

    // Skip lines that are pure totals, subtotals, or empty
    if (/^TOTAL/i.test(trimmed)) continue;
    if (/^Total\s+(Past|Future)/i.test(trimmed)) continue;
    if (!trimmed || /^\$\s*$/.test(trimmed)) continue;
    // Skip standalone % lines (percentage artifacts)
    if (/^%\s*$/.test(trimmed) || /^\d+\s*%\s*$/.test(trimmed)) continue;
    // Skip (N) prefixed subtotal lines: "(3) Total..."
    if (/^\(\d\)\s*Total/i.test(trimmed)) continue;

    // Top-level category line: "a. Past economic loss" or "a. Past economic loss: $ "
    const catMatch = trimmed.match(/^([a-d])\.\s+(.*)/);
    if (catMatch) {
      let label = catMatch[2];
      const hasInlineDollar = /\$/.test(label);

      // Strip ": $" or "$ " from end of label
      label = label.replace(/\s*:?\s*\$\s*$/, '').trim();
      // Strip brackets and trailing punctuation
      label = label.replace(/[\[\]]/g, '').replace(/,\s*$/, '').trim();
      // Clean "including physical pain/mental suffering:"
      if (/including\s+/i.test(label)) {
        label = label.replace(/including\s+/i, '').replace(/:/g, '').trim();
      }

      // Skip subtotal and TOTAL lines
      if (/^Total/i.test(label)) continue;

      if (!label || label === '$') continue;

      const item = { id: makeItemId(label), label: cleanLabel(label) };

      if (hasInlineDollar) {
        // Standalone item with amount (e.g., "a. Past economic loss: $")
        // Close any open parent
        currentParent = null;
        items.push(item);
      } else {
        // Category header — children follow on subsequent lines
        item.children = [];
        items.push(item);
        currentParent = item;
      }
      continue;
    }

    // Sub-item lines (under a parent): "lost earnings $" or "(3) [lost earnings $ ]"
    // Strip leading (N) prefix
    let subText = trimmed.replace(/^\(\d\)\s*/, '');
    // Strip brackets
    subText = subText.replace(/[\[\]]/g, '').trim();
    // Must contain $
    if (!/\$/.test(subText)) continue;
    // Extract label before $
    let label = subText.replace(/\s*\$\s*$/, '').replace(/,\s*$/, '').trim();
    // Clean "including physical pain/mental suffering:"
    if (/including\s+/i.test(label)) {
      label = label.replace(/including\s+/i, '').replace(/:/g, '').trim();
    }
    // Skip subtotals
    if (/^Total\s/i.test(label)) continue;
    if (!label || label === ':') continue;

    const subItem = { id: makeItemId(label), label: cleanLabel(label) };
    if (currentParent && currentParent.children) {
      currentParent.children.push(subItem);
    } else {
      items.push(subItem);
    }
  }

  return items;
}

function makeItemId(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40);
}

function cleanLabel(label) {
  // Capitalize first letter
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─ PARSE PERCENTAGE PARTIES ─────────────────────────────────────────────────
function parsePercentageParties(lines) {
  const parties = [];
  const joined = lines.join(' ');

  // Match "[Name of defendant ]: %" or "[Name of defendant ]:" (% may be on next line or absent)
  const re = /\[?\s*([^\]%:]+?)\s*\]?\s*:\s*%?/g;
  let m;
  while ((m = re.exec(joined)) !== null) {
    const name = m[1].replace(/\s+/g, ' ').trim();
    if (!name) continue;
    if (/^TOTAL/i.test(name)) continue;
    if (/^\d+$/.test(name)) continue;                   // skip standalone numbers
    if (/^(past|future|lost|medical|other|economic)/i.test(name)) continue;  // skip damage labels
    // Must look like a party name (starts with uppercase or "Name/name")
    if (!/^[A-Z\[]/.test(name) && !/name/i.test(name)) continue;
    parties.push({
      id: 'p_' + makeItemId(name),
      label: '[' + name + ']',
    });
  }
  return parties;
}

// ─ PARSE A SINGLE QUESTION BLOCK ────────────────────────────────────────────
function parseQuestionBlock(block, formId, totalQs) {
  const num = block.num;
  const joined = joinBlockLines(block.lines);

  // Separate question text, Yes No lines, routing lines, and sub-items
  const qStartRe = new RegExp('^\\[*' + num + '\\.');
  let questionText = '';
  let hasYesNo = false;
  let routingLine = '';
  const subItemLines = [];
  let isOptional = false;
  let hasAlternative = false;
  let hasRepeat = false;

  for (const line of joined) {
    // Check if entire question is optional (starts with [N.)
    if (/^\[/.test(line) && new RegExp('^\\[' + num + '\\.').test(line)) {
      isOptional = true;
    }

    // Yes No answer indicator
    if (new RegExp('^\\[*' + num + '\\.\\s*Yes\\s+No').test(line)) {
      hasYesNo = true;
      continue;
    }

    // Routing instruction (N.If... or N.[If... or N.Regardless... or standalone [If...)
    if (new RegExp('^\\[*' + num + '\\.\\s*\\[?(?:If\\s+(?:your|you|\\[)|Regardless)').test(line) ||
        (new RegExp('^\\[*' + num + '\\.').test(line) === false && /^\[?If\s+(your|you)/i.test(line.trim()))) {
      routingLine = line.replace(new RegExp('^\\[*' + num + '\\.\\s*'), '').trim();
      continue;
    }

    // [Repeat as necessary...]
    if (/\[Repeat as necessary/i.test(line)) {
      hasRepeat = true;
      continue;
    }

    // [or] alternative indicator
    if (new RegExp('^\\[*' + num + '\\.\\s*\\[or\\]').test(line)) {
      hasAlternative = true;
      continue;
    }

    // Sub-items (damage line items, percentage parties)
    // But NOT lines starting with a question number prefix (those are question text with inline $)
    if (!qStartRe.test(line) && (
        /^\[?[a-d]\./.test(line) || /^\[lost |^\[medical |^\[other /i.test(line) ||
        /^\[?Name.*\]\s*:\s*%?\s*$/i.test(line) || /^TOTAL/i.test(line) ||
        /^\(\d\)\s*\[/.test(line) ||
        /:\s*%/.test(line) || /\]\s*:\s*$/.test(line) ||
        /\$\s*\]?\s*$/.test(line) || /^\s*%\s*$/.test(line) || /^\d+\s*%\s*$/.test(line))) {
      subItemLines.push(line);
      continue;
    }

    // Question text
    if (qStartRe.test(line)) {
      const text = line.replace(new RegExp('^\\[*' + num + '\\.\\s*'), '').trim();
      if (text && !/^Yes\s+No/.test(text)) {
        if (questionText) questionText += ' ';
        questionText += text;
      }
    }
  }

  // Clean question text — remove outer brackets if optional
  questionText = questionText.replace(/^\[+/, '').replace(/\]+$/, '').replace(/\?(\]*)$/, '?').trim();
  // Normalize whitespace
  questionText = questionText.replace(/\s+/g, ' ');

  // Detect inline $ in question text (e.g., "What amount... $" or "... $ ]")
  const inlineDollar = /\$\s*\]?\s*$/.test(questionText);
  if (inlineDollar) {
    // Strip trailing "$ ]" from question text, keep it as a damages marker
    questionText = questionText.replace(/\s*\$\s*\]?\s*$/, '').trim();
  }

  // Determine question type
  let type = 'yes_no';
  if (inlineDollar || /\$/.test(subItemLines.join(' ')) || /damages|amount/i.test(questionText)) {
    type = 'damages';
  } else if (/%/.test(subItemLines.join(' ')) || /percentage/i.test(questionText)) {
    type = 'percentage';
  }

  // Multi-party yes_no (has [Repeat as necessary] or multiple Yes No on same question)
  const yesNoCount = joined.filter(l => new RegExp('^\\[*' + num + '\\.\\s*Yes\\s+No').test(l)).length;
  if (hasYesNo && (hasRepeat || yesNoCount > 1)) {
    type = 'yes_no_multi';
  }

  // Build question object
  const q = {
    id: 'q' + num,
    type: type,
    text: questionText,
    fields: extractFields(questionText),
  };

  if (isOptional) q.optional = true;
  if (hasAlternative) {
    warn(formId, q.id, 'Has [or] alternative formulations — review manually');
  }

  // Type-specific parsing
  if (type === 'damages') {
    if (subItemLines.length > 0) {
      q.line_items = parseDamageItems(subItemLines);
      if (q.line_items.length === 0) {
        // Single $ amount (e.g., "What amount... $")
        warn(formId, q.id, 'Damages question with no parsed line items');
      }
    } else {
      // Inline $ (e.g., "What amount of punitive damages... $ ]")
      q.line_items = [];
    }
    // Parse routing for damages
    if (routingLine) {
      const routing = parseRouting(routingLine, formId, num, totalQs);
      Object.assign(q, routing);
    }
    // else: no routing — post-processing defaults based on position
  } else if (type === 'percentage') {
    q.parties = parsePercentageParties(subItemLines);
    q.must_total = 100;
    if (routingLine) {
      const routing = parseRouting(routingLine, formId, num, totalQs);
      Object.assign(q, routing);
    }
  } else {
    // yes_no or yes_no_multi
    if (routingLine) {
      const routing = parseRouting(routingLine, formId, num, totalQs);
      Object.assign(q, routing);
    } else {
      warn(formId, q.id, 'No routing instruction found');
    }
  }

  return q;
}

// ─ PARSE A SINGLE FORM ─────────────────────────────────────────────────────
function parseForm(formData) {
  const { id, raw } = formData;
  const title = extractTitle(raw);
  if (!title) {
    warn(id, null, 'Could not extract title');
  }

  const lines = cleanFormLines(raw);
  const blocks = groupQuestionBlocks(lines);
  const totalQs = blocks.length;

  const questions = blocks.map(b => parseQuestionBlock(b, id, totalQs));

  // Terminal questions with no routing default to sign
  for (const q of questions) {
    const noRoute = !q.if_yes && !q.if_no && !q.if_done;
    if (noRoute && (q.type === 'damages' || q.type === 'percentage')) {
      const idx = questions.indexOf(q);
      q.if_done = (idx < questions.length - 1) ? questions[idx + 1].id : 'sign';
    } else if (noRoute && (q.type === 'yes_no' || q.type === 'yes_no_multi')) {
      // If it's the last question or the next question is damages/sign, default to sign
      const idx = questions.indexOf(q);
      if (idx === questions.length - 1) {
        // Last question — likely a terminal yes/no that routes to sign on yes
        q.if_yes = 'sign';
        q.if_no = 'stop';
        q.stop_text = STOP_TEXT;
      }
    }
  }

  // Detect signature block
  const hasSig = /Signed:\s*\n\s*Presiding Juror/m.test(raw);

  return {
    id,
    title: title.replace(/\u2014/g, '\u2014'),  // keep em-dash
    category: getCategory(id),
    signature_block: hasSig,
    questions,
  };
}

// ─ VALIDATE PARSED FORM ────────────────────────────────────────────────────
function validateForm(form) {
  const qIds = new Set(form.questions.map(q => q.id));

  for (const q of form.questions) {
    // Check routing targets
    for (const route of ['if_yes', 'if_no', 'if_done', 'if_none']) {
      const target = q[route];
      if (target && target !== 'stop' && target !== 'sign' && !qIds.has(target)) {
        warn(form.id, q.id, `Broken route: ${route} → ${target} (not found in form)`);
      }
    }

    // Check required properties
    if (!q.text || q.text.length < 5) {
      warn(form.id, q.id, 'Question text is empty or very short: "' + (q.text || '') + '"');
    }

    if (q.type === 'damages' && (!q.line_items || q.line_items.length === 0)) {
      // Not necessarily an error — some damages are single-line
    }

    if (q.type === 'percentage' && (!q.parties || q.parties.length === 0)) {
      warn(form.id, q.id, 'Percentage question with no parties parsed');
    }

    if (q.type === 'yes_no' && !q.if_yes && !q.if_no) {
      warn(form.id, q.id, 'yes_no question with no routing');
    }
  }
}

// ─ ROUND-TRIP TEXT GENERATION (for diff validation) ─────────────────────────
function renderFormText(form) {
  const lines = [];
  lines.push(`===== ${form.id} =====`);
  lines.push(`${form.id}. ${form.title}`);
  lines.push('We answer the questions submitted to us as follows:');

  for (const q of form.questions) {
    const num = q.id.replace('q', '');
    lines.push(`${num}. ${q.text}`);

    if (q.type === 'yes_no' || q.type === 'yes_no_multi') {
      lines.push(`${num}. Yes No`);
    }

    if (q.type === 'damages' && q.line_items) {
      for (const item of q.line_items) {
        if (item.children) {
          lines.push(`  [${item.label}`);
          for (const child of item.children) {
            lines.push(`    [${child.label} $]`);
          }
        } else {
          lines.push(`  [${item.label}: $]`);
        }
      }
    }

    if (q.type === 'percentage' && q.parties) {
      for (const p of q.parties) {
        lines.push(`  ${p.label}: %`);
      }
      lines.push('  TOTAL 100 %');
    }

    // Routing summary
    if (q.if_yes) lines.push(`  → yes: ${q.if_yes}`);
    if (q.if_no) lines.push(`  → no: ${q.if_no}`);
    if (q.if_done) lines.push(`  → done: ${q.if_done}`);
  }

  return lines.join('\n');
}

// ─ MANUAL OVERRIDES ─────────────────────────────────────────────────────────
// Hand-crafted entries for forms that don't fit the numbered-question parser
// pattern (e.g. general verdict forms with "select one" options).
const MANUAL_OVERRIDES = {
  'VF-5000': {
    id: 'VF-5000',
    title: 'General Verdict Form\u2014Single Plaintiff\u2014Single Defendant\u2014Single Cause of Action',
    category: 'general_verdict',
    signature_block: true,
    questions: [
      {
        id: 'q1',
        type: 'select_one',
        text: 'Select one of the following two options:',
        fields: ['name of plaintiff', 'name of defendant'],
        options: [
          'We find in favor of [ name of plaintiff ] and against [ name of defendant ] and award damages to [ name of plaintiff ] in the amount of $___.',
          'We find in favor of [ name of defendant ] and against [ name of plaintiff ].'
        ],
        if_done: 'sign'
      }
    ]
  },
  'VF-3920': {
    id: 'VF-3920',
    title: 'Damages on Multiple Legal Theories',
    category: 'damages',
    signature_block: true,
    questions: [
      {
        id: 'q1',
        type: 'damages',
        text: '[ e.g., economic damages: lost past earnings ]. Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify all of the legal theories supporting this element of damages; use "or" if more than one ].',
        fields: ['name of defendant', 'name of plaintiff', 'specify all of the legal theories supporting this element of damages; use "or" if more than one'],
        line_items: [],
        if_done: 'q2'
      },
      {
        id: 'q2',
        type: 'damages',
        text: '[ e.g., economic damages: past medical expenses ]. Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use "or" if more than one ].',
        fields: ['name of defendant', 'name of plaintiff', 'specify the legal theories supporting this element of damages; use "or" if more than one'],
        line_items: [],
        if_done: 'q3'
      },
      {
        id: 'q3',
        type: 'damages',
        text: '[ e.g., economic damages: lost future earnings ]. Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use "or" if more than one ].',
        fields: ['name of defendant', 'name of plaintiff', 'specify the legal theories supporting this element of damages; use "or" if more than one'],
        line_items: [],
        if_done: 'q4'
      },
      {
        id: 'q4',
        type: 'damages',
        text: '[ e.g., economic damages: future medical expenses ]. Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use "or" if more than one ].',
        fields: ['name of defendant', 'name of plaintiff', 'specify the legal theories supporting this element of damages; use "or" if more than one'],
        line_items: [],
        if_done: 'q5'
      },
      {
        id: 'q5',
        type: 'damages',
        text: '[ e.g., past noneconomic loss including physical pain/mental suffering ]. Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use "or" if more than one ].',
        fields: ['name of defendant', 'name of plaintiff', 'specify the legal theories supporting this element of damages; use "or" if more than one'],
        line_items: [],
        if_done: 'q6'
      },
      {
        id: 'q6',
        type: 'damages',
        text: '[ e.g., future noneconomic loss including physical pain/mental suffering ]. Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use "or" if more than one ].',
        fields: ['name of defendant', 'name of plaintiff', 'specify the legal theories supporting this element of damages; use "or" if more than one'],
        line_items: [],
        if_done: 'sign'
      }
    ]
  },
  'VF-5001': {
    id: 'VF-5001',
    title: 'General Verdict Form\u2014Single Plaintiff\u2014Single Defendant\u2014Multiple Causes of Action',
    category: 'general_verdict',
    signature_block: true,
    questions: [
      {
        id: 'q1',
        type: 'select_one',
        text: 'On [ name of plaintiff ]\'s claim for [ insert first cause of action ]:',
        fields: ['name of plaintiff', 'name of defendant', 'insert first cause of action'],
        options: [
          'we find in favor of [ name of plaintiff ] and against [ name of defendant ].',
          'we find in favor of [ name of defendant ] and against [ name of plaintiff ].'
        ],
        if_done: 'q2'
      },
      {
        id: 'q2',
        type: 'select_one',
        text: 'On [ name of plaintiff ]\'s claim for [ insert second cause of action ]:',
        fields: ['name of plaintiff', 'name of defendant', 'insert second cause of action'],
        options: [
          'we find in favor of [ name of plaintiff ] and against [ name of defendant ].',
          'we find in favor of [ name of defendant ] and against [ name of plaintiff ].'
        ],
        if_done: 'q3'
      },
      {
        id: 'q3',
        type: 'damages',
        text: 'Complete the section below only if you find in favor of [ name of plaintiff ] on at least one of [his/her/nonbinary pronoun/its] claims. We award [ name of plaintiff ] the following damages:',
        fields: ['name of plaintiff'],
        line_items: [],
        if_done: 'sign'
      }
    ]
  }
};

// ─ MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const corpusPath = path.resolve(CORPUS_FILE);
  if (!fs.existsSync(corpusPath)) {
    console.error('Corpus file not found:', corpusPath);
    process.exit(1);
  }

  console.log('Reading corpus:', corpusPath);
  const corpus = fs.readFileSync(corpusPath, 'utf8');
  const rawForms = splitCorpus(corpus);
  console.log(`Found ${rawForms.length} forms in corpus.`);

  const parsedForms = [];
  for (const rf of rawForms) {
    if (MANUAL_OVERRIDES[rf.id]) {
      parsedForms.push(MANUAL_OVERRIDES[rf.id]);
      continue;
    }
    const form = parseForm(rf);
    validateForm(form);
    parsedForms.push(form);
  }

  // Generate vf-data JS
  const jsContent = 'const vfDB = ' + JSON.stringify({ groups: parsedForms }, null, 2) + ';\n';
  fs.writeFileSync(OUT_JS, jsContent, 'utf8');
  console.log(`Wrote ${OUT_JS} (${parsedForms.length} groups, ${jsContent.length} bytes)`);

  // Generate validation report
  const reportLines = [];
  reportLines.push('VF PARSE VALIDATION REPORT');
  reportLines.push('=' .repeat(60));
  reportLines.push(`Corpus: ${CORPUS_FILE}`);
  reportLines.push(`Forms parsed: ${parsedForms.length}`);
  reportLines.push(`Total warnings: ${warnings.length}`);
  reportLines.push('');

  // Summary per form
  for (const form of parsedForms) {
    const formWarns = warnings.filter(w => w.formId === form.id);
    const qCount = form.questions.length;
    const types = form.questions.map(q => q.type);
    const typeSummary = [...new Set(types)].join(', ');
    const status = formWarns.length === 0 ? 'OK' : `${formWarns.length} warning(s)`;
    reportLines.push(`${form.id}: ${form.title}`);
    reportLines.push(`  ${qCount} questions (${typeSummary}) — ${status}`);
    for (const w of formWarns) {
      reportLines.push(`  ⚠ ${w.qId || 'form'}: ${w.msg}`);
    }
    reportLines.push('');
  }

  // Round-trip diffs
  reportLines.push('');
  reportLines.push('ROUND-TRIP RENDERINGS');
  reportLines.push('=' .repeat(60));
  for (const form of parsedForms) {
    reportLines.push('');
    reportLines.push(renderFormText(form));
  }

  fs.writeFileSync(OUT_REPORT, reportLines.join('\n'), 'utf8');
  console.log(`Wrote ${OUT_REPORT} (${warnings.length} warnings)`);

  // Console summary
  if (warnings.length > 0) {
    console.log('');
    console.log('WARNINGS:');
    const byForm = {};
    for (const w of warnings) {
      if (!byForm[w.formId]) byForm[w.formId] = [];
      byForm[w.formId].push(w);
    }
    for (const [fid, ws] of Object.entries(byForm)) {
      console.log(`  ${fid}: ${ws.length} warning(s)`);
      for (const w of ws) {
        console.log(`    ${w.qId || 'form'}: ${w.msg.slice(0, 100)}`);
      }
    }
  } else {
    console.log('\nAll forms parsed cleanly — no warnings.');
  }
}

main();
