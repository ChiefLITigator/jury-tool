# Known Limitations / Test Cases

## CACI 803 — Sequential bracket alternatives
Brackets like `[A railroad company]` / `[A train operator]` appear as separate consecutive
brackets rather than slash-separated options inside a single bracket. The classifier has no
way to detect that adjacent text-type brackets form a mutually exclusive choice set.
**Status:** known limitation, not handled, low priority.
