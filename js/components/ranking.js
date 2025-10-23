// js/components/ranking.js

// Dependencies
let stateManager, uiManager, dataService, helpers, app;

// DOM Elements
const elements = {};

// Ranking criteria from slide [cite: 284]
const MIN_EVALUATIONS_FOR_RANKING = 2;

/**
 * Initializes the Ranking component.
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

  console.log('✅ Ranking component initialized.');

  return {
    render,
  };
}

/**
 * Renders the Ranking page (#page-student-ranking).
 */
export function render() {
  if (!elements.page) {
    console.error('❌ Ranking render failed: Page element not found.');
    return;
  }
  console.log('Rendering Student Ranking page...');

  uiManager.showLoading('র‍্যাঙ্কিং গণনা করা হচ্ছে...');
  try {
    const { students, evaluations, tasks } = stateManager.getState();

    // Check if data is ready
    if (!students || !evaluations || !tasks) {
      uiManager.displayEmptyMessage(elements.studentRankingListContainer, 'র‍্যাঙ্কিং গণনার জন্য ডেটা লোড হচ্ছে...');
      return;
    }

    const rankedStudents = _calculateStudentRankings(students, evaluations, tasks);
    _renderRankingList(rankedStudents);
  } catch (error) {
    console.error('❌ Error rendering student ranking:', error);
    uiManager.displayEmptyMessage(elements.studentRankingListContainer, 'র‍্যাঙ্কিং লোড করতে একটি ত্রুটি ঘটেছে।');
  } finally {
    uiManager.hideLoading();
  }
}

/**
 * Caches DOM elements for the Ranking page.
 * @private
 */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-student-ranking');
  if (elements.page) {
    elements.refreshRankingBtn = elements.page.querySelector('#refreshRanking');
    elements.studentRankingListContainer = elements.page.querySelector('#studentRankingList');
  } else {
    console.error('❌ Ranking init failed: #page-student-ranking element not found!');
  }
}

/**
 * Sets up event listeners for the Ranking page.
 * @private
 */
function _setupEventListeners() {
  if (!elements.page) return;

  // Refresh button listener
  uiManager.addListener(elements.refreshRankingBtn, 'click', async () => {
    uiManager.showLoading('র‍্যাঙ্কিং রিফ্রেশ করা হচ্ছে...');
    try {
      // Force refresh all data from server
      await app.refreshAllData();
      // Re-render this page (will be handled by refreshAllData's showPage call)
      // render(); // No need to call render directly, refreshAllData handles it
    } catch (error) {
      console.error('❌ Error refreshing ranking data:', error);
      uiManager.showToast('র‍্যাঙ্কিং রিফ্রেশ করতে সমস্যা হয়েছে।', 'error');
    }
    // uiManager.hideLoading(); // Handled by refreshAllData
  });
}

/**
 * Calculates student rankings based on evaluations.
 * @param {Array<object>} students
 * @param {Array<object>} evaluations
 * @param {Array<object>} tasks
 * @returns {Array<object>} Sorted list of ranked student data.
 * @private
 */
function _calculateStudentRankings(students, evaluations, tasks) {
  if (!students || !evaluations || !tasks) return [];

  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const studentPerformance = {}; // { studentId: { totalPercentage: 0, count: 0 } }

  // 1. Aggregate scores for each student
  evaluations.forEach((evaluation) => {
    const task = taskMap.get(evaluation.taskId);
    // Use the maxPossibleScore stored in the evaluation, or fallback to task's maxScore
    const maxScore = parseFloat(evaluation.maxPossibleScore) || parseFloat(task?.maxScore) || TOTAL_MAX_SCORE; // Use 100 as last resort

    if (maxScore > 0 && evaluation.scores) {
      Object.entries(evaluation.scores).forEach(([studentId, scoreData]) => {
        if (!studentPerformance[studentId]) {
          studentPerformance[studentId] = { totalPercentage: 0, count: 0 };
        }
        const totalScore = parseFloat(scoreData.totalScore) || 0;
        // Calculate percentage for this single evaluation
        const percentage = (totalScore / maxScore) * 100;

        studentPerformance[studentId].totalPercentage += percentage;
        studentPerformance[studentId].count++;
      });
    }
  });

  // 2. Map, Filter, Calculate Average, and Sort
  const rankedList = students
    .map((student) => {
      const performance = studentPerformance[student.id];
      let averageScore = 0; // Average percentage
      let evalCount = 0;

      if (performance && performance.count > 0) {
        averageScore = performance.totalPercentage / performance.count;
        evalCount = performance.count;
      }

      return {
        student: student, // Full student object
        averageScore: averageScore,
        evalCount: evalCount,
        rank: 0, // Initial rank
      };
    })
    // Filter: Must have participated in minimum number of evaluations [cite: 284]
    .filter((item) => item.evalCount >= MIN_EVALUATIONS_FOR_RANKING)
    // Sort: 1. By average score (desc), 2. By evaluation count (desc) as tie-breaker [cite: 287]
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.evalCount - a.evalCount;
    });

  // 3. Assign Rank numbers (handling ties)
  let currentRank = 0;
  let lastScore = -1;
  let lastEvalCount = -1;
  rankedList.forEach((item, index) => {
    if (item.averageScore !== lastScore || item.evalCount !== lastEvalCount) {
      currentRank = index + 1; // New rank
      lastScore = item.averageScore;
      lastEvalCount = item.evalCount;
    }
    item.rank = currentRank;
  });

  return rankedList;
}

/**
 * Renders the calculated ranking list into the DOM.
 * @param {Array<object>} rankedStudents - Sorted list from _calculateStudentRankings.
 * @private
 */
function _renderRankingList(rankedStudents) {
  if (!elements.studentRankingListContainer) return;

  uiManager.clearContainer(elements.studentRankingListContainer);

  if (rankedStudents.length === 0) {
    uiManager.displayEmptyMessage(
      elements.studentRankingListContainer,
      `কোনো শিক্ষার্থী র‍্যাঙ্কিংয়ের জন্য যোগ্য নয় (কমপক্ষে ${helpers.convertToBanglaNumber(
        MIN_EVALUATIONS_FOR_RANKING
      )} টি মূল্যায়নে অংশ নিতে হবে)।`
    );
    return;
  }

  const groupsMap = new Map(stateManager.get('groups').map((g) => [g.id, g.name]));

  const html = rankedStudents
    .map((item) => {
      const student = item.student;
      const rankText = helpers.convertToBanglaRank(item.rank);
      const score = helpers.convertToBanglaNumber(item.averageScore.toFixed(2)); // Show avg percentage
      const evals = helpers.convertToBanglaNumber(item.evalCount);
      const groupName = groupsMap.get(student.groupId) || '<span class="text-xs text-red-500">গ্রুপ নেই</span>';
      const scoreColor = helpers.getPerformanceColorClass(item.averageScore);

      // Special styles for Top 3
      let rankBadgeStyle = helpers.getPerformanceBgClass(item.averageScore);
      if (item.rank === 1) rankBadgeStyle = 'bg-yellow-400 text-yellow-900 border border-yellow-500 shadow-lg';
      else if (item.rank === 2) rankBadgeStyle = 'bg-gray-300 text-gray-800 border border-gray-400 shadow-md';
      else if (item.rank === 3) rankBadgeStyle = 'bg-orange-400 text-orange-900 border border-orange-500 shadow';
      else
        rankBadgeStyle =
          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600';

      return `
        <div class"card p-4 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${rankBadgeStyle} font-bold text-lg">
                ${rankText}
            </div>

            <div class="flex-grow min-w-0">
                <h4 class="text-md font-semibold text-gray-900 dark:text-white truncate" title="${
                  student.name
                }">${helpers.ensureBengaliText(student.name)}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    রোল: ${helpers.convertToBanglaNumber(student.roll)} | ${student.academicGroup || ''}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    গ্রুপ: ${helpers.ensureBengaliText(groupName)}
                </p>
            </div>

            <div class="flex-shrink-0 text-right">
                <div class="text-xl font-bold ${scoreColor}">${score}%</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${evals} টি মূল্যায়ন</div>
            </div>
        </div>
        `;
    })
    .join('');

  elements.studentRankingListContainer.innerHTML = html;
}
