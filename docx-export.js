'use strict';

// ═══════════════════════════════════════════════════════════════════════
// DOCX EXPORT UTILITY
// Exposes one global: exportDOCX(content, filename)
//
// Requires: node_modules/docx/dist/index.iife.js loaded first, which
// creates window.docx (UMD/IIFE browser bundle, docx v9).
//
// content shape — see VF-BUILD-PROMPT.md § PART 2 for full schema.
// ═══════════════════════════════════════════════════════════════════════

function exportDOCX(content, filename) {
  if (typeof docx === 'undefined') {
    console.error('exportDOCX: docx library not loaded');
    alert('DOCX library not loaded. Cannot export.');
    return;
  }

  const {
    Document, Packer, Paragraph, TextRun, PageBreak,
    AlignmentType, UnderlineType, TabStopType, convertInchesToTwip
  } = docx;

  // ── Shared constants ──────────────────────────────────────────────
  const FONT    = 'Times New Roman';
  const SIZE    = 24;                        // 12pt in half-points
  const LINE15  = 360;                       // 1.5× line spacing (240 = single)
  const IN_HALF = convertInchesToTwip(0.5); // 720 DXA = 0.5 inch

  // ── Helpers ───────────────────────────────────────────────────────

  /** Create a TextRun with shared font / size defaults. */
  function r(text, opts) {
    opts = opts || {};
    const cfg = { text: text || '', font: { name: FONT }, size: SIZE };
    if (opts.bold)      cfg.bold      = true;
    if (opts.italic)    cfg.italic    = true;
    if (opts.underline) cfg.underline = { type: UnderlineType.SINGLE };
    return new TextRun(cfg);
  }

  /** Empty paragraph (spacer). */
  function blank() {
    return new Paragraph({ children: [r('')] });
  }

  // ── Route to builder ─────────────────────────────────────────────
  let children = [];
  try {
    if (content.type === 'instruction') {
      children = buildInstruction(content);
    } else if (content.type === 'packet') {
      children = buildPacket(content);
    } else if (content.type === 'verdict_form') {
      children = buildVerdictForm(content);
    } else {
      console.warn('exportDOCX: unknown content type', content.type);
    }
  } catch (err) {
    console.error('exportDOCX: build error:', err);
    alert('DOCX export failed while building content. See console for details.');
    return;
  }

  // ── Assemble document ─────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 15840 }, // US Letter in DXA
          margin: {
            top:    convertInchesToTwip(1),
            right:  convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1),
          }
        }
      },
      children
    }]
  });

  // ── Download ──────────────────────────────────────────────────────
  Packer.toBlob(doc).then(function(blob) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename || 'document.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
  }).catch(function(err) {
    console.error('exportDOCX: Packer.toBlob failed:', err);
    alert('DOCX export failed. See browser console for details.');
  });

  // ═══════════════════════════════════════════════════════════════════
  // INSTRUCTION BUILDER
  // Heading: centered, bold, underlined
  // Body: paragraphs with 0.5-inch first-line indent, 1.5× line spacing
  // ═══════════════════════════════════════════════════════════════════

  function buildInstruction(c) {
    const items = [];

    if (c.heading) {
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { line: LINE15, after: 240 },
        children:  [r(c.heading, { bold: true, underline: true })]
      }));
    }

    if (c.body) {
      var paras = c.body.split('\n\n');
      for (var i = 0; i < paras.length; i++) {
        var text = paras[i].trim();
        if (!text) continue;
        items.push(new Paragraph({
          indent:   { firstLine: IN_HALF },
          spacing:  { line: LINE15, after: 120 },
          children: [r(text)]
        }));
      }
    }

    return items;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PACKET BUILDER
  // Each section (instruction) starts on its own page.
  // ═══════════════════════════════════════════════════════════════════

  function buildPacket(c) {
    const items = [];
    var sections = c.sections || [];
    for (var si = 0; si < sections.length; si++) {
      // Page break before every section after the first
      if (si > 0) {
        items.push(new Paragraph({ children: [new PageBreak()] }));
      }
      var sectionItems = buildInstruction(sections[si]);
      for (var j = 0; j < sectionItems.length; j++) {
        items.push(sectionItems[j]);
      }
    }
    return items;
  }

  // ═══════════════════════════════════════════════════════════════════
  // VERDICT FORM BUILDER
  // ═══════════════════════════════════════════════════════════════════

  function buildVerdictForm(c) {
    const items    = [];
    const caption  = c.caption   || {};
    const qs       = c.questions || [];
    const RIGHT_TAB = convertInchesToTwip(5.5); // tab stop for right-aligned amounts

    // ── Caption block ────────────────────────────────────────────
    var hasCap = false;

    if (caption.court) {
      hasCap = true;
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { line: LINE15 },
        children:  [r(caption.court.toUpperCase(), { bold: true })]
      }));
    }

    if (caption.dept) {
      hasCap = true;
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { line: LINE15 },
        children:  [r('DEPARTMENT ' + caption.dept.toUpperCase())]
      }));
    }

    if (caption.caseName) {
      hasCap = true;
      items.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing:   { line: LINE15 },
        children:  [r(caption.caseName)]
      }));
    }

    if (caption.caseNumber) {
      hasCap = true;
      items.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing:   { line: LINE15 },
        children:  [r('Case No. ' + caption.caseNumber)]
      }));
    }

    if (hasCap) items.push(blank());

    // ── Form title: centered, bold, underlined, all caps ─────────
    var title = (c.formTitle || 'SPECIAL VERDICT FORM').toUpperCase();
    items.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { line: LINE15, after: 360 },
      children:  [r(title, { bold: true, underline: true })]
    }));

    // ── Questions ────────────────────────────────────────────────
    for (var qi = 0; qi < qs.length; qi++) {
      var q    = qs[qi];
      var num  = q.displayNumber || (qi + 1);
      var text = q.text || '';

      // Question number + text
      items.push(new Paragraph({
        spacing:  { line: LINE15, after: 120 },
        children: [r(num + '.  ', { bold: true }), r(text)]
      }));

      if (q.type === 'yes_no') {
        // Yes / No answer line
        items.push(new Paragraph({
          indent:   { left: IN_HALF },
          spacing:  { line: LINE15, after: 80 },
          children: [r('Yes  ______          No  ______')]
        }));
        // Routing instruction — italic, indented
        if (q.routing_text) {
          items.push(new Paragraph({
            indent:   { left: IN_HALF },
            spacing:  { line: LINE15, after: 280 },
            children: [r(q.routing_text, { italic: true })]
          }));
        }

      } else if (q.type === 'damages') {
        var lineItems = q.line_items || [];
        for (var li = 0; li < lineItems.length; li++) {
          items.push(new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
            indent:   { left: IN_HALF },
            spacing:  { line: LINE15, before: 60, after: 60 },
            children: [r(lineItems[li].label || ''), r('\t$________________')]
          }));
        }
        if (lineItems.length) {
          items.push(new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
            indent:   { left: IN_HALF },
            spacing:  { line: LINE15, before: 80, after: 280 },
            children: [r('TOTAL', { bold: true }), r('\t$________________')]
          }));
        }

      } else if (q.type === 'percentage') {
        var parties = q.parties || [];
        for (var pi = 0; pi < parties.length; pi++) {
          items.push(new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
            indent:   { left: IN_HALF },
            spacing:  { line: LINE15, before: 60, after: 60 },
            children: [r(parties[pi].label || ''), r('\t_____%')]
          }));
        }
        if (parties.length) {
          items.push(new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
            indent:   { left: IN_HALF },
            spacing:  { line: LINE15, before: 80, after: 280 },
            children: [r('TOTAL', { bold: true }), r('\t100%')]
          }));
        }

      } else if (q.type === 'write_in') {
        // Visible writing lines — underscores match HTML preview / TXT output (C4)
        for (var bi = 0; bi < 3; bi++) {
          items.push(new Paragraph({
            indent:  { left: IN_HALF },
            spacing: { line: LINE15, before: 60, after: 60 },
            children: [r('_'.repeat(60))]
          }));
        }
        items.push(blank());
      }
    }

    // ── Signature block ───────────────────────────────────────────
    if (c.include_signature !== false) {
      items.push(blank());
      items.push(blank());
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { line: LINE15, before: 480, after: 200 },
        children:  [r('Dated:  ________________________')]
      }));
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { line: LINE15, after: 80 },
        children:  [r('_________________________________________')]
      }));
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { line: LINE15 },
        children:  [r('Presiding Juror')]
      }));
    }

    return items;
  }
}
