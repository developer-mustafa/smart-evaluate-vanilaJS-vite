// js/components/upcoming-assignments.js
// ✅ Focus-first sort + 3D Cards + Left-rail number + Countdown (conditional) + Light Red/Rose 3D Schedule Pill
// ✅ Date-only → assumes local 10:20 AM for countdown/status

let stateManager;
let uiManager;
let helpers;

const elements = {};
let countdownTimer = null; // shared ticker

const STATUS_ORDER = ['upcoming', 'ongoing', 'completed'];
const STATUS_META = {
  upcoming: {
    label: 'আপকামিং এসাইনমেন্ট',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
    card: 'border-sky-100 dark:border-sky-800/60',
    icon: 'fas fa-calendar-plus text-sky-500',
  },
  ongoing: {
    label: 'চলমান এসাইনমেন্ট',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
    card: 'border-amber-100 dark:border-amber-800/60',
    icon: 'fas fa-spinner text-amber-500',
  },
  completed: {
    label: 'কমপ্লিট এসাইনমেন্ট',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
    card: 'border-emerald-100 dark:border-emerald-800/60',
    icon: 'fas fa-check-circle text-emerald-500',
  },
};

export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  helpers = dependencies.utils;

  _ensurePillStyles(); // inject countdown + light red/rose chef styles
  _cacheDOMElements();
  _bindEvents();

  console.log('✅ UpcomingAssignments (focus-first + 10:20 rule + light red chef) initialized.');
  return { render };
}

function _cacheDOMElements() {
  elements.page = document.getElementById('page-upcoming-assignments');
  elements.summary = document.getElementById('upcomingAssignmentSummary');
  elements.list = document.getElementById('upcomingAssignmentsList');
  elements.filter = document.getElementById('assignmentStatusFilter');
}

function _bindEvents() {
  if (elements.filter) {
    uiManager.addListener(elements.filter, 'change', () => render());
  }
  uiManager.addListener(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[data-acc-panel][data-open="true"]').forEach((p) => _animateToggle(p, false));
      document
        .querySelectorAll('[data-acc-btn][aria-expanded="true"]')
        .forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
  });
}

/* =========================
   Injected Styles (countdown pills + LIGHT red/rose 3D chef)
========================= */
function _ensurePillStyles() {
  if (document.getElementById('ua-pill-styles')) return;
  const style = document.createElement('style');
  style.id = 'ua-pill-styles';
  style.textContent = `
  /* Countdown pill (with conditional colors) */
  .cd-pill{
    display:inline-flex; align-items:center; gap:.45rem;
    border-radius:.7rem; padding:.28rem .65rem;
    font-weight:700; font-size:.875rem; line-height:1.1;
    border:1px solid var(--border);
    background: var(--surface-2);
    box-shadow: var(--inner-highlight);
    white-space:nowrap;
  }
  .cd-green{ color:#166534; background:rgba(187,247,208,.65); border-color:rgba(22,101,52,.25); }
  .dark .cd-green{ color:#A7F3D0; background:rgba(6,95,70,.35); border-color:rgba(167,243,208,.2); }

  .cd-amber{ color:#92400e; background:rgba(254,243,199,.65); border-color:rgba(146,64,14,.25); }
  .dark .cd-amber{ color:#FDE68A; background:rgba(120,53,15,.35); border-color:rgba(253,230,138,.2); }

  .cd-red{ color:#7f1d1d; background:rgba(254,226,226,.85); border-color:rgba(127,29,29,.22); }
  .dark .cd-red{ color:#fecaca; background:rgba(127,29,29,.28); border-color:rgba(254,202,202,.18); }

  @keyframes uablink { 0%, 60%, 100% { opacity:1 } 30% { opacity:.35 } }
  .cd-blink { animation: uablink 1.2s linear infinite; }

  /* Light Red/Rose 3D "Chef" schedule pill (softer tone, high readability) */
  .sched-pill--rose3d{
    --c1:#FFE4E6; --c2:#FECDD3; --c3:#FB7185; --c4:#F43F5E;
    display:inline-flex; align-items:center; gap:.55rem;
    border-radius:.85rem; padding:.36rem .78rem;
    font-weight:800; font-size:.92rem; line-height:1.12;
    white-space:nowrap;
    border:1px solid rgba(244,63,94,.28);
    background:
      radial-gradient(120% 160% at 115% -20%, rgba(255,255,255,.42), transparent 55%),
      linear-gradient(135deg, var(--c1), var(--c2) 42%, var(--c3) 70%, var(--c4));
    color:#3f1116;
    box-shadow: 0 1px 0 rgba(255,255,255,.75) inset,
                0 10px 18px rgba(244,63,94,.16),
                var(--inner-highlight);
  }
  .sched-pill--rose3d .sched-icon{
    width:18px; height:18px; display:inline-grid; place-items:center;
    border-radius:.5rem;
    background: rgba(255,255,255,.75);
    box-shadow: 0 1px 0 rgba(0,0,0,.06) inset;
  }
  .dark .sched-pill--rose3d{
    --c1:#4c0b12; --c2:#7f1423; --c3:#be2c41; --c4:#e11d48;
    color:#FFE4E6;
    border-color: rgba(244,63,94,.22);
    background:
      radial-gradient(120% 160% at 115% -20%, rgba(255,255,255,.12), transparent 55%),
      linear-gradient(135deg, var(--c1), var(--c2) 40%, var(--c3) 68%, var(--c4));
    box-shadow: 0 1px 0 rgba(255,255,255,.10) inset,
                0 14px 24px rgba(0,0,0,.34),
                var(--inner-highlight);
  }
  .sched-label{ letter-spacing:.02em; }
  .dot{ opacity:.6; margin:0 .45rem; }
  `;
  document.head.appendChild(style);
}

/* =========================
   Utilities
========================= */

function _coerceDate(raw) {
  if (!raw) return null;
  try {
    if (typeof raw.toDate === 'function') return raw.toDate(); // Firebase
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** If date looks date-only (00:00:00), set local time to 10:20 AM */
function _applyDefaultTimeIfDateOnly(dateObj) {
  if (!dateObj) return null;
  const hasTime =
    dateObj.getHours() !== 0 ||
    dateObj.getMinutes() !== 0 ||
    dateObj.getSeconds() !== 0 ||
    dateObj.getMilliseconds() !== 0;
  if (hasTime) return dateObj;

  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 10, 20, 0, 0); // 10:20 AM local
  return d;
}

function _getSortableDate(dateInput) {
  const d = _coerceDate(dateInput);
  return _applyDefaultTimeIfDateOnly(d) || d;
}

function _bn(n) {
  const s = String(n);
  return helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(s) : s;
}

/** returns parts + remainingDays (ceil) + remainingMs (future only) */
function _diffParts(targetDate) {
  const now = Date.now();
  const t = targetDate?.getTime?.() ?? NaN;
  if (Number.isNaN(t)) return { valid: false };

  let delta = t - now;
  const past = delta <= 0;
  if (past) delta = Math.abs(delta);

  const sec = Math.floor(delta / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const remainingDays = past ? 0 : Math.ceil((t - now) / 86400000);
  const remainingMs = past ? Number.POSITIVE_INFINITY : t - now;

  return { valid: true, past, days, hours, minutes, seconds, remainingDays, remainingMs };
}

function _countdownLabel(parts, isStart = true) {
  if (!parts.valid) return 'সময় অকার্যকর';
  const D = _bn(parts.days),
    H = _bn(parts.hours),
    M = _bn(parts.minutes),
    S = _bn(parts.seconds);
  if (!parts.past) {
    return isStart
      ? `শুরু হতে বাকি: ${D} দিন ${H} ঘন্টা ${M} মিনিট ${S} সেকেন্ড`
      : `শেষ হতে বাকি: ${D} দিন ${H} ঘন্টা ${M} মিনিট ${S} সেকেন্ড`;
  }
  return isStart
    ? `শুরু হয়েছে: ${D} দিন ${H} ঘন্টা ${M} মিনিট ${S} সেকেন্ড আগে`
    : `শেষ হয়েছে: ${D} দিন ${H} ঘন্টা ${M} মিনিট ${S} সেকেন্ড আগে`;
}

function _countdownClass(parts) {
  if (!parts.valid) return 'cd-pill';
  const d = parts.remainingDays;
  if (d > 14) return 'cd-pill cd-green';
  if (d > 7) return 'cd-pill cd-amber';
  if (d >= 4) return 'cd-pill cd-red';
  return 'cd-pill cd-red cd-blink'; // 0–3 days → blink
}

/* =========================
   Render Pipeline
========================= */

export function render() {
  if (!elements.page) return;

  const tasks = stateManager.get('tasks') || [];
  const evaluations = stateManager.get('evaluations') || [];

  // Normalize first (so we have adjusted 10:20 time)
  const normalized = tasks.map((task) => _normalizeTask(task, evaluations));

  // Focus-first sorting:
  // upcoming by urgency (remainingMs asc) → ongoing → completed
  const now = Date.now();
  const bucket = (t) => (t.status === 'upcoming' ? 0 : t.status === 'ongoing' ? 1 : 2);
  const urgency = (t) => {
    const d = t._dateObj;
    if (!d) return Number.POSITIVE_INFINITY;
    const ms = d.getTime() - now;
    return ms > 0 ? ms : Number.POSITIVE_INFINITY;
  };
  const tms = (t) => (t._dateObj ? t._dateObj.getTime() : -Infinity);

  normalized.sort((a, b) => {
    const ba = bucket(a),
      bb = bucket(b);
    if (ba !== bb) return ba - bb;

    if (ba === 0) {
      // upcoming → by urgency
      const ua = urgency(a),
        ub = urgency(b);
      if (ua !== ub) return ua - ub;
      return tms(a) - tms(b);
    }
    // ongoing/completed → by date desc
    return tms(b) - tms(a);
  });

  // running serial (current view)
  normalized.forEach((t, i) => (t.assignmentNumber = i + 1));

  _renderSummary(normalized);
  _renderAssignments(normalized);

  _startCountdownTicker();
}

function _renderSummary(tasks) {
  if (!elements.summary) return;

  const total = tasks.length;
  const stats = STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));

  const cardsHtml = [
    _summaryCard('মোট এসাইনমেন্ট', total, 'fas fa-layer-group', 'from-slate-900 via-slate-800 to-slate-900'),
    ...stats.map((item) =>
      _summaryCard(
        STATUS_META[item.status].label,
        item.count,
        STATUS_META[item.status].icon,
        _getGradientForStatus(item.status)
      )
    ),
  ];

  elements.summary.innerHTML = cardsHtml.join('');
}

function _summaryCard(label, value, icon, gradient) {
  const formattedValue = _bn(value);
  return `
    <div class="summary-3d rounded-2xl p-4 text-white bg-gradient-to-br ${gradient}">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-white/80">${label}</p>
          <p class="mt-2 text-2xl font-semibold drop-shadow-sm">${formattedValue}</p>
        </div>
        <span class="text-2xl opacity-90 drop-shadow-sm"><i class="${icon}"></i></span>
      </div>
    </div>
  `;
}

/* =========================
   List + Cards
========================= */

function _renderAssignments(tasks) {
  if (!elements.list) return;

  const filterValue = elements.filter?.value || 'all';
  const visibleStatuses = filterValue === 'all' ? STATUS_ORDER : [filterValue];
  let content = '';

  visibleStatuses.forEach((status) => {
    const statusTasks = tasks.filter((task) => task.status === status);
    if (!statusTasks.length) return;
    const cards = statusTasks.map(_assignmentCard).join('');

    content += `
      <section class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="chip-3d inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
            STATUS_META[status].chip
          }">
            <i class="${STATUS_META[status].icon}"></i>${STATUS_META[status].label}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            ${_bn(statusTasks.length)} টি এন্ট্রি
          </span>
        </div>
        <div class="space-y-3">${cards}</div>
      </section>
    `;
  });

  elements.list.innerHTML =
    content ||
    `
    <div class="placeholder-content">
      <i class="fas fa-inbox mr-2"></i>
      এই স্টেটাসে কোনো এসাইনমেন্ট পাওয়া যায়নি।
    </div>
  `;

  _wireAccordions();
}

/* Card (left rail number + countdown + LIGHT ROSE 3D schedule pill + accordion) */
function _assignmentCard(task) {
  const meta = STATUS_META[task.status] || STATUS_META.upcoming;
  const participantsLabel = _bn(task.participants);

  const assignmentNumber = task.assignmentNumber || 0;
  const formattedNumber = _bn(assignmentNumber);
  const dateLabel = task.dateLabel || 'তারিখ নির্ধারিত নয়';

  const accId = `acc_${task.id || Math.random().toString(36).slice(2)}`;
  const panelId = `panel_${task.id || Math.random().toString(36).slice(2)}`;

  // Countdown (colored dynamically)
  const countdownHtml = `
    <span class="cd-pill" data-cd data-iso="${task.dateISO || ''}" data-mode="start">
      <i class="fas fa-hourglass-half"></i>
      <span class="cd-text">—</span>
    </span>
  `;

  // LIGHT ROSE 3D schedule pill — only for UPCOMING; single “অনুষ্ঠিত হবে:”
  const roseChef =
    task.status === 'upcoming'
      ? `
      <span class="sched-pill--rose3d">
        <span class="sched-icon"><i class="fas fa-crown"></i></span>
        <span class="sched-label">অনুষ্ঠিত হবে :</span>
        <span class="dot">•</span>${dateLabel}
      </span>
    `
      : '';

  return `
    <article
      class="relative card-3d card-3d--bevel focusable overflow-hidden flex"
      tabindex="0"
      role="group"
      aria-label="${helpers.ensureBengaliText(task.name)}"
    >
      <!-- Left Rail: পরীক্ষার নং (original) -->
      <div class="flex-shrink-0 w-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/60 p-4 border-r border-gray-100 dark:border-gray-700/50">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">পরীক্ষা</span>
        <span class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">${formattedNumber}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <!-- Top row: chip + countdown + ROSE 3D pill -->
            <div class="flex items-center flex-wrap gap-2">
              <span class="chip-3d inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                meta.chip
              }">
                <i class="${meta.icon}"></i>${STATUS_META[task.status].label}
              </span>

              ${countdownHtml}
              ${roseChef}
            </div>

            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mt-2">${task.name}</h4>
          </div>

          <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span class="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800/70 px-3 py-1 border border-gray-200/80 dark:border-white/10 shadow-[var(--inner-highlight)]">
              <i class="fas fa-user-check text-blue-500"></i> অংশগ্রহণ: ${participantsLabel}
            </span>
            <span class="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800/70 px-3 py-1 border border-gray-200/80 dark:border-white/10 shadow-[var(--inner-highlight)]">
              <i class="fas fa-clock text-purple-500"></i> অবস্থা: ${task.timelineLabel}
            </span>
          </div>
        </div>

        <!-- Accordion -->
        ${_renderAccordion(task, accId, panelId)}
      </div>
    </article>
  `;
}

/* =========================
   Accordion (Smooth)
========================= */

function _renderAccordion(task, accId, panelId) {
  const trimmed = (task.description || '').trim();
  if (!trimmed) return '';

  const items = trimmed
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const content =
    items.length <= 1
      ? `<p class="leading-relaxed">${helpers.ensureBengaliText(trimmed)}</p>`
      : `<ul class="list-disc list-inside space-y-1.5">${items
          .map((i) => `<li>${helpers.ensureBengaliText(i)}</li>`)
          .join('')}</ul>`;

  return `
    <div class="mt-4">
      <button
        id="${accId}"
        data-acc-btn
        class="w-full flex items-center justify-between gap-3 rounded-xl border border-gray-300/80 dark:border-white/10 bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 text-left focusable"
        aria-expanded="false"
        aria-controls="${panelId}"
      >
        <span class="inline-flex items-center gap-2 text-sm font-semibold">
          <i class="fas fa-list-check"></i>
          প্রি-রিকোয়ারমেন্টস
        </span>
        <i class="fas fa-chevron-down transition-transform duration-200 ease-out" data-acc-chevron></i>
      </button>

      <div
        id="${panelId}"
        data-acc-panel
        data-open="false"
        class="overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 mt-2"
        style="max-height:0; transition:max-height .28s ease;"
      >
        <div class="p-4 text-sm text-gray-700 dark:text-gray-300">${content}</div>
      </div>
    </div>
  `;
}

function _wireAccordions() {
  const buttons = document.querySelectorAll('[data-acc-btn]');
  buttons.forEach((btn) => {
    if (btn.__wired) return;
    btn.__wired = true;

    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    const chevron = btn.querySelector('[data-acc-chevron]');

    uiManager.addListener(btn, 'click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      _animateToggle(panel, !isOpen);
      if (chevron) chevron.style.transform = !isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  });
}

function _animateToggle(panel, open) {
  if (!panel) return;
  const currentlyOpen = panel.getAttribute('data-open') === 'true';
  if (open === currentlyOpen) return;

  const startHeight = panel.getBoundingClientRect().height;
  panel.style.maxHeight = startHeight + 'px';
  panel.setAttribute('data-open', String(open));

  const targetHeight = open ? panel.scrollHeight : 0;

  requestAnimationFrame(() => {
    panel.style.maxHeight = targetHeight + 'px';
  });

  const onEnd = () => {
    panel.style.maxHeight = open ? 'none' : '0';
    panel.removeEventListener('transitionend', onEnd);
  };
  panel.addEventListener('transitionend', onEnd, { once: true });
}

/* =========================
   Normalize + Status (10:20 rule applied here)
========================= */

function _normalizeTask(task, evaluations) {
  // coerce raw date
  const raw = _coerceDate(task.date);
  // apply 10:20 AM default if time missing
  const adjusted = _applyDefaultTimeIfDateOnly(raw) || raw;

  const status = _getTaskStatus({ ...task, date: adjusted });
  const dateInfo = _getDateInfo(adjusted);
  const participants = _countParticipants(task.id, evaluations);

  // ISO from adjusted date (so countdown uses 10:20 if date-only)
  const dateISO = adjusted ? adjusted.toISOString() : '';

  return {
    id: task.id,
    name: helpers.ensureBengaliText(task.name || 'অজ্ঞাত এসাইনমেন্ট'),
    status,
    dateLabel: dateInfo.label,
    timelineLabel: dateInfo.timelineLabel,
    scheduleText: dateInfo.scheduleText, // kept for other UI (we don't repeat near pill)
    description: task.description || '',
    participants,
    assignmentNumber: task.assignmentNumber,
    dateISO,
    _dateObj: adjusted,
  };
}

function _getTaskStatus(task) {
  const stored = typeof task.status === 'string' ? task.status.toLowerCase() : '';
  if (STATUS_ORDER.includes(stored)) return stored;
  return _deriveStatusFromDate(task.date);
}

function _deriveStatusFromDate(dateObj) {
  const { isFuture, isToday } = _getDateInfo(dateObj);
  if (isFuture) return 'upcoming';
  if (isToday) return 'ongoing';
  return 'completed';
}

function _getDateInfo(dateObj) {
  if (!dateObj) {
    return {
      label: 'তারিখ নির্ধারিত নয়',
      scheduleText: 'তারিখ আপডেট প্রয়োজন',
      timelineLabel: 'অজানা',
      isFuture: false,
      isToday: false,
    };
  }

  // ensure 10:20 AM default for date-only, but if time existed, keep it
  const adjusted = _applyDefaultTimeIfDateOnly(dateObj) || dateObj;

  const now = new Date();
  const isFuture = adjusted.getTime() > now.getTime();

  // "isToday" based on same calendar day
  const sameDay =
    adjusted.getFullYear() === now.getFullYear() &&
    adjusted.getMonth() === now.getMonth() &&
    adjusted.getDate() === now.getDate();

  const isToday = sameDay && adjusted.getTime() >= now.getTime();

  const label = helpers.formatTimestamp
    ? helpers.formatTimestamp(adjusted)
    : adjusted.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });

  let scheduleText = 'অনুষ্ঠিত হয়েছে';
  let timelineLabel = 'সমাপ্ত';
  if (isFuture) {
    scheduleText = 'অনুষ্ঠিত হবে';
    timelineLabel = 'আসন্ন';
  } else if (isToday) {
    scheduleText = 'আজ অনুষ্ঠিত';
    timelineLabel = 'চলমান';
  }

  return { label, scheduleText, timelineLabel, isFuture, isToday };
}

function _countParticipants(taskId, evaluations) {
  if (!taskId || !evaluations?.length) return 0;
  const unique = new Set();
  evaluations.forEach((evaluation) => {
    if (evaluation.taskId !== taskId) return;
    const scoreEntries = evaluation.scores || {};
    Object.keys(scoreEntries).forEach((studentId) => unique.add(studentId));
  });
  return unique.size;
}

function _trimText(text, limit = 1060) {
  if (!text) return '';
  if (typeof helpers?.truncateText === 'function') {
    return helpers.truncateText(text, limit);
  }
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function _getGradientForStatus(status) {
  switch (status) {
    case 'ongoing':
      return 'from-amber-800 via-amber-700 to-orange-800 dark:from-amber-900 dark:via-amber-800 dark:to-orange-900';
    case 'completed':
      return 'from-emerald-800 via-emerald-700 to-emerald-800 dark:from-emerald-900 dark:via-emerald-800 dark:to-emerald-900';
    default:
      return 'from-sky-800 via-blue-700 to-cyan-800 dark:from-sky-900 dark:via-blue-800 dark:to-cyan-900';
  }
}

/* =========================
   Countdown Ticker
========================= */

function _startCountdownTicker() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  _tickCountdowns();
  countdownTimer = setInterval(_tickCountdowns, 1000);
}

function _tickCountdowns() {
  const nodes = document.querySelectorAll('[data-cd][data-iso]');
  nodes.forEach((wrap) => {
    const iso = wrap.getAttribute('data-iso') || '';
    const mode = wrap.getAttribute('data-mode') || 'start';
    const span = wrap.querySelector('.cd-text');
    if (!iso || !span) {
      if (span) span.textContent = 'সময় নেই';
      return;
    }
    const target = new Date(iso);
    const parts = _diffParts(target);
    span.textContent = _countdownLabel(parts, mode === 'start');

    // update color class according to remainingDays
    const cls = _countdownClass(parts);
    wrap.className = cls;
  });
}
