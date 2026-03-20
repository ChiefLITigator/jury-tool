'use strict';

// ═══════════════════════════════════════════════════════════════════════
// PLEADING TAB — UI CONTROLLER
// ═══════════════════════════════════════════════════════════════════════
// Self-contained. Does not read draftState, packetInstructions, or vfForms.

const PLEADING_PROFILES_KEY = 'pleading_attorney_profiles'; // { [name]: { "pl_...": value } }
const PLEADING_PROFILE_KEY  = 'pleading_attorney_profile';  // legacy compat — always mirrors active profile

// Section A: persisted in localStorage per profile
const PROFILE_FIELD_IDS = [
  'pl_attorney_1_name', 'pl_attorney_1_bar',
  'pl_attorney_2_name', 'pl_attorney_2_bar',
  'pl_attorney_3_name', 'pl_attorney_3_bar',
  'pl_firm_name', 'pl_firm_address_1', 'pl_firm_address_2',
  'pl_firm_phone', 'pl_firm_fax',
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
  'pl_attorney_role', 'pl_client_name',
  'pl_plaintiff_label', 'pl_defendant_label',
  'pl_hearing_date', 'pl_hearing_time', 'pl_hearing_dept',
  'pl_complaint_filed', 'pl_trial_date',
];

// HTML input ID → generatePleadingShell options.fields key
const FIELD_MAP = {
  pl_attorney_1_name:   'attorney_1_name',
  pl_attorney_1_bar:    'attorney_1_bar',
  pl_attorney_2_name:   'attorney_2_name',
  pl_attorney_2_bar:    'attorney_2_bar',
  pl_attorney_3_name:   'attorney_3_name',
  pl_attorney_3_bar:    'attorney_3_bar',
  pl_firm_name:         'firm_name',
  pl_firm_address_1:    'firm_address_1',
  pl_firm_address_2:    'firm_address_2',
  pl_firm_phone:        'firm_phone',
  pl_firm_fax:          'firm_fax',
  pl_attorney_role:     'attorney_role',
  pl_client_name:       'client_name',
  pl_court_name:        'court_name',
  pl_court_county:      'court_county',
  pl_plaintiff_name:    'plaintiff_name',
  pl_plaintiff_desc:    'plaintiff_desc',
  pl_plaintiff_label:   'plaintiff_label',
  pl_defendant_name:    'defendant_name',
  pl_defendant_desc:    'defendant_desc',
  pl_defendant_label:   'defendant_label',
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

/** Load all profiles from localStorage. Migrates legacy single-profile if needed. */
function loadProfilesIndex() {
  try {
    const raw = localStorage.getItem(PLEADING_PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }

    // Migration: wrap the old single profile as "Default"
    const legacy = localStorage.getItem(PLEADING_PROFILE_KEY);
    const profiles = { Default: legacy ? JSON.parse(legacy) : {} };
    localStorage.setItem(PLEADING_PROFILES_KEY, JSON.stringify(profiles));
    return profiles;
  } catch (e) {
    console.warn('[pleading-ui] Failed to load profiles index:', e);
    return { Default: {} };
  }
}

function saveProfilesIndex(profiles) {
  localStorage.setItem(PLEADING_PROFILES_KEY, JSON.stringify(profiles));
}

/** Populate the #profileSelect dropdown. */
function populateProfileSelect(profiles, selectedName) {
  const sel = document.getElementById('profileSelect');
  sel.innerHTML = '';
  for (const name of Object.keys(profiles)) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = name;
    if (name === selectedName) opt.selected = true;
    sel.appendChild(opt);
  }
}

/** Write a profile's fields into the form inputs. */
function applyProfileFields(profile) {
  for (const id of PROFILE_FIELD_IDS) {
    const el = document.getElementById(id);
    if (el) el.value = (profile && profile[id] !== undefined) ? profile[id] : '';
  }
}

/** Read the current form inputs into a profile object. */
function readProfileFields() {
  const profile = {};
  for (const id of PROFILE_FIELD_IDS) {
    const el = document.getElementById(id);
    if (el) profile[id] = el.value;
  }
  return profile;
}

/**
 * Save current fields to the named profile.
 * If #profileNameInput has a value it becomes the profile name (allows creating new profiles).
 * Also writes the legacy single-profile key so export handlers stay compatible.
 */
function saveProfile() {
  const nameInputEl = document.getElementById('profileNameInput');
  const selectEl    = document.getElementById('profileSelect');
  const statusEl    = document.getElementById('pleadingProfileStatus');

  const rawName = nameInputEl.value.trim();
  const name    = rawName || selectEl.value || 'Default';

  const profiles = loadProfilesIndex();
  const fields   = readProfileFields();

  profiles[name] = fields;
  saveProfilesIndex(profiles);

  // Legacy compat: mirror active profile so export handlers can read it
  localStorage.setItem(PLEADING_PROFILE_KEY, JSON.stringify(fields));

  // Clear the "save as" input, refresh dropdown
  nameInputEl.value = '';
  populateProfileSelect(profiles, name);

  statusEl.textContent = `Profile "${name}" saved.`;
  statusEl.className   = 'status ok';
  setTimeout(() => { if (statusEl.textContent === `Profile "${name}" saved.`) statusEl.textContent = ''; }, 3000);
}

/** Delete the currently-selected profile. Refuses if it's the last one. */
function deleteProfile() {
  const selectEl = document.getElementById('profileSelect');
  const statusEl = document.getElementById('pleadingProfileStatus');
  const name     = selectEl.value;

  const profiles = loadProfilesIndex();
  const names    = Object.keys(profiles);

  if (names.length <= 1) {
    statusEl.textContent = 'Cannot delete the only profile.';
    statusEl.className   = 'status err';
    setTimeout(() => { if (statusEl.className === 'status err') statusEl.textContent = ''; }, 3000);
    return;
  }

  delete profiles[name];
  saveProfilesIndex(profiles);

  const remaining = Object.keys(profiles)[0];
  populateProfileSelect(profiles, remaining);
  applyProfileFields(profiles[remaining]);
  localStorage.setItem(PLEADING_PROFILE_KEY, JSON.stringify(profiles[remaining]));

  statusEl.textContent = `Profile "${name}" deleted.`;
  statusEl.className   = 'status ok';
  setTimeout(() => { if (statusEl.textContent === `Profile "${name}" deleted.`) statusEl.textContent = ''; }, 3000);
}

// ─ DISCOVERY MODE ─────────────────────────────────────────────────────────────

const DISC_TITLE_LABELS = {
  rfa:  'REQUESTS FOR ADMISSION',
  srog: 'SPECIAL INTERROGATORIES',
  rfp:  'REQUESTS FOR PRODUCTION OF DOCUMENTS',
};

/** Returns the current pleading mode: 'blank', 'request', or 'response'. */
function getPleadingMode() {
  const radio = document.querySelector('input[name="pleadingMode"]:checked');
  return radio ? radio.value : 'blank';
}

/** Returns true if the user has selected either discovery mode. */
function isDiscoveryMode() {
  const mode = getPleadingMode();
  return mode === 'request' || mode === 'response';
}

/** Auto-generate document title from discovery fields. */
function updateDiscoveryTitle() {
  if (!isDiscoveryMode()) return;
  const mode     = getPleadingMode();
  const type     = document.getElementById('disc_type').value;
  const setNum   = document.getElementById('disc_set_number').value.trim() || 'ONE';
  const propName = document.getElementById('disc_propounding_name').value.trim() || '[PROPOUNDING PARTY]';
  const propRole = document.getElementById('disc_propounding_role').value.toUpperCase();
  const respName = document.getElementById('disc_responding_name').value.trim() || '[RESPONDING PARTY]';
  const respRole = document.getElementById('disc_responding_role').value.toUpperCase();

  let title;
  if (mode === 'request') {
    title = propRole + ' ' + propName + '\u2019S ' +
      DISC_TITLE_LABELS[type] + ', SET ' + setNum.toUpperCase();
  } else {
    title = respRole + ' ' + respName + '\u2019S RESPONSES TO ' +
      propRole + ' ' + propName + '\u2019S ' +
      DISC_TITLE_LABELS[type] + ', SET ' + setNum.toUpperCase();
  }
  document.getElementById('pl_document_title').value = title;
}

/** Read discovery panel fields into an options object. */
function readDiscoveryFields() {
  return {
    direction:        getPleadingMode(),   // 'request' or 'response'
    type:             document.getElementById('disc_type').value,
    propoundingName:  document.getElementById('disc_propounding_name').value.trim(),
    propoundingRole:  document.getElementById('disc_propounding_role').value,
    respondingName:   document.getElementById('disc_responding_name').value.trim(),
    respondingRole:   document.getElementById('disc_responding_role').value,
    setNumber:        document.getElementById('disc_set_number').value.trim() || 'ONE',
    count:            parseInt(document.getElementById('disc_count').value, 10) || 10,
  };
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

  // Discovery mode: attach discovery config
  if (isDiscoveryMode()) {
    opts.discovery = readDiscoveryFields();
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
  // Load profiles and populate dropdown
  const profiles     = loadProfilesIndex();
  const profileNames = Object.keys(profiles);
  const firstName    = profileNames[0] || 'Default';
  populateProfileSelect(profiles, firstName);
  applyProfileFields(profiles[firstName]);

  // Switch profile when dropdown changes
  document.getElementById('profileSelect').addEventListener('change', e => {
    const selected = e.target.value;
    const profs    = loadProfilesIndex();
    applyProfileFields(profs[selected] || {});
    // Mirror to legacy key so export handlers stay in sync
    localStorage.setItem(PLEADING_PROFILE_KEY, JSON.stringify(profs[selected] || {}));
  });

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('deleteProfileBtn').addEventListener('click', deleteProfile);
  document.getElementById('generatePleadingBtn').addEventListener('click', generateShell);

  // Discovery mode toggle — show/hide discovery panel
  const discoveryPanel = document.getElementById('discoveryPanel');
  const discoveryLabel = document.getElementById('discoveryPanelLabel');
  document.querySelectorAll('input[name="pleadingMode"]').forEach(r => {
    r.addEventListener('change', () => {
      const disc = isDiscoveryMode();
      discoveryPanel.classList.toggle('hidden', !disc);
      if (disc) {
        discoveryLabel.textContent = getPleadingMode() === 'request'
          ? 'Discovery Request Details' : 'Discovery Response Details';
        updateDiscoveryTitle();
      }
    });
  });

  // Auto-update document title when discovery fields change
  ['disc_type', 'disc_propounding_name', 'disc_propounding_role',
   'disc_responding_name', 'disc_responding_role', 'disc_set_number'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', updateDiscoveryTitle);
  });

  // Pre-fill Section B from saved case caption when a case is selected.
  // Only fills fields that are currently empty; does not overwrite user-entered data.
  const caseSelectEl = document.getElementById('caseSelect');
  if (caseSelectEl) {
    caseSelectEl.addEventListener('change', e => {
      const name = e.target.value;
      if (!name) return;
      try {
        const cases   = JSON.parse(localStorage.getItem('caci_cases') || '{}');
        const caption = (cases[name] && cases[name].caption) || {};
        const CAPTION_IDS = [
          'pl_court_name', 'pl_court_county',
          'pl_plaintiff_name', 'pl_plaintiff_desc', 'pl_plaintiff_label',
          'pl_defendant_name', 'pl_defendant_desc', 'pl_defendant_label',
          'pl_additional_parties',
          'pl_case_number', 'pl_judge_name', 'pl_dept_number',
          'pl_attorney_role', 'pl_client_name',
        ];
        for (const id of CAPTION_IDS) {
          const el  = document.getElementById(id);
          const key = FIELD_MAP[id];
          if (el && !el.value && caption[key]) el.value = caption[key];
        }
      } catch (err) {
        console.warn('[pleading-ui] caption pre-fill failed:', err);
      }
    });
  }
});
