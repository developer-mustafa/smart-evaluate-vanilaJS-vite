// js/components/ranking.js

// Dependencies
let stateManager, uiManager, dataService, helpers, app;

// DOM Elements
const elements = {};

// Ranking criteria from slide [cite: 284]
const MIN_EVALUATIONS_FOR_RANKING = 2;
const TOTAL_MAX_SCORE = 100;

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
  const studentPerformance = {};

  evaluations.forEach((evaluation) => {
    const task = taskMap.get(evaluation.taskId);
    const maxScore = parseFloat(evaluation.maxPossibleScore) || parseFloat(task?.maxScore) || TOTAL_MAX_SCORE;
    const evaluationTimestamp = _extractTimestamp(
      evaluation.taskDate || evaluation.updatedAt || evaluation.evaluationDate || evaluation.createdAt
    );

    if (maxScore > 0 && evaluation.scores) {
      Object.entries(evaluation.scores).forEach(([studentId, scoreData]) => {
        if (!studentPerformance[studentId]) {
          studentPerformance[studentId] = {
            totalPercentage: 0,
            count: 0,
            totalScore: 0,
            maxScoreSum: 0,
            taskIds: new Set(),
            latestMs: null,
          };
        }
        const totalScore = parseFloat(scoreData.totalScore) || 0;
        const percentage = (totalScore / maxScore) * 100;
        const record = studentPerformance[studentId];

        record.totalPercentage += percentage;
        record.totalScore += totalScore;
        record.maxScoreSum += maxScore;
        record.count++;
        if (evaluation.taskId) record.taskIds.add(evaluation.taskId);
        if (evaluationTimestamp) {
          record.latestMs = record.latestMs ? Math.max(record.latestMs, evaluationTimestamp) : evaluationTimestamp;
        }
      });
    }
  });

  const rankedList = students
    .map((student) => {
      const performance = studentPerformance[student.id];

      if (!performance || performance.count < MIN_EVALUATIONS_FOR_RANKING) {
        return null;
      }

      const averageScore = performance.totalPercentage / performance.count;
      const efficiency =
        performance.maxScoreSum > 0 ? (performance.totalScore / performance.maxScoreSum) * 100 : averageScore;

      return {
        student,
        averageScore,
        evalCount: performance.count,
        efficiencyScore: efficiency,
        taskCount: performance.taskIds.size,
        totalScore: performance.totalScore,
        maxScoreSum: performance.maxScoreSum,
        latestEvaluationMs: performance.latestMs,
        rank: 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.evalCount - a.evalCount;
    });

  let currentRank = 0;
  let lastScore = -1;
  let lastEvalCount = -1;
  rankedList.forEach((item, index) => {
    if (item.averageScore !== lastScore || item.evalCount !== lastEvalCount) {
      currentRank = index + 1;
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
  const totalRanked = rankedStudents.length;
  const aggregateAverage =
    rankedStudents.reduce((sum, item) => sum + item.averageScore, 0) / Math.max(totalRanked, 1);
  const totalEvaluations = rankedStudents.reduce((sum, item) => sum + item.evalCount, 0);
  const topPerformer = rankedStudents[0];
  const topScore = topPerformer?.averageScore ?? 0;
  const topName = topPerformer ? _formatLabel(topPerformer.student.name) : '-';
  const latestMs = rankedStudents.reduce(
    (max, item) => (item.latestEvaluationMs ? Math.max(max, item.latestEvaluationMs) : max),
    0
  );
  const latestDate =
    latestMs && helpers?.formatTimestamp
      ? helpers.formatTimestamp(new Date(latestMs))
      : latestMs
      ? new Date(latestMs).toLocaleDateString('bn-BD')
      : 'N/A';

  const summary = `
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white shadow-xl">
      <div class="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.35),_transparent_55%)]"></div>
      <div class="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
      <div class="relative p-6 md:p-10 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-white/70">Student Leaderboard</p>
            <h2 class="text-3xl md:text-4xl font-bold leading-tight">শিক্ষার্থী র‌্যাঙ্কিং ইনসাইট</h2>
            <p class="mt-2 max-w-xl text-sm md:text-base text-white/75 leading-relaxed">
              ধারাবাহিক পারফরম্যান্স, মূল্যায়নে অংশগ্রহণ এবং টাস্ক সম্পন্নতার উপর ভিত্তি করে শীর্ষ শিক্ষার্থীদের তালিকা।
              তথ্য দেখুন, অনুপ্রাণিত হোন, এবং সেরা ফলাফলের লক্ষ্যে দলকে এগিয়ে রাখুন।
            </p>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white tracking-widest uppercase">
            <i class="fas fa-sync-alt"></i> শেষ আপডেট: ${latestDate}
          </span>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur">
            <p class="text-xs uppercase tracking-wide text-white/70">র‌্যাঙ্কিংয়ে অন্তর্ভুক্ত</p>
            <p class="mt-2 text-2xl font-semibold">${helpers.convertToBanglaNumber(totalRanked)}</p>
            <p class="text-xs text-white/70 mt-1">যোগ্য শিক্ষার্থী</p>
          </div>
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur">
            <p class="text-xs uppercase tracking-wide text-white/70">গড় স্কোর</p>
            <p class="mt-2 text-2xl font-semibold">${helpers.convertToBanglaNumber(aggregateAverage.toFixed(1))}%</p>
            <p class="text-xs text-white/70 mt-1">সকল শিক্ষার্থীর গড়</p>
          </div>
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur">
            <p class="text-xs uppercase tracking-wide text-white/70">মোট মূল্যায়ন</p>
            <p class="mt-2 text-2xl font-semibold">${helpers.convertToBanglaNumber(totalEvaluations)}</p>
            <p class="text-xs text-white/70 mt-1">সম্পন্ন হয়েছে</p>
          </div>
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur">
            <p class="text-xs uppercase tracking-wide text-white/70">সেরা পারফরমার</p>
            <p class="mt-2 text-sm font-semibold text-white/90" title="${topName}">${topName}</p>
            <p class="text-xs text-white/70 mt-1">স্কোর: ${helpers.convertToBanglaNumber(topScore.toFixed(1))}%</p>
          </div>
        </div>
      </div>
    </section>
  `;

  const cards = rankedStudents
    .map((item) => {
      const student = item.student;
      const rankText = helpers.convertToBanglaRank(item.rank);
      const score = helpers.convertToBanglaNumber(item.averageScore.toFixed(1));
      const efficiency = helpers.convertToBanglaNumber(Math.round(item.efficiencyScore || item.averageScore));
      const evals = helpers.convertToBanglaNumber(item.evalCount);
      const tasks = helpers.convertToBanglaNumber(item.taskCount);
      const groupName = groupsMap.get(student.groupId) || 'গ্রুপ নেই';
      const palette = _getScorePalette(item.averageScore);
      const lastEvaluated = item.latestEvaluationMs
        ? helpers?.formatTimestamp
          ? helpers.formatTimestamp(new Date(item.latestEvaluationMs))
          : new Date(item.latestEvaluationMs).toLocaleDateString('bn-BD')
        : 'N/A';

      return `
        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-700/70 dark:bg-gray-900/75">
          <div class="absolute inset-0 bg-gradient-to-br ${palette.gradient} opacity-60"></div>
          <div class="relative grid gap-5 md:grid-cols-[auto,1fr,auto] items-center">
            <div class="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/85 px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow dark:bg-white/10 dark:text-gray-200">
              <span class="text-xl font-bold">${rankText}</span>
              <span class="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Rank</span>
            </div>
            <div class="space-y-3 min-w-0">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0">
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white truncate" title="${_formatLabel(
                    student.name
                  )}">${_formatLabel(student.name)}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    রোল: ${helpers.convertToBanglaNumber(student.roll)} · ${student.academicGroup || 'শাখা নেই'}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">গ্রুপ: ${_formatLabel(groupName)}</p>
                </div>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200 shadow">
                  <i class="fas fa-clock text-amber-500"></i> সর্বশেষ: ${lastEvaluated}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span class="inline-flex items-center gap-2">
                  <i class="fas fa-chart-line text-indigo-500"></i> গড় স্কোর: ${score}%
                </span>
                <span class="inline-flex items-center gap-2 justify-end">
                  <i class="fas fa-tasks text-emerald-500"></i> টাস্ক কভারেজ: ${tasks}
                </span>
                <span class="inline-flex items-center gap-2">
                  <i class="fas fa-clipboard-check text-purple-500"></i> মূল্যায়ন: ${evals}
                </span>
                <span class="inline-flex items-center gap-2 justify-end">
                  <i class="fas fa-bullseye text-pink-500"></i> দক্ষতা: ${efficiency}%
                </span>
              </div>
            </div>
            <div class="flex flex-col items-center gap-3">
              ${_buildCircularMeter(item.averageScore, palette, 90)}
              <button class="view-rank-details-btn inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
                data-student-id="${student.id}" aria-label="শিক্ষার্থীর পূর্ণ ফলাফল দেখুন">
                <i class="fas fa-eye"></i> বিস্তারিত
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  elements.studentRankingListContainer.innerHTML = `
    <div class="space-y-8">
      ${summary}
      <div class="space-y-5">
        ${cards}
      </div>
    </div>
  `;
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
      gradient: 'from-emerald-500/15 via-emerald-400/10 to-transparent',
      shadow: 'rgba(34,197,94,0.28)',
    };
  }
  if (numeric >= 70) {
    return {
      solid: '#0ea5e9',
      gradient: 'from-sky-500/15 via-sky-400/10 to-transparent',
      shadow: 'rgba(14,165,233,0.25)',
    };
  }
  if (numeric >= 55) {
    return {
      solid: '#f59e0b',
      gradient: 'from-amber-500/15 via-amber-400/10 to-transparent',
      shadow: 'rgba(245,158,11,0.25)',
    };
  }
  return {
    solid: '#f43f5e',
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
      <div class="absolute inset-0 rounded-full" style="background: conic-gradient(${palette.solid} ${clamped}%, rgba(255,255,255,0.12) ${clamped}% 100%);"></div>
      <div class="absolute inset-[18%] rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-inner" style="box-shadow: 0 8px 18px ${palette.shadow};">
        <span class="text-lg font-semibold text-gray-800 dark:text-gray-100">${displayValue}%</span>
      </div>
    </div>
  `;
}

function _extractTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate().getTime();
      } catch (error) {
        return null;
      }
    }
    if (typeof value.seconds === 'number') {
      return value.seconds * 1000;
    }
  }
  return null;
}
