// js/components/analysis.js
// Dependencies
let stateManager, uiManager, dataService, helpers, app;

// Chart.js instances (to destroy before re-rendering)
let groupPerformanceChart = null;
let scoreDistributionChart = null;
let studentProgressChart = null;

// DOM Elements
const elements = {
  summaryPage: null,
  analysisGroupSelect: null,
  groupAnalysisDetailsContainer: null,
  graphPage: null,
  graphAnalysisContentContainer: null,
  // Graph filter elements will be cached in _setupGraphPageUI
};

// --- PDF FONT CONFIGURATION ---
// TODO: You MUST provide the Base64 string for the Bengali font here.
// 1. Get SolaimanLipi.ttf (or another Bengali TTF font).
// 2. Convert it to Base64 using an online tool.
// 3. Paste the entire Base64 string here.
const solaimanLipiBase64 = ''; // <-- PASTE BASE64 FONT STRING HERE
// Example: const solaimanLipiBase64 = 'AAEAAAARAQAABAA...';

/**
 * Initializes the Analysis component.
 * @param {object} dependencies - Passed from app.js.
 * @returns {object} - Public methods.
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  dataService = dependencies.services.dataService;
  helpers = dependencies.utils;
  app = dependencies.app;
  // Note: groupsComponent is accessed via app.components.groups

  _cacheDOMElements();
  _setupEventListeners();
  _configureJsPDF(); // Setup Bengali font for PDF

  console.log('✅ Analysis component initialized.');

  // Expose PDF generation functions to the global 'smartEvaluator' object
  // This allows onclick attributes in index.html to work.
  if (!window.smartEvaluator) window.smartEvaluator = {};
  window.smartEvaluator.generateGroupAnalysisPDF = generateGroupAnalysisPDF;
  window.smartEvaluator.generateSelectedGroupPDF = generateSelectedGroupPDF;
  window.smartEvaluator.printGroupAnalysis = printGroupAnalysis;

  return {
    renderSummary,
    renderGraphs,
    generateGroupAnalysisPDF,
    generateSelectedGroupPDF,
    printGroupAnalysis,
  };
}

/**
 * Caches the main page elements.
 * @private
 */
function _cacheDOMElements() {
  elements.summaryPage = document.getElementById('page-group-analysis');
  if (elements.summaryPage) {
    elements.analysisGroupSelect = elements.summaryPage.querySelector('#analysisGroupSelect');
    elements.groupAnalysisDetailsContainer = elements.summaryPage.querySelector('#groupAnalysisDetails');
  } else {
    console.warn('Analysis: #page-group-analysis element not found!');
  }

  elements.graphPage = document.getElementById('page-graph-analysis');
  if (elements.graphPage) {
    elements.graphAnalysisContentContainer = elements.graphPage.querySelector('#graphAnalysisContent');
  } else {
    console.warn('Analysis: #page-graph-analysis element not found!');
  }
}

/**
 * Sets up event listeners for filters.
 * @private
 */
function _setupEventListeners() {
  // Group Analysis Summary Page
  uiManager.addListener(elements.analysisGroupSelect, 'change', _renderGroupSummary);

  // Event delegation for Graph Analysis Page (container setup in renderGraphs)
  uiManager.addListener(elements.graphAnalysisContentContainer, 'change', (e) => {
    if (e.target && e.target.classList.contains('graph-filter')) {
      _handleGraphFilterChange();
    }
  });
  uiManager.addListener(elements.graphAnalysisContentContainer, 'input', (e) => {
    if (e.target && e.target.id === 'graphStudentSearch') {
      // Debounce search input
      helpers.createDebouncer(300)(_handleGraphFilterChange);
    }
  });
}

/**
 * Configures jsPDF with Bengali font if Base64 string is provided.
 * @private
 */
function _configureJsPDF() {
  if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
    console.error('❌ jsPDF library is not loaded! PDF export will fail.');
    return;
  }
  if (typeof jspdf.jsPDF.API.autoTable === 'undefined') {
    console.error('❌ jsPDF-AutoTable plugin is not loaded! PDF tables will fail.');
  }

  if (solaimanLipiBase64) {
    try {
      const { jsPDF } = jspdf;
      jsPDF.API.addFileToVFS('SolaimanLipi-normal.ttf', solaimanLipiBase64);
      jsPDF.API.addFont('SolaimanLipi-normal.ttf', 'SolaimanLipi', 'normal');
      console.log('✅ SolaimanLipi font added to jsPDF.');
    } catch (e) {
      console.error('❌ Failed to add SolaimanLipi font to jsPDF:', e);
      uiManager.showToast('PDF-এর জন্য বাংলা ফন্ট লোড করা যায়নি।', 'warning');
    }
  } else {
    console.warn('Analysis: SolaimanLipi Base64 string is missing. Bengali text in PDF might not render correctly.');
    uiManager.showToast('PDF বাংলা ফন্ট অনুপস্থিত।', 'warning', 5000);
  }
}

// --- 1. Group Analysis Summary Page Logic ---

/**
 * Renders the Summary page (#page-group-analysis).
 */
export function renderSummary() {
  if (!elements.summaryPage) {
    console.error('❌ Analysis renderSummary failed: Page element not found.');
    return;
  }
  console.log('Rendering Group Analysis (Summary) page...');
  _populateGroupSelectFilter();
  _renderGroupSummary(); // Render with default filter ('all')
}

/**
 * Populates the group select filter on the Summary page.
 * @private
 */
function _populateGroupSelectFilter() {
  if (!elements.analysisGroupSelect) return;
  if (app.components.groups?.populateGroupSelects) {
    // Use 'all' as the value for "All Groups"
    app.components.groups.populateGroupSelects(['analysisGroupSelect'], 'সকল গ্রুপ');
  } else {
    console.warn('Analysis: Groups component not ready to populate filter.');
  }
}

/**
 * Renders the group summary table based on the selected filter.
 * @private
 */
function _renderGroupSummary() {
  if (!elements.groupAnalysisDetailsContainer) return;

  uiManager.showLoading('বিশ্লেষণ লোড হচ্ছে...');
  const selectedGroupId = elements.analysisGroupSelect?.value || 'all';
  const { students, evaluations, tasks, groups } = stateManager.getState();

  try {
    const groupPerformanceData = _getAggregatedPerformanceData(groups, students, evaluations, tasks);
    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    const targetGroups =
      selectedGroupId === 'all'
        ? groupPerformanceData // Already sorted by score
        : groupPerformanceData.filter((gp) => gp.groupId === selectedGroupId);

    if (targetGroups.length === 0) {
      uiManager.displayEmptyMessage(
        elements.groupAnalysisDetailsContainer,
        'নির্বাচিত গ্রুপের জন্য কোনো মূল্যায়ন ডেটা পাওয়া যায়নি।'
      );
      uiManager.hideLoading();
      return;
    }

    const tableHtml = _buildSummaryTableHtml(targetGroups, groupMap, selectedGroupId);
    elements.groupAnalysisDetailsContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error('❌ Error rendering group summary:', error);
    uiManager.displayEmptyMessage(
      elements.groupAnalysisDetailsContainer,
      `সামারি রেন্ডার করতে ত্রুটি: ${error.message}`
    );
  } finally {
    uiManager.hideLoading();
  }
}

/**
 * Builds the HTML string for the summary table.
 * @private
 */
function _buildSummaryTableHtml(targetGroups, groupMap, selectedGroupId) {
  let html = `
        <div id="printableAnalysisArea" class="printable-content mt-4 space-y-4">
        <h3 class="text-xl font-bold text-center mb-4">${
          selectedGroupId === 'all'
            ? 'সকল গ্রুপের মূল্যায়ন সামারি'
            : `গ্রুপ: ${groupMap.get(selectedGroupId) || 'N/A'} - মূল্যায়ন সামারি`
        }</h3>
        <div class="overflow-x-auto card">
            <table class="w-full min-w-[800px] border-collapse">
                <thead>
                    <tr class="bg-gray-100 dark:bg-gray-700">
                        <th class="th">গ্রুপ</th>
                        <th class="th text-center">শিক্ষার্থী</th>
                        <th class="th text-center">মূল্যায়ন সংখ্যা</th>
                        <th class="th text-center">গড় স্কোর (%)</th>
                        <th class="th text-center">সর্বোচ্চ ছাত্র স্কোর (%)</th>
                        <th class="th text-center"> সর্বনিম্ন ছাত্র স্কোর (%)</th>
                        <th class="th">পারফরম্যান্স</th>
                    </tr>
                </thead>
                <tbody>
    `;

  targetGroups.forEach((gp) => {
    const groupName = groupMap.get(gp.groupId) || 'N/A';
    const studentCount = helpers.convertToBanglaNumber(gp.studentCount);
    const evalCount = helpers.convertToBanglaNumber(gp.evalCount);
    const avgScore = helpers.convertToBanglaNumber(gp.averageScore.toFixed(2));
    const maxScore = helpers.convertToBanglaNumber(gp.maxStudentScore.toFixed(2));
    const minScore = helpers.convertToBanglaNumber(gp.minStudentScore.toFixed(2));
    const performanceLevel = helpers.getStudentPerformanceLevel(gp.averageScore);
    const scoreColor = helpers.getPerformanceColorClass(gp.averageScore);

    html += `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="td p-3 font-medium">${helpers.ensureBengaliText(groupName)}</td>
                <td class="td p-3 text-center">${studentCount}</td>
                <td class="td p-3 text-center">${evalCount}</td>
                <td class="td p-3 text-center font-semibold ${scoreColor}">${avgScore}</td>
                <td class="td p-3 text-center">${maxScore}</td>
                <td class="td p-3 text-center">${minScore}</td>
                <td class="td p-3">${performanceLevel}</td>
            </tr>
        `;
  });

  html += `</tbody></table></div></div>`;
  return html;
}

/**
 * Calculates detailed group performance data (avg, max, min student scores).
 * @private
 */
function _getAggregatedPerformanceData(groups, students, evaluations, tasks) {
  if (!groups || !students || !evaluations || !tasks) return [];

  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const groupData = {}; // { groupId: { scoreSum: 0, count: 0, studentScores: {sid: {totalP:0, c:0}}, studentCount: 0 } }

  groups.forEach((g) => {
    groupData[g.id] = {
      groupTotalPercentage: 0, // Sum of *group average percentages* from each eval
      evalCount: 0, // Number of evaluations this group participated in
      studentScoresMap: {}, // { studentId: { totalPercentage: 0, count: 0 } }
      studentCount: students.filter((s) => s.groupId === g.id).length,
    };
  });

  evaluations.forEach((ev) => {
    const groupId = ev.groupId;
    if (!groupData[groupId] || !ev.scores) return;

    // 1. Accumulate group average percentage
    const groupAvgPercent = parseFloat(ev.groupAverageScore);
    if (!isNaN(groupAvgPercent)) {
      groupData[groupId].groupTotalPercentage += groupAvgPercent;
      groupData[groupId].evalCount++;
    }

    // 2. Accumulate individual student scores (for min/max calculation)
    const task = taskMap.get(ev.taskId);
    const maxScore = parseFloat(ev.maxPossibleScore) || parseFloat(task?.maxScore) || TOTAL_MAX_SCORE;
    if (maxScore <= 0) return; // Skip if max score is invalid

    Object.entries(ev.scores).forEach(([studentId, scoreData]) => {
      // Ensure this student belongs to *this* group (in case of data inconsistency)
      if (groupData[groupId].studentScoresMap[studentId] === undefined) {
        const student = students.find((s) => s.id === studentId);
        if (student?.groupId === groupId) {
          groupData[groupId].studentScoresMap[studentId] = { totalPercentage: 0, count: 0 };
        } else {
          return; // Skip student not in this group
        }
      }

      const totalScore = parseFloat(scoreData.totalScore) || 0;
      const percentage = (totalScore / maxScore) * 100;
      groupData[groupId].studentScoresMap[studentId].totalPercentage += percentage;
      groupData[groupId].studentScoresMap[studentId].count++;
    });
  });

  // Process results
  return Object.entries(groupData)
    .map(([groupId, data]) => {
      // Calculate average score for each student *within this group*
      const studentAverages = Object.values(data.studentScoresMap)
        .filter((sd) => sd.count > 0)
        .map((sd) => sd.totalPercentage / sd.count);

      // Final group average is the average of its evaluation average scores
      const groupAverageScore = data.evalCount > 0 ? data.groupTotalPercentage / data.evalCount : 0;

      return {
        groupId,
        studentCount: data.studentCount,
        evalCount: data.evalCount,
        averageScore: groupAverageScore, // Group's overall average %
        maxStudentScore: studentAverages.length > 0 ? Math.max(...studentAverages) : 0, // Max avg % among students
        minStudentScore: studentAverages.length > 0 ? Math.min(...studentAverages) : 0, // Min avg % among students
      };
    })
    .filter((gp) => gp.evalCount > 0) // Only show groups with evaluations
    .sort((a, b) => b.averageScore - a.averageScore); // Sort by score
}

// --- 2. Graph Analysis Page Logic ---

/**
 * Renders the Graph Analysis page (#page-graph-analysis).
 */
export function renderGraphs() {
  if (!elements.graphPage) {
    console.error('❌ Analysis renderGraphs failed: Page element not found.');
    return;
  }
  console.log('Rendering Graph Analysis page...');
  _setupGraphPageUI(); // Build/Update filters and chart canvases
  _handleGraphFilterChange(); // Trigger initial chart render
}

/**
 * Builds the dynamic UI for the graph page (filters, canvases).
 * @private
 */
function _setupGraphPageUI() {
  if (!elements.graphAnalysisContentContainer) return;

  // Only build HTML if it hasn't been built yet
  if (elements.graphAnalysisContentContainer.children.length === 0) {
    let filterHtml = `
            <div class="card card-body mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">এডভান্স ফিল্টার</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label for="graphGroupFilter" class="label">গ্রুপ:</label>
                        <select id="graphGroupFilter" class="form-select graph-filter"><option value="all">সকল গ্রুপ</option></select>
                    </div>
                    <div>
                        <label for="graphStartDate" class="label">শুরুর তারিখ:</label>
                        <input type="date" id="graphStartDate" class="form-input graph-filter">
                    </div>
                    <div>
                        <label for="graphEndDate" class="label">শেষের তারিখ:</label>
                        <input type="date" id="graphEndDate" class="form-input graph-filter">
                    </div>
                     <div>
                        <label for="graphStudentSearch" class="label">শিক্ষার্থী খুঁজুন (নাম/রোল):</label>
                        <input type="search" id="graphStudentSearch" placeholder="খুঁজুন..." class="form-input graph-filter">
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div class="card">
                      <div class="card-header">গ্রুপ পারফরম্যান্স (সময়ের সাথে)</div>
                      <div class="card-body"><canvas id="groupPerformanceChart"></canvas></div>
                 </div>
                 <div class="card">
                      <div class="card-header">স্কোর ডিস্ট্রিবিউশন</div>
                      <div class="card-body"><canvas id="scoreDistributionChart"></canvas></div>
                 </div>
                 <div class="card lg:col-span-2">
                      <div class="card-header">শিক্ষার্থীর অগ্রগতি (সার্চ করুন)</div>
                      <div class="card-body">
                          <canvas id="studentProgressChart"></canvas>
                          <p id="studentChartMsg" class="text-center text-gray-500 mt-4"></p>
                      </div>
                 </div>
            </div>
         `;
    elements.graphAnalysisContentContainer.innerHTML = filterHtml;

    // Cache the newly created filter elements
    elements.graphGroupFilter = elements.graphAnalysisContentContainer.querySelector('#graphGroupFilter');
    elements.graphStartDateFilter = elements.graphAnalysisContentContainer.querySelector('#graphStartDate');
    elements.graphEndDateFilter = elements.graphAnalysisContentContainer.querySelector('#graphEndDate');
    elements.graphStudentSearchFilter = elements.graphAnalysisContentContainer.querySelector('#graphStudentSearch');
  }

  // Always populate filters
  if (app.components.groups?.populateGroupSelects) {
    app.components.groups.populateGroupSelects(['graphGroupFilter'], 'সকল গ্রুপ');
  }

  // Set filter inputs to match current state
  const currentFilters = stateManager.getFilterSection('graphAnalysis');
  if (elements.graphGroupFilter) elements.graphGroupFilter.value = currentFilters.groupFilter || 'all';
  if (elements.graphStartDateFilter) elements.graphStartDateFilter.value = currentFilters.startDate || '';
  if (elements.graphEndDateFilter) elements.graphEndDateFilter.value = currentFilters.endDate || '';
  if (elements.graphStudentSearchFilter) elements.graphStudentSearchFilter.value = currentFilters.studentSearch || '';
}

/**
 * Handles changes in graph filters and triggers chart re-render.
 * @private
 */
function _handleGraphFilterChange() {
  // Update state manager with new filter values
  stateManager.updateFilters('graphAnalysis', {
    groupFilter: elements.graphGroupFilter?.value || 'all',
    startDate: elements.graphStartDateFilter?.value || '',
    endDate: elements.graphEndDateFilter?.value || '',
    studentSearch: elements.graphStudentSearchFilter?.value || '',
  });
  _renderCharts(); // Re-render charts
}

/**
 * Renders all charts based on current filters.
 * @private
 */
function _renderCharts() {
  if (!elements.graphPage) return;

  const { evaluations, students, groups, tasks } = stateManager.getState();
  const filters = stateManager.getFilterSection('graphAnalysis');

  const filteredEvaluations = evaluations
    .filter((ev) => {
      // Use taskDate (YYYY-MM-DD string) for comparison
      const taskDate = ev.taskDate ? _getComparableDateString(ev.taskDate) : null;
      if (!taskDate) return false; // Skip evals without a valid task date

      const matchesGroup = filters.groupFilter === 'all' || ev.groupId === filters.groupFilter;
      const matchesStartDate = !filters.startDate || taskDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || taskDate <= filters.endDate;
      return matchesGroup && matchesStartDate && matchesEndDate;
    })
    .sort((a, b) => a.taskDate.localeCompare(b.taskDate)); // Sort by date ascending

  _renderGroupPerformanceChart(filteredEvaluations, groups);
  _renderScoreDistributionChart(filteredEvaluations, students, tasks);
  _renderStudentProgressChart(filteredEvaluations, students, tasks, filters.studentSearch);
}

/**
 * Renders Group Performance (Time) line chart.
 * @private
 */
function _renderGroupPerformanceChart(filteredEvaluations, allGroups) {
  const ctx = document.getElementById('groupPerformanceChart')?.getContext('2d');
  if (!ctx) return;

  const groupData = {}; // { 'groupId': [{ x: date, y: score }, ...], ... }
  filteredEvaluations.forEach((ev) => {
    if (!groupData[ev.groupId]) groupData[ev.groupId] = [];
    if (ev.taskDate) {
      // YYYY-MM-DD string
      groupData[ev.groupId].push({
        x: ev.taskDate, // Use date string
        y: parseFloat(ev.groupAverageScore) || 0, // Use avg percentage
      });
    }
  });

  const datasets = Object.entries(groupData).map(([groupId, data]) => {
    const group = allGroups.find((g) => g.id === groupId);
    const color = _getRandomColor();
    return {
      label: group ? helpers.ensureBengaliText(group.name) : 'Unknown',
      data: data,
      borderColor: color,
      backgroundColor: color + '33',
      fill: false,
      tension: 0.1,
    };
  });

  if (groupPerformanceChart) groupPerformanceChart.destroy();

  if (datasets.length === 0) {
    _drawEmptyChartText(ctx, 'পারফরম্যান্স ডেটা নেই।');
    return;
  }

  groupPerformanceChart = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'PP', displayFormats: { day: 'MMM d' } },
          title: { display: true, text: 'তারিখ' },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'গড় স্কোর (%)' },
        },
      },
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        zoom: { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, mode: 'x' } },
      },
    },
  });
}

/**
 * Renders Score Distribution bar chart.
 * @private
 */
function _renderScoreDistributionChart(filteredEvaluations, allStudents, allTasks) {
  const ctx = document.getElementById('scoreDistributionChart')?.getContext('2d');
  if (!ctx) return;

  const taskMap = new Map(allTasks.map((task) => [task.id, task]));
  const studentScores = []; // All individual student scores (percentages)

  filteredEvaluations.forEach((ev) => {
    const maxScore = parseFloat(ev.maxPossibleScore) || parseFloat(taskMap.get(ev.taskId)?.maxScore) || TOTAL_MAX_SCORE;
    if (maxScore > 0 && ev.scores) {
      Object.values(ev.scores).forEach((scoreData) => {
        const totalScore = parseFloat(scoreData.totalScore) || 0;
        studentScores.push((totalScore / maxScore) * 100);
      });
    }
  });

  const scoreBins = [0, 0, 0, 0, 0]; // 0-19, 20-39, 40-59, 60-79, 80-100
  studentScores.forEach((score) => {
    if (score < 20) scoreBins[0]++;
    else if (score < 40) scoreBins[1]++;
    else if (score < 60) scoreBins[2]++;
    else if (score < 80) scoreBins[3]++;
    else scoreBins[4]++;
  });
  const labels = ['০-১৯', '২০-৩৯', '৪০-৫৯', '৬০-৭৯', '৮০-১০০'];

  if (scoreDistributionChart) scoreDistributionChart.destroy();
  if (studentScores.length === 0) {
    _drawEmptyChartText(ctx, 'স্কোর ডিস্ট্রিবিউশন ডেটা নেই।');
    return;
  }

  scoreDistributionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map((l) => helpers.convertToBanglaNumber(l)),
      datasets: [
        {
          label: 'শিক্ষার্থীর সংখ্যা',
          data: scoreBins,
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'শিক্ষার্থীর সংখ্যা' }, ticks: { stepSize: 1 } },
        x: { title: { display: true, text: 'স্কোর রেঞ্জ (%)' } },
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          formatter: (value) => (value > 0 ? helpers.convertToBanglaNumber(value) : ''),
          color: '#333',
        },
      },
    },
  });
}

/**
 * Renders Student Progress line chart based on search.
 * @private
 */
function _renderStudentProgressChart(filteredEvaluations, allStudents, allTasks, searchTerm) {
  const ctx = document.getElementById('studentProgressChart')?.getContext('2d');
  const msgElement = document.getElementById('studentChartMsg');
  if (!ctx || !msgElement) return;

  if (studentProgressChart) studentProgressChart.destroy();

  if (!searchTerm) {
    msgElement.textContent = 'অগ্রগতি দেখতে উপরে একজন শিক্ষার্থীর নাম বা রোল দিয়ে সার্চ করুন।';
    _drawEmptyChartText(ctx, ''); // Clear canvas
    return;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  const foundStudents = allStudents.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(lowerSearchTerm) || (s.roll || '').toLowerCase().includes(lowerSearchTerm)
  );

  if (foundStudents.length === 0) {
    msgElement.textContent = `"${searchTerm}" নামে কোনো শিক্ষার্থী পাওয়া যায়নি।`;
    _drawEmptyChartText(ctx, '');
    return;
  }
  if (foundStudents.length > 1) {
    msgElement.textContent = `"${searchTerm}" দিয়ে ${helpers.convertToBanglaNumber(
      foundStudents.length
    )} জন পাওয়া গেছে। আরও নির্দিষ্টভাবে সার্চ করুন।`;
    _drawEmptyChartText(ctx, '');
    return;
  }

  const student = foundStudents[0];
  msgElement.textContent = ''; // Clear message

  const taskMap = new Map(allTasks.map((task) => [task.id, task]));
  const studentData = []; // [{ x: date, y: score, taskName: ... }, ...]

  filteredEvaluations.forEach((ev) => {
    if (ev.scores && ev.scores[student.id] && ev.taskDate) {
      const task = taskMap.get(ev.taskId);
      const maxScore = parseFloat(ev.maxPossibleScore) || parseFloat(task?.maxScore) || TOTAL_MAX_SCORE;
      if (maxScore > 0) {
        const scoreData = ev.scores[student.id];
        const totalScore = parseFloat(scoreData.totalScore) || 0;
        studentData.push({
          x: ev.taskDate,
          y: (totalScore / maxScore) * 100, // Percentage
          taskName: task?.name || 'Unknown Task',
        });
      }
    }
  });
  // Ensure data is sorted by date (already done by filteredEvaluations sort)

  if (studentData.length === 0) {
    msgElement.textContent = `${student.name} (${helpers.convertToBanglaNumber(
      student.roll
    )}) এর জন্য এই ফিল্টারে কোনো মূল্যায়ন ডেটা নেই।`;
    _drawEmptyChartText(ctx, '');
    return;
  }

  studentProgressChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: `${helpers.ensureBengaliText(student.name)} (${helpers.convertToBanglaNumber(student.roll)})`,
          data: studentData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'PP', displayFormats: { day: 'MMM d' } },
          title: { display: true, text: 'তারিখ' },
        },
        y: { beginAtZero: true, max: 100, title: { display: true, text: 'স্কোর (%)' } },
      },
      plugins: {
        zoom: { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, mode: 'x' } },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: (value) => (value?.y ? helpers.convertToBanglaNumber(value.y.toFixed(1)) + '%' : ''),
          color: '#555',
          font: { size: 10 },
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              // Show task name in tooltip title
              const dataIndex = tooltipItems[0].dataIndex;
              return studentData[dataIndex]?.taskName || tooltipItems[0].label;
            },
          },
        },
      },
    },
  });
}

/** Draws placeholder text on an empty chart canvas */
function _drawEmptyChartText(ctx, text) {
  if (ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "16px 'Hind Siliguri'";
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
}

/** Generates a random color string */
function _getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// --- 3. PDF Generation Logic (Public Methods) ---

/**
 * Generates PDF for ALL groups.
 */
export async function generateGroupAnalysisPDF() {
  console.log('Generating PDF for ALL groups...');
  // Ensure filter is set to 'all' for this function
  if (elements.analysisGroupSelect) elements.analysisGroupSelect.value = 'all';
  _renderGroupSummary(); // Re-render table for 'all'

  const contentElement = document.getElementById('printableAnalysisArea');
  if (!contentElement) {
    uiManager.showToast('প্রিন্ট করার কন্টেন্ট পাওয়া যায়নি।', 'error');
    return;
  }

  const title = 'সকল গ্রুপের মূল্যায়ন সামারি';
  await _generatePDF(contentElement, title, 'all_groups_analysis.pdf');
}

/**
 * Generates PDF for the CURRENTLY SELECTED group.
 */
export async function generateSelectedGroupPDF() {
  const selectedGroupId = elements.analysisGroupSelect?.value;
  if (!selectedGroupId || selectedGroupId === 'all') {
    uiManager.showToast('PDF তৈরি করতে অনুগ্রহ করে তালিকা থেকে একটি গ্রুপ নির্বাচন করুন।', 'warning');
    return;
  }

  // _renderGroupSummary() should already be showing the selected group's data
  const contentElement = document.getElementById('printableAnalysisArea');
  if (!contentElement) {
    uiManager.showToast('প্রিন্ট করার কন্টেন্ট পাওয়া যায়নি।', 'error');
    return;
  }

  const groupName = elements.analysisGroupSelect.options[elements.analysisGroupSelect.selectedIndex].text;
  const title = `গ্রুপ সামারি: ${groupName}`;
  await _generatePDF(contentElement, title, `group_${groupName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Opens browser print dialog for the current summary view.
 */
export function printGroupAnalysis() {
  // We can just use the browser's print functionality
  window.print();
  // The @media print styles in main.css will handle formatting
}

/**
 * Core PDF generation function using jsPDF and AutoTable.
 * @param {HTMLElement} contentElement - The element containing the table.
 * @param {string} title - The title for the PDF document.
 * @param {string} filename - The desired download filename.
 * @private
 */
async function _generatePDF(contentElement, title, filename) {
  if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
    uiManager.showToast('PDF লাইব্রেরি (jsPDF) লোড হয়নি।', 'error');
    return;
  }
  if (typeof jspdf.jsPDF.API.autoTable === 'undefined') {
    console.warn('jsPDF-AutoTable plugin not loaded, falling back to html2canvas (may be lower quality).');
    // Fallback to html2canvas if autoTable is missing
    return _generatePDFWithHtml2Canvas(contentElement, title, filename);
  }

  uiManager.showLoading('PDF তৈরি হচ্ছে...');
  try {
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'pt', 'a4'); // Use points (pt) for AutoTable

    const tableElement = contentElement.querySelector('table');
    if (!tableElement) throw new Error('সামারি টেবিল খুঁজে পাওয়া যায়নি।');

    // Set font for Title
    try {
      doc.setFont('SolaimanLipi', 'normal');
    } catch (e) {
      console.warn('PDF Font Error, falling back:', e);
    }

    doc.setFontSize(18);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`তারিখ: ${new Date().toLocaleDateString('bn-BD')}`, doc.internal.pageSize.getWidth() / 2, 55, {
      align: 'center',
    });

    // Use autoTable
    doc.autoTable({
      html: tableElement,
      startY: 70,
      theme: 'grid',
      styles: {
        font: 'SolaimanLipi', // Apply font to all cells
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [22, 163, 74], // Green-600
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // gray-50
      },
      didParseCell: function (data) {
        // Ensure Bengali text is processed correctly
        if (data.cell.text) {
          data.cell.text = data.cell.text.map((t) => helpers.ensureBengaliText(t));
        }
      },
    });

    doc.save(filename);
    uiManager.showToast('PDF সফলভাবে তৈরি হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error generating PDF with AutoTable:', error);
    uiManager.showToast(`PDF তৈরি করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
  }
}

/**
 * Fallback PDF generation using html2canvas (lower quality).
 * @private
 */
async function _generatePDFWithHtml2Canvas(contentElement, title, filename) {
  if (typeof html2canvas === 'undefined') {
    uiManager.showToast('PDF লাইব্রেরি (html2canvas) লোড হয়নি।', 'error');
    return;
  }
  uiManager.showLoading('PDF ইমেজ হিসেবে তৈরি হচ্ছে...');
  try {
    const { jsPDF } = jspdf;
    const canvas = await html2canvas(contentElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30; // Margin top

    // Add title manually (since it's not part of the canvas)
    try {
      doc.setFont('SolaimanLipi', 'normal');
    } catch (e) {}
    doc.setFontSize(18);
    doc.text(title, pdfWidth / 2, 20, { align: 'center' });

    doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    doc.save(filename);
    uiManager.showToast('PDF সফলভাবে তৈরি হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ Error generating PDF with html2canvas:', error);
    uiManager.showToast(`PDF তৈরি করতে সমস্যা: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
  }
}
