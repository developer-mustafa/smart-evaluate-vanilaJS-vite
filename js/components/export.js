// js/components/export.js

// Dependencies
let stateManager, uiManager, dataService, helpers, app;

// DOM Elements
const elements = {};

/**
 * Initializes the Export component.
 * @param {object} dependencies - Passed from app.js.
 * @returns {object} - Public methods.
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  dataService = dependencies.services.dataService;
  helpers = dependencies.utils;
  app = dependencies.app;
  // analysisComponent is app.components.analysis (accessed via 'app')

  _cacheDOMElements();
  _setupEventListeners(); // Setup JS-based event listeners

  console.log('✅ Export component initialized.');

  return {
    render,
  };
}

/**
 * Renders the Export page (#page-export).
 * This function primarily updates the statistics on the page.
 */
export function render() {
  if (!elements.page) {
    console.error('❌ Export render failed: Page element #page-export not found.');
    return;
  }
  console.log('Rendering Export page...');
  _updateStats();
}

/**
 * Caches DOM elements for the Export page.
 * @private
 */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-export');
  if (elements.page) {
    // Cache buttons by unique IDs (assuming you add them) or by querying
    // We query based on the 'onclick' attribute as a fallback selector
    elements.exportStudentsCSVBtn = elements.page.querySelector('button[onclick*="exportStudentsCSV"]');
    elements.exportGroupsCSVBtn = elements.page.querySelector('button[onclick*="exportGroupsCSV"]');
    elements.exportEvaluationsCSVBtn = elements.page.querySelector('button[onclick*="exportEvaluationsCSV"]');
    elements.exportAllDataJSONBtn = elements.page.querySelector('button[onclick*="exportAllData"]');
    elements.exportAllDataZipBtn = elements.page.querySelector('button[onclick*="exportAllDataAsZip"]');
    elements.exportAnalysisPDFBtn = elements.page.querySelector('button[onclick*="exportAnalysisPDF"]');
    elements.exportGroupAnalysisPDFBtn = elements.page.querySelector('button[onclick*="exportGroupAnalysisPDF"]');
    elements.printReportBtn = elements.page.querySelector('button[onclick*="printGroupAnalysis"]');

    // Statistics Cards
    elements.totalStudentsCount = elements.page.querySelector('#totalStudentsCount');
    elements.totalGroupsCount = elements.page.querySelector('#totalGroupsCount');
    elements.totalEvaluationsCount = elements.page.querySelector('#totalEvaluationsCount');
    elements.lastExportTime = elements.page.querySelector('#lastExportTime');

    // Remove onclick attributes to prevent double triggers
    _removeOnclickAttributes();
  } else {
    console.error('❌ Export init failed: #page-export element not found!');
  }
}

/**
 * Removes inline 'onclick' attributes from cached buttons
 * to rely solely on JavaScript event listeners.
 * @private
 */
function _removeOnclickAttributes() {
  const buttons = [
    elements.exportStudentsCSVBtn,
    elements.exportGroupsCSVBtn,
    elements.exportEvaluationsCSVBtn,
    elements.exportAllDataJSONBtn,
    elements.exportAllDataZipBtn,
    elements.exportAnalysisPDFBtn,
    elements.exportGroupAnalysisPDFBtn,
    elements.printReportBtn,
  ];
  buttons.forEach((btn) => {
    if (btn && btn.hasAttribute('onclick')) {
      // console.log(`Removing onclick from: ${btn.textContent.trim()}`);
      btn.removeAttribute('onclick');
    }
  });
}

/**
 * Sets up event listeners for all export buttons.
 * @private
 */
function _setupEventListeners() {
  if (!elements.page) return;

  // CSV Exports
  uiManager.addListener(elements.exportStudentsCSVBtn, 'click', _handleExportStudentsCSV);
  uiManager.addListener(elements.exportGroupsCSVBtn, 'click', _handleExportGroupsCSV);
  uiManager.addListener(elements.exportEvaluationsCSVBtn, 'click', _handleExportEvaluationsCSV);

  // Advanced Exports
  uiManager.addListener(elements.exportAllDataJSONBtn, 'click', _handleExportAllDataJSON);
  uiManager.addListener(elements.exportAllDataZipBtn, 'click', _handleExportAllDataZip);

  // PDF/Print Exports (call functions from analysis component via 'app')
  uiManager.addListener(elements.exportAnalysisPDFBtn, 'click', () => {
    uiManager.showToast('এই রিপোর্টটি "ফলাফল সামারি" পেজ থেকে জেনারেট করুন।', 'info');
    // Or, if a generic PDF is desired:
    // if (app.components.analysis?.generateGroupAnalysisPDF) app.components.analysis.generateGroupAnalysisPDF();
  });
  uiManager.addListener(elements.exportGroupAnalysisPDFBtn, 'click', () => {
    if (app.components.analysis?.generateGroupAnalysisPDF) {
      // This function from analysis.js generates for 'all' or 'selected'
      // We'll trigger 'all' by default from here.
      app.components.analysis.generateGroupAnalysisPDF();
    } else {
      uiManager.showToast('PDF জেনারেটর প্রস্তুত নয়।', 'error');
    }
  });
  uiManager.addListener(elements.printReportBtn, 'click', () => {
    if (app.components.analysis?.printGroupAnalysis) {
      uiManager.showToast('প্রিন্ট প্রিভিউয়ের জন্য "ফলাফল সামারি" পেজে যান।', 'info');
      // Or trigger print on current page? (Not useful)
      // app.components.analysis.printGroupAnalysis();
    } else {
      uiManager.showToast('প্রিন্ট ফাংশন প্রস্তুত নয়।', 'error');
    }
  });
}

/**
 * Updates the statistics cards on the export page.
 * @private
 */
function _updateStats() {
  const { students, groups, evaluations } = stateManager.getState();
  const setText = (el, val) => {
    if (el) el.textContent = helpers.convertToBanglaNumber(val);
  };

  setText(elements.totalStudentsCount, students?.length || 0);
  setText(elements.totalGroupsCount, groups?.length || 0);
  setText(elements.totalEvaluationsCount, evaluations?.length || 0);

  const lastExport = localStorage.getItem('lastExportTimestamp');
  if (elements.lastExportTime) {
    elements.lastExportTime.textContent = lastExport
      ? new Date(lastExport).toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' })
      : '-';
  }
}

// --- Export Handlers ---

/**
 * Exports students data as CSV.
 * @private
 */
async function _handleExportStudentsCSV() {
  uiManager.showLoading('শিক্ষার্থী CSV এক্সপোর্ট হচ্ছে...');
  try {
    const students = stateManager.get('students') || [];
    const groupsMap = new Map(stateManager.get('groups').map((g) => [g.id, g.name]));

    const dataToExport = students
      .map((s) => ({
        নাম: s.name,
        রোল: s.roll,
        লিঙ্গ: s.gender,
        'একাডেমিক গ্রুপ': s.academicGroup,
        সেশন: s.session,
        যোগাযোগ: s.contact || '',
        'গ্রুপের নাম': groupsMap.get(s.groupId) || '',
        'দায়িত্ব কোড': s.role || '',
      }))
      .sort((a, b) => (a['নাম'] || '').localeCompare(b['নাম'] || '', 'bn'));

    if (dataToExport.length === 0) {
      uiManager.showToast('এক্সপোর্ট করার মতো শিক্ষার্থীর ডেটা নেই।', 'info');
      return;
    }

    const csv = Papa.unparse(dataToExport, { header: true });
    _triggerDownload(csv, 'students_export.csv', 'text/csv;charset=utf-8;');
    uiManager.showToast('শিক্ষার্থী CSV ফাইল ডাউনলোড শুরু হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error exporting students CSV:', error);
    uiManager.showToast(`CSV এক্সপোর্ট করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
    _updateLastExportTime();
  }
}

/**
 * Exports groups data as CSV.
 * @private
 */
async function _handleExportGroupsCSV() {
  uiManager.showLoading('গ্রুপ CSV এক্সপোর্ট হচ্ছে...');
  try {
    const groups = stateManager.get('groups') || [];
    const students = stateManager.get('students') || [];

    const dataToExport = groups
      .map((g) => ({
        'গ্রুপের নাম': g.name,
        'শিক্ষার্থী সংখ্যা': students.filter((s) => s.groupId === g.id).length,
      }))
      .sort((a, b) => (a['গ্রুপের নাম'] || '').localeCompare(b['গ্রুপের নাম'] || '', 'bn'));

    if (dataToExport.length === 0) {
      uiManager.showToast('এক্সপোর্ট করার মতো গ্রুপের ডেটা নেই।', 'info');
      return;
    }

    const csv = Papa.unparse(dataToExport, { header: true });
    _triggerDownload(csv, 'groups_export.csv', 'text/csv;charset=utf-8;');
    uiManager.showToast('গ্রুপ CSV ফাইল ডাউনলোড শুরু হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error exporting groups CSV:', error);
    uiManager.showToast(`CSV এক্সপোর্ট করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
    _updateLastExportTime();
  }
}

/**
 * Exports detailed evaluations data as CSV.
 * @private
 */
async function _handleExportEvaluationsCSV() {
  uiManager.showLoading('মূল্যায়ন CSV এক্সপোর্ট হচ্ছে...');
  try {
    const evaluations = stateManager.get('evaluations') || [];
    const studentsMap = new Map(stateManager.get('students').map((s) => [s.id, s]));
    const tasksMap = new Map(stateManager.get('tasks').map((t) => [t.id, t]));
    const groupsMap = new Map(stateManager.get('groups').map((g) => [g.id, g.name]));

    const dataToExport = [];
    evaluations.forEach((ev) => {
      const task = tasksMap.get(ev.taskId);
      const groupName = groupsMap.get(ev.groupId) || ev.groupName;
      const taskName = task?.name || ev.taskName;
      const taskDate = task?.date || ev.taskDate || '';
      const maxScore = parseFloat(ev.maxPossibleScore) || parseFloat(task?.maxScore) || TOTAL_MAX_SCORE;

      if (ev.scores) {
        Object.entries(ev.scores).forEach(([studentId, scoreData]) => {
          const student = studentsMap.get(studentId);
          if (student) {
            dataToExport.push({
              'টাস্কের নাম': taskName,
              'টাস্কের তারিখ': taskDate,
              'গ্রুপের নাম': groupName,
              'শিক্ষার্থীর নাম': student.name,
              রোল: student.roll,
              'টাস্ক স্কোর': scoreData.taskScore ?? '',
              'টিম স্কোর': scoreData.teamScore ?? '',
              'MCQ স্কোর': scoreData.mcqScore ?? '',
              'অতিরিক্ত স্কোর': scoreData.additionalScore ?? '',
              'মোট স্কোর': scoreData.totalScore ?? '',
              'সর্বোচ্চ স্কোর': maxScore,
              মন্তব্য: scoreData.comments || '',
            });
          }
        });
      }
    });

    dataToExport.sort(
      (a, b) =>
        (b['টাস্কের তারিখ'] || '').localeCompare(a['টাস্কের তারিখ'] || '') ||
        (a['গ্রুপের নাম'] || '').localeCompare(b['গ্রুপের নাম'] || '', 'bn') ||
        String(a['রোল'] || '').localeCompare(String(b['রোল'] || ''), undefined, { numeric: true })
    );

    if (dataToExport.length === 0) {
      uiManager.showToast('এক্সপোর্ট করার মতো মূল্যায়ন ডেটা নেই।', 'info');
      return;
    }

    const csv = Papa.unparse(dataToExport, { header: true });
    _triggerDownload(csv, 'evaluations_export.csv', 'text/csv;charset=utf-8;');
    uiManager.showToast('মূল্যায়ন CSV ফাইল ডাউনলোড শুরু হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error exporting evaluations CSV:', error);
    uiManager.showToast(`CSV এক্সপোর্ট করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
    _updateLastExportTime();
  }
}

/**
 * Exports all core data as a single JSON file.
 * @private
 */
function _handleExportAllDataJSON() {
  uiManager.showLoading('JSON ফাইল তৈরি হচ্ছে...');
  try {
    const { groups, students, tasks, evaluations, admins } = stateManager.getState();
    const allData = {
      exportDate: new Date().toISOString(),
      groups,
      students,
      tasks,
      evaluations,
      // Conditionally add admins if current user is super-admin
      admins: stateManager.get('currentUserData')?.type === 'super-admin' ? admins : undefined,
    };

    const jsonString = JSON.stringify(allData, null, 2); // Pretty print
    _triggerDownload(jsonString, 'smart_evaluator_backup.json', 'application/json;charset=utf-8;');
    uiManager.showToast('সমস্ত ডেটার JSON ফাইল ডাউনলোড শুরু হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error exporting all data JSON:', error);
    uiManager.showToast(`JSON এক্সপোর্ট করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
    _updateLastExportTime();
  }
}

/**
 * Exports all data as separate CSVs within a single ZIP file.
 * @private
 */
async function _handleExportAllDataZip() {
  const JSZip = window.JSZip; // Get from global scope
  if (!JSZip) {
    uiManager.showToast('ZIP লাইব্রেরি (JSZip) লোড করা নেই।', 'error');
    console.error('JSZip library not found. Please include it in index.html');
    return;
  }

  uiManager.showLoading('ZIP ফাইল তৈরি হচ্ছে...');
  try {
    const zip = new JSZip();
    const { groups, students, tasks, evaluations } = stateManager.getState();
    const bom = '\uFEFF'; // BOM for Excel Bengali support

    // 1. Students CSV
    const groupsMap = new Map(groups.map((g) => [g.id, g.name]));
    const studentsData = students
      .map((s) => ({
        নাম: s.name,
        রোল: s.roll,
        লিঙ্গ: s.gender,
        'একাডেমিক গ্রুপ': s.academicGroup,
        সেশন: s.session,
        যোগাযোগ: s.contact || '',
        'গ্রুপের নাম': groupsMap.get(s.groupId) || '',
        'দায়িত্ব কোড': s.role || '',
      }))
      .sort((a, b) => a['নাম'].localeCompare(b['নাম'], 'bn'));
    if (studentsData.length > 0) zip.file('students.csv', bom + Papa.unparse(studentsData));

    // 2. Groups CSV
    const groupsData = groups
      .map((g) => ({ 'গ্রুপের নাম': g.name, 'শিক্ষার্থী সংখ্যা': students.filter((s) => s.groupId === g.id).length }))
      .sort((a, b) => a['গ্রুপের নাম'].localeCompare(b['গ্রুপের নাম'], 'bn'));
    if (groupsData.length > 0) zip.file('groups.csv', bom + Papa.unparse(groupsData));

    // 3. Tasks CSV
    const tasksData = tasks
      .map((t) => ({
        'টাস্কের নাম': t.name,
        'মোট সর্বোচ্চ স্কোর': t.maxScore,
        ব্রেকডাউন_টাস্ক: t.maxScoreBreakdown?.task,
        ব্রেকডাউন_টিম: t.maxScoreBreakdown?.team,
        ব্রেকডাউন_অতিরিক্ত: t.maxScoreBreakdown?.additional,
        ব্রেকডাউন_MCQ: t.maxScoreBreakdown?.mcq,
        বিবরণ: t.description || '',
        তারিখ: t.date,
      }))
      .sort((a, b) => (b['তারিখ'] || '').localeCompare(a['তারিখ'] || ''));
    if (tasksData.length > 0) zip.file('tasks.csv', bom + Papa.unparse(tasksData));

    // 4. Evaluations CSV (Detailed)
    // (This logic is identical to _handleExportEvaluationsCSV, can be refactored)
    const studentsMap = new Map(students.map((s) => [s.id, s]));
    const tasksMap = new Map(tasks.map((t) => [t.id, t]));
    const evaluationsData = [];
    evaluations.forEach((ev) => {
      const task = tasksMap.get(ev.taskId);
      const groupName = groupsMap.get(ev.groupId) || ev.groupName;
      const taskName = task?.name || ev.taskName;
      const taskDate = task?.date || ev.taskDate || '';
      const maxScore = parseFloat(ev.maxPossibleScore) || parseFloat(task?.maxScore) || TOTAL_MAX_SCORE;
      if (ev.scores) {
        Object.entries(ev.scores).forEach(([studentId, scoreData]) => {
          const student = studentsMap.get(studentId);
          if (student)
            evaluationsData.push({
              'টাস্কের নাম': taskName,
              'টাস্কের তারিখ': taskDate,
              'গ্রুপের নাম': groupName,
              'শিক্ষার্থীর নাম': student.name,
              রোল: student.roll,
              'টাস্ক স্কোর': scoreData.taskScore ?? '',
              'টিম স্কোর': scoreData.teamScore ?? '',
              'MCQ স্কোর': scoreData.mcqScore ?? '',
              'অতিরিক্ত স্কোর': scoreData.additionalScore ?? '',
              'মোট স্কোর': scoreData.totalScore ?? '',
              'সর্বোচ্চ স্কোর': maxScore,
              মন্তব্য: scoreData.comments || '',
            });
        });
      }
    });
    if (evaluationsData.length > 0) {
      evaluationsData.sort(
        (a, b) =>
          (b['টাস্কের তারিখ'] || '').localeCompare(a['টাস্কের তারিখ'] || '') ||
          (a['গ্রুপের নাম'] || '').localeCompare(b['গ্রুপের নাম'] || '', 'bn') ||
          String(a['রোল'] || '').localeCompare(String(b['রোল'] || ''), undefined, { numeric: true })
      );
      zip.file('evaluations_detailed.csv', bom + Papa.unparse(evaluationsData));
    }

    // Generate ZIP blob
    const content = await zip.generateAsync({ type: 'blob' });
    _triggerDownload(content, `smart_evaluator_backup_${new Date().toISOString().split('T')[0]}.zip`);
    uiManager.showToast('সমস্ত ডেটার ZIP ফাইল ডাউনলোড শুরু হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error exporting all data ZIP:', error);
    uiManager.showToast(`ZIP এক্সপোর্ট করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
    _updateLastExportTime();
  }
}

// --- Helper Functions ---

/**
 * Creates and clicks a download link for a blob.
 * @param {Blob} blob - The file content blob.
 * @param {string} fileName - The desired file name.
 * @param {string} [contentType] - The MIME type (only used for CSV BOM check here).
 * @private
 */
function _triggerDownload(content, fileName, contentType = '') {
  // Add BOM for Excel UTF-8 support ONLY for CSV string content
  const finalContent = contentType.startsWith('text/csv') && typeof content === 'string' ? `\uFEFF${content}` : content;
  const blob = finalContent instanceof Blob ? finalContent : new Blob([finalContent], { type: contentType });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Updates the 'Last Export' time display and stores it.
 * @private
 */
function _updateLastExportTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
  if (elements.lastExportTime) {
    elements.lastExportTime.textContent = timeString;
  }
  localStorage.setItem('lastExportTimestamp', now.toISOString());
}
