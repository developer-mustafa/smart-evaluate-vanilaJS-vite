
import { useState, useMemo } from 'react';
import { useGetMembersQuery, useGetEvaluationsQuery, useGetTasksQuery, useGetGroupsQuery } from '../services/api';
import StudentDetailModal from '../components/modals/StudentDetailModal';
import GroupDetailModal from '../components/modals/GroupDetailModal';

// --- Helper Functions ---

const toBanglaNumber = (num) => {
  const map = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return num.toString().replace(/[0-9]/g, (d) => map[d]);
};

const toBanglaRank = (n) => {
  const ordinalMap = { 1: '১ম', 2: '২য়', 3: '৩য়', 4: '৪র্থ', 5: '৫ম', 6: '৬ষ্ঠ', 7: '৭ম', 8: '৮ম', 9: '৯ম', 10: '১০ম' };
  if (ordinalMap[n]) {
    return ordinalMap[n] + ' র‍্যাঙ্ক';
  }
  return toBanglaNumber(n) + 'তম র‍্যাঙ্ক';
};

const getScorePalette = (score) => {
  const n = Number(score) || 0;
  if (n >= 85) return { solid: '#16a34a', shadow: 'rgba(22,163,74,.35)', grad: 'linear-gradient(90deg,#16a34a 0%,#22c55e 40%,#86efac 100%)' }; // Green
  if (n >= 70) return { solid: '#0284c7', shadow: 'rgba(2,132,199,.30)', grad: 'linear-gradient(90deg,#0284c7 0%,#0ea5e9 40%,#7dd3fc 100%)' }; // Sky
  if (n >= 55) return { solid: '#d97706', shadow: 'rgba(217,119,6,.35)', grad: 'linear-gradient(90deg,#d97706 0%,#f59e0b 40%,#facc15 100%)' }; // Amber
  return { solid: '#e11d48', shadow: 'rgba(225,29,72,.40)', grad: 'linear-gradient(90deg,#e11d48 0%,#f43f5e 40%,#fb7185 100%)' }; // Rose
};

const getRoleBadgeMeta = (role) => {
  const r = (role || '').toString().trim();
  const map = {
    'team-leader': { icon: 'fa-crown', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    'time-keeper': { icon: 'fa-stopwatch', bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' },
    'reporter': { icon: 'fa-pen-nib', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'resource-manager': { icon: 'fa-box-open', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'peace-maker': { icon: 'fa-dove', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  };
  return map[r] || { icon: 'fa-id-badge', bg: 'bg-zinc-100', text: 'text-zinc-800', border: 'border-zinc-200' };
};

const getRoleLabel = (role) => {
  const map = {
    'team-leader': 'টিম লিডার',
    'time-keeper': 'টাইম কিপার',
    'reporter': 'রিপোর্টার',
    'resource-manager': 'রিসোর্স ম্যানেজার',
    'peace-maker': 'পিস মেকার',
  };
  return map[role] || role || 'দায়িত্ব নেই';
};

const getBranchBadgeMeta = (group) => {
  const g = (group || '').toString().trim().toLowerCase();
  if (/science|বিজ্ঞান/.test(g)) return { icon: 'fa-atom', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' };
  if (/arts|মানবিক/.test(g)) return { icon: 'fa-palette', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
  if (/commerce|ব্যবসা|কমার্স/.test(g)) return { icon: 'fa-chart-line', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' };
  if (/vocational|ভোকেশনাল/.test(g)) return { icon: 'fa-tools', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' };
  return { icon: 'fa-layer-group', bg: 'bg-zinc-100', text: 'text-zinc-800', border: 'border-zinc-200' };
};

// --- Components ---

const CircularMeter = ({ percent, palette, size = 72 }) => {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const background = 'conic-gradient(' + palette.solid + ' ' + clamped + '%, rgba(0,0,0,0.08) ' + clamped + '% 100%)';
  const filter = 'drop-shadow(0 6px 16px ' + palette.shadow + ')';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: background,
          filter: filter,
        }}
      />
      <div className="absolute inset-[18%] rounded-full bg-card flex items-center justify-center shadow-inner">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {toBanglaNumber(clamped.toFixed(2))}%
        </span>
      </div>
    </div>
  );
};

const Badge = ({ meta, label }) => (
  <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-sm ' + meta.bg + ' ' + meta.text + ' ' + meta.border + ' dark:bg-opacity-20 dark:border-opacity-30'}>
    <i className={'fas ' + meta.icon + ' text-[10px]'}></i>
    {label}
  </span>
);

export default function Ranking() {
  const [activeTab, setActiveTab] = useState('students');
  const [searchName, setSearchName] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const { data: membersData } = useGetMembersQuery();
  const { data: evaluationsData } = useGetEvaluationsQuery();
  const { data: tasksData } = useGetTasksQuery();
  const { data: groupsData } = useGetGroupsQuery();

  const members = useMemo(() => membersData?.data || [], [membersData]);
  const evaluations = useMemo(() => evaluationsData?.data || [], [evaluationsData]);
  const tasks = useMemo(() => tasksData?.data || [], [tasksData]);
  const groups = useMemo(() => groupsData?.data || [], [groupsData]);

  // --- Ranking Logic ---

  const rankedStudents = useMemo(() => {
    if (!members.length || !evaluations.length) return [];

    const studentPerf = {};
    evaluations.forEach(ev => {
      const maxScore = parseFloat(ev.maxPossibleScore) || 100; // Default to 100 if missing
      const scores = ev.scores || {};
      const ts = new Date(ev.createdAt).getTime();

      Object.entries(scores).forEach(([memberId, scoreData]) => {
        if (!studentPerf[memberId]) {
          studentPerf[memberId] = { evalCount: 0, totalScore: 0, maxScoreSum: 0, latestMs: 0 };
        }
        const total = parseFloat(scoreData.totalScore) || 0;
        const rec = studentPerf[memberId];
        rec.evalCount += 1;
        rec.totalScore += total;
        rec.maxScoreSum += maxScore;
        rec.latestMs = Math.max(rec.latestMs, ts);
      });
    });

    return members
      .map(member => {
        const perf = studentPerf[member._id];
        if (!perf || perf.evalCount < 1) return null;
        
        const efficiency = perf.maxScoreSum > 0 ? (perf.totalScore / perf.maxScoreSum) * 100 : 0;
        
        return {
          ...member,
          ...perf,
          efficiency
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
        if (b.evalCount !== a.evalCount) return b.evalCount - a.evalCount;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.latestMs - a.latestMs;
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [members, evaluations]);

  // Corrected Group Ranking Logic
  const rankedGroups = useMemo(() => {
    if (!groups.length || !evaluations.length) return [];
    
    const groupAgg = {};
    const groupMemberCounts = {};

    members.forEach(m => {
      const gid = m.group?._id || m.group;
      if (gid) groupMemberCounts[gid] = (groupMemberCounts[gid] || 0) + 1;
    });

    evaluations.forEach(ev => {
      const maxScore = parseFloat(ev.maxPossibleScore) || 100;
      const ts = new Date(ev.createdAt).getTime();
      const scores = ev.scores || {};
      const groupId = typeof ev.group === 'object' ? ev.group?._id : ev.group;

      if (!groupId) return;

      if (!groupAgg[groupId]) {
        groupAgg[groupId] = { evalCount: 0, totalScore: 0, maxScoreSum: 0, latestMs: 0, participants: new Set() };
      }
      const rec = groupAgg[groupId];
      rec.evalCount += 1; // This counts how many times the group was evaluated
      rec.latestMs = Math.max(rec.latestMs, ts);

      Object.entries(scores).forEach(([memberId, scoreData]) => {
        rec.totalScore += (parseFloat(scoreData.totalScore) || 0);
        rec.maxScoreSum += maxScore; // Accumulate max score for EACH student participation
        rec.participants.add(memberId);
      });
    });

    return groups.map(group => {
      const agg = groupAgg[group._id];
      if (!agg) return null;

      const efficiency = agg.maxScoreSum > 0 ? (agg.totalScore / agg.maxScoreSum) * 100 : 0;
      const totalMembers = groupMemberCounts[group._id] || 0;
      const uniqueParticipants = agg.participants.size;

      return {
        ...group,
        ...agg,
        efficiency,
        totalMembers,
        uniqueParticipants,
        remainingMembers: Math.max(0, totalMembers - uniqueParticipants)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.efficiency - a.efficiency)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  }, [groups, evaluations, members]);


  // --- Filtering ---
  const filteredStudents = useMemo(() => {
    return rankedStudents.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchName.toLowerCase());
      const matchRoll = searchRoll ? s.roll.toString().includes(searchRoll) : true;
      return matchName && matchRoll;
    });
  }, [rankedStudents, searchName, searchRoll]);

  // --- Render Helpers ---
  const topItem = activeTab === 'students' ? rankedStudents[0] : rankedGroups[0];
  const activePalette = topItem ? getScorePalette(topItem.efficiency) : getScorePalette(70);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans transition-colors duration-300">
      
      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            র‍্যাঙ্কিং লিডারবোর্ড
          </h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
            শীর্ষ পারফরমার এবং গ্রুপগুলোর তালিকা
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Tab Bar & Search */}
        <div 
          className="rounded-2xl p-3 bg-card shadow-sm border border-border flex flex-col md:flex-row gap-4 items-center justify-between transition-all duration-300"
        >
          {/* Tabs */}
          <div className="flex p-1 bg-muted rounded-full border border-border">
            <button
              onClick={() => setActiveTab('students')}
              className={'px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ' + (
                activeTab === 'students' 
                  ? 'text-white shadow-md transform scale-105' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
              style={activeTab === 'students' ? { background: activePalette.grad } : {}}
            >
              শিক্ষার্থী র‍্যাঙ্কিং
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={'px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ' + (
                activeTab === 'groups' 
                  ? 'text-white shadow-md transform scale-105' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
              style={activeTab === 'groups' ? { background: activePalette.grad } : {}}
            >
              গ্রুপ র‍্যাঙ্কিং
            </button>
          </div>

          {/* Search Inputs (Only for Students) */}
          <div className={'flex gap-3 w-full md:w-auto transition-opacity duration-300 ' + (activeTab === 'students' ? 'opacity-100' : 'opacity-50 pointer-events-none')}>
            <input
              type="text"
              placeholder="নাম দিয়ে সার্চ"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              disabled={activeTab !== 'students'}
              className="px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full md:w-48 text-sm text-foreground placeholder-muted-foreground"
            />
            <input
              type="text"
              placeholder="রোল"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              disabled={activeTab !== 'students'}
              className="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full md:w-32 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="grid gap-4">
          {activeTab === 'students' ? (
            filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const palette = getScorePalette(student.efficiency);
                const roleMeta = getRoleBadgeMeta(student.role);
                const branchMeta = getBranchBadgeMeta(student.academicGroup);

                return (
                  <div 
                    key={student._id}
                    onClick={() => setSelectedStudent(student)}
                    className="group relative bg-card rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border overflow-hidden cursor-pointer"
                  >
                    {/* Accent Background Glow */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                      style={{ background: palette.grad }}
                    />
                    
                    <div className="flex items-center gap-4 md:gap-6 min-w-0 z-10">
                      {/* Rank Chip */}
                      <div className="flex flex-col items-center justify-center w-16 h-14 bg-muted rounded-xl border border-border shadow-sm shrink-0">
                        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{toBanglaRank(student.rank).split(' ')[0]}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">র‍্যাঙ্ক</span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 truncate">
                          রোল: {toBanglaNumber(student.roll)} · গ্রুপ: {student.group?.name || 'গ্রুপ নেই'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge meta={branchMeta} label={student.academicGroup || 'শাখা নেই'} />
                          <Badge meta={roleMeta} label={getRoleLabel(student.role)} />
                        </div>

                        <div className="flex gap-6 mt-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          <span className="hidden sm:inline">গড়: {toBanglaNumber(student.efficiency.toFixed(2))}%</span>
                          <span>এসাইনমেন্ট: {toBanglaNumber(student.evalCount)} টি</span>
                        </div>
                      </div>
                    </div>

                    {/* Meter */}
                    <div className="flex flex-col items-center gap-1 shrink-0 z-10">
                      <CircularMeter percent={student.efficiency} palette={palette} size={72} />
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
            )
          ) : (
            rankedGroups.length > 0 ? (
              rankedGroups.map((group) => {
                const palette = getScorePalette(group.efficiency);
                
                return (
                  <div 
                    key={group._id}
                    onClick={() => setSelectedGroup(group)}
                    className="group relative bg-card rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border overflow-hidden cursor-pointer"
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                      style={{ background: palette.grad }}
                    />

                    <div className="flex items-center gap-4 md:gap-6 min-w-0 z-10">
                      <div className="flex flex-col items-center justify-center w-16 h-14 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm shrink-0">
                        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{toBanglaRank(group.rank).split(' ')[0]}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">র‍্যাঙ্ক</span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {group.name}
                        </h3>
                        
                        <div className="flex gap-2 mt-1 mb-2">
                           <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                             গড়: {toBanglaNumber(group.efficiency.toFixed(2))}%
                           </span>
                           <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                             অংশগ্রহণ: {toBanglaNumber(group.evalCount)}
                           </span>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          মোট সদস্য: {toBanglaNumber(group.totalMembers)} · পরীক্ষায় অংশগ্রহণ: {toBanglaNumber(group.uniqueParticipants)} · বাকি: {toBanglaNumber(group.remainingMembers)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 shrink-0 z-10">
                      <CircularMeter percent={group.efficiency} palette={palette} size={72} />
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">কোনো গ্রুপ ডেটা পাওয়া যায়নি</div>
            )
          )}
        </div>

      </div>

      {/* Modals */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {selectedGroup && (
        <GroupDetailModal 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
        />
      )}
    </div>
  );
}
