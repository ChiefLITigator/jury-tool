# CACI Tool — Session Notes

## Session: 2026-02-24

### Changes to draft-parser.js

**Fix A — Alternative detection spaces (classifyBracket + Pass 1)**
- Changed `/^\d+\.\s*\[or\]/i` → `/^\d+\.\s*\[\s*or\s*\]/i` in two places:
  1. `classifyBracket` line 86 (main type detection)
  2. `parseInstruction` Pass 1 loop (altContentMap builder)
- Reason: CACI 303 element 4 uses `[ or ]` with spaces inside the bracket; the old
  regex failed to match it and the signal bracket fell through to `optional`.

**Fix B — Inner bracket registration for optional blocks**
- Added `findTopLevelBrackets` loop inside the `btype === 'optional'` branch of
  `parseInstruction`, mirroring the same loop already present in the `alternative` branch.
- Registers inner `text`, `dropdown`, and `connector` brackets as named form fields.
- Reason: Optional blocks containing fill-in placeholders (e.g., CACI 303 element 3:
  `That [ specify occurrence... ]`) were rendering raw bracket text in the compiled output
  instead of the user's entered value.

**Fix C — e.g.-prefixed bracket classification**
- Added rule in `classifyBracket` (after `note` check, before `dropdown`):
  `if (/^e\.g\./i.test(c)) return 'text';`
- Reason: Brackets like `[e.g., workers' compensation claim]` (> 25 chars) were falling
  through to `optional` due to length. Semantically these are always text fill-ins
  (the `e.g.` shows an example value the user should replace).
- Confirmed fix by Pass 4 diagnostic: CACI 457, 2512 and others now `text`.

### Test results after all three fixes
- 874 instructions tested
- All-text misclassifications: 0
- Bracket-but-no-field: 0
- Pass 3 ([N. [and]] patterns): 0 found in data — no handling needed
- Pass 4 (e.g. brackets): all `e.g.`-starting brackets now correctly `text`
