// js/components/tasks.js

// Dependencies
let stateManager, uiManager, dataService, helpers, app;

// DOM Elements
const elements = {};

// Default score breakdown (based on slide + MCQ request)
const DEFAULT_SCORE_BREAKDOWN = {
  task: 20,
  team: 15,
  additional: 25,
  mcq: 40,
};
const DEFAULT_TOTAL_SCORE = 100; // 20 + 15 + 25 + 40

/**
 * Initializes the Tasks component.
 * @param {object} dependencies - Passed from app.js.
 * @returns {object} - Public methods.
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  dataService = dependencies.services.dataService;
  helpers = dependencies.utils;
  app = dependencies.app;

  _cacheDOMElements();
  _setupEventListeners();

  console.log('✅ Tasks component initialized.');

  return {
    render,
    populateTaskSelects, // For evaluation component
  };
}

/**
 * Renders the Tasks page (#page-tasks).
 */
export function render() {
  if (!elements.page) return;
  const tasks = stateManager.get('tasks');
  _renderTasksList(tasks);
  // Reset add form breakdown fields to default when page renders
  _setBreakdownInputs(DEFAULT_SCORE_BREAKDOWN, ''); // '' prefix for add form
}

/**
 * Caches DOM elements for the Tasks page.
 * @private
 */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-tasks');
  if (!elements.page) {
    console.error('❌ Tasks page element (#page-tasks) not found!');
    return;
  }

  elements.taskNameInput = elements.page.querySelector('#taskNameInput');

  // Score Breakdown Inputs
  elements.maxTaskScoreInput = elements.page.querySelector('#maxTaskScoreInput');
  elements.maxTeamScoreInput = elements.page.querySelector('#maxTeamScoreInput');
  elements.maxAdditionalScoreInput = elements.page.querySelector('#maxAdditionalScoreInput');
  elements.maxMcqScoreInput = elements.page.querySelector('#maxMcqScoreInput');
  elements.totalMaxScoreDisplay = elements.page.querySelector('#totalMaxScoreDisplay');

  elements.taskDescriptionInput = elements.page.querySelector('#taskDescriptionInput');
  elements.taskDateInput = elements.page.querySelector('#taskDateInput');
  elements.addTaskBtn = elements.page.querySelector('#addTaskBtn');
  elements.tasksListContainer = elements.page.querySelector('#tasksList');

  if (!elements.maxTaskScoreInput || !elements.totalMaxScoreDisplay) {
    console.warn('Tasks: One or more score breakdown elements are missing in the HTML.');
  }
}

/**
 * Sets up event listeners for the Tasks page.
 * @private
 */
function _setupEventListeners() {
  if (!elements.page) return;

  uiManager.addListener(elements.addTaskBtn, 'click', _handleAddTask);

  // Add listeners to breakdown inputs to update total display
  const breakdownInputs = [
    elements.maxTaskScoreInput,
    elements.maxTeamScoreInput,
    elements.maxAdditionalScoreInput,
    elements.maxMcqScoreInput,
  ];
  breakdownInputs.forEach((input) => {
    uiManager.addListener(input, 'input', () => _updateTotalMaxScoreDisplay(''));
  });

  // Event delegation for Edit/Delete buttons
  uiManager.addListener(elements.tasksListContainer, 'click', (e) => {
    const editBtn = e.target.closest('.edit-task-btn');
    const deleteBtn = e.target.closest('.delete-task-btn');
    if (editBtn) _handleEditTask(editBtn.dataset.id);
    else if (deleteBtn) _handleDeleteTask(deleteBtn.dataset.id);
  });
}

/**
 * Helper to convert various date types to a comparable YYYY-MM-DD string.
 * @param {string|Date|object} dateInput - The date to convert.
 * @returns {string} A string in YYYY-MM-DD format or an empty string.
 * @private
 */
function _getComparableDateString(dateInput) {
  if (!dateInput) return ''; // Handle null, undefined, empty string
  try {
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0]; // Handle ISO or YYYY-MM-DD strings
    }
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0]; // Convert Date object
    }
    if (typeof dateInput.toDate === 'function') {
      // Firestore Timestamp
      return dateInput.toDate().toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Unsupported date type for comparison:', dateInput, e);
  }
  return ''; // Fallback
}

/** Updates the total max score display */
function _updateTotalMaxScoreDisplay(formPrefix = '') {
  const taskScore = parseFloat(document.getElementById(`${formPrefix}maxTaskScoreInput`)?.value) || 0;
  const teamScore = parseFloat(document.getElementById(`${formPrefix}maxTeamScoreInput`)?.value) || 0;
  const additionalScore = parseFloat(document.getElementById(`${formPrefix}maxAdditionalScoreInput`)?.value) || 0;
  const mcqScore = parseFloat(document.getElementById(`${formPrefix}maxMcqScoreInput`)?.value) || 0;
  const total = taskScore + teamScore + additionalScore + mcqScore;

  const displayElement = document.getElementById(`${formPrefix}totalMaxScoreDisplay`);
  if (displayElement) {
    displayElement.textContent = helpers.convertToBanglaNumber(total);
  }
  return total;
}

/** Sets score breakdown input values */
function _setBreakdownInputs(scores, formPrefix = '') {
  const taskInput = document.getElementById(`${formPrefix}maxTaskScoreInput`);
  const teamInput = document.getElementById(`${formPrefix}maxTeamScoreInput`);
  const addInput = document.getElementById(`${formPrefix}maxAdditionalScoreInput`);
  const mcqInput = document.getElementById(`${formPrefix}maxMcqScoreInput`);

  // Use provided scores or fall back to defaults
  if (taskInput) taskInput.value = scores?.task ?? DEFAULT_SCORE_BREAKDOWN.task;
  if (teamInput) teamInput.value = scores?.team ?? DEFAULT_SCORE_BREAKDOWN.team;
  if (addInput) addInput.value = scores?.additional ?? DEFAULT_SCORE_BREAKDOWN.additional;
  if (mcqInput) mcqInput.value = scores?.mcq ?? DEFAULT_SCORE_BREAKDOWN.mcq;

  _updateTotalMaxScoreDisplay(formPrefix);
}

/** Renders the list of tasks */
function _renderTasksList(tasks) {
  if (!elements.tasksListContainer) return;
  uiManager.clearContainer(elements.tasksListContainer);
  if (!tasks || tasks.length === 0) {
    uiManager.displayEmptyMessage(elements.tasksListContainer, 'কোনো টাস্ক যোগ করা হয়নি।');
    return;
  }

  // --- FIXED SORTING ---
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateStrA = _getComparableDateString(a.date);
    const dateStrB = _getComparableDateString(b.date);
    return dateStrB.localeCompare(dateStrA); // Descending (newest first)
  });
  // --- END FIX ---

  const html = sortedTasks
    .map((task) => {
      const formattedDate = helpers.formatTimestamp(task.date) || 'তারিখ নেই';

      // Calculate total max score from breakdown OR use stored maxScore
      // This ensures old tasks (without breakdown) still show a score
      const totalMaxScore = task.maxScoreBreakdown
        ? (parseFloat(task.maxScoreBreakdown.task) || 0) +
          (parseFloat(task.maxScoreBreakdown.team) || 0) +
          (parseFloat(task.maxScoreBreakdown.additional) || 0) +
          (parseFloat(task.maxScoreBreakdown.mcq) || 0)
        : parseFloat(task.maxScore) || DEFAULT_TOTAL_SCORE; // Fallback to task's maxScore or default

      const maxScoreText = helpers.convertToBanglaNumber(totalMaxScore);
      const description = task.description
        ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${helpers.truncateText(task.description, 100)}</p>`
        : '';

      const breakdown = task.maxScoreBreakdown || {}; // Use empty obj if no breakdown
      const breakdownTitle =
        `ব্রেকডাউন: টাস্ক-${helpers.convertToBanglaNumber(breakdown.task ?? 'N/A')}, ` +
        `টিম-${helpers.convertToBanglaNumber(breakdown.team ?? 'N/A')}, ` +
        `অতিরিক্ত-${helpers.convertToBanglaNumber(breakdown.additional ?? 'N/A')}, ` +
        `MCQ-${helpers.convertToBanglaNumber(breakdown.mcq ?? 'N/A')}`;

      return `
        <div class="card p-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div class="mb-2 sm:mb-0 flex-grow" title="${breakdownTitle}">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${helpers.ensureBengaliText(
                      task.name
                    )}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        তারিখ: ${formattedDate} | মোট সর্বোচ্চ স্কোর: ${maxScoreText}
                    </p>
                    ${description}
                </div>
                <div class="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-center">
                    <button data-id="${
                      task.id
                    }" class="edit-task-btn btn btn-light btn-sm py-1 px-2" aria-label="সম্পাদনা"><i class="fas fa-edit pointer-events-none"></i></button>
                    <button data-id="${
                      task.id
                    }" class="delete-task-btn btn btn-danger btn-sm py-1 px-2" aria-label="ডিলিট"><i class="fas fa-trash pointer-events-none"></i></button>
                </div>
            </div>
        </div>`;
    })
    .join('');
  elements.tasksListContainer.innerHTML = html;
}

/** Handles adding a new task */
async function _handleAddTask() {
  const name = elements.taskNameInput?.value.trim();
  const description = elements.taskDescriptionInput?.value.trim();
  const date = elements.taskDateInput?.value;

  const maxScores = {
    task: parseFloat(elements.maxTaskScoreInput?.value) || 0,
    team: parseFloat(elements.maxTeamScoreInput?.value) || 0,
    additional: parseFloat(elements.maxAdditionalScoreInput?.value) || 0,
    mcq: parseFloat(elements.maxMcqScoreInput?.value) || 0,
  };
  const totalMaxScore = maxScores.task + maxScores.team + maxScores.additional + maxScores.mcq;

  if (!name) {
    uiManager.showToast('টাস্কের নাম আবশ্যক।', 'warning');
    return;
  }
  if (totalMaxScore <= 0 || Object.values(maxScores).some((s) => s < 0)) {
    uiManager.showToast('সর্বোচ্চ স্কোরের প্রতিটি অংশ ০ বা তার বেশি হতে হবে এবং যোগফল ০ এর বেশি হতে হবে।', 'warning');
    return;
  }
  if (!date) {
    uiManager.showToast('টাস্কের তারিখ নির্বাচন করুন।', 'warning');
    return;
  }

  uiManager.showLoading('টাস্ক যাচাই করা হচ্ছে...');
  try {
    const exists = await dataService.checkTaskNameExists(name);
    if (exists) {
      uiManager.showToast('এই নামে একটি টাস্ক ইতিমধ্যে বিদ্যমান।', 'warning');
      uiManager.hideLoading();
      return;
    }
  } catch (error) {
    uiManager.showToast(`নাম যাচাই করতে সমস্যা: ${error.message}`, 'error');
    uiManager.hideLoading();
    return;
  }

  const newTaskData = {
    name,
    description,
    date,
    maxScore: totalMaxScore,
    maxScoreBreakdown: maxScores,
    nameLower: name.toLowerCase(),
  };

  uiManager.showLoading('টাস্ক যোগ করা হচ্ছে...');
  try {
    await dataService.addTask(newTaskData);
    await app.refreshAllData();
    if (elements.taskNameInput) elements.taskNameInput.value = '';
    _setBreakdownInputs(DEFAULT_SCORE_BREAKDOWN, ''); // Reset breakdown inputs
    if (elements.taskDescriptionInput) elements.taskDescriptionInput.value = '';
    if (elements.taskDateInput) elements.taskDateInput.value = '';
    uiManager.showToast('টাস্ক সফলভাবে যোগ করা হয়েছে।', 'success');
  } catch (error) {
    uiManager.showToast(`টাস্ক যোগ করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
  }
}

/** Handles editing a task */
function _handleEditTask(taskId) {
  const task = stateManager.get('tasks').find((t) => t.id === taskId);
  if (!task) {
    uiManager.showToast('টাস্কটি পাওয়া যায়নি।', 'error');
    return;
  }

  // Use existing breakdown or default if not present
  const currentBreakdown = task.maxScoreBreakdown || DEFAULT_SCORE_BREAKDOWN;
  // Calculate total based on breakdown or task.maxScore
  const currentTotal = task.maxScoreBreakdown
    ? (parseFloat(currentBreakdown.task) || 0) +
      (parseFloat(currentBreakdown.team) || 0) +
      (parseFloat(currentBreakdown.additional) || 0) +
      (parseFloat(currentBreakdown.mcq) || 0)
    : task.maxScore || DEFAULT_TOTAL_SCORE;
  const dateValue = _getComparableDateString(task.date) || '';

  const contentHTML = `
        <div class="space-y-4">
            <div><label for="editTaskName" class="label">টাস্ক নাম*</label><input id="editTaskName" type="text" value="${
              task.name || ''
            }" class="form-input" maxlength="100"></div>
            <fieldset class="border p-3 rounded dark:border-gray-600">
                 <legend class="text-sm font-medium px-1">সর্বোচ্চ স্কোর ব্রেকডাউন*</legend>
                 <div class="grid grid-cols-2 gap-3 mt-2">
                    <div><label for="editmaxTaskScoreInput" class="label text-xs">টাস্ক</label><input id="editmaxTaskScoreInput" type="number" min="0" step="any" value="${
                      currentBreakdown.task ?? 0
                    }" class="form-input breakdown-input"></div>
                    <div><label for="editmaxTeamScoreInput" class="label text-xs">টিম</label><input id="editmaxTeamScoreInput" type="number" min="0" step="any" value="${
                      currentBreakdown.team ?? 0
                    }" class="form-input breakdown-input"></div>
                    <div><label for="editmaxAdditionalScoreInput" class="label text-xs">অতিরিক্ত</label><input id="editmaxAdditionalScoreInput" type="number" min="0" step="any" value="${
                      currentBreakdown.additional ?? 0
                    }" class="form-input breakdown-input"></div>
                    <div><label for="editmaxMcqScoreInput" class="label text-xs">MCQ</label><input id="editmaxMcqScoreInput" type="number" min="0" step="any" value="${
                      currentBreakdown.mcq ?? 0
                    }" class="form-input breakdown-input"></div>
                 </div>
                 <p class="text-sm mt-3 text-gray-600 dark:text-gray-400">মোট সর্বোচ্চ স্কোর: <strong id="edittotalMaxScoreDisplay">${helpers.convertToBanglaNumber(
                   currentTotal
                 )}</strong></p>
            </fieldset>
            <div><label for="editTaskDescription" class="label">বিবরণ</label><textarea id="editTaskDescription" class="form-input" rows="3">${
              task.description || ''
            }</textarea></div>
            <div><label for="editTaskDate" class="label">তারিখ*</label><input id="editTaskDate" type="date" value="${dateValue}" class="form-input"></div>
        </div>`;

  uiManager.showEditModal('টাস্ক সম্পাদনা', contentHTML, async () => {
    // Save Callback
    const updatedName = document.getElementById('editTaskName')?.value.trim();
    const updatedDescription = document.getElementById('editTaskDescription')?.value.trim();
    const updatedDate = document.getElementById('editTaskDate')?.value;
    const updatedMaxScores = {
      task: parseFloat(document.getElementById('editmaxTaskScoreInput')?.value) || 0,
      team: parseFloat(document.getElementById('editmaxTeamScoreInput')?.value) || 0,
      additional: parseFloat(document.getElementById('editmaxAdditionalScoreInput')?.value) || 0,
      mcq: parseFloat(document.getElementById('editmaxMcqScoreInput')?.value) || 0,
    };
    const updatedTotalMaxScore =
      updatedMaxScores.task + updatedMaxScores.team + updatedMaxScores.additional + updatedMaxScores.mcq;

    if (
      !updatedName ||
      updatedTotalMaxScore <= 0 ||
      !updatedDate ||
      Object.values(updatedMaxScores).some((s) => s < 0)
    ) {
      uiManager.showToast('নাম, তারিখ এবং স্কোরের (>=0) যোগফল ০ এর বেশি হতে হবে।', 'warning');
      return;
    }

    uiManager.showLoading('যাচাই করা হচ্ছে...');
    try {
      const nameExists = await dataService.checkTaskNameExists(updatedName, taskId);
      if (nameExists) {
        uiManager.showToast('এই নামে অন্য টাস্ক আছে।', 'warning');
        uiManager.hideLoading();
        return;
      }
    } catch (error) {
      uiManager.showToast(`নাম যাচাই করতে সমস্যা: ${error.message}`, 'error');
      uiManager.hideLoading();
      return;
    }

    const updatedData = {
      name: updatedName,
      description: updatedDescription,
      date: updatedDate,
      maxScore: updatedTotalMaxScore,
      maxScoreBreakdown: updatedMaxScores,
      nameLower: updatedName.toLowerCase(),
    };

    uiManager.showLoading('আপডেট হচ্ছে...');
    try {
      await dataService.updateTask(taskId, updatedData);
      await app.refreshAllData();
      uiManager.hideModal(uiManager.elements.editModal);
      uiManager.showToast('টাস্ক আপডেট হয়েছে।', 'success');
    } catch (error) {
      uiManager.showToast(`আপডেট ত্রুটি: ${error.message}`, 'error');
    } finally {
      uiManager.hideLoading();
    }
  });

  // Add listeners to update total score in modal
  const modalContent = uiManager.elements.editModalContent;
  if (modalContent) {
    modalContent.querySelectorAll('.breakdown-input').forEach((input) => {
      input.oninput = () => _updateTotalMaxScoreDisplay('edit');
    });
    _updateTotalMaxScoreDisplay('edit'); // Initial total calc
  }
}

/** Handles task deletion */
async function _handleDeleteTask(taskId) {
  const task = stateManager.get('tasks').find((t) => t.id === taskId);
  if (!task) {
    uiManager.showToast('টাস্কটি পাওয়া যায়নি।', 'error');
    return;
  }
  const evaluationsForTask = stateManager.get('evaluations').filter((e) => e.taskId === taskId);
  let message = `"${task.name}" টাস্ক ডিলিট করতে চান?`;
  if (evaluationsForTask.length > 0)
    message += `\n\n(এর সাথে ${helpers.convertToBanglaNumber(evaluationsForTask.length)} টি মূল্যায়ন ডিলিট হবে!)`;

  uiManager.showDeleteModal('টাস্ক ডিলিট', message, async () => {
    uiManager.showLoading('ডিলিট হচ্ছে...');
    try {
      if (evaluationsForTask.length > 0 && dataService.batchDeleteEvaluations) {
        await dataService.batchDeleteEvaluations(evaluationsForTask.map((e) => e.id));
      } else if (evaluationsForTask.length > 0) {
        // Fallback
        for (const evaluation of evaluationsForTask) await dataService.deleteEvaluation(evaluation.id);
      }
      await dataService.deleteTask(taskId);
      await app.refreshAllData();
      uiManager.showToast('টাস্ক ডিলিট হয়েছে।', 'success');
    } catch (error) {
      uiManager.showToast(`ডিলিট ত্রুটি: ${error.message}`, 'error');
    } finally {
      uiManager.hideLoading();
    }
  });
}

/** Populates select dropdowns with task options */
function populateTaskSelects(selectElementIds, defaultOptionText = 'টাস্ক নির্বাচন করুন') {
  const tasks = stateManager.get('tasks');
  if (!tasks) {
    console.warn('populateTaskSelects: Tasks not loaded yet.');
    return;
  }

  const options = tasks
    .map((t) => ({
      value: t.id,
      text: `${helpers.ensureBengaliText(t.name)} (${helpers.formatTimestamp(t.date) || 'N/A'})`,
      date: _getComparableDateString(t.date), // Add date string for sorting
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date string descending

  selectElementIds.forEach((id) => {
    const selectElement = document.getElementById(id);
    if (selectElement) {
      uiManager.populateSelect(selectElement, options, defaultOptionText);
      if (selectElement.options[0] && selectElement.options[0].value === '') {
        selectElement.options[0].disabled = true;
      }
    } else {
      console.warn(`populateTaskSelects: Element #${id} not found.`);
    }
  });
}
