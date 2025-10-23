// js/components/dashboard.js

// নির্ভরতা (Dependencies)
let stateManager, uiManager, helpers, app;

// Cached DOM Elements
const elements = {};

/**
 * Initializes the Dashboard component.
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  helpers = dependencies.utils;
  app = dependencies.app;

  _cacheDOMElements(); // Cache only the main page element
  console.log('✅ Dashboard component initialized.');

  return {
    render,
  };
}

/**
 * Renders the Dashboard page content based on current state.
 */
export function render() {
  console.log('Rendering Dashboard...');
  if (!elements.page) {
    console.error('❌ Dashboard render failed: Page element (#page-dashboard) not found.');
    return;
  }

  uiManager.clearContainer(elements.page);
  elements.page.innerHTML =
    '<div class="placeholder-content"><i class="fas fa-spinner fa-spin mr-2"></i> ড্যাশবোর্ড ডেটা লোড হচ্ছে...</div>';

  try {
    const { groups, students, tasks, evaluations } = stateManager.getState();
    if (!groups || !students || !tasks || !evaluations) {
      uiManager.displayEmptyMessage(elements.page, 'ডেটা এখনও লোড হচ্ছে...');
      return;
    }

    const stats = _calculateStats(groups, students, tasks, evaluations);

    // Re-create the inner HTML structure
    elements.page.innerHTML = _getDashboardHTMLStructure();

    // Re-cache elements *within* the newly created structure
    _cacheInnerDOMElements();

    // Render statistics into the cached elements
    _renderStats(stats);

    // Render dynamic lists
    _renderTopGroups(stats.groupPerformanceData);
    _renderAcademicGroups(stats.academicGroupStats);
    _renderGroupsRanking(stats.groupPerformanceData);

    console.log('✅ Dashboard rendered successfully.');
  } catch (error) {
    console.error('❌ Error rendering dashboard:', error);
    if (elements.page) {
      uiManager.displayEmptyMessage(elements.page, `ড্যাশবোর্ড লোড করতে ত্রুটি হয়েছে: ${error.message}`);
    }
  }
}

/**
 * Returns the static HTML structure for the dashboard content.
 * @private
 */
function _getDashboardHTMLStructure() {
  // This HTML must match the IDs used in _cacheInnerDOMElements
  return `
        <div class="max-w-7xl mx-auto space-y-6">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <div class="stat-card"><div id="totalGroups">-</div><div>মোট গ্রুপ</div></div>
                <div class="stat-card"><div id="totalStudents">-</div><div>মোট শিক্ষার্থী</div></div>
                <div class="stat-card"><div id="totalAcademicGroups">-</div><div>একাডেমিক গ্রুপ</div></div>
                <div class="stat-card"><div id="pendingRoles">-</div><div>দায়িত্ব বাকি</div></div>
                <div class="stat-card"><div id="maleStudents">-</div><div id="malePercentage" class="text-xs text-indigo-600"></div><div>ছেলে</div></div>
                <div class="stat-card"><div id="femaleStudents">-</div><div id="femalePercentage" class="text-xs text-pink-600"></div><div>মেয়ে</div></div>
                <div class="stat-card"><div id="totalTasks">-</div><div>মোট টাস্ক</div></div>
                <div class="stat-card"><div id="pendingEvaluations">-</div><div>বাকি মূল্যায়ন</div></div>
            </div>
            <div class="card p-2">
                <div class="relative w-full h-10 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div id="progressBar" class="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out bg-green-500" style="width: 0%;"></div>
                    <div class="absolute inset-0 flex flex-col sm:flex-row items-center justify-between px-4 text-xs sm:text-sm font-medium">
                        <span class="text-gray-700 dark:text-gray-300">সামগ্রিক অগ্রগতি</span>
                        <span id="overallProgress" class="font-bold text-lg sm:text-xl text-gray-800 dark:text-white">0%</span>
                        <span class="text-gray-700 dark:text-gray-300">গড় পারফরম্যান্স</span>
                    </div>
                </div>
            </div>
            <div id="topGroupsContainer" class="card card-body">
                <div class="placeholder-content"> <i class="fas fa-spinner fa-spin mr-2"></i> শীর্ষ গ্রুপ লোড হচ্ছে...</div>
            </div>
            <div id="academicGroupStatsList" class="card card-body">
                 <div class="placeholder-content"> <i class="fas fa-spinner fa-spin mr-2"></i> একাডেমিক গ্রুপ লোড হচ্ছে...</div>
            </div>
            <div class="card">
                <div class="card-header">গ্রুপ র‌্যাঙ্কিং (গড় নম্বরের ভিত্তিতে)</div>
                <div id="groupsRankingList" class="card-body space-y-3">
                     <div class="placeholder-content"> <i class="fas fa-spinner fa-spin mr-2"></i> র‍্যাঙ্কিং লোড হচ্ছে...</div>
                </div>
            </div>
        </div>
    `;
}

/** Caches the main page element. */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-dashboard');
  if (!elements.page) console.error('❌ Dashboard init failed: #page-dashboard not found!');
}

/** Caches elements *inside* the dashboard page structure. */
function _cacheInnerDOMElements() {
  if (!elements.page) return;
  const idsToCache = [
    'totalGroups',
    'totalStudents',
    'totalAcademicGroups',
    'pendingRoles',
    'maleStudents',
    'malePercentage',
    'femaleStudents',
    'femalePercentage',
    'totalTasks',
    'pendingEvaluations',
    'progressBar',
    'overallProgress',
    'topGroupsContainer',
    'academicGroupStatsList',
    'groupsRankingList',
  ];
  idsToCache.forEach((id) => {
    elements[id] = elements.page.querySelector(`#${id}`);
    if (!elements[id]) console.warn(`Dashboard: Element #${id} not found.`);
  });
}

// --- Calculation Logic ---
function _calculateStats(groups = [], students = [], tasks = [], evaluations = []) {
  const totalGroups = groups.length;
  const totalStudents = students.length;
  const totalTasks = tasks.length;
  const maleStudents = students.filter((s) => (s.gender || '').trim() === 'ছেলে').length;
  const femaleStudents = students.filter((s) => (s.gender || '').trim() === 'মেয়ে').length; // 'মেয়ে'
  const malePercentage = totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 0;
  const femalePercentage = totalStudents > 0 ? (femaleStudents / totalStudents) * 100 : 0;
  const academicGroups = new Set(students.map((s) => s.academicGroup).filter(Boolean));
  const totalAcademicGroups = academicGroups.size;
  const pendingRoles = students.filter((s) => !s.role || s.role === '').length;

  const groupPerformanceData = _calculateGroupPerformance(groups, students, evaluations, tasks);
  const validGroupPerformances = groupPerformanceData.filter((g) => g.evalCount > 0);
  const totalOverallScore = validGroupPerformances.reduce((acc, group) => acc + group.averageScore, 0);
  const overallProgress = validGroupPerformances.length > 0 ? totalOverallScore / validGroupPerformances.length : 0;

  const completedEvaluationIds = new Set(evaluations.map((e) => `${e.taskId}_${e.groupId}`));
  let pendingEvaluations = 0;
  if (tasks.length > 0 && groups.length > 0) {
    for (const task of tasks) {
      for (const group of groups) {
        if (!completedEvaluationIds.has(`${task.id}_${group.id}`)) pendingEvaluations++;
      }
    }
  }
  const academicGroupStats = _calculateAcademicGroupStats(students, groupPerformanceData);
  return {
    totalGroups,
    totalStudents,
    totalTasks,
    maleStudents,
    femaleStudents,
    malePercentage,
    femalePercentage,
    totalAcademicGroups,
    pendingRoles,
    pendingEvaluations,
    overallProgress,
    groupPerformanceData,
    academicGroupStats,
  };
}

function _calculateGroupPerformance(groups, students, evaluations, tasks) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  return groups
    .map((group) => {
      const groupStudents = students.filter((s) => s.groupId === group.id);
      const groupEvals = evaluations.filter((e) => e.groupId === group.id);
      let totalPercentageScore = 0;
      let validEvalsCount = 0;
      groupEvals.forEach((evaluation) => {
        // Use the average percentage score stored in the evaluation document
        const avgEvalScorePercent = parseFloat(evaluation.groupAverageScore);
        if (!isNaN(avgEvalScorePercent)) {
          totalPercentageScore += avgEvalScorePercent;
          validEvalsCount++;
        }
        // Fallback (if groupAverageScore not present, though it should be)
        else if (evaluation.scores) {
          const task = taskMap.get(evaluation.taskId);
          const maxScore = parseFloat(task?.maxScore) || parseFloat(evaluation.maxPossibleScore) || 100;
          if (maxScore > 0) {
            let evalScoreSum = 0;
            let studentCountInEval = 0;
            Object.values(evaluation.scores).forEach((scoreData) => {
              evalScoreSum += parseFloat(scoreData.totalScore) || 0;
              studentCountInEval++;
            });
            if (studentCountInEval > 0) {
              totalPercentageScore += (evalScoreSum / studentCountInEval / maxScore) * 100;
              validEvalsCount++;
            }
          }
        }
      });
      const averageScore = validEvalsCount > 0 ? totalPercentageScore / validEvalsCount : 0;
      return {
        group,
        groupName: group.name,
        studentCount: groupStudents.length,
        averageScore: averageScore,
        evalCount: validEvalsCount,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore);
}

function _calculateAcademicGroupStats(students, groupPerformanceData) {
  const stats = {};
  const groupPerfMap = new Map(groupPerformanceData.map((gp) => [gp.group.id, gp.averageScore]));
  students.forEach((student) => {
    const ag = student.academicGroup;
    const groupId = student.groupId;
    if (!ag || !groupId) return;
    if (!stats[ag]) {
      stats[ag] = { totalStudents: 0, scoreSum: 0, groupCount: 0, processedGroups: new Set() };
    }
    stats[ag].totalStudents++;
    if (groupPerfMap.has(groupId) && !stats[ag].processedGroups.has(groupId) && groupPerfMap.get(groupId) > 0) {
      stats[ag].scoreSum += groupPerfMap.get(groupId);
      stats[ag].groupCount++;
      stats[ag].processedGroups.add(groupId);
    }
  });
  Object.keys(stats).forEach((ag) => {
    const data = stats[ag];
    data.averageScore = data.groupCount > 0 ? data.scoreSum / data.groupCount : 0;
  });
  return stats;
}

// --- DOM Rendering Functions ---
/** Renders the calculated statistics into the DOM elements. */
function _renderStats(stats) {
  const setText = (element, value) => {
    if (element) element.textContent = value ?? '-';
  };
  const formatNum = (num, decimals = 0) => {
    if (typeof num !== 'number' || isNaN(num)) return '-';
    return helpers.convertToBanglaNumber(num.toFixed(decimals));
  };
  setText(elements.totalGroups, formatNum(stats.totalGroups));
  setText(elements.totalStudents, formatNum(stats.totalStudents));
  setText(elements.totalAcademicGroups, formatNum(stats.totalAcademicGroups));
  setText(elements.pendingRoles, formatNum(stats.pendingRoles));
  setText(elements.maleStudents, formatNum(stats.maleStudents));
  setText(elements.malePercentage, `${formatNum(stats.malePercentage, 0)}%`);
  setText(elements.femaleStudents, formatNum(stats.femaleStudents));
  setText(elements.femalePercentage, `${formatNum(stats.femalePercentage, 0)}%`);
  setText(elements.totalTasks, formatNum(stats.totalTasks));
  setText(elements.pendingEvaluations, formatNum(stats.pendingEvaluations));

  const progress =
    typeof stats.overallProgress === 'number' && !isNaN(stats.overallProgress) ? stats.overallProgress : 0;
  const progressInt = Math.round(progress);
  setText(elements.overallProgress, `${formatNum(progressInt)}%`);
  if (elements.progressBar) {
    elements.progressBar.style.width = `${progressInt}%`;
    const progressColorClass = helpers.getPerformanceBgClass(progress);
    elements.progressBar.className = `absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${progressColorClass}`;
  }
}

/** Renders top 3 groups */
function _renderTopGroups(groupData) {
  if (!elements.topGroupsContainer) return;
  uiManager.clearContainer(elements.topGroupsContainer);
  const top3 = groupData.filter((g) => g.evalCount > 0).slice(0, 3);
  if (top3.length === 0) {
    uiManager.displayEmptyMessage(elements.topGroupsContainer, 'শীর্ষ গ্রুপ গণনা করার ডেটা নেই।');
    return;
  }
  const rankingColors = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-400'];
  let html = '<h3 class="text-xl font-semibold mb-4 text-center">শীর্ষ ৩ গ্রুপ</h3>';
  html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
  top3.forEach((data, index) => {
    const rankText = helpers.convertToBanglaRank(index + 1);
    const score = helpers.convertToBanglaNumber(data.averageScore.toFixed(1));
    const students = helpers.convertToBanglaNumber(data.studentCount);
    html += `
            <div class="p-4 rounded-lg shadow ${rankingColors[index]} ${
      index === 1 ? 'text-gray-800' : 'text-white'
    } transition-transform hover:scale-105">
                <div class="flex justify-between items-baseline mb-2"><span class="text-2xl font-bold">${rankText}</span><span class="font-semibold truncate" title="${
      data.groupName
    }">${helpers.truncateText(data.groupName, 15)}</span></div>
                <div class="text-center mt-3"><div class="text-3xl font-bold">${score}%</div><div class="text-xs opacity-90 mt-1">গড় স্কোর | ${students} শিক্ষার্থী</div></div>
            </div>`;
  });
  html += '</div>';
  elements.topGroupsContainer.innerHTML = html;
}

/** Renders academic group stats */
function _renderAcademicGroups(academicStats) {
  if (!elements.academicGroupStatsList) return;
  uiManager.clearContainer(elements.academicGroupStatsList);
  const sortedAG = Object.entries(academicStats)
    .filter(([, data]) => data.groupCount > 0)
    .sort(([, a], [, b]) => b.averageScore - a.averageScore);
  if (sortedAG.length === 0) {
    uiManager.displayEmptyMessage(elements.academicGroupStatsList, 'একাডেমিক গ্রুপের তথ্য নেই।');
    return;
  }
  let html = '<h3 class="text-xl font-semibold mb-4 text-center">একাডেমিক গ্রুপ পারফরম্যান্স</h3>';
  html += '<div class="space-y-2">';
  sortedAG.forEach(([name, data]) => {
    const avgScore = data.averageScore;
    const progress = Math.round(avgScore);
    const colorClass = helpers.getPerformanceBgClass(avgScore);
    html += `
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
            <div class="flex justify-between items-center mb-1 text-sm"><span class="font-medium text-gray-700 dark:text-gray-200">${name}</span><span class="font-semibold ${helpers.getPerformanceColorClass(
      avgScore
    )}">${helpers.convertToBanglaNumber(avgScore.toFixed(1))}%</span></div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2"><div class="${colorClass} h-2 rounded-full" style="width: ${progress}%"></div></div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${helpers.convertToBanglaNumber(
              data.totalStudents
            )} জন শিক্ষার্থী</div>
        </div>`;
  });
  html += '</div>';
  elements.academicGroupStatsList.innerHTML = html;
}

/** Renders group ranking list */
function _renderGroupsRanking(groupData) {
  if (!elements.groupsRankingList) return;
  uiManager.clearContainer(elements.groupsRankingList);
  const evaluatedGroups = groupData.filter((g) => g.evalCount > 0);
  if (evaluatedGroups.length === 0) {
    uiManager.displayEmptyMessage(elements.groupsRankingList, 'র‍্যাঙ্কিংয়ের জন্য ডেটা নেই।');
    return;
  }
  let rank = 0,
    lastScore = -1,
    lastEvalCount = -1;
  const html = evaluatedGroups
    .map((data, index) => {
      if (data.averageScore !== lastScore || data.evalCount !== lastEvalCount) {
        rank = index + 1;
        lastScore = data.averageScore;
        lastEvalCount = data.evalCount;
      }
      const rankText = helpers.convertToBanglaRank(rank);
      const score = helpers.convertToBanglaNumber(data.averageScore.toFixed(1));
      const evals = helpers.convertToBanglaNumber(data.evalCount);
      const students = helpers.convertToBanglaNumber(data.studentCount);
      const color = helpers.getPerformanceColorClass(data.averageScore);
      return `
        <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${helpers.getPerformanceBgClass(
              data.averageScore
            )} text-white font-bold text-sm shadow">${rankText}</div>
            <div class="flex-1 min-w-0"><h4 class="text-base font-semibold truncate" title="${data.groupName}">${
        data.groupName
      }</h4><p class="text-xs text-gray-500 dark:text-gray-400">${students} শিক্ষার্থী | ${evals} মূল্যায়ন</p></div>
            <div class="flex-shrink-0 text-right"><div class="text-lg font-bold ${color}">${score}%</div><div class="text-xs text-gray-500 dark:text-gray-400">গড় স্কোর</div></div>
        </div>`;
    })
    .join('');
  elements.groupsRankingList.innerHTML = html;
}
