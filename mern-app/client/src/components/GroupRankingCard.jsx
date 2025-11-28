import React from 'react';
import CircularMeter from './CircularMeter';
import { toBanglaNumber, toBanglaRank, getScorePalette } from '../utils/rankingUtils';

const GroupRankingCard = ({ group, onClick }) => {
  const palette = getScorePalette(group.efficiency || group.avgScore);
  const rankText = toBanglaRank(group.rank).split(' ')[0];
  const avgScore = group.efficiency || group.avgScore || 0;
  const evalCount = group.evalCount || 0;
  const totalMembers = group.totalMembers || group.memberCount || 0;
  // Handle different data structures (Ranking page vs Dashboard)
  const uniqueParticipants = group.uniqueParticipants !== undefined ? group.uniqueParticipants : (group.evaluatedMembers || 0);
  const remainingMembers = group.remainingMembers !== undefined ? group.remainingMembers : Math.max(0, totalMembers - uniqueParticipants);

  return (
    <div 
      onClick={onClick}
      className="group relative bg-card rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border overflow-hidden cursor-pointer"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
        style={{ background: palette.grad }}
      />

      <div className="flex items-center gap-4 md:gap-6 min-w-0 z-10">
        <div className="flex flex-col items-center justify-center w-16 h-14 bg-muted rounded-xl border border-border shadow-inner shrink-0">
          <span className="text-lg font-bold text-foreground">{rankText}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">র‍্যাঙ্ক</span>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {group.name}
          </h3>
          
          <div className="flex gap-2 mt-1 mb-2">
             <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground">
               গড়: {toBanglaNumber(avgScore.toFixed(2))}%
             </span>
             <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground">
               অংশগ্রহণ: {toBanglaNumber(evalCount)}
             </span>
          </div>

          <p className="text-xs text-muted-foreground truncate">
            মোট সদস্য: {toBanglaNumber(totalMembers)} · পরীক্ষায় অংশগ্রহণ: {toBanglaNumber(uniqueParticipants)} · বাকি: {toBanglaNumber(remainingMembers)}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0 z-10">
        <CircularMeter percent={avgScore} palette={palette} size={72} />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg%</span>
      </div>
    </div>
  );
};

export default GroupRankingCard;
