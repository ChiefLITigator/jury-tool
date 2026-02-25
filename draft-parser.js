/** Walk text tracking nesting depth; return all top-level [bracket] spans. */
function findTopLevelBrackets(text) {
  const brackets = [];
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === ']' && depth > 0) {
      depth--;
      if (depth === 0) {
        brackets.push({ start, end: i + 1, content: text.slice(start + 1, i) });
        start = -1;
      }
    }
  }
  return brackets;
}

function makeDraftKey(content) {
  const c = content.trim().replace(/\s+/g, ' ');
  return c.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_/]/g, '')
    .slice(0, 60);
}

/**
 * Split s on '/' at bracket-depth zero only, so a slash inside a nested
 * [bracket] is never treated as an option delimiter.
 */
function splitOnSlashDepth0(s) {
  const parts = [];
  let depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if      (ch === '[') { depth++; cur += ch; }
    else if (ch === ']') { depth = Math.max(0, depth - 1); cur += ch; }
    else if (ch === '/' && depth === 0) { parts.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/**
 * Strip a leading instruction verb (insert, specify, describe, …) from a
 * fill-in label, then trim any leftover leading whitespace or punctuation.
 * "insert other fiduciary relationship" → "other fiduciary relationship"
 */
function stripInstructionWord(s) {
  return s
    .replace(/^(insert|specify|describe|state|identify|enter|type)\b/i, '')
    .replace(/^[\s:,;.]+/, '')
    .trim();
}

/**
 * Classify a bracket's content into one of:
 *   'connector' — [and] [or] [,] [;]  boolean include/exclude checkbox
 *   'dropdown'  — [he/she/they] style slash-separated short alternatives
 *   'note'      — [Insert applicable…] drafting instructions
 *   'optional'  — [whole sentence or paragraph] to include/exclude
 *   'text'      — [name of plaintiff] fill-in blank
 *   'skip'      — empty / unrecognised
 */
function classifyBracket(content) {
  const c = content.trim().replace(/\s+/g, ' ');
  if (!c) return 'skip';

  // Skip bare integers, legal citations (e.g. 279 P.2d 966), and Roman numerals.
  if (/^\d+$/.test(c) || /^\d+\s+[A-Z]\.\d+/.test(c) || /^[IVX]+$/.test(c)) return 'skip';

  // Connector words/punctuation — checked = include, unchecked = omit.
  // Must be the very first test; nothing else should intercept these.
  if (/^(or|and|also|nor|,|;)$/i.test(c)) return 'connector';

  // Grammatical suffix toggles — checked = suffix appears, unchecked = omit.
  if (/^(an|s|ed|ing|ly)$/i.test(c)) return 'connector';

  // Alternative element — content begins with "N. [or]"; must precede the
  // optional-block check so long alt-element text is not caught there first.
  if (/^\d+\.\s*\[or\]/i.test(c)) return 'alternative';

  // Fill-in keywords — always a text input, regardless of slashes.
  // Check BEFORE the slash/dropdown test so e.g. [specify/describe] is
  // never mis-classified as a dropdown.
  if (/^(specify|insert|describe|name\s+of)\b/i.test(c)) return 'text';

  // Drafting-instruction verbs → note (textarea the user fills in)
  if (/^(add\b|include\b)/i.test(c)) return 'note';

  // Slash-separated alternatives → dropdown (depth-aware split).
  // Exclude if any option (brackets stripped) starts with "name of".
  const slashParts = splitOnSlashDepth0(c);
  if (slashParts.length > 1) {
    const labels = slashParts.map(o =>
      o.startsWith('[') && o.endsWith(']') ? o.slice(1, -1).trim() : o);
    if (!labels.some(o => /^name\s+of\b/i.test(o))) return 'dropdown';
  }

  // Conjunction-led clause → optional block (checkbox)
  if (/^(and|or)\s+\w{2,}/i.test(c)) return 'optional';

  // Long content or multiple sentences → optional block (checkbox)
  if (c.length > 25 || /[.?!][A-Z]/.test(c)) return 'optional';

  return 'text';
}

function parseInstruction(rawText) {
  const brackets = findTopLevelBrackets(rawText);
  const fields   = new Map();   // key → field definition (de-duplicated)
  const segments = [];           // ordered mix of {type:'text'} and {type:'field'}
  let lastEnd = 0;

  // Pass 1: build forward-pointer map for alternative signal → content brackets
  const altContentMap = new Map(); // signal bracket index → content bracket index
  const consumed = new Set();      // content bracket indices to skip as standalone fields
  for (let pi = 0; pi < brackets.length; pi++) {
    const pbr = brackets[pi];
    if (/^\d+\.\s*\[or\]/i.test(pbr.content.trim())) {
      const numMatch = pbr.content.trim().match(/^(\d+)\./);
      const digit = numMatch ? numMatch[1] : null;
      if (digit) {
        for (let pj = pi + 1; pj < brackets.length; pj++) {
          const ct = brackets[pj].content.trim();
          if (new RegExp('^' + digit + '\\.').test(ct) && !/^\d+\.\s*\[or\]/i.test(ct)) {
            altContentMap.set(pi, pj);
            consumed.add(pj);
            break;
          }
        }
      }
    }
  }

  // Pass 2: main segment loop
  for (let i = 0; i < brackets.length; i++) {
    const br = brackets[i];

    if (consumed.has(i)) {
      if (br.start > lastEnd) {
        segments.push({ type: 'text', text: rawText.slice(lastEnd, br.start) });
      }
      lastEnd = br.end;
      continue;
    }

    if (br.start > lastEnd) {
      segments.push({ type: 'text', text: rawText.slice(lastEnd, br.start) });
    }

    const btype = classifyBracket(br.content);
    const key   = makeDraftKey(br.content);

    if (btype === 'skip' || !key) {
      // Keep original bracket text verbatim
      segments.push({ type: 'text', text: rawText.slice(br.start, br.end) });

    } else if (btype === 'connector') {
      if (!fields.has(key)) {
        fields.set(key, { type: 'connector', key, label: br.content.trim(), checked: false });
      }
      segments.push({ type: 'field', key });

    } else if (btype === 'alternative') {
      if (!fields.has(key)) {
        const numMatch = br.content.trim().match(/^(\d+)\./);
        const elemNum = numMatch ? numMatch[1] : '?';
        // Use forward-pointer for altText; fall back to stripping signal prefix
        let altText;
        if (altContentMap.has(i)) {
          const cBr = brackets[altContentMap.get(i)];
          altText = cBr.content.trim().replace(/^\d+\.\s*/i, '').trim();
        } else {
          altText = br.content.trim().replace(/^\d+\.\s*\[or\]\s*/i, '').trim();
        }
        // If the alt text is itself a single outer bracket, unwrap it
        const altBrs = findTopLevelBrackets(altText);
        if (altBrs.length === 1 && altBrs[0].start === 0 && altBrs[0].end === altText.length) {
          altText = altBrs[0].content.trim();
        }
        // Find paired standard optional: most recent optional segment whose
        // fullContent starts with the same element number "N."
        let pairedOptionalKey = null;
        for (let si = segments.length - 1; si >= 0; si--) {
          const s = segments[si];
          if (s.type === 'field') {
            const sf = fields.get(s.key);
            if (sf && sf.type === 'optional') {
              const sfNum = sf.fullContent.trim().match(/^(\d+)\./)?.[1];
              if (sfNum === elemNum) { pairedOptionalKey = s.key; break; }
            }
          }
        }
        // Register any inner brackets of the alt text as form fields
        for (const ibr of findTopLevelBrackets(altText)) {
          const ibtype = classifyBracket(ibr.content);
          if (ibtype === 'alternative' || ibtype === 'skip') continue;
          const ikey = makeDraftKey(ibr.content);
          if (fields.has(ikey)) continue;
          if (ibtype === 'text') {
            fields.set(ikey, { type: 'text', key: ikey, label: stripInstructionWord(ibr.content.trim()), value: '' });
          } else if (ibtype === 'dropdown') {
            const iopts = splitOnSlashDepth0(ibr.content).filter(Boolean);
            fields.set(ikey, { type: 'dropdown', key: ikey, label: ibr.content.trim(), options: iopts, selected: -1, custom: false, customValue: '' });
          } else if (ibtype === 'connector') {
            fields.set(ikey, { type: 'connector', key: ikey, label: ibr.content.trim(), checked: false });
          }
        }
        fields.set(key, { type: 'alternative', key, elemNum, altText, selected: 'a', pairedOptionalKey });
      }
      segments.push({ type: 'field', key });

    } else if (btype === 'dropdown') {
      const options = splitOnSlashDepth0(br.content).filter(Boolean);
      if (!fields.has(key)) {
        fields.set(key, { type: 'dropdown', key, label: br.content.trim(), options, selected: -1, custom: false, customValue: '' });
      }
      segments.push({ type: 'field', key });

    } else if (btype === 'note') {
      if (!fields.has(key)) {
        fields.set(key, { type: 'note', key, label: br.content.trim(), value: '' });
      }
      segments.push({ type: 'field', key });

    } else if (btype === 'optional') {
      if (!fields.has(key)) {
        const raw = br.content.trim().replace(/\s+/g, ' ');
        fields.set(key, {
          type: 'optional', key, checked: true,
          label: raw.length > 110 ? raw.slice(0, 110) + '…' : raw,
          fullContent: br.content.trim()
        });
      }
      segments.push({ type: 'field', key });

    } else {
      // text fill-in
      if (!fields.has(key)) {
        fields.set(key, { type: 'text', key, label: stripInstructionWord(br.content.trim()), value: '' });
      }
      segments.push({ type: 'field', key });
    }

    lastEnd = br.end;
  }

  if (lastEnd < rawText.length) {
    segments.push({ type: 'text', text: rawText.slice(lastEnd) });
  }

  return { rawText, segments, fields };
}

module.exports = { parseInstruction, findTopLevelBrackets };
