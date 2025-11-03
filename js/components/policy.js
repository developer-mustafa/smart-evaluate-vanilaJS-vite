// js/components/policy.js

// Dependencies
let uiManager, helpers;

// DOM Elements
const elements = {};

// LocalStorage keys
const LS_KEYS = { EXPANDED_SET: 'policy_expanded_indices_v2' };

const POLICY_TAGS = ['সহযোগিতা কেন্দ্রিক', 'দায়িত্বশীল নেতৃত্ব', 'ডেটা-চালিত মূল্যায়ন', 'স্বচ্ছতা ও আস্থা'];

const POLICY_PALETTE = [
  {
    accentBar: 'from-indigo-500/90 via-blue-500/90 to-sky-500/80',
    iconBg: 'bg-indigo-500/15 text-indigo-200',
    iconRing: 'ring-indigo-300/50',
    badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100',
    keywordBg: 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20',
  },
  {
    accentBar: 'from-emerald-500/90 via-teal-500/90 to-cyan-500/80',
    iconBg: 'bg-emerald-500/15 text-emerald-200',
    iconRing: 'ring-emerald-300/50',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    keywordBg: 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20',
  },
  {
    accentBar: 'from-amber-500/90 via-orange-500/90 to-rose-500/80',
    iconBg: 'bg-amber-500/15 text-amber-200',
    iconRing: 'ring-amber-300/50',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
    keywordBg: 'bg-amber-500/10 text-amber-100 border border-amber-500/20',
  },
  {
    accentBar: 'from-purple-500/90 via-fuchsia-500/90 to-pink-500/80',
    iconBg: 'bg-purple-500/15 text-purple-200',
    iconRing: 'ring-purple-300/50',
    badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100',
    keywordBg: 'bg-purple-500/10 text-purple-100 border border-purple-500/20',
  },
];

/** =========================
 *  Editable Policy Content
 *  ========================= */
let policyData = [
  {
    title: '১) টিম গঠন (Team Formation)',
    icon: 'fas fa-users-cog',
    content: `
      <ul>
        <li>প্রতি গ্রুপে ৪–৬ জন শিক্ষার্থী থাকবে (আদর্শ ৫ জন)।</li>
        <li>ছেলে ও মেয়ে শিক্ষার্থীদের জন্য আলাদা গ্রুপ গঠন করা হবে।</li>
        <li>প্রতিটি শিক্ষার্থীর একটি নির্দিষ্ট গ্রুপ-দায়িত্ব থাকবে।</li>
        <li>গ্রুপ স্টাডি সহজ করতে একই বেঞ্চে একই গ্রুপের সদস্যরা বসতে চেষ্টা করবে।</li>
      </ul>
    `,
  },
  {
    title: '২) দায়িত্ব বণ্টন (Role Distribution)',
    icon: 'fas fa-sitemap',
    content: `
      <h5>প্রধান দায়িত্বসমূহ</h5>
      <ul>
        <li><strong>টিম লিডার:</strong> নেতৃত্ব, সদস্য যোগাযোগ, শিক্ষক সমন্বয়, দায়িত্ব পর্যবেক্ষণ।</li>
        <li><strong>টাইম কিপার:</strong> সময়ানুবর্তিতা নিশ্চিতকরণ, সাপ্তাহিক উপস্থিতির পরিসংখ্যান।</li>
        <li><strong>রিসোর্স ম্যানেজার:</strong> শীট/নোট/রিপোর্ট সংরক্ষণ ও ফলাফলের ভিত্তিতে নির্দেশনা।</li>
        <li><strong>রিপোর্টার:</strong> কাজের রিপোর্ট রাখা ও প্রয়োজনে উপস্থাপনা করা।</li>
        <li><strong>পিস মেকার:</strong> শৃঙ্খলা বজায় রাখা, মতবিরোধে মীমাংসা ও উৎসাহ প্রদান।</li>
      </ul>
    `,
  },
  {
    title: '৩) মূল্যায়ন পদ্ধতি (Evaluation System)',
    icon: 'fas fa-clipboard-check',
    content: `
      <p>প্রতি টাস্কের মোট নম্বর ১০০। মূল্যায়নের খাতসমূহ:</p>
      <ol>
        <li>এসাইনমেন্ট/টাস্ক নম্বর: <strong>২০</strong></li>
        <li>টিম নম্বর: <strong>১৫</strong></li>
        <li>MCQ নম্বর: <strong>৪০</strong> (বা শিক্ষক নির্ধারণ করবেন)</li>
        <li>অতিরিক্ত ক্রাইটেরিয়া: <strong>২৫</strong></li>
      </ol>
      <h5>অতিরিক্ত ক্রাইটেরিয়া – ব্রেকডাউন (সর্বোচ্চ ২৫)</h5>
      <ul>
        <li>“ভালো করে শিখেছি”: +১০</li>
        <li>“শুধু বুঝেছি”: +৫</li>
        <li>“এখনো পারিনি”: −৫</li>
        <li>সাপ্তাহিক নিয়মিত উপস্থিতি: +১০</li>
        <li>সপ্তাহে প্রতিদিন বাড়ির কাজ: +৫</li>
      </ul>
    `,
  },
  {
    title: '৪) র‌্যাঙ্কিং ও পুরস্কার (Ranking & Rewards)',
    icon: 'fas fa-trophy',
    content: `
      <ul>
        <li>কমপক্ষে ২টি মূল্যায়নে অংশগ্রহণকারীদের গড় স্কোরের ভিত্তিতে র‌্যাঙ্ক নির্ধারণ।</li>
        <li>স্কোর সমান হলে অধিক মূল্যায়নে অংশ নেওয়া শিক্ষার্থী অগ্রাধিকার পাবে।</li>
        <li>গ্রুপভিত্তিক র‌্যাঙ্কিং; সেরা ৩টি গ্রুপ মাসিক পুরস্কার পাবে।</li>
        <li>সেরা টপ ১০ শিক্ষার্থীকে বিশেষ স্বীকৃতি ও পুরস্কার।</li>
        <li>প্রতিটি অ্যাসাইনমেন্টের ফলাফল পরবর্তী র‌্যাঙ্কিংকে প্রভাবিত করবে।</li>
      </ul>
    `,
  },
];

/** ================
 *  Public API
 *  ================ */
export function init(dependencies) {
  uiManager = dependencies.managers.uiManager;
  helpers = dependencies.utils;

  _cacheDOMElements();
  _setupEventListeners();
  console.log('✅ Policy component initialized.');

  return { render, setPolicyData, expandAll, collapseAll };
}

export function render() {
  if (!elements.page) {
    console.error('Policy render failed: #page-group-policy not found.');
    return;
  }
  if (!elements.policySectionsContainer) {
    console.error('Policy render failed: #policySections not found.');
    uiManager.displayEmptyMessage(elements.page, 'এই মুহূর্তে নীতিমালা দেখানো যাচ্ছে না।');
    return;
  }

  uiManager.clearContainer(elements.policySectionsContainer);
  if (!Array.isArray(policyData) || policyData.length === 0) {
    uiManager.displayEmptyMessage(elements.policySectionsContainer, 'নীতিমালা তথ্য পাওয়া যায়নি।');
    return;
  }

  const formatDigits = (value) => _toBengaliDigits(typeof value === 'number' ? value : Number(value) || 0);
  const totalRules = policyData.length;
  const bulletCount = policyData.reduce(
    (sum, section) => sum + ((section.content || '').match(/<li/gi)?.length || 0),
    0
  );
  const evaluationCount = policyData.filter((section) => /মূল্যায়ন|evaluation/i.test(section.title || '')).length;
  const structureCount = policyData.filter((section) => /দায়িত্ব|role|গঠন|formation/i.test(section.title || '')).length;

  const tagPills = POLICY_TAGS.map((tag, idx) => {
    const tone = ['bg-white/15 text-white', 'bg-white/10 text-white', 'bg-white/20 text-white'];
    return `<span class="px-3 py-1 rounded-full text-xs font-medium ${tone[idx % tone.length]} backdrop-blur-sm border border-white/20">${tag}</span>`;
  }).join('');

  const heroHtml = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-purple-600 text-white shadow-2xl">
      <div class="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" aria-hidden="true"></div>
      <div class="absolute -right-24 -top-24 w-56 h-56 bg-white/15 rounded-full blur-3xl" aria-hidden="true"></div>
      <div class="relative p-6 md:p-10 space-y-8">
        <div class="space-y-3 max-w-3xl">
          <p class="text-xs tracking-[0.35em] uppercase text-white/70">Smart Team Governance</p>
          <h3 class="text-3xl md:text-4xl font-bold">গ্রুপ পলিসি প্লেবুক</h3>
          <p class="text-sm md:text-base text-white/80 leading-relaxed">দল গঠন থেকে শুরু করে মূল্যায়ন পর্যন্ত প্রতিটি ধাপের জন্য নির্ভুল কাঠামো। যারা দায়িত্বশীল নেতৃত্ব চান, তাদের জন্য এটাই কৌশলের মানচিত্র।</p>
          <div class="flex flex-wrap gap-2">${tagPills}</div>
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="btnExpandAll" class="group inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-transparent">
            <i class="fas fa-layer-group text-white/80 group-hover:rotate-6 transition"></i>
            <span>সব নীতি খুলুন</span>
          </button>
          <button id="btnCollapseAll" class="group inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-transparent">
            <i class="fas fa-compress-alt text-white/80 group-hover:-rotate-6 transition"></i>
            <span>সব নীতি বন্ধ করুন</span>
          </button>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-wide text-white/70">মোট নীতি</p>
            <p class="mt-2 text-2xl font-semibold">${formatDigits(totalRules)}</p>
            <p class="text-xs text-white/70 mt-1">প্রকাশিত সমস্ত গাইডলাইন</p>
          </div>
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-wide text-white/70">মূল নিয়ম</p>
            <p class="mt-2 text-2xl font-semibold">${formatDigits(bulletCount)}</p>
            <p class="text-xs text-white/70 mt-1">সকল তালিকাভুক্ত রুল ও নির্দেশিকা</p>
          </div>
          <div class="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-wide text-white/70">ফোকাস জোন</p>
            <p class="mt-2 text-2xl font-semibold">${formatDigits(evaluationCount + structureCount)}</p>
            <p class="text-xs text-white/70 mt-1">মূল্যায়ন ও দল পরিচালনা ক্ষেত্র</p>
          </div>
        </div>
      </div>
    </div>`;

  const expandedSet = _getExpandedSet();
  let html = heroHtml + `
    <div class="space-y-6 mt-8">
  `;

  policyData.forEach((section, index) => {
    const id = `policy-${index}`;
    const isExpanded = expandedSet.has(index);
    const palette = _getPolicyPalette(index);
    const sanitizedTitle = _formatText(section.title);
    const displayTitle = sanitizedTitle.replace(/^[0-9]+\)?\s*/, '').trim() || sanitizedTitle;
    const sanitizedContent = _renderContent(section.content);
    const preview = _escapeHtml(_extractPreviewFromHtml(sanitizedContent));
    const keywordsSource =
      Array.isArray(section.keywords) && section.keywords.length > 0
        ? section.keywords.map((kw) => _formatText(kw))
        : _deriveKeywords(displayTitle);
    const keywordChips = keywordsSource
      .map(
        (kw) =>
          `<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${palette.keywordBg}">${_escapeHtml(
            kw
          )}</span>`
      )
      .join('');
    const stepLabel = _formatStepNumber(index + 1);
    const iconClass = section.icon || 'fas fa-shield-alt';

    html += `
      <section class="relative group">
        <div class="absolute inset-y-4 left-4 w-[3px] rounded-full bg-gradient-to-b ${palette.accentBar} opacity-60 transition group-hover:opacity-100"></div>
        <div class="relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white dark:bg-gray-900/70 shadow-lg">
          <button
            type="button"
            class="policy-header relative w-full flex items-start gap-4 px-6 py-5 text-left transition-all duration-300 hover:bg-white/70 dark:hover:bg-gray-900/60"
            data-index="${index}"
            aria-controls="${id}-content"
            aria-expanded="${isExpanded ? 'true' : 'false'}"
          >
            <span class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${palette.iconBg} ${palette.iconRing} ring-2 ring-offset-2 ring-offset-white/30 dark:ring-offset-gray-900/40 shadow-md backdrop-blur-sm">
              <i class="${iconClass} text-xl"></i>
            </span>
            <span class="flex-1 space-y-1">
              <span class="inline-flex items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${palette.badgeBg}">নীতি ${stepLabel}</span>
                <span class="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">Guideline</span>
              </span>
              <span class="block text-lg font-semibold leading-snug text-gray-800 dark:text-white">${_escapeHtml(displayTitle)}</span>
              ${preview ? `<span class="block text-sm text-gray-500 dark:text-gray-300/80">${preview}</span>` : ''}
            </span>
            <span class="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100/70 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
              <i class="chev fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}"></i>
            </span>
          </button>
          <div
            id="${id}-content"
            class="policy-content overflow-hidden ${isExpanded ? '' : 'hidden'}"
            data-anim="true"
            style="${isExpanded ? 'height:auto;opacity:1;' : 'height:0;opacity:0;'}"
          >
            <div class="px-6 pb-6 pt-5 bg-white dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-700">
              <div class="h-1.5 w-20 rounded-full bg-gradient-to-r ${palette.accentBar}"></div>
              <div class="prose prose-sm dark:prose-invert max-w-none mt-4 leading-relaxed">${sanitizedContent}</div>
              ${keywordChips ? `<div class="mt-5 flex flex-wrap gap-2">${keywordChips}</div>` : ''}
            </div>
          </div>
        </div>
      </section>
    `;
  });

  html += `
    </div>
  `;
  elements.policySectionsContainer.innerHTML = html;
}

export function togglePolicySection(index) {
  const btn = elements.policySectionsContainer?.querySelector(`.policy-header[data-index="${index}"]`);
  if (!btn) return;
  const contentId = btn.getAttribute('aria-controls');
  const content = document.getElementById(contentId);
  const icon = btn.querySelector('.chev');
  const willExpand = btn.getAttribute('aria-expanded') !== 'true';

  btn.setAttribute('aria-expanded', String(willExpand));
  icon?.classList.toggle('rotate-180', willExpand);

  _animateAccordion(content, willExpand);

  const set = _getExpandedSet();
  if (willExpand) set.add(Number(index));
  else set.delete(Number(index));
  _setExpandedSet(set);
}

export function setPolicyData(nextArray) {
  if (Array.isArray(nextArray)) {
    policyData = nextArray.map((s) => ({
      ...s,
      // ensure clean strings
      title: _formatText(s.title),
      icon: s.icon,
      content: _formatText(s.content),
    }));
    render();
  } else {
    console.warn('setPolicyData expects an array.');
  }
}

export function expandAll() {
  const set = new Set(Array.from(policyData, (_, i) => i));
  _setExpandedSet(set);
  render();
}

export function collapseAll() {
  _setExpandedSet(new Set());
  render();
}

/** ================
 *  Private
 *  ================ */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-group-policy');
  if (elements.page) {
    elements.policySectionsContainer = elements.page.querySelector('#policySections');
  } else {
    console.warn('Policy page element (#page-group-policy) not found!');
  }
}

function _setupEventListeners() {
  if (!elements.page) return;

  // Delegated click: toggle sections / expand-collapse all
  elements.page.addEventListener('click', (e) => {
    const btn = e.target.closest('.policy-header');
    if (btn && elements.policySectionsContainer?.contains(btn)) {
      const idx = Number(btn.dataset.index);
      togglePolicySection(idx);
      return;
    }
    if (e.target.id === 'btnExpandAll') {
      expandAll();
      return;
    }
    if (e.target.id === 'btnCollapseAll') {
      collapseAll();
    }
  });

  // Keyboard support for header toggle
  elements.page.addEventListener('keydown', (e) => {
    const btn = e.target.closest('.policy-header');
    if (!btn) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const idx = Number(btn.dataset.index);
      togglePolicySection(idx);
    }
  });
}

function _formatStepNumber(value) {
  const numeric = Math.max(1, Number(value) || 1);
  const padded = numeric < 10 ? `0${numeric}` : `${numeric}`;
  return _toBengaliDigits(padded);
}

function _toBengaliDigits(input) {
  const map = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(input)
    .split('')
    .map((char) => map[char] ?? char)
    .join('');
}

function _escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _extractPreviewFromHtml(html) {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const target = temp.querySelector('li, p');
  if (!target) return '';
  const text = target.textContent.trim();
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

function _deriveKeywords(title) {
  if (!title) return ['নীতিমালা'];
  const cleaned = title
    .replace(/[()।,;:|]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3);
  const slice = cleaned.slice(0, 3);
  return slice.length ? slice : ['নীতিমালা'];
}

function _getPolicyPalette(index) {
  const fallback = {
    accentBar: 'from-indigo-500/80 via-purple-500/80 to-violet-500/70',
    iconBg: 'bg-indigo-500/15 text-indigo-200',
    iconRing: 'ring-indigo-300/50',
    badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100',
    keywordBg: 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20',
  };
  const palette = POLICY_PALETTE[index % POLICY_PALETTE.length] || fallback;
  return {
    accentBar: palette.accentBar ?? fallback.accentBar,
    iconBg: palette.iconBg ?? fallback.iconBg,
    iconRing: palette.iconRing ?? fallback.iconRing,
    badgeBg: palette.badgeBg ?? fallback.badgeBg,
    keywordBg: palette.keywordBg ?? fallback.keywordBg,
  };
}

function _formatText(value) {
  if (helpers?.ensureBengaliText && typeof helpers.ensureBengaliText === 'function') {
    return helpers.ensureBengaliText(value);
  }
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value);
}

function _renderContent(rawHtml) {
  // 1) normalize + trim
  let html = _formatText(rawHtml);

  // 2) strip legacy citation markers if accidentally present
  html = html.replace(/\[cite_start\]/g, '').replace(/\[cite:[^\]]*\]/g, '');

  // 3) sanitize (allow a safe subset only)
  return _sanitizeHtml(html);
}

/** Smooth accordion animation (height + opacity)
 *  - expand: set current height -> target scrollHeight
 *  - collapse: set fixed height -> 0
 */
function _animateAccordion(panel, expand) {
  if (!panel) return;

  const duration = 260; // ms
  panel.style.overflow = 'hidden';
  panel.dataset.animating = 'true';

  const startHeight = panel.getBoundingClientRect().height;
  const endHeight = expand ? _getInnerHeight(panel) : 0;

  // If starting from display:none/hidden, unhide first
  if (expand) {
    panel.classList.remove('hidden');
    // set height 0 for smooth start if it was hidden
    panel.style.height = startHeight ? `${startHeight}px` : '0px';
    panel.style.opacity = 0;
  }

  const startTime = performance.now();

  const step = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);

    const current = startHeight + (endHeight - startHeight) * eased;
    panel.style.height = `${current}px`;
    panel.style.opacity = expand ? eased : 1 - eased;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      panel.style.height = expand ? 'auto' : '0px';
      if (!expand) panel.classList.add('hidden');
      panel.style.opacity = expand ? 1 : 0;
      panel.style.overflow = '';
      delete panel.dataset.animating;
    }
  };

  requestAnimationFrame(step);
}

function _getInnerHeight(panel) {
  // temporarily set height:auto to measure inner content
  const prevHeight = panel.style.height;
  const prevHidden = panel.classList.contains('hidden');

  panel.classList.remove('hidden');
  panel.style.height = 'auto';
  const h = panel.getBoundingClientRect().height;

  // revert
  if (prevHidden) panel.classList.add('hidden');
  panel.style.height = prevHeight || '0px';
  return h;
}

function _sanitizeHtml(html) {
  // small allow-list (replace with DOMPurify if you have it)
  const ALLOWED = {
    tags: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 'h5', 'br', 'span'],
    attrs: { '*': ['class', 'style'] },
  };

  const div = document.createElement('div');
  div.innerHTML = html;

  const walker = (node) => {
    if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (!ALLOWED.tags.includes(tag)) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (!ALLOWED.attrs['*']?.includes(name)) node.removeAttribute(attr.name);
        if (/^on/i.test(name)) node.removeAttribute(attr.name);
        if (name === 'style' && /expression|javascript:/i.test(attr.value)) node.removeAttribute('style');
      });
    }
    [...node.childNodes].forEach(walker);
  };
  [...div.childNodes].forEach(walker);
  return div.innerHTML;
}

function _getExpandedSet() {
  try {
    const raw = localStorage.getItem(LS_KEYS.EXPANDED_SET);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function _setExpandedSet(set) {
  try {
    localStorage.setItem(LS_KEYS.EXPANDED_SET, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}
