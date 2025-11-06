

/* global window, document */
(() => {
  'use strict';

  // ---- absolute singleton guard (prevents double load/run) ----
  if (window.__GDM_MODAL_INIT__) return;
  window.__GDM_MODAL_INIT__ = true;

  const UI = { els: {}, bound: false };

  // ---------- tiny helpers ----------
  const byId = (id) => document.getElementById(id);

  const bn = (n) => {
    try {
      return window.smartEvaluator?.utils?.convertToBanglaNumber(String(n)) ?? String(n);
    } catch { return String(n); }
  };

  const escHtml = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const prettyRoleBn = (role) => (
    ({
      'team-leader': 'টিম লিডার',
      'time-keeper': 'টাইম কিপার',
      reporter: 'রিপোর্টার',
      'resource-manager': 'রিসোর্স ম্যানেজার',
      'peace-maker': 'পিস মেকার',
    }[String(role || '').trim()] || (role ? String(role) : ''))
  );

  const roleBadgeClass = (role) => (
    ({
      'team-leader': 'bg-amber-50 text-amber-700 border-amber-200',
      'time-keeper': 'bg-sky-50 text-sky-700 border-sky-200',
      reporter: 'bg-purple-50 text-purple-700 border-purple-200',
      'resource-manager': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'peace-maker': 'bg-rose-50 text-rose-700 border-rose-200',
    }[String(role || '').trim()] || 'bg-gray-50 text-gray-700 border-gray-200')
  );

  const pctBadgeClass = (p) => {
    const v = Number(p) || 0;
    if (v >= 85) return 'bg-emerald-50 text-emerald-700';
    if (v >= 70) return 'bg-sky-50 text-sky-700';
    if (v >= 55) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  };

  // ---------- state ----------
  function getState() {
    const app = window.smartEvaluator;
    if (!app) return { groups: [], students: [], tasks: [], evaluations: [] };
    const s = app.managers?.stateManager?.getState?.() || {};
    return {
      groups: Array.isArray(s.groups) ? s.groups : [],
      students: Array.isArray(s.students) ? s.students : [],
      tasks: Array.isArray(s.tasks) ? s.tasks : [],
      evaluations: Array.isArray(s.evaluations) ? s.evaluations : [],
    };
  }

  // timestamp normalizer for assorted Firestore/ISO dates
  function extractTs(d) {
    if (!d) return 0;
    if (typeof d === 'object' && d.seconds) return d.seconds * 1000;
    const t = Date.parse(d);
    return Number.isFinite(t) ? t : 0;
  }

  // ---------- computations ----------
  function computeGroupPerformance(groupId, state) {
    const taskMap = new Map(state.tasks.map((t) => [t?.id, t]));
    const members = state.students.filter((s) => String(s?.groupId) === String(groupId));
    const memberIds = new Set(members.map((m) => String(m?.id)));
    const evals = state.evaluations.filter((ev) => String(ev?.groupId) === String(groupId));

    const perEval = evals.map((ev) => {
      const task = taskMap.get(ev?.taskId);
      const max = parseFloat(ev?.maxPossibleScore) || parseFloat(task?.maxScore) || 100;
      let cnt = 0, sumPct = 0;
      let bestId = null, bestPct = -1;
      if (max > 0 && ev?.scores) {
        for (const [sid, sc] of Object.entries(ev.scores)) {
          if (!memberIds.has(String(sid))) continue;
          const tot = parseFloat(sc?.totalScore) || 0;
          const pct = (tot / max) * 100;
          cnt++; sumPct += pct;
          if (pct > bestPct) { bestPct = pct; bestId = sid; }
        }
      }
      const ts = extractTs(ev?.taskDate || ev?.updatedAt || ev?.evaluationDate || ev?.createdAt || task?.date);
      return { ev, task, ts, avgPct: cnt ? (sumPct / cnt) : 0, count: cnt, topStudentId: bestId, topPct: bestPct };
    });

    const groupAvg = perEval.length ? perEval.reduce((a, b) => a + b.avgPct, 0) / perEval.length : 0;

    // rank among all groups by their average %
    const other = state.groups.map((g) => {
      const gid = String(g?.id);
      const evs = state.evaluations.filter((ev) => String(ev?.groupId) === gid);
      const arr = evs.map((ev) => {
        const task = taskMap.get(ev?.taskId);
        const max = parseFloat(ev?.maxPossibleScore) || parseFloat(task?.maxScore) || 100;
        if (max <= 0 || !ev?.scores) return 0;
        let cnt = 0, sum = 0;
        for (const sc of Object.values(ev.scores)) {
          const tot = parseFloat(sc?.totalScore) || 0;
          cnt++; sum += (tot / max) * 100;
        }
        return cnt ? (sum / cnt) : 0;
      });
      return { id: gid, avg: arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : -1 };
    }).filter(x => x.avg >= 0).sort((a, b) => b.avg - a.avg);

    const rankIdx = other.findIndex((x) => x.id === String(groupId));

    return { members, perEval, groupAvg, rank: rankIdx >= 0 ? (rankIdx + 1) : null };
  }

  // ---------- render ----------
  function renderGroupModal(groupId) {
    try {
      const state = getState();
      const group = state.groups.find((g) => String(g?.id) === String(groupId));
      if (!group) return;

      const { members, perEval, groupAvg, rank } = computeGroupPerformance(groupId, state);

      // Header
      const name = group?.name || group?.label || groupId;
      const elTitle = byId('gdmTitle'); if (elTitle) elTitle.textContent = 'গ্রুপের বিস্তারিত ফলাফল';
      const elName  = byId('gdmGroupName'); if (elName)  elName.textContent = name;
      const elAvg   = byId('gdmGroupAvg'); if (elAvg)   elAvg.textContent = `${(groupAvg || 0).toFixed(1)}%`;
      const elRank  = byId('gdmGroupRank'); if (elRank) elRank.textContent = rank ? bn(rank) : '-';

      // Members summary table
      const mbody = byId('gdmMembersBody');
      if (mbody) {
        mbody.innerHTML = '';
        const taskMap = new Map(state.tasks.map((t) => [t?.id, t]));
        const sums = new Map();

        // accumulate per member across this group's evaluations
        for (const ev of state.evaluations) {
          if (String(ev?.groupId) !== String(groupId)) continue;
          const task = taskMap.get(ev?.taskId);
          const bd = task?.maxScoreBreakdown || {};
          const maxTask = parseFloat(bd?.task);
          const maxTeam = parseFloat(bd?.team);
          const maxAdditional = parseFloat(bd?.additional);
          const maxMcq = parseFloat(bd?.mcq);
          const max = parseFloat(ev?.maxPossibleScore) || parseFloat(task?.maxScore) || 100;
          const scores = ev?.scores || {};

          for (const m of members) {
            const sc = scores[m?.id];
            if (!sc) continue;

            const cur = sums.get(m?.id) || { task:0, team:0, additional:0, mcq:0, total:0, cnt:0, pctSum:0 };
            const vTask = parseFloat(sc?.taskScore) || 0;
            const vTeam = parseFloat(sc?.teamScore) || 0;
            const vAddi = parseFloat(sc?.additionalScore) || 0;
            const vMcq  = parseFloat(sc?.mcqScore) || 0;

            // cap by breakdown maxima when present
            const effTask = Number.isFinite(maxTask) && maxTask > 0 ? Math.min(vTask, maxTask) : vTask;
            const effTeam = Number.isFinite(maxTeam) && maxTeam > 0 ? Math.min(vTeam, maxTeam) : vTeam;
            const effAddi = Number.isFinite(maxAdditional) && maxAdditional > 0 ? Math.min(vAddi, maxAdditional) : vAddi;
            const effMcq  = Number.isFinite(maxMcq) && maxMcq > 0 ? Math.min(vMcq, maxMcq) : vMcq;

            const tot = parseFloat(sc?.totalScore) || (effTask + effTeam + effMcq + effAddi);
            const pct = max > 0 ? (tot / max) * 100 : 0;

            sums.set(m?.id, {
              task: cur.task + effTask,
              team: cur.team + effTeam,
              additional: cur.additional + effAddi,
              mcq: cur.mcq + effMcq,
              total: cur.total + tot,
              cnt: cur.cnt + 1,
              pctSum: cur.pctSum + pct,
            });
          }
        }

        const list = members.map((m) => {
          const v = sums.get(m?.id) || { task:0, team:0, additional:0, mcq:0, total:0, cnt:0, pctSum:0 };
          const avgPct = v.cnt ? (v.pctSum / v.cnt) : 0;
          return {
            id: m?.id,
            name: m?.name || m?.id,
            duty: m?.role || m?.duty || '',
            academicGroup: m?.academicGroup || '-',
            roll: (m?.roll || m?.studentRoll || m?.classRoll || m?.rollNumber || null),
            ...v,
            avgPct,
          };
        }).sort((a, b) => b.avgPct - a.avgPct);

        // in-group rank
        list.forEach((x, i) => { x.rank = i + 1; });

        const frag = document.createDocumentFragment();
        for (const r of list) {
          const dutyLabel = prettyRoleBn(r.duty);
          const badgeCls = roleBadgeClass(r.duty);
          const roleCell = dutyLabel
            ? `<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeCls}">
                 <i class="fas fa-id-badge"></i>${escHtml(dutyLabel)}
               </span>`
            : '-';
          const nameCell = `<span class="font-medium truncate" title="${escHtml(r.name)}">${escHtml(r.name)}</span>`;
          const agCell = `<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-gray-700 bg-white">
                            ${escHtml(r.academicGroup || '-')}
                          </span>`;

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="px-3 py-2 whitespace-nowrap">${bn(r.roll ?? '-')}</td>
            <td class="px-3 py-2 whitespace-nowrap">${roleCell}</td>
            <td class="px-3 py-2 whitespace-nowrap">${nameCell}</td>
            <td class="px-3 py-2 whitespace-nowrap">${agCell}</td>
            <td class="px-3 py-2 text-right">${(r.task).toFixed(2)}</td>
            <td class="px-3 py-2 text-right">${(r.team).toFixed(2)}</td>
            <td class="px-3 py-2 text-right">${(r.additional).toFixed(2)}</td>
            <td class="px-3 py-2 text-right">${(r.mcq).toFixed(2)}</td>
            <td class="px-3 py-2 text-right font-semibold">${(r.total).toFixed(2)}</td>
            <td class="px-3 py-2 text-right">
              <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold ${pctBadgeClass(r.avgPct)}">
                ${(r.avgPct).toFixed(1)}%
              </span>
            </td>
            <td class="px-3 py-2 text-center">${bn(r.rank)}</td>`;
          frag.appendChild(tr);
        }
        mbody.appendChild(frag);
      }

      // Evaluations list (latest first)
      const ebody = byId('gdmEvalsBody');
      if (ebody) {
        ebody.innerHTML = '';
        const sorted = perEval.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const frag = document.createDocumentFragment();
        const studentMap = new Map(state.students.map((s) => [String(s?.id), s?.name || s?.id]));
        sorted.forEach((e, idx) => {
          const tr = document.createElement('tr');
          const dateStr = e.ts ? new Date(e.ts).toISOString().slice(0, 10) : '-';
          const topName = e.topStudentId ? (studentMap.get(String(e.topStudentId)) || e.topStudentId) : '-';
          tr.innerHTML = `
            <td class="px-3 py-2 whitespace-nowrap">${escHtml(e.task?.name || `Assignment-${idx + 1}`)}</td>
            <td class="px-3 py-2 whitespace-nowrap">${dateStr}</td>
            <td class="px-3 py-2">${e.count}</td>
            <td class="px-3 py-2">${e.avgPct.toFixed(1)}%</td>
            <td class="px-3 py-2 whitespace-nowrap">${escHtml(topName)}</td>`;
          frag.appendChild(tr);
        });
        ebody.appendChild(frag);
      }

      // Show modal default view
      UI.els.modal?.classList.remove('hidden');
      setMode('members');
    } catch (err) {
      console.error('[GDM] renderGroupModal failed:', err);
    }
  }

  // ---------- mode toggle ----------
  function setMode(mode) {
    const showMembers = mode === 'members';
    UI.els.members?.classList.toggle('hidden', !showMembers);
    UI.els.evals?.classList.toggle('hidden', showMembers);
    UI.els.btnMembers?.classList.toggle('bg-gray-100', showMembers);
    UI.els.btnEvals?.classList.toggle('bg-gray-100', !showMembers);
  }

  // ---------- bindings ----------
  function bindOnce() {
    if (UI.bound) return;
    UI.bound = true;

    // close by data attr
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-group-modal-close]')) {
        UI.els.modal?.classList.add('hidden');
      }
    });

    UI.els.btnMembers?.addEventListener('click', () => setMode('members'));
    UI.els.btnEvals?.addEventListener('click', () => setMode('evals'));
  }

  // ---------- init ----------
  function init() {
    UI.els.modal = byId('groupDetailModal');
    UI.els.btnMembers = byId('gdmBtnMembers');
    UI.els.btnEvals = byId('gdmBtnEvals');
    UI.els.members = byId('gdmMembersWrap');
    UI.els.evals = byId('gdmEvalsWrap');

    if (!UI.els.modal) {
      console.warn('[GDM] modal node missing; script loaded but no #groupDetailModal.');
      return;
    }

    bindOnce();

    // public API (one-time)
    if (!window.openGroupModalById) window.openGroupModalById = renderGroupModal;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

