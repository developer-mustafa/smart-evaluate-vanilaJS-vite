
/* global window, document */
(() => {
  'use strict';

  // ----- absolute singleton guard (protects against double loads) -----
  if (window.__SDM_MODAL_INIT__) return;
  window.__SDM_MODAL_INIT__ = true;

  const UI = { els: {}, chart: null, bound: false };

  // ---------- pre-created heavy utilities (perf) ----------
  const DTF_BN = (() => {
    try {
      return new Intl.DateTimeFormat('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  })();
  const DTF_FALLBACK = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const UNICODE_CANVAS = document.createElement('canvas');
  const UNICODE_CTX = UNICODE_CANVAS.getContext('2d');

  // ---------- tiny helpers ----------
  const byId = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const safeStr = (v, f = '') => (v == null ? f : String(v));
  const escHtml = (s) =>
    String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const bn = (n) => {
    try {
      return window.smartEvaluator?.utils?.convertToBanglaNumber(String(n)) ?? String(n);
    } catch {
      return String(n);
    }
  };

  const fmt = (v, d = 2) => {
    const n = typeof v === 'number' ? v : parseFloat(v || 0);
    return bn((Number.isFinite(n) ? n : 0).toFixed(d));
  };

  const toLocaleDate = (date) =>
    date instanceof Date && !Number.isNaN(date.getTime())
      ? (DTF_BN ? DTF_BN.format(date) : DTF_FALLBACK.format(date))
      : '-';

  const prettyRole = (role) =>
    ({
      'team-leader': 'টিম লিডার',
      'time-keeper': 'টাইম কিপার',
      reporter: 'রিপোর্টার',
      'resource-manager': 'রিসোর্স ম্যানেজার',
      'peace-maker': 'পিস মেকার',
    }[role] || (role ? String(role) : ''));

  const roleBadgeClass = (role) =>
    ({
      'team-leader':
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700/40',
      'time-keeper':
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:border-sky-700/40',
      reporter:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-700/40',
      'resource-manager':
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700/40',
      'peace-maker':
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-700/40',
    }[role] ||
    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-200 dark:border-gray-700/40');

  const englishify = (val) => String(val ?? '').replace(/[^\x20-\x7E]/g, '').trim();

  const palette = (p) => {
    const v = Number(p) || 0;
    if (v >= 85)
      return { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300', chip: 'text-emerald-600' };
    if (v >= 70) return { badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/25 dark:text-sky-300', chip: 'text-sky-600' };
    if (v >= 55) return { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300', chip: 'text-amber-600' };
    return { badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/25 dark:text-rose-300', chip: 'text-rose-600' };
  };

  const toAsciiDigits = (val) => {
    const map = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
    return String(val ?? '').replace(/[০-৯]/g, (d) => map[d]);
  };

  // ---------- state ----------
  function getAppState() {
    const app = window.smartEvaluator;
    if (!app) return { students: [], evaluations: [], tasks: [], groups: [] };
    const s = app.managers?.stateManager?.getState?.() || {};
    return {
      students: Array.isArray(s.students) ? s.students : [],
      evaluations: Array.isArray(s.evaluations) ? s.evaluations : [],
      tasks: Array.isArray(s.tasks) ? s.tasks : [],
      groups: Array.isArray(s.groups) ? s.groups : [],
    };
  }

  function computeEvalsForStudent(studentId, state) {
    const taskMap = new Map(state.tasks.map((t) => [t?.id, t]));
    return state.evaluations
      .map((ev) => {
        const sc = ev?.scores?.[studentId];
        const task = taskMap.get(ev?.taskId);
        if (!sc || !task) return null;

        const max = parseFloat(ev?.maxPossibleScore) || parseFloat(task?.maxScore) || 100;
        const total = parseFloat(sc?.totalScore) || 0;
        const pct = max > 0 ? (total / max) * 100 : 0;

        const ms = ev?.taskDate?.seconds
          ? ev.taskDate.seconds * 1000
          : (Date.parse(ev?.taskDate) || 0) || (Date.parse(ev?.updatedAt) || 0) || (Date.parse(task?.date) || 0) || null;

        return {
          taskName: task?.name || '',
          date: ms ? new Date(ms) : null,
          taskScore: parseFloat(sc?.taskScore) || 0,
          teamScore: parseFloat(sc?.teamScore) || 0,
          additional: parseFloat(sc?.additionalScore) || 0,
          mcq: parseFloat(sc?.mcqScore) || 0,
          total,
          max,
          pct,
          comments: typeof sc?.comments === 'string' ? sc.comments.trim() : '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
  }

  function computeRankLabel(studentId, state) {
    try {
      const taskMap = new Map(state.tasks.map((t) => [t?.id, t]));
      const averages = state.students
        .map((st) => {
          const vals = state.evaluations
            .map((ev) => {
              const sc = ev?.scores?.[st?.id];
              const t = taskMap.get(ev?.taskId);
              if (!sc || !t) return null;
              const max = parseFloat(ev?.maxPossibleScore) || parseFloat(t?.maxScore) || 100;
              const tot = parseFloat(sc?.totalScore) || 0;
              return max > 0 ? (tot / max) * 100 : 0;
            })
            .filter((v) => typeof v === 'number');
          return { id: st?.id, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : -1 };
        })
        .filter((x) => (x?.avg ?? -1) >= 0)
        .sort((a, b) => b.avg - a.avg);

      const idx = averages.findIndex((x) => x?.id === studentId);
      return idx >= 0 ? bn(idx + 1) : '-';
    } catch {
      return '-';
    }
  }

  // ---------- Firestore latest role (optional; no-op if Firebase not present) ----------
  async function fetchStudentRoleFromFirestore(studentId) {
    try {
      const fb = window.firebase || window.Firebase || null;
      if (!fb?.firestore) return null;
      const db = fb.firestore();
      const direct = await db.collection('students').doc(String(studentId)).get();
      if (direct?.exists) {
        const d = direct.data() || {};
        return d.role || d.duty || null;
      }
      const q = await db.collection('students').where('id', '==', String(studentId)).limit(1).get();
      if (!q.empty) {
        const d = q.docs[0].data() || {};
        return d.role || d.duty || null;
      }
    } catch {}
    return null;
  }

  // ---------- UI render ----------
  function setText(id, val) {
    const el = byId(id);
    if (el) el.textContent = val || '';
  }
  function setHtml(id, html) {
    const el = byId(id);
    if (el) el.innerHTML = html;
  }

  function renderHeader(student, groupName, evals, avgPct, avgTotal, rankLabel) {
    const avEl = byId('sdmAvatar');
    if (avEl) {
      avEl.src = student.photoURL || student.avatar || 'images/smart.png';
      avEl.onerror = () => { avEl.onerror = null; avEl.src = 'images/smart.png'; };
      avEl.alt = `${student.name || student.id || 'Student'} avatar`;
    }

    setText('sdmTitle', 'শিক্ষার্থীর ফলাফল');
    setText('sdmRoll', student.roll ? `রোল: ${bn(student.roll)}` : '');

    const name = escHtml(student.name || student.id || '');
    const role = safeStr(student.role).trim();
    const roleLabel = prettyRole(role);
    const roleClass = roleBadgeClass(role);
    const roleHtml = roleLabel
      ? `<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${roleClass}">
           <i class="fas fa-id-badge"></i>${escHtml(roleLabel)}
         </span>` : '';

    setHtml('sdmName', `<span class="mr-2 align-middle">${name}</span>${roleHtml}`);

    setText('sdmGroup', groupName ? `গ্রুপ: ${groupName}` : '');
    setText('sdmAcademic', student.academicGroup ? `শিক্ষা বিভাগ: ${student.academicGroup}` : '');
    setText('sdmSession', student.session ? `সেশন: ${student.session}` : '');
    const hasContact = Boolean(student.email) || Boolean(student.contact);
    setText('sdmContact', hasContact ? `যোগাযোগ: ${student.email || ''} ${student.contact || ''}` : '');

    setText('sdmAvgTotal', fmt(avgTotal));
    setText('sdmAvgPct', `${fmt(avgPct, 1)}%`);
    setText('sdmRank', rankLabel);

    const plist = byId('sdmParamList');
    if (plist) {
      const frag = document.createDocumentFragment();
      plist.innerHTML = '';
      const count = Math.max(1, evals.length);
      const sums = evals.reduce(
        (a, r) => ({ task: a.task + (r.taskScore || 0), team: a.team + (r.teamScore || 0),
                     additional: a.additional + (r.additional || 0), mcq: a.mcq + (r.mcq || 0),
                     total: a.total + (r.total || 0) }),
        { task: 0, team: 0, additional: 0, mcq: 0, total: 0 }
      );
      const avgTotalLocal = sums.total / count || 0;
      [
        ['টাস্ক', sums.task / count],
        ['টিম', sums.team / count],
        ['অতিরিক্ত', sums.additional / count],
        ['MCQ', sums.mcq / count],
      ].forEach(([k, v]) => {
        const li = document.createElement('li');
        const pal = palette(avgTotalLocal > 0 ? (v / avgTotalLocal) * 100 : 0);
        li.className = `rounded border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 ${pal.chip}`;
        li.textContent = `${k}: ${fmt(v)}`;
        frag.appendChild(li);
      });
      plist.appendChild(frag);
    }

    const foot = byId('sdmFootnote');
    if (foot) foot.textContent = `${bn(evals.length)} টি মূল্যায়নের তথ্য দেখানো হচ্ছে`;
  }

  function renderTable(evals) {
    const tbody = byId('sdmTableBody');
    if (!tbody) return;
    const frag = document.createDocumentFragment();
    for (const h of evals) {
      const tr = document.createElement('tr');
      const pal = palette(h.pct);
      const dateLabel = h.date ? toLocaleDate(h.date) : '-';
      tr.innerHTML = `
        <td class="px-3 py-2">${escHtml(h.taskName || '-')}</td>
        <td class="px-3 py-2"><span class="inline-block rounded px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">${fmt(h.taskScore)}</span></td>
        <td class="px-3 py-2"><span class="inline-block rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">${fmt(h.teamScore)}</span></td>
        <td class="px-3 py-2"><span class="inline-block rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">${fmt(h.additional)}</span></td>
        <td class="px-3 py-2"><span class="inline-block rounded px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">${fmt(h.mcq)}</span></td>
        <td class="px-3 py-2">${fmt(h.total)}</td>
        <td class="px-3 py-2"><span class="inline-block rounded px-2 py-0.5 text-xs font-semibold ${pal.badge}">${fmt(h.pct,1)}%</span></td>
        <td class="px-3 py-2">${escHtml(h.comments || '')}</td>
        <td class="px-3 py-2">${escHtml(dateLabel)}</td>`;
      frag.appendChild(tr);
    }
    tbody.innerHTML = '';
    tbody.appendChild(frag);
  }

  function renderChart(evals) {
    const canvas = byId('sdmChart');
    if (!canvas || !window.Chart) return;
    const labels = evals.map(r => r.taskName || (r.date ? toLocaleDate(r.date) : 'N/A'));
    const values = evals.map(r => Number((r.pct || 0).toFixed(1)));
    const colors = values.map((_, i, a) => (i === a.length - 1 ? '#22c55e' : '#94a3b8'));

    if (UI.chart && Array.isArray(UI.chart.data?.labels) && UI.chart.data.labels.length === labels.length) {
      UI.chart.data.labels = labels;
      UI.chart.data.datasets[0].data = values;
      UI.chart.data.datasets[0].backgroundColor = colors;
      UI.chart.update('none');
      return;
    }

    if (UI.chart) { try { UI.chart.destroy(); } catch {} UI.chart = null; }

    UI.chart = new window.Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, maxBarThickness: 32, categoryPercentage: 0.6, barPercentage: 0.8 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 150 },
        plugins: { legend: { display: false }, tooltip: { displayColors: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 8 } },
          y: { beginAtZero: true, max: 100, grace: '5%', grid: { color: 'rgba(148,163,184,0.25)' }, ticks: { stepSize: 20, callback: (v) => bn(v) } }
        }
      }
    });
  }

  // ---------- downloads ----------
  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    }
  }

  function downloadCsv() {
    const modal = UI.els.modal; if (!modal) return;
    const evs = modal.__evals || [], st = modal.__student || {};
    if (!evs.length) return;

    const headers = ['Title','Task','Team','Additional','MCQ','Total','Percent','Comments','Date'];
    const toIso = (d) => { try { return (d ? new Date(d) : null)?.toISOString().slice(0,10) || ''; } catch { return ''; } };
    const rows = evs.map(h => [
      h.taskName || '',
      Number(h.taskScore || 0).toFixed(2),
      Number(h.teamScore || 0).toFixed(2),
      Number(h.additional || 0).toFixed(2),
      Number(h.mcq || 0).toFixed(2),
      Number(h.total || 0).toFixed(2),
      Number(h.pct || 0).toFixed(1),
      (h.comments || '').replace(/\r?\n/g, ' '),
      toIso(h.date),
    ]);
    const enc = (x) => { const s = String(x ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const BOM = '\ufeff';
    const csv = [headers.map(enc).join(','), ...rows.map(r => r.map(enc).join(','))].join('\r\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const fname = `${(st.name || st.id || 'student').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'student'}_report.csv`;
    triggerBlobDownload(blob, fname);
  }

  function downloadPdf() {
    const modal = UI.els.modal; if (!modal) return;
    const evs = modal.__evals || [], st = modal.__student || {};
    if (!evs.length) return;

    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || null;
    if (!jsPDFCtor) { console.error('jsPDF not loaded'); return; }
    const hasAutoTable = !!(window.jspdf?.autoTable || jsPDFCtor?.autoTable || (jsPDFCtor?.API && jsPDFCtor.API.autoTable));
    if (!hasAutoTable) { console.error('autoTable plugin missing'); return; }

    const doc = new jsPDFCtor('p','pt','a4');
    const M = 36, BRAND_BG = [79,70,229];
    const PAGE_W = doc.internal.pageSize.getWidth();
    const PAGE_H = doc.internal.pageSize.getHeight();

    const text = (t,x,y,opt={}) => doc.text(t,x,y,opt);
    const line = (x1,y1,x2,y2,c=[226,232,240]) => { doc.setDrawColor(...c); doc.line(x1,y1,x2,y2); };
    const wrap = (t,w) => doc.splitTextToSize(t,w);

    const drawUnicodeText = (str, x, y, maxW = 200, fontPx = 10, color = '#0f172a') => {
      try {
        const s = String(str ?? ''); if (!s) return;
        const scale = 2, pad = 6 * scale;
        UNICODE_CTX.font = `${fontPx * scale}px 'Noto Sans Bengali','Hind Siliguri','SolaimanLipi','Segoe UI',sans-serif`;
        const m = UNICODE_CTX.measureText(s);
        UNICODE_CANVAS.width = Math.ceil(m.width) + pad;
        UNICODE_CANVAS.height = Math.ceil(fontPx * 1.6 * scale) + pad;
        const ctx2 = UNICODE_CANVAS.getContext('2d');
        ctx2.font = UNICODE_CTX.font; ctx2.fillStyle = color; ctx2.textBaseline = 'top';
        ctx2.fillText(s, pad/2, pad/2);
        const url = UNICODE_CANVAS.toDataURL('image/png');
        const ptPerPx = 0.75;
        let w = UNICODE_CANVAS.width * ptPerPx, h = UNICODE_CANVAS.height * ptPerPx;
        if (w > maxW) { const r = maxW / w; w = maxW; h *= r; }
        doc.addImage(url, 'PNG', x, y - fontPx*0.8, w, h);
      } catch {}
    };

    // header/footer
    const headerH = 84, footerH = 28;
    const drawHeader = () => {
      doc.setFillColor(...BRAND_BG);
      doc.rect(M, M, PAGE_W - M*2, headerH - 20, 'F');
      doc.setTextColor(255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      text('Smart Evaluate Automated System', PAGE_W/2, M+18, { align: 'center' });
      doc.setFontSize(14); text('Student Result Report', PAGE_W/2, M+36, { align: 'center' });

      const g = new Date();
      const genStr = `Generated: ${g.getFullYear()}-${String(g.getMonth()+1).padStart(2,'0')}-${String(g.getDate()).padStart(2,'0')} ${String(g.getHours()).padStart(2,'0')}:${String(g.getMinutes()).padStart(2,'0')}`;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107,114,128);
      doc.setFillColor(255,255,255); doc.rect(PAGE_W - M - 175, M - 18, 170, 16, 'F');
      text(genStr, PAGE_W - M - 170, M - 6);
      line(M, M + headerH - 12, PAGE_W - M, M + headerH - 12);
    };
    const drawFooter = () => {
      const y = PAGE_H - footerH;
      line(M, y, PAGE_W - M, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107,114,128);
      text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, PAGE_W - M - 40, PAGE_H - 10);
    };
    const addHeaderFooter = () => {
      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) { doc.setPage(i); drawHeader(); drawFooter(); }
    };

    // content
    let y = M + headerH + 6;
    const institution = 'Institution: Muktijoddha Major Mostofa College, Rajapur, Mirsharai, Chattogram';
    const developer = 'Developed by: Mustafa Rahman Sir, Senior Software Engineer';
    const devContact = 'Query for Contact: 01840-643946';

    doc.setTextColor(17,24,39); doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text(wrap(institution, PAGE_W - M*2), M, y); y += 22;

    const cardH = 40;
    doc.setDrawColor(99,102,241); doc.setFillColor(238,242,255);
    doc.rect(M, y, PAGE_W - M*2, cardH, 'FD');
    doc.setTextColor(55,48,163);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(developer, M+10, y+16);
    doc.setFont('helvetica','normal'); doc.text(devContact, M+10, y+30);
    y += cardH + 10;

    // summary box
    const infoH = 96, colW = (PAGE_W - M*2)/2, rightX = M + colW + 12, base = y + 20;
    doc.setDrawColor(226,232,240); doc.setFillColor(248,250,252);
    doc.rect(M, y, PAGE_W - M*2, infoH, 'FD');
    doc.setTextColor(15,23,42);

    const kv = (k, v, yy) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); text(k, M+12, yy);
      doc.setFont('helvetica','normal');
      const valX = M + 12 + 120;
      const avail = (PAGE_W - M*2)/2 - (valX - (M+12)) - 12;
      /[^\x00-\x7F]/.test(String(v || '')) ? drawUnicodeText(v, valX, yy, avail, 10) : text(String(v ?? ''), valX, yy);
    };

    kv('Student:', st.name || st.id || '', base);
    kv('Roll:', st.roll || '-', base + 16);
    kv('Group:', UI.els.modal.__groupName || '-', base + 32);

    const dutyBn = prettyRole(st.role) || '-';
    const dutyAscii = englishify(dutyBn) || '-';
    if (/[^\x00-\x7F]/.test(dutyBn)) {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); text('Duty:', M+12, base+48);
      drawUnicodeText(`${dutyBn} (${dutyAscii})`, M+12+120, base+48, (PAGE_W - M*2)/2 - 132, 10);
    } else {
      kv('Duty:', dutyAscii, base + 48);
    }

    doc.setFont('helvetica','bold'); doc.setFontSize(10); text('Average Total:', rightX, base);
    doc.setFont('helvetica','normal'); text(String((UI.els.modal.__avgTotal || 0).toFixed(2)), rightX+90, base);
    doc.setFont('helvetica','bold'); text('Average %:', rightX, base+16);
    doc.setFont('helvetica','normal'); text(`${(UI.els.modal.__avgPct || 0).toFixed(1)}%`, rightX+90, base+16);
    doc.setFont('helvetica','bold'); text('Rank:', rightX, base+32);
    doc.setFont('helvetica','normal'); text(toAsciiDigits(UI.els.modal.__rank ?? '-'), rightX+90, base+32);

    y += infoH + 14;

    // table
    const head = [['Assignment','Task','Team','Additional','MCQ','Total','%','Comments','Date']];
    const body = evs.map((h,i) => {
      const c = (h.comments || '').replace(/\r?\n/g,' ').trim();
      const short = c.length > 240 ? 'Comment too long. See in app.' : c;
      return [
        `Assignment-${i+1}`,
        Number(h.taskScore || 0).toFixed(2),
        Number(h.teamScore || 0).toFixed(2),
        Number(h.additional || 0).toFixed(2),
        Number(h.mcq || 0).toFixed(2),
        Number(h.total || 0).toFixed(2),
        Number(h.pct || 0).toFixed(1),
        short,
        h.date ? new Date(h.date).toISOString().slice(0,10) : '',
      ];
    });

    (doc.autoTable || jsPDFCtor.API.autoTable).call(doc, {
      startY: y,
      head, body,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, lineWidth: 0.25, lineColor: [226,232,240] },
      headStyles: { fillColor: BRAND_BG, textColor: 255, halign: 'left' },
      alternateRowStyles: { fillColor: [248,250,252] },
      columnStyles: {
        0: { cellWidth: 64 }, 1: { cellWidth: 44, halign: 'right' }, 2: { cellWidth: 44, halign: 'right' },
        3: { cellWidth: 50, halign: 'right' }, 4: { cellWidth: 40, halign: 'right' },
        5: { cellWidth: 48, halign: 'right' }, 6: { cellWidth: 30, halign: 'right' },
        7: { cellWidth: 120 }, 8: { cellWidth: 80, halign: 'center' },
      },
      margin: { left: M, right: M, top: M + headerH, bottom: footerH + 6 },
      tableWidth: PAGE_W - M * 2,
      pageBreak: 'auto',
    });

    addHeaderFooter();
    const fname = `${(st.name || st.id || 'student').replace(/[\\/:*?"<>|]+/g,'_').trim() || 'student'}_report.pdf`;
    doc.save(fname);
  }

  // ---------- safe click wrapper to prevent multi-download ----------
  async function safeClick(btn, job) {
    if (!btn || btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    const prevDisabled = btn.disabled;
    btn.disabled = true;
    btn.classList.add('opacity-60','pointer-events-none');
    try { await Promise.resolve(job()); }
    finally {
      setTimeout(() => {
        btn.dataset.busy = '0';
        btn.disabled = prevDisabled;
        btn.classList.remove('opacity-60','pointer-events-none');
      }, 500);
    }
  }

  // ---------- open modal ----------
  async function openStudentModalById(studentId) {
    const modal = UI.els.modal; if (!modal) return;

    const state = getAppState();
    const studentIdx = state.students.findIndex((s) => s?.id === studentId);
    if (studentIdx < 0) return;
    const student = { ...state.students[studentIdx] };

    const latestRole = await fetchStudentRoleFromFirestore(studentId);
    if (latestRole) student.role = latestRole;

    const groupName = state.groups.find((g) => g?.id === student.groupId)?.name || '';
    const evals = computeEvalsForStudent(studentId, state);

    const count = Math.max(1, evals.length);
    const sums = evals.reduce((a, r) => ({ total: a.total + (r.total || 0), pct: a.pct + (r.pct || 0) }), { total: 0, pct: 0 });
    const avgPct = sums.pct / count;
    const avgTotal = sums.total / count;
    const rankLabel = computeRankLabel(studentId, state);

    renderHeader(student, groupName, evals, avgPct, avgTotal, rankLabel);
    renderTable(evals);
    renderChart(evals);

    modal.__evals = evals;
    modal.__student = student;
    modal.__groupName = groupName;
    modal.__avgPct = avgPct;
    modal.__avgTotal = avgTotal;
    modal.__rank = rankLabel !== '-' ? rankLabel : null;

    // default to table view
    setMode('table');
    modal.classList.remove('hidden');
  }

  // ---------- view mode ----------
  function setMode(mode) {
    const chart = mode === 'chart';
    UI.els.wrapChart?.classList.toggle('hidden', !chart);
    UI.els.wrapTable?.classList.toggle('hidden', chart);
    UI.els.btnTable?.classList.toggle('bg-gray-100', !chart);
    UI.els.btnTable?.classList.toggle('dark:bg-gray-800', !chart);
    UI.els.btnChart?.classList.toggle('bg-gray-100', chart);
    UI.els.btnChart?.classList.toggle('dark:bg-gray-800', chart);
  }

  // ---------- bindings ----------
  function bindOnce() {
    if (UI.bound) return;
    UI.bound = true;

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-close]')) {
        UI.els.modal?.classList.add('hidden');
        if (UI.chart) { try { UI.chart.destroy(); } catch {} UI.chart = null; }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && UI.els.modal && !UI.els.modal.classList.contains('hidden')) {
        UI.els.modal.classList.add('hidden');
        if (UI.chart) { try { UI.chart.destroy(); } catch {} UI.chart = null; }
      }
    });

    document.addEventListener('click', (e) => {
      const el = e.target.closest('.ranking-card, .view-rank-details-btn');
      if (!el) return;
      const id = el.getAttribute('data-student-id');
      if (id) { e.preventDefault(); window.openStudentModalById(id); }
    });

    UI.els.btnCsv?.addEventListener('click', (e) => { e.stopPropagation(); safeClick(UI.els.btnCsv, downloadCsv); });
    UI.els.btnPdf?.addEventListener('click', (e) => { e.stopPropagation(); safeClick(UI.els.btnPdf, downloadPdf); });

    UI.els.btnTable?.addEventListener('click', () => setMode('table'));
    UI.els.btnChart?.addEventListener('click', () => setMode('chart'));

    // fallback avatar fix (once)
    qsa('img[src="avatar.png"]').forEach((img) => {
      img.src = 'images/smart.png';
      img.onerror = () => { img.onerror = null; img.src = 'images/smart.png'; };
    });
  }

  function init() {
    UI.els.modal     = byId('studentDetailModal');
    UI.els.btnCsv    = byId('sdmDownloadCsv');
    UI.els.btnPdf    = byId('sdmDownloadPdf');
    UI.els.btnTable  = byId('sdmBtnTable');
    UI.els.btnChart  = byId('sdmBtnChart');
    UI.els.wrapTable = byId('sdmTableWrap');
    UI.els.wrapChart = byId('sdmChartWrap');

    if (!UI.els.modal) { console.warn('[SDM] modal node missing; script loaded but no #studentDetailModal.'); return; }

    bindOnce();
    if (!window.openStudentModalById) window.openStudentModalById = openStudentModalById; // expose once
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

