# CACI Jury Instruction Tool — Feature Roadmap

## Built and Functional

- **CACI Compare**: side-by-side version diff viewer for CACI instructions
- **Draft Form Builder**: interactive instruction compiler with optional/alternative element toggles, Lock & Edit freetext mode, print and export
- **Instruction classifier**: detects element types (fixed, optional, alternative, fill-in)
- **Test suite**: manual test cases documented in test-cases.md

## Known Limitations (By Design, Not Bugs)

- Alternative elements may drop their element number in output — attorney fixes in Lock & Edit
- Element numbers do not auto-renumber when optional elements are toggled — attorney fixes in Lock & Edit

## Next Features (Priority Order)

1. **Cases / Projects** — save and reload a named set of selected instructions and toggle states per case, stored in localStorage
2. **Batch Mode** — compile multiple instructions into a single combined draft in one pass
3. **Fill-In Field Tracking** — highlight all unfilled bracketed fields before locking, so nothing gets missed
4. **SB 800 Notice Form Builder** — separate tool for generating pre-litigation SB 800 notices from a form interface
5. **Verdict Form Builder** — separate tool for drafting special verdict forms tied to selected CACI instructions

## Packaging (Do Last)

- Electron wrapper to convert finished app into a double-clickable desktop application for firm distribution
- Bundle all local data files inside the installer — no server, no internet required
