import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22d3ee', '#8b5cf6'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22d3ee', '#8b5cf6'] });
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
    { name: 'Incorrect', value: result.total - result.score },
  ];
  const PIE_COLORS = ['#22d3ee', '#334155'];

  // Calculate topic-wise breakdown
  const topicData = useMemo(() => {
    const stats = {};
    result.details.forEach(detail => {
      // Find category from original questions if passed, else fallback
      const q = questions?.find(q => q.questionId === detail.questionId);
      const category = q?.category || "General";
      
      if (!stats[category]) stats[category] = { correct: 0, total: 0 };
      stats[category].total += 1;
      if (detail.isCorrect) stats[category].correct += 1;
    });

    return Object.keys(stats).map(key => ({
      name: key,
      Accuracy: Math.round((stats[key].correct / stats[key].total) * 100),
      total: stats[key].total
    }));
  }, [result, questions]);

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-12 flex flex-col relative overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto z-10">
        
        {/* Header & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-gray-900/60 backdrop-blur-xl p-10 rounded-3xl border border-gray-800 shadow-2xl flex flex-col justify-center">
             <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">Mission Report</h1>
             <p className="text-gray-400 text-lg mb-8">Detailed analysis of your performance.</p>
             
             <div className="flex space-x-6 mb-8">
               <div className="bg-gray-800/80 px-6 py-4 rounded-2xl border border-gray-700 flex-1">
                 <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Score</div>
                 <div className="text-3xl font-bold text-white">{result.score}<span className="text-gray-500 text-xl">/{result.total}</span></div>
               </div>
               <div className="bg-gray-800/80 px-6 py-4 rounded-2xl border border-gray-700 flex-1">
                 <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Time</div>
                 <div className="text-3xl font-bold text-white">{formatTime(timeTaken)}</div>
               </div>
             </div>
             
             <button 
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-gray-950 font-bold transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Return to Lobby</span>
             </button>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Donut Chart */}
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{percentage}%</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex-1 w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                    <Bar dataKey="Accuracy" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Review Section */}
        <h2 className="text-2xl font-bold text-white mb-6 pl-2">Answers Breakdown</h2>
        <div className="grid grid-cols-1 gap-6 pb-20">
          {result.details.map((item, idx) => {
            const originalQ = questions?.find(q => q.questionId === item.questionId);
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 1) }}
                key={item.questionId} 
                className={cn(
                  "p-8 rounded-3xl border backdrop-blur-md flex flex-col gap-6",
                  item.isCorrect 
                    ? "bg-emerald-950/10 border-emerald-900/30" 
                    : "bg-rose-950/10 border-rose-900/30"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {item.isCorrect ? (
                      <CheckCircle className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    ) : (
                      <XCircle className="w-8 h-8 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-400 text-sm font-mono tracking-wider mb-2">QUESTION {idx + 1}</div>
                    <div className="text-lg text-gray-200 mb-6">{originalQ?.questionText || "Question text not available."}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Your Answer</span>
                        <span className={item.isCorrect ? "text-emerald-400" : "text-rose-400 line-through opacity-80"}>
                          {item.userAnswer || "Not answered"}
                        </span>
                      </div>
                      {!item.isCorrect && (
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-900/30">
                          <span className="text-xs font-bold text-emerald-500/70 uppercase block mb-1">Correct Answer</span>
                          <span className="text-emerald-400 font-medium">{item.correctAnswer}</span>
                        </div>
                      )}
                    </div>

                    {/* Explanation Block */}
                    {originalQ?.explanation && (
                      <div className="bg-violet-900/10 border border-violet-900/30 rounded-xl p-5 mt-4">
                        <div className="flex items-center space-x-2 text-violet-400 font-bold text-sm uppercase tracking-wider mb-2">
                          <Lightbulb className="w-4 h-4" />
                          <span>Explanation</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-sm">
                          {originalQ.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
