// js/components/members.js

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

  filteredStudents.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'bn'));
  uiManager.clearContainer(elements.studentsListContainer);

  if (filteredStudents.length === 0) {
    uiManager.displayEmptyMessage(elements.studentsListContainer, 'কোনো শিক্ষার্থী পাওয়া যায়নি।');
    return;
  }

  const groupsMap = new Map(stateManager.get('groups').map((g) => [g.id, g.name]));

  const html = filteredStudents
    .map((student) => {
      const groupName = groupsMap.get(student.groupId) || '<span class="text-red-500">গ্রুপ নেই</span>';
      const roleText = student.role ? _getRoleText(student.role) : 'কোনোটি না';

      return `
        <div class="card p-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div class="mb-2 sm:mb-0">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${helpers.ensureBengaliText(
                      student.name
                    )}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        রোল: ${helpers.convertToBanglaNumber(student.roll)} | ${student.academicGroup || ''} | ${
        student.session || ''
      }
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                       গ্রুপ: ${groupName} | দায়িত্ব: ${roleText} | লিঙ্গ: ${student.gender}
                    </p>
                    ${
                      student.contact
                        ? `<p class="text-xs text-gray-500 dark:text-gray-500">যোগাযোগ: ${student.contact}</p>`
                        : ''
                    }
                </div>
                <div class="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-auto">
                    <button data-id="${
                      student.id
                    }" class="edit-student-btn btn btn-light btn-sm py-1 px-2" aria-label="সম্পাদনা"><i class="fas fa-edit pointer-events-none"></i></button>
                    <button data-id="${
                      student.id
                    }" class="delete-student-btn btn btn-danger btn-sm py-1 px-2" aria-label="ডিলিট"><i class="fas fa-trash pointer-events-none"></i></button>
                </div>
            </div>
        </div>
        `;
    })
    .join('');
  elements.studentsListContainer.innerHTML = html;
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

  if (filteredStudents.length === 0) {
    uiManager.displayEmptyMessage(elements.allStudentsCardsContainer, 'কোনো শিক্ষার্থী পাওয়া যায়নি।');
    return;
  }

  const groupsMap = new Map(stateManager.get('groups').map((g) => [g.id, g.name]));
  const groupColors = _getGroupColorClasses(stateManager.get('groups'));

  const html = filteredStudents
    .map((student) => {
      const groupName = groupsMap.get(student.groupId) || 'N/A';
      const roleText = student.role ? _getRoleText(student.role) : 'N/A';
      const colorClasses =
        groupColors[student.groupId] || 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';

      return `
        <div class="${colorClasses} p-4 rounded-lg shadow border transform transition-all hover:scale-[1.03] hover:shadow-lg">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white truncate">${helpers.ensureBengaliText(
              student.name
            )}</h4>
            <p class="text-sm text-gray-700 dark:text-gray-300">রোল: ${helpers.convertToBanglaNumber(student.roll)}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">${student.academicGroup || ''} (${
        student.session || ''
      })</p>
            <div class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 space-y-1">
                <p class="text-xs text-gray-800 dark:text-gray-200"><span class="font-medium">গ্রুপ:</span> ${helpers.ensureBengaliText(
                  groupName
                )}</p>
                <p class="text-xs text-gray-800 dark:text-gray-200"><span class="font-medium">দায়িত্ব:</span> ${roleText}</p>
                <p class="text-xs text-gray-800 dark:text-gray-200"><span class="font-medium">লিঙ্গ:</span> ${
                  student.gender
                }</p>
            </div>
        </div>
        `;
    })
    .join('');
  elements.allStudentsCardsContainer.innerHTML = html;
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
  const colors = [
    'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700',
    'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700',
    'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700',
    'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700',
    'bg-pink-100 dark:bg-pink-900/50 border-pink-300 dark:border-pink-700',
    'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700',
    'bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-700',
    'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700',
  ];
  const groupColorMap = {};
  (groups || []).forEach((group, index) => {
    groupColorMap[group.id] = colors[index % colors.length];
  });
  return groupColorMap;
}
