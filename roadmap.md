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

1. **Insurance Policy Reviewer** - separate tool for reviewing insurance policy text and classifying it; start with declarations page
2. **SB 800 Notice Form Builder** — separate tool for generating pre-litigation SB 800 notices from a form interface
3. **TBD**

## Packaging (Do Last)

- Electron wrapper to convert finished app into a double-clickable desktop application for firm distribution
- Bundle all local data files inside the installer — no server, no internet required

## NOTE ON CURRENT CAPABILITIES IN IMPLEMENTING FEATURES
- python is installed
- ran pip install anthropic pdfplumber pytesseract python-dotenv pymupdf python-docx openpyxl reportlab rapidfuzz regex pandas sqlite-utils rich watchdog httpx
- html is also okay as an option
