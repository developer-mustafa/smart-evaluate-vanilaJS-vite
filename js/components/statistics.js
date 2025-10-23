// js/components/statistics.js

// Dependencies
let stateManager, uiManager, helpers, app, tasksComponent;

// DOM Elements
const elements = {};
let scoreDistributionChartInstance = null; // To hold the Chart.js instance

/**
 * Initializes the Statistics component.
 * @param {object} dependencies - Passed from app.js.
 * @returns {object} - Public methods.
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  helpers = dependencies.utils;
  app = dependencies.app;
  tasksComponent = app.components.tasks; // Access tasks component via app

  _cacheDOMElements();
  _setupEventListeners();

  console.log('✅ Statistics component initialized.');

  return {
    render,
  };
}

/**
 * Renders the Statistics page (#page-statistics).
 */
export function render() {
  if (!elements.page) {
    console.error('❌ Statistics render failed: Page element #page-statistics not found.');
    return;
  }
  console.log('Rendering Statistics page...');

  uiManager.showLoading('পরিসংখ্যান গণনা করা হচ্ছে...');
  try {
    // 1. Build/Update filters UI
    _renderFilters();

    // 2. Get data and calculate stats based on current filter
    const statsData = _calculateStatistics();

    // 3. Render the calculated stats into the UI
    _renderStatistics(statsData);
  } catch (error) {
    console.error('❌ Error rendering statistics page:', error);
    if (elements.statsContentContainer) {
      uiManager.displayEmptyMessage(
        elements.statsContentContainer,
        `পরিসংখ্যান লোড করতে সমস্যা হয়েছে: ${error.message}`
      );
    }
  } finally {
    uiManager.hideLoading();
  }
}

/**
 * Caches DOM elements for the Statistics page.
 * @private
 */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-statistics');
  if (elements.page) {
    // These containers must exist in index.html inside #page-statistics
    elements.filterContainer = elements.page.querySelector('#statsFilterContainer');
    elements.statsContentContainer = elements.page.querySelector('#statsContentContainer');

    if (!elements.filterContainer) console.warn('Statistics: #statsFilterContainer not found.');
    if (!elements.statsContentContainer) console.warn('Statistics: #statsContentContainer not found.');
  } else {
    console.error('❌ Statistics init failed: #page-statistics element not found!');
  }
}

/**
 * Sets up event listeners for filters.
 * @private
 */
function _setupEventListeners() {
  if (!elements.filterContainer) return;

  // Use event delegation on the filter container
  uiManager.addListener(elements.filterContainer, 'change', (e) => {
    if (e.target && e.target.classList.contains('stats-filter')) {
      // Update the state
      stateManager.updateFilters('statistics', {
        taskFilter: elements.taskFilterSelect?.value || 'all',
      });
      // Re-render the stats
      render();
    }
  });
}

/**
 * Renders the filter UI (e.g., Task dropdown).
 * @private
 */
function _renderFilters() {
  if (!elements.filterContainer) return;

  // Avoid re-creating filter if it already exists
  let taskFilterSelect = elements.filterContainer.querySelector('#statsTaskFilter');
  if (!taskFilterSelect) {
    elements.filterContainer.innerHTML = `
            <div class.card card-body"> <label for="statsTaskFilter" class="label">টাস্ক অনুযায়ী ফিল্টার:</label>
                <select id="statsTaskFilter" class="form-select w-full md:w-1/2 stats-filter">
                    </select>
            </div>
        `;
    taskFilterSelect = elements.filterContainer.querySelector('#statsTaskFilter');
    elements.taskFilterSelect = taskFilterSelect; // Cache it
  }

  // Populate task options
  if (tasksComponent?.populateTaskSelects) {
    tasksComponent.populateTaskSelects(['statsTaskFilter'], 'সকল টাস্ক'); // Use 'all' as value
  }

  // Set selected value based on current filter state
  taskFilterSelect.value = stateManager.getFilterSection('statistics')?.taskFilter || 'all';
}

/**
 * Calculates various statistics based on current filters.
 * @returns {object} - Calculated statistics.
 * @private
 */
function _calculateStatistics() {
  const { evaluations, students, tasks, groups } = stateManager.getState();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Get current filter value
  const selectedTaskId = stateManager.getFilterSection('statistics')?.taskFilter || 'all';

  const relevantEvaluations =
    selectedTaskId === 'all' ? evaluations : evaluations.filter((e) => e.taskId === selectedTaskId);

  if (relevantEvaluations.length === 0) {
    return { overallStats: null, taskStats: [], scoreDistribution: null }; // No data
  }

  // --- Aggregate all individual scores (as percentages) ---
  const allScoresPercent = []; // Array of all individual student percentages
  let totalScoreSum = 0; // Sum of all individual *raw* scores
  let participationCount = 0; // Total number of student scores recorded

  relevantEvaluations.forEach((ev) => {
    const maxScore = parseFloat(ev.maxPossibleScore) || TOTAL_MAX_SCORE; // Use 100 as fallback
    if (maxScore > 0 && ev.scores) {
      Object.values(ev.scores).forEach((scoreData) => {
        const score = parseFloat(scoreData.totalScore) || 0;
        allScoresPercent.push((score / maxScore) * 100);
        totalScoreSum += score;
        participationCount++;
      });
    }
  });

  const overallAveragePercent =
    allScoresPercent.length > 0 ? allScoresPercent.reduce((a, b) => a + b, 0) / allScoresPercent.length : 0;

  const overallStats = {
    totalEvaluations: relevantEvaluations.length, // Number of forms submitted
    totalParticipations: participationCount, // Number of individual student scores
    overallAverageScore: overallAveragePercent, // Average percentage
    highestScore: allScoresPercent.length > 0 ? Math.max(...allScoresPercent) : 0,
    lowestScore: allScoresPercent.length > 0 ? Math.min(...allScoresPercent) : 0,
  };

  // --- Task-specific stats (only if 'all tasks' is selected) ---
  const taskStats = {}; // { taskId: { name, date, avgScore, participation, highest, lowest } }
  if (selectedTaskId === 'all') {
    relevantEvaluations.forEach((ev) => {
      const task = taskMap.get(ev.taskId);
      if (!task) return;
      const maxScore = parseFloat(ev.maxPossibleScore) || parseFloat(task.maxScore) || TOTAL_MAX_SCORE;

      if (!taskStats[ev.taskId]) {
        taskStats[ev.taskId] = {
          name: task.name,
          date: task.date,
          totalPercentageSum: 0,
          count: 0,
          scores: [],
        };
      }

      if (maxScore > 0 && ev.scores) {
        Object.values(ev.scores).forEach((scoreData) => {
          const score = parseFloat(scoreData.totalScore) || 0;
          const percentage = (score / maxScore) * 100;
          taskStats[ev.taskId].totalPercentageSum += percentage;
          taskStats[ev.taskId].count++;
          taskStats[ev.taskId].scores.push(percentage);
        });
      }
    });
    // Calculate averages, highest, lowest for each task
    Object.values(taskStats).forEach((stat) => {
      stat.avgScore = stat.count > 0 ? stat.totalPercentageSum / stat.count : 0;
      stat.highest = stat.scores.length > 0 ? Math.max(...stat.scores) : 0;
      stat.lowest = stat.scores.length > 0 ? Math.min(...stat.scores) : 0;
      stat.participation = stat.count;
    });
  }

  // --- Score Distribution ---
  const scoreBins = [0, 0, 0, 0, 0]; // 0-19, 20-39, 40-59, 60-79, 80-100
  allScoresPercent.forEach((score) => {
    if (score < 20) scoreBins[0]++;
    else if (score < 40) scoreBins[1]++;
    else if (score < 60) scoreBins[2]++;
    else if (score < 80) scoreBins[3]++;
    else scoreBins[4]++;
  });
  const scoreDistribution = {
    labels: ['০-১৯%', '২০-৩৯%', '৪০-৫৯%', '৬০-৭৯%', '৮০-১০০%'],
    data: scoreBins,
  };

  return {
    overallStats,
    taskStats: Object.values(taskStats).sort((a, b) => (b.date || '').localeCompare(a.date || '')), // Sort newest first
    scoreDistribution,
  };
}

/**
 * Renders the calculated statistics into the UI.
 * @param {object} statsData - Calculated statistics data.
 * @private
 */
function _renderStatistics(statsData) {
  if (!elements.statsContentContainer) return;
  uiManager.clearContainer(elements.statsContentContainer);

  const { overallStats, taskStats, scoreDistribution } = statsData;

  if (!overallStats) {
    uiManager.displayEmptyMessage(
      elements.statsContentContainer,
      'নির্বাচিত ফিল্টারের জন্য কোনো মূল্যায়ন ডেটা পাওয়া যায়নি।'
    );
    return;
  }

  let html = '<div class="space-y-6">';

  // --- Overall Statistics Card ---
  const selectedTaskName =
    elements.taskFilterSelect?.value === 'all'
      ? '(সকল টাস্ক)'
      : `(${elements.taskFilterSelect?.options[elements.taskFilterSelect.selectedIndex].text})`;

  html += `
    <div class="card card-body">
        <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">সামগ্রিক পরিসংখ্যান ${helpers.ensureBengaliText(
          selectedTaskName
        )}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="stat-card">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${helpers.convertToBanglaNumber(
                  overallStats.totalEvaluations
                )}</div>
                <div class.text-sm">মোট মূল্যায়ন (ফর্ম)</div>
            </div>
            <div class="stat-card">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${helpers.convertToBanglaNumber(
                  overallStats.totalParticipations
                )}</div>
                <div class.text-sm">মোট অংশগ্রহণ (ছাত্র)</div>
            </div>
             <div class="stat-card">
                <div class="text-2xl font-bold ${helpers.getPerformanceColorClass(
                  overallStats.overallAverageScore
                )}">${helpers.convertToBanglaNumber(overallStats.overallAverageScore.toFixed(2))}%</div>
                <div class.text-sm">গড় স্কোর</div>
            </div>
            <div class="stat-card">
                <div class="text-xl font-bold"><span class="text-green-600 dark:text-green-400">${helpers.convertToBanglaNumber(
                  overallStats.highestScore.toFixed(1)
                )}%</span> / <span class="text-red-600 dark:text-red-400">${helpers.convertToBanglaNumber(
    overallStats.lowestScore.toFixed(1)
  )}%</span></div>
                <div class.text-sm">সর্বোচ্চ / সর্বনিম্ন</div>
            </div>
        </div>
    </div>
    `;

  // --- Task Specific Statistics Table (only if 'all tasks' is selected) ---
  if (taskStats && taskStats.length > 0) {
    html += `
        <div class="card">
            <div class="card-header">টাস্ক অনুযায়ী পরিসংখ্যান</div>
            <div class="card-body overflow-x-auto">
                <table class="w-full min-w-[700px] border-collapse">
                    <thead>
                        <tr class="bg-gray-100 dark:bg-gray-700">
                            <th class="th">টাস্ক</th>
                            <th class="th">তারিখ</th>
                            <th class="th text-center">অংশগ্রহণ</th>
                            <th class="th text-center">গড় স্কোর (%)</th>
                            <th class="th text-center">সর্বোচ্চ (%)</th>
                            <th class="th text-center">সর্বনিম্ন (%)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
    taskStats.forEach((stat) => {
      html += `
                        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td class="td p-3">${helpers.ensureBengaliText(stat.name)}</td>
                            <td class="td p-3">${helpers.formatTimestamp(stat.date)}</td>
                            <td class="td p-3 text-center">${helpers.convertToBanglaNumber(stat.participation)}</td>
                            <td class="td p-3 text-center font-semibold ${helpers.getPerformanceColorClass(
                              stat.avgScore
                            )}">${helpers.convertToBanglaNumber(stat.avgScore.toFixed(2))}</td>
                            <td class="td p-3 text-center text-green-600">${helpers.convertToBanglaNumber(
                              stat.highest.toFixed(1)
                            )}</td>
                            <td class="td p-3 text-center text-red-600">${helpers.convertToBanglaNumber(
                              stat.lowest.toFixed(1)
                            )}</td>
                        </tr>
            `;
    });
    html += `
                    </tbody>
                </table>
            </div>
        </div>
        `;
  }

  // --- Score Distribution Chart ---
  if (scoreDistribution && scoreDistribution.data.some((d) => d > 0)) {
    html += `
         <div class="card">
             <div class="card-header">স্কোর ডিস্ট্রিবিউশন ${helpers.ensureBengaliText(selectedTaskName)}</div>
             <div class="card-body">
                <div class="max-w-xl mx-auto h-64 md:h-80"><canvas id="statsScoreDistributionChart"></canvas></div>
             </div>
         </div>
         `;
  }

  html += '</div>'; // Close space-y-6 div
  elements.statsContentContainer.innerHTML = html;

  // Render the chart *after* the canvas element is in the DOM
  if (scoreDistribution && scoreDistribution.data.some((d) => d > 0)) {
    _renderDistributionChartInstance(scoreDistribution);
  }
}

/**
 * স্কোর ডিস্ট্রিবিউশন চার্টের ইনস্ট্যান্স তৈরি করে।
 * @param {object} scoreDistribution - { labels, data }
 * @private
 */
function _renderDistributionChartInstance(scoreDistribution) {
  const ctx = document.getElementById('statsScoreDistributionChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy previous instance if exists
  if (scoreDistributionChartInstance) {
    scoreDistributionChartInstance.destroy();
    scoreDistributionChartInstance = null;
  }

  scoreDistributionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: scoreDistribution.labels.map((l) => helpers.convertToBanglaNumber(l)), // Convert labels
      datasets: [
        {
          label: 'শিক্ষার্থীর সংখ্যা',
          data: scoreDistribution.data,
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6'],
          borderColor: ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#2563eb'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow chart to fill container height
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
          color: (context) => context.chart.options.color || '#333', // Use chart's default color
        },
      },
    },
    plugins: [ChartDataLabels], // Ensure plugin is registered globally in index.html
  });
}
