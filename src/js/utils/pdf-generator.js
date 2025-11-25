/**
 * Generates a PDF by opening the browser's print dialog for the given HTML content.
 * This ensures perfect rendering of Bengali text by leveraging the browser's native engine.
 * 
 * @param {string} htmlContent - The HTML content to render.
 */
async function _printHTML(htmlContent) {
  // 1. Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  // 2. Write content to the iframe
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Noto Sans Bengali', sans-serif; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        @media print {
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body class="bg-white text-gray-900 p-8">
      ${htmlContent}
      <script>
        // Wait for fonts and styles to load before printing
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onafterprint = () => {
              // Optional: Notify parent window
            };
          }, 1000); // Small delay to ensure rendering
        };
      </script>
    </body>
    </html>
  `);
  doc.close();

  // 3. Cleanup logic (optional, but good practice to remove iframe after use)
  // Note: Removing immediately might cancel the print dialog in some browsers.
  // We'll leave it or remove it on a timeout/event if needed. 
  // For now, let's keep it simple.
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 60000); // Remove after 1 minute to allow time for printing
}

/**
 * Generates "Group-based Analysis Data Report PDF"
 */
export async function generateGroupAnalysisPDF(data, uiManager) {
  const date = new Date().toLocaleDateString('bn-BD');
  
  const rows = data.map((item, index) => `
    <tr class="border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
      <td class="py-2 px-3 text-left">${item.groupName}</td>
      <td class="py-2 px-3 text-center">${_bn(item.studentCount)}</td>
      <td class="py-2 px-3 text-center">${_bn(item.evaluationCount)}</td>
      <td class="py-2 px-3 text-center">${_bn(item.averageScore)}%</td>
      <td class="py-2 px-3 text-center">${_bn(item.participationRate)}%</td>
    </tr>
  `).join('');

  const html = `
    <div class="font-bengali">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-blue-700 mb-2">স্মার্ট গ্রুপ ইভালুয়েটর</h1>
        <h2 class="text-xl font-semibold text-gray-700">গ্রুপ ভিত্তিক বিশ্লেষণ রিপোর্ট</h2>
        <p class="text-sm text-gray-500 mt-1">তারিখ: ${date}</p>
      </div>
      
      <table class="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr class="bg-blue-600 text-white">
            <th class="py-2 px-3 text-left font-semibold">গ্রুপের নাম</th>
            <th class="py-2 px-3 text-center font-semibold">সদস্য</th>
            <th class="py-2 px-3 text-center font-semibold">মূল্যায়ন</th>
            <th class="py-2 px-3 text-center font-semibold">গড় স্কোর</th>
            <th class="py-2 px-3 text-center font-semibold">অংশগ্রহণ</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div class="mt-8 text-xs text-gray-400 text-center border-t pt-2">
        রিপোর্ট জেনারেটেড বাই স্মার্ট গ্রুপ ইভালুয়েটর সিস্টেম
      </div>
    </div>
  `;

  await _printHTML(html);
  uiManager.showToast('প্রিন্ট ডায়ালগ ওপেন হচ্ছে...', 'info');
}

/**
 * Generates "All Students Data Report PDF"
 */
export async function generateAllStudentsPDF(students, groupsMap, uiManager) {
  const date = new Date().toLocaleDateString('bn-BD');
  
  const rows = students.map((s, index) => `
    <tr class="border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
      <td class="py-2 px-2 text-center">${_bn(s.roll)}</td>
      <td class="py-2 px-2 text-left font-medium">${s.name}</td>
      <td class="py-2 px-2 text-left">${groupsMap.get(s.groupId) || '-'}</td>
      <td class="py-2 px-2 text-center">${s.academicGroup || '-'}</td>
      <td class="py-2 px-2 text-center">${s.gender || '-'}</td>
      <td class="py-2 px-2 text-center">${s.contact || '-'}</td>
    </tr>
  `).join('');

  const html = `
    <div class="font-bengali">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-indigo-700 mb-2">স্মার্ট গ্রুপ ইভালুয়েটর</h1>
        <h2 class="text-xl font-semibold text-gray-700">সকল শিক্ষার্থীর তালিকা</h2>
        <p class="text-sm text-gray-500 mt-1">মোট শিক্ষার্থী: ${_bn(students.length)} জন | তারিখ: ${date}</p>
      </div>
      
      <table class="w-full border-collapse border border-gray-300 text-xs">
        <thead>
          <tr class="bg-indigo-600 text-white">
            <th class="py-2 px-2 text-center font-semibold w-16">রোল</th>
            <th class="py-2 px-2 text-left font-semibold">নাম</th>
            <th class="py-2 px-2 text-left font-semibold">গ্রুপ</th>
            <th class="py-2 px-2 text-center font-semibold">বিভাগ</th>
            <th class="py-2 px-2 text-center font-semibold">লিঙ্গ</th>
            <th class="py-2 px-2 text-center font-semibold">মোবাইল</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div class="mt-8 text-xs text-gray-400 text-center border-t pt-2">
        রিপোর্ট জেনারেটেড বাই স্মার্ট গ্রুপ ইভালুয়েটর সিস্টেম
      </div>
    </div>
  `;

  await _printHTML(html);
  uiManager.showToast('প্রিন্ট ডায়ালগ ওপেন হচ্ছে...', 'info');
}

/**
 * Generates "All Groups Student Detailed Data Group-wise Download PDF"
 */
export async function generateGroupWiseStudentsPDF(groups, students, uiManager) {
  const date = new Date().toLocaleDateString('bn-BD');
  
  let contentHtml = '';
  
  groups.forEach(group => {
    const groupStudents = students.filter(s => s.groupId === group.id);
    if (groupStudents.length === 0) return;

    const rows = groupStudents.map((s, index) => `
      <tr class="border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
        <td class="py-1 px-2 text-center">${_bn(s.roll)}</td>
        <td class="py-1 px-2 text-left">${s.name}</td>
        <td class="py-1 px-2 text-center">${s.role || '-'}</td>
        <td class="py-1 px-2 text-center">${s.contact || '-'}</td>
      </tr>
    `).join('');

    contentHtml += `
      <div class="mb-8 break-inside-avoid">
        <h3 class="text-lg font-bold text-purple-700 mb-2 border-b-2 border-purple-200 pb-1">
          ${group.name} <span class="text-sm font-normal text-gray-500 ml-2">(${_bn(groupStudents.length)} জন)</span>
        </h3>
        <table class="w-full border-collapse border border-gray-200 text-xs">
          <thead>
            <tr class="bg-purple-100 text-purple-900">
              <th class="py-1 px-2 text-center w-16">রোল</th>
              <th class="py-1 px-2 text-left">নাম</th>
              <th class="py-1 px-2 text-center">দায়িত্ব</th>
              <th class="py-1 px-2 text-center">মোবাইল</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  });

  const html = `
    <div class="font-bengali">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-purple-700 mb-2">স্মার্ট গ্রুপ ইভালুয়েটর</h1>
        <h2 class="text-xl font-semibold text-gray-700">গ্রুপ ভিত্তিক বিস্তারিত তালিকা</h2>
        <p class="text-sm text-gray-500 mt-1">তারিখ: ${date}</p>
      </div>
      
      <div class="space-y-4">
        ${contentHtml}
      </div>
      
      <div class="mt-8 text-xs text-gray-400 text-center border-t pt-2">
        রিপোর্ট জেনারেটেড বাই স্মার্ট গ্রুপ ইভালুয়েটর সিস্টেম
      </div>
    </div>
  `;

  await _printHTML(html);
  uiManager.showToast('প্রিন্ট ডায়ালগ ওপেন হচ্ছে...', 'info');
}

// Helper to convert numbers to Bangla
function _bn(num) {
  if (num === undefined || num === null) return '-';
  const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(c => {
    const index = en.indexOf(c);
    return index > -1 ? bn[index] : c;
  }).join('');
}

// --- Helpers for Result Reports ---

function _extractTs(d) {
  if (!d) return 0;
  if (typeof d === 'object' && d.seconds) return d.seconds * 1000;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function _prettyRoleBn(role) {
  return ({
    'team-leader': 'টিম লিডার',
    'time-keeper': 'টাইম কিপার',
    reporter: 'রিপোর্টার',
    'resource-manager': 'রিসোর্স ম্যানেজার',
    'peace-maker': 'পিস মেকার',
  }[String(role || '').trim()] || (role ? String(role) : ''));
}

function _roleBadgeClass(role) {
  return ({
    'team-leader': 'bg-amber-50 text-amber-700 border-amber-200',
    'time-keeper': 'bg-sky-50 text-sky-700 border-sky-200',
    reporter: 'bg-purple-50 text-purple-700 border-purple-200',
    'resource-manager': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'peace-maker': 'bg-rose-50 text-rose-700 border-rose-200',
  }[String(role || '').trim()] || 'bg-gray-50 text-gray-700 border-gray-200');
}

const ACAD_PALETTE = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'bg-lime-50 text-lime-700 border-lime-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

function _acadBadgeClass(label) {
  const s = String(label || '').trim();
  if (!s) return 'bg-gray-50 text-gray-700 border-gray-200';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  return ACAD_PALETTE[h % ACAD_PALETTE.length];
}

function _pctBadgeClass(p) {
  const v = Number(p) || 0;
  if (v >= 85) return 'bg-emerald-50 text-emerald-700';
  if (v >= 70) return 'bg-sky-50 text-sky-700';
  if (v >= 55) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

function _computeGroupPerformance(groupId, groups, students, tasks, evaluations) {
  const taskMap = new Map(tasks.map((t) => [t?.id, t]));
  const members = students.filter((s) => String(s?.groupId) === String(groupId));
  const memberIds = new Set(members.map((m) => String(m?.id)));
  const evals = evaluations.filter((ev) => String(ev?.groupId) === String(groupId));

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
    const ts = _extractTs(ev?.taskDate || ev?.updatedAt || ev?.evaluationDate || ev?.createdAt || task?.date);
    return { ev, task, ts, avgPct: cnt ? (sumPct / cnt) : 0, count: cnt, topStudentId: bestId, topPct: bestPct };
  });

  const groupAvg = perEval.length ? perEval.reduce((a, b) => a + b.avgPct, 0) / perEval.length : 0;

  // rank among all groups by their average %
  const other = groups.map((g) => {
    const gid = String(g?.id);
    const evs = evaluations.filter((ev) => String(ev?.groupId) === gid);
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

function _generateGroupHTML(group, students, tasks, evaluations) {
  const { perEval, groupAvg, rank } = _computeGroupPerformance(group.id, [group], students, tasks, evaluations); // Pass single group for rank calc context? No, rank needs all groups.
  // Actually, _computeGroupPerformance needs ALL groups to calculate rank properly.
  // Let's adjust _computeGroupPerformance to accept all groups, but we are calling it inside a loop in generateAllGroupsResultPDF.
  // To avoid re-calculating rank every time, we could optimize, but for PDF generation (client-side), it's okay.
  // Wait, I need to pass ALL groups to _computeGroupPerformance.
  
  // Refactored to pass all groups in the main function call.
  return ''; // Placeholder, logic moved to main functions
}

/**
 * Generates "All Groups Result PDF"
 * Iterates through all groups and creates a detailed report for each.
 */
export async function generateAllGroupsResultPDF(groups, students, tasks, evaluations, uiManager) {
  const date = new Date().toLocaleDateString('bn-BD');
  let contentHtml = '';

  // Sort groups by name
  const sortedGroups = [...groups].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'bn'));

  for (const group of sortedGroups) {
    const { perEval, groupAvg, rank } = _computeGroupPerformance(group.id, groups, students, tasks, evaluations);
    
    // Header Stats
    const statsHtml = `
      <div class="grid grid-cols-4 gap-3 mb-6">
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div class="text-indigo-600"><i class="fa-solid fa-layer-group text-xl"></i></div>
          <div><div class="text-xs text-gray-500">Group</div><div class="text-sm font-semibold">${group.name}</div></div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div class="text-emerald-600"><i class="fa-solid fa-chart-line text-xl"></i></div>
          <div><div class="text-xs text-gray-500">Average %</div><div class="text-sm font-semibold">${groupAvg.toFixed(2)}%</div></div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div class="text-amber-600"><i class="fa-solid fa-crown text-xl"></i></div>
          <div><div class="text-xs text-gray-500">Rank</div><div class="text-sm font-semibold">${rank ? _bn(rank) : '-'}</div></div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div class="text-sky-600"><i class="fa-solid fa-percent text-xl"></i></div>
          <div><div class="text-xs text-gray-500">Evaluations</div><div class="text-sm font-semibold">${_bn(perEval.length)}</div></div>
        </div>
      </div>
    `;

    // Evaluations Table
    const sortedEvals = perEval.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const evalsRows = sortedEvals.map((e, idx) => `
      <tr class="border-b border-gray-100">
        <td class="px-3 py-2">${e.task?.name || 'Assignment-' + (idx + 1)}</td>
        <td class="px-3 py-2">${e.ts ? new Date(e.ts).toLocaleDateString('bn-BD') : '-'}</td>
        <td class="px-3 py-2 text-center">${_bn(e.count)}</td>
        <td class="px-3 py-2 text-center">${e.avgPct.toFixed(2)}%</td>
      </tr>
    `).join('');

    const evalsTable = `
      <h4 class="text-sm font-bold text-gray-700 mb-2 uppercase">Evaluations Summary</h4>
      <table class="w-full border-collapse border border-gray-200 text-xs mb-6">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2 text-left">Assignment</th>
            <th class="px-3 py-2 text-left">Date</th>
            <th class="px-3 py-2 text-center">Evaluated</th>
            <th class="px-3 py-2 text-center">Avg %</th>
          </tr>
        </thead>
        <tbody>${evalsRows}</tbody>
      </table>
    `;

    contentHtml += `
      <div class="break-after-page mb-8">
        <h2 class="text-xl font-bold text-indigo-800 mb-4 border-b-2 border-indigo-100 pb-2">${group.name}</h2>
        ${statsHtml}
        ${evalsTable}
      </div>
    `;
  }

  const html = `
    <div class="font-bengali">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-indigo-700">স্মার্ট গ্রুপ ইভালুয়েটর</h1>
        <h2 class="text-lg font-semibold text-gray-600">সকল গ্রুপ ফলাফল রিপোর্ট</h2>
        <p class="text-sm text-gray-500">তারিখ: ${date}</p>
      </div>
      ${contentHtml}
    </div>
  `;

  await _printHTML(html);
  uiManager.showToast('প্রিন্ট ডায়ালগ ওপেন হচ্ছে...', 'info');
}

/**
 * Generates "Assignment Result PDF"
 * Filters by assignment and shows detailed breakdown for each group for that assignment.
 */
export async function generateAssignmentResultPDF(assignmentIndex, groups, students, tasks, evaluations, uiManager) {
  const date = new Date().toLocaleDateString('bn-BD');
  let contentHtml = '';
  
  // Find the task/assignment based on index (logic similar to modal selector)
  // But wait, the selector in modal is per-group. Here we want a global selector.
  // We need to know WHICH assignment the user selected.
  // The UI passes 'assignmentIndex' which might be an index in a sorted list of ALL assignments.
  // Let's assume the UI passes the Task ID or we derive it.
  // For simplicity, let's assume the UI passes the Task ID.
  
  const taskId = String(assignmentIndex); 
  const task = tasks.find(t => String(t.id) === taskId);
  const taskName = task ? task.name : 'Unknown Assignment';

  // Sort groups
  const sortedGroups = [...groups].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'bn'));

  for (const group of sortedGroups) {
    // Get evaluation for this group and task
    const ev = evaluations.find(e => String(e.groupId) === String(group.id) && String(e.taskId) === taskId);
    
    if (!ev) continue; // Skip groups that didn't participate

    const max = parseFloat(ev.maxPossibleScore) || parseFloat(task?.maxScore) || 100;
    const scores = ev.scores || {};
    
    // Calculate group stats for this assignment
    let totalScore = 0;
    let studentCount = 0;
    
    const studentRows = students
      .filter(s => s.groupId === group.id)
      .map(s => {
        const sc = scores[s.id];
        if (!sc) return null; // Skip students not evaluated? Or show as absent? Modal shows only evaluated usually.
        
        const taskScore = parseFloat(sc.taskScore) || 0;
        const teamScore = parseFloat(sc.teamScore) || 0;
        const additional = parseFloat(sc.additionalScore) || 0;
        const mcq = parseFloat(sc.mcqScore) || 0;
        const total = parseFloat(sc.totalScore) || (taskScore + teamScore + additional + mcq);
        const pct = max > 0 ? (total / max) * 100 : 0;
        
        totalScore += total;
        studentCount++;

        return {
          roll: s.roll || s.studentRoll || '-',
          name: s.name,
          role: s.role,
          total,
          pct,
          comment: sc.comments || ''
        };
      })
      .filter(r => r !== null)
      .sort((a, b) => b.pct - a.pct);

    if (studentRows.length === 0) continue;

    const groupAvg = max > 0 ? ((totalScore / studentCount) / max) * 100 : 0;

    const rowsHtml = studentRows.map(r => `
      <tr class="border-b border-gray-100">
        <td class="px-2 py-1 text-center">${_bn(r.roll)}</td>
        <td class="px-2 py-1 font-medium">${r.name}</td>
        <td class="px-2 py-1 text-xs text-gray-500">${_prettyRoleBn(r.role)}</td>
        <td class="px-2 py-1 text-right font-bold">${r.total.toFixed(2)}</td>
        <td class="px-2 py-1 text-right"><span class="px-1 py-0.5 rounded text-xs ${_pctBadgeClass(r.pct)}">${r.pct.toFixed(1)}%</span></td>
        <td class="px-2 py-1 text-xs text-gray-500 truncate max-w-[150px]">${r.comment}</td>
      </tr>
    `).join('');

    contentHtml += `
      <div class="mb-8 break-inside-avoid">
        <div class="flex items-center justify-between mb-2 border-b border-gray-200 pb-1">
          <h3 class="text-lg font-bold text-indigo-700">${group.name}</h3>
          <div class="text-sm text-gray-600">Avg: <span class="font-bold">${groupAvg.toFixed(2)}%</span></div>
        </div>
        <table class="w-full border-collapse border border-gray-200 text-xs">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-2 py-1 text-center w-12">Roll</th>
              <th class="px-2 py-1 text-left">Name</th>
              <th class="px-2 py-1 text-left">Role</th>
              <th class="px-2 py-1 text-right">Total</th>
              <th class="px-2 py-1 text-right">%</th>
              <th class="px-2 py-1 text-left">Comment</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  const html = `
    <div class="font-bengali">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-indigo-700">স্মার্ট গ্রুপ ইভালুয়েটর</h1>
        <h2 class="text-lg font-semibold text-gray-600">অ্যাসাইনমেন্ট রিপোর্ট: ${taskName}</h2>
        <p class="text-sm text-gray-500">তারিখ: ${date}</p>
      </div>
      <div class="space-y-6">
        ${contentHtml || '<p class="text-center text-gray-500">এই অ্যাসাইনমেন্টের জন্য কোনো ফলাফল পাওয়া যায়নি।</p>'}
      </div>
    </div>
  `;

  await _printHTML(html);
  uiManager.showToast('প্রিন্ট ডায়ালগ ওপেন হচ্ছে...', 'info');
}
