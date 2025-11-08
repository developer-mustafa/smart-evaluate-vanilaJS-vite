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
  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white shadow-2xl">
        <div class="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_55%)]"></div>
        <div class="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="relative p-6 md:p-10">
          <div class="grid gap-8 md:grid-cols-2">
            <div class="space-y-4">
              <p class="text-xs uppercase tracking-[0.35em] text-white/70">Smart Overview</p>
              <h2 class="text-3xl md:text-4xl font-bold leading-tight">ড্যাশবোর্ড ইন্টেলিজেন্স</h2>
              <p class="text-sm md:text-base text-white/75 leading-relaxed">
                রিয়েল-টাইমে গ্রুপ, একাডেমিক শাখা এবং মূল্যায়নের ফলাফল বিশ্লেষণ করে দ্রুত সিদ্ধান্ত নিন।
                প্রগতির প্রতিটি ধাপকে মাপুন এবং দলকে এগিয়ে রাখুন।
              </p>
              <div class="flex flex-wrap gap-2 text-xs font-medium text-white/70">
                <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20"><i class="fas fa-bolt"></i> লাইভ আপডেট</span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20"><i class="fas fa-chart-line"></i> পারফরম্যান্স ট্র্যাকিং</span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20"><i class="fas fa-shield-alt"></i> নেতৃত্ব মেট্রিক্স</span>
              </div>
            </div>
            <div class="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-white/70">সামগ্রিক পারফরম্যান্স সূচক</span>
                <span id="overallProgress" class="text-3xl font-semibold text-white">-</span>
              </div>
              <div class="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/20">
                <div id="progressBar" class="h-full w-0 rounded-full transition-all duration-1000 ease-out" style="background: linear-gradient(90deg,#22c55e,#16a34a); box-shadow: 0 8px 20px rgba(34,197,94,0.35);"></div>
              </div>
              <p class="mt-3 text-xs text-white/70">এই সপ্তাহে মূল্যায়িত সব গ্রুপের গড় স্কোরের ভিত্তিতে আপডেট করা হয়।</p>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">ড্যাশবোর্ড স্টেট</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">মোট গ্রুপ</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="totalGroups">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">সক্রিয় সব গ্রুপ সংখ্যা</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
              <i class="fas fa-layer-group text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">মোট শিক্ষার্থী</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">মোট শিক্ষার্থী</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="totalStudents">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">সিস্টেমে নিবন্ধিত সব সদস্য</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <i class="fas fa-user-graduate text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">একাডেমিক কভারেজ</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">একাডেমিক গ্রুপ</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="totalAcademicGroups">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">বিজ্ঞান · মানবিক · ব্যবসায়</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">
              <i class="fas fa-university text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">দায়িত্ব বণ্টন</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">দায়িত্ব বাকি</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="pendingRoles">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">যাদের ভূমিকা নির্ধারণ হয়নি</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
              <i class="fas fa-user-clock text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">জেন্ডার অন্তর্ভুক্তি</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">ছেলে সদস্য</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="maleStudents">-</p>
              <div class="mt-1 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                <i class="fas fa-male"></i>
                <span id="malePercentage">-</span>
              </div>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300">
              <i class="fas fa-venus-mars text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">জেন্ডার অন্তর্ভুক্তি</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">মেয়ে সদস্য</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="femaleStudents">-</p>
              <div class="mt-1 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-300">
                <i class="fas fa-female"></i>
                <span id="femalePercentage">-</span>
              </div>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300">
              <i class="fas fa-user-friends text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">টাস্ক ম্যানেজমেন্ট</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">মোট টাস্ক</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="totalTasks">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">নির্ধারিত সব মূল্যায়ন টাস্ক</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <i class="fas fa-tasks text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">মূল্যায়ন কভারেজ</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">বাকি মূল্যায়ন</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="pendingEvaluations">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">যেগুলো এখনও সম্পন্ন হয়নি</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-300">
              <i class="fas fa-hourglass-half text-lg"></i>
            </span>
          </div>
        </article>
      </section>

      <section class="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
        <div class="border-b border-gray-200/60 px-6 py-4 dark:border-gray-800/80">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Elite Group</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Top performing groups ranked by average evaluation score.</p>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <i class="fas fa-trophy"></i> Elite Group
            </span>
          </div>
        </div>
        <div id="topGroupsContainer" class="p-6"></div>
      </section>

      <section class="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
        <div class="border-b border-gray-200/60 px-6 py-4 dark:border-gray-800/80">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">একাডেমিক গ্রুপ পারফরম্যান্স</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">শাখাভিত্তিক গ্রুপ স্কোর ও অংশগ্রহণের প্রবণতা</p>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <i class="fas fa-chart-bar"></i> ট্রেন্ডস
            </span>
          </div>
        </div>
        <div id="academicGroupStatsList" class="p-6"></div>
      </section>

      <section class="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
        <div class="border-b border-gray-200/60 px-6 py-4 dark:border-gray-800/80">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">গ্রুপ র‌্যাঙ্কিং · গড় নম্বরের ভিত্তিতে</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">গড় স্কোর, সদস্য সংখ্যা, মূল্যায়িত সদস্য এবং টাস্ক কাভারেজ</p>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-300">
              <i class="fas fa-star"></i> ডেটা ইনসাইট
            </span>
          </div>
        </div>
        <div id="groupsRankingList" class="p-6 space-y-4"></div>
      </section>
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
  const normalizeTimestamp = (value) => {
    if (!value) return 0;
    if (typeof value === 'object') {
      if (typeof value.seconds === 'number') return value.seconds * 1000;
      if (typeof value.toDate === 'function') {
        try {
          return value.toDate().getTime();
        } catch {
          return 0;
        }
      }
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return groups
    .map((group) => {
      const groupStudents = students.filter((s) => s.groupId === group.id);
      const groupEvals = evaluations.filter((e) => e.groupId === group.id);
      let totalPercentageScore = 0;
      let validEvalsCount = 0;
      const evaluatedMemberIds = new Set();
      const taskIds = new Set();
      let latestEvalMeta = { ts: 0, avgPct: null, participants: null, participationRate: null };
      groupEvals.forEach((evaluation) => {
        const participantCount = evaluation?.scores ? Object.keys(evaluation.scores).length : 0;
        let evalAvgPct = null;
        // Use the average percentage score stored in the evaluation document
        const avgEvalScorePercent = parseFloat(evaluation.groupAverageScore);
        if (!isNaN(avgEvalScorePercent)) {
          totalPercentageScore += avgEvalScorePercent;
          validEvalsCount++;
          evalAvgPct = avgEvalScorePercent;
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
              if (scoreData.studentId) evaluatedMemberIds.add(scoreData.studentId);
            });
            if (studentCountInEval > 0) {
              const derivedPct = (evalScoreSum / studentCountInEval / maxScore) * 100;
              totalPercentageScore += derivedPct;
              validEvalsCount++;
              evalAvgPct = derivedPct;
            }
          }
        }
        if (evaluation?.scores) {
          Object.keys(evaluation.scores).forEach((studentId) => {
            if (studentId) evaluatedMemberIds.add(studentId);
          });
        }
        if (evaluation?.taskId) taskIds.add(evaluation.taskId);

        const evalTs =
          normalizeTimestamp(evaluation.taskDate) ||
          normalizeTimestamp(evaluation.updatedAt) ||
          normalizeTimestamp(evaluation.createdAt);
        if (evalTs && evalTs >= (latestEvalMeta.ts || 0)) {
          const partRate =
            groupStudents.length > 0 ? Math.min(100, (participantCount / groupStudents.length) * 100) : 0;
          latestEvalMeta = {
            ts: evalTs,
            avgPct: evalAvgPct ?? latestEvalMeta.avgPct,
            participants: participantCount,
            participationRate: partRate,
          };
        }
      });
      const averageScore = validEvalsCount > 0 ? totalPercentageScore / validEvalsCount : 0;
      const evaluatedMembers = evaluatedMemberIds.size;
      const taskCount = taskIds.size;
      const participationRate =
        groupStudents.length > 0 ? Math.min(100, (evaluatedMembers / groupStudents.length) * 100) : 0;
      return {
        group,
        groupName: group.name,
        studentCount: groupStudents.length,
        averageScore: averageScore,
        evalCount: validEvalsCount,
        evaluatedMembers,
        taskCount,
        participationRate,
        latestAverageScore: latestEvalMeta.avgPct,
        latestParticipantCount: latestEvalMeta.participants,
        latestParticipationRate: latestEvalMeta.participationRate,
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
    const palette = _getScorePalette(progress);
    elements.progressBar.style.width = `${progressInt}%`;
    elements.progressBar.style.background = `linear-gradient(90deg, ${palette.solid}, ${palette.solid})`;
    elements.progressBar.style.boxShadow = `0 8px 20px ${palette.shadow}`;
    elements.progressBar.className = 'h-full rounded-full transition-all duration-1000 ease-out';
  }
  if (elements.overallProgress) {
    elements.overallProgress.style.color = _getScorePalette(progress).solid;
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
  const formatLatestStats = (data = {}) => {
    const avgValue =
      typeof data.latestAverageScore === 'number' && !Number.isNaN(data.latestAverageScore)
        ? helpers.convertToBanglaNumber(data.latestAverageScore.toFixed(1))
        : '-';
    const participantValue =
      typeof data.latestParticipantCount === 'number' && data.latestParticipantCount !== null
        ? helpers.convertToBanglaNumber(String(data.latestParticipantCount))
        : '-';
    const participationValue =
      typeof data.latestParticipationRate === 'number' && !Number.isNaN(data.latestParticipationRate)
        ? helpers.convertToBanglaNumber(String(Math.round(data.latestParticipationRate)))
        : '-';

    return {
      avg: avgValue === '-' ? '-' : `${avgValue}%`,
      participants: participantValue === '-' ? '-' : `${participantValue} জন`,
      rate: participationValue === '-' ? '-' : `${participationValue}%`,
    };
  };

  const buildLatestMetricsSection = (stats) => `
    <div class="elite-latest-metrics">
      <div class="elite-metrics-title">
        <span class="elite-metrics-icon">
          <i class="fas fa-chart-line"></i>
        </span>
        <p class="elite-metrics-headline">সর্বশেষ এসাইনমেন্ট ফলাফল তথ্য</p>
      </div>
      <div class="elite-metrics-chips">
        <div class="elite-metric-chip">
          <span class="elite-metric-label">ফলাফল</span>
          <span class="elite-metric-value">${stats.avg}</span>
        </div>
        <div class="elite-metric-chip">
          <span class="elite-metric-label">অংশগ্রহণ</span>
          <span class="elite-metric-value">${stats.participants}</span>
        </div>
        <div class="elite-metric-chip">
          <span class="elite-metric-label">অংশগ্রহনের হার</span>
          <span class="elite-metric-value">${stats.rate}</span>
        </div>
      </div>
    </div>
  `;

  const podiumLabels = ['১ম স্থান', '২য় স্থান', '৩য় স্থান'];
  const podiumClasses = [
    'elite-podium-card relative rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white p-5 md:p-6 shadow-2xl ring-4 ring-yellow-300/60 dark:ring-yellow-400/50 order-1 md:order-2 cursor-pointer',
    'elite-podium-card relative rounded-3xl bg-gradient-to-br from-gray-100 via-gray-200 to-slate-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 text-gray-900 dark:text-gray-100 p-5 shadow-2xl ring-2 ring-slate-300/60 dark:ring-slate-400/40 order-2 md:order-1 cursor-pointer',
    'elite-podium-card relative rounded-3xl bg-gradient-to-br from-amber-200 via-orange-300 to-amber-400 dark:from-amber-700 dark:via-orange-600 dark:to-amber-700 text-gray-900 dark:text-white p-5 shadow-2xl ring-2 ring-amber-300/60 dark:ring-amber-500/50 order-3 md:order-3 cursor-pointer',
  ];
  const rankIcons = [
    '<i class="fa-solid fa-crown text-amber-400 dark:text-amber-200"></i>',
    '<i class="fa-solid fa-medal text-slate-700 dark:text-slate-200"></i>',
    '<i class="fa-solid fa-award text-amber-700 dark:text-amber-200"></i>',
  ];

  const nameFontConfig = [
    { max: 34, min: 18 },
    { max: 30, min: 16 },
    { max: 28, min: 15 },
  ];

  const fitEliteNames = () => {
    if (!elements.topGroupsContainer || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
    window.requestAnimationFrame(() => {
      const names = elements.topGroupsContainer.querySelectorAll('.elite-card-name');
      names.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const maxFont = parseFloat(el.dataset.maxFont || '') || parseFloat(computed.fontSize) || 22;
        const minFont = parseFloat(el.dataset.minFont || '') || Math.max(12, maxFont * 0.65);
        let currentSize = maxFont;
        el.style.fontSize = `${currentSize}px`;
        let safety = 0;
        while (currentSize > minFont && el.scrollWidth > el.clientWidth && safety < 25) {
          currentSize -= 0.5;
          el.style.fontSize = `${Math.max(currentSize, minFont)}px`;
          safety += 1;
        }
      });
    });
  };

  const buildPodiumCard = (data, index) => {
    if (!data) return '';
    const avgScore = typeof data.averageScore === 'number' ? data.averageScore : 0;
    const scoreValue = helpers.convertToBanglaNumber(avgScore.toFixed(1));
    const memberCount = typeof data.studentCount === 'number' ? data.studentCount : 0;
    const members = helpers.convertToBanglaNumber(memberCount);
    const latestStats = formatLatestStats(data);
    const metricsMarkup = buildLatestMetricsSection(latestStats);
    const groupName = _formatLabel(data.groupName);
    const fontConfig = nameFontConfig[index] || nameFontConfig[nameFontConfig.length - 1];
    const nameClass =
      index === 0 ? 'elite-card-name elite-name-xl font-semibold text-white' : 'elite-card-name elite-name-lg font-semibold text-gray-900 dark:text-white';
    const memberLineClass = index === 0 ? 'text-white/85' : 'text-gray-800/80 dark:text-white/80';
    const placeText = podiumLabels[index] || helpers.convertToBanglaRank(index + 1);
    const articleClass = podiumClasses[index] || podiumClasses[podiumClasses.length - 1];
    const rankIcon = rankIcons[index] || '<i class="fa-solid fa-trophy text-amber-700 dark:text-amber-200"></i>';
    return `
        <article class="${articleClass}" data-group-id="${data.group?.id}" role="button" tabindex="0" aria-pressed="false">
          <span class="elite-rank-chip">
            <span class="elite-rank-icon">${rankIcon}</span>
            <span class="elite-rank-title">${placeText}</span>
          </span>
          <div class="elite-card-inner">
            <div class="elite-score-stack">
              <span class="elite-score-value">${scoreValue}%</span>
              <span class="elite-score-label">মোট গড় স্কোর</span>
            </div>
            <div class="elite-card-body ${index === 0 ? 'space-y-1.5' : 'space-y-1'}">
              <div class="${nameClass}" title="${groupName}" data-max-font="${fontConfig.max}" data-min-font="${fontConfig.min}">${groupName}</div>
              <div class="${memberLineClass} text-xs sm:text-sm font-medium">
                <span>সদস্য:</span>
                <span>${members}</span>
              </div>
            </div>
            ${metricsMarkup}
          </div>
        </article>
      `;
  };

  const cards = top3
    .map((data, index) => buildPodiumCard(data, index))
    .join('');


  const topGroupColumns = ['grid', 'grid-cols-1', 'gap-6'];
  if (top3.length >= 2) topGroupColumns.push('sm:grid-cols-2');
  if (top3.length >= 3) topGroupColumns.push('md:grid-cols-3');

  elements.topGroupsContainer.innerHTML = `
    <div class="${topGroupColumns.join(' ')}">
      ${cards}
    </div>
  `;
  fitEliteNames();

  // Make elite group cards open the same group detail modal
  if (elements.topGroupsContainer && typeof window !== 'undefined' && typeof window.openGroupModalById === 'function') {
    uiManager.addListener(elements.topGroupsContainer, 'click', (e) => {
      const card = e.target.closest('[data-group-id]');
      if (!card) return;
      const gid = card.getAttribute('data-group-id');
      if (gid) {
        try { window.openGroupModalById(gid); } catch (err) { console.warn('Elite group modal open failed:', err); }
      }
    });
  }

  const topGroupsSection = elements.topGroupsContainer.closest('section');
  if (topGroupsSection) {
    const headerTitle = topGroupsSection.querySelector('h3');
    if (headerTitle) headerTitle.textContent = 'এলিট গ্রুপ';

    const headerSubtitle = topGroupsSection.querySelector('p.text-xs');
    if (headerSubtitle) {
      headerSubtitle.textContent = 'গড় মূল্যায়ন স্কোরে শীর্ষে থাকা দলগুলোকে এক নজরে দেখুন।';
    }

    const headerBadge = topGroupsSection.querySelector('span.bg-indigo-500\\/10');
    if (headerBadge) {
      const icon = headerBadge.querySelector('i');
      const iconHTML = icon ? icon.outerHTML : '';
      headerBadge.innerHTML = `${iconHTML} Elite Group`;
    }
  }
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
  const topThree = sortedAG.slice(0, 3);
  const cards = topThree
    .map(([name, data]) => {
      const avgScore = data.averageScore;
      const palette = _getScorePalette(avgScore);
      const progress = Math.min(100, Math.round(avgScore));
      const avgText = helpers.convertToBanglaNumber(avgScore.toFixed(1));
      const totalStudents = helpers.convertToBanglaNumber(data.totalStudents);
      const groupCount = helpers.convertToBanglaNumber(data.groupCount);
      const formattedName = _formatLabel(name);
      return `
        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br ${palette.gradient} opacity-60"></div>
          <div class="relative space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-base font-semibold text-gray-900 dark:text-white" title="${formattedName}">${formattedName}</h4>
              <span class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200 shadow">
                <i class="fas fa-signal"></i> গড়: ${avgText}%
              </span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div class="h-full rounded-full" style="width: ${progress}%; background: ${palette.solid}; box-shadow: 0 6px 12px ${palette.shadow};"></div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
              <span class="inline-flex items-center gap-2">
                <i class="fas fa-users text-indigo-500"></i> শিক্ষার্থী: ${totalStudents}
              </span>
              <span class="inline-flex items-center gap-2 justify-end">
                <i class="fas fa-layer-group text-emerald-500"></i> গ্রুপ: ${groupCount}
              </span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  const academicColumns = ['grid', 'grid-cols-1', 'gap-6'];
  if (topThree.length >= 2) academicColumns.push('sm:grid-cols-2');
  if (topThree.length >= 3) academicColumns.push('lg:grid-cols-3');

  elements.academicGroupStatsList.innerHTML = `
    <div class="${academicColumns.join(' ')}">
      ${cards}
    </div>
  `;
}

/** Renders group ranking list */
function _renderGroupsRanking(groupData) {
  if (!elements.groupsRankingList) return;
  uiManager.clearContainer(elements.groupsRankingList);
  const evaluatedGroups = groupData.filter((g) => g.evalCount > 0);
  if (evaluatedGroups.length === 0) {
    uiManager.displayEmptyMessage(elements.groupsRankingList, 'র‌্যাঙ্কিংয়ের জন্য ডেটা নেই।');
    return;
  }

  let rank = 0;
  let lastScore = -1;
  let lastEvalCount = -1;

  const html = evaluatedGroups
    .map((data, index) => {
      if (data.averageScore !== lastScore || data.evalCount !== lastEvalCount) {
        rank = index + 1;
        lastScore = data.averageScore;
        lastEvalCount = data.evalCount;
      }
      const rankText = helpers.convertToBanglaRank(rank);
      const evals = helpers.convertToBanglaNumber(data.evalCount);
      const students = helpers.convertToBanglaNumber(data.studentCount);
      const evaluatedMembers = helpers.convertToBanglaNumber(data.evaluatedMembers);
      const tasks = helpers.convertToBanglaNumber(data.taskCount);
      const palette = _getScorePalette(data.averageScore);
      const groupName = _formatLabel(data.groupName);
      const progressPercentage = Math.min(100, Math.round(data.averageScore));
      const progressBar = `
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div class="h-full rounded-full" style="width: ${progressPercentage}%; background: ${palette.solid}; box-shadow: 0 6px 12px ${palette.shadow};"></div>
        </div>
      `;
      const circleIndicatorContent = `
        ${_buildCircularMeter(data.averageScore, palette, 88)}
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">গড় স্কোর</span>
      `;
      return `
        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70 cursor-pointer" data-group-id="${data.group?.id}" role="button" tabindex="0">
          <div class="absolute inset-0 bg-gradient-to-r ${palette.gradient} opacity-60"></div>
          <div class="relative grid gap-5 md:grid-cols-[auto,1fr,auto] items-center">
            <div class="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/80 px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow dark:bg-white/10 dark:text-gray-200">
              <span class="text-xl font-bold">${rankText}</span>
              <span class="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Rank</span>
            </div>
            <div class="space-y-3 min-w-0">
              <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h4 class="text-base font-semibold text-gray-900 dark:text-white truncate" title="${groupName}">${groupName}</h4>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200 shadow">
                  <i class="fas fa-diagram-project text-indigo-500"></i> টাস্ক: ${tasks}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span class="inline-flex items-center gap-2">
                  <i class="fas fa-users text-sky-500"></i> মোট সদস্য: ${students}
                </span>
                <span class="inline-flex items-center gap-2 justify-end">
                  <i class="fas fa-user-check text-emerald-500"></i> মূল্যায়িত সদস্য: ${evaluatedMembers}
                </span>
                <span class="inline-flex items-center gap-2">
                  <i class="fas fa-clipboard-check text-purple-500"></i> সম্পন্ন মূল্যায়ন: ${evals}
                </span>
              </div>
              <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center md:hidden">
                ${progressBar}
                <div class="flex flex-col items-center gap-2">
                  ${circleIndicatorContent}
                </div>
              </div>
              <div class="hidden md:block">
                ${progressBar}
              </div>
            </div>
            <div class="hidden md:flex flex-col items-center gap-2">
              ${circleIndicatorContent}
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  elements.groupsRankingList.innerHTML = html;
  // Open group detail modal on click
  if (elements.groupsRankingList && window && typeof window.openGroupModalById === 'function') {
    uiManager.addListener(elements.groupsRankingList, 'click', (e) => {
      const card = e.target.closest('[data-group-id]');
      if (!card) return;
      const gid = card.getAttribute('data-group-id');
      if (gid) {
        try { window.openGroupModalById(gid); } catch (err) { console.warn('Group modal open failed:', err); }
      }
    });
  }
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

function _getScorePalette(score) {
  const numeric = Number(score) || 0;
  if (numeric >= 85) {
    return {
      solid: '#22c55e',
      soft: 'rgba(34,197,94,0.18)',
      gradient: 'from-emerald-500/15 via-emerald-400/10 to-transparent',
      shadow: 'rgba(34,197,94,0.28)',
    };
  }
  if (numeric >= 70) {
    return {
      solid: '#0ea5e9',
      soft: 'rgba(14,165,233,0.18)',
      gradient: 'from-sky-500/15 via-sky-400/10 to-transparent',
      shadow: 'rgba(14,165,233,0.25)',
    };
  }
  if (numeric >= 55) {
    return {
      solid: '#f59e0b',
      soft: 'rgba(245,158,11,0.18)',
      gradient: 'from-amber-500/15 via-amber-400/10 to-transparent',
      shadow: 'rgba(245,158,11,0.25)',
    };
  }
  return {
    solid: '#f43f5e',
    soft: 'rgba(244,63,94,0.18)',
    gradient: 'from-rose-500/15 via-rose-400/10 to-transparent',
    shadow: 'rgba(244,63,94,0.25)',
  };
}

function _buildCircularMeter(score, palette, size = 96) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const diameter = typeof size === 'number' ? size : 96;
  const displayValue = helpers.convertToBanglaNumber(Math.round(clamped).toString());
  return `
    <div class="relative flex items-center justify-center" style="width:${diameter}px;height:${diameter}px;">
      <div class="absolute inset-0 rounded-full" style="background: conic-gradient(${palette.solid} ${clamped}%, ${
    palette.soft
  } ${clamped}% 100%);"></div>
      <div class="absolute inset-[18%] rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-inner" style="box-shadow: 0 8px 18px ${palette.shadow};">
        <span class="text-lg font-semibold text-gray-800 dark:text-gray-100">${displayValue}%</span>
      </div>
    </div>
  `;
}
