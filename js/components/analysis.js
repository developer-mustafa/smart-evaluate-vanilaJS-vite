// js/components/analysis.js

import { PDF_FONT_BASE64 } from '../config/pdfFont.js';

let stateManager;
let uiManager;
let helpers;
let app;

const ANALYSIS_FILTER_KEY = 'analysis';
const MAX_PERCENT = 100;

const elements = {
  summaryPage: null,
  summaryHeader: null,
  summaryContent: null,
  summaryFilterGroup: null,
  summaryFilterTask: null,
  summaryFilterViewButtons: null,
  graphPage: null,
  graphFiltersContainer: null,
  graphDashboardContainer: null,
  graphDetailContainer: null,
  printableArea: null,
};

const VIEW_MODES = {
  TABLE: 'table',
  CHART: 'chart',
};

const SUMMARY_EVAL_VIEWS = {
  TABLE: 'table',
  CHART: 'chart',
};

const ROLE_LABELS = {
  'team-leader': 'টিম লিডার',
  'time-keeper': 'টাইম কিপার',
  'reporter': 'রিপোর্টার',
  'resource-manager': 'রিসোর্স ম্যানেজার',
  'peace-maker': 'পিস মেকার',
};


const CRITERIA_MAPPING = {
  topic: {
    topic_learned_well: {
      id: 'topic_learned_well',
      label: 'ভালো করে শিখেছি',
      marks: 10,
    },
    topic_understood: {
      id: 'topic_understood',
      label: 'শুধু বুঝেছি',
      marks: 5,
    },
    topic_none: {
      id: 'topic_none',
      label: 'এখনো পারিনি',
      marks: -5,
    },
  },
  options: {
    attendance_regular: {
      id: 'attendance_regular',
      label: 'সাপ্তাহিক নিয়মিত উপস্থিতি',
      marks: 10,
    },
    homework_done: {
      id: 'homework_done',
      label: 'সপ্তাহে প্রতিদিন বাড়ির কাজ',
      marks: 5,
    },
  },
};

const CUSTOM_CRITERIA = {
  FULL_POSITIVE: {
    id: 'full_positive',
    label: 'সব মানদণ্ড পূরণ',
  },
  IMPROVEMENT_NEEDED: {
    id: 'improvement_needed',
    label: 'উন্নয়ন প্রয়োজন',
  },
};

const CRITERIA_META_INDEX = (() => {
  const map = new Map();
  Object.values(CRITERIA_MAPPING.topic).forEach((criteria) => {
    map.set(criteria.id, {
      ...criteria,
      category: 'topic',
      categoryLabel: 'বিষয়ভিত্তিক মানদণ্ড',
    });
  });
  Object.values(CRITERIA_MAPPING.options).forEach((criteria) => {
    map.set(criteria.id, {
      ...criteria,
      category: 'options',
      categoryLabel: 'সহায়ক মানদণ্ড',
    });
  });
  map.set(CUSTOM_CRITERIA.FULL_POSITIVE.id, {
    ...CUSTOM_CRITERIA.FULL_POSITIVE,
    category: 'summary',
    categoryLabel: 'বিশেষ ফোকাস',
  });
  map.set(CUSTOM_CRITERIA.IMPROVEMENT_NEEDED.id, {
    ...CUSTOM_CRITERIA.IMPROVEMENT_NEEDED,
    category: 'summary',
    categoryLabel: 'বিশেষ ফোকাস',
  });
  return map;
})();

let pdfFontPromise = null;
let topicBarChart = null;
let criteriaPieChart = null;
let summaryEvaluationChart = null;
let currentCriteriaContext = null;
let currentCriteriaSelection = null;

export function init(dependencies) {
  stateManager = dependencies.managers.stateManager;
  uiManager = dependencies.managers.uiManager;
  helpers = dependencies.utils;
  app = dependencies.app;

  _cacheDOMElements();
  _ensureFilters();
  _renderAll();

  if (!window.smartEvaluator) window.smartEvaluator = {};
  window.smartEvaluator.components = window.smartEvaluator.components || {};
  window.smartEvaluator.components.analysis = {
    render: _renderAll,
    generateGroupAnalysisPDF,
    generateSelectedGroupPDF,
    printGroupAnalysis,
  };

  return {
    renderSummary: _renderSummarySection,
    renderGraphs: _renderGraphSection,
    generateGroupAnalysisPDF,
    generateSelectedGroupPDF,
    printGroupAnalysis,
  };
}

function _cacheDOMElements() {
  elements.summaryPage = document.getElementById('page-group-analysis');
  elements.summaryContent = document.getElementById('groupAnalysisDetails');
  elements.summaryFilterGroup = document.getElementById('analysisGroupSelect');
  elements.printableArea = document.getElementById('printableAnalysisArea');

  elements.graphPage = document.getElementById('page-graph-analysis');
  elements.graphFiltersContainer = document.getElementById('graphAnalysisContent');
  elements.graphDashboardContainer = elements.graphPage?.querySelector('.graph-dashboard-container');
  elements.graphDetailContainer = elements.graphPage?.querySelector('.graph-detail-container');
}

function _renderAll() {
  _renderSummarySection();
  _renderGraphSection();
}

function _ensureFilters() {
  const filters = stateManager.getFilterSection(ANALYSIS_FILTER_KEY) || {};
  const merged = {
    groupFilter: filters.groupFilter ?? 'all',
    taskFilter: filters.taskFilter ?? 'all',
    evaluationType: filters.evaluationType ?? 'all',
    viewMode: filters.viewMode ?? VIEW_MODES.TABLE,
    showFullOnly: filters.showFullOnly ?? false,
    criteriaView: filters.criteriaView ?? 'topic',
    summaryEvaluationView: filters.summaryEvaluationView ?? SUMMARY_EVAL_VIEWS.TABLE,
  };
  stateManager.updateFilters(ANALYSIS_FILTER_KEY, merged);
}

function _renderSummarySection() {
  if (!elements.summaryPage || !elements.summaryContent) return;

  const filters = stateManager.getFilterSection(ANALYSIS_FILTER_KEY);
  const data = _buildAnalysisData(filters);

  _renderSummaryFilters(filters, data);
  _renderSummaryDashboard(filters, data);
}

function _renderGraphSection() {
  if (!elements.graphPage || !elements.graphFiltersContainer) return;

  const filters = stateManager.getFilterSection(ANALYSIS_FILTER_KEY);
  const data = _buildAnalysisData(filters);

  _renderGraphFilters(filters, data);
  _renderGraphDashboard(filters, data);
}

function _renderSummaryFilters(filters, analysisData) {
  if (!elements.summaryFilterGroup) return;

  const { groups } = analysisData.options;
  const previousValue = elements.summaryFilterGroup.value;

  elements.summaryFilterGroup.innerHTML = [
    '<option value="all">সমস্ত গ্রুপ</option>',
    ...groups.map(
      (group) =>
        `<option value="${group.id}" ${group.id === filters.groupFilter ? 'selected' : ''}>${group.label}</option>`
    ),
  ].join('');

  elements.summaryFilterGroup.value = filters.groupFilter;

  if (previousValue && previousValue === elements.summaryFilterGroup.value) {
    // No change, do nothing.
  }

  if (!elements.summaryFilterGroup.dataset.analysisBound) {
    uiManager.addListener(elements.summaryFilterGroup, 'change', (event) => {
      _updateFilters({ groupFilter: event.target.value });
    });
    elements.summaryFilterGroup.dataset.analysisBound = 'true';
  }
}

function _renderSummaryDashboard(filters, analysisData) {
  if (!elements.summaryContent) return;

  const { groupMetrics, summary } = analysisData;
  const groupDetails = analysisData.groupDetails || new Map();
  const selectedGroupId = filters.groupFilter;
  const summaryView = filters.summaryEvaluationView || SUMMARY_EVAL_VIEWS.TABLE;
  const hasGroupSelected = selectedGroupId && selectedGroupId !== 'all';
  const selectedGroupData = hasGroupSelected ? groupDetails.get(selectedGroupId) : null;

  if (!hasGroupSelected || !selectedGroupData) {
    const actionsHtml = _renderSummaryActions(false);
    const cardsHtml = _renderSummaryCards(summary);
    const tableHtml = _renderGroupTable(groupMetrics, filters);

    elements.summaryContent.innerHTML = `
      <div class="space-y-6" id="printableAnalysisArea">
        ${actionsHtml}
        ${cardsHtml}
        ${tableHtml}
      </div>
    `;

    _destroySummaryEvaluationChart();
    _bindSummaryActions(false);
    return;
  }

  const actionsHtml = _renderSummaryActions(true);
  const overviewHeader = _renderGroupHeader(selectedGroupData);
  const overviewCards = _renderGroupOverviewCards(selectedGroupData.metric);
  const membersTable = _renderGroupMembersTable(selectedGroupData.members);
  const evaluationsSection = _renderGroupEvaluationsSection(selectedGroupData.evaluations, summaryView);

  elements.summaryContent.innerHTML = `
    <div class="space-y-6" id="printableAnalysisArea">
      ${actionsHtml}
      ${overviewHeader}
      ${overviewCards}
      ${membersTable}
      ${evaluationsSection}
    </div>
  `;

  _bindSummaryActions(true);
  _bindSummaryEvaluationView();

  if (summaryView === SUMMARY_EVAL_VIEWS.CHART) {
    _renderSummaryEvaluationChart(selectedGroupData.evaluations);
  } else {
    _destroySummaryEvaluationChart();
  }
}


function _renderSummaryActions(hasGroupSelected) {
  const primaryClass = 'inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const secondaryClass = 'inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500';

  return `
    <div class="flex flex-wrap items-center justify-end gap-2">
      <button type="button" class="${secondaryClass}" data-summary-action="print">
        <i class="fas fa-print"></i>
        Print
      </button>
      <button type="button" class="${secondaryClass}" data-summary-action="pdf-all">
        <i class="fas fa-file-pdf"></i>
        Export PDF
      </button>
      <button type="button" class="${primaryClass}${hasGroupSelected ? '' : ' opacity-60 cursor-not-allowed'}" data-summary-action="pdf-group" ${hasGroupSelected ? '' : 'disabled'}>
        <i class="fas fa-download"></i>
        Selected Group PDF
      </button>
    </div>
  `;
}

function _bindSummaryActions(hasGroupSelected) {
  if (!elements.summaryContent) return;

  const container = elements.summaryContent;
  const printBtn = container.querySelector('[data-summary-action="print"]');
  if (printBtn) {
    uiManager.addListener(printBtn, 'click', () => {
      printGroupAnalysis();
    });
  }

  const pdfAllBtn = container.querySelector('[data-summary-action="pdf-all"]');
  if (pdfAllBtn) {
    uiManager.addListener(pdfAllBtn, 'click', () => {
      generateGroupAnalysisPDF();
    });
  }

  const pdfGroupBtn = container.querySelector('[data-summary-action="pdf-group"]');
  if (pdfGroupBtn && hasGroupSelected) {
    uiManager.addListener(pdfGroupBtn, 'click', () => {
      generateSelectedGroupPDF();
    });
  }
}

function _renderGroupHeader(groupData) {
  if (!groupData) return '';

  const metric = groupData.metric || {};
  const groupName = metric.groupName || 'Group';
  const totalStudents = _formatNumber(metric.studentCount || 0);
  const participation = _formatPercent(metric.participationRate || 0);
  const latestEvaluation = groupData.evaluations?.[0]?.dateLabel || '-';
  const mentor = groupData.group?.mentor ? _formatText(groupData.group.mentor) : '';

  return `
    <div class="card card-body flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">${groupName}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Students: ${totalStudents} জন। Participation: ${participation}</p>
        ${mentor ? `<p class="text-sm text-gray-500 dark:text-gray-400">Mentor: ${mentor}</p>` : ''}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">Latest evaluation: ${latestEvaluation}</div>
    </div>
  `;
}

function _renderGroupOverviewCards(metric) {
  if (!metric) return '';

  return `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      ${_createSummaryCard('মোট মূল্যায়ন', metric.evaluationCount, 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200', 'fa-clipboard-check')}
      ${_createSummaryCard('গড় মোট স্কোর (%)', _formatPercent(metric.averageScore), 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', 'fa-gauge')}
      ${_createSummaryCard('অংশগ্রহণের হার', _formatPercent(metric.participationRate), 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200', 'fa-people-group')}
      ${_createSummaryCard('লম্বিত শিক্ষার্থী', _formatNumber(metric.pendingStudents), 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200', 'fa-user-clock')}
    </div>
  `;
}

function _renderGroupMembersTable(members) {
  if (!Array.isArray(members) || !members.length) {
    return `
      <div class="card card-body">
        <div class="placeholder-content">
          <i class="fas fa-user-group mr-2"></i>
          No student records available for this group yet.
        </div>
      </div>
    `;
  }

  const rows = members
    .map((member) => {
      const hasEvaluations = member.evaluationCount > 0;
      const avgTask = hasEvaluations ? _formatDecimal(member.avgTaskScore) : '-';
      const avgTeam = hasEvaluations ? _formatDecimal(member.avgTeamScore) : '-';
      const avgAdditional = hasEvaluations ? _formatDecimal(member.avgAdditionalScore) : '-';
      const avgTotal = hasEvaluations ? _formatDecimal(member.avgTotalScore) : '-';
      const comment = member.latestComment ? _formatText(member.latestComment) : '-';
      const roleLabel = _formatRole(member.role);
      const evaluationsCount = _formatNumber(member.evaluationCount || 0);

      return `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
          <td class="px-4 py-3">
            <div class="font-semibold text-gray-800 dark:text-gray-100">${member.name}</div>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Evaluations: ${evaluationsCount}</span>
              ${roleLabel ? `<span class=\"inline-flex items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-0.5\">${roleLabel}</span>` : ''}
            </div>
          </td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300">${member.roll ? _formatText(member.roll) : '-'}</td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300">${member.academicGroup || '-'}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${avgTeam}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${avgTask}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${avgAdditional}</td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${comment}</td>
          <td class="px-4 py-3 text-center font-semibold text-indigo-600 dark:text-indigo-300">${avgTotal}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="card">
      <div class="card-header flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">গ্রুপ সদস্যদের সারাংশ</h3>
      </div>
      <div class="card-body overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th class="px-4 py-3 text-left font-semibold uppercase text-gray-600 dark:text-gray-300">শিক্ষার্থীর নাম</th>
              <th class="px-4 py-3 text-left font-semibold uppercase text-gray-600 dark:text-gray-300">রোল</th>
              <th class="px-4 py-3 text-left font-semibold uppercase text-gray-600 dark:text-gray-300">একাডেমিক গ্রুপ</th>
              <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">টিম স্কোর</th>
              <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">টাস্ক স্কোর</th>
              <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">অতিরিক্ত স্কোর</th>
              <th class="px-4 py-3 text-left font-semibold uppercase text-gray-600 dark:text-gray-300">মন্তব্য</th>
              <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">গড় মার্কস</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderGroupEvaluationsSection(evaluations, view) {
  const hasEvaluations = Array.isArray(evaluations) && evaluations.length > 0;

  if (!hasEvaluations) {
    return `
      <div class="card card-body">
        <div class="placeholder-content">
          <i class="fas fa-chart-bar mr-2"></i>
          No evaluations available yet for this group.
        </div>
      </div>
    `;
  }

  const viewButtons = [SUMMARY_EVAL_VIEWS.TABLE, SUMMARY_EVAL_VIEWS.CHART]
    .map((mode) =>
      _createToggleButton(
        mode,
        mode === SUMMARY_EVAL_VIEWS.TABLE ? 'টেবিল ভিউ' : 'বার চার্ট ভিউ',
        view === mode,
        'data-summary-eval-view'
      )
    )
    .join('');

  const mainContent =
    view === SUMMARY_EVAL_VIEWS.CHART
      ? '<div class="h-80"><canvas id="summaryEvaluationChart"></canvas></div>'
      : _renderGroupEvaluationsTable(evaluations);

  return `
    <div class="card">
      <div class="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">গ্রুপ মূল্যায়ন বিশ্লেষণ</h3>
        <div class="flex flex-wrap gap-2">${viewButtons}</div>
      </div>
      <div class="card-body space-y-4">
        ${mainContent}
      </div>
    </div>
  `;
}

function _renderGroupEvaluationsTable(evaluations) {
  const rows = evaluations
    .map((evaluation) => {
      const totalStudents = evaluation.assessedCount + evaluation.pendingCount;
      return `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
          <td class="px-4 py-3 text-gray-800 dark:text-gray-100 font-semibold">${evaluation.taskName}</td>
          <td class="px-4 py-3 text-gray-600 dark:text-gray-300">${evaluation.dateLabel || '-'}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatNumber(evaluation.assessedCount)} / ${_formatNumber(totalStudents)}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatDecimal(evaluation.avgTaskScore)}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatDecimal(evaluation.avgTeamScore)}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatDecimal(evaluation.avgAdditionalScore)}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatDecimal(evaluation.avgTotalScore)}</td>
          <td class="px-4 py-3 text-center font-semibold text-indigo-600 dark:text-indigo-300">${_formatPercent(evaluation.averagePercentage)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/60">
          <tr>
            <th class="px-4 py-3 text-left font-semibold uppercase text-gray-600 dark:text-gray-300">মূল্যায়ন</th>
            <th class="px-4 py-3 text-left font-semibold uppercase text-gray-600 dark:text-gray-300">তারিখ</th>
            <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">অংশগ্রহণ</th>
            <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">গড় টাস্ক</th>
            <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">গড় টিম</th>
            <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">গড় অতিরিক্ত</th>
            <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">গড় মোট</th>
            <th class="px-4 py-3 text-center font-semibold uppercase text-gray-600 dark:text-gray-300">গড় %</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function _bindSummaryEvaluationView() {
  if (!elements.summaryContent) return;
  const buttons = elements.summaryContent.querySelectorAll('[data-summary-eval-view]');
  if (!buttons || !buttons.length) return;

  buttons.forEach((button) => {
    uiManager.addListener(button, 'click', () => {
      const value = button.getAttribute('data-analysis-value');
      if (!value) return;
      _updateFilters({ summaryEvaluationView: value });
    });
  });
}

function _renderSummaryEvaluationChart(evaluations) {
  if (!Array.isArray(evaluations) || !evaluations.length) {
    _destroySummaryEvaluationChart();
    return;
  }

  const canvas = document.getElementById('summaryEvaluationChart');
  if (!canvas) return;

  if (summaryEvaluationChart) {
    summaryEvaluationChart.destroy();
    summaryEvaluationChart = null;
  }

  const labels = evaluations.map((evaluation) => evaluation.taskName);
  const taskData = evaluations.map((evaluation) => evaluation.avgTaskScore || 0);
  const teamData = evaluations.map((evaluation) => evaluation.avgTeamScore || 0);
  const additionalData = evaluations.map((evaluation) => evaluation.avgAdditionalScore || 0);
  const totalData = evaluations.map((evaluation) => evaluation.avgTotalScore || 0);

  summaryEvaluationChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'টাস্ক', data: taskData, backgroundColor: 'rgba(99, 102, 241, 0.8)' },
        { label: 'টিম', data: teamData, backgroundColor: 'rgba(16, 185, 129, 0.8)' },
        { label: 'অতিরিক্ত', data: additionalData, backgroundColor: 'rgba(251, 191, 36, 0.85)' },
        { label: 'মোট', data: totalData, backgroundColor: 'rgba(59, 130, 246, 0.85)' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          stacked: false,
          ticks: { color: '#6b7280' },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#6b7280',
            callback: (value) => _formatDecimal(value),
          },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
        },
      },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${_formatDecimal(context.parsed.y)}`,
          },
        },
      },
    },
  });
}

function _destroySummaryEvaluationChart() {
  if (summaryEvaluationChart) {
    summaryEvaluationChart.destroy();
    summaryEvaluationChart = null;
  }
}

function _formatRole(role) {
  if (!role) return '';
  return ROLE_LABELS[role] || _formatText(role);
}


function _renderGraphFilters(filters, analysisData) {
  const { groups, tasks } = analysisData.options;
  const summary = analysisData.summary;

  const groupOptions = [
    '<option value="all">সমস্ত গ্রুপ</option>',
    ...groups.map(
      (group) =>
        `<option value="${group.id}" ${group.id === filters.groupFilter ? 'selected' : ''}>${group.label}</option>`
    ),
  ].join('');

  const taskOptions = [
    '<option value="all">সব মূল্যায়ন</option>',
    ...tasks.map(
      (task) => `<option value="${task.id}" ${task.id === filters.taskFilter ? 'selected' : ''}>${task.label}</option>`
    ),
  ].join('');

  const viewButtons = Object.values(VIEW_MODES)
    .map((mode) =>
      _createToggleButton(
        mode,
        mode === VIEW_MODES.TABLE ? 'টেবিল ভিউ' : 'চার্ট ভিউ',
        filters.viewMode === mode,
        'data-analysis-view'
      )
    )
    .join('');

  const evaluationButtons = ['all', 'mcq', 'regular']
    .map((value) => {
      const label = value === 'all' ? 'সব মূল্যায়ন' : value === 'mcq' ? 'MCQ মূল্যায়ন' : 'লিখিত/অন্যান্য';
      return _createToggleButton(value, label, filters.evaluationType === value, 'data-analysis-evaluation');
    })
    .join('');

  const criteriaViewButtons = ['topic', 'options', 'summary']
    .map((value) => {
      const label = value === 'topic' ? 'Topic Criteria' : value === 'options' ? 'Support Criteria' : 'Summary Focus';
      return _createToggleButton(value, label, filters.criteriaView === value, 'data-analysis-criteria-view');
    })
    .join('');

  elements.graphFiltersContainer.innerHTML = `
    <div class="space-y-6">
      <div class="grid gap-4 lg:grid-cols-4">
        <div>
          <label class="label" for="analysisGraphGroupSelect">গ্রুপ নির্বাচন</label>
          <select id="analysisGraphGroupSelect" class="form-select">
            ${groupOptions}
          </select>
        </div>
        <div>
          <label class="label" for="analysisGraphTaskSelect">মূল্যায়ন নির্বাচন</label>
          <select id="analysisGraphTaskSelect" class="form-select">
            ${taskOptions}
          </select>
        </div>
        <div>
          <label class="label">মূল্যায়ন ধরন</label>
          <div class="flex flex-wrap gap-2" id="analysisGraphEvaluationButtons">
            ${evaluationButtons}
          </div>
        </div>
        <div>
          <label class="label">Criteria Focus</label>
          <div class="flex flex-wrap gap-2" id="analysisCriteriaViewButtons">
            ${criteriaViewButtons}
          </div>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex flex-wrap gap-2" id="analysisGraphViewButtons">
          ${viewButtons}
        </div>
        <label class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" class="form-checkbox" id="analysisFullCriteriaToggle" ${
            filters.showFullOnly ? 'checked' : ''
          }>
          শুধুমাত্র ফুল ক্রাইটেরিয়া পূরণকারী গ্রুপ দেখাও
        </label>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          সক্রিয় গ্রুপ: ${_formatNumber(summary.groupsInView)} / ${_formatNumber(
    summary.totalGroups
  )} অংশগ্রহণ হার: ${_formatPercent(summary.participationRate)} সর্বশেষ মূল্যায়ন: ${
    summary.latestEvaluation || '—'
  }
        </div>
      </div>
    </div>
  `;

  const groupSelect = document.getElementById('analysisGraphGroupSelect');
  const taskSelect = document.getElementById('analysisGraphTaskSelect');
  const evaluationButtonContainer = document.getElementById('analysisGraphEvaluationButtons');
  const viewButtonContainer = document.getElementById('analysisGraphViewButtons');
  const criteriaViewContainer = document.getElementById('analysisCriteriaViewButtons');
  const fullCriteriaToggle = document.getElementById('analysisFullCriteriaToggle');

  uiManager.addListener(groupSelect, 'change', (event) => {
    _updateFilters({ groupFilter: event.target.value });
  });

  uiManager.addListener(taskSelect, 'change', (event) => {
    _updateFilters({ taskFilter: event.target.value });
  });

  evaluationButtonContainer?.querySelectorAll('button[data-analysis-evaluation]').forEach((button) => {
    uiManager.addListener(button, 'click', () => {
      const value = button.getAttribute('data-analysis-value');
      _updateFilters({ evaluationType: value });
    });
  });

  viewButtonContainer?.querySelectorAll('button[data-analysis-view]').forEach((button) => {
    uiManager.addListener(button, 'click', () => {
      const value = button.getAttribute('data-analysis-value');
      _updateFilters({ viewMode: value });
    });
  });

  criteriaViewContainer?.querySelectorAll('button[data-analysis-criteria-view]').forEach((button) => {
    uiManager.addListener(button, 'click', () => {
      const value = button.getAttribute('data-analysis-value');
      _updateFilters({ criteriaView: value });
    });
  });

  if (fullCriteriaToggle) {
    uiManager.addListener(fullCriteriaToggle, 'change', (event) => {
      _updateFilters({ showFullOnly: event.target.checked });
    });
  }
}

function _renderGraphDashboard(filters, analysisData) {
  const { groupMetrics, chartData, selectedGroupDetail, summary, criteriaContext } = analysisData;

  const visibleBuckets = _getCriteriaBucketsForView(criteriaContext, filters.criteriaView);
  const summaryCards = _renderSummaryCards(summary);
  const criteriaSection = _renderCriteriaOverview(criteriaContext, filters, visibleBuckets);
  const mainSection =
    filters.viewMode === VIEW_MODES.TABLE ? _renderGroupTable(groupMetrics, filters) : _renderChartsMarkup(chartData);
  const detailSection = `
    <div class="graph-detail-container space-y-6">
      ${selectedGroupDetail ? _renderGroupDetail(selectedGroupDetail) : ''}
      ${_renderCriteriaDetailPlaceholder(criteriaContext, visibleBuckets)}
    </div>
  `;
  const dashboard = `
    <div class="space-y-6">
      ${summaryCards}
      ${criteriaSection}
      ${mainSection}
      ${detailSection}
    </div>
  `;

  if (elements.graphPage) {
    if (!elements.graphDashboardContainer) {
      elements.graphDashboardContainer = document.createElement('div');
      elements.graphDashboardContainer.className = 'graph-dashboard-container space-y-6';
      elements.graphPage.appendChild(elements.graphDashboardContainer);
    }
    elements.graphDashboardContainer.innerHTML = dashboard;
    elements.graphDetailContainer = elements.graphDashboardContainer.querySelector('.graph-detail-container');

    _bindCriteriaInteractions(criteriaContext, filters, visibleBuckets);

    if (filters.viewMode === VIEW_MODES.CHART) {
      _initializeCharts(chartData);
    } else {
      _destroyCharts();
    }
  }
}

function _updateFilters(updates) {
  const current = { ...(stateManager.getFilterSection(ANALYSIS_FILTER_KEY) || {}) };
  const next = { ...current, ...updates };

  stateManager.updateFilters(ANALYSIS_FILTER_KEY, next);
  _renderAll();
}

function _createToggleButton(value, label, isActive, attribute) {
  const baseClass = 'px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm transition-colors';
  const activeClass = isActive
    ? 'bg-blue-600 text-white border-blue-600 shadow'
    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

  return `<button type="button" class="${baseClass} ${activeClass}" ${
    attribute ? `${attribute}=""` : ''
  } data-analysis-value="${value}">${label}</button>`;
}

function _buildAnalysisData(filters) {
  const groups = stateManager.get('groups') || [];
  const students = stateManager.get('students') || [];
  const tasks = stateManager.get('tasks') || [];
  const evaluations = stateManager.get('evaluations') || [];

  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const studentMap = new Map(students.map((student) => [student.id, student]));

  const studentsByGroup = new Map();
  students.forEach((student) => {
    if (!studentsByGroup.has(student.groupId)) {
      studentsByGroup.set(student.groupId, []);
    }
    studentsByGroup.get(student.groupId).push(student);
  });

  const groupSummaries = new Map();
  groups.forEach((group) => {
    const studentCount = studentsByGroup.get(group.id)?.length || 0;
    groupSummaries.set(group.id, {
      groupId: group.id,
      groupName: _formatText(group.name),
      studentCount,
      evaluationDetails: [],
    });
  });

  const taskOptionsMap = new Map();
  const groupDetailsMap = new Map();

  evaluations.forEach((evaluation) => {
    const groupSummary = groupSummaries.get(evaluation.groupId);
    if (!groupSummary) return;

    const task = taskMap.get(evaluation.taskId);
    if (task) {
      taskOptionsMap.set(task.id, {
        id: task.id,
        label: _formatText(task.name),
      });
    }

    const evaluationType = _isMcqEvaluation(task) ? 'mcq' : 'regular';
    const scores = evaluation.scores || {};

    const participants = new Set();
    const fullPositiveStudents = new Set();
    const improvementStudents = new Set();

    const topicCounts = {
      learnedWell: 0,
      understood: 0,
      notYet: 0,
    };
    const optionCounts = {
      attendance: 0,
      homework: 0,
    };

    const detail = {
      evaluationId: evaluation.id,
      taskId: evaluation.taskId,
      taskName: _formatText(task?.name || evaluation.taskName || 'অজানা মূল্যায়ন'),
      type: evaluationType,
      dateMs: _extractTimestamp(evaluation.taskDate || evaluation.updatedAt || evaluation.evaluationDate),
      dateLabel: '',
      assessedCount: 0,
      pendingCount: 0,
      averagePercentage: 0,
      participationRate: 0,
      topicCounts,
      optionCounts,
      fullPositiveCount: 0,
      improvementCount: 0,
      fullPositiveAll: false,
      participantIds: [],
      fullPositiveStudentIds: [],
      improvementStudentIds: [],
      weightedScoreSum: 0,
      weight: 0,
      studentRecords: [],
    };

    Object.entries(scores).forEach(([studentId, scoreData]) => {
      participants.add(studentId);

      const criteria = scoreData?.additionalCriteria || {};
      const topicChoice = criteria.topic || CRITERIA_MAPPING.topic.topic_none.id;
      const topicKey =
        topicChoice === CRITERIA_MAPPING.topic.topic_learned_well.id
          ? 'learnedWell'
          : topicChoice === CRITERIA_MAPPING.topic.topic_understood.id
          ? 'understood'
          : 'notYet';

      topicCounts[topicKey] = (topicCounts[topicKey] || 0) + 1;

      const attendance = Boolean(criteria.attendance);
      const homework = Boolean(criteria.homework);

      if (attendance) optionCounts.attendance += 1;
      if (homework) optionCounts.homework += 1;

      const fullPositive = topicKey === 'learnedWell' && attendance && homework;
      if (fullPositive) {
        fullPositiveStudents.add(studentId);
      }

      const improvementNeeded = topicKey === 'notYet' || !attendance || !homework;
      if (improvementNeeded) {
        improvementStudents.add(studentId);
      }

      const maxScore = parseFloat(evaluation.maxPossibleScore) || _deriveMaxScoreFromTask(task) || MAX_PERCENT;
      const rawScore = parseFloat(scoreData.totalScore) || 0;
      const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
      const taskScore = parseFloat(scoreData?.taskScore) || 0;
      const teamScore = parseFloat(scoreData?.teamScore) || 0;
      const additionalScore = parseFloat(scoreData?.additionalScore) || 0;
      const mcqScore = parseFloat(scoreData?.mcqScore) || 0;
      const comments = typeof scoreData?.comments === 'string' ? scoreData.comments.trim() : '';

      detail.weightedScoreSum += percentage;
      detail.weight += 1;

      detail.studentRecords.push({
        studentId,
        topicId: topicChoice,
        topicKey,
        attendance,
        homework,
        taskScore,
        teamScore,
        additionalScore,
        mcqScore,
        totalScore: rawScore,
        maxScore,
        percentage,
        evaluationId: evaluation.id,
        taskId: detail.taskId,
        taskName: detail.taskName,
        dateMs: detail.dateMs,
        dateLabel: detail.dateLabel,
        comments: _formatText(comments),
      });
    });

    detail.assessedCount = participants.size;
    detail.pendingCount = Math.max(groupSummary.studentCount - detail.assessedCount, 0);
    detail.averagePercentage = detail.weight > 0 ? detail.weightedScoreSum / detail.weight : 0;
    detail.participationRate =
      groupSummary.studentCount > 0 ? Math.min(100, (detail.assessedCount / groupSummary.studentCount) * 100) : 0;
    detail.fullPositiveCount = fullPositiveStudents.size;
    detail.improvementCount = improvementStudents.size;
    detail.fullPositiveAll = detail.assessedCount > 0 && detail.fullPositiveCount === detail.assessedCount;
    detail.dateLabel = detail.dateMs ? _formatDate(detail.dateMs) : '';
    detail.participantIds = Array.from(participants);
    detail.fullPositiveStudentIds = Array.from(fullPositiveStudents);
    detail.improvementStudentIds = Array.from(improvementStudents);

    groupSummary.evaluationDetails.push(detail);
  });

  const groupFilter = filters.groupFilter;
  const taskFilter = filters.taskFilter;
  const typeFilter = filters.evaluationType;

  const groupMetrics = [];
  let selectedGroupDetail = null;

  groupSummaries.forEach((summary) => {
    if (groupFilter !== 'all' && summary.groupId !== groupFilter) {
      return;
    }

    const relevantDetails = summary.evaluationDetails.filter((detail) => {
      const matchesTask = taskFilter === 'all' || detail.taskId === taskFilter;
      const matchesType = typeFilter === 'all' || detail.type === typeFilter;
      return matchesTask && matchesType;
    });

    if (!relevantDetails.length) {
      const baseMembers = (studentsByGroup.get(summary.groupId) || []).map((student) => ({
        studentId: student.id,
        name: _formatText(student.name || student.id),
        roll: student.roll ?? '',
        role: student.role || '',
        academicGroup: _formatText(student.academicGroup || ''),
        avgTaskScore: 0,
        avgTeamScore: 0,
        avgAdditionalScore: 0,
        avgMcqScore: 0,
        avgTotalScore: 0,
        totalScore: 0,
        evaluationCount: 0,
        latestComment: '',
      }));

      groupDetailsMap.set(summary.groupId, {
        metric: {
          groupId: summary.groupId,
          groupName: summary.groupName,
          studentCount: summary.studentCount,
          evaluationCount: 0,
          mcqEvaluationCount: 0,
          assessedCount: 0,
          pendingStudents: summary.studentCount,
          averageScore: 0,
          participationRate: 0,
          uniqueParticipantsCount: 0,
          topicCounts: { learnedWell: 0, understood: 0, notYet: 0 },
          optionCounts: { attendance: 0, homework: 0 },
          fullCriteriaStudents: 0,
          improvementCount: 0,
          fullCriteriaEvaluations: [],
          evaluationDetails: [],
          latestEvaluationMs: null,
        },
        group: groupMap.get(summary.groupId) || null,
        members: baseMembers,
        evaluations: [],
      });

      return;
    }

    const evaluationCount = relevantDetails.length;
    const mcqCount = relevantDetails.filter((d) => d.type === 'mcq').length;
    const assessed = relevantDetails.reduce((sum, detail) => sum + detail.assessedCount, 0);
    const pending = relevantDetails.reduce((sum, detail) => sum + detail.pendingCount, 0);
    const weightedScoreSum = relevantDetails.reduce((sum, detail) => sum + detail.weightedScoreSum, 0);
    const weight = relevantDetails.reduce((sum, detail) => sum + detail.weight, 0);

    const topicTotals = {
      learnedWell: 0,
      understood: 0,
      notYet: 0,
    };
    const optionTotals = {
      attendance: 0,
      homework: 0,
    };
    const participantIds = new Set();
    const fullPositiveIds = new Set();
    const improvementIds = new Set();
    const fullCriteriaSessions = [];

    relevantDetails.forEach((detail) => {
      topicTotals.learnedWell += detail.topicCounts.learnedWell;
      topicTotals.understood += detail.topicCounts.understood;
      topicTotals.notYet += detail.topicCounts.notYet;
      optionTotals.attendance += detail.optionCounts.attendance;
      optionTotals.homework += detail.optionCounts.homework;
      detail.participantIds.forEach((id) => participantIds.add(id));
      detail.fullPositiveStudentIds.forEach((id) => fullPositiveIds.add(id));
      detail.improvementStudentIds.forEach((id) => improvementIds.add(id));

      if (detail.fullPositiveAll) {
        fullCriteriaSessions.push(detail.taskName);
      }
    });

    const averageScore = weight > 0 ? weightedScoreSum / weight : 0;
    const uniqueParticipantsCount = participantIds.size;
    const participationRate =
      summary.studentCount > 0 ? Math.min(100, (uniqueParticipantsCount / summary.studentCount) * 100) : 0;

    const latestDateMs = relevantDetails.reduce(
      (acc, detail) => (detail.dateMs && detail.dateMs > acc ? detail.dateMs : acc),
      -Infinity
    );

    const metric = {
      groupId: summary.groupId,
      groupName: summary.groupName,
      studentCount: summary.studentCount,
      evaluationCount,
      mcqEvaluationCount: mcqCount,
      assessedCount: assessed,
      pendingStudents: pending,
      averageScore,
      participationRate,
      uniqueParticipantsCount,
      topicCounts: topicTotals,
      optionCounts: optionTotals,
      fullCriteriaStudents: fullPositiveIds.size,
      improvementCount: improvementIds.size,
      fullCriteriaEvaluations: fullCriteriaSessions,
      evaluationDetails: relevantDetails.sort((a, b) => (b.dateMs || 0) - (a.dateMs || 0)),
      latestEvaluationMs: latestDateMs > 0 ? latestDateMs : null,
    };

    const groupStudents = studentsByGroup.get(summary.groupId) || [];
    const memberAggregates = new Map();

    groupStudents.forEach((student) => {
      memberAggregates.set(student.id, {
        studentId: student.id,
        name: _formatText(student.name || student.id),
        roll: student.roll ?? '',
        role: student.role || '',
        academicGroup: _formatText(student.academicGroup || ''),
        totalTaskScore: 0,
        totalTeamScore: 0,
        totalAdditionalScore: 0,
        totalMcqScore: 0,
        totalScore: 0,
        evaluationCount: 0,
        latestComment: '',
        latestCommentDate: -Infinity,
      });
    });

    relevantDetails.forEach((detail) => {
      detail.studentRecords.forEach((record) => {
        const studentId = record.studentId;
        if (!studentId) return;

        if (!memberAggregates.has(studentId)) {
          const studentInfo = studentMap.get(studentId) || {};
          memberAggregates.set(studentId, {
            studentId,
            name: _formatText(studentInfo.name || studentId),
            roll: studentInfo.roll ?? '',
            role: studentInfo.role || '',
            academicGroup: _formatText(studentInfo.academicGroup || ''),
            totalTaskScore: 0,
            totalTeamScore: 0,
            totalAdditionalScore: 0,
            totalMcqScore: 0,
            totalScore: 0,
            evaluationCount: 0,
            latestComment: '',
            latestCommentDate: -Infinity,
          });
        }

        const aggregate = memberAggregates.get(studentId);
        aggregate.totalTaskScore += record.taskScore || 0;
        aggregate.totalTeamScore += record.teamScore || 0;
        aggregate.totalAdditionalScore += record.additionalScore || 0;
        aggregate.totalMcqScore += record.mcqScore || 0;
        aggregate.totalScore += record.totalScore || 0;
        aggregate.evaluationCount += 1;

        if (record.comments) {
          const recordDate = record.dateMs || 0;
          if (recordDate >= aggregate.latestCommentDate) {
            aggregate.latestComment = record.comments;
            aggregate.latestCommentDate = recordDate;
          }
        }
      });
    });

    const membersDetailed = Array.from(memberAggregates.values())
      .map((aggregate) => {
        const evaluationCountSafe = aggregate.evaluationCount || 0;
        const divisor = evaluationCountSafe || 1;

        return {
          studentId: aggregate.studentId,
          name: aggregate.name,
          roll: aggregate.roll,
          role: aggregate.role,
          academicGroup: aggregate.academicGroup,
          avgTaskScore: evaluationCountSafe ? aggregate.totalTaskScore / divisor : 0,
          avgTeamScore: evaluationCountSafe ? aggregate.totalTeamScore / divisor : 0,
          avgAdditionalScore: evaluationCountSafe ? aggregate.totalAdditionalScore / divisor : 0,
          avgMcqScore: evaluationCountSafe ? aggregate.totalMcqScore / divisor : 0,
          avgTotalScore: evaluationCountSafe ? aggregate.totalScore / divisor : 0,
          totalScore: aggregate.totalScore,
          evaluationCount: evaluationCountSafe,
          latestComment: aggregate.latestComment,
        };
      })
      .sort((a, b) => {
        if (b.evaluationCount !== a.evaluationCount) {
          return b.evaluationCount - a.evaluationCount;
        }
        return a.name.localeCompare(b.name);
      });

    const evaluationSummaries = relevantDetails
      .map((detail) => {
        const participantCount = detail.studentRecords.length || 0;
        const totals = detail.studentRecords.reduce(
          (acc, record) => {
            acc.task += record.taskScore || 0;
            acc.team += record.teamScore || 0;
            acc.additional += record.additionalScore || 0;
            acc.mcq += record.mcqScore || 0;
            acc.total += record.totalScore || 0;
            return acc;
          },
          { task: 0, team: 0, additional: 0, mcq: 0, total: 0 }
        );
        const divisor = participantCount || 1;

        return {
          evaluationId: detail.evaluationId,
          taskName: detail.taskName,
          dateLabel: detail.dateLabel,
          dateMs: detail.dateMs || null,
          assessedCount: detail.assessedCount,
          pendingCount: detail.pendingCount,
          averagePercentage: detail.averagePercentage,
          avgTaskScore: participantCount ? totals.task / divisor : 0,
          avgTeamScore: participantCount ? totals.team / divisor : 0,
          avgAdditionalScore: participantCount ? totals.additional / divisor : 0,
          avgMcqScore: participantCount ? totals.mcq / divisor : 0,
          avgTotalScore: participantCount ? totals.total / divisor : 0,
        };
      })
      .sort((a, b) => (b.dateMs || 0) - (a.dateMs || 0));

    groupDetailsMap.set(summary.groupId, {
      metric,
      group: groupMap.get(summary.groupId) || null,
      members: membersDetailed,
      evaluations: evaluationSummaries,
    });


    if (filters.showFullOnly && metric.fullCriteriaEvaluations.length === 0) {
      return;
    }

    groupMetrics.push(metric);

    if (filters.groupFilter !== 'all' && summary.groupId === filters.groupFilter) {
      selectedGroupDetail = metric;
    }
  });

  const summary = _buildDashboardSummary(groupMetrics, groupFilter, groupSummaries.size);
  const chartData = _buildChartData(groupMetrics, filters);

  const criteriaContext = _buildCriteriaContext(groupMetrics, studentMap, groupMap);
  currentCriteriaContext = criteriaContext;

  if (criteriaContext && currentCriteriaSelection && !criteriaContext.criteriaBuckets.has(currentCriteriaSelection)) {
    currentCriteriaSelection = null;
  }

  return {
    groupMetrics,
    summary,
    chartData,
    criteriaContext,
    selectedGroupDetail,
    groupDetails: groupDetailsMap,
    options: {
      groups: groups.map((group) => ({ id: group.id, label: _formatText(group.name) })),
      tasks: Array.from(taskOptionsMap.values()),
    },
  };
}

function _buildDashboardSummary(groupMetrics, groupFilter, totalGroupCount) {
  if (!groupMetrics.length) {
    return {
      groupsInView: 0,
      totalGroups: groupFilter === 'all' ? totalGroupCount : 1,
      totalEvaluations: 0,
      totalMcqEvaluations: 0,
      averageScore: 0,
      pendingStudents: 0,
      improvementStudents: 0,
      participationRate: 0,
      latestEvaluation: null,
      fullCriteriaGroups: 0,
    };
  }

  const totalEvaluations = groupMetrics.reduce((sum, metric) => sum + metric.evaluationCount, 0);
  const totalMcqEvaluations = groupMetrics.reduce((sum, metric) => sum + metric.mcqEvaluationCount, 0);
  const pendingStudents = groupMetrics.reduce((sum, metric) => sum + metric.pendingStudents, 0);
  const improvementStudents = groupMetrics.reduce((sum, metric) => sum + metric.improvementCount, 0);
  const weightedScoreSum = groupMetrics.reduce(
    (sum, metric) => sum + metric.averageScore * metric.uniqueParticipantsCount,
    0
  );
  const weight = groupMetrics.reduce((sum, metric) => sum + metric.uniqueParticipantsCount, 0);
  const averageScore = weight > 0 ? weightedScoreSum / weight : 0;
  const participationRate =
    groupMetrics.reduce((sum, metric) => sum + metric.participationRate, 0) / groupMetrics.length;
  const latestEvaluationMs = groupMetrics.reduce(
    (max, metric) => (metric.latestEvaluationMs && metric.latestEvaluationMs > max ? metric.latestEvaluationMs : max),
    -Infinity
  );
  const fullCriteriaGroups = groupMetrics.filter((metric) => metric.fullCriteriaEvaluations.length > 0).length;

  return {
    groupsInView: groupMetrics.length,
    totalGroups: groupFilter === 'all' ? totalGroupCount : 1,
    totalEvaluations,
    totalMcqEvaluations,
    averageScore,
    pendingStudents,
    improvementStudents,
    participationRate,
    latestEvaluation: latestEvaluationMs > 0 ? _formatDate(latestEvaluationMs) : null,
    fullCriteriaGroups,
  };
}

function _buildChartData(groupMetrics, filters) {
  if (!groupMetrics.length) {
    return {
      bar: null,
      pie: null,
    };
  }

  const labels = groupMetrics.map((metric) => metric.groupName);
  const learnedSeries = groupMetrics.map((metric) => metric.topicCounts.learnedWell);
  const understoodSeries = groupMetrics.map((metric) => metric.topicCounts.understood);
  const notYetSeries = groupMetrics.map((metric) => metric.topicCounts.notYet);
  const pendingSeries = groupMetrics.map((metric) => metric.pendingStudents);

  const bar = {
    labels,
    datasets: [
      {
        label: 'ভালো করে শিখেছি',
        data: learnedSeries,
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderRadius: 6,
      },
      {
        label: 'শুধু বুঝেছি',
        data: understoodSeries,
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'এখনো পারিনি',
        data: notYetSeries,
        backgroundColor: 'rgba(251, 191, 36, 0.75)',
        borderRadius: 6,
      },
      {
        label: 'বাকি শিক্ষার্থী',
        data: pendingSeries,
        type: 'line',
        borderColor: 'rgba(239, 68, 68, 0.95)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.35,
        borderWidth: 2,
        fill: true,
        yAxisID: 'y1',
      },
    ],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            callback: (value) => _formatNumber(value),
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            precision: 0,
            callback: (value) => _formatNumber(value),
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
          },
        },
      },
    },
  };

  let pie = null;
  if (filters.groupFilter !== 'all' && groupMetrics.length === 1) {
    const metric = groupMetrics[0];
    const totalTopic = metric.topicCounts.learnedWell + metric.topicCounts.understood + metric.topicCounts.notYet;

    if (totalTopic > 0) {
      pie = {
        labels: ['ভালো করে শিখেছি', 'শুধু বুঝেছি', 'এখনো পারিনি'],
        data: [metric.topicCounts.learnedWell, metric.topicCounts.understood, metric.topicCounts.notYet],
        colors: ['#10b981', '#6366f1', '#fbbf24'],
        title: `${metric.groupName} - টপিক রেটিং`,
      };
    }
  }

  return { bar, pie };
}

function _buildCriteriaContext(groupMetrics, studentMap, groupMap) {
  if (!Array.isArray(groupMetrics) || !groupMetrics.length) {
    return null;
  }

  const bucketsById = new Map();
  const bucketsByCategory = {
    topic: [],
    options: [],
    summary: [],
  };
  const allStudentIds = new Set();

  const ensureBucket = (criteriaId) => {
    const meta = CRITERIA_META_INDEX.get(criteriaId);
    if (!meta) return null;
    let bucket = bucketsById.get(criteriaId);
    if (!bucket) {
      bucket = {
        id: criteriaId,
        label: _formatText(meta.label),
        category: meta.category,
        categoryLabel: meta.categoryLabel,
        students: new Map(),
        count: 0,
        totalEntries: 0,
      };
      bucketsById.set(criteriaId, bucket);
      if (Array.isArray(bucketsByCategory[meta.category])) {
        bucketsByCategory[meta.category].push(bucket);
      }
    }
    return bucket;
  };

  const registerRecord = (criteriaId, studentInfo, record) => {
    const bucket = ensureBucket(criteriaId);
    if (!bucket) return;
    const existing = bucket.students.get(studentInfo.studentId) || {
      studentId: studentInfo.studentId,
      name: studentInfo.name,
      groupId: studentInfo.groupId,
      groupName: studentInfo.groupName,
      records: [],
    };
    existing.records.push(record);
    bucket.students.set(studentInfo.studentId, existing);
  };

  groupMetrics.forEach((metric) => {
    const groupName = _formatText(metric.groupName);
    (metric.evaluationDetails || []).forEach((detail) => {
      if (!Array.isArray(detail.studentRecords)) return;
      detail.studentRecords.forEach((record) => {
        const studentId = record.studentId;
        if (!studentId) return;
        allStudentIds.add(studentId);
        const student = studentMap.get(studentId) || {};
        const derivedGroupId = student.groupId || metric.groupId;
        const derivedGroup = groupMap.get(derivedGroupId);
        const studentInfo = {
          studentId,
          name: _formatText(student.name || record.displayName || studentId),
          groupId: derivedGroupId,
          groupName: _formatText(derivedGroup?.name || groupName),
        };
        const baseRecord = {
          evaluationId: record.evaluationId,
          taskId: record.taskId,
          taskName: _formatText(record.taskName),
          dateMs: record.dateMs,
          dateLabel: record.dateLabel || '',
          topicId: record.topicId,
          topicKey: record.topicKey,
          attendance: Boolean(record.attendance),
          homework: Boolean(record.homework),
          percentage: record.percentage,
          totalScore: record.totalScore,
          maxScore: record.maxScore,
          groupId: metric.groupId,
          groupName,
        };

        if (record.topicId) {
          registerRecord(record.topicId, studentInfo, baseRecord);
        }

        if (record.attendance) {
          registerRecord(CRITERIA_MAPPING.options.attendance_regular.id, studentInfo, baseRecord);
        }
        if (record.homework) {
          registerRecord(CRITERIA_MAPPING.options.homework_done.id, studentInfo, baseRecord);
        }

        const fullPositive = record.topicKey === 'learnedWell' && record.attendance && record.homework;
        const needsImprovement = record.topicKey === 'notYet' || !record.attendance || !record.homework;

        if (fullPositive) {
          registerRecord(CUSTOM_CRITERIA.FULL_POSITIVE.id, studentInfo, baseRecord);
        }
        if (needsImprovement) {
          registerRecord(CUSTOM_CRITERIA.IMPROVEMENT_NEEDED.id, studentInfo, baseRecord);
        }
      });
    });
  });

  bucketsById.forEach((bucket) => {
    bucket.count = bucket.students.size;
    bucket.totalEntries = Array.from(bucket.students.values()).reduce(
      (sum, student) => sum + student.records.length,
      0
    );
  });

  const sortBuckets = (collection) =>
    collection
      .filter((bucket) => bucket.count > 0)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });

  bucketsByCategory.topic = sortBuckets(bucketsByCategory.topic);
  bucketsByCategory.options = sortBuckets(bucketsByCategory.options);
  bucketsByCategory.summary = sortBuckets(bucketsByCategory.summary);

  if (!bucketsByCategory.topic.length && !bucketsByCategory.options.length && !bucketsByCategory.summary.length) {
    return null;
  }

  return {
    criteriaBuckets: bucketsById,
    bucketsByCategory,
    totalUniqueStudents: allStudentIds.size,
  };
}

function _getCriteriaBucketsForView(criteriaContext, viewValue) {
  if (!criteriaContext) return [];
  const category = viewValue === 'topic' ? 'topic' : viewValue === 'options' ? 'options' : 'summary';
  return Array.isArray(criteriaContext.bucketsByCategory?.[category])
    ? criteriaContext.bucketsByCategory[category]
    : [];
}

function _getActiveCriteriaBucket(visibleBuckets) {
  if (!visibleBuckets || !visibleBuckets.length) {
    currentCriteriaSelection = null;
    return null;
  }
  if (currentCriteriaSelection) {
    const existing = visibleBuckets.find((bucket) => bucket.id === currentCriteriaSelection);
    if (existing) {
      return existing;
    }
  }
  currentCriteriaSelection = visibleBuckets[0].id;
  return visibleBuckets[0];
}

function _renderCriteriaOverview(criteriaContext, filters, visibleBuckets) {
  if (!criteriaContext) {
    return '';
  }

  if (!visibleBuckets || !visibleBuckets.length) {
    currentCriteriaSelection = null;
    return `
      <div class="card card-body">
        <div class="placeholder-content">
          <i class="fas fa-user-check mr-2"></i>
          No criteria data available for the current filter
        </div>
      </div>
    `;
  }

  const activeBucket = _getActiveCriteriaBucket(visibleBuckets);
  const totalStudents = criteriaContext.totalUniqueStudents || 0;
  const baseClass =
    'criteria-card block w-full rounded-2xl border transition-colors p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
  const activeClass = 'border-blue-600 bg-blue-600 text-white shadow-lg';
  const inactiveClass =
    'border-gray-200 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:bg-blue-50/60 dark:border-gray-700 dark:hover:bg-gray-800';

  const cards = visibleBuckets
    .map((bucket) => {
      const isActive = activeBucket && bucket.id === activeBucket.id;
      const share = totalStudents > 0 ? (bucket.count / totalStudents) * 100 : 0;

      return `
        <button
          type="button"
          class="${baseClass} ${isActive ? activeClass : inactiveClass}"
          data-criteria-id="${bucket.id}"
          data-base-class="${baseClass}"
          data-active-class="${activeClass}"
          data-inactive-class="${inactiveClass}"
        >
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">${
            bucket.categoryLabel
          }</span>
          <div class="mt-2 flex items-baseline justify-between gap-2">
            <span class="text-lg font-semibold">${bucket.label}</span>
            <span class="text-3xl font-bold">${_formatNumber(bucket.count)}</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>${_formatNumber(bucket.totalEntries)} মূল্যায়ন</span>
            <span>${_formatPercent(share || 0)}</span>
          </div>
        </button>
      `;
    })
    .join('');

  const viewLabel =
    filters.criteriaView === 'topic'
      ? 'বিষয়ভিত্তিক মানদণ্ড'
      : filters.criteriaView === 'options'
      ? 'সহায়ক মানদণ্ড'
      : 'বিশেষ ফোকাস';

  return `
    <div class="card">
      <div class="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">অতিরিক্ত মানদণ্ড বিশ্লেষণ</h3>
        <span class="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">${viewLabel}</span>
      </div>
      <div class="card-body">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-${Math.min(visibleBuckets.length, 4)}" data-criteria-grid>
          ${cards}
        </div>
      </div>
    </div>
  `;
}

function _renderCriteriaDetailPlaceholder(criteriaContext, visibleBuckets) {
  if (!criteriaContext) {
    return '';
  }

  const activeBucket = _getActiveCriteriaBucket(visibleBuckets);
  const detailContent = activeBucket ? _renderCriteriaDetail(activeBucket) : _renderEmptyCriteriaDetail();

  return `<div class="space-y-4" data-criteria-detail>${detailContent}</div>`;
}

function _renderEmptyCriteriaDetail() {
  return `
    <div class="card card-body">
      <div class="placeholder-content">
        <i class="fas fa-users mr-2"></i>
        No student matched the selected criteria yet
      </div>
    </div>
  `;
}

function _renderCriteriaDetail(bucket) {
  if (!bucket || !bucket.students.size) {
    return _renderEmptyCriteriaDetail();
  }

  const studentCards = Array.from(bucket.students.values())
    .sort((a, b) => {
      if (b.records.length !== a.records.length) {
        return b.records.length - a.records.length;
      }
      return a.name.localeCompare(b.name);
    })
    .map((student) => {
      const history = [...student.records].sort((a, b) => (b.dateMs || 0) - (a.dateMs || 0));
      const historyMarkup = history.map((record) => _renderCriteriaHistoryRow(record)).join('');

      return `
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h5 class="text-lg font-semibold text-gray-800 dark:text-white">${student.name}</h5>
              <p class="text-sm text-gray-500 dark:text-gray-400">${student.groupName || 'গ্রুপ তথ্য অনুপস্থিত'}</p>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-blue-600 dark:text-blue-200 font-medium">
                ${_formatNumber(history.length)} মূল্যায়ন
              </span>
            </div>
          </div>
          <div class="space-y-2">
            ${historyMarkup}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="space-y-4">
      <div class="card">
        <div class="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white">${bucket.label}</h4>
          <span class="text-sm text-gray-500 dark:text-gray-400">মোট শিক্ষার্থী: ${_formatNumber(bucket.count)}</span>
        </div>
        <div class="card-body space-y-4">
          ${studentCards}
        </div>
      </div>
    </div>
  `;
}

function _renderCriteriaHistoryRow(record) {
  const topicLabel = _getCriteriaLabel(record.topicId) || 'মানদণ্ড অনুপস্থিত';
  const attendanceLabel = record.attendance ? 'উপস্থিত' : 'অনুপস্থিত';
  const attendanceClass = record.attendance
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200'
    : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200';
  const homeworkLabel = record.homework ? 'হোমওয়ার্ক সম্পন্ন' : 'হোমওয়ার্ক বাকি';
  const homeworkClass = record.homework
    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200'
    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200';

  return `
    <div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-3 space-y-2">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">${record.taskName}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">${record.dateLabel || 'তারিখ অনুপস্থিত'} · ${
    record.groupName
  }</p>
        </div>
        <div class="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          ${_formatPercent(record.percentage)}
        </div>
      </div>
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="inline-flex items-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-200 px-3 py-1 font-medium">${topicLabel}</span>
        <span class="inline-flex items-center rounded-full px-3 py-1 font-medium ${attendanceClass}">${attendanceLabel}</span>
        <span class="inline-flex items-center rounded-full px-3 py-1 font-medium ${homeworkClass}">${homeworkLabel}</span>
      </div>
    </div>
  `;
}
function _getCriteriaLabel(criteriaId) {
  const meta = CRITERIA_META_INDEX.get(criteriaId);
  return meta ? _formatText(meta.label) : '';
}

function _bindCriteriaInteractions(criteriaContext, filters, visibleBuckets) {
  if (!criteriaContext || !elements.graphDashboardContainer) return;

  const buttons = Array.from(elements.graphDashboardContainer.querySelectorAll('[data-criteria-id]'));

  if (!buttons.length) return;

  const updateActiveState = () => {
    buttons.forEach((button) => {
      const base = button.getAttribute('data-base-class') || '';
      const activeClass = button.getAttribute('data-active-class') || '';
      const inactiveClass = button.getAttribute('data-inactive-class') || '';
      const value = button.getAttribute('data-criteria-id');
      const isActive = value === currentCriteriaSelection;
      button.className = `${base} ${isActive ? activeClass : inactiveClass}`.trim();
    });
  };

  const renderDetail = () => {
    const container = elements.graphDetailContainer?.querySelector('[data-criteria-detail]');
    if (!container) return;
    const bucket = _getActiveCriteriaBucket(visibleBuckets);
    container.innerHTML = bucket ? _renderCriteriaDetail(bucket) : _renderEmptyCriteriaDetail();
  };

  buttons.forEach((button) => {
    uiManager.addListener(button, 'click', () => {
      const value = button.getAttribute('data-criteria-id');
      if (!value || value === currentCriteriaSelection) return;
      currentCriteriaSelection = value;
      updateActiveState();
      renderDetail();
    });
  });

  updateActiveState();
  renderDetail();
}

function _renderSummaryCards(summary) {
  return `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      ${_createSummaryCard(
        'মোট মূল্যায়ন',
        summary.totalEvaluations,
        'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
        'fa-clipboard-list'
      )}
      ${_createSummaryCard(
        'MCQ মূল্যায়ন',
        summary.totalMcqEvaluations,
        'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
        'fa-brain'
      )}
      ${_createSummaryCard(
        'গড় স্কোর (%)',
        _formatPercent(summary.averageScore),
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
        'fa-gauge'
      )}
      ${_createSummaryCard(
        'বাকি শিক্ষার্থী',
        summary.pendingStudents,
        'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
        'fa-user-clock'
      )}
    </div>
  `;
}

function _createSummaryCard(title, value, classes, icon) {
  const displayValue = typeof value === 'string' ? value : _formatNumber(value);
  return `
    <div class="rounded-2xl border border-transparent ${classes} p-4 shadow-sm backdrop-blur">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium opacity-80">${title}</div>
          <div class="mt-2 text-2xl font-semibold">${displayValue}</div>
        </div>
        <div class="text-3xl opacity-60"><i class="fas ${icon}"></i></div>
      </div>
    </div>
  `;
}

function _renderGroupTable(groupMetrics, filters) {
  if (!groupMetrics.length) {
    return `
      <div class="card card-body">
        <div class="placeholder-content">
          <i class="fas fa-info-circle mr-2"></i>
          নির্বাচিত ফিল্টারের জন্য কোনও তথ্য পাওয়া যায়নি।
        </div>
      </div>
    `;
  }

  const headers = [
    'গ্রুপ',
    'মোট শিক্ষার্থী',
    'মূল্যায়ন (মোট/MCQ)',
    'অংশগ্রহণকারী',
    'গড় স্কোর (%)',
    'অংশগ্রহণ হার (%)',
    'বাকি শিক্ষার্থী',
    'ইতিবাচক শিক্ষার্থী',
    'উন্নয়ন প্রয়োজন',
    'ফুল ক্রাইটেরিয়া সেশন',
  ];

  const rows = groupMetrics
    .map((metric) => {
      return `
        <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition">
          <td class="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">${metric.groupName}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatNumber(metric.studentCount)}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatNumber(
            metric.evaluationCount
          )} / ${_formatNumber(metric.mcqEvaluationCount)}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatNumber(
            metric.uniqueParticipantsCount
          )}</td>
          <td class="px-4 py-3 text-center ${_scoreColorClass(metric.averageScore)} font-semibold">${_formatPercent(
        metric.averageScore
      )}</td>
          <td class="px-4 py-3 text-center text-indigo-600 dark:text-indigo-300 font-semibold">${_formatPercent(
            metric.participationRate
          )}</td>
          <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">${_formatNumber(
            metric.pendingStudents
          )}</td>
          <td class="px-4 py-3 text-center text-emerald-600 dark:text-emerald-300 font-semibold">${_formatNumber(
            metric.fullCriteriaStudents
          )}</td>
          <td class="px-4 py-3 text-center ${
            metric.improvementCount > 0 ? 'text-rose-500 font-semibold' : 'text-gray-600 dark:text-gray-300'
          }">${_formatNumber(metric.improvementCount)}</td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${metric.fullCriteriaEvaluations
            .map((name, index) => {
              const assignmentLabel = _formatText(`এসাইনমেন্ট - ${_formatNumber(index + 1)}`);
              const tooltip = _escapeAttribute(name);
              return `<span class="inline-flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200 rounded-full mr-1 mb-1 whitespace-nowrap" title="${tooltip}">${assignmentLabel}</span>`;
            })
            .join('')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="card overflow-hidden">
      <div class="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">গ্রুপ ভিত্তিক বিশ্লেষণ</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ভিউ মোড: ${filters.viewMode === VIEW_MODES.TABLE ? 'টেবিল' : 'চার্ট'} Â· মোট গ্রুপ: ${_formatNumber(
    groupMetrics.length
  )}
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              ${headers
                .map(
                  (header) =>
                    `<th scope="col" class="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">${header}</th>`
                )
                .join('')}
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900/60 divide-y divide-gray-100 dark:divide-gray-800">
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderChartsMarkup(chartData) {
  if (!chartData.bar) {
    return `
      <div class="card card-body">
        <div class="placeholder-content">
          <i class="fas fa-chart-column mr-2"></i>
          চার্ট প্রদর্শনের জন্য কোনো তথ্য নেই।
        </div>
      </div>
    `;
  }

  const pieSection = chartData.pie
    ? `
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${chartData.pie.title}</h3>
          </div>
          <div class="card-body">
            <div class="h-80">
              <canvas id="analysisPieChart"></canvas>
            </div>
          </div>
        </div>
      `
    : '';

  const gridClass = chartData.pie ? 'lg:grid-cols-3' : 'lg:grid-cols-1';

  return `
    <div class="grid gap-6 ${gridClass}">
      <div class="card lg:col-span-2">
        <div class="card-header flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">গ্রুপভিত্তিক মানদণ্ড বিশ্লেষণ</h3>
        </div>
        <div class="card-body">
          <div class="h-[420px]">
            <canvas id="analysisBarChart"></canvas>
          </div>
        </div>
      </div>
      ${pieSection}
    </div>
  `;
}

function _initializeCharts(chartData) {
  if (!chartData.bar) {
    _destroyCharts();
    return;
  }

  const barCanvas = document.getElementById('analysisBarChart');
  if (barCanvas) {
    if (topicBarChart) topicBarChart.destroy();
    topicBarChart = new Chart(barCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: chartData.bar.labels,
        datasets: chartData.bar.datasets,
      },
      options: chartData.bar.options,
    });
  }

  const pieCanvas = document.getElementById('analysisPieChart');
  if (pieCanvas && chartData.pie) {
    if (criteriaPieChart) criteriaPieChart.destroy();
    criteriaPieChart = new Chart(pieCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: chartData.pie.labels,
        datasets: [
          {
            data: chartData.pie.data,
            backgroundColor: chartData.pie.colors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  } else if (criteriaPieChart) {
    criteriaPieChart.destroy();
    criteriaPieChart = null;
  }
}

function _destroyCharts() {
  if (topicBarChart) {
    topicBarChart.destroy();
    topicBarChart = null;
  }
  if (criteriaPieChart) {
    criteriaPieChart.destroy();
    criteriaPieChart = null;
  }
}

function _renderGroupDetail(metric) {
  const detailCards = metric.evaluationDetails
    .map((detail) => {
      const topicTotal = detail.topicCounts.learnedWell + detail.topicCounts.understood + detail.topicCounts.notYet;
      const topicChips = `
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
            ভালো করে শিখেছি: ${_formatNumber(detail.topicCounts.learnedWell)}
          </span>
          <span class="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200">
            শুধু বুঝেছি: ${_formatNumber(detail.topicCounts.understood)}
          </span>
          <span class="px-3 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
            এখনো পারিনি: ${_formatNumber(detail.topicCounts.notYet)}
          </span>
        </div>
      `;
      const optionChips = `
        <div class="flex flex-wrap gap-2 text-xs mt-2">
          <span class="px-3 py-1 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-200">
            নিয়মিত উপস্থিতি: ${_formatNumber(detail.optionCounts.attendance)}
          </span>
          <span class="px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-200">
            বাড়ির কাজ সম্পন্ন: ${_formatNumber(detail.optionCounts.homework)}
          </span>
        </div>
      `;
      return `
        <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="text-base font-semibold text-gray-800 dark:text-white">${_formatText(detail.taskName)}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-3">
                <span><i class="fas fa-calendar-day mr-1"></i>${detail.dateLabel || '—'}</span>
                <span><i class="fas fa-list-check mr-1"></i>${detail.type === 'mcq' ? 'MCQ' : 'লিখিত/অন্যান্য'}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-200">
              <span class="font-semibold text-indigo-600 dark:text-indigo-300">গড় স্কোর: ${_formatPercent(
                detail.averagePercentage
              )}</span>
              <span>মূল্যায়িত: ${_formatNumber(detail.assessedCount)}</span>
              <span class="${detail.pendingCount > 0 ? 'text-rose-500 font-semibold' : ''}">বাকি: ${_formatNumber(
        detail.pendingCount
      )}</span>
              <span class="text-emerald-600 dark:text-emerald-300 font-semibold">পজিটিভ: ${_formatNumber(
                detail.fullPositiveCount
              )}</span>
            </div>
          </div>
          ${topicTotal > 0 ? topicChips : ''}
          ${optionChips}
        </div>
      `;
    })
    .join('');

  return `
    <div class="card card-body space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h4 class="text-lg font-semibold text-gray-800 dark:text-white">${metric.groupName} - মূল্যায়ন বিশ্লেষণ</h4>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          মোট ${_formatNumber(metric.evaluationCount)}টি মূল্যায়ন বিশ্লেষিত
        </span>
      </div>
      <div class="space-y-3">
        ${detailCards}
      </div>
    </div>
  `;
}

function _formatNumber(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  if (helpers?.convertToBanglaNumber) {
    return helpers.convertToBanglaNumber(Math.round(numeric));
  }
  return Math.round(numeric).toString();
}

function _formatPercent(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  const formatted = numeric.toFixed(1);
  if (helpers?.convertToBanglaNumber) {
    return `${helpers.convertToBanglaNumber(formatted)}%`;
  }
  return `${formatted}%`;
}

function _formatDecimal(value, fractionDigits = 2) {
  const numeric = Number.isFinite(value) ? value : 0;
  const formatted = numeric.toFixed(fractionDigits);
  if (helpers?.convertToBanglaNumber) {
    return helpers.convertToBanglaNumber(formatted);
  }
  return formatted;
}

function _formatDate(value) {
  if (!value) return '';
  if (helpers?.formatTimestamp) {
    return helpers.formatTimestamp(value instanceof Date ? value : new Date(value));
  }
  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
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

function _formatText(value) {
  if (!value) return '';
  if (helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function') {
    return helpers.ensureBengaliText(value);
  }
  if (typeof value === 'string') return value.trim();
  return String(value);
}

function _escapeAttribute(value) {
  const text = _formatText(value);
  const normalized = typeof text === 'string' ? text.replace(/\r?\n/g, ' ') : '';
  return normalized
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _scoreColorClass(value) {
  if (value >= 80) return 'text-emerald-500';
  if (value >= 60) return 'text-blue-500';
  if (value >= 40) return 'text-amber-500';
  return 'text-rose-500';
}

function _deriveMaxScoreFromTask(task) {
  if (!task) return null;
  if (typeof task.maxScore === 'number') return task.maxScore;
  if (task.maxScoreBreakdown) {
    const breakdown = task.maxScoreBreakdown;
    return (
      (parseFloat(breakdown.task) || 0) +
      (parseFloat(breakdown.team) || 0) +
      (parseFloat(breakdown.additional) || 0) +
      (parseFloat(breakdown.mcq) || 0)
    );
  }
  return null;
}

function _isMcqEvaluation(task) {
  if (!task || !task.maxScoreBreakdown) return false;
  return parseFloat(task.maxScoreBreakdown.mcq) > 0;
}

async function generateGroupAnalysisPDF() {
  await _ensurePdfFont();
  const container = document.getElementById('printableAnalysisArea');
  if (!container) {
    uiManager.showToast('PDF তৈরির জন্য বিশ্লেষণ ডেটা পাওয়া যায়নি।', 'warning');
    return;
  }
  await _createPdfFromElement(container, 'group_analysis_dashboard.pdf');
}

async function generateSelectedGroupPDF() {
  const filters = stateManager.getFilterSection(ANALYSIS_FILTER_KEY);
  if (!filters || filters.groupFilter === 'all') {
    uiManager.showToast('অনুগ্রহ করে প্রথমে একটি গ্রুপ নির্বাচন করুন।', 'info');
    return;
  }
  await _ensurePdfFont();
  const container = document.getElementById('printableAnalysisArea');
  if (!container) {
    uiManager.showToast('PDF তৈরির জন্য বিশ্লেষণ ডেটা পাওয়া যায়নি।', 'warning');
    return;
  }
  await _createPdfFromElement(container, `group_${filters.groupFilter}_analysis.pdf`);
}

function printGroupAnalysis() {
  window.print();
}

async function _createPdfFromElement(element, fileName) {
  if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
    uiManager.showToast('PDF তৈরি করার জন্য প্রয়োজনীয় লাইব্রেরি পাওয়া যায়নি।', 'error');
    return;
  }

  uiManager.showLoading('PDF প্রস্তুত করা হচ্ছে...');
  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pdfWidth - imgWidth) / 2;
    const y = 15;

    doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    doc.save(fileName);
    uiManager.showToast('PDF সফলভাবে ডাউনলোড হয়েছে।', 'success');
  } catch (error) {
    console.error('❌ PDF তৈরিতে সমস্যা:', error);
    uiManager.showToast(`PDF তৈরিতে সমস্যা হয়েছে: ${error.message}`, 'error');
  } finally {
    uiManager.hideLoading();
  }
}

async function _ensurePdfFont() {
  if (pdfFontPromise) return pdfFontPromise;
  if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') return Promise.resolve();

  pdfFontPromise = (async () => {
    try {
      const { jsPDF } = jspdf;
      jsPDF.API.addFileToVFS('HindSiliguri-Regular.ttf', PDF_FONT_BASE64);
      jsPDF.API.addFont('HindSiliguri-Regular.ttf', 'HindSiliguri', 'normal');
    } catch (error) {
      console.warn('PDF ফন্ট লোড করা যায়নি:', error);
      pdfFontPromise = null;
    }
  })();
  return pdfFontPromise;
}
