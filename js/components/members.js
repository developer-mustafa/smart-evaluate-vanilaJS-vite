﻿// js/components/members.js

// নির্ভরতা (Dependencies)
let stateManager, uiManager, dataService, helpers, app;

// DOM এলিমেন্ট (উভয় পেজের জন্য)
const elements = {
  membersPage: null,
  csvFileInput: null,
  csvFileName: null,
  downloadTemplateBtn: null,
  processImportBtn: null,
  studentNameInput: null,
  studentRollInput: null,
  studentGenderInput: null,
  studentGroupInput: null,
  studentContactInput: null,
  studentAcademicGroupInput: null,
  studentSessionInput: null,
  studentRoleInput: null,
  addStudentBtn: null,
  membersFilterGroup: null,
  membersFilterAcademicGroup: null,
  studentSearchInput: null,
  studentsListContainer: null,
  cardsPage: null,
  cardsFilterGroup: null,
  cardsFilterAcademicGroup: null,
  allStudentsSearchInput: null,
  allStudentsCardsContainer: null,
};

// ডিবাউন্সিং (Debouncing) ফাংশন সার্চের জন্য
let membersSearchDebouncer;
let cardsSearchDebouncer;

const BADGE_BASE_CLASS = 'inline-flex items-center px-2 py-2 text-xs font-semibold rounded-full border';

const ROLE_BADGE_META = {
  'team-leader': {
    label: 'টিম লিডার',
    className:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/40',
  },
  'time-keeper': {
    label: 'টাইম কিপার',
    className: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-500/40',
  },
  reporter: {
    label: 'রিপোর্টার',
    className:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-100 dark:border-purple-500/40',
  },
  'resource-manager': {
    label: 'রিসোর্স ম্যানেজার',
    className:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/40',
  },
  'peace-maker': {
    label: 'পিস মেকার',
    className:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-500/40',
  },
};

const ACADEMIC_BADGE_META = {
  science: {
    className: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:border-sky-500/40',
  },
  humanities: {
    className:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:border-amber-500/40',
  },
  business: {
    className:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/40',
  },
  other: {
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  },
};

function _renderStudentRoleBadge(roleCode) {
  const baseClasses = `${BADGE_BASE_CLASS} mt-1`;
  if (!roleCode) {
    return `<span class="${baseClasses} bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">দায়িত্ব নির্ধারিত নয়</span>`;
  }
  const meta = ROLE_BADGE_META[roleCode] || {
    label: roleCode,
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  };
  const label = meta.label ? _formatLabel(meta.label) : _formatLabel(roleCode);
  return `<span class="${baseClasses} ${meta.className || ''}">${label}</span>`;
}

function _renderAcademicBadge(academicGroup) {
  const baseClasses = BADGE_BASE_CLASS;
  const value = (academicGroup || '').toString().trim();
  if (!value) {
    return `<span class="${baseClasses} bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">একাডেমিক শাখা নির্ধারিত নয়</span>`;
  }
  const key = _getAcademicKey(value);
  const meta = ACADEMIC_BADGE_META[key] || {
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  };
  const label = _formatLabel(value);
  return `<span class="${baseClasses} ${meta.className}">${label}</span>`;
}

function _formatLabel(value) {
  if (value === null || value === undefined) return '';
  const text =
    helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function'
      ? helpers.ensureBengaliText(value)
      : String(value);
  return _escapeHtml(text.trim());
}

function _escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _getAcademicKey(academicGroup) {
  const value = (academicGroup || '').toString().toLowerCase();
  if (!value) return 'other';
  if (value.includes('science') || value.includes('বিজ্ঞান')) return 'science';
  if (value.includes('human') || value.includes('মানবিক')) return 'humanities';
  if (value.includes('business') || value.includes('ব্যবসা') || value.includes('কমার্স')) return 'business';
  return 'other';
}

/**
 * Members কম্পোনেন্ট শুরু করে (Initialize)।
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  dataService = dependencies.services.dataService;
  helpers = dependencies.utils; // The full helpers object
  app = dependencies.app;

  // Initialize debouncers using the helper
  membersSearchDebouncer = helpers.createDebouncer(300);
  cardsSearchDebouncer = helpers.createDebouncer(300);

  _cacheDOMElements();
  _setupEventListeners();

  console.log('✅ Members component initialized.');

  return {
    render,
    renderStudentCards,
    populateFilters,
  };
}

/**
 * Members পেজ (#page-members) রেন্ডার করে।
 */
export function render() {
  if (!elements.membersPage) {
    console.error('❌ Members render failed: Page element #page-members not found.');
    return;
  }
  console.log('Rendering Members (List) page...');
  populateFilters(); // ফিল্টারগুলো পপুলেট করি
  _renderStudentsList(); // তালিকা রেন্ডার করি
}

/**
 * All Students Cards পেজ (#page-all-students) রেন্ডার করে।
 */
export function renderStudentCards() {
  if (!elements.cardsPage) {
    console.error('❌ Student Cards render failed: Page element #page-all-students not found.');
    return;
  }
  console.log('Rendering All Students (Cards) page...');
  populateFilters(); // এই পেজের ফিল্টারও পপুলেট করি
  _renderStudentCardsList(); // কার্ড তালিকা রেন্ডার করি
}

/**
 * এই কম্পোনেন্টের জন্য প্রয়োজনীয় DOM এলিমেন্টগুলো ক্যাশ করে।
 * @private
 */
function _cacheDOMElements() {
  // Members Page
  elements.membersPage = document.getElementById('page-members');
  if (elements.membersPage) {
    elements.csvFileInput = elements.membersPage.querySelector('#csvFileInput');
    elements.csvFileName = elements.membersPage.querySelector('#csvFileName');
    elements.downloadTemplateBtn = elements.membersPage.querySelector('#downloadTemplateBtn');
    elements.processImportBtn = elements.membersPage.querySelector('#processImportBtn');
    elements.studentNameInput = elements.membersPage.querySelector('#studentNameInput');
    elements.studentRollInput = elements.membersPage.querySelector('#studentRollInput');
    elements.studentGenderInput = elements.membersPage.querySelector('#studentGenderInput');
    elements.studentGroupInput = elements.membersPage.querySelector('#studentGroupInput');
    elements.studentContactInput = elements.membersPage.querySelector('#studentContactInput');
    elements.studentAcademicGroupInput = elements.membersPage.querySelector('#studentAcademicGroupInput');
    elements.studentSessionInput = elements.membersPage.querySelector('#studentSessionInput');
    elements.studentRoleInput = elements.membersPage.querySelector('#studentRoleInput');
    elements.addStudentBtn = elements.membersPage.querySelector('#addStudentBtn');
    elements.membersFilterGroup = elements.membersPage.querySelector('#membersFilterGroup');
    elements.membersFilterAcademicGroup = elements.membersPage.querySelector('#membersFilterAcademicGroup');
    elements.studentSearchInput = elements.membersPage.querySelector('#studentSearchInput');
    elements.studentsListContainer = elements.membersPage.querySelector('#studentsList');
  } else {
    console.warn('Members page element (#page-members) not found!');
  }

  // All Students Cards Page
  elements.cardsPage = document.getElementById('page-all-students');
  if (elements.cardsPage) {
    elements.cardsFilterGroup = elements.cardsPage.querySelector('#cardsFilterGroup');
    elements.cardsFilterAcademicGroup = elements.cardsPage.querySelector('#cardsFilterAcademicGroup');
    elements.allStudentsSearchInput = elements.cardsPage.querySelector('#allStudentsSearchInput');
    elements.allStudentsCardsContainer = elements.cardsPage.querySelector('#allStudentsCards');
  } else {
    console.warn('All Students Cards page element (#page-all-students) not found!');
  }
}

/**
 * Members পেজের ইভেন্ট লিসেনার সেট আপ করে।
 * @private
 */
function _setupEventListeners() {
  // Members Page Listeners
  if (elements.membersPage) {
    uiManager.addListener(elements.addStudentBtn, 'click', _handleAddStudent);
    uiManager.addListener(elements.downloadTemplateBtn, 'click', _handleDownloadTemplate);
    uiManager.addListener(elements.csvFileInput, 'change', _handleFileSelect);
    uiManager.addListener(elements.processImportBtn, 'click', _handleProcessImport);

    // Filters (Members List)
    uiManager.addListener(elements.membersFilterGroup, 'change', (e) => {
      stateManager.updateFilters('membersList', { groupFilter: e.target.value });
      _renderStudentsList();
    });
    uiManager.addListener(elements.membersFilterAcademicGroup, 'change', (e) => {
      stateManager.updateFilters('membersList', { academicFilter: e.target.value });
      _renderStudentsList();
    });
    uiManager.addListener(elements.studentSearchInput, 'input', (e) => {
      const searchTerm = e.target.value.trim();
      membersSearchDebouncer(() => {
        stateManager.updateFilters('membersList', { searchTerm: searchTerm });
        _renderStudentsList();
      });
    });

    // Event delegation for edit/delete buttons in the list
    uiManager.addListener(elements.studentsListContainer, 'click', (e) => {
      const editBtn = e.target.closest('.edit-student-btn');
      const deleteBtn = e.target.closest('.delete-student-btn');
      if (editBtn) _handleEditStudent(editBtn.dataset.id);
      else if (deleteBtn) _handleDeleteStudent(deleteBtn.dataset.id);
    });
  }

  // All Students Cards Page Listeners
  if (elements.cardsPage) {
    // Filters (Cards View)
    uiManager.addListener(elements.cardsFilterGroup, 'change', (e) => {
      stateManager.updateFilters('studentCards', { groupFilter: e.target.value });
      _renderStudentCardsList();
    });
    uiManager.addListener(elements.cardsFilterAcademicGroup, 'change', (e) => {
      stateManager.updateFilters('studentCards', { academicFilter: e.target.value });
      _renderStudentCardsList();
    });
    uiManager.addListener(elements.allStudentsSearchInput, 'input', (e) => {
      const searchTerm = e.target.value.trim();
      cardsSearchDebouncer(() => {
        stateManager.updateFilters('studentCards', { searchTerm: searchTerm });
        _renderStudentCardsList();
      });
    });
  }
}

/**
 * ফিল্টার ড্রপডাউনগুলো (গ্রুপ ও একাডেমিক গ্রুপ) পপুলেট করে।
 */
export function populateFilters() {
  // গ্রুপ ড্রপডাউন পপুলেট করি (groups কম্পোনেন্ট থেকে)
  const groupSelectIds = [];
  if (elements.studentGroupInput) groupSelectIds.push('studentGroupInput');
  if (elements.membersFilterGroup) groupSelectIds.push('membersFilterGroup');
  if (elements.cardsFilterGroup) groupSelectIds.push('cardsFilterGroup');

  // Access groups component via app instance
  if (app.components.groups && app.components.groups.populateGroupSelects) {
    app.components.groups.populateGroupSelects(groupSelectIds, 'সকল গ্রুপ');
    // Override default text for the add student form
    if (elements.studentGroupInput) {
      app.components.groups.populateGroupSelects(['studentGroupInput'], 'গ্রুপ নির্বাচন করুন');
      // Make "Select..." option disabled
      if (elements.studentGroupInput.options[0]) elements.studentGroupInput.options[0].disabled = true;
    }
  } else {
    console.warn('Members: Groups component not available to populate group selects.');
  }

  // একাডেমিক গ্রুপ ড্রপডাউন পপুলেট করি (শিক্ষার্থীদের ডেটা থেকে)
  const students = stateManager.get('students');
  const academicGroups = [...new Set(students.map((s) => s.academicGroup).filter(Boolean))].sort((a, b) =>
    (a || '').localeCompare(b || '', 'bn')
  );
  const academicOptions = academicGroups.map((ag) => ({ value: ag, text: ag }));

  const academicSelects = [elements.membersFilterAcademicGroup, elements.cardsFilterAcademicGroup];
  academicSelects.forEach((select) => {
    if (select) {
      uiManager.populateSelect(select, academicOptions, 'সকল একাডেমিক গ্রুপ');
    }
  });
}

// --- Rendering Logic ---

/**
 * ফিল্টার করা শিক্ষার্থীদের তালিকা (#page-members) রেন্ডার করে।
 * @private
 */
function _renderStudentsList() {
  if (!elements.studentsListContainer) return;

  const filters = stateManager.getFilterSection('membersList');
  const filteredStudents = _applyFilters(filters);

  uiManager.clearContainer(elements.studentsListContainer);

  if (!filteredStudents.length) {
    uiManager.displayEmptyMessage(elements.studentsListContainer, 'কোনো শিক্ষার্থী পাওয়া যায়নি।');
    return;
  }

  const groups = stateManager.get('groups') || [];
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const groupColors = _getGroupColorClasses(groups);

  const groupedStudents = new Map();
  filteredStudents.forEach((student) => {
    const key = student.groupId || 'unassigned';
    if (!groupedStudents.has(key)) groupedStudents.set(key, []);
    groupedStudents.get(key).push(student);
  });

  const sortedGroupEntries = Array.from(groupedStudents.entries()).sort((a, b) => {
    if (a[0] === 'unassigned') return 1;
    if (b[0] === 'unassigned') return -1;
    const nameA = groupMap.get(a[0])?.name || '';
    const nameB = groupMap.get(b[0])?.name || '';
    return nameA.localeCompare(nameB, 'bn');
  });

  const sections = sortedGroupEntries
    .map(([groupId, students]) => {
      const palette = groupColors[groupId] || groupColors.__default;
      const groupInfo = groupMap.get(groupId);
      const groupNameRaw = groupInfo?.name || 'গ্রুপ নির্ধারিত নয়';
      const groupName =
        helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function'
          ? helpers.ensureBengaliText(groupNameRaw)
          : groupNameRaw;
      const totalLabel =
        helpers?.convertToBanglaNumber && typeof helpers.convertToBanglaNumber === 'function'
          ? helpers.convertToBanglaNumber(students.length)
          : students.length;

      students.sort((a, b) => {
        const rollA = a.roll !== undefined && a.roll !== null ? a.roll.toString() : '';
        const rollB = b.roll !== undefined && b.roll !== null ? b.roll.toString() : '';
        const rollCompare = rollA.localeCompare(rollB, undefined, { numeric: true });
        if (rollCompare !== 0) return rollCompare;
        return (a.name || '').localeCompare(b.name || '', 'bn');
      });

      const studentCards = students
        .map((student) => {
          const name =
            helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function'
              ? helpers.ensureBengaliText(student.name || '')
              : student.name || '';
          const hasRoll = student.roll !== undefined && student.roll !== null && `${student.roll}`.trim() !== '';
          const rollDisplay = hasRoll
            ? helpers?.convertToBanglaNumber && typeof helpers.convertToBanglaNumber === 'function'
              ? helpers.convertToBanglaNumber(student.roll)
              : student.roll
            : '';
          const session =
            helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function'
              ? helpers.ensureBengaliText(student.session || '')
              : student.session || '';
          const gender =
            helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function'
              ? helpers.ensureBengaliText(student.gender || '')
              : student.gender || '';
          const academicGroupText =
            helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function'
              ? helpers.ensureBengaliText(student.academicGroup || '')
              : student.academicGroup || '';
          const contactMarkup = student.contact
            ? `<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">যোগাযোগ: ${student.contact}</div>`
            : '';

          return `
            <article class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/70 p-4 shadow-sm hover:shadow-md transition">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h5 class="text-base font-semibold text-gray-900 dark:text-white">${name || 'নাম নেই'}</h5>
                  <div class="mt-2 flex flex-wrap gap-2">
                    ${_renderAcademicBadge(student.academicGroup)}
                    ${_renderStudentRoleBadge(student.role)}
                  </div>
                </div>
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">${
                  rollDisplay ? `রোল ${rollDisplay}` : ''
                }</span>
              </div>
              <div class="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <p><span class="font-medium text-gray-700 dark:text-gray-200">সেশন:</span> ${session || 'N/A'}</p>
                <p><span class="font-medium text-gray-700 dark:text-gray-200"> </span> ${gender || 'N/A'}</p>
                <p><span class="font-medium text-gray-700 dark:text-gray-200">একাডেমিক গ্রুপ:</span> ${
                  academicGroupText || 'N/A'
                }</p>
              </div>
              ${contactMarkup}
              <div class="mt-4 flex justify-end gap-2">
                <button data-id="${
                  student.id
                }" class="edit-student-btn btn btn-light btn-sm py-1 px-2" aria-label="সম্পাদনা"><i class="fas fa-edit pointer-events-none"></i></button>
                <button data-id="${
                  student.id
                }" class="delete-student-btn btn btn-danger btn-sm py-1 px-2" aria-label="ডিলিট"><i class="fas fa-trash pointer-events-none"></i></button>
              </div>
            </article>
          `;
        })
        .join('');

      const headerClasses = `px-4 py-3 bg-gradient-to-r ${
        palette.headerBg || 'from-slate-500 to-slate-600'
      } text-white flex items-center justify-between`;
      const sectionWrapper = `mb-6 rounded-xl overflow-hidden shadow-sm border ${
        palette.panelBorder || 'border-gray-200 dark:border-gray-700'
      }`;
      const bodyWrapper = `p-4 ${palette.sectionBg || 'bg-gray-50 dark:bg-gray-900/40'}`;

      return `
        <section class="${sectionWrapper}">
          <header class="${headerClasses}">
            <h3 class="text-lg font-semibold">${groupName}</h3>
            <span class="text-sm font-medium">মোট শিক্ষার্থী: ${totalLabel}</span>
          </header>
          <div class="${bodyWrapper}">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              ${studentCards}
            </div>
          </div>
        </section>
      `;
    })
    .join('');

  elements.studentsListContainer.innerHTML = sections;
}

/**
 * ফিল্টার করা শিক্ষার্থীদের কার্ড ভিউ (#page-all-students) রেন্ডার করে।
 * @private
 */

function _renderStudentCardsList() {
  if (!elements.allStudentsCardsContainer) return;

  const filters = stateManager.getFilterSection('studentCards');
  const filteredStudents = _applyFilters(filters);

  filteredStudents.sort(
    (a, b) => (a.groupId || '').localeCompare(b.groupId || '') || (a.name || '').localeCompare(b.name || '', 'bn')
  );
  uiManager.clearContainer(elements.allStudentsCardsContainer);

  if (!filteredStudents.length) {
    uiManager.displayEmptyMessage(elements.allStudentsCardsContainer, 'কোনো শিক্ষার্থী পাওয়া যায়নি।');
    return;
  }

  const groups = stateManager.get('groups') || [];
  const groupsMap = new Map(groups.map((g) => [g.id, g]));
  const groupColors = _getGroupColorClasses(groups);
  const allStudents = stateManager.get('students') || [];
  const groupStudentCountMap = new Map();
  allStudents.forEach((student) => {
    const key = student.groupId || '__ungrouped';
    groupStudentCountMap.set(key, (groupStudentCountMap.get(key) || 0) + 1);
  });

  const totalStudents = filteredStudents.length;
  const groupIds = new Set();
  const academicCounts = { science: 0, humanities: 0, business: 0, other: 0 };
  let contactable = 0;
  let roleAssigned = 0;
  let maleCount = 0;
  let femaleCount = 0;

  filteredStudents.forEach((student) => {
    const groupId = student.groupId;
    if (groupId) groupIds.add(groupId);
    const key = _getAcademicKey(student.academicGroup);
    academicCounts[key] = (academicCounts[key] || 0) + 1;
    if (student.contact && String(student.contact).trim()) contactable++;
    if (student.role) roleAssigned++;
    const gender = (student.gender || '').trim();
    if (gender.includes('ছেলে')) maleCount++;
    else if (gender.includes('মেয়ে')) femaleCount++;
  });

  const formatNumber = (value, fractionDigits = 0) => {
    const numeric = Number.isFinite(value) ? value : 0;
    const formatted = fractionDigits > 0 ? numeric.toFixed(fractionDigits) : Math.round(numeric).toString();
    return helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(formatted) : formatted;
  };

  const contactRate = totalStudents > 0 ? (contactable / totalStudents) * 100 : 0;
  const roleRate = totalStudents > 0 ? (roleAssigned / totalStudents) * 100 : 0;

  const academicLabels = {
    science: 'বিজ্ঞান শাখা',
    humanities: 'মানবিক শাখা',
    business: 'ব্যবসায় শিক্ষা',
    other: 'অন্যান্য',
  };

  const academicChips = Object.entries(academicCounts)
    .filter(([, count]) => count > 0)
    .map(
      ([key, count]) =>
        `<span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm"><i class="fas fa-folder-open"></i> ${
          academicLabels[key]
        }: ${formatNumber(count)}</span>`
    )
    .join('');

  const summaryStats = [
    {
      icon: 'fa-users',
      accent: 'from-sky-500/30 via-transparent to-transparent',
      heading: 'মোট শিক্ষার্থী',
      value: formatNumber(totalStudents),
      description: 'ডিরেক্টরিতে রেকর্ডকৃত সক্রিয় সদস্য সংখ্যা।',
    },
    {
      icon: 'fa-layer-group',
      accent: 'from-emerald-500/30 via-transparent to-transparent',
      heading: 'সক্রিয় গ্রুপ',
      value: formatNumber(groupIds.size),
      description: 'দলভিত্তিক ব্যবস্থাপনায় যুক্ত মোট গ্রুপ।',
    },
    {
      icon: 'fa-phone-volume',
      accent: 'from-amber-500/30 via-transparent to-transparent',
      heading: 'যোগাযোগযোগ্য সদস্য',
      value: formatNumber(contactable),
      description: `${formatNumber(contactRate, 0)}% শিক্ষার্থীর যোগাযোগ তথ্য প্রস্তুত।`,
    },
    {
      icon: 'fa-id-badge',
      accent: 'from-indigo-500/30 via-transparent to-transparent',
      heading: 'ভূমিকায় নিযুক্ত',
      value: formatNumber(roleAssigned),
      description: `${formatNumber(roleRate, 0)}% শিক্ষার্থী দায়িত্বে যুক্ত।`,
    },
  ];

  const summaryCardsMarkup = summaryStats
    .map(
      ({ icon, accent, heading, value, description }) => `
      <article class="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 shadow-lg backdrop-blur">
        <div class="absolute inset-0 bg-gradient-to-br ${accent}"></div>
        <div class="relative space-y-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
            <i class="fas ${icon}"></i>
          </span>
          <div>
            <p class="text-sm font-semibold text-white/80">${heading}</p>
            <p class="mt-1 text-3xl font-bold leading-tight">${value}</p>
          </div>
          <p class="text-sm leading-relaxed text-white/75">${description}</p>
        </div>
      </article>
    `
    )
    .join('');

  const summary = `
    <section class="col-span-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white shadow-2xl">
      <div class="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.35),_transparent_55%)]"></div>
      <div class="absolute -left-32 -bottom-32 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl"></div>
      <div class="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl"></div>
      <div class="relative space-y-10 p-6 md:p-10">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg">
                <i class="fas fa-address-card text-xl"></i>
              </span>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Student Directory</p>
                <h2 class="text-3xl md:text-4xl font-bold leading-tight">সকল শিক্ষার্থী (কার্ড ভিউ)</h2>
              </div>
            </div>
            <p class="max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">দলভিত্তিক শিক্ষার্থীদের তথ্য এক নজরে দেখতে কার্ড ভিউ ব্যবহার করুন। গ্রুপ, একাডেমিক বিভাগ কিংবা নাম-রোল দিয়ে ফিল্টার করলেই তথ্য রিয়েল-টাইমে হালনাগাদ হয়।</p>
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80">
              <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 shadow-sm backdrop-blur"><i class="fas fa-bolt"></i> লাইভ ডেটা সিঙ্ক</span>
              <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 shadow-sm backdrop-blur"><i class="fas fa-layer-group"></i> ${formatNumber(
                groupIds.size
              )} টি গ্রুপ</span>
            </div>
          </div>
          <div class="flex flex-col items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-5 shadow-lg backdrop-blur">
            <span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
              <i class="fas fa-gauge-high"></i> দ্রুত বিশ্লেষণ
            </span>
            <p class="text-4xl font-bold leading-none">${formatNumber(totalStudents)} জন</p>
            <p class="text-sm leading-relaxed text-white/75">বর্তমান সেশনে রেকর্ডকৃত মোট শিক্ষার্থী</p>
          </div>
        </div>
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          ${summaryCardsMarkup}
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20"><i class="fas fa-male"></i> ছেলে: ${formatNumber(
            maleCount
          )}</span>
          <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20"><i class="fas fa-female"></i> মেয়ে: ${formatNumber(
            femaleCount
          )}</span>
          ${academicChips}
        </div>
      </div>
    </section>
  `;

  const cards = filteredStudents
    .map((student) => {
      const groupInfo = groupsMap.get(student.groupId);
      const groupNameRaw = groupInfo?.name || 'গ্রুপ নির্ধারিত নয়';
      const groupName = _formatLabel(groupNameRaw);
      const palette = groupColors[student.groupId] || groupColors.__default;
      const name = _formatLabel(student.name || 'নাম নেই');
      const hasRoll = student.roll !== undefined && student.roll !== null && `${student.roll}`.trim() !== '';
      const rollDisplay = hasRoll
        ? helpers?.convertToBanglaNumber && typeof helpers.convertToBanglaNumber === 'function'
          ? helpers.convertToBanglaNumber(student.roll)
          : String(student.roll)
        : '';
      const session = _formatLabel(student.session || 'N/A');
      const gender = _formatLabel(student.gender || 'N/A');
      const academicGroup = _formatLabel(student.academicGroup || 'N/A');
      const contactText = student.contact ? _formatLabel(student.contact) : '';
      const contactBlock = contactText
        ? `<div class="flex items-center gap-2 rounded-xl bg-gray-100/80 px-3 py-2 text-xs text-gray-600 shadow-sm dark:bg-gray-800/70 dark:text-gray-200"><i class="fas fa-phone text-emerald-500"></i><span>${contactText}</span></div>`
        : '';
      const groupMemberCount = groupStudentCountMap.get(student.groupId || '__ungrouped') || 0;

      return `
  <article
    class="relative mx-auto w-full max-w-md md:max-w-lg rounded-2xl border ${
      palette.panelBorder || 'border-gray-200 dark:border-gray-700'
    } bg-white dark:bg-gray-900/80 shadow-sm hover:shadow-lg transition duration-200"
  >
    <!-- Top gradient bar -->
    <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${
      palette.headerBg || 'from-indigo-500 to-blue-500'
    } rounded-t-2xl"></div>

    <!-- Body (kept compact) -->
    <div class="relative px-4 pt-8 pb-4 flex flex-col items-center gap-3">

      <!-- Roll: top-center -->
      <span
        class="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex h-10 min-w-[72px] px-3 items-center justify-center rounded-xl
               bg-gray-100 text-[13px] font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200 shadow-inner
               ring-1 ring-gray-300 dark:ring-gray-700"
      >
        ${rollDisplay ? `রোল ${rollDisplay}` : 'N/A'}
      </span>

      <!-- Name (below roll) -->
      <h4
        class="mt-1 text-base md:text-lg font-semibold leading-snug text-gray-900 dark:text-white
               text-center whitespace-normal break-words hyphens-auto"
        title="\${name}"
      >
        ${name}
      </h4>

      <!-- Badges (tight wrap) -->
      <div class="flex flex-wrap justify-center gap-1.5">
        ${_renderAcademicBadge(student.academicGroup)}
        ${_renderStudentRoleBadge(student.role)}
        <span class="\${BADGE_BASE_CLASS} ${
          palette.chipBg ||
          'bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
        }">গ্রুপ: ${groupName}</span>
      </div>

      <!-- Info grid (compact, non-overlapping) -->
      <section
        class="w-full grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))] text-[13px] font-medium"
        aria-label="Student details"
      >
        <div class="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 px-2.5 py-1.5">
          <i class="fas fa-calendar text-indigo-500"></i>
          <span class="text-gray-600 dark:text-gray-300">সেশন:</span>
          <span class="text-gray-900 dark:text-gray-100 font-semibold ml-1 break-words">${session}</span>
        </div>

        <div class="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 px-2.5 py-1.5">
          <i class="fas fa-venus-mars text-pink-500"></i>
          <span class="text-gray-600 dark:text-gray-300"></span>
          <span class="text-gray-900 dark:text-gray-100 font-semibold ml-1 break-words">${gender}</span>
        </div>



       
      </section>
    </div>
  </article>
`;
    })
    .join('');

  elements.allStudentsCardsContainer.innerHTML = `
   
  
      <div class="grid items-stretch gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${cards}
      </div>
   
  `;
}

/**
 * শিক্ষার্থীদের তালিকা ফিল্টার করে।
 * @param {object} filters - { groupFilter, academicFilter, searchTerm }
 * @returns {Array<object>} - ফিল্টার করা শিক্ষার্থীদের তালিকা।
 * @private
 */
function _applyFilters(filters) {
  const students = stateManager.get('students');
  if (!students) return []; // Return empty array if state not ready

  const { groupFilter, academicFilter, searchTerm } = filters || {};
  const term = (searchTerm || '').toLowerCase();

  return students.filter((student) => {
    const matchesGroup = !groupFilter || groupFilter === 'all' || student.groupId === groupFilter;
    const matchesAcademic = !academicFilter || academicFilter === 'all' || student.academicGroup === academicFilter;
    const matchesSearch =
      !term ||
      (student.name || '').toLowerCase().includes(term) ||
      (student.roll || '').toLowerCase().includes(term) ||
      (student.academicGroup || '').toLowerCase().includes(term);
    return matchesGroup && matchesAcademic && matchesSearch;
  });
}

// --- CRUD Handlers ---

/**
 * নতুন শিক্ষার্থী যোগ করার হ্যান্ডলার।
 * @private
 */
async function _handleAddStudent() {
  const name = elements.studentNameInput?.value.trim();
  const roll = elements.studentRollInput?.value.trim();
  const gender = elements.studentGenderInput?.value;
  const groupId = elements.studentGroupInput?.value;
  const contact = elements.studentContactInput?.value.trim();
  const academicGroup = elements.studentAcademicGroupInput?.value.trim();
  const session = elements.studentSessionInput?.value.trim();
  const role = elements.studentRoleInput?.value;

  if (!name || !roll || !gender || !academicGroup || !session) {
    uiManager.showToast('নাম, রোল, লিঙ্গ, একাডেমিক গ্রুপ এবং সেশন আবশ্যক।', 'warning');
    return;
  }

  uiManager.showLoading('শিক্ষার্থী যাচাই করা হচ্ছে...');
  try {
    const isDuplicate = await dataService.checkStudentUniqueness(roll, academicGroup);
    if (isDuplicate) {
      uiManager.showToast('এই রোল নম্বর এবং একাডেমিক গ্রুপ দিয়ে ইতিমধ্যে একজন শিক্ষার্থী রয়েছে।', 'warning');
      uiManager.hideLoading();
      return;
    }
  } catch (error) {
    console.error('Uniqueness check failed:', error);
    uiManager.showToast(`শিক্ষার্থী যাচাই করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    uiManager.hideLoading();
    return;
  }

  const newStudentData = { name, roll, gender, groupId, contact, academicGroup, session, role };

  uiManager.showLoading('শিক্ষার্থী যোগ করা হচ্ছে...');
  try {
    await dataService.addStudent(newStudentData);
    await app.refreshAllData(); // Refresh data

    // Reset form
    if (elements.studentNameInput) elements.studentNameInput.value = '';
    if (elements.studentRollInput) elements.studentRollInput.value = '';
    if (elements.studentGroupInput) elements.studentGroupInput.value = '';
    if (elements.studentContactInput) elements.studentContactInput.value = '';
    if (elements.studentAcademicGroupInput) elements.studentAcademicGroupInput.value = '';
    if (elements.studentSessionInput) elements.studentSessionInput.value = '';
    if (elements.studentRoleInput) elements.studentRoleInput.value = '';

    uiManager.showToast('শিক্ষার্থী সফলভাবে যোগ করা হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error adding student:', error);
    uiManager.showToast(`শিক্ষার্থী যোগ করতে সমস্যা হয়েছে: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
  }
}

/**
 * শিক্ষার্থী সম্পাদনার জন্য মোডাল দেখানোর হ্যান্ডলার।
 * @param {string} studentId
 * @private
 */
function _handleEditStudent(studentId) {
  const student = stateManager.get('students').find((s) => s.id === studentId);
  if (!student) {
    uiManager.showToast('শিক্ষার্থী পাওয়া যায়নি।', 'error');
    return;
  }

  const groups = stateManager.get('groups');
  const groupOptions = groups
    .map(
      (g) =>
        `<option value="${g.id}" ${g.id === student.groupId ? 'selected' : ''}>${helpers.ensureBengaliText(
          g.name
        )}</option>`
    )
    .sort((a, b) => a.localeCompare(b, 'bn'))
    .join('');

  const roleOptions = [
    { value: '', text: 'কোনোটি না' },
    { value: 'team-leader', text: 'টিম লিডার' },
    { value: 'time-keeper', text: 'টাইম কিপার' },
    { value: 'reporter', text: 'রিপোর্টার' },
    { value: 'resource-manager', text: 'রিসোর্স ম্যানেজার' },
    { value: 'peace-maker', text: 'পিস মেকার' },
  ]
    .map((r) => `<option value="${r.value}" ${r.value === student.role ? 'selected' : ''}>${r.text}</option>`)
    .join('');

  const contentHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="label">নাম*</label><input id="editStudentName" type="text" value="${
              student.name || ''
            }" class="form-input" maxlength="100"></div>
            <div><label class="label">রোল*</label><input id="editStudentRoll" type="text" value="${
              student.roll || ''
            }" class="form-input" maxlength="20"></div>
            <div><label class="label">লিঙ্গ*</label><select id="editStudentGender" class="form-select"><option value="ছেলে" ${
              student.gender === 'ছেলে' ? 'selected' : ''
            }>ছেলে</option><option value="মেয়ে" ${
    student.gender === 'মেয়ে' ? 'selected' : ''
  }>মেয়ে</option></select></div>
            <div><label class="label">গ্রুপ</label><select id="editStudentGroup" class="form-select"><option value="">গ্রুপ নেই</option>${groupOptions}</select></div>
            <div><label class="label">যোগাযোগ</label><input id="editStudentContact" type="text" value="${
              student.contact || ''
            }" class="form-input" maxlength="100"></div>
            <div><label class="label">একাডেমিক গ্রুপ*</label><input id="editStudentAcademicGroup" type="text" value="${
              student.academicGroup || ''
            }" class="form-input" maxlength="50"></div>
            <div><label class="label">সেশন*</label><input id="editStudentSession" type="text" value="${
              student.session || ''
            }" class="form-input" maxlength="20"></div>
            <div><label class="label">দায়িত্ব</label><select id="editStudentRole" class="form-select">${roleOptions}</select></div>
        </div>`;

  uiManager.showEditModal('শিক্ষার্থী সম্পাদনা', contentHTML, async () => {
    // Save Callback
    const updatedData = {
      name: document.getElementById('editStudentName')?.value.trim(),
      roll: document.getElementById('editStudentRoll')?.value.trim(),
      gender: document.getElementById('editStudentGender')?.value,
      groupId: document.getElementById('editStudentGroup')?.value,
      contact: document.getElementById('editStudentContact')?.value.trim(),
      academicGroup: document.getElementById('editStudentAcademicGroup')?.value.trim(),
      session: document.getElementById('editStudentSession')?.value.trim(),
      role: document.getElementById('editStudentRole')?.value,
    };
    if (
      !updatedData.name ||
      !updatedData.roll ||
      !updatedData.gender ||
      !updatedData.academicGroup ||
      !updatedData.session
    ) {
      uiManager.showToast('নাম, রোল, লিঙ্গ, একাডেমিক গ্রুপ এবং সেশন আবশ্যক।', 'warning');
      return;
    }

    uiManager.showLoading('যাচাই করা হচ্ছে...');
    if (updatedData.roll !== student.roll || updatedData.academicGroup !== student.academicGroup) {
      try {
        const isDuplicate = await dataService.checkStudentUniqueness(
          updatedData.roll,
          updatedData.academicGroup,
          studentId
        );
        if (isDuplicate) {
          uiManager.showToast('এই রোল নম্বর এবং একাডেমিক গ্রুপ দিয়ে অন্য একজন শিক্ষার্থী রয়েছে।', 'warning');
          uiManager.hideLoading();
          return;
        }
      } catch (error) {
        uiManager.showToast(`যাচাই করতে সমস্যা: ${error.message}`, 'error');
        uiManager.hideLoading();
        return;
      }
    }
    uiManager.showLoading('আপডেট করা হচ্ছে...');
    try {
      await dataService.updateStudent(studentId, updatedData);
      await app.refreshAllData();
      uiManager.hideModal(uiManager.elements.editModal);
      uiManager.showToast('শিক্ষার্থী সফলভাবে আপডেট করা হয়েছে।', 'success');
    } catch (error) {
      console.error('❌ Error updating student:', error);
      uiManager.showToast(`আপডেট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    } finally {
      uiManager.hideLoading();
    }
  });
}

/**
 * শিক্ষার্থী ডিলিটের হ্যান্ডলার।
 * @param {string} studentId
 * @private
 */
function _handleDeleteStudent(studentId) {
  const student = stateManager.get('students').find((s) => s.id === studentId);
  if (!student) {
    uiManager.showToast('শিক্ষার্থী পাওয়া যায়নি।', 'error');
    return;
  }

  const message = `আপনি কি নিশ্চিত যে আপনি "${student.name}" (রোল: ${helpers.convertToBanglaNumber(
    student.roll
  )}) কে ডিলিট করতে চান?`;

  uiManager.showDeleteModal('শিক্ষার্থী ডিলিট নিশ্চিতকরণ', message, async () => {
    // Confirm Callback
    uiManager.showLoading('ডিলিট করা হচ্ছে...');
    try {
      await dataService.deleteStudent(studentId);
      // TODO: Delete associated evaluation data?
      await app.refreshAllData();
      uiManager.showToast('শিক্ষার্থী সফলভাবে ডিলিট করা হয়েছে।', 'success');
    } catch (error) {
      console.error('❌ Error deleting student:', error);
      uiManager.showToast(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    } finally {
      uiManager.hideLoading();
    }
  });
}

// --- CSV Handling ---

function _handleDownloadTemplate() {
  const headers = ['নাম', 'রোল', 'লিঙ্গ', 'একাডেমিক গ্রুপ', 'সেশন', 'যোগাযোগ', 'গ্রুপের নাম', 'দায়িত্ব কোড'];
  const example = [
    'উদাহরণ শিক্ষার্থী',
    '১০১',
    'ছেলে',
    'HSC 2025',
    '2023-24',
    '01xxxxxxxxx',
    'গ্রুপ আলফা',
    'team-leader',
  ];
  const rolesNote = `# দায়িত্ব কোডসমূহ: team-leader, time-keeper, reporter, resource-manager, peace-maker (খালি রাখা যাবে)`;
  const csv = Papa.unparse([headers, example], { header: false });
  const fullCsv = rolesNote + '\n' + csv;
  const blob = new Blob([`\uFEFF${fullCsv}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'student_template.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  uiManager.showToast('CSV টেমপ্লেট ডাউনলোড শুরু হয়েছে।', 'info');
}

function _handleFileSelect() {
  if (elements.csvFileInput.files.length > 0) {
    elements.csvFileName.textContent = `নির্বাচিত ফাইল: ${elements.csvFileInput.files[0].name}`;
  } else {
    elements.csvFileName.textContent = '';
  }
}

function _handleProcessImport() {
  const file = elements.csvFileInput?.files[0];
  if (!file) {
    uiManager.showToast('অনুগ্রহ করে একটি CSV ফাইল নির্বাচন করুন।', 'warning');
    return;
  }

  uiManager.showLoading('CSV ফাইল প্রসেস করা হচ্ছে...');
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
    transformHeader: (h) => helpers.ensureBengaliText(h).trim(),
    transform: (value) => helpers.ensureBengaliText(value),
    complete: async (results) => {
      const data = results.data;
      const errors = [];
      const newStudents = [];
      if (!data || data.length === 0) errors.push('CSV ফাইলটি খালি।');
      const requiredHeaders = ['নাম', 'রোল', 'লিঙ্গ', 'একাডেমিক গ্রুপ', 'সেশন'];
      const missingHeaders = requiredHeaders.filter((h) => !results.meta.fields.includes(h));
      if (missingHeaders.length > 0) errors.push(`আবশ্যক হেডার নেই: ${missingHeaders.join(', ')}`);

      if (errors.length > 0) {
        uiManager.hideLoading();
        uiManager.showToast(errors[0], 'error', 5000);
        return;
      }

      const groupsMap = new Map(stateManager.get('groups').map((g) => [g.name.toLowerCase(), g.id]));
      const existingStudents = stateManager.get('students');
      uiManager.showLoading('শিক্ষার্থী ডেটা যাচাই করা হচ্ছে...');

      // Use Promise.all for faster (parallel) DB checks
      const validationPromises = data.map(async (row, i) => {
        const lineNumber = i + 2;
        const name = row['নাম'];
        const roll = row['রোল'];
        const gender = row['লিঙ্গ'];
        const academicGroup = row['একাডেমিক গ্রুপ'];
        const session = row['সেশন'];
        const contact = row['যোগাযোগ'] || '';
        const groupName = (row['গ্রুপের নাম'] || '').toLowerCase();
        const roleCode = (row['দায়িত্ব কোড'] || '').toLowerCase();

        if (!name || !roll || !gender || !academicGroup || !session) {
          return { error: `লাইন ${lineNumber}: আবশ্যক ফিল্ড খালি রয়েছে।` };
        }
        if (!['ছেলে', 'মেয়ে'].includes(gender)) {
          return { error: `লাইন ${lineNumber}: লিঙ্গ (${gender}) অবশ্যই 'ছেলে' অথবা 'মেয়ে' হতে হবে।` };
        }
        const groupId = groupName ? groupsMap.get(groupName) || '' : '';
        if (groupName && !groupId) {
          return { error: `লাইন ${lineNumber}: "${row['গ্রুপের নাম']}" নামে গ্রুপ পাওয়া যায়নি।` };
        }

        try {
          const isDuplicateInDB = await dataService.checkStudentUniqueness(roll, academicGroup);
          if (isDuplicateInDB) {
            return { error: `লাইন ${lineNumber}: রোল ${roll} (${academicGroup}) ডাটাবেসে ইতিমধ্যে রয়েছে।` };
          }
        } catch (dbError) {
          return { error: `লাইন ${lineNumber}: রোল ${roll} যাচাই করতে সমস্যা (${dbError.message})।` };
        }

        return { student: { name, roll, gender, groupId, contact, academicGroup, session, role: roleCode } };
      });

      const resultsData = await Promise.all(validationPromises);

      // Check for duplicates *within* the CSV file
      const rollCheck = new Set();
      for (const item of resultsData) {
        if (item.student) {
          const key = `${item.student.roll}|${item.student.academicGroup}`;
          if (rollCheck.has(key)) {
            item.error = `লাইন (CSV): রোল ${item.student.roll} (${item.student.academicGroup}) ফাইলে ডুপ্লিকেট রয়েছে।`;
            delete item.student;
          }
          rollCheck.add(key);
        }
        if (item.error) errors.push(item.error);
        else if (item.student) newStudents.push(item.student);
      }
      // --- End Validation ---

      if (errors.length > 0) {
        uiManager.hideLoading();
        const shortError = errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : '');
        uiManager.showToast(
          `CSV ইম্পোর্টে ${helpers.convertToBanglaNumber(errors.length)} টি ত্রুটি:\n${shortError}`,
          'error',
          10000
        );
        console.error('CSV Import Errors:', errors);
      } else if (newStudents.length > 0) {
        uiManager.showLoading(`(${helpers.convertToBanglaNumber(newStudents.length)}) জন শিক্ষার্থী যোগ করা হচ্ছে...`);
        try {
          // TODO: Use batch add if available in dataService
          for (const studentData of newStudents) {
            await dataService.addStudent(studentData);
          }
          await app.refreshAllData();
          uiManager.showToast(
            `${helpers.convertToBanglaNumber(newStudents.length)} জন শিক্ষার্থী ইম্পোর্ট হয়েছে।`,
            'success'
          );
        } catch (error) {
          uiManager.showToast(`শিক্ষার্থী যোগ করতে সমস্যা: ${error.message}`, 'error');
        } finally {
          uiManager.hideLoading();
        }
      } else {
        uiManager.hideLoading();
        uiManager.showToast('CSV ফাইলে নতুন শিক্ষার্থী পাওয়া যায়নি।', 'info');
      }

      if (elements.csvFileInput) elements.csvFileInput.value = '';
      if (elements.csvFileName) elements.csvFileName.textContent = '';
    },
    error: (err) => {
      uiManager.hideLoading();
      uiManager.showToast(`CSV ফাইল পার্স করতে সমস্যা: ${err.message}`, 'error');
    },
  });
}

// --- Helper Functions ---
function _getRoleText(roleCode) {
  const roles = {
    'team-leader': 'টিম লিডার',
    'time-keeper': 'টাইম কিপার',
    reporter: 'রিপোর্টার',
    'resource-manager': 'রিসোর্স ম্যানেজার',
    'peace-maker': 'পিস মেকার',
  };
  return roles[roleCode] || roleCode || 'কোনোটি না'; // Handle empty/null
}

function _getGroupColorClasses(groups) {
  const palette = [
    {
      panelBorder: 'border-blue-300 dark:border-blue-700',
      sectionBg: 'bg-blue-50/80 dark:bg-blue-900/15',
      headerBg: 'from-blue-500 to-indigo-500',
      chipBg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800',
    },
    {
      panelBorder: 'border-emerald-300 dark:border-emerald-700',
      sectionBg: 'bg-emerald-50/80 dark:bg-emerald-900/15',
      headerBg: 'from-emerald-500 to-teal-500',
      chipBg:
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800',
    },
    {
      panelBorder: 'border-amber-300 dark:border-amber-700',
      sectionBg: 'bg-amber-50/80 dark:bg-amber-900/20',
      headerBg: 'from-amber-500 to-orange-500',
      chipBg:
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800',
    },
    {
      panelBorder: 'border-purple-300 dark:border-purple-700',
      sectionBg: 'bg-purple-50/80 dark:bg-purple-900/15',
      headerBg: 'from-violet-500 to-purple-600',
      chipBg:
        'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-800',
    },
    {
      panelBorder: 'border-rose-300 dark:border-rose-700',
      sectionBg: 'bg-rose-50/80 dark:bg-rose-900/15',
      headerBg: 'from-rose-500 to-pink-500',
      chipBg: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-800',
    },
    {
      panelBorder: 'border-sky-300 dark:border-sky-700',
      sectionBg: 'bg-sky-50/80 dark:bg-sky-900/15',
      headerBg: 'from-sky-500 to-cyan-500',
      chipBg: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:border-sky-800',
    },
    {
      panelBorder: 'border-indigo-300 dark:border-indigo-700',
      sectionBg: 'bg-indigo-50/80 dark:bg-indigo-900/15',
      headerBg: 'from-indigo-500 to-blue-600',
      chipBg:
        'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-800',
    },
    {
      panelBorder: 'border-lime-300 dark:border-lime-700',
      sectionBg: 'bg-lime-50/80 dark:bg-lime-900/15',
      headerBg: 'from-lime-500 to-green-500',
      chipBg: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/40 dark:text-lime-100 dark:border-lime-800',
    },
  ];

  const fallback = {
    panelBorder: 'border-gray-200 dark:border-gray-700',
    sectionBg: 'bg-gray-50 dark:bg-gray-900/40',
    headerBg: 'from-slate-500 to-slate-600',
    chipBg: 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
  };

  const map = { __default: fallback };
  (groups || []).forEach((group, index) => {
    map[group.id] = palette[index % palette.length];
  });
  return map;
}
