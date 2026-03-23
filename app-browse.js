'use strict';

// ═══════════════════════════════════════════════════════════════════════
// CACI BROWSE & SEARCH
// ═══════════════════════════════════════════════════════════════════════
// Self-contained. Reads global caciDB (caci-data.js) and esc (app-shared.js).
// No shared mutable state with other modules.

// ─ INDEX ─────────────────────────────────────────────────────────────────────

function buildCaciIndex() {
  const index = [];
  for (const key of Object.keys(caciDB)) {
    if (key.includes('_')) continue;               // skip _directions, _sources, etc.
    if (typeof CACI_UNAVAILABLE !== 'undefined' && CACI_UNAVAILABLE.has(key)) continue;
    const firstLine = caciDB[key].split('\n')[0].trim();
    const m = firstLine.match(/^(\d+)\.\s*(.+)/);
    if (!m) continue;
    index.push({ num: m[1], title: m[2].trim() });
  }
  index.sort((a, b) => parseInt(a.num, 10) - parseInt(b.num, 10));
  return index;
}

// ─ STATE ─────────────────────────────────────────────────────────────────────

let caciIndex          = [];
let browseMode         = 'search';  // 'search' | 'browse' — persists within session
let browseOpenCenturies = {};       // { 400: true, 500: false, ... }

// ─ HELPERS ───────────────────────────────────────────────────────────────────

function getActiveTab() {
  const btn = document.querySelector('.tab-btn.active');
  return btn ? btn.dataset.tab : 'compare';
}

function panelEl()    { return document.getElementById('caciSearchPanel'); }
function isPanelOpen() { return !panelEl().classList.contains('hidden'); }

// ─ POPULATE TARGET INPUT ─────────────────────────────────────────────────────

function pickResult(num) {
  const tab = getActiveTab();
  if (tab === 'compare') {
    document.getElementById('caciNumber').value = num;
  } else if (tab === 'draft') {
    document.getElementById('draftCaciNum').value = num;
    const pkt = document.getElementById('packetCaciNum');
    if (pkt && !pkt.value.trim()) pkt.value = num;
  }
  closePanel();
}

// ─ PANEL OPEN / CLOSE ────────────────────────────────────────────────────────

function openPanel() {
  panelEl().classList.remove('hidden');
  if (browseMode === 'search') {
    const inp = document.getElementById('caciSearchInput');
    inp.value = '';
    renderSearchResults('');
    setTimeout(() => inp.focus(), 0);
  }
}

function closePanel() {
  panelEl().classList.add('hidden');
}

// ─ SEARCH ────────────────────────────────────────────────────────────────────

let searchTimer = null;
let searchHighlight = -1;

function updateSearchHighlight(items) {
  items.forEach((el, i) => {
    el.style.background = (i === searchHighlight) ? 'var(--accent-bg)' : '';
  });
  if (items[searchHighlight]) items[searchHighlight].scrollIntoView({ block: 'nearest' });
}

function renderSearchResults(query) {
  const container = document.getElementById('caciSearchResults');
  const q = query.trim().toLowerCase();

  if (!q) {
    container.innerHTML = '<p class="caci-empty">Type to search by keyword or number…</p>';
    return;
  }

  const hits = caciIndex
    .filter(({ num, title }) => num.includes(q) || title.toLowerCase().includes(q))
    .slice(0, 20);

  if (!hits.length) {
    container.innerHTML = '<p class="caci-empty">No results.</p>';
    return;
  }

  container.innerHTML = hits
    .map(({ num, title }) =>
      `<button class="caci-result-item" data-num="${num}">${num} — ${esc(title)}</button>`)
    .join('');
}

// ─ BROWSE ────────────────────────────────────────────────────────────────────

function seriesLabel(century, items) {
  if (!items.length) return `${century}–${century + 99}`;
  // First 3 words of the first instruction's title as the series descriptor
  const words = items[0].title.split(/[\s,]+/).slice(0, 3).join(' ');
  return `${century}s — ${words}`;
}

function renderBrowseList() {
  // Group index entries by century (floor to nearest 100)
  const groups = new Map();
  for (const item of caciIndex) {
    const c = Math.floor(parseInt(item.num, 10) / 100) * 100;
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(item);
  }

  let html = '';
  for (const [century, items] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const isOpen = !!browseOpenCenturies[century];
    const label  = seriesLabel(century, items);
    const itemsHtml = items
      .map(({ num, title }) =>
        `<button class="caci-result-item" data-num="${num}">${num} — ${esc(title)}</button>`)
      .join('');
    html += `
<div class="caci-browse-group" data-century="${century}">
  <button class="caci-browse-hdr">
    <span>${esc(label)}</span>
    <span class="caci-chevron">${isOpen ? '▲' : '▼'}</span>
  </button>
  <div class="caci-browse-items${isOpen ? '' : ' hidden'}">${itemsHtml}</div>
</div>`;
  }
  document.getElementById('caciBrowseList').innerHTML = html;
}

// ─ MODE SWITCH ───────────────────────────────────────────────────────────────

function switchMode(mode) {
  browseMode = mode;
  document.getElementById('caciModeSearch').classList.toggle('active', mode === 'search');
  document.getElementById('caciModeBrowse').classList.toggle('active', mode === 'browse');
  document.getElementById('caciSearchBody').classList.toggle('hidden', mode !== 'search');
  document.getElementById('caciBrowseBody').classList.toggle('hidden', mode !== 'browse');
}

// ─ INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  caciIndex = buildCaciIndex();
  renderBrowseList();      // build once; DOM toggled in-place for expand/collapse
  renderSearchResults('');

  // Toggle button — refuses to open on VF / Pleading tabs
  document.getElementById('caciSearchToggleBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab === 'vf' || tab === 'pleading') return;
    isPanelOpen() ? closePanel() : openPanel();
  });

  // Close on outside click (checks both the panel and the toggle button)
  document.addEventListener('click', e => {
    if (!isPanelOpen()) return;
    const toggle = document.getElementById('caciSearchToggleBtn');
    if (!panelEl().contains(e.target) && !toggle.contains(e.target)) closePanel();
  });

  // Mode toggles
  document.getElementById('caciModeSearch').addEventListener('click', () => switchMode('search'));
  document.getElementById('caciModeBrowse').addEventListener('click', () => switchMode('browse'));

  // Search input — debounced 250 ms + keyboard navigation
  const searchInput = document.getElementById('caciSearchInput');
  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { renderSearchResults(e.target.value); searchHighlight = -1; }, 250);
  });
  searchInput.addEventListener('keydown', e => {
    const items = document.querySelectorAll('#caciSearchResults .caci-result-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      searchHighlight = Math.min(searchHighlight + 1, items.length - 1);
      updateSearchHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      searchHighlight = Math.max(searchHighlight - 1, 0);
      updateSearchHighlight(items);
    } else if (e.key === 'Enter' && searchHighlight >= 0 && items[searchHighlight]) {
      e.preventDefault();
      pickResult(items[searchHighlight].dataset.num);
    }
  });

  // Event delegation on the panel: result clicks + browse header toggles
  panelEl().addEventListener('click', e => {
    const resultBtn = e.target.closest('.caci-result-item');
    if (resultBtn) { pickResult(resultBtn.dataset.num); return; }

    const hdr = e.target.closest('.caci-browse-hdr');
    if (hdr) {
      const group   = hdr.closest('.caci-browse-group');
      const century = parseInt(group.dataset.century, 10);
      const items   = group.querySelector('.caci-browse-items');
      const chevron = hdr.querySelector('.caci-chevron');
      browseOpenCenturies[century] = !browseOpenCenturies[century];
      items.classList.toggle('hidden', !browseOpenCenturies[century]);
      chevron.textContent = browseOpenCenturies[century] ? '▲' : '▼';
    }
  });

  // Close panel when switching to VF or Pleading tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'vf' || btn.dataset.tab === 'pleading') closePanel();
    });
  });

  // Start in search mode
  switchMode('search');
});
