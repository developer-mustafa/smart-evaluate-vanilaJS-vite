import { useMemo } from 'react';
import { useGetEvaluationsQuery } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"

// Helper: Bangla Number
const toBanglaNumber = (num) => {
  const map = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return num.toString().replace(/[0-9]/g, (d) => map[d]);
};

// Helper: Role Badge
const getRoleBadgeVariant = (role) => {
  const map = {
    'team-leader': 'default', // amber equivalent? default is primary. Let's use outline or secondary and custom classes if needed.
    'time-keeper': 'secondary',
    'reporter': 'secondary',
    'resource-manager': 'secondary',
    'peace-maker': 'destructive',
  };
  return map[role] || 'secondary';
};

const getRoleBadgeClass = (role) => {
    const map = {
      'team-leader': 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
      'time-keeper': 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300',
      'reporter': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
      'resource-manager': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
      'peace-maker': 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
    };
    return map[role] || '';
};

const getRoleLabel = (role) => {
  const map = {
    'team-leader': 'টিম লিডার',
    'time-keeper': 'টাইম কিপার',
    'reporter': 'রিপোর্টার',
    'resource-manager': 'রিসোর্স ম্যানেজার',
    'peace-maker': 'পিস মেকার',
  };
  return map[role] || role;
};

// Helper: Score Palette
const getScorePalette = (pct) => {
  if (pct >= 85) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (pct >= 70) return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
  if (pct >= 55) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
};

export default function StudentDetailModal({ student, onClose }) {
  const { data: evaluationsData } = useGetEvaluationsQuery();
  const evaluations = useMemo(() => evaluationsData?.data || [], [evaluationsData]);

  const studentEvaluations = useMemo(() => {
    return evaluations
      .filter(e => e.scores?.[student._id])
      .map(e => {
        const scoreData = e.scores[student._id];
        const taskScore = parseFloat(scoreData.taskScore) || 0;
        const teamScore = parseFloat(scoreData.teamScore) || 0;
        const additional = parseFloat(scoreData.additionalScore) || 0;
        const mcq = parseFloat(scoreData.mcqScore) || 0;
        const total = parseFloat(scoreData.totalScore) || (taskScore + teamScore + additional + mcq);
        const max = parseFloat(e.maxPossibleScore) || parseFloat(e.task?.maxScore) || 100;
        const pct = max > 0 ? (total / max) * 100 : 0;

        return {
          ...e,
          taskScore, teamScore, additional, mcq, total, max, pct,
          comment: scoreData.comments || ''
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [evaluations, student._id]);

  // Summary Stats
  const stats = useMemo(() => {
    if (!studentEvaluations.length) return null;
    const count = studentEvaluations.length;
    const sums = studentEvaluations.reduce((acc, curr) => ({
      task: acc.task + curr.taskScore,
      team: acc.team + curr.teamScore,
      additional: acc.additional + curr.additional,
      mcq: acc.mcq + curr.mcq,
      total: acc.total + curr.total,
      pct: acc.pct + curr.pct
    }), { task: 0, team: 0, additional: 0, mcq: 0, total: 0, pct: 0 });

    return {
      avgTask: sums.task / count,
      avgTeam: sums.team / count,
      avgAdditional: sums.additional / count,
      avgMcq: sums.mcq / count,
      avgTotal: sums.total / count,
      avgPct: sums.pct / count,
      count
    };
  }, [studentEvaluations]);

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-zinc-100 dark:border-zinc-700">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold dark:bg-blue-900/30 dark:text-blue-300">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                {student.name}
                {student.role && (
                  <Badge variant="outline" className={getRoleBadgeClass(student.role)}>
                    <i className="fas fa-id-badge mr-1"></i>
                    {getRoleLabel(student.role)}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                <span>রোল: {toBanglaNumber(student.roll)}</span>
                <span>•</span>
                <span>গ্রুপ: {student.group?.name || '-'}</span>
                <span>•</span>
                <span>বিভাগ: {student.academicGroup || '-'}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">গড় টাস্ক স্কোর</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{toBanglaNumber(stats.avgTask.toFixed(1))}</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">গড় টিম স্কোর</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{toBanglaNumber(stats.avgTeam.toFixed(1))}</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">গড় অতিরিক্ত</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{toBanglaNumber(stats.avgAdditional.toFixed(1))}</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">গড় MCQ স্কোর</div>
                  <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{toBanglaNumber(stats.avgMcq.toFixed(1))}</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">গড় মোট স্কোর</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{toBanglaNumber(stats.avgTotal.toFixed(1))}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Table */}
          <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <CardHeader className="py-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base text-zinc-900 dark:text-zinc-50">মূল্যায়ন ইতিহাস</CardTitle>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  মোট {toBanglaNumber(studentEvaluations.length)} টি মূল্যায়ন
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableRow className="border-zinc-200 dark:border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-zinc-700 dark:text-zinc-300">অ্যাসাইনমেন্ট</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">টাস্ক</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">টিম</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">অতিরিক্ত</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">MCQ</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">মোট</TableHead>
                    <TableHead className="text-center text-zinc-700 dark:text-zinc-300">%</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-300">মন্তব্য</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">তারিখ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentEvaluations.map((ev) => (
                    <TableRow key={ev._id} className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">{ev.task?.name || 'Unknown Task'}</TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-300">{toBanglaNumber(ev.taskScore)}</TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-300">{toBanglaNumber(ev.teamScore)}</TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-300">{toBanglaNumber(ev.additional)}</TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-300">{toBanglaNumber(ev.mcq)}</TableCell>
                      <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-50">{toBanglaNumber(ev.total)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getScorePalette(ev.pct)}>
                          {toBanglaNumber(ev.pct.toFixed(0))}%
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-zinc-500 dark:text-zinc-400" title={ev.comment}>
                        {ev.comment || '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        {new Date(ev.createdAt).toLocaleDateString('bn-BD')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {studentEvaluations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        কোনো মূল্যায়ন পাওয়া যায়নি
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
