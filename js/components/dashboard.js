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
      uiManager.displayEmptyMessage(elements.page, 'ডেটা এখনো লোড হচ্ছে...');
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
    <div class="max-w-7xl mx-auto space-y-3">
      <section class="relative overflow-hidden rounded-3xl border border-slate-800/30 bg-gradient-to-br from-slate-950 via-indigo-900 to-slate-800 text-white shadow-lg">
        <div class="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_60%)]"></div>
        <div class="relative px-4 py-4 sm:px-5 lg:px-7">
          <div class="space-y-4">
            <div class="grid gap-4 lg:grid-cols-2 items-stretch">
              <article class="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 backdrop-blur-sm shadow-sm flex flex-col h-full">
                <div class="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <i class="fas fa-gem text-rose-200"></i>
                    ৪টি মূল্যায়ন মানদণ্ড
                  </span>
                  <span class="text-white/70 text-[0.7rem]">Task · Team · Extra · MCQ</span>
                </div>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <div class="flex items-center gap-3 rounded-xl border border-amber-200/25 bg-white/10 px-3 py-3 text-white text-sm">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/30 text-amber-100">
                      <i class="fas fa-clipboard-check text-xs"></i>
                    </span>
                    <div>
                      <p class="font-semibold">টাস্ক মার্কস</p>
                      <p class="text-[0.75rem] text-white/65">স্বতন্ত্র টাস্ক ও মান যাচাই।</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 rounded-xl border border-emerald-200/25 bg-white/10 px-3 py-3 text-white text-sm">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300/30 text-emerald-100">
                      <i class="fas fa-people-group text-xs"></i>
                    </span>
                    <div>
                      <p class="font-semibold">টিম মার্কস</p>
                      <p class="text-[0.75rem] text-white/65">দলগত সমন্বয় ও উপস্থাপনা।</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 rounded-xl border border-rose-200/25 bg-white/10 px-3 py-3 text-white text-sm">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-rose-300/30 text-rose-100">
                      <i class="fas fa-star text-xs"></i>
                    </span>
                    <div>
                      <p class="font-semibold">অতিরিক্ত মূল্যায়ন</p>
                      <p class="text-[0.75rem] text-white/65">শেখা, অনুশীলন, নৈতিকতা।</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 rounded-xl border border-sky-200/25 bg-white/10 px-3 py-3 text-white text-sm">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-300/30 text-sky-100">
                      <i class="fas fa-question-circle text-xs"></i>
                    </span>
                    <div>
                      <p class="font-semibold">MCQ মার্কস</p>
                      <p class="text-[0.75rem] text-white/65">ধারণা ও দ্রুত প্রতিক্রিয়া।</p>
                    </div>
                  </div>
                </div>
              </article>
              <article class="rounded-2xl border border-white/15 bg-white/95 p-4 text-slate-900 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/85 dark:text-white h-full">
                <div class="space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-white/80">
                        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                          <i class="fas fa-scroll text-xs"></i>
                        </span>
                        সর্বশেষ এসাইনমেন্ট
                      </p>
                       <span class="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-amber-200/40 bg-amber-100 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
                        <i class="fas fa-bolt text-[0.65rem]"></i>
                        লাইভ
                      </span>
                      <p id="latestTaskTitle" class="mt-1 text-2xl font-semibold text-slate-900 dark:text-white max-w-[22rem] truncate" title="-">-</p>
                      <p class="text-xs text-slate-500 dark:text-white/60">আপডেট: <span id="latestAssignmentUpdated">-</span></p>
                    </div>
                 
                  </div>
                  <div class="space-y-4">
                    <div class="relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-sm dark:border-white/10 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800/70">
                     
                      <div class="flex w-full flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-white/80 md:flex-row md:items-center md:gap-4 pr-4 md:pr-6">
                        <div class="inline-flex flex-wrap items-center gap-2">
                          <span class="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-slate-700 dark:bg-white/10 dark:text-white">
                            <i class="fas fa-chart-simple text-xs text-indigo-500"></i>
                            ফলাফল প্রদানের আপডেট
                          </span>
                        </div>
                               <div class="relative h-6 w-full overflow-hidden rounded-full border border-slate-900/10 bg-slate-900/5 dark:border-white/15 dark:bg-white/10 md:flex-1 md:min-w-0">
  <div id="progressBar" class="relative h-full w-[100%] min-w-[220px] rounded-full bg-blue-600 shadow-lg transition-all duration-1000 ease-out">
    <span id="progressBarLabel" class="absolute inset-y-0 right-2 text-sm font-semibold text-white/90 drop-shadow">100%</span>
  </div>
  <div class="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-[0.7rem] font-semibold text-slate-500/80 dark:text-white/60">
    <span> </span>
    <span>১০০%</span>
  </div>
</div>

                      </div>
                    </div>
                    <div class="flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-center md:gap-8">
                      <div class="flex flex-col items-center gap-3">
                        <div class="relative h-24 w-24">
                          <div id="latestAssignmentCircle" class="absolute inset-0 rounded-full bg-white/10"></div>
                          <div class="absolute inset-1 rounded-full bg-white/95 dark:bg-slate-900/80 flex items-center justify-center">
                            <p id="latestAssignmentAverage" class="text-3xl font-semibold text-slate-900 dark:text-white">-</p>
                          </div>
                        </div>
                        <p class="text-sm font-semibold text-slate-600 dark:text-white/70 text-center">সর্বশেষ এসাইনমেন্ট গড়</p>
                      </div>
                      <div class="flex flex-col items-center gap-3">
                        <div class="relative h-24 w-24">
                          <div id="overallProgressCircle" class="absolute inset-0 rounded-full bg-white/10"></div>
                          <div class="absolute inset-1 rounded-full bg-white/95 dark:bg-slate-900/80 flex items-center justify-center">
                            <p id="overallProgress" class="text-3xl font-semibold text-slate-900 dark:text-white">-</p>
                          </div>
                        </div>
                        <p class="text-sm font-semibold text-slate-600 dark:text-white/70 text-center">সামগ্রিক ‍উন্নতি</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
            <div class="grid gap-4 lg:grid-cols-2 items-stretch">
              <article class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm shadow-sm space-y-3 h-full">
                <div class="flex items-center justify-between text-xs font-semibold text-white/85">
                  <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <i class="fas fa-star text-amber-300"></i>
                    অতিরিক্ত মূল্যায়নের মানদণ্ড
                  </span>
                  <span class="text-white/60 text-[0.7rem]">Progressive bonus</span>
                </div>
                <div class="space-y-1.5 text-sm text-white/85">
                  <p class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-rose-300"></span> এখনো এই টাস্ক পারিনা <span class="text-white/60">(-৫)</span></p>
                  <p class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-amber-300"></span> শুধু বুঝেছি <span class="text-white/60">(+৫)</span></p>
                  <p class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-emerald-300"></span> ভালো করে শিখেছি <span class="text-white/60">(+১০)</span></p>
                  <p class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-sky-300"></span> সপ্তাহে প্রতিদিন বাড়ির কাজ করেছি <span class="text-white/60">(+৫)</span></p>
                  <p class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-300"></span> সাপ্তাহিক নিয়মিত উপস্থিতি <span class="text-white/60">(+১০)</span></p>
                </div>
              </article>
              <article class="rounded-2xl border border-white/15 bg-white/95 p-5 text-slate-900 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-white h-full">
                <div class="space-y-4">
                  <div class="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-white/70">
                    <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800/60 dark:text-white">
                      <i class="fas fa-people-group text-indigo-500"></i>
                      শিক্ষার্থী ও গ্রুপের ফলাফল প্রদান তথ্য
                    </span>
                    <span class="text-slate-400 dark:text-white/60 text-[0.75rem]">Latest snapshot</span>
                  </div>
                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent px-4 py-4 dark:border-emerald-200/30 dark:from-emerald-400/15">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-semibold text-emerald-900/90 dark:text-emerald-200">শিক্ষার্থী</p>
                          <p class="text-xs text-emerald-500/80 dark:text-emerald-100">বর্তমান অগ্রগতি</p>
                        </div>
                        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-100">
                          <i class="fas fa-user-graduate"></i>
                        </span>
                      </div>
                      <div class="mt-3 space-y-2 text-sm font-semibold text-emerald-900/90 dark:text-white">
                        <div class="flex items-center justify-between">
                          <span>মূল্যায়িত</span>
                          <span><span id="latestAssignmentEvaluated">-</span> জন</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>অবশিষ্ট</span>
                          <span><span id="latestAssignmentPending">-</span> জন</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>মোট</span>
                          <span><span id="latestAssignmentStudentTotal">-</span> জন</span>
                        </div>
                      </div>
                    </div>
                    <div class="rounded-2xl border border-sky-300/40 bg-gradient-to-br from-sky-500/15 via-transparent to-transparent px-4 py-4 dark:border-sky-200/30 dark:from-sky-400/15">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-semibold text-sky-900/90 dark:text-sky-100">গ্রুপ</p>
                          <p class="text-xs text-sky-500/80 dark:text-sky-100/80">বর্তমান অগ্রগতি</p>
                        </div>
                        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/30 text-sky-100">
                          <i class="fas fa-layer-group"></i>
                        </span>
                      </div>
                      <div class="mt-3 space-y-2 text-sm font-semibold text-sky-900/90 dark:text-white">
                        <div class="flex items-center justify-between">
                          <span>মূল্যায়িত</span>
                          <span><span id="latestAssignmentGroupEvaluated">-</span> টি</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>অবশিষ্ট</span>
                          <span><span id="latestAssignmentGroupPending">-</span> টি</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>মোট</span>
                          <span><span id="latestAssignmentGroupTotal">-</span> টি</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
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
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">দায়িত্ব বন্টন</p>
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
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">মেয়ে সদস্য</h3>
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
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">যেগুলো এখনো সম্পন্ন হয়নি</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-300">
              <i class="fas fa-hourglass-half text-lg"></i>
            </span>
          </div>
        </article>
      </section>

      <section class="grid gap-4">
        <article class="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">ড্যাশবোর্ড ওভারভিউ</p>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">এসাইনমেন্ট ও তারিখ</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">সাম্প্রতিক এসাইনমেন্টের সময়সূচি ও অবস্থা</p>
            </div>
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
              <i class="fas fa-calendar-week text-lg"></i>
            </span>
          </div>
          <div class="mt-4 grid grid-cols-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span class="inline-flex items-center gap-2">
              <i class="fas fa-list-check text-gray-400"></i>
              এসাইনমেন্ট
            </span>
            <span class="text-right inline-flex items-center justify-end gap-2">
              <i class="fas fa-clock text-gray-400"></i>
              তারিখ
            </span>
          </div>
          <div id="assignmentOverviewList" class="mt-2 divide-y divide-gray-100 dark:divide-gray-800"></div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-600 dark:text-gray-300">সর্বশেষ এসাইনমেন্ট</p>
              <p id="assignmentOverviewLatestTitle" class="text-base font-semibold text-gray-900 dark:text-white truncate" title="-">-</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-600 dark:text-gray-300">আপডেট</p>
              <p id="assignmentOverviewLatestDate" class="text-sm font-medium text-gray-700 dark:text-gray-200">-</p>
            </div>
          </div>
        </article>
      </section>

      <section class="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-700/70 dark:bg-gray-900/70">
        <div class="border-b border-gray-200/60 px-6 py-4 dark:border-gray-800/80">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">এলিট গ্রুপ</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">গড় মূল্যায়ন স্কোরে শীর্ষে থাকা দলগুলোকে এক নজরে দেখুন।</p>
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
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">গ্রুপ র‍্যাঙ্কিং · গড় নম্বরের ভিত্তিতে</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">গড় স্কোর, সদস্য সংখ্যা, মূল্যায়িত সদস্য এবং টাস্ক কভারেজ</p>
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

function _normalizeTimestamp(value) {
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
}

function _formatDateTime(timestamp) {
  if (!timestamp) return '-';
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return '-';
  }
}

function _formatDateOnly(timestamp) {
  if (!timestamp) return '-';
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium' }).format(date);
  } catch {
    return '-';
  }
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
    'progressBarLabel',
    'overallProgress',
    'overallProgressCircle',
    'latestAssignmentAverage',
    'latestAssignmentCircle',
    'latestTaskTitle',
    'latestAssignmentUpdated',
    'latestAssignmentEvaluated',
    'latestAssignmentPending',
    'latestAssignmentStudentTotal',
    'latestAssignmentGroupEvaluated',
    'latestAssignmentGroupPending',
    'latestAssignmentGroupTotal',
    'topGroupsContainer',
    'academicGroupStatsList',
    'groupsRankingList',
    'assignmentOverviewList',
    'assignmentOverviewLatestTitle',
    'assignmentOverviewLatestDate',
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
  const femaleStudents = students.filter((s) => (s.gender || '').trim() === 'মেয়ে').length;
  const malePercentage = totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 0;
  const femalePercentage = totalStudents > 0 ? (femaleStudents / totalStudents) * 100 : 0;
  const academicGroups = new Set(students.map((s) => s.academicGroup).filter(Boolean));
  const totalAcademicGroups = academicGroups.size;
  const pendingRoles = students.filter((s) => !s.role || s.role === '').length;

  const groupPerformanceData = _calculateGroupPerformance(groups, students, evaluations, tasks);
  const validGroupPerformances = groupPerformanceData.filter((g) => g.evalCount > 0);
  const totalOverallScore = validGroupPerformances.reduce((acc, group) => acc + group.averageScore, 0);
  const groupOverallProgress =
    validGroupPerformances.length > 0 ? totalOverallScore / validGroupPerformances.length : 0;

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
  const latestAssignmentSummary = _calculateLatestAssignmentSummary(groups, students, tasks, evaluations);
  const assignmentAverageStats = _calculateAssignmentAverageStats(tasks, evaluations);
  const assignmentSummaries = assignmentAverageStats.assignmentSummaries;
  const hasAssignmentAverage = assignmentSummaries.length > 0;
  const overallAssignmentAverage = hasAssignmentAverage ? assignmentAverageStats.overallAverage : 0;
  const overallProgress = hasAssignmentAverage ? overallAssignmentAverage : groupOverallProgress;
  const assignmentOverview = _buildAssignmentOverview(tasks, latestAssignmentSummary);
  const latestAssignmentAverage =
    latestAssignmentSummary?.taskId && assignmentAverageStats.assignmentAverageMap
      ? assignmentAverageStats.assignmentAverageMap.get(latestAssignmentSummary.taskId) ?? null
      : null;
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
    overallAssignmentAverage,
    latestAssignmentAverage,
    assignmentSummaries,
    groupPerformanceData,
    academicGroupStats,
    latestAssignmentSummary,
    assignmentOverview,
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
      const evaluatedMemberIds = new Set();
      const taskIds = new Set();
      let latestEvalMeta = { ts: 0, avgPct: null, participants: null, participationRate: null };
      groupEvals.forEach((evaluation) => {
        const participantCount = evaluation?.scores ? Object.keys(evaluation.scores).length : 0;
        const evalAvgPct = _getEvaluationAveragePercent(evaluation, taskMap);
        if (typeof evalAvgPct === 'number' && !Number.isNaN(evalAvgPct)) {
          totalPercentageScore += evalAvgPct;
          validEvalsCount++;
        }
        if (evaluation?.scores) {
          Object.keys(evaluation.scores).forEach((studentId) => {
            if (studentId) evaluatedMemberIds.add(studentId);
          });
        }
        if (evaluation?.taskId) taskIds.add(evaluation.taskId);

        const evalTs =
          _normalizeTimestamp(evaluation.taskDate) ||
          _normalizeTimestamp(evaluation.updatedAt) ||
          _normalizeTimestamp(evaluation.createdAt);
        if (evalTs && evalTs >= (latestEvalMeta.ts || 0)) {
          const partRate =
            groupStudents.length > 0 ? Math.min(100, (participantCount / groupStudents.length) * 100) : 0;
          latestEvalMeta = {
            ts: evalTs,
            avgPct: typeof evalAvgPct === 'number' ? evalAvgPct : latestEvalMeta.avgPct,
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

function _getEvaluationAveragePercent(evaluation, taskMap) {
  if (!evaluation) return null;
  const avgEvalScorePercent = parseFloat(evaluation.groupAverageScore);
  if (!Number.isNaN(avgEvalScorePercent)) return avgEvalScorePercent;

  if (!evaluation.scores) return null;
  const task = taskMap.get(evaluation.taskId);
  const maxScore = parseFloat(task?.maxScore) || parseFloat(evaluation.maxPossibleScore) || 100;
  if (!(maxScore > 0)) return null;

  let evalScoreSum = 0;
  let studentCountInEval = 0;
  Object.values(evaluation.scores).forEach((scoreData) => {
    evalScoreSum += parseFloat(scoreData.totalScore) || 0;
    studentCountInEval++;
  });
  if (studentCountInEval === 0) return null;
  return (evalScoreSum / studentCountInEval / maxScore) * 100;
}

function _calculateLatestAssignmentSummary(groups = [], students = [], tasks = [], evaluations = []) {
  if (!evaluations.length) return null;

  const groupStudentCounts = new Map(groups.map((group) => [group.id, 0]));
  students.forEach((student) => {
    const gid = student.groupId;
    if (!gid) return;
    if (!groupStudentCounts.has(gid)) groupStudentCounts.set(gid, 0);
    groupStudentCounts.set(gid, groupStudentCounts.get(gid) + 1);
  });

  let latestEvaluation = null;
  evaluations.forEach((evaluation) => {
    const ts =
      _normalizeTimestamp(evaluation.taskDate) ||
      _normalizeTimestamp(evaluation.updatedAt) ||
      _normalizeTimestamp(evaluation.createdAt);
    if (!latestEvaluation || ts > latestEvaluation.ts) {
      latestEvaluation = { ts, taskId: evaluation.taskId };
    }
  });

  if (!latestEvaluation || !latestEvaluation.taskId) return null;
  const latestTaskId = latestEvaluation.taskId;
  const taskInfo = tasks.find((task) => task.id === latestTaskId);
  const taskTitle = taskInfo?.title || taskInfo?.name || 'সর্বশেষ এসাইনমেন্ট';

  const assignmentGroupIds = new Set();
  let hasExplicitAssignmentMeta = false;
  const groupCandidateKeys = [
    'assignedGroupIds',
    'targetGroupIds',
    'groupIds',
    'assignedGroups',
    'groups',
    'targets',
    'selectedGroups',
    'participantGroups',
    'assignmentTargets',
  ];

  const pushGroupCandidate = (candidate, fromExplicitSource = false, depth = 0) => {
    if (candidate === undefined || candidate === null || depth > 6) return;
    if (Array.isArray(candidate)) {
      candidate.forEach((value) => pushGroupCandidate(value, fromExplicitSource, depth + 1));
      return;
    }
    if (typeof candidate === 'object') {
      if ('id' in candidate || 'groupId' in candidate || 'value' in candidate) {
        pushGroupCandidate(candidate.id ?? candidate.groupId ?? candidate.value, fromExplicitSource, depth + 1);
        return;
      }
      if (candidate.group) {
        pushGroupCandidate(candidate.group.id ?? candidate.group.groupId, fromExplicitSource, depth + 1);
        return;
      }
      Object.values(candidate).forEach((value) => pushGroupCandidate(value, fromExplicitSource, depth + 1));
      return;
    }
    const normalized = typeof candidate === 'string' ? candidate.trim() : candidate;
    if (normalized !== undefined && normalized !== null && normalized !== '') {
      assignmentGroupIds.add(normalized);
      if (fromExplicitSource) hasExplicitAssignmentMeta = true;
    }
  };

  if (taskInfo) {
    if (taskInfo.assignToAllGroups || taskInfo.assignmentScope === 'all' || taskInfo.targetScope === 'all') {
      groups.forEach((group) => pushGroupCandidate(group.id, true));
    }
    groupCandidateKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(taskInfo, key)) {
        pushGroupCandidate(taskInfo[key], true);
      }
    });
  }

  const evalsForTask = evaluations.filter((evaluation) => evaluation.taskId === latestTaskId);
  const evaluatedGroupIds = new Set();
  let evaluatedStudents = 0;

  evalsForTask.forEach((evaluation) => {
    if (evaluation.groupId) {
      evaluatedGroupIds.add(evaluation.groupId);
      pushGroupCandidate(evaluation.groupId, false);
    }
    const participantCount = evaluation?.scores
      ? Object.keys(evaluation.scores).length
      : Number(evaluation.participantCount) || 0;
    evaluatedStudents += participantCount;
  });

  if (!assignmentGroupIds.size || !hasExplicitAssignmentMeta) {
    groups.forEach((group) => {
      if (group?.id !== undefined && group?.id !== null) assignmentGroupIds.add(group.id);
    });
  }

  let totalEligible = 0;
  assignmentGroupIds.forEach((groupId) => {
    totalEligible += groupStudentCounts.get(groupId) || 0;
  });
  if (totalEligible === 0) {
    totalEligible = students.length;
  }
  if (totalEligible === 0) totalEligible = evaluatedStudents;

  evaluatedStudents = Math.min(evaluatedStudents, totalEligible);
  const pendingStudents = Math.max(totalEligible - evaluatedStudents, 0);
  const completionPercent = totalEligible > 0 ? Math.min(100, (evaluatedStudents / totalEligible) * 100) : 0;

  const groupTotal = assignmentGroupIds.size || groups.length || evaluatedGroupIds.size;
  const groupsEvaluated = evaluatedGroupIds.size;
  const groupsPending = Math.max((groupTotal || 0) - groupsEvaluated, 0);

  return {
    taskId: latestTaskId,
    taskTitle,
    evaluated: evaluatedStudents,
    pending: pendingStudents,
    total: totalEligible,
    completionPercent,
    lastUpdated: latestEvaluation.ts,
    groupTotal,
    groupsEvaluated,
    groupsPending,
  };
}

function _calculateAssignmentAverageStats(tasks = [], evaluations = []) {
  if (!evaluations.length) {
    return { assignmentSummaries: [], overallAverage: 0, assignmentAverageMap: new Map() };
  }
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const aggregates = new Map();

  evaluations.forEach((evaluation) => {
    if (!evaluation.taskId) return;
    const avgPct = _getEvaluationAveragePercent(evaluation, taskMap);
    if (typeof avgPct !== 'number' || Number.isNaN(avgPct)) return;
    if (!aggregates.has(evaluation.taskId)) {
      aggregates.set(evaluation.taskId, { total: 0, count: 0 });
    }
    const bucket = aggregates.get(evaluation.taskId);
    bucket.total += avgPct;
    bucket.count += 1;
  });

  const assignmentSummaries = [];
  const assignmentAverageMap = new Map();
  aggregates.forEach((bucket, taskId) => {
    if (!bucket.count) return;
    const taskInfo = taskMap.get(taskId);
    const averagePercent = bucket.total / bucket.count;
    assignmentSummaries.push({
      taskId,
      taskTitle: taskInfo?.title || taskInfo?.name || 'অজ্ঞাত এসাইনমেন্ট',
      averagePercent,
      evaluationCount: bucket.count,
    });
    assignmentAverageMap.set(taskId, averagePercent);
  });

  const overallAverage = assignmentSummaries.length
    ? assignmentSummaries.reduce((sum, summary) => sum + summary.averagePercent, 0) / assignmentSummaries.length
    : 0;

  return { assignmentSummaries, overallAverage, assignmentAverageMap };
}

function _buildAssignmentOverview(tasks = [], latestAssignmentSummary = null) {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  const latestTaskId = latestAssignmentSummary?.taskId || null;
  return tasks
    .map((task) => {
      const timestamp =
        _normalizeTimestamp(task.date) ||
        _normalizeTimestamp(task.deadline) ||
        _normalizeTimestamp(task.scheduleDate) ||
        _normalizeTimestamp(task.createdAt) ||
        _normalizeTimestamp(task.updatedAt);
      const title = task.title || task.name || 'অনির্ধারিত এসাইনমেন্ট';
      const identifier = task.id ?? task.uid ?? task.key ?? `${title}-${timestamp || Date.now()}`;
      return {
        id: identifier,
        title,
        timestamp,
        dateLabel: timestamp ? _formatDateOnly(timestamp) : 'তারিখ নির্ধারিত নয়',
      };
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 6)
    .map((item, index) => {
      const isLatest = latestTaskId ? item.id === latestTaskId : index === 0;
      return {
        ...item,
        index: index + 1,
        isLatest,
        relativeLabel: _getRelativeDayLabel(item.timestamp),
      };
    });
}

function _getRelativeDayLabel(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((dateOnly - todayOnly) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'আজ';
  const absDiff = Math.abs(diffDays);
  const formatted =
    helpers?.convertToBanglaNumber && typeof helpers.convertToBanglaNumber === 'function'
      ? helpers.convertToBanglaNumber(String(absDiff))
      : String(absDiff);
  return diffDays > 0 ? `${formatted} দিন বাকি` : `${formatted} দিন আগে`;
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

  const latestSummary = stats.latestAssignmentSummary || null;
  const latestCompletion = latestSummary ? Math.min(100, Math.max(0, Number(latestSummary.completionPercent) || 0)) : 0;
  const latestEvaluated = latestSummary ? formatNum(latestSummary.evaluated) : '-';
  const latestPending = latestSummary ? formatNum(latestSummary.pending) : '-';
  const latestTotal = latestSummary ? formatNum(latestSummary.total) : '-';
  const latestGroupsEvaluated = latestSummary ? formatNum(latestSummary.groupsEvaluated) : '-';
  const latestGroupsPending = latestSummary ? formatNum(latestSummary.groupsPending) : '-';
  const latestGroupTotal = latestSummary ? formatNum(latestSummary.groupTotal) : '-';

  if (elements.latestTaskTitle) {
    const title = latestSummary?.taskTitle || 'সর্বশেষ এসাইনমেন্ট';
    setText(elements.latestTaskTitle, title);
    elements.latestTaskTitle.setAttribute('title', title);
  }
  if (elements.latestAssignmentUpdated) {
    setText(elements.latestAssignmentUpdated, latestSummary ? _formatDateTime(latestSummary.lastUpdated) : '-');
  }
  if (elements.latestAssignmentEvaluated) setText(elements.latestAssignmentEvaluated, latestEvaluated);
  if (elements.latestAssignmentPending) setText(elements.latestAssignmentPending, latestPending);
  if (elements.latestAssignmentStudentTotal) setText(elements.latestAssignmentStudentTotal, latestTotal);
  if (elements.latestAssignmentGroupEvaluated) setText(elements.latestAssignmentGroupEvaluated, latestGroupsEvaluated);
  if (elements.latestAssignmentGroupPending) setText(elements.latestAssignmentGroupPending, latestGroupsPending);
  if (elements.latestAssignmentGroupTotal) setText(elements.latestAssignmentGroupTotal, latestGroupTotal);

  const hasAssignmentAverageData =
    Array.isArray(stats.assignmentSummaries) &&
    stats.assignmentSummaries.length > 0 &&
    typeof stats.overallAssignmentAverage === 'number' &&
    !Number.isNaN(stats.overallAssignmentAverage);
  const latestAssignmentAverageValue =
    typeof stats.latestAssignmentAverage === 'number' && !isNaN(stats.latestAssignmentAverage)
      ? Math.min(100, Math.max(0, stats.latestAssignmentAverage))
      : null;
  const overallImprovementSource = hasAssignmentAverageData ? stats.overallAssignmentAverage : stats.overallProgress;
  const progressValue =
    typeof overallImprovementSource === 'number' && !isNaN(overallImprovementSource)
      ? Math.min(100, Math.max(0, overallImprovementSource))
      : 0;
  setText(elements.overallProgress, `${formatNum(progressValue, 0)}%`);
  if (elements.latestAssignmentAverage) {
    if (latestAssignmentAverageValue !== null) {
      setText(elements.latestAssignmentAverage, `${formatNum(latestAssignmentAverageValue, 0)}%`);
    } else {
      elements.latestAssignmentAverage.textContent = '-';
    }
  }

  const circlePalette = _getScorePalette(progressValue);
  if (elements.overallProgressCircle) {
    const progressDeg = (progressValue / 100) * 360;
    elements.overallProgressCircle.style.background = `conic-gradient(${circlePalette.solid} ${progressDeg}deg, rgba(255,255,255,0.08) ${progressDeg}deg)`;
    elements.overallProgressCircle.style.boxShadow = `0 0 25px ${circlePalette.shadow}`;
  }
  if (elements.overallProgress) {
    elements.overallProgress.style.color = circlePalette.solid;
  }
  if (elements.latestAssignmentCircle && latestAssignmentAverageValue !== null) {
    const latestCirclePalette = _getScorePalette(latestAssignmentAverageValue);
    const latestDeg = (latestAssignmentAverageValue / 100) * 360;
    elements.latestAssignmentCircle.style.background = `conic-gradient(${latestCirclePalette.solid} ${latestDeg}deg, rgba(255,255,255,0.08) ${latestDeg}deg)`;
    elements.latestAssignmentCircle.style.boxShadow = `0 0 25px ${latestCirclePalette.shadow}`;
    if (elements.latestAssignmentAverage) {
      elements.latestAssignmentAverage.style.color = latestCirclePalette.solid;
    }
  }

  if (elements.progressBar) {
    const barPalette = _getScorePalette(latestCompletion);
    elements.progressBar.style.width = `${latestCompletion}%`;
    elements.progressBar.style.background = `linear-gradient(90deg, ${barPalette.solid}, ${barPalette.solid})`;
    elements.progressBar.style.boxShadow = `0 8px 20px ${barPalette.shadow}`;
    elements.progressBar.className = 'relative h-full rounded-full shadow-lg transition-all duration-1000 ease-out';
  }
  if (elements.progressBarLabel) {
    const labelValue = `${formatNum(latestCompletion, 0)}%`;
    elements.progressBarLabel.textContent = labelValue;
    const anchorRight = latestCompletion >= 20;
    elements.progressBarLabel.style.right = anchorRight ? '8px' : 'auto';
    elements.progressBarLabel.style.left = anchorRight ? 'auto' : '8px';
    elements.progressBarLabel.style.color = 'rgba(255,255,255,0.92)';
    elements.progressBarLabel.style.minWidth = '32px';
    elements.progressBarLabel.style.textAlign = anchorRight ? 'right' : 'left';
  }

  _renderAssignmentOverview(stats.assignmentOverview || [], latestSummary);
}

function _renderAssignmentOverview(overviewItems = [], latestSummary = null) {
  if (!elements.assignmentOverviewList) return;
  const formatBanglaNumber = (value) =>
    helpers?.convertToBanglaNumber && typeof helpers.convertToBanglaNumber === 'function'
      ? helpers.convertToBanglaNumber(String(value))
      : String(value);

  if (!overviewItems.length) {
    elements.assignmentOverviewList.innerHTML =
      '<div class="py-4 text-sm text-gray-500 dark:text-gray-400">কোন এসাইনমেন্ট তথ্য পাওয়া যায়নি।</div>';
  } else {
    const rows = overviewItems
      .map((item) => {
        const serial = formatBanglaNumber(item.index);
        const latestBadge = item.isLatest
          ? '<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-600 dark:text-emerald-300"><i class="fas fa-bolt text-[0.6rem]"></i> সর্বশেষ</span>'
          : '';
        const relative = item.relativeLabel
          ? `<p class="text-xs text-gray-500 dark:text-gray-400">${_escapeHtml(item.relativeLabel)}</p>`
          : '';
        const safeTitle = _escapeHtml(item.title);
        return `
          <div class="flex items-center justify-between gap-4 py-3">
            <div class="flex items-center gap-3 min-w-0">
              <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-sm font-semibold text-indigo-600 dark:text-indigo-300">${serial}</span>
              <div class="min-w-0 space-y-1">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate" title="${safeTitle}">${safeTitle}</p>
                ${latestBadge}
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200">${_escapeHtml(item.dateLabel)}</p>
              ${relative}
            </div>
          </div>
        `;
      })
      .join('');
    elements.assignmentOverviewList.innerHTML = rows;
  }

  const latestItem = overviewItems.find((item) => item.isLatest) || overviewItems[0];
  if (elements.assignmentOverviewLatestTitle) {
    const title = latestSummary?.taskTitle || latestItem?.title || '-';
    elements.assignmentOverviewLatestTitle.textContent = title || '-';
    elements.assignmentOverviewLatestTitle.setAttribute('title', title || '-');
  }
  if (elements.assignmentOverviewLatestDate) {
    let dateLabel = '-';
    if (latestSummary?.lastUpdated) {
      dateLabel = _formatDateTime(latestSummary.lastUpdated);
    } else if (latestItem?.timestamp) {
      dateLabel = latestItem.dateLabel || '-';
    }
    elements.assignmentOverviewLatestDate.textContent = dateLabel;
  }
}

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
          <span class="elite-metric-label">অংশগ্রহণের হার</span>
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
    if (
      !elements.topGroupsContainer ||
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    )
      return;
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
      index === 0
        ? 'elite-card-name elite-name-xl font-semibold text-white'
        : 'elite-card-name elite-name-lg font-semibold text-gray-900 dark:text-white';
    const memberLineClass = index === 0 ? 'text-white/85' : 'text-gray-800/80 dark:text-white/80';
    const placeText = podiumLabels[index] || helpers.convertToBanglaRank(index + 1);
    const articleClass = podiumClasses[index] || podiumClasses[podiumClasses.length - 1];
    const rankIcon = rankIcons[index] || '<i class="fa-solid fa-trophy text-amber-700 dark:text-amber-200"></i>';
    return `
        <article class="${articleClass}" data-group-id="${data.group?.id
      }" role="button" tabindex="0" aria-pressed="false">
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
              <div class="${nameClass}" title="${groupName}" data-max-font="${fontConfig.max}" data-min-font="${fontConfig.min
      }">${groupName}</div>
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

  const cards = top3.map((data, index) => buildPodiumCard(data, index)).join('');

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
        try {
          window.openGroupModalById(gid);
        } catch (err) {
          console.warn('Elite group modal open failed:', err);
        }
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
    uiManager.displayEmptyMessage(elements.groupsRankingList, 'র‍্যাঙ্কিংয়ের জন্য ডেটা নেই।');
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
        try {
          window.openGroupModalById(gid);
        } catch (err) {
          console.warn('Group modal open failed:', err);
        }
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
      <div class="absolute inset-0 rounded-full" style="background: conic-gradient(${palette.solid} ${clamped}%, ${palette.soft} ${clamped}% 100%);"></div>
      <div class="absolute inset-[18%] rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-inner" style="box-shadow: 0 8px 18px ${palette.shadow};">
        <span class="text-lg font-semibold text-gray-800 dark:text-gray-100">${displayValue}%</span>
      </div>
    </div>
  `;
}
