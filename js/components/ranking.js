// js/components/ranking.js

// Dependencies
let stateManager, uiManager, dataService, helpers, app;

// DOM Elements
const elements = {};

// Ranking criteria (kept for safety)
const MIN_EVALUATIONS_FOR_RANKING = 1;
const TOTAL_MAX_SCORE = 100; // fallback (evaluation.maxPossibleScore preferred)

/* -----------------------------
   Soft Neumorphic 3D (light/dark)
   — inspired by your toggle references
------------------------------ */
function _ensureSoft3DStyles() {
  if (document.getElementById('ranking-soft3d-styles')) return;
  const style = document.createElement('style');
  style.id = 'ranking-soft3d-styles';
  style.textContent = `
  .rk-surface{
    border-radius: 1.1rem;
    background: var(--rk-bg, #fff);
    box-shadow:
      8px 8px 20px rgba(0,0,0,.08),
      -6px -6px 16px rgba(255,255,255,.7),
      inset 0 1px 0 rgba(255,255,255,.45);
  }
  .dark .rk-surface{
    --rk-bg: rgba(17,24,39,.9);
    box-shadow:
      10px 10px 26px rgba(0,0,0,.45),
      -6px -6px 14px rgba(255,255,255,.06),
      inset 0 1px 0 rgba(255,255,255,.08);
  }

  .rk-chip{
    border-radius: .75rem;
    background: rgba(255,255,255,.8);
    border: 1px solid rgba(0,0,0,.06);
    box-shadow:
      0 1px 0 rgba(255,255,255,.6) inset,
      0 2px 6px rgba(0,0,0,.06);
  }
  .dark .rk-chip{
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.08);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.08),
      0 2px 6px rgba(0,0,0,.35);
  }

  .rk-card{
    border-radius: 1rem;
    background: var(--rk-bg, #fff);
    border: 1px solid rgba(0,0,0,.06);
    box-shadow:
      6px 6px 16px rgba(0,0,0,.08),
      -4px -4px 12px rgba(255,255,255,.7),
      inset 0 1px 0 rgba(255,255,255,.45);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .rk-card:hover{ transform: translateY(-1px); }
  .dark .rk-card{
    border-color: rgba(255,255,255,.08);
    box-shadow:
      10px 10px 24px rgba(0,0,0,.45),
      -6px -6px 14px rgba(255,255,255,.06),
      inset 0 1px 0 rgba(255,255,255,.08);
  }

  .rk-micro{
    font-size: 11px;
    line-height: 1.1;
  }
  `;
  document.head.appendChild(style);
}

/**
 * Initializes the Ranking component.
 */
export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  dataService = dependencies.services.dataService;
  helpers = dependencies.utils;
  app = dependencies.app;

  _ensureSoft3DStyles();
  _cacheDOMElements();
  _setupEventListeners();

  console.log('✅ Ranking component initialized.');

  return { render };
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
    const { students, evaluations, tasks, groups } = stateManager.getState();

    if (!students || !evaluations || !tasks) {
      uiManager.displayEmptyMessage(elements.studentRankingListContainer, 'র‍্যাঙ্কিং গণনার জন্য ডেটা লোড হচ্ছে...');
      return;
    }

    const rankedStudents = _calculateStudentRankings(students, evaluations, tasks);
    const rankedGroups = _calculateGroupRankings(students, evaluations, groups || []);

    _renderRankingList(rankedStudents, rankedGroups, groups || [], students);
  } catch (error) {
    console.error('❌ Error rendering student ranking:', error);
    uiManager.displayEmptyMessage(elements.studentRankingListContainer, 'র‍্যাঙ্কিং লোড করতে একটি ত্রুটি ঘটেছে।');
  } finally {
    uiManager.hideLoading();
  }
}

/* ---------------- DOM Cache & Events ---------------- */

function _cacheDOMElements() {
  elements.page = document.getElementById('page-student-ranking');
  if (elements.page) {
    elements.refreshRankingBtn = elements.page.querySelector('#refreshRanking');
    elements.studentRankingListContainer = elements.page.querySelector('#studentRankingList');
  } else {
    console.error('❌ Ranking init failed: #page-student-ranking element not found!');
  }
}

function _setupEventListeners() {
  if (!elements.page) return;
  uiManager.addListener(elements.refreshRankingBtn, 'click', async () => {
    uiManager.showLoading('র‍্যাঙ্কিং রিফ্রেশ করা হচ্ছে...');
    try {
      await app.refreshAllData();
    } catch (error) {
      console.error('❌ Error refreshing ranking data:', error);
      uiManager.showToast('র‍্যাঙ্কিং রিফ্রেশ করতে সমস্যা হয়েছে।', 'error');
    }
  });

  uiManager.addListener(elements.studentRankingListContainer, 'click', (e) => {
    const target = e.target.closest('[data-student-id]') || e.target.closest('.ranking-card');
    if (!target) return;
    const id = target.getAttribute('data-student-id');
    if (id && typeof window !== 'undefined' && typeof window.openStudentModalById === 'function') {
      e.preventDefault();
      try {
        window.openStudentModalById(id);
      } catch {}
    }
  });
}

/* =========================================================
   RANKING LOGIC (unchanged priority)
   1) Average mark % DESC (efficiency)
   2) Evaluations DESC
   3) TotalScore DESC
   4) MaxPossible DESC
   5) Latest time DESC
   (All % shown with 2 decimals)
========================================================= */

function _calculateStudentRankings(students, evaluations, tasks) {
  if (!students || !evaluations || !tasks) return [];

  const studentPerf = {};

  evaluations.forEach((evaluation) => {
    const maxScore = parseFloat(evaluation.maxPossibleScore) || 60;
    const ts = _extractTimestamp(
      evaluation.taskDate || evaluation.updatedAt || evaluation.evaluationDate || evaluation.createdAt
    );
    const scores = evaluation.scores || {};

    Object.entries(scores).forEach(([studentId, scoreData]) => {
      if (!studentPerf[studentId]) {
        studentPerf[studentId] = { evalCount: 0, totalScore: 0, maxScoreSum: 0, latestMs: null };
      }
      const totalScore = parseFloat(scoreData.totalScore) || 0;
      const rec = studentPerf[studentId];
      rec.evalCount += 1;
      rec.totalScore += totalScore;
      rec.maxScoreSum += maxScore;
      if (ts) rec.latestMs = rec.latestMs ? Math.max(rec.latestMs, ts) : ts;
    });
  });

  const ranked = students
    .map((stu) => {
      const perf = studentPerf[stu.id];
      if (!perf || perf.evalCount < MIN_EVALUATIONS_FOR_RANKING) return null;
      const efficiency = perf.maxScoreSum > 0 ? (perf.totalScore / perf.maxScoreSum) * 100 : 0;
      return {
        student: stu,
        evalCount: perf.evalCount,
        totalScore: perf.totalScore,
        maxScoreSum: perf.maxScoreSum,
        efficiency,
        latestEvaluationMs: perf.latestMs || null,
        rank: 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
      if (b.evalCount !== a.evalCount) return b.evalCount - a.evalCount;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.maxScoreSum !== a.maxScoreSum) return b.maxScoreSum - a.maxScoreSum;
      return (b.latestEvaluationMs || 0) - (a.latestEvaluationMs || 0);
    });

  ranked.forEach((x, i) => (x.rank = i + 1));
  return ranked;
}

/**
 * Group ranking with extra metrics:
 * - participantsCount (unique students who got scored)
 * - groupSize (total members in the group)
 * - remainingCount = groupSize - participantsCount (not negative)
 */
function _calculateGroupRankings(students, evaluations, groups) {
  if (!students || !evaluations) return [];

  const groupNameMap = new Map((groups || []).map((g) => [g.id, g.name || 'গ্রুপ']));
  const studentToGroup = new Map((students || []).map((s) => [s.id, s.groupId || '__none']));

  // group size map
  const groupSize = {};
  (students || []).forEach((s) => {
    const gid = s.groupId || '__none';
    groupSize[gid] = (groupSize[gid] || 0) + 1;
  });

  const groupAgg = {}; // gid -> { evalCount, totalScore, maxScoreSum, latestMs, participants: Set }
  evaluations.forEach((evaluation) => {
    const maxScore = parseFloat(evaluation.maxPossibleScore) || 60;
    const ts = _extractTimestamp(
      evaluation.taskDate || evaluation.updatedAt || evaluation.evaluationDate || evaluation.createdAt
    );
    const scores = evaluation.scores || {};
    Object.entries(scores).forEach(([studentId, scoreData]) => {
      const gid = studentToGroup.get(studentId) || '__none';
      if (!groupAgg[gid]) {
        groupAgg[gid] = { evalCount: 0, totalScore: 0, maxScoreSum: 0, latestMs: null, participants: new Set() };
      }
      const totalScore = parseFloat(scoreData.totalScore) || 0;
      const rec = groupAgg[gid];
      rec.evalCount += 1; // total evaluation entries
      rec.totalScore += totalScore;
      rec.maxScoreSum += maxScore;
      rec.participants.add(studentId);
      if (ts) rec.latestMs = rec.latestMs ? Math.max(rec.latestMs, ts) : ts;
    });
  });

  const rankedGroups = Object.entries(groupAgg)
    .map(([gid, agg]) => {
      if (agg.evalCount < MIN_EVALUATIONS_FOR_RANKING) return null;
      const efficiency = agg.maxScoreSum > 0 ? (agg.totalScore / agg.maxScoreSum) * 100 : 0;
      const groupTotal = groupSize[gid] || 0;
      const participantsCount = agg.participants.size;
      const remainingCount = Math.max(0, groupTotal - participantsCount);
      return {
        groupId: gid,
        groupName: groupNameMap.get(gid) || 'গ্রুপ নেই',
        evalCount: agg.evalCount,
        totalScore: agg.totalScore,
        maxScoreSum: agg.maxScoreSum,
        efficiency,
        latestEvaluationMs: agg.latestMs || null,
        participantsCount,
        groupSize: groupTotal,
        remainingCount,
        rank: 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
      if (b.evalCount !== a.evalCount) return b.evalCount - a.evalCount;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.maxScoreSum !== a.maxScoreSum) return b.maxScoreSum - a.maxScoreSum;
      return (b.latestEvaluationMs || 0) - (a.latestEvaluationMs || 0);
    });

  rankedGroups.forEach((g, i) => (g.rank = i + 1));
  return rankedGroups;
}

/* ---------------- Render ---------------- */

function _renderRankingList(rankedStudents, rankedGroups, groups, students) {
  if (!elements.studentRankingListContainer) return;

  uiManager.clearContainer(elements.studentRankingListContainer);

  if (rankedStudents.length === 0) {
    uiManager.displayEmptyMessage(
      elements.studentRankingListContainer,
      `কোনো শিক্ষার্থী র‍্যাঙ্কিংয়ের জন্য যোগ্য নয় (কমপক্ষে ${helpers.convertToBanglaNumber(
        MIN_EVALUATIONS_FOR_RANKING
      )} টি মূল্যায়নে অংশ নিতে হবে)।`
    );
    return;
  }

  const groupsMap = new Map((groups || []).map((g) => [g.id, g.name]));
  const totalRanked = rankedStudents.length;
  const totalEvaluations = rankedStudents.reduce((sum, item) => sum + item.evalCount, 0);
  const top = rankedStudents[0];
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

  const formatPct2 = (n) => {
    const str = (Number(n) || 0).toFixed(2);
    return helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(str) : str;
  };
  const formatInt = (n) => {
    const str = `${Math.round(Number(n) || 0)}`;
    return helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(str) : str;
  };
  const formatNum2 = (n) => {
    const str = (Number(n) || 0).toFixed(2);
    return helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(str) : str;
  };

  const summary = `
    <section class="rk-surface text-white p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl md:text-3xl font-bold">Leaderboard (Average% → Evaluations)</h2>
          <p class="text-white/80 text-sm mt-1">বারে “Total / Max” দেখানো হচ্ছে।</p>
        </div>
        <span class="rk-chip px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-white/15">
          <i class="fas fa-sync-alt"></i> শেষ আপডেট: ${latestDate}
        </span>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-5">
        <div class="rk-card p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/90">
          <p class="rk-micro text-gray-500 dark:text-gray-400">যোগ্য শিক্ষার্থী</p>
          <p class="text-2xl font-semibold mt-1">${formatInt(totalRanked)}</p>
        </div>
        <div class="rk-card p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/90">
          <p class="rk-micro text-gray-500 dark:text-gray-400">মোট মূল্যায়ন</p>
          <p class="text-2xl font-semibold mt-1">${formatInt(totalEvaluations)}</p>
        </div>
        <div class="rk-card p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/90">
          <p class="rk-micro text-gray-500 dark:text-gray-400">শীর্ষ শিক্ষার্থী</p>
          <p class="mt-1 font-semibold truncate" title="${_formatLabel(top.student.name)}">${_formatLabel(
    top.student.name
  )}</p>
          <p class="rk-micro text-gray-500 dark:text-gray-400 mt-1">Average: ${formatPct2(top.efficiency)}%</p>
        </div>
        <div class="rk-card p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/90">
          <p class="rk-micro text-gray-500 dark:text-gray-400">Criteria</p>
          <p class="mt-1 text-sm font-semibold">Average% → #Evaluations → Total → Max → Latest</p>
        </div>
      </div>
    </section>
  `;

  /* ---------- STUDENT CARDS ---------- */
  const studentCards = rankedStudents
    .map((item) => {
      const s = item.student;
      const rankText = _toBnRank(item.rank);
      const avgPct = formatPct2(item.efficiency);
      const evals = formatInt(item.evalCount);
      const totalMark = formatNum2(item.totalScore);
      const maxPossible = formatNum2(item.maxScoreSum);
      const groupName = groupsMap.get(s.groupId) || 'গ্রুপ নেই';
      const palette = _getScorePalette(item.efficiency);
      const barPct = Math.max(0, Math.min(100, item.maxScoreSum > 0 ? (item.totalScore / item.maxScoreSum) * 100 : 0));

      const info3col = `
        <div class="grid grid-cols-3 gap-2 text-[12px] font-semibold mt-2">
          <div class="rk-chip px-2 py-1 text-gray-800 dark:text-gray-100"><i class="fas fa-percent mr-1 text-indigo-500"></i>${avgPct}%</div>
          <div class="rk-chip px-2 py-1 text-gray-800 dark:text-gray-100"><i class="fas fa-clipboard-check mr-1 text-emerald-500"></i>${evals}</div>
          <div class="rk-chip px-2 py-1 text-gray-800 dark:text-gray-100"><i class="fas fa-scale-balanced mr-1 text-amber-500"></i>${totalMark} / ${maxPossible}</div>
        </div>
      `;

      return `
        <article class="ranking-card rk-card bg-white dark:bg-gray-900/90 border-0 p-4 text-gray-900 dark:text-gray-100" data-student-id="${
          s.id
        }">
          <div class="flex items-start gap-3">
            <div class="rk-chip px-3 py-2 text-center">
              <div class="text-base font-bold">${rankText}</div>
              <div class="rk-micro text-gray-500 dark:text-gray-400 uppercase tracking-widest">Rank</div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 min-w-0">
                <h4 class="font-semibold truncate" title="${_formatLabel(s.name)}">${_formatLabel(s.name)}</h4>
                ${_renderRoleBadge(s.role)}
              </div>
              <p class="rk-micro text-gray-500 dark:text-gray-400 mt-1">রোল: ${helpers.convertToBanglaNumber(
                s.roll
              )} · ${s.academicGroup || 'শাখা নেই'} · গ্রুপ: ${_formatLabel(groupName)}</p>

              ${info3col}

              <div class="mt-3">
                <div class="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700/60 overflow-hidden">
                  <div class="h-full rounded-full" style="width:${barPct}%; background:${palette.solid};"></div>
                </div>
                <div class="rk-micro font-semibold text-gray-800 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                  <i class="fas fa-scale-balanced text-amber-500"></i>
                  <span>Total / Max: ${totalMark} / ${maxPossible}</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-center gap-2">
              ${_buildCircularMeter(item.efficiency, palette, 78)}
              <span class="rk-chip px-2 py-0.5 rk-micro text-gray-800 dark:text-gray-100">Average%</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  /* ---------- GROUP CARDS (with participants/remaining) ---------- */
  const groupCards =
    (rankedGroups || []).length > 0
      ? rankedGroups
          .map((g) => {
            const rank = _toBnRank(g.rank);
            const avgPct = formatPct2(g.efficiency);
            const evals = formatInt(g.evalCount);
            const totalMark = formatNum2(g.totalScore);
            const maxPossible = formatNum2(g.maxScoreSum);
            const palette = _getScorePalette(g.efficiency);
            const barPct = Math.max(0, Math.min(100, g.maxScoreSum > 0 ? (g.totalScore / g.maxScoreSum) * 100 : 0));

            const info3col = `
              <div class="grid grid-cols-3 gap-2 text-[12px] font-semibold mt-2">
                <div class="rk-chip px-2 py-1 text-gray-800 dark:text-gray-100"><i class="fas fa-percent mr-1 text-indigo-500"></i>${avgPct}%</div>
                <div class="rk-chip px-2 py-1 text-gray-800 dark:text-gray-100"><i class="fas fa-clipboard-check mr-1 text-emerald-500"></i>${evals}</div>
                <div class="rk-chip px-2 py-1 text-gray-800 dark:text-gray-100"><i class="fas fa-scale-balanced mr-1 text-amber-500"></i>${totalMark} / ${maxPossible}</div>
              </div>
            `;

            // participants vs remaining panel
            const peopleBar = `
              <div class="mt-2 grid grid-cols-3 gap-2 rk-micro text-gray-700 dark:text-gray-300">
                <div class="rk-chip px-2 py-1 text-center"><i class="fas fa-users mr-1"></i>মোট: ${formatInt(
                  g.groupSize
                )}</div>
                <div class="rk-chip px-2 py-1 text-center"><i class="fas fa-user-check mr-1 text-emerald-600"></i>অংশগ্রহণ: ${formatInt(
                  g.participantsCount
                )}</div>
                <div class="rk-chip px-2 py-1 text-center"><i class="fas fa-user-clock mr-1 text-rose-500"></i>বাকি: ${formatInt(
                  g.remainingCount
                )}</div>
              </div>
            `;

            return `
            <article class="rk-card bg-white dark:bg-gray-900/90 border-0 p-4 text-gray-900 dark:text-gray-100">
              <div class="flex items-start gap-3">
                <div class="rk-chip px-3 py-2 text-center">
                  <div class="text-base font-bold">${rank}</div>
                  <div class="rk-micro text-gray-500 dark:text-gray-400 uppercase tracking-widest">Group</div>
                </div>

                <div class="min-w-0 flex-1">
                  <h4 class="font-semibold truncate" title="${_formatLabel(g.groupName)}">${_formatLabel(
              g.groupName
            )}</h4>

                  ${info3col}
                  ${peopleBar}

                  <div class="mt-3">
                    <div class="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700/60 overflow-hidden">
                      <div class="h-full rounded-full" style="width:${barPct}%; background:${palette.solid};"></div>
                    </div>
                    <div class="rk-micro font-semibold text-gray-800 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                      <i class="fas fa-scale-balanced text-amber-500"></i>
                      <span>Total / Max: ${totalMark} / ${maxPossible}</span>
                    </div>
                  </div>

                  <div class="rk-micro text-gray-700 dark:text-gray-200 mt-2 flex items-center gap-1.5">
                    <i class="fas fa-chart-line text-sky-500"></i>
                    <span>মূল্যায়নে অংশগ্রহণ: ${evals}</span>
                  </div>
                </div>

                <div class="flex flex-col items-center gap-2">
                  ${_buildCircularMeter(g.efficiency, palette, 78)}
                  <span class="rk-chip px-2 py-0.5 rk-micro text-gray-800 dark:text-gray-100">Group Avg%</span>
                </div>
              </div>
            </article>
            `;
          })
          .join('')
      : `<div class="rk-card p-4 text-gray-700 dark:text-gray-300">গ্রুপ র‍্যাঙ্কিং প্রদর্শনের মতো তথ্য পাওয়া যায়নি।</div>`;

  elements.studentRankingListContainer.innerHTML = `
    <div class="space-y-8">
      ${summary}

      <!-- Students -->
      <section class="space-y-3">
        <header class="px-4 py-3 rk-surface text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/90">
          <h3 class="font-semibold">শিক্ষার্থী র‍্যাঙ্কিং</h3>
          <p class="rk-micro text-gray-500 dark:text-gray-400">প্রাধান্য: Average% → অংশগ্রহণ → Total → Max → Latest</p>
        </header>
        <div class="grid gap-4 grid-cols-1">
          ${studentCards}
        </div>
      </section>

      <!-- Groups -->
      <section class="space-y-3">
        <header class="px-4 py-3 rk-surface text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/90">
          <h3 class="font-semibold">গ্রুপ র‍্যাঙ্কিং</h3>
          <p class="rk-micro text-gray-500 dark:text-gray-400">একই নিয়ম—Average% → অংশগ্রহণ → Total → Max → Latest</p>
        </header>
        <div class="grid gap-4 grid-cols-1">
          ${groupCards}
        </div>
      </section>
    </div>
  `;
}

/* ---------------- helpers ---------------- */

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
  const n = Number(score) || 0;
  if (n >= 85) return { solid: '#22c55e', shadow: 'rgba(34,197,94,0.28)' };
  if (n >= 70) return { solid: '#0ea5e9', shadow: 'rgba(14,165,233,0.25)' };
  if (n >= 55) return { solid: '#f59e0b', shadow: 'rgba(245,158,11,0.25)' };
  return { solid: '#f43f5e', shadow: 'rgba(244,63,94,0.25)' };
}

const ROLE_BADGE_META = {
  'team-leader': {
    label: 'টিম লিডার',
    icon: 'fa-crown',
    className:
      'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-50 dark:border-amber-400/30',
  },
  'time-keeper': {
    label: 'টাইম কিপার',
    icon: 'fa-stopwatch',
    className:
      'bg-sky-100 text-sky-900 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-50 dark:border-sky-400/30',
  },
  reporter: {
    label: 'রিপোর্টার',
    icon: 'fa-pen-nib',
    className:
      'bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-50 dark:border-purple-400/30',
  },
  'resource-manager': {
    label: 'রিসোর্স ম্যানেজার',
    icon: 'fa-box-open',
    className:
      'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-50 dark:border-emerald-400/30',
  },
  'peace-maker': {
    label: 'পিস মেকার',
    icon: 'fa-dove',
    className:
      'bg-rose-100 text-rose-900 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-50 dark:border-rose-400/30',
  },
};

function _renderRoleBadge(roleCode) {
  const role = (roleCode || '').toString().trim();
  if (!role) return '';
  const meta =
    ROLE_BADGE_META[role] || {
      label: role,
      icon: 'fa-id-badge',
      className:
        'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-600/50',
    };
  const label = _formatLabel(meta.label || role);
  return `<span class="rk-chip px-2 py-0.5 rk-micro font-semibold ${meta.className}"><i class="fas ${meta.icon} mr-1"></i>${label}</span>`;
}

/** compact circular meter */
function _buildCircularMeter(percent, palette, size = 78) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const display = helpers?.convertToBanglaNumber
    ? helpers.convertToBanglaNumber(clamped.toFixed(2))
    : clamped.toFixed(2);
  const d = typeof size === 'number' ? size : 78;
  return `
    <div class="relative flex items-center justify-center" style="width:${d}px;height:${d}px;">
      <div class="absolute inset-0 rounded-full" style="background: conic-gradient(${palette.solid} ${clamped}%, rgba(0,0,0,0.08) ${clamped}% 100%);"></div>
      <div class="absolute inset-[18%] rounded-full bg-white dark:bg-gray-900 flex items-center justify-center" style="box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 8px 18px ${palette.shadow};">
        <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">${display}%</span>
      </div>
    </div>
  `;
}

function _toBnRank(n) {
  const raw = `#${n}`;
  return helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(raw) : raw;
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
      } catch {
        return null;
      }
    }
    if (typeof value.seconds === 'number') return value.seconds * 1000;
  }
  return null;
}
