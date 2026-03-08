'use strict';

// ═══════════════════════════════════════════════════════════════════════
// PLEADING TAB — UI CONTROLLER
// ═══════════════════════════════════════════════════════════════════════
// Self-contained. Does not read draftState, packetInstructions, or vfForms.

const PLEADING_PROFILE_KEY = 'pleading_attorney_profile';

// Section A: persisted in localStorage
const PROFILE_FIELD_IDS = [
  'pl_attorney_name', 'pl_state_bar_number', 'pl_firm_name',
  'pl_firm_address_1', 'pl_firm_address_2', 'pl_firm_phone',
  'pl_firm_fax', 'pl_firm_email', 'pl_attorney_role', 'pl_client_name',
];

// Section B: case-specific, not persisted
const DOC_FIELD_IDS = [
  'pl_court_name', 'pl_court_county',
  'pl_plaintiff_name', 'pl_plaintiff_desc',
  'pl_defendant_name', 'pl_defendant_desc',
  'pl_additional_parties',
  'pl_case_number', 'pl_judge_name', 'pl_dept_number',
  'pl_document_title',
];

// Optional Section B fields — included in options only if non-empty
const OPTIONAL_FIELD_IDS = [
  'pl_hearing_date', 'pl_hearing_time', 'pl_hearing_dept',
  'pl_complaint_filed', 'pl_trial_date',
];

// HTML input ID → generatePleadingShell options.fields key
const FIELD_MAP = {
  pl_attorney_name:     'attorney_name',
  pl_state_bar_number:  'state_bar_number',
  pl_firm_name:         'firm_name',
  pl_firm_address_1:    'firm_address_1',
  pl_firm_address_2:    'firm_address_2',
  pl_firm_phone:        'firm_phone',
  pl_firm_fax:          'firm_fax',
  pl_firm_email:        'firm_email',
  pl_attorney_role:     'attorney_role',
  pl_client_name:       'client_name',
  pl_court_name:        'court_name',
  pl_court_county:      'court_county',
  pl_plaintiff_name:    'plaintiff_name',
  pl_plaintiff_desc:    'plaintiff_desc',
  pl_defendant_name:    'defendant_name',
  pl_defendant_desc:    'defendant_desc',
  pl_additional_parties:'additional_parties',
  pl_case_number:       'case_number',
  pl_judge_name:        'judge_name',
  pl_dept_number:       'dept_number',
  pl_document_title:    'document_title',
  pl_hearing_date:      'hearing_date',
  pl_hearing_time:      'hearing_time',
  pl_hearing_dept:      'hearing_dept',
  pl_complaint_filed:   'complaint_filed',
  pl_trial_date:        'trial_date',
};

// ─ PROFILE PERSISTENCE ───────────────────────────────────────────────────────

function loadProfile() {
  try {
    const raw = localStorage.getItem(PLEADING_PROFILE_KEY);
    if (!raw) return;
    const profile = JSON.parse(raw);
    for (const id of PROFILE_FIELD_IDS) {
      const el = document.getElementById(id);
      if (el && profile[id] !== undefined) el.value = profile[id];
    }
  } catch (e) {
    console.warn('[pleading-ui] Failed to load profile:', e);
  }
}

function saveProfile() {
  const profile = {};
  for (const id of PROFILE_FIELD_IDS) {
    const el = document.getElementById(id);
    if (el) profile[id] = el.value;
  }
  localStorage.setItem(PLEADING_PROFILE_KEY, JSON.stringify(profile));

  const statusEl = document.getElementById('pleadingProfileStatus');
  statusEl.textContent = 'Profile saved.';
  statusEl.className = 'status ok';
  setTimeout(() => { if (statusEl.textContent === 'Profile saved.') statusEl.textContent = ''; }, 3000);
}

// ─ GENERATION ────────────────────────────────────────────────────────────────

async function generateShell() {
  const statusEl = document.getElementById('pleadingGenStatus');
  statusEl.textContent = '';
  statusEl.className = 'status';

  // Build fields from live input values (Section A + required Section B)
  const fields = {};
  for (const id of [...PROFILE_FIELD_IDS, ...DOC_FIELD_IDS]) {
    const el = document.getElementById(id);
    if (el) fields[FIELD_MAP[id]] = el.value.trim();
  }

  // Optional Section B fields — include only if non-empty
  for (const id of OPTIONAL_FIELD_IDS) {
    const el = document.getElementById(id);
    if (el && el.value.trim()) {
      fields[FIELD_MAP[id]] = el.value.trim();
    }
    // If blank: key is omitted entirely (not passed as "")
  }

  const opts = { fields };
  if (!document.getElementById('pleadingPaperCheck').checked) {
    opts.plainPaper = true;
  }

  console.log('[pleading-ui] generatePleadingShell options:', JSON.stringify(opts, null, 2));

  try {
    const blob = await generatePleadingShell(opts);

    // Trigger DOCX download
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    const docTitle  = fields.document_title || 'Pleading_Shell';
    const slug      = docTitle.replace(/[^A-Za-z0-9]/g, '_').slice(0, 40);
    const dateStr   = new Date().toISOString().slice(0, 10);
    a.download      = `${slug}_${dateStr}.docx`;
    a.click();
    URL.revokeObjectURL(url);

    statusEl.textContent = 'Downloaded.';
    statusEl.className   = 'status ok';
    setTimeout(() => { if (statusEl.textContent === 'Downloaded.') statusEl.textContent = ''; }, 4000);
  } catch (err) {
    console.error('[pleading-ui] generatePleadingShell failed:', err);
    statusEl.textContent = 'Error: ' + (err.message || 'generation failed');
    statusEl.className   = 'status err';
  }
}

// ─ INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('generatePleadingBtn').addEventListener('click', generateShell);
});
