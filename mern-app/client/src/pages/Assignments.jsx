import React, { useState } from 'react';
import { useGetTasksQuery } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toBanglaNumber } from '../utils/rankingUtils';

export default function Assignments() {
  const { data: tasksData, isLoading } = useGetTasksQuery();
  const tasks = tasksData?.data || [];
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'ongoing', 'completed'

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate || task.scheduledTime);
    const now = new Date();
    const isUpcoming = dueDate > now;
    
    if (filter === 'upcoming') return isUpcoming && task.status !== 'completed';
    if (filter === 'ongoing') return task.status === 'ongoing';
    if (filter === 'completed') return task.status === 'completed' || (!isUpcoming && task.status !== 'ongoing');
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.dueDate || a.scheduledTime);
    const dateB = new Date(b.dueDate || b.scheduledTime);
    // Sort upcoming by nearest date, others by most recent
    return filter === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  const filters = [
    { id: 'upcoming', label: 'আপকামিং', icon: 'fas fa-calendar-alt', color: 'blue' },
    { id: 'ongoing', label: 'চলমান', icon: 'fas fa-spinner', color: 'amber' },
    { id: 'completed', label: 'সম্পন্ন', icon: 'fas fa-check-circle', color: 'emerald' },
  ];

  const getStatusColor = (status, isUrgent) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'ongoing') return 'bg-amber-500';
    if (isUrgent) return 'bg-rose-500';
    return 'bg-blue-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-lg text-gray-500 animate-pulse">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            এসাইনমেন্ট
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
            সকল এসাইনমেন্টের তালিকা ও বিস্তারিত
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <i className={`${f.icon} ${filter === f.id ? `text-${f.color}-500` : ''}`}></i>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const dueDate = new Date(task.dueDate || task.scheduledTime);
            const diff = dueDate - new Date();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const isUrgent = days <= 2 && days >= 0;
            const isPast = days < 0;
            const statusColor = getStatusColor(filter === 'completed' ? 'completed' : (filter === 'ongoing' ? 'ongoing' : 'upcoming'), isUrgent);

            return (
              <Card key={task._id} className="group hover:shadow-lg transition-all duration-300 border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                <div className={`h-1.5 w-full ${statusColor}`}></div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {task.name}
                    </CardTitle>
                    {filter === 'upcoming' && isUrgent && (
                      <Badge variant="destructive" className="animate-pulse shrink-0">জরুরি</Badge>
                    )}
                    {filter === 'ongoing' && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 shrink-0">চলমান</Badge>
                    )}
                    {filter === 'completed' && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 shrink-0">সম্পন্ন</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-xs mt-1">
                    {task.description || 'কোনো বিবরণ নেই'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg">
                        <div className="h-8 w-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center text-gray-500 shadow-sm">
                          <i className="fas fa-calendar-day"></i>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                            {filter === 'completed' ? 'জমা দেওয়া হয়েছে' : 'জমা দেওয়ার শেষ সময়'}
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {dueDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      
                      {task.scheduledTime && (
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg">
                          <div className="h-8 w-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center text-gray-500 shadow-sm">
                            <i className="fas fa-clock"></i>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">নির্ধারিত সময়</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {task.scheduledTime}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-2 rounded-lg text-center border ${
                        filter === 'completed' 
                          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
                          : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30'
                      }`}>
                        <p className={`text-[10px] font-medium mb-0.5 ${
                          filter === 'completed' ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {filter === 'completed' ? 'স্ট্যাটাস' : 'সময় বাকি'}
                        </p>
                        <p className={`text-sm font-bold ${
                          filter === 'completed' ? 'text-gray-700 dark:text-gray-300' : 'text-blue-700 dark:text-blue-300'
                        }`}>
                          {filter === 'completed' ? 'শেষ' : (days > 0 ? `${toBanglaNumber(days)} দিন` : (days === 0 ? 'আজই' : 'শেষ হয়েছে'))}
                        </p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg text-center border border-emerald-100 dark:border-emerald-800/30">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">মোট মার্কস</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {toBanglaNumber(task.maxScore || 100)}
                        </p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {task.maxScoreBreakdown && (
                      <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2 text-center">মার্কস বন্টন</p>
                        <div className="flex justify-between text-xs">
                          <div className="text-center">
                            <span className="block font-bold text-gray-700 dark:text-gray-300">{toBanglaNumber(task.maxScoreBreakdown.task || 0)}</span>
                            <span className="text-[10px] text-gray-500">টাস্ক</span>
                          </div>
                          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                          <div className="text-center">
                            <span className="block font-bold text-gray-700 dark:text-gray-300">{toBanglaNumber(task.maxScoreBreakdown.team || 0)}</span>
                            <span className="text-[10px] text-gray-500">টিম</span>
                          </div>
                          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                          <div className="text-center">
                            <span className="block font-bold text-gray-700 dark:text-gray-300">{toBanglaNumber(task.maxScoreBreakdown.mcq || 0)}</span>
                            <span className="text-[10px] text-gray-500">MCQ</span>
                          </div>
                          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                          <div className="text-center">
                            <span className="block font-bold text-gray-700 dark:text-gray-300">{toBanglaNumber(task.maxScoreBreakdown.additional || 0)}</span>
                            <span className="text-[10px] text-gray-500">অতিরিক্ত</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <i className={`fas ${
              filter === 'upcoming' ? 'fa-calendar-check' : 
              filter === 'ongoing' ? 'fa-spinner' : 'fa-check-double'
            } text-4xl text-gray-400`}></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {filter === 'upcoming' ? 'কোনো আপকামিং এসাইনমেন্ট নেই' :
             filter === 'ongoing' ? 'কোনো চলমান এসাইনমেন্ট নেই' :
             'কোনো সম্পন্ন এসাইনমেন্ট নেই'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {filter === 'upcoming' ? 'বর্তমানে কোনো এসাইনমেন্টের সময়সীমা বাকি নেই।' :
             filter === 'ongoing' ? 'বর্তমানে কোনো এসাইনমেন্ট চলমান নেই।' :
             'এখনো কোনো এসাইনমেন্ট সম্পন্ন হয়নি।'}
          </p>
        </div>
      )}
    </div>
  );
}
