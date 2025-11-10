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
    <style>
      @keyframes glowOrbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .glow-ring {
        position: relative;
        isolation: isolate;
      }
      .glow-ring::before,
      .glow-ring::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 9999px;
        pointer-events: none;
      }
      .glow-ring::before {
        background: conic-gradient(from 0deg,
          rgba(255,200,90,0) 0deg,
          rgba(255,210,110,0.15) 180deg,
          rgba(255,225,160,0.9) 300deg,
          rgba(255,240,200,1) 340deg,
          rgba(255,200,90,0) 360deg);
        mask: radial-gradient(circle, transparent 70%, black 78%);
        -webkit-mask: radial-gradient(circle, transparent 70%, black 78%);
        box-shadow: 0 0 40px rgba(255,210,120,0.6), 0 0 80px rgba(255,220,160,0.4);
        animation: glowOrbit 4s linear infinite;
      }
      .glow-ring::after {
        background: conic-gradient(from 0deg,
          rgba(255,210,100,0) 0deg,
          rgba(255,230,160,0.25) 240deg,
          rgba(255,240,200,0.8) 320deg,
          rgba(255,210,100,0) 360deg);
        mask: radial-gradient(circle, transparent 60%, black 72%);
        -webkit-mask: radial-gradient(circle, transparent 60%, black 72%);
        filter: blur(14px);
        opacity: 0.9;
        animation: glowOrbit 6s linear infinite;
      }
    </style>
    <div class="max-w-7xl mx-auto space-y-3">
     

    <section class="relative overflow-hidden rounded-3xl border border-slate-300/60
  bg-gradient-to-br from-white via-slate-50 to-slate-200
  text-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.10),0_10px_28px_rgba(255,255,255,0.65)]
  hover:shadow-[0_8px_18px_rgba(0,0,0,0.14),0_14px_34px_rgba(255,255,255,0.75)]
  transition-all duration-500 ease-out
  dark:border-slate-700/60 dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-900 dark:to-black
  dark:text-slate-100 dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_6px_18px_rgba(0,0,0,0.60),0_0_28px_rgba(255,255,255,0.10)]
  dark:hover:shadow-[inset_0_3px_6px_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.75),0_0_36px_rgba(255,255,255,0.14)]">

  <!-- subtle radial aura -->
  <div aria-hidden class="absolute inset-0 opacity-30 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.35),transparent_60%)]"></div>

  <div class="relative p-3 sm:p-4 space-y-4">

    <!-- Card (hero row) -->
    <section class="relative overflow-hidden rounded-3xl border
      border-slate-300/70 ring-1 ring-white/40 backdrop-blur supports-[backdrop-filter]:bg-white/70
      bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50
      shadow-[0_6px_16px_rgba(0,0,0,0.10),0_0_30px_rgba(255,255,255,0.55)]
      hover:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_36px_rgba(255,255,255,0.65)]
      transition-all duration-500 ease-out
      dark:border-slate-700/70 dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-900 dark:to-slate-950
      dark:text-slate-100 dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_10px_26px_rgba(0,0,0,0.70),0_0_34px_rgba(255,255,255,0.10)]
      dark:hover:shadow-[inset_0_3px_6px_rgba(255,255,255,0.08),0_14px_30px_rgba(0,0,0,0.78),0_0_40px_rgba(255,255,255,0.14)]">

      <!-- conic aura -->
      <div aria-hidden class="pointer-events-none absolute -inset-px rounded-[24px] opacity-[0.10] blur-2xl"
           style="background: conic-gradient(#fde68a, #f0abfc, #93c5fd, #fde68a)"></div>

      <div class="relative p-3 sm:p-4">
        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">

          <!-- Left: title & icon -->
          <div class="flex w-full items-center gap-3 md:w-auto justify-center md:justify-start">
            
            <p class="text-2xl font-black tracking-tight text-slate-900 dark:text-white text-center md:text-left">
              স্মার্ট ইভ্যালুয়েট সিস্টেম
            </p>
          </div>

          <!-- Score chips -->
          <div class="grid w-full grid-cols-2 gap-2 text-[0.9rem] font-semibold sm:w-auto sm:grid-cols-3 md:grid-cols-4">
            <span class="relative rounded-2xl px-4 py-1.5
              text-emerald-900 bg-gradient-to-b from-emerald-50 via-emerald-200 to-emerald-500
              ring-2 ring-emerald-300/80
              shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.15),0_10px_18px_rgba(0,0,0,0.20)]
              transition-all duration-300
              dark:text-emerald-100 dark:from-emerald-700 dark:via-emerald-800 dark:to-emerald-900 dark:ring-emerald-600/40
              dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_6px_12px_rgba(0,0,0,0.75)]">টাস্ক স্কোর</span>

            <span class="relative rounded-2xl px-4 py-1.5
              text-sky-900 bg-gradient-to-b from-sky-50 via-sky-200 to-sky-500
              ring-2 ring-sky-300/80
              shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.15),0_10px_18px_rgba(0,0,0,0.20)]
              transition-all duration-300
              dark:text-sky-100 dark:from-sky-700 dark:via-sky-800 dark:to-sky-900 dark:ring-sky-600/40
              dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_6px_12px_rgba(0,0,0,0.75)]">টিম স্কোর</span>

            <span class="relative rounded-2xl px-4 py-1.5
              text-rose-900 bg-gradient-to-b from-rose-50 via-rose-200 to-rose-500
              ring-2 ring-rose-300/80
              shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.15),0_10px_18px_rgba(0,0,0,0.20)]
              transition-all duration-300
              dark:text-rose-100 dark:from-rose-700 dark:via-rose-800 dark:to-rose-900 dark:ring-rose-600/40
              dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_6px_12px_rgba(0,0,0,0.75)]">অতিরিক্ত স্কোর</span>

            <span class="relative rounded-2xl px-4 py-1.5
              text-amber-900 bg-gradient-to-b from-amber-50 via-amber-200 to-amber-500
              ring-2 ring-amber-300/80
              shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.15),0_10px_18px_rgba(0,0,0,0.20)]
              transition-all duration-300
              dark:text-amber-100 dark:from-amber-700 dark:via-amber-800 dark:to-amber-900 dark:ring-amber-700/40
              dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_6px_12px_rgba(0,0,0,0.75)]">MCQ স্কোর</span>
          </div>

          <!-- Right: image preview -->
          <div class="w-full md:w-auto">
            <div class="glow-ring relative mx-auto h-28 w-28 sm:h-32 sm:w-32">
              <div class="absolute inset-[10px] overflow-hidden rounded-full border-2 border-amber-200/60 bg-white
                shadow-[0_10px_25px_rgba(0,0,0,0.25),0_0_35px_rgba(255,214,155,0.7)]
                dark:bg-slate-900 dark:shadow-[0_12px_28px_rgba(0,0,0,0.65),0_0_35px_rgba(255,214,155,0.10)]">
                <img src="images/smart.png" alt="Evaluation summary visual"
                     class="h-full w-full object-cover object-center" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Two-column content -->
    <div class="grid gap-4 lg:grid-cols-2 items-stretch">

      <!-- Students & Groups -->
      <article class="rounded-3xl border border-slate-300/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 
        text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.10),0_0_24px_rgba(255,255,255,0.5)]
        backdrop-blur dark:border-slate-700/70 dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-900 dark:to-black 
        dark:text-white dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.7)] h-full p-3">

        <div class="space-y-4">
          <div class="flex items-center justify-center text-xs font-semibold text-slate-800 dark:text-white/80">
            <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-900 
              ring-1 ring-slate-200 shadow-sm dark:bg-white/10 dark:text-white">
              <i class="fas fa-people-group text-indigo-600 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"></i>
              সর্বশেষ এসাইনমেন্ট ফলাফল প্রদান তথ্য
            </span>
           
          </div>
           <!-- Evaluation progress -->
        <div class="relative rounded-2xl border border-blue-300/70
            bg-gradient-to-br from-white via-blue-50 to-emerald-50
            shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_18px_rgba(0,0,0,0.08)]
            p-1 mb-2
            dark:border-blue-400/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
            dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.55)]">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
            <!-- Col 1: Title chip -->
            <div class="min-w-0">
              <span class="inline-flex items-center gap-2 rounded-full
                           px-3 py-1 text-[0.85rem] font-semibold
                           bg-white/90 text-slate-900 ring-1 ring-white/70
                           shadow-[0_1px_2px_rgba(0,0,0,0.14)] backdrop-blur
                           dark:bg-white/10 dark:text-white dark:ring-white/15">
                <i class="fas fa-chart-simple text-indigo-600 dark:text-indigo-300 text-sm"></i>
                <span class="truncate" lang="bn">মূল্যায়ন প্রদানের অগ্রগতি</span>
              </span>
            </div>

            <!-- Col 2: Progress bar -->
            <div>
              <div class="relative h-8 w-full overflow-hidden rounded-full
                          border border-blue-300/70
                          bg-gradient-to-b from-blue-100 via-blue-200 to-emerald-100
                          shadow-[inset_0_3px_6px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(0,0,0,0.08)]
                          dark:border-blue-400/30 dark:from-slate-800 dark:via-sky-900/20 dark:to-slate-900
                          dark:shadow-[inset_0_3px_6px_rgba(255,255,255,0.06),inset_0_-4px_8px_rgba(0,0,0,0.45)]">

                <!-- Fill -->
                <div id="progressBar"
                     class="relative h-full w-[75%] md:w-[70%] rounded-full
                            bg-gradient-to-r from-blue-500 via-indigo-600 to-emerald-500
                            shadow-[inset_0_2px_3px_rgba(255,255,255,0.65),0_4px_10px_rgba(59,130,246,0.35),0_8px_18px_rgba(16,185,129,0.25)]
                            transition-all duration-700 ease-out">
                  <span class="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full
                               bg-white/25 dark:bg-white/10"></span>
                  <span class="pointer-events-none absolute inset-y-0 left-0 w-[40%]
                               bg-gradient-to-r from-white/15 to-transparent"></span>
                  <span class="pointer-events-none absolute right-0 top-0 h-full w-6
                               bg-gradient-to-l from-white/35 to-transparent dark:from-white/15"></span>
                  <span id="progressBarLabel"
                        class="absolute inset-y-0 right-2 flex items-center
                               text-[0.85rem] sm:text-[0.95rem] font-extrabold tracking-wide
                               text-slate-900 dark:text-white drop-shadow">75%</span>
                  <span class="pointer-events-none absolute inset-y-0 -left-10 w-10 skew-x-12
                               bg-white/20 blur-[2px] animate-[shine_2.4s_linear_infinite]"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- শিক্ষার্থী -->
            <div class="rounded-2xl border border-emerald-300/70 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/70 
              shadow-[0_6px_16px_rgba(16,185,129,0.18)] px-4 py-2
              dark:border-emerald-300/30 dark:from-emerald-900/40 dark:via-slate-900 dark:to-emerald-900/10">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-emerald-900 dark:text-emerald-200">শিক্ষার্থী</p>
                  <p class="text-xs text-emerald-700 dark:text-emerald-300/90">বর্তমান অগ্রগতি</p>
                </div>
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 
                  shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:bg-emerald-500/20 dark:text-emerald-200">
                  <i class="fas fa-user-graduate"></i>
                </span>
              </div>

              <div class="mt-3 space-y-2 text-sm font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center justify-between"><span>মূল্যায়িত</span><span><span id="latestAssignmentEvaluated">-</span> জন</span></div>
                <div class="flex items-center justify-between"><span>অবশিষ্ট</span><span><span id="latestAssignmentPending">-</span> জন</span></div>
                <div class="flex items-center justify-between"><span>মোট</span><span><span id="latestAssignmentStudentTotal">-</span> জন</span></div>
              </div>
            </div>

            <!-- গ্রুপ -->
            <div class="rounded-2xl border border-sky-300/70 bg-gradient-to-br from-white via-sky-50 to-sky-100/70 
              shadow-[0_6px_16px_rgba(14,165,233,0.18)] px-4 py-4
              dark:border-sky-300/30 dark:from-sky-900/40 dark:via-slate-900 dark:to-sky-900/10">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-sky-900 dark:text-sky-100">গ্রুপ</p>
                  <p class="text-xs text-sky-700 dark:text-sky-200/80">বর্তমান অগ্রগতি</p>
                </div>
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600 
                  shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:bg-sky-500/20 dark:text-sky-200">
                  <i class="fas fa-layer-group"></i>
                </span>
              </div>
              <div class="mt-3 space-y-2 text-sm font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center justify-between"><span>মূল্যায়িত</span><span><span id="latestAssignmentGroupEvaluated">-</span> টি</span></div>
                <div class="flex items-center justify-between"><span>অবশিষ্ট</span><span><span id="latestAssignmentGroupPending">-</span> টি</span></div>
                <div class="flex items-center justify-between"><span>মোট</span><span><span id="latestAssignmentGroupTotal">-</span> টি</span></div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <!-- Latest assignment + progress -->
      <article class="relative rounded-3xl border border-slate-300/70 
        bg-gradient-to-br from-blue-50 via-sky-100 to-emerald-50 
        text-slate-900 shadow-[0_10px_25px_rgba(0,0,0,0.08),0_0_35px_rgba(255,255,255,0.6)] 
        backdrop-blur p-4 sm:p-5 transition-all duration-500 
        dark:border-slate-700/70 dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 
        dark:text-white dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.7)] h-full">

        <!-- লাইভ ব্যাজ -->
        <span class="absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex items-center gap-1 rounded-full border 
          border-amber-300/70 bg-amber-100 text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-amber-800 
          shadow-[0_1px_3px_rgba(0,0,0,0.15)] px-2 py-0.5 
          dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
          <i class="fas fa-bolt text-[0.6rem]"></i> লাইভ
        </span>

        <!-- Header -->
        <div class="mb-2 sm:mb-3 ">
          <p class="text-xs font-bold text-slate-700 dark:text-white/60" lang="bn" >
            সর্বশেষ এসাইনমেন্ট    <span class="text-xs text-slate-700 dark:text-white/60">
            অনুষ্ঠিত: <span id="latestAssignmentUpdated">-</span>
          </span>
          </p>
          <p id="latestTaskTitle"
            class="mt-1 max-w-[28rem] truncate font-bold text-slate-900 dark:text-white text-sm sm:text-base"
            title="-">-</p>
        </div>

       

        <!-- Content: 3-column on sm+ -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Average -->
          <div class="flex flex-col items-center justify-center gap-2 sm:gap-3">
            <div class="relative h-24 w-24 sm:h-26 sm:w-26 rounded-2xl border border-emerald-300/60 
              bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 
              shadow-[0_6px_16px_rgba(16,185,129,0.25),inset_0_1px_2px_rgba(255,255,255,0.8)] 
              dark:border-emerald-300/30 dark:from-emerald-900/40 dark:via-slate-900 dark:to-emerald-900/10 flex items-center justify-center">
              <p id="latestAssignmentAverage" class="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100">-</p>
            </div>
            <p class="text-[0.8rem] sm:text-sm font-bold text-emerald-800 dark:text-white/80 text-center">
              সর্বশেষ এসাইনমেন্ট গড়
            </p>
          </div>

          <!-- Overall -->
          <div class="flex flex-col items-center justify-center gap-2 sm:gap-3">
            <div class="relative h-24 w-24 sm:h-26 sm:w-26 rounded-2xl border border-sky-300/60 
              bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300 
              shadow-[0_6px_16px_rgba(14,165,233,0.25),inset_0_1px_2px_rgba(255,255,255,0.8)] 
              dark:border-sky-300/30 dark:from-sky-900/40 dark:via-slate-900 dark:to-sky-900/10 flex items-center justify-center">
              <p id="overallProgress" class="text-2xl sm:text-3xl font-bold text-sky-900 dark:text-sky-100">-</p>
            </div>
            <p class="text-[0.8rem] sm:text-sm font-bold text-sky-800 dark:text-white/80 text-center">
              সামগ্রিক ‍উন্নতি
            </p>
          </div>
        </div>
      </article>

    </div>
  </div>
</section>

      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
          <div class="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent"></div>
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">টাস্ক ম্যানেজমেন্ট</p>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">মোট এসাইনমেন্ট</h3>
              <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white" id="totalTasks">-</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">নির্ধারিত সব মূল্যায়ন টাস্ক</p>
            </div>
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <i class="fas fa-tasks text-lg"></i>
            </span>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
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
  const { male: maleStudents, female: femaleStudents } = _calculateGenderBuckets(students);
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

function _calculateGenderBuckets(students = []) {
  return students.reduce(
    (acc, student) => {
      const detected = _normalizeGender(student.gender);
      if (detected === 'male') acc.male++;
      else if (detected === 'female') acc.female++;
      return acc;
    },
    { male: 0, female: 0 }
  );
}

function _normalizeGender(value) {
  const raw = (value || '').toString().trim();
  if (!raw) return '';
  const normalized = raw.normalize('NFC').toLowerCase().replace(/\s+/g, '');
  const banglaAligned = normalized.replace(/য়/g, 'য়');
  if (
    banglaAligned.includes('ছেলে') ||
    normalized.includes('male') ||
    normalized.includes('boy') ||
    normalized === 'm'
  ) {
    return 'male';
  }
  if (
    banglaAligned.includes('মেয়ে') ||
    normalized.includes('female') ||
    normalized.includes('girl') ||
    normalized === 'f'
  ) {
    return 'female';
  }
  return '';
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
        <article class="${articleClass}" data-group-id="${
      data.group?.id
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
              <div class="${nameClass}" title="${groupName}" data-max-font="${fontConfig.max}" data-min-font="${
      fontConfig.min
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

/** NEW: Build a single Rank Card (glass + gradient + medal) */
function _buildRankCard(data, rank) {
  const palette = _getScorePalette(data.averageScore);
  const rankText = helpers.convertToBanglaRank(rank);
  const groupName = _formatLabel(data.groupName);

  const scorePct = Math.min(100, Math.max(0, Number(data.averageScore) || 0));
  const members = helpers.convertToBanglaNumber(data.studentCount || 0);
  const evaluated = helpers.convertToBanglaNumber(data.evaluatedMembers || 0);
  const tasks = helpers.convertToBanglaNumber(data.taskCount || 0);
  const evals = helpers.convertToBanglaNumber(data.evalCount || 0);

  // medal style by rank
  const medalIcon = rank === 1 ? 'fa-crown' : rank === 2 ? 'fa-medal' : 'fa-award';
  const medalBg =
    rank === 1
      ? 'from-amber-400 via-yellow-500 to-orange-500'
      : rank === 2
      ? 'from-slate-200 via-slate-300 to-slate-400 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600'
      : 'from-amber-200 via-orange-300 to-amber-400 dark:from-amber-700 dark:via-orange-600 dark:to-amber-700';

  return `
  <article class="group relative overflow-hidden rounded-3xl p-5 ring-1 ring-black/5 dark:ring-white/10
                  bg-white/90 dark:bg-slate-900/60
                  shadow-[0_10px_25px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_40px_rgba(2,6,23,0.12)]
                  transition cursor-pointer" data-group-id="${data.group?.id || ''}">
    <!-- ambient conic aura -->
    <div aria-hidden class="pointer-events-none absolute -inset-px rounded-[22px] opacity-20 blur-xl"
         style="background: conic-gradient(${palette.solid}, transparent 35deg)"></div>

    <div class="relative grid gap-4 md:grid-cols-[auto_1fr_auto] items-center">

      <!-- medal / rank chip -->
      <div class="flex flex-col items-center justify-center rounded-2xl px-4 py-3 text-white shadow
                  bg-gradient-to-br ${medalBg}">
        <i class="fa-solid ${medalIcon} text-xl drop-shadow"></i>
        <span class="mt-1 text-sm font-bold">${rankText}</span>
      </div>

      <!-- main content -->
      <div class="min-w-0 space-y-2">
        <div class="flex items-center justify-between gap-3">
          <h4 class="truncate text-base font-semibold text-slate-900 dark:text-white" title="${groupName}">
            ${groupName}
          </h4>
          <span class="inline-flex items-center gap-2 rounded-full bg-slate-900/5 dark:bg-white/10
                       px-3 py-1 text-[11px] font-semibold">
            <i class="fas fa-diagram-project text-indigo-500"></i> টাস্ক: ${tasks}
          </span>
        </div>

        <!-- mini stats -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span class="inline-flex items-center gap-2">
            <i class="fas fa-users text-sky-500"></i> সদস্য: ${members}
          </span>
          <span class="inline-flex items-center gap-2">
            <i class="fas fa-user-check text-emerald-500"></i> মূল্যায়িত: ${evaluated}
          </span>
          <span class="inline-flex items-center gap-2 sm:justify-end">
            <i class="fas fa-clipboard-check text-purple-500"></i> সম্পন্ন: ${evals}
          </span>
        </div>

        <!-- progress + donut -->
        <div class="flex items-center gap-3">
          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div class="h-full rounded-full"
                 style="width:${Math.round(scorePct)}%;
                        background:${palette.solid};
                        box-shadow:0 6px 16px ${palette.shadow};">
            </div>
          </div>
          <div class="relative flex items-center justify-center w-16 h-16">
            ${_buildCircularMeter(scorePct, palette, 64)}
          </div>
        </div>
      </div>

      <!-- action (kept for a11y, but article handles click) -->
      <button class="hidden md:inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold
                     text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/70 dark:ring-white/15
                     hover:bg-slate-900/5 dark:hover:bg-white/10 transition"
              data-group-id="${data.group?.id || ''}"
              aria-label="গ্রুপ বিস্তারিত">
        <i class="fas fa-arrow-right"></i> বিস্তারিত
      </button>
    </div>
  </article>`;
}

/** UPDATED: Renders group ranking list using new Rank Card */
function _renderGroupsRanking(groupData) {
  if (!elements.groupsRankingList) return;
  uiManager.clearContainer(elements.groupsRankingList);

  const evaluatedGroups = groupData.filter((g) => g.evalCount > 0);
  if (evaluatedGroups.length === 0) {
    uiManager.displayEmptyMessage(elements.groupsRankingList, 'র‍্যাঙ্কিংয়ের জন্য ডেটা নেই।');
    return;
  }

  // tie-aware rank (same logic as before)
  let rank = 0;
  let lastScore = -1;
  let lastEvalCount = -1;

  const cards = evaluatedGroups
    .map((data, index) => {
      if (data.averageScore !== lastScore || data.evalCount !== lastEvalCount) {
        rank = index + 1;
        lastScore = data.averageScore;
        lastEvalCount = data.evalCount;
      }
      return _buildRankCard(data, rank);
    })
    .join('');

  elements.groupsRankingList.innerHTML = `
    <div class="grid grid-cols-1 gap-4 sm:gap-5">
      ${cards}
    </div>
  `;

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
