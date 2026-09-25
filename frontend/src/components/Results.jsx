import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, CheckCircle2, XCircle, Lightbulb, MessageSquare, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import MarkdownRenderer from './MarkdownRenderer';
import Chatbot from './Chatbot';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!location.state || !location.state.result) {
    return <Navigate to="/" />;
  }

  const { result, timeTaken, questions } = location.state;
  const percentage = Math.round((result.score / result.total) * 100);

  useEffect(() => {
    if (percentage >= 70) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22d3ee', '#8b5cf6', '#10b981'] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22d3ee', '#8b5cf6', '#10b981'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [percentage]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const pieData = [
    { name: 'Correct', value: result.score },
    { name: 'Incorrect', value: Math.max(0, result.total - result.score) },
  ];
  const PIE_COLORS = ['#22d3ee', '#1e293b'];

  const topicData = useMemo(() => {
    const stats = {};
    if (result.details) {
      result.details.forEach(detail => {
        const q = questions?.find(q => q.questionId === detail.questionId);
        const category = q?.category || "Applied CS";
        
        if (!stats[category]) stats[category] = { correct: 0, total: 0 };
        stats[category].total += 1;
        if (detail.isCorrect) stats[category].correct += 1;
      });
    }

    return Object.keys(stats).map(key => ({
      name: key.length > 18 ? key.substring(0, 16) + '..' : key,
      Accuracy: Math.round((stats[key].correct / stats[key].total) * 100),
      total: stats[key].total
    }));
  }, [result, questions]);

  const [selectedQuestionContext, setSelectedQuestionContext] = useState(null);
  const [chatOpenSignal, setChatOpenSignal] = useState(0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050711] text-zinc-900 dark:text-gray-100 p-6 md:p-12 flex flex-col relative overflow-y-auto font-sans selection:bg-cyan-500/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto z-10">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-white/[0.08]">
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest block mb-1">
              Assessment Summary
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Mission Report</h1>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 text-zinc-700 hover:text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-white/10 transition text-xs font-semibold uppercase tracking-wider"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Analytics Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          
          {/* Main Score Card */}
          <div className="lg:col-span-6 bg-white dark:bg-[#080b18]/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 dark:text-gray-400 mb-6">
                <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Candidate Performance Metrics</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-50 dark:bg-black/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase tracking-widest font-bold block mb-1 font-mono">Total Score</span>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
                    {result.score} <span className="text-sm text-zinc-500 dark:text-gray-500">/ {result.total}</span>
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-black/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase tracking-widest font-bold block mb-1 font-mono">Time Expended</span>
                  <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {formatTime(timeTaken)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] text-xs text-zinc-600 dark:text-gray-400 flex items-center justify-between">
              <span>Status: <strong className="text-emerald-600 dark:text-emerald-400">{percentage >= 70 ? 'Benchmark Exceeded' : 'Review Recommended'}</strong></span>
              <span className="font-mono text-cyan-600 dark:text-cyan-300 font-bold">{percentage}% Accuracy</span>
            </div>
          </div>
          
          {/* Charts Card */}
          <div className="lg:col-span-6 bg-white dark:bg-[#080b18]/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl flex flex-col justify-between">
            <span className="text-xs font-mono text-zinc-500 dark:text-gray-400 mb-4 block">Topic Breakdown & Accuracy</span>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-full">
              {/* Donut Chart */}
              <div className="w-36 h-36 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={46} outerRadius={62} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{percentage}%</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex-1 w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{backgroundColor: '#0a0d1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px'}} />
                    <Bar dataKey="Accuracy" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Review Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide">Question Breakdown & Solutions</h2>
          <span className="text-xs font-mono text-zinc-500 dark:text-gray-500">{result.details?.length || 0} Questions Evaluated</span>
        </div>

        <div className="space-y-6 pb-20">
          {result.details?.map((item, idx) => {
            const originalQ = questions?.find(q => q.questionId === item.questionId);
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.8) }}
                key={item.questionId || idx} 
                className={cn(
                  "p-6 md:p-8 rounded-3xl border backdrop-blur-md flex flex-col gap-6 shadow-md dark:shadow-xl",
                  item.isCorrect 
                    ? "bg-emerald-50/50 dark:bg-[#060e15] border-emerald-200 dark:border-emerald-500/20" 
                    : "bg-rose-50/50 dark:bg-[#15070d] border-rose-200 dark:border-rose-500/20"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1 flex-shrink-0">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-zinc-500 dark:text-gray-400 font-bold tracking-wider">
                        QUESTION {idx + 1}
                      </span>
                      <button 
                        onClick={() => {
                          setSelectedQuestionContext(originalQ || { questionText: "Question Context" });
                          setChatOpenSignal(Date.now());
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:text-white dark:hover:text-black transition text-xs font-bold font-mono"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask AI Tutor</span>
                      </button>
                    </div>

                    <div className="mb-6">
                      <MarkdownRenderer content={originalQ?.questionText || "Question text unavailable."} />
                    </div>
                    
                    {/* User Answer vs Correct Answer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white dark:bg-black/50 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-gray-500 uppercase tracking-widest block mb-1 font-mono">Your Answer</span>
                        <div className={cn("text-xs md:text-sm font-medium", item.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          <MarkdownRenderer content={item.userAnswer || "Not answered"} />
                        </div>
                      </div>
                      
                      {!item.isCorrect && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 shadow-sm dark:shadow-none">
                          <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest block mb-1 font-mono">Correct Answer</span>
                          <div className="text-xs md:text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            <MarkdownRenderer content={item.correctAnswer} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explanation Block */}
                    {originalQ?.explanation && (
                      <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 mt-4">
                        <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Detailed Explanation</span>
                        </div>
                        <MarkdownRenderer content={originalQ.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Chatbot contextData={selectedQuestionContext} openSignal={chatOpenSignal} />
    </div>
  );
}
