import { useMemo } from 'react';
import { useGetGroupsQuery, useGetMembersQuery, useGetTasksQuery, useGetEvaluationsQuery } from '../services/api';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import GroupRankingCard from '../components/GroupRankingCard';
import ElitePodiumCard from '../components/ElitePodiumCard';
import { toBanglaNumber } from '../utils/rankingUtils';

const calculateStats = (groups, members, tasks, evaluations) => {
  const totalGroups = groups.length;
  const totalStudents = members.length;
  const totalTasks = tasks.length;

  const maleStudents = members.filter(m => m.gender === 'ছেলে').length;
  const femaleStudents = members.filter(m => m.gender === 'মেয়ে').length;
  const malePercentage = totalStudents > 0 ? ((maleStudents / totalStudents) * 100).toFixed(1) : 0;
  const femalePercentage = totalStudents > 0 ? ((femaleStudents / totalStudents) * 100).toFixed(1) : 0;

  const academicGroups = new Set(members.map(m => m.academicGroup).filter(Boolean));
  const totalAcademicGroups = academicGroups.size;

  const pendingRoles = members.filter(m => !m.role).length;

  // Latest Assignment (Moved up for use in group stats)
  // Latest Assignment (Prioritize last evaluated, otherwise last created)
  let latestTask = null;
  if (evaluations.length > 0) {
    const sortedEvals = [...evaluations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const latestEval = sortedEvals[0];
    const latestTaskId = latestEval.task?._id || latestEval.task;
    latestTask = tasks.find(t => t._id === latestTaskId);
  }
  if (!latestTask && tasks.length > 0) {
    latestTask = tasks.reduce((prev, current) => {
      return new Date(prev.createdAt) > new Date(current.createdAt) ? prev : current;
    });
  }

  // Upcoming Assignment
  const upcomingTask = tasks
    .filter(t => new Date(t.dueDate || t.scheduledTime) > new Date())
    .sort((a, b) => new Date(a.dueDate || a.scheduledTime) - new Date(b.dueDate || b.scheduledTime))[0];

  // Group Performance
  const groupPerformance = groups.map(group => {
    const groupEvals = evaluations.filter(e => e.group?._id === group._id || e.group === group._id);
    const avgScore = groupEvals.length > 0
      ? groupEvals.reduce((sum, e) => sum + (e.groupAverageScore || 0), 0) / groupEvals.length
      : 0;
    const groupMembers = members.filter(m => m.group?._id === group._id || m.group === group._id);
    
    // Calculate Latest Stats for this group
    let latestStats = { avg: 0, participants: 0, rate: 0 };
    if (latestTask) {
      const latestGroupEval = evaluations.find(e => 
        (e.task?._id === latestTask._id || e.task === latestTask._id) && 
        (e.group?._id === group._id || e.group === group._id)
      );
      
      if (latestGroupEval) {
        const scores = latestGroupEval.scores || {};
        const participantIds = Object.keys(scores);
        const participantCount = participantIds.length;
        
        let totalScore = 0;
        Object.values(scores).forEach(s => totalScore += (s.totalScore || 0));
        
        latestStats = {
          avg: participantCount > 0 ? (totalScore / participantCount).toFixed(1) : 0,
          participants: participantCount,
          rate: groupMembers.length > 0 ? ((participantCount / groupMembers.length) * 100).toFixed(0) : 0
        };
      }
    }

    return { 
      ...group, 
      avgScore, 
      memberCount: groupMembers.length, 
      evalCount: groupEvals.length,
      latestStats 
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  // Academic Group Stats Calculation
  const academicStats = {};
  const groupPerfMap = new Map(groupPerformance.map(gp => [gp._id, gp.avgScore]));
  
  members.forEach(student => {
    const ag = student.academicGroup;
    const groupId = student.group?._id || student.group;
    
    if (!ag || !groupId) return;
    
    if (!academicStats[ag]) {
      academicStats[ag] = { 
        name: ag,
        totalStudents: 0, 
        scoreSum: 0, 
        groupCount: 0, 
        processedGroups: new Set() 
      };
    }
    
    academicStats[ag].totalStudents++;
    
    if (groupPerfMap.has(groupId) && !academicStats[ag].processedGroups.has(groupId) && groupPerfMap.get(groupId) > 0) {
      academicStats[ag].scoreSum += groupPerfMap.get(groupId);
      academicStats[ag].groupCount++;
      academicStats[ag].processedGroups.add(groupId);
    }
  });

  const academicGroupPerformance = Object.values(academicStats).map(data => ({
    name: data.name,
    totalStudents: data.totalStudents,
    groupCount: data.groupCount,
    averageScore: data.groupCount > 0 ? data.scoreSum / data.groupCount : 0
  })).sort((a, b) => b.averageScore - a.averageScore);


  let latestAssignmentStats = {
    average: 0,
    evaluated: 0,
    pending: 0,
    total: totalStudents,
    groupEvaluated: 0,
    groupPending: 0,
    groupTotal: totalGroups,
    updatedAt: '-'
  };

  if (latestTask) {
    const latestEvals = evaluations.filter(e => e.task?._id === latestTask._id || e.task === latestTask._id);
    const evaluatedStudentIds = new Set();
    latestEvals.forEach(e => {
      if (e.scores) {
        Object.keys(e.scores).forEach(id => evaluatedStudentIds.add(id));
      }
    });
    const evaluatedCount = evaluatedStudentIds.size;
    let studentTotalScore = 0;
    let studentScoreCount = 0;
    latestEvals.forEach(e => {
      if (e.scores) {
        Object.values(e.scores).forEach(s => {
          studentTotalScore += s.totalScore || 0;
          studentScoreCount++;
        });
      }
    });
    latestAssignmentStats = {
      average: studentScoreCount > 0 ? (studentTotalScore / studentScoreCount).toFixed(1) : 0,
      evaluated: evaluatedCount,
      pending: totalStudents - evaluatedCount,
      total: totalStudents,
      groupEvaluated: latestEvals.length,
      groupPending: totalGroups - latestEvals.length,
      groupTotal: totalGroups,
      updatedAt: new Date(latestTask.createdAt).toLocaleDateString('bn-BD')
    };
  }

  const pendingEvaluations = Math.max(0, totalTasks * totalGroups - evaluations.length);

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
    groupPerformance,
    academicGroupPerformance,
    latestAssignmentStats,
    latestTask,
    upcomingTask,
    pendingEvaluations
  };
};

export default function Dashboard() {
  const { data: groupsData } = useGetGroupsQuery();
  const { data: membersData } = useGetMembersQuery();
  const { data: tasksData } = useGetTasksQuery();
  const { data: evaluationsData } = useGetEvaluationsQuery();
  const { dashboardSections } = useSelector(state => state.settings);

  const stats = useMemo(() => {
    if (!groupsData || !membersData || !tasksData || !evaluationsData) return null;
    return calculateStats(
      groupsData.data || [],
      membersData.data || [],
      tasksData.data || [],
      evaluationsData.data || []
    );
  }, [groupsData, membersData, tasksData, evaluationsData]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-zinc-500 animate-pulse">ড্যাশবোর্ড ডেটা লোড হচ্ছে...</div>
      </div>
    );
  }

  const {
    totalGroups,
    totalStudents,
    totalTasks,
    maleStudents,
    femaleStudents,
    malePercentage,
    femalePercentage,
    totalAcademicGroups,
    pendingRoles,
    groupPerformance,
    academicGroupPerformance,
    latestAssignmentStats,
    latestTask,
    upcomingTask,
    pendingEvaluations
  } = stats;

  const top3Groups = groupPerformance.slice(0, 3);
  const top3AcademicGroups = academicGroupPerformance.slice(0, 3);

  const getScorePalette = (score) => {
    if (score >= 80) return { color: 'emerald', gradient: 'from-emerald-500/15 via-emerald-400/10 to-transparent', solid: '#10b981' };
    if (score >= 60) return { color: 'sky', gradient: 'from-sky-500/15 via-sky-400/10 to-transparent', solid: '#0ea5e9' };
    if (score >= 40) return { color: 'amber', gradient: 'from-amber-500/15 via-amber-400/10 to-transparent', solid: '#f59e0b' };
    return { color: 'rose', gradient: 'from-rose-500/15 via-rose-400/10 to-transparent', solid: '#f43f5e' };
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fade-in p-2 md:p-4">
      
    
      
      {/* Stats Grid */}
      {dashboardSections.stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {[{ title: 'মোট গ্রুপ', value: totalGroups, icon: 'fa-layer-group', color: 'indigo', sub: 'সক্রিয়' },
            { title: 'মোট শিক্ষার্থী', value: totalStudents, icon: 'fa-user-graduate', color: 'emerald', sub: 'নিবন্ধিত' },
            { title: 'একাডেমিক', value: totalAcademicGroups, icon: 'fa-university', color: 'sky', sub: 'শাখা' },
            { title: 'দায়িত্ব বাকি', value: pendingRoles, icon: 'fa-user-clock', color: 'amber', sub: 'ভূমিকাহীন' },
            { title: 'ছেলে', value: maleStudents, icon: 'fa-male', color: 'blue', sub: `${toBanglaNumber(malePercentage)}%` },
            { title: 'মেয়ে', value: femaleStudents, icon: 'fa-female', color: 'rose', sub: `${toBanglaNumber(femalePercentage)}%` },
            { title: 'মোট টাস্ক', value: totalTasks, icon: 'fa-tasks', color: 'teal', sub: 'নির্ধারিত' },
            { title: 'বাকি মূল্যায়ন', value: pendingEvaluations, icon: 'fa-hourglass-half', color: 'red', sub: 'অসম্পন্ন' }].map((stat, idx) => (
            <Card key={idx} className="relative overflow-hidden hover:shadow-md transition-shadow bg-card border-border">
              <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 via-transparent to-transparent dark:from-${stat.color}-500/10`}></div>
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 truncate" title={stat.title}>{stat.title}</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-none">{toBanglaNumber(stat.value)}</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate leading-none" title={stat.sub}>{stat.sub}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    <i className={`fas ${stat.icon} text-xs`}></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}



      {/* Academic Group Performance */}
      {dashboardSections.academicStats && top3AcademicGroups.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
          <div className="border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">একাডেমিক গ্রুপ পারফরম্যান্স</h3>
              </div>
              <Badge variant="outline" className="h-6 px-2 text-xs bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                <i className="fas fa-chart-bar mr-1"></i> ট্রেন্ডস
              </Badge>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {top3AcademicGroups.map((data, idx) => {
                const palette = getScorePalette(data.averageScore);
                return (
                  <article key={idx} className="relative overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition hover:shadow-md">
                    <div className={`absolute inset-0 bg-gradient-to-br ${palette.gradient} opacity-40 dark:opacity-20`}></div>
                    <div className="relative space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate" title={data.name}>{data.name}</h4>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm border border-border">
                          <i className="fas fa-signal text-[8px]"></i> {toBanglaNumber(data.averageScore.toFixed(1))}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${data.averageScore}%`, backgroundColor: palette.solid }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <i className="fas fa-users text-indigo-500 dark:text-indigo-400"></i> {toBanglaNumber(data.totalStudents)} জন
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <i className="fas fa-layer-group text-emerald-500 dark:text-emerald-400"></i> {toBanglaNumber(data.groupCount)} টি
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Elite Groups (Replaces Academic Group Performance) */}
      {dashboardSections.topGroups && top3Groups.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
          <div className="border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">এলিট গ্রুপ</h3>
              </div>
              <Badge variant="secondary" className="h-6 px-2 text-xs bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                <i className="fas fa-crown mr-1"></i> Top 3
              </Badge>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              {/* 2nd Place */}
              {top3Groups[1] && (
                <ElitePodiumCard group={top3Groups[1]} rank={2} />
              )}
              {/* 1st Place */}
              {top3Groups[0] && (
                <ElitePodiumCard group={top3Groups[0]} rank={1} />
              )}
              {/* 3rd Place */}
              {top3Groups[2] && (
                <ElitePodiumCard group={top3Groups[2]} rank={3} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Top Section: Hero */}
      {dashboardSections.hero && (
        <section className="relative overflow-hidden rounded-3xl border border-zinc-300/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-200 text-zinc-900 shadow-lg dark:border-zinc-700/60 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:text-zinc-100">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.35),transparent_60%)]"></div>
          <div className="relative p-4 space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur shadow-sm p-4">
              <div className="grid gap-4 lg:grid-cols-2 items-stretch">
                {/* Progress Card */}
                <Card className="bg-card/50 backdrop-blur h-full border-0 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      <i className="fas fa-chart-simple text-indigo-600 dark:text-indigo-400"></i>
                      মূল্যায়ন প্রদানের অগ্রগতি
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">শিক্ষার্থী</span>
                          <i className="fas fa-user-graduate text-emerald-600 dark:text-emerald-400"></i>
                        </div>
                        <div className="space-y-1 text-sm mb-2">
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300"><span>মূল্যায়িত</span><span className="font-bold">{toBanglaNumber(latestAssignmentStats.evaluated)} জন</span></div>
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300"><span>অবশিষ্ট</span><span className="font-bold">{toBanglaNumber(latestAssignmentStats.pending)} জন</span></div>
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300"><span>মোট</span><span className="font-bold">{toBanglaNumber(latestAssignmentStats.total)} জন</span></div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${(latestAssignmentStats.evaluated / latestAssignmentStats.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800 dark:bg-sky-900/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-sky-900 dark:text-sky-200">গ্রুপ</span>
                          <i className="fas fa-layer-group text-sky-600 dark:text-sky-400"></i>
                        </div>
                        <div className="space-y-1 text-sm mb-2">
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300"><span>মূল্যায়িত</span><span className="font-bold">{toBanglaNumber(latestAssignmentStats.groupEvaluated)} টি</span></div>
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300"><span>অবশিষ্ট</span><span className="font-bold">{toBanglaNumber(latestAssignmentStats.groupPending)} টি</span></div>
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300"><span>মোট</span><span className="font-bold">{toBanglaNumber(latestAssignmentStats.groupTotal)} টি</span></div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-sky-200 dark:bg-sky-900/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-500 rounded-full transition-all duration-1000"
                            style={{ width: `${(latestAssignmentStats.groupEvaluated / latestAssignmentStats.groupTotal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming/Latest Assignment Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-zinc-800 dark:to-zinc-900 h-full relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-sky-500/10 rounded-full blur-xl"></div>
                  
                  <CardHeader className="relative z-10 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardDescription className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <i className="fas fa-calendar-alt text-blue-500"></i>
                          {upcomingTask ? 'সামনে আসছে' : 'সর্বশেষ এসাইনমেন্ট'}
                        </CardDescription>
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white mt-1 truncate leading-tight">
                          {upcomingTask ? upcomingTask.name : (latestTask?.name || 'কোনো এসাইনমেন্ট নেই')}
                        </CardTitle>
                      </div>
                      {upcomingTask && (
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-sm animate-pulse">
                          নতুন
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    {upcomingTask ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-card/60 p-3 rounded-xl border border-border/50 backdrop-blur-sm">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <i className="fas fa-clock text-lg"></i>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">জমা দেওয়ার শেষ সময়</p>
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                              {new Date(upcomingTask.dueDate || upcomingTask.scheduledTime).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-card/60 p-2.5 rounded-xl border border-border/50 text-center">
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mb-0.5">সময় বাকি</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {(() => {
                                const diff = new Date(upcomingTask.dueDate || upcomingTask.scheduledTime) - new Date();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                return days > 0 ? `${toBanglaNumber(days)} দিন` : 'আজই';
                              })()}
                            </p>
                          </div>
                          <div className="bg-card/60 p-2.5 rounded-xl border border-border/50 text-center">
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mb-0.5">মার্কস</p>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {toBanglaNumber(upcomingTask.totalMarks || 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-20 w-20 rounded-full border-4 border-emerald-400 flex items-center justify-center bg-card shadow-sm">
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{toBanglaNumber(latestAssignmentStats.average)}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">গড় স্কোর</span>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-20 w-20 rounded-full border-4 border-sky-400 flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm">
                            <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                              {toBanglaNumber(latestAssignmentStats.total > 0 ? ((latestAssignmentStats.evaluated / latestAssignmentStats.total) * 100).toFixed(0) : 0)}%
                            </span>
                          </div>
                          <span className="text-xs font-bold text-sky-800 dark:text-sky-200">সামগ্রিক উন্নতি</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Academic Stats (Simple Cards) - Keeping for now if needed, or can be removed if redundant */}
      {/* 
      {dashboardSections.academicStats && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           ... (Old Academic Stats) ...
        </section>
      )}
      */}

      {dashboardSections.ranking && (
        <Card className="overflow-hidden bg-transparent border-none shadow-none">
          <CardHeader className="px-0 pt-0 border-b border-gray-200 dark:border-gray-700 mb-4">
            <CardTitle>গ্রুপ র‍্যাঙ্কিং</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid gap-4">
            {groupPerformance.map((group, idx) => (
              <GroupRankingCard 
                key={group._id} 
                group={{...group, rank: idx + 1}} 
                onClick={() => {}} // Dashboard might not have modal logic yet, or we can add it later
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
