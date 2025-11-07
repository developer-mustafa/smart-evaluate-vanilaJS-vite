// js/components/upcoming-assignments.js

let stateManager;
let uiManager;
let helpers;

const elements = {};

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

  _cacheDOMElements();
  _bindEvents();

  console.log('✅ UpcomingAssignments component initialized.');
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
}

/**
 * একটি তারিখ ইনপুট থেকে একটি সর্ট করার যোগ্য Date অবজেক্ট রিটার্ন করে।
 */
function _getSortableDate(dateInput) {
  if (!dateInput) {
    return null;
  }
  try {
    if (typeof dateInput.toDate === 'function') {
      return dateInput.toDate(); // Firebase timestamp
    }
    const dateObj = new Date(dateInput);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj; // Valid date
    }
    return null;
  } catch {
    return null;
  }
}

export function render() {
  if (!elements.page) return;

  const tasks = stateManager.get('tasks') || [];
  const evaluations = stateManager.get('evaluations') || [];

  // ১. সর্ট করার জন্য প্রতিটি টাস্কের সাথে তার Date অবজেক্ট যুক্ত করুন
  const tasksWithDates = tasks.map((task) => ({
    task,
    sortableDate: _getSortableDate(task.date),
  }));

  // ২. তারিখ অনুযায়ী টাস্কগুলো সাজান (সবচেয়ে পুরনো প্রথমে)
  tasksWithDates.sort((a, b) => {
    const dateA = a.sortableDate;
    const dateB = b.sortableDate;
    if (dateA && dateB) return dateA - dateB;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
  });

  // ৩. সাজানো লিস্টের উপর ম্যাপ করে টাস্ক নরম্যালাইজ করুন এবং ইউনিক কাউন্টার দিন
  let normalized = tasksWithDates.map((taskItem, index) => {
    const normalizedTask = _normalizeTask(taskItem.task, evaluations);
    normalizedTask.assignmentNumber = index + 1; // পুরনো = ১, নতুন = সর্বোচ্চ
    return normalizedTask;
  });

  // ৪. UI তে দেখানোর জন্য সম্পূর্ণ লিস্ট রিভার্স করুন
  normalized.reverse(); // নতুন (সর্বোচ্চ নং) = প্রথমে

  _renderSummary(normalized);
  _renderAssignments(normalized);
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
  const formattedValue = helpers?.convertToBanglaNumber ? helpers.convertToBanglaNumber(String(value)) : String(value);

  return `
    <div class="rounded-2xl p-4 text-white shadow-md bg-gradient-to-br ${gradient}">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-white/70">${label}</p>
          <p class="mt-2 text-2xl font-semibold">${formattedValue}</p>
        </div>
        <span class="text-2xl opacity-80"><i class="${icon}"></i></span>
      </div>
    </div>
  `;
}

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
          <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
            STATUS_META[status].chip
          }">
            <i class="${STATUS_META[status].icon}"></i>${STATUS_META[status].label}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            ${
              helpers?.convertToBanglaNumber
                ? helpers.convertToBanglaNumber(String(statusTasks.length))
                : statusTasks.length
            } টি এন্ট্রি
          </span>
        </div>
        <div class="space-y-3">${cards}</div>
      </section>
    `;
  });

  if (!content) {
    elements.list.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-inbox mr-2"></i>
        এই স্টেটাসে কোনো এসাইনমেন্ট পাওয়া যায়নি।
      </div>
    `;
    return;
  }

  elements.list.innerHTML = content;
}

/**
 * প্রি-রিকোয়ারমেন্টস টেক্সটকে একটি অ্যানিমেটেড টগল (<details>) বক্সে রেন্ডার করে।
 */
function _renderPrerequisitesToggle(description) {
  const trimmedDesc = description ? description.trim() : '';
  if (!trimmedDesc) return '';

  const items = trimmedDesc
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  let contentHtml;

  if (items.length <= 1) {
    contentHtml = `<p>${trimmedDesc}</p>`;
  } else {
    contentHtml = `
      <ul class="list-disc list-inside space-y-1.5">
        ${items.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }

  return `
    <details class="prereq-details">
      <summary class="prereq-summary">
        <i class="fas fa-chevron-down prereq-summary-icon"></i>
        প্রি-রিকোয়ারমেন্টস দেখুন
      </summary>
      <div class="prereq-content">
        <div class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          ${contentHtml}
        </div>
      </div>
    </details>
  `;
}

/**
 * একটি একক এসাইনমেন্ট কার্ড তৈরি করে (কাউন্টার সহ)
 */
function _assignmentCard(task) {
  const meta = STATUS_META[task.status] || STATUS_META.upcoming;
  const participantsLabel = helpers?.convertToBanglaNumber
    ? helpers.convertToBanglaNumber(String(task.participants))
    : task.participants;
  const dateLabel = task.dateLabel || 'তারিখ নির্ধারিত নয়';

  const assignmentNumber = task.assignmentNumber || 0;
  const formattedNumber = helpers?.convertToBanglaNumber
    ? helpers.convertToBanglaNumber(String(assignmentNumber))
    : String(assignmentNumber);

  return `
    <article class="rounded-2xl border ${
      meta.card
    } bg-white dark:bg-gray-900/70 transition hover:shadow-lg flex overflow-hidden">
      
      <div class="flex-shrink-0 w-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 p-4 border-r border-gray-100 dark:border-gray-700/50">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">পরীক্ষা</span>
        <span class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">${formattedNumber}</span>
      </div>
      
      <div class="flex-1 p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            
            <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chip}">
              <i class="${meta.icon}"></i>${meta.label}
            </span>

            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mt-2">${task.name}</h4>
            
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ${task.scheduleText} · ${dateLabel}
            </p>
            
            ${_renderPrerequisitesToggle(task.description)}

          </div>
          <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span class="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1">
              <i class="fas fa-user-check text-blue-500"></i> অংশগ্রহণ: ${participantsLabel}
            </span>
            <span class="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1">
              <i class="fas fa-clock text-purple-500"></i> অবস্থা: ${task.timelineLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function _normalizeTask(task, evaluations) {
  const status = _getTaskStatus(task);
  const dateInfo = _getDateInfo(task.date);
  const participants = _countParticipants(task.id, evaluations);

  return {
    id: task.id,
    name: helpers.ensureBengaliText(task.name || 'অজ্ঞাত এসাইনমেন্ট'),
    status,
    dateLabel: dateInfo.label,
    timelineLabel: dateInfo.timelineLabel,
    scheduleText: dateInfo.scheduleText,
    description: task.description || '',
    participants,
  };
}

function _getTaskStatus(task) {
  const stored = typeof task.status === 'string' ? task.status.toLowerCase() : '';
  if (STATUS_ORDER.includes(stored)) return stored;
  const dateStatus = _deriveStatusFromDate(task.date);
  return dateStatus;
}

function _deriveStatusFromDate(dateInput) {
  const { isFuture, isToday } = _getDateInfo(dateInput);
  if (isFuture) return 'upcoming';
  if (isToday) return 'ongoing';
  return 'completed';
}

function _getDateInfo(dateInput) {
  if (!dateInput) {
    return {
      label: 'তারিখ নির্ধারিত নয়',
      scheduleText: 'তারিখ আপডেট প্রয়োজন',
      timelineLabel: 'অজানা',
      isFuture: false,
      isToday: false,
    };
  }

  let dateObj;
  try {
    if (typeof dateInput.toDate === 'function') dateObj = dateInput.toDate();
    else dateObj = new Date(dateInput);
  } catch {
    dateObj = null;
  }

  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return {
      label: 'তারিখ নির্ধারিত নয়',
      scheduleText: 'তারিখ অকার্যকর',
      timelineLabel: 'অজানা',
      isFuture: false,
      isToday: false,
    };
  }

  const today = new Date();
  const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = dateOnly - todayOnly;
  const isFuture = diffMs > 0;
  const isToday = diffMs === 0;

  const label = helpers.formatTimestamp ? helpers.formatTimestamp(dateObj) : dateObj.toLocaleDateString('bn-BD');
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
      return 'from-amber-900 via-amber-800 to-orange-900';
    case 'completed':
      return 'from-emerald-900 via-emerald-800 to-emerald-900';
    default:
      return 'from-sky-900 via-blue-800 to-cyan-900';
  }
}
